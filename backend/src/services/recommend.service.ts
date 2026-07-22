// Orchestriert die gesamte Empfehlungs-Pipeline:
// Phase-1-Filter -> Phase-2-Scoring/Sampling/MMR -> Claude-Prompt ->
// Antwort parsen & validieren -> trip_request + recommendations persistieren.

import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "../ai/client.js";
import { supabase } from "../config/supabaseClient.js";
import { buildRecommendPrompt } from "../ai/prompts/recommend.prompt.js";
import { filterDestinations } from "./destinationFilter.service.js";
import { scoreAndSelectShortlist } from "./scoring.service.js";
import { NoCandidatesError } from "../errors.js";
import {
  ClaudeRecommendationResponseSchema,
  type ClaudeRecommendationResponse,
  type RecommendationResult,
  type TripRequestInput,
} from "../types/qa.types.js";

const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
const MAX_TOKENS = 2048;

// Tool-Use statt Freitext-JSON: die API liefert bereits ein geparstes Objekt
// zurueck, das strukturell dem Schema entspricht - keine Anfaelligkeit mehr
// fuer unescapte Zeilenumbrueche/Anfuehrungszeichen in mehrsaetzigen
// Begruendungstexten, wie es bei "antworte nur mit JSON"-Prompts vorkommt.
//
// min/maxItems sind dynamisch: bei einer kleinen Shortlist (z. B. sehr enge
// Phase-1-Kriterien) waere eine feste Untergrenze von 5 fuer Claude
// unerfuellbar und wuerde zu erfundenen destination_ids fuehren.
function buildRecommendTool(minItems: number, maxItems: number): Anthropic.Tool {
  return {
    name: "submit_recommendations",
    description: `Uebermittelt die finale Auswahl von ${minItems} bis ${maxItems} Reisezielen mit persoenlicher Begruendung je Ort.`,
    input_schema: {
      type: "object",
      properties: {
        recommendations: {
          type: "array",
          minItems,
          maxItems,
          items: {
            type: "object",
            properties: {
              destination_id: { type: "string", description: "Die id des Ortes aus der Shortlist" },
              reasoning: { type: "string", description: "2-3 Saetze, warum dieser Ort zu genau diesem Profil passt" },
            },
            required: ["destination_id", "reasoning"],
          },
        },
      },
      required: ["recommendations"],
    },
  };
}

async function callClaudeForRecommendations(
  prompt: string,
  tool: Anthropic.Tool
): Promise<ClaudeRecommendationResponse> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    tools: [tool],
    tool_choice: { type: "tool", name: tool.name },
    messages: [{ role: "user", content: prompt }],
  });

  const toolUseBlock = response.content.find(
    (block: Anthropic.ContentBlock) => block.type === "tool_use" && block.name === tool.name
  );
  if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
    throw new Error("Claude-Antwort enthielt keinen passenden tool_use-Block");
  }

  return ClaudeRecommendationResponseSchema.parse(toolUseBlock.input);
}

export async function getRecommendations(
  input: TripRequestInput,
  userId: string
): Promise<RecommendationResult> {
  const candidates = await filterDestinations(input);
  if (candidates.length === 0) {
    throw new NoCandidatesError();
  }

  const { shortlist, matchScores } = await scoreAndSelectShortlist(candidates, input, userId);

  // Dynamische Ziel-Groesse: normalerweise 5-10, aber bei einer kleinen
  // Shortlist (enge Kriterien) darf Claude nicht mehr verlangt bekommen,
  // als tatsaechlich verfuegbar ist.
  const minItems = Math.min(5, shortlist.length);
  const maxItems = Math.min(10, shortlist.length);
  const tool = buildRecommendTool(minItems, maxItems);
  const prompt = buildRecommendPrompt(shortlist, input, { minItems, maxItems });

  let claudeResult: ClaudeRecommendationResponse;
  try {
    claudeResult = await callClaudeForRecommendations(prompt, tool);
  } catch (firstError) {
    // Ein Retry mit explizitem Hinweis auf den Fehler statt sofort zu scheitern
    // (z. B. falls Claude das Tool nicht aufgerufen oder das Schema verletzt hat)
    const hint = firstError instanceof Error ? firstError.message : String(firstError);
    const retryPrompt = `${prompt}\n\nHINWEIS: Dein vorheriger Versuch ist fehlgeschlagen (${hint}). Rufe unbedingt das Tool "submit_recommendations" mit ${minItems} bis ${maxItems} Eintraegen auf.`;
    claudeResult = await callClaudeForRecommendations(retryPrompt, tool);
  }

  // Claude darf nur Orte aus der Shortlist waehlen - alles andere verwerfen statt vertrauen
  const shortlistIds = new Set(shortlist.map((d) => d.id));
  const validRecommendations = claudeResult.recommendations.filter((r) => shortlistIds.has(r.destination_id));
  if (validRecommendations.length === 0) {
    throw new Error("Claude hat keine gueltigen destination_ids aus der Shortlist zurueckgegeben");
  }

  const { data: tripRequestRow, error: insertError } = await supabase
    .from("trip_requests")
    .insert({
      user_id: userId,
      origin_lat: input.origin_lat,
      origin_lng: input.origin_lng,
      origin_label: input.origin_label,
      duration_days: input.duration_days,
      travel_months: input.travel_months,
      budget_level: input.budget_level,
      party_type: input.party_type,
      comfort_zone: input.comfort_zone,
      car_preference: input.car_preference,
      axis_nature_city: input.axis_nature_city,
      axis_activity_relax: input.axis_activity_relax,
      axis_iconic_hidden: input.axis_iconic_hidden,
      axis_luxury_authentic: input.axis_luxury_authentic,
      axis_photogenic_importance: input.axis_photogenic_importance,
      exploration_level: input.exploration_level,
    })
    .select("id")
    .single();

  if (insertError || !tripRequestRow) {
    throw new Error(`trip_requests konnte nicht gespeichert werden: ${insertError?.message}`);
  }

  const tripRequestId = tripRequestRow.id as string;
  const destinationById = new Map(shortlist.map((d) => [d.id, d]));

  const recommendationRows = validRecommendations.map((r, index) => ({
    trip_request_id: tripRequestId,
    destination_id: r.destination_id,
    rank: index + 1,
    reasoning: r.reasoning,
  }));

  const { error: recInsertError } = await supabase.from("recommendations").insert(recommendationRows);
  if (recInsertError) {
    throw new Error(`recommendations konnten nicht gespeichert werden: ${recInsertError.message}`);
  }

  return {
    trip_request_id: tripRequestId,
    recommendations: recommendationRows.map((row) => ({
      rank: row.rank,
      destination_id: row.destination_id,
      name: destinationById.get(row.destination_id)?.name ?? row.destination_id,
      reasoning: row.reasoning,
      match_score: matchScores.get(row.destination_id),
    })),
  };
}

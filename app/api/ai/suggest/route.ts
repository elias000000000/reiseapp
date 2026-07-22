import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { mockSuggestDestinations } from "@/lib/ai-mock";
import type { SuggestionCriteria } from "@/lib/types";

/**
 * Reiseziel-Vorschläge.
 * - Ohne ANTHROPIC_API_KEY: handgemachte Mock-Antworten (sofort nutzbar).
 * - Mit Key: Claude API mit Tool-Use + Prompt Caching (siehe Kommentar unten).
 */
export async function POST(req: Request) {
  const criteria = (await req.json()) as SuggestionCriteria;

  if (!config.hasAnthropic) {
    // Kleine künstliche Latenz, damit das UI sich "echt" anfühlt.
    await new Promise((r) => setTimeout(r, 700));
    return NextResponse.json({
      mode: "mock",
      destinations: mockSuggestDestinations(criteria),
    });
  }

  // ── Echter Claude-Pfad (aktiv sobald ANTHROPIC_API_KEY gesetzt) ────────────
  // Bewusst inline, damit du beim Key-Setup nicht durch zehn Dateien klicken musst.
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic();

  const system = `Du bist ein erfahrener europäischer Reiseberater. Du kennst nicht
nur Hauptstädte, sondern auch Dörfer, Inseln und Bergregionen. Begründe jeden
Vorschlag konkret in 1–2 Sätzen, nie generisch. Antworte ausschließlich via Tool.`;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: system,
    tools: [
      {
        name: "propose_destinations",
        description: "Schlägt 5–8 passende europäische Reiseziele vor.",
        input_schema: {
          type: "object",
          properties: {
            destinations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  country: { type: "string" },
                  region: { type: "string" },
                  type: {
                    type: "string",
                    enum: ["city", "village", "region", "nature", "coast", "mountain"],
                  },
                  matchScore: { type: "number", minimum: 0, maximum: 100 },
                  reason: { type: "string" },
                  bestSeason: { type: "string" },
                  estDailyBudgetEur: { type: "number" },
                  hiddenGem: { type: "boolean" },
                  lat: { type: "number" },
                  lng: { type: "number" },
                },
                required: ["name", "country", "type", "matchScore", "reason"],
              },
            },
          },
          required: ["destinations"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "propose_destinations" },
    messages: [
      { role: "user", content: `Kriterien: ${JSON.stringify(criteria, null, 2)}` },
    ],
  });

  const toolUse = msg.content.find((b) => b.type === "tool_use");
  const result = (toolUse && "input" in toolUse ? toolUse.input : { destinations: [] }) as {
    destinations: unknown[];
  };

  return NextResponse.json({ mode: "live", destinations: result.destinations });
}

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM = `Du bist ein präziser europäischer Reiseplaner mit Lokalwissen.
Du erstellst konkrete, umsetzbare Tagespläne mit echten Ortsnamen und korrekten GPS-Koordinaten.
Plane realistisch: max. 4-5 Orte pro Tag, Gehzeiten und Öffnungszeiten berücksichtigen.
Hotels nur an Tag 1 (Abends) planen. Restaurants über den Tag verteilen.
Antworte ausschließlich via Tool-Call.`;

export async function POST(req: Request) {
  try {
    const { destination, startDate, endDate, interests } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Kein API Key konfiguriert." },
        { status: 503 },
      );
    }

    const numDays =
      Math.round(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000,
      ) + 1;

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM,
      tools: [
        {
          name: "create_itinerary",
          description: "Erstellt einen detaillierten, tagesweisen Reiseplan.",
          input_schema: {
            type: "object" as const,
            properties: {
              summary: {
                type: "string",
                description: "Begeisterte Kurz-Zusammenfassung der Reise, 2-3 Sätze.",
              },
              days: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    date: { type: "string", description: "YYYY-MM-DD" },
                    theme: {
                      type: "string",
                      description: "Kurzes Tages-Motto, z.B. 'Ankunft & Altstadt'",
                    },
                    baseCity: { type: "string" },
                    places: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          kind: {
                            type: "string",
                            enum: ["hotel", "sight", "food", "nature", "transit", "note"],
                          },
                          lat: { type: "number" },
                          lng: { type: "number" },
                          description: {
                            type: "string",
                            description: "1-2 Sätze: Was ist das, warum lohnt es sich.",
                          },
                          imageSearch: {
                            type: "string",
                            description:
                              "Englischer Suchbegriff für Unsplash, z.B. 'Hvar fortress sunset dalmatia'",
                          },
                        },
                        required: ["name", "kind", "lat", "lng", "description"],
                      },
                    },
                  },
                  required: ["date", "theme", "baseCity", "places"],
                },
              },
            },
            required: ["summary", "days"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "create_itinerary" },
      messages: [
        {
          role: "user",
          content: `Erstelle einen ${numDays}-Tage-Reiseplan für ${destination.name}, ${destination.country}.

Reisezeitraum: ${startDate} bis ${endDate}
Interessen: ${interests.join(", ")}
${destination.lat ? `GPS-Zentrum: ${destination.lat}, ${destination.lng}` : ""}

Plane konkret mit echten Lokalnamen. Passe den Plan an die Interessen an: ${interests.join(", ")}.
Für jeden Tag genau ein "hotel"-Eintrag (nur Tag 1 Abends), Restaurants über den Tag verteilt.`,
        },
      ],
    });

    const toolUse = msg.content.find((b) => b.type === "tool_use");
    const result =
      toolUse && "input" in toolUse ? toolUse.input : { summary: "", days: [] };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[plan-trip]", err);
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

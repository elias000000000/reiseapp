// Claude API Client Initialisierung.
// Wird von ai/recommend.service.ts genutzt fuer die finale Reiseziel Empfehlung.

import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error("ANTHROPIC_API_KEY fehlt in .env");
}

export const anthropic = new Anthropic({ apiKey });

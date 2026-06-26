import type { AgentMode } from "./agentMemory";

export type AskMapRequest = {
  query: string;
  mode: AgentMode;
  userLocation?: { lat: number; lng: number };
  radius?: number;
  timeFilter?: string;
  mapBounds?: Record<string, unknown>;
  context?: Array<Record<string, unknown>>;
  district?: string;
  filter?: string;
  parsedIntent?: Record<string, unknown>;
  intentCategories?: string[];
  selectedEntity?: Record<string, unknown> | null;
};

export function parseAskMapIntent(query = "", mode: AgentMode = "resident") {
  const text = query.toLowerCase();
  if (mode === "partner") {
    if (text.includes("campaign")) return "campaign_opportunity";
    if (text.includes("coverage")) return "coverage_gap";
    if (text.includes("demand") || text.includes("rising")) return "demand_signal";
    if (text.includes("audience")) return "audience";
    if (text.includes("scan") || text.includes("save") || text.includes("open")) return "performance";
    return "partner_intelligence";
  }
  if (text.includes("happy hour")) return "happy_hour";
  if (text.includes("coffee")) return "coffee";
  if (text.includes("dining") || text.includes("dinner") || text.includes("food")) return "dining";
  if (text.includes("drink") || text.includes("cocktail")) return "drinks";
  if (text.includes("event") || text.includes("tonight")) return "events";
  if (text.includes("perk") || text.includes("offer")) return "perks";
  return "nearby";
}

export async function answerAskMap(request: AskMapRequest) {
  const mode = request.mode === "partner" ? "partner" : "resident";
  const response = await fetch("/api/ai/ask-map", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: request.query,
      query: request.query,
      mode,
      intent: parseAskMapIntent(request.query, mode),
      context: {
        parsedIntent: request.parsedIntent,
        intentCategories: request.intentCategories,
        selectedEntity: request.selectedEntity,
        mapBounds: request.mapBounds,
        timeFilter: request.timeFilter,
        mapContext: request.context || [],
        location: {
          district: request.district,
          coordinates: request.userLocation,
        },
        filter: request.filter,
        radius: request.radius,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ask Map request failed with ${response.status}`);
  }

  return response.json();
}

import type { AgentContext, AgentPlan, ToolCallPlan } from "./types";

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

export function planAgentResponse(context: AgentContext): AgentPlan {
  const message = context.message.toLowerCase();
  const toolCalls: ToolCallPlan[] = [];

  if (includesAny(message, ["nearby", "map", "place", "coffee", "dinner", "tonight", "where"])) {
    toolCalls.push({ name: "searchNearby", arguments: { query: context.message, location: context.location, filters: context.filters }, reason: "Find relevant map entities for the user's location and intent." });
  }
  if (includesAny(message, ["event", "rsvp", "tonight", "weekend"])) {
    toolCalls.push({ name: "findEvents", arguments: { query: context.message }, reason: "Events are relevant to this request." });
  }
  if (includesAny(message, ["perk", "deal", "offer", "redeem", "discount"])) {
    toolCalls.push({ name: "findPerks", arguments: { query: context.message }, reason: "Perks and offers are relevant to this request." });
  }
  if (includesAny(message, ["campaign", "launch", "promote"])) {
    toolCalls.push({ name: "findCampaigns", arguments: { query: context.message }, reason: "Campaign data is needed for planning." });
  }
  if (includesAny(message, ["report", "performance", "analytics", "trend", "summary"])) {
    toolCalls.push({ name: "summarizeReports", arguments: { query: context.message }, reason: "Reporting context is needed for analysis." });
  }
  if (!toolCalls.length) {
    toolCalls.push({ name: "searchKnowledge", arguments: { query: context.message }, reason: "Use general platform context when no specific operational tool is required." });
  }

  return {
    intent: context.intent === "general" ? toolCalls[0]?.name || "general" : context.intent,
    summary: `Planned ${toolCalls.length} backend tool call${toolCalls.length === 1 ? "" : "s"} for ${context.mode} mode.`,
    toolCalls,
  };
}

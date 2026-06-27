import type { AgentContext, AgentPlan, AgentResponse, ToolResult } from "./types.js";

function flattenToolData(results: ToolResult[]) {
  return results.flatMap((result) => Array.isArray(result.data) ? result.data : result.data ? [result.data] : []);
}

export function formatAgentResponse(input: {
  id: string;
  context: AgentContext;
  plan: AgentPlan;
  toolResults: ToolResult[];
  provider: { name: string; model: string; configured: boolean };
  providerAnswer?: string;
}): AgentResponse {
  const records = flattenToolData(input.toolResults).slice(0, 6);
  const topTitle = records[0]?.title || records[0]?.name || records[0]?.business_name || "";
  const fallbackAnswer = records.length
    ? `I found ${records.length} relevant Downtown Perks record${records.length === 1 ? "" : "s"}${topTitle ? `, starting with ${topTitle}` : ""}.`
    : `I checked the Downtown Perks ${input.context.mode} context and did not find a direct match yet.`;

  return {
    id: input.id,
    sessionId: input.context.sessionId,
    mode: input.context.mode,
    intent: input.plan.intent,
    answer: input.providerAnswer || fallbackAnswer,
    plan: input.plan,
    toolCalls: input.toolResults,
    citations: records.map((record) => ({ entity_id: record.id || record.entity_id, entity_type: record.entity_type || record.type || "platform_record", title: record.title || record.name || record.business_name || "" })),
    cards: records.map((record) => ({
      id: record.id || record.entity_id,
      type: record.entity_type || record.type || "record",
      title: record.title || record.name || record.business_name || "Downtown Perks record",
      subtitle: record.category || record.district || record.status || "",
      metric: record.analytics_summary || record.performance || null,
    })),
    actions: records.slice(0, 3).map((record) => ({ action: "focusEntity", entityId: record.entity_id || record.id, label: `Open ${record.title || record.name || "record"}` })),
    nextSuggestions: [
      "Show nearby perks",
      "Summarize performance",
      "Find events this week",
    ],
    stream: { supported: true, endpoint: "/api/agent/stream" },
    provider: input.provider,
  };
}

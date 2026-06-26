import type { AgentContext, ToolCallPlan, ToolResult } from "../agent/types";
import { canUseAgentTool } from "../agent/guardrails";

const matchesQuery = (record: Record<string, any>, query: string) => {
  const haystack = [record.title, record.name, record.business_name, record.category, record.district, record.description, record.summary].filter(Boolean).join(" ").toLowerCase();
  return !query || haystack.includes(query.toLowerCase()) || query.toLowerCase().split(/\s+/).some((part) => part.length > 2 && haystack.includes(part));
};

export async function executeToolCall(call: ToolCallPlan, context: AgentContext): Promise<ToolResult> {
  const query = String(call.arguments?.query || "");
  try {
    if (!canUseAgentTool(context.mode, call.name)) {
      return { name: call.name, ok: false, error: `Permission denied for ${call.name} in ${context.mode} mode` };
    }
    if (call.name === "searchNearby") {
      return { name: call.name, ok: true, data: context.entities.filter((entity) => matchesQuery(entity, query)).slice(0, 8) };
    }
    if (call.name === "findEvents") {
      return { name: call.name, ok: true, data: context.events.filter((event) => matchesQuery(event, query)).slice(0, 8) };
    }
    if (call.name === "findPerks") {
      return { name: call.name, ok: true, data: context.perks.filter((perk) => matchesQuery(perk, query)).slice(0, 8) };
    }
    if (call.name === "findCampaigns") {
      return { name: call.name, ok: true, data: context.campaigns.filter((campaign) => matchesQuery(campaign, query)).slice(0, 8) };
    }
    if (call.name === "summarizeReports") {
      return { name: call.name, ok: true, data: context.reports.slice(0, 8) };
    }
    return {
      name: call.name,
      ok: true,
      data: {
        mode: context.mode,
        organization: context.organization?.name || context.organization?.business_name || "Downtown Perks",
        entities: context.entities.length,
        events: context.events.length,
        perks: context.perks.length,
        campaigns: context.campaigns.length,
      },
    };
  } catch (error: any) {
    return { name: call.name, ok: false, error: error?.message || "Tool execution failed" };
  }
}

export async function executeToolPlan(calls: ToolCallPlan[], context: AgentContext) {
  return Promise.all(calls.map((call) => executeToolCall(call, context)));
}

export function listAgentTools() {
  return [
    "searchNearby",
    "findEvents",
    "findPerks",
    "findProperties",
    "findHotels",
    "findPartners",
    "findCampaigns",
    "searchKnowledge",
    "summarizeReports",
    "analyticsQuery",
  ];
}

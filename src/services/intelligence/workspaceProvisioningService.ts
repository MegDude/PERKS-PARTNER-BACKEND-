import { runIntelligenceAgent, type IntelligenceAgentContext } from "./intelligenceAgent.js";

export function assessWorkspaceReadiness(context: IntelligenceAgentContext) {
  return runIntelligenceAgent("recommend_next_action", {
    ...context,
    notes: `${context.notes || ""}\nAssess readiness to create organization, workspace, map listing, perk draft, campaign draft, billing link, analytics baseline, and team permissions.`,
  });
}

import { runIntelligenceAgent, type IntelligenceAgentContext } from "./intelligenceAgent.js";

export function generateCampaignStrategy(context: IntelligenceAgentContext) {
  return runIntelligenceAgent("generate_campaign_plan", context);
}

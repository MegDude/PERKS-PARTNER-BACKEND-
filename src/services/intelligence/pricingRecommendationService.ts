import { runIntelligenceAgent, type IntelligenceAgentContext } from "./intelligenceAgent.js";

export function generatePricingRecommendation(context: IntelligenceAgentContext) {
  return runIntelligenceAgent("generate_pricing_recommendation", context);
}

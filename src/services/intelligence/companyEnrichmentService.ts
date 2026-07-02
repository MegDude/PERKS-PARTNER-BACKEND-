import { runIntelligenceAgent, type IntelligenceAgentContext } from "./intelligenceAgent.js";

export function enrichCompany(context: IntelligenceAgentContext) {
  return runIntelligenceAgent("enrich_company", context);
}

export function identifyDecisionMakers(context: IntelligenceAgentContext) {
  return runIntelligenceAgent("identify_decision_makers", context);
}

import { runIntelligenceAgent, type IntelligenceAgentContext } from "./intelligenceAgent.js";

export function generateExecutiveProposal(context: IntelligenceAgentContext) {
  return runIntelligenceAgent("generate_proposal", context);
}

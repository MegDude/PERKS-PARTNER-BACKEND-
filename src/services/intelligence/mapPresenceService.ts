import { runIntelligenceAgent, type IntelligenceAgentContext } from "./intelligenceAgent.js";

export function summarizeMapPresence(context: IntelligenceAgentContext) {
  return runIntelligenceAgent("summarize_map_presence", context);
}

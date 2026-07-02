import { runIntelligenceAgent, type IntelligenceAgentContext } from "./intelligenceAgent.js";

export function generateMeetingAgenda(context: IntelligenceAgentContext) {
  return runIntelligenceAgent("generate_meeting_agenda", context);
}

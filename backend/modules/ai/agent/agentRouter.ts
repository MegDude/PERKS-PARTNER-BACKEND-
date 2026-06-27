import type { AgentQueryPayload } from "./types.js";
import { runAgentQuery } from "./agentGateway.js";

export async function routeAgentQuery(payload: AgentQueryPayload, data: { entities: Record<string, any> }) {
  return runAgentQuery(payload, data);
}

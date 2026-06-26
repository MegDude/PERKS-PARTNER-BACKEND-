import type { AgentQueryPayload } from "./types";
import { runAgentQuery } from "./agentGateway";

export async function routeAgentQuery(payload: AgentQueryPayload, data: { entities: Record<string, any> }) {
  return runAgentQuery(payload, data);
}

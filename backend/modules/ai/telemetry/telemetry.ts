export function createAgentTelemetryEvent(input: Record<string, any>) {
  return {
    event: input.event || "agent_request_completed",
    latency_ms: input.latency_ms || 0,
    provider: input.provider || "",
    model: input.model || "",
    mode: input.mode || "",
    intent: input.intent || "",
    created_at: new Date().toISOString(),
  };
}

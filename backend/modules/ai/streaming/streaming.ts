export function createAgentStreamEnvelope(payload: Record<string, any>) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export function evaluateAgentResponse(response: Record<string, any>) {
  return {
    grounded: Array.isArray(response.citations) && response.citations.length > 0,
    hasActions: Array.isArray(response.actions) && response.actions.length > 0,
    evaluated_at: new Date().toISOString(),
  };
}

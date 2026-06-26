export function sanitizeAgentMessage(message: unknown) {
  return String(message || "").slice(0, 4000);
}

export function canUseAgentTool(mode: string, toolName: string) {
  if (mode === "resident") {
    return !["analyticsQuery", "summarizeReports"].includes(toolName);
  }
  return true;
}

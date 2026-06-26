export function createConversationRecord(input: {
  id: string;
  sessionId: string;
  userId: string;
  organizationId: string;
  mode: string;
  intent: string;
  message: string;
  response: Record<string, any>;
}) {
  const timestamp = new Date().toISOString();
  return {
    id: input.id,
    session_id: input.sessionId,
    user_id: input.userId,
    organization_id: input.organizationId,
    mode: input.mode,
    intent: input.intent,
    message: input.message,
    response: input.response,
    status: "completed",
    created_at: timestamp,
    updated_at: timestamp,
    metadata: {
      source: "agent_gateway",
    },
  };
}

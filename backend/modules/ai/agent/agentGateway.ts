import { buildAgentContext } from "./contextEngine.js";
import { planAgentResponse } from "./planner.js";
import { formatAgentResponse } from "./responseFormatter.js";
import type { AgentDataAccess, AgentQueryPayload } from "./types.js";
import { createConversationRecord } from "../memory/conversationStore.js";
import { getProviderManager } from "../providers/providerManager.js";
import { getPromptForMode } from "../prompts/promptLibrary.js";
import { executeToolPlan } from "../tools/toolRegistry.js";

export async function runAgentQuery(payload: AgentQueryPayload, data: AgentDataAccess) {
  const context = buildAgentContext(payload, data);
  const plan = planAgentResponse(context);
  const toolResults = await executeToolPlan(plan.toolCalls, context);
  const providerManager = getProviderManager();
  let providerAnswer = "";

  if (providerManager.primary.configured) {
    try {
      providerAnswer = await providerManager.primary.chat([
        { role: "system", content: getPromptForMode(context.mode) },
        {
          role: "user",
          content: JSON.stringify({
            message: context.message,
            mode: context.mode,
            intent: plan.intent,
            toolResults,
            context: {
              location: context.location,
              organization: context.organization,
              filters: context.filters,
            },
          }),
        },
      ]);
    } catch (error: any) {
      providerAnswer = `The agent used platform tools, but the AI provider returned an error: ${error?.message || "unknown error"}.`;
    }
  }

  const id = `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const response = formatAgentResponse({
    id,
    context,
    plan,
    toolResults,
    provider: providerManager.metadata,
    providerAnswer,
  });
  const conversation = createConversationRecord({
    id,
    sessionId: context.sessionId,
    userId: context.userId,
    organizationId: context.organizationId,
    mode: context.mode,
    intent: response.intent,
    message: context.message,
    response,
  });

  return { response, conversation };
}

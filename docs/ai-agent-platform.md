# AI Agent Platform

## Status

The 3014 operations backend now owns the shared Agent Gateway.

## Backend Entry Points

- `POST /api/agent/query`
- `POST /api/agent/stream`
- `GET /api/agent/conversations`
- `GET /api/agent/suggestions`
- `POST /api/agent/feedback`
- `GET /api/agent/tools`
- `POST /api/agent/tools/execute`
- `POST /api/agent/images`
- `POST /api/agent/campaigns`
- `POST /api/agent/reports`

Legacy compatibility routes now flow through the backend agent path:

- `POST /api/ai/ask-map`
- `POST /api/ai/recommendations`
- `POST /api/ai/report-summary`
- `POST /api/ai/survey-summary`

## Module Structure

```text
backend/modules/ai/
  agent/
  providers/
  tools/
  memory/
  prompts/
  streaming/
  evaluation/
  telemetry/
```

## Environment Contract

Backend-only:

- `OPENAI_API_KEY`
- `AI_CHAT_MODEL`
- `AI_IMAGE_MODEL`

Frontend:

- No OpenAI key.
- No provider-specific SDK initialization.
- Send messages, session IDs, and structured UI context to `/api/agent/query` or `/api/agent/stream`.

## Provider Behavior

The OpenAI provider is centralized in `backend/modules/ai/providers/openai.ts`.

If `OPENAI_API_KEY` is present, the gateway calls OpenAI. If it is missing, the gateway still runs platform tools and returns grounded operational responses without printing or exposing secrets.

Image generation requires `OPENAI_API_KEY` and returns a clear error if credentials are missing.

## Frontend Migration Target

5173 should replace page-specific AI logic with one shared client:

```text
src/services/agent/
  agentClient.ts
  streamClient.ts
  conversationStore.ts
  actionExecutor.ts
  agentHooks.ts
```

Ask the Map should send:

```json
{
  "message": "What should I do tonight?",
  "sessionId": "resident-session",
  "mode": "resident",
  "context": {
    "viewport": {},
    "visibleEntities": [],
    "filters": {}
  }
}
```

The frontend should render returned `answer`, `cards`, `actions`, and streamed state. It should not assemble prompts or choose providers.

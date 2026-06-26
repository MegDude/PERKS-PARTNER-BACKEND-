# AI Gap Analysis

## What Exists

- Backend AI module folder:
  - `backend/modules/ai/agent`
  - `backend/modules/ai/providers`
  - `backend/modules/ai/tools`
  - `backend/modules/ai/memory`
  - `backend/modules/ai/prompts`
  - `backend/modules/ai/telemetry`
  - `backend/modules/ai/streaming`
- API endpoints:
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
  - legacy `/api/ai/ask-map`, `/api/ai/recommendations`, `/api/ai/report-summary`, `/api/ai/survey-summary`
- Data includes `AiInsight: 39` and `Interaction: 6`.
- Properties ingestion now uses the backend OpenAI provider manager instead of the old Gemini-specific implementation.
- Local runtime verification confirms the OpenAI-gated path returns `503` with a setup-required message when `OPENAI_API_KEY` is absent, rather than attempting an unsafe frontend/provider call.

## Capability Status

| Capability | Status | Gap |
| --- | --- | --- |
| Backend AI gateway | Partial | Runtime/provider test not completed. |
| Provider abstraction | Partial | OpenAI provider exists; missing-key behavior is proven; configured key/model success path is not proven. |
| Ask the Map | Partial | Legacy and gateway endpoints exist; product UI wiring not verified. |
| Structured context | Partial | Context engine exists; live data assembly not tested. |
| Memory | Partial | Conversation store exists; persistence/scope not proven. |
| Tool execution | Partial | Tool registry exists; permission tests missing. |
| Streaming | Partial | Streaming endpoint exists; browser stream rendering not proven. |
| Report summaries | Partial | Endpoint exists; provider unavailable/unverified. |
| Campaign assistant | Partial | Endpoint exists; end-to-end creation not proven. |
| Survey summaries | Partial | Endpoint exists; survey provider flow inactive. |
| Image generation | Partial | Endpoint exists; provider/storage not proven. |
| Observability | Partial | Audit/analytics events exist; cost/token/latency dashboard missing. |

## Production Requirements

1. Backend-only provider secret handling.
2. Runtime test for `/api/agent/query`.
3. Runtime test for `/api/agent/images`.
4. Runtime success test for `/api/properties/ingest` after `OPENAI_API_KEY` is configured.
5. Frontend SDK check that no React page calls OpenAI directly.
6. Tool permission tests.
7. Conversation memory persistence tests.
8. AI telemetry dashboard for model, latency, tokens, errors, and feedback.

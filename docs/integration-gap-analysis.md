# Integration Gap Analysis

Visible integration cards are not proof of active provider execution.

| Integration | Classification | Evidence | Production Requirement |
| --- | --- | --- | --- |
| OpenAI | Connected but incomplete | AI module/API endpoints exist, and `/api/properties/ingest` now routes through the backend OpenAI provider manager. Current local runtime correctly returns setup-required 503 when `OPENAI_API_KEY` is missing. | Backend `OPENAI_API_KEY`, `AI_CHAT_MODEL`, `AI_IMAGE_MODEL`, query/image/ingest tests, token/cost logs. |
| n8n | Planned only | Automation terminology and records exist. | Webhook URL, signed requests, run IDs, retry/failure sync. |
| Supabase | Planned only | Local JSON file is primary store. | Supabase URL/service key, migrations, RLS/tenant scoping. |
| Twilio Verify | Planned only | Integration status expected. | Verify service SID and verification flow tests. |
| Twilio Messaging | Planned only | Messaging journeys and SMS log entities exist. | Messaging service SID, delivery callbacks, opt-out handling. |
| Tally / Jotform / SurveyJS | UI/data only | Survey provider forms exist. | Webhook endpoints, signature validation, response mapping. |
| Google Sheets / Reports DB | Planned only | CSV/export paths exist. | OAuth/service account, sync jobs, failure reporting. |
| Google Maps | Planned only | Map data exists locally. | API key, provider-backed geocoding/routing if required. |
| Stripe | Connected but incomplete | Checkout/session and promotion bypass code exist. | Secret key, webhook signing secret, subscription reconciliation. |
| Storage Provider | Planned only | Media entity concepts exist. | Supabase Storage/S3/Blob config and upload policy. |

## Integration Blocker

Until credentials and smoke tests pass, external actions must show setup-required states and must not appear production-active.

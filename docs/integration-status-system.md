# Integration Status System

## API

- `GET /api/integrations/status`
- `POST /api/integrations/:id/test`

## Providers

- Tally Webhooks
- Twilio Verify
- Twilio Messaging
- Supabase Operational Store
- n8n Workflow Orchestration
- OpenAI Insights
- Google Sheets / Reports DB
- Google Maps
- Stripe
- Storage Provider

## Rule

External calls are not made unless credentials exist. Missing credentials return `pending_credentials`.


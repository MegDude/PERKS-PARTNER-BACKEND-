# 5173 to 3014 Integration Gap Analysis

## Current State

3014 now exposes product-operation APIs for map, perks, events, campaigns, residents, partners, reports, analytics, automations, integrations, QR, and AI. These APIs persist into the 3014 local operational store and write analytics/audit records for mutations and interactions.

5173 is still a separate product checkout that uses Base44/product-local clients for many product surfaces.

## Highest-Priority Gaps

1. Point 5173 map feed and map action registry to `/api/map/entities`, `/api/map/pins`, and `/api/map/events`.
2. Point 5173 event RSVP actions to `/api/events/:id/rsvp`.
3. Point 5173 perk redemption actions to `/api/perks/:id/redeem`.
4. Point 5173 partner workspace actions to `/api/partners`, `/api/campaigns`, `/api/reports`, `/api/analytics/summary`, and `/api/qr`.
5. Point 5173 Ask the Map to `/api/ai/ask-map` with role, mode, active entity, location, and visible entity context.
6. Configure 5173 `VITE_API_BASE_URL` or proxy rules so product calls reach 3014 in local development.
7. Replace any remaining product-local mock analytics with `/api/analytics/events`.

## External Integration Gaps

External provider calls are intentionally inactive without credentials:

- Stripe checkout and subscriptions
- Twilio Verify and Messaging
- OpenAI live generation
- Tally/Jotform/SurveyJS webhooks
- Google Sheets exports
- n8n orchestration
- Google Maps key-backed services
- Storage provider uploads beyond local compatibility

## Risk

Until 5173 is pointed at these APIs, 3014 is operational-source ready but not the live runtime source of truth for every 5173 action.


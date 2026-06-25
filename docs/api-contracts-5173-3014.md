# API Contracts for 5173 and 3014

All endpoints are served by 3014 in local development.

## Map

- `GET /api/map/entities`
- `GET /api/map/pins`
- `GET /api/map/entities/:id`
- `POST /api/map/events`

Map event body:

```json
{
  "event": "pin_viewed",
  "entity_type": "venue",
  "entity_id": "map_entity_id",
  "mode": "resident",
  "metadata": {}
}
```

## Perks

- `GET /api/perks`
- `POST /api/perks`
- `PATCH /api/perks/:id`
- `POST /api/perks/:id/activate`
- `POST /api/perks/:id/pause`
- `POST /api/perks/:id/archive`
- `POST /api/perks/:id/redeem`

Redeem body:

```json
{
  "resident_email": "resident@example.com",
  "resident_name": "Resident",
  "property_id": "bldg_shore"
}
```

## Events

- `GET /api/events`
- `POST /api/events`
- `PATCH /api/events/:id`
- `POST /api/events/:id/rsvp`
- `POST /api/events/:id/check-in`
- `POST /api/events/:id/follow-up`

## Campaigns

- `GET /api/campaigns`
- `POST /api/campaigns`
- `PATCH /api/campaigns/:id`
- `POST /api/campaigns/:id/publish`
- `POST /api/campaigns/:id/pause`
- `POST /api/campaigns/:id/archive`

## Residents

- `GET /api/residents`
- `POST /api/residents`
- `PATCH /api/residents/:id`
- `POST /api/residents/:id/segment`
- `GET /api/residents/:id/activity`

## Partners

- `GET /api/partners`
- `POST /api/partners`
- `PATCH /api/partners/:id`
- `POST /api/partners/:id/provision-workspace`

## Reports

- `GET /api/reports`
- `POST /api/reports/run`
- `GET /api/reports/:id/export`

## Analytics

- `GET /api/analytics/summary`
- `POST /api/analytics/events`

## Automations

- `GET /api/automations`
- `GET /api/automations/runs`
- `POST /api/automations/:id/run`

## Integrations

- `GET /api/integrations/status`
- `POST /api/integrations/:id/test`

## QR

- `GET /api/qr/:id`
- `POST /api/qr/scan`

## AI

- `POST /api/ai/ask-map`
- `POST /api/ai/recommendations`
- `POST /api/ai/report-summary`
- `POST /api/ai/survey-summary`

## Response Rules

- Success responses return JSON records or `{ success: true }` envelopes.
- Failed lookups return `404`.
- Invalid active-state transitions return `409` where applicable.
- Mutating product-action endpoints emit audit and/or analytics records.


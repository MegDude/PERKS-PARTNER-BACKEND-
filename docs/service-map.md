# Service Map

## Current Services

- `server.ts` owns most API and business logic.
- `backend/modules/ai` owns AI gateway/provider/tool skeleton.
- `src/api/base44Client.ts` is the generic frontend API adapter.

## Required Backend Service Layout

```text
backend/modules/
  auth/
  organizations/
  workspaces/
  partners/
  properties/
  buildings/
  residents/
  segmentation/
  map/
  perks/
  redemptions/
  events/
  campaigns/
  surveys/
  reports/
  analytics/
  automations/
  notifications/
  messages/
  ai/
  billing/
  promotions/
  qr/
  media/
  settings/
```

Each module must include:

- controller/routes
- service
- repository
- validator
- permission guard
- audit writer
- analytics emitter
- tests

## Frontend Service Layout

```text
src/services/
  apiClient.ts
  partners.ts
  properties.ts
  buildings.ts
  residents.ts
  perks.ts
  events.ts
  campaigns.ts
  surveys.ts
  reports.ts
  analytics.ts
  billing.ts
  promotions.ts
  map.ts
  ai.ts
```

Production pages should use these clients, not `base44.entities.*` directly.

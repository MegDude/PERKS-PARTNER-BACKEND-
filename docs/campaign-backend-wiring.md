# Campaign Backend Wiring

## API

- `GET /api/campaigns`
- `POST /api/campaigns`
- `PATCH /api/campaigns/:id`
- `POST /api/campaigns/:id/publish`
- `POST /api/campaigns/:id/pause`
- `POST /api/campaigns/:id/archive`

## State Rules

- `draft`: not active on product surfaces.
- `active`: eligible for placements and reporting.
- `paused`: preserve historical reporting but halt placements.
- `archived`: remove from active views and preserve history.

## Outputs

- campaign record update
- `AnalyticsEvent`
- `TenantAuditLog`


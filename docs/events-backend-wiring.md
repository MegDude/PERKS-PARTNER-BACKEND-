# Events Backend Wiring

## API

- `GET /api/events`
- `POST /api/events`
- `PATCH /api/events/:id`
- `POST /api/events/:id/rsvp`
- `POST /api/events/:id/check-in`
- `POST /api/events/:id/follow-up`

## State Rules

- Draft events can remain admin-only.
- Active/upcoming events can surface on 5173.
- Capacity is enforced for RSVP creation.
- Follow-up queues an automation run.

## Outputs

- `EventRSVP`
- updated registered count
- `AutomationRun`
- `AnalyticsEvent`
- `TenantAuditLog`


# Volume 13: APIs

## Purpose

Define API standards, request/response structure, authentication, errors, webhooks, and SDK expectations.

## API Rules

- Use consistent JSON.
- Validate input.
- Return useful error messages without exposing secrets.
- Add audit events for writes.
- Prefer versionable route families for durable APIs.
- Keep provider credentials server-side.

## Error Shape

```json
{
  "error": "Human readable message.",
  "code": "machine_readable_code",
  "details": {}
}
```

## Current API Families

- `/api/registry/*`
- `/api/map/*`
- `/api/entities/*`
- `/api/partner-platform/*`
- `/api/intelligence/*`
- `/api/calendar/*`
- `/api/launch-desk/*`
- `/api/integrations/*`

## Frontend Domain Clients

Production page modules should call typed domain clients in `src/services/domain/` instead of scattering `fetch` calls or generic entity mutations through page components.

Initial contracts:

- `apiClient`: shared JSON request helper with query-string support and consistent error handling.
- `boardMeetingsService`: board meetings, minutes drafts, decisions, and action items.
- `eventsService`: event CRUD, RSVP, check-in, and follow-up actions.
- `propertiesService`: property portfolio reads, writes, deletes, and ingest actions.
- `reportsService`: report listing, report runs, and export URL generation.
- `registryService`: canonical registry entity, search, layer, collection, relationship, and mutation actions.

Migration rule: new modules must use domain clients first. Existing modules should move one route at a time, with no broad rewrites and no change to user-facing behavior unless explicitly scoped.

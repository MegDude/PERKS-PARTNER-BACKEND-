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


# Database Map

The local database is JSON-backed for development and stored at `data/downtown-perks-db.json`.

Future production database should preserve:

- tenant scoping
- workspace scoping
- soft delete
- audit logging
- analytics event stream
- normalized partner/location/perk/event/campaign relationships
- indexes on tenant, workspace, status, entity type, and timestamps


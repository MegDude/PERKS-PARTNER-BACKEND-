# Backend Audit

## API Coverage

The backend exposes routes for health, tenants, workspace, imports, products, promotions, leads, checkout, auth, generic entities, properties, map, events, campaigns, residents, partners, reports, analytics, automations, integrations, QR, AI, perks, redemptions, and insights.

## Current Architecture

- Primary backend file: `server.ts`.
- Dedicated module folder exists only for AI under `backend/modules/ai`.
- `api/index.ts` provides a Vercel-style entry.
- Persistence is local JSON in `data/downtown-perks-db.json`.

## Backend Reconciliation Needs

| Domain | Current State | Required State |
| --- | --- | --- |
| Auth | Basic `/api/auth/me`. | Real session/auth provider, tenant membership, RBAC. |
| Organizations/Workspaces | Strong provisioning functions. | Extract service and repository. |
| Partners | API and data exist. | Partner service owns profile, locations, users, reports. |
| Properties/Buildings | API/UI exist. | Property/building service with validation and audit. |
| Residents | API/data exist. | Enrollment, access, saved, card, preferences workflows. |
| Perks | CRUD/redeem APIs exist. | Eligibility engine and soft delete everywhere. |
| Events | RSVP/check-in/follow-up APIs exist. | Capacity, reminders, follow-up automation. |
| Campaigns | Publish/pause/archive APIs exist. | Audience resolution and delivery engine. |
| Reports | Containers and API exist. | Scheduled generation, exports, distribution. |
| Analytics | Summary/events API exists. | Universal event schema and aggregation jobs. |
| AI | Module exists. | Provider runtime, memory persistence, permission tests. |
| Billing | Checkout/promotions exist. | Stripe webhooks and subscription reconciliation. |
| Automations | Run records exist. | Durable workflow engine. |
| QR | Scan API exists. | Product scanner and attribution reports. |

## Critical Backend Gaps

1. `server.ts` is too large and owns too many domains.
2. Generic entity API is too permissive for production.
3. Validation is inconsistent.
4. Server-side permission checks are incomplete.
5. Integration credentials are not proven active.
6. Tests are missing.

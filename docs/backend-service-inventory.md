# Backend Service Inventory

3014 currently uses one Express server with domain boundaries represented by entity collections, compatibility functions, and explicit REST endpoints.

## Operational Store

Local JSON database: `data/downtown-perks-db.json`

Entity collections include buildings, units, residents, partners, partner profiles, locations, perks, redemptions, events, RSVPs, campaigns, surveys, messages, reports, analytics events, audit logs, automation runs, QR experiences, QR scans, integration statuses, AI insights, subscriptions, invoices, workspaces, roles, and map entity links.

## Existing Domain Services

| Domain | Current surface | Status |
| --- | --- | --- |
| Auth | `/api/auth/me` | Local admin identity compatibility |
| Platform registry | `/api/platform` | Operational |
| Tenants/workspaces | `/api/tenants`, `/api/workspace/:slug`, `/api/tenant-provisioning/status` | Operational |
| Entity CRUD | `/api/entities/:entity` | Operational generic data layer |
| Partner lifecycle | `/api/functions/provisionPartnerWorkspace`, `/api/partners/:id/provision-workspace` | Operational local provisioning |
| Map import | `/api/map-data/import` | Operational for attached map CSV/zip source files |
| Properties | `/api/admin/properties`, `/api/properties` | Operational |
| Perks | `/api/perks`, `/api/perks/:id/*` | Operational with status and redemption APIs |
| Events | `/api/events`, RSVP, check-in, follow-up | Operational local workflow |
| Campaigns | `/api/campaigns`, publish/pause/archive | Operational local workflow |
| Residents | `/api/residents`, segment, activity | Operational local workflow |
| Reports | `/api/reports`, `/api/reports/run`, export | Operational local report runs |
| Analytics | `/api/analytics/summary`, `/api/analytics/events` | Operational local event stream |
| Automations | `/api/automations`, run logs | Operational local run log |
| Integrations | `/api/integrations/status`, test | Credential-aware, no external calls without keys |
| QR | `/api/qr/:id`, `/api/qr/scan` | Operational local scan attribution |
| AI | `/api/ai/ask-map`, recommendations, summaries | Structured local context; external LLM optional |

## Gap

The backend is integration-ready, but it is not yet a decomposed `src/server/<domain>` folder architecture. The current repo preserves the existing single-server convention to avoid a disruptive rewrite.


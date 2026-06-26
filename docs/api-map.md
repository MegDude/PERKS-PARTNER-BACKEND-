# API Map

## API Families Present

- Health/platform: `/api/health`, `/api/platform`
- Tenants/workspace: `/api/tenants`, `/api/workspace/:slug`, `/api/tenant-provisioning/*`
- Imports: `/api/map-data/import`, `/api/intelligence/import`, `/api/products/import-pricing-catalog`
- Products/pricing: `/api/products`, `/api/prices`
- Promotions: `/api/promotions`, `/api/promotions/validate`, `/api/promotions/redeem`
- Leads/checkout: `/api/partner-leads`, `/api/checkout/session`
- Auth: `/api/auth/me`
- Generic entities: `/api/entities/:entity`
- Properties: `/api/admin/properties`, `/api/properties`
- Map: `/api/map/entities`, `/api/map/pins`, `/api/map/events`
- Events: `/api/events`, `/api/events/:id/rsvp`, `/api/events/:id/check-in`, `/api/events/:id/follow-up`
- Campaigns: `/api/campaigns`, publish/pause/archive routes
- Residents: `/api/residents`, segment/activity routes
- Partners: `/api/partners`, provision-workspace route
- Reports: `/api/reports`, run/export routes
- Analytics: `/api/analytics/summary`, `/api/analytics/events`
- Automations: `/api/automations`, `/api/automations/runs`, run route
- Integrations: `/api/integrations/status`, test route
- QR: `/api/qr/:id`, `/api/qr/scan`
- AI: `/api/agent/*`, `/api/ai/*`
- Perks: `/api/perks`, status/redeem routes
- Insights: `/api/insights/*`

## API Reconciliation Requirements

| Requirement | Current Status |
| --- | --- |
| Documented | Partial through docs; not OpenAPI-complete. |
| Versioned | Missing. |
| Validated | Partial/inconsistent. |
| Permission protected | Partial/inconsistent. |
| Tenant scoped | Partial. |
| Observable | Partial audit/analytics helpers. |
| Tested | Missing. |
| Audited | Partial. |

Priority: replace generic entity writes with domain endpoints and add request/response schemas.

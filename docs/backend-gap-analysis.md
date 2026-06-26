# Backend Gap Analysis

## What Exists

- One Express backend in `server.ts`.
- API endpoints for health, platform, tenants, products, promotions, partner leads, checkout, generic entities, properties, map, events, campaigns, residents, partners, reports, analytics, automations, integrations, QR, AI, perks, redemptions, and insights.
- Dedicated AI module folder under `backend/modules/ai`.
- Persisted JSON store at `data/downtown-perks-db.json`.
- Audit and analytics helper usage in multiple mutation routes.
- Tenant provisioning functions that create tenants, workspaces, roles, analytics containers, report containers, settings, notifications, partner profiles, QR experiences, and audit logs.

## Evidence Counts

- PlatformTenant: 358
- TenantWorkspace: 358
- TenantRole: 1790
- TenantAuditLog: 898
- Partner: 353
- PartnerProfile: 358
- PartnerLocation: 504
- PartnerOffer: 350
- PartnerQrExperience: 352
- Campaign: 374
- PerkLocation: 26
- PerkRedemption: 5
- Event: 2
- EventRSVP: 1
- Survey: 1
- SurveyResponse: 2
- PartnerReport: 358
- PartnerAnalytics: 358
- Tenant: 196
- Flat: 86
- AnalyticsEvent: 10
- AutomationRun: 4
- AiInsight: 39
- Promotion: 1
- ProductOffering: 54

## Shore Resident Import Evidence

- Source workbook: `/Users/megdude/Documents/CITY DATABSES /CITY DATABSES /THE SHORE.xlsx`
- Canonical building: `bldg_shore`
- Canonical tenant: `tenant_the-shore`
- Canonical workspace: `workspace_the-shore`
- Imported residents: 194
- Imported occupied units: 84
- Residents with email: 99
- Residents with phone: 83
- Import audit: `audit_the-shore_resident_import`
- Import analytics event: `analytics_the-shore_resident_import`

## Gaps

| Gap | Evidence | Risk | Fix |
| --- | --- | --- | --- |
| Domain logic concentrated in `server.ts` | Only `backend/modules/ai` is separated. | Hard to test, permission, reuse, or deploy safely. | Extract partners, promotions, billing, properties, map, perks, events, campaigns, surveys, reports, automations, integrations into modules. |
| Generic entity API is broad | `/api/entities/:entity` supports generic CRUD. | Server-side RBAC and validation can be bypassed. | Add entity allowlist, schema validation, permission middleware, and audit enforcement. |
| External persistence not active | Supabase integration not proven; JSON store is primary. The Shore import is persisted locally only. | Production data safety and concurrency risk. | Move operational store to Supabase/Postgres with migrations and indexes, then replay/import The Shore data through a migration. |
| Soft delete inconsistent | Perks have explicit archive route but also DELETE route. | Deleting can damage report/audit continuity. | Make all deletes soft delete with `deleted_at`. |
| Stripe paid path unproven | Checkout code exists; credentials/runtime not proven. | Paid signup cannot be production-ready. | Configure Stripe, implement webhooks, reconciliation tests. |
| Workflow engine partial | AutomationRun records exist. | No durable trigger/condition/action execution. | Build workflow service with retry, failure states, logs, and provider adapters. |
| API tests missing | No test evidence found. | Regressions are likely. | Add contract tests and smoke workflow tests. |

## Backend Priority

1. Soft-delete enforcement.
2. RBAC and validation middleware.
3. Stripe and provider credentials.
4. Production database migration for current local JSON data, including The Shore residents.
5. Durable workflow engine.
6. Domain extraction from `server.ts`.

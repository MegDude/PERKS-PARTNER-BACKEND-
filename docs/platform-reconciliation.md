# Platform Reconciliation

Audit date: 2026-06-25

## Target Model

Downtown Perks should operate as one platform:

- 5173: customer-facing product surfaces.
- 3014: operations control system.
- Shared API layer: the only path to business logic.
- Domain services: own rules, validation, permissions, audit, analytics, and workflows.
- Database: one source of truth.

## Current State

The current 3014 repo has meaningful platform capability: 358 tenants, 358 workspaces, 353 partners, 541 map entities, 374 campaigns, 26 perks, partner lifecycle routes, promotion checkout, map APIs, agent APIs, reports, analytics, and audit records.

The platform is not fully reconciled because most domain logic still lives in `server.ts`, many UI pages call generic entity APIs directly, external integrations are not proven active, and the 5173 product surface is not verified from this repo.

## Duplication Findings

| Area | Current Evidence | Required Reconciliation |
| --- | --- | --- |
| Components | Repeated `Field`, `Panel`, `Metric`, `SummaryTable`, `SearchBox`, `Toolbar`, `SectionCard` helpers across pages. | Move to shared component library and replace page-local versions. |
| Services | Most domain routes and business rules are centralized in `server.ts`. | Extract domain modules with controller/service/repository/validator. |
| API calls | Pages mix `fetch('/api/*')`, `base44.entities.*`, and `base44.functions.invoke`. | Create typed service clients per domain. |
| Business logic | UI pages update status, archive, create audit logs, and shape records. | Move mutations into backend services. |
| Styling | Shared UI exists, but many pages still use custom inline utility layouts. | Enforce design tokens and shared table/rail/surface components. |
| State | Partner lifecycle uses `localStorage`; workspace pages query many entities separately. | Use server sessions and query cache around domain APIs. |
| Validation | Some forms validate locally; generic entity endpoints accept broad payloads. | Server-side schemas per endpoint. |

## Reconciliation Principles

1. Product and admin consume the same API contracts.
2. No React component owns business rules.
3. No generic entity mutation is allowed for production workflows.
4. Every mutation writes audit and analytics.
5. Every workflow runs through the workflow engine.
6. Every route has loading, empty, error, permission, and mobile states.
7. Every domain owns its data, reports, permissions, and automations.

## Platform Scorecard

| Area | Score /10 | Remediation |
| --- | ---: | --- |
| Architecture | 6 | Extract domains and enforce shared service layer. |
| Design System | 6 | Consolidate repeated UI helpers. |
| Backend | 6 | Split `server.ts`, add validation/RBAC. |
| Frontend | 6 | Replace direct entity calls with service clients. |
| Database | 5 | Move from JSON store to production DB/migrations. |
| Services | 5 | Create domain service ownership. |
| Map | 6 | Complete pin relationship and action analytics audit. |
| AI | 5 | Verify provider/runtime and product SDK. |
| Reports | 5 | Build scheduled generation/export. |
| Analytics | 4 | Instrument all product/admin actions. |
| Automation | 3 | Build durable workflow engine. |
| Notifications | 4 | Connect provider delivery and logs. |
| Billing | 5 | Complete Stripe paid path and webhooks. |
| Security | 4 | Enforce tenant RBAC server-side. |
| Performance | 5 | Add query caching, route splitting, bundle audit. |
| Accessibility | 4 | Full keyboard/ARIA/contrast pass. |
| Testing | 1 | Add contract, integration, and E2E tests. |
| Documentation | 7 | Keep docs evidence-backed and current. |
| Operations | 6 | Strong records; provider and workflow execution incomplete. |

# Downtown Perks Current Regression Cross-Check

Date: 2026-06-27

Scope: verify the recent claims around partner workspaces, admin navigation, directory polish, promotions, AI, map wiring, and production readiness for `https://downtown-perks-backend.vercel.app`.

## Executive Finding

The platform is not fully production complete against the full master instructions. It is a working operations prototype with many live routes, a JSON-backed API, seeded tenant/workspace data, promotion logic, map entity links, and an AI gateway shell. The remaining blockers are provider credentials, normalized persistence, server-side RBAC enforcement, workflow durability, complete test coverage, and map data quality.

## Confirmed Built

| Area | Evidence | Status |
| --- | --- | --- |
| Admin route shell | `src/App.tsx` contains `/admin`, `/admin/platform`, `/admin/partner`, `/admin/properties`, `/admin/buildings`, `/admin/residents`, `/admin/perks`, `/admin/events`, `/admin/surveys`, `/admin/reports`, `/admin/analytics`, `/admin/promotions`. Live HEAD checks returned `200`. | Built |
| Standalone workspace routes | `/admin/workspaces/:slug` and `/workspaces/:slug` route to `PartnerWorkspaceRoute`. Live checks for `/admin/workspaces/dana` and `/admin/workspaces/waterloo-greenway` returned `200`. | Built |
| Curated partner workspaces | `src/data/partnerWorkspaceCatalog.ts` includes curated workspace generation for civic, brand, property, venue, and hotel examples. | Built |
| Promotion code engine | `/api/promotions`, `/api/promotions/validate`, `/api/promotions/redeem` exist. Live validation for `DUDE2026` returned `total: 0`. | Built |
| Checkout promotional bypass | `/api/checkout/session` creates a promotional subscription path when the validated promotion total is zero. | Built |
| AI gateway routes | `/api/agent/query`, `/api/agent/stream`, `/api/agent/tools`, `/api/ai/ask-map`, `/api/ai/recommendations`, `/api/ai/report-summary`, `/api/ai/survey-summary` exist. | Partial |
| Map entity endpoint | `/api/map/entities` returns linked operational records from `MapEntityLink` and `PerkLocation`. | Partial |
| Admin visual polish | Shared admin CSS in `src/index.css` now applies bright white surfaces, compact matrices, mobile typography constraints, and soft section-level glow. | Built |

## Regressions Found

| Regression | Evidence | Fix Applied |
| --- | --- | --- |
| Map link fallback could assign the wrong title/type to generic links. Example observed live: `property-waterline` resolved to `Fine Eyewear`. | `mapEntityRows()` used one `find()` with `map_entity_id OR partner_id OR tenant_id`, allowing unrelated fallbacks. | Patched `server.ts` to resolve location by exact map entity first, then partner, then tenant. |
| Earlier "everything complete" wording overstated production readiness. | Live `/api/integrations/status` reports OpenAI, Stripe, Supabase, Twilio, n8n, Google Sheets, Google Maps, and storage as `pending_credentials`. | Audit now marks provider-backed features as partial until credentials and end-to-end provider calls are verified. |

## Still Partial Or Outstanding

| Area | Current State | Production Gap |
| --- | --- | --- |
| Persistence | JSON-backed Express/serverless store in `data/downtown-perks-db.json` and `/tmp` on Vercel. | Not a normalized production DB. No migrations, indexes, relational constraints, durable multi-region persistence, or transaction guarantees. |
| Backend architecture | Large monolithic `server.ts` plus `backend/modules/ai`. | Does not implement the required `src/server/<domain>/{controller,service,repository,validator,tests}` module tree. |
| Authentication/RBAC | `base44.auth.me()` and local user fallbacks exist; role labels and permissions are seeded. | Server-side permission enforcement is not comprehensive across all mutations. |
| Integrations | Integration records exist. | Production credentials are pending for OpenAI, Stripe, Supabase, Twilio, n8n, Google Sheets, Google Maps, and storage. External calls cannot be considered complete. |
| AI | Backend agent gateway and tool registry exist; live `/api/agent/query` returns structured fallback/tool data. | Live provider reports `configured:false`; no verified OpenAI responses, image generation, embeddings, moderation, or durable semantic memory in production. |
| Stripe | Checkout and promotion logic exist; local env has Stripe variable names. | Live Vercel integration status reports `pending_credentials`; paid checkout is not production-ready. |
| Map data quality | 515 map links in local data; `/api/map/entities` returns linked records. | At least 17 local map links lack coordinates. Some links are seed/import records and need classification before claiming all pins are real/complete. |
| Workflow engine | AutomationRun records and endpoints exist. | Workflows are status/run records, not a durable queue/orchestration engine with retries, DLQ, scheduling guarantees, and external delivery verification. |
| Testing | `npm run lint` and `npm run build` pass. | No broad automated E2E, accessibility, visual regression, or workflow tests are present in package scripts. |
| Mobile QA | CSS is improved for mobile-first admin surfaces. | Needs browser-device visual QA on iPhone 15, iPhone SE, Pixel, iPad, and desktop. |

## Live Route Smoke Test

Verified `200` for:

`/`, `/admin`, `/admin/platform`, `/admin/partner`, `/admin/properties`, `/admin/buildings`, `/admin/residents`, `/admin/segmentation`, `/admin/perks`, `/admin/events`, `/admin/engagement`, `/admin/announcements`, `/admin/surveys`, `/admin/reports`, `/admin/analytics`, `/admin/promotions`, `/admin/workspaces/dana`, `/admin/workspaces/waterloo-greenway`, `/partners`, `/partners/start`, `/partners/register`, `/partners/pricing`, `/partners/checkout`, `/workspace/home`, `/map`.

## Production Readiness Score

| Area | Score /10 | Notes |
| --- | ---: | --- |
| UI shell and navigation | 8 | Routes are live and more coherent. Needs visual device QA. |
| Directory/workspace UX | 7 | Major routes and workspace links exist. Some modules still rely on seeded/demo records. |
| Backend API coverage | 7 | Many endpoints exist, but monolithic JSON-backed implementation is not the target architecture. |
| Data model | 5 | Many entities exist, but no normalized DB/migrations/constraints. |
| Integrations | 3 | Records exist; live credentials are pending. |
| AI platform | 5 | Gateway/tools exist; live OpenAI is not configured. |
| Billing/promotions | 6 | DUDE2026 path works; paid Stripe production path pending credentials. |
| Map platform | 6 | Endpoint and links exist; coordinate/data-quality gaps remain. |
| RBAC/security | 4 | Permission concepts exist; server-side enforcement incomplete. |
| Testing/QA | 4 | Typecheck/build pass; no full regression suite. |

## Priority Fix List

1. Configure production environment variables for OpenAI, Stripe, Supabase, Twilio, n8n, Google Sheets, Google Maps, and storage, then retest integration endpoints.
2. Move the JSON store to a durable database with migrations and tenant-scoped constraints.
3. Add server-side permission guards to every mutating route.
4. Complete map data cleanup: coordinates, duplicate links, placeholder classification, and wrong-title detection.
5. Add workflow execution tests for checkout, promotion redemption, partner provisioning, perk redemption, event RSVP, QR scan, report run, and agent query.
6. Run device QA for the admin shell and directory pages on iPhone 15, iPhone SE, iPad, and desktop.
7. Split `server.ts` into domain modules or document why the monolith remains temporary.


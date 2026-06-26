# Downtown Perks Platform Regression & Completion Audit

Audit date: 2026-06-25  
Repository: `/Users/megdude/Downloads/BACKEND/downtown-perks-backend`

This is a production-readiness audit, not a redesign brief.

## Evidence Used

- Router inventory from `src/App.tsx`.
- API inventory from `server.ts`.
- Persisted entity counts from `data/downtown-perks-db.json`.
- Backend module inventory from `backend/modules`.
- Source references from admin/product pages under `src/pages`.
- Live 3014 probes verified `/api/admin/properties` and `/api/properties/ingest`; the ingest route correctly returns a credential-gated OpenAI 503 when `OPENAI_API_KEY` is absent.
- `npm run lint` passed on 2026-06-25.
- `npm run build` passed on 2026-06-25, with only the existing large bundle warning.
- `THE SHORE.xlsx` was parsed and imported into the canonical The Shore building/workspace records.

## Current Platform Snapshot

The 3014 app has real implementation depth: one Express backend, persisted JSON data, admin routes, partner lifecycle routes, map APIs, AI gateway endpoints, promotion/checkout APIs, partner lead capture, tenant provisioning, audit helpers, and analytics helpers.

It is not production-ready yet because the implementation is still concentrated in `server.ts`, many workflows are local-file-backed, integrations are credential-gated, 5173 product route testing is not proven in this repo, and several modules remain partially wired rather than fully operational.

## Latest Data Reconciliation: The Shore

The attached workbook `/Users/megdude/Documents/CITY DATABSES /CITY DATABSES /THE SHORE.xlsx` was imported into the existing The Shore operating records instead of creating a duplicate property.

| Record | Result |
| --- | ---: |
| Canonical building | `bldg_shore` |
| Canonical tenant | `tenant_the-shore` |
| Canonical workspace | `workspace_the-shore` |
| Imported residents | 194 |
| Imported occupied units | 84 |
| Residents with email | 99 |
| Residents with phone | 83 |
| Replaced prior demo Shore residents | 2 |
| Replaced prior demo Shore units | 2 |

The import created deterministic resident/unit records, updated The Shore building counts, updated partner analytics metadata, and wrote `audit_the-shore_resident_import` plus `analytics_the-shore_resident_import`.

## Inventory Summary

### Product Surface

| Module | Status | Evidence | Primary Gap |
| --- | --- | --- | --- |
| Marketing | Partial | `/`, `/welcome`, `/partners` routes exist. | 5173 product surface not verified in this audit. |
| Resident | Partial | 196 resident records exist after importing 194 real The Shore residents; `/api/residents` exists. | End-to-end resident enrollment/card/saved workflow not proven. |
| Partner | Built/Partial | `/partners/*`, `/workspace/*`, partner lifecycle and provisioning exist. | Checkout/payment runtime and tenant isolation QA not proven. |
| Map | Partial | `/map`, `/api/map/entities`, `/api/map/pins`, 515 map links, 541 map entities. | Product map actions not verified live; QR and event/report attribution incomplete. |
| Search | Partial | Page-level searches exist. | No dedicated global search API/workflow found. |
| AI | Partial | `backend/modules/ai`, `/api/agent/*`, legacy `/api/ai/*`, 39 insights. | Provider credentials and product SDK integration not proven. |
| Registration | Built/Partial | `/api/partner-leads`, `/partners/register`, 3 registration records. | External lead sync is not active. |
| Pricing | Built/Partial | 54 product offerings, promotions, checkout API. | Paid Stripe checkout credentials not configured/proven. |
| Events | Partial | Event APIs, 2 events, 1 RSVP. | Follow-up delivery automation not active. |
| Perks | Built/Partial | 26 perks, CRUD UI, redemption APIs, 5 redemptions. | Legacy DELETE still risks hard removal. |
| Saved | Missing | No dedicated saved-item entity/API verified. | Build resident saved items and reporting. |
| Card | Partial | Resident/card concepts appear in data model. | Issuance/scanning/access workflow not proven. |
| Properties | Partial | `/admin/properties`, `/api/properties`, properties ingest route now uses backend OpenAI provider orchestration. | Tenant-scoped property operations and tests incomplete. |
| Hotels | Partial | Hotel-like partners/entities exist. | Dedicated hotel operations flow not proven. |
| Venues | Partial | Venue-like partners/entities exist. | Dedicated venue operations flow not proven. |
| Brands | Partial | Brand-like partners/entities exist. | Dedicated brand workspace flow not proven. |
| Civic | Partial | Civic-like partners/entities exist. | Dedicated civic program flow not proven. |
| Campaigns | Partial | 374 campaigns, campaign APIs. | Audience resolution, delivery channels, and attribution incomplete. |
| Reports | Partial | 358 partner reports, report APIs. | Report generation/export execution not fully proven. |

### Operations Surface

| Module | Status | Evidence | Primary Gap |
| --- | --- | --- | --- |
| Dashboard | Partial | `/admin`, `/admin/home`, `/admin/dashboard`. | Live runtime verification and unified scorecard behavior not proven. |
| Partner Directory | Partial | 353 partners, `/api/partners`, `/admin/partner`. | Detail/update workflow and permission checks incomplete. |
| Properties | Partial | `/admin/properties`, `/api/properties`, CSV export UI. | Full domain service extraction and tests missing. |
| Buildings | Partial | 3 buildings, units/residents/amenities/docs tabs. | Some rail/actions use generic entity writes; server-side permissions inconsistent. |
| Residents | Partial | 196 residents, including 194 workbook-backed The Shore residents linked to `workspace_the-shore`. | Enrollment/card/messaging workflows incomplete. |
| Segmentation | Partial | 3 CRM segments, broadcast/audit writes. | External messaging delivery inactive. |
| Partner Portal | Partial | Portal and workspace views exist. | Real auth/login-to-tenant flow not proven. |
| Perks | Built/Partial | Admin perks table, create/edit/archive, redemption analytics. | Soft-delete consistency and eligibility engine incomplete. |
| Events | Partial | CRUD-like UI/API present. | Reminder/follow-up provider execution missing. |
| Engagement | Partial | Broadcast and campaign surfaces. | Real delivery and channel tracking missing. |
| Announcements | Partial | Announcement page and records exist. | Delivery status and notification provider not proven. |
| Surveys | Partial | Survey templates, forms, responses, exports. | Tally/Jotform/webhook/n8n flow inactive. |
| Reports | Partial | Report page and report containers exist. | Automated scheduled reports missing. |
| Analytics | Partial | `/api/analytics/summary`, 9 analytics events. | Product-wide instrumentation sparse. |
| Promotions | Built/Partial | DUDE2026 seed, validate/redeem endpoints, checkout bypass logic. | Stripe paid path and webhook not configured/proven. |

## Regression Findings

| Severity | Module | Feature | Regression / Risk | Recommended Fix |
| --- | --- | --- | --- | --- |
| High | Product runtime | 5173 product app | This repo verifies the 3014 operations app; 5173 product runtime remains unverified in this pass. | Run a separate 5173 smoke and product-to-operations audit. |
| Critical | Perks | Delete semantics | `/api/perks/:id` DELETE route exists; spec requires soft delete only. | Replace hard delete with `deleted_at`, archived status, audit, analytics. |
| High | Billing | Stripe paid checkout | Stripe provider is code-ready but credential-gated. | Configure Stripe env, add webhook, test paid and promo paths. |
| High | Integrations | Provider workflows | Tally, Twilio, Supabase, n8n, OpenAI, Sheets, Google Maps are not proven active. | Add credential checks, provider smoke tests, and disabled UI states. |
| High | Testing | Workflow coverage | `npm run lint` and `npm run build` pass, but automated workflow/API tests are still missing. | Add API contract and E2E tests for provisioning, promotions, redemptions, campaigns, QR, and AI. |
| Medium | Architecture | Domain boundaries | Most backend logic still lives in `server.ts`. | Extract domains into modules with controller/service/repository/schema. |
| Medium | AI | Provider readiness | Agent module exists but provider runtime is not proven. | Verify backend env, OpenAI provider, streaming, logs, and product SDK. |
| Medium | Map | Product wiring | Backend map entities exist, but product actions are not runtime-proven. | Test pin view/select/directions/save/share/redeem/RSVP analytics. |
| Medium | Mobile | Data tables/tabs | Several pages use wide tables and rails. | Finish mobile card/table fallback patterns across all admin tables. |

## Workflow Audit

| Workflow | Status | Trigger | Backend Execution | Automation | Analytics | Audit | Reporting |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Partner Provisioning | Built/Partial | Partner lifecycle, partner API, provisioning sync | Creates tenant, workspace, partner, modules, reports, analytics containers | Local only | Partial | Built | Built/Partial |
| Promotion Checkout | Built/Partial | `/api/promotions/validate`, `/api/checkout/session` | DUDE2026 logic supports $0 total | Local only | Built/Partial | Built | Partial |
| Resident Enrollment | Partial | `/api/residents` | Creates/updates resident records | Missing | Partial | Partial | Partial |
| Redemption Verification | Partial | `/api/perks/:id/redeem` | Checks active status and duplicate conditions | Missing | Built/Partial | Built | Partial |
| Event RSVP | Partial | `/api/events/:id/rsvp` | Creates RSVP and increments counts | Reminder not active | Built/Partial | Built | Partial |
| Event Follow-Up | Partial | `/api/events/:id/follow-up` | Queues local automation run | Provider inactive | Partial | Built | Missing |
| Campaign Publish | Partial | `/api/campaigns/:id/publish` | Status transition and event records | Delivery inactive | Built/Partial | Built | Partial |
| Survey Processing | Partial | Survey entities and seed automations | Local records only | Provider inactive | Partial | Partial | Partial |
| Survey Escalation | Outstanding | Survey response thresholds | Not proven | Missing | Missing | Missing | Missing |
| Partner Monthly Reports | Partial | Report containers | Report records exist | Scheduling inactive | Partial | Partial | Partial |
| Property Reports | Partial | Report page/API | Report containers exist | Scheduling inactive | Partial | Partial | Partial |
| Resident Bulk Updates | Outstanding | Bulk admin action | No dedicated bulk API verified | Missing | Missing | Missing | Missing |

## Integration Audit

Visible integration records must not be treated as working integrations. Current implementation is best classified as connected but inactive or planned until credentials and smoke tests pass.

| Integration | Status | Evidence | Gap |
| --- | --- | --- | --- |
| OpenAI | Connected but incomplete | AI module/endpoints exist. | Provider key/runtime not proven. |
| n8n | Planned only | Automation records reference orchestration concepts. | No active run execution proven. |
| Supabase | Planned only | Local JSON persistence currently used. | No live Supabase store proof. |
| Twilio Verify | Planned only | Integration status expected. | No phone verification proof. |
| Twilio Messaging | Planned only | Messaging journeys/log entities exist. | No SMS send proof. |
| Tally / Jotform / SurveyJS | UI/data only | SurveyProviderForm exists. | Webhook intake not proven. |
| Google Sheets / Reports DB | Planned only | Export routes exist. | Sheets sync not proven. |
| Stripe | Connected but incomplete | Checkout endpoint exists. | Missing paid checkout/webhook proof. |

## Map Audit

| Requirement | Status | Evidence | Gap |
| --- | --- | --- | --- |
| Backend entities | Built/Partial | 541 map entities and 515 links in persisted data. | Need null-coordinate and relation audit. |
| Coordinates | Partial | Map APIs exist. | Not every record verified. |
| Partner relationship | Partial | Partner/location records exist. | Need per-pin partner linkage report. |
| Campaign/perk/event relationship | Partial | APIs enrich map entities. | Need full per-pin relationship completeness scan. |
| Analytics | Partial | `/api/map/events` exists. | Only 9 analytics events persisted. |
| Reports | Partial | Partner report containers exist. | Live map-to-report update not proven. |
| Audit | Partial | Map event API writes audit in code. | Runtime not verified. |
| Fake maps | Needs visual QA | Product map uses real Leaflet component. | Decorative/fake instances need rendered sweep. |

## AI Audit

| Capability | Status | Evidence | Gap |
| --- | --- | --- | --- |
| Backend gateway | Partial | `/api/agent/query`, `/api/agent/stream`, module files. | Runtime/provider not proven. |
| Structured context | Partial | `contextEngine.ts` exists. | Needs product/admin integration proof. |
| Permission filtering | Partial | Guardrail/tool layer exists. | Server-side authorization not consistently proven. |
| Live operational data | Partial | Tools can query platform entities. | Needs route-level tests. |
| Recommendations | Partial | 39 `AiInsight` rows. | Need generation/evaluation proof. |
| Report summaries | Partial | `/api/ai/report-summary`. | Provider/config not proven. |
| Campaign recommendations | Partial | `/api/agent/campaigns`. | End-to-end campaign write not proven. |
| Survey summaries | Partial | `/api/ai/survey-summary`. | Survey provider flow not active. |

## Production Blockers

1. Fix hard-delete risk for `/api/perks/:id`.
2. Configure or explicitly disable external integrations with clear setup states.
3. Add API contract tests for partner provisioning, promotion checkout, perk redemption, event RSVP, campaign publish, QR scan, and AI query.
4. Verify 5173 product routes separately; this repo currently proves 3014-side routes and shared operating endpoints.
5. Add a production database migration path for the imported The Shore residents, units, audit log, and analytics event.

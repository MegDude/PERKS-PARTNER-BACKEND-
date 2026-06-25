# Downtown Perks Backend 25 June ZIP Import Audit

Source archive:

`/Users/megdude/Downloads/BACKEND/downtown-perks-backend25 june.zip`

Temp extraction path used for audit:

`/private/tmp/dp_zip25.moBhpe`

## Classification

The archive is an earlier, thinner build of the current 3014 app. It contains the same page and component inventory already present in this repository, including:

- `src/pages/PropertiesManagement.tsx`
- `src/pages/MapOS.tsx`
- `src/pages/PartnerDashboard.tsx`
- `src/pages/Surveys.tsx`
- `src/pages/Events.tsx`
- `src/pages/Reports.tsx`
- `src/components/map/unified/UnifiedMapShell.tsx`
- `src/api/base44Client.ts`
- `server.ts`

No source file existed only in the ZIP after comparing the extracted `src/` tree against the current app.

## Backend Decision

The ZIP `server.ts` is a 244-line mock server with in-memory arrays for properties, perks, and redemptions. It also includes direct Gemini property ingestion and basic insights routes.

The current app already contains those useful capabilities, but in a production-oriented platform layer:

- Persisted entity-backed API client instead of hardcoded `base44` arrays.
- Property ingestion endpoint retained at `/api/properties/ingest`.
- Insights endpoints retained at `/api/insights/overview`, `/api/insights/trends`, and `/api/insights/top-perks`.
- Operational APIs for map entities, pins, perks, redemptions, events, RSVPs, campaigns, residents, partners, reports, analytics, automations, integrations, QR, AI, products, pricing, partner leads, checkout, and intelligence import.
- Audit logging and analytics emission on operational mutations.
- CSV product/price import and partner lead export support.
- Safe Stripe checkout fallback when credentials are not configured.

Because the ZIP backend would remove the current production wiring and replace it with local mock arrays, it was not copied over.

## Frontend Decision

The ZIP frontend modules are already represented in the current app. Where files differ, the current app contains the newer platform refinements, including:

- Unified admin shell routing.
- Platform command center routes.
- Partner lifecycle/workspace routes.
- Property portfolio workspace linking.
- Map data sync action.
- Improved admin property search, metrics, and empty states.
- Shared design tokens and mobile polish.

No ZIP frontend file was imported wholesale because that would remove newer platform navigation, route reconciliation, and backend-connected UI.

## Result

All useful module/backend functionality from the ZIP is either already present or superseded by the current 3014 implementation. The correct action was to preserve the current app, document the audit, then validate, commit, push, and deploy the integrated platform build.

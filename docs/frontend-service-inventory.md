# Frontend Service Inventory

## 3014

3014 uses `src/api/base44Client.ts` as a local API adapter over `/api/entities`, `/api/functions`, auth, and integrations.

Important frontend data consumers:

- `BackendWorkspace.tsx`: health, tenant provisioning, entity totals.
- `Home.tsx`: platform welcome module counts and integration status.
- `PropertiesManagement.tsx`: `/api/admin/properties`, `/api/properties`, `/api/map-data/import`.
- `BuildingsManagement.tsx`: entities for buildings, flats, residents, amenities, surveys, documents, audit logs.
- `DowntownPerks.tsx`: perks, partners, campaigns, redemptions.
- `Events.tsx`: events and RSVPs.
- `Surveys.tsx`: survey library, journeys, integrations, automations, segments.
- `PartnerLifecycle.tsx`: partner registration, provisioning, workspace actions, assistant.
- `PartnerDashboard.tsx` and `PartnerPortal.tsx`: partner performance and operations.

## 5173

5173 uses a separate Base44 SDK client and product-local repositories. It has route-level product surfaces for map, perks, events, card, partner marketing, partner lifecycle, partner workspace, and marketing.

## Reconciliation Requirement

5173 product clients should consume 3014 operational endpoints for:

- map entities and map interaction analytics
- perks and redemptions
- events and RSVPs
- campaigns and publishing states
- QR scans and destinations
- AI recommendations and summaries
- reports and analytics summaries
- partner workspace provisioning and workspace records


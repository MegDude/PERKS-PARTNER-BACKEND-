# Module Sweep + Refactor Audit

Date: 2026-06-25

Scope:

- `http://localhost:3014/admin/*`
- Current focus route: `/admin/segmentation`
- Backend entity API and routed admin modules

## Fixed In This Sweep

### Segmentation

Status before sweep:

- Resident segmentation loaded resident records and derived groups client-side.
- `Message Segment` appeared as an available action but had no handler.
- `handleSendBulkEmail` was empty.
- Resident profile modal state existed but was not connected to a visible action.

Action taken:

- Wired segment messaging to persisted records.
- Segment messages now create:
  - `ManagementNotification`
  - `Broadcast`
  - `TenantAuditLog`
- Added resident selection checkboxes.
- Added a segment message dialog with required subject/body validation.
- Added resident profile view action.

### Engagement Hub

Status before sweep:

- Broadcast list was local component state.
- New broadcasts only updated the current browser session.
- Broadcast actions did not persist to backend entities or audit logs.

Action taken:

- Broadcasts now load from `base44.entities.Broadcast.list()`.
- New broadcasts now create persisted `Broadcast` records.
- New broadcasts now create `TenantAuditLog` records.
- Added loading and empty states for broadcast activity.

## Verified

- `npm run lint` passes.

## Remaining Refactor Candidates

These are not routed modules and were not expanded during this pass to avoid adding duplicate UI:

- `src/components/PerkMap.tsx`
- `src/components/BoopEventsPanel.tsx`
- `src/components/dashboard/DynamicBuildingOverview.tsx`
- `src/components/dashboard/StatsCards.tsx`
- `src/components/tenants/TenantDetailsSheet.tsx`
- `src/components/tenants/TenantModal.tsx`
- `src/components/PartnerMessaging.tsx`

Recommendation:

Keep these only if they are compatibility shims for older imports. If no route or component imports them in the next cleanup cycle, remove them instead of rebuilding parallel implementations.

## Known Cross-App Gap

The 3014 operations platform is wired and deployed with the imported operational dataset. The separate 5173 product build still requires its own migration pass to consume the 3014 APIs directly for map/product actions. This is documented in the existing platform integration docs and should not be treated as a 3014 module failure.

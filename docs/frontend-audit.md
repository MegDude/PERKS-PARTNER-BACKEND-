# Frontend Audit

## Route Ownership

| Route Group | Owner | Status | Required Action |
| --- | --- | --- | --- |
| `/`, `/welcome` | Experience layer | Partial | Keep as gateway/product entry; move business logic to services. |
| `/map` | Resident/partner product | Partial | Verify product actions write map events, analytics, audit, and reports. |
| `/partners/*` | Partner lifecycle | Built/Partial | Replace localStorage/session assumptions with backend lead, checkout, and provisioning state. |
| `/workspace/*` | Partner workspace | Partial | Ensure all tabs are tenant-scoped domain views, not generic table renderers. |
| `/admin/*` | Operations platform | Partial | Keep as control system, but remove page-owned business logic. |

## Page-Level Findings

- `PartnerLifecycle.tsx` handles signup, pricing, checkout, provisioning, workspace home, AI prompts, quick actions, and workspace tabs in one file.
- `PropertiesManagement.tsx`, `BuildingsManagement.tsx`, `DowntownPerks.tsx`, `Surveys.tsx`, and `Promotions.tsx` each define local UI primitives instead of using one shared component library.
- Several pages write directly through `base44.entities.*`, which bypasses explicit domain service contracts.
- Admin pages have improved structure but need a shared table/card/mobile pattern.
- Mobile behavior needs route-by-route verification.

## Required Frontend Reconciliation

1. Create `src/services/domain/*` clients for partners, properties, buildings, residents, perks, events, campaigns, surveys, reports, promotions, billing, AI, and map.
2. Create shared `PageHeader`, `ContextToolbar`, `MetricMatrix`, `DataTable`, `ActionRail`, `Drawer`, `FormField`, `SummaryTable`, and `EmptyState`.
3. Replace page-local helper components.
4. Remove direct generic entity mutations from production workflows.
5. Add route-level loading, empty, error, permission, and offline states.
6. Add mobile-specific table-to-card behavior.
7. Verify 5173 product routes separately against shared APIs.

# Frontend Gap Analysis

## Route Inventory

Top-level product routes:

- `/`
- `/map`
- `/welcome`
- `/partners`
- `/partners/*`
- `/workspace`
- `/workspace/*`
- `/partner/workspace`
- `/partner-portal`
- `/partner-workspace`
- `/partner-workspace/*`

Admin routes:

- `/admin`
- `/admin/home`
- `/admin/platform`
- `/admin/dashboard`
- `/admin/buildings`
- `/admin/properties`
- `/admin/buildings/:tab`
- `/admin/buildings/:buildingId/*`
- `/admin/engagement`
- `/admin/perks`
- `/admin/about`
- `/admin/developer-engagement`
- `/admin/events`
- `/admin/events/:eventId`
- `/admin/partner`
- `/admin/partner-portal`
- `/admin/residents`
- `/admin/segmentation`
- `/admin/analytics`
- `/admin/settings`
- `/admin/reports`
- `/admin/surveys`
- `/admin/announcements`
- `/admin/promotions`

## What Exists

- Shared layout via `PartnerDashboardLayout`.
- Admin surfaces for properties, buildings, partner dashboard, partner portal, perks, events, engagement, surveys, reports, analytics, promotions, and platform command center.
- Partner lifecycle routes in `PartnerLifecycle.tsx`.
- Workspace home and workspace tab surfaces.
- Map route in `MapOS.tsx`.
- UI components for tabs, cards, inputs, tables, modals, dashboards, and layout.
- Residents admin now has a real The Shore data set to render: 194 residents across 84 units linked to `workspace_the-shore`.

## Gaps

| Gap | Evidence | Risk | Fix |
| --- | --- | --- | --- |
| 5173 product app not verified | Current repo proves 3014 route config; live 5173 probe not performed here. | Product and operations linkage remains unproven. | Run separate 5173 smoke audit against live product checkout. |
| Direct generic entity writes in UI | Multiple pages use `base44.entities.*`. | Business logic may live in UI and bypass domain APIs. | Replace key mutations with typed service clients/domain endpoints. |
| Route duplication/redirects | Partner workspace aliases redirect to workspace home. | Some user journeys may lose context. | Keep aliases but preserve tenant/query context. |
| Mobile behavior not fully verified | Tables and rails exist across admin pages. | Hidden columns and overflow issues can recur. | Add mobile layout tests for every table/tab rail. |
| UI-only visible states | Some integration/automation/status cards can render without active provider. | False confidence during walkthroughs. | Add inactive/provider-needed states tied to integration status. |
| Accessibility incomplete | ARIA/focus improvements started on tabs. | Other controls need keyboard/focus review. | Run axe/manual keyboard pass. |
| Shore resident workflow after import | The data now exists, but enrollment/card/messaging flows still depend on generic resident UI. | Walkthrough can show real residents, but not a fully tested resident lifecycle. | Add create/edit/archive resident drawers, activity timeline, and enrollment/card workflow tests. |

## Frontend Priority

1. Runtime route smoke test for `/`, `/partners`, `/partners/start`, `/partners/register`, `/partners/pricing`, `/partners/checkout`, `/workspace/home`, and all admin routes.
2. Mobile pass for admin tables and workspace metric strips.
3. Replace UI-owned business actions with service clients.
4. Add clear disabled states for missing provider credentials.

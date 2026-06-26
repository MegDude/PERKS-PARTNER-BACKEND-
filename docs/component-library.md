# Component Library Reconciliation

## Existing Shared Components

- `src/components/ui/Button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/OperationalSurface.tsx`
- `src/components/ui/Typography.tsx`

## Duplicate Local Components Found

- `Field`: PartnerLifecycle, DowntownPerks, Promotions, BuildingsManagement.
- `Panel`: Home, Surveys, DowntownPerks.
- `Metric`: BuildingsManagement, DowntownPerks, Promotions.
- `SummaryTable`: BackendWorkspace, PlatformCommandCenter, PropertiesManagement.
- `SearchBox`: BuildingsManagement and page-local search inputs elsewhere.
- `Toolbar`: BuildingsManagement and repeated ad hoc action rails.
- `SectionCard`: PartnerLifecycle and other page-local shells.

## Required Shared Components

| Component | Purpose |
| --- | --- |
| `PageHeader` | Standard eyebrow/title/body/actions. |
| `ContextToolbar` | Search, filters, export, create, view controls. |
| `MetricMatrix` | Compact metric summaries replacing long card lists. |
| `SummaryTable` | Clickable operational summaries. |
| `DataTable` | Sort/filter/export/mobile card fallback. |
| `ActionRail` | Horizontal module/tab actions with routing. |
| `EntityDrawer` | Detail/edit drawer, mobile bottom sheet. |
| `FormField` | Label, help, error, input/textarea/select. |
| `StatusBadge` | Shared status styles. |
| `Timeline` | Audit/activity events. |
| `EmptyState` | Consistent empty state with CTA. |
| `LoadingState` | Skeletons. |
| `ErrorState` | Retry/correlation ID. |

First replacement targets: SummaryTable, Field, Metric, SearchBox, Panel.

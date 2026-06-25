# Downtown Perks Platform Constitution

# Module 01: Platform Dashboard & Command Center

## 1. Purpose

The Platform Dashboard & Command Center is the authenticated operating center for the localhost:3014 Downtown Perks platform. It is not a marketing page, reporting-only dashboard, static KPI board, or decorative admin landing page.

It must answer four operational questions immediately:

- What needs attention?
- What changed since the user was last here?
- What should the user do next?
- How is the selected organization, workspace, or platform performing?

Every visible element must be backed by backend logic. Every action must route to a persisted workflow, create an audit event, update the UI, and respect permissions.

## 2. Product Vision

The Command Center turns Downtown Perks into one operating system for partner, property, resident, campaign, event, perk, survey, billing, and reporting operations.

It must feel closer to a production platform console than a website dashboard:

- Super admins see the entire ecosystem.
- Platform admins see cross-organization performance and work queues.
- Partner and property operators see only their workspace and next actions.
- Analysts see reporting, trends, and exports.
- Viewers see read-only operational status.

The Command Center is the entry point from which every module can be discovered, monitored, acted on, and audited.

## 3. User Personas

### Super Admin

Owns platform-wide health, tenant provisioning, module readiness, billing health, audit trails, and system alerts.

### Platform Admin

Manages partners, properties, campaigns, events, perks, surveys, reports, and operational issues across multiple organizations.

### Organization Owner

Owns one organization or property group. Needs performance, billing, team, campaigns, events, locations, and reports.

### Partner Manager

Runs offers, events, campaigns, QR activations, messages, reports, and day-to-day workspace tasks.

### Property Manager

Manages buildings, residents, amenities, surveys, QR placements, communications, engagement, and property reports.

### Analyst

Uses read-heavy analytics, exports, dashboards, recommendations, and scheduled reports.

### Viewer

Needs safe read-only visibility without mutation access.

## 4. Information Architecture

Primary Command Center structure:

```text
Command Center
├── Workspace Header
├── Context Toolbar
├── Today's Summary
├── Priority Actions
├── Operational KPI Matrix
├── Activity Feed
├── Task Center
├── Performance Snapshot
├── Recommendations
├── Module Health
├── Recent Reports
└── Inspector Drawer
```

Data domains surfaced:

```text
Organizations
Partners
Properties
Buildings
Residents
Perks
Events
Campaigns
Surveys
Messages
Reports
Analytics
Billing
Audit
Automation
System Health
```

## 5. Navigation Architecture

The Command Center must inherit the shared AppShell navigation.

Top-level admin navigation:

```text
Overview
Platform
Network
Programs
Communication
Insights
Administration
```

Canonical routes:

```text
/admin
/admin/dashboard
/admin/platform
/admin/partner
/admin/properties
/admin/buildings
/admin/residents
/admin/segmentation
/admin/perks
/admin/events
/admin/engagement
/admin/surveys
/admin/reports
/admin/analytics
/admin/billing
/admin/audit-logs
/admin/settings
```

All navigation labels must be product-facing. Do not expose raw paths, table names, hash routes, query-string internals, or prototype labels.

## 6. Desktop Layout

Desktop shell:

```text
Left Sidebar: 240px
Content max width: 1320px
Outer max width: 1440px
Gutters: 24px
Section rhythm: 24 / 32 / 48 / 64px
```

Desktop content order:

```text
Workspace Header
Context Toolbar
Summary Matrix
Priority Actions + Activity Feed
KPI Matrix
Performance + Recommendations
Module Health + Reports
Inspector Drawer
```

Use a 12-column layout:

- Summary matrix spans 12 columns.
- Priority Actions spans 5 columns.
- Activity Feed spans 7 columns.
- KPI Matrix spans 12 columns.
- Performance spans 8 columns.
- Recommendations spans 4 columns.
- Module Health spans 7 columns.
- Recent Reports spans 5 columns.

## 7. Tablet Layout

Tablet layout uses a two-column content grid.

Rules:

- Sidebar collapses to icon rail or drawer.
- Header controls wrap into two rows.
- KPI matrix becomes two columns.
- Activity and tasks stack in source order.
- Inspector drawer becomes 80 percent width.
- Tables switch to horizontal scroll with sticky first column only where necessary.

## 8. Mobile Layout

Mobile layout is not a shrunken desktop.

Mobile order:

```text
Mobile Header
Workspace Switcher
Today Summary Carousel
Priority Actions
Search / Command Button
KPI Stack
Activity Feed
Tasks
Recommendations
Module Shortcuts
Bottom Action Bar
```

Rules:

- Single column only.
- Touch targets minimum 44px.
- Drawers become full-screen bottom sheets.
- Tables become stacked entity cards.
- Bulk actions collapse behind selection mode.
- Primary create action remains reachable from sticky bottom action bar.

## 9. Responsive Rules

Breakpoints:

```text
mobile: < 768px
tablet: 768px - 1023px
desktop: 1024px - 1439px
wide: >= 1440px
```

Grid behavior:

- Desktop: 12 columns.
- Tablet: 2 columns.
- Mobile: 1 column.

No component may create horizontal page overflow. Only data tables may scroll horizontally inside their own container.

## 10. Complete UX Flows

### Flow: Daily Operator Entry

```text
Login
→ Resolve user
→ Resolve memberships
→ Resolve current organization/workspace
→ Load permissions
→ Load dashboard summary
→ Show priority actions
→ User opens task
→ Inspector drawer opens
→ User completes action
→ Backend persists change
→ Audit event written
→ Activity feed updates
→ KPI invalidates and refreshes
```

### Flow: Super Admin Triage

```text
Open /admin
→ Platform scope selected
→ System health loaded
→ Alerts sorted by severity
→ Admin opens alert
→ Related record shown in drawer
→ Admin assigns/resolves/escalates
→ Notification sent
→ Audit event written
```

### Flow: Quick Create Campaign

```text
Open Command Center
→ Quick Create
→ Campaign
→ Select organization
→ Select campaign type
→ Create draft
→ Redirect to campaign drawer/page
→ Save draft
→ Audit event written
```

### Flow: Workspace Switching

```text
Open workspace selector
→ List permitted organizations
→ Select organization
→ Persist selection
→ Clear tenant-scoped cache
→ Reload scoped KPIs/tasks/activity
→ Confirm no cross-tenant data leakage
```

## 11. User Journey Maps

### Super Admin Journey

```text
Needs platform visibility
→ Opens Command Center
→ Reviews system alerts
→ Checks module health
→ Opens tenant issue
→ Resolves or assigns
→ Confirms audit trail
```

### Partner Manager Journey

```text
Needs to know what to launch next
→ Opens workspace dashboard
→ Reads recommendations
→ Opens campaign suggestion
→ Creates offer/event/campaign
→ Tracks performance next day
```

### Property Manager Journey

```text
Needs resident engagement status
→ Opens property workspace
→ Reviews QR scans, surveys, residents
→ Sends message or launches survey
→ Tracks responses and reports
```

## 12. Screen Hierarchy

Priority order:

1. Critical alerts and permission blockers.
2. Workspace identity and current scope.
3. Priority actions.
4. Operational KPIs.
5. Recent activity.
6. Tasks assigned to user.
7. Performance and recommendations.
8. Module health.
9. Reports and exports.

No decorative or fake visualization may appear above operational content.

## 13. Component Inventory

Shared components required:

- AppShell
- SidebarNav
- WorkspaceHeader
- WorkspaceSwitcher
- ContextToolbar
- CommandSearch
- QuickCreateMenu
- NotificationCenter
- MetricCard
- KpiMatrix
- PriorityActionList
- ActivityFeed
- TaskList
- RecommendationCard
- ModuleHealthGrid
- ReportPreviewList
- DataTable
- InspectorDrawer
- EntityDrawer
- ConfirmationModal
- EmptyState
- LoadingState
- ErrorState
- PermissionState
- StatusBadge
- TrendBadge
- AuditTimeline
- MobileBottomActionBar

## 14. Component Specifications

### MetricCard

Required props:

```ts
type MetricCardProps = {
  id: string;
  label: string;
  value: string | number;
  trend?: number;
  comparisonLabel?: string;
  icon: LucideIcon;
  status?: "healthy" | "attention" | "critical" | "neutral";
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
};
```

Rules:

- Must render real data.
- Must show loading skeleton while data loads.
- Must show permission state if user cannot view metric.
- Must not hardcode fake values.

### PriorityActionList

Actions must include:

- title
- description
- severity
- entity type
- entity id
- due date
- primary action
- dismiss/assign when permitted

### InspectorDrawer

The drawer must support:

- selected entity summary
- timeline
- actions
- related reports
- audit history
- permission-aware buttons

## 15. Design System Compliance

The Command Center must reuse the 3014 platform design system.

Do:

- Use shared AppShell.
- Use shared cards, buttons, tabs, tables, badges, inputs, drawers.
- Use backend UI typography, not public marketing typography.
- Use operational surfaces.

Do not:

- Introduce a public marketing hero.
- Use decorative maps.
- Use fake charts.
- Use glassmorphism.
- Use custom one-off page layout.
- Use gray text below accessible contrast.

## 16. Typography Rules

Font family:

```css
font-family: Inter, system-ui, sans-serif;
```

Scale:

```text
Display: 48px / 56px
H1: 36px / 44px
H2: 28px / 36px
H3: 22px / 30px
Body: 16px / 24px
Small: 14px / 20px
Caption: 12px / 16px
Eyebrow: 11px uppercase, 0.12em tracking
```

Admin pages must not use oversized public serif hero treatments.

## 17. Spacing Rules

Tokens:

```text
4px
8px
12px
16px
24px
32px
48px
64px
```

Rules:

- Page padding desktop: 32px.
- Page padding mobile: 16px.
- Card padding desktop: 24px.
- Card padding mobile: 16px.
- Section gaps: 24px or 32px.
- No arbitrary stacked margins.

## 18. Color Rules

Core colors:

```text
Background: #F7F8FB
Surface: #FFFFFF
Primary Navy: #0B1F33
Secondary Navy: #132238
Gold: #C8A96A
Border: rgba(11,31,51,0.08)
Muted Text: rgba(11,31,51,0.62)
Critical: #B42318
Warning: #B54708
Success: #027A48
Info: #175CD3
```

No decorative gradients, fake glow panels, or unrelated palettes.

## 19. Interaction Rules

Rules:

- Every button must have a handler, route, or disabled reason.
- Hover states must not hide icons.
- Focus states must be visible.
- Destructive actions require confirmation.
- Long-running actions show loading states.
- Completed actions show success states.
- Failed actions show error states with retry.

## 20. Motion Specifications

Motion is functional only.

Durations:

```text
Hover: 120ms
Drawer open: 180ms
Modal open: 160ms
Toast: 200ms
Skeleton pulse: 1200ms
```

Respect `prefers-reduced-motion`.

## 21. Empty States

Empty states must help the user complete the workflow.

Examples:

- No tasks: "No priority tasks right now."
- No activity: "No activity has been recorded for this scope yet."
- No reports: "Create or schedule the first report."
- No recommendations: "Recommendations appear after activity is available."

Every empty state must include a permitted next action when one exists.

## 22. Loading States

Loading states:

- Header skeleton
- KPI skeleton cards
- Activity skeleton rows
- Task skeleton rows
- Drawer skeleton

Do not flash empty states before data resolves.

## 23. Error States

Every failed data request must show:

- human-readable message
- retry action
- support context id
- fallback route when appropriate

Backend errors must not expose stack traces to users.

## 24. Offline States

If network is unavailable:

- show offline banner
- preserve last known read-only cache
- disable mutations
- queue only explicitly supported actions
- show sync status when connection returns

## 25. Permission States

Permission-denied states must explain what is unavailable without leaking private data.

Examples:

- "You can view reports, but cannot export them."
- "Billing is restricted to owners and admins."
- "This organization is not available to your account."

## 26. Search Architecture

Global search indexes:

- organizations
- partners
- properties
- buildings
- residents
- perks
- events
- campaigns
- surveys
- reports
- invoices
- users
- audit logs

Search must support:

- fuzzy matching
- recent searches
- keyboard navigation
- permission scoping
- tenant isolation

## 27. Filter Architecture

Dashboard filters:

- workspace
- organization
- entity type
- status
- owner
- priority
- date range
- module
- district

Filters must be serializable in URL state only when safe. Sensitive filters must remain session state.

## 28. Sorting Rules

Default sorting:

- Priority actions: severity, due date, created time.
- Activity: newest first.
- Tasks: status, priority, due date.
- KPIs: configured display order.
- Module health: critical, attention, healthy.

## 29. Bulk Actions

Supported bulk actions:

- assign tasks
- mark notifications read
- export selected records
- archive selected tasks
- acknowledge alerts

Bulk actions require permission checks for every selected record.

## 30. Toolbar Architecture

Context toolbar includes:

- scope selector
- date range
- filters
- search
- quick create
- export
- refresh
- help

Toolbar must collapse into mobile action sheet.

## 31. Contextual Action Bar

Appears only when one or more records are selected.

Must show:

- selected count
- permitted actions
- clear selection
- bulk action loading/error states

## 32. Drawer Architecture

Drawer types:

- InspectorDrawer for read/inspect.
- EntityDrawer for quick edit.
- WorkflowDrawer for multi-step actions.
- AuditDrawer for history.

Desktop drawer width:

```text
480px default
75% for complex workflows
```

Mobile drawer:

```text
100% width bottom sheet/full screen
```

## 33. Modal Architecture

Use modals only for:

- confirmations
- destructive actions
- short blocking decisions
- payment/security interruptions

Do not use modals for complex editing. Use drawers or full pages.

## 34. Timeline Components

Timeline records must show:

- actor
- action
- entity
- timestamp
- before/after summary when available
- source module
- audit event link

## 35. Notification Components

Notification groups:

- system
- security
- billing
- campaigns
- events
- surveys
- partners
- properties
- reports

Notifications must support:

- mark read
- archive
- open related record
- bulk mark read

## 36. KPI Components

Required KPI categories:

- platform health
- partner activity
- property engagement
- resident engagement
- campaign performance
- perk performance
- event activity
- survey participation
- billing health
- system alerts

Each KPI must link to source detail.

## 37. Analytics Components

Analytics components must use meaningful operational data:

- line charts for time series
- bar charts for comparisons
- funnel charts for conversion
- tables for ranked entities
- trend badges for deltas

No decorative charts.

## 38. Reporting Components

Report preview list includes:

- report name
- report type
- scope
- last generated
- owner
- status
- export actions

Exports must be permissioned and audited.

## 39. Forms

Forms on the Command Center are limited to quick actions:

- create task
- assign task
- create note
- quick create entity
- dismiss alert
- schedule report

Complex forms belong in module-specific pages or drawers.

## 40. Validation Rules

Validation must exist in:

- frontend form schema
- API request schema
- service business rules
- database constraints where applicable

No required backend field may rely on frontend validation only.

## 41. Autosave Rules

Autosave applies only to drafts:

- task notes
- report draft configuration
- recommendation feedback

Autosave must show saved/saving/error state.

## 42. Draft Logic

Draft entities:

- campaign draft
- event draft
- survey draft
- report schedule draft
- announcement draft

Drafts require owner, organization, created_at, updated_at, and audit trail.

## 43. Conditional Logic

Conditional rendering depends on:

- role
- permission
- workspace status
- organization status
- entitlement
- feature flag
- data availability
- device size

Do not hide backend errors with conditional UI.

## 44. Business Rules

Rules:

- No unscoped private data.
- No cross-tenant records.
- No unaudited mutation.
- No hard delete.
- No fake metrics.
- No action without permission.
- No dashboard card without source endpoint.
- No workflow without success/error state.

## 45. Workflow Engine

Dashboard workflows must be represented as workflow records:

```text
trigger
condition
action
notification
audit log
```

Examples:

- campaign pending approval
- survey response below threshold
- partner onboarding incomplete
- subscription past due
- QR scans spike

## 46. State Machine

Dashboard task states:

```text
new
in_progress
waiting
completed
dismissed
archived
```

Alert states:

```text
open
acknowledged
assigned
resolved
suppressed
```

Recommendation states:

```text
new
viewed
accepted
dismissed
converted
expired
```

## 47. Complete State Management

Client state:

- selected organization
- filters
- drawer state
- selected records
- command palette state

Server state:

- dashboard summary
- KPIs
- tasks
- alerts
- activity
- recommendations
- module health

Use query caching and explicit invalidation after mutations.

## 48. Database Entities

Required entities:

```text
dashboard_widgets
dashboard_preferences
dashboard_snapshots
priority_actions
tasks
activity_events
recommendations
module_health
alerts
notifications
saved_views
audit_logs
analytics_events
report_runs
organizations
workspaces
memberships
```

Every entity includes:

```text
id
organization_id nullable for platform scope
workspace_id nullable
status
created_at
updated_at
created_by
updated_by
deleted_at
```

## 49. Relationships

Core relationships:

```text
User → Memberships
Membership → Organization
Organization → Workspaces
Workspace → Dashboard Preferences
Workspace → Tasks
Workspace → Activity Events
Workspace → Recommendations
Activity Event → Entity Reference
Task → Assigned User
Recommendation → Source Signal
Alert → Module Health
Audit Log → Actor + Entity
```

## 50. Entity Lifecycle

Task lifecycle:

```text
created
assigned
started
waiting
completed
archived
```

Recommendation lifecycle:

```text
generated
viewed
accepted/dismissed
converted/expired
archived
```

Alert lifecycle:

```text
detected
acknowledged
assigned
resolved
audited
```

## 51. CRUD Operations

Dashboard supports:

- create task
- read dashboard summary
- read KPIs
- read activity
- update task status
- update dashboard preferences
- dismiss recommendation
- accept recommendation
- acknowledge alert
- archive notification
- export activity/report data

Deletes are soft deletes only.

## 52. API Endpoints

Required endpoints:

```text
GET /api/dashboard/summary
GET /api/dashboard/kpis
GET /api/dashboard/activity
GET /api/dashboard/tasks
POST /api/dashboard/tasks
PATCH /api/dashboard/tasks/:id
GET /api/dashboard/recommendations
PATCH /api/dashboard/recommendations/:id
GET /api/dashboard/module-health
GET /api/dashboard/alerts
PATCH /api/dashboard/alerts/:id
GET /api/dashboard/preferences
PATCH /api/dashboard/preferences
POST /api/dashboard/export
GET /api/search
POST /api/quick-create/:entityType
```

Every endpoint must enforce authentication, authorization, tenant scope, rate limiting, validation, and audit logging for mutations.

## 53. Service Layer

Required services:

- DashboardService
- KpiService
- ActivityService
- TaskService
- RecommendationService
- AlertService
- ModuleHealthService
- SearchService
- QuickCreateService
- AuditService
- PermissionService

Services may not directly mutate another module's records except through that module's service or event interface.

## 54. Repository Layer

Repositories:

- DashboardRepository
- TaskRepository
- ActivityRepository
- RecommendationRepository
- AlertRepository
- ModuleHealthRepository
- DashboardPreferenceRepository

Repositories perform data access only. They do not contain UI logic, permission decisions, or business workflow rules.

## 55. Background Jobs

Required jobs:

- refresh dashboard snapshots
- generate priority actions
- calculate KPI rollups
- detect stale module health
- generate recommendations
- clean expired notifications
- schedule report previews

Jobs must be idempotent.

## 56. Event Bus

Events consumed:

- partner.created
- partner.updated
- property.onboarded
- resident.registered
- perk.redeemed
- event.rsvp_created
- campaign.launched
- survey.completed
- invoice.paid
- subscription.past_due
- report.generated
- user.invited
- workflow.failed

Events emitted:

- dashboard.viewed
- task.created
- task.completed
- recommendation.accepted
- recommendation.dismissed
- alert.acknowledged
- dashboard.exported

## 57. Automation Rules

Examples:

- If campaign pending approval for more than 48 hours, create priority action.
- If survey response rate falls below threshold, create recommendation.
- If subscription is past due, create billing alert.
- If QR scans spike, create activity insight.
- If partner onboarding incomplete after 7 days, assign setup task.

## 58. Notification Rules

Notifications must be created for:

- assigned tasks
- critical alerts
- billing failures
- report completion
- campaign approval
- survey escalation
- security events

Notification channels:

- in-app
- email where configured
- SMS only where explicitly enabled

## 59. Audit Logging

Every mutation logs:

- actor_id
- organization_id
- workspace_id
- action
- entity_type
- entity_id
- before
- after
- ip address
- user agent
- timestamp

Audit events are immutable.

## 60. Permission Matrix

| Action | Super Admin | Platform Admin | Owner | Admin | Manager | Editor | Analyst | Viewer |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| View platform dashboard | Yes | Yes | No | No | No | No | No | No |
| View workspace dashboard | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Create task | Yes | Yes | Yes | Yes | Yes | Yes | No | No |
| Assign task | Yes | Yes | Yes | Yes | Yes | No | No | No |
| Export dashboard | Yes | Yes | Yes | Yes | Yes | No | Yes | No |
| View billing alerts | Yes | Yes | Yes | Yes | No | No | No | No |
| Acknowledge system alert | Yes | Yes | No | No | No | No | No | No |
| Manage dashboard preferences | Yes | Yes | Yes | Yes | Yes | Yes | Yes | No |

## 61. RBAC

RBAC must be enforced in:

- route guards
- API handlers
- service layer
- repository tenant filters
- UI action visibility
- export logic

UI hiding is never sufficient.

## 62. Security Rules

Rules:

- Every private query scopes by organization_id or platform permission.
- No workspace data leaks between organizations.
- Export endpoints require elevated permission.
- Audit logs cannot be edited.
- Search only returns permitted entities.
- Dashboard snapshots must not include unauthorized data.

## 63. Rate Limiting

Suggested limits:

- dashboard reads: 120/min/user
- search: 60/min/user
- exports: 10/hour/user
- quick create: 30/min/user
- recommendation actions: 60/min/user

Rate-limit errors must show retry guidance.

## 64. Feature Flags

Feature flags:

- dashboard.ai_recommendations
- dashboard.command_search
- dashboard.module_health
- dashboard.bulk_actions
- dashboard.export
- dashboard.realtime_activity
- dashboard.mobile_bottom_actions

Flags must default safe and be organization-aware.

## 65. Integrations

Potential integrations surfaced:

- Stripe for billing alerts
- Twilio for messaging activity
- Tally/Jotform for survey events
- Google Sheets for reporting exports
- Supabase/S3 storage for reports/assets
- OpenAI for recommendations/summaries
- n8n/workflow engine for automations

Integrations must not block dashboard loading. Use degraded states.

## 66. External APIs

External APIs must be wrapped through internal service adapters.

No component calls external APIs directly.

Adapter rules:

- typed request/response
- retry policy
- timeout
- audit where applicable
- sanitized error response

## 67. AI Integration

AI appears as "Downtown Assistant" and recommendation generation.

Allowed AI actions:

- summarize activity
- explain KPI movement
- recommend next action
- draft campaign/task/report
- identify anomalies

AI cannot:

- execute destructive actions without confirmation
- bypass permissions
- access cross-tenant data
- invent metrics

Every AI suggestion must include source signals.

## 68. Analytics Events

Events:

- command_center_viewed
- dashboard_scope_changed
- dashboard_filter_applied
- dashboard_kpi_opened
- priority_action_clicked
- task_created
- task_completed
- recommendation_viewed
- recommendation_accepted
- recommendation_dismissed
- quick_create_opened
- quick_create_completed
- dashboard_exported
- command_search_used

Analytics events must include organization/workspace scope where permitted.

## 69. Performance Targets

Targets:

- initial dashboard shell: under 1.5s
- above-the-fold data: under 2s
- interaction response: under 100ms
- drawer open: under 180ms
- search first result: under 300ms
- export request accepted: under 1s

Use lazy loading for below-fold sections.

## 70. Accessibility

Requirements:

- WCAG AA contrast
- keyboard navigation
- visible focus states
- ARIA labels for icon buttons
- screen-reader announcements for toast/status changes
- semantic headings
- table captions
- 44px touch targets
- reduced motion support

## 71. Testing Strategy

Test layers:

- unit tests for services/components
- integration tests for APIs
- permission tests for RBAC
- E2E tests for core workflows
- accessibility checks
- responsive visual checks
- performance checks

## 72. Unit Tests

Required unit tests:

- permission filtering
- KPI formatting
- task state transitions
- recommendation state transitions
- alert severity sorting
- filter serialization
- empty/loading/error component rendering

## 73. Integration Tests

Required integration tests:

- dashboard summary endpoint
- KPI endpoint tenant scoping
- task create/update
- recommendation accept/dismiss
- alert acknowledge
- dashboard preferences save
- export request
- search permission filtering

## 74. End-to-End Tests

Required E2E flows:

- login to dashboard
- switch workspace
- search for entity
- open KPI drawer
- create task
- complete task
- accept recommendation
- acknowledge alert
- export dashboard
- verify mobile layout

## 75. QA Checklist

- AppShell is reused.
- No public navbar appears.
- No fake map or fake chart appears.
- Dashboard loads with real data.
- All buttons work or are disabled with reason.
- All actions persist.
- Audit logs are written.
- Permissions are enforced.
- Mobile layout is usable.
- Search returns scoped results.
- Exports are permissioned.
- No console errors.

## 76. Production Readiness Checklist

- API contracts documented.
- Database migrations completed.
- RBAC tested.
- Audit logging verified.
- Monitoring alerts configured.
- Background jobs scheduled.
- Feature flags configured.
- Load testing completed.
- Error states reviewed.
- Rollback plan ready.

## 77. Technical Debt Prevention

Rules:

- No page-local dashboard widgets.
- No duplicated KPI card implementations.
- No mock data in production paths.
- No unaudited mutations.
- No direct database access from UI.
- No custom shell layout.
- No hardcoded role checks outside permission engine.

## 78. Future Expansion Strategy

Future additions:

- custom dashboard layouts
- saved dashboard views
- real-time collaborative task triage
- AI-generated daily briefs
- anomaly detection
- predictive campaign recommendations
- executive board-report mode
- command-center TV mode

## 79. Risks

Risks:

- dashboard becomes decorative instead of operational
- cross-tenant data leakage
- excessive query load
- inconsistent module health definitions
- AI recommendations without source evidence
- too many alerts causing noise
- mobile dashboard becomes unusable

## 80. Mitigation

Mitigations:

- require source endpoint for every widget
- enforce tenant scope at repository layer
- use cached dashboard snapshots
- define module health schema
- require source signals for AI
- prioritize alerts by severity
- build mobile-first stacked views

## 81. Deployment Requirements

Deployment requires:

- database migrations
- seeded dashboard preferences
- seeded module health records
- background jobs enabled
- environment variables configured
- rate limits configured
- audit logging enabled
- monitoring dashboards enabled

## 82. Rollback Strategy

Rollback:

- feature flag Command Center widgets
- preserve old route fallback temporarily
- rollback frontend independently from background jobs
- never delete new audit/task/activity data
- keep migrations backward compatible

## 83. Monitoring

Monitor:

- dashboard load time
- endpoint error rates
- search latency
- task mutation failures
- recommendation generation failures
- export failures
- background job failures
- tenant-scope violations

## 84. Logging

Structured logs:

- request id
- user id
- organization id
- workspace id
- route
- service
- action
- duration
- status
- error code

Do not log secrets, tokens, payment details, or private resident data beyond approved identifiers.

## 85. Observability

Observability must include:

- API traces
- service timings
- database query timings
- background job traces
- error aggregation
- dashboard usage analytics
- audit trail verification
- alert delivery status

## 86. Definition of Done

Module 01 is complete when:

- `/admin` and `/admin/dashboard` render the shared Command Center.
- AppShell, navigation, toolbar, and design system are reused.
- Dashboard sections are backed by real APIs.
- Every action is wired to backend services.
- Every mutation writes audit logs.
- Every query is tenant-scoped.
- RBAC is enforced server-side and client-side.
- Loading, empty, error, permission, and offline states exist.
- Desktop, tablet, and mobile layouts are complete.
- No fake maps, charts, placeholders, or decorative admin graphics remain.
- Unit, integration, E2E, accessibility, and responsive tests pass.
- Production monitoring and rollback strategy are ready.

Proceed to the next Platform Constitution Module.

# Workflow Gap Analysis

| Workflow | Status | Evidence | Missing |
| --- | --- | --- | --- |
| Partner Provisioning | Built/Partial | Provisioning code creates partner, tenant, workspace, registration, user, location, campaign draft, subscription, invoice, QR, AI context, modules, notification, audit. | Auth-bound user creation, external billing reconciliation, tests. |
| Promotion Checkout | Built/Partial | Promotion API, DUDE2026 seed, checkout bypass logic. | Stripe paid path credentials, webhook, redemption runtime test. |
| Resident Enrollment | Partial | Resident APIs and records exist. | Signup product flow, verification, card/access activation, notifications. |
| Shore Resident Directory Import | Built/Partial | `THE SHORE.xlsx` populated 194 residents and 84 units into `bldg_shore`, `tenant_the-shore`, and `workspace_the-shore` with audit and analytics records. | Reusable admin import UI/API, preview, duplicate review, rollback, production DB migration, and resident lifecycle automation. |
| Redemption Verification | Partial | Perk redeem route exists with validation/audit/analytics. | Full eligibility/rules engine, QR integration, resident identity proof. |
| Event Follow-Up | Partial | Follow-up endpoint creates automation/run-style records. | Twilio/Tally/n8n delivery and completion state. |
| Campaign Triggers | Partial | Publish/pause/archive APIs exist. | Audience resolution, delivery queue, channel results, retry. |
| Survey Processing | Partial | Survey templates/responses/export logs exist. | Provider webhook intake, sentiment/routing, escalation execution. |
| Survey Escalations | Outstanding | No executable threshold workflow verified. | Trigger/condition/action service and notifications. |
| Partner Monthly Reports | Partial | PartnerReport containers exist. | Scheduled generation/delivery and export proof. |
| Property Reports | Partial | Reports page and report APIs exist. | Scheduled property report workflow and export proof. |
| Resident Bulk Updates | Outstanding | No dedicated bulk API verified. | Batch job, rollback, audit batching, progress UI. |
| QR Scan Routing | Partial | `/api/qr/scan`, QR records, QR experiences. | Product scanner UX, invalid/expired states, QR admin page. |
| AI Recommendations | Partial | Agent gateway and AiInsight records exist. | Provider runtime, memory, evaluation, product SDK proof. |

## Required Workflow Engine Capabilities

- Trigger definitions.
- Conditions.
- Actions.
- Retries and backoff.
- Failure states.
- Run history.
- Audit events.
- Analytics events.
- Notifications.
- Admin run inspector.

Current state: records and endpoints exist, but durable orchestration is incomplete.

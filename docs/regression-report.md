# Regression Report

## Critical

| Module | Feature | Regression / Finding | Impact | Fix | Effort |
| --- | --- | --- | --- | --- | --- |
| Runtime | API availability | Shell probes to 3014 returned `000`. | Current runtime cannot be signed off. | Restart/verify server and repeat health/API smoke tests. | S |
| Perks | Delete route | DELETE route exists while platform standard requires soft delete. | Data/report/audit history can be lost. | Convert to archive/`deleted_at`. | S |

## High

| Module | Feature | Regression / Finding | Impact | Fix | Effort |
| --- | --- | --- | --- | --- | --- |
| Billing | Paid checkout | Stripe path not proven active. | Paid signups cannot be production. | Configure Stripe and webhooks, test paid path. | M |
| Integrations | External providers | Providers appear pending or unproven. | UI can overstate operational readiness. | Add setup-required states and smoke tests. | M |
| Testing | Regression safety | No current passing lint/build/test evidence after edits. | Future changes can break hidden workflows. | Add and run test suite. | M |
| Product linkage | 5173 | Product app not verified in this repo pass. | Product-to-operations claims remain unproven. | Audit 5173 routes separately. | M |

## Medium

| Module | Feature | Regression / Finding | Impact | Fix | Effort |
| --- | --- | --- | --- | --- | --- |
| Backend | Architecture | Most domains live in `server.ts`. | Hard to maintain and test. | Extract modules. | L |
| Workflow | Automations | AutomationRun exists but no durable engine. | Follow-ups/reports/reminders incomplete. | Build workflow service. | L |
| Mobile | Admin tables | Wide tables and rails need full sweep. | Mobile walkthrough can break. | Standard responsive data table/card pattern. | M |
| AI | Provider/runtime | Module exists but provider not proven. | AI may only be structural. | Configure and smoke test provider. | M |

## Low

| Module | Feature | Regression / Finding | Impact | Fix | Effort |
| --- | --- | --- | --- | --- | --- |
| Docs | Drift | Many platform docs exist and can drift from code. | False confidence. | Add audit refresh checklist. | S |
| Navigation | Alias redirects | Several partner/workspace aliases collapse to home. | Context can be lost. | Preserve tenant/query context. | S |

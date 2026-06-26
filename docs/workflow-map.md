# Workflow Map

## Required Operating Loop

Registration -> Workspace -> Billing -> Campaign/Offer/Event -> Resident Action -> Analytics -> Report -> Notification -> Optimization.

## Current Workflow Status

| Workflow | Status | Evidence |
| --- | --- | --- |
| Partner Registration | Partial | Partner lead and lifecycle records exist. |
| Workspace Provisioning | Built/Partial | Tenants/workspaces/modules/reports created. |
| Complimentary Checkout | Built/Partial | DUDE2026 and $0 bypass logic exist. |
| Paid Checkout | Partial | Stripe code path exists; credentials not proven. |
| Campaign Publish | Partial | API status transitions exist. |
| Perk Redemption | Partial | Redeem route and records exist. |
| Event RSVP | Partial | RSVP route and one RSVP record. |
| Survey Intake | Partial | Survey records/forms exist. |
| Report Generation | Partial | Report APIs/containers exist. |
| QR Routing | Partial | QR scan API exists. |
| AI Recommendation | Partial | Agent gateway exists. |

## Missing Workflow Engine

The platform needs a central workflow service where triggers, conditions, actions, retries, failures, notifications, analytics, and audit are configured and visible in admin.

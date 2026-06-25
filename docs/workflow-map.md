# Workflow Map

| Workflow | Entry | Output |
| --- | --- | --- |
| Partner provisioning | partner lifecycle or `/api/partners/:id/provision-workspace` | tenant, workspace, roles, profile, reports, QR, audit |
| Perk redemption | `/api/perks/:id/redeem` | redemption, analytics, audit |
| Event RSVP | `/api/events/:id/rsvp` | RSVP, count update, analytics, audit |
| Event follow-up | `/api/events/:id/follow-up` | automation run |
| Campaign publish | `/api/campaigns/:id/publish` | active campaign, analytics, audit |
| QR scan | `/api/qr/scan` | QR scan, analytics, audit, destination |
| Survey response | `processSurveyResponse` compatibility function | response, export log, notification |
| Report run | `/api/reports/run` | `ReportRun`, audit |


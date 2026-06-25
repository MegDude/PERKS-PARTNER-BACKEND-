# Service Map

| Service | Current implementation |
| --- | --- |
| Auth | `/api/auth/me` local profile |
| Entity repository | `/api/entities/:entity` |
| Partner provisioning | `/api/functions/provisionPartnerWorkspace`, `/api/partners/:id/provision-workspace` |
| Map service | `/api/map/entities`, `/api/map/pins`, `/api/map/events` |
| Perks service | `/api/perks`, status/redeem actions |
| Events service | `/api/events`, RSVP/check-in/follow-up actions |
| Campaign service | `/api/campaigns`, publish/pause/archive actions |
| Resident service | `/api/residents` |
| Reports service | `/api/reports`, run/export |
| Analytics service | `/api/analytics/summary`, `/api/analytics/events` |
| Audit service | `writeAuditEvent` helper into `TenantAuditLog` |
| Automation service | `/api/automations` |
| Integration status | `/api/integrations/status` |
| QR service | `/api/qr` |
| AI service | `/api/ai/*` |


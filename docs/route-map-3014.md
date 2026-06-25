# 3014 Operations Route Map

3014 is the Downtown Perks operations platform and local backend control surface.

| Route | Purpose | Data source | Status | Required action |
| --- | --- | --- | --- | --- |
| `/` | Platform welcome shell | `/api/health`, entity clients | Operational shell | Keep as admin entry with Home and Back controls |
| `/map` | Operations map surface | local map data | Operational, separate from 5173 product map | Continue moving to `/api/map/entities` |
| `/welcome` | Partner setup/onboarding flow | entity clients | Operational local flow | Keep tied to partner lifecycle APIs |
| `/partners/*` | Partner lifecycle aliases | `PartnerLifecycle` | Operational local flow | Keep canonical redirects documented |
| `/workspace/*` | Partner workspace aliases | `PartnerLifecycle` | Operational local flow | Keep workspace shell non-blocking |
| `/admin` | Platform operations dashboard | entity clients, health, provisioning | Operational | Use as main navigation page |
| `/admin/home` | Backend platform welcome | entity clients | Operational | Keep admin-facing only |
| `/admin/platform` | Command center | platform registry, entities | Operational | Super-admin command center |
| `/admin/platform/*` | Canonical redirects | React redirects | Consolidated | Avoid duplicate pages |
| `/admin/dashboard` | KPI dashboard | residents, perks, redemptions, buildings | Operational | Continue replacing static stats with `/api/analytics/summary` |
| `/admin/buildings` | Property/building operations | `Building`, `Flat`, `Tenant`, `Amenity`, `Survey` | Operational | Continue audit logging for every mutation |
| `/admin/buildings/:tab` | Building tab routing | `BuildingsManagement` | Operational | Keep tab route canonical |
| `/admin/buildings/:buildingId/*` | Building detail operations | `BuildingsManagement` | Operational | Add deeper detail routing when needed |
| `/admin/properties` | Property portfolio | `/api/admin/properties` | Operational | Main page for property navigation |
| `/admin/engagement` | Engagement hub | broadcasts, campaigns, residents | Operational | Tie more actions to explicit `/api/campaigns` endpoints |
| `/admin/perks` | Perk operations | `PerkLocation`, redemptions | Operational | New activate/pause/archive/redeem APIs available |
| `/admin/about` | Internal platform overview | static/internal copy | Operational | Keep non-marketing admin copy |
| `/admin/developer-engagement` | Developer/operator engagement view | entity clients | Operational | Confirm copy remains end-user/operator-facing |
| `/admin/events` | Event operations | `Event`, `EventRSVP` | Operational | New RSVP/check-in/follow-up APIs available |
| `/admin/events/:eventId` | Event detail | `EventDetail` | Operational | Keep analytics/audit on mutations |
| `/admin/partner` | Partner performance dashboard | partner, perks, redemptions, messages | Operational | Fake map removed; use activity feed |
| `/admin/partner-portal` | Partner portal operations | partner, perks, redemptions | Operational | Keep portal connected to workspace lifecycle |
| `/admin/residents` | Resident CRM | `Tenant`, `Flat` | Operational | New resident activity/segment APIs available |
| `/admin/segmentation` | Segments | `Tenant`, segments | Operational | Connect to resident segment endpoint |
| `/admin/analytics` | Perk/platform analytics | redemptions, insights | Operational | Expand to consume `/api/analytics/summary` |
| `/admin/settings` | Settings shell | `BackendWorkspace` | Consolidated | Replace with full settings module later |
| `/admin/reports` | Reporting | report functions/entity data | Operational | New `/api/reports/run` and export APIs available |
| `/admin/surveys` | Survey library/workflows | surveys, journeys, integrations, automations | Operational | Integrate provider credentials when ready |
| `/admin/announcements` | Announcement manager | announcements/broadcasts | Operational | Add delivery analytics and audit for sends |


# Domain Map

| Domain | Owns | Current Evidence | Required Owner |
| --- | --- | --- | --- |
| Identity | users, sessions, roles, memberships | User, TenantUser, TenantRole | `auth` service |
| Organizations | tenants, workspaces, settings | PlatformTenant, TenantWorkspace, PartnerSettings | `organizations/workspaces` services |
| Partners | profiles, contacts, locations, workspaces | Partner, PartnerProfile, PartnerLocation | `partners` service |
| Properties | property records, building links | Building, Flat, Amenity, PartnerLocation | `properties/buildings` services |
| Residents | residents, units, segments, activity | Tenant, Flat, CrmSegment | `residents/segmentation` services |
| Map | entities, pins, actions, links | MapEntityLink, PartnerLocation, PerkLocation | `map` service |
| Perks | offers, rules, redemptions | PerkLocation, PerkRedemption | `perks/redemptions` services |
| Events | events, RSVP, check-in, follow-up | Event, EventRSVP, PartnerEvent | `events/rsvps` services |
| Campaigns | campaigns, targets, engagement | Campaign, Broadcast | `campaigns/engagement` services |
| Surveys | templates, questions, responses, exports | Survey, SurveyResponse, SurveyProviderForm | `surveys` service |
| Reports | report containers, runs, exports | PartnerReport, ReportRun, SurveyExportLog | `reports` service |
| Analytics | event stream, summaries, metrics | AnalyticsEvent, PartnerAnalytics | `analytics` service |
| Automations | workflows, runs, retries | AutomationRun, MessagingJourney | `automations` service |
| Notifications | messages, email/SMS/in-app | TenantNotification, SmsMessageLog | `notifications/messages` services |
| AI | agent, tools, memory, prompts | AiInsight, Interaction, backend/modules/ai | `ai` service |
| Billing | plans, checkout, subscriptions, invoices | ProductOffering, PartnerSubscription, PartnerInvoice, Promotion | `billing/promotions` services |
| Media | images/files/assets | GeneratedImage, ReferenceImage, ImageExport | `media` service |

Rule: UI may read domain views, but every mutation must call the owning domain service.

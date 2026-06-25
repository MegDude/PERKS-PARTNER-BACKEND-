# Database Schema

3014 uses a local JSON operational store for development. Entity collections map to future tables.

## Core Entity Collections

| Collection | Domain |
| --- | --- |
| `PlatformTenant` | organization/tenant |
| `TenantWorkspace` | workspace |
| `TenantUser` | workspace users |
| `TenantRole` | roles and permissions |
| `User` | local auth profile |
| `Partner` | partner CRM |
| `PartnerProfile` | public/operator partner profile |
| `PartnerLocation` | partner locations and map presence |
| `Building` | properties/buildings |
| `Flat` | units |
| `Tenant` | residents |
| `Amenity` | amenities |
| `PerkLocation` | perks/offers |
| `PerkRedemption` | redemptions |
| `Event` | events |
| `EventRSVP` | RSVPs/check-ins |
| `Campaign` | campaigns |
| `Survey` | survey definitions |
| `SurveyResponse` | survey responses |
| `Broadcast` | engagement messages |
| `Announcement` | announcements |
| `PartnerMessage` | partner/resident messages |
| `PartnerReport` | report containers |
| `ReportRun` | generated report runs |
| `AnalyticsEvent` | product and admin action analytics |
| `TenantAuditLog` | mutation and workflow audit logs |
| `AutomationRun` | automation definitions and run history |
| `IntegrationEndpoint` | configured integration endpoints |
| `IntegrationStatus` | provider credential/test status |
| `PartnerQrExperience` | QR code definitions |
| `QrScan` | QR scan attribution |
| `AiInsight` | AI summaries/recommendations |
| `MapEntityLink` | public map entity to tenant/workspace link |
| `PartnerSubscription` | subscriptions |
| `PartnerInvoice` | invoices |

## Required Fields

Every operational entity should carry:

- `id`
- `organization_id` or `tenant_id`
- `workspace_id`
- `status`
- `created_at`
- `updated_at`
- `deleted_at`
- `metadata`

Some existing seed records predate the normalized shape. New endpoints write normalized tenant/workspace context where it can be derived.


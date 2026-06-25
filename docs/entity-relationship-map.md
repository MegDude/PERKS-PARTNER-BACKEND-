# Entity Relationship Map

```text
PlatformTenant
  -> TenantWorkspace
  -> TenantRole
  -> TenantUser
  -> PartnerProfile
  -> PartnerLocation
  -> PartnerAnalytics
  -> PartnerReport
  -> PartnerQrExperience
  -> MapEntityLink

Partner
  -> PartnerLocation
  -> PerkLocation
  -> Event
  -> Campaign
  -> PartnerMessage
  -> PartnerReport

Building
  -> Flat
  -> Tenant
  -> Amenity
  -> Survey
  -> Broadcast
  -> Event

PerkLocation
  -> PerkRedemption
  -> Campaign
  -> PartnerQrExperience
  -> AnalyticsEvent
  -> TenantAuditLog

Event
  -> EventRSVP
  -> Survey
  -> Campaign
  -> AnalyticsEvent
  -> TenantAuditLog

Campaign
  -> Partner
  -> Building
  -> PerkLocation
  -> Event
  -> ReportRun
  -> AnalyticsEvent

QR
  PartnerQrExperience
  -> QrScan
  -> AnalyticsEvent
  -> TenantAuditLog
```


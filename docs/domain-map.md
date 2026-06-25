# Domain Map

| Domain | Owner surface | Primary data |
| --- | --- | --- |
| Organizations | 3014 | `PlatformTenant` |
| Workspaces | 3014 | `TenantWorkspace` |
| Partners | 3014 + 5173 workspace | `Partner`, `PartnerProfile`, `PartnerLocation` |
| Properties/buildings | 3014 | `Building`, `Flat`, `Amenity` |
| Residents | 3014 + 5173 resident product | `Tenant`, `CrmSegment` |
| Map | 5173 product, 3014 operations | `MapEntityLink`, `PartnerLocation`, `PerkLocation` |
| Perks | both | `PerkLocation`, `PerkRedemption` |
| Events | both | `Event`, `EventRSVP` |
| Campaigns | both | `Campaign` |
| Surveys | 3014 | `Survey`, `SurveyResponse` |
| Reports | 3014 | `PartnerReport`, `ReportRun` |
| Analytics | 3014 | `AnalyticsEvent`, `PartnerAnalytics` |
| Audit | 3014 | `TenantAuditLog` |
| QR | both | `PartnerQrExperience`, `QrScan` |
| AI | both | `AiInsight` |
| Billing | 3014 + 5173 checkout | `PartnerSubscription`, `PartnerInvoice`, `ProductOffering` |


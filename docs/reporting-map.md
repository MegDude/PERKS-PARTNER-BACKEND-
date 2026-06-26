# Reporting Map

## Report Records

- PartnerReport: 358
- PartnerAnalytics: 358
- ReportRun: 0
- SurveyExportLog: 2
- AnalyticsEvent: 9

## Reporting Domains

| Domain | Status | Gap |
| --- | --- | --- |
| Partner | Partial | Containers exist; generated report runs not active. |
| Building | Partial | Building data exists; scheduled reporting missing. |
| Resident | Partial | Resident records exist; engagement report incomplete. |
| Campaign | Partial | Campaign records exist; delivery attribution incomplete. |
| Perk | Partial | Redemption data exists; eligibility/source attribution incomplete. |
| Survey | Partial | Responses/export logs exist; provider workflow incomplete. |
| Event | Partial | RSVP data exists; follow-up/report generation incomplete. |
| Billing | Partial | Invoices/subscriptions exist; Stripe reconciliation missing. |
| Executive | Partial | Platform summary pages exist; scheduled executive report missing. |

## Required Reconciliation

Every domain mutation should update analytics and reportable aggregates. Reports should be generated from operational data, not copied page summaries.

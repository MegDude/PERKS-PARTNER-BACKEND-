# Database Map

## Current Store

Primary operational data currently lives in `data/downtown-perks-db.json`.

## High-Volume Entities

- PlatformTenant: 358
- TenantWorkspace: 358
- TenantRole: 1790
- TenantAuditLog: 898
- Partner: 353
- PartnerLocation: 504
- PartnerOffer: 350
- PartnerReport: 358
- PartnerAnalytics: 358
- PartnerQrExperience: 352
- Campaign: 374
- MapEntityLink: 515

## Database Reconciliation Requirements

| Requirement | Status |
| --- | --- |
| Normalization | Partial |
| Relationships | Partial |
| Indexes | Missing in JSON store |
| Constraints | Missing in JSON store |
| Audit | Partial |
| Soft delete | Partial |
| Versioning | Missing |
| Migrations | Missing |
| Tenant scoping | Partial |

## Production Requirement

Move to a production database with migrations, constraints, indexes, tenant scopes, soft-delete policies, audit tables, and relationship integrity checks.

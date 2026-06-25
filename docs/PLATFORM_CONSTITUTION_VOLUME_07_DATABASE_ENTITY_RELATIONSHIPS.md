# DOWNTOWN PERKS PLATFORM CONSTITUTION

# VOLUME 7

# DATABASE ARCHITECTURE & ENTITY RELATIONSHIP CONSTITUTION

**Version:** 1.0

**Purpose**

This document defines the canonical database architecture for the Downtown Perks Platform.

The database is the **single source of truth** for every operational workflow. It is designed to support multi-tenant organizations, millions of residents, thousands of partners, enterprise reporting, AI recommendations, and future platform expansion.

The schema should be normalized, extensible, auditable, and migration-friendly.

---

# 1. DATABASE PHILOSOPHY

The database stores **business facts**, not UI state.

It must:

* support multi-tenancy
* preserve history
* support auditability
* enable analytics
* minimize duplication
* enforce referential integrity
* scale horizontally where appropriate

Every table exists because it models a business capability.

---

# 2. DATABASE LAYERS

```text id="2j8d4c"
Reference Data

↓

Identity

↓

Organizations

↓

Network

↓

Programs

↓

Operations

↓

Analytics

↓

Audit
```

Each layer has distinct ownership.

---

# 3. CORE ENTITY HIERARCHY

```text id="k8f6ta"
Platform

↓

Organization

↓

Workspace

↓

Partner

↓

Property

↓

Building

↓

Resident

↓

Campaign

↓

Perk

↓

Event

↓

Survey

↓

Reports
```

---

# 4. GLOBAL ENTITY CONTRACT

Every operational table includes:

```text id="bq1k9u"
id UUID

organization_id

workspace_id

status

created_at

updated_at

created_by

updated_by

deleted_at

version

metadata JSONB
```

This contract is mandatory.

---

# 5. IDENTITY TABLES

Core entities:

* users
* user_profiles
* sessions
* invitations
* identities
* roles
* permissions
* role_permissions
* user_roles
* workspaces
* workspace_members

Relationships:

```text id="qv7n21"
User

↓

WorkspaceMember

↓

Workspace

↓

Organization
```

---

# 6. ORGANIZATION DOMAIN

Tables:

* organizations
* organization_settings
* organization_branding
* organization_subscriptions
* organization_integrations
* organization_audit

Organization owns:

* partners
* properties
* users
* campaigns
* billing
* reports

---

# 7. PARTNER DOMAIN

Tables:

* partners
* partner_contacts
* partner_locations
* partner_categories
* partner_documents
* partner_media
* partner_relationships
* partner_notes

Partner relationships:

```text id="5m2u1e"
Partner

↓

Campaigns

↓

Perks

↓

Events

↓

Reports

↓

Billing
```

---

# 8. PROPERTY DOMAIN

Tables:

* properties
* buildings
* units
* amenities
* access_points
* qr_locations
* leases
* building_documents

Hierarchy:

```text id="wy2k6m"
Property

↓

Building

↓

Unit

↓

Resident
```

---

# 9. RESIDENT DOMAIN

Tables:

* residents
* resident_profiles
* resident_preferences
* resident_segments
* resident_saved_items
* resident_activity
* resident_rewards

Relationships:

Residents may belong to:

* building
* property
* organization

---

# 10. CAMPAIGN DOMAIN

Tables:

* campaigns
* campaign_versions
* campaign_assets
* campaign_targets
* campaign_schedule
* campaign_metrics

Relationships:

Campaign

↓

Perks

↓

Events

↓

Audience

↓

Reports

---

# 11. PERKS DOMAIN

Tables:

* perks
* perk_rules
* perk_redemptions
* perk_media
* perk_categories
* perk_history

Relationships:

Partner

↓

Perk

↓

Campaign

↓

Redemption

---

# 12. EVENTS DOMAIN

Tables:

* events
* event_sessions
* event_rsvp
* event_checkin
* event_media
* event_sponsors

Relationships:

Event

↓

Venue

↓

Partner

↓

Campaign

↓

Reports

---

# 13. SURVEY DOMAIN

Tables:

* surveys
* survey_questions
* survey_answers
* survey_templates
* survey_responses
* survey_insights

Relationships:

Survey

↓

Questions

↓

Responses

↓

Reports

---

# 14. BILLING DOMAIN

Tables:

* subscriptions
* invoices
* payments
* payment_methods
* discounts
* credits
* usage_records

Relationships:

Organization

↓

Subscription

↓

Invoice

↓

Payment

---

# 15. MEDIA DOMAIN

Tables:

* media
* media_versions
* media_tags
* media_usage

Media is polymorphic.

Can attach to:

* partner
* campaign
* perk
* survey
* event
* building
* report

---

# 16. COMMUNICATION DOMAIN

Tables:

* announcements
* notifications
* messages
* message_threads
* templates
* deliveries

Supports:

Email

SMS

Push

In-App

Webhook

---

# 17. REPORTING DOMAIN

Tables:

* reports
* report_runs
* report_exports
* report_filters
* dashboards
* dashboard_widgets

No report stores duplicated operational data.

Reports are generated from source entities.

---

# 18. ANALYTICS DOMAIN

Tables:

* analytics_events
* analytics_sessions
* analytics_funnels
* analytics_metrics
* analytics_dimensions

Events are append-only.

---

# 19. AI DOMAIN

Tables:

* ai_requests
* ai_responses
* ai_feedback
* ai_context
* ai_memory
* ai_recommendations

No sensitive prompts stored without governance.

---

# 20. AUTOMATION DOMAIN

Tables:

* workflows
* triggers
* actions
* executions
* execution_logs
* schedules

Supports:

Retry

Rollback

Escalation

---

# 21. AUDIT DOMAIN

Tables:

* audit_logs
* audit_entities
* audit_changes
* audit_exports

Immutable.

Never updated.

Never deleted.

---

# 22. RELATIONSHIP RULES

Every foreign key:

* indexed
* constrained
* documented

Cascade deletes are prohibited for operational entities.

Prefer soft deletes.

---

# 23. STATUS MODEL

Standard status values:

* Draft
* Pending
* Scheduled
* Active
* Paused
* Completed
* Archived
* Deleted

Modules may extend but not replace.

---

# 24. VERSIONING

Entities supporting editing include:

* version number
* published version
* draft version
* change history

Supports future approval workflows.

---

# 25. INDEXING STRATEGY

Index:

* organization_id
* workspace_id
* status
* created_at
* updated_at
* foreign keys
* search fields

Composite indexes for common query paths.

---

# 26. SEARCH STRATEGY

Dedicated search indexes for:

* partners
* residents
* buildings
* events
* campaigns
* perks
* surveys

Supports full-text and faceted search.

---

# 27. MIGRATION POLICY

Every schema change:

* version controlled
* reversible
* tested
* documented

No manual production edits.

---

# 28. DATA RETENTION

Policies:

* operational data: soft delete
* audit logs: retained
* analytics: configurable retention
* media: versioned
* exports: logged

---

# 29. SECURITY

Every table enforces:

* organization isolation
* workspace isolation
* ownership
* RBAC
* audit

Sensitive fields encrypted where appropriate.

---

# 30. DATABASE QUALITY GATES

Every schema must satisfy:

✓ Third Normal Form (unless justified)

✓ Foreign keys

✓ Index strategy

✓ Migration coverage

✓ Seed data

✓ Test fixtures

✓ Performance review

✓ Security review

✓ Documentation

---

# 31. FUTURE EXPANSION

The schema must support future additions without breaking compatibility:

* White-label organizations
* Franchise networks
* Internationalization
* Multi-currency billing
* Marketplace modules
* API consumers
* Public developer platform
* Machine learning pipelines

---

# DEFINITION OF DONE

The database architecture is complete when:

* Every business capability is represented by a well-defined domain.
* Every relationship is explicit and enforced.
* Every entity inherits the global contract.
* Multi-tenant isolation is guaranteed.
* Reporting, analytics, AI, and automation consume normalized operational data.
* Migrations are versioned and reversible.
* The schema can evolve without requiring large-scale redesigns or data duplication.

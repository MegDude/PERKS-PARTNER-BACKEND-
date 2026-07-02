# Volume 12: Database

## Purpose

Define schema, relationships, indexes, constraints, row-level security, migrations, and performance rules.

## Core Domains

- organizations
- users
- registry entities
- relationship graph
- partners
- contacts
- campaigns
- perks
- events
- communications
- surveys
- QR codes
- analytics
- audit log
- AI generations
- reports

## Naming Standards

- Use snake_case in persisted database fields.
- Use stable IDs.
- Include `created_at`, `updated_at`, `created_by`, and `updated_by` where possible.
- Preserve raw import metadata.

## Security

Production database architecture should enforce workspace isolation with row-level security or equivalent API-level permission checks.


# Volume 04: Master Registry Engine

## Purpose

Define the canonical entity and relationship layer powering maps, search, Intelligence, partner workspaces, campaigns, events, analytics, and future APIs.

## Architecture

Every object is an entity. Relationships define placement, ownership, campaigns, collections, layers, proximity, intent, and reporting.

Core package:

```text
src/platform/master-registry/
  engine/
  schemas/
  repositories/
  services/
  importers/
  exporters/
  relationships/
  search/
  analytics/
  ai/
  seed/
```

## Canonical Entity

Required fields:

- id
- slug
- name
- status
- active
- entityType
- primaryCategory
- district
- address
- latitude
- longitude
- partnerId
- createdAt
- updatedAt

## Relationship Graph

Relationship types:

- belongs_to
- featured_in
- located_in
- managed_by
- owned_by
- nearby
- related
- campaign
- collection
- layer
- intent
- supports
- contains

## API Surface

- `GET /api/registry/entities`
- `GET /api/registry/entity/:id`
- `GET /api/registry/search`
- `GET /api/registry/campaigns`
- `GET /api/registry/layers`
- `GET /api/registry/collections`
- `GET /api/registry/relationships`
- `POST /api/registry/import`
- `POST /api/registry/entity`
- `PUT /api/registry/entity/:id`
- `DELETE /api/registry/entity/:id`

## Import Standard

Imports must preview before commit, detect duplicates, preserve raw metadata, create audit logs, and avoid wiping records without explicit confirmation.

## Current Implementation Notes

The registry currently normalizes existing `ContentEntity`, `MapEntityLink`, `Campaign`, `PerkLocation`, `Event`, and `AnalyticsEvent` records. Future work should move direct feature reads onto registry repositories.


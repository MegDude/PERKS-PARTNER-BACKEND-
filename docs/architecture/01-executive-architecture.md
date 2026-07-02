# Volume 01: Executive Architecture

## Purpose

Define the product vision, operating model, engineering principles, and long-term boundaries for Downtown Perks.

## Platform Mission

Downtown Perks connects residents, partners, buildings, visitors, events, offers, campaigns, and local services through one operational platform. The platform should help people find useful local options and help partners manage presence, campaigns, reporting, and growth from one workspace.

## Product Architecture

Downtown Perks has four primary surfaces:

- Resident experience: map, perks, events, search, saved places, recommendations.
- Partner platform: workspace, offers, campaigns, reports, billing, content, QR tools.
- Admin platform: operations, CRM, registry, analytics, integrations, support.
- Intelligence OS: AI-assisted research, strategy, proposals, campaigns, and next actions.

## Engineering Principles

- Use a single source of truth for entities and relationships.
- Prefer provider interfaces over vendor-specific code in features.
- Keep CRUD, filtering, sorting, validation, scheduling, and calculations deterministic.
- Use AI only for generation, analysis, synthesis, summarization, and strategy.
- Every write must be permissioned, auditable, and reportable.
- Prefer additive migrations and compatibility layers over disruptive rewrites.

## Product Boundaries

Downtown Perks is not a coupon-only site, generic CRM, static map, or disconnected marketing page. It is a platform that combines local discovery, partner operations, campaigns, analytics, and intelligence.

## Decisions

- 2026-07-01: The Master Registry Engine is the canonical data layer for map, portal, search, campaigns, and Intelligence.
- 2026-07-01: Intelligence is the AI operating layer over registry data, not a disconnected CRM dataset.


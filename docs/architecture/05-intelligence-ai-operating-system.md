# Volume 05: Intelligence AI Operating System

## Purpose

Define the AI operating layer that reasons over registry, partner, campaign, pricing, meeting, and analytics data.

## AI Boundary

AI may generate strategy, proposals, campaign concepts, copy, summaries, meeting agendas, and recommendations. AI must not replace deterministic CRUD, permissions, billing, scheduling, validation, filtering, or database search.

## Server-Only Rule

OpenAI keys and calls must remain server-side. Client components call internal API routes.

## Core Services

- OpenAI client wrapper
- Intelligence agent
- Company enrichment
- Proposal generation
- Campaign strategy
- Pricing recommendation
- Map presence
- Meeting assistant
- Workspace provisioning

## Agent Outputs

Agents should return structured JSON where UI needs editable fields. Free prose is allowed only for human-readable summaries.

## Knowledge Context

The Intelligence OS should query:

- Master Registry entities
- Relationship graph
- Partner records
- Campaigns
- Perks
- Pricing catalog
- Map presence
- Calendar context
- Analytics

## Observability

Every AI request should record purpose, model, token/cost estimate where available, source object, status, and user feedback.


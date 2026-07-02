# Downtown Perks Platform Architecture Bible

Version: 1.0  
Status: Authoritative engineering reference  
Last updated: 2026-07-01

## Purpose

This Architecture Bible defines the operating architecture for the Downtown Perks ecosystem. It is the source of truth for platform structure, backend services, data models, APIs, AI systems, integrations, design standards, deployment, and operational quality.

Every future feature should align with the relevant volume before code is added.

## Platform Rule

Downtown Perks is a long-term software product, not a collection of pages. Every visible action should resolve through:

UI -> API -> service layer -> database -> permissions -> audit log -> analytics.

## Volumes

1. [Executive Architecture](./01-executive-architecture.md)
2. [Design System](./02-design-system.md)
3. [Platform Infrastructure](./03-platform-infrastructure.md)
4. [Master Registry Engine](./04-master-registry-engine.md)
5. [Intelligence AI Operating System](./05-intelligence-ai-operating-system.md)
6. [Partner Platform](./06-partner-platform.md)
7. [Resident Platform](./07-resident-platform.md)
8. [Ask the Map](./08-ask-the-map.md)
9. [Campaign Engine](./09-campaign-engine.md)
10. [Platform Services](./10-platform-services.md)
11. [Automation](./11-automation.md)
12. [Database](./12-database.md)
13. [APIs](./13-apis.md)
14. [Deployment](./14-deployment.md)
15. [Future Expansion](./15-future-expansion.md)

## Architecture Decision Log

New architectural decisions must be recorded in the affected volume under "Decisions". Each decision should include date, context, decision, tradeoff, and migration notes.

## Living Documentation Standard

When a subsystem changes:

- Update the affected volume.
- Update data models and endpoint references.
- Add implementation notes and limitations.
- Record provider, security, and deployment implications.
- Keep scattered legacy docs as supporting material, but treat this directory as canonical.


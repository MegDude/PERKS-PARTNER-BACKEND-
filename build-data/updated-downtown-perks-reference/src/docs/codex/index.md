# Codex Documentation Index

> Read-only reference documents for AI-assisted development.  
> These files are **not runtime code** — do not import them into any application module.

---

## Architecture & Audits

- **Downtown Perks → Downtown Perks (5173) pre-implementation audit** — [`00_codex_discovery_extraction_downtown_perks.md`](./00_codex_discovery_extraction_downtown_perks.md)  
  Canonical architecture, entity model, routing hierarchy, protected features, and guardrail rules for the Downtown Perks platform.

---

## Guardrail Summary

1. No edits to existing functional systems unless explicitly requested.
2. No CSS-wide find/replace changes without a regression audit plan.
3. No renaming/deleting entity fields used in reporting/export (especially `buildingId`).
4. No removal of protected features listed in the extraction doc §5.
5. Documentation files must never be imported into runtime code.

See the full guardrails in [`00_codex_discovery_extraction_downtown_perks.md` §0](./00_codex_discovery_extraction_downtown_perks.md).
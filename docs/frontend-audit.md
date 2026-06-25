# Frontend Audit

## 3014

The 3014 frontend is an operations UI using one shared shell, shared tokens, and a local API adapter. Main duplication risk is feature pages using generic entity CRUD directly instead of domain-specific endpoints.

## 5173

The 5173 frontend is a separate product app with product, marketing, resident, partner, workspace, map, events, perks, card, and registration routes. It still uses product-local/Base44 data paths. It must be migrated to 3014 operation APIs for runtime source-of-truth behavior.

## Required Remediation

- Create a shared product API adapter for 5173.
- Replace product-local map/perk/event/campaign analytics with 3014 endpoints.
- Keep editorial design in 5173 and operational design in 3014 while sharing tokens where possible.


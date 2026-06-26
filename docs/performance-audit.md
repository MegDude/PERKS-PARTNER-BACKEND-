# Performance Audit

## Current Risks

- One large `server.ts` creates maintenance and startup complexity.
- Some pages fetch many entities independently.
- Workspace pages load broad data then filter client-side.
- No evidence of route splitting or bundle analysis.
- Leaflet map dependency is present and should be loaded only for map routes.
- Local JSON persistence may become slow with growth.

## Required Checks

| Area | Required Action |
| --- | --- |
| Bundles | Run Vite bundle analysis and lazy-load route modules. |
| Queries | Replace broad entity list calls with scoped domain endpoints. |
| Caching | Use React Query cache and invalidation consistently. |
| Images | Add optimized storage/provider and lazy loading. |
| Fonts | Keep interface typography lean. |
| Maps | Load Leaflet only on map surfaces. |
| Search | Add indexed backend search. |
| Realtime | Add event-driven updates only where needed. |
| AI | Stream responses and log latency/cost. |
| Dashboard | Use aggregate endpoints instead of fetching all records. |

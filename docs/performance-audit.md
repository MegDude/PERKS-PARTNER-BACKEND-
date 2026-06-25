# Performance Audit

## Current State

- Vite build completes.
- Local JSON persistence is acceptable for development but not production scale.
- Large dashboard chunks are possible and should be monitored.

## Required Production Work

- route-level code splitting audit
- database-backed pagination
- virtualized large tables
- cached dashboard queries
- image optimization
- map pin clustering at scale
- AI request timeouts and caching


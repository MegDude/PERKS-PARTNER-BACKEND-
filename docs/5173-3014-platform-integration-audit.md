# 5173 Product to 3014 Operations Integration Audit

## Executive Summary

5173 is the product surface. 3014 is the operational control system. The two apps are aligned conceptually but still use different client/data paths in code. This pass adds the missing 3014 operational APIs and documents the remaining 5173 client migration required to make 3014 the runtime source of truth.

## What Is Wired in 3014

- map entity and pin endpoints
- map interaction analytics endpoint
- perk CRUD compatibility plus activate, pause, archive, redeem
- event list/create/update plus RSVP, check-in, follow-up
- campaign list/create/update plus publish, pause, archive
- resident list/create/update plus segment and activity
- partner list/create/update plus workspace provisioning
- report list, run, and export endpoints
- analytics summary and event ingestion
- automation status and manual run logs
- integration status and credential-aware test endpoint
- QR lookup and scan attribution
- AI endpoints for ask-map, recommendations, report summaries, and survey summaries
- analytics events for product interactions
- audit events for mutations and workflow actions

## Every Route Audit

Detailed route maps live in:

- `docs/route-map-5173.md`
- `docs/route-map-3014.md`

## Current Status by Requirement

| Requirement | Status | Notes |
| --- | --- | --- |
| Every 5173 product action backed by 3014 data | Partial | 3014 APIs exist; 5173 client migration remains |
| Every 5173 map pin is backend entity | Partial | 3014 imports/provisions map entities; 5173 must consume endpoint |
| Perks linked to partner/campaign/QR/analytics/report | Partial | Local links and APIs exist; product edit/report sync needs 5173 routing |
| Events linked to venue/partner/RSVP/reporting | Partial | APIs exist; product event cards need API migration |
| Campaigns linked to audience/placements/reporting | Partial | Local campaign workflow exists; audience resolver is still simple |
| QR interaction logged/reportable | Wired in 3014 | `/api/qr/scan` persists scans and analytics |
| AI uses structured backend context | Wired locally | External LLM credentials optional |
| Partner workspace reflects 3014 records | Partial | 3014 workspace does; 5173 workspace needs API base alignment |
| Resident action analytics | Wired in 3014 | Product needs to post events |
| Workflow auditable | Wired for new endpoints | Existing generic entity CRUD has compatibility audit gaps |
| Responsive/accessibility | Partial | Design system work exists; route-by-route mobile QA still required |
| No fake maps/placeholders | Partial | Fake maps removed in 3014 admin; 5173 requires separate audit/edit pass |

## Required Next Build Step

Switch 5173 product API clients from Base44/product-local data to the 3014 operational endpoints documented in `docs/api-contracts-5173-3014.md`.


# Map Gap Analysis

## Evidence

- `server.ts` exposes `GET /api/map/entities`, `GET /api/map/pins`, `GET /api/map/entities/:id`, and `POST /api/map/events`.
- Persisted data includes `MapEntityLink: 515`.
- Prior audit output and data inventory show hundreds of map-backed partner/location records.
- Product route `/map` exists in `src/App.tsx`.
- Real Leaflet product map component exists at `src/components/map/unified/UnifiedMapShell.tsx`.
- Attached inventory `/Users/megdude/Downloads/PERKS BAC/IMAGES NEW /PINS/map-pin-inventory.csv` was readable with 932 resident/partner view rows.
- Attached inventory `/Users/megdude/Downloads/downtown-perks-rebuild-main/exports/map-inventory/downtown-perks-map-entities.csv` was readable with 127 canonical map entity rows.

## Classification

| Area | Status | Notes |
| --- | --- | --- |
| Backend map records | Built/Partial | Entity/link data exists. |
| Coordinates | Partial | Need full null/invalid coordinate scan. |
| Partner linkage | Partial | Partner/location data exists; per-pin completeness not fully proven. |
| Perk linkage | Partial | Perk APIs/entities exist; per-pin relationship scan needed. |
| Event linkage | Partial | Event APIs/entities exist; per-pin relationship scan needed. |
| Campaign linkage | Partial | Campaign APIs/entities exist; per-pin relationship scan needed. |
| Analytics | Partial | Map event endpoint exists; analytics event count is sparse. |
| Audit | Partial | Map event code writes audit in backend; runtime not proven. |
| Product actions | Partial | Product UI route exists; live action testing not completed. |

## Missing Proof

- The two attached map CSVs have been inspected but not fully reconciled into `data/downtown-perks-db.json` in this pass.
- Pin selected writes analytics.
- Drawer opened writes analytics.
- Directions clicked writes analytics.
- Save/share writes analytics.
- Event RSVP from map writes RSVP/reporting.
- Perk redemption from map writes redemption/reporting.
- QR scan attributes to map entity.
- Partner mode and resident mode separate data/actions correctly.

## Required Next Audit Command

Run a data scan that lists every map entity with missing `lat`, `lng`, `entity_id`, `partner_id`, `campaign_id`, `perk_id`, or `event_id`, then classify each as real, seed, placeholder, or broken.

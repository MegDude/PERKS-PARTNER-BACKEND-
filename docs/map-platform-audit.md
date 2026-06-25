# Map Platform Audit

## 3014 Map Data

3014 provisions map-visible organizations into tenants, workspaces, partner profiles, locations, campaigns, QR experiences, analytics containers, report containers, and `MapEntityLink` records.

New endpoints:

- `GET /api/map/entities`
- `GET /api/map/pins`
- `GET /api/map/entities/:id`
- `POST /api/map/events`

## Classification

| Source | Classification |
| --- | --- |
| `MapEntityLink` + `PartnerLocation` | Real or seed backend entity |
| `PerkLocation` records with coordinates | Seed backend entity |
| Static decorative Leaflet/OpenStreetMap admin previews | Removed from 3014 admin in prior pass |
| 5173 product-local pins | Requires product code migration to 3014 map endpoints |

## Remaining Risk

5173 map still needs a code pass in its own workspace to make `/api/map/entities` the canonical feed.


# Pin Backend Wiring

Pin shape returned by 3014:

```json
{
  "id": "map_entity_id",
  "entity_type": "venue",
  "entity_id": "map_entity_id",
  "lat": 30.2672,
  "lng": -97.7431,
  "title": "Partner Name",
  "category": "Dining",
  "district": "cbd",
  "status": "active",
  "visibility": "public",
  "partner_id": "partner_id",
  "analytics_summary": {
    "views": 0,
    "saves": 0,
    "directions": 0,
    "redemptions": 0
  }
}
```

Every pin resolves through:

`MapEntityLink -> PartnerLocation/PartnerProfile/PlatformTenant -> Campaign/Perk/Event -> AnalyticsEvent`

Product interactions post to `/api/map/events`.


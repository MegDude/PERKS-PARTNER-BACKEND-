# Entity Relationships & Architecture

## Entity Dependency Graph

```
Building (root)
├── Flat (building_id)
│   └── Tenant (flat_id)
│       ├── MaintenanceTicket (tenant_id)
│       ├── AmenityReservation (tenant_id)
│       ├── EventRSVP (implicit via tenant)
│       └── SurveyResponse (implicit via tenant) [future]
├── Amenity (building_id)
│   └── AmenityReservation (amenity_id)
├── Event (building_id)
│   └── EventRSVP (event_id)
├── Announcement (building_id)
├── Survey (building_id)
│   └── SurveyResponse (survey_id) [future]
└── Broadcast (building_id)

Partner (global)
├── PerkLocation (partner_id)
│   └── PerkRedemption (perk_id)
└── PartnerMessage (partner_id)

GlobalSettings (singleton)
```

---

## Key Relationships

### One-to-Many

| Parent | Child | Link | Notes |
|--------|-------|------|-------|
| Building | Flat | building_id | All units in a building |
| Building | Event | building_id | All events for a building |
| Building | Announcement | building_id | Building-specific notices |
| Building | Survey | building_id | Building-scoped feedback |
| Building | Broadcast | building_id | Bulk messaging |
| Building | Amenity | building_id | Gym, pool, conference rooms |
| Flat | Tenant | flat_id | Current/historical residents |
| Flat | MaintenanceTicket | flat_id | Issues reported for a unit |
| Event | EventRSVP | event_id | Who's attending |
| Amenity | AmenityReservation | amenity_id | Booking history |
| Partner | PerkLocation | partner_id | All venues for a partner |
| Partner | PartnerMessage | partner_id | Inbound from residents |
| PerkLocation | PerkRedemption | perk_id | Usage tracking |
| Tenant | EventRSVP | (implicit) | Resident attending events |
| Tenant | MaintenanceTicket | tenant_id | Issues they reported |
| Tenant | AmenityReservation | tenant_id | Their bookings |
| Survey | SurveyResponse | survey_id | Individual responses [future] |

### Many-to-Many (Modeled as separate entities)

| Table 1 | Table 2 | Junction | Notes |
|---------|---------|----------|-------|
| Tenant | Event | EventRSVP | Track who RSVP'd to what |
| Tenant | PerkLocation | PerkRedemption | Track who redeemed what offer |
| Tenant | Survey | SurveyResponse | Track responses [future] |

---

## Query Patterns by Use Case

### Dashboard / Building Overview

```
Building
  ├→ all Flats (filter by building_id)
  │   └→ all Tenants (sum occupancy)
  ├→ all Events (filter by building_id, count RSVPs)
  ├→ all Announcements (filter by building_id, count reads)
  ├→ all Surveys (filter by building_id, count responses)
  ├→ all Broadcasts (filter by building_id, count delivered)
  ├→ all Amenities (filter by building_id, count reservations)
  └→ all MaintenanceTickets (via flats, count open/closed)

Then aggregate:
  - Occupancy % = count(Tenants) / count(Flats)
  - Perks enrolled % = count(Tenants where perks_enrolled=true) / count(Tenants)
  - Event engagement = sum(EventRSVP count) / Tenants
  - Redemption activity = count(PerkRedemptions for building's residents)
```

### Resident View (Logged In)

```
CurrentUser (Tenant record)
  ├→ own Flat → Building details
  ├→ own EventRSVPs (what they registered for)
  ├→ own MaintenanceTickets (what they reported)
  ├→ own AmenityReservations (their bookings)
  ├→ own SurveyResponses (if they answered) [future]
  ├→ their Building's active Events
  ├→ their Building's published Announcements
  ├→ their Building's active Surveys
  └→ global PerkLocations + their own Redemptions
```

### Partner View

```
CurrentPartner (Partner record)
  ├→ all own PerkLocations (their venues)
  │   └→ all PerkRedemptions (usage per venue)
  ├→ all PartnerMessages (inbound from residents)
  └→ reports: redemptions by perk, by month, unique users, etc.
```

### Reporting / Analytics

```
Building
  └→ BuildingReport:
      ├ Occupancy trend (Tenants over time)
      ├ Perks adoption (Tenants.perks_enrolled)
      ├ Event attendance (sum EventRSVP.count by month)
      ├ Announcement reach (sum Announcement.read_count)
      ├ Maintenance volume (MaintenanceTicket.count by category/priority)
      ├ Partner performance:
      │   ├ PerkRedemptions by partner/perk
      │   ├ Unique users per perk
      │   ├ Redemption trend
      │   └ Top venues
      ├ Survey participation (responses_count vs target_residents)
      └ Engagement score (composite: events, surveys, announcements, perks)
```

---

## Cascade & Integrity Rules

### Soft Deletes (Preferred)

All deletions should be **status-based**, not hard deletes:
- Announcement: `status = 'archived'`
- Event: Add `is_active = false` or `status = 'cancelled'`
- Survey: `status = 'closed'`
- Broadcast: `delivery_status = 'cancelled'` (if needed)
- Partner: `is_active = false`
- PerkLocation: `is_active = false`

### Cascade Rules

| Delete Parent | Effect on Child | Rule |
|---------------|-----------------|------|
| Building | Flat, Event, etc. | Never delete; archive parent instead |
| Flat | Tenant | Archive Tenant; keep Flat for history |
| Event | EventRSVP | Remove RSVPs (or keep as historical) |
| Survey | SurveyResponse | Keep responses for analytics |
| Partner | PerkLocation | Archive locations; keep redemptions |
| Amenity | AmenityReservation | Cancel future reservations |

### Required Fields (Integrity)

- EventRSVP must have valid event_id
- MaintenanceTicket must have valid flat_id
- AmenityReservation must have valid amenity_id
- PerkRedemption should validate perk_id exists
- Announcement/Event must have building_id
- Tenant must have valid flat_id

---

## Data Consistency Checks

### On Write

1. **Building scoping**: Verify building_id matches authenticated user's permissions
2. **Tenant validity**: Ensure tenant_id belongs to building being updated
3. **Date logic**: Event date >= today, survey end_date > start_date, etc.
4. **Status transitions**: Only valid state changes (draft → published, not published → draft)
5. **Unique constraints**: 
   - One Tenant per Flat at a time (or allow multiple with date ranges)
   - One EventRSVP per Tenant+Event

### On Read

1. **Building filter**: All queries filter by building_id unless global scope
2. **Public fields**: Frontend selectors enforce public/private separation
3. **Permission check**: User can only read building data they have access to
4. **Status filters**: Only show active/published records to residents

---

## Future Schema Additions

### SurveyResponse

```json
{
  "id": "uuid",
  "survey_id": "ref(Survey)",
  "tenant_id": "ref(Tenant)",
  "responses": {
    "question_1": "answer_text",
    "question_2": [1, 2, 3]
  },
  "submitted_at": "date-time",
  "created_by": "email"
}
```

### SavedItem

```json
{
  "id": "uuid",
  "tenant_id": "ref(Tenant)",
  "item_type": "enum: perk|event|partner",
  "item_id": "uuid",
  "saved_at": "date-time",
  "removed_at": "date-time (null if still saved)"
}
```

### CommunicationPreference

```json
{
  "id": "uuid",
  "tenant_id": "ref(Tenant)",
  "email_announcements": "boolean",
  "sms_announcements": "boolean",
  "push_events": "boolean",
  "marketing_emails": "boolean",
  "last_updated": "date-time"
}
```

---

## Access Control by Role

### Admin (via URL building_id)
- Read all building-scoped records
- Create/update/archive in building
- View all Tenants, Events, Reports
- Export data
- Assign/manage staff (MaintenanceTicket.assigned_to)

### Resident (via own Tenant record)
- Read own Tenant, Flat, Building
- Create EventRSVP, MaintenanceTicket, SurveyResponse
- Update own preferences, communication settings
- View building's public Events, Announcements, Surveys
- Browse all PerkLocations, create PerkRedemption

### Partner (via Partner record)
- Read own Partner, PerkLocations, PartnerMessages
- Update own PerkLocation details
- View aggregated PerkRedemptions for own perks
- Create PartnerMessages to building admins

### Public (unauthenticated)
- Read only:
  - Public Building profiles
  - Active Events (summary)
  - Perk Locations (full details)
  - Published Announcements (if flagged public)
- No writes

---

## Query Performance Considerations

### Indexed Columns (Recommended)

```
Building: (none special)
Flat: building_id
Tenant: flat_id, email, perks_enrolled
Event: building_id, is_active, date
EventRSVP: event_id, user_email
Announcement: building_id, status, published_at
Survey: building_id, status
MaintenanceTicket: flat_id, tenant_id, status, priority
AmenityReservation: amenity_id, tenant_id, reservation_date
PerkLocation: partner_id, is_active, category
PerkRedemption: perk_id, user_email, redeemed_at
```

### N+1 Queries to Avoid

- Don't loop through Buildings and query Flats for each
- Use JOIN or batch-fetch when possible
- Cache building metadata (list, structure)
- Paginate large result sets (Events, Perks, Residents)

---

## Sync & Consistency with Public Site

### Read Pattern (Public Site → Module Data)

```
Public site subscribes to shared entities via:
1. Shared query helper functions (getBuildingEvents, getPerkList, etc.)
2. Real-time subscriptions (base44.entities.Event.subscribe) if available
3. Periodic polling if subscription not available
```

### Write Pattern (Public Site → Module Data)

```
Public site writes back to shared entities:
1. EventRSVP (resident clicks "Register")
2. PerkRedemption (resident taps "Use Now" or shows code)
3. SurveyResponse (resident submits form)
4. SavedItem (resident favorites a perk) [if schema added]
5. MaintenanceTicket (resident reports issue)
```

### Conflict Resolution

If both sites attempt simultaneous writes:
- Use optimistic locking (timestamp-based)
- Last-write-wins for most fields
- Aggregate fields (counts) use server-side increments
- Building admins have precedence for config changes

---

## Monitoring & Alerting

Track these metrics for data integrity:
- Orphaned records (MaintenanceTicket with no valid flat_id)
- Stale data (old created_dates without updates)
- Consistency gaps (EventRSVP count != actual RSVPs)
- Anomalies (sudden spike in redemptions, announcements not read)
- Sync delays (if public site is consuming realtime)

---

## Documentation Files for Engineering

1. **This file**: Entity relationships, queries, integrity rules
2. **SHARED_DATA_MODEL.md**: Shared entities, ownership, scoping
3. **PUBLIC_DATA_ACCESS.md**: Field-level exposure rules
4. **API_INTEGRATION_NOTES.md** [To create]: Endpoint specs for public site
5. **utils/dataLayer.js**: Shared query helpers (source of truth for queries)
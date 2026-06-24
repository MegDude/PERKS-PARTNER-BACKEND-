# Downtown Perks Shared Data Model

## Objective

This app serves as the operational backend and shared data source for both:
- Downtown Perks Building Module (admin/operational UI)
- Public Downtown Perks site (resident-facing experience)

All core operational data lives in shared Base44 entities, not page-local mock data.

---

## Shared Entities (Source of Truth)

### Core Property Management
- **Building** - Properties, neighborhoods, tiers, amenities, metadata
- **Flat** - Units within buildings (rental, for-sale, occupied status)
- **Tenant** - Residents, lease info, perks enrollment, payment status

### Resident Experience
- **Event** - Community events (date, location, category, RSVP tracking)
- **EventRSVP** - Event participation tracking
- **PerkLocation** - Partner venues, offers, specials, hours
- **PerkRedemption** - Resident usage tracking for reporting
- **SavedItem** - Resident favorites (when needed; currently not in schema)

### Communications & Admin
- **Announcement** - Building notifications, status (draft/published/archived)
- **Broadcast** - Bulk messaging, delivery tracking
- **Survey** - Community feedback (questions, responses, status)
- **SurveyResponse** - Individual responses (when needed; currently not in schema)
- **PartnerMessage** - Partner-to-resident communication

### Partnerships & Operations
- **Partner** - Merchants, categories, contact, active status
- **DANAMember** - Downtown Austin Neighborhood Alliance contacts (if active)

### Facilities & Maintenance
- **Amenity** - Building amenities (gym, pool, conference room, etc.)
- **AmenityReservation** - Booking records
- **MaintenanceTicket** - Resident issues, contractor assignments, status

### Engagement & Reporting
- **GlobalSettings** - System-wide config (business name, logo)

---

## Building-Scoped vs Global

### Building-Scoped (filter by `building_id`)
- Flat
- Tenant
- Event
- EventRSVP (via building's events)
- Announcement
- Broadcast
- Survey
- SurveyResponse (via building's surveys)
- Amenity
- AmenityReservation (via building's amenities)
- MaintenanceTicket (via building's units)

### Global / Cross-Building
- Building (list all)
- PerkLocation (global, may later filter by district/relevance)
- Partner (global, may later link to specific buildings)
- PerkRedemption (global, reportable by building)
- GlobalSettings

---

## Data Ownership & Scoping

### By Role

**Admin (Building Manager)**
- Read/write: all building-scoped records
- Read: global partner/perk data
- Write: events, announcements, surveys, maintenance coordination
- Report: on all building activity

**Resident**
- Read: public building events, announcements, perks
- Write: RSVP, survey responses, maintenance requests, perk redemptions
- Own: their communication preferences, saved items

**Partner**
- Read: their own perk details, redemption counts
- Write: updates to their perk descriptions, hours, specials
- Own: their messaging

---

## Public vs Private Data

### Public (Safe for Frontend/External Consumption)

#### Buildings
- name, address, district, tier, type
- lat, lng, units
- walkScore, tags
- perkDensity, activityScore

#### Events
- title, description, date, time, location, category
- image URL, capacity
- RSVP count (aggregate only)

#### Perks
- name, category, address, district, hours
- perk description, specials, deals_offers
- contact_phone, website
- lat, lng, map_link
- is_featured, is_active

#### Announcements
- title, message
- type, priority
- published_at
- read_count (aggregate)

#### Surveys (if public-facing)
- title, description
- status (active/closed only)
- responses_count

#### Partners
- business_name, category
- contact_phone, contact_email
- website

### Internal / Admin-Only

#### Buildings
- yearBuilt (optional)
- nearbyVenues (internal mapping)

#### Residents (Tenant)
- full name, email, mobile
- lease_end_date, payment_status, rent details
- notes, preferred_language
- perks_tier, perks_enrolled flag
- last_payment_date, next_payment_date

#### Events
- attendee details, RSVP list with user info

#### Announcements
- draft/scheduled status
- notification_sent flag
- internal notes

#### Surveys
- all response data
- questions (raw schema)
- internal analytics

#### Maintenance
- assigned_to (staff email)
- internal notes
- photo URLs (sensitive)
- tenant details

#### Partners
- contact_person, contact details (email/phone)
- internal notes
- joined_date, is_active status

#### Redemptions
- user_email, user_name
- timestamp
- (all fields)

---

## Data Flow & Writes

### From Building Module → Shared Entities

**Create**
- Admin creates event → Event record
- Admin creates announcement → Announcement record
- Admin creates survey → Survey record
- Admin adds resident → Tenant record
- Partner adds perk → PerkLocation record
- Resident submits maintenance → MaintenanceTicket record

**Update**
- Admin publishes announcement → Announcement.status = "published"
- Admin closes survey → Survey.status = "closed"
- Resident marks rent paid → Tenant.payment_status, dates updated
- Admin assigns maintenance → MaintenanceTicket.assigned_to updated
- Partner updates specials → PerkLocation.specials updated

**Delete**
- Archive records (status = archived/closed) rather than hard delete

### From Public Downtown Perks Site → Shared Entities

**Create**
- Resident RSVPs event → EventRSVP record
- Resident submits survey response → SurveyResponse record (when schema added)
- Resident redeems perk → PerkRedemption record
- Resident saves perk → SavedItem record (when schema added)

**Update**
- Resident updates preferences → Tenant.preferred_language, etc.

---

## Current Implementation Status

### Already Wired (Shared Entities)
- ✅ Building
- ✅ Flat
- ✅ Tenant (residents)
- ✅ Event
- ✅ EventRSVP
- ✅ PerkLocation
- ✅ Partner
- ✅ PerkRedemption
- ✅ Announcement
- ✅ Survey
- ✅ Amenity
- ✅ AmenityReservation
- ✅ MaintenanceTicket
- ✅ Broadcast
- ✅ GlobalSettings

### Needs Schema Addition (Design but not implemented)
- SurveyResponse (track individual responses)
- SavedItem (resident favorites)
- CommunicationPreference (opt-in/out flags)

### Page-Local Mock Data (To Refactor)

| Page | Status | Mock Data | Refactor Notes |
|------|--------|-----------|-----------------|
| Events | ⚠️ Partially | `eventsData` static array | Replace with Event entity query |
| EngagementHub | ⚠️ Partial | Journey/flow mock objects | Replace with real survey + broadcast data |
| PartnerDashboard | ✅ Wired | Uses real Partner + PerkRedemption | Already reads from entities |
| Dashboard | ✅ Wired | Uses Building, Tenant, Perk data | Already connected |
| Residents | ✅ Wired | Fetches from Tenant + Flat | Already connected |
| Downtown Perks | ✅ Wired | Uses PerkLocation entity | Already connected |
| Announcements | ✅ Wired | CRUD on Announcement entity | Already connected |

---

## Recommended Data Access Patterns

### For Pages (Building Module)

```js
// Instead of local queries everywhere, use shared helpers
import { 
  getBuildingEvents,
  getBuildingAnnouncements,
  getBuildingPerks,
  getBuildingResidents,
} from '@/utils/dataLayer';

// In a page:
const { data: events } = useQuery({
  queryKey: ['building-events', buildingId],
  queryFn: () => getBuildingEvents(buildingId)
});
```

### For Reports

```js
import { 
  getBuildingEngagementMetrics,
  getPartnerPerformance,
  getResidentSegments,
} from '@/utils/dataLayer';

// All reporting reads from the same entities operations use
```

### For Public Site

```js
import { 
  getPublicBuildingProfile,
  getPublicEventListing,
  getPublicPerkListing,
} from '@/utils/dataLayer';

// These expose only public-safe fields
```

---

## Next Steps

1. **Implement data layer helpers** (`utils/dataLayer.js`)
2. **Refactor remaining mock-data pages** (Events, EngagementHub)
3. **Add missing schemas** if needed (SurveyResponse, SavedItem)
4. **Create PUBLIC_DATA_ACCESS.md** with field-level exposure rules
5. **Create ENTITY_RELATIONSHIPS.md** with ER diagram guidance
6. **Update pages to use shared helpers** progressively
7. **Add backend read-only endpoints** for public site consumption (if Base44 supports)

---

## Success Criteria

- [x] All entities defined and documented
- [ ] Page-local mock data refactored to entity queries
- [ ] Shared data access helpers created
- [ ] Public vs private fields clearly separated
- [ ] Building scoping consistent across all pages
- [ ] Preview remains stable with shared entities
- [ ] Documentation complete and clear
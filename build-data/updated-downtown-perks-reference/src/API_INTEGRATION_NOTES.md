# API Integration Notes for Public Downtown Perks Site

## Overview

This document describes how the public Downtown Perks website should integrate with the Building Module (this app) to read and write shared operational data.

---

## Integration Architecture

The public site should:

1. **Read** shared entities directly from this app's data layer
2. **Write** back to shared entities when residents take actions
3. **Query** helpers from `/utils/dataLayer.js` to ensure data consistency
4. **Filter** results through public selectors to expose only safe fields

The Building Module serves as the operational source of truth. The public site consumes data from it and writes engagement back into it.

---

## Read Patterns

### 1. Building Directory

**Endpoint/Query:**
```js
import { getAllBuildings, makePublicBuilding } from '@/utils/dataLayer';

const buildings = await getAllBuildings();
const publicBuildings = buildings.map(b => makePublicBuilding(b));
```

**Returns:**
```json
{
  "id": "bldg_001",
  "name": "The Shore",
  "address": "123 Downtown St",
  "district": "rainey",
  "tier": 1,
  "type": "condo",
  "lat": 30.2672,
  "lng": -97.7431,
  "units": 156,
  "priceTier": "premium",
  "walkScore": 92,
  "tags": ["iconic", "walkable"]
}
```

**Usage:** Building landing pages, discovery, property details

---

### 2. Event Listings (Building-Specific)

**Query:**
```js
import { getBuildingEvents, makePublicEvent } from '@/utils/dataLayer';

const buildingEvents = await getBuildingEvents(buildingId);
const publicEvents = buildingEvents.map(makePublicEvent);
```

**Returns:**
```json
{
  "id": "evt_001",
  "title": "Happy Hour at The Metropolitan",
  "description": "Join fellow residents",
  "date": "2026-04-19T17:30:00Z",
  "location": "The Metropolitan - Rooftop",
  "category": "networking"
}
```

**Usage:**
- Events calendar for a building
- Event discovery widget
- RSVP buttons on event cards

---

### 3. Perk Listings (Global)

**Query:**
```js
import { getAllPerkLocations, makePublicPerk, searchPerks } from '@/utils/dataLayer';

// Get all active perks
const allPerks = await getAllPerkLocations();
const publicPerks = allPerks.map(makePublicPerk);

// Or search with filters
const filtered = await searchPerks('coffee', { category: 'Coffee', district: 'rainey' });
```

**Returns:**
```json
{
  "id": "perk_001",
  "name": "Brew & Co",
  "category": "Coffee",
  "address": "456 Congress Ave",
  "district": "rainey",
  "lat": 30.2650,
  "lng": -97.7400,
  "perk": "Free upgrade to medium",
  "hours": "6am-8pm Daily",
  "website": "https://brewandco.com",
  "contact_phone": "(512) 555-0100",
  "specials": "10% off every Tuesday",
  "is_featured": true
}
```

**Usage:**
- Perks discovery page
- Building-specific perk filters
- "Top Picks" widgets
- Map view of venues

---

### 4. Announcements (Building-Specific, Public Only)

**Query:**
```js
import { getBuildingAnnouncements, makePublicAnnouncement } from '@/utils/dataLayer';

const announcements = await getBuildingAnnouncements(buildingId, true); // true = published only
const publicAnnouncements = announcements.map(makePublicAnnouncement);
```

**Returns:**
```json
{
  "id": "ann_001",
  "title": "New Downtown Perks Partnership",
  "message": "We're excited to announce...",
  "type": "community_news",
  "priority": "medium",
  "published_at": "2026-04-13T10:00:00Z"
}
```

**Usage:**
- Building news/updates feed
- Community bulletin boards

---

### 5. Partner Directory

**Query:**
```js
import { getAllPartners } from '@/utils/dataLayer';

const partners = await getAllPartners(true); // true = active only
```

**Returns (Public-Safe Subset):**
```json
{
  "id": "partner_001",
  "business_name": "East Side Brewing Co",
  "category": "Bar/Nightlife",
  "address": "789 E 6th St",
  "is_active": true
}
```

**Usage:**
- Partner listing pages
- "Featured Partners" sections

---

## Write Patterns

### 1. Event RSVP

**When resident clicks "Register":**
```js
import { base44 } from '@/api/base44Client';

const response = await base44.entities.EventRSVP.create({
  event_id: eventId,
  event_name: event.title,
  event_date: event.date,
  registered_at: new Date().toISOString()
});
```

**Success Response:**
```json
{
  "id": "rsvp_001",
  "event_id": "evt_001",
  "registered_at": "2026-04-15T14:30:00Z"
}
```

**Building Module sees:** New RSVP in Dashboard → Event attendance metrics ↑ → Engagement score updated

---

### 2. Perk Redemption

**When resident taps "Use Now" or shows code:**
```js
import { base44 } from '@/api/base44Client';

const response = await base44.entities.PerkRedemption.create({
  perk_id: perkId,
  perk_name: perk.name,
  perk_category: perk.category,
  user_email: currentUser.email,
  user_name: currentUser.full_name,
  redeemed_at: new Date().toISOString()
});
```

**Building Module sees:** New redemption → Partner analytics update → Top perks list refreshes

---

### 3. Survey Response Submission

**When resident submits survey:**
```js
import { base44 } from '@/api/base44Client';

// Note: Requires SurveyResponse entity to be added to schema
const response = await base44.entities.SurveyResponse.create({
  survey_id: surveyId,
  tenant_id: currentTenant.id,
  responses: {
    question_1: "answer",
    question_2: [1, 2]
  },
  submitted_at: new Date().toISOString()
});
```

**Building Module sees:** Survey response count increments → Completion rate updates

---

### 4. Maintenance Request

**When resident reports an issue:**
```js
import { base44 } from '@/api/base44Client';

const response = await base44.entities.MaintenanceTicket.create({
  tenant_id: currentTenant.id,
  flat_id: currentTenant.flat_id,
  title: "Leaky faucet in kitchen",
  description: "Water is dripping from...",
  category: "plumbing",
  priority: "medium",
  photo_urls: [uploadedPhotoUrl]
});
```

**Building Module sees:** New ticket in maintenance dashboard → Priority queue updated

---

### 5. Announcement Read Tracking (Optional)

**If implemented for analytics:**
```js
import { base44 } from '@/api/base44Client';

// Increment read_count when announcement is viewed
await base44.entities.Announcement.update(announcementId, {
  read_count: (announcement.read_count || 0) + 1
});
```

---

## Error Handling

### API Errors

All data layer functions may throw errors. Wrap calls in try/catch:

```js
try {
  const events = await getBuildingEvents(buildingId);
  setEvents(events);
} catch (error) {
  console.error('Failed to load events:', error);
  // Show fallback UI or retry
  setEvents([]);
}
```

### Missing Building Context

If `buildingId` is null or missing:
```js
const { buildingId } = useParams();
if (!buildingId) {
  return <EmptyState message="Building not found" />;
}
```

### No Data Yet

Empty state handling:
```js
if (events.length === 0) {
  return (
    <div className="text-center py-12">
      <p className="text-textSecondary">No events scheduled yet</p>
    </div>
  );
}
```

---

## Caching & Performance

### React Query Usage (Recommended)

The public site should use the same React Query setup:

```js
import { useQuery } from '@tanstack/react-query';
import { getBuildingEvents } from '@/utils/dataLayer';

const { data: events, isLoading } = useQuery({
  queryKey: ['building-events', buildingId],
  queryFn: () => getBuildingEvents(buildingId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Cache Keys Consistency

Use this pattern for all queries:

| Entity | Key Pattern | Example |
|--------|------------|---------|
| Events | `building-events-{buildingId}` | `building-events-bldg_001` |
| Residents | `building-residents-{buildingId}` | `building-residents-bldg_001` |
| Perks | `all-perks` | `all-perks` |
| Announcements | `building-announcements-{buildingId}` | `building-announcements-bldg_001` |
| Surveys | `building-surveys-{buildingId}` | `building-surveys-bldg_001` |

---

## Real-Time Updates (Future)

When ready, subscribe to entity changes:

```js
import { base44 } from '@/api/base44Client';

useEffect(() => {
  const unsubscribe = base44.entities.Event.subscribe((event) => {
    // event.type = 'create' | 'update' | 'delete'
    // event.data = new/updated record
    // Re-fetch or update local state
    refetchEvents();
  });

  return unsubscribe;
}, []);
```

---

## Authentication & Permissions

### User Authentication

The public site should authenticate residents:

```js
import { base44 } from '@/api/base44Client';

const user = await base44.auth.me();
if (!user) {
  base44.auth.redirectToLogin();
}
```

### Building-Scoped Access

Residents should only see data from their building:

```js
const { buildingId } = currentTenant.flatDetails.building_id;
const events = await getBuildingEvents(buildingId);
```

### Admin-Only Operations

Some operations require admin role:

```js
if (user.role !== 'admin') {
  throw new Error('Unauthorized');
}
```

---

## Data Sync Guarantees

### Consistency

- **Optimistic Writes**: Update UI immediately, verify server response
- **Conflict Resolution**: Last-write-wins for most fields
- **Race Conditions**: Use timestamps to detect stale updates

Example:

```js
const optimisticRsvp = {
  event_id: eventId,
  registered_at: new Date().toISOString()
};

setRsvpStatus('registered'); // Optimistic update

try {
  const response = await base44.entities.EventRSVP.create(optimisticRsvp);
  // Confirm server accepted
} catch (error) {
  setRsvpStatus('error'); // Rollback
}
```

---

## Monitoring & Debugging

### Log Queries

In development, log data layer calls:

```js
const originalCreate = base44.entities.EventRSVP.create;
base44.entities.EventRSVP.create = async (data) => {
  console.log('Creating RSVP:', data);
  const result = await originalCreate(data);
  console.log('RSVP created:', result);
  return result;
};
```

### Performance Metrics

Track slow queries:

```js
const startTime = performance.now();
const events = await getBuildingEvents(buildingId);
const duration = performance.now() - startTime;
if (duration > 1000) {
  console.warn(`Slow query: getBuildingEvents took ${duration}ms`);
}
```

---

## Versioning & Breaking Changes

### API Stability

The `dataLayer.js` module is the public API. Changes are versioned:

- **v1.0** (Current): Entity-based queries
- **v2.0** (Future): Cached/optimized queries, subscriptions

Breaking changes will be announced with migration guide.

### Migration Path

If entity schemas change:

```js
// Old: direct field access
event.event_date

// New: use getter function (if added)
getEventDate(event);
```

---

## Support & Documentation

For issues:

1. Check SHARED_DATA_MODEL.md for entity definitions
2. Check PUBLIC_DATA_ACCESS.md for field exposure rules
3. Check ENTITY_RELATIONSHIPS.md for query patterns
4. Debug using Runtime Logs in Base44 dashboard
5. Ask for help in the Downtown Perks Slack channel

---

## Example: Building Profile + Events + Perks

Complete integration example for building discovery page:

```js
import { 
  getPublicBuildingProfile,
  getPublicEventListing,
  getAllPerkLocations,
  makePublicPerk
} from '@/utils/dataLayer';

export async function getBuildingHub(buildingId) {
  const [building, events, allPerks] = await Promise.all([
    getPublicBuildingProfile(buildingId),
    getPublicEventListing(buildingId),
    getAllPerkLocations()
  ]);

  const relevantPerks = allPerks
    .filter(p => p.district === building.district)
    .slice(0, 6);

  return {
    building,
    events,
    perks: relevantPerks,
    engagementScore: building.activityScore * 100
  };
}
```

---

## Next Phase: Backend Endpoints

When the public site needs higher performance, create backend endpoints:

```js
// functions/getPublicBuildingHub.js
// Serves only public data, cached on CDN

export async function getPublicBuildingHub(buildingId) {
  // Use data layer internally
  // Return only public fields
  // Cache for 5 minutes
}
```

Then public site calls:
```js
const hub = await base44.functions.invoke('getPublicBuildingHub', { buildingId });
``
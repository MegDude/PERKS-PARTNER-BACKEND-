# Public Data Access & Field Exposure Guide

## Overview

This document defines which entity fields are safe to expose to the public Downtown Perks site versus which must remain admin-only.

The public site reads from this app's shared entities but receives only public-safe data through:
- Carefully scoped queries
- Frontend selectors that filter fields
- Backend endpoints that return only public subsets (if needed later)

---

## Field-Level Exposure Rules

### Building Entity

**Public-Safe Fields**
```
name
address
district
tier
type
lat
lng
units
priceTier
walkScore
perkDensity
activityScore
tags
```

**Admin-Only Fields**
```
yearBuilt
nearbyVenues
```

**Access Pattern**
```js
// Public endpoint/selector
const publicBuilding = {
  id: building.id,
  name: building.name,
  address: building.address,
  district: building.district,
  tier: building.tier,
  type: building.type,
  lat: building.lat,
  lng: building.lng,
  units: building.units,
  priceTier: building.priceTier,
  walkScore: building.walkScore,
  tags: building.tags,
  // metadata for filtering/discovery
  perkDensity: building.perkDensity,
  activityScore: building.activityScore,
};
```

---

### Tenant (Resident) Entity

**Public-Safe Fields**
```
None directly exposed in listings.

When a resident is logged in:
- Their own name, email, mobile
- Their own lease info
- Their own perks tier
- Their own communication preferences
```

**Admin-Only Fields**
```
flat_id
lease_end_date
yearly_rent
rent_interval_months
rent_per_interval
next_payment_date
last_payment_date
payment_status
notes
perks_enrolled
preferred_language
move_in_date
```

**Access Pattern**
```js
// Self-only in app, never in public lists
if (currentUser.id === tenantId) {
  return {
    id: tenant.id,
    name: tenant.name,
    email: tenant.email,
    mobile_number: tenant.mobile_number,
    perks_tier: tenant.perks_tier,
    perks_enrolled: tenant.perks_enrolled,
    preferred_language: tenant.preferred_language,
  };
}
// For admin: full object
```

---

### Event Entity

**Public-Safe Fields**
```
id
title (event name)
description
category
date (date-time)
location
image_url (if added to schema)
capacity (optional)
is_active
status (if "published" or "active" only)
```

**Admin-Only Fields**
```
building_id
created_by
internal_notes
organizer_email
organizer_phone
attendee_list (before publishing)
rsvp_analytics
scheduled_time (internal prep)
```

**Access Pattern**
```js
// Public: active/published events only
const publicEvent = {
  id: event.id,
  title: event.title,
  description: event.description,
  category: event.category,
  date: event.date,
  location: event.location,
  capacity: event.capacity,
  rsvpCount: event.eventRsvps?.length || 0, // aggregate only
};
```

---

### EventRSVP Entity

**Public-Safe Fields**
```
event_id
event_name
event_date
registered_at (for user's own RSVP)
```

**Admin-Only Fields**
```
user_email (not in public)
user_name (not in public)
internal_notes
no_show_status
```

**Access Pattern**
```js
// User's own RSVP only (not exposed in listings)
if (currentUser.email === rsvp.user_email) {
  return {
    event_id: rsvp.event_id,
    registered_at: rsvp.registered_at,
  };
}
// Admin can see list of RSVPs
```

---

### PerkLocation (Offer/Venue) Entity

**Public-Safe Fields**
```
id
name
category
category_key
address
district
lat
lng
perk (offer description)
perk_type
hours
website
contact_phone
specials
deals_offers
events_available
is_featured
is_active
relevance_score
map_link
```

**Admin-Only Fields**
```
partner_id (ok for admin context)
source
```

**Access Pattern**
```js
// Fully public for listings
const publicPerk = {
  id: perk.id,
  name: perk.name,
  category: perk.category,
  address: perk.address,
  district: perk.district,
  lat: perk.lat,
  lng: perk.lng,
  perk: perk.perk,
  hours: perk.hours,
  website: perk.website,
  contact_phone: perk.contact_phone,
  specials: perk.specials,
  deals_offers: perk.deals_offers,
  is_featured: perk.is_featured,
  is_active: perk.is_active,
  map_link: perk.map_link,
};
```

---

### Partner Entity

**Public-Safe Fields**
```
id
business_name
category
address
is_active
```

**Admin-Only Fields**
```
contact_email
contact_phone
contact_person
joined_date
notes
```

**Access Pattern**
```js
// Public: basic info for partner listings
const publicPartner = {
  id: partner.id,
  business_name: partner.business_name,
  category: partner.category,
  address: partner.address,
  is_active: partner.is_active,
};

// Admin: full contact details
```

---

### PerkRedemption Entity

**Public-Safe Fields**
```
For aggregated reporting:
- count by perk
- count by category
- trending perks

For the user's own redemptions (if exposed):
- perk_name
- redeemed_at
```

**Admin-Only Fields**
```
perk_id (admin context)
user_email
user_name
id (individual record)
created_by timestamp
```

**Access Pattern**
```js
// Never expose individual redemptions with user names in public
// Only expose aggregates:
const publicRedemptionMetrics = {
  totalRedemptions: 245,
  topPerks: ['Venue A', 'Venue B', 'Venue C'],
  redemptionsByCategory: { coffee: 80, dining: 120, ... },
};

// User's own activity (in their profile, if supported):
const userRedemptions = redemptions
  .filter(r => r.user_email === currentUser.email)
  .map(r => ({
    perk_name: r.perk_name,
    redeemed_at: r.redeemed_at,
  }));
```

---

### Announcement Entity

**Public-Safe Fields**
```
ONLY if intended for public display:
- id
- title
- message
- type (if non-sensitive)
- published_at
- read_count (aggregate)

Many announcements will be admin/building-only.
```

**Admin-Only Fields**
```
building_id
status (draft/scheduled/published)
priority
notification_sent
scheduled_for
```

**Access Pattern**
```js
// Filter to "published" status only
// Filter by building_id if building-specific
const publicAnnouncements = announcements
  .filter(a => a.status === 'published' && a.building_id === buildingId)
  .map(a => ({
    id: a.id,
    title: a.title,
    message: a.message,
    published_at: a.published_at,
  }));
```

---

### Survey Entity

**Public-Safe Fields**
```
If survey is public-facing:
- id
- title
- description
- status (active/closed only)
- responses_count
- ends_at
```

**Admin-Only Fields**
```
building_id
questions (internal)
starts_at
target_residents
responses (details)
```

**Access Pattern**
```js
// Only expose active surveys
const publicSurveys = surveys
  .filter(s => s.status === 'active')
  .map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    status: s.status,
    responses_count: s.responses_count,
  }));
```

---

### Amenity & AmenityReservation

**Public-Safe Fields (Amenity)**
```
id
name
description
capacity
hours_start
hours_end
is_active
```

**Admin-Only (AmenityReservation)**
```
All fields are operational only.
Resident views own reservations; public doesn't see others' bookings.
```

---

### MaintenanceTicket

**Public-Safe Fields**
```
For the resident who filed it:
- id
- title
- description
- category
- priority
- status
- completed_at
```

**Admin-Only Fields**
```
tenant_id
flat_id
photo_urls
assigned_to (staff)
notes (internal)
created_by
```

**Access Pattern**
```js
// Resident sees only their own tickets
const userTickets = tickets
  .filter(t => t.tenant_id === currentTenant.id)
  .map(t => ({
    id: t.id,
    title: t.title,
    category: t.category,
    priority: t.priority,
    status: t.status,
    completed_at: t.completed_at,
  }));
```

---

## Implementation Checklist

- [ ] Create selector/filter function for each public-safe entity subset
- [ ] Add comments in utils/dataLayer.js marking which queries return public data
- [ ] Backend endpoints (if needed) implement these field subsets
- [ ] Frontend selectors used consistently across all pages
- [ ] Public site imports from shared entity queries, filtered appropriately
- [ ] Document any third-party integrations that consume this data

---

## Example: Public Event Listing

```js
// In public Downtown Perks site
import { getBuildingEvents } from '@/utils/dataLayer';

async function getPublicEventListing(buildingId) {
  const allEvents = await getBuildingEvents(buildingId);
  return allEvents
    .filter(e => e.status === 'published' || e.is_active)
    .map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      date: e.date,
      location: e.location,
      category: e.category,
      rsvpCount: e.eventRsvps?.length || 0,
      // NO building_id, NO internal notes, NO organizer contact
    }));
}
```

---

## Evolving the Public API

As the public site grows, consider:
1. Wrapping selectors in backend endpoints (faster, more secure)
2. Adding caching for public data reads
3. Versioning public API if schema changes
4. Rate limiting if public access grows
5. Analytics on what the public site queries most frequently
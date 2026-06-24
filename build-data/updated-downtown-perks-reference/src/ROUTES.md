# Route Reference — Downtown Perks Building Module

Complete route map and navigation structure.

---

## Route Hierarchy

```
/buildings/:buildingId                          # BuildingLayout (wrapper)
├── /                                            # Dashboard (admin)
├── /residents                                   # Residents (admin/resident)
├── /events                                      # Events (all)
├── /events/:eventId                             # Event Detail (all)
├── /perks                                       # Perks Directory (all)
├── /perks/:perkId                               # Perk Detail (all)
├── /reports                                     # Perk Reports (admin)
├── /surveys                                     # Survey Manager (admin)
├── /announcements                               # Announcement Manager (admin)
├── /announcements-feed                          # Announcement Feed (resident)
├── /engagement                                  # Engagement Hub (admin)
├── /segmentation                                # Segmentation (admin)
├── /amenities                                   # Amenity Reservations (all)
├── /maintenance                                 # Maintenance Tickets (all)
└── /partners                                    # Partner Dashboard (admin)

/partner-portal                                  # Partner Portal (self-service)
```

---

## Route Details

### `/buildings/:buildingId`
**Component:** `BuildingLayout`  
**Purpose:** Route wrapper + tab navigation  
**Provides:** `buildingId`, `building` via `useOutletContext()`  
**Access:** All authenticated users  
**Params:**
- `buildingId` (required): UUID of building

**Tab Navigation:**
- Admin sees all 12 tabs
- Resident sees 5 tabs
- Partner redirected to partner-portal

---

### `/buildings/:buildingId/`
**Component:** `Dashboard`  
**Purpose:** Building overview + command center  
**Access:** Admin only  
**Key Features:**
- Real-time metrics (residents, perks enrollment, engagement)
- Partner performance cards
- Perks enrollment trend chart
- Building selector (if multi-building)

**Query Keys:** `buildings`, `tenants`, `flats`, `broadcasts`, `surveys`, `partners`, `redemptions`

---

### `/buildings/:buildingId/residents`
**Component:** `Residents`  
**Purpose:** Resident directory + management  
**Access:** Admin (CRUD), Resident (view own)  
**Key Features:**
- Searchable resident list
- Contact info, lease details, perks status
- Add/edit/delete tenant modals
- Filter by search query

**Query Keys:** `tenants`, `flats`, `buildings`

---

### `/buildings/:buildingId/events`
**Component:** `Events`  
**Purpose:** Event listing  
**Access:** All users  
**Key Features:**
- Event cards (title, date, location, capacity)
- Category-based filtering
- Event detail modal
- Share event workflow

**Query Keys:** `events` (no building filter — events may be multi-building)

---

### `/buildings/:buildingId/events/:eventId`
**Component:** `EventDetail`  
**Purpose:** Single event details  
**Access:** All users  
**Params:**
- `eventId` (required): UUID of event

**Key Features:**
- Full event description
- RSVP button
- Share options
- Related events

**Query Keys:** `events`, `eventRSVP`

---

### `/buildings/:buildingId/perks`
**Component:** `DowntownPerks`  
**Purpose:** Perks directory + map  
**Access:** All users  
**Key Features:**
- List + map view toggle
- Category filtering (restaurants, bars, coffee, fitness, retail)
- Distance-based sorting
- Search by name/category

**Query Keys:** `perkLocations`, `buildings`, `partners`, `redemptions`

---

### `/buildings/:buildingId/perks/:perkId`
**Component:** `PerkDetail`  
**Purpose:** Single perk/venue details  
**Access:** All users  
**Params:**
- `perkId` (required): UUID of perk

**Key Features:**
- Perk description + offer
- Hours, contact, website link
- Map embed
- Partner contact info

**Query Keys:** `perkLocations`, `perkRedemptions`

---

### `/buildings/:buildingId/reports`
**Component:** `PerkReporting`  
**Purpose:** Perk performance analytics (admin)  
**Access:** Admin only  
**Key Features:**
- Partner leaderboard
- Redemption trends (chart)
- Top perks by engagement
- CSV export

**Query Keys:** `perkLocations`, `partners`, `perkRedemptions`

---

### `/buildings/:buildingId/surveys`
**Component:** `Surveys`  
**Purpose:** Survey CRUD + results  
**Access:** Admin (create/manage), Resident (view/respond)  
**Key Features:**
- Survey list with status badges
- Survey creation form
- Results visualization
- Export responses as CSV

**Query Keys:** `surveys`

---

### `/buildings/:buildingId/announcements`
**Component:** `AnnouncementManager`  
**Purpose:** Announcement creation + management  
**Access:** Admin only  
**Key Features:**
- Create/edit/delete announcements
- Type selection (urgent, maintenance, community_news, event, reminder)
- Priority level
- Push notification trigger
- Read count tracking

**Query Keys:** `announcements`

---

### `/buildings/:buildingId/announcements-feed`
**Component:** `AnnouncementFeed`  
**Purpose:** Resident-facing announcement feed  
**Access:** Resident, Admin  
**Key Features:**
- Chronological list of published announcements
- Type + priority badges
- Read-tracking (auto-updates on view)
- Search + filter by type

**Query Keys:** `announcements`

---

### `/buildings/:buildingId/engagement`
**Component:** `EngagementHub`  
**Purpose:** Resident engagement analytics  
**Access:** Admin only  
**Key Features:**
- Broadcast stats (sent, open rate, CTR)
- Resident activity timeline
- Engagement segment breakdown
- Trend charts

**Query Keys:** `broadcasts`, `tenants`, `surveys`, `announcements`

---

### `/buildings/:buildingId/segmentation`
**Component:** `Segmentation`  
**Purpose:** Resident segmentation by engagement  
**Access:** Admin only  
**Key Features:**
- High / Medium / Low engagement lists
- Resident contact info by segment
- Export segment as CSV

**Query Keys:** `tenants`, `flats`, `buildings`

---

### `/buildings/:buildingId/amenities`
**Component:** `AmenityReservations`  
**Purpose:** Amenity listing + booking  
**Access:** All users  
**Key Features:**
- Amenity cards (gym, rooftop, conference room, etc.)
- Available time slots
- Reservation creation modal
- Cancel reservation

**Query Keys:** `amenities`, `amenityReservations`

---

### `/buildings/:buildingId/maintenance`
**Component:** `MaintenanceTickets`  
**Purpose:** Maintenance request management  
**Access:** All users  
**Key Features:**
- Create maintenance request
- Status tracking (open, in progress, completed)
- Category selection (plumbing, electrical, hvac, appliance, structural)
- Assigned staff view
- Priority level

**Query Keys:** `maintenanceTickets`, `tenants`, `flats`

---

### `/buildings/:buildingId/partners`
**Component:** `PartnerDashboard`  
**Purpose:** Partner performance (admin)  
**Access:** Admin only  
**Key Features:**
- Partner list with metrics
- Redemption activity
- Monthly trend chart
- Partner messaging interface
- Export reports

**Query Keys:** `partners`, `perkLocations`, `perkRedemptions`, `partnerMessages`

---

### `/partner-portal`
**Component:** `PartnerPortal`  
**Purpose:** Partner self-service perk management  
**Access:** Partner only  
**Note:** **NOT building-scoped** — partners manage their own perks across all properties

**Key Features:**
- Partner profile info
- Perk listing management
- Edit offer/specials/deals
- Redemption statistics
- Monthly performance chart

**Query Keys:** `partners`, `perkLocations`, `perkRedemptions`

---

## Query Key Naming Convention

```
queryKey: ['entity', buildingId?, filters?]

Examples:
['buildings']                         # All buildings
['residents', buildingId]            # Residents in building
['announcements', buildingId]        # Announcements for building
['surveys', buildingId]              # Surveys for building
['partners']                         # All partners (global)
['perkLocations']                    # All perks (global)
['perkRedemptions']                  # All redemptions (global)
```

---

## Navigation Links

### From Parent App to Building Module
```jsx
// Link to building overview
<Link to={`/buildings/${buildingId}`}>View Building</Link>

// Link to specific feature
<Link to={`/buildings/${buildingId}/residents`}>Residents</Link>
<Link to={`/buildings/${buildingId}/announcements`}>Announcements</Link>
```

### From Building Module to Parent App
```jsx
// Navigate back to buildings list
<Link to="/buildings">Back to Buildings</Link>

// Or use router
navigate('/buildings');
```

---

## Deep Links

### Admin Direct Links
```
/buildings/:buildingId                    # Dashboard
/buildings/:buildingId/residents          # Resident Management
/buildings/:buildingId/surveys            # Surveys
/buildings/:buildingId/announcements      # Announcements
/buildings/:buildingId/reports            # Analytics
```

### Resident Direct Links
```
/buildings/:buildingId/events             # Events
/buildings/:buildingId/perks              # Perks
/buildings/:buildingId/announcements-feed # Announcements Feed
/buildings/:buildingId/amenities          # Amenity Booking
```

### Partner Direct Link
```
/partner-portal                           # Partner Self-Service
```

---

## Error States

### Invalid Building ID
- User navigates to `/buildings/invalid-id`
- BuildingLayout renders "Building not found"
- Can navigate back to `/buildings` (assumed parent route)

### Unauthorized Role
- Resident navigates to `/buildings/:id/announcements` (admin-only)
- Page renders "Access denied"
- Can navigate to `/buildings/:id/announcements-feed` (resident-allowed)

### Missing Building Context
- Page fails to extract `buildingId` from params
- Query returns undefined
- Loading spinner until error is displayed

---

## Route Guards (Role-Based)

**Not enforced at route level** — each page implements access checks.

Pattern:
```jsx
const isAdmin = user?.role === 'admin';

if (!isAdmin) {
  return <div>Access denied. Admins only.</div>;
}
```

---

## Future Routes (Out of Scope for v1)

- `/buildings/:id/communications` — In-app messaging
- `/buildings/:id/billing` — Rent payment tracking
- `/buildings/:id/documents` — Lease & form storage
- `/buildings/:id/directory` — Resident directory (phonebook)
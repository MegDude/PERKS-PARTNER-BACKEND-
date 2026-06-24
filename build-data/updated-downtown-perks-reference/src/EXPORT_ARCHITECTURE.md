# Downtown Perks Building Tab Module - Export Architecture

## Overview

This module is designed to be integrated into the main Downtown Perks app as a reusable Building Tab feature set. It provides comprehensive property management, resident engagement, partner coordination, and perks analytics.

---

## Module Structure

### Route Hierarchy

```
/building                          # Building management root
├── /overview                      # Building dashboard, stats, engagement trends
├── /residents                     # Resident directory, profiles, leases
├── /events                        # Community events calendar & RSVP management
├── /perks                         # Downtown perks listings, map view, filters
├── /reports                       # Performance reporting, venue analytics
├── /engagement                    # Building engagement hub (broadcasts, surveys)
├── /segmentation                  # Resident segmentation analysis
├── /amenities                     # Amenity reservations & booking
├── /maintenance                   # Maintenance ticket tracking
├── /partners                      # Partner dashboard & performance
├── /partner-portal                # Partner self-service portal
└── /perk-reporting                # Detailed perk redemption analytics
```

---

## User Role Access

### Admin / Property Manager
Full access to:
- Building overview & analytics
- Resident management (add, edit, delete)
- Event creation & management
- Engagement tools (broadcasts, surveys)
- Partner performance tracking
- Reporting & segmentation
- Amenity & maintenance management

### Resident
View-only access to:
- Events & RSVP
- Perks (list & map view with filters)
- Personal profile & lease info
- Amenity reservations
- Maintenance ticket submission
- Redemption history

### Partner
Access to:
- Partner portal
- Perk performance metrics
- Redemption analytics
- Messaging from residents

---

## Core Components

### UI Components (Reusable)
Located in `/components`:

**Dashboard**
- `StatsCards.jsx` - KPI metric cards
- `DynamicBuildingOverview.jsx` - Building quick stats

**Engagement**
- `ResidentAnalytics.jsx` - Engagement charts
- `BroadcastSender.jsx` - Message broadcast interface
- `SurveyManager.jsx` - Survey creation & results
- `PartnerMessaging.jsx` - Partner communication modal

**Tenants**
- `TenantModal.jsx` - Add/edit tenant form
- `TenantDetailsSheet.jsx` - Resident profile sidebar

**Maintenance**
- `TicketModal.jsx` - Issue submission
- `TicketDetails.jsx` - Ticket detail view

**Amenities**
- `ReservationModal.jsx` - Amenity booking interface

**Map & Location**
- `PerkMap.jsx` - Interactive leaflet map with venue pins

### Page Modules (Feature-level)

**Building Management**
- `Dashboard.jsx` - Building overview, KPIs, trends, tenant mgmt
- `Residents.jsx` - Resident directory & filtering
- `AmenityReservations.jsx` - Amenity availability & booking
- `MaintenanceTickets.jsx` - Issue tracking & assignment

**Community**
- `Events.jsx` - Event calendar & community engagement
- `EngagementHub.jsx` - Broadcast, survey, communication hub
- `BuildingEngagement.jsx` - Engagement analytics

**Perks & Analytics**
- `DowntownPerks.jsx` - Perks marketplace with map view
- `PerkAnalytics.jsx` - Perk performance dashboard
- `PerkReporting.jsx` - Detailed venue analytics & recommendations
- `Segmentation.jsx` - Resident segmentation by engagement

**Portfolio**
- `DeveloperEngagement.jsx` - Multi-building portfolio analytics
- `BuildingsManagement.jsx` - Portfolio property mgmt
- `BuildingsWithResidents.jsx` - Building directory

**Partner Tools**
- `PartnerDashboard.jsx` - Partner performance metrics
- `PartnerPortal.jsx` - Partner self-service interface

---

## Data Layer

### Entities

**Building**
- name, address, district, tier, type
- coordinates (lat/lng)
- units, year built, price tier
- walk score, perk density, activity score
- nearby venues, tags

**Flat/Unit**
- building_id, flat_number, floor
- listing_type (rental/sale), price
- beds, baths, sqft, mls
- room_type, is_occupied
- notes

**Tenant/Resident**
- flat_id, name, email, mobile
- preferred_language, move_in_date, lease_end
- rent payment tracking
- perks enrollment & tier
- notes

**PerkLocation**
- partner_id, name, category, category_key
- address, district, coordinates
- perk description, perk_type
- hours, website, phone, specials
- is_featured, is_active, relevance_score

**Partner**
- business_name, contact email, phone, person
- address, category
- is_active, joined_date
- notes

**PerkRedemption**
- perk_id, perk_name, perk_category
- user_email, user_name
- redeemed_at (timestamp)

**PartnerMessage**
- partner_id, partner_name
- resident_email, resident_name
- message, subject
- status (unread/read/replied), sent_at

**Broadcast**
- building_id, title, message
- type (perks/community/event/reminder)
- recipients_count, delivery_status
- scheduled_for (datetime)

**Survey**
- building_id, title, description
- questions (JSON array)
- status (draft/active/closed)
- responses_count, target_residents
- starts_at, ends_at

**Amenity**
- building_id, name, description
- capacity, hours_start, hours_end
- slot_duration (minutes)
- is_active

**AmenityReservation**
- amenity_id, tenant_id
- reservation_date, start_time, end_time
- status (confirmed/cancelled)
- notes

**MaintenanceTicket**
- tenant_id, flat_id, title, description
- category (plumbing/electrical/hvac/appliance/structural/other)
- priority (low/medium/high/urgent)
- status (open/in_progress/completed/closed)
- photo_urls, assigned_to
- notes, completed_at

**EventRSVP**
- event_id, event_name, event_date
- registered_at (timestamp)

**DANAMember**
- residence_name, lease_buy
- num_units, title, first/last name
- email, phone, address
- dana_hoa_member, notes

**GlobalSettings**
- business_name, business_name_ar
- business_logo

---

## Shared Utilities & Helpers

### Engagement Segmentation
- `engagementSegmentation.js` - Segment residents by activity level

### Reporting
- `generatePDFReport` - Monthly PDF report generation
- Venue performance scoring
- Trend analysis

### Data Import
- `importDANAMembers.js` - Import member data
- `importTheShorResidents.js` - Property-specific seeding
- `importBuildingsAndUnits.js` - Portfolio seeding
- `importPerkLocations.js` - Venue data import

### Design Tokens
- `index.css` - Navy/gold color system, typography, spacing
- `tailwind.config.js` - Extended color, border-radius, shadow tokens

---

## Integration Layer

### Required Props for Module Mount

When mounting this module in the parent Downtown Perks app:

```javascript
<BuildingTab 
  buildingId={selectedBuildingId}
  currentUser={authenticatedUser}
  onNavigate={(path) => parentRouter.push(path)}
/>
```

### Assumed Parent App Provides

1. **Authentication Context**
   - Current user object with `role` (admin/resident/partner)
   - Login/logout handlers
   - Token management

2. **Building Context**
   - Selected building ID
   - Building switching capability
   - Navigation between buildings

3. **Styling & Layout**
   - Navy/gold design tokens already available
   - Parent layout handles top nav & main sidebar
   - This module provides internal tab navigation only

### Module Exposes

```javascript
// Navigation structure for parent to render
const BUILD_TAB_ROUTES = {
  OVERVIEW: '/building/overview',
  RESIDENTS: '/building/residents',
  EVENTS: '/building/events',
  PERKS: '/building/perks',
  REPORTS: '/building/reports',
  ENGAGEMENT: '/building/engagement',
  SEGMENTATION: '/building/segmentation',
  AMENITIES: '/building/amenities',
  MAINTENANCE: '/building/maintenance',
  PARTNERS: '/building/partners',
  PARTNER_PORTAL: '/building/partner-portal',
  PERK_REPORTING: '/building/perk-reporting',
};

// Role-based visibility
const ROLE_VISIBLE_TABS = {
  admin: [OVERVIEW, RESIDENTS, EVENTS, PERKS, REPORTS, ENGAGEMENT, SEGMENTATION, AMENITIES, MAINTENANCE, PARTNERS, PERK_REPORTING],
  resident: [EVENTS, PERKS, AMENITIES, MAINTENANCE],
  partner: [PARTNER_PORTAL, PERK_REPORTING],
};
```

---

## Demo Data & Seeding

The following is **demo/mock data** and should be removed before production:

- `seedDemoData.js` - Creates sample tenants, buildings, perks
- `seedDowntownBuildings.js` - Downtown Austin building fixtures
- Mock event data in `Events.jsx`
- Mock trend data in charts

**Action for Integration:**
- Remove seed function calls from page initialization
- Wire pages to live API endpoints
- Update entity queries to filter by selected building context

---

## What to Remove Before Export

### Standalone App Only
- `About.jsx` page (prototype landing page)
- Root-level dashboard homepage logic
- App shell navigation logic (parent app handles this)
- Login/auth page assumptions (parent app provides auth)
- Duplicate sidebar/top nav (parent app owns navigation)

### Routes to Deprecate
- `/` (home) - replaced by building tab structure
- `/About` - removed
- Flat top-level routes - all nested under `/building`

### Code Cleanup
- Remove `pages.config.js` usage in routes
- Consolidate duplicate Building/Flat queries
- Remove unused `createPageUrl` helpers
- Audit all imports for dead code

---

## Known Dependencies

### React Packages
- `react`, `react-dom`, `react-router-dom`
- `@tanstack/react-query` - data fetching
- `framer-motion` - animations
- `recharts` - charts
- `react-leaflet` - map component
- `@hello-pangea/dnd` - drag & drop
- `sonner` - toast notifications
- `date-fns`, `moment` - date utilities
- `react-markdown`, `react-quill` - rich text
- `@stripe/react-stripe-js` - (if payments enabled)

### Base44 SDK
- `@base44/sdk` - entity queries, auth, functions

### UI Library
- `shadcn/ui` components (Button, Card, Dialog, Tabs, etc.)
- `tailwindcss` - styling
- `lucide-react` - icons

---

## Integration Checklist

Before merging into main Downtown Perks app:

- [ ] Remove `/About` page from routes
- [ ] Convert all routes to `/building/*` structure
- [ ] Audit and remove duplicate queries
- [ ] Remove demo data seeding from page init
- [ ] Verify all entity relationships use selected building context
- [ ] Test role-based access for Admin, Resident, Partner
- [ ] Ensure nav reflects role (hide unavailable tabs)
- [ ] Wire all CSV/PDF export to live API
- [ ] Verify styling aligns with main app
- [ ] Test map view with real coordinates
- [ ] Remove any hardcoded building IDs
- [ ] Verify partner messaging integration
- [ ] Test amenity reservation date picker
- [ ] Validate form submissions
- [ ] Check for console errors in preview

---

## Export Output Files

This module should be exported as:

```
downtown-perks-building-tab/
├── pages/
│   ├── Dashboard.jsx
│   ├── Residents.jsx
│   ├── Events.jsx
│   ├── DowntownPerks.jsx
│   ├── PerkAnalytics.jsx
│   ├── PerkReporting.jsx
│   ├── Segmentation.jsx
│   ├── BuildingEngagement.jsx
│   ├── DeveloperEngagement.jsx
│   ├── EngagementHub.jsx
│   ├── AmenityReservations.jsx
│   ├── MaintenanceTickets.jsx
│   ├── PartnerDashboard.jsx
│   ├── PartnerPortal.jsx
│   ├── BuildingsManagement.jsx
│   └── BuildingsWithResidents.jsx
├── components/
│   ├── dashboard/
│   ├── engagement/
│   ├── tenants/
│   ├── maintenance/
│   ├── amenities/
│   └── [all reusable UI components]
├── entities/
│   ├── Building.json
│   ├── Flat.json
│   ├── Tenant.json
│   ├── PerkLocation.json
│   ├── Partner.json
│   ├── [all entity schemas]
├── utils/
│   ├── engagementSegmentation.js
│   └── [all helpers]
├── functions/
│   ├── generatePDFReport.js
│   └── [backend handlers]
├── EXPORT_ARCHITECTURE.md (this file)
├── ROUTES.md (detailed route map)
├── COMPONENT_INVENTORY.md (component usage map)
└── INTEGRATION_GUIDE.md (parent app integration)
```

---

## Next Steps

1. **Engineering Review** - Review this architecture with main Downtown Perks team
2. **Parent App Design** - Design how Building Tab mounts in main app shell
3. **Route Integration** - Finalize `/building/*` routes in parent router
4. **Context Setup** - Define shared context/props across module
5. **Data Migration** - Point module to live API endpoints
6. **Testing** - Test all user flows (Admin, Resident, Partner)
7. **Deploy** - Merge into main app via PR

---

**Module Status:** Ready for export & integration

**Last Updated:** 2026-04-12

**Maintainer:** Downtown Perks Engineering Team
# Integration Guide — Downtown Perks Building Module

**For:** Engineering teams integrating the building module into the main Downtown Perks product.

---

## Quick Start

The building module is **not a standalone app**. It mounts inside the main Downtown Perks product as a scoped feature under `/buildings/:buildingId`.

### Before Integration
- Parent app has `AuthProvider` + `QueryClientProvider`
- Parent app has user auth with `role` field
- Parent app can serve routes under `/buildings/:buildingId`

### Integration (5 steps)

#### Step 1: Copy Files
```bash
# From building module source
cp -r src/pages/* parent/src/pages/
cp -r src/components/* parent/src/components/
cp -r src/entities/* parent/src/entities/
cp -r src/functions/* parent/src/functions/
```

#### Step 2: Add Entities
Ensure parent `entities/` has:
```
Building.json
Tenant.json
Flat.json
Announcement.json
Survey.json
PerkLocation.json
PerkRedemption.json
Partner.json
Event.json
AmenityReservation.json
MaintenanceTicket.json
Amenity.json
Broadcast.json
```

#### Step 3: Add Routes to App.jsx
```jsx
import BuildingLayout from './pages/BuildingLayout';
import Dashboard from './pages/Dashboard';
import Residents from './pages/Residents';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import DowntownPerks from './pages/DowntownPerks';
import PerkDetail from './pages/PerkDetail';
import AmenityReservations from './pages/AmenityReservations';
import MaintenanceTickets from './pages/MaintenanceTickets';
import Segmentation from './pages/Segmentation';
import Surveys from './pages/Surveys';
import AnnouncementManager from './pages/AnnouncementManager';
import AnnouncementFeed from './pages/AnnouncementFeed';
import PartnerDashboard from './pages/PartnerDashboard';
import PerkReporting from './pages/PerkReporting';
import EngagementHub from './pages/EngagementHub';

// Inside <Routes>:
<Route path="/buildings/:buildingId" element={<BuildingLayout />}>
  <Route index element={<Dashboard />} />
  <Route path="residents" element={<Residents />} />
  <Route path="events" element={<Events />} />
  <Route path="events/:eventId" element={<EventDetail />} />
  <Route path="perks" element={<DowntownPerks />} />
  <Route path="perks/:perkId" element={<PerkDetail />} />
  <Route path="reports" element={<PerkReporting />} />
  <Route path="segmentation" element={<Segmentation />} />
  <Route path="surveys" element={<Surveys />} />
  <Route path="announcements" element={<AnnouncementManager />} />
  <Route path="announcements-feed" element={<AnnouncementFeed />} />
  <Route path="engagement" element={<EngagementHub />} />
  <Route path="amenities" element={<AmenityReservations />} />
  <Route path="maintenance" element={<MaintenanceTickets />} />
  <Route path="partners" element={<PartnerDashboard />} />
</Route>

// Optional: Partner Portal (outside building scope)
<Route path="/partner-portal" element={<PartnerPortal />} />
```

#### Step 4: Add Backend Functions
Ensure parent `functions/` has:
```
seedDemoData.js
sendAnnouncementNotification.js
generatePDFReport.js
importBuildingsAndUnits.js (or similar)
```

#### Step 5: Test
```
1. Navigate to /buildings
2. Select a building
3. Click into /buildings/[id]
4. Verify all tabs load
5. Test role-based access (admin vs resident)
```

---

## API & Context

### BuildingLayout
**Purpose:** Route wrapper that provides building context to all child pages.

**Props:** None (uses `useParams` for `buildingId`)

**Provides via `useOutletContext()`:**
```js
{
  buildingId: string,
  building: {
    id: string,
    name: string,
    address: string,
    // ... full Building entity
  }
}
```

**Usage in child pages:**
```jsx
import { useOutletContext } from 'react-router-dom';

export default function MyPage() {
  const { buildingId, building } = useOutletContext();
  
  // buildingId is guaranteed to exist
  const { data } = useQuery({
    queryKey: ['data', buildingId],
    queryFn: () => base44.entities.MyEntity.filter({ building_id: buildingId })
  });
}
```

---

## Role-Based Access

### Admin
Access all tabs + full CRUD:
- Dashboard
- Residents
- Events
- Perks
- Surveys
- Announcements
- Engagement
- Segmentation
- Amenities
- Maintenance
- Reports
- Partners

### Resident
Access limited tabs (read-only on most):
- Events (browse)
- Perks (browse)
- Announcements Feed (read)
- Amenities (reserve)
- Maintenance (create tickets)

### Partner
Access partner portal only:
- `/partner-portal` (self-service perk mgmt)

**Implementation:**
```jsx
// In BuildingLayout.jsx
const tabs = TAB_CONFIG[user?.role] || TAB_CONFIG.resident;
```

---

## Building Context Propagation

Every page that needs `buildingId`:

```jsx
import { useOutletContext } from 'react-router-dom';

const { buildingId } = useOutletContext();

// Use in queries
useQuery({
  queryKey: ['items', buildingId],
  queryFn: () => base44.entities.Item.filter({ building_id: buildingId })
});
```

### If Parent App Uses Different Context Shape

Update `BuildingLayout.jsx` to match parent:

```jsx
// If parent passes building via prop instead of outlet context
export default function BuildingLayout({ buildingIdFromParent }) {
  // Extract buildingId from URL param (default)
  const { buildingId: paramBuildingId } = useParams();
  const buildingId = buildingIdFromParent || paramBuildingId;
  
  // Pass to children
  const value = { buildingId, building };
  
  return (
    <>
      {/* Tabs + Header */}
      <Outlet context={value} />
    </>
  );
}
```

---

## Demo Data & Seeding

### Enable Demo Data
```jsx
// In Dashboard.jsx onMount:
const seedData = async () => {
  try {
    await base44.functions.invoke('seedDemoData', {});
  } catch (error) {
    console.log('Seed skipped or already exists');
  }
};
```

### Disable Demo Data
Remove the `seedData()` call entirely. The app will work with real data.

### Custom Seed Function
Replace `seedDemoData` with your own:
```jsx
const seedData = async () => {
  // Create buildings, tenants, etc. with YOUR data
  await base44.entities.Building.create({
    name: 'My Building',
    address: '123 Main St',
    // ...
  });
};
```

---

## Customization Examples

### Change Building Selection

**Current:** Dropdown in Dashboard header  
**To Change:** Edit `pages/Dashboard.jsx`:

```jsx
// Find building selector
<select
  value={selectedBuildingId || ''}
  onChange={(e) => setSelectedBuildingId(e.target.value)}
>
  {buildings.map(b => (
    <option key={b.id} value={b.id}>{b.name}</option>
  ))}
</select>

// Replace with parent app's building navigation if needed
```

### Add a New Tab

1. Create `pages/NewFeature.jsx`
2. Import in `App.jsx`
3. Add route:
   ```jsx
   <Route path="new-feature" element={<NewFeature />} />
   ```
4. Add to `BuildingLayout.jsx` tabs:
   ```jsx
   const TAB_CONFIG = {
     admin: [
       // ... existing
       { path: 'new-feature', label: 'New Feature', icon: IconComponent },
     ]
   };
   ```

### Change Design System

The module uses CSS variables + Tailwind tokens in `tailwind.config.js`:

```js
// tailwind.config.js
colors: {
  navy: '#0B1F33',
  gold: '#CFAF5A',
  bgMain: '#F7F8FB',
  // ... edit these to match parent brand
}
```

All component colors reference these tokens.

---

## Troubleshooting

### "buildingId is undefined"
**Problem:** Child page doesn't receive building context  
**Solution:** Ensure page is under `<Route path="/buildings/:buildingId">` + uses `useOutletContext()`

### "Building not found"
**Problem:** Invalid buildingId in URL  
**Solution:** Verify `buildings/:buildingId` route in parent app matches URL

### "Role not detected"
**Problem:** User object missing `role` field  
**Solution:** Ensure parent AuthProvider sets `user.role` (admin/resident/partner)

### "Components not importing"
**Problem:** "Cannot find module" errors  
**Solution:** Verify all pages/components copied to correct paths

### "Entities not accessible"
**Problem:** `base44.entities.Building is undefined`  
**Solution:** Ensure all entity JSON files are in `entities/` directory

---

## File Manifest

### Required Pages
```
pages/BuildingLayout.jsx
pages/Dashboard.jsx
pages/Residents.jsx
pages/Events.jsx
pages/EventDetail.jsx
pages/DowntownPerks.jsx
pages/PerkDetail.jsx
pages/AmenityReservations.jsx
pages/MaintenanceTickets.jsx
pages/Segmentation.jsx
pages/Surveys.jsx
pages/AnnouncementManager.jsx
pages/AnnouncementFeed.jsx
pages/PartnerDashboard.jsx
pages/PerkReporting.jsx
pages/EngagementHub.jsx
pages/PartnerPortal.jsx
```

### Required Components
```
components/announcements/AnnouncementCard.jsx
components/announcements/AnnouncementForm.jsx
components/surveys/SurveyForm.jsx
components/surveys/SurveyResults.jsx
components/tenants/TenantModal.jsx
components/tenants/TenantDetailsSheet.jsx
components/dashboard/StatsCards.jsx
components/dashboard/DynamicBuildingOverview.jsx
components/engagement/ResidentAnalytics.jsx
components/engagement/BroadcastSender.jsx
components/engagement/SurveyManager.jsx
components/maintenance/TicketDetails.jsx
components/maintenance/TicketModal.jsx
components/amenities/ReservationModal.jsx
components/PartnerMessaging.jsx
components/PerkMap.jsx
```

### Required Entities
```
entities/Building.json
entities/Announcement.json
entities/Survey.json
entities/Event.json
entities/Tenant.json
entities/Flat.json
entities/PerkLocation.json
entities/PerkRedemption.json
entities/Partner.json
entities/AmenityReservation.json
entities/MaintenanceTicket.json
entities/Amenity.json
entities/Broadcast.json
```

### Required Functions
```
functions/seedDemoData.js
functions/sendAnnouncementNotification.js
functions/generatePDFReport.js
```

---

## Support

- Questions? Refer to `MODULE_STRUCTURE.md` for component tree
- Route reference? See `ROUTES.md`
- Component APIs? See `COMPONENT_INVENTORY.md`
- Data schemas? Check `entities/*.json
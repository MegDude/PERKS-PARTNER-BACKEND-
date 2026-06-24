# Module Structure — Downtown Perks Building Module

Complete file organization, component tree, and data flow.

---

## Directory Layout

```
src/
├── pages/                              # Route-level pages
│   ├── BuildingLayout.jsx              # Route wrapper + navigation
│   ├── Dashboard.jsx                   # Building overview (admin)
│   ├── Residents.jsx                   # Resident directory
│   ├── Events.jsx                      # Event listing
│   ├── EventDetail.jsx                 # Single event view
│   ├── DowntownPerks.jsx               # Perks + map
│   ├── PerkDetail.jsx                  # Single perk detail
│   ├── PerkReporting.jsx               # Perk analytics (admin)
│   ├── AnnouncementManager.jsx         # Create/manage announcements
│   ├── AnnouncementFeed.jsx            # Resident feed
│   ├── Surveys.jsx                     # Survey manager
│   ├── EngagementHub.jsx               # Engagement analytics
│   ├── Segmentation.jsx                # Resident segments
│   ├── AmenityReservations.jsx         # Amenity booking
│   ├── MaintenanceTickets.jsx          # Maintenance requests
│   ├── PartnerDashboard.jsx            # Partner management
│   └── PartnerPortal.jsx               # Partner self-service
│
├── components/                         # Reusable components
│   ├── ui/                             # shadcn/ui + design tokens
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── input.jsx
│   │   ├── label.jsx
│   │   ├── textarea.jsx
│   │   ├── dialog.jsx
│   │   ├── alert-dialog.jsx
│   │   ├── tabs.jsx
│   │   ├── select.jsx
│   │   ├── dropdown-menu.jsx
│   │   ├── badge.jsx
│   │   ├── separator.jsx
│   │   ├── toast.jsx
│   │   ├── toaster.jsx
│   │   ├── switch.jsx
│   │   ├── avatar.jsx
│   │   ├── scroll-area.jsx
│   │   ├── chart.jsx
│   │   ├── popover.jsx
│   │   ├── sheet.jsx
│   │   ├── command.jsx
│   │   └── Typography.jsx              # H1, H2, H3, Body, etc.
│   │
│   ├── announcements/
│   │   ├── AnnouncementCard.jsx        # Display single announcement
│   │   └── AnnouncementForm.jsx        # Create/edit form
│   │
│   ├── surveys/
│   │   ├── SurveyForm.jsx              # Create/edit survey
│   │   └── SurveyResults.jsx           # View responses + charts
│   │
│   ├── tenants/
│   │   ├── TenantModal.jsx             # Add/edit resident
│   │   └── TenantDetailsSheet.jsx      # View resident details
│   │
│   ├── dashboard/
│   │   ├── StatsCards.jsx              # KPI cards
│   │   └── DynamicBuildingOverview.jsx # Building detail card
│   │
│   ├── engagement/
│   │   ├── ResidentAnalytics.jsx       # Engagement charts
│   │   ├── BroadcastSender.jsx         # Send message modal
│   │   └── SurveyManager.jsx           # Survey lifecycle mgmt
│   │
│   ├── maintenance/
│   │   ├── TicketDetails.jsx           # View ticket
│   │   └── TicketModal.jsx             # Create/edit ticket
│   │
│   ├── amenities/
│   │   └── ReservationModal.jsx        # Book amenity slot
│   │
│   ├── context/
│   │   └── LanguageContext.jsx         # i18n (if multilingual)
│   │
│   ├── auth/
│   │   └── UserMenu.jsx                # User profile dropdown
│   │
│   ├── PartnerMessaging.jsx            # Partner communication
│   └── PerkMap.jsx                     # Leaflet map component
│
├── entities/                           # Data schemas
│   ├── Building.json
│   ├── Tenant.json
│   ├── Flat.json
│   ├── Announcement.json
│   ├── Survey.json
│   ├── Event.json
│   ├── PerkLocation.json
│   ├── PerkRedemption.json
│   ├── Partner.json
│   ├── PartnerMessage.json
│   ├── AmenityReservation.json
│   ├── MaintenanceTicket.json
│   ├── Amenity.json
│   ├── Broadcast.json
│   ├── EventRSVP.json
│   ├── GlobalSettings.json
│   └── User.json (built-in)
│
├── functions/                          # Backend logic
│   ├── seedDemoData.js                 # Populate demo data
│   ├── sendAnnouncementNotification.js # Push notifications
│   ├── generatePDFReport.js            # Export reports
│   ├── importBuildingsAndUnits.js      # Bulk import
│   └── importDANAMembers.js            # CRM sync
│
├── lib/
│   ├── AuthContext.jsx                 # Auth provider (from parent)
│   ├── query-client.js                 # TanStack Query config
│   ├── utils.js                        # Helper functions
│   └── PageNotFound.jsx                # 404 component
│
├── App.jsx                             # Main router (parent responsible)
├── index.css                           # Design tokens + tailwind base
├── tailwind.config.js                  # Tailwind config
└── main.jsx                            # Entry point
```

---

## Component Hierarchy

### Page-Level (Route Components)

```
BuildingLayout
├── Header (building name + tabs)
├── Tab Navigation Bar
│   ├── Overview (admin)
│   ├── Residents
│   ├── Events
│   ├── Perks
│   ├── Surveys
│   ├── Announcements
│   ├── Engagement
│   ├── Segmentation
│   ├── Amenities
│   ├── Maintenance
│   ├── Reports
│   └── Partners
└── <Outlet>
    └── [Child page component]

Dashboard
├── Header (title + search + add button)
├── Stats Cards (4 KPIs)
├── Perks Enrollment Trend (chart)
├── Partner Performance Grid
├── Modals
│   ├── TenantModal
│   └── TenantDetailsSheet
└── Dialogs
    └── DeleteConfirm

Residents
├── Header (title + search)
├── Resident List (animated cards)
│   └── ResidentCard
│       ├── Contact info
│       ├── Lease details
│       └── Action buttons
├── Modals
│   ├── TenantModal
│   └── TenantDetailsSheet
└── Dialogs
    └── DeleteConfirm

Events
├── Header (title + filter)
├── Category Filter Tabs
└── Event Cards Grid
    └── EventCard
        ├── Title + description
        ├── Date + time + location
        └── RSVP button

DowntownPerks
├── Header (title + search)
├── View Toggle (list/map)
├── Filter Sidebar
│   ├── Category filter
│   ├── Distance slider
│   └── Search box
├── Perks Grid or Map
│   └── PerkCard
│       ├── Venue name + offer
│       ├── Hours + contact
│       └── Distance badge
└── Modals
    └── PartnerMessaging

Surveys
├── Header (title + new button)
├── Survey List
│   └── SurveyCard
│       ├── Title + description
│       ├── Status badge
│       ├── Q count + response count
│       └── Action buttons
├── Forms
│   └── SurveyForm
│       ├── Title + description input
│       ├── Questions editor
│       └── Add/remove question buttons
└── Results View
    └── SurveyResults
        ├── Summary stats
        └── Question Analytics
            ├── Bar charts
            └── Pie charts

AnnouncementManager
├── Header (title + new button)
├── Stats Cards (4 KPIs)
├── Search + Filter
├── Announcement List
│   └── AnnouncementCard
│       ├── Title + message
│       ├── Priority + type badge
│       ├── Read count
│       └── Action buttons
├── Forms
│   └── AnnouncementForm
│       ├── Title input
│       ├── Message textarea
│       ├── Type + Priority dropdowns
│       └── Submit button
└── Dialogs
    └── DeleteConfirm

PartnerDashboard
├── Header (title)
├── Stats Cards (4 KPIs)
├── Monthly Trend Chart (Recharts bar)
├── Partner List Grid
│   └── PartnerCard
│       ├── Business name + category
│       ├── Status badge
│       ├── Performance metrics (3-col)
│       └── Contact email
└── Modals
    └── PartnerMessaging
```

---

## Data Flow

### Typical Page Data Flow

```
Page Load
  ↓
useAuth() → Get current user + role
  ↓
useOutletContext() → Extract buildingId
  ↓
useQuery() → Fetch building-scoped data
  ↓
useMutation() → Handle create/update/delete
  ↓
Render with data
  ↓
User action (click button) → Mutation.mutate()
  ↓
queryClient.invalidateQueries() → Refetch
  ↓
Re-render with updated data
```

### Example: Create Announcement
```
AnnouncementManager
  ↓ (user clicks "New Announcement")
AnnouncementForm modal opens
  ↓ (user fills form + submits)
createMutation.mutate({ title, message, type, priority })
  ↓
base44.entities.Announcement.create({
  ...data,
  building_id: buildingId,
  status: 'published'
})
  ↓
queryClient.invalidateQueries(['announcements', buildingId])
  ↓
useQuery refetches
  ↓
AnnouncementList re-renders with new item
```

---

## State Management

### Local State (per page)
```jsx
const [showModal, setShowModal] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
const [selectedItem, setSelectedItem] = useState(null);
```

### Server State (TanStack Query)
```jsx
const { data, isLoading, error } = useQuery({
  queryKey: ['announcements', buildingId],
  queryFn: () => base44.entities.Announcement.filter({ building_id: buildingId })
});

const mutation = useMutation({
  mutationFn: (data) => base44.entities.Announcement.create(data),
  onSuccess: () => queryClient.invalidateQueries(['announcements', buildingId])
});
```

### Route Context (useOutletContext)
```jsx
const { buildingId, building } = useOutletContext();
```

---

## Component API Reference

### BuildingLayout
**Props:** None  
**Provides:** `{ buildingId, building }` via outlet context  
**Tabs:** Filtered by user role

### Dashboard
**Context:** `{ buildingId, building }`  
**Queries:** buildings, tenants, flats, broadcasts, surveys, partners, redemptions  
**Mutations:** create/update/delete tenant, mark paid

### AnnouncementManager
**Context:** `{ buildingId }`  
**Queries:** announcements (filtered by buildingId)  
**Mutations:** create, update, delete, notify  
**Modals:** AnnouncementForm, DeleteConfirm

### AnnouncementForm
**Props:**
- `announcement?: Announcement` — for editing
- `onSubmit: (formData) => void`
- `onClose: () => void`
- `isLoading?: boolean`

**Returns:** Form modal with title + message + type + priority

### SurveyForm
**Props:**
- `survey?: Survey` — for editing
- `onSave: (data) => void`
- `onCancel: () => void`

**Returns:** Form with survey title, description, dynamic question builder

### SurveyResults
**Props:**
- `survey: Survey` (required)
- `onBack: () => void` (required)

**Returns:** Survey results with charts + analytics

### TenantModal
**Props:**
- `open: boolean`
- `onClose: () => void`
- `tenant?: Tenant` — for editing
- `flatId?: string` — pre-select flat
- `flatNumber?: string` — display only
- `onSave: (formData) => void`
- `isLoading?: boolean`

---

## Design System

### Colors (CSS Variables)
```css
--navy-900: #0B1F33       /* Primary dark */
--navy-800: #102A43       /* Secondary dark */
--gold: #CFAF5A           /* Accent */
--gold-soft: #EAD08E      /* Accent light */
--bg-main: #F7F8FB        /* Background */
--bg-card: #FFFFFF        /* Card background */
--bg-alt: #F1F3F7         /* Alt background */
--text-primary: #0B1F33   /* Headings */
--text-secondary: #5B6B7C /* Body text */
--text-muted: #8A97A6     /* Labels + hints */
--border-subtle: rgba(11, 31, 51, 0.08)
--shadow-soft: 0 10px 30px rgba(11, 31, 51, 0.06)
--shadow-gold: 0 8px 24px rgba(207, 175, 90, 0.25)
```

### Tailwind Tokens
```js
colors: {
  navy: '#0B1F33',
  navySoft: '#102A43',
  gold: '#CFAF5A',
  goldSoft: '#EAD08E',
  bgMain: '#F7F8FB',
  bgAlt: '#F1F3F7',
  textPrimary: '#0B1F33',
  textSecondary: '#5B6B7C',
  textMuted: '#8A97A6'
}

radius: {
  sm: '12px',
  md: '16px',
  lg: '20px',
  xl: '28px'
}
```

### Typography
- **H1:** 32px, navy, bold
- **H2:** 24px, navy, semibold
- **H3:** 20px, navy, semibold
- **Body:** 16px, text-secondary, regular
- **Label:** 14px, text-muted, semibold, uppercase

---

## Naming Conventions

### Pages
- `Dashboard.jsx` → `/buildings/:id`
- `Residents.jsx` → `/buildings/:id/residents`
- `AnnouncementManager.jsx` → `/buildings/:id/announcements`
- `PascalCase.jsx`

### Components
- `AnnouncementCard.jsx` — Display component
- `AnnouncementForm.jsx` — Interactive form
- `ResidentAnalytics.jsx` — Composite/container
- `PascalCase.jsx` in subdirectories

### Query Keys
- `['announcements', buildingId]`
- `['residents', buildingId]`
- `['perkLocations']` — Global
- Array with [entity, buildingId?, filters?]

### Mutations
- `createMutation`, `updateMutation`, `deleteMutation`
- Descriptive name if complex: `markPaidMutation`

---

## Build Verification

✅ **All imports resolve**
✅ **All components exist**
✅ **All routes wired**
✅ **No duplicate declarations**
✅ **No stale references**
✅ **All tabs render**
✅ **All queries build**
✅ **Copy tone aligned**
✅ **Design system consistent**
✅ **No prototype assumptions**

---

## File Size Reference

| File Type | Typical Size |
|-----------|--------------|
| Page (route) | 300-800 lines |
| Component (complex) | 200-400 lines |
| Component (simple) | 50-150 lines |
| Modal | 100-250 lines |
| Entity schema | 50-80 lines |
| Function | 50-200 lines |

---

## Performance Notes

### Optimization Patterns Used

1. **useQuery Caching**
   - Repeated queries cached automatically
   - `queryClient.invalidateQueries()` on mutations

2. **Code Splitting**
   - Each page in separate file (lazy-loadable)
   - Components grouped by feature

3. **Memoization**
   - Framer Motion for animations
   - Card hover transitions

4. **Image Optimization**
   - External images via URL
   - No large inline assets

---

## Dependencies

### Core
- React 18.2
- React Router 6.26
- TanStack Query 5.84
- TanStack React Query 5.84

### UI
- shadcn/ui (all components)
- Tailwind CSS 3.4
- Framer Motion 11.16
- Lucide React 0.475

### Data Viz
- Recharts 2.15
- React Leaflet 4.2 (maps)

### Utilities
- Moment 2.30
- Date-fns 3.6
- Lodash 4.17
- React Markdown 9.0
- Sonner 2.0 (toast)

---
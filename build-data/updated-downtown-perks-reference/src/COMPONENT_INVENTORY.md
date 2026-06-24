# Component Inventory — Downtown Perks Building Module

Complete API reference for all reusable components.

---

## UI Components (shadcn/ui + Design System)

### Button
**File:** `components/ui/button.jsx`  
**Props:**
- `variant`: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
- `size`: 'default' | 'sm' | 'lg' | 'icon'
- `disabled`: boolean
- `children`: React.ReactNode
- `onClick`: () => void

**Usage:**
```jsx
<Button className="bg-gold hover:bg-goldSoft text-navy">
  Submit
</Button>
```

### Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
**File:** `components/ui/card.jsx`  
**Props:** All components accept standard div props

**Usage:**
```jsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Input
**File:** `components/ui/input.jsx`  
**Props:**
- `type`: 'text' | 'email' | 'password' | 'number' | etc.
- `placeholder`: string
- `value`: string
- `onChange`: (e) => void
- `disabled`: boolean
- `required`: boolean

### Textarea
**File:** `components/ui/textarea.jsx`  
**Props:** Same as Input + `rows`: number

### Label
**File:** `components/ui/label.jsx`  
**Props:**
- `htmlFor`: string (id of associated input)
- `children`: React.ReactNode

### Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
**File:** `components/ui/dialog.jsx`  
**Props:**
- `open`: boolean
- `onOpenChange`: (open: boolean) => void

**Usage:**
```jsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    Content here
  </DialogContent>
</Dialog>
```

### AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
**File:** `components/ui/alert-dialog.jsx`  
**Props:** Same as Dialog

**Usage:**
```jsx
<AlertDialog open={confirm} onOpenChange={setConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Confirm?</AlertDialogTitle>
      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Badge
**File:** `components/ui/badge.jsx`  
**Props:**
- `variant`: 'default' | 'secondary' | 'destructive' | 'outline'
- `children`: React.ReactNode

### Tabs, TabsList, TabsTrigger, TabsContent
**File:** `components/ui/tabs.jsx`  
**Props:** Standard Radix UI tabs pattern

### Select, SelectContent, SelectItem, SelectTrigger, SelectValue
**File:** `components/ui/select.jsx`  
**Props:** Radix UI select pattern

### Toast, Toaster
**File:** `components/ui/toast.jsx` + `components/ui/toaster.jsx`  
**Usage:**
```jsx
import { toast } from 'sonner';

toast.success('Message');
toast.error('Error');
toast.info('Info');
```

### Other UI Components
- `Avatar` — User profile picture
- `Separator` — Visual divider
- `Switch` — Toggle switch
- `Checkbox` — Checkbox input
- `Radio Group` — Radio buttons
- `Dropdown Menu` — Dropdown actions
- `Popover` — Floating popup
- `Sheet` — Slide-out panel
- `Chart` — Wrapper for Recharts

---

## Typography Components

**File:** `components/ui/Typography.jsx`

### H1
**Props:** `className?: string`, `children: React.ReactNode`  
**Style:** 32px navy bold

### H2
**Props:** `className?: string`, `children: React.ReactNode`  
**Style:** 24px navy semibold

### H3
**Props:** `className?: string`, `children: React.ReactNode`  
**Style:** 20px navy semibold

### Body
**Props:** `className?: string`, `children: React.ReactNode`  
**Style:** 16px text-secondary regular

### Label
**Props:** `className?: string`, `children: React.ReactNode`  
**Style:** 14px text-muted uppercase semibold

### Micro
**Props:** `className?: string`, `children: React.ReactNode`  
**Style:** 12px text-muted

---

## Feature Components

### AnnouncementCard
**File:** `components/announcements/AnnouncementCard.jsx`  
**Props:**
- `announcement: Announcement` (required)
- `isManager?: boolean` — Show edit/delete buttons
- `onEdit?: (announcement: Announcement) => void`
- `onDelete?: (announcement: Announcement) => void`

**Returns:** Card displaying announcement with title, message, type badge, priority badge, read count, notification status

### AnnouncementForm
**File:** `components/announcements/AnnouncementForm.jsx`  
**Props:**
- `announcement?: Announcement` — For editing
- `onSubmit: (formData) => void` (required)
- `onClose: () => void` (required)
- `isLoading?: boolean`

**Form Fields:**
- Title (text input)
- Message (textarea)
- Type (select: urgent, maintenance, community_news, event, reminder)
- Priority (select: low, medium, high, urgent)

### SurveyForm
**File:** `components/surveys/SurveyForm.jsx`  
**Props:**
- `survey?: Survey` — For editing
- `onSave: (data: { title, description, target_residents, questions }) => void` (required)
- `onCancel: () => void` (required)

**Features:**
- Survey title + description
- Dynamic question builder
- Question type selector (text, textarea, rating, multiple_choice, checkbox)
- Add/remove questions
- Options editor for choice questions

### SurveyResults
**File:** `components/surveys/SurveyResults.jsx`  
**Props:**
- `survey: Survey` (required)
- `onBack: () => void` (required)

**Features:**
- Summary stats (total responses, total questions, response rate %)
- Per-question analytics
- Bar charts for ratings
- Pie charts for multiple choice
- Export CSV button

### TenantModal
**File:** `components/tenants/TenantModal.jsx`  
**Props:**
- `open: boolean` (required)
- `onClose: () => void` (required)
- `tenant?: Tenant` — For editing
- `flatId?: string` — Pre-selected flat for new tenant
- `flatNumber?: string` — Display only
- `onSave: (formData) => void` (required)
- `isLoading?: boolean`

**Form Fields:**
- Name
- Email
- Mobile number
- Preferred language (en/ar)
- Move-in date
- Lease end date
- Yearly rent
- Rent payment interval (months)
- Rent per interval
- Perks enrolled (toggle)
- Perks tier (standard/premium/vip)
- Notes

### TenantDetailsSheet
**File:** `components/tenants/TenantDetailsSheet.jsx`  
**Props:**
- `open: boolean` (required)
- `onClose: () => void` (required)
- `tenant?: Tenant` — Data to display
- `onEdit: () => void` — Open edit modal
- `onDelete: () => void` — Delete confirmation
- `onMarkPaid: () => void` — Mark rent paid
- `isUpdating?: boolean`
- `isAdmin?: boolean` — Show edit/delete buttons

**Features:**
- Display all tenant fields
- Edit button (admin only)
- Delete button (admin only)
- Mark paid button (sends WhatsApp receipt)
- Lease status indicators

### StatsCards
**File:** `components/dashboard/StatsCards.jsx`  
**Props:** Array of stat objects

**Usage:**
```jsx
<StatsCard
  label="Total Residents"
  value={count}
  icon={UsersIcon}
/>
```

### DynamicBuildingOverview
**File:** `components/dashboard/DynamicBuildingOverview.jsx`  
**Props:**
- `building: Building`
- `stats: { occupiedFlats, perksEnrolled, ... }`

**Features:**
- Building header with address
- Overview metrics

### ResidentAnalytics
**File:** `components/engagement/ResidentAnalytics.jsx`  
**Props:**
- `building: Building`
- `residents: Tenant[]`
- `broadcasts: Broadcast[]`

**Features:**
- Engagement summary
- Resident activity charts
- Trend analysis

### BroadcastSender
**File:** `components/engagement/BroadcastSender.jsx`  
**Props:**
- `buildingId: string`
- `residents: Tenant[]`
- `onSend: (message, recipients) => void`

**Features:**
- Message composition
- Recipient selection
- Schedule or send now

### SurveyManager
**File:** `components/engagement/SurveyManager.jsx`  
**Props:**
- `buildingId: string`
- `surveys: Survey[]`
- `onLaunch: (surveyId) => void`
- `onClose: (surveyId) => void`

**Features:**
- Survey status management
- Response tracking
- Launch/close actions

### TicketModal
**File:** `components/maintenance/TicketModal.jsx`  
**Props:**
- `open: boolean`
- `onClose: () => void`
- `ticket?: MaintenanceTicket` — For editing
- `flatId?: string` — Pre-selected
- `onSave: (formData) => void`
- `isLoading?: boolean`

**Form Fields:**
- Title
- Description
- Category (plumbing, electrical, hvac, appliance, structural, other)
- Priority (low, medium, high, urgent)
- Photos (upload)
- Notes

### TicketDetails
**File:** `components/maintenance/TicketDetails.jsx`  
**Props:**
- `ticket: MaintenanceTicket`
- `onEdit: () => void`
- `onDelete: () => void`
- `onStatusChange: (status) => void`

**Features:**
- Display all ticket fields
- Status timeline
- Assigned staff info
- Photo gallery

### ReservationModal
**File:** `components/amenities/ReservationModal.jsx`  
**Props:**
- `open: boolean`
- `onClose: () => void`
- `amenity: Amenity`
- `tenantId: string`
- `onSave: (reservation) => void`

**Features:**
- Available time slot picker
- Date selector
- Confirm reservation

### PartnerMessaging
**File:** `components/PartnerMessaging.jsx`  
**Props:**
- `partnerId: string`
- `partnerName: string`
- `residentsCount: number`
- `onSend: (message) => void`

**Features:**
- Compose message
- Select channel (WhatsApp, email)
- Track delivery

### PerkMap
**File:** `components/PerkMap.jsx`  
**Props:**
- `perks: PerkLocation[]`
- `center: { lat, lng }`
- `zoom?: number`
- `onSelect: (perk) => void`

**Features:**
- Leaflet map display
- Perk markers with icons
- Category color coding
- Click to view details

---

## Page Components (Routes)

### BuildingLayout
**Location:** `pages/BuildingLayout.jsx`  
**Props:** None (uses `useParams`)  
**Provides:** `{ buildingId, building }` via outlet context

**Tabs Config:**
- **Admin:** 12 tabs (Dashboard, Residents, Events, Perks, Surveys, Announcements, Engagement, Segmentation, Amenities, Maintenance, Reports, Partners)
- **Resident:** 5 tabs (Announcements Feed, Events, Perks, Amenities, Maintenance)
- **Partner:** Redirected to `/partner-portal`

### Dashboard
**Location:** `pages/Dashboard.jsx`  
**Role:** Admin only  
**Query Keys:** buildings, tenants, flats, broadcasts, surveys, partners, redemptions

### Residents
**Location:** `pages/Residents.jsx`  
**Role:** Admin (CRUD), Resident (view own)  
**Query Keys:** tenants, flats

### Events
**Location:** `pages/Events.jsx`  
**Role:** All users  
**Features:** Event listing, filtering, sharing

### EventDetail
**Location:** `pages/EventDetail.jsx`  
**Role:** All users  
**Params:** `eventId`

### DowntownPerks
**Location:** `pages/DowntownPerks.jsx`  
**Role:** All users  
**Features:** Perk directory, map view, category filter

### PerkDetail
**Location:** `pages/PerkDetail.jsx`  
**Role:** All users  
**Params:** `perkId`

### Surveys
**Location:** `pages/Surveys.jsx`  
**Role:** Admin (create), All (view/respond)  
**Features:** Survey CRUD, result visualization

### AnnouncementManager
**Location:** `pages/AnnouncementManager.jsx`  
**Role:** Admin only  
**Features:** Announcement CRUD, push notifications

### AnnouncementFeed
**Location:** `pages/AnnouncementFeed.jsx`  
**Role:** Resident, Admin  
**Features:** Read-only announcement feed, search/filter

### EngagementHub
**Location:** `pages/EngagementHub.jsx`  
**Role:** Admin only  
**Features:** Engagement analytics, broadcast stats

### Segmentation
**Location:** `pages/Segmentation.jsx`  
**Role:** Admin only  
**Features:** Resident segmentation by engagement

### AmenityReservations
**Location:** `pages/AmenityReservations.jsx`  
**Role:** All users  
**Features:** Amenity listing, booking, cancellation

### MaintenanceTickets
**Location:** `pages/MaintenanceTickets.jsx`  
**Role:** All users  
**Features:** Ticket creation, status tracking, assignment

### PartnerDashboard
**Location:** `pages/PartnerDashboard.jsx`  
**Role:** Admin only  
**Features:** Partner metrics, messaging, reporting

### PerkReporting
**Location:** `pages/PerkReporting.jsx`  
**Role:** Admin only  
**Features:** Perk analytics, partner leaderboard, CSV export

### PartnerPortal
**Location:** `pages/PartnerPortal.jsx`  
**Role:** Partner only  
**Features:** Perk offer management, redemption stats

---

## Context & Providers

### LanguageContext
**File:** `components/context/LanguageContext.jsx`  
**Provides:**
- `t(key)` — Translation function
- `language` — Current language code
- `isRTL` — Right-to-left flag

**Usage:**
```jsx
const { t, language } = useLanguage();
<h1>{t('announcements')}</h1>
```

---

## Hooks (Custom)

### useOutletContext
**From:** React Router  
**Returns:** `{ buildingId, building }` in child pages

### useParams
**From:** React Router  
**Usage:** Extract route params (`buildingId`, `eventId`, etc.)

### useQuery
**From:** TanStack Query  
**Usage:** Fetch and cache server data

### useMutation
**From:** TanStack Query  
**Usage:** Handle create/update/delete operations

### useAuth
**From:** Parent app (AuthContext)  
**Returns:** `{ user, isLoading, error, navigateToLogin }`

---

## Utility Functions

### createPageUrl
**File:** `lib/utils.js`  
**Usage:** Generate internal page URLs (if URL-based routing)

### cn
**File:** `lib/utils.js`  
**Usage:** Merge Tailwind class names

```jsx
import { cn } from '@/lib/utils';

<div className={cn('px-4 py-2', isActive && 'bg-navy')}>
  Content
</div>
```

---

## Icons (Lucide React)

All components use icons from lucide-react:

```jsx
import { Plus, Trash2, Edit2, Home, Star, Calendar, Users, Bell, Settings } from 'lucide-react';
```

**Common Icons:**
- Navigation: `Home`, `Building2`, `Menu`, `X`
- Actions: `Plus`, `Edit2`, `Trash2`, `Save`, `Cancel`
- Status: `CheckCircle`, `AlertCircle`, `Clock`
- Business: `Star`, `Calendar`, `Users`, `Bell`, `Settings`, `BarChart3`
- Social: `MapPin`, `Phone`, `Mail`, `MessageSquare`, `Share2`

---

## Data Models

See `/entities/*.json` for complete schema definitions:
- Building
- Tenant
- Flat
- Announcement
- Survey
- Event
- EventRSVP
- PerkLocation
- PerkRedemption
- Partner
- PartnerMessage
- AmenityReservation
- MaintenanceTicket
- Amenity
- Broadcast
- GlobalSettings

---

## Styling Approach

### Tailwind Classes
```jsx
<div className="px-4 py-2 bg-white border border-[var(--border-subtle)] rounded-lg shadow-soft">
  Content
</div>
```

### CSS Variables
```jsx
<div style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}>
  Content
</div>
```

### Design Tokens (Recommended)
```jsx
className="px-4 py-2 bg-white border border-border rounded-md shadow-soft"
```

---

## Export / Re-export

All components exported as default:

```jsx
export default function ComponentName() {
  return <div>...</div>;
}

// Import
import ComponentName from '@/components/path/ComponentName';
```

---
# Codex Guardrails — Downtown Perks Platform

> **Owner:** Architecture / Platform Guardrail  
> **Status:** READ-ONLY reference. Do not import, do not refactor, do not delete.  
> **Purpose:** Ground-truth context for future development decisions. Prevents regressions.

---

## §0 — Guardrail Rules (apply to ALL Codex/agent work)

1. **No edits to existing functional systems unless explicitly requested** by the user. This includes entity schemas, backend functions, routing, and layout structure.
2. **No CSS-wide find/replace changes** (italic removal, shadow tokens, border-radius cleanup) without a documented regression audit plan and explicit user approval.
3. **No renaming or deleting entity fields** used in reporting, export, or analytics pipelines — especially `buildingId`, `partner_id`, `survey_id`, `perk_id`, and denormalized `*_name` fields.
4. **No removal of "Protected Features"** listed in §5, even if they appear unused or redundant.
5. **No changes to build pipeline, `package.json`, or `tailwind.config.js`** unless explicitly requested.
6. **Documentation files in `docs/` are not runtime code.** They must never be `import`ed into any `.ts`, `.tsx`, `.js`, or `.jsx` file.

---

## §1 — Purpose

This document is a pre-implementation architectural audit of the **Downtown Perks** platform (Base44 app, Vite + React + Tailwind). It captures the canonical architecture, entity model, routing hierarchy, and protected feature set so that future development (including Codex-assisted work) can proceed without regressions.

It is intentionally **read-only** — it does not modify runtime behavior, build pipeline, or existing migrations.

---

## §2 — Reference App / Route

- **App name:** Downtown Perks Hub  
- **Router:** `src/App.jsx` (React Router v6)  
- **Primary entry:** `/` → `pages/Home.jsx`  
- **Building-scoped routes:** `/buildings/:buildingId/*` → `pages/BuildingLayout.jsx` (nested `<Outlet>`)  
- **Platform version:** Base44 Platform V3+ (functions invoked via `base44.functions.invoke('name', params)`)  

---

## §3 — Building-First Hierarchy & Bottom-Nav Model

### 3.1 Routing Architecture

All building-scoped pages live under `/buildings/:buildingId/`:

```
/buildings/:buildingId                    → Dashboard (index)
/buildings/:buildingId/residents          → Residents
/buildings/:buildingId/events             → Events
/buildings/:buildingId/events/:eventId    → EventDetail
/buildings/:buildingId/perks              → DowntownPerks
/buildings/:buildingId/perks/:perkId      → PerkDetail
/buildings/:buildingId/reports            → PerkReporting
/buildings/:buildingId/segmentation       → Segmentation
/buildings/:buildingId/surveys            → Surveys
/buildings/:buildingId/announcements      → AnnouncementManager
/buildings/:buildingId/announcements-feed → AnnouncementFeed
/buildings/:buildingId/engagement         → EngagementHub
/buildings/:buildingId/campaigns          → EngagementCampaigns
/buildings/:buildingId/amenities          → AmenityReservations
/buildings/:buildingId/partners           → PartnerDashboard
```

### 3.2 Canonical Building ID Resolver

- **File:** `src/utils/resolveActiveBuildingId.ts`  
- **Purpose:** Single source of truth for resolving the "active" building context from URL params, user state, or fallback.  
- **Rule:** All components that need `buildingId` must use this resolver, not ad-hoc `useParams` calls.  
- **Protected:** Do not remove, rename, or inline this resolver.

### 3.3 Bottom Navigation Model

- **Desktop:** `pages/BuildingLayout.jsx` renders a tab bar with role-aware navigation (admin vs. resident).  
- **Mobile:** `components/nav/BuildingBottomNav.jsx` renders fixed bottom tabs with a "More" overflow bottom-sheet pattern when tabs exceed 4.  
- **Role maps:** Defined in `BuildingLayout.jsx` as `adminNavItems` and `residentNavItems`.  
- **Rule:** Bottom nav must always be fixed on mobile. Do not replace with inline navigation.

### 3.4 Global Layout

- **File:** `src/layout.jsx` (wraps the app, provides sidebar + mobile header)  
- **Providers:** `LanguageProvider`, `CurrencyProvider`, `ThemeProvider`, `AuthProvider`, `QueryClientProvider`, `BrowserRouter`  
- **Sidebar:** Admin sees "Tools" section (Perk Analytics, Offers, Product Offerings, Partner Workspace, Partner Portal, Settings). Residents see Home, Properties, My Profile.

---

## §4 — Required Entity Models

### 4.1 Core Property Entities

| Entity | Purpose | Key Fields |
|---|---|---|
| **Building** | Downtown residential building | `name`, `address`, `district`, `tier`, `type`, `lat`, `lng`, `units`, `priceTier`, `walkScore`, `perkDensity`, `activityScore` |
| **Flat** | Individual unit within a building | `building_id`, `flat_number`, `floor`, `listing_type`, `price`, `beds`, `baths`, `sqft`, `room_type`, `is_occupied` |
| **Tenant** | Resident record | `flat_id`, `name`, `email`, `mobile_number`, `preferred_language`, `perks_enrolled`, `perks_tier`, `payment_status` |
| **Amenity** | Building amenity (gym, rooftop, etc.) | `building_id`, `name`, `capacity`, `hours_start`, `hours_end`, `slot_duration` |
| **AmenityReservation** | Booking record for an amenity slot | `amenity_id`, `tenant_id`, `reservation_date`, `start_time`, `end_time` |
| **MaintenanceTicket** | Resident maintenance request | `tenant_id`, `flat_id`, `title`, `description`, `category`, `priority`, `status` |

### 4.2 Perks & Partner Entities

| Entity | Purpose | Key Fields |
|---|---|---|
| **Partner** | Business partner in the perks program | `business_name`, `contact_email`, `category`, `is_active`, `joined_date` |
| **PerkLocation** | Venue offering a perk | `partner_id`, `name`, `category`, `district`, `lat`, `lng`, `perk`, `perk_type`, `is_featured`, `is_active` |
| **PerkRedemption** | Record of a perk being redeemed | `perk_id`, `perk_name`, `perk_category`, `user_email`, `user_name`, `redeemed_at` |
| **PartnerMessage** | Message between partner and resident | `partner_id`, `partner_name`, `resident_email`, `resident_name`, `message`, `subject`, `status` |
| **ProductOffering** | Stripe product/price catalog | `name`, `display_name`, `family`, `kind`, `amount`, `currency`, `interval`, `stripe_price_id`, `stripe_product_id` |

### 4.3 Engagement Entities

| Entity | Purpose | Key Fields |
|---|---|---|
| **Event** | Building or partner-hosted event | `title`, `date`, `location`, `building_id`, `partner_id`, `capacity`, `registered_count`, `image_url`, `status` |
| **EventRSVP** | Resident event registration | `event_id`, `event_name`, `event_date`, `registered_at` |
| **Announcement** | Building announcement | `building_id`, `title`, `message`, `type`, `priority`, `status`, `published_at`, `read_count` |
| **Survey** | Survey definition | `building_id`, `title`, `questions`, `status`, `responses_count`, `target_residents` |
| **SurveyResponse** | Individual survey submission | `survey_id`, `resident_id`, `building_id`, `answers`, `score`, `sentiment`, `source_flow`, `exported_to_google_sheets` |
| **SurveyExportLog** | Export audit trail | `survey_response_id`, `destination`, `status`, `sheet_id`, `row_number`, `retry_count` |
| **ManagementNotification** | Notification to property management | `type`, `resident_id`, `building_id`, `survey_response_id`, `message`, `status`, `channel` |
| **Campaign** | Engagement campaign | `building_id`, `name`, `segment_target`, `message`, `recipients_count`, `opens`, `clicks`, `conversions` |
| **Broadcast** | Broadcast messaging entity | (see `entities/Broadcast.json`) |
| **DANAMember** | DANA member import entity | (see `entities/DANAMember.json`) |

### 4.4 System Entities

| Entity | Purpose |
|---|---|
| **User** | Built-in Base44 user entity (auth-managed). Roles: `admin`, `user`. |
| **GlobalSettings** | App-wide settings including `business_name`, `business_name_ar`, `business_logo`, and `partner_report_spreadsheet_id` / `partner_report_spreadsheet_url` for Google Sheets report destination. |

### 4.5 Canonical ID Rules

- `buildingId` — always a string UUID from the Building entity. Used in ALL building-scoped routes and queries.
- `slug` — not used for routing; routes use raw UUIDs.
- Denormalized fields (`building_name`, `partner_name`, `perk_name`, `resident_name`, `survey_name`) are intentionally stored on related entities for reporting. **Do not remove these denormalized fields** — they are used in export pipelines and analytics.

---

## §5 — Protected Features (DO NOT REMOVE)

### 5.1 QR-Based Perk Redemption System

- **Components:** `components/partner/PartnerScanner.jsx`, `components/perks/PerkQRCode.jsx`  
- **Backend function:** `functions/verifyRedemption.js`  
- **Behavior:** Partners scan resident QR codes to validate and record perk redemptions. Uses `BarcodeDetector` API with manual entry fallback for browser compatibility.  
- **Protected:** The fallback manual entry path is critical for iOS Safari compatibility.

### 5.2 Survey Export to Google Sheets

- **Backend functions:** `functions/exportSurveyDataToSheets.js`, `functions/processSurveyResponse.js`, `functions/retryPendingSurveyExports.js`  
- **Connector:** Google Sheets (OAuth authorized, scopes: `spreadsheets`, `drive.file`, `email`)  
- **Secret:** `GOOGLE_SHEETS_SURVEY_SPREADSHEET_ID`  
- **Entities involved:** `SurveyResponse` (tracks `exported_to_google_sheets`, `google_sheet_row_id`), `SurveyExportLog` (audit trail)  
- **Known issue:** Google Sheets integration requires manual tab setup in the target spreadsheet.  
- **Protected:** The retry queue and export log entities must not be removed.

### 5.3 Management Notifications

- **Entity:** `ManagementNotification`  
- **Behavior:** When a survey response is completed (including redemption-linked surveys), a notification is created for property management.  
- **Known issue:** Platform limits email delivery to registered app users; external partner email delivery is restricted.  
- **Protected:** The notification creation flow in `processSurveyResponse` must not be removed.

### 5.4 Partner Analytics & Automated Reporting

- **Components:** `components/partner/PartnerAnalytics.jsx` (Recharts 30-day trend), `components/partner/PartnerOverview.jsx`  
- **Backend functions:** `functions/generatePartnerMonthlyReport.js`, `functions/sendMonthlyPartnerReports.js`, `functions/generatePartnerReportOnDemand.js`, `functions/sendWeeklyPartnerSummary.js`, `functions/monthlyPartnerRedemptionReport.js`  
- **Automation:** Scheduled weekly and monthly automations for partner redemption reports.  
- **Settings:** Report spreadsheet ID persisted in `GlobalSettings.partner_report_spreadsheet_id`.  
- **Protected:** The automated report pipeline and GlobalSettings spreadsheet ID field must not be removed.

### 5.5 Broadcast Messaging

- **Components:** `components/engagement/BroadcastPanel.jsx`, `components/engagement/BroadcastSender.jsx`  
- **Entity:** `Broadcast`  
- **Protected:** The broadcast send/receive flow must remain intact.

### 5.6 Resident Profile & Personal History

- **Page:** `pages/ResidentProfile.jsx` (route: `/profile`)  
- **Behavior:** Tracks personal perk redemptions and building announcements for residents.  
- **Protected:** Must remain accessible to all authenticated users.

### 5.7 Editorial Design System

- **Typography:** Instrument Serif for editorial headlines (`.heading-serif`), Inter for UI elements  
- **Color system:** Rich navy (`#0B1F33`), cool modern gold (`#C9A227`), bright white (`#FFFFFF`)  
- **Layout tokens:** `rounded-2xl` (32px), `border-subtle` token, `shadow-xs`/`shadow-sm` for card depth  
- **Component:** `components/editorial/EditorialHero.jsx` — reusable hero for Events, Announcements, Residents, Partner Portal  
- **Protected:** Do not replace editorial photography style (Travel + Leisure / Monocle aesthetic) with stock marketing visuals. Do not change the 4:5 portrait aspect ratio for editorial lifestyle imagery.

---

## §6 — Backend Function Inventory

| Function | Purpose | Protected? |
|---|---|---|
| `exportSurveyDataToSheets` | Exports survey responses to Google Sheets | Yes — §5.2 |
| `processSurveyResponse` | Processes survey submission, triggers export + notification | Yes — §5.2, §5.3 |
| `retryPendingSurveyExports` | Retries failed survey exports | Yes — §5.2 |
| `verifyRedemption` | Verifies QR perk redemption at partner point-of-sale | Yes — §5.1 |
| `generatePartnerMonthlyReport` | Generates monthly partner redemption report PDF/sheet | Yes — §5.4 |
| `sendMonthlyPartnerReports` | Sends monthly reports to all partners | Yes — §5.4 |
| `generatePartnerReportOnDemand` | On-demand partner report generation | Yes — §5.4 |
| `sendWeeklyPartnerSummary` | Weekly partner redemption summary via Google Sheets | Yes — §5.4 |
| `monthlyPartnerRedemptionReport` | Monthly aggregate redemption data | Yes — §5.4 |
| `generatePDFReport` | Generic PDF report generation | Yes |
| `sendAnnouncementNotification` | Sends push notification for announcements | Yes |
| `handlePartnerMessage` | Handles partner-to-resident messaging | Yes — §5.5 |
| `getPartnerContext` | Fetches partner dashboard context (perks, messages, redemptions) | Yes |
| `updatePartnerPerk` | Partner self-service perk update | Yes |
| `updatePartnerProfile` | Partner self-service profile update | Yes |
| `seedDemoData` | Seeds demo data for development | No |
| `seedDowntownBuildings` | Seeds building data | No |
| `importBuildingsAndUnits` | Imports buildings + flats from external data | No |
| `importDANAMembers` | Imports DANA member data | No |
| `importPerkLocations` | Imports perk venue data | No |
| `importTheShorResidents` | Imports resident data for The Shor building | No |

---

## §7 — Automations Inventory

| Automation | Type | Function | Schedule/Trigger |
|---|---|---|---|
| Weekly Partner Summary | Scheduled | `sendWeeklyPartnerSummary` | Weekly |
| Monthly Partner Reports | Scheduled | `sendMonthlyPartnerReports` | Monthly |

---

## §8 — Migration Approach & Implementation Rules

### 8.1 General Rules

1. **Entity schema changes** require `write_file` on the full JSON schema (not `find_replace`). Always preserve existing fields.
2. **Code changes** to existing files use `find_replace` (precise, targeted). New files use `write_file`.
3. **App.jsx** must be updated in the same tool batch when adding/removing pages (import + Route).
4. **Layout wrapping:** New routes outside the `pagesConfig` loop do NOT get automatic layout wrapping. Apply the same `LayoutWrapper` pattern.
5. **Parallel tool calls** should be used whenever changes are independent.

### 8.2 "Downtown Perks → Downtown Perks" Migration Notes

This audit was conducted to support a potential migration/rebrand from "Downtown Perks" to "Downtown Perks." The following must be preserved during any rename:

- All entity field names (especially `buildingId` and denormalized `*_name` fields)
- All backend function names (referenced by automations and frontend SDK calls)
- All route paths (bookmarked by users)
- The `GlobalSettings.business_name` / `business_name_ar` fields (already support runtime renaming)
- The canonical `resolveActiveBuildingId` resolver

### 8.3 What NOT to Do

- Do not replace `base44` SDK client calls with direct API fetches.
- Do not add npm packages not in the installed list without explicit approval.
- Do not create a root-level `Layout.js` — use `src/layout.jsx` and component-based layouts.
- Do not create login pages — auth is handled by the Base44 platform.
- Do not change the main page mapping. The `/` route in `App.jsx` is the source of truth.
- Do not remove RTL/Arabic language support (`LanguageContext`, `business_name_ar`).

---

## §9 — Design Token Reference

| Token | Value | Usage |
|---|---|---|
| `--navy-900` | `#0B1F33` | Primary brand color, sidebar, headings |
| `--gold` | `#C9A227` | Accent color, active states, focus rings |
| `--bg-main` | `#FAFBFC` | App background |
| `--bg-card` | `#FFFFFF` | Card surfaces |
| `--border-subtle` | `rgba(11,31,51,0.06)` | Card borders |
| `--radius-2xl` | `32px` | Standard card radius |
| `--font-sans` | `Inter` | UI text |
| `--font-serif` | `Instrument Serif` | Editorial headlines |

---

## §10 — Verification Checklist (for future Codex runs)

After any change, confirm:

- [ ] No runtime code imports reference `docs/` files
- [ ] No entity fields renamed/deleted without migration plan
- [ ] No protected features (§5) removed or disabled
- [ ] No CSS-wide find/replace without regression audit
- [ ] `App.jsx` routes updated for any new/removed pages
- [ ] `resolveActiveBuildingId.ts` not modified
- [ ] Build passes (`npm run build`) — no new lint/typecheck errors introduced

---

*Last updated: 2026-06-21*  
*Maintained by: Architecture / Platform Guardrail*
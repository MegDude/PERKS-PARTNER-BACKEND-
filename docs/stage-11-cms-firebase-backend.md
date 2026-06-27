# Stage 11 CMS + Firebase Backend Implementation

## What Was Added

Stage 11 is now represented in the operating backend as real entities, not page-only content.

The backend now supports:

- CMS content entities for attractions, venues, parks, museums, music places, and discovery records.
- Editable collections such as Best Coffee, Date Night, Art, Music, Family, and Local Favorites.
- Publishing workflows with draft, review, scheduled, published, and archived states.
- Content revisions for rollback and audit visibility.
- CMS relationships for nearby and related entity generation.
- Walking route records.
- Public map inclusion for published CMS entities through the existing `/api/map/entities` and `/api/map/pins` APIs.
- Admin APIs under `/api/cms/*`.

## Firebase Layer

Firebase is now initialized through `src/lib/firebase.ts`.

Collections are typed for:

- `partners`
- `contacts`
- `perks`
- `campaigns`
- `outreach_activity`

Authentication is centralized in `src/components/context/AuthContext.tsx`.

Partner and contact CRUD helpers are centralized in `src/services/FirebaseService.ts`.

The frontend never stores private Firebase credentials. Public Firebase app config must be supplied through `VITE_FIREBASE_*` variables.

## Partner Workspace Buttons

The shared partner workspace template now treats repeated CTA controls as operational actions:

- Setup saves through workspace state.
- QR copy, SVG export, print, save, and copy deck actions are wired.
- Perk save, publish, calendar, favorite, and export actions are wired.
- Event add, save, publish, export, calendar, and remove actions are wired.
- Broadcast add, save, send, report, export, and remove actions are wired.
- Resident add, import, save, export, and remove actions are wired.
- Billing plan activation, quote download, invoice request, credit application, and add-on selection are wired.
- Favorite and Keep actions now persist to `PartnerSettings` instead of only toggling local UI state.

## API Surface

New API endpoints:

- `GET /api/cms/entities`
- `POST /api/cms/entities`
- `GET /api/cms/entities/:id`
- `PATCH /api/cms/entities/:id`
- `POST /api/cms/entities/:id/publish`
- `POST /api/cms/entities/:id/archive`
- `GET /api/cms/collections`
- `POST /api/cms/collections`
- `PATCH /api/cms/collections/:id`
- `POST /api/cms/relationships/generate`
- `GET /api/cms/workflows`

These endpoints use the same JSON-backed operational database, audit logging, and analytics event system as the rest of the platform.

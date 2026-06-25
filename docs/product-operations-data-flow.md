# Product Operations Data Flow

## Resident Map Action

Resident selects or acts on a map pin in 5173.

1. 5173 loads entities from `GET /api/map/entities`.
2. User action posts to `POST /api/map/events`.
3. 3014 writes `AnalyticsEvent`.
4. 3014 writes `TenantAuditLog` for auditable workflow actions.
5. Analytics summary updates through `GET /api/analytics/summary`.
6. Partner/property admin surfaces can read the interaction through reports and activity.

## Perk Redemption

1. 5173 calls `POST /api/perks/:id/redeem`.
2. 3014 validates active status.
3. 3014 blocks duplicate redemptions inside the local eligibility window.
4. 3014 creates `PerkRedemption`.
5. 3014 increments the perk redemption count.
6. 3014 emits analytics and audit events.
7. Reports and partner dashboards read the new redemption.

## Event RSVP

1. 5173 calls `POST /api/events/:id/rsvp`.
2. 3014 validates event existence and capacity.
3. 3014 creates `EventRSVP`.
4. 3014 increments event registered count.
5. 3014 emits analytics and audit events.
6. Follow-up can be queued through `POST /api/events/:id/follow-up`.

## Campaign Publish

1. Admin or partner calls `POST /api/campaigns/:id/publish`.
2. 3014 sets status to `active` and stamps `published_at`.
3. 3014 emits analytics and audit.
4. Product surfaces can use campaign state to activate placements.

## Survey Submission

Existing compatibility function `processSurveyResponse` stores responses, queues export records, and creates notification records. AI summaries can be generated with `POST /api/ai/survey-summary`.

## QR Scan

1. Scan request posts to `POST /api/qr/scan`.
2. 3014 resolves `PartnerQrExperience`.
3. 3014 records `QrScan`.
4. 3014 increments QR scan count.
5. 3014 emits analytics and audit.
6. API returns the destination URL.


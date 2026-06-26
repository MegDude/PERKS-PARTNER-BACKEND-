# Prioritized Build Roadmap

## Priority 1: Production Blockers

1. Convert all destructive deletes to soft delete, starting with perks.
2. Add test coverage for partner provisioning, DUDE2026 checkout, perk redemption, event RSVP, campaign publish, QR scan, AI query, and resident import.
3. Verify 5173 product routes and 3014 operations routes as one connected platform.
4. Add a production database migration path for the current JSON-backed data, including the imported The Shore resident directory.

## Priority 2: Missing Backend / Security

1. Extract backend domains out of `server.ts`.
2. Add schema validation to every mutation endpoint.
3. Add server-side permission guards and tenant scoping.
4. Move from local JSON persistence to production database with migrations and indexes.
5. Add API contracts and error schemas.

## Priority 3: Missing Workflows

1. Durable workflow engine with triggers, conditions, actions, retries, failures, notifications, and run history.
2. Survey provider webhook intake and escalation routing.
3. Campaign audience resolution and delivery execution.
4. Event reminders and follow-up delivery.
5. Resident enrollment, card/access, saved items, and bulk updates.
6. Reusable resident directory ingestion with preview, duplicate review, rollback, audit, analytics, and report updates.

## Priority 4: Integrations

1. Stripe paid checkout and webhooks.
2. OpenAI runtime and image generation smoke tests.
3. Twilio Verify/Messaging.
4. Tally/Jotform/SurveyJS webhook verification.
5. Supabase/Postgres operational store.
6. Google Sheets/report sync.
7. n8n orchestration.

## Priority 5: Polish / Future

1. Standard responsive table/card component across admin.
2. Complete mobile QA for every route.
3. Global search service.
4. AI observability dashboard.
5. Report scheduling and partner-ready exports.
6. Visual regression checks.

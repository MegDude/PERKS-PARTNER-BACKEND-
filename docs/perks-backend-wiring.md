# Perks Backend Wiring

## API

- `GET /api/perks`
- `POST /api/perks`
- `PATCH /api/perks/:id`
- `POST /api/perks/:id/activate`
- `POST /api/perks/:id/pause`
- `POST /api/perks/:id/archive`
- `POST /api/perks/:id/redeem`

## State Rules

- `active`: visible and redeemable.
- `paused`: not redeemable.
- `archived`: retained for history/reporting.
- duplicate redemption within 24 hours is blocked by the local rule.

## Outputs

- `PerkRedemption`
- `AnalyticsEvent`
- `TenantAuditLog`
- updated perk redemption count


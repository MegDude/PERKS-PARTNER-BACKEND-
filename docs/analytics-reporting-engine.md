# Analytics and Reporting Engine

## Analytics

Endpoint:

- `POST /api/analytics/events`
- `GET /api/analytics/summary`

Events tracked by new product-operation endpoints:

- map interactions
- perk status changes
- perk redemptions
- event RSVPs
- event check-ins
- campaign status changes
- QR scans
- AI requests

## Reporting

Endpoint:

- `GET /api/reports`
- `POST /api/reports/run`
- `GET /api/reports/:id/export`

Report runs aggregate:

- partners
- properties
- perks
- events
- campaigns
- redemptions


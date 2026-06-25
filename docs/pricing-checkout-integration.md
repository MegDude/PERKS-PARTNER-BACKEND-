# Pricing, Lead Capture, Checkout, and Onboarding Integration

## Source Files

- `/Users/megdude/Downloads/PRODUCTS LIST/UPDATED NEW PRICING/products.csv`
- `/Users/megdude/Downloads/PRODUCTS LIST/UPDATED NEW PRICING/prices (1).csv`

## Imported Catalog

The 3014 operations platform imports:

- 51 product records
- 49 price records
- Stripe product IDs
- Stripe price IDs
- amount
- currency
- cadence
- product family
- kind
- partner type
- tier metadata

Destination entity:

- `ProductOffering`

## API

- `POST /api/products/import-pricing-catalog`
- `GET /api/products`
- `GET /api/prices`
- `POST /api/partner-leads`
- `GET /api/partner-leads/export.csv`
- `POST /api/checkout/session`

## Lead Capture

Partner signup and registration data is persisted into `PartnerRegistration`.

Captured fields include:

- organization name
- contact name
- email
- phone
- partner type
- interest
- selected plan
- selected products
- checkout state
- Google Sheets export readiness

CSV export is available immediately through:

`/api/partner-leads/export.csv`

Google Sheets stays `pending_credentials` until the required Google service credentials are present.

## Checkout

Stripe Checkout Sessions are the correct production payment surface for the platform because the catalog includes subscriptions and one-time add-ons.

Behavior:

- If `STRIPE_SECRET_KEY` is present, the server creates a Stripe Checkout Session using the imported Stripe price IDs.
- If `STRIPE_SECRET_KEY` is absent, the server creates a local checkout record and invoice with `status: pending_credentials`.
- Provider credentials are never exposed to the browser.
- Checkout creates or resolves the organization/workspace context.

## Verified Local Flow

Test lead:

- Organization: QA Partner
- Email: qa-partner@example.com
- Partner type: venue
- Interest: Campaign or Offer

Result:

- lead record created
- CSV export included the lead
- checkout session created in pending-credentials mode
- selected Stripe price: `price_1ThxCaEH6o7elwpUha0gU6q2`
- selected product: `Tier/venue/Basic`


# Platform Reconciliation

Downtown Perks is modeled as one platform with two presentation surfaces:

- 5173: customer-facing product
- 3014: operations platform and backend control system

## Reconciled This Pass

- Added explicit 3014 product-operation APIs.
- Added analytics and audit helpers.
- Added operational collections for analytics events, QR scans, report runs, and integration statuses.
- Documented route ownership and data ownership.
- Preserved existing architecture instead of replacing working features.

## Remaining Reconciliation

- Move 5173 product data calls to 3014 APIs.
- Split 3014 server into domain folders when the repo is ready for a larger backend refactor.
- Add full automated test suite; current repo only exposes `npm run lint`.


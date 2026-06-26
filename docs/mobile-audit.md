# Mobile Audit

## Current State

Some responsive work exists, including collapsible navigation, compact metric strips, and horizontal rails. However, the platform still contains wide tables, tab rails, and page-local grids that require route-by-route verification.

## Mobile Risks

- Wide admin tables can hide right-side columns.
- Tab rails can consume too much horizontal space.
- Modals should convert to bottom sheets on mobile.
- Primary actions can become hidden below long content.
- Some buttons may not maintain 44px touch targets.
- Mobile product/admin route parity is unproven.

## Required Mobile QA Matrix

Verify every major route at:

- iPhone SE
- iPhone 15 Pro
- Pixel 8
- iPad
- desktop 1280
- desktop 1440

## Required Component Rules

1. Tables become stacked cards under tablet width.
2. Drawers become bottom sheets.
3. KPI/metric rows become compact matrix or horizontal rail.
4. Filters collapse into a controlled panel.
5. Actions remain visible and 44px minimum.
6. No horizontal overflow.
7. No clipped text or hidden buttons.

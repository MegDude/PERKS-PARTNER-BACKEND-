# Downtown Perks Admin Design System

This system governs the 3014 Partner Platform and admin workspace. It is an operations product, not a public marketing site.

## Shell

- Every admin route renders inside `PartnerDashboardLayout`.
- Pages should use the shared shell, navigation, workspace header, toolbar, content grid, inspector/drawer patterns, and notification layer.
- Do not create independent page shells.

## Color

- App background: `#F7F8FB`
- Surface: `#FFFFFF`
- Primary navy: `#0B1F33`
- Secondary navy: `#132238`
- Gold accent: `#C8A96A`
- Border: `rgba(11,31,51,.08)`
- Muted text: `rgba(11,31,51,.62)`

## Typography

Use Inter for every admin surface.

- Display: `48px`
- H1: `36px`
- H2: `28px`
- H3: `22px`
- Body: `16px`
- Caption: `14px`

Avoid large public-facing serif treatments inside backend modules.

## Layout

- Content max width: `1320px`
- Sidebar width: `240px`
- Internal spacing: `24px`
- Section rhythm: `24 / 32 / 48 / 64`
- Cards: `24px` padding, `16px` radius, hairline border, no heavy shadow.

## Components

Use shared components before page-local markup:

- `Button`
- `Card`
- `Table`
- `Tabs`
- `Badge`
- `Input`
- `Textarea`
- `H1/H2/H3/Body`

Every route should include predictable loading, permission, data, empty, error, and ready states.

## Mobile

Do not shrink desktop layouts. On mobile:

- Cards stack full width.
- Data grids scroll horizontally or become stacked entity lists.
- Toolbars wrap.
- Buttons keep at least a `44px` touch target.
- Drawers become full-width or bottom-sheet style.

## Fake Visuals

Decorative maps, fake dashboards, fake charts, and non-operational illustrations are not part of the admin system. Replace them with real metrics, activity, tables, tasks, recommendations, or workflow content.

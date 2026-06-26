# Design System Audit

## Current Direction

The platform uses a restrained operational visual language: white surfaces, navy text, gold accent, square/no-rounded admin controls in several recent areas, compact metric matrices, and table-first operational views.

## Inconsistencies

- `src/components/ui/card.tsx` still defaults to `rounded-2xl`, conflicting with the no-rounded admin direction.
- Many pages use hand-built borders, spacing, and typography instead of tokens.
- Buttons vary between shared `Button`, inline `inline-flex`, and custom utility strings.
- Summary metrics appear as cards, tables, and page-local grids.
- Some marketing/editorial copy appears in admin operational pages.

## Required Tokens

| Token | Rule |
| --- | --- |
| Background | White primary surfaces. |
| Text | `#0B1F33` / `#11182B` primary navy. |
| Accent | `#C8A96A` sparingly for highlights and active states. |
| Border | `rgba(11,31,51,0.08-0.16)`. |
| Radius | Admin operational components should use square or minimal radius. |
| Typography | Sans-serif for interface; no oversized hero type inside admin panels. |
| Spacing | 8px scale with 16/24/32 section rhythm. |
| Buttons | 44px minimum touch target; icon+text only when command needs label. |

## Remediation

1. Update shared card/button/table primitives to match admin rules.
2. Replace page-local metric cards with `MetricMatrix`.
3. Replace page-local summary cards with `SummaryTable`.
4. Add design-system lint checklist for new pages.

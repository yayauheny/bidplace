# S2 — `/works` catalog, mobile web

## Scope and outcome

- Source: Figma `526:13248`.
- Acceptance target: mobile web at 390 px only.
- `Implemented`: title/intro rhythm, full-width active tab divider, controls
  spacing, 366 × 488 cover cards with 20 px gaps, and dock reserve.
- `Implemented`: loading, empty, error with retry, one-item, and long-title
  states.
- S7 filter wiring is intentionally excluded from this task. The disabled
  filter affordance and existing working sort control remain until the
  integration task.

## Evidence

| Element | Figma | Runtime | Status |
| --- | --- | --- | --- |
| Page gutter | 12 px | 12 px | Match |
| Cover card | 366 × 488 | 366 × 488 | Match |
| Card gap | 20 px | 20 px | Match |
| Active tab | full divider + 2 px underline | full divider + 2 px underline | Match |
| List end | clear of floating dock | last card ends 20 px above dock | Match |
| Long title | constrained overlay copy | two lines with ellipsis, no overflow | Match |

Captures:

- `works-top-390.png`
- `works-bottom-390.png`
- `works-loading-390.png`
- `works-empty-390.png`
- `works-error-390.png`
- `works-one-long-390.png`

Focused ESLint and IDE diagnostics pass. Full mobile TypeScript remains blocked
by unrelated concurrent DOM-iterable errors in e2e files and
`CreatorHeader.web.tsx`.

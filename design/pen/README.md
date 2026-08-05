# Pen workspace

Status: Initialized

## Main canvas

- `bidplace-web.pen` — editable Pen canvas for bidplace web prototypes.
- `01-SCREEN-PROMPTS.md` — numbered, copy-ready prompts based on the current
  MVP routes and screen source files.

## Current task

Screen: Public catalog — first MVP screen
Route: `/`
Role: Public buyer / guest
Scope: 1440, 1024, 390 px; default, loading, empty, error; long-title and unavailable-image card coverage
Approved references: Current Expo implementation and `01-SCREEN-PROMPTS.md` prompt 1
Existing implementation: `apps/mobile/src/features/products/product-list-screen.tsx`, `apps/mobile/src/components/modern-ui/AuctionCard.tsx`, `apps/mobile/src/components/layout/AppShell.tsx`
Known problems: Founder-approved production photography is not yet final; the prototype uses explicit neutral missing-asset placeholders
Must not change: Product behavior, shared tokens, production UI, navigation, API, filters, tags, favorites, pagination, recommendations, cart, or fake actions
Open questions: Primary button color is mirrored to production black `#111111`; final brand approval and founder visual/device/accessibility acceptance remain open

## Directories

- `references/` — approved references and owned assets only.
- `exports/` — approved PNGs for review only.

## Workflow

Use `bidplace-web.pen` as the single editable prototype. Production tokens in
`packages/design-tokens` and shared Expo UI components remain the implementation
source of truth.

Choose one numbered prompt at a time. An approved Pen frame is a visual
decision, not permission to alter product behavior or production code.

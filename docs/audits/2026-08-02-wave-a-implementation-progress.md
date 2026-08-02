# Wave A implementation progress

Дата начала: 2026-08-02
Ветка: `feature/wave-a-responsive-layout`
Scope: только structural responsive fixes из Wave A. Wave B и Wave C не выполняются.

## A1 — Centralize layout contracts

Status: `Completed`

### Completed work

- Added confirmed modern layout, breakpoint and product portrait ratio contracts.
- Switched shell/header/product consumers from duplicated shell and rail literals to shared contracts.
- Added a shared catalog column helper with the confirmed 2/3/4-column boundaries.

### Changed files

- `packages/design-tokens/src/modern.ts`
- `apps/mobile/src/components/layout/AppShell.tsx`
- `apps/mobile/src/components/layout/AppHeader.tsx`
- `apps/mobile/src/features/products/product-list-screen.tsx`
- `apps/mobile/src/features/products/product-screen.tsx`
- `apps/mobile/src/features/products/catalog-layout.ts`
- `apps/mobile/src/features/products/catalog-layout.spec.ts`

### Checks and results

- `@bidplace/design-tokens` build: passed.
- Catalog boundary unit test: passed, 6/6 at 899, 900, 1024, 1025, 1439 and 1440 px.
- Mobile typecheck: passed.
- Targeted mobile lint: passed.
- `git diff --check`: passed.

### Screenshots/evidence

- Existing visual evidence remains in `/private/tmp/bidplace-wave2-screenshots`.
- Fresh Wave A screenshots are not yet captured; A2/A3 geometry work is required before the state matrix is meaningful.

### Exact next action

Implement A2 overlay and dialog layer/geometry contracts, then update this file and commit A2 separately.

### Blockers

- A4 is blocked until founder Decision 3 approves `productDetailWide = 900`, `productHeroWide = 440` and related visible sizes.
- A5 is blocked until founder Decision 4 approves `buttonCompact = 44`, `compactRadius = 14` and navigation typography.

## A2 — Overlay and dialog contract

Status: `Implemented; browser verification pending`

### Completed work

- Account dropdowns use `OverlayPortal` on web at every viewport, including mobile widths.
- Bottom-end popovers use an 8px collision inset and the shared `layer.popover` value.
- Escape closes the account menu and returns focus to its trigger; outside interactive clicks do not restore focus.
- Dialog overlay/content use `layer.modal`, remain within the viewport gutters and scroll internally when content is long.

### Changed files

- `apps/mobile/src/components/layout/OverlayHost.tsx`
- `apps/mobile/src/components/layout/overlay-geometry.ts`
- `apps/mobile/src/components/layout/overlay-geometry.spec.ts`
- `apps/mobile/src/components/layout/AccountMenu.tsx`
- `apps/mobile/src/components/modern-ui/AppDialog.tsx`
- `apps/mobile/e2e/navigation.spec.ts`
- `apps/mobile/e2e/01-wave2-layout-screenshots.spec.ts`

### Checks and results

- Overlay geometry unit test: passed, 2/2.
- Mobile typecheck: passed.
- Targeted mobile lint: passed.
- `git diff --check`: passed.
- E2E assertions were added but the full browser suite has not yet been rerun for this task.

### Screenshots/evidence

- Existing screenshots remain in `/private/tmp/bidplace-wave2-screenshots`.
- Fresh open-account-menu and dialog screenshots are pending the full Wave A browser run.

### Exact next action

Implement A3 shared catalog grid/card geometry, then run the combined Wave A browser matrix.

### Blockers

- A4 is blocked until founder Decision 3 approves `productDetailWide = 900`, `productHeroWide = 440` and related visible sizes.
- A5 is blocked until founder Decision 4 approves `buttonCompact = 44`, `compactRadius = 14` and navigation typography.

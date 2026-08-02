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
- Wave A screenshots are captured in `/private/tmp/bidplace-wave2-screenshots` after A3: loaded/loading/failed-image catalog, account-menu and dialog states at 1440/1024/390, plus existing Product screenshots.

### Exact next action

A1 is complete. A2, A3, A4 and A5 are complete in code; final founder visual/device/accessibility acceptance remains separate.

## A3 — Unified catalog grid and compact card

Status: `Implemented`

### Completed work

- Loading and loaded catalog states use the same `CatalogGrid` column calculation, cell width, margin and padding.
- Skeletons mirror the loaded card's 4:5 media, author, title, description, price and status/deadline geometry.
- Loaded and failed-image media use the shared `ratio.productPortrait` contract and `contain` presentation.
- Catalog cards no longer render publication date; price + `BYN` are an atomic one-line value and status/deadline occupy a separate following line.
- Added card content tests for long title/description normalization, four-digit prices and LIVE/SCHEDULED/ENDED status copy.
- Expanded target-width E2E screenshots and bounding-box assertions for loaded/loading/failed-image catalog, account menu and dialog states.

### Changed files

- `apps/mobile/src/features/products/product-list-screen.tsx`
- `apps/mobile/src/components/modern-ui/AuctionCard.tsx`
- `apps/mobile/src/components/modern-ui/auction-card-layout.ts`
- `apps/mobile/src/components/modern-ui/auction-card-layout.spec.ts`
- `apps/mobile/src/components/modern-ui/ImagePlaceholder.tsx`
- `apps/mobile/src/components/modern-ui/ProductGallery.tsx`
- `apps/mobile/e2e/01-wave2-layout-screenshots.spec.ts`

### Checks and results

- Card/grid/overlay unit tests: passed, 13/13.
- Full mobile unit suite: passed, 33/33 across 8 test files.
- Mobile typecheck: passed.
- Full mobile lint: passed.
- Expo web export: passed through the installed Expo CLI after the package wrapper reported the workspace pnpm 11.7.0 versus Corepack pnpm 11.10.0 mismatch.
- Expanded target-width screenshot matrix: passed, 1/1.
- E2E screenshot evidence: `/private/tmp/bidplace-wave2-screenshots` contains `catalog`, `catalog-loading`, `catalog-failed-image`, `account-menu`, `product` and `dialog` PNGs for 1440/1024/390.
- Final full Playwright rerun after Wave A implementation: passed, 22/22.

### Exact next action

A3 remains complete. A4 and A5 are implemented under the explicit request to deliver the whole Wave A plan; final founder visual/device/accessibility acceptance remains separate.

## A4 — Product detail structural responsive fix

Status: `Implemented`

### Completed work

- Added the requested `900px` Product detail transition and `440px` wide hero contract; the gallery keeps the shared `4:5` ratio and uses the same geometry for loaded and failed images.
- Product detail uses a two-column gallery/author-title-auction structure from 900px, including the 1024px shell-with-mobile-header range; below 900px it stays linear.
- On narrow screens the amount field remains in the scrollable auction panel. The fixed bottom action is limited to a short minimum-bid summary and one compact primary action, with safe-area padding.
- Admin rendering still shows the no-bidding notice and never mounts a buyer bid field or mobile bid dock.

### Changed files

- `packages/design-tokens/src/modern.ts`
- `apps/mobile/src/components/modern-ui/ProductGallery.tsx`
- `apps/mobile/src/components/modern-ui/BottomActionBar.tsx`
- `apps/mobile/src/features/products/product-screen.tsx`
- `apps/mobile/e2e/wave-a-responsive.spec.ts`

### Checks and results

- Mobile typecheck and lint: passed.
- Responsive Product buyer/admin E2E: passed, 2/2 tests; widths 899/900/1024/1025 and 300×375 / 440×550 gallery bounds are asserted.
- Mobile bid eligibility and admin no-bid conditions remain unchanged in `ProductScreen` and the API contract.

## A5 — Compact mobile navigation and auth viewport

Status: `Implemented`

### Completed work

- Added compact `44px` button and `14px` radius tokens; the mobile bid action uses that compact variant.
- Mobile navigation now uses equal-width cells with icon above an up-to-two-line Inter `500 / 13 / 18` label and no tablist role, eliminating the 390px seller-navigation overflow.
- Login and registration share a `KeyboardAvoidingView` + `ScrollView` viewport so the form remains reachable when the viewport is narrow, the keyboard is open or browser scale is enlarged.

### Changed files

- `packages/design-tokens/src/modern.ts`
- `apps/mobile/src/components/modern-ui/Button.tsx`
- `apps/mobile/src/components/layout/AppHeader.tsx`
- `apps/mobile/src/components/layout/AuthViewport.tsx`
- `apps/mobile/src/app/(auth)/login.tsx`
- `apps/mobile/src/app/(auth)/register.tsx`
- `apps/mobile/e2e/navigation.spec.ts`
- `apps/mobile/e2e/wave-a-responsive.spec.ts`

### Checks and results

- Mobile typecheck and lint: passed.
- Responsive navigation/auth E2E: passed, 2/2 tests; approved seller navigation is checked at 390px for four in-viewport cells and no document overflow, and register is checked after focus at enlarged scale and reduced viewport height.
- Founder visual/device/accessibility acceptance remains pending.

## A2 — Overlay and dialog contract

Status: `Implemented`

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
- Full Chromium/Playwright suite: passed, 22/22, including auction/security regressions, account menu at 390px, Escape focus return, modal surface layer and Wave A responsive assertions.

### Screenshots/evidence

- Existing screenshots remain in `/private/tmp/bidplace-wave2-screenshots`.
- Open-account-menu and dialog screenshots are captured for 1440/1024/390 in `/private/tmp/bidplace-wave2-screenshots`.

### Exact next action

A2 is complete; continue with final Wave A verification and handoff.

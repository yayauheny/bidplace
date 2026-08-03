# Wave B — implementation progress

Date: 2026-08-02
Branch: `feature/wave-b-visual-system`
Scope: shared component and visual-system fixes only; Wave C screen redesign is out of scope.

## Baseline

- Starting commit: `b817520` (`fix issue:`)
- Wave A responsive/layout changes are present and must not regress.
- The worktree was clean before this task.
- Active runtime consumers import `modernTokens`; the package still exposes conflicting legacy token objects from `src/index.ts`.

## Decisions

- Confirmed in the task and recorded in `docs/product/12-DECISION-LOG.md`: action text uses `accentDark #BC3C1B`, danger uses `#B63B3B`.
- Confirmed in the task and recorded in `docs/product/12-DECISION-LOG.md`: keyboard focus uses `#2457E6`.
- Confirmed from Wave A: product breakpoint `900`, hero `440`, compact button `44`, radius `14`, nav `Inter 500/13/18`.
- No other founder decisions are required for the B1–B6 scope.

## Plan

1. B1: canonical semantic token surface, contrast/focus/opacity/ratio tests.
2. B2: shared focus-visible, reduced-motion, hit-area and decorative-child contracts.
3. B3: stable button loading geometry and accessibility semantics.
4. B4: stable media/card/detail primitives and narrow-card tests.
5. B5: dialog focus/layer/scroll and PageState announcement contract.
6. B6: localized presentation adapters and serialization tests.
7. Run required package/mobile checks and collect target-width screenshots.

## Candidate fixes

- Screen-local styling work is a hack and risks divergence.
- A broad UI rewrite is out of scope.
- Selected durable fix: update shared tokens/primitives, reuse them in current consumers, and add focused tests without changing API, domain logic, or screen order.

## Current step

Implement the four post-Wave-B audit fixes, rerun the full verification matrix, and record the updated evidence.

## Completed slices

### B1 — semantic contrast/focus tokens and public token surface

- Done: `modernTokens` is the only package entry-point token surface; no current workspace runtime consumer imported the removed legacy exports.
- Done: `accentDark`, `danger`, `focus`, disabled opacity, Wave A geometry, and product portrait ratio are semantic tokens.
- Done: AppText accent and TextField disabled opacity use the semantic roles.
- Changed: `packages/design-tokens/src/modern.ts`, `packages/design-tokens/src/index.ts`, `apps/mobile/src/components/modern-ui/AppText.tsx`, `apps/mobile/src/components/modern-ui/TextField.tsx`, `apps/mobile/src/lib/visual-token.spec.ts`.
- Checks: design-tokens build passed; visual token suite passed 1 file / 6 tests; `git diff --check` passed.
- Not done: focus-visible runtime adapter, reduced-motion behavior, and remaining B2–B6 work.
- Next: implement B2 shared interaction and accessibility contracts.
- Risks: founder visual/device/accessibility acceptance remains separate.

### B2 — focus, motion, hit-area, and decorative-child contract

- Done: web focus-visible uses a 2px outline with 2px offset and the semantic focus color; reduced-motion disables CSS transitions/animations and native/web image/press motion through the shared adapter.
- Done: compact logo and Product author link have transparent 44px hit areas; composite icons no longer duplicate parent accessible names; image placeholders expose one labeled image role.
- Changed: `apps/mobile/global.css`, `apps/mobile/src/lib/motion.ts`, `apps/mobile/src/lib/reduced-motion.ts`, `apps/mobile/src/lib/reduced-motion.spec.ts`, `MotionPressable.tsx`, `AppIcon.tsx`, `ImagePlaceholder.tsx`, `AuctionCard.tsx`, `ProductGallery.tsx`, `BrandLogo.tsx`, `product-screen.tsx`, `PageState.tsx`.
- Checks: mobile typecheck passed; mobile lint passed; targeted suite passed 4 files / 16 tests after isolating the pure motion helper.
- Not done: founder physical-device and screen-reader acceptance remains; B3–B6 remain at this slice.
- Next: stabilize button loading geometry and compact/default semantics.
- Risks: physical-device focus and accessibility acceptance remains separate.

### B3 — stable button loading geometry

- Done: default content-width buttons remain 56px/18px; compact remains 44px/14px; explicit block remains the only full-width variant.
- Done: busy buttons retain the original accessible label and visible label, expose `aria-busy` plus disabled semantics on web, and reserve a stable 20px icon/spinner slot.
- Changed: `Button.tsx`, `button-layout.ts`, `Button.spec.ts`.
- Checks: targeted button/token suite passed 2 files / 10 tests; mobile typecheck and lint passed.
- Not done: visual width evidence at target viewports remains part of the final E2E/screenshot pass; B4–B6 remain.
- Next: finish shared media/card/detail contracts.
- Risks: no new button hierarchy or full-width behavior was introduced.

### B4 — shared media/card/detail primitives

- Done: `productMediaStyle` is the shared 4:5 loaded/skeleton/fallback/gallery geometry contract; `AuctionCard` keeps author/title/one-line description and atomic price/status-deadline rows stable on narrow widths.
- Done: `EditorialSection` is prepared as a plain detail primitive for Wave C; current Product section order and chrome are unchanged.
- Changed: `product-media-style.ts`, its spec, `EditorialSection.tsx`, modern-ui exports, `AuctionCard.tsx`, `ProductGallery.tsx`, and catalog skeleton usage.
- Checks: targeted media/card/button suite passed 3 files / 11 tests; mobile typecheck and lint passed.
- Not done: browser visual evidence for long/missing/failed media remains part of the final screenshot/E2E pass; B5–B6 remain.
- Next: finish dialog and PageState contracts.
- Risks: no product section order or auction flow was changed.

### B5 — dialog and PageState contract

- Done: PageState now separates loading/empty/error modes; loading is one polite `progressbar` announcement and does not duplicate loading copy or expose retry.
- Done: AppDialog keeps modal layer 30, bounded scroll content, keyboard tap handling, nested scrolling, and modal accessibility semantics; the existing dialog primitive continues to own focus trap, initial focus, Escape, and focus return.
- Changed: `AppDialog.tsx`, `PageState.tsx`, `page-state-contract.ts` and its spec, modern-ui exports.
- Checks: targeted state/media/card suite passed 3 files / 9 tests; mobile typecheck and lint passed.
- Not done: founder device and screen-reader acceptance remains; B6 remains at this slice.
- Next: add shared presentation maps/adapters without changing server values or serialization.
- Risks: dialog primitive behavior still needs real browser verification.

### B6 — presentation adapters for existing seller/admin data

- Done: shared localized maps cover seller/product/listing/order statuses, seller types, cancellation reasons, and handoff contact/initiator values; unknown values use explicit unavailable-status copy rather than leaking raw enums.
- Done: `SelectableRow` keeps existing string values for API payloads while presenting localized 44px compact choices; seller profile and admin cancellation paths use it/presentation maps.
- Done: date-time adapter normalizes valid input to ISO for existing listing serialization and returns `null` for invalid input; no server schema or schedule rule changed.
- Changed: `apps/mobile/src/lib/presentation.ts` and its spec, `SelectableRow.tsx`, modern-ui exports, seller profile/admin/order/product-draft/listing-draft screens.
- Checks: targeted adapter/state/media/button suite passed 4 files / 12 tests; mobile typecheck and lint passed.
- Not done: full E2E and target screenshots remain.
- Next: run final package/mobile checks, E2E, screenshots, and inspect worktree.
- Risks: full E2E may require Docker PostgreSQL and local package-manager state.

### Audit hardening follow-up

- Done: danger-surface contrast now has an independent normal-text AA assertion; icon accents use the contrast-safe semantic role; the seller read-only explanation no longer exposes `CHANGES_REQUESTED`.
- Done: AppDialog captures the invoking web control through the shared Radix auto-focus hooks and restores it on cancel/Escape/unmount; the browser evidence now checks initial focus, Tab containment, cancel/return, and modal layer.
- Done: Wave B browser evidence now checks pointer-first `:focus-visible` behavior, keyboard focus on the account menu, Escape dismissal and focus return, and busy-button width change within 1px.
- Changed: `apps/mobile/src/lib/visual-token.spec.ts`, `apps/mobile/src/components/modern-ui/AppDialog.tsx`, `apps/mobile/src/components/modern-ui/Button.tsx`, `apps/mobile/src/features/sellers/seller-profile-screen.tsx`, `apps/mobile/e2e/wave-b-shared.spec.ts`.
- Checks: targeted unit coverage passed 5 files / 19 tests; mobile typecheck and lint passed; targeted Wave B Playwright passed 1/1 after isolating pointer-first and keyboard-focus sequences.
- Remaining: the mandatory full package/mobile matrix and final documentation/commit still need to be rerun after this follow-up; founder physical-device/screen-reader/visual acceptance remains separate.

## Final verification

- Design-tokens build: passed.
- Mobile typecheck: passed.
- Mobile lint: passed.
- Full mobile Vitest: 13 files / 58 tests passed.
- Targeted Wave B Playwright: 1 test / 1 passed (43.1s); browser evidence covers 1440/1024/390 focus-visible, reduced motion, PageState loading/empty/error, dialog long content, loading button, and compact logo hit area.
- Full mobile Playwright: 24 tests / 24 passed (1.9m), including existing auction, security/privacy, navigation, Wave A, Wave One, and Wave B coverage.
- Screenshots: 21 PNG files in `/private/tmp/bidplace-wave-b-screenshots`.
- Required command matrix: `corepack pnpm --filter @bidplace/design-tokens build`, mobile `typecheck`, mobile `lint`, mobile Vitest, mobile Playwright E2E, and `git diff --check` all passed.
- Final remaining acceptance: founder physical-device and screen-reader/visual acceptance; no Wave C work started.

### Post-Wave-B audit fixes — 2026-08-03

- Done: `ButtonContent` no longer reserves an idle icon slot for text-only buttons. It keeps an invisible content sizing layer during loading and overlays the spinner; unit coverage checks zero idle gap, icon gap and absolute loading overlay, while browser evidence checks label centering and busy width stability.
- Done: ProductDraft, ListingDraft and Order route loading branches now render `PageState` with `progressbar` and polite live-region semantics. `wave-b-route-states.spec.ts` covers all three routes with delayed API responses.
- Done: `presentEnum` accepts an explicit fallback phrase; seller/product/order status, seller type, cancellation reason and handoff groups now use grammatical unknown-value copy. Unit coverage exercises every presentation group.
- Done: the Design System token inventory now reflects `modern.ts`, the actual 4–64 spacing scale, radius names/values, sizes and typography roles.
- Changed: `Button.tsx`, `button-layout.ts`, `Button.spec.ts`, ProductDraft/ListingDraft/Order screens, `presentation.ts`/spec, `wave-b-shared.spec.ts`, `wave-b-route-states.spec.ts`, and `docs/design/03-DESIGN-SYSTEM.md`.
- Checks: targeted unit coverage passed 3 files / 17 tests; targeted Wave B browser passed 1/1 (43.9s); route-level PageState browser passed 1/1 (19.7s); full package/mobile matrix passed with 13 files / 58 Vitest tests and 24/24 Playwright tests; mobile typecheck and lint passed.
- Remaining: final static diff/worktree check and commit are pending; API/domain logic and Wave C remain unchanged.

## Open risks

- Full Playwright E2E may depend on Docker PostgreSQL and local package-manager/network state.
- Founder visual/device/accessibility acceptance remains separate from automated verification.

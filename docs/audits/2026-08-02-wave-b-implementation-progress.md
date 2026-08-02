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

Implement B4 stable card/media/detail primitives and narrow-card evidence.

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
- Not done: browser keyboard/reduced-motion evidence is part of the final E2E pass; B3–B6 remain.
- Next: stabilize button loading geometry and compact/default semantics.
- Risks: physical-device focus and accessibility acceptance remains separate.

### B3 — stable button loading geometry

- Done: default content-width buttons remain 56px/18px; compact remains 44px/14px; explicit block remains the only full-width variant.
- Done: busy buttons retain the original accessible label and visible label, use `busy` plus disabled semantics, and reserve a stable 20px icon/spinner slot.
- Changed: `Button.tsx`, `button-layout.ts`, `Button.spec.ts`.
- Checks: targeted button/token suite passed 2 files / 10 tests; mobile typecheck and lint passed.
- Not done: visual width evidence at target viewports remains part of the final E2E/screenshot pass; B4–B6 remain.
- Next: finish shared media/card/detail contracts.
- Risks: no new button hierarchy or full-width behavior was introduced.

## Open risks

- Full Playwright E2E may depend on Docker PostgreSQL and local package-manager/network state.
- Founder visual/device/accessibility acceptance remains separate from automated verification.

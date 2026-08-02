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

Inspect shared primitives and existing test/e2e patterns, then implement B1.

## Completed slices

None yet.

## Open risks

- Full Playwright E2E may depend on Docker PostgreSQL and local package-manager/network state.
- Founder visual/device/accessibility acceptance remains separate from automated verification.

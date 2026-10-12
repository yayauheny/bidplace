# UI Cleanup Phase 1 — closure status

Branch: `fix/author-onboarding-figma`  
PR: https://github.com/yayauheny/bidplace/pull/34  
Review: APPROVE WITH WARNINGS (`9ee28ef0` TextButton fix)

## Code complete

- Navigation via `FigmaButton` / semantic button `href` (no `Link` + noop in touched screens).
- [`apps/mobile/src/components/README.md`](../../../apps/mobile/src/components/README.md) component map.
- Mutually exclusive `href` | `onPress` types (`FigmaButton`, `Button.tsx`, `TextButtonProps`).

## CI (Verify workflow)

| Run | Result | Notes |
|-----|--------|--------|
| `bef3caa3` | FAIL | Mobile typecheck **pass** after `BidplaceBrand` fix; failed at `@bidplace/api` `disposable-email.spec.ts` (unrelated to Phase 1 buttons) |
| Earlier `9ee28ef0` | FAIL | Mobile `BidplaceBrand` typecheck (fixed in `bef3caa3`) |

Full `pnpm verify` locally also hits **30 baseline** mobile Vitest failures (`product-draft-*`, etc.) — not introduced by Phase 1.

## E2E

| Spec | Status |
|------|--------|
| `e2e/button-href-navigation.spec.ts` | PASS (chromium, `playwright.config.reuse.ts`, 2026-10-12) |
| `e2e/author-cabinet.spec.ts` | **BLOCKED** until disposable `bidplace_e2e` matches Prisma schema |

### Running cabinet E2E safely

1. Do **not** rely on [`playwright.config.reuse.ts`](../../../apps/mobile/playwright.config.reuse.ts) if `prepare.mjs` must run.
2. Use default [`playwright.config.ts`](../../../apps/mobile/playwright.config.ts) with ports `3001`/`8081` free.
3. Prepare only **`bidplace_e2e`** via [`e2e/prepare.mjs`](../../../apps/mobile/e2e/prepare.mjs) (includes `migrate reset` — disposable DB guards in `disposable-database.mjs`).
4. Selector: `getByRole('link', { name: 'Редактировать', exact: true })`.

## Follow-up issues

- #35 — seller-profile `PrimaryButton` + `href`
- #36 — lean cabinet E2E fixture (no auction listing)

# Wave C — implementation progress

Дата: 2026-08-03

Ветка: `feature/wave-c-screen-polish`

Базовый коммит: `ea93e84`

## Текущая задача

Довести C1–C7 screen polish и visual/accessibility evidence для bidplace без изменения API, domain, auth, moderation или bidding logic.

## Просмотренные файлы

- Обязательные product docs: `docs/product/00-PROJECT-INDEX.md`, `01-PRODUCT-FOUNDATION.md`, `05-MVP-RFC.md`, `08-SELLER-AND-ITEM-POLICY.md`, `09-TRUST-AND-AUCTION-INTEGRITY.md`, `10-CODE-ARCHITECTURE.md`, `11-PROJECT-STATUS.md`, `12-DECISION-LOG.md`.
- Обязательные design docs: `docs/design/00-DESIGN-INDEX.md`, `01-DESIGN-FOUNDATION.md`, `02-USER-FLOWS-AND-SCREENS.md`, `03-DESIGN-SYSTEM.md`, `04-DESIGN-STATUS.md`, `05-DESIGN-HANDOFF.md`.
- `docs/audits/2026-08-02-web-design-audit.md`.
- Modern UI rules and references: `docs/modern-ui/DESIGN.md`, `00-project-decisions.md`, `03-screen-rules.md`, `04-component-catalog.md`, `references/README.md`, `references/REFERENCE-AUDIT.md`.
- Relevant mobile screens/components under `apps/mobile/src/features` and `apps/mobile/src/components/modern-ui`.
- Existing E2E specs and support fixtures under `apps/mobile/e2e`.

## Принятые решения и причины

- Сохранить существующие `modernTokens`, shared shell/primitives, API contracts and domain behavior Wave A/B.
- Доводить compositions через existing primitives/layout helpers; не добавлять product CTA, tabs, API fields, statuses or business rules.
- Target evidence uses `1440×900`, `1024×900`, `390×844` and real seed/API state.
- Failed Docker/infrastructure attempts are recorded as blockers; Wave C is not called complete without full Playwright.

## C1 — каталог

Изменения: `AuctionCard` separates price from status/deadline; catalog skeleton mirrors loaded metadata rows and keeps shared 4:5 media bounds. No Catalog heading/count or publication date was added.

Files: `apps/mobile/src/components/modern-ui/AuctionCard.tsx`, `apps/mobile/src/features/products/product-list-screen.tsx`.

Checks: mobile typecheck, lint and Vitest passed (15 files / 68 tests).

## C2 — Product detail и ставки

Изменения: `AuctionPanel` is the only transactional block; the top Product block keeps the story to two lines and leaves publication date in item history, while story/provenance, bid history and item history use linear `EditorialSection`. Mobile dock remains summary + CTA; amount/errors/retry stay in the scrollable panel.

Files: `apps/mobile/src/features/products/product-screen.tsx`, `apps/mobile/src/components/modern-ui/BottomActionBar.tsx`.

Checks: mobile typecheck, lint and Vitest passed (15 files / 68 tests).

## C3 — автор и покупки

Изменения: public author identity uses public fields, 120px photo/fallback, localized seller type and a dedicated 2/3-column shared `AuctionCard` grid capped at three works per row. Purchases are divider-led rows with existing price/status/deadline and no redundant open-item line.

Files: `apps/mobile/src/features/sellers/public-seller-screen.tsx`, `apps/mobile/src/features/activity/activity-screen.tsx`.

Checks: mobile typecheck, lint and Vitest passed (15 files / 68 tests).

## C4 — seller profile, Product draft, Listing draft

Изменения: seller preview is capped at 200px with failed-media fallback; Product draft media uses 160×200 contain rows; Listing accepts human-readable `ДД.ММ.ГГГГ, ЧЧ:ММ` and prior ISO input, rejects impossible calendar/time components and preserves ISO payload serialization, upload/delete/reorder and locks.

Files: `apps/mobile/src/features/sellers/seller-profile-screen.tsx`, `product-draft-screen.tsx`, `listing-draft-screen.tsx`.

Checks: mobile typecheck, lint and Vitest passed (15 files / 68 tests).

## C5 — moderation и order

Изменения: `/admin` has two queues inside max 1180px on desktop and one column below desktop breakpoint; author remains a text action, row actions are compact, confirmations are unchanged. Order localizes existing cancellation reason and makes long values safe.

Files: `apps/mobile/src/features/admin/admin-moderation-screen.tsx`, `apps/mobile/src/features/orders/order-screen.tsx`.

Checks: mobile typecheck, lint and Vitest passed (15 files / 68 tests).

## C6 — auth, long content, all page states

Изменения: registration copy describes buyer and future seller application without promising admin access. `PageState` provides plain-language retry error copy; decorative `Skeleton` no longer creates duplicate progressbar announcements; catalog has one loading announcement without changing grid geometry.

Files: `apps/mobile/src/features/auth/auth-form.tsx`, `apps/mobile/src/components/modern-ui/PageState.tsx`, `Skeleton.tsx`, `apps/mobile/src/features/products/product-list-screen.tsx`.

Checks: mobile typecheck, lint and Vitest passed (15 files / 68 tests).

## C7 — visual/accessibility evidence

Files: `apps/mobile/e2e/wave-c-screen-acceptance.spec.ts`, `apps/mobile/e2e/support/e2e-fixtures.ts`, `docs/design/02-USER-FLOWS-AND-SCREENS.md`, `docs/design/04-DESIGN-STATUS.md`, `docs/product/11-PROJECT-STATUS.md`.

Targeted acceptance: `corepack pnpm --filter @bidplace/mobile exec playwright test wave-c-screen-acceptance.spec.ts` — 4/4 passed, 57.5s, with Docker PostgreSQL. Full repository `corepack pnpm --filter @bidplace/mobile test:e2e` — 28/28 passed, 2.6m, with Docker PostgreSQL.

Screenshot manifest: 42 PNG files in `/private/tmp/bidplace-wave-c-screenshots/1a2efcf`, with the short commit hash in every filename. The matrix covers 1440×900, 1024×900 and 390×844 for author, seller, admin, purchases, order and auth, plus catalog loaded/loading/failed-media, seeded `seedLive002` buyer/admin, keyboard focus, four-work author fixture, account menu, rail tooltip, destructive dialog and bid dialog.

## Изменённые файлы

- See C1–C7 sections above.
- Protected product/design foundations were not changed.

## Post-C7 checks

- `corepack pnpm --filter @bidplace/design-tokens build` — passed.
- `corepack pnpm --filter @bidplace/mobile typecheck` — passed.
- `corepack pnpm --filter @bidplace/mobile lint` — passed.
- `corepack pnpm --filter @bidplace/mobile exec vitest run` — 15 files / 68 tests passed.
- `corepack pnpm --filter @bidplace/mobile test:e2e` — 28/28 passed.
- `corepack pnpm --filter @bidplace/mobile build` — blocked by nested pnpm 11.10.0 vs project-pinned 11.7.0 Corepack mismatch; equivalent `corepack pnpm@11.7.0 --filter @bidplace/design-tokens build` plus `corepack pnpm@11.7.0 --filter @bidplace/mobile exec expo export` passed and exported `apps/mobile/dist`.
- `git diff --check` — passed with no trailing whitespace.

## Незакрытые риски

- Founder physical-device, screen-reader and final visual acceptance remain `Needs verification`.

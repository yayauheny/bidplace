# Test coverage audit — 2026-08-03

## 1. Итоговый вердикт

- Общий статус: **Pending audit completion**.
- P0: pending classification.
- P1: pending classification.
- P2: pending classification.
- Подтверждено: обязательные источники доступны; тестовый и screenshot-инвентарь собран.
- Нельзя принимать без завершения: API/domain, mobile unit, E2E/fixtures, visual/accessibility evidence и реальные запуски ещё не сверены целиком.

## 2. Scope и evidence

- Commit under review: `5be687c` (`feature/test-coverage-audit` создана от `feature/wave-c-screen-polish`).
- Разрешённые изменения: только новые audit-файлы в `docs/audits/`.
- Прочитаны: `AGENTS.md`, обязательные product/design owner-документы, `2026-08-02-web-design-audit.md`, `2026-08-03-wave-c-implementation-progress.md`.
- Просмотрены конфигурации: root/API/mobile/contracts/design-tokens/database `package.json`, `turbo.json`, `apps/mobile/playwright.config.ts`, `apps/mobile/AGENTS.md`.
- Screenshot directories доступны: Wave C — 66 PNG, Wave B — 21 PNG, Wave A — 7 PNG, Wave 2 — 18 PNG.
- Ограничение evidence: Wave C artifacts помечены commit `a852f68`, а commit under review — `5be687c`; до проверки diff и фактического E2E rerun они являются commit-specific historical evidence.
- Важный product conflict для трассировки: `DEC-060` оставляет local/test seeded Bid fixtures без founder decision, хотя `09-TRUST-AND-AUCTION-INTEGRITY.md` запрещает platform seed bids.

### Начальная инвентаризация

| Область | Файлы | Обнаруженные сценарии | Типы проверки | Текущий статус аудита |
|---|---:|---:|---|---|
| API unit | 33 | 114 вместе с API integration по синтаксическому подсчёту | Vitest, mocks/fakes | Body-level review complete; run pending |
| API integration | 2 | входит в 114 | Vitest + PostgreSQL | Body-level review complete; run pending |
| Mobile unit/static | 15 | 43 | Vitest, source/style/geometry contracts | Pending body-level review |
| Browser E2E | 11 | 28 top-level Playwright tests | Chromium, real API, disposable PostgreSQL, screenshots | Pending body-level review/run |
| Contracts | 2 | входит в 8 shared-package tests | Vitest/Zod contracts and seed contract | Pending body-level review |
| Design tokens | 0 package-local specs | 0 | Build only; visual token tests live in mobile | Pending verification |
| Database | 1 | входит в 8 shared-package tests | Vitest export smoke; schema/migration/seed require inspection | Pending body-level review |

## 3. Результаты реальных запусков

| Проверка | Команда | Статус | Результат | Ограничения |
|---|---|---|---|---|
| Design tokens build | `corepack pnpm --filter @bidplace/design-tokens build` | Not run | Pending | — |
| API typecheck | `corepack pnpm --filter @bidplace/api typecheck` | Not run | Pending | — |
| API unit | `corepack pnpm --filter @bidplace/api test` | Not run | Pending | — |
| Mobile typecheck | `corepack pnpm --filter @bidplace/mobile typecheck` | Not run | Pending | — |
| Mobile lint | `corepack pnpm --filter @bidplace/mobile lint` | Not run | Pending | — |
| Mobile Vitest | `corepack pnpm --filter @bidplace/mobile exec vitest run` | Not run | Pending | — |
| Mobile Playwright | `corepack pnpm --filter @bidplace/mobile test:e2e` | Not run | Pending | Requires Docker/PostgreSQL |
| Mobile build | `corepack pnpm --filter @bidplace/mobile build` | Not run | Pending | Pinned-pnpm equivalence may be needed |
| Diff whitespace | `git diff --check` | Not run | Pending | — |

## 4. Матрица функционального покрытия

| Функция / инвариант | Product owner document | Реализация | Тесты | Тип проверки | Статус | Доказательство / пробел |
|---|---|---|---|---|---|---|
| Registration/login/logout; cookie/CORS/local origin | MVP RFC §§4, 10; architecture | `auth.service.ts`, guards/controller, env policy | `auth*.spec.ts`, guard specs, env specs | Unit | **Partial** | Password hashing, duplicate identity, login, ban, session invalidation and cookie clearing are asserted. No real HTTP/browser success flow proves cookie flags, CORS headers and session round-trip together. |
| Guest/buyer/pending/approved/admin permissions | MVP RFC §§4–6; seller policy §10; DEC-058 | controller guards plus service capability checks | auth/activity/admin unit tests; `wave-one.spec.ts` | Unit + browser/API E2E | **Partial** | Admin direct Bid denial is real. Pending-seller UI hiding exists, but direct Product/Listing/media write denial is not exercised through the API. |
| Seller application and moderation statuses | Seller policy §§10, 13 | `SellersService`, admin moderation | seller/admin unit tests; `wave-one.spec.ts` | Unit + browser/API E2E | **Partial** | Status edit gates and selected moderation transitions are covered. No automated successful application submission; reason/audit persistence is incomplete across seller/product transitions. |
| Product/Listing lifecycle and public visibility | MVP RFC §§5–6; DEC-059 | product/listing services, lifecycle worker, DB constraints | service/state-machine specs; PostgreSQL integration; `auction-creation.spec.ts` | Unit + integration + browser E2E | **Partial** | Creation, validation, scheduling, duplicate active listing, public media and activation predicates are covered. No no-bid close or full lifecycle outcome matrix. |
| Media delivery and privacy | MVP RFC §§11–13; trust §§8–9 | image policy/controller/service and public selects | image specs; product/seller mapper specs; browser response and `naturalWidth` assertions | Unit + browser E2E | **Covered for audited paths** | Signature/MIME/corruption/SVG rejection, PNG bytes, anonymous private denial and browser decoding are asserted. Owner-only upload/delete/reorder authorization is not exercised as a cross-role API matrix. |
| Bid increment, stale price, idempotency, history, soft close | MVP RFC §§7, 17; trust §§4–6 | `BidsService`, pricing policy, serializable transaction | pricing/bid unit specs; PostgreSQL integration; `auction-bidding.spec.ts` | Unit + integration + browser E2E | **Partial** | Increment floor, accepted replay, concurrent first bids, close boundary and two-buyer UI flow are covered. The named stale scenario never reaches a server stale conflict; soft-close behavior has only one pure-function assertion and no persistence/browser proof. |
| No artificial bids / deterministic seed | Foundation §8; trust §3; DEC-060 | `packages/database/prisma/seed.js` directly creates two Bids and an Order | `seed-contract.test.ts` checks public-ID text only | Static contract | **Unresolved** | Seed lifecycle/integrity is untested. Literal conflict with the confirmed no-platform-seed-bids principle remains an explicit founder decision in DEC-060. |
| Order/activity privacy and role projections | MVP RFC §§9, 13–14; trust §§8–10 | `OrdersService`, activity projections | `orders.service.spec.ts`, activity specs, `auction-closing.spec.ts` | Unit + browser E2E | **Partial / critical gap** | Winner visibility, buyer contact mode, cancelled visibility and outsider read denial are asserted. Seller handoff transitions, cancellation, replacement, ranked bids and their audit records have no automated behavioral coverage. |
| Moderation reason, audit trail and active-listing locks | Seller policy §13; trust §12 | admin moderation transactions | `admin-moderation.service.spec.ts`, `wave-one.spec.ts` | Unit + API E2E | **Partial** | Active-listing locks are asserted. One Product changes-request path checks reason/audit; browser/API transitions poll status but do not prove persisted reason/audit for the full matrix. |
| Public author profile and Product navigation | MVP RFC §12 | public seller/product queries and mobile routes | public-select unit specs; author/product Playwright specs | Unit + browser E2E | **Covered with state gaps** | Public projection and navigation are exercised; visual empty/not-found evidence is reviewed separately. |

## 5. Матрица дизайна и responsive-покрытия

| Экран / состояние | 1440 | 1024 | 390 | Роли | Assertions | Screenshot evidence | Вердикт |
|---|---|---|---|---|---|---|---|
| Shell/navigation/overlays | Pending | Pending | Pending | guest/buyer/pending/approved/admin | Pending | Artifacts found | Pending visual review |
| Catalog loaded/loading/failed media | Pending | Pending | Pending | public + role variants | Pending | Artifacts found | Pending visual review |
| Product buyer/admin/keyboard/dialog | Pending | Pending | Pending | buyer/admin | Pending | Artifacts found | Pending visual review |
| Author many/zero/error | Pending | Pending | Pending | public | Pending | Artifacts found | Pending visual review |
| Purchases empty/error/long | Pending | Pending | Pending | buyer/admin absence | Pending | Artifacts found | Pending visual review |
| Seller profile/Product/Listing drafts | Pending | Pending | Pending | pending/approved/changes | Pending | Artifacts found | Pending visual review |
| Admin moderation and Order | Pending | Pending | Pending | admin/buyer/seller/outsider | Pending | Artifacts found | Pending visual review |
| Login/register/loading/error/zoom | Pending | Pending | Pending | anonymous | Pending | Artifacts found | Pending visual review |

## 6. Findings

### P0

- **[P0] Order handoff, administrative cancellation and winner replacement are not behaviorally tested.** Evidence: `apps/api/src/orders/orders.service.ts:79`, `:131`, `:174` implement seller state transitions, cancellation, ranked replacement, snapshots and audit writes, while `apps/api/src/orders/orders.service.spec.ts:26-86` only exercises `get()` privacy projections and no Playwright spec calls those mutation endpoints. Risk: unauthorized transition, lost audit event, wrong replacement winner/contact snapshot or multiple active orders can ship in the MVP's final trust-critical workflow. Acceptance: add PostgreSQL integration tests for every allowed/forbidden transition, idempotency/terminal states, cancellation audit, deterministic next-winner replacement and single-active-order constraint; add a real API/browser seller-to-handoff scenario and outsider/buyer/admin negative checks. Blocks: full production/pilot readiness and automated `bidding/order/moderation` acceptance.

### P1

- **[P1] The “scheduled listings block ... bids” E2E proves admin denial, not pre-start buyer denial.** Evidence: `apps/mobile/e2e/wave-one.spec.ts:191-224` authenticates the admin once and uses that context for both moderation calls and the Bid call. Acceptance: authenticate a buyer for the Bid request, assert the scheduled-time domain error and unchanged Bid/listing state; keep the admin-denial case separately named. Blocks: auth/roles and bidding acceptance.
- **[P1] The stale-price recovery contract is not tested.** Evidence: `apps/mobile/e2e/auction-bidding.spec.ts:51-59` reloads buyer A first, then enters the already-known current price and receives client-side minimum validation; it never submits against a stale snapshot, observes a server conflict, refetches canonical state and retries. `apps/api/src/bids/bids.service.spec.ts` has only admin/moderation denial tests. Acceptance: force a competing Bid after the first client reads, submit the stale amount, assert the documented server error, canonical cache/UI refresh and successful retry; add service/integration coverage for the transaction conflict path. Blocks: bidding acceptance.
- **[P1] Soft close is not proven outside a pure pricing helper.** Evidence: `apps/api/src/core/auction/pricing-policy.spec.ts:45` covers only the inclusive boundary/cap calculation; the PostgreSQL integration and browser suites do not assert persisted `endsAt`, outside-window behavior, repeated extension or final close after extension. Acceptance: parameterized boundary tests plus integration tests for atomic extension/no-extension/cap and a browser-visible deadline update. Blocks: bidding acceptance.
- **[P1] Pending-seller capability is not protected by an automated direct-API matrix.** Evidence: `apps/api/src/products/products.service.ts:46-56` and `apps/api/src/listings/listings.service.ts:18-35` enforce approval, but seller tests cover profile editing and the browser scenario only hides actions. Acceptance: direct API tests as guest, buyer, pending, changes-requested, suspended and approved seller for Product, Listing and image mutations, with unchanged DB assertions. Blocks: auth/roles and seller acceptance.
- **[P1] Seller application and moderation audit evidence is incomplete.** Evidence: `apps/mobile/e2e/wave-one.spec.ts:36-55` checks that the form is visible but does not submit it; `apps/api/src/admin/admin-moderation.service.spec.ts:16-91` proves an AuditEvent only for one Product changes-request path. Acceptance: create an application through the public contract, assert stored normalized fields/status, then exercise approve/changes/suspend Product and Seller transitions with required reason, actor, old/new status and persisted audit event. Blocks: seller/moderation acceptance.
- **[P1] Seed Bid fixtures are neither integrity-tested nor product-authorized.** Evidence: `packages/database/prisma/seed.js:332-356` directly inserts live/ended Bids and an Order; `packages/contracts/test/seed-contract.test.ts` validates identifiers by source text only. This is also the unresolved DEC-060 conflict with `09-TRUST-AND-AUCTION-INTEGRITY.md`. Acceptance: founder explicitly decides whether strictly local/test fixtures are permitted; then either remove them or codify the exception and add executable seed invariants for price/bidCount/winner/order/lifecycle. Blocks: seed/trust acceptance and final “Ready” verdict.

### P2

- **[P2] Auth transport policy is unit-tested but not proven through a real HTTP/browser round-trip.** Evidence: auth service, guards, controller and env helpers have focused tests, while browser authentication is bootstrapped by an API helper and does not assert production cookie attributes, allowed/disallowed Origin headers and logout invalidation end to end. Acceptance: isolated HTTP integration tests for registration/login/me/logout cookie lifecycle and CORS allow/deny behavior. Blocks: none for local UI evidence; remains release hardening debt.
- **[P2] Closing coverage omits no-bid and deterministic tie-break edge cases.** Evidence: `apps/api/src/lifecycle/listing-lifecycle.service.spec.ts:6-40` only checks the activation predicate; integration closes one auction with a clear top Bid and a close-vs-bid race. Acceptance: integration tests for expired zero-Bid listing, exact tie ordering (`amount`, `createdAt`, `id`) and rerun idempotency in each outcome. Blocks: lifecycle hardening checklist.

## 7. Что покрыто хорошо

- PostgreSQL integration tests enforce the two highest-value database uniqueness rules: one active Listing per Product and one non-cancelled Order per Listing.
- Accepted Bid idempotency is checked as a state invariant: the same Bid, one row/event and unchanged listing counters on replay.
- Concurrent first Bids and the close-vs-bid boundary execute against PostgreSQL and compare persisted canonical state rather than only mocked calls.
- Media tests validate byte signatures, claimed MIME mismatch, SVG/corrupt payload rejection, public/private delivery and actual browser decoding.
- Order read projections explicitly distinguish seller, buyer contact modes, outsider and admin visibility; realtime payload schemas reject buyer contact data.
- Auth unit coverage includes password hashing, duplicate identity, invalid/valid login, banned users, stale session versions and logout invalidation.

## 8. Test debt и порядок исправлений

Pending finding classification.

## 9. Финальный acceptance checklist

- [ ] API/domain
- [ ] auth/roles
- [ ] bidding/order/moderation
- [ ] media/seed
- [ ] responsive visual behavior
- [ ] accessibility automation
- [ ] browser E2E
- [ ] founder manual acceptance

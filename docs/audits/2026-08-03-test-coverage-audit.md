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
- Screenshot directories доступны и визуально просмотрены: Wave C — 66/66 PNG, Wave B — 21/21 PNG, Wave A — 7/7 PNG, Wave 2 — 18/18 PNG, всего 112/112.
- Ограничение evidence: Wave C artifacts помечены commit `a852f68`, а commit under review — `5be687c`. Diff `a852f68..5be687c` меняет только три status/progress документа, не source/tests, поэтому изображения соответствуют тому же коду, но до matching rerun остаются `Historical agent evidence only`.
- Важный product conflict для трассировки: `DEC-060` оставляет local/test seeded Bid fixtures без founder decision, хотя `09-TRUST-AND-AUCTION-INTEGRITY.md` запрещает platform seed bids.

### Начальная инвентаризация

| Область | Файлы | Обнаруженные сценарии | Типы проверки | Текущий статус аудита |
|---|---:|---:|---|---|
| API unit | 33 | 114 вместе с API integration по синтаксическому подсчёту | Vitest, mocks/fakes | Body-level review complete; run pending |
| API integration | 2 | входит в 114 | Vitest + PostgreSQL | Body-level review complete; run pending |
| Mobile unit/static | 15 | 43 | Vitest, pure helpers/style/geometry contracts | Body-level review complete; run pending |
| Browser E2E | 11 | 28 top-level Playwright tests | Chromium; real API + fixture-created DB state; selected mocked network states; screenshots | Body-level review complete; run pending |
| Contracts | 2 | входит в 8 shared-package tests | Vitest/Zod contracts and source-text seed contract | Body-level review complete; run pending |
| Design tokens | 0 package-local specs | 0 | Build only; visual token tests live in mobile | Body-level review complete; run pending |
| Database | 1 | входит в 8 shared-package tests | Export smoke; PostgreSQL invariants in API integration; seed source inspection | Body-level review complete; run pending |

### Классы browser evidence

| Класс | Что действительно выполняется | Примеры | Ограничение |
|---|---|---|---|
| Real workflow E2E | UI → HTTP API → NestJS → PostgreSQL | auction creation, two-buyer bidding, moderation, closing/read result | Initial users/auction time/state can be created directly by fixtures |
| Fixture-backed API/browser | Prisma fixture establishes prerequisite state, then browser/API behavior is real | seeded demo, privacy read, role navigation, Wave C route matrix | Does not prove creation/lifecycle path that the fixture bypassed |
| Mocked UI-state browser test | Browser renders a deliberately intercepted response or delayed request | Wave B catalog loading/empty/error; Wave C failed media and long activity row | Proves presentation only, not server error mapping or persistence |
| Screenshot artifact | Pixel output from a named historical run | Waves A/B/C/2 directories | Must be visually inspected; cannot replace assertions or a matching current-commit run |

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
| Shell/navigation/overlays | Asserted | Asserted | Asserted | guest/buyer/pending/approved/admin | role links, overflow, focus outline, menu/dialog focus return, z-index, hit area | 21 Wave B + relevant Wave C reviewed | **Partial:** geometry is visibly stable; desktop tooltip is hover-only; no automated accessibility tree audit |
| Catalog loaded/loading/failed media | Asserted | Asserted | Asserted | public + role variants | card count, first-row count, image decode/fallback, overflow, one progressbar | Wave 2 + Wave B + Wave C reviewed | **Partial:** responsive/media geometry is visually consistent, but 1440 assertion is suite-state-dependent and pending/approved “loaded” role captures visibly contain skeletons |
| Product buyer/admin/keyboard/dialog | Asserted | Asserted | Asserted | buyer/admin | buyer facts, admin denial, no overflow, mobile dock, focused input, dialog copy | Wave A + Wave C reviewed | **Partial:** desktop/mobile layouts and dock look coherent; keyboard is programmatic focus without visual-viewport shrink; bid dialog only 1440 |
| Author many/zero/error | Asserted | Asserted | Asserted | public | exact 2/3 columns, no overflow, empty, not-found | Wave C reviewed | **Good for represented states;** images and wrapping remain in bounds; “error” is 404, not retryable network/server error |
| Purchases empty/error/long | Mixed | Mixed | Mixed | buyer; admin absence | seeded loaded, long mocked row and overflow; empty/retry in seeded demo | Wave C reviewed | **Partial:** no overflow, but 390 long title collapses to a very narrow multi-line column beside the badge; no role/privacy matrix or Wave C loading/error artifacts |
| Seller profile/Product/Listing drafts | Smoke | Smoke | Smoke | approved seller | route title and screenshot; loading semantics in separate test | Wave C reviewed | **Weak:** visible layouts stay in bounds, but no detailed responsive/form/error/media/lock assertions; pending/changes/suspended role matrix absent |
| Admin moderation and Order | Smoke | Smoke | Smoke | admin; buyer Order only | admin labels/overflow/dialog; buyer Order title | Wave B + Wave C reviewed | **Critical Order gap:** dialogs are visibly stable; no seller/admin/outsider/cancel/replacement UI; an admin loaded capture can occur before product media settles |
| Login/register/loading/error/zoom | Smoke | Smoke | Smoke | anonymous | route labels, empty submit validation; 200% zoom scroll assertion | Wave A + Wave C reviewed | **Failed detail:** registration visibly leaks an English phone validation message; 200% screenshot itself shows only the focused form crop, not CTA reachability |

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
- **[P1] The 1440 catalog assertion cannot prove the required four-column grid.** Evidence: `apps/mobile/e2e/wave-c-screen-acceptance.spec.ts:112-120` expects `Math.min(expectedColumns, boxes.length)` and the deterministic public dataset contains only three cards, so a three-column layout also passes at 1440. Acceptance: provide at least four cards for this assertion (fixture or explicit presentation payload), expect exactly four distinct first-row columns and verify card/media width parity. Blocks: Wave C 1440 catalog acceptance.
- **[P1] The mobile keyboard state is not an actual constrained-viewport test.** Evidence: `apps/mobile/e2e/wave-c-screen-acceptance.spec.ts:246-280` calls `.focus()` at a fixed 390×844 viewport; it does not reduce `visualViewport.height`, assert CTA/input visibility after shrink, or emulate a mobile engine. Acceptance: test the supported mobile browser/device path with a reduced visual viewport or an explicit keyboard-inset harness; assert focused field, error and sticky action remain reachable without overlap. Blocks: Wave C Product mobile-keyboard acceptance.
- **[P1] Accessibility automation is selective and has no page-level semantic scanner.** Evidence: Wave B checks focus outline, modal focus containment/return, `aria-live`, 44px brand hit area and reduced-motion body style, but no test audits axe-equivalent violations, heading/landmark structure, accessible names or contrast on rendered route matrices. Acceptance: run an accessibility scanner on the critical public/auth/bid/order/admin states with documented exceptions, plus keep screen-reader and physical-device checks manual. Blocks: automated accessibility acceptance, not the explicitly manual screen-reader gate.
- **[P1] Shared PageState error evidence contains a visible alignment regression that the test accepts.** Evidence: all three `page-state-error-{1440,1024,390}.png` images center the title/message but place “Повторить” at the content's left edge. `PageState.tsx:43-60` centers children, while `button-layout.ts:26-32` gives content-width buttons `alignSelf: 'flex-start'`; Wave B asserts only text visibility and takes a screenshot. Acceptance: resolve the intended centered geometry, then assert the retry button center against the state container at all three widths and add a rendered PageState test. Blocks: shared error-state visual acceptance across every route using PageState.
- **[P1] Registration exposes untranslated validation copy and the test misses it.** Evidence: all three Wave C registration validation screenshots display `String must contain at least 1 character(s)` under “Телефон”; `apps/mobile/src/features/auth/schemas.ts:18` has `.min(1)` without Russian copy, and the E2E only asserts “Введите имя” at `wave-c-screen-acceptance.spec.ts:495-501`. Acceptance: provide canonical Russian phone validation text, unit-test it, and assert every displayed validation message in the browser. Blocks: auth localization/validation acceptance.
- **[P1] Two Wave C role-model artifacts labelled loaded visibly contain only skeletons.** Evidence: `catalog-approved-seller-loaded-role-model-390x844-a852f68.png` and `catalog-pending-seller-loaded-role-model-390x844-a852f68.png` show header plus four skeleton blocks with no Product content, while the test checks one link before capture at `wave-c-screen-acceptance.spec.ts:193-214`. Acceptance: wait for the same loaded-media/content predicate used by the main catalog, assert absence of skeleton/progress state before capture, and generate artifacts from an isolated fixture with an explicit card count. Blocks: role-specific Wave C catalog visual evidence.

### P2

- **[P2] Auth transport policy is unit-tested but not proven through a real HTTP/browser round-trip.** Evidence: auth service, guards, controller and env helpers have focused tests, while browser authentication is bootstrapped by an API helper and does not assert production cookie attributes, allowed/disallowed Origin headers and logout invalidation end to end. Acceptance: isolated HTTP integration tests for registration/login/me/logout cookie lifecycle and CORS allow/deny behavior. Blocks: none for local UI evidence; remains release hardening debt.
- **[P2] Closing coverage omits no-bid and deterministic tie-break edge cases.** Evidence: `apps/api/src/lifecycle/listing-lifecycle.service.spec.ts:6-40` only checks the activation predicate; integration closes one auction with a clear top Bid and a close-vs-bid race. Acceptance: integration tests for expired zero-Bid listing, exact tie ordering (`amount`, `createdAt`, `id`) and rerun idempotency in each outcome. Blocks: lifecycle hardening checklist.
- **[P2] Mobile Vitest does not render a React/React Native component.** Evidence: all 15 specs call pure schemas, layout/style helpers, cache predicates or token functions; `Button.spec.ts`, `page-state-contract.spec.ts`, `product-media-style.spec.ts` and `reduced-motion.spec.ts` never mount the corresponding component. Risk: prop wiring, accessible names/roles, interaction, focus transfer and actual style composition can regress while the helpers remain green. Acceptance: add focused rendered-component tests for Button loading/disabled/accessibility, PageState loading/error/retry/empty semantics, ProductMedia loaded/error geometry and the shared overlay/account-menu focus lifecycle. Blocks: component-level acceptance, but browser evidence still covers selected integrated paths.
- **[P2] Client auth validation covers login only.** Evidence: `apps/mobile/src/features/auth/schemas.spec.ts:5-20` tests invalid login email and missing password; registration field normalization, phone/password/confirmation boundaries and server-error mapping have no mobile unit contract. Acceptance: parameterized registration schema tests and one rendered submit/error-state test. Blocks: auth form hardening.
- **[P2] Reduced-motion unit evidence stops at the duration helper.** Evidence: `apps/mobile/src/lib/reduced-motion.spec.ts:5-12` checks a numeric duration selector, not mounted animated/image components. Acceptance: mount the shared motion consumer or assert its computed browser styles under `prefers-reduced-motion`, including media transition behavior. Blocks: accessibility automation checklist.
- **[P2] Desktop tooltip keyboard access is not asserted despite the screenshot state name.** Evidence: `apps/mobile/e2e/wave-c-screen-acceptance.spec.ts:513-543` uses `.hover()` for desktop and captures `focused-rail-tooltip`; keyboard focus is used only in the mobile branch. Acceptance: focus each collapsed-rail link through keyboard navigation and assert the tooltip's accessible/visible text, then verify Escape/navigation behavior as applicable. Blocks: desktop navigation accessibility hardening.
- **[P2] Wave C route screenshots are broader than their assertions.** Evidence: seller profile/Product/Listing draft and Order captures at `apps/mobile/e2e/wave-c-screen-acceptance.spec.ts:383-442` assert only route titles; admin asserts two section labels and overflow. Acceptance: add screen-specific geometry, primary-action, field/long-content, loading/empty/error and role-state assertions before treating these captures as acceptance evidence. Blocks: those individual Wave C screen checkboxes, not already-tested cross-cutting primitives.
- **[P2] Browser E2E is Chromium-only.** Evidence: `apps/mobile/playwright.config.ts` defines the Chromium project and runs one worker. Acceptance: at minimum add the supported WebKit/mobile browser target for critical catalog/auth/bid/order smoke, or explicitly scope the release contract to Chromium and retain physical-device acceptance. Blocks: cross-browser confidence.
- **[P2] Catalog layout evidence depends on accumulated suite data.** Evidence: the reviewed Wave C buyer screenshot has four-plus fixture Products although the stable seed exposes three; tests share one reset database and individual specs add records without per-test cleanup. Acceptance: make each responsive assertion own its exact dataset or reset within the spec, and prove the Wave C spec passes alone as well as in the full suite. Blocks: deterministic standalone visual acceptance.

## 7. Что покрыто хорошо

- PostgreSQL integration tests enforce the two highest-value database uniqueness rules: one active Listing per Product and one non-cancelled Order per Listing.
- Accepted Bid idempotency is checked as a state invariant: the same Bid, one row/event and unchanged listing counters on replay.
- Concurrent first Bids and the close-vs-bid boundary execute against PostgreSQL and compare persisted canonical state rather than only mocked calls.
- Media tests validate byte signatures, claimed MIME mismatch, SVG/corrupt payload rejection, public/private delivery and actual browser decoding.
- Order read projections explicitly distinguish seller, buyer contact modes, outsider and admin visibility; realtime payload schemas reject buyer contact data.
- Auth unit coverage includes password hashing, duplicate identity, invalid/valid login, banned users, stale session versions and logout invalidation.
- Mobile helper tests precisely lock bid increment math, strict local date parsing, responsive column breakpoints, 4:5 media geometry, button sizing, auth-cache boundaries and WCAG contrast/token constants.
- Visual inspection confirms coherent 4:5 media geometry, 4/3/2 responsive catalog tracks where enough cards exist, 3/3/2 author tracks, stable 520px modal behavior, no observed horizontal clipping, usable 390px bid dock and readable buyer Order/contact layout.

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

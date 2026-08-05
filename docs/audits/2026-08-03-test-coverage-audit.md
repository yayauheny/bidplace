# Test coverage audit — 2026-08-03

## 1. Итоговый вердикт

- Общий статус: **Not ready**.
- P0: 1.
- P1: 12.
- P2: 9.
- Подтверждено: все доступные static/unit/integration checks и полный 28-test Chromium suite воспроизводимо проходят на pinned `pnpm@11.7.0`; сильными доказательствами являются Bid idempotency/concurrency, основные DB uniqueness constraints, media bytes/privacy, auth service/guard behavior, public author navigation и responsive geometry представленных состояний.
- Нельзя принимать без исправления: trust-critical Order mutations не имеют behavioral automation; stale Bid и soft close не доказаны end-to-end; pending-seller direct API matrix, seller application/moderation audit matrix, deterministic four-card 1440 evidence и page-level accessibility automation отсутствуют; seed Bid fixtures остаются без founder decision по `DEC-060`.

## 2. Scope и evidence

- Commit under review: `5be687c` (`feature/test-coverage-audit` создана от `feature/wave-c-screen-polish`).
- Разрешённые изменения: только новые audit-файлы в `docs/audits/`.
- Прочитаны: `AGENTS.md`, обязательные product/design owner-документы, `2026-08-02-web-design-audit.md`, `2026-08-03-wave-c-implementation-progress.md`.
- Просмотрены конфигурации: root/API/mobile/contracts/design-tokens/database `package.json`, `turbo.json`, `apps/mobile/playwright.config.ts`, `apps/mobile/AGENTS.md`.
- Screenshot directories доступны и визуально просмотрены: Wave C — 66/66 PNG, Wave B — 21/21 PNG, Wave A — 7/7 PNG, Wave 2 — 18/18 PNG, всего 112/112.
- Историческое ограничение evidence устранено частично: исходные Wave C artifacts помечены commit `a852f68`, но полный suite повторно запущен на audit HEAD `042f599`, который отличается от commit under review только audit-документами. Свежие 66 PNG находятся в `/private/tmp/bidplace-wave-c-screenshots/042f599`; ключевые ранее найденные дефекты перепроверены визуально. Wave A/B/2 artifacts остаются historical evidence, хотя соответствующие тесты в полном suite прошли заново.
- Важный product conflict для трассировки: `DEC-060` оставляет local/test seeded Bid fixtures без founder decision, хотя `09-TRUST-AND-AUCTION-INTEGRITY.md` запрещает platform seed bids.

### Начальная инвентаризация

| Область | Файлы | Обнаруженные сценарии | Типы проверки | Текущий статус аудита |
|---|---:|---:|---|---|
| API unit | 33 | 136 | Vitest, mocks/fakes | Reviewed, classified and Passed |
| API integration | 2 | 10 | Vitest + PostgreSQL | Reviewed, classified and Passed |
| Mobile unit/static | 15 | 73 | Vitest, pure helpers/style/geometry contracts | Reviewed, classified and Passed |
| Browser E2E | 11 | 28 top-level Playwright tests | Chromium; real API + fixture-created DB state; selected mocked network states; screenshots | Reviewed, classified and Passed |
| Contracts | 2 | 7 | Vitest/Zod contracts and source-text seed contract | Reviewed, classified and Passed |
| Design tokens | 0 package-local specs | 0 | Build only; visual token tests live in mobile | Reviewed; build Passed |
| Database | 1 | 1 | Export smoke; PostgreSQL invariants in API integration; seed source inspection | Reviewed and Passed via direct Vitest invocation |

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
| Design tokens build | `corepack pnpm@11.7.0 --filter @bidplace/design-tokens build` | Passed | TypeScript build completed | Explicit version matches root `packageManager` |
| API typecheck | `corepack pnpm@11.7.0 --filter @bidplace/api typecheck` | Passed | `tsc --noEmit` | — |
| API unit | `corepack pnpm@11.7.0 --filter @bidplace/api test` | Passed | 33 files, 136 tests | Mock/unit evidence only where classified above |
| API integration | `corepack pnpm@11.7.0 --filter @bidplace/api test:integration` | Passed | 2 files, 10 tests | Required approved access to existing local PostgreSQL |
| API build | `corepack pnpm@11.7.0 --filter @bidplace/api build` | Passed | Nest build completed | Additional check |
| Contracts | `corepack pnpm@11.7.0 --filter @bidplace/contracts test` | Passed | 2 files, 7 tests | Includes source-text seed contract, not executable seed integrity |
| Database export smoke | `corepack pnpm@11.7.0 --filter @bidplace/database exec vitest run src/index.spec.ts` | Passed | 1 file, 1 test | Package has no `test` script; direct pinned Vitest invocation used |
| Mobile typecheck | `corepack pnpm@11.7.0 --filter @bidplace/mobile typecheck` | Passed | `tsc --noEmit` | — |
| Mobile lint | `corepack pnpm@11.7.0 --filter @bidplace/mobile lint` | Passed | ESLint completed with no errors | No auto-fix |
| Mobile Vitest | `corepack pnpm@11.7.0 --filter @bidplace/mobile exec vitest run` | Passed | 15 files, 73 tests | Pure/helper-level limitations remain |
| Mobile Playwright | `corepack pnpm@11.7.0 --filter @bidplace/mobile test:e2e` | Passed | 28/28, 3.0 minutes | Chromium only; disposable `bidplace_e2e`; fresh Wave C screenshots at `042f599` |
| Mobile build script | `corepack pnpm@11.7.0 --filter @bidplace/mobile build` | Failed | Stopped before export: nested `pnpm` resolved to 11.10.0 and rejected root pin 11.7.0 | Toolchain wrapper mismatch; not an application compile failure |
| Mobile build equivalent | design-tokens build above + `corepack pnpm@11.7.0 --filter @bidplace/mobile exec expo export` | Passed | Web, iOS and Android bundles exported to `apps/mobile/dist` | Equivalent avoids the nested unpinned `pnpm` call |
| Diff whitespace | `git diff --check` | Passed | No whitespace errors after final audit edits | Audit files only |

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

#### [P0] Order mutations are not behaviorally tested

- **Риск:** unauthorized transition, lost audit event, wrong replacement winner/contact snapshot or multiple active Orders can break the final handoff.
- **Evidence:** `apps/api/src/orders/orders.service.ts:79`, `:131`, `:174` implement transitions/cancellation/replacement; `orders.service.spec.ts:26-86` tests only `get()`, and no Playwright spec calls these mutations.
- **Почему текущая проверка недостаточна:** read-projection tests do not execute any trust-critical write path.
- **Минимальное исправление:** PostgreSQL integration matrix for allowed/forbidden transitions, terminal idempotency, audit, ranked replacement and single-active-order; one real seller handoff browser/API flow.
- **Acceptance criteria:** correct actor, state, snapshots, replacement winner and one append-only audit record are persisted; outsider/buyer/admin negatives leave DB unchanged.
- **Тип:** integration + E2E.

### P1

#### [P1] Scheduled-bid E2E uses the admin identity

- **Риск:** pre-start buyer Bid denial can regress while the named E2E stays green.
- **Evidence:** `apps/mobile/e2e/wave-one.spec.ts:191-224` reuses the admin session for moderation and Bid.
- **Почему текущая проверка недостаточна:** it proves admin denial, not the scheduled-time rule.
- **Минимальное исправление:** submit through a buyer session and keep admin denial separate.
- **Acceptance criteria:** scheduled domain error and unchanged Bid/listing rows.
- **Тип:** E2E/API.

#### [P1] Stale-price recovery never reaches the server

- **Риск:** a stale client can show the wrong result or fail to refetch canonical price.
- **Evidence:** `auction-bidding.spec.ts:51-59` reloads first and triggers client minimum validation; Bid service specs cover only denials.
- **Почему текущая проверка недостаточна:** no stale transaction conflict is submitted.
- **Минимальное исправление:** compete after snapshot, submit stale amount, observe rejection/refetch/retry.
- **Acceptance criteria:** no accepted stale Bid; UI shows canonical minimum and retry succeeds.
- **Тип:** integration + E2E.

#### [P1] Soft close has only pure-function evidence

- **Риск:** persisted deadline/close can disagree with pricing math.
- **Evidence:** `pricing-policy.spec.ts:45` covers calculation; integration/E2E do not assert persisted `endsAt` or repeat/cap behavior.
- **Почему текущая проверка недостаточна:** transaction atomicity and lifecycle consumption are bypassed.
- **Минимальное исправление:** boundary/cap integration matrix plus browser deadline refresh.
- **Acceptance criteria:** window/no-window/repeat/cap persist atomically and final close uses extended time.
- **Тип:** integration + E2E.

#### [P1] Pending-seller direct API permission matrix is absent

- **Риск:** hidden UI actions may remain callable directly.
- **Evidence:** `products.service.ts:46-56` and `listings.service.ts:18-35` enforce capability; browser tests only hide actions.
- **Почему текущая проверка недостаточна:** no cross-role mutation request is made.
- **Минимальное исправление:** guest/buyer/pending/changes/suspended/approved Product, Listing and image writes.
- **Acceptance criteria:** only approved succeeds; every denial leaves DB unchanged.
- **Тип:** integration/API.

#### [P1] Seller application and moderation audit matrix is incomplete

- **Риск:** application normalization, reason or actor/history can be lost.
- **Evidence:** `wave-one.spec.ts:36-55` does not submit; `admin-moderation.service.spec.ts:16-91` checks one Product changes path.
- **Почему текущая проверка недостаточна:** one transition cannot prove the status/audit matrix.
- **Минимальное исправление:** real application plus seller/product approve/changes/suspend transitions.
- **Acceptance criteria:** normalized data, required reason, actor, old/new state and one persisted audit event per transition.
- **Тип:** integration + E2E.

#### [P1] Seed Bid fixtures lack authorization and executable invariants

- **Риск:** demo data can contradict auction trust or become internally inconsistent.
- **Evidence:** `seed.js:332-356` inserts Bids/Order; `seed-contract.test.ts` checks identifiers as source text; `DEC-060` is unresolved.
- **Почему текущая проверка недостаточна:** it neither authorizes the product exception nor executes seed invariants.
- **Минимальное исправление:** founder decision, then remove or codify fixtures and test seeded price/count/winner/Order.
- **Acceptance criteria:** canonical policy and executable DB state agree.
- **Тип:** founder decision + integration.

#### [P1] 1440 catalog assertion accepts three columns

- **Риск:** required four-column geometry can regress unnoticed.
- **Evidence:** `wave-c-screen-acceptance.spec.ts:112-120` uses `Math.min(expectedColumns, boxes.length)` with three deterministic cards.
- **Почему текущая проверка недостаточна:** three cards cannot distinguish three from four tracks.
- **Минимальное исправление:** isolated four-card fixture and exact first-row assertion.
- **Acceptance criteria:** four distinct equal tracks and matching media widths at 1440.
- **Тип:** E2E/screenshot.

#### [P1] Mobile keyboard test only calls focus

- **Риск:** software keyboard can cover input/error/CTA.
- **Evidence:** `wave-c-screen-acceptance.spec.ts:246-280` keeps 390×844 and only invokes `.focus()`.
- **Почему текущая проверка недостаточна:** visual viewport never shrinks.
- **Минимальное исправление:** supported mobile device/browser or keyboard-inset harness.
- **Acceptance criteria:** focused field, error and sticky action remain reachable without overlap after shrink.
- **Тип:** E2E/device.

#### [P1] No page-level accessibility scanner

- **Риск:** landmark/name/heading/contrast violations can ship across critical routes.
- **Evidence:** Wave B checks selected focus/modal/live-region/target rules but runs no axe-equivalent route scan.
- **Почему текущая проверка недостаточна:** isolated assertions do not audit the composed accessibility tree.
- **Минимальное исправление:** scanner on public/auth/bid/order/admin states with documented exceptions.
- **Acceptance criteria:** zero unapproved serious/critical violations; manual screen-reader gate retained.
- **Тип:** accessibility E2E.

#### [P1] PageState screenshot accepts misaligned retry

- **Риск:** a shared error state is visibly inconsistent on every caller.
- **Evidence:** `page-state-error-*` centers copy but left-aligns “Повторить”; `PageState.tsx:43-60`, `button-layout.ts:26-32`; fresh review confirms it.
- **Почему текущая проверка недостаточна:** test asserts visibility only.
- **Минимальное исправление:** rendered geometry assertion after intended alignment is decided.
- **Acceptance criteria:** retry center matches state container at 1440/1024/390.
- **Тип:** component + screenshot.

#### [P1] Registration test misses untranslated phone validation

- **Риск:** Russian MVP exposes internal English validation copy.
- **Evidence:** all Wave C register screenshots, including fresh `042f599`, show `String must contain...`; `schemas.ts:18`; E2E asserts only name error.
- **Почему текущая проверка недостаточна:** it ignores other displayed errors.
- **Минимальное исправление:** schema unit assertion and browser assertion for every validation message.
- **Acceptance criteria:** canonical Russian copy for all invalid fields at all widths.
- **Тип:** unit + E2E/screenshot.

#### [P1] “Loaded” role screenshots are race-dependent

- **Риск:** acceptance artifacts can capture loading instead of the claimed state.
- **Evidence:** historical approved/pending captures are skeletons; fresh approved loaded but fresh pending remains skeleton; `wave-c-screen-acceptance.spec.ts:193-214` waits only for navigation.
- **Почему текущая проверка недостаточна:** no catalog-loaded predicate precedes capture.
- **Минимальное исправление:** wait for cards/media and absence of progress/skeleton using isolated data.
- **Acceptance criteria:** each loaded artifact has explicit card count and no loading state.
- **Тип:** E2E/screenshot.

### P2

#### [P2] Auth transport lacks real HTTP round-trip coverage

- **Риск:** cookie/CORS/logout integration can differ from unit helpers.
- **Evidence:** browser auth uses an API bootstrap helper and does not assert cookie attributes or Origin allow/deny.
- **Почему текущая проверка недостаточна:** service/guard units bypass HTTP transport.
- **Минимальное исправление:** registration/login/me/logout and CORS HTTP integration tests.
- **Acceptance criteria:** allowed origin receives correct cookie lifecycle; disallowed origin and stale session fail.
- **Тип:** integration.

#### [P2] Closing omits no-bid and tie edges

- **Риск:** empty auction or deterministic winner ordering can regress.
- **Evidence:** lifecycle unit covers activation; integration has one clear winner and one race.
- **Почему текущая проверка недостаточна:** zero-Bid and `amount/createdAt/id` tie paths are absent.
- **Минимальное исправление:** parameterized PostgreSQL close cases and rerun.
- **Acceptance criteria:** no winner for zero bids; exact deterministic winner; repeat is idempotent.
- **Тип:** integration.

#### [P2] Mobile Vitest mounts no components

- **Риск:** prop wiring, roles, focus and composed styles can break while helpers pass.
- **Evidence:** all 15 specs call schemas/helpers; Button/PageState/media/motion specs do not mount UI.
- **Почему текущая проверка недостаточна:** pure contracts bypass rendered behavior.
- **Минимальное исправление:** focused rendered Button, PageState, media and overlay/account tests.
- **Acceptance criteria:** actual roles/names/states/interactions/styles match contracts.
- **Тип:** component.

#### [P2] Client registration validation lacks unit coverage

- **Риск:** normalization and boundary copy regressions reach users.
- **Evidence:** `schemas.spec.ts:5-20` covers login only.
- **Почему текущая проверка недостаточна:** registration phone/password/confirmation paths are absent.
- **Минимальное исправление:** parameterized registration schema and rendered submit-error cases.
- **Acceptance criteria:** every boundary maps to the intended Russian message.
- **Тип:** unit + component.

#### [P2] Reduced-motion unit test covers only duration selection

- **Риск:** real media/animation consumers may ignore the preference.
- **Evidence:** `reduced-motion.spec.ts:5-12` tests a number, not mounted consumers.
- **Почему текущая проверка недостаточна:** adapter wiring is bypassed.
- **Минимальное исправление:** rendered/computed-style test under `prefers-reduced-motion`.
- **Acceptance criteria:** decorative transitions are zero while state feedback remains.
- **Тип:** component/E2E.

#### [P2] Desktop tooltip “focus” evidence uses hover

- **Риск:** keyboard users may not receive rail labels.
- **Evidence:** `wave-c-screen-acceptance.spec.ts:513-543` calls `.hover()` on desktop; focus is mobile-only.
- **Почему текущая проверка недостаточна:** hover does not prove keyboard focus.
- **Минимальное исправление:** keyboard-focus rail links and assert tooltip text/state.
- **Acceptance criteria:** each collapsed rail destination exposes its label on focus.
- **Тип:** accessibility E2E.

#### [P2] Broad route screenshots have title-only assertions

- **Риск:** seller/admin/order layouts can regress below the heading.
- **Evidence:** `wave-c-screen-acceptance.spec.ts:383-442` mostly asserts route/section titles.
- **Почему текущая проверка недостаточна:** screenshot presence is not behavioral acceptance.
- **Минимальное исправление:** screen-specific action/field/state/long-content/role assertions.
- **Acceptance criteria:** each claimed state has a user-result assertion before capture.
- **Тип:** E2E/screenshot.

#### [P2] Browser E2E is Chromium-only

- **Риск:** supported WebKit/mobile browser regressions remain invisible.
- **Evidence:** `playwright.config.ts` defines only Chromium.
- **Почему текущая проверка недостаточна:** one engine cannot establish cross-browser behavior.
- **Минимальное исправление:** WebKit/mobile smoke or explicit Chromium-only release scope.
- **Acceptance criteria:** critical catalog/auth/bid/order smoke passes on every supported engine.
- **Тип:** E2E/device.

#### [P2] Catalog evidence depends on accumulated suite data

- **Риск:** standalone visual tests can fail or pass differently by order.
- **Evidence:** stable seed has three Products; Wave C buyer evidence has records created by earlier specs in one shared reset DB.
- **Почему текущая проверка недостаточна:** test does not own its dataset.
- **Минимальное исправление:** per-spec isolated/reset exact catalog fixture.
- **Acceptance criteria:** Wave C passes alone and in full suite with identical card count/geometry.
- **Тип:** E2E fixture.

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

1. Add PostgreSQL integration and real API/browser coverage for seller handoff, terminal transitions, admin cancellation, ranked replacement, snapshots, authorization and append-only audit. This closes the only P0 and the highest-value trust boundary.
2. Close the auction-integrity P1 set: genuine stale-snapshot rejection/refetch/retry, persisted soft-close boundary/repeat/cap behavior, and a buyer-authenticated scheduled Bid denial.
3. Add direct role/capability matrices for pending/changes-requested/suspended sellers and complete seller application + reasoned moderation audit persistence.
4. Resolve `DEC-060`; then make seed execution/invariants and visual datasets deterministic, including four-card 1440 and loaded role-model evidence.
5. Add rendered component and page-level accessibility automation, then strengthen seller/admin/order/auth state assertions. Chromium cross-browser expansion and lifecycle tie/no-bid edges can follow after the trust-critical gaps.

## 9. Финальный acceptance checklist

- [ ] API/domain — static/unit/integration run passed; lifecycle and Order mutation gaps remain
- [ ] auth/roles — unit/browser run passed; direct pending-seller and HTTP cookie/CORS matrices remain
- [ ] bidding/order/moderation — P0/P1 gaps remain
- [ ] media/seed — media is strong; seed integrity and `DEC-060` remain open
- [ ] responsive visual behavior — suite passed; deterministic 1440/role evidence and known visual failures remain
- [ ] accessibility automation — shared checks exist; page-level scanner and real mobile keyboard evidence remain
- [ ] browser E2E — Chromium 28/28 passed; scenario/assertion and cross-browser gaps remain
- [ ] founder manual acceptance

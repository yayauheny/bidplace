# bidplace — журнал реализации Pen v2 UI

Последнее обновление: 2026-09-09

Ветка: `feature/figma-portfolio-ui`

## 2026-09-09 — Cover frost, dock glass, author atmosphere

Cover overlays and author atmosphere frost artwork instead of a flat fade.
Token `dist/` must be rebuilt for Expo. Gaps:
[`09-FIGMA-CUTOVER-GAPS.md`](09-FIGMA-CUTOVER-GAPS.md).

## 2026-09-09 — Figma phone cutover

Runtime switched to Figma inspect copy. Pen file untouched. Gaps:
[`09-FIGMA-CUTOVER-GAPS.md`](09-FIGMA-CUTOVER-GAPS.md).
`pnpm verify` and 390 browser check passed 2026-09-09.

## Правила журнала

- `design/pen/bidplace-web-v2.pen` неизменяем; контрольный SHA-256:
  `03798831d76992080d4edebf53c4c264f8f9754e01bbe81965083f271148d2a9`.
- Каждый завершённый этап имеет отдельный commit и пройденные проверки.
- В журнал попадают только проверенные результаты, открытые риски и следующие
  действия. Временные догадки не становятся дизайн-решениями.
- Новый UI сохраняет существующие routes, permissions, auth и auction behavior.
  Элементы без подтверждённого контракта не имитируются client-only логикой.

## Статус этапов

| Этап                              | Статус | Результат                                                                  | Фактический commit / commits                          |
| --------------------------------- | ------ | -------------------------------------------------------------------------- | ----------------------------------------------------- |
| Stage 0 — canonical baseline      | Готово | Pen v2 и protected baseline зафиксированы                                  | `f7450e4`                                             |
| Stage 1 — contracts and fixtures  | Готово | Content contracts, media metadata и seed foundation                        | `1a0a400`, `e6b6afd`, `80de66c`                       |
| Stage 2 — shared UI foundation    | Готово | Tokens, typography, icons, motion и shared primitives                      | `23e154f`                                             |
| Stage 3 — GlobalHeader/account IA | Готово | Responsive shell, account menu и role navigation                           | `23e154f`, `f0e6627`                                  |
| Stage 4 — AuctionCard/CreatorCard | Готово | Shared card anatomy, media states и responsive grids                       | `23e154f`, `d1667b5`                                  |
| Stage 5 — Browse Works/Authors    | Готово | H5vf2/N4ebBk routes, query state, facets и test density                    | `d1667b5`, `80de66c`                                  |
| Stage 6 — Product About           | Готово | Product hero, facts, related works и AuctionPlayer                         | `4936f1f`                                             |
| Stage 7 — Creation/Bids           | Готово | Creation steps/media, tabs, bids и transactional states                    | `db6f193`                                             |
| Stage 8 — Creator Profile         | Готово | Только `MqUMz` — `MVP v1`, public data boundary                            | `22ec4f8`                                             |
| Stage 9 — responsive derivation   | Готово | 1440/1024/390 behavior, overflow и runtime matrices                        | `770a406`, `9e82345`, `f0e6627`                       |
| Stage 10 — cleanup and evidence   | Готово | Route acceptance, docs, asset inventory, full E2E и canonical SHA evidence | `d730a8a`, `630cf0e`, `f0e6627`, `80de66c`, `338a2d1` |
| Cross-cutting — backend/security  | Готово | Visibility, uploads, aliases и integrity boundaries                        | `84336e9`                                             |

## Выполнено

### 2026-09-09 — Figma component masters

- Added `designTokens.figma` and `apps/mobile/src/components/figma/` from
  read-only Figma `uMo04w9bgrchWXXDgO4W62` «Компоненты»: icons, buttons, fields,
  chips, work/author covers, identity row, floating dock.
- Commerce overlay and cart/Google/AI icons remain in the registry and stay
  off First MVP callers. Pen screens were not switched. `.pen` unchanged.

### 2026-08-12 — shared image-derived atmosphere

- Added one `AmbientImageBackground` primitive at the shared `AppShell` level.
  Product passes the main public artwork URL; Creator Profile passes the public
  profile-photo URL. The primitive owns the blurred image, neutral veil, light
  lower fade, safe no-image/error surface and reduced-motion-aware fade-in.
- Removed the route-local Product blur and made the shared header matte only
  for the two ambient public screens. The atmosphere is pointer-inert and
  hidden from accessibility semantics; sharp artwork/avatar media remains in
  the owning screens.
- Runtime checks confirmed Product and Creator markers at desktop, responsive
  overflow remained bounded, and the canonical Pen checksum stayed unchanged.
  Exact Pen overlay plus founder/device acceptance remain open.

### 2026-08-12 — Creator Profile density fixtures

- Extended guarded local/test seed data with four additional public works for
  `anna-morozova`, bringing the profile fixture to eight works across LIVE,
  SCHEDULED and ENDED states. The added works reuse local thematic media and
  preserve server-owned listing state; no external runtime image URLs were
  introduced.
- Seed build/reset and the seeded browser checks passed; catalog layout
  expectations now include all twelve public demo products.

### 2026-08-12 — Product About anatomy and shared transaction surface

- `L7ytbv` runtime composition now uses the measured product canvas with a
  left title/story zone, natural-ratio artwork zone, and right facts/author/
  share zone. The extra route-local rounded hero shell was removed; the
  artwork uses API-provided dimensions with an explicit fallback for legacy
  records that have no metadata.
- `AuctionPlayer` remains the only transaction surface and accepts the measured
  404px desktop width. `ProductTabs` keeps the visible `О работе / Создание /
Торги` anatomy from `Jh9jr`; bid count is exposed only in the accessible name.
- Product detail now moves that same controlled `AuctionPlayer` from its inline
  slot into a fixed desktop viewport slot after the hero scroll threshold, and
  restores the inline slot when the user returns to the top. No duplicate bid
  mutation or transaction state is introduced.
- No bid mutation, realtime refresh, role restriction, or public/private
  contract was changed. The unsupported H5 `Тип работы` control remains
  omitted.

Проверки: Product layout `1/1` including inline→sticky→inline transition,
responsive Product breakpoints `1/1`, Wave 2 layout `1/1` across 1440/1024/390,
mobile typecheck/lint and design-tokens build. Runtime evidence:
`/private/tmp/bidplace-wave-c-screenshots/8b3d137/`;
Pen source `L7ytbv`/`X6Ksg` was read/exported without modification.

### 2026-08-12 — Product Creation and Bids direct tab compositions

- Read-only exports of `cK8kD` and `XIzHe` were reconciled with the existing
  Product route. Deep-linked `?tab=creation` and `?tab=bids` now render their
  own Pen-shaped content state while preserving URL history, role boundaries,
  and the shared `AuctionPlayer`.
- Creation uses the confirmed Product creation fields only: four ordered
  seeded process images, a 2×2 desktop media grid, and an accessible first-open
  accordion with honest missing-media fallback. No unsupported `Тип работы`,
  Utility Action, or new domain field was introduced.
- Bids keep the alias-only server contract and server response ordering; the
  first row exposes the derived `Лидер торгов` accessibility label without
  changing bid mutation or realtime ownership.

Проверки: seeded demo Creation/Bids evidence `2/2`, including four unique
process-image sources, Product composition `1/1`,
mobile typecheck/lint and design-tokens build. Runtime screenshots are written
outside the repository to `/private/tmp/bidplace-product-tab-screenshots/`.
Wave C product acceptance passed in the current full Chromium run. Pen source
`cK8kD`/`XIzHe` was read/exported without modification.

### 2026-08-12 — Creator Profile `MqUMz` only

- `MqUMz` is the sole Creator Profile target: `FINAL — Desktop Creator /
Profile / MVP v1`. The route keeps one shared public creator screen and one
  shared `AuctionCard` master; `HOXkZ` / `Editorial Refinement v1` is excluded.
- The profile hero preserves the canonical 500px centered anatomy: 120px photo,
  48px Inter name, copyable handle, only-present structured Telegram/
  Instagram/website links, and centered 680px biography. The works section
  uses the measured 64px desktop gutters, 44px state-control row, server-owned
  status counts, compact activity sort, and four-column two-row density. The
  Creator route fixture now supplies eight works so that density is exercised
  rather than represented by empty space.
- `publicSellerDetailResponseSchema` now returns `statusCounts` computed from
  public listings on the server. The client does not infer counts from a
  filtered page or hard-code Pen sample values.
- Shared `AppHeader` now matches `L9UV9` at wide desktop with 420px left and
  right zones, a 480px centered search, 28px inter-zone gaps, and the active
  `Аукционы` surface. Existing mobile/tablet navigation behavior remains.

Проверки: API Sellers unit suite `153/153`, contracts `11/11`, Creator/route
Playwright `1/1`, seeded demo `2/2`, Product/Creator targeted matrix `4/4`,
current full Chromium graph `35/35`, mobile typecheck/lint and
design-tokens/contracts/api-client builds. Runtime evidence:
`/private/tmp/bidplace-wave-c-screenshots/db6f193/`; Pen source `MqUMz`/`L9UV9`
was read/exported without modification.

### 2026-08-12 — direct Pen export reconciliation for discovery geometry

- Read-only Pencil exports of `H5vf2` and `N4ebBk` were compared with the
  current runtime screenshots at 1440/1024/390. Browse Works now follows the
  canonical order facets → title → state tabs/sort, defaults to `По активности`,
  and uses the tokenized 1360 px desktop discovery container so four cards
  resolve to the measured 322 px width.
- Browse Authors keeps the desktop sort on the right below the title and uses
  the same shared discovery width; mobile remains a vertical derived flow.
- `Тип работы` remains omitted as the documented domain blocker; no fake filter
  was introduced.

Проверки: targeted Wave 2 Playwright layout `1/1` across 1440/1024/390,
targeted Wave C catalog matrix `1/1` with an explicit `newest` fixture query,
mobile typecheck/lint, design-tokens build, visual-token test contract and
`git diff --check`. Canonical Pen was exported read-only and not modified.

### 2026-08-12 — discovery data density and confirmed H5vf2 facets

- Guarded local/test seed теперь содержит восемь публичных предметов с
  локальными тематическими PNG: у четырёх дополнительных работ разные
  авторы, цены, материалы и значения уникальности, а статусы сохраняют
  scheduled/live/ended coverage. Внешние URL и непроверенные stock-assets не
  добавлялись.
- `GET /api/products` теперь принимает `author` и `uniqueness`, возвращает
  server-computed author/uniqueness facets, а `/works` передаёт их вместе с
  подтверждёнными диапазонами цены через URL state. `Тип работы` намеренно
  исключён до появления подтверждённого поля в домене.

Проверки: contracts `11/11`, API unit `152/152`, API PostgreSQL integration
`39/39`, mobile typecheck/lint, full Chromium E2E `35/35` and E2E fence.
Canonical Pen SHA remains unchanged.

### 2026-08-12 — runtime evidence completion

- Обновлены Wave B и Wave One acceptance-сценарии под текущий IA header:
  `Аукционы`, портальный account menu и Home-specific loading/empty/error
  states. Проверки используют реальные DOM/API contracts и не меняют runtime.
- Устранён shared-E2E drift для density fixture: четыре guarded seed product
  получают свежий `publishedAt` только перед Wave C catalog assertion, поэтому
  все четыре остаются в реальном newest page после других disposable fixtures.

Проверки: полный Chromium E2E `35/35`, mobile unit `115/115`, mobile
typecheck/lint и E2E fence. Canonical Pen SHA не изменён.

### 2026-08-12 — contextual discovery header and status facet

- The shared header now follows the selected discovery surface: `/authors`
  presents `Авторы` as the selector, `Работы` as the peer link, and
  `Найти работу или автора` as the search placeholder. `/works` keeps the
  auction context and the same cross-discovery search contract.
- Browse Works now exposes a separate `Статус` toolbar menu backed by the
  existing URL `status` parameter and server-side product filter. The state
  tabs and toolbar menu share one source of truth; `Тип работы` remains omitted
  because its domain field is still unconfirmed.

Проверки: full Chromium E2E `35/35`, including the toolbar status selection
and URL assertion, Wave 2 layouts at 1440/1024/390, mobile typecheck/lint and
`git diff --check`. Canonical Pen SHA remains unchanged.

### 2026-08-12 — unique discovery fixture imagery

- The guarded local seed now assigns separate thematic PNGs to all eight public
  discovery works. The four additional listings use ceramic, lamp, textile and
  printmaking imagery instead of repeating the first four catalog fixtures.
- The fixture README records the source pages/assets and the runtime remains
  local-only after seeding; no remote image URL is introduced into production
  responses.
- The local copies are resized to a bounded 1000px edge for predictable seed
  and browser-test cost while preserving their distinct composition and aspect
  ratio.

Проверки: database build, mobile typecheck/lint, targeted Wave 2 E2E `1/1`
with eight unique main image sources at 1440/1024/390, and `git diff --check`.
Canonical Pen SHA remains unchanged.

### 2026-08-11 — deterministic visual-density fixtures

- Guarded local/test seed теперь содержит четыре публичных предмета с
  локальными PNG-изображениями: три исходных состояния (`SCHEDULED`, `LIVE`,
  `ENDED`) и четвёртая ваза в `SCHEDULED` для заполнения четырёхколоночного
  H5vf2 каталога.
- Добавлены семь одобренных creator-профилей с локальными тематическими фото;
  вместе с Анной Морозовой `/authors` получает восемь карточек для плотности
  N4ebBk. Профили без лотов намеренно не создают искусственную историю торгов.
- Источники изображений и граница использования зафиксированы в
  `packages/database/prisma/fixtures/README.md`; runtime не зависит от
  внешних URL.

Проверки: database build/seed на изолированном `bidplace_e2e`, seeded E2E
`2/2`, Wave C acceptance `4/4`, Wave 2 target-width screenshot matrix `1/1`.
Последняя матрица включает `/works` и `/authors` на 1440/1024/390, проверяет
четыре лота, восемь авторов, 4/3/2 columns, loading/failed-media/product
states и no-overflow. Loading interception использует delayed route fallback;
production behavior не меняется.

### 2026-08-10 — WP0

- Восстановлен и защищён canonical Pen v2.
- Старая Modern UI документация удалена; создан новый design-модуль `00`–`07`.
- Зафиксированы canonical nodes, reference registry, motion guidance и phased
  implementation plan.
- Создана ветка `feature/pen-v2-ui`.

Проверки: Prettier, staged diff check, SHA-256 canonical Pen.

### 2026-08-10 — WP1 + WP2

- `modernTokens` заменён единым `designTokens`; legacy token-файл удалён.
- Подключён Onest 400/500/600/700 для content UI, Inter сохранён для
  navigation; PT Mono удалён.
- Добавлены semantic surfaces, action states, Pen typography, layout и motion
  tokens, включая media 300 ms и единый easing.
- `MotionPressable` получил общие hover/press/focus/reduced-motion states.
- Desktop left rail заменён горизонтальным responsive header; role/capability
  navigation и существующие routes сохранены.
- Подключён утверждённый логотип из founder asset pack.

Проверено на 1440×900 и 390×844: горизонтального overflow нет, guest header и
active navigation сохраняют геометрию и семантику. Commit: `cdfc784`.

### 2026-08-10 — WP3

- Shared `AuctionCard` приведён к квадратной media anatomy `k5vYGf` и
  134-pixel information area.
- На hover/focus масштабируется только изображение: `1 → 1.05`, 300 ms,
  canonical easing; reduced motion отключает scale.
- Карточка показывает только подтверждённые contract values: автор, цена,
  status и deadline.
- `/` перестроен в Browse Works composition с Pen typography, max-width и
  responsive сеткой 4/3/2/1.
- Loading/error/empty/refetch states сохранены; неподдержанные search, sort и
  filters не имитируются.

Проверки: typecheck, lint, 29 unit-тестов, production Expo export, runtime
1440×900/390×844 без horizontal overflow. Commit: `861b7aa`.

### 2026-08-10 — WP5

- Product hero перестроен в Pen composition: story/author, центральная gallery
  и единый `AuctionPlayer`.
- Добавлен artwork-derived atmosphere из того же изображения с neutral veil;
  sharp artwork остаётся основным доступным media.
- Добавлены shared semantic `ProductTabs`: «О работе», «Создание», «Ставки»,
  включая arrow/Home/End keyboard navigation и tabpanel linkage.
- Bids представлены таблицей participant/bid/time без раскрытия PII.
- Creation использует только подтверждённые Product fields и не создаёт новую
  data model.
- Bid mutation, idempotency key, server minimum, first-participation confirm,
  `EmailRulesGate`, admin restriction и canonical refetch не менялись.

Проверки: typecheck, lint, 27 unit-тестов, реальный two-buyer bidding E2E и
отдельный Product composition E2E на 1440×900/390×844.

Commit: `eaa0dd8`.

### 2026-08-10 — Product completion audit

- ProductTabs переведены с route-local state на URL как единый источник:
  `?tab=creation` и `?tab=bids` поддерживают deep link и browser back; invalid
  значения безопасно возвращают About.
- Явный `aria-selected` дополняет tab/tablist/tabpanel contract.
- About получил блок реальных публичных работ того же автора. Текущий предмет
  исключается, используется существующий public seller contract и один shared
  `AuctionCardGrid`; recommendation ranking не выдумывается.

Проверки: ProductTabs unit 11/11, Product/Creator focused unit 18/18,
Product/Creator Playwright 2/2, typecheck и lint.

Commits: `113f857`, `a5af90f`.

### 2026-08-10 — WP6

- `/seller/[slug]` приведён к creator-first composition `MqUMz`: центрированный
  портрет, имя, публичные метаданные, описание и ссылка автора.
- Работы автора используют тот же shared `AuctionCard`, что и основной каталог,
  без параллельной реализации карточки.
- Сетка адаптируется 4/3/2/1, использует общие breakpoints и не создаёт
  горизонтального overflow на mobile.
- Публичный контракт не расширялся: handoff contact, buyer email и внутренние
  данные не выводятся.

Проверки: typecheck, lint, 16 focused unit-тестов и реальный public profile E2E
на 1440×900/390×844 с privacy assertions.

Commit: `0304ce7`.

### 2026-08-10 — WP7.1 Auth

- Login и registration получили единый responsive auth-shell: editorial intro
  и form surface рядом на desktop, последовательная композиция на mobile.
- Routes больше не дублируют контейнеры и размеры формы.
- `TextField` унифицирован для focus, disabled и multiline states; validation,
  redirect и auth mutations не менялись.

Проверки: typecheck, lint, 14 focused unit-тестов, существующий mobile/200% zoom
auth E2E и отдельная проверка split/stacked composition.

Commit: `af351b3`.

### 2026-08-10 — WP7.2 Seller editors

- Добавлен единый responsive `FormPageShell` и двухколоночный
  `FormPageColumns`; локальные shell-дубли удалены из seller profile, product
  draft и listing draft.
- `FormSection` получил единый warm surface, заголовок и optional description.
- Профиль продавца разделён на публичные данные, фото и приватные параметры
  передачи; privacy boundary и mutations сохранены.
- Создание предмета разделено на основную информацию, характеристики и
  логистику. Существующее поле состояния снова доступно для редактирования.
- Создание размещения разделено на выбор предмета и расписание; для пустого
  списка добавлен честный следующий шаг без client-only данных.

Проверки: typecheck, lint, 23 focused unit-теста и полная route-matrix на
1440×900/1024×900/390×844, включая horizontal overflow и empty state.

Commit: `b4f51b4`.

### 2026-08-10 — WP7.3 Supporting routes

- Purchases используют компактные warm cards, единые status chips и
  полноширинное действие заказа.
- Order panels переведены на общий `FormSection`; role-specific buyer, seller и
  admin projections, PII boundaries и status transitions не менялись.
- Moderation переведена на общий responsive shell; approve/suspend,
  request-changes, cancel/replace workflows сохранены.
- Удалены оставшиеся acceptance-ожидания legacy rail tooltip в проверенных
  сценариях горизонтального header.

Проверки: typecheck, lint, order handoff E2E, полный Wave One moderation E2E и
route-matrix на 1440×900/1024×900/390×844.

Commit: `2f6b042`.

### 2026-08-10 — WP8 Cleanup and full QA

- Runtime-компоненты перенесены из временного `components/modern-ui` в
  канонический `components/ui`; все рабочие imports обновлены.
- Подтверждено отсутствие параллельных token/component systems: приложение
  использует один `designTokens` contract и один UI component layer.
- Acceptance-сценарии синхронизированы с Pen v2 terminology, горизонтальным
  header, вкладками Product и актуальными responsive breakpoints.
- `AppDialog` получил детерминированный initial focus, focus containment и
  возврат фокуса на исходное действие; профиль автора — семантический heading.
- Canonical Pen не менялся: SHA-256 совпадает с зафиксированным baseline, diff
  отсутствует.

Проверки: typecheck, lint, 19 unit suites / 107 tests, 35 Playwright E2E,
production Expo export для web/iOS/Android, `git diff --check`, Pen SHA-256 и
Pen diff guard.

### 2026-08-10 — Backend/security and test audit

- Единый public Listing predicate теперь защищает public Bid history и
  realtime joins теми же Product/SellerProfile status gates, что и каталог.
- ProductImage перестаёт быть публичным при непубличном авторе или отсутствии
  public Listing; cache-control вычисляется по фактической публичности.
- Количество и суммарный объём изображений проверяются по всему Product внутри
  serializable-транзакции, а не только на один multipart request.
- Bidder alias стал детерминированным внутри Listing и различным между
  Listings; внутренний `userId` больше не используется как публичный suffix.
- Concurrent duplicate SellerProfile/slug возвращает предсказуемый conflict.
- Протухшая абсолютная дата permission test заменена относительной; E2E seed
  сверяет alias через публичный API, не копируя backend algorithm.

Проверки: contracts 7/7, API unit 145/145, API PostgreSQL integration 39/39,
mobile unit 113/113, полный Chromium Playwright 35/35, monorepo typecheck 7/7,
lint 2/2 и production build 7/7.

Commits: `84336e9`, `d9f0ed4`, `348ac36`.

## Текущая работа

### 2026-08-12 — Final interaction and state hardening

- Product sharing is now a real public-link action: Web Share API is preferred,
  clipboard and DOM-copy fallback are bounded to the current product URL, and
  success/error copy is exposed to the user. Product E2E covers the action.
- Discovery facet menus and Creator sorting close on Escape, outside pointer
  interaction and accessibility escape; Creator status controls now expose one
  semantic tablist/tabpanel relationship.
- The multi-viewport discovery acceptance timeout is aligned with its complete
  1440/1024/390 loading, empty, error, menu, account and screenshot matrix.
- Product About now renders the target's separate accordion rows and public
  author panel while retaining the existing public-field boundary.
- Creator Profile now omits legacy `socialLink` from the social-icon row and
  relies only on structured public social fields.

Checks: mobile typecheck, lint, E2E fence, production Expo export, Product E2E
1/1, interaction smoke 1/1 and full Chromium E2E 36/36. Canonical Pen remains
unchanged.

### 2026-08-11 — Pen v2 responsive and runtime gate corrections

- Creator status filters now use one wrapping responsive row, keeping all
  three states available at 390px without horizontal document overflow.
- Product mobile keeps the canonical sticky action and renders the existing
  shared bid form in the reading flow, so the action can submit a validated
  amount instead of targeting a hidden input.
- E2E support accepts isolated API/Web/DB endpoints while retaining the
  original defaults; this enabled disposable runtime checks without touching
  user processes on ports 3001/8081.
- Targeted Product/Creator smoke, responsive matrix, catalog acceptance and
  bid-confirmation acceptance passed. The full Wave C visual/route acceptance
  matrix now passes 4/4 on 1440/1024/390, including catalog media states,
  Product buyer/admin boundaries, author/seller/purchases/order/auth/admin
  routes and transactional bid confirmation.
- The isolated functional Pen v2 acceptance subset passed 16/16: seeded demo,
  two-buyer bidding, closing/privacy, auction creation, stale-bid integrity,
  navigation and safe media fallback.

Checks: mobile unit 115/115, typecheck, lint, Expo web/iOS/Android export,
Product/Creator E2E 2/2, responsive matrix 3/3 and product/bid Wave C checks.

### Release acceptance

- founder visual review по canonical Pen и реальным данным;
- smoke check на физических iOS/Android устройствах;
- отдельные продуктовые решения для заблокированных новых routes/contracts.

## Заблокировано решениями продукта

- отдельный Home route и конечный route для Works;
- Authors directory и list API;
- серверные search/sort/filter contracts;
- источник данных для Home Top/New;
- отдельная Creation model;
- несколько публичных social links автора.

Эти пункты не блокируют общую foundation, shared components, текущий каталог,
product detail и существующий public seller route.

## Следующая контрольная точка

Провести founder/device acceptance и принимать Home/Authors/search/filter/sort
только после утверждения их contracts.

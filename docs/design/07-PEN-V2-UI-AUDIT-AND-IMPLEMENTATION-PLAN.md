# bidplace — аудит Pen v2 и план реализации UI

Последнее обновление: 2026-08-10

Статус: **Audit ready; canonical Pen verified; baseline commit and WP0 acceptance required**

Scope: документация и будущий refactor публичного web UI; код не изменён

## 1. Цель

Перенести проработанное направление из `design/pen/bidplace-web-v2.pen` в
production UI через единую документацию и shared system, сохранив существующие
product contracts. Pen остаётся неизменяемым эталоном; все адаптации происходят
в коде и документации.

## 2. Критерии успеха будущей реализации

- canonical Pen присутствует, читается и не имеет diff до/после работ;
- exact tokens и anatomy извлечены из canonical nodes;
- GlobalHeader, AuctionCard, CreatorCard, AuctionPlayer и ProductTabs имеют по
  одному production master;
- все утверждённые публичные screens совпадают с Pen на 1440 и имеют
  согласованное поведение на 1024/390;
- существующие auction, auth, roles, privacy, moderation и media behaviors не
  регрессировали;
- элементы без route/API/data contract не имитируют рабочее поведение;
- required states, accessibility, tests и runtime screenshots подтверждены;
- old visual system, compatibility layer и route-local duplicates не остаются
  источниками решений.

## 3. Аудит источников

### Проверено в repository

- Expo Router уже имеет `/`, `/product/[publicId]`, `/seller/[slug]`,
  `/me/activity`, `/order/[publicId]`, seller routes, `/admin`, `/login` и
  `/register`.
- Desktop shell использует 72 px left rail, что структурно конфликтует с
  horizontal GlobalHeader.
- `/` сейчас является каталогом; отдельные Home и Authors directory отсутствуют.
- Product list contract поддерживает page/limit, но не заявленные Pen search,
  sort и state filters.
- Public seller contract не предоставляет directory list и имеет один
  `socialLink`, а не три независимых social fields.
- Bid history совместима с колонками participant, bid и time.
- Dedicated creation-process model не подтверждена.
- Production UI содержит работающие auth, auction, role, privacy, moderation и
  error flows, которые визуальный refactor обязан сохранить.

### Проверено в canonical design source

- Founder-provided local source восстановлен byte-for-byte в
  `design/pen/bidplace-web-v2.pen`.
- Canonical SHA-256:
  `bdb29835e0fc9c431deaf632992362a291fd6b6922a8e858553aea3822bd9b76`.
- Canvas открыт и прочитан через Pen read-only; canonical screen/component roots
  существуют, HTML-export выполнен без mutation.
- Public read-only публикация подтверждена:
  [pen.dev — bidplace-web-v2.pen](https://app.pen.dev/s/r32fdudQVyiuEZ5htTMYdcv40WDQ4v3vwLT82lS27uk).
- Локальный asset pack содержит 24 файла; 23 generated images уже совпадали с
  repository, недостающий `logo-transparent-tight.png` восстановлен с SHA-256
  `3b5032d840da6713e1e7b167bd10787d236e06e069506d413f86494a58470b6b`.
- Из canonical export подтверждены Onest/Inter, нейтральная палитра, header,
  controls, card geometry/type metrics и перечисленные node IDs.

### Осталось проверить в WP0

- exact clustering всех повторяющихся spacing/radius/type values в semantic
  tokens;
- master/instance integrity для всех variants и interaction-state nodes;
- approved 1024/390 derivations, которых нет как полный canonical набор;
- runtime files/licenses/weights/Cyrillic/fallback metrics для Onest и Inter;
- fixed-scale screenshot fixtures для последующего pixel comparison.

Старый `bidplace-web.pen` и `target-solution` не используются как замена.

## 4. Canonical node registry

### Shared Global Header

| Element            | Node     |
| ------------------ | -------- |
| GlobalHeader       | `L9UV9`  |
| DiscoveryGroup     | `SYE9r`  |
| Search             | `VKsEM`  |
| UserActionsGroup   | `AG6gK`  |
| SearchBar          | `Uulvx`  |
| HeaderNav          | `BF8Nr`  |
| NavDropdownTrigger | `MsOKe`  |
| NavDropdownMenu    | `SHHWu`  |
| AuctionsMenuItem   | `B0EaXH` |
| AuthorsMenuItem    | `VUDwA`  |
| HeaderActions      | `hLoyZ`  |
| Guest frame        | `H4bCnh` |
| Buyer frame        | `GEnsG`  |
| Seller frame       | `S5B4C2` |
| Admin frame        | `kilAz`  |
| Foundation board   | `rk42w`  |
| Comparison board   | `i3LRGG` |

### Home

Root `BJd1P`, reference size 1440×3702.

| Element                   | Node     |
| ------------------------- | -------- |
| Global Header             | `CV9fF`  |
| Main / Works in bidplace  | `t0SBW8` |
| HomeSection               | `mGtKx`  |
| HomeAuctionCard / Default | `WxEOg`  |
| CreatorCard               | `b8iVxg` |
| HomeWorkCard / Editorial  | `b60Eaa` |

Route и data selection не определены; не придумывать.

### Browse Works

Root `H5vf2`, reference size 1440×940, текущий route `/`.

| Element            | Node     |
| ------------------ | -------- |
| Header             | `WT8GE`  |
| Title area         | `MO2OC`  |
| Toolbar            | `Evfb1`  |
| Grid               | `nWd4G`  |
| AuctionCard master | `k5vYGf` |
| Card artwork       | `frTbO`  |
| Card info          | `jKYlO`  |
| Primary tabs       | `Jefsy`  |
| Auction tabs       | `g7INs`  |
| State chip         | `yFl4g`  |
| Sort               | `s2ARGu` |

Card reference size 322×456. Сохранить текущие filters/states/pagination/API
contracts; неподдержанное поведение не изобретать.

### Browse Authors

Root `N4ebBk`, reference size 1440×1280.

| Element                  | Node     |
| ------------------------ | -------- |
| Header                   | `FnXJy`  |
| Works/Authors navigation | `LuxiL`  |
| Title area               | `wiPHC`  |
| Controls                 | `usLfn`  |
| Grid                     | `O8lu9`  |
| CreatorCard master       | `SrXPq`  |
| Photo                    | `k9hN07` |
| Name                     | `atoev`  |
| Discipline               | `sUQFf`  |
| Bio alternative          | `S1BHg`  |
| Comparison board         | `BvSRz`  |

Card reference size 322×383. Production использует base variant, без
ratings/sales/followers/verified/awards/metrics.

### Product

| State    | Root     | Size      | Internal nodes             |
| -------- | -------- | --------- | -------------------------- |
| About    | `L7ytbv` | 1440×2203 | `iSDm7`, `TrdWx`, `QSHsB`  |
| Creation | `cK8kD`  | 1440×1360 | `a6wx43`, `kuP8Q`, `i1AJd` |
| Bids     | `XIzHe`  | 1440×620  | `BNobs`, `Ko0lA`, `BOdiT`  |

Route: `/product/[publicId]`.

Shared AuctionPlayer `X6Ksg`: bid `w8O9kE`, time `k7l1d`, action `xozqk`.
Shared ProductTabs `Jh9jr`: About `CBb5S`, Creation `bzabH`, Bids `ryIwP`,
underline `KSVlN`. Interaction board: `eawjW`.

Bids table содержит только participant/bid/time. Никаких NFT, wallet или
blockchain concepts.

### Creator Profile

Root `MqUMz`, reference size 1440×1740, route `/seller/[slug]`.

Header `P7BDB`, hero `aAJ8B`, works `NFpuI`; works reuse `k5vYGf`. Это public
author page, не seller dashboard.

### Excluded nodes

`Y3bpD`, `UZ9NO`, `LOJhS`, `QO4xa`, `OjWd2`, `z5Mx1`, старые catalog variants,
`tZAjG`, `jaebg` и `S1BHg` не являются final implementation source.

## 5. CURRENT → TARGET gaps

| Area               | Current                   | Target                          | Classification               |
| ------------------ | ------------------------- | ------------------------------- | ---------------------------- |
| Shell              | left rail + account row   | horizontal GlobalHeader         | visual/architecture refactor |
| Home               | отсутствует               | long editorial landing          | IA/data decision             |
| Works              | `/`, existing catalog     | 4-column discovery              | visual + contract gaps       |
| Authors            | detail route only         | directory grid                  | route/API decision           |
| Search/sort/filter | отсутствуют               | controls visible in Pen         | API/product decision         |
| AuctionCard        | 4:5 media/current styling | 322 square media/light catalog  | shared visual refactor       |
| Product            | current detail layout     | integrated hero/tabs/player     | shared + route refactor      |
| Creation           | current value content     | staged process story            | data/content decision        |
| Bids               | existing history          | compact table                   | compatible visual refactor   |
| Creator            | basic public profile      | creator-first editorial profile | visual + public-link gap     |
| Responsive         | current shell rules       | no verified v2 mobile frames    | design gate                  |

## 6. Решения и конфликты

Новая founder direction пересматривает визуальную часть прежних Modern UI
решений, включая white-canvas/icon-rail target. Она не пересматривает их
product boundaries: не добавляет Search, filters, Settings, saved items, new
fields или API автоматически.

До кода нужны решения:

1. Home получает отдельный route или заменяет `/`?
2. Какой route получает Works, если `/` становится Home?
3. Нужен ли Authors directory в MVP и какой list contract его питает?
4. Какие из search/sort/state controls реально входят в scope?
5. Откуда берутся Home Top/New и ordering?
6. Какая model питает Creation story?
7. Расширяется ли public seller contract для нескольких social links?
8. Как наследуют новую систему routes без текущих Pen targets?

Отсутствие решения не блокирует foundation/shared-component работу, если
компонент можно реализовать на существующих contracts. Оно блокирует
соответствующий route или control.

## 7. Выбранная стратегия

**Выбран только durable fix:** единый Pen-led design module, один слой tokens,
shared primitives/components и миграция screens по dependency order. Working
product behavior сохраняется до проверенного atomic cutover соответствующей
поверхности.

**Workaround и hack не допускаются:** нельзя оставлять hybrid shell как
финальное решение, патчить route-local CSS, дублировать компоненты или tokens,
использовать magic values вместо измерений Pen, подменять API fake/client-only
логикой, ослаблять типы, скрывать ошибки fallback-ами или менять Pen ради
совпадения с кодом. Если durable implementation требует решения по route/data,
соответствующий scope остаётся `Blocked`.

## 8. Этапы реализации

### Phase 0 — restore and freeze design source

- [done] вернуть canonical v2 file по ожидаемому path без изменения байтов;
- [done] зафиксировать checksum и защитное правило;
- [done] прочитать canonical tree/measurements и экспортировать nodes read-only;
- [remaining] принять восстановленный `.pen` и документы одним baseline commit;
- [remaining] завершить semantic token clustering и instance audit;
- [remaining] экспортировать fixed-scale acceptance frames;
- сопоставить assets и responsive gaps;
- получить решения из раздела 6 или явно выделить blocked scope.

Выход: committed protected baseline, verified handoff pack, exact token table,
approved scope. После baseline commit `.pen` diff всегда должен быть пустым.

### Phase 1 — foundation and GlobalHeader

- извлечь common typography/colors/spacing/radii/layout;
- обновить один code token layer и shared primitives;
- реализовать `L9UV9` с guest/buyer/seller/admin states;
- сохранить capability-derived navigation и все existing routes;
- обеспечить keyboard menu/search semantics и mobile composition.

Выход: shared foundation + header visual tests, без Pen diff.

### Phase 2 — AuctionCard and Browse Works

- реализовать `k5vYGf` на текущем Product/List contract;
- покрыть image/loading/error/status/deadline states;
- реализовать clipped artwork `scale(1 → 1.05)` hover/focus behavior, darkened
  action states и reduced-motion без layout shift;
- собрать `H5vf2` на существующем `/` и pagination;
- оставить неподдержанные controls blocked/disabled согласно решению;
- проверить 4/3/1-column responsive grids.

Выход: reference discovery screen и reusable card.

### Phase 3 — CreatorCard and Browse Authors

- реализовать `SrXPq` без fake metrics;
- добавить directory route/API только после отдельного решения;
- проверить public-only data, photo states и navigation.

Выход: Authors screen либо честно зафиксированный blocked status.

### Phase 4 — AuctionPlayer and ProductTabs

- собрать единый `X6Ksg` поверх существующей bid state machine;
- сохранить validation, confirmation, OTP/rules, idempotency, stale refetch,
  realtime и ended results;
- реализовать accessible `Jh9jr` и URL/back contract;
- проверить inline/sticky placements без duplicated state.

Выход: transaction primitives с unit/E2E evidence.

### Phase 5 — Product states

- About `L7ytbv`;
- добавить bounded artwork-derived blur/veil atmosphere там, где она поддержана
  canonical composition и reference specification;
- Creation `cK8kD` только на подтверждённых данных;
- Bids `XIzHe` с semantic table и privacy-safe aliases;
- related works используют `k5vYGf` и реальные public data.

Выход: единый Product route с тремя проверенными states.

### Phase 6 — Creator Profile

- перенести `MqUMz` на public seller contract;
- не показывать private handoff contact;
- ограничить links текущим contract или реализовать отдельно утверждённое
  расширение;
- переиспользовать AuctionCard.

Выход: creator-first public page, не dashboard.

### Phase 7 — Home

- начинать только после route/data decisions;
- реализовать `BJd1P` секциями из реальных queries;
- не вычислять Top/New из неполной client page;
- reuse shared cards и header.

Выход: согласованный entry experience без конкурирующих route contracts.

### Phase 8 — remaining routes and cutover

- распространить foundation/header на auth, Activity, Order, seller/admin
  routes по отдельным handoff rules;
- удалить code tokens/components, ставшие unused только из-за этой миграции;
- выполнить полный affected graph, E2E, cross-browser/device и accessibility QA;
- провести founder/designer visual acceptance.

Выход: одна production design system и нулевой `.pen` diff.

## 9. Проверка по этапам

Минимум для каждого phase:

- typecheck affected workspaces;
- lint без auto-fix;
- unit tests на state/layout helpers;
- integration/E2E при route, permission, API или auction interaction;
- screenshots 1440/1024/390;
- keyboard, focus, zoom, screen-reader semantics, reduced motion;
- loading/empty/error/missing media/long content;
- `git diff --check`;
- `git diff --name-only -- '*.pen'` возвращает пустой результат.

## 10. Риски

- Случайное пересохранение canonical Pen разрушит checksum и блокирует handoff.
- Header cutover влияет на все roles/routes и легко создаёт navigation
  regression.
- Pen содержит concepts шире текущего API; fake implementation разрушит
  честность интерфейса.
- Desktop-only fidelity может породить неподдерживаемый mobile layout.
- Product page объединяет visual и transaction state; duplicated player state
  опасен для ставок.
- Mock creator/social content может раскрыть или выдумать данные.

## 11. Definition of ready

UI implementation может начаться, когда restored source принят как repository
baseline, canonical checksum зафиксирован,
WP0 nodes/assets/font mapping завершён, responsive handoff согласован и каждый unresolved
concept либо имеет decision/contract, либо явно исключён из phase scope.

До этого разрешены только repository audit, documentation, contract mapping и
подготовка test strategy. Редактирование любого `.pen` не разрешено.

## 12. Engineering quality contract

Этот раздел обязателен для implementation-агента и имеет силу acceptance gate.

### Единственная разрешённая архитектура

1. **Pen measurement layer** — read-only таблица точных значений и node IDs.
2. **Один token package** — `packages/design-tokens`; второй набор tokens
   запрещён.
3. **Shared primitives** — typography, controls, surfaces, focus, media и page
   states без route knowledge.
4. **Shared domain UI** — GlobalHeader, AuctionCard, CreatorCard,
   AuctionPlayer, ProductTabs.
5. **Thin screens** — только data fetching, state selection и composition.
6. **Server contracts** — единственный источник business state.

Зависимость идёт только сверху вниз: screen не определяет новый global token,
card не реализует auction rules, а route не копирует shared component.

### Запрещённые решения

- `any`, `@ts-ignore`, отключение lint или suppress-only attributes;
- hardcoded repeated colors, spacing, radii, fonts и breakpoints;
- отдельные desktop/mobile implementations, если различается только layout;
- копии `AuctionCard`, `AuctionPlayer`, tabs или header по routes;
- component props, названные по конкретному экрану вместо устойчивой роли;
- giant universal component с десятками boolean flags;
- fake controls, dead links, fake metrics, placeholder success и silent errors;
- client-side approximation server filtering/pagination по неполному page;
- изменение API/domain behavior внутри visual refactor;
- импорт из внутренних файлов package в обход public exports;
- новый dependency без доказанной необходимости и сравнения с текущим stack;
- оставленный compatibility layer после завершения cutover;
- snapshot/visual tests, которые обновлены без анализа реального diff;
- правка `.pen` любого вида.

### Требуемые качества решения

- semantic naming по роли, а не внешнему виду;
- composition вместо копирования и условных монолитов;
- controlled variants только для подтверждённых Pen states;
- data mapping вынесен из presentational anatomy;
- stable public component API и package exports;
- минимальный coherent diff без unrelated refactor;
- state ownership в одном месте, особенно для AuctionPlayer;
- accessible behavior встроен в component contract;
- удаляется только legacy code, реально ставший unused после миграции;
- каждый deliberate visual difference документирован и согласован.

## 13. Documentation build contract

Аудит уже разложен по owner-документам. Перед кодом агент обязан сверить, что
они не расходятся с этим master plan:

| Owner document                 | Что извлечь/обновлять                  | Запрещённое дублирование   |
| ------------------------------ | -------------------------------------- | -------------------------- |
| `00-DESIGN-INDEX.md`           | hierarchy, read order, retired sources | screen details             |
| `01-DESIGN-FOUNDATION.md`      | protected visual principles            | exact token values         |
| `02-USER-FLOWS-AND-SCREENS.md` | route/role/state contracts             | component CSS              |
| `03-DESIGN-SYSTEM.md`          | exact tokens and component contracts   | product rules              |
| `04-DESIGN-STATUS.md`          | evidence-based current state           | plans as implemented facts |
| `05-DESIGN-HANDOFF.md`         | Pen → code → QA workflow               | duplicated product specs   |
| `06-ASSET-INVENTORY.md`        | source, rights, runtime mapping        | random reference gallery   |
| этот `07`                      | audit, dependencies, execution plan    | historical narrative       |

При расхождении правится владелец утверждения и в остальных файлах остаётся
короткая ссылка. Documentation is complete только когда новый агент может
найти source, decision, code owner, state и acceptance evidence без догадок.

## 14. Component reuse and code ownership map

| Target             | Canonical Pen              | Primary current code                                                                     | Durable implementation owner             |
| ------------------ | -------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------- |
| Visual tokens      | measured styles            | `packages/design-tokens/src/modern.ts`                                                   | существующий token package               |
| App shell          | `L9UV9`                    | `components/layout/AppShell.tsx`                                                         | shared layout composition                |
| GlobalHeader       | `L9UV9`                    | `components/layout/AppHeader.tsx`, `AccountMenu.tsx`, `BrandLogo.tsx`, `OverlayHost.tsx` | один role-aware header                   |
| AuctionCard        | `k5vYGf`                   | `components/modern-ui/AuctionCard.tsx`, `auction-card-layout.ts`                         | один public work-card component          |
| Browse Works       | `H5vf2`                    | `features/products/product-list-screen.tsx`, `catalog-layout.ts`                         | thin catalog screen                      |
| CreatorCard        | `SrXPq`                    | нового production master нет                                                             | новый shared component рядом с public UI |
| Browse Authors     | `N4ebBk`                   | route/list contract отсутствуют                                                          | blocked до IA/API decision               |
| AuctionPlayer      | `X6Ksg`                    | `components/modern-ui/AuctionPanel.tsx`, Product bid state                               | один controlled transaction component    |
| ProductTabs        | `Jh9jr`                    | current Product composition                                                              | один accessible tabs component           |
| Product screens    | `L7ytbv`, `cK8kD`, `XIzHe` | `features/products/product-screen.tsx`, `ProductGallery.tsx`, `EditorialSection.tsx`     | thin route composition                   |
| Realtime/bid rules | visual states only         | `lib/use-listing-realtime.ts`, `features/products/bid-validation.ts`                     | сохраняются без visual duplication       |
| Creator Profile    | `MqUMz`                    | `features/sellers/public-seller-screen.tsx`, `author-layout.ts`                          | public profile composition               |
| Page states/media  | Pen state frames           | `PageState.tsx`, `ResilientRemoteImage.tsx`, `ImagePlaceholder.tsx`, `Skeleton.tsx`      | reused shared states                     |

Новые файлы создаются только когда существующий owner действительно не может
нести устойчивую ответственность. Нельзя переименовывать весь runtime слой до
того, как migration доказала новую boundary.

## 15. Work packages for the implementation agent

Каждый package выполняется отдельным reviewable шагом. Следующий package не
маскирует failing checks предыдущего.

### WP0 — source verification and measurement

**Вход:** восстановленный canonical Pen.

**Работа:** checksum, `Get(node, depth: 4)`, exports, token/anatomy table,
asset mapping, desktop/tablet/mobile decisions.

**Уже выполнено:** source restored, checksum/publication/canonical roots verified,
read-only export сделан, logo asset reconciled, reference/motion rules записаны.

**Осталось:** baseline commit, semantic token clustering, instance audit,
fixed-scale exports, font/runtime proof и founder-approved 1024/390 compositions.

**Не менять:** code и Pen.

**Выход:** exact specification added to `03`, screen handoffs in `05`, no open
visual guesswork for WP1–WP2.

### WP1 — tokens and primitives

**Files:** `packages/design-tokens`, font loading/theme provider, shared text,
button, surface, focus and layout primitives.

**Acceptance:** every repeated Pen value maps to a semantic token; no second
theme; existing routes still render; contrast/focus/touch rules pass.

### WP2 — GlobalHeader

**Files:** `AppShell`, `AppHeader`, `AccountMenu`, `BrandLogo`, overlay geometry
and focused tests.

**Acceptance:** exact desktop `L9UV9`; verified 1024/390 adaptation; Guest,
Buyer, Seller, Admin navigation retains current capabilities; keyboard and
focus return pass; no inaccessible route.

### WP3 — AuctionCard and Browse Works

**Files:** AuctionCard/layout tests, catalog layout and list screen.

**Acceptance:** exact `k5vYGf` and `H5vf2`; one card implementation; real
contract fields; loading/error/media/long title; pagination preserved;
unsupported controls do not pretend to work.

### WP4 — CreatorCard and Authors

**Files:** new shared CreatorCard; route/client/contracts/API only after explicit
decision.

**Acceptance:** exact `SrXPq`; no metrics; public data only; screen remains
blocked rather than using mock authors when list contract is absent.

### WP5 — AuctionPlayer and ProductTabs

**Files:** controlled shared components plus existing bid validation/realtime
integration.

**Acceptance:** exact `X6Ksg`/`Jh9jr`; one auction state owner; all scheduled,
live, gated, submitting, stale, accepted and ended paths; semantic tabs;
existing bid E2E remains green.

### WP6 — Product About, Creation and Bids

**Files:** Product route composition, gallery/editorial blocks and history
presentation.

**Acceptance:** exact canonical roots; real data only; Creation omissions are
explicit if model is absent; bid table exposes only alias/amount/time; related
works reuse AuctionCard.

### WP7 — Creator Profile

**Files:** public seller screen and layout tests.

**Acceptance:** exact `MqUMz`; not a dashboard; private contact absent; links
limited to contract; works reuse AuctionCard.

### WP8 — Home and remaining routes

**Gate:** approved IA/data contracts and inheritance rules.

**Acceptance:** exact `BJd1P` with real queries; no incomplete-page rankings;
all existing routes use the shared foundation without a hybrid final system.

### WP9 — cutover and cleanup

**Work:** full checks, screenshot comparison, device/accessibility acceptance,
remove only now-unused legacy pieces, update statuses.

**Acceptance:** one production design system, no compatibility bridge, no
route-local copies, no `.pen` diff and founder/designer approval.

## 16. Pixel-accurate verification protocol

«Точь в точь» означает проверяемое соответствие, а не субъективное впечатление.

1. Export canonical frame at fixed scale and capture runtime at identical
   viewport, DPR, font load state and content fixture.
2. Compare overlay/difference image for page axes, component bounds, spacing,
   type metrics, radii, borders, colors, cropping and sticky positions.
3. Classify every mismatch as implementation defect, platform rendering
   variance, missing asset, responsive decision or approved deliberate
   difference.
4. Исправлять дефект в самом высоком shared owner: token → primitive → domain
   component → screen.
5. Не «компенсировать» один mismatch противоположным magic offset в другом
   месте.
6. Repeat for 1440, 1024 and 390 plus long content and critical states.
7. Store final evidence with route, role, fixture, viewport, commit and Pen node.

Числовой допуск не выдумывается до проверки renderer. Any visible systematic
shift, wrong font metric, grid drift, incorrect crop or broken hierarchy fails
acceptance even if отдельные координаты близки.

## 17. Ready-to-run agent brief

Следующий текст можно передать implementation-агенту после закрытия WP0:

```text
Implement the bidplace Pen v2 UI strictly from the repository owner documents.

Read AGENTS.md, docs/product/00, 01, 05, 08, 09, 10, 11, relevant decisions,
then docs/design/00–07 and design/pen/README.md. Treat
design/pen/bidplace-web-v2.pen as immutable and read-only. Never edit, delete,
rename, move, replace, format, or resave any .pen file. Verify zero .pen diff
before every handoff.

Use the work packages, reference hierarchy, motion contract and canonical node
IDs in docs/design/07. Implement only
durable solutions: one token layer, shared primitives, one master per shared
component, thin screens, server-authoritative behavior. Do not use route-local
visual patches, duplicated components/tokens, magic repeated values, fake data
or controls, client-only API approximations, type/lint suppressions, silent
fallbacks, hybrid final shells, or speculative dependencies.

Before editing each package, report CURRENT → TARGET, candidate solutions and
choose the durable fix. If Pen requires an unsupported route, field, API or
behavior, mark only that scope Blocked and request the owner decision; do not
guess and do not change Pen.

Implement in order WP0–WP9. For every completed package run affected typecheck,
lint, unit/integration/E2E checks; capture 1440/1024/390 runtime screenshots;
compare them to the canonical Pen frames; verify required roles, loading,
empty, error, media, long-content, keyboard, focus, zoom and reduced-motion
states. Update design status and project status with exact evidence. Do not call
the result Implemented until all acceptance gates pass.
```

## 18. Final completion report

Implementation считается принятой только с отчётом:

```text
Canonical Pen checksum before/after:
Work packages completed:
Tokens changed:
Shared components created/changed:
Screens migrated:
Routes/contracts changed under separate decisions:
Blocked Pen concepts:
Removed legacy code and why it became unused:
Checks and exact results:
Screenshot evidence 1440/1024/390:
Accessibility evidence:
Deliberate differences approved by:
Remaining risks:
.pen diff: none
Founder/designer acceptance:
```

Без заполненного отчёта, green checks и visual evidence работа остаётся
`Needs verification`.

## 19. Reference audit and usage boundary

### Priority

1. Canonical Pen owns exact static visual decisions.
2. Founder-provided screenshots and archives own approved interaction intent
   where static Pen is insufficient.
3. Live-site observation may validate a specific behavior; it never overrides
   Pen or product contracts.
4. Existing code owns working behavior/security, not the new visual language.

### External references verified 2026-08-10

- [Avant Arte artists](https://avantarte.com/artists/1): live card media zoom
  verified as `scale(1.05)`, 300 ms,
  `cubic-bezier(0, 0, 0.2, 1)`, with clipped media viewport.
- [Gamma](https://gamma.io/): current live imagery uses restrained short opacity
  transitions; founder archive remains useful, but its cards/positioning are
  partly historical.
- [Foundation](https://foundation.app/): live product was offline during audit;
  supplied screenshots and local July 2023 archive are the approved reference.

### Founder-provided 29 screenshot set

| Images  | Reference content                              | What to implement/document                                                    |
| ------- | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `1–3`   | Gamma product card default/hover/button crop   | image-only zoom, stable card, darker/translucent pill states                  |
| `4–6`   | filter/sort controls and open menu             | pill geometry, caret/open state, menu rhythm and focus model                  |
| `7`     | wallet modal                                   | modal surface/close/density only; no wallet semantics                         |
| `8–15`  | Gamma artwork/product/profile/grid             | atmosphere blur, hero hierarchy, tabs, related cards, toast, creator identity |
| `16–19` | Foundation auction/browse/product/editorial    | media-first auction hierarchy and restrained navigation                       |
| `20–22` | Avant Arte works/artist hero/grid              | artwork framing, whitespace and creator presentation                          |
| `23–25` | Gamma collection/filter/creator layouts        | hero atmosphere, filters and four-column catalog rhythm                       |
| `26–29` | Foundation dark cards/editions/profile/related | high-contrast card footer, pill CTA and artwork-derived blurred background    |

### Local archive index

Do not scan all 541 images for every task. Use the selected ranges in
`06-ASSET-INVENTORY.md`. Key authentication/transaction references are:

- Foundation `1–6`: connect and sign-message sequence; use only multi-step modal,
  loading, error and focus patterns.
- Foundation `29–31`: bid modal progression; preserve bidplace server authority.
- Gamma `1`: wallet chooser geometry only.
- Gamma `20–28`: eligibility/review/QR transaction progression; use feedback
  structure only.
- Foundation `23`, `62`, `75`, `92`: related-work blur, profile overlay,
  editions grid and dark auction cards respectively.

Wallet, NFT, mint, crypto currency, blockchain, followers, sales and verified
badges are explicitly out of scope unless a separate product decision creates a
real bidplace contract.

## 20. Motion, blur and interaction acceptance

The exact reusable specification lives in `03-DESIGN-SYSTEM.md`. This audit
adds the implementation gates:

- AuctionCard outer geometry and grid stay pixel-stable while artwork scales
  from 1 to 1.05 inside clipped media over 300 ms.
- Primary/secondary buttons have explicit default, hover, focus-visible,
  pressed, disabled and loading states. Hover darkens/increases contrast;
  pressed feedback is faster; label contrast never drops.
- Menus/filter/sort use shared opacity/4 px translate/caret rotation tokens,
  keyboard navigation, Escape/outside close and focus return.
- ProductTabs have semantic keyboard behavior and shared underline/content
  transitions.
- Product/creator atmosphere duplicates the same artwork as a decorative,
  enlarged, bounded 40–80 px blur under a contrast veil; sharp source media
  remains the focal layer.
- Toast and AuctionPlayer never cover each other; inline→sticky keeps one
  countdown, one mutation owner and current focus.
- Reduced motion removes scale/translation/parallax and keeps information,
  state changes and auction feedback immediate.
- Captures are required for default, hover, focus-visible, pressed/open, sticky
  and reduced-motion at 1440/1024/390. A static default screenshot does not pass.

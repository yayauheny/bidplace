# bidplace — план реализации Figma-компонентов

Последнее обновление: 2026-09-11
Статус: **Historical component inventory; remaining execution uses the 2026-09-12 handoff pack**

Актуальные узкие задачи и правила визуальной приёмки:
[figma finish](../tasks/2026-09-12-figma-finish/00-INDEX.md).
Старые checkbox ниже не являются доказательством отсутствующего компонента: сначала
проверять текущий код и последние записи в design/product status.

## 1. Цель и граница

Этот план отделяет реализацию общих React Native / Expo-компонентов от сборки
экранов. Компонентный workstream владеет точной геометрией, состояниями,
эффектами, accessibility и тестами. Экранный workstream получает готовые
компоненты и отвечает только за порядок секций, route/data wiring и responsive
composition.

Визуальный источник — read-only Figma и локальный snapshot
`design/figma-handoff/portfolio-phone-v1`. Product behavior задаёт
`docs/product/05-MVP-RFC.md`. Snapshot не является runtime asset pipeline.

Не входят в текущую реализацию:

- search overlay;
- auction/bid/buy/sold/archive chrome;
- create-work shipping, buyer contact, sale status и process media;
- OAuth и passwordless email code;
- 1024/1440 отдельные композиции: wide window сохраняет центрированную колонку
  390 px.

## 2. Контракт между компонентами и экранами

Компоненты:

- не импортируют API clients и не выполняют queries/mutations;
- получают типизированные данные и callbacks через props;
- владеют своими visual/interaction states и не требуют route-local CSS;
- используют только `packages/design-tokens` и один production master на роль;
- не показывают скрытые commerce-поля по умолчанию;
- имеют loading, disabled, error, empty/missing-media и long-content поведение,
  когда оно относится к роли компонента;
- учитывают 44×44 touch target, focus, screen reader, keyboard, safe area и
  reduced motion.

Экранные compositions:

- владеют загрузкой данных, permissions, URL и переходами;
- передают только server-authoritative значения;
- выбирают порядок секций и списков, но не переопределяют внутреннюю геометрию
  компонентов;
- не копируют blur, card overlay, tab, field, button или sheet styles локально.

## 3. Порядок реализации

Каждый пакет завершается отдельным коммитом и обновляет статус ниже. Перед
следующим пакетом обязательны mobile typecheck, lint без autofix, затронутые
unit tests и Expo Web build/acceptance, если менялся runtime UI. iOS/Android
native не являются release target и отдельно не проверяются.

### C0 — handoff integrity и scope

Статус: **Complete**

- [x] Сверить 95 source captures с Downloads.
- [x] Проверить 79 node IDs, 79 `nodes.json` SHA, 172 package rasters и 732
  checksums.
- [x] Отделить полностью POST_MVP captures от MVP packages с отдельными
  скрытыми слоями.
- [x] Зафиксировать snapshot и этот план отдельным коммитом.

### C1 — tokens, icons и базовые controls

Статус: **Partial; C1a–C1c exact controls and coherent page feedback complete**

Источники: `292:5044`, `292:5058`, `297:5598`.

Целевые masters:

- `FigmaIcon` + semantic icon registry;
- `FigmaIconButton` для круговых/прозрачных icon actions;
- `FigmaButton` для black / outline / ghost / gray и всех interaction states;
- `FigmaTextField` для empty / hover / filled / focus / error / success /
  disabled, включая multiline и trailing action;
- `FigmaChip` как неинтерактивный tag; отдельный `FigmaChoiceChip` только для
  реального filter/tab action.

Работа:

- [x] Сверить 16 button states, 8 field states и 23 captured icon variants с
  `nodes.json`; сохранить 18 px glyph, 1.13/1.25 px stroke, 44 px button и
  52 px field geometry.
- [x] Добавить общий 36 px `FigmaIconButton` с 44 px hit target без постоянной
  белой подложки.
- [x] Исправить gradient outline, 26 px icon frame, left/right icon placement,
  multiline alignment, error offset и uncontrolled field state.
- [ ] Сопоставить каждое повторяющееся значение из `nodes.json` с единственным
  semantic token; не переносить одноразовые frame coordinates в tokens.
- [ ] Убрать route-local имитации icon buttons и social circles.
- [x] Зафиксировать public props и чистые style/state helpers unit-тестами для
  C1a masters.
- [x] Реализовать отдельный 38 px `FigmaChoiceChip` по creator works node
  `621:19943`, включая selected/hover/pressed/disabled states.
- [x] Свести recoverable screen failure к одному route-owned `PageState` с
  центрированным retry; protected routes используют тот же master.
- [ ] Не регистрировать POST_MVP icon как действие на MVP screen.

### C2 — glass, blur и media surfaces

Статус: **Partial; C2a–C2e primitives complete; web dock stacking corrected**

Источники: dock `Frame 34`, creator `621:19475`, work/author cover nodes,
overlay `526:13880`.

Целевые masters:

- `FigmaGlassSurface` — общая fill/stroke/background-blur оболочка;
- `FloatingDock` — один 232×64 capsule (logo / search / plus / profile);
  split search FAB и 5-icon cart pill не production;
- `CoverFrost` — реальный frosted artwork overlay;
- `AuthorAtmosphere` — 485×485 duplicate avatar, opacity 0.5, blur 40,
  scrim и корректный crop;
- `OverlayDimmer` — `#2A2A2A` 50% veil;
- `ImagePlaceholder` — точный vector/missing-media state из `874:5454`.

Работа:

- [x] Выделить общую surface anatomy как два явных preset (`navigation` и
  `controlGroup`) без giant boolean props.
- [x] Зафиксировать точный `#2A2A2A` 50% modal dimmer без дополнительной
  container opacity.
- [x] Проверить web background sampling: один sharp artwork и живой
  `backdrop-filter`, без второй CSS-filtered копии.
- [x] Зафиксировать native branch только как compatibility fallback; physical
  iOS/Android acceptance вне продуктового scope.
- [x] Ограничить `AuthorAtmosphere` captured box 485×485 и исключить duplicate
  avatar + fallback descendants из accessibility tree.
- [x] Ограничить dock press 80 мс без fill/shadow и сохранить pill-shaped
  keyboard focus без квадратной подсветки вокруг иконки.
- [x] Вынести web dock glass в `FigmaGlassSurface`: пустой backdrop-слой с
  `blur(6px)`, stroke и иконки раздельно; один capsule без search FAB.
- [x] Ограничить большие blur layers и исключить их из accessibility tree.
- [x] Добавить missing/error fallback из vector node `874:5454` без подмены
  artwork или растрового upscale.

### C3 — cover cards и identity

Источники: work cards `874:5458`, `5473`, `5487`, `5512`, `5526`, `5616`,
`5631`, `5659`, `5671`, `5685`; author cards `874:5540`, `5564`, `5576`;
identity `874:5591`.

Целевые masters:

- `WorkCoverCard`;
- `AuthorCoverCard`;
- `AuthorIdentity`.

Работа:

- [ ] Реализовать measured 264×352 anatomy и full-width 366×488 consumer
  without stretch drift.
- [ ] Сохранить dynamic images; Figma rasters использовать только как QA input.
- [ ] Portfolio mode показывает title/author/facts; commerce slots остаются
  типизированными, но не рендерятся без явной будущей capability.
- [ ] Исправить compact `AuthorIdentity`: source row 348×84 использует 84 px
  avatar; текущий master использует общий 112 px profile avatar.
- [ ] Проверить long title/name/slug, zero tags и failed media.

### C4 — discovery controls

Источники: `874:5434`, filters `526:12980`, `526:13009`, `526:13065`,
`526:13142`, `584:17554`.

Целевые masters:

- `FilterSortBar`;
- `FilterTrigger` / `SortTrigger`;
- `FilterSheet`;
- `FilterOptionRow` (single/multi select);
- `FilterSearchField`;
- `ResultsCountAction`.

Работа:

- [ ] Компоненты отражают category/material и direction/city contracts, но не
  выполняют filtering сами.
- [ ] Selected state передаётся снаружи; apply/reset callbacks явные.
- [ ] Bottom sheet использует существующий native dependency только после
  проверки web behavior и focus/dismiss contract.
- [ ] Не реализовывать catalog auction/buy/archive segment tabs.

### C5 — creator profile components

Status 2026-09-12: creator header/about/socials and shared web ShareSheet are
implemented; compact scrolled header and full visual acceptance remain open.
ShareSheet now serves Author and Work, uses validated paths, PNG and HTTP copy.

Источники: creator about/works/default/scrolled packages, share sheet
`526:13756`, achievements `742:20510`.

Целевые masters:

- `CreatorHero` (sharp avatar + `AuthorAtmosphere`);
- `CreatorSocialActions`;
- `CreatorProfileTabs` (`Работы`, `Об авторе`);
- `CreatorAboutSections`;
- `AchievementsTimeline`;
- `ShareSheet` + `ShareQr` + copy/download actions;
- `CompactCreatorHeader` for the captured scrolled state.

Работа:

- [ ] Social actions рендерятся только для present public URLs; public email и
  private handoff никогда не попадают в props.
- [ ] Timeline принимает image and text-only records and degrades to a readable
  phone list/carousel without treating 1471 px as a breakpoint.
- [ ] QR encodes canonical server `sharePath`; screenshot placeholder is not a
  QR implementation.
- [ ] Share sheet owns dimmer, focus trap/dismiss, close, clipboard status and
  download state; screen owns only open/close and canonical URL.

### C6 — public Work components

Источники: `745:21209`, `745:20634`, `621:19311`, share `597:18787`.

Целевые masters:

- `WorkGallery`;
- `WorkIdentityBlock`;
- `WorkContentTabs` (`История` optional, `Детали` required);
- `WorkStory`;
- `WorkFactsList`;
- `PaymentDeliveryStub`;
- `RelatedWorksSection` composition primitive;
- shared `ShareSheet` from C5.

Работа:

- [ ] Не переносить price, timer, sold/archive badge, bid history or cart.
- [ ] Figma underline inconsistency `745:21209` не копировать; semantic active
  tab определяется текущим panel state.
- [ ] Gallery сохраняет aspect/crop, ordering и missing-media states.
- [ ] Facts list скрывает отсутствующие optional values without empty rows.

### C7 — form и wizard components

Источники: MVP apply/auth/create-work packages с `KEEP_FIRST_MVP`.

Целевые masters:

- `FormStepHeader` / `WizardProgress`;
- `PhotoPickerField` / `WorkMediaPicker`;
- `FieldGroup`, `TextareaField`, `DateOrYearField`, `DimensionsField`;
- `TaxonomyPicker`;
- `DraftExitDialog`;
- `ReviewSummary` как contract-derived component без выдуманной Figma
  геометрии.

Работа:

- [ ] Application socials optional; создание без соцсетей не блокируется.
- [ ] Private handoff остаётся отдельным private field group.
- [ ] Work flow: images/title → details → optional plain text story → review.
- [ ] Не использовать shipping, buyer-contact, sale status или process media
  POST_MVP captures.
- [ ] Для отсутствующих review/verify/reset кадров использовать existing product
  behavior и базовые masters; не объявлять pixel-perfect parity.

### C8 — component acceptance и handoff экранному workstream

- [ ] Один barrel export из `components/figma`; wrappers в `components/ui` не
  создают вторые визуальные masters.
- [ ] Public prop contracts и usage snippets задокументированы рядом с кодом
  только там, где без них нельзя безопасно собрать screen.
- [ ] Unit coverage для state/visibility/accessibility contracts.
- [ ] Matched 390 px screenshots после первой реальной screen composition.
- [ ] Browser smoke для blur, sheet, keyboard, screen reader и phone safe area.
- [ ] В diff нет `.pen`; Figma capture source files не импортируются в runtime.

## 4. Стартовое состояние production masters

| Роль | Состояние на 2026-09-10 |
|---|---|
| FloatingDock | corrected web stacking; 4-item capsule, no FAB |
| FigmaIcon / Button / TextField / Chip | partial; dedicated captures now available |
| CoverFrost / AuthorAtmosphere | web contract verified; matched browser-image QA remains |
| WorkCoverCard / AuthorCoverCard | partial; content helpers tested, visual matrix incomplete |
| AuthorIdentity | partial and currently unused; compact geometry mismatch |
| FilterSortBar / exact filter sheet | missing |
| Exact image placeholder | missing |
| Creator hero/tabs/socials/timeline | route-local or missing |
| Share sheet / QR | missing |
| Work tabs/story/facts/payment stub components | route-local |
| Form/wizard visual masters | mixed historical wrappers; requires reconciliation |

## 5. Open inputs and stop conditions

Do not guess and stop only the affected component when one of these is required:

1. create-work review screen exact visual parity;
2. dedicated private-handoff Figma frame;
3. phone verify-email / forgot-reset frames;
4. payment/delivery tab frame beyond the RFC stub;
5. licensed Geist files;
6. explicit founder decision to enable optional `Открытие недели`;
7. API contract for live search overlay.

## 6. Resume protocol

Use `docs/tasks/2026-09-12-figma-finish/00-INDEX.md` for the active task order.
Before resuming, inspect current code and the latest status entries; historical
checkboxes below are not an instruction to recreate existing components.
Update design/product status after each bounded task and keep POST_MVP excluded.


### 2026-09-12 — Work masters delivered

WorkGallery, FigmaTabs and WorkFactsList are now used by ProductScreen.
390px real-data composition and keyboard tabs checked; the full multi-image,
responsive and state visual matrix remains Partial. Shared ShareSheet is already
used by work and author; saved PNG acceptance remains Needs verification.

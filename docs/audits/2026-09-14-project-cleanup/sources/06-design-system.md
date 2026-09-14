# Аудит дизайн-системы bidplace

**HEAD:** `70c5fd52ed306143d62b8352edd45d61943388b9` (`70c5fd5`, `docs: accept mobile discovery launch`)  
**Ветка основного checkout:** `fix/work-final`, dirty working tree (~41 файлов) — **не трогал**.  
**Проверки:** изолированный worktree `/private/tmp/bidplace-ds-audit` (clean, тот же SHA) + уже поднятый изолированный Expo `http://localhost:8095` на том же SHA. Исходники, lockfile, Pen/Figma, Git не менялись.

**Критерии успеха аудита:** действующий visual reference; карта ролей; все существенные подтверждённые дефекты с file:line; план унификации без универсальных «комбайнов»; визуальные утверждения с рендера; явные расхождения документов.

**Действующий reference для проверяемых экранов (390, portfolio MVP):**
1. Продукт/контракт — `05-MVP-RFC.md`, `DEC-082`–`DEC-089`.
2. Production visual — read-only Figma inspect `uMo04w9bgrchWXXDgO4W62` (`DEC-085`); origin `NM63j9lwRMqpo2HvAiYNll`.
3. Локальный archive — `design/figma-handoff/portfolio-phone-v1/` (не live Figma).
4. `design/pen/bidplace-web-v2.pen` — защищённый **historical** файл, не runtime.
5. Код — факт реализации, не новый visual target.

Это **противоречит** `AGENTS.md` и защищённому `01-DESIGN-FOUNDATION.md` (там всё ещё канон Pen). Ниже это отдельная находка, не молчаливый выбор удобной версии.

**Рендер, который выполнялся:** Home `/`, Login `/login`, Works `/works` + FilterSheet, Work `/product/seedSvet001` + ShareSheet, Author `/seller/svetlana-gromova` при viewport 390×860; DOM/CSS measurements; изолированная HTML-фикстура фокус-цветов на `:8765`.

---

## Карта ролей

| UI-роль | Production master | Потребители | Дубли / мёртвый слой | Tokens | Проблема | Действие |
|---|---|---|---|---|---|---|
| Semantic tokens | `packages/design-tokens` `designTokens` (= `figmaTokens`) | figma + ui + screens | CSS `--bidplace-focus`; magic hex/rgba; commerce aliases | `tokens.ts` | Два focus; aliases; leftovers | Один слой; вычистить неиспользуемое |
| Phone shell | `AppShell` + `FloatingDock` | public screens, `AuthViewport`, `FormPageShell` | `AppHeader` / `MobileHeader` / menus — **не на render path** | `layout.phoneWidth` 390 | Мёртвый Pen-header | Удалить header-дерево |
| Button | `FigmaButton` | wrappers + screens | `Primary/Secondary/Text` — тонкие алиасы; `DestructiveButton` = solid; `button-layout.ts` мёртв | `size.button*`, `color.solid*` | Destructive без danger | Починить/убрать Destructive; удалить `button-layout` |
| Field | `FigmaTextField` ← `TextField` | auth, owner forms | hint-обёртка в `TextField` | `size.input` 52, `radius.field` 18 | OK как alias | Оставить alias |
| Chip (static) | `FigmaChip` / `.web` | covers, work, identity | web gradient vs native flat | `chip*`, `figmaChipGradientStroke` (вне tokens) | Документированный split | Не объединять; градиент — в tokens |
| Chip (choice) | `FigmaChoiceChip` | author category | `SelectableRow` = outline buttons | `choiceChip` | Owner forms не на master | Перевести apply/handoff на choice/option |
| Icon | `FigmaIcon` (Hugeicons) | figma, dock, share, socials | `AppIcon` (lucide), Instagram=Camera | `size.icon` 18, `stroke.*` | Две системы | Один registry |
| Icon button | `FigmaIconButton` | gallery, share, wrappers | close 26px + hitSlop; AppDialog 32×32 lucide | `iconButton` 36 | Два close | Sheet close → FigmaIcon |
| Glass | `FigmaGlassSurface` + `.web` + `global.css` | dock, share, socials, gallery | `AmbientImageBackground` мёртв | `glass*`, `blur.dock` | NativeWind почти пустой | Оставить glass; снять NativeWind после проверки |
| Cover card | `WorkCoverCard` / `AuthorCoverCard` | home, catalogs, author, related | `CreatorCard` = data adapter | `cover*`, frost | Commerce overlay уже нет | Оставить adapter; поправить stale docs |
| Image missing | `FigmaImagePlaceholder` ← `ImagePlaceholder` | `ResilientRemoteImage` | `ProductGallery` не используется как UI | `ratio.productPortrait` | Мёртвый gallery | Удалить `ProductGallery` |
| Work gallery | `WorkGallery` | public Work | `ProductGallery` stacked | `workGallery` | OK | Оставить |
| Tabs | `FigmaTabs.web` | Work, Author | native `FigmaTabs` беднее (нет arrows/divider/panelId) | `profileTab` | Web — acceptance | Native не трогать / не считать master |
| Filter/sort | `FilterSortBar` + `FilterSheet*` | Works/Authors | `FilterMenu` мёртв | `filter*` | Два overlay API | Удалить `FilterMenu` |
| Full-height sheet | `FilterSheet` (`Modal` + trap) | catalogs | — | dimmer token | Отдельный от AppDialog | Не сливать с dialog |
| Share sheet | `ShareSheet` → **`AppDialog` sheet** | Work, Author | Pen chrome: shadow, 32px X, lucide | `shareQr` 164, `shareSheet` 20 | Не Figma-master листа | Вынести share chrome из AppDialog |
| Centered dialog | `AppDialog` `@rn-primitives/dialog` | admin, product-draft | magic 600px title 38/40 | `layer.modal` 50 | Pen leftovers | Оставить только admin/confirm |
| Page state | `PageState` | public + protected | `Skeleton` мёртв; `CatalogCardSkeleton` отдельный | `minHeight` 220 magic | Скелетон каталога локальный | OK; `Skeleton` удалить |
| Form heading | `PageHeader` / `AuthCard` / `WizardProgress` / `FormSection` | auth, owner, admin | 4 heading composition | `screenTitle` vs `sectionTitle` | Разный ритм | Не сливать в один boolean-компонент |
| Empty/error | `PageState` | catalogs, search, work | — | — | OK | Оставить |
| Typography | `AppText` + token roles | везде | Onest грузится, не красится | Inter_* | Лишняя загрузка Onest/700 | Убрать неиспользуемые faces |
| Overlay portal | `OverlayHost` | **обёрнут вокруг всего AppShell** | потребители — только мёртвый header | `layer.popover` | Инфра без потребителей | Снять с public path |
| Motion | `MotionPressable` | controls, cards | — | `motion.*` | OK | Оставить |

---

## Подтверждённые находки

### DS-01 — Источник правды визуала расходится  
**Приоритет:** высокий · **Уверенность:** подтверждено · **Принадлежность:** до MVP (документы/агенты) · **Размер:** S

**Где:**  
`AGENTS.md:145` «canonical visual reference» = Pen;  
`docs/design/01-DESIGN-FOUNDATION.md:8-10`, `:84-86` — Pen «единственный источник точной композиции»;  
`docs/design/05-DESIGN-HANDOFF.md:25-26` — «Canonical source: `design/pen/bidplace-web-v2.pen`»;  
`docs/design/06-ASSET-INVENTORY.md:9-11` — Pen = canonical visual design;  
против `docs/product/12-DECISION-LOG.md:1696-1714` (`DEC-085`), `docs/design/00-DESIGN-INDEX.md:19-34`, `docs/design/03-DESIGN-SYSTEM.md:65-80`, `docs/product/10-CODE-ARCHITECTURE.md:48-50`.

**Проблема:** агент/разработчик по `AGENTS.md` / foundation будет мерить Onest, 1440 header и Pen anatomy. Runtime и founder scope — Figma phone 390, Inter, dock, без Pen `AppHeader`.

**Сценарий:** новая UI-задача «по канону» правит не тот source или воскрешает desktop header.

**Доказательство:** тексты выше; рендер Home/Works/Author на 8095: колонка `contentWidth=390`, `hasAppHeader=false`, `headerCount=0`, dock `data-testid=figma-floating-dock`.

**Durable fix:** привести `AGENTS.md`, `03` (убрать/закрыть historical Pen как текущую архитектуру), `05`, `06`, `09` к `DEC-085`. `01-DESIGN-FOUNDATION` — protected: отдельное решение основателя/дизайнера.

**Альтернатива:** оставить как есть — высокий риск повторных Pen-правок.  
**Удалить:** historical Pen measurements из «текущего» чтения `03` (не файл `.pen`).  
**Риск:** низкий, если не трогать Pen-файл.  
**Проверка:** grep «canonical» / Onest-as-runtime; ни одного `.pen` в diff.

**Контраргумент:** `03` уже помечает хвост как historical. Недостаточно: `AGENTS.md` и `01` всё ещё приказывают читать Pen как текущий target.

---

### DS-02 — Два focus-цвета  
**Приоритет:** высокий · **Уверенность:** подтверждено · **До MVP** · **Размер:** S

**Где:** `apps/mobile/global.css:6` `--bidplace-focus: #2457e6`; `:21-29` outline для `a/button/input/:focus-visible`;  
`packages/design-tokens/src/tokens.ts:37` `focus: '#004DFF'`;  
`apps/mobile/src/components/figma/figma-text-field-style.ts:77-78` focus border = `figmaTokens.color.focus`.

**Проблема:** keyboard outline (если сработает CSS) — `#2457e6`; Figma field focus — `#004DFF` (handoff filters/fields). Это не один semantic token.

**Сценарий:** Tab по native `<a>/<button>` vs focus `FigmaTextField` — разные синие.

**Доказательство:** на 8095 `getPropertyValue('--bidplace-focus') === '#2457e6'`. Фикстура `:8765`: swatch `#2457e6` (`rgb(36,87,230)`) ≠ `#004DFF` (`rgb(0,77,255)`). Figma handoff `292:5044` / `526:13065` фиксирует `#004DFF`.

**Durable fix:** `--bidplace-focus` из `designTokens.color.focus` (build-time или один CSS var = token). Не заводить третий цвет.

**Альтернатива:** оставить CSS как «web a11y» — тогда token `focus` врёт.  
**Удалить:** хардкод `#2457e6`.  
**Риск:** низкий визуальный сдвиг outline.  
**Проверка:** focus field + link на `/login` при 390; contrast test уже есть в `visual-token.spec.ts:43-46`.

**Контраргумент:** RN `Pressable` часто не рисует CSS outline (на login `Tab` ушёл в `BODY`, input `outline: none`). Значит баг частично «спит», но два источника всё равно ломают систему и любой будущий native `<button>`/`<a>` (dock/tabs web).

---

### DS-03 — Мёртвый Pen-header всё ещё в дереве  
**Приоритет:** высокий (поддержка) · **Уверенность:** подтверждено · **До MVP как удаление** · **Размер:** M

**Где:**  
`apps/mobile/src/components/layout/index.ts:1` `AppHeader`; `:6` `FilterMenu`;  
`AppHeader.tsx:35-41` — при `breakpoint.mobileHeader === 99999` (`tokens.ts:447-456`) **всегда** `MobileHeader`;  
потребители `AppHeader` / `FilterMenu` / `DiscoveryMenu` / `AccountMenu` / `HeaderSearch` / `MobileNavigationMenu` — только друг друга.

**Проблема:** ~15 файлов + specs для desktop/mobile header, который **не монтируется**. Public path: `AppShell` + `FloatingDock`. `OverlayHost` (`AppShell.tsx:25`) всё равно оборачивает каждое дерево ради порталов, чьи единственные callers мертвы.

**Сценарий:** правка «header» уходит в мёртвый код; тесты `header-layout.spec.ts` зелёные при отсутствии UI.

**Доказательство:** grep потребителей; рендер четырёх public экранов без `<header>` / AppHeader; `breakpoint.* = 99999` в `visual-token.spec.ts:72-75` закреплён как phone-only.

**Durable fix:** удалить недостижимое header-дерево и `FilterMenu`; снять `OverlayHost` с `AppShell`, пока нет живого portal-потребителя. Оставить `useDismissibleOverlay` — его использует `FilterSheet.tsx:57`.

**Альтернатива:** оставить «на 1024» — противоречит founder 2026-09-13 и `DEC-085`.  
**Удалить:** `AppHeader`, `MobileHeader*`, `DiscoveryMenu`, `AccountMenu`, `HeaderSearch`, `HeaderNavigationLink`, `CreateWorkAction`, `FilterMenu`, связанные layout helpers/specs, если останутся без callers.  
**Риск:** средний — много unit-тестов header надо снять вместе с кодом, не «починить».  
**Проверка:** grep `AppHeader`/`FilterMenu`; Home/Works без регрессии dock.

**Контраргумент:** «это cheap dead code». Нет: 39 файлов в `layout/` vs живые 6–8; `10-CODE-ARCHITECTURE.md:70` всё ещё рекламирует `FilterMenu` как public barrel.

---

### DS-04 — Два независимых sheet/dialog стека  
**Приоритет:** высокий · **Уверенность:** подтверждено · **До MVP** · **Размер:** M

**Где:**  
`FilterSheet.tsx:119-201` — RN `Modal` + custom Tab trap (`:77-117`) + `OverlayDimmer` + `useDismissibleOverlay`;  
`AppDialog.tsx:21-238` — `@rn-primitives/dialog` + свой focus restore (`:32-88`) + elevation;  
`ShareSheet.tsx:30-38` монтирует Figma share **внутрь AppDialog**.

**Проблема:** разный dismiss, portal, dimmer, chrome, close control. FilterSheet визуально совпал с Figma (рендер). ShareSheet получил Pen-диалог: shadow, border `rgba(20,20,20,0.08)`, close 32×32 lucide.

**Сценарий:** пользователь открывает фильтры, затем share — два языка панелей и два focus-контракта.

**Доказательство (рендер 390):**  
- FilterSheet: full-height белая панель, Figma search, section rows, sticky «Применить»; Escape вернул focus на «Фильтры».  
- Share: `dialog` w=390, radius `20px 20px 0 0`, **shadow `0 10px 24px rgba(17,17,17,0.12)`**, close **32×32**, icon **22**, title `Inter_600` 17/21.  
- Handoff `work__share-sheet__390x874__node-597-18787`: QR + «Скачать QR» + «Копировать ссылку»; отдельного lucide-X/elevation нет.

**Durable fix:**  
- Full-height catalog → оставить `FilterSheet`.  
- Share → собственный sheet chrome на `OverlayDimmer` + focus helper **или** узкий `presentation="sheet"` без AppDialog title/X/shadow.  
- Admin/draft confirm → оставить `AppDialog` dialog, убрать `width>=600` title 38/40 (`AppDialog.tsx:189-196`).

**Не делать:** один `Sheet` с 15 boolean flags.

**Альтернатива:** смириться с двумя стеками — дешевле сейчас, дороже при следующем overlay.  
**Удалить:** AppDialog sheet-presentation, если share уйдёт; `@gorhom/bottom-sheet` (в `apps/mobile/package.json:12`, **нулевые импорты**).  
**Риск:** a11y share (focus return уже есть в AppDialog — перенести, не выкинуть).  
**Проверка:** S1 share + S7 filter заново на 390, Escape/focus.

**Контраргумент:** «один AppDialog проще поддерживать». Наблюдаемый share уже **не** Figma master: это как раз цена общего примитива не той роли.

---

### DS-05 — Две иконосистемы  
**Приоритет:** средний · **Уверенность:** подтверждено · **До MVP** · **Размер:** S–M

**Где:**  
`FigmaIcon.tsx:41-70` Hugeicons + `figma-icon-names.ts`;  
`AppIcon.tsx:1-55` lucide; `instagram: Camera` (`:44`);  
потребители AppIcon: `AppDialog.tsx:222`, мёртвый header, мёртвый `product-about.tsx:84,174`.

**Проблема:** разные glyph, stroke, sizing. Share close — lucide `X` 22. Social Instagram на public author — Hugeicons через `FigmaIcon`.

**Доказательство:** рендер share close ≠ FigmaIcon; grep AppIcon vs FigmaIcon.

**Durable fix:** close/dialog → `FigmaIcon` `x`. Удалить `AppIcon` после смерти header/`product-about`. Не мапить Instagram на Camera.

**Контраргумент:** lucide «ближе к RN». На phone MVP уже выбран Hugeicons registry (`06` / C1 plan).

---

### DS-06 — `DestructiveButton` неотличим от primary  
**Приоритет:** средний · **Уверенность:** подтверждено · **До MVP на owner/admin** · **Размер:** S

**Где:** `apps/mobile/src/components/ui/Button.tsx:57-71` — тот же `FigmaButton variant="solid"`, что `PrimaryButton:35`.  
Потребители: `product-draft-screen.tsx:534`, `admin-moderation-screen.tsx:335,473,527`, `AdminUsersPanel.tsx:119`.

**Проблема:** удаление/опасное действие выглядит как главное CTA. `tokens.color.danger` (`#FF0000`) есть, кнопкой не используется. `FigmaButton` не имеет destructive variant.

**Сценарий:** модератор/автор жмёт «удалить» как обычный submit.

**Доказательство:** код идентичен; фикстура: solid vs hypothetical red.

**Durable fix:** либо явный `variant` с Figma-измерением (если есть), либо **не называть** solid «Destructive» и требовать confirm copy + `AppDialog` (уже есть на draft). Не выдумывать красную кнопку без Figma.

**Альтернатива:** оставить визуал, починить только a11y name — честнее, чем фейковый danger style.  
**Проверка:** admin/draft на 390 после решения по цвету.

**Контраргумент:** «Figma не рисовала admin». Тогда это не visual bug, а **ложный API**: символ `DestructiveButton` врёт. Минимум — переименовать или дать outline + confirm.

---

### DS-07 — Owner choice — не Figma choice  
**Приоритет:** средний · **Уверенность:** подтверждено · **До MVP** (заявка автора в First MVP, `02` §8) · **Размер:** M

**Где:** `SelectableRow.tsx:10-36` — колонка `SecondaryButton` с префиксом `✓ `;  
`seller-profile-steps.tsx:199-242` — способ передачи и инициатор.

**Проблема:** на public author category уже есть `FigmaChoiceChip`; filter options — `FilterOptionRow`. Заявка рисует стопку outline 44px кнопок. Это route-local обход общего control.

**Durable fix:** radio/option row из S7 (`FilterOptionRow`) или `FigmaChoiceChip`, без нового универсального Select.  
**Не делать:** boolean `layout="stack|chip|menu"`.

**Контраргумент:** Figma apply frames могут отличаться от public chips. Тогда нужен **один** measured owner-option master, не `✓ ` на outline button.

---

### DS-08 — «Забыли пароль?» набрано ролью `fieldError`  
**Приоритет:** средний · **Уверенность:** подтверждено (рендер) · **До MVP** · **Размер:** S

**Где:** `apps/mobile/src/features/auth/auth-form.tsx:102-108` — `AppText role="fieldError"`.  
Token `typography.fieldError`: 12/16 (`tokens.ts:283-287`).

**Проблема:** ссылка выглядит как текст ошибки поля, на всю ширину 366.

**Доказательство:** login 8095 — computed `Inter_400Regular` 12/16, `w=366`, color ink `#2A2A2A`, не accent/link.

**Durable fix:** `role="label"` / `body` + `FigmaButton variant="ghost"` или text link 16/26. Не изобретать новый token.

**Контраргумент:** «тихое editorial». 12px ссылка на 390 хуже touch/иерархии, чем Figma auth (S4 принят, но это конкретный misuse роли).

---

### DS-09 — Token-слой раздут aliases и commerce leftovers  
**Приоритет:** средний · **Уверенность:** подтверждено · **После публичных экранов / сразу как cleanup** · **Размер:** M

**Где:** `packages/design-tokens/src/tokens.ts`.

Примеры дублей одного значения: `canvas/surface/surfaceWarm` `#FFFFFF`; `textSecondary/textMuted` `#8A8A8A`; `tabInactive/textSubdued` `#565656`; `accent/accentDark` `#E9401A`; `danger/error` `#FF0000`; `action/solid` `#292929`.

Не используются в `apps/mobile` (скрипт по worktree): `saleLive`, `saleAnnounce`, `coverPrice`, `identityHandle`, `display`, `warning`, `accentDark`, `inkSoft`, `borderStrong`, часть `breakpoint.catalog*`, `layout.productHero*`, top-level `productHeroWide:366` (`:462`).

`pressRing: rgba(0,235,151,0.25)` (`:57`) — mint glow на press (`figma-button-style.ts:44-46`). На Figma phone это надо один раз подтвердить; в token-слое это третий «акцент» после orange/blue.

**Durable fix:** C1 checkbox «одно repeating value → один semantic token» (`10-FIGMA-COMPONENT-IMPLEMENTATION-PLAN.md:97-98`) всё ещё открыт. Снести неиспользуемые keys + commerce type roles. Aliases оставить только если есть разные **роли** (сейчас часто нет).

**Не делать:** вложенный `designTokens.figma` (`DEC-085` запрещает).

**Контраргумент:** «aliases дешёвые». Они плодят route-local выбор `ink` vs `inkSoft` и прячут мёртвый commerce.

---

### DS-10 — Шрифты и зависимости, которые не участвуют в UI  
**Приоритет:** средний · **Уверенность:** подтверждено · **Опционально / после MVP** · **Размер:** S

**Где:** `apps/mobile/src/app/_layout.tsx:7-32` грузит Onest 400–700 и `Inter_700Bold`;  
typography tokens — только `Inter_400/500/600` (`visual-token.spec.ts:78-83`);  
`@gorhom/bottom-sheet` — нет импортов;  
NativeWind: `babel.config.js`, `metro.config.js`, `tailwind.config.js` с **пустым** `theme.extend`, `@tailwind` в `global.css:1-3`; className только у glass/dock/creator-header.

**Доказательство (рендер):** `document.fonts`: Inter_500/600 loaded; Inter_400 loaded после login; Inter_700 / Onest_400–600 **unloaded**; Onest_700 loaded зря. Public type: `Новые работы` `Inter_600SemiBold` 24/29 −0.72 — верно.

**Durable fix:** убрать Onest и Inter_700 из `useFonts`; удалить `@gorhom/bottom-sheet` после проверки bundle. NativeWind снимать только после того, как glass CSS переедет на обычный PostCSS/global.css без preset (не ломать `figma-glass`).

**Контраргумент:** «шрифты уже в bundle от expo-google-fonts». Они увеличивают startup `useFonts` gate (`_layout.tsx:34-38` — белый экран пока не loaded).

---

### DS-11 — Мёртвые composed UI  
**Приоритет:** средний · **Уверенность:** подтверждено · **Опционально, лучше до следующего UI-пакета** · **Размер:** S–M

Файлы без feature-импортов (кроме собственного barrel/теста):

| Файл | Строки / символ |
|---|---|
| `features/products/product-about.tsx` | `SurfacePanel`, `AboutAccordionRow`, `ProductAboutAuthorPanel` — Pen/commerce about, magic `width:376` (`:118`) |
| `ui/EditorialSection.tsx` | обёртка title+children |
| `ui/Skeleton.tsx` | placeholder block; каталог использует `CatalogCardSkeleton` |
| `ui/AmbientImageBackground.tsx` + `ambient-image-background-style.ts` | Pen atmosphere, `#FBFBF8` layers |
| `ui/ProductGallery.tsx` | stacked images; Work использует `WorkGallery` |
| `ui/button-layout.ts` + `Button.spec.ts` | тестирует мёртвый layout, не `FigmaButton` |

**Durable fix:** удалить вместе с header-деревом. `CreatorCard` **оставить** — это mapper на `AuthorCoverCard`, не визуальный дубль.

**Контраргумент:** «длина файла не дефект». Здесь дефект — **нулевой consumer**, не длина.

---

### DS-12 — Magic / route-local значения на живых примитивах  
**Приоритет:** средний · **Уверенность:** подтверждено · **До MVP точечно** · **Размер:** S

| Место | Значение | Роль |
|---|---|---|
| `FigmaButton.tsx:79` | `'#585858'` | outline gradient end |
| `figma-chip-style.ts:7-9` | gradient stroke | не в `designTokens` |
| `AppDialog.tsx:146` | `rgba(20,20,20,0.08)` | border |
| `AppDialog.tsx:158-160` | `width >= 600` | desktop padding/title |
| `AppDialog.tsx:208-209` | close 32×32 | ниже 44, не token |
| `PageState.tsx:26,49` | `minHeight: 220` | empty/loading |
| `WorkGallery.tsx:137-139` | dots 6×6 | дубль `WizardProgress.tsx:42-44` |
| `ShareSheet.tsx:17-18` | `x3 + x1/2` | 14px gap комментарием |
| `FilterMenu.tsx:63-80` | 36/40/14/160/18/20 | мёртв, но образец magic |

**Durable fix:** только repeating values → token (`#585858`, chip gradient, dimmer уже token). Разовые 6px dots — общий `size.statusDot` уже есть и **не используется**.

---

### DS-13 — `FigmaTabs` web ≠ native  
**Приоритет:** низкий для текущего acceptance · **Уверенность:** подтверждено · **После MVP / native** · **Размер:** S

**Где:** `FigmaTabs.web.tsx:13-76` — divider, inactive `textSecondary`, arrows, `panelId`, count `<sup>12`.  
`FigmaTabs.tsx:5-43` — нет `panelId` в props destructure, нет divider, count как `" {n}"`, нет клавиатуры.

**Контраргумент:** native вне acceptance (founder 2026-09-13). Оставить, не «чинить» native вслепую.

---

### DS-14 — Stale design status / gaps  
**Приоритет:** средний (документы) · **Уверенность:** подтверждено

- `09-FIGMA-CUTOVER-GAPS.md:13` — «`/search` is a stub» — ложь относительно `11-PROJECT-STATUS` и живого `/search`.  
- `09:26-27` — `WorkCoverCard` commerce overlay `mode="portfolio"` — в `WorkCoverCard.tsx:24-35` **нет** `mode`/`price`.  
- `02-USER-FLOWS-AND-SCREENS.md:141` всё ещё требует 1024/1440; `04-DESIGN-STATUS.md:59` — founder 390 only.  
- `02:62-64` «Открытие недели не рендерится» vs `DEC-086` (можно показать server pointer). Home на 8095 секции нет — код (`home-screen.tsx`) не читает `curatorSelection`.  
- `03` §1–2 после `:148` описывает Pen architecture как будто текущую.

Это не вкусовщина: агенты снова реализуют search overlay / commerce card / desktop.

---

### DS-15 — Form heading / shell без одной композиции  
**Приоритет:** низкий–средний · **Уверенность:** подтверждено · **После публичных экранов** · **Размер:** M

Четыре живых heading-блока: `AuthCard` (`sectionTitle` 24/29), `PageHeader` (`screenTitle` 20/26), `FormSection` (`screenTitle`), `WizardProgress` (`screenTitle` + dots). Это разные роли (auth vs wizard vs admin), не баг само по себе.

Дефект — `FormPageShell.tsx:12` мёртвый `maxWidth?`; `FormPageColumns` всегда одна колонка (`:44-47`) при unused `sidebarFirstOnCompact`. Wrapper без роли.

**Fix:** убрать мёртвые props; не сливать AuthCard с FormSection.

---

## Custom UI infrastructure

| Сейчас | Установленный API | Можно удалить | Что сохранить |
|---|---|---|---|
| `FilterSheet` + Modal + ручной Tab trap | нет RN-эквивалента Figma full-height; `@gorhom/bottom-sheet` **не** Figma и не используется | gorhom | focus trap, Escape, Apply/Reset, OverlayDimmer |
| `AppDialog` + `@rn-primitives/dialog` | этот пакет — правильный primitive для **centered dialog** | sheet-mode, 600px typography, lucide X | title/description, focus restore, portal |
| `OverlayHost` / `OverlayPortal` | web `createPortal` | весь host, пока нет dropdown | — |
| `useDismissibleOverlay` | общий helper | копии в AccountMenu | один helper для FilterSheet |
| NativeWind + empty Tailwind | CSS для glass уже в `global.css` | `@tailwind utilities` / preset **после** проверки glass | `.figma-glass*` |
| `CoverFrost.web` backdrop-filter | нет CSS-эквивалента Figma progressive blur (`03:97-100`) | native duplicate как acceptance | documented approximation |
| `FigmaChip.web` mask-composite | RN не умеет | не удалять web master | native flat как compatibility |
| `AppIcon` lucide | Hugeicons уже master | lucide, если AppIcon умрёт | FigmaIcon registry |
| `button-layout.ts` | заменён `figma-button-style.ts` | файл + spec | FigmaButton tests |

---

## План унификации (без комбайнов)

**Фаза 0 — источник правды (S, до любой UI-задачи)**  
Согласовать `AGENTS.md`, `03` (current vs historical), `05`, `06`, `09`, `10-CODE-ARCHITECTURE` FilterMenu с `DEC-085`. `01-FOUNDATION` — запрос основателю.

**Фаза 1 — вычитание мёртвого (M, сразу, низкий продуктовый риск)**  
Удалить header-дерево, `FilterMenu`, `product-about`, Editorial/Skeleton/Ambient/ProductGallery/`button-layout`, unused tokens, Onest/Inter_700, `@gorhom/bottom-sheet`. Снять `OverlayHost` с public shell.  
Проверка: Home/Works/Author/Login/Search 390 + unit, которые ещё имеют callers.

**Фаза 2 — один control language на живых экранах (M, до MVP polish)**  
1. Один focus token.  
2. Share sheet без AppDialog Pen-chrome; AppDialog только confirm.  
3. Close/icon → FigmaIcon.  
4. `DestructiveButton` — честный API.  
5. Auth link не `fieldError`.  
6. Outline gradient `#585858` и chip gradient — в tokens.

**Фаза 3 — owner/admin (M–L, First MVP apply/create есть в матрице)**  
`SelectableRow` → FilterOptionRow / ChoiceChip. Не унифицировать admin аналитику с public Figma, пока нет frames.

**Фаза 4 — опционально**  
NativeWind removal; native frost/tabs; token alias collapse.

Порядок фаз уменьшает поддерживаемый код **до** новых абстракций.

---

## Что разумно оставить

- Один объект `designTokens` / `figmaTokens`.  
- `components/figma/*` как masters public phone UI.  
- `TextField` / `PrimaryButton` как тонкие алиасы.  
- `CreatorCard` как mapper.  
- `PageState`, `MotionPressable`, `ResilientRemoteImage`.  
- Web CoverFrost / chip gradient как documented approximation.  
- `font-synthesis: none` (H2).  
- Phone column + dock (`DEC-088`).  
- Native compatibility ветки без native acceptance.  
- Не мержить FilterSheet и Share в один компонент.

---

## Неподтверждённые подозрения

- Mint `pressRing` может быть точным Figma press, а не ошибкой — не сверял node press.  
- CSS outline на RN-web `Pressable`/`TextInput` может никогда не краситься; тогда DS-02 бьёт в основном по `<a>`/web tabs.  
- NativeWind можно снять без регрессии glass — не выключал metro plugin.  
- Figma share может содержать close glyph, которого нет в README handoff.  
- `Inter_400Regular` «unloaded» на Home — нормально, пока нет Regular; не баг.  
- 04-DESIGN-STATUS внутренне противоречит сам себе по S7 wiring — шум, не runtime.

---

## Недоступные проверки

- Native iOS/Android (вне scope и не запускались).  
- Живой Figma inspect MCP / pixel diff к `uMo04w9bgrchWXXDgO4W62` в этой сессии.  
- Physical VoiceOver/TalkBack.  
- Reduced-motion emulation (в коде есть `useReducedMotion` + `global.css:32-39`; **не** эмулировал).  
- Owner wizard / admin UI на 390 (не логинился).  
- `pnpm` typecheck/lint/unit — **не запускал**, не объявляю пройденными.  
- `scripts/setup` отсутствует; `scripts/ops/*` не запускал (destructive DB). Пакеты в основной checkout не ставил.

---

## Приоритетные действия

1. Починить visual source в agent/design docs (`DEC-085`), не трогая `.pen`.  
2. Удалить мёртвый Pen-header + unused UI/tokens/deps.  
3. Развести FilterSheet и Share/AppDialog; один focus token; FigmaIcon на close.  
4. Починить auth link и `DestructiveButton` API.  
5. Перевести заявку автора с `SelectableRow` на существующий option/chip master.

---

## Проверенные области

Документы `00`–`06` design, `DEC-062/063/085/088`, `10`/`11` architecture/status; tokens; `components/figma|ui|layout`; consumers screens; изолированный рендер Home/Login/Works/Filter/Work/Share/Author 390; fixture focus/destructive/chip/close.

**Команды:** `git rev-parse` / `worktree add` `/private/tmp/bidplace-ds-audit`; token unused script; `curl` 8095/3015; browser+CDP на изолированном Expo; `python3 -m http.server 8765` для fixture. Destructive seed/migrate/reset не было.

**Ограничение:** 8095 — чужой изолированный процесс на том же SHA (preview DB). Основной dirty checkout и `:8083` для выводов не использовались.<|eos|>
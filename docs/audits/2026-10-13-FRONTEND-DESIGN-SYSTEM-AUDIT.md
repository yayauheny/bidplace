# Bidplace — независимый аудит frontend и дизайн-системы

Дата начала: 2026-10-13
Статус: **COMPLETE (read-only аудит)**; открытые вопросы — §15
Режим: только исследование и проектирование. Код, Figma, документация продукта, коммиты, PR — не изменялись.

> Если сессия оборвалась: открыть раздел «Журнал прогресса» внизу, продолжить с первого
> незавершённого шага. Каждый раздел помечен `[DONE]`, `[PARTIAL]` или `[TODO]`.

---

## 0. Baseline `[DONE]`

| Факт                                                       | Значение                                                                                                                                                                                                                         |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Реальный HEAD PR #46**                                   | `f4c37a8e5fd2cfc075810a91eb781ef0b291bcfc` (2026-10-13 14:03 +03), получен через `gh pr view 46` + `git fetch origin feature/figma-public-author-profile`. **Локальные ссылки были устаревшими** (`6e51bb09`, 8 коммитов позади) |
| PR #46                                                     | draft, base = `refactor/public-author-static-header` (PR #45 head `0c069053`), 34 files, +935/−388                                                                                                                               |
| Рабочая копия `~/projects/bidplace`                        | на `refactor/public-author-static-header` @ `0c069053` — **предок** HEAD, позади на ~90 коммитов. Код читался не отсюда                                                                                                          |
| Worktree `~/projects/bidplace-figma-public-author-profile` | на `6e51bb09` — **устарел**; не использовался как источник                                                                                                                                                                       |
| Откуда читался код                                         | `git archive f4c37a8e` → `/tmp/bidplace-head` (read-only снимок, без изменения git-состояния рабочих копий). Все `file:line` ниже — по этому снимку                                                                              |
| Аудит-файл лежит                                           | в `~/projects/bidplace/docs/audits/` как **untracked**; не коммитился                                                                                                                                                            |
| Figma MCP                                                  | **недоступен в этой сессии** (в каталоге инструментов нет Figma-namespace). Live Inspect по ссылкам `7008:*` не выполнялся                                                                                                       |
| Локальные Figma-источники                                  | `design/figma-handoff/*` в ветке (auth, author-application, branding, buttons, fields, search); `~/Downloads/01…06_·_Автор_*.figmacapture.zip`; `Bidplace (Copy).fig`                                                            |

Следствие для аудита: любые числа «по Figma» ниже — либо из локального handoff/zip (указано явно), либо **гипотеза**, помеченная `NEEDS-FIGMA`.

## 1. Подтверждённые решения дизайнера `[DONE]`

Из задачи (не переобсуждаются):

- Desktop: контейнер max **1280px**, по центру, **без собственного padding**; уже viewport — занимает всё.
- Mobile: контейнер **100%**, горизонтальный padding основного контента **12px**; нельзя ограничивать весь UI 390px.
- Tablet: 100%, без отдельной системы; без переполнения.
- Вертикальные отступы — по конкретной композиции Figma (20 или 40 и т.п.). Safe Area отдельно, без двойного применения.
- Responsive — из контейнеров и Flexbox; breakpoints — только для смены композиции; не под модели телефонов; не пропорциональное масштабирование.

Дополнения дизайнера в ходе сессии (**новые факты**, учтены во всех разделах):

| #   | Слова дизайнера                                                                                           | Инженерный вывод                                                                                                                                                                                                                                                                 |
| --- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | «Расстояния между блоками всегда кратны двойке»                                                           | Шкала spacing — чётная (2-кратная). Любое нечётное значение (`5`, `7`, `13`…) в коде — кандидат на дефект/проверку. Это единственное **механически проверяемое** правило, на нём можно строить дешёвый lint/тест.                                                                |
| D2  | «Border в макете сделан снаружи, толщина 0.5, из-за чего инпуты 49 вместо 48; это мелочи»                 | В Figma `stroke outside 0.5` ⇒ высота 49. Источник правды по размеру — **48** (дизайнер). В RN `borderWidth` всегда внутри бокса ⇒ задаём height 48 и border внутри. Нельзя «подгонять» код под 49. Это известное расхождение Figma→код, фиксируется в правилах, а не в токенах. |
| D3  | Bottom sheet (участие в торгах): «отступ снизу 40, но не всегда, иногда 20; нужен Safe Area для PWA»      | Нижний отступ шторки = **композиционный** параметр (20 или 40 по макету конкретной шторки) **плюс** `env(safe-area-inset-bottom)`; нужно решить, он **заменяет** или **добавляется** (см. §A/§E). Сейчас — проверять двойное применение.                                         |
| D4  | «Везде разное, надо смотреть в макет. Mobile padding 12; на ПК у основного контейнера нет отступа, центр» | Подтверждает: никакого глобального «вертикального отступа». Локальные значения — норма; глобален только горизонтальный gutter 12 и max-width 1280.                                                                                                                               |

Макет-референс «Участие в торгах» (bottom sheet 390×438 Hug): радиус верха шторки крупный, grabber сверху, заголовок, степпер `−1 / 500 BYN / +1`, чипы `+10 +50 +100 +100`, primary pill, outline pill «Выкуп», серый info-блок. Скриншот сохранён: `~/.cursor/projects/Users-yayauheny-projects-bidplace/assets/image-cd27808e-83cf-4555-9b98-df80a18d354c.png`.

Заметка по макету (факт из скриншота, для проверки): нижний отступ info-блока → низ шторки визуально ≈ 40; кнопка «Выкуп» шире основной (вылезает вправо за `Сделать ставку`) — выглядит как **дефект макета** (outer-stroke), а не как намеренное решение → `NEEDS-FIGMA`, не копировать.

## 2. Layout architecture `[PARTIAL]` (факты проверены по коду HEAD `f4c37a8e`)

Обозначения: **F** — факт из кода/Figma-capture; **H** — гипотеза, требует проверки в браузере/Figma.

| #   | Тип | Наблюдение                                                                                                                                                                                                                                                                                                                                                                                                                                               | Где                                                                                                                                                     |
| --- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1  | F   | `AppShell` по умолчанию режет **любую** страницу до 390px (`contentMaxWidth = layout.phoneWidth`). На HEAD добавлен проп `contentMaxWidth`; **только** публичный профиль автора передаёт `layout.creatorContentMaxWidth = 1280`. Подтверждённое правило «desktop max 1280, центр, без padding» реализовано как **исключение одного экрана**, а не как правило оболочки.                                                                                  | `components/layout/AppShell.tsx:16,21,41`; `tokens.ts:669`; `features/sellers/public-seller-screen.tsx` (3× `<AppShell contentMaxWidth=…>`)             |
| L2  | F   | История «600px»: коммит `249e727f` завёл `creatorContentMaxWidth: 600`, `a891ca2f` заменил на `1280`. Утверждение «для профиля добавлен maxWidth 600» было верно для промежуточных коммитов, **на HEAD неверно** (1280). Но сама схема «токен + проп под один экран» — тот самый временный вариант, который нужно убрать.                                                                                                                                | `git show 249e727f`, `a891ca2f`                                                                                                                         |
| L3  | F   | 390 записано **шестью именами**: `layout.contentMaxWidth/headerMaxWidth/discoveryMaxWidth/productDetailMaxWidth/productHeroContentWidth/phoneWidth` (+ `size.phoneWidth`). Реально читается только `layout.phoneWidth` (9 мест); остальные — 0 чтений. Все 9 `breakpoint.*` = `99999` и тоже 0 чтений: **breakpoint-системы нет**, экраны изобретают пороги сами.                                                                                        | `tokens.ts:667-696`; пороги `700/1000` в `public-seller-screen.tsx:236`, `width >= 600` в `AppDialog.tsx`, `workGalleryShowsArrows(width > phoneWidth)` |
| L4  | F   | Шторки/диалоги ограничены 390 **независимо** от shell: `app-dialog-host-style.ts:23-24`, `AppDialog.tsx:295`, `AuthViewport.tsx:341`. На телефоне 440px шторка `AppDialog`/auth остаётся 390 по центру внутри полноширинной подложки — боковые полосы. Compact `FilterSheet` исправлен на HEAD (`3172dd52`), остальные нет. Визуально → **H** (проверить в 440px).                                                                                       | см. колонку «Где»                                                                                                                                       |
| L5  | F   | Gutter 12 существует как `space.pageGutter` и используется. Но на HEAD `CreatorHeader.tsx:38` и `CreatorIdentity.tsx:31` задают `space.x4` (**16**) (коммит `d82079e0`), тогда как Figma-capture 01 ставит верхние кнопки и аватар на `x=12` (правый край `197.91+180.09=378=390−12`). Отклонение от подтверждённых 12px **на том же экране**; нужен явный ответ дизайнера.                                                                              | `CreatorHeader.tsx:38`, `CreatorIdentity.tsx:31`; capture `7008:12976/12985`                                                                            |
| L6  | F   | Нижний запас под dock — константа `size.dockReserve = 96`, прочитанная **отдельно в ≥8 местах** (AppShell, FormPageShell, home, catalog, work, authors, profile, InfrastructurePageStatus). Dock фиксирован на `bottom = max(insets.bottom, 12)` и высотой 64 → правильный запас = `64 + max(inset,12) + зазор`. 96 верно только при inset ≤ 12. При реальном inset 34 dock перекроет контент (математика из кода) → **H**, проверить с эмуляцией inset. | `FloatingDock.tsx:44`; `rg dockReserve`                                                                                                                 |
| L7  | F   | **PWA не настроен**: нет `+html.tsx`, нет `viewport-fit=cover`, нет manifest/`display: standalone`/theme-color (`app.json` web: только bundler+favicon). Следовательно `env(safe-area-inset-*)` = 0 в Safari-браузере, а в установленной iOS-PWA без `viewport-fit=cover` контент и так лежит внутри safe area. Safe Area-код сейчас **инертен**; формулировка «нужен Safe Area для PWA» — пока цель, не факт.                                           | `apps/mobile/app.json`, отсутствие `src/app/+html.tsx`                                                                                                  |
| L8  | F   | Safe Area читают ровно **2 места**: `AppShell` (`SafeAreaView`, все края) и `FloatingDock` (`useSafeAreaInsets`). Шторки (`AppDialog`, `AuthViewport`, `FilterSheet`) — **ни одной**; их нижний padding — константа 20 (`auth.paddingBottom`, `filter-sheet-style.ts`). Макет «Участие в торгах» требует «20 или 40 + safe area» — такого API нет.                                                                                                       | `AppShell.tsx:28`, `FloatingDock.tsx:40`; `AuthViewport.tsx`, `filter-sheet-style.ts`                                                                   |
| L9  | H   | `FormPageShell` отдаёт `bottomAction` в `AppShell`, который добавляет ему `paddingBottom: dockReserve`, и одновременно сам даёт ScrollView `paddingBottom: dockReserve` → 96px резервируются **дважды**, когда есть действие. Проверить визуально.                                                                                                                                                                                                       | `AppShell.tsx:50-55`, `FormPageShell.tsx:26-28`                                                                                                         |
| L10 | F   | Документ-владелец противоречит решению дизайнера: `03-DESIGN-SYSTEM.md §6.1`: «AppShell is a centered 390 column… Wide windows keep the same column. 1024/1440 out of this wave»; `components/README.md`: «AppShell … ширина телефона». Это нужно переписать после утверждения (§11).                                                                                                                                                                    | `docs/design/03-DESIGN-SYSTEM.md:386-388`, `components/README.md`                                                                                       |
| L11 | F   | В новом Figma-capture профиля (01–06) есть **только 390-кадры** (`targetViewport 390×1799`). Desktop-композиции профиля в capture нет — правило «1280» подтверждено словами, но не геометрией → `NEEDS-FIGMA` для 1024/1440 (число колонок сетки работ и т.д.). **Живой Figma (§18.3) это подтвердил: секции 05, 06, 07, 12 — только Mobile 390.**                                                                                                       | `~/Downloads/01…06_·_Автор_*.figmacapture.zip`, `manifest.json`                                                                                         |

## 3. Design tokens `[PARTIAL]`

Метод: скрипт перечисляет все листья `designTokens` и считает чтения `designTokens.x.y|figmaTokens.x.y` в `apps/mobile/src` + `packages` без spec-файлов. Динамические чтения (`AppText role="…"`) для typography не учтены → числа по typography приблизительные.

| #   | Тип | Наблюдение                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1  | F   | **400 листовых токенов**; без чтений — 134 (≈1/3), ровно одно чтение — 133, ≥2 чтений — 133. То есть реально «общих» ~ треть.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| T2  | F   | `export const figmaTokens = designTokens` (`tokens.ts:812`) — **алиас**, а не второй слой. 332 ссылки в 47 файлах используют `figmaTokens`, 648 в 99 файлах `designTokens`; 5 файлов импортируют оба. Алиас создаёт иллюзию второй системы и лишний вопрос «какой использовать».                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| T3  | F   | **Скрытый второй слой токенов** в `packages/design-tokens/src/figma-button.ts` (304 строки): свои `colors` (дубли `#FFFFFF #565656 #121212 #949494 #F3F3F3 #2A2A2A→#585858 #D1D1D1→#EBEBEB`), своя `typography` (Inter 600 14/26 при существующих `authButton/authButtonStrong`), 7 «размеров», названных **по экранам** (`auth`, `suggestion`, `navigation`, `exitConfirm`, `event`, `pickerAction`, `matrix`) с литералами внутри функций (`16.5`, `10`, `47`, `14`). Плюс `search-chrome.ts` (150 строк). Градиентная рамка определена ≥3 раза (`auth.primaryBorder*`, `auth.providerBorder*`, `figmaButtonTokens.colors.gradient*`, `…gradientStroke.*`); `auth.primaryBorder*/providerBorder*/suggestionBorder*` — **0 чтений** (мёртвые). |
| T4  | F   | **Цвета:** 64 имени → **36 уникальных значений**. `#F3F3F3` ×7 имён (`surfaceMuted, surfacePanel, searchSurface, accentSoft, glassBorderEnd, headerControl, mutedFill`), `#FFFFFF` ×6, `#8A8A8A` ×4, `#2A2A2A` ×3, `#999999` ×3, `#E9401A` ×3. Часть — осмысленные роли, но 7 имён одного серого — шум; роль определяется не значением, а выбором имени. Литеральных hex в коде всего 20 (10 из них — SVG бренда): цвета в целом **дисциплинированы**.                                                                                                                                                                                                                                                                                          |
| T5  | F   | **Чётность (D1).** Нечётные/дробные числа: `space` 8/67 (`chipX 9, chipY 3, fieldY 13, fieldLabelX 15, fieldErrorX 13, filterOptionY 9, headerIconHitSlop 9, homeSectionStack 67`), `size` 5/40 (`input 51, choiceChipRemovable 39, authorAtmosphere 485, filterSortBar 43`), `authorApplication` 8/14 (`contentTop 34.22, chromeGlyph 18.67, headerToBodyBasics 33, directionsHeaderHeight 43, directionsSearchGap 19, directionsListGap 7…`), `auth` 18/50 (`passwordHeight 51, screenPasswordHeight 53, codeCellHeight 61, resendHeight 51, actionHeight 51, suggestionHeight 37, exitActionHeight 55, markSlotWidth 46.29…`).                                                                                                               |
| T6  | F   | **Новый Figma-файл подтверждает D1.** В capture профиля (6 экранов): 321 `gap` и 772 `padding`; не-чётные только `4.47 / 11.16 / 2.23` — внутри иконок-инстансов. Вывод: старые токены измерены с **другого, более шумного источника** (`tokens.ts:3` ссылается на `uMo04w9bgrchWXXDgO4W62`) по `renderBounds`.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| T7  | F   | **Первопричина нечётных значений** — измерение «габарита с внешним stroke», а не размера фрейма. Комментарии в коде это признают: `chipX 9` «inside 1px stroke; the border adds the last pixel», `workChipY 6` «outside 1px stroke is not subtracted», `figmaButtonContentHeight = (paddingY + strokeWidth)*2 + lineHeight` → кнопка 43 вместо 42, input 51 при замысле 48 (D2). Это **системная ошибка процесса переноса Figma→код**, а не набор отдельных багов.                                                                                                                                                                                                                                                                              |
| T8  | F   | `size.input = 51` (`tokens.ts:205`) против слов дизайнера «инпут должен быть 48 (в Figma 49 из-за outside 0.5)». Код на **+3px** выше замысла, не на +1. Кнопки: matrix 43, auth 51, navigation/event 47, exitConfirm 55 — все нечётные по той же причине. **Сверено с живым Figma (§18.1): поле = 50 (габарит 51), не 48; кнопки 42/46/50/54 подтверждены правилом «− 1»; «48» дизайнера остаётся открытым вопросом §18.4.**                                                                                                                                                                                                                                                                                                                   |
| T9  | F   | **Фича-специфичные константы в глобальном объекте:** `authorApplication.*` (14), `auth.*` (50), `space.author*/work*/home*/creator*/logo*` (≥15). 133 токена читаются один раз и принадлежат одному компоненту (`space.homeSectionStack 67`, `space.logoTop`, `auth.markInsetX 7.87`). По политике §10 они должны быть локальными константами рядом с компонентом.                                                                                                                                                                                                                                                                                                                                                                              |
| T10 | F   | Источник правды дрейфует: **три** разных Figma-файла названы каноническими — `uMo04w9bg…` (`tokens.ts:3`), `NM63j9lw…` (`00-DESIGN-INDEX.md`), `pAPQo6cA…` (текущие ссылки задачи); плюс локальный `portfolio-phone-v1` (в AGENTS.md; **отсутствует** в этой ветке — лежит в чужом worktree). Нет реестра «какой файл/нода владеет чем».                                                                                                                                                                                                                                                                                                                                                                                                        |
| T11 | F   | Мёртвые токены (0 чтений): все 9 `breakpoint.*`, 6 `layout.*Width`, `radius.control/compact/media/panel/aboutPanel/menu/sheet/overlay/statusDot`, `size.button/buttonLarge/buttonCompact/header/mobileHeader/avatar/fieldWidth/phoneWidth`, цвета `surfaceWarm, searchSurface, inkSoft, borderStrong, action, actionHover, accentDark, accentSoft, warning, dangerHover, saleLive, saleAnnounce`, `motion.fast/panelOpen/panelClose/layout`, `focus.*`.                                                                                                                                                                                                                                                                                         |

## 4. Shared components `[PARTIAL]`

| #   | Тип | Наблюдение                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | F   | Два слоя компонентов, из которых верхний — тонкая обёртка: `ui/Button.tsx` (99 строк: `PrimaryButton/SecondaryButton/DestructiveButton/TextButton` → `FigmaButton`), `ui/TextField` → `FigmaTextField`. Потребители выбирают слой произвольно: `PrimaryButton` 19 файлов, `SecondaryButton` 23, `FigmaButton` напрямую 23, `TextField` 10, `FigmaTextField` 2. README это оправдывает, но вопрос «какую кнопку взять» остаётся.                                  |
| C2  | F   | `DestructiveButton` рендерит `variant="solid"` — **визуально идентична `PrimaryButton`** (`Button.tsx:74-90`; README: «тот же solid»). 9 вызовов в 4 файлах (`product-draft-screen:1300`, `AdminWorkCatalogProposals:176`, `admin-moderation-screen:551/562/588`…). Имя обещает деструктивность, которой нет. Диалог «Скрыть работу?» в профиле использует `PrimaryButton`.                                                                                      |
| C3  | F   | `FigmaButton.size` — это не размер, а **пресет под экран** (7 значений: `matrix, auth, suggestion, navigation, exitConfirm, event, pickerAction`) с метриками в пакете токенов (T3). Новый экран ⇒ новый «size».                                                                                                                                                                                                                                                 |
| C4  | F   | Иконки: `ui/AppIcon` (Lucide) содержит **ровно одну иконку `X`** и используется в двух файлах (`AppDialog`, `AuthViewport` — кнопки закрытия); остальные 23 файла — `FigmaIcon` (Hugeicons), где тоже есть `x`. Зависимость `lucide-react-native` существует ради одного глифа; закрытие рисуется двумя разными глифами (Lucide 22px vs Hugeicons).                                                                                                              |
| C5  | F   | **Чекбокс/радио реализованы три раза:** `FilterOptionRow` (галка = повёрнутые границы `rotate(-45deg)`, три визуальных варианта `default/directions/compact` с литералами 44/12/15/20/16/1.5/10/6/8), `AuthConsentCheckbox` (SVG-path + `LinearGradient`), и `FigmaIcon check`. Ни один не использует a11y-примитив.                                                                                                                                             |
| C6  | F   | `FilterSheet` перегружен: 8 файлов-потребителей; три роли в одном компоненте — полноэкранный picker (`presentation='full'`), compact action-sheet, и **универсальное сообщение** («Скоро появится», меню `AuthorShare`/`CreatorHeader`). Матрица вариантов по **имени экрана** (`titleVariant: 'directions'`, `FilterOptionRow variant: 'directions'`). Литералы внутри: ручка `36×4 r10 #efefef mb16`, заголовок `18/600`, `0.85`, `-150`, `r32`, `padding 20`. |
| C7  | F   | `FigmaTabs` — **две независимые реализации**: `.web.tsx` на сыром DOM (`<div role=tablist><button role=tab>`, собственный roving-tabindex и стрелки, inline CSS) и RN-версия на `ScrollView/MotionPressable` (счётчик рисуется иначе: текстом « 4» vs absolute). Нет режима равных колонок. Новый capture: 3 равные колонки `122×53` (x=12/134/256).                                                                                                             |
| C8  | F   | 11 файлов `*.web.tsx/ts` — параллельные DOM-реализации (`FigmaTabs, FigmaChip, FigmaGlassSurface, CoverFrost, StickyDockSurface, FloatingDockFrame, FigmaSearchGlass, WorkHeader, search-overlay-surface, app-dialog-layer`). Нативные двойники по документации **не входят в заявленный scope** (`00-DESIGN-INDEX`: «Native iOS/Android … outside the current UI claim»), но поддерживаются.                                                                    |
| C9  | F   | Сетка карточек реализована 4 раза: `WorkCoverCardGrid` (1\|2 колонки), `CategoriesSearchPane` (3), `public-seller-screen` (1/2/3 по `onLayout` с порогами 700/1000), и `flexWrap` в ≥10 местах. Хелпер `paddedGridRows` есть, но порог колонок каждый экран решает сам; профиль обошёл `WorkCoverCardGrid`.                                                                                                                                                      |
| C10 | F   | Градиентная 0.5px-рамка (повторяющийся паттерн Figma) реализована **пятью способами**: SVG в `FigmaButtonSurface`, SVG в `FigmaSearchChromeStroke`, `LinearGradient` в `AuthConsentCheckbox`, CSS-mask в `FigmaChip.web`, `.figma-glass-stroke` в `global.css`.                                                                                                                                                                                                  |
| C11 | F   | `figma/` — смесь: примитивы (`FigmaButton/Icon/TextField`), композиты (`FilterSheet/ShareSheet/FloatingDock`), фич-визуалы (`AuthorCoverCard/WorkGallery/AuthorAtmosphere`) и ~22 `*-style.ts` с ~25 spec. Префикс `Figma*` называет **происхождение**, а не роль.                                                                                                                                                                                               |
| C12 | H   | Spec-файлы ассертят точные токены (напр. `figma-chip-style.spec` — 23 ссылки на токены) → каждое изменение токена ломает тесты. Это прямо противоречит цели «изменение общей кнопки/токена остаётся локальным». Проверить выборочно.                                                                                                                                                                                                                             |
| C13 | F   | Тонкие места, где архитектура **удачна** (оставить): `AppText` с `role/tone` (67 файлов); `MotionPressable` (CSS transitions + токены motion, 33 файла); `FigmaButton` как единая точка (23 прямых + 42 через обёртки); `ResilientRemoteImage` + `media-recovery` (оправдан: R2/S3 delivery, retry с backoff); `layout-transition.ts` (единые пресеты Reanimated); `AppDialog` для `sheet/mediaSheet` (backdrop и лист анимируются **независимо**).              |

## 6. Overlay / animation `[PARTIAL]`

**Инвентарь поверхностей (F):**

| Поверхность         | Технология                                                   | Потребители                            | Анимация                                                                               | Dismiss/focus                                                                            |
| ------------------- | ------------------------------------------------------------ | -------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `AppDialog`         | `@rn-primitives/dialog` + портал                             | 9 файлов (dialog / sheet / mediaSheet) | Reanimated: backdrop `FadeIn`, лист `SlideInDown` — **независимо**                     | примитив (Radix на web) + свой `onOpenAutoFocus`                                         |
| `AuthViewport`      | то же, **переписанный каркас** (482 строки)                  | login/register/…                       | Reanimated, независимо                                                                 | примитив + 6 DOM-вызовов + history-monkeypatch                                           |
| `ExitConfirmDialog` | `@rn-primitives/dialog`                                      | 2 файла                                | нет                                                                                    | примитив **и** самописные `useDismissibleOverlay` + `useOverlayFocusTrap` (двойной trap) |
| `FilterSheet`       | RN `<Modal transparent>` + `OverlayDimmer`                   | 8 файлов                               | `animationType='slide'` (compact) — анимирует **всё содержимое Modal, включая dimmer** | самописные хуки (217 строк кода + 363 spec)                                              |
| `SearchOverlay`     | RN `<Modal>` (native) / `createPortal` (web)                 | dock search                            | нет                                                                                    | самописные хуки                                                                          |
| `FloatingDock`      | `createPortal(document.body)` + CSS `.figma-dock-layer` z=40 | AppShell                               | —                                                                                      | —                                                                                        |
| `OverlayHost`       | пустой `View#app-overlay-host` z=20 на каждой странице       | AppShell                               | —                                                                                      | **0 потребителей** (мёртвый слой)                                                        |

Итого **три технологических стека** для «модальной поверхности» (rn-primitives Dialog / RN Modal / ручной portal) и **один из них — главный источник багов** из списка пользователя.

| #   | Тип | Наблюдение                                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| O1  | F   | **Корень «dimmer выезжает вместе с листом»:** `FilterSheet.tsx:82` `<Modal animationType={compact ? 'slide' : 'none'}>` с `<OverlayDimmer>` внутри (`:93`). Модальный слой RN двигает весь контент целиком. `AppDialog` (`:366-390`) уже делает правильно — отдельные `Animated.View` для backdrop (fade) и листа (slide). Значит правильного решения писать не нужно: **одна** шторка на `AppDialog`-механизме.          |
| O2  | F   | «Compact FilterSheet показывал пустую область»: на HEAD высота списка считается вручную `maxHeight: Math.max(height * 0.85 - 150, 80)` (`FilterSheet.tsx:196`), панель `maxHeight: height*0.85` (`:100`), `150` — магическая сумма шапки+действия. Хрупкая арифметика вместо `flex`/`flexShrink:1`+`minHeight:0` (как у `AppDialog`). Источник класса дефекта подтверждён; конкретный пустой кадр — **H** (нужен прогон). |
| O3  | F   | Самописный dismiss/focus-trap (`use-dismissible-overlay.ts` 78, `use-overlay-focus-trap.ts` 83, `overlay-focus.ts` 29, `dismissible-overlay.ts` 27 + 363 строки spec) **дублирует** Radix-поведение `@rn-primitives/dialog` (focus scope, Escape, outside-click, aria-modal, возврат фокуса). `ExitConfirmDialog` подключает **оба** — два конкурирующих focus-trap.                                                      |
| O4  | F   | Слой `components/layout/AuthViewport.tsx` импортирует `features/home/home-screen` и `features/auth/*` — **обратная зависимость layout → feature**; компонент одновременно: каркас шторки, навигационный guard, history-publisher, раскладка бренда, рендер HomeScreen под шторкой.                                                                                                                                        |
| O5  | F   | Reduced motion — **три источника**: глобальный CSS (`global.css`, `animation/transition-duration: 0 !important`), самописный `lib/reduced-motion.ts` (44 строки, 5 потребителей), `ReduceMotion.System` в Reanimated-пресетах. Reanimated экспортирует `useReducedMotion` (проверить поведение на web).                                                                                                                   |
| O6  | F   | Анимации в целом **в хорошем состоянии**: Reanimated только в 3 файлах (entering/exiting), CSS-transition для hover/press через стиль, `requestAnimationFrame`-циклов и `Animated.Value` нет. Остаточная «ручная» анимация — `WorkGallery`: `setActive` на **каждом** `onScroll` при `scrollEventThrottle=16` (`WorkGallery.tsx:82`) — нарушение правила «не хранить scroll в `useState`».                                |
| O7  | F   | Z-слои: `layer {content 0, chrome 10, popover 20, modal 50}` в токенах, но dock = `z-index: 40` в `global.css`, `ExitConfirm` = `modal + 1`. Второй источник z-index вне токенов.                                                                                                                                                                                                                                         |
| O8  | F   | Нативная ветка: `Dialog.Portal` на native требует `PortalHost` — в репозитории он не подключён; native-пути `AppDialog`/`AuthViewport` не заявлены и **не проверены** (`Needs verification`). Это не баг MVP, но риск при включении native.                                                                                                                                                                               |

## 6a. «Самописное» против библиотек `[PARTIAL]` (запрос: «убрать всё, что делает библиотека»)

Критерий: заменять, только если библиотека **уже установлена** или это встроенная возможность платформы. Новую зависимость — только при доказанной выгоде.

| #   | Самописное                                                                                                                                                                                                                                                                                                                   | Размер             | Чем заменить                                                                                                                                           | Вердикт                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| S1  | focus-trap / dismiss / return-focus хуки                                                                                                                                                                                                                                                                                     | 217 src + 363 spec | `@rn-primitives/dialog` (уже в проекте): Radix FocusScope/DismissableLayer                                                                             | **Удалить** после миграции FilterSheet/Search/Exit       |
| S2  | `FilterSheet` как RN-Modal                                                                                                                                                                                                                                                                                                   | 229                | `AppDialog presentation="sheet"` (+ вариант `fullscreen`)                                                                                              | **Слить** (§9)                                           |
| S3  | `useReducedMotion` свой                                                                                                                                                                                                                                                                                                      | 44                 | `useReducedMotion` из `react-native-reanimated` / `AccessibilityInfo`                                                                                  | Заменить (проверить web)                                 |
| S4  | `usePreventRemove` через `expo-router/build/react-navigation/core`                                                                                                                                                                                                                                                           | 2 импорта          | публичный `expo-router/react-navigation` (файл `react-navigation.js` в пакете; barrel `native` → `export * from '../core'` — проверено)                | **Исправить импорт** (нарушает «не обходить exports»)    |
| S5  | monkeypatch `window.history.pushState/replaceState` + `popstate` (auth) и ручные `history.go/popstate/beforeunload` (product-draft, 11 мест)                                                                                                                                                                                 | 157 + ~60          | `usePreventRemove` покрывает навигацию внутри роутера; для `beforeunload` — оставить одним хуком. Полная замена без spike **не доказана**              | **Свести к одному хуку `useLeaveGuard`**, spike отдельно |
| S6  | Галерея `WorkGallery` (scroll→`useState`)                                                                                                                                                                                                                                                                                    | 206                | `FlatList horizontal pagingEnabled` + `onMomentumScrollEnd` (встроено), без новых зависимостей                                                         | Упростить                                                |
| S7  | Tabs на сыром DOM + RN-вариант                                                                                                                                                                                                                                                                                               | 99 + 49            | `@rn-primitives/tabs` (того же семейства, что `dialog`) или **одна** RN-реализация с `role=tablist`; stateful roving-focus уже есть в RN-Web Pressable | Одна реализация                                          |
| S8  | чекбокс/радио ×3                                                                                                                                                                                                                                                                                                             | ~140               | `@rn-primitives/checkbox` + `radio-group` либо один локальный `Checkbox`                                                                               | Одна реализация                                          |
| S9  | 5 способов градиентной рамки                                                                                                                                                                                                                                                                                                 | ~300               | Не библиотека: единый `GradientBorder` (web: mask, native: `LinearGradient`) **или** отказ от градиента, если дизайнер согласен на flat                | Свести к 1                                               |
| S10 | `useCssBorderBox` (читает computed style из-за дробных размеров)                                                                                                                                                                                                                                                             | 30 + SVG-размеры   | Не нужен при целочисленных размерах (D1/D2) → побочный эффект T7                                                                                       | Удалить вместе с T7                                      |
| S11 | `lucide-react-native` ради одной иконки `X`                                                                                                                                                                                                                                                                                  | 1 зависимость      | `FigmaIcon name="x"` (Hugeicons)                                                                                                                       | **Удалить зависимость**                                  |
| S12 | `OverlayHost` + `#app-overlay-host`                                                                                                                                                                                                                                                                                          | 25                 | —                                                                                                                                                      | **Удалить** (0 потребителей)                             |
| S13 | `@react-navigation/native` как прямая зависимость ради `ThemeProvider` (expo-router 57 содержит vendored react-navigation)                                                                                                                                                                                                   | 1 зависимость      | `ThemeProvider` из `expo-router/react-navigation` либо удалить (MVP light-only)                                                                        | **H**: проверить дубли копий                             |
| S14 | Шрифты `useFonts` блокируют первый рендер (`_layout.tsx` отдаёт пустой `View` до загрузки)                                                                                                                                                                                                                                   | —                  | `expo-font` plugin (native) + `expo-splash-screen`/`font-display` на web                                                                               | P3                                                       |
| S15 | `ScrollView + .map` для списков работ                                                                                                                                                                                                                                                                                        | —                  | `FlatList`/`FlashList` — только если страница > ~20 карточек; сейчас пагинация «Смотреть все»                                                          | P3, не трогать пока                                      |
| —   | **Оставить:** `ResilientRemoteImage`/`media-recovery` (retry+backoff для R2), `layout-transition.ts`, `MotionPressable`, `AppText`, `FigmaGlassSurface` (stacking-context причина задокументирована), Turnstile-обёртка (security-чувствительно; менять только при баге), `react-hook-form + zod` (уже стандарт для 5 форм). |                    |                                                                                                                                                        |                                                          |

## 5. Экраны (выборка) и управление/enforcement `[DONE]`

| Экран                                                                                               | Оболочка                                                                                | Ширина                 | Заметки                                                                                                                                      |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Публичный автор `public-seller-screen` (334)                                                        | `<AppShell contentMaxWidth={1280}>` **×3** (по одному на состояние loading/error/ready) | 1280 (единственный)    | Сетка 1/2/3 колонки по `onLayout` с порогами 700/1000; отступы шапки `x4=16` против Figma 12.                                                |
| Home, Authors, Works/Catalog, Work page, Cabinet, Legal, Search                                     | `<AppShell>` по умолчанию                                                               | **390** (`phoneWidth`) | Каждый экран знает про «колонку телефона»; `WorkGallery` стартует с `useState(phoneWidth)`.                                                  |
| `seller-profile-screen` 1693, `product-draft-screen` 1346, `auth-form` 1192, `admin-moderation` 963 | `FormPageShell`/`AppShell`                                                              | 390                    | Это **логика потоков**, а не вёрстка (в seller-profile всего 6 обращений к `designTokens`). Нарушение «тонких экранов», но не дизайн-долг.   |
| `(public)/dev/figma-buttons`                                                                        | —                                                                                       | —                      | **Публично маршрутизируемая dev-страница без гейта** (`figma-buttons.tsx:130`), используется e2e `figma-button-matrix`. В production-бандле. |

| #   | Тип | Наблюдение                                                                                                                                                                                                                                                                                                                                                                 |
| --- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | F   | Оболочка создаётся **в каждой ветке состояния** экрана (`public-seller`, `product-screen`, `author-cabinet`, `admin-analytics`: 2–3 `<AppShell>` на экран) — при смене loading→ready оболочка (dock, background, SafeAreaView) пересоздаётся. Route-group `(public)/_layout.tsx` — голый `<Stack>`.                                                                        |
| E2  | F   | **Автоматических ограждений нет.** `packages/eslint-config/index.js` = `eslint:recommended` + TS-recommended + `import` (без `react-hooks`, без `react-native`, без `jsx-no-leaked-render`, без `no-restricted-imports/syntax`). `eslint-plugin-react-hooks` не установлен вообще — `exhaustive-deps` не проверяется. Любую ошибку из этого аудита lint сегодня пропустит. |
| E3  | F   | Покрытие тестами **сильное**: 127 spec-файлов, 44 e2e (Playwright chromium+webkit) — но все визуальные проверки на **390**; 1024/1440 не покрыты ничем (совпадает с docs: «outside the current UI claim»).                                                                                                                                                                 |
| E4  | F   | В репозитории нет единого места, где написано «как делать экран»: правила в `AGENTS.md` (корень), `apps/mobile/AGENTS.md`, `components/README.md`, `docs/design/03 §6.1`, `04-DESIGN-STATUS` (1469 строк) — они **противоречат друг другу** (см. §5a ниже).                                                                                                                |

### 5a. Дрейф источников правды `[F]` — самое серьёзное по управляемости

| Источник                                         | Что утверждает                                                                                                                                                                                                          | Статус                                                                                                                                                                                                           |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md` (корень, «Canonical Pen Reference»)  | `design/pen/bidplace-web-v2.pen` — **канонический** визуальный референс; адаптировать код к Pen                                                                                                                         | **Противоречит DEC-085**                                                                                                                                                                                         |
| `DEC-085` (`12-DECISION-LOG.md:1683`, Confirmed) | Production visual source = Figma inspect copy `uMo04w9bgrchWXXDgO4W62`; Pen — историческая; **layout phone-only, на широких окнах центрированная колонка 390**; «Revisit when: desktop/tablet Figma compositions exist» | **Решение дизайнера (1280 / 100% / 12) — ровно триггер «Revisit»** → нужна новая запись в decision log                                                                                                           |
| `docs/design/03 §2` (Token policy)               | Pen-baseline: **Onest**, контейнер **1232 @x=104**, гуттеры tablet **48** / mobile **16**                                                                                                                               | Устарел (код — Inter, gutter 12)                                                                                                                                                                                 |
| `docs/design/03 §6.1`                            | «AppShell is a centered 390 column… wide windows keep the same column»                                                                                                                                                  | Совпадает с DEC-085, но противоречит новому решению                                                                                                                                                              |
| `AGENTS.md` «Canonical Figma handoff»            | Читать **первым** `/Users/yayauheny/projects/bidplace-home-figma-completion/design/figma-handoff/portfolio-phone-v1`                                                                                                    | Путь вне репозитория (другой worktree); в `f4c37a8e` в `design/figma-handoff` его **нет** — только `auth, author-application, branding, buttons, fields, search`. Воспроизвести нельзя ни CI, ни другому агенту. |
| Заголовок `tokens.ts:3`                          | Figma `uMo04…`                                                                                                                                                                                                          | Токены измерены с одной копии, дизайнер сейчас работает в **`pAPQo6cADmG5XzVmBX76EE` «Bidplace (Copy)»**                                                                                                         |
| Origin Figma из DEC-085                          | `NM63j9lwRMqpo2HvAiYNll` (read-only)                                                                                                                                                                                    | Третий id                                                                                                                                                                                                        |

Итого: **четыре визуальных источника (Pen, `NM63…`, `uMo04…`, `pAPQ…`) + один внерепозиторный handoff**, и правила агентов называют каноном тот, который DEC-085 уже отозвал. Агент, следующий `AGENTS.md` буквально, адаптирует код к `.pen`; агент, читающий DEC-085 — к Figma 390. Это не «код», но главный источник «говна и палок».

### 5b. Новый Figma против product-решений `[F]` — **СТОП-точка** (не реализовывать без решения основателя)

Capture `01_Автор_*`, фрейм `7008:13047` (ряд табов), карточки (`7008:12985`) и лист «Участие в торгах» (скриншот дизайнера) содержат:

- таб **«Архив 8»** — `DEC-083` (Confirmed): «Публичной вкладки `Архив` нет»;
- чипы **«Продажа» / «Аукцион»** на карточках и **«Участие в торгах»** — `DEC-087` (Confirmed): «no displayed price, sale status, timer, bid, order or purchase CTA»;
- **«В избранное»** — `DEC-083`: «Public likes, wishlist … отсутствуют в первом MVP».

Следствие для архитектуры: компоненты (Tabs, Chip, Sheet) должны быть сделаны **для N табов/любого контента**, но конкретные elements из этих фреймов **в код не переносим** до решения (`NEEDS-DECISION`). Дополнительно: токен `profileTab` (`16/19`, −0.32px) ≠ capture (`Inter Medium 15/20`, letter-spacing −1%) — токены измерены с другой версии файла.

## 7. Проверка утверждений пользователя `[DONE]`

| #   | Утверждение                                        | Статус                                | Доказательство и корень                                                                                                                                                                 |
| --- | -------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Профиль ограничен 600                              | Исторически да, на HEAD — 1280        | `249e727f` → `a891ca2f`. Корень: ширина решается **на экране** пропом `contentMaxWidth`, а не контрактом контейнера (L1/L2).                                                            |
| 2   | AppShell узкий (390)                               | **Подтверждено**                      | `AppShell.tsx:16` default `phoneWidth`; все экраны, кроме публичного автора, используют default. 6×`390` в `tokens.ts:667-683`.                                                         |
| 3   | Белые полосы по бокам (440)                        | **H** (корень вероятен)               | Колонка 390 + dock/sheet-хост считают рамку от `phoneWidth` (`app-dialog-host-style.ts:23-24`), фон за колонкой — отдельный слой. Нужен визуальный прогон 440/768.                      |
| 4   | Compact FilterSheet пустая область                 | Класс корня **подтверждён**, кадр — H | O2: ручная арифметика высот `0.85*h − 150`.                                                                                                                                             |
| 5   | Dimmer анимируется вместе с модалкой               | **Подтверждено** (код)                | O1: `FilterSheet.tsx:82/93`, RN `<Modal animationType="slide">` содержит `OverlayDimmer`.                                                                                               |
| 6   | Blur аватара обрезается                            | **H**                                 | Нужен прогон. Исправление `f3599458` («keep avatar blur inside viewport») — локальный патч профиля, не правило контейнера: тот же класс дефекта вернётся на другом экране с атмосферой. |
| 7   | Фильтры переносятся вместо горизонтального скролла | Исправлено в коде на HEAD             | `public-seller-screen.tsx:175-212` — горизонтальный `ScrollView`; e2e-покрытие — Needs verification.                                                                                    |
| 8   | Табы не как в Figma                                | **Подтверждено**                      | Capture: 3 равные колонки 122×53 (x=12/134/256), текст по центру, Inter Medium 15/20; код: tabs по ширине контента, 16/19 (C7, §5b).                                                    |
| 9   | Микс Hugeicons/Lucide                              | **Подтверждено**                      | C4: Lucide ради одной иконки `X`.                                                                                                                                                       |
| 10  | Временные компоненты/варианты                      | **Подтверждено**                      | C2 (Destructive = Primary), C3 (7 пресетов-размеров), C6 (`directions`), `/dev/figma-buttons` в production.                                                                             |
| 11  | Счётчики табов/категорий ≠ Figma                   | **H**                                 | Нужна пара скриншотов (код: счётчик absolute на web, текстом на RN).                                                                                                                    |

## 8. Findings `[DONE]`

Приоритеты: **P0** — ломает пользователей/данные/безопасность сейчас; **P1** — корень видимых багов или потеря управляемости; **P2** — дубли и долг, растущий с каждым экраном; **P3** — гигиена. **P0 не найдено**: на mobile-web 390 продукт работает; проблема структурная.
Тип: **F** — факт (код/capture/доки), **H** — гипотеза (нужен прогон/Figma). «→ PRn» — в каком PR из §11 исправляется.

| ID   | P   | Тип | Находка                                                                                                                | Место                                                                                                   | Корень                                                                             | Влияние                                                                                    | Минимальный фикс                                                                           |
| ---- | --- | --- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| F-01 | P1  | F   | Контейнер по умолчанию 390; ширина решается пропом на экране                                                           | `AppShell.tsx:16,21,41`; `tokens.ts:667-683`                                                            | Контракт layout написан под «phone-only» (DEC-085); новый экран = новый проп/токен | Планшет/ПК = колонка; профиль — исключение; каждый экран повторяет решение                 | Один контракт в `AppShell`: `maxWidth = contentMax + 2·gutter`, `padding = gutter` → PR2   |
| F-02 | P1  | F   | Шторки/диалоги капятся 390 независимо от shell; рамка хоста считается в JS                                             | `app-dialog-host-style.ts:23-24`; `AppDialog.tsx:295`; `AuthViewport.tsx:341`                           | Тот же корень + геометрия через `useWindowDimensions` вместо CSS/flex              | Боковые полосы (H), рассинхрон со shell                                                    | Хост: `alignItems:center` + `maxWidth` из токена роли `layout.sheetMax` → PR1              |
| F-03 | P1  | F   | RN `<Modal slide>` двигает dimmer вместе с листом; три стека модальных поверхностей                                    | `FilterSheet.tsx:82,93`                                                                                 | Нет одной шторки; `AppDialog` уже умеет правильно                                  | Видимый дефект; каждый новый sheet выбирает стек сам                                       | Один `AppDialog presentation="sheet"` → PR1                                                |
| F-04 | P1  | F   | Дрейф источников правды (Pen / `NM63…` / `uMo04…` / `pAPQ…` / handoff вне репо); `AGENTS.md` ≠ DEC-085 ≠ docs §2 ≠ код | §5a                                                                                                     | Нет одного владельца «что канон»; DEC-085 не отражён в `AGENTS.md`                 | Агенты расходятся в базовых решениях                                                       | Решение основателя + запись в decision log + правка `AGENTS.md`/`03` → PR2 (docs)          |
| F-05 | P1  | F   | Нет ограждений: lint без hooks/RN/restricted; `react-hooks` не установлен                                              | `packages/eslint-config/index.js`                                                                       | Конфиг «recommended»                                                               | Регресс из этого аудита ничем не останавливается                                           | `no-restricted-imports/syntax` (встроенные) + `react-hooks` + `jsx-no-leaked-render` → PR3 |
| F-06 | P1  | F   | Новый Figma содержит «Архив», «Продажа/Аукцион», «В избранное», «Участие в торгах» — запрещено DEC-083/087             | §5b                                                                                                     | Макет опережает product-контракт                                                   | Риск реализовать запрещённое                                                               | Не переносить в код до решения (вопрос Q3)                                                 |
| F-07 | P2  | F   | 400 токенов: 134 без чтений, 133 с одним; `breakpoint` = 99999; 6 имён для 390; скрытый 2-й слой `figma-button.ts`     | `tokens.ts`; `figma-button.ts`                                                                          | Токен заводили «на всякий случай» и «на экран»                                     | Шум скрывает реальные роли; изменение токена непредсказуемо                                | Политика §10 + удаление → PR3                                                              |
| F-08 | P2  | F   | Нечётные размеры: input 51 (нужно 50, §18.1), кнопки 43/47/51/55, десятки `chip/field*`                                | `tokens.ts:205-206`; T5, T7, T8                                                                         | Измерен габарит с outside-stroke, а не размер фрейма                               | Пиксельные расхождения, `useCssBorderBox`-костыль                                          | Размеры по фрейму, border внутри, чётные → PR3                                             |
| F-09 | P2  | F   | Safe Area читают 2 места; шторки не читают; `dockReserve=96` константа ×8; PWA не настроен                             | `AppShell`, `FloatingDock.tsx:44`; нет `+html.tsx`                                                      | Safe Area решали локально                                                          | Неверный низ в PWA; запас под dock верен только при inset ≤12                              | Один владелец (`AppShell` + sheet-хост), `viewport-fit=cover` → PR1/PR2                    |
| F-10 | P2  | F   | Самописные dismiss/focus-trap дублируют Radix; `ExitConfirmDialog` — двойной trap                                      | `use-dismissible-overlay.ts`, `use-overlay-focus-trap.ts`, `overlay-focus.ts`, `dismissible-overlay.ts` | Хуки написаны до перехода на `@rn-primitives/dialog`                               | −217 src / −363 spec строк; риск конфликта фокус-ловушек                                   | Удалить после PR1                                                                          |
| F-11 | P2  | F   | Один механизм — много реализаций: checkbox ×3, tabs ×2, grid ×4, gradient-border ×5, reduced-motion ×3, close-glyph ×2 | C5, C7, C9, C10, O5, C4                                                                                 | Каждый экран делали «под Figma» без поиска существующего                           | Дефект чинится в одном месте, возвращается в другом                                        | По одной реализации → PR4                                                                  |
| F-12 | P2  | F   | `DestructiveButton` = `PrimaryButton`; `FigmaButton.size` — пресеты по экранам                                         | `Button.tsx:74-90`; `figma-button.ts`                                                                   | Заглушка осталась постоянной                                                       | Имя лжёт; новый экран = новый «size»                                                       | 3 роли размера + настоящий tone или удалить → PR3/PR4                                      |
| F-13 | P2  | F   | `AuthViewport` (482) в `layout/` импортирует `features/*`; дублирует каркас шторки                                     | `AuthViewport.tsx`                                                                                      | Auth-sheet писали рядом с shell                                                    | Обратная зависимость layout→feature; два каркаса шторки                                    | Каркас → `AppDialog`, логика остаётся в feature → PR1 (частично)                           |
| F-14 | P2  | F   | Deep-import `usePreventRemove` из `expo-router/build/...`                                                              | `AuthViewport.tsx:3`; `product-draft-screen.tsx:7`                                                      | Обход публичного экспорта; есть `expo-router/react-navigation`                     | Ломается при обновлении Expo                                                               | Заменить импорт (1 строка ×2) → PR3                                                        |
| F-15 | P2  | F   | `/dev/figma-buttons` — публичный маршрут в production-бандле                                                           | `(public)/dev/figma-buttons.tsx:130`                                                                    | Стенд для e2e оставили в `app/`                                                    | Внутренняя страница доступна из интернета (данных нет, поверхность лишняя)                 | Гейт по `__DEV__`/env либо вынести из `app/` → PR3 (нужно сохранить e2e)                   |
| F-16 | P2  | F   | Профиль: gutter 16 вместо 12; табы по ширине контента; токен `profileTab` 16/19 против 15/20; сетка со своими порогами | `CreatorHeader.tsx:38`; `CreatorIdentity.tsx:31`; `tokens.ts:606`; `public-seller-screen.tsx:236`       | Патчи по экрану вместо общих правил                                                | PR #46 = 75 коммитов, из них 15 `style(…)` по мелочам (halo, glyph, gutter) — whack-a-mole | Собрать на общих примитивах → PR5                                                          |
| F-17 | P2  | F   | `AppShell` пересоздаётся в каждой ветке состояния экрана (×2–3)                                                        | `public-seller-screen:100/110/120`; `product-screen`; `author-cabinet`; `admin-analytics`               | Состояния рендерят целый экран                                                     | Remount dock/background при смене состояния                                                | Одна оболочка на экран, состояния внутри → PR5 (профиль), далее по касанию                 |
| F-18 | P2  | F   | Экраны-гиганты: 1693 / 1346 / 1192 / 963 строк                                                                         | `seller-profile-screen`, `product-draft-screen`, `auth-form`, `admin-moderation-screen`                 | Поток целиком в одном файле                                                        | Дороговизна поддержки; **не дизайн-долг**                                                  | Отдельный трек, не в этом наборе                                                           |
| F-19 | P2  | H   | Spec-файлы ассертят точные значения токенов (напр. `figma-chip-style.spec`)                                            | ~25 `*-style.spec.ts`                                                                                   | Тесты зеркалят реализацию                                                          | Токен меняется → каталог тестов краснеет → «давайте не трогать»                            | При PR3 перевести на отношения (height = control.md) и удалить дубли                       |
| F-20 | P2  | H   | `FormPageShell` + `bottomAction` резервируют dock дважды                                                               | `FormPageShell.tsx:26-28`; `AppShell`                                                                   | `dockReserve` читается в двух слоях                                                | Лишние 96px снизу                                                                          | Один владелец → PR2                                                                        |
| F-21 | P3  | F   | `lucide-react-native` ради одной иконки                                                                                | `AppIcon.tsx`                                                                                           | Остаток старой иконографии                                                         | Лишняя зависимость, два глифа закрытия                                                     | `FigmaIcon name="x"` → PR4                                                                 |
| F-22 | P3  | F   | `OverlayHost` без потребителей                                                                                         | `OverlayHost.tsx:11`                                                                                    | Остаток                                                                            | Пустой слой на каждой странице                                                             | Удалить → PR1                                                                              |
| F-23 | P3  | F   | `WorkGallery`: `setActive` на каждом `onScroll`                                                                        | `WorkGallery.tsx:37,82`                                                                                 | Скролл в state                                                                     | Лишние рендеры                                                                             | `onMomentumScrollEnd`/`FlatList paging` → PR4                                              |
| F-24 | P3  | F   | Z-index dock в CSS вне токенов                                                                                         | `global.css:56`; `ExitConfirmDialog.tsx:83`                                                             | Второй источник слоёв                                                              | Конфликт слоёв при новом overlay                                                           | Слой из `designTokens.layer` → PR3                                                         |
| F-25 | P3  | F   | `useFonts` блокирует первый рендер                                                                                     | `app/_layout.tsx`                                                                                       | Шрифты грузятся в рантайме                                                         | Пустой кадр до загрузки                                                                    | Отдельная задача (splash/`font-display`)                                                   |
| F-26 | P3  | F   | `figmaTokens` — алиас на `designTokens` (332 ссылки / 47 файлов)                                                       | `tokens.ts:812`                                                                                         | Остаток миграции                                                                   | Вопрос «какой импорт»                                                                      | Mechanical rename → PR3                                                                    |
| F-27 | P3  | H   | `@react-navigation/native` — прямая зависимость ради `ThemeProvider`; в `expo-router@57` свой vendored navigation      | `providers/theme-provider.tsx`                                                                          | Остаток шаблона                                                                    | Возможные дубли копий                                                                      | Проверить, затем убрать/перенаправить                                                      |
| F-28 | P3  | F   | `expo-router@57.0.4` пропатчен (inert для неактивных web-экранов); задокументировано                                   | `patches/expo-router@57.0.4.patch`; `10-CODE-ARCHITECTURE.md:106`                                       | Нет публичного API hide                                                            | Каждое обновление Expo обязано перепроверять патч                                          | Оставить; пункт в чек-листе обновлений                                                     |
| F-29 | P3  | F   | Native-путь не проверен (нет `PortalHost`; `.web` двойники)                                                            | `AppDialog` на native                                                                                   | Заявленный scope = mobile-web                                                      | Риск при включении native                                                                  | Явно «unsupported» в docs, пока не в scope                                                 |

**Честная оценка («насколько всё плохо»):** не «помойка». Дисциплина значений высокая (всего 4 hex-литерала вне SVG на ~22k строк; один `designTokens`; анимации — на библиотеке; сильные тесты — 127 spec + 44 e2e). Но система **построена на допущении «телефон 390»**, которое дизайнер только что отменил; одна и та же задача решена **по 2–5 раз разными способами**; **две трети токенов — шум**; **ни одного автоматического ограждения**; а **правила для агентов противоречат решениям (DEC-085)**. Это чинится 5 небольшими PR без переписывания и без нового фреймворка.

## 9. Целевая архитектура `[DONE]` (новых слоёв нет)

Принцип: четыре владельца, у каждого — одна ответственность; всё остальное — композиция.

| Забота                     | Единственный владелец (существует)                                           | Сегодня                                            | Станет                                                                                                                                                                                                                                                                      | Почему проще                                                   |
| -------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Токены                     | `packages/design-tokens/src/tokens.ts` (`designTokens`)                      | 400 листьев; алиас; скрытый 2-й слой; per-screen   | Роли: `color`, `type`, `space` (чётная шкала), `radius`, `control` (sm/md/lg), `layout {contentMax 1280, gutter 12, sheetMax}`, `motion`, `layer`. `figma-button.ts` остаётся как спецификация состояний кнопки, но без дублей цветов/типографики и без per-screen размеров | Меняем один файл; нет вопроса «какой токен»                    |
| Контейнер, Safe Area, dock | `components/layout/AppShell.tsx`                                             | 390 + проп; `dockReserve` ×8; Safe Area в 2 местах | `width:100%`, `maxWidth: contentMax + 2·gutter`, `paddingHorizontal: gutter`, `alignSelf:center`; `SafeAreaView` один раз; `useDockInset()` вместо `dockReserve`; `FormPageShell` — тонкая обёртка без своего резерва                                                       | Экран не знает ни ширин, ни dock                               |
| Модальные поверхности      | `components/ui/AppDialog.tsx` (`@rn-primitives/dialog` + Reanimated)         | 3 стека; `FilterSheet`=RN Modal; hand-rolled trap  | `dialog \| sheet \| mediaSheet \| fullscreen`; хост на flex/CSS (`maxWidth: layout.sheetMax`); низ = `max(bottomSpace 20\|40, insets.bottom)`; backdrop и панель анимируются независимо (как сейчас)                                                                        | Один фокус-менеджмент, одна анимация, одно место для Safe Area |
| Примитивы ввода/навигации  | `components/ui/*` (обёртки над `@rn-primitives/{checkbox,radio-group,tabs}`) | checkbox ×3, tabs ×2                               | `Checkbox`, `RadioGroup`, `Tabs` (равные колонки `flex:1`), `CardGrid` (авто-колонки от ширины контейнера), одна `GradientBorder`                                                                                                                                           | Одно поведение + a11y из библиотеки                            |
| Иконки                     | `components/figma/FigmaIcon.tsx` (Hugeicons)                                 | + `AppIcon` (Lucide)                               | Только `FigmaIcon`; `AppIcon` и зависимость удалены                                                                                                                                                                                                                         | Один набор                                                     |
| Экраны                     | `features/*`                                                                 | свои shell-ветки, свои сетки, `x4` вместо gutter   | Один `AppShell`, внутри состояния; только композиция общих компонентов                                                                                                                                                                                                      | Экран = раскладка, не механизм                                 |
| Ограждения                 | `packages/eslint-config/index.js` + 2 data-spec                              | пусто                                              | `no-restricted-imports` (`expo-router/build/*`, `lucide-react-native`, `react-native` `Modal/Touchable*`); `no-restricted-syntax` (hex-литерал вне токенов); `react-hooks`; `jsx-no-leaked-render`; spec «токены чётные» и «нет токенов без чтений»                         | Агента останавливает CI, а не память                           |
| Правила для агентов        | `.agents/skills/bidplace-ui/SKILL.md` (§12) + указатель в `AGENTS.md`        | 5 противоречивых источников                        | Один компактный skill со ссылками на owner-доки                                                                                                                                                                                                                             | Агент читает одно место                                        |

**Будущее влияние:** новый экран = `AppShell` + `Tabs/CardGrid/AppDialog` + локальные константы с Figma-id; смена дизайна (цвет, радиус, высота контрола, gutter) — одна правка токена; смена контейнера — `layout.contentMax/gutter`. Новая зависимость — только `@rn-primitives/{checkbox,radio-group,tabs}` (того же семейства, что уже установленный `dialog`) и dev-плагины lint; `lucide-react-native` уходит.

**Контейнерная формула (без breakpoint):** `outer { width:'100%', maxWidth: 1280 + 2·12, paddingHorizontal: 12, alignSelf:'center' }` → контент = `min(100% − 24, 1280)`: на телефоне отступ 12, на ПК контент ровно 1280 по центру без «собственного» padding. Full-bleed атмосфера (halo/blur) — отдельный слой **вне** колонки (как у `AuthorAtmosphere`), поэтому «обрезка blur» не лечится `overflow`-патчами.

**Сетка без breakpoint:** `columns = clamp(floor((w + gap) / (minCard + gap)), 1, max)`, где `w` — ширина контейнера (`onLayout`), `minCard`/`max` — свойства `CardGrid`, взятые из Figma (число колонок на desktop — `NEEDS-FIGMA`). Пороги 700/1000 исчезают.

## 10. Политика токенов `[DONE]`

1. **Токен = роль, а не измерение.** Токен существует, если это роль, которой пользуются ≥2 разных компонента, либо сквозная константа (цвет, роль типографики, шкала spacing/radius, motion, layer, `layout`). Одноразовая геометрия — **локальная константа** в файле компонента.
2. **Локальная константа:** именованная, один компонент, комментарий с Figma node-id, чётная, не повторяет значение существующего токена (иначе — токен). Второй потребитель → повысить до токена («правило двух»). Токен, читаемый ≤1 раза и не являющийся сквозной ролью, — удалить/понизить.
3. **Имена семантические**, не по экрану/фрейму/устройству: `tab`, `control.md`, а не `profileTab`, `directionsOption`, `phoneWidth`, `homeSectionStack`.
4. **Один слой для компонентов:** компоненты импортируют только `designTokens`. Палитра — внутренняя деталь файла токенов. Дубль-имя для того же значения допустимо только если роли могут разойтись; причина — в комментарии.
5. **Чётность (D1).** `space`, `size`, `radius`, gap, padding — чётные целые. Исключения: hairline-обводки (`0.5/1`), внутренности иконок. Проверяется spec, а не ревьюером.
6. **Размер берём по размеру фрейма (Figma Inspect → Layout), не по «render bounds».** Обводку считаем **внутри** (RN `borderWidth` внутри бокса; если в Figma stroke outside — вычитаем). Это устраняет 49↔48 (D2).
7. **Типографика — роль целиком** (`family, size, lineHeight, weight, letterSpacing`). Компонент не задаёт `fontSize`/`fontWeight`. Проценты Figma (`−1%`) переводятся в px один раз в токене.
8. **Цвета:** ≤ ~36 уникальных значений; hex в компонентах запрещён (кроме SVG бренда); прозрачность — токен-роль, не `rgba()` в экране.
9. **Breakpoint-токенов нет.** Глобально только `layout.contentMax = 1280`, `layout.gutter = 12`. Смена композиции описывается шириной контейнера **внутри** компонента (`CardGrid.minCard`, `Tabs`), не устройством.
10. **Вертикальные отступы между блоками — локальны** (по Figma: 20, 40…), глобален только горизонтальный gutter (D4). Safe Area — не отступ дизайна: применяется один раз владельцем (`AppShell` / sheet-хост).
11. **Тесты проверяют отношения, не значения** («высота кнопки = `control.md`», «колонка = `min(vw−24,1280)`»), а не «`gap` равен 8».
12. **Страж от гниения:** vitest-spec (≈40 строк) — «нет нечётных значений в шкалах» и «нет токена без чтений»; lint — «нет hex вне токенов».

| ✔ Должно быть токеном                                               | ✘ Не должно быть токеном                                          |
| ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `color.ink`, `color.surfaceMuted`, `color.danger`                   | второе/седьмое имя для `#F3F3F3`                                  |
| `space` шкала (2,4,8,12,16,20,24,32,40…)                            | `space.homeSectionStack = 67`, `auth.markInsetX = 7.87`           |
| `type.body`, `type.label`, `type.title`                             | `profileTab`, `directionsOption` (имя экрана)                     |
| `control.sm / md / lg` (высоты; после подтверждения дизайнером)     | `size.input = 51` (с обводкой), `FigmaButton.size='pickerAction'` |
| `layout.contentMax = 1280`, `layout.gutter = 12`, `layout.sheetMax` | `phoneWidth`, `breakpoint.*`, шесть имён «390»                    |
| `radius` шкала, `motion.fast/base`, `layer.*`                       | `dock z-index: 40` в CSS мимо `layer`                             |

## 11. План миграции `[DONE]` — 5 небольших PR

> **ЗАМЕНЁН §17** (волны W0–W6b, ponytail-урезание, модели, критерии). §11 оставлен как обоснование и список файлов; исполняется §17.

Порядок выбран по независимости и радиусу поражения: сначала то, что чинит видимые баги локально (шторка), затем то, что затрагивает все экраны (контейнер), затем чистка, затем дубли, затем эталонный экран. **Предусловие PR2 и PR5 — решения основателя Q1–Q3 (§15) и запись в `12-DECISION-LOG`; PR1/PR3/PR4 от них не зависят.**
Общее для каждого PR: следовать `AGENTS.md`; обновить `11-PROJECT-STATUS.md`; при UI — `docs/design/04-DESIGN-STATUS.md`; `.pen` в diff не попадает; superseded-код удаляется в том же PR.

### PR1 — Одна шторка (`AppDialog`)

- **Цель:** убрать RN-Modal путь; исправить dimmer; ввести Safe Area для шторок. Закрывает F-02/03/09(шторки)/10/13(каркас)/22.
- **Файлы:** `components/ui/AppDialog.tsx` (+`fullscreen`, хост на flex/CSS, нижний отступ `max(bottomSpace, insets.bottom)`), `app-dialog-host-style.ts`, `components/figma/FilterSheet.tsx` (→ содержимое без собственного Modal), `FilterSortSheet`, `SearchOverlay*` (на `fullscreen`), `ExitConfirmDialog.tsx`, `AuthViewport.tsx` (каркас через `AppDialog`), `layout.sheetMax` в токенах, `app/+html.tsx` (`viewport-fit=cover`, если Q6).
- **Удалить:** `use-dismissible-overlay.ts`, `use-overlay-focus-trap.ts`, `overlay-focus.ts`, `dismissible-overlay.ts` (+3 spec), `OverlayHost.tsx`, использование `OverlayDimmer`, магическую арифметику `0.85·h − 150`.
- **Переиспользовать:** `AppDialog`, `layout-transition.ts`, `@rn-primitives/dialog`.
- **Потребители:** 8 файлов `FilterSheet`, 9 `AppDialog`, 2 `ExitConfirmDialog`, `SearchOverlay`, `AuthViewport`.
- **Риски:** фокус/клавиатура в `SearchOverlay` (autofocus + виртуальная клавиатура iOS), возврат фокуса, `inert` из патча expo-router, контекст z-слоёв с `FloatingDock`.
- **Минимальные проверки:** typecheck + lint мобильного пакета; vitest затронутых `app-dialog-*`, `filter-sheet-*`; e2e `share-sheet-motion` (расширить: transform dimmer не меняется на входе), `search-overlay`, `author-static-header`, `creator-profile`, `auth-layout`; ручной прогон шторки на 390/440/768/1440.
- **Done:** в репозитории нет `Modal` из `react-native` и самописных focus/dismiss-хуков; шторка не имеет JS-расчёта ширины; dimmer не двигается; нижний отступ = `max(20|40, inset)`; `ExitConfirm` — один focus-trap.
- **Влияние на будущее:** новая шторка = контент внутри `AppDialog`; Safe Area/анимация/фокус — «бесплатно».

### PR2 — Контракт контейнера (`AppShell`)

- **Цель:** один контракт: fluid, max 1280, gutter 12, Safe Area один раз, dock inset одним источником. Закрывает F-01/04(docs)/09/20.
- **Файлы:** `AppShell.tsx`, `FormPageShell.tsx`, `FloatingDock.tsx` (`useDockInset`), `tokens.ts` (`layout.contentMax/gutter`), 8 читателей `dockReserve`, `WorkGallery.tsx` (ширина контейнера), `public-seller-screen.tsx` (убрать проп), **docs:** `03 §6.1`, `components/README.md`, `AGENTS.md` (канон Figma/Pen), `12-DECISION-LOG` (новая запись, ссылка на DEC-085).
- **Удалить:** проп `contentMaxWidth`; `layout.phoneWidth/contentMaxWidth/headerMaxWidth/discoveryMaxWidth/productDetailMaxWidth/productHeroContentWidth/creatorContentMaxWidth`, `size.phoneWidth`, весь `breakpoint`, `size.dockReserve`.
- **Переиспользовать:** `AppShell`, `SafeAreaProvider`, `pageGutter` (→ `layout.gutter`).
- **Потребители:** все ~14 маршрутов (`app/**`).
- **Риски:** **все экраны расширяются** — hero, текст, медиа-aspect, галерея; `AuthViewport`; на 1024/1440 нет Figma-кадров (`NEEDS-FIGMA`), поэтому композиция проверяется «не ломается», а не «совпадает».
- **Минимальные проверки:** typecheck (компиляция доказывает, что токены не читаются); e2e `home-figma`, `navigation`, `product-layout`, `creator-profile` + цикл по viewport 390/1024/1440: нет горизонтального скролла, ширина колонки `= min(vw−24,1280)`; скриншоты 6 маршрутов × 3 ширины в `04-DESIGN-STATUS`.
- **Done:** в коде нет литерала 390/440 и имён `phoneWidth`; ни один экран не передаёт ширину; `dockReserve` не существует.
- **Влияние на будущее:** смена контейнера = 2 числа; новый экран ширину не обсуждает.

### PR3 — Диета токенов и ограждения

- **Цель:** токены по §10; ограждения. Закрывает F-05/07/08/12(часть)/14/15/19/24/26.
- **Файлы:** `tokens.ts`, `figma-button.ts` (убрать дубли; 3 роли размера), `packages/eslint-config/index.js`, `apps/mobile/.eslintrc.cjs`, 2 data-spec, `AuthViewport.tsx:3` и `product-draft-screen.tsx:7` (публичный импорт), `global.css` (z-index из токена), `(public)/dev/figma-buttons.tsx` (гейт), ~47 файлов `figmaTokens` → `designTokens` (механически).
- **Удалить:** ~265 неиспользуемых/одноразовых токенов (одноразовые уходят в локальные константы), алиас `figmaTokens`, нечётные значения (после подтверждения дизайнером 48/42/…), `useCssBorderBox`, если после чётных размеров не нужен.
- **Риски:** широкий механический diff; spec-файлы с точными значениями (F-19); `figma-button-matrix` e2e.
- **Проверки:** typecheck (главная гарантия), lint (новые правила зелёные на всём репо), vitest, e2e `figma-button-matrix`, `figma-text-field-focus`, `figma-stabilization`.
- **Done:** 0 токенов без чтений; 0 нечётных в шкалах; 0 hex вне токенов; lint запрещает deep-import/`lucide`/`Modal`.
- **Влияние:** агент физически не может вернуть дубль; дизайн меняется правкой одного файла.

### PR4 — Дедупликация примитивов

- **Цель:** по одной реализации Tabs, Checkbox/RadioGroup, CardGrid, GradientBorder, Icon; реальная `DestructiveButton` или удаление. Закрывает F-11/12/21/23.
- **Файлы:** `FigmaTabs.tsx` + `.web.tsx` → один `Tabs` (равные колонки), `FilterOptionRow.tsx`, `AuthConsentCheckbox`, `components/layout/CardGrid.tsx` (из `WorkCoverCardGrid`, `flex-grid-rows.ts`, `CategoriesSearchPane`, `WorksSearchPane`, `public-seller-screen`), `WorkGallery.tsx` (paging без `setState` на скролл), `ui/AppIcon.tsx` (удалить), `package.json` (−`lucide-react-native`, +`@rn-primitives/{checkbox,radio-group,tabs}` при Q8), `Button.tsx`.
- **Удалить:** DOM-ветку `FigmaTabs.web.tsx`, два лишних checkbox, 3 лишние сетки, 4 лишние градиентные рамки (если Q5/дизайнер подтвердит единый вид), `lucide-react-native`.
- **Потребители:** `FigmaTabs` 3, `FilterOptionRow` 8 шторок, чекбокс — auth/application, сетки — 4 экрана.
- **Риски:** a11y-поведение (клавиатура, roving focus), визуальная разница Radix-разметки на web, версии `@rn-primitives` под RN 0.86/React 19 (`Needs verification`).
- **Проверки:** typecheck, lint, vitest затронутых; e2e `tab-switch-reveal`, `search-overlay`, `auth-layout`, `author-static-header`, `catalog-pagination`; клавиатурный сценарий (Space/Arrows).
- **Done:** по одной реализации каждого; `Destructive` либо визуально отличима, либо удалена; нет `.web.tsx` для Tabs/Checkbox.
- **Влияние:** новый экран с табами/сеткой/чекбоксом — 1 строка, поведение и a11y из одного места.

### PR5 — Публичный профиль автора как эталонный экран + skill

- **Цель:** профиль собран только из общих частей; доказывает модель; закрывает F-16/17; вводит skill.
- **Файлы:** `public-seller-screen.tsx`, `CreatorHeader.tsx`, `CreatorIdentity.tsx`, `AuthorAtmosphere` (слой вне колонки), токен `tab`/`profileTab` (по capture 15/20, −1% → px), `.agents/skills/bidplace-ui/SKILL.md` (§12), указатель в `AGENTS.md`, `apps/mobile/AGENTS.md`, `components/README.md`, `docs/design/02/03/04`.
- **Удалить:** 2 лишние оболочки, 2 padding-переопределения `x4`, inline-сетку 700/1000, локальные патчи halo/gutter, устаревшие записи README.
- **Потребители:** только маршрут `authors/[slug]` (+ `seller/[slug]` redirect).
- **Риски:** desktop-композиции профиля нет в capture (`NEEDS-FIGMA`); элементы из §5b не переносим.
- **Проверки:** `creator-profile`, `author-static-header`, `tab-switch-reveal`, `figma-cover-frost`; парные скриншоты 1440/1024/390 + reference.png capture; клавиатура, zoom 200%, reduced motion; все состояния (loading/empty/error/owner/длинное имя/нет фото).
- **Done:** экран ≤ ~200 строк композиции; 0 литералов размеров; чек-лист §12 пройден; 390 совпадает с capture (12px, 3 равные колонки, 15/20).

**Зависимости:** PR1 → PR4/PR5 (шторки); PR2 → PR5; PR3 → PR4 (чистые токены); PR1 ∥ PR3. Каждый PR откатывается независимо.

## 12. Текст skill `bidplace-ui` `[DONE]` (предложение; **файл не создавался**)

Целевой путь после утверждения: `.agents/skills/bidplace-ui/SKILL.md` + одна строка-указатель в `AGENTS.md` («Skill Selection → `bidplace-ui` для любой UI-работы в `apps/mobile`»). Skill не копирует owner-доки, а ссылается на них.

```markdown
---
name: bidplace-ui
description: Build or change Bidplace screens and shared UI in apps/mobile (Expo / React Native Web). Use for any layout, container width, token, shared component, sheet/dialog, tabs/grid, Safe Area, or Figma-match work.
---

# bidplace-ui

Goal: one way to do each UI job. Before writing UI, find the existing mechanism; extend it; delete what it replaces.

## Read first (owners — link, do not copy)

- `docs/design/00-DESIGN-INDEX.md` → `03-DESIGN-SYSTEM.md` → `04-DESIGN-STATUS.md`
- `apps/mobile/src/components/README.md` (component map)
- Product limits: `DEC-083`, `DEC-087` in `docs/product/12-DECISION-LOG.md`. If Figma shows
  something these forbid (Archive tab, sale/auction chips, favorites, bidding), STOP and report.
- Visual source and priority of Figma sources: `AGENTS.md`. Never read, edit or adapt to `.pen`.

## Layout invariants

- `AppShell` is the only owner of: page container, Safe Area, dock inset, bottom action.
  One `AppShell` per screen; loading/empty/error render inside it, not around it.
- Container = fluid; content `min(100% − 2·layout.gutter, layout.contentMax)`; mobile gutter 12,
  desktop 1280 centered. Screens never pass widths and never write 390/440/1280 literals.
- Columns come from the container width (`CardGrid`), never from device breakpoints or
  `useWindowDimensions` in a screen. No proportional scaling.
- Vertical gaps are local to the Figma composition (20, 40 …). Horizontal gutter is global.
- Full-bleed atmosphere/blur is a separate layer outside the column; never fix it with `overflow`.

## Safe Area

- Applied once, by the owner (`AppShell`, sheet host). Sheet bottom = `max(bottomSpace 20|40, insets.bottom)`.
- Never add insets inside a component that sits under an owner; never hardcode a home-indicator size.

## Tokens (`packages/design-tokens`, single `designTokens`)

- Token = role used by ≥2 components or a global constant. One-off geometry = local named
  constant with the Figma node id in a comment. Second consumer → promote to token.
- Names are semantic (`control.md`, `type.label`), never screen/device names.
- Spacing/size/radius are even integers. Size comes from the Figma frame (Layout), not render
  bounds; borders are drawn inside; outside strokes are subtracted.
- Typography is a role; components never set `fontSize`/`fontWeight`. No hex in components.
- No breakpoint tokens. `layout.contentMax` and `layout.gutter` are the only layout numbers.

## Components

1. Search first: `rg -n "export (function|const)" apps/mobile/src/components/ui apps/mobile/src/components/layout`
   and read `components/README.md`.
2. Reuse as is → else add a **role-named** variant (`variant`, `tone`; never a screen name, never
   boolean flag forests) → else new component, stating its single responsibility in the PR.
3. Prefer a library primitive already in the repo (`@rn-primitives/*`, Reanimated, expo-image,
   react-hook-form + zod, expo-router public exports) over hand-written behavior.

## Overlays and motion

- Only `AppDialog` (`dialog | sheet | mediaSheet | fullscreen`). Never RN `Modal`, manual portals,
  own focus traps or own dismiss logic. Backdrop and panel animate independently (Reanimated
  presets in `lib/layout-transition.ts`). Reduced motion through the single shared hook.
- Import expo-router only from public entries (`expo-router`, `expo-router/react-navigation`).

## Web / native

- Web (PWA) is the claimed target. Native stays compiling but unclaimed. No new `.web.tsx` fork
  unless a CSS-only capability (backdrop-filter, mask) is required; say why in a comment.

## Bans

`TouchableOpacity/Highlight`, `Modal`, `lucide-react-native`, raw hex, `expo-router/build/*`,
`@ts-ignore`/`any`, `{value && <X/>}` with possibly falsy value, scroll position in `useState`,
`setTimeout` animations, per-screen button/tab/grid reimplementations, fake data or controls.

## States and accessibility

Every screen: loading, empty, error, long text, missing image, owner vs visitor where relevant.
Roles/labels, visible focus, keyboard (Tab/Space/Enter/Arrows/Escape), focus return, 44px targets,
200% zoom, reduced motion.

## Consumers

Before changing a shared component/token: `rg` its consumers, list them in the PR, verify each
affected route. Update the owner spec; do not add one test file per bug.

## UI PR done criteria

- [ ] `typecheck`, `lint` (no auto-fix), affected vitest, affected e2e pass
- [ ] screenshots at 1440 / 1024 / 390 next to the Figma reference (note any `NEEDS-FIGMA`)
- [ ] no new literal sizes/colors; superseded code and tokens deleted
- [ ] `docs/design/04-DESIGN-STATUS.md` (+ `03` if shared parts changed) and `11-PROJECT-STATUS.md` updated
- [ ] no `.pen` file in the diff; no conflict with DEC-083/087 left unreported
```

## 13. Before / After `[DONE]`

### 13.1 Публичный профиль автора

**Before (HEAD `f4c37a8e`):**

```text
public-seller-screen.tsx
 ├─ if loading → <AppShell contentMaxWidth={creatorContentMaxWidth}> …            (shell №1)
 ├─ if error   → <AppShell contentMaxWidth={creatorContentMaxWidth}> …            (shell №2)
 └─ ready      → <AppShell contentMaxWidth={creatorContentMaxWidth}>              (shell №3)
       ├─ CreatorHeader    paddingHorizontal: space.x4 (16)   ← Figma: 12
       ├─ CreatorIdentity  paddingHorizontal: space.x4 (16)   ← Figma: 12
       ├─ FigmaTabs        tabs по ширине контента             ← Figma: 3 равные колонки 122
       ├─ filter strip     horizontal ScrollView (ок)
       ├─ grid             contentWidth >= 1000 ? 3 : contentWidth >= 700 ? 2 : 1   (свои пороги)
       ├─ FilterSheet(compact) → RN <Modal slide> + OverlayDimmer    ← dimmer едет с листом
       └─ AppDialog «Скрыть работу?»
 + токены: layout.creatorContentMaxWidth, profileTab(16/19), space.author*, size.authorAtmosphere 485 …
```

**After (после PR1–PR5):**

```tsx
export function PublicAuthorScreen() {
  const author = usePublicAuthor();
  return (
    <AppShell>
      {/* один shell: контейнер min(100%-24,1280), Safe Area, dock inset */}
      {author.status === 'loading' ? <ProfileSkeleton /> : null}
      {author.status === 'error' ? <ProfileError onRetry={author.retry} /> : null}
      {author.status === 'ready' ? (
        <>
          <AuthorAtmosphere />                       {/* слой вне колонки */}
          <CreatorHeader author={author.data} />     {/* отступы = контейнер, не x4 */}
          <Tabs value={tab} onValueChange={setTab}   {/* равные колонки, роли из примитива */}
                items={[{ value: 'works', label: 'Работы', count }, { value: 'about', label: 'Об авторе' }]} />
          <FilterStrip />                            {/* горизонтальный скролл */}
          <CardGrid minCard={…} gap={20}>            {/* колонки от ширины контейнера */}
            {works.map((w) => <WorkCoverCard key={w.id} work={w} />)}
          </CardGrid>
        </>
      ) : null}
      <OptionSheet … />                              {/* AppDialog presentation="sheet" */}
    </AppShell>
  );
}
```

Что исчезает: 2 лишние оболочки, проп `contentMaxWidth`, токен `creatorContentMaxWidth`, 2 переопределения `x4`, inline-математика сетки 700/1000, профильные патчи «keep blur inside viewport / safe avatar gutter» (контейнер и слой атмосферы решают это системно), RN-Modal путь шторки. Что остаётся локальным: вертикальные отступы по Figma, размеры аватара/halo (с Figma-id).

### 13.2 FilterSheet / bottom sheet

**Before:**

```text
FilterSheet
 └─ RN <Modal transparent animationType={compact ? 'slide' : 'none'}>        ← слайдит ВСЁ содержимое
      ├─ <OverlayDimmer/>                                                    ← внутри → едет с листом
      └─ <Pressable panel style={{ maxHeight: height*0.85 }}>                ← ручная арифметика
           ├─ grabber {36×4, r10, '#efefef', mb16}                           ← литералы/hex
           ├─ title {fontSize:18, fontWeight:'600'}                          ← литералы
           ├─ <ScrollView style={{ maxHeight: Math.max(height*0.85-150, 80) }}>   ← «150» магическое
           │    └─ FilterOptionRow variant='default'|'directions'|'compact'  ← матрица по имени экрана
           └─ actions
 + use-dismissible-overlay + use-overlay-focus-trap (217 строк) вместо Radix
 + нижний отступ 20, Safe Area не читается
```

**After:**

```tsx
<AppDialog
  presentation="sheet"
  open={open}
  onClose={close}
  title={title}
  bottomSpace={20 /* или 40 по макету */}
>
  {/* AppDialog: Radix focus/dismiss, backdrop-fade и panel-slide независимо,
      maxWidth = layout.sheetMax, низ = max(bottomSpace, insets.bottom) */}
  <SheetBody>
    <RadioGroup value={value} onValueChange={onChange}>
      {options.map((o) => (
        <OptionRow key={o.value} value={o.value} label={o.label} />
      ))}
    </RadioGroup>
  </SheetBody>
  <SheetActions>{/* Button roles */}</SheetActions>
</AppDialog>
```

Что исчезает: Modal-путь, `OverlayDimmer`, 4 файла хуков + 3 spec, `0.85`/`150`, hex и `fontSize` литералы (grabber/заголовок — часть `AppDialog`), матрица `variant` по экрану (`OptionRow` — одна форма; различия — данные). Что остаётся: контент (какие опции) — в feature.

## 14. Варианты и итог `[DONE]`

| Вариант                                                                 | Суть                                                                                                                                                                     |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A. Эволюция на месте (рекомендуется)**                                | Остаёмся на RN-инлайн-стилях + `designTokens` + `@rn-primitives`; 5 PR из §11; один контракт контейнера, одна шторка, диета токенов, дедуп примитивов, ограждения, skill |
| B. Пересборка на стилевом фреймворке (Tamagui / NativeWind / unistyles) | Новый токен-компилятор и media-queries «из коробки»; миграция 456 inline-стилей, 127 spec, e2e-референсов                                                                |
| C. Только документация + skill, без кода                                | Исправить `AGENTS.md`/docs и ввести skill; код не трогать                                                                                                                |

Оценка (1–5, **выше = лучше**; «новые сущности» и «стоимость поддержки» — выше = меньше/дешевле). Оценки — инженерное суждение, не измерение.

| Критерий                             | A      | B   | C   | Комментарий                                                                       |
| ------------------------------------ | ------ | --- | --- | --------------------------------------------------------------------------------- |
| Простота                             | 4      | 2   | 5   | B вводит новый слой абстракции; C ничего не меняет                                |
| Читаемость                           | 4      | 3   | 2   | В C остаются 3 стека и 4 сетки                                                    |
| Переиспользование                    | 4      | 4   | 1   | A/B объединяют дубли; C — нет                                                     |
| Точность по Figma                    | 4      | 3   | 2   | A чинит корень (чётные размеры, gutter); B перепишет все значения с риском дрейфа |
| Expo Web / native                    | 4      | 3   | 3   | A и так web-first; Tamagui/NativeWind требуют проверки RN 0.86 + RN-Web 0.21      |
| Лёгкость глобального изменения       | 4      | 5   | 1   | B даёт лучшие токены, но только после миграции; C — никак                         |
| Минимум регрессий                    | 4      | 1   | 5   | B затрагивает каждый экран                                                        |
| Число новых сущностей (меньше=лучше) | 5      | 1   | 5   | A: 3 тонких примитива из уже установленного семейства; B: новый фреймворк         |
| Стоимость поддержки                  | 4      | 3   | 1   | В C дрейф продолжается; у B новая зависимость на годы                             |
| **Итого**                            | **37** | 25  | 25  |                                                                                   |

**Почему не B:** он решает проблему, которой у проекта нет (нечем описать токены — есть чем; проблема в дублировании и отсутствии контракта), а `AGENTS.md` запрещает спекулятивные зависимости и абстракции. Пересборка 456 inline-стилей с 127 spec и 44 e2e — максимальный риск регрессий ради выигрыша, достижимого в A. **Почему не C:** документация без кода оставляет корни F-01/02/03 (390 и RN-Modal) и не снимает риск, что агент снова напишет шторку на `Modal`; ограждения без правок нечего проверять.

**Прямой ответ: какой минимальный набор изменений даст Bidplace единую, чистую, управляемую и адаптивную дизайн-систему на ближайшие годы без лишнего усложнения?**

1. **Один контракт контейнера в `AppShell`:** `maxWidth = 1280 + 2·12`, `padding 12`, Safe Area один раз, dock inset одним источником; удалить все `390` и проп ширины. (Адаптивность — из контейнера и flex, без breakpoint-токенов.)
2. **Одна модальная поверхность — `AppDialog`** (`@rn-primitives/dialog` + Reanimated): удалить RN-Modal-шторку и ~217 строк самописного focus/dismiss; Safe Area и анимация — в одном месте.
3. **Диета токенов:** роль или сквозная константа, чётные размеры по размеру фрейма (обводка внутри), один слой; одноразовая геометрия — локально с Figma-id.
4. **По одной реализации** Tabs, Checkbox/Radio, CardGrid, Icon, градиентной рамки — на тех библиотечных примитивах, что уже в проекте (`@rn-primitives`), без нового фреймворка.
5. **Автоматические ограждения:** 4 встроенных lint-правила + `react-hooks` + `jsx-no-leaked-render` + 2 маленьких data-spec; skill `bidplace-ui` как единственный «как делать экран».
6. **Один источник правды визуала:** решение основателя (какой Figma-файл и что делать с DEC-085 / `AGENTS.md`), запись в decision log, правка противоречащих docs.
7. **Не переписывать и не менять стек.**

## 15. Открытые вопросы (для `/grilling`, одной пачкой) `[DONE]`

| #   | Владелец   | Вопрос                                                                                                                                                                                                           | Рекомендация                                                                                                        | Последствие, если иначе                                                              |
| --- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Q1  | Основатель | Новое правило (mobile 100% / desktop 1280 / gutter 12) **пересматривает DEC-085** (phone-only). Записать новое решение в decision log и применить ко **всем** экранам сразу (PR2)?                               | Да; без escape-пропа на экран; экраны, плохо выглядящие на desktop, чинятся композицией в том же PR                 | Иначе остаётся «390 по умолчанию + исключения» = F-01 навсегда                       |
| Q2  | Основатель | Какой визуальный источник канонический: `pAPQo6cADmG5XzVmBX76EE` («Bidplace (Copy)»), `uMo04…` (DEC-085), `NM63…`? И что делать с `AGENTS.md` («канон — Pen») и с `portfolio-phone-v1`, лежащим вне репозитория? | `pAPQ…` для профиля, зафиксировать в decision log; исправить `AGENTS.md`; handoff — в репозиторий или убрать ссылку | Агенты продолжат следовать противоречивым правилам; Figma-проверки не воспроизводимы |
| Q3  | Основатель | Новый Figma содержит «Архив», «Продажа/Аукцион», «В избранное», «Участие в торгах» — противоречат DEC-083/087. Это следующая волна (commerce-v2) или макет нужно очистить?                                       | Не реализовывать в этой волне; профиль = табы «Работы / Об авторе»; остальное помечено `NEEDS-DECISION`             | Иначе в код вернётся архивированная коммерция                                        |
| Q4  | Основатель | Целевая платформа: **web/PWA** заявлена, native — нет? Можно ли остановить поддержку dual-веток (`.web.tsx`) и не заводить новых форков?                                                                         | Web-first; native компилируется, но не заявлен; новые `.web` — только при CSS-необходимости                         | Иначе каждый компонент пишется дважды и native не проверяется                        |
| Q5  | Дизайнер   | Подтвердите итоговые высоты ролей: input 48 (вы сказали), buttons — какие из 42 / 46 / 48 / 50 / 54 реальные роли? Предлагаю `control.sm/md/lg` вместо 7 пресетов по экранам.                                    | 3 роли (значения даёт дизайнер, чётные)                                                                             | Иначе остаются размеры «по экрану»                                                   |
| Q6  | Дизайнер   | Нижний отступ шторки: «20 или 40» — это **минимум**, а Safe Area **заменяет** его, когда больше (`max`), или **прибавляется**? Включаем `viewport-fit=cover` (иначе в PWA inset = 0)?                            | `max(20\|40, inset)`; `viewport-fit=cover` — да                                                                     | `design + inset` даст 74px на iPhone; без `cover` Safe Area не работает              |
| Q7  | Дизайнер   | Как выглядит шторка на desktop: нижняя полоса шириной `sheetMax` по центру (как сейчас, 390) или центрированный диалог? Какая ширина?                                                                            | Центрированный диалог ≥ 768, нижняя шторка ниже; ширина по Figma                                                    | Иначе шторка останется «390 по центру» на 1440                                       |
| Q8  | Разработка | Разрешить добавить `@rn-primitives/{checkbox,radio-group,tabs}` (того же семейства, что `dialog`; ≈ −240 строк самописного a11y), или писать по одному локальному компоненту?                                    | Добавить три примитива (exact-версии; проверить совместимость с RN 0.86/React 19 перед PR4)                         | Иначе дублируем клавиатурную/ARIA-логику вручную                                     |

Что **не** спрашиваю (решено или проверяемо): ширины 1280/12 и «tablet=100%»; чётность; outside-stroke; необходимость единой шторки; удаление Lucide и мёртвых токенов.

## 16. Ответы пользователя на §15 и инвентаризация устаревших источников `[DONE]`

| Вопрос | Ответ                                                                                                                       | Что это значит для плана                                                                                                                                                                                                             |
| ------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Q1     | «Нужен твой совет, скорее всего а»                                                                                          | Совет: **да, ко всем экранам сразу** (вариант a). Один контракт лучше «390 по умолчанию + исключения»; риск закрывается прогоном 6 маршрутов × 3 ширины в PR2, а не пропом на экран. Нужна запись в decision log (revision DEC-085). |
| Q2     | «Figma, Pen — это старый дизайн, который вообще нигде не актуален и должен быть удалён полностью»                           | Канон — **новый** Figma (`pAPQ…`) (вывод из контекста). Pen и старые Figma-источники признаны устаревшими. **Удаление не выполнялось**: см. инвентаризацию и конфликт с `AGENTS.md` ниже. Масштаб удаления требует уточнения.        |
| Q3     | Не реализовывать «Архив», «Продажа/Аукцион», «В избранное», «Участие в торгах» в этой волне; профиль = «Работы / Об авторе» | `NEEDS-DECISION` для остального; компоненты делаются для N табов                                                                                                                                                                     |
| Q4     | Web-first; native компилируется, но не заявлен                                                                              | Новые `.web.tsx`-форки только при CSS-необходимости; native-пути помечаются «unsupported»                                                                                                                                            |
| Q8     | Добавить `@rn-primitives/{checkbox,radio-group,tabs}`                                                                       | **Пересмотрено в §17.0:** по умолчанию без новых зависимостей (требование «не вносить кучу библиотек»); примитив — только если локальная реализация не проходит a11y                                                                 |

### Инвентаризация устаревших дизайн-источников (read-only, снимок `f4c37a8e`)

| Что                                                     | Размер     | Кто ссылается                                                                                                                               | Зависимость кода/тестов                                                                                                                                          |
| ------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `design/pen/` (3 × `.pen`, exports, images, references) | 32 MB      | `AGENTS.md` (правило «Canonical Pen Reference Protection»), 12 файлов `docs/` (`00,01,03,04,05,06,07,08` design; `11,12` product; 2 audits) | **Нет** (ни код, ни тесты не читают `.pen`)                                                                                                                      |
| `design/creator-first/`, `design/creator-first-v2/`     | 13 + 13 MB | docs (`06-ASSET-INVENTORY` и др.)                                                                                                           | Нет                                                                                                                                                              |
| `design/figma-handoff/` (6 семейств, 2026-10-06…11)     | 70 MB      | `AGENTS.md`, 6 файлов `docs/`, 2 файла кода                                                                                                 | **Есть:** `search-overlay-header-style.spec.ts:22` читает SVG из `…/search/2026-10-10-search-popup/fallbacks/`; `bidplace-brand-svg.ts:1` — комментарий-источник |
| id старых Figma-файлов `uMo04…`, `NM63…`                | —          | `tokens.ts:3`, 8 файлов `docs/`, `prisma/fixtures/README.md`                                                                                | Только комментарии                                                                                                                                               |
| `e2e/visual/references/home-opening-figma-390.png`      | —          | e2e `home-opening-figma.spec.ts`                                                                                                            | Да (референс скриншота)                                                                                                                                          |

**Конфликт с `AGENTS.md`:** правило прямо запрещает удалять/переименовывать `design/pen/bidplace-web-v2.pen` «в ходе реализации, рефакторинга, тестов, ревью или документации», а для разрешённой дизайн-задачи требует **не удалять канонический файл** и сохранять историю. Следовательно удаление Pen — **отдельная задача** (не часть PR1–PR5): сначала изменить это правило в `AGENTS.md` по прямому решению основателя + запись в decision log (revision DEC-085/DEC-062/063), затем удалять. Git-история сохраняет файлы; для безопасности можно тегировать коммит до удаления (как `commerce-v1-pre-portfolio` в DEC-087).
`figma-handoff/*` нельзя удалять «как Pen»: это источники текущих auth/buttons/fields/search/brand (самые свежие, 2026-10-06…11), пока новый Figma их не заменил. Минимальное безопасное удаление — Pen (58 MB, ноль зависимостей); handoff — после того как нужные SVG/референсы переедут в новый источник или в `__fixtures__` теста.

**Уточнение пользователя (Q2-scope): удалять только Pen** (`design/pen`, `design/creator-first`, `design/creator-first-v2`, упоминания в 12 docs, правило в `AGENTS.md`); `design/figma-handoff` остаётся, пока новый Figma не заменит auth/buttons/fields/search. Выполняется **отдельной волной W0** (§17.3; не в PR1–PR5) после: (1) прямого решения основателя изменить правило «Canonical Pen Reference Protection», (2) записи в `12-DECISION-LOG` (revision DEC-085), (3) тега на коммите перед удалением. Порядок PR0: тег → правка `AGENTS.md`/docs → удаление каталогов; проверки: `rg "design/pen|\.pen"` пуст вне истории, `pnpm lint` + тесты мобильного пакета зелёные (зависимостей от `.pen` нет).

## 17. Координация: волны оптимизации дизайн-системы `[DONE]`

Заменяет §11 (5 PR) после проверки принципом **ponytail**: наименьшее полное изменение, сначала то, что уже есть в кодовой базе и в установленных зависимостях. Координатор (Cursor) пишет брифы и ревьюит; исполнители — Codex. Волны **строго последовательные**: следующая не начинается, пока предыдущая не принята.

### 17.0 Решения, принятые координатором за дизайнера (дизайнер не программист). Все строки ниже **одобрены основателем 2026-10-13** («везде да, одобряю»); Q5 и Q8 уточнены по живому Figma в §18

| #    | Решение                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Основание                                                                                                  | Как менять |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------- |
| P    | **Pen удаляется** (подтверждено основателем 2026-10-13). Ориентир — только Figma; локальные выгрузки `design/figma-handoff` — вторичны и **могут быть устаревшими**: при расхождении живой Figma выигрывает                                                                                                                                                                                                                                                                                                                                                                       | прямое решение в чате                                                                                      | W0         |
| Q5   | **Правило: размер в коде = габарит в Figma − 1** для контролов с обводкой 0.5 (outside stroke ×2). Роли кнопок: `sm 42` (дефолт `matrix` 43→42; capture профиля: 42.02/42.14/43), `md 46` (`navigation/event` 47→46), `lg 50` (`auth` 51→50, **24 из 30** явных `size=`-использований), `xl 54` (`exitConfirm`/кнопка шторки фильтра 55→54). **Текстовое поле = 50** (живой Figma: `Поля ввода` 51, §18), **не 48**: «48» дизайнера в проверенных секциях не найдено — открытый вопрос §18.4, W3 его не ждёт. Временно: дизайнер может позже слить 46/54 в 50 одной правкой числа | `figma-button.ts`, capture 01/04/06, **живой Figma §18**                                                   | W3         |
| Q6   | Низ шторки = `max(bottomSpace, insets.bottom)`, `bottomSpace` = 20 по умолчанию, 40 там, где так в макете; `viewport-fit=cover` включить (без него `env(safe-area-inset-*)` в PWA = 0)                                                                                                                                                                                                                                                                                                                                                                                            | «Safe Area отдельно, без двойного применения» (D3, решения дизайнера); рекомендация принята без возражений | W1         |
| Q7   | **Шторка остаётся нижней шторкой на любой ширине** (как Material/HIG: sheet не превращается в диалог), ширина `layout.sheetMax = 390` (единственная ширина, нарисованная в Figma), на ≥600 «плавающая» с радиусом, как сейчас. Второй вариант презентации (центрированный диалог на desktop) = лишний код и тесты, пока нет макета                                                                                                                                                                                                                                                | ponytail: не строить то, чего нет в Figma; менять = одно число                                             | W1         |
| Q8   | **Пересмотрено ponytail:** новые зависимости `@rn-primitives/{checkbox,radio-group,tabs}` **не добавляем по умолчанию**. Сначала одна локальная реализация поверх уже установленного (RN `role/aria-*` + то, что даёт RN-Web). Зависимость — только если a11y-проверка локальной версии не проходит, и тогда это отдельное решение. Причина: ваше новое требование «не вносить кучу библиотек, переиспользовать существующее»; RN-версия табов уже 49 строк, экономия от примитива ≈ 0                                                                                            | `FigmaTabs.tsx`, `FilterOptionRow.tsx`                                                                     | W5         |
| Base | Все волны — от `f4c37a8e` (HEAD PR #46), один новый worktree `~/projects/bidplace-ds`, ветки `ds/w0-pen → ds/w1-sheet → …` по цепочке, **одна ветка = один draft-PR**. Рабочая копия `~/projects/bidplace` (устарела, `0c069053`) и `bidplace-home-figma-completion` (read-only) **не трогаются**. Если #45/#46 смержат раньше — rebase, без переписывания                                                                                                                                                                                                                        | у проекта ≈ 50 worktree, лишний `pnpm install` на каждый — расточительно                                   | —          |

### 17.1 Модели Codex (из `~/.codex/models_cache.json`; в вашем `config.toml` по умолчанию `gpt-6.1-sol` + `xhigh` — **это дорого, всегда задавайте модель и effort явно**)

| Ваше имя  | Slug                                               | Роль в плане                                    | Когда                                            |
| --------- | -------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------ |
| **sol**   | `gpt-6.1-sol` (latest workhorse)                   | суждение, поведение, затрагивает все экраны     | **только W1 и W2**, effort `medium` (не `xhigh`) |
| **terra** | `gpt-5.6-terra` (balanced, «straightforward work») | широкая, но проверяемая скриптом/тестами работа | W0, W3 (`medium`), W5 и W6a (`high`)             |
| **luna**  | `gpt-6-luna` (fast, affordable)                    | механика, удаление, документы                   | W4, W6b (`medium`)                               |
| —         | `gpt-6-astra`                                      | не использовать                                 | никогда без явного решения                       |
| Ревью     | Cursor (координатор)                               | чтение diff, grep-приёмка, скриншоты            | **не тратит лимит Codex**                        |

Эскалация: волна не прошла ревью дважды **по одной причине** → координатор сам находит корень и даёт один точечный бриф на sol `medium`; не «перезапустить побольше». Бюджетная раскладка: sol — 2 волны, terra — 4, luna — 2. **W0 перенесена с luna на terra** после инвентаризации: ссылки на Pen есть в ~40 файлах (§19), из них нужно различить нормативные документы (переписать) и журналы/история (только баннер) — это суждение, не механика.

Пример запуска (флаги сверить с `codex exec --help`): `codex exec -C ~/projects/bidplace-ds -m gpt-5.6-terra -c model_reasoning_effort="high" "<бриф>"`.

### 17.2 Контракт исполнителя (вставляется в каждый бриф; ponytail + `AGENTS.md`)

1. **Только то, что в волне.** Смежное улучшение — в отчёт «замечено, не сделано», не в diff.
2. **Порядок поиска решения:** уже есть в коде → установленная зависимость → платформа → минимум нового кода. **Новых зависимостей нет** (кроме явно разрешённых в волне). Новый компонент/хелпер — только с названной текущей ответственностью.
3. **Удаление важнее добавления.** Superseded-код, токены, spec и комментарии удаляются в той же волне. Счёт: `git diff --shortstat` (без lockfile и docs) — **удалений ≥ добавлений**, иначе объяснение в отчёте.
4. **Корень, а не заплатка:** перед правкой общего кода — `rg` по всем потребителям; чинится один раз в общем месте. Запрещены: `@ts-ignore`, `any`, пустые catch, подавление lint, ослабление assertions/таймаутов, `// eslint-disable`.
5. **Ничего нового вне токенов:** новые hex/размеры/`fontSize` в компонентах нельзя; одноразовая геометрия — локальная именованная константа с Figma node-id.
6. **Не трогать:** `design/figma-handoff/**` (до отдельного решения), `docs/product/01–04,06–09`, `docs/design/01-DESIGN-FOUNDATION.md` (кроме явно указанных строк в W0), `docs/research/raw/**`, чужие worktree, БД/миграции/деплой/seed. Не пушить, не мержить, не создавать теги в remote.
7. **Проверки — реально запущенные:** `pnpm --filter @bidplace/design-tokens build` (если трогали токены), `pnpm --filter @bidplace/mobile typecheck`, `pnpm --filter @bidplace/mobile lint` (без `--fix`), `pnpm --filter @bidplace/mobile test` (vitest), затронутые Playwright-спеки (только `chromium`; если окружение недоступно — «не запускал», **не** «проходит»). Нельзя называть волну выполненной при красных проверках.
8. **Документы по правилам `AGENTS.md`:** до ~10 строк в `docs/product/11-PROJECT-STATUS.md` (+ `docs/design/04-DESIGN-STATUS.md` для UI) со статусом `Implemented/Partial/Needs verification` и ссылками на модули/тесты. Новых `.md` файлов нет. `12-DECISION-LOG` — только запись, указанная в волне.
9. **Git:** исполнитель **не пишет в git** (ни `add/commit/rm/checkout/tag/push`; удаляет файлы обычным `rm`) — песочница `workspace-write` не пускает в `.git` вне worktree, а приёмка идёт по diff. Коммитит координатор после приёмки: короткие сообщения без упоминания агентов/автоматизации, один логический коммит на шаг волны.
10. **Формат отчёта:** (a) SHA и ветка; (b) изменённые файлы с причиной; (c) `git diff --shortstat`; (d) **фактический вывод** запущенных проверок и что не запускалось; (e) отклонения от брифа; (f) **1–2 строки: что пропущено/не проверено и риск** (требование ponytail).
11. **Стоп-условия:** конфликт с продуктовым решением (DEC-083/087), неоднозначный Figma-размер, потребность в новой зависимости или в правке protected-документа — **остановиться и вернуться с вопросом**, не придумывать.

### 17.3 Волны

#### W0 — Удалить Pen, исправить «источник правды»

- **Модель:** terra `medium` (было luna — см. §17.1 и §19). **Зависимости:** нет (решение основателя получено). **Размер:** S–M (много файлов, мало кода). **Точный объём и промт — `2026-10-13-wave-prompts/W0.md`; он важнее этого абзаца.**
- **Суть:** убрать устаревший Pen и правила агентов, называющие его каноном; зафиксировать «Figma — единственный визуальный источник; локальные выгрузки вторичны и могут устареть».
- **Делаем:** (1) локальный тег `pen-v2-pre-removal` на базовом коммите (в remote не пушить); (2) `git rm -r design/pen design/creator-first design/creator-first-v2` (≈58 МБ; код/тесты их не читают — проверено `rg`); (3) `AGENTS.md`: заменить разделы «Canonical Pen Reference Protection» и «Pen UI Implementation Quality» и привязку «Canonical Figma handoff» к `portfolio-phone-v1` во внешнем worktree на текст ниже; (4) убрать ссылки на Pen из `docs/design/00,03,04,05,06` и `docs/product/11` (одной строкой/абзацем на ссылку); из `docs/design/01-DESIGN-FOUNDATION.md` — **только строки со ссылкой на Pen** (прямое решение основателя); `07-PEN-V2-UI-AUDIT…` и `08-IMPLEMENTATION-LOG` не переписывать — добавить сверху одну строку `> HISTORICAL: Pen removed (DEC-…)`; (5) `12-DECISION-LOG`: **одна новая запись** («Pen removed; Figma is the single visual source; local exports are secondary», `Revises: DEC-062/063/085`, `Source: founder confirmation in chat 2026-10-13`, `Revisit when: a new design tool is adopted`); (6) `tokens.ts:3` — комментарий-источник на `pAPQo6cADmG5XzVmBX76EE`.
- **Текст для `AGENTS.md` (вставить вместо трёх разделов):** «## Figma is the visual source. Production UI follows live Figma file `pAPQo6cADmG5XzVmBX76EE`. Local exports in `design/figma-handoff` are secondary and may be stale: when they disagree with live Figma, report the discrepancy before choosing a value. Pen is removed (see DEC-…). Do not invent geometry, fonts, assets or interactions that Figma and `docs/design/03-DESIGN-SYSTEM.md` do not define. Reuse tokens and shared components first; extend the design system with a semantic variant before any local style. Keep one semantic token layer in `packages/design-tokens` and thin screens. Verify visual parity at 1440, 1024 and 390 with matched screenshots when frames exist.»
- **Границы / запреты:** ни одной правки `.ts/.tsx`, кроме комментария `tokens.ts:3`; `design/figma-handoff` не трогать; protected-доки — только перечисленные строки.
- **Готово когда:** `rg -n "design/pen|bidplace-web-v2|creator-first|\.pen\b" --glob '!docs/audits/**' --glob '!docs/design/07-*' --glob '!docs/design/08-*' --glob '!docs/product/12-DECISION-LOG.md' .` → пусто; `ls design` → только `figma-handoff`; в `AGENTS.md` нет слов «Canonical Pen»; в decision log ровно +1 запись; `git diff --stat` — почти одни удаления; `typecheck` и `lint` мобильного пакета зелёные; в diff нет `.pen`-файлов с модификациями (только удаления).
- **Стоп:** если `rg` находит живую зависимость кода/CI/скрипта от удаляемых каталогов.

#### W1 — Одна шторка (`AppDialog`) + Safe Area для шторок

- **Модель:** **sol `medium`**. **Зависимости:** W0. **Размер:** M.
- **Суть:** убрать RN-`Modal`-шторку `FilterSheet` (dimmer едет с листом, ручная арифметика высот); шторки живут в `AppDialog`, где backdrop и панель уже анимируются независимо; нижний отступ учитывает Safe Area. Закрывает F-02/03/09(шторки)/22 и часть F-10.
- **Делаем:** (1) `FilterSheet` (и `FilterSortSheet`) → контент внутри `AppDialog presentation="sheet"`; compact и full — один механизм, без собственного `Modal`/`OverlayDimmer`; (2) `AppDialog`: проп `bottomSpace` (20|40) и `max(bottomSpace, insets.bottom)`; хост шторки — flex/CSS (`alignItems:center`, `maxWidth: layout.sheetMax=390`), убрать JS-расчёт `left/right` из `useWindowDimensions` (`app-dialog-host-style.ts`); (3) `AuthViewport.tsx:341` и `AppDialog.tsx:295` читают `layout.sheetMax` вместо `phoneWidth` (**тело AuthViewport не переписывать**); (4) `ExitConfirmDialog`: убрать собственные `useDismissibleOverlay/useOverlayFocusTrap` (двойной trap), оставить поведение примитива; (5) удалить `OverlayHost.tsx` (0 потребителей); (6) `apps/mobile/src/app/+html.tsx` с `viewport-fit=cover` (Expo Router web root; сначала проверить, нет ли уже файла/настройки).
- **Границы:** `SearchOverlay*`, `OverlayDimmer` (нужен `search-overlay-layer`), хуки `use-dismissible-overlay`/`use-overlay-focus-trap` **остаются** (их потребитель — SearchOverlay, backlog B1); `AuthViewport` — только 1 строка; нативный путь не проверять.
- **Требования:** поведение 8 потребителей `FilterSheet` не меняется (закрытие по Escape/клику вне/кнопке, возврат фокуса); заголовок/`accessibilityLabel` как сейчас; чистая функция расчёта нижнего отступа + один тест (`max`).
- **Готово когда:** `rg "from 'react-native'" apps/mobile/src/components/figma/FilterSheet.tsx` не содержит `Modal`; `OverlayHost` отсутствует; `rg "0\.85|- 150" apps/mobile/src/components/figma` → пусто; `ExitConfirmDialog` не импортирует хуки оверлея; `rg "phoneWidth" apps/mobile/src/components/ui apps/mobile/src/components/layout/AuthViewport.tsx` → пусто; e2e `chromium`: `share-sheet-motion` (+1 проверка: backdrop не смещается по Y при входе compact `FilterSheet`), `author-static-header`, `creator-profile`, `auth-layout`, `search-overlay` — зелёные или явно «не запускал»; ручной прогон шторки на 390/440/768/1440 (скриншоты у координатора, **в git не коммитятся**); `git diff --shortstat`: удалений ≥ добавлений.
- **Стоп:** шторка требует нового примитива/зависимости; регресс фокуса в SearchOverlay.

#### W2 — Контракт контейнера в `AppShell`

- **Модель:** **sol `medium`**. **Зависимости:** W1; текст записи в decision log (черновик ниже) **одобрен основателем 2026-10-13** — воркер вносит его как есть. **Размер:** M–L (затрагивает все экраны).
- **Суть:** один контракт: `width:100%`, `maxWidth = contentMax + 2·gutter`, `paddingHorizontal = gutter`, `alignSelf:center`; `layout.contentMax = 1280`, `layout.gutter = 12`; Safe Area один раз; запас под dock — из одного источника. Закрывает F-01/09/20.
- **Запись в decision log (черновик):** «DEC-…: Fluid container. Mobile/tablet content is 100% wide with 12px horizontal gutter; desktop content is centered with max-width 1280 and no extra padding; wider windows no longer keep a 390 column. Revises `DEC-085` layout clause only. Source: designer decision relayed by founder, 2026-10-13. Revisit when: desktop Figma compositions define different widths.»
- **Делаем:** (1) `AppShell`: формула выше, убрать проп `contentMaxWidth`; (2) `useDockInset()` (или константа из токена `dock`) вместо `size.dockReserve` во всех читателях (≈8 мест) и `FormPageShell` без собственного резерва; (3) токены: `layout.contentMax`, `layout.gutter` (из `pageGutter`), удалить `layout.phoneWidth/contentMaxWidth/headerMaxWidth/discoveryMaxWidth/productDetailMaxWidth/productHeroContentWidth/creatorContentMaxWidth`, `size.phoneWidth`, `size.dockReserve`, весь `breakpoint`; (4) `WorkGallery`: ширина из контейнера, не `useState(phoneWidth)`; (5) `public-seller-screen`: убрать проп; (6) docs: `03 §6.1` (одна запись о контракте), `components/README.md` (строка про AppShell), `11-PROJECT-STATUS`.
- **Границы:** экраны не переверстываются; ломающуюся на 1024/1440 композицию **чинить минимально в том же PR** (не добавлять проп «исключения»); `SafeAreaProvider` не менять; декоративные/атмосферные слои — не трогать.
- **Требования:** контент = `min(100% − 24, 1280)`; нет горизонтального скролла на 390/768/1024/1440 на маршрутах: home, authors, works, work page, профиль автора, search.
- **Готово когда:** `rg -n "\b(390|440)\b" apps/mobile/src --glob '!*.spec.*'` → пусто (кроме явно прокомментированных SVG-координат); `rg "phoneWidth|dockReserve|contentMaxWidth|creatorContentMaxWidth|breakpoint" apps packages --glob '!*.spec.*'` → пусто; e2e: существующие спеки с циклом по viewport (расширить владельца, например `navigation.spec.ts`/`creator-profile.spec.ts`, **не новый файл**) проверяют ширину колонки и отсутствие overflow; typecheck (компиляция доказывает отсутствие читателей); скриншоты 6 маршрутов × 3 ширины у координатора; нетто-строк ≤ +30.
- **Стоп:** экран, который нельзя привести к контракту без нового свойства; расхождение с Figma 390; потребность править protected-документ.

#### W3 — Диета токенов и ограждения

- **Модель:** terra `medium`. **Зависимости:** W2. **Размер:** M (много файлов, мало логики).
- **Суть (ponytail-урезано):** удалить только то, что **доказуемо мёртво**, и поставить дешёвые ограждения. **Не** переименовывать/понижать 133 одноразовых токена и **не** чистить все нечётные значения — политика §10 действует для нового кода и «правки по касанию».
- **Делаем:** (1) скриптом (не руками) удалить токены с 0 чтений (≈134 минус уже удалённые в W2); команду приложить к отчёту; (2) `figmaTokens` → `designTokens` mechanical rename (≈47 файлов) и удалить алиас `tokens.ts:812`; (3) размеры по правилу «Figma − 1» (Q5, §18.1): `size.input 51→50`, кнопки `figma-button.ts` sm42/md46/lg50/xl54; высота задаётся **явным `height` из токена** с центрированием текста (в RN обводка внутри бокса — арифметика `paddingY + strokeWidth` исчезает), убрать дубли цветов/типографики; переименовать `FigmaButtonSize` значения **только если это дешевле** — иначе оставить имена, поменять числа; типографика кнопки по Figma `Inter Medium 14/26, letterSpacing −0.28`, поля — `Inter Regular 14/24` (сверить с токенами, не дублировать); `useCssBorderBox` удалить, если после чётных размеров не нужен; (4) `global.css:56` dock z-index из `layer`; (5) lint (встроенные правила, без самописного плагина): `no-restricted-imports` — `expo-router/build/*`, `lucide-react-native`, `Modal/TouchableOpacity/TouchableHighlight` из `react-native`; `no-restricted-syntax` — hex-литерал вне `packages/design-tokens` и файла SVG бренда; (6) один vitest-spec (~40 строк): «нет токенов с 0 чтений» и «нечётных значений нет в `space/size/radius`» с явным allowlist существующих исключений; (7) spec-файлы, ассертящие точные числа токенов, — переписать на отношения (`height === control.sm`), дубли удалить.
- **Границы:** визуальные значения меняются **только** перечисленные в Q5; `react-hooks`/`jsx-no-leaked-render` не включать (сначала измерить число нарушений — backlog B3); экраны не трогать, кроме mechanical rename.
- **Готово когда:** `rg "figmaTokens" apps packages` → пусто; spec «нет мёртвых токенов» зелёный; `pnpm lint` по репо зелёный с новыми правилами (нарушения исправлены, не отключены); `figma-button-matrix`/`figma-text-field-focus`/`figma-stabilization` e2e зелёные или «не запускал»; количество токенов в `tokens.ts` **уменьшилось**, новых нет; `git diff --shortstat`: удалений ≥ добавлений.
- **Стоп:** токен с 0 прямых чтений, но используемый динамически (`AppText role=…`, `designTokens[name]`) — не удалять, перечислить.

#### W4 — Гигиена (мелкие удаления)

- **Модель:** luna `medium`. **Зависимости:** W3. **Размер:** S.
- **Делаем:** (1) удалить `ui/AppIcon.tsx` и зависимость `lucide-react-native`: оба вызова → `FigmaIcon name="x"` (проверить размер/толщину относительно макета); (2) `DestructiveButton` (9 вызовов, 4 файла) → `PrimaryButton`, класс и README-строку удалить; (3) `usePreventRemove` из публичного `expo-router/react-navigation` (`AuthViewport.tsx:3`, `product-draft-screen.tsx:7`); (4) `/dev/figma-buttons` не должен быть достижим в production-бандле, при этом `figma-button-matrix` e2e остаётся рабочим — способ определить по тому, как e2e запускает web (если не удаётся без нового env-флага — остановиться); (5) `lib/reduced-motion.ts` → `useReducedMotion` из Reanimated **только если** все 5 потребителей и их spec остаются зелёными и web-поведение (matchMedia) подтверждено, иначе пропустить и записать.
- **Границы:** ничего сверх списка; визуальных правок нет.
- **Готово когда:** `rg "lucide|AppIcon|expo-router/build|DestructiveButton" apps packages --glob '!pnpm-lock.yaml'` → пусто; lockfile изменён только удалением lucide; typecheck/lint/tests зелёные; production `expo export --platform web` не содержит маршрута `/dev/figma-buttons`.

#### W5 — Один Tabs, одна сетка, один чекбокс (без новых зависимостей)

- **Модель:** terra `high`. **Зависимости:** W4. **Размер:** M.
- **Делаем:** (1) `FigmaTabs`: одна RN-реализация (удалить `.web.tsx`); **в Figma два паттерна (§18.2): по содержанию (каталог, неравная ширина) и равные колонки (профиль, 3×122)** — воркер сначала читает текущие потребители и сохраняет оба режима одним пропсом (`fill`), **не** сводит к одному; один способ рисовать счётчик, `role=tablist/tab`, `aria-selected`, стрелки/Home/End на web; (2) сетка: расширить **существующий** `WorkCoverCardGrid` — колонки `clamp(floor((w+gap)/(minCard+gap)),1,max)` по измеренной ширине контейнера; `public-seller-screen` и `CategoriesSearchPane` переходят на него; пороги 700/1000 удалить (`max`/`minCard` из Figma, desktop-значения — `NEEDS-FIGMA`: пока `max` = текущее число колонок на экране); (3) `FilterOptionRow`: галка через `FigmaIcon check` вместо повёрнутых границ, ветки `variant` по имени экрана (`directions`) заменить данными/пропсом роли; (4) `WorkGallery`: `onMomentumScrollEnd` вместо `setActive` на каждом `onScroll`.
- **Границы:** `AuthConsentCheckbox` и градиентные рамки (5 механизмов) **не трогать** (нет бага — backlog); никаких `@rn-primitives/*` без остановки и вопроса.
- **Требования:** клавиатура и a11y не хуже текущих; дизайн 390 не меняется, кроме выравнивания табов по capture (равные колонки, `Inter Medium 15/20`, −1% → px в токене).
- **Готово когда:** `FigmaTabs.web.tsx` удалён; `rg "paddedGridRows|flexWrap" apps/mobile/src --glob '!*.spec.*'` — потребители перечислены в отчёте и сетка карточек одна; `rg "rotate\('-45deg'\)"` → пусто; `package.json` без изменений зависимостей; e2e `tab-switch-reveal`, `catalog-pagination`, `author-static-header`, `search-overlay`, `creator-profile` зелёные или «не запускал»; клавиатурный сценарий описан в отчёте; нетто-строк ≤ 0.
- **Стоп:** локальный Tabs не проходит клавиатурную a11y без примитива → вернуться с вопросом о зависимости.

#### W6a — Публичный профиль автора как эталонный экран

- **Модель:** terra `high` (эскалация — sol `medium` только после двух неудачных ревью). **Зависимости:** W2, W5. **Размер:** M.
- **Делаем:** профиль целиком на общих частях: **один** `AppShell`, состояния внутри; отступы шапки/идентичности из контейнера (12), без `x4`; `Tabs` (2 вкладки: «Работы», «Об авторе» — `DEC-083`); `WorkCoverCardGrid`; шторки через `AppDialog`; слой `AuthorAtmosphere` — вне колонки; токен таба по capture. Элементы §5b (Архив, Продажа/Аукцион, «В избранное», торги) **не переносить**.
- **Требования:** вертикальные отступы — локальные константы с Figma-id (чётные); состояния: loading/empty/error/owner/длинное имя/нет фото; `reference.png` capture 01 — парное сравнение на 390.
- **Готово когда:** `rg -c "<AppShell" apps/mobile/src/features/sellers/public-seller-screen.tsx` = 1; в файле нет литералов размеров/цветов и `useWindowDimensions`; экран ≤ ~200 строк композиции (иначе логика вынесена в хук, а не в новый компонент-обёртку); профильные патчи halo/gutter удалены; e2e `creator-profile`, `author-static-header`, `tab-switch-reveal`, `figma-cover-frost` зелёные или «не запускал»; скриншоты 390 у координатора; `04-DESIGN-STATUS` обновлён (≤10 строк); desktop — «`NEEDS-FIGMA`», не «Implemented».
- **Открытый нюанс (не блокирует):** в Figma 3 вкладки по 122 («Работы», «Архив», «Об авторе»), у нас 2 (DEC-083) — по умолчанию 2 равные колонки; если дизайнер хочет фиксированные 122 слева — одна правка.
- **Факты живого Figma для воркера (§18.3):** витрина — **одна колонка** карточек 366×488, gap 20; «Об авторе» содержит блоки «Биография», «Практика и подход» и горизонтальную ленту «Выставки и достижения» (карточки 266, gap 16, дата сверху) — проверить текущий `AuthorAbout.tsx` против этих чисел, не переписывая контент (он в `05-MVP-RFC`).

#### W6b — Skill и документация-владельцы

- **Модель:** luna `low`/`medium`. **Зависимости:** W6a. **Размер:** S.
- **Делаем:** создать `.agents/skills/bidplace-ui/SKILL.md` **из §12** (поправить под фактические имена после W1–W6a, ничего не добавляя); строка-указатель в `AGENTS.md` (Skill Selection); переписать `apps/mobile/src/components/README.md` под реальность (AppShell fluid, одна шторка, нет `DestructiveButton`); `docs/design/03 §6.1` и `02`, `10-CODE-ARCHITECTURE.md` (границы shell/overlay) — по одной правке; обновить `11-PROJECT-STATUS`.
- **Готово когда:** skill ≤ ~110 строк; нет копий owner-доков (только ссылки); `rg` по README не находит несуществующих компонентов; `format:check` для изменённых md не краснеет.

### 17.4 Backlog (по триггеру, не по умолчанию)

| #   | Что                                                                                                                                                                                   | Триггер                                                                                 | Модель                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------- |
| B1  | `SearchOverlay` → `AppDialog fullscreen`, удалить хуки `use-dismissible-overlay`/`use-overlay-focus-trap`/`overlay-focus`/`dismissible-overlay`, `OverlayDimmer` (−217 src/−363 spec) | после W1–W6 принят, нужен выигрыш в поддержке; риск — фокус/клавиатура iOS              | sol `medium`          |
| B2  | Единая `GradientBorder` (5 механизмов)                                                                                                                                                | баг в одном из мест или решение дизайнера об упрощении                                  | terra `high`          |
| B3  | `react-hooks` + `jsx-no-leaked-render`                                                                                                                                                | сначала измерить: `eslint` с правилами в `warn` → число нарушений; включать, если ≤ ~30 | terra `low`           |
| B4  | Auth-sheet: каркас `AuthViewport` → `AppDialog`, единый `useLeaveGuard` вместо двух history-схем                                                                                      | баги навигации/истории                                                                  | sol `medium` (+spike) |
| B5  | Экраны-гиганты (`seller-profile` 1693, `product-draft` 1346, `auth-form` 1192)                                                                                                        | отдельная волна рефакторинга, не дизайн                                                 | terra `high`          |
| B6  | `useFonts` блокирует рендер; `@react-navigation/native` ради `ThemeProvider`                                                                                                          | отдельная задача                                                                        | luna `medium`         |
| B7  | Миграция `design/figma-handoff` → новая выгрузка (при замене auth/buttons/fields/search новым Figma)                                                                                  | дизайнер подтвердил новые макеты                                                        | luna `medium`         |
| B8  | `git worktree prune`/уборка ≈ 50 старых worktree                                                                                                                                      | по желанию                                                                              | вручную               |

### 17.5 Что ponytail вырезал из прежнего плана (§11)

Не делаем сейчас: три новые зависимости `@rn-primitives`; переписывание `AuthViewport`; перенос `SearchOverlay`; единая `GradientBorder`; понижение 133 одноразовых токенов; чистка всех нечётных значений разом; включение `react-hooks`/`leaked-render` вслепую; вынос экранов-гигантов. Не проверялось: поведение на реальном iOS Safari/PWA; desktop-кадров профиля нет ни в capture, ни в просмотренных секциях живого Figma (§18.3).

### 17.6 Протокол координатора на каждую волну

1. Координатор пишет **самодостаточный бриф**: контракт §17.2 + раздел волны + SHA базы + список файлов-владельцев (без «изучи сам, где что»).
2. Вы запускаете Codex с явной моделью/effort в worktree `~/projects/bidplace-ds`.
3. Координатор принимает по чек-листу «Готово когда»: `git diff --shortstat`, grep-приёмка, фактический вывод проверок, скриншоты. Проверки **перезапускаются** координатором выборочно (typecheck/lint/узкие vitest) — отчёту исполнителя на слово не верим.
4. Исход: принято → следующая волна; точечные правки → один короткий повторный бриф; ошибочная предпосылка → пересборка плана.
5. Раздельный учёт: локально сделано / запушено / смержено / задеплоено (никогда не смешивать).

## 18. Сверка с живым Figma `[DONE]` (только чтение; Figma не изменялся)

Источник: файл `pAPQo6cADmG5XzVmBX76EE`, инструменты `get_metadata` и `get_design_context` (без `use_figma`/записи). Просмотрены секции **05** Фильтры и сортировка (`7008:1756`), **06** Страница работы (`7008:9954`), **07** Страница автора (`7008:12974`), **08** Личный профиль (`7008:26851`), **09** Ставки и покупки (`7008:16625`), **10** Избранное (`7008:18185`), **12** Вход и регистрация (`7008:20542`), **13** Стать автором (`7008:23430`), **14** История создания (`7008:27134`). Секции 01–04 и 11 **не просматривались** (ссылок не было, перечислить их через страницу «Структура» не удалось). Живой Figma выигрывает у локальных выгрузок.

### 18.1 Размеры: правило «габарит − 1» подтверждено значениями из Figma

| Узел                                         | Габарит в Figma | Устройство                                                                                              | Размер для кода |
| -------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------- | --------------- |
| `Кнопки` `7008:1868` (кнопка шторки фильтра) | 55              | padding 16×14, строка 26, обводка 0.5 `#2a2a2a`, radius 80, `Inter Medium 14/26`, `letterSpacing −0.28` | **54**          |
| `Поля ввода` `7021:2938`                     | 51              | padding 12×13, строка 24, обводка 0.5 `--gray-3 #999`, radius 18, `Inter Regular 14/24`                 | **50**          |

Габариты всех `Кнопки` в секциях 05/06/07/12: 23, 37, 39, 41, 42 (42.02/42.14), 43, 47, 51, 55; `Поля ввода`: 51, 61. Каждое «нечётное» = чётное + 1 (22, 36, 38, 40, 42, 46, 50, 54; 60) — то есть это **не случайный шум, а одно правило** (outside stroke 0.5×2). Дробные 42.02/42.14 — масштабирование верхней строки профиля, роль та же `sm 42`.

Следствия для плана:

- **Q5 уточнён:** `input 51→50` (не 48); кнопки 42/46/50/54 подтверждены. Остальные нечётные значения (`codeCellHeight 61`, `passwordHeight 51`, `screenPasswordHeight 53`, `filterSortBar 43`, `choiceChipRemovable 39`) воркер W3 приводит по тому же правилу **только** при наличии узла-габарита; нет узла — не трогает и перечисляет в отчёте.
- В RN обводка лежит внутри бокса, поэтому высота задаётся явным `height` из токена, а не суммой `padding + strokeWidth` (корень «43 вместо 42», §3 T7). Отражено в W3.

### 18.2 Табы: в Figma два паттерна

- **Каталог** (05): «Все работы / Аукционы / Анонсы / Архив» при x = 12 / 117 / 211 / 287, высота 25, подчёркивание 2 px — **ширина по содержанию**. (Состав вкладок конфликтует с DEC-083/087, §5b; реализуется только то, что разрешено решениями.)
- **Профиль автора** (07·01): три **равные** колонки по 122 при x = 12 / 134 / 256 («Работы 4», «Архив 8», «Об авторе»), высота 53–54, текст по центру, вертикальный padding 16.
- В 09 вкладки «Ставки / Покупки / Избранное» — отдельный паттерн; устройство не разбиралось, в W5 не трогаем.

Вывод: единый `Tabs` обязан поддерживать оба режима (по содержанию / равные колонки) одним пропсом; W5 обновлён. Это снимает мою прежнюю формулировку «равные колонки везде».

### 18.3 Композиции и геометрия

- **Только 390.** Во всех просмотренных секциях кадры шириной 390 (`Mobile`); desktop/tablet-композиций Bidplace нет. Правило контейнера 1280 + gutter 12 держится на решении дизайнера, не на геометрии → `NEEDS-FIGMA` для 1024/1440 сохраняется (L11).
- **Gutter 12 подтверждён:** контент начинается с x = 12 и имеет ширину 366 (= 390 − 24) во всех секциях.
- **Шторки:** фильтр 390×362, контент x = 20 (350), ручка 36×4, нижний отступ 40; шторка контакта в «10 · Избранное» — нижний отступ 20 → правило «40 или 20» (Q6) подтверждено. Диалог выхода в «13 · Стать автором» 366×200, кнопки 159×55 (→ `xl 54`).
- **Профиль автора (07·01):** витрина — **одна колонка** карточек 366×488, gap 20; верхняя строка — кнопки 42 (gap 2); соцкнопки 43×43 с иконкой 22; фильтр/сортировка — кнопки высотой 43.
- **«Об авторе» (07·02):** «Биография», «Практика и подход» (блоки 366, заголовок 21, текст 140), затем горизонтальная лента «Выставки и достижения»: карточки шириной 266, gap 16, сверху маркер 14×14 + линия 1 px и дата («Апрель 2026»), 4 карточки = 1112 → горизонтальная прокрутка. Содержимое входит в `05-MVP-RFC` (строки 141, 164) и в `AuthorAbout.tsx`; W6a сверяет числа, контент не переписывает.
- **Dock (07·01):** 358×64 при x = 16 (inset 16): «Навигация» 288×64 (пять иконок 36×36 с шагом 56) + отдельный круг 64×64; в кадре 874 стоит на y = 760 (низ на 50 px от края — **гипотеза:** 16 + 34 safe area, не проверено). W2 при введении `useDockInset()` сверяет текущий токен с этими числами.

### 18.4 Расхождения и открытые вопросы (ни один не блокирует W0–W2)

1. **«Инпут 48 (в Figma 49)»** — такого узла в просмотренных секциях нет (поля 51 → 50). Нужен node-id поля с габаритом 49; без него действует 50. Вероятно, это поле другого экрана (например, шторки торгов), которого нет в секциях 05–14, либо речь о другом компоненте. **Вопрос дизайнеру.**
2. Табы профиля содержат «Архив» → §5b (DEC-083/087), решение основателя нужно до реализации, не раньше.
3. Секции 01–04 и 11 не видел: если в них есть desktop/tablet-кадры — дать ссылки, иначе `NEEDS-FIGMA` для 1024/1440 остаётся.
4. Локальные выгрузки `design/figma-handoff` построчно с живым Figma не сравнивались (по профилю совпало: три вкладки по 122) — остаются «вторичными».

### 18.5 Одобрено основателем (2026-10-13, «везде да, одобряю»)

Q5–Q8 (с уточнением Q5 выше), текст записи decision log для W2 (Fluid container), пересмотр Q8 (без новых `@rn-primitives` по умолчанию) и весь план волн W0–W6b. Следующий шаг — запуск W0 для Codex (terra `medium`) по команде «go».

## 19. Промты волн `[DONE]`

Готовые промты — `docs/audits/2026-10-13-wave-prompts/`: `_common.md` (контракт исполнителя), `W0.md … W6b.md`, `README.md` (как запускать и принимать). Исполнитель не видит этот аудит, поэтому факты Figma и текст нужных решений вшиты в сами промты. Принятые при написании промтов уточнения плана:

- **W0 = terra `medium`, объём шире.** Ссылки на Pen — в ~40 файлах. Нормативные документы (`AGENTS.md`, `docs/design/00,01(только строки Pen),02,03,05,06`) переписываются; журналы и история (`docs/design/04,07,08`, `docs/product/11,12`, `docs/tasks/**`, `docs/audits/**`, `docs/legal/**`) получают одну строку-баннер или не трогаются. `design/bidplace-v2-visual-exploration` (не Pen) остаётся. Это `DEC-119`; запись о fluid-контейнере в W2 — `DEC-120`.
- **Исполнитель не коммитит** (песочница не пускает в `.git` worktree, приёмка идёт по diff); тег `pen-v2-pre-removal` и ветки создаёт координатор.
- **E2E (Playwright) требует диспозабл-Postgres и web-сервер** (`apps/mobile/e2e/README.md`): в песочнице исполнителя они, скорее всего, «not run»; обязательны `typecheck`, `lint`, vitest и prettier по изменённым файлам, e2e гоняется там, где есть окружение.
- W3 использует правило «габарит − 1» (§18.1) и сначала просит исполнителя привязать каждое нечётное значение к узлу Figma, а не «чинить всё подряд».

## Журнал прогресса

- [x] §19 Промты волн записаны (`wave-prompts/`); запуск — по «go»
- [x] §18 Сверка с живым Figma (только чтение): правило «габарит − 1», input 50, два паттерна табов, только 390; открытый вопрос про «48»

- [x] §17 Волны оптимизации (W0–W6b, backlog B1–B8); следующая — W0
- [x] §16 Ответы на вопросы и инвентаризация устаревших источников (удаление **не выполнялось**)
- [x] §0 Baseline
- [x] §1 Решения дизайнера
- [x] §2 Layout architecture (L9, L4/§7.3 и desktop-композиции — H/NEEDS-FIGMA)
- [x] §3 Tokens
- [x] §4 Shared components
- [x] §5 Screens, ограждения, дрейф источников правды (5a), конфликт Figma ↔ DEC-083/087 (5b)
- [x] §6 Overlay / animation; §6a самописное против библиотек
- [x] §7 Known problems (по одному)
- [x] §8 Findings table + честная оценка
- [x] §9 Target architecture
- [x] §10 Token policy
- [x] §11 Migration plan (5 PR)
- [x] §12 Skill `bidplace-ui` (текст, **файл не создавался**)
- [x] §13 Before/After
- [x] §14 Variant comparison + ответ на главный вопрос
- [x] §15 Открытые вопросы (grilling)

Что **не** сделано и почему: live Figma — сделано частично (§18; секции 01–04 и 11 не просмотрены); браузерные прогоны 440/768/1440 (аудит read-only, без запуска приложения); desktop-геометрия профиля (в capture только 390). Эти пункты помечены `H` / `NEEDS-FIGMA`.

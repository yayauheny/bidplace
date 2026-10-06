# bidplace — дизайн-система Pen v2

Последнее обновление: 2026-09-18

Статус: **Figma mobile-web 390 tokens and primitives are the production visual layer; Pen measurements remain historical**

## 1. Архитектура источников

```text
protected Pen masters
        ↓ visual extraction
code design tokens + shared primitives
        ↓ composition
shared feature components
        ↓
route screens and verified states
```

Pen masters не импортируются и не генерируются автоматически в production.
Точные значения измеряются из `bidplace-web-v2.pen`, документируются в pull
request и реализуются в существующей архитектуре. Любой exporter работает
только read-only и не может сохранить изменения в canonical Pen.

## 2. Token policy

Canonical canvas, local byte copy and public read-only publication проверены.
Ниже закреплены повторяющиеся значения, реально встречающиеся в экспортированных
canonical nodes; это baseline, а не разрешение копировать одноразовые magic
values.

После проверки values группируются как минимум в:

- color: canvas, surface, surface-warm, text, muted, divider, action,
  destructive, success, warning, focus;
- typography: display, title, body, label, metadata, numeric/auction;
- spacing: page gutters, section gaps, component gaps, compact gaps;
- shape: control, card, media and panel radii;
- elevation/border: только реально используемые Pen levels;
- motion: menu, tab, sticky player и loading transitions;
- layout: content max-width, grid columns, card width and breakpoints.

### Measured visual baseline

| Role                         | Pen value / evidence                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| Primary type                 | `Onest` для headings, cards и content; `Inter` для header/navigation и части overlays |
| Canvas/surfaces              | `#FFFFFF`, `#FBFBF8`, `#F7F7F5`, `#F1F1ED`                                            |
| Primary text/action          | `#1A1A1A`, header action `#090909`                                                    |
| Muted text                   | `#3E3E3A`, `#6B6B66`, `#6F6F69`, `#777771`/`#777772`                                  |
| Dividers/borders             | `#DADAD3`, `#E5E5E1`                                                                  |
| Header search                | 480×48, radius 24, fill `#F1F1ED`                                                     |
| Header primary action        | height 40, radius 20, dark fill, white text                                           |
| Discovery menu               | 240 px, radius 26, bottom-start placement                                             |
| Account popover              | 280 px target, radius 22, white surface and floating elevation                        |
| Creator media                | square viewport, radius 12, no outer card surface                                     |
| Catalog controls             | height 36, radius 18, horizontal padding 13, `Onest` 14/500                           |
| Auction card example         | 322×456, media 322×322, radius 12, info surface `#F7F7F5`                             |
| Platform content container   | starts at x=104 at 1440 desktop, width 1232; aligned to the left edge of `Аукционы`   |
| Responsive gutters           | tablet 48 px; mobile 16 px                                                         |
| Platform column gap          | 40 px for public content-page compositions                                         |
| Wizard workspace             | centered 1088 px: 600 px primary + 48 px gap + 440 px preview; top offset 56 px    |
| Tablet wizard workspace      | centered 928 px: 500 px primary + 32 px gap + 396 px preview                       |
| Card title                   | `Onest` 16/700, line-height 20                                                        |
| Card creator/metadata        | 14/500; metric label 12/500; metric value 16/700                                      |
| Creator profile card example | 340×526, media 340×380                                                                |

Exact semantic token names and repeated-value clustering выполняются в WP1.
Card dimensions in the table are canonical screen variants; the reusable
`k5vYGf` reference below remains 322×456. Implementation selects the measured
variant by canonical consumer, not by stretching one card with arbitrary CSS.
Browse Works, Browse Authors, Product and Creator content pages use the Pen
platform contract: `page-content-start-desktop=104`,
`page-content-width-desktop=1232`, `page-column-gap=40`,
`page-gutter-tablet=48`, and `page-gutter-mobile=16`. Wizard, application,
review and status screens use the centered `WorkspaceLayout` (`KyWoR`) contract:
`workspace-width-desktop=1088`, `workspace-primary-desktop=600`,
`workspace-preview-desktop=440`, `workspace-gap-desktop=48`, and
`workspace-top-desktop=56`; tablet uses `500 / 32 / 396`. Mobile remains a
single column with the 16 px platform gutter and collapsible preview. Four-column
consumers keep their 24 px internal grid gap and size `fill_container` cards
from the shared platform container. The H5vf2 toolbar order is facets → title → state
tabs/sort; the unsupported `Тип работы` facet remains intentionally omitted
until its domain field is approved.
Onest/Inter weights and Cyrillic coverage подтверждены runtime-сборкой.
`designTokens` в `packages/design-tokens/src/tokens.ts` — единственный runtime
контракт; визуальным authority остаётся immutable Pen v2.

## 3. Canonical components

### GlobalHeader `L9UV9`

Единая composition для public surfaces. Включает DiscoveryGroup `SYE9r`,
Search `VKsEM`, UserActionsGroup `AG6gK`, SearchBar `Uulvx`, HeaderNav `BF8Nr`,
NavDropdownTrigger `MsOKe`, NavDropdownMenu `SHHWu`, Works item `B0EaXH`,
Authors item `VUDwA`, HeaderActions `hLoyZ`.

Implementation invariants: route-aware links, capability-derived actions,
semantic nav/menu/search, full keyboard model, Escape/outside close, focus
return и mobile alternative. Disabled product concepts не маскируются под
рабочие actions.

### AuctionCard `k5vYGf`

Размер reference: 322×456, media 322×322. Artwork `frTbO`, information `jKYlO`.
Один master используется в Browse Works и Creator Profile; Home variants могут
переиспользовать его данные, но не создавать несовместимую auction semantics.

Обязательные данные: image state, title, creator, current/starting bid,
status/deadline. Entire-card navigation не должна конфликтовать с вложенными
interactive controls. Цена и countdown приходят из canonical snapshot.

### CreatorCard `SrXPq`

Размер reference: 322×383. Photo `k9hN07`, name `atoev`, discipline `sUQFf`.
Production variant — базовый A. Bio `S1BHg` и board `BvSRz` — comparison only.
Карточка не вычисляет и не показывает неподдержанные creator metrics.

### AuctionPlayer `X6Ksg`

Bid `w8O9kE`, time `k7l1d`, button `xozqk`. Это одна горизонтальная
404×68 transaction composition с 124×44 action, которая может находиться
inline или sticky, но не раздваивает state. Открытое поле суммы ставки остаётся
соседним form-control, а action вызывает тот же server-backed mutation.

Обязательные states: scheduled, live/eligible, live/needs OTP or rules,
submitting, accepted, stale/refetch, validation error, ended/won/lost, disabled
by role. Server остаётся источником minimum, status, deadline и acceptance.

### ProductTabs `Jh9jr`

About `CBb5S`, Creation `bzabH`, Bids `ryIwP`, active underline `KSVlN`.
Реализация использует semantic tablist/tab/tabpanel, arrow-key navigation,
focus visibility и согласованный URL/back contract.

### Shared image-derived atmosphere

`AmbientImageBackground` is the single shared shell-level atmosphere primitive
for Product About and Creator Profile. It uses the route-provided public image
URL only as a blurred visual layer, keeps the sharp image/content accessible,
adds a neutral veil and a light lower fade, and falls back to the warm page
surface when media is absent or fails. It is decorative, pointer-inert and
reduced-motion aware; Product and Creator do not own separate blur
implementations.

### Page states

`PageState` owns empty, not-found and other screen-local messages, plus compact
inline loading copy where content chrome stays on screen. Blocking page fetch
uses `InfrastructurePageStatus`: one `AnimatedBidplaceLogo` at 104px with
semantic `motion` `loading` | `error`. Loading is the mark only (CSS bounce
loop, 900ms, 16px, transform-only). Pending → error finishes the current bounce
via `animationiteration`, then blinks the eyes group twice (520ms) and reveals
canonical copy in `workTitle` (20/24 semibold, max 300px) plus a large outline
«Повторить». Success unmounts immediately. `motion="glance"` is reserved for
later dock interaction and is not wired here.
`InfrastructureErrorState` keeps `presentation="page" | "inline"`; page mode
composes `InfrastructurePageStatus`. Inline presentation keeps copy + outline
retry without the logo, for Search, catalog lists, seller works tab, and author
achievements. Feature screens pass only query status and `onRetry`.
Public infrastructure errors use `InfrastructureErrorState`. The unused
`SessionAlert` banner was removed and is not mounted.

## 4. Screen compositions

| Composition      | Root     | Reuses                                        |
| ---------------- | -------- | --------------------------------------------- |
| Home             | `BJd1P`  | GlobalHeader, auction/creator/editorial cards |
| Browse Works     | `H5vf2`  | GlobalHeader, AuctionCard, controls           |
| Browse Authors   | `N4ebBk` | GlobalHeader, CreatorCard, controls           |
| Product About    | `L7ytbv` | GlobalHeader, ProductTabs, AuctionPlayer      |
| Product Creation | `cK8kD`  | ProductTabs, AuctionPlayer                    |
| Product Bids     | `XIzHe`  | ProductTabs, AuctionPlayer, semantic table    |
| Creator Profile  | `MqUMz`  | GlobalHeader, AuctionCard                     |

## 5. Controls and interaction rules

### Shared atmosphere and accordion invariants

`AmbientImageBackground` is the single shell-level atmosphere primitive for
Product and Creator Profile. Its media layer is clipped by the outer bounds,
overscanned by a bounded 1.1 scale, and fades through one explicit linear
gradient into the warm surface. Product About accordion rows use one symmetric
toggle behavior: the active row closes when activated again, and the control
exposes its expanded state.

- Buttons and links remain visually and semantically distinct.
- Dropdown/menu is not a generic select; sort/filter controls use appropriate
  listbox/select semantics.
- Implementation: catalog sort and filter use `components/figma/FilterSheet.tsx`
  through `features/discovery/CatalogFilterSheet.tsx`. The unused
  `components/layout/FilterMenu.tsx` dropdown was removed.
- Status chips are informational unless the contract makes them controls.
- Loading disables only the action in progress and keeps result/error legible.
- Destructive actions retain explicit confirmation where product docs require
  it.
- Focus cannot be clipped by overflow, sticky surfaces or rounded media.
- Animation supports reduced motion and never delays bid feedback.

### Motion tokens

| Token / pattern  | Target                            | Easing                       | Invariant                                |
| ---------------- | --------------------------------- | ---------------------------- | ---------------------------------------- |
| `motion.fast`    | 120–180 ms                        | `cubic-bezier(0, 0, 0.2, 1)` | press, icon, focus-color                 |
| `motion.control` | 180–220 ms                        | same                         | button/chip/fill/border                  |
| `motion.media`   | 300 ms                            | same                         | card artwork scale/crossfade             |
| `motion.panel`   | 180–240 ms open; 120–180 ms close | same                         | menu, popover, toast                     |
| `motion.layout`  | 220–300 ms                        | same                         | tabs underline, accordion, inline→sticky |

Live Avant Arte verification on 2026-08-10 showed artwork hover
`transform: scale(1.05)` with a 300 ms `cubic-bezier(0, 0, 0.2, 1)` transition.
This becomes the default catalog-card media pattern unless canonical crop QA
requires an explicitly documented per-component exception.

### Creator identity header (web 390)

Sticky creator header has two product states: `expanded` and `compact`. Scroll
hysteresis chooses the state from measured hero geometry: `scrollTop >=
heroHeight - compactStack` collapses, `scrollTop <= park - 20` expands;
between those values the current state is kept. Unmeasured height stays
expanded. Web sticky is CSS (`top: -(heroHeight - compactStack)`). Expanded
`CreatorHero` is a static Figma layout. One `CreatorIdentity` stays mounted;
compact only restyles the same avatar, handle and actions nodes. Reanimated
`LinearTransition` (`200ms`, `cubic-bezier(0.2, 0, 0, 1)`,
`ReduceMotion.System`) interpolates those layout changes. Tabs are not in
that animation.
Compact row: avatar `20 / 12` 48×48, handle `76 / 26.5`, actions
`y=12`, tabs `y≈80`. Web compact stack is `stickyDock.actionHeight`
(`space.x3 + size.header + space.x5` = 80), plus `stickyDock.tabsHeight` 26.
Figma scrolled `526:14524` remains `76 / 58.5` under iPhone inset `y=44` /
tabs `y=186`; those tokens stay canonical. Reduced motion keeps the same
thresholds and snaps the layout change.

### Work identity header (web 390)

Work uses the same `stickyDock.*` visual contract as Creator compact, with
different sticky physics. Expanded rest is gallery media 520, dots after
`space.x3`, identity after `sectionGap` 20, tabs after `space.x10` 40. One
Back/Share pair stays mounted in `StickyDockActionRow` and overlays the
gallery at `20 / 12` 48×48. Those nodes pin with CSS sticky at the same
coordinates; they do not remount or run `LinearTransition`. Screen hosts own
the `stickyDock.fullHeight` slot. Presentational `StickyDockSurface` fills
that host and stays transparent until Work tabs stick at
`top: stickyDock.actionHeight`. Activation is
`surfaceActive = !entry.isIntersecting` (observer root the product
scrollport, top `rootMargin` `-stickyDock.actionHeight`). Then it fades to
the shared navigation glass (`FigmaGlassSurface preset="navigation"`,
`borderRadius: 0`, `motion.control`, `cubic-bezier(0.2, 0, 0, 1)`,
`ReduceMotion.System`). Creator compact uses the same material behind
identity and tabs. Docked tabs set `surface="transparent"` so they do not
paint a second canvas. Tab labels use `contentInset={space.pageGutter}`;
the tablist divider stays full-bleed. Gallery and identity scroll away
naturally. Native Work stays expanded-only.

### Auction/Product card states

- Media viewport uses `overflow: hidden`; outer bounds never change.
- Default artwork is `scale(1)`; pointer hover and appropriate
  `focus-within` emphasis use `scale(1.05)` over `motion.media`.
- Only the image transforms. Title, creator, price, deadline and surrounding
  grid do not translate or reflow.
- Primary dark action uses semantic action fill; hover becomes visibly darker,
  pressed state is immediate and never lowers text contrast.
- Secondary/bottom pill may use a translucent neutral surface; hover increases
  opacity/contrast instead of making the label faint.
- Card remains usable on touch; hover is enhancement, not the only discovery
  or action signal.

### Menus, filters, tabs and feedback

- Menu/popover enters from `opacity: 0` and `translateY(-4px)` to rest;
  closing is shorter. Caret rotates 180° with `motion.control`.
- Backdrop blur is permitted only on overlay/sticky surfaces with an opaque
  semantic fallback and WCAG-compliant text contrast.
- Tab underline moves with `motion.layout`; panel content crossfades in
  160–200 ms without delaying data or focus.
- Toast enters in 180–240 ms, remains long enough to read, exposes an
  accessible live-region message and never covers the auction action.
- `SlideToBid` uses a 56px track with a 4px inset, a bounded 360/488 control
  ratio on the canonical desktop width, 92% completion threshold, horizontal
  direction lock and spring-back on early release. Loading holds the control
  at the completion edge; a tap is not a bid confirmation.
- AuctionPlayer inline→sticky transition keeps one state owner and the same
  focused control; no remount, duplicate countdown or duplicated mutation.

### Artwork-derived atmosphere

Product/creator hero may render a duplicate of the same artwork behind the
sharp media. The atmospheric layer is absolute, covers the section, is enlarged
approximately 1.08–1.15, blurred 40–80 px and covered by a neutral veil chosen
for text contrast. It is decorative, hidden from the accessibility tree and
never replaces the canonical image. Media changes crossfade around 260 ms;
there is no continuous parallax.

### Reduced motion and performance

Under `prefers-reduced-motion`, disable scale/translate/parallax and use an
instant change or opacity transition no longer than 100 ms. Animate only
compositor-friendly `transform`/`opacity`; do not animate layout dimensions for
cards or filters. Large blur layers must be clipped, size-bounded and profiled
on target devices; a static semantic surface is the accepted performance
fallback.

## 6. Responsive derivation

Desktop measurements are exact acceptance targets. Tablet/mobile states are
derived before coding each component and recorded in handoff:

- 1440: canonical composition and grid;
- 1024: reduced gutters/columns with preserved content order;
- 390: single-column reading flow, safe-area actions and non-overlapping header;
- intermediate widths: no accidental horizontal scroll or orphan controls.

Breakpoints follow composition pressure, not device names. A component is not
complete if it matches only the 1440 frame.

## 6.1. Figma portfolio primitives — mobile-web 390

Read-only source: Figma inspect copy `uMo04w9bgrchWXXDgO4W62` (`DEC-085`).
Values live in the only `designTokens` export (`figmaTokens` alias).

`AppShell` is a centered 390 column plus `FloatingDock`. Wide windows keep the
same column. 1024/1440 compositions are out of this wave.

`FloatingDock` is one 232×64 glass capsule: Главная / Поиск / Добавить /
Профиль. Search is an item inside that capsule. Dock Search opens a fullscreen
`SearchOverlay` over the current page (`DEC-096`) using the `FilterSheet` Modal
pattern and the shared overlay focus trap: pill field + circular close, then
Категории / Авторы / Работы chips. `FilterSearchField` stays the catalog field
(floating label, radius 18). Overlay search is a stadium canvas field with
`border` `#DEDEDE` 0.5px (Figma `439:4789`), not `searchSurface` grey and not
the catalog field. Author/Category/Work hits use a shared hover fill/ring
(`ghostHover` / inset `border`) without changing layout.
`WorkCoverCardGrid` may render one catalog column or a two-column overlay grid.
The 64×64 search FAB and the
288×64 five-icon cart pill are unused variants (`DEC-088`). Web portals the
dock to `document.body` and uses CSS `backdrop-filter`. Native `expo-blur`
files ship for Metro and are not part of the web claim.

Cover cards keep title + `@author` and web frost only. Public grids call
`WorkCoverCard` / `AuthorCoverCard` directly. There is no `AuctionCard`
runtime wrapper.

Web author tabs use Inter Medium 16/19 −0.32 for the label and Inter Regular
12/14 −0.24 for an absolutely positioned count (`typography.profileTab` /
`typography.profileTabCount`). Inactive label is `tabInactive` `#565656`
(`621:19524`); active is `ink` `#2A2A2A` (`621:19532`). Native `FigmaTabs`
inline label+count is a Metro pair, not the web typography claim.

Public Creator About (`621:19475`) keeps section titles `profileHeading`
17/21/600/−2% `#2A2A2A` (`621:19536` / `621:19539` / `621:19577`). Body is
`bodySmall` 14/20/400/−1% `#2A2A2A`. Atmosphere `621:19476` is a 485 layer
blur 80, white veil 0.4, opacity 0.5, bottom radius 200, left −47 inside
the 390 frame. It is not stretched to `100vw`. Shared `onGlass` chips
(`FigmaChip` web) paint glass `#FFFFFF` @ 0.8 plus a **1px outside
gradient ring** `#DEDEDE`→`#F3F3F3` (Figma `White border block`,
`renderBounds` −1). The gradient is mask-excluded from the interior so it
cannot tint the translucent fill. Creator profile chips `621:19490` use
that ring at pad 6/16, Inter 16/23/500 `#2A2A2A`. Work metadata chips
`745:21232` use the same ring at pad 6/12, Inter 14/17/500 `#565656`.
Location line is city only (`621:19487`). Achievement rail uses Frame 219 marker `744:20554` (14px `#565656`
circle, 3px pad, 10px white hole, radius 21) plus 2px `#565656` line
`744:20556`. Dates are `MM.YYYY` from `621:19580` (Inter 17/24/500/−3%).

Public catalog intros (`526:12957`, `526:13308`) reuse `bodySmall` default ink
14/20/400/−1% `#2A2A2A`. They do not use `tone="secondary"` /
`textSecondary` `#8A8A8A`. `/works` does not render catalog-segment tabs
(`874:5421` / `526:13314`); order matches `/authors`: title → intro →
Filter/Sort → cards. Work hero chrome (`745:21332`) is a 48×48 glass Back
plus Share, 12px from the web hero top (Figma y 62 minus the 50px status
bar). Like stays hidden. Inactive gallery dots (`745:21219`) use
`color.border` `#DEDEDE`, not `divider` `#E2E2E2`.

On web, `global.css` sets `html { font-synthesis: none }` so expo-font Inter
faces are not faux-bolded.

Shared `ShareSheet` renders a copy action and a downloadable PNG QR for
validated public `/works/:id` and `/authors/:slug` paths on the current
origin. Work and Creator open the same `AppDialog` sheet. A sheet enters
from below, exits downward, and the backdrop fades (`motion.control`,
`cubic-bezier(0.2, 0, 0, 1)`, reduced motion). Geometry is unchanged. The
native branch is a stub.

On web AppDialog focuses its close control when opened. A sheet also completes
initial focus after its entering animation if focus is still outside the dialog;
it never steals focus already inside. The existing Escape/trap/return-focus
behavior and motion geometry remain shared with the Work FULL viewer.

Filter/sort sheets are dialogs with radio/checkbox rows, local draft, and
Apply/Reset. They are not `role="menu"`.

Home Opening (`439:4404`, 390×860) uses exact first-fold roles. Bio and
curator heading use the Figma TEXT box heights as line-height because the
live inspect composition is 14/17 and 20/24. The title uses shared
`sectionTitle` (same 24/29/600/−0.72 as other Home headings). Tracking is
kept only where Inspect sets it. Bio stays `authorRowBio` 14/17/400 with
seeded `shortDescription` (logical break kept). First-fold visual is one
muted caption line with renderer tail truncation; the author row hugs
`439:4411` instead of a 68px lock.

| Role | Node | Token |
| --- | --- | --- |
| «Открытие недели» | `439:4408` | `typography.sectionTitle` 24/29/600/−0.72, `color.ink` |
| Handle `@slug` | `439:4414` | `typography.authorRowHandle` 22/25/500/−1%, `color.ink` |
| Bio | `439:4415` | `typography.authorRowBio` 14/17/400, `color.textSubtle` `#6F6F6F` |
| «Выбор куратора» | `439:4417` | `typography.editorialTitle` 20/24/500/−2%, `color.ink` |
| Curator note | `439:4418` | `typography.editorial` 16/22/400/−1%, `color.textSubdued` |
| Profile pill | `439:4419`/`439:4420` | `FigmaButton` `quiet`+`compact`: hug, pad 8/14, `radius.chip` 28, flat control fill `quietFill` `#EFEFEF`, outside 1px stroke `#FFFFFF`→`#999999` @ 0.16 (Figma `renderBounds` −1), label `typography.buttonCompact` 13/18/500 |

Do not reuse `authorHandle`, `authorName`, `body`/`bodySmall`, `cardTitle`,
`muted`, or global `outline` for these roles.

Home «Новые работы» reuses Figma Active-auctions Frame `439:4478` as layout
only: `sectionTitle` + hug `FigmaButton` `quiet`+`compact` «Смотреть все»,
then a horizontal `WorkCoverCard` scroller (`264×352`, gutter/gap 12).
Cards stay title + `@author` frost — no price, timer, or «В продаже».
Inter-section stack after Opening is `space.homeSectionStack` 67 (Opening
`439:4406` bottom 533 → section top 600). Do not implement the later
stacked/rotated Figma «Новые работы» prototype as New works.

Home «Новые авторы» reuses Frame 47 `436:1320` as geometry only: centered
`sectionTitle`, rear 308×410 at left −1° / right +1° / 0.5 opacity around
`transform-origin: 0 0` (Figma top-left), front 322×430, full
`PrimaryButton` «Смотреть все». Cards are `AuthorCoverCard` sized to those
boxes (`size` + `frameRadius` 24 + `interaction="static"`). Stack is
position/rotation wrapper → rounded shadow shell (`overflow: visible`) →
clipped card. Front shadow is `0 6px 20px rgba(58,58,58,0.40)` on the 24px
shell, not the anonymous wrapper. Catalog `/authors` radius stays 28. No
work price/timer/status. The 366 wrapper does not clip (`clipsContent: false`);
page width stays 390.

## 6.2 Field focus

`FigmaTextField` draws focus, error, and disabled with the shell border.
On web, the control inside that shell suppresses the browser outline so the
shell stays the only ring. `apps/mobile/global.css` still draws
`input:focus-visible`, `textarea:focus-visible`, and
`[role='textbox']:focus-visible` for controls outside that component.
Click and Tab still move focus and change the shell border.

## 7. Old system boundary

`docs/modern-ui` and its design language are retired. Runtime public screens
use `apps/mobile/src/components/figma` and wrappers in `components/ui`. There
is no nested Figma token object. Figma is the production visual source for
mobile-web 390 (`DEC-085`); the protected `.pen` file is historical and unused
at runtime.

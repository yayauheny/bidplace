# bidplace — дизайн-система

Последнее обновление: 2026-10-10

Статус: **Figma mobile-web 390 tokens and primitives are the production visual layer**

## 1. Архитектура источников

### Current brand/fullscreen auth target — 2026-10-08

`DEC-106` replaces the eye mark with the supplied brush mark. Exact mark and
outlined wordmark, measured auth slots and provenance:
[`2026-10-08-brand`](../../design/figma-handoff/branding/2026-10-08-brand/README.md),
[current fullscreen source](../../design/figma-handoff/auth/2026-10-08-auth-fullscreen/STYLES.md).
These are verified handoff assets, not installed tokens or completed runtime UI.
The original SVG is #111111 on white; auth vectors are #121212. The original is
preserved; auth derivatives follow the capture. Keep one shared brand foundation
and semantic auth variants. Do not substitute arbitrary lettering or stretch
the mark into its safety slot. On the 390×874 frame the mark and wordmark stay
on their source insets and the form stays centered. When that centering would
meet either mark, `AuthViewport` scrolls the form in the band between them.
The center-or-band choice reads padded dialog height and content
`onLayout`; it does not clear those measurements on viewport resize.
Scroll resets to the top when height changes.

### Auth sheet presentation — 2026-10-07

`DEC-105` uses
[`2026-10-07-auth-dialogs`](../../design/figma-handoff/auth/2026-10-07-auth-dialogs/README.md).
Measured sheet, OTP, password, provider, and exit spacing still live in
`designTokens.auth` from that handoff. Runtime text actions no longer use removed
`authPrimary` / `authQuiet` / `authProvider` variants; they map onto the shared
text-button matrix in [§6.2](#62-shared-text-button) (`solid`, `outline`, `ghost`,
`muted`) with size presets `auth` and `suggestion` where fullscreen auth needs
51 px actions or 37 px nickname chips. Primary «Дальше» / «Войти» / resend rows
use `solid` or `outline` at size `auth`; quiet full-width links use `ghost` at
size `auth`. The exit panel keeps the 12 px mobile gutter, so it is 366 wide at
390 px. Common field states stay shared. ShareSheet and unrelated buttons are
unchanged. Mixed legal text, the Google glyph and recovery/desktop frames are
still unresolved; those screens are derived, not 1:1.

### Invisible Turnstile — auth abuse (2026-10-29)

Shared `useInvisibleTurnstile` (`apps/mobile/src/features/auth/turnstile-widget.tsx`)
owns submit-time proof acquisition for registration, challenged password login,
email-code login, recovery, email verification and social onboarding email sends.
It adds no field-column block, loading line, reserved height or separate retry
control. Existing AuthViewport, fields, buttons and error slots own the layout.
The founder's W2b Task 3 explicitly replaces the visible challenge surface;
other Figma geometry is unchanged.

`getToken()` resolves with a fresh proof or `null`. The provider renders with
`execution: 'execute'` and executes only during submission; proofs are never
prefetched or cached. Failure/expiry/timeout uses the form's existing inline
error slot («Попробуйте ещё раз»), preserving input for another submit. Missing
public sitekey, script load failure and native platforms fail closed. Pending
proofs belong to the form's abort/session/operation lifetime.

Invisible mode belongs to the Cloudflare widget configuration, not its `size`
parameter. Before production acceptance, the founder must select Invisible mode
or replace the widget and configured keys; see [environment owner](../ops/ENVIRONMENT.md).
Local scripted browser checks prove the submission/layout contract only. Live
Cloudflare mode, native support, and wider Figma parity remain unverified.

The fullscreen nickname frame `4547:23927` uses `authSuggestion` chips:
37px high, hug width, 8px vertical / 13px horizontal padding, radius 80,
white fill, and the exported light gradient stroke. Labels use
`typography.authSuggestion` (Inter 15/20/500, −2%); the centered
«Предложения:» label uses `authSuggestionLabel` (13px Medium, grey). The row
wraps and remains keyboard-focusable. The frame's green and red sample labels
are alternative states. Runtime reserves one 46px status area and renders zero
or one real state, never both; the neutral initial state makes no availability
claim. These roles are shared variants/tokens, not route-local values.
The nickname field reuses `FigmaIcon` `at-sign` for
`I4547:24184;303:8697`: 22×22 slot (2px padding), 18×18 glyph,
`stroke.icon` 1.3 and semantic `color.fieldIcon` `#858585`. Its input starts
at source local x=38.5. At browser DPR 1 the 0.5 shell stroke snaps to 1px, so
the measured input edge is x=39; slot and glyph dimensions remain exact. The
prior text `@` prefix is not the source icon.

```text
live Figma
        ↓ visual extraction
code design tokens + shared primitives
        ↓ composition
shared feature components
        ↓
route screens and verified states
```

Figma не импортируется и не генерируется автоматически в production. Точные
значения измеряются из live Figma, документируются в pull request и реализуются
в существующей архитектуре. Любой exporter работает только read-only и не может
сохранить изменения в Figma.

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
- elevation/border: только реально используемые Figma levels;
- motion: menu, tab, sticky player и loading transitions;
- layout: content max-width, grid columns, card width and breakpoints.

### Measured visual baseline

| Role                         | Figma value / evidence                                                                |
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
| Responsive gutters           | tablet 48 px; mobile 16 px                                                            |
| Platform column gap          | 40 px for public content-page compositions                                            |
| Wizard workspace             | centered 1088 px: 600 px primary + 48 px gap + 440 px preview; top offset 56 px       |
| Tablet wizard workspace      | centered 928 px: 500 px primary + 32 px gap + 396 px preview                          |
| Card title                   | `Onest` 16/700, line-height 20                                                        |
| Card creator/metadata        | 14/500; metric label 12/500; metric value 16/700                                      |
| Creator profile card example | 340×526, media 340×380                                                                |

Exact semantic token names and repeated-value clustering выполняются в WP1.
Card dimensions in the table are canonical screen variants; the reusable
`k5vYGf` reference below remains 322×456. Implementation selects the measured
variant by canonical consumer, not by stretching one card with arbitrary CSS.
Browse Works, Browse Authors, Product and Creator content pages use the Figma
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
контракт; визуальным authority остаётся live Figma.

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
for Product About. CreatorIdentity owns the separate bounded avatar halo from
the current author reference. It is not a shell-level atmosphere. The primitive uses the route-provided public image
URL only as a blurred visual layer, keeps the sharp image/content accessible,
adds a neutral veil and a light lower fade, and falls back to the warm page
surface when media is absent or fails. It is decorative, pointer-inert and
reduced-motion aware.

### Page states

`PageState` owns empty, not-found and other screen-local messages, plus compact
inline loading copy where content chrome stays on screen. Blocking page fetch
uses `InfrastructurePageStatus`: one static `BidplaceMark` at 104px.
Loading is the mark only. Error chrome follows the fetch status; there is no
logo motion cycle. When the fetch stops in error, the same mark stays
and the canonical copy appears in `workTitle` (20/24 semibold, max 300px)
plus a large outline «Повторить». Success unmounts immediately. The previous
eye-mark animation is not part of this mark.
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
Product About. Its media layer is clipped by the outer bounds,
overscanned by a bounded 1.1 scale, and fades through one explicit linear
gradient into the warm surface. Product About accordion rows use one symmetric
toggle behavior: the active row closes when activated again, and the control
exposes its expanded state.

- Buttons and links remain visually and semantically distinct.
- Dropdown/menu is not a generic select; sort/filter controls use appropriate
  listbox/select semantics.
- Implementation: catalog sort and filter use `components/figma/FilterSheet.tsx`
  through `features/discovery/CatalogFilterSheet.tsx`, with `AppDialog` owning
  the shared sheet backdrop and focus. Compact filters use
  `max(40, safe-area bottom)` spacing. The unused
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

Current source: HRRtDp0bQlukw7ptTkuEZg4306:8453 /4594:36802 and
4861:7803 /4886:10106, superseding the previous compact-avatar contract.
CreatorIdentity remains mounted at100px (mobile) /140px (public desktop).
Only the existing action row pins after the measured header leaves the viewport;
there is no duplicate compact identity. Animated.ScrollView feeds a shared scroll
value. Reanimated transforms/opacity use the common200ms timing and system
reduced motion.20px hysteresis prevents threshold flicker. React accessibility
state changes only at visibility crossings, never per frame. Desktop keeps the
expanded identity under the shared navigation; no duplicate mobile bar.

AppShell contentLayout=bleed gives the author scrollport full viewport width;
PageColumn owns the same1280+12px container inside it. The15px avatar halo can
paint outside the centered column, while clipping remains at the physical screen.
Works uses the common measured PaddedGrid up to four columns,12px horizontal /
32px vertical gaps. About uses the same grid owner for two prose columns when
space permits. Mobile remains one column. No Archive/commerce/favorites backend
is implied by these Figma frames.

### Work identity header (web 390)

Work retains its separate `stickyDock.*` visual contract and sticky physics. Expanded rest is gallery media 520, dots after
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
`ReduceMotion.System`). Docked tabs set `surface="transparent"` so they do not
paint a second canvas. Tab labels use `contentInset={layout.gutter}`;
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

`AppShell` owns the fluid column (`DEC-120`): full viewport width, centered,
`maxWidth: layout.contentMax + 2 * layout.gutter` with 12px horizontal
padding. Content width is `min(viewport - 24, 1280)`; mobile/tablet are fluid.
The Work gallery is the local full-bleed exception: it escapes that gutter,
while its identity, tabs and body reapply it. `AppShell` applies top and side
Safe Area; `useDockInset` owns the bottom inset once for both dock position and
content reserve. 1024/1440 Figma compositions remain `NEEDS-FIGMA`.

`FloatingDock` is one 232×64 glass capsule: Главная / Поиск / Добавить /
Профиль. Search opens canonical `/explore` with its inline field active
(`DEC-137`, replaces the fullscreen overlay portion of `DEC-096`). Explore source
is Figma `7240:2491` variant 1: compact Works `7240:2492`, expanded search
`7240:2652`, Categories `7240:2620`, Authors `7240:2580`. Commerce and view-mode
controls in those mockups are excluded by the portfolio contract.

`ExploreHeader` reserves a constant 52px slot. When opening search, only header layers animate;
TextInput, tabs and result ancestry stay stable. A single Reanimated progress
moves the magnifier, expands the glass background from right to left, fades the
title/close, and uses shared reduced-motion policy. Hidden controls are inert
and aria-hidden on web. The field/close reuse `FigmaSearchGlass` and existing
`searchChromeTokens` (52px, 60% white, CSS blur6, SVG stroke).
`FigmaTabs variant="segmented"` owns the rounded rail and keyboard navigation;
its default underline variant keeps existing consumers. The semantic
`navigationTitle` typography is Inter Semibold16/20/−2%. `FilterSortBar`
`filterPresentation="icon"` exposes the existing round filter trigger, while
sort keeps its label; existing consumers retain label defaults. `FilterSearchField`
remains the floating-label catalog field; Explore does not duplicate query inside
filter sheets. `WorkCoverCardGrid variant="caption" columns={2}` uses existing
image/card components without blur; default overlay consumers keep their behavior.
Author/Category/Work hits retain shared hover fill and visible keyboard focus.
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

Ordinary web AppDialog sheets share one visual `SheetBackdropProvider` installed
under ThemeProvider in AppProviders. FilterSheet/ShareSheet/mediaSheet inherit it;
A → B handoffs retain the same dimmer while each dialog keeps its dismissal,
content and focus owner. The transparent hit layer stays below the panel.
Last close/unmount removes the dimmer; native and standalone previews keep their
existing per-dialog layer. Centered confirmations retain their separate level.
Return-focus follows the opener ancestry only when the immediate opener was
removed, preserving focus within a still-open parent (2026-10-19 transition matrix).

Auth's visual dimmer is owned by the persistent `(auth)/_layout`, so changing
between login, forgot-password and reset-password does not replay its fade.
AuthViewport keeps the transparent dismissal hit layer and its existing guards;
full-screen registration covers the dimmer with its opaque canvas. Shared modal
color/motion values are unchanged (2026-10-19 auth-transition regression).

`SheetDragSurface` owns downward header/handle dragging for AppDialog sheets,
FilterSheet (including compact bare headers) and the auth sheet. The content body
keeps its normal scroll behavior. A short drag springs back; a committed drag calls
the existing close owner, preserving busy and dirty guards. Cross, Escape and focus
return remain available. Reduced motion removes the return transition. Centered
confirmations and full-screen registration have no drag affordance (DEC-122).

Shared sheet width policy (2026-10-19, account foundation): for viewports up to
`layout.sheetFillViewportMax` (600 CSS px) an auth/AppDialog sheet spans the full
viewport width; above 600 it is capped at `layout.sheetMax` (390). Inner fields fill
the sheet's inner width with the existing paddings. Full-screen registration keeps
its measured 350 column, centered dialogs are not stretched. The rule lives in
`sheetWidthConstraint()` (app-dialog-host-style) and AuthViewport; verified in
production build, Chromium + WebKit, 320–1024 (`docs/audits/current/evidence/2026-10-19-sheet-widths/`).

On web AppDialog focuses its close control when opened. A sheet also completes
initial focus after its entering animation if focus is still outside the dialog;
it never steals focus already inside. The existing Escape/trap/return-focus
behavior and motion geometry remain shared with the Work FULL viewer.
Existing sheet bottom spacing is preserved with `max(base space, safe-area bottom)`;
compact filters explicitly use `max(40, safe-area bottom)`, while full filters
own their padding and scroll. Web HTML uses `viewport-fit=cover`.

The web `AppDialogFrame` inner wrapper shares its host flex alignment, so
limited dialog surfaces center without route-specific offsets. A dialog title
uses `sectionTitle` inside the available header width (`flex: 1`, `minWidth: 0`)
next to the close control; it does not grow to 38/40 from viewport width while
the surface remains 366px. Sheet typography and sizing remain shared.
`AuthPasswordField` restores focus and selection through DOM `setSelectionRange`
on web and `TextInput.setSelection` on native. Decorative `BidplaceBrand` SVGs
use `aria-hidden` plus local standard/WebKit `user-select: none` on web, without
`focusable` or `tabindex`; native keeps its decorative accessibility props.
Interactive parents own their keyboard focus, accessible name and activation.

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

| Role              | Node                  | Token                                                                                               |
| ----------------- | --------------------- | --------------------------------------------------------------------------------------------------- |
| «Открытие недели» | `439:4408`            | `typography.sectionTitle` 24/29/600/−0.72, `color.ink`                                              |
| Handle `@slug`    | `439:4414`            | `typography.authorRowHandle` 22/25/500/−1%, `color.ink`                                             |
| Bio               | `439:4415`            | `typography.authorRowBio` 14/17/400, `color.textSubtle` `#6F6F6F`                                   |
| «Выбор куратора»  | `439:4417`            | `typography.editorialTitle` 20/24/500/−2%, `color.ink`                                              |
| Curator note      | `439:4418`            | `typography.editorial` 16/22/400/−1%, `color.textSubdued`                                           |
| Profile pill      | `439:4419`/`439:4420` | `FigmaButton` `muted`: shared text-button matrix (pad 8/16, radius 80, label Inter 600 14/26/−0.28) |

Do not reuse `authorHandle`, `authorName`, `body`/`bodySmall`, `cardTitle`,
`muted`, or global `outline` for these roles.

Home «Новые работы» reuses Figma Active-auctions Frame `439:4478` as layout
only: `sectionTitle` + hug `FigmaButton` `muted` «Смотреть все»,
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

## 6.2 Shared text button

Source: live Figma master `292:5058` (checked 2026-10-20) and the
`design/figma-handoff/buttons/2026-10-10-buttons` capture. Outline, ghost, and
muted labels bind to Black `#121212`. The 2026-10-10 capture stored `#565656`
on those text nodes; that value is not the live master. One `FigmaButton`
renderer and four variants:
`solid`, `outline`, `ghost`, `muted`. Each has idle, hover, pressed, and
disabled. State priority: disabled → pressed → hover → idle. Disabled applies
`opacity` 0.5 once on the control shell.

| Token           | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Label           | Inter 600 14/26, letterSpacing −0.28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Padding         | 8 vertical / 16 horizontal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Radius          | 80 (disabled solid: 40, node `292:5054`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Paint           | `FigmaButtonSurface` draws base fill, hover/pressed overlay, and stroke as stacked `Rect`s in one `Svg` (no CSS shell fill or clip). The interactive shell stays `backgroundColor: transparent`. Solid stroke is `#2A2A2A → #585858` and outline is `#D1D1D1 → #EBEBEB`, `userSpaceOnUse` from the 83×43 sample axis. Ghost stroke is white, muted is `#F3F3F3`, pressed ghost (`292:5046`) paints 82×42 at the origin with no stroke inside the hug frame. Stroke sits above the overlay. Capsule `rx`/`ry`: `min(radius, (width − stroke) / 2, (height − stroke) / 2)` |
| Web size        | RN Web `onLayout` rounds; `useCssBorderBox` (`use-css-border-box.ts`) reads fractional border-box width/height from `getComputedStyle` so the `Svg` viewport matches the shell for text buttons and search chrome (sample «Кнопка» ≈ 82.71875×43, not 83×43).                                                                                                                                                                                                                                                                                                            |
| QA stand        | `/dev/figma-buttons` renders a static 4×4 board (`FigmaButtonStatePreview`, handoff `714×283`) plus live controls below; previews use the same `figmaButtonStyle` shell and `FigmaButtonVisualContent` as production `FigmaButton`                                                                                                                                                                                                                                                                                                                                       |
| Sample «Кнопка» | Source 83×43 hug; web width follows fractional glyph metrics. Other labels hug content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Touch           | ≥44 px via shared `hitSlop`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Sizes           | `matrix` (default, 43: pad 8/16, Inter 600 14/26), `auth` (51: pad 12/16, same 14/26 label; `actionHeight` and `resendHeight`), `suggestion` (37: pad 8/13, `authSuggestion` 15/20). Height is `(paddingY + 0.5 stroke) × 2 + lineHeight`. Same four variants and renderer; size only changes padding and label metrics                                                                                                                                                                                                                                                  |

| Variant | Idle fill                   | Hover / pressed                                                                              | Disabled                                 | Label     |
| ------- | --------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------- | --------- |
| solid   | `#121212`                   | white 15% overlay                                                                            | `#949494` + shell opacity 0.5            | white     |
| outline | white                       | black 5% overlay                                                                             | white + shell opacity 0.5                | `#121212` |
| ghost   | white, white stroke         | black 5% overlay; pressed node `292:5046` paints 82×42 with no stroke inside the 83×43 frame | white + white stroke + shell opacity 0.5 | `#121212` |
| muted   | `#F3F3F3`, stroke `#F3F3F3` | black 6% overlay; stroke stays `#F3F3F3`                                                     | `#F3F3F3` + shell opacity 0.5            | `#121212` |

Auth fullscreen actions and nickname suggestions use this matrix with size
`auth` or `suggestion` (see Sizes row). Home «Смотреть все», admin links, and
semantic wrappers use the default `matrix` size. `DestructiveButton` stays
semantic but renders `solid`. Chips, icon buttons, and fields keep their own
controls.

## 6.3 Shared text field

Source: founder export `design/figma-handoff/fields/2026-10-06-text-fields`
(root `292:5044`, captured 2026-10-06). The board is 789×552. The reference
field width is 366 px and is not a fixed screen width. One `FigmaTextField`
and `FigmaFieldStatus` draw all eight states. `size.input` is 51, radius 18,
inside border `size.fieldBorder` 0.5, padding 12×13, gap 4. Input is
`typography.field` Inter 400 14/24. Entered text is `color.fieldValue`
`#121212`. Placeholder and the empty border use `color.muted` `#8A8A8A`.
`color.ink` stays `#2A2A2A` and is the filled border. The stadium search
control keeps its own 52 px height and 16/19 type.

| State       | Node       | Border                       | Fill                       |
| ----------- | ---------- | ---------------------------- | -------------------------- |
| empty       | `292:5043` | `#8A8A8A`                    | `#FFFFFF`                  |
| hoverEmpty  | `292:5041` | `fieldHoverBorder` `#535353` | `fieldHoverFill` `#FCFCFC` |
| filled      | `292:5038` | `ink` `#2A2A2A`              | `#FFFFFF`                  |
| hoverFilled | `292:5039` | `solidHover` `#000000`       | `#FCFCFC`                  |
| focus       | `292:5037` | `focus` `#121212` (DEC-127)  | `#FFFFFF`                  |
| error       | `292:5040` | `error` `#FF0000`            | `#FFFFFF`                  |
| success     | `292:5036` | `success` `#039600`          | `#FFFFFF`                  |
| disabled    | `292:5042` | `#8A8A8A`                    | `mutedFill` `#F3F3F3`      |

The floating label is `typography.fieldLabel` Inter 400 12, `color.fieldLabel`
`#999999`. Its wrapper is `fieldLabelX` 15 and `fieldLabelY` −8, with 4 px
horizontal padding and a canvas backing. It is absent for empty and disabled.
The captured label box height is not a line-height. Error text is
`typography.fieldError` Inter 400 12, `color.error`, in normal flow:
`fieldErrorGap` 4 below the shell and `fieldErrorX` 13 from the left. The
captured 15 px text box is not a line-height. An error keeps the gray label
and the ordinary value color. Focus on an error field stays red. Success is
not implied by a filled value. Disabled still blocks input. An icon is drawn
only when the field is given one: 22×22 wrapper, 2 px padding, vector
`#121212`.

On web, `[data-figma-field='true']` suppresses the browser outline so the
shell stays the only ring. `apps/mobile/global.css` still draws
`input:focus-visible`, `textarea:focus-visible`, and
`[role='textbox']:focus-visible` for controls outside that component.
The field success border stays `color.success` `#039600`.

### Author application field variant

`FigmaTextField` and `TextField` take `variant="authorApplication"` (`FigmaFieldVariant`
in `figma-text-field-style.ts`). Only that variant changes the empty border and the
placeholder to `color.authorApplicationField` `#999999`. Icons keep `#8A8A8A`, and the
default variant is unchanged for every other field. The basics step (`527:16416`)
uses it for name, nickname, country and city. No route-local recolor is allowed.

Other step-1 pieces are shared: `typography.formLabel` (Inter 500 16/19, letter
spacing -0.32) names the photo block; `color.photoGuide` `#911E05` draws the two
crop lines of the empty photo slot at 0.72 px; `FigmaIcon` `image-add-02` is the
empty slot icon. The country picker is `CountryPickerSheet`, a composition of
`FilterSheet`, `FilterSearchField` and radio `FilterOptionRow`. It adds no renderer
and no local style.

### Author application shared chrome (mobile)

All five visual steps compose `AuthorApplicationStepShell` (`author-application-step-shell.tsx`)
for header chrome, step selector and back/close. Actions use `FormPageShell.bottomAction`.
Picker triggers use `FigmaSelectField` (`FigmaSelectField.tsx`) on the same
`authorApplication` field variant as text inputs. `FigmaTextField` with that variant
passes `stroke.authorApplicationFieldPx` into trailing field icons (at-sign, search,
calendar). Directions use `AuthorDirectionsPickerSheet`: `FilterSheet`
(`titleVariant="directions"`), `FilterSearchField`, checkbox `FilterOptionRow`
(`variant="directions"`) and removable `FigmaChoiceChip` for selected category IDs.

`FigmaButton` semantic sizes from `packages/design-tokens` (`figma-button.ts`) own
step navigation and sheet actions: `navigation` and `event` for 47 px step chrome and
achievement row actions, `pickerAction` for sheet primary, `exitConfirm` for
destructive confirm, plus removable direction chips at 39 px height. Exact-source
exceptions (for example directions checkbox `FigmaIcon` `check` and directions sheet
back stroke) live in shared figma components, not route-local geometry.

Dismissed dialogs must not intercept clicks: web `app-dialog-host` /
`app-dialog-layer.web.tsx` keeps `pointerEvents: none` on the host; open
`Dialog.Content` sets `pointerEvents: auto` on the surface (not the frame).

## 6.4 Press feedback

`DEC-104`. A pressed `FigmaButton` or `FigmaChoiceChip` keeps its existing
fill, inset, or opacity change. It does not draw a mint ring. Selected chips
stay on the charcoal fill after release. Keyboard focus uses the monochrome
`focus-visible` outline in `global.css` (DEC-127), including
`[role='switch']`. Dock items already have no shadow.
This does not change control size, type, or the field success state.

## 7. Account shared components (2026-10-20)

Владельцы и контракты общих компонентов экрана аккаунта (волны 3A–3D).
Визуальные значения light прежние; black-палитра provisional.

- `AccountIdentity` (`components/figma/AccountIdentity.tsx`) — row:
  avatar100 (`size.accountAvatar`, `radius.avatar`, placeholder
  `accountAvatarPlaceholder`) + текстовая колонка `flex:1/minWidth:0`
  - опциональный CTA slot. Имя — `accountName` strong; handle
    `@slug` — `accountHandle` цветом `accountMeta`; handle nullable.
    Фото через `ResilientRemoteImage` (`fallback="plain"`, retryable=false).
    Это не `CreatorIdentity`: та — для публичных страниц автора.
- Published identity правило: при APPROVED имя/фото/sharePath берутся
  только из публичного author-кэша (`use-account-public-identity`, общий
  query key с публичным экраном автора); owner profile несёт editing
  overlay и для identity не читается.
- `SettingsGroup`/`SettingsRow` (`components/figma/SettingsList.tsx`):
  label группы опционален и красится `accountMeta`; поверхность группы
  прежняя. Row: иконка + текстовый блок `flex:1/minWidth:0` (AppText
  `flexShrink:1`), props `trailingArrow` и `busy` (busy блокирует row).
  `toggle` делает ту же строку switch (роль `switch`, имя из label):
  трек 36×20 и бегунок 16×16 из Figma `7008:15192` (только включённое
  состояние). Включённый трек — `inkStrong`, бегунок — `canvas`; выключенный
  трек — `surfaceStrong`. Выключенное, disabled и black-состояние
  переключателя — NEEDS-FIGMA. На web строка с `toggle` ставит
  `aria-checked` и обрабатывает Space (без прокрутки); Enter остаётся
  у `Pressable`. Фокус — общий `focus-visible` для `[role='switch']`.
- `WorkCoverCaption` (экспорт `WorkCoverCard.tsx`) — единый caption
  caption-варианта: author — `coverCaptionAuthor` (tracking −0.14), title
  — роль `coverCaptionTitle` 14/17/500/−0.28, максимум 2 строки. Ветки
  cover/no-cover используют один renderer; дублирующей разметки нет.
- Новые semantic-роли (`SemanticColorMap` в обеих map theme.ts):
  `accountMeta` (light #858585, black provisional #8F8F8F) — метки групп
  настроек и handle; `coverCaptionTitle` — типографика caption-заголовка
  (в tokens.ts). `gray2` не переиспользуется новыми consumers.
- `ResilientRemoteImage`: prop `fallback: 'labelled' | 'plain'`
  (plain — без текста плейсхолдера; default 'labelled' прежний). Plain failure
  keeps the image role and accessible failure description. Home opening uses
  this fallback with the gray avatar surface and `retryable={false}`; automatic
  retries remain enabled.
- Back variant `settings` — шапка настроек (frame/glyph28, hitSlop до touch44).
  FigmaIconButton size=settingsHeader задаёт такой же frame для симметрии
  противоположного действия; default-потребители сохраняют прежний размер.
- settingsTitle/settingsRow сохраняют естественную высоту строки Figma
  (normal), без предположительных чисел22/20.
- AccountIdentity: имя/handle сгруппированы отдельно, CTA content-width;
  длинное имя переносится, не масштабируется.
- FormPageShell: варианты account/settings задают paddingTop12/20 через
  spacing-токены; default24 и authorApplication сохраняют поведение.
- `FormPageShell`: Web retains input focus during scrolling (`keyboardDismissMode="none"`); Native keeps `on-drag`.
- `FormPageShell` — testID `form-page` (единый scroll-owner форм;
  web-скоуп тестов поверх стека маршрутов).

## 8. Old system boundary

`docs/modern-ui` and its design language are retired. Runtime public screens
use `apps/mobile/src/components/figma` and wrappers in `components/ui`. There
is no nested Figma token object. Figma is the production visual source for
mobile-web 390 (`DEC-119`).

### Registration consent composition —2026-10-20

AuthConsentCheckbox принимает текстовый children-slot; RegistrationLegalText
переиспользует существующий keyboard-accessible LegalLink. Ссылки —fieldValue,
основной текст —новая semantic-роль legalText (light858585, black provisional).
Роль применяется ко всему AuthLegalText, без новых локальных цветов.
Fullscreen AuthViewport заполняет viewport; sheetWidthConstraint относится только
к шторкам. Форма внутри fullscreen сохраняет центрирование и maxWidth350.

### Floating dock home icon — 2026-10-20

Главная использует общий FigmaIcon `home-01` (Hugeicons Home01Icon), а не
брендовый знак. Path совпадает с live node 7008:16942; размер, stroke, цвет
и hit area остаются у существующих владельцев dock/FigmaIcon/tokens.
Состав MVP dock остаётся Home/Search/Add/Profile без корзины.

### Date selection — 2026-10-20, DEC-126

`components/ui/DateField` is the shared date-only field (UI barrel export).
It composes FigmaSelectField with optional calendar icon and existing AppDialog
sheet. Use the same field for date selection; no free-text-only date entry.
Owner forms retain validation, busy/session guards and persistence. The field
emits a canonical date string only after confirmation or explicit clear.

Web DateSelection composes public React Aria Calendar/NumberField/Button APIs,
Russian locale and @internationalized/date calendar values. Calendar controls
reuse field typography, control radius, touch size and semantic surface/ink/
action/onAction/focus roles. Convert RN lineHeight to CSS px. Select appearance
is normalized for WebKit with the existing arrow-down icon. Native uses SDK57
system picker; its platform appearance is not claimed to match the web calendar.
No new calendar geometry or palette is copied into screens. Month-only values
remain day:null; never invent day1 or serialize civil dates as UTC instants.

Web sheet motion has one persistent DOM tree with withTiming and reduced-motion
support. Closing content is inert and aria-hidden; completion removes it. This
avoids Reanimated web layout exit moving interactive controls into dummy clones.
Web/native now share AppDialogSheetMotion translation ownership; see the2026-10-21 acceptance below.

### 2026-10-20 — Search и полноэкранный AuthViewport

FigmaTabs segmented растягивает rail на ширину доступной колонки, sampleWidth не
является ограничением runtime. Интерактивная поверхность AuthorSearchRow имеет
radius.small; постоянная геометрия передаётся статическим style, состояния —
через interactionStyle, поскольку Link asChild не сохраняет callback-style.
Крест AuthViewport использует size.touch и существующие auth.screenPaddingX/Top;
в DOM следует после формы, чтобы первичный фокус оставался на поле. Цвет и
модальность focus-visible из §6.4 сохранены.

### DEC-127 — Монохромный focus (2026-10-20)

По прямому решению основателя роль focus — #121212 в light и #FFFFFF в black.
Это утверждённая замена прежнего синего из Figma состояния focus292:5037 и
уточнение §6.4/DEC-104. Поля используют border этой роли, прочие элементы —
существующий outline2px с offset2px. Pointer/keyboard-модальность, размеры,
error/disabled состояния и доступность не меняются. ThemeProvider зеркалирует
роль в CSS; начальные CSS-значения соответствуют токену до hydration. Black-тема
в целом остаётся provisional и не включается пользователям этим решением.

### 2026-10-21 — Responsive auth composition

AuthViewport owns mobile sheet/desktop dialog composition at768 CSS px, dialog cap420.
Shared field metric `auth` is51; default fields unchanged. Button size `authDialog`
uses47 geometry and current master typography. Login informational links use
semantic `legalLink`; registration link meaning/color and DEC-124/125 are unchanged.

### 2026-10-21 — Ordered content editing

ProductBlockActions owns photo/story up/down/delete menus; text reveal uses hover /
focus-within only for fine pointers, touch/native always exposes its trigger. Shared
FigmaIconButton carries expanded state; heading/text glyphs use the existing icon
registry. `storyHeading`15/24, `mediaTile` radius16 and `stepDot`6 follow the supplied
creation frames. Existing PaddedGrid derives photo columns from measured width.
FormSection may omit its heading where the wizard chrome already supplies one.

Home solitary CTA hosts use layout.actionColumnMax420 with width100% and centered alignment; shared buttons and catalog containers retain their own widths.

### 2026-10-21 — Continuous sheet motion

AppDialogSheetMotion is the sole Reanimated translation owner for enter, header
drag, cancellation and exit. SheetDragSurface feeds its shared value, without
React state per frame or a second spring/transform. Accepted close retains the
release offset; vetoed close returns to rest. Auth navigation waits for onExited.
UseReturnFocus restores only after the real FocusScope closes. Reduced motion
uses the existing system timing policy. Shared sheet consumers, busy/dirty guards,
background continuity and focus are covered by named browser/owner checks in
the execution audit.

### 2026-10-21 — Shared filter selection and Back (DEC-128)

FilterOptionRow uses one trailing check for checkbox/radio semantics. Its label
flexes and wraps; optionLabel15/20 and pickerTitle18/22 are measured from current
author Figma4594:35522 in HRRtDp0bQlukw7ptTkuEZg. Minimum row44px preserves
touch access. Scroll indicators are hidden; scrolling remains available. Compact
FilterSheet leaves bottom padding to AppDialog, with20px for author categories.
Radio groups may opt into `FilterOptionRow`'s `nativeID`, web `tabIndex` and
`onNavigate`: the group owns stable ordering, one Tab entry and arrow/Home/End
selection/focus. Space/Enter confirms through the existing press handler.
Checkboxes and consumers without navigation retain their existing behavior.
BackButton is one muted round FigmaIconButton with disabled/pressed feedback;
former glass/chrome/settings variants are removed by the founder's global request.


### Public desktop navigation — 2026-10-21

Implemented: public Home/Works/Authors/details use AppShell DesktopHeader from
1024 CSS px on web (explicit founder decision); mobile/native retain FloatingDock.
PublicNavigationProvider scopes the policy, use-app-navigation owns shared
profile/create/search destinations. Inactive stacked headers retain geometry but
are inert and do not duplicate search/focus IDs. Private routes retain their
existing chrome. No cart/notification backend or placeholder controls added.
Reference: HRRtDp0bQlukw7ptTkuEZg /4980:15230. Header68px, search48px,
provided combined logo, current button master.1024/1440: responsive adaptation,
NEEDS-FIGMA for exact parity.12 unit cases, tsc/lint/build and4 Chromium/WebKit
navigation cases pass. Author composition remains Partial; see
author parity audit.


### Ordinary page chrome (2026-10-21)

`AppShell` owns desktop/dock visibility; `PageScrollView` composes the existing
`PageColumn`, `SiteFooter` and dock clearance in one scrollport. Its branded
variant owns the responsive central mark. `SiteFooter` shares the wide-layout
policy with navigation and uses existing auth/create routes and legal IDs.
`FormPageShell` includes it for account/settings only by default. Full-screen
forms and overlays retain their existing layout. `BidplaceLogo` is the shared
contain-fitted combined SVG for header/footer.


Desktop header uses the third (`ghost`) FigmaButton variant for Works/Authors,
including shared hover/press/focus. `FigmaIconButton surface="outline"` implements
the38px circular frame from4980:15197 with0.5px semantic border and existing hit
slop; plain/muted consumers retain their behavior. Header routes are unchanged.
Cart/notifications use the existing compact FilterSheet for post-MVP feedback;
never show an unread indicator without real data. Branded PageScrollView owns
the desktop72px top/24px gutter from3139:2222, preserving mobile spacing.


Shared page chrome follow-up (2026-10-21): AppShell supplies actual desktop/dock
visibility to PageScrollView, so hidden dock never contributes a bottom spacer
in loading/error/empty/ready states. Header/footer landmark roles stay constant
while inactive chrome uses inert/accessibility hiding; changing a role would
replace RN Web's native DOM tag and remount images. After-enter focus preserves
an active descendant control but moves a container fallback to the intended
input/close target. Existing overlay/focus owners remain the only mechanism.


### Portfolio design source update — 2026-10-23

Scoped source: Figma `HRRtDp0bQlukw7ptTkuEZg`; exact nodes and mapping are in the
portfolio audit. Other handoffs remain applicable.

- `CoverFrost` owns one web `backdrop-filter: blur(16px) saturate(115%)`
  layer, masked from transparent to opaque at 35% of the content-driven panel.
  This approved Dock-style approximation replaces the blur60 experiment; it is
  not exact Figma Progressive Blur. The independent two-stop scrim is retained;
  author top uses only its existing scrim. Bottom regions clip to 12px upper
  corners, with sharp text/controls outside the effect and one source image.
  Relative to PR #66 base `bfab5198`, Native replaces a second `Image`
  (`blurRadius=30`) with `BlurView` intensity60 over the original image wrapped
  in `BlurTargetView`. Android SDK31+ blurs; older Android uses the library
  tint plus scrim fallback. Physical-device rendering remains Needs verification.
  Native intensity is not a CSS pixel radius; no native progressive mask is claimed.
  Card references do not define the full public author page geometry.
- `FigmaIconButton` destructive surface uses semantic `destructiveFill` and white
  glyphs; `ProductBlockActions` media presentation combines direct delete with the
  existing reorder menu. Safe replacement remains a separate functional dependency.
- `FigmaButton` creationAction uses55px from4551:31379; auth remains51px.
- `BackButton` plain surface is opt-in for creation chrome; default muted remains.
  Header controls retain 44px targets (native row44, web row28 with overflowing
  targets). `FormPageShell` creation variant shares the author content start and
  owns the work wizard spacing; unique photo tile geometry stays local.
- Work photo grid uses existing `PaddedGrid`, two 3:4 columns from 320px, gap12;
  390px yields177×236. Tile states remain local, action footer stays outside scroll.
- `SiteFooter` stays owned by `PageScrollView` on ordinary public/legal pages;
  auth, creation/editing and overlays exclude it. No duplicate footer renderer.


### Administrative navigation and review composition — 2026-10-24

Explicit founder adaptation: ordinary dock keeps four Home/Search/Add/Profile
controls; admin replaces Add with Moderation and adds Analytics before Profile.
Reuse FloatingDockFrame, icon/control dimensions, gaps, glass, Safe Area and motion;
five controls naturally use the existing wider capsule geometry. No cart. Profile
opens `/account`; Moderation `/admin`, Analytics `/analytics`, each with separate
active/access inputs. DesktopHeader reuses icon buttons for these destinations.
`WorkGallery` optionally renders private images and selectable thumbnails; existing
public default is unchanged. `FormPageColumns layout="adaptive"` derives two panes
from container width using existing cardWidth/sectionGap; default stays stacked.
New admin compositions use these controls, not a second design system; exact
new admin/tablet/desktop Figma parity is not claimed.

FigmaTabs `selection` reuses the same visual rail for filter toolbars: pressed buttons,
no tab-panel references. Default tabs retain their linked panel/keyboard behavior.
Moderation detail owns its labelled tabpanel; queue selectors retain the scrolling
FlatList header without inventing empty panels.


### 2026-10-25 — Explore acceptance refinements

Founder iconography rule: ordinary icons use 1.3 physical px; icon-only controls
and large glyphs use 1.6 physical px. Fractional SVG export values are not tokens.
`FigmaIcon` uses Hugeicons `absoluteStrokeWidth` on its original 24-unit grid, preserving
proportions and final stroke thickness at every size. `FigmaIconButton` uses the
heavy role; the round `FilterSortBar` trigger is 42×42 with a 24px glyph at 1.6px.
The portfolio Explore has no view-mode toggle; this update does not add one.
Back navigation uses Hugeicons `arrow-left-02`; gallery/calendar chevrons retain
their separate meaning.

`FigmaTabs` segmented selection uses one persistent, measured Reanimated fill,
`motion.control` and the shared easing. Reduced motion snaps directly. Resize
remeasures the rail; underline consumers keep their existing presentation.
`PageState variant="search"` matches empty-search `7240:2730` / `7245:2983–2993`:
24px magnifier, 306px maximum text width, `emptyStateTitle` 18/22 semibold,
`emptyStateBody` 14/20 regular, 10px icon/text and 7px text gaps. Its optical center
is 20.1px above the full viewport midpoint. Explore balances its measured fixed
chrome in the content padding; `PageScrollView variant="viewport"` keeps the
footer below the viewport. Empty search hides inactive filter chrome; active
filters remain available for recovery. Controls stay mounted to preserve sheets.


### 2026-10-25 — Filled active dock icons

Founder source: Figma `6WWy0IkFqsajKxErNsH3bQ`, node `5685:190`, inspected
read-only in the browser at 100%; MCP reported no access. Only the filled glyph
states are adopted; the existing four-item portfolio dock remains unchanged.
`FigmaIcon variant="filled"` fills the existing Hugeicons geometry with the theme
ink; `outline` is the default for all other consumers. `FloatingDock` derives
Home/Profile fill from its existing selected route/search state. Search stays
outlined at 24px: inactive Search is 1.3px, selected or pressed Search is 2.5px.
Add uses 1.6px at rest and the same 2.5px while pressed (`stroke.iconActive`,
`DEC-147`, revises `DEC-146`; founder screenshot of `5685:190` plus geometry
from copy `7272:2707` / dock glyph `7272:2790`). Add stays
an action; administrative glyphs retain their current outline presentation because
this reference does not define their filled variants. No new paths/assets/library,
click state, route or permission changes. 24px glyphs and the 232×64 capsule,
glass, keyboard focus and existing opacity feedback remain unchanged.

The founder cancelled the subsequent stroke/fill experiments (`DEC-140`–`144`).
Search uses the original outline with the shared 2.5px active stroke; inactive
Search is 1.3px. No mask, cutout or per-path stroke rendering remains. Existing
MotionPressable pressed state drives the weight without extra state/listeners.


### 2026-10-25 — Explore integration with Portfolio MVP / PR #66

MVP `068af087` was merged normally into Explore (`87a2ab68`). Preserve
`blur.cover=16`, `blur.coverNativeIntensity=60` and web Mask35 with Explore
`stroke.icon=1.3`, `iconHeavy=1.6` and the agreed 2.5px selected/pressed role.
Overlay Work/Author cards use the PR #66 `CoverFrost` owner. Explore caption
Works stay without frost and Authors reuse their existing identity rows.
The confirmed separate-row header/segmented animation is unchanged. Independent
Search entry starts fresh; only the same navigation entry restores drafts,
filters, query, cached pages and scroll. Physical Native blur, return and
background/resume acceptance remain Needs verification.

## Photo controls — 2026-10-26

Figma `7329:822–824`: `FigmaIcon` owns rotate/flip/reset/alert icons.
`feedbackTitle` (Inter medium 13/16), `feedbackBody` (regular 12/16), and
`toolLabel` (medium 12/16) belong to design tokens; error surface/title/text use
`feedbackDangerSurface`/`feedbackDangerTitle`/`feedbackDangerText` from `theme.ts`.
`CroppedPhoto` owns normalized crop presentation for cards; public fullscreen
uses the full media source. Photo editor reuses FormPageShell, FigmaTabs and
shared controls. Native/zoom accessibility remains Needs verification in
[design status](04-DESIGN-STATUS.md).

### Photo review controls — 2026-10-27

`FigmaTabs appearance="plain"` with segmented variant is the single-border
42px control from `7345:722`; existing glass/underline styles retain defaults.
`segmentLabel`/`segmentSelected` own medium/semibold 14/18 labels; `mediaCaption`
owns regular 13/18 metadata for Work/avatar. `FigmaIcon reset` uses the installed
Hugeicons Undo vector, matching `7342:726`; no new icon renderer. Crop library
styles are scoped to `photo-cropper` and preserve visible keyboard focus.


### Photo edit glyph (2026-10-27)

Founder-provided screenshot selects Hugeicons `Edit03Icon` (registry `edit-03`)
for photo grid edit controls: diagonal pencil without an underline. Existing
`pencil-edit-01` remains available to its other consumers. The existing
FigmaIconButton owns size, focus, disabled state and hit target unchanged.


### Photo interaction corrections — 2026-10-27

Read-only source `pAPQo6cADmG5XzVmBX76EE`, nodes `7329:704/822/823/824` and
handoff `7388:723`. `FormPageShell` reserves 12px at the end of scroll content
when a bottom action exists, so the last control clears the action frame.
`FigmaButton` solid `creationAction` uses `shadow.primaryAction` and semibold
label from `7330:749` / `7332:730`; other sizes retain their existing paint.
`mediaStage`, `previewSurface`, `previewBorder` own the editor/inline-preview
surfaces from `7332:715` / `7347:720`. The avatar preview uses eager image loading;
ordinary image consumers retain Expo's default loading policy.

The Original crop engine stays measured for transforms but its entire layer has
opacity 0, no pointer events, no tab stop and is inert. The photo grid keeps its
add slot while disabled; presentation-only insertion state shifts neighbors
without changing the canonical order until drop. Native uses existing Gesture
Handler/Reanimated; Web retains HTML DnD and a bounded touch long-press/edge-scroll
path. No second grid renderer, server reorder on pointer movement, or dependency.

Live Figma still specifies square 8×8 crop handles (`7330:730–733`) and the filled
add-slot label (`7329:819`). They are retained despite the pasted review's contrary
visual description. Toolbar/tab weights already match the live Medium/Semibold
roles; no weight reduction is inferred from screenshots. Wide exact parity and
physical Native remain outside the completed visual claim.


### Photo drag ownership follow-up — 2026-10-27

`PhotoDropArea.web` owns mouse dragover/drop for the entire existing grid,
including gaps and the add slot; insertion uses each photo's untransformed
PaddedGrid cell bounds. Card handlers no longer own mouse drop. During mouse drag the moving visual
tiles leave pointer hit-testing, so a held pointer remains over a stable grid
cell after neighbors finish moving. Exit clears the
insertion preview; only drop commits canonical local order, never server order.
Native keeps the same PaddedGrid and Gesture Handler/Reanimated path:
`PhotoDragSurface` limits gesture attachment to the image; edit/delete/Retry
remain siblings. `PaddedGrid.activeItemId` lifts the active row and permits
cross-row overflow only during drag. `FormPageShell` owns the measured scroll
viewport/ref and exposes drag scrolling through `FormDragScrollContext`;
actual contentOffset feeds back into tile translation/insertion, with bounds and
cancel/unmount cleanup. No Figma styling, button, Safe Area or CTA geometry changes
in this follow-up. Physical Native rendering/gesture acceptance remains Partial.

### Stable photo status and editorial controls — 2026-10-27

`ProductDraftImagesStep` reserves one media-caption line for status; file progress
is an overlay in the existing card. `WorkPhotoCard.preview` retains local
geometry/resources through accepted upload until the matching remote image loads.
The existing resilient-image owner reports load/start/exhausted events; centered
Retry avoids gallery controls, while other consumers retain bottom placement.

Figma `4563:33344` is the compact absolute story action panel, with a shared
`FigmaIconButton` compact visual (`size.compactIconButton`34, Native hit slop to44)
and danger glyph tone. Defaults are unchanged. The button explicitly exposes
`aria-expanded` on the installed Web renderer. One open story block key owns the
panel across movement; usable action focus survives boundaries and Escape.

`FigmaButton` size `compactIcon` (Figma `4563:32794`) is height 43: padding
8 vertical and 16/8 horizontal, gap 2 to the existing trailing icon frame,
label Inter 600 14/26/−0.28. `event` stays height 47. The story intro stays
`typography.subtitle` (14/20/400, letter-spacing 0). Story paragraphs use
`bodySmall` (14/20/400/−0.14); that tracking is the 2026-10-28 review decision.
Headings stay `storyHeading`. Destructive story ink is `destructiveInk`
(`Red` `4337:12016`, `#731A06`); `destructiveFill` stays the photo-button fill.
Toolbar and block-menu surfaces use `surfaceMuted` (`Gray 5` `#F3F3F3`). Story
icon glyphs use existing `stroke.icon` 1.3; `FigmaIconButton` still defaults to
`stroke.iconHeavy` 1.6. Story ⋮ is shown only on the selected block. That is
an accepted difference from Figma, where ⋮ is on every block. Line-height
24/20 and the 6px text gap stay. The selected control is a real 44×44 box
(`size.touch`); the muted 42px glyph stays centered inside it. The text field
is a row: the input (`flex: 1`, plus `space.x2`) and a 44px strip
(`story-control-gutter`) that is outside the textarea. Text width stays the
previous content width. The active button sits in that strip. While the menu
is closed the block is not raised, so the button may paint over the next
strip and a press there selects that neighbor instead of opening this menu.
An inactive strip has `pointerEvents="none"` and no control, so it does not
take the press or stop scrolling. The menu delete control is the same real
44×44 box. Native sizes are Needs verification on a device. The open menu ring uses
`figmaButtonStrokeRadius` so both SVG axes share one capsule radius.
Divider and ring paint are `react-native-svg` `LinearGradient`.
`experimental_backgroundImage` does not paint on the installed RN Web.
`FigmaIcon` `image-02` is Hugeicons `Image02Icon`; `image-01` is unchanged.

Figma `4562:32461`/`4563:32768` supply the existing story toolbar and text
composition. By the user's selected scope, empty story now exposes a virtual
text input without autofocus; explicit text/heading insertion
focuses its new block. Inputs grow with content and retain keyboard focus styling
and browser spellcheck. Gallery list, intermediate picker button and lower back
button are removed. No additional editor, portal, focus trap or DnD engine.

First-input correction2026-10-27: the virtual empty paragraph uses the same keyed
`ProductBlockActions`/`StoryTextInput` subtree as the adopted first block. Its key
passes to the existing story owner when text becomes real; no remount or focus
repair is needed for the first character. The duplicate hint pill is removed by
explicit user request; only «Начните писать здесь» remains. The reserved photo
status row distinguishes «Подготовка фотографий», «Загрузка фотографий» during
actual sending, and «Сохранение порядка»; its geometry does not change.

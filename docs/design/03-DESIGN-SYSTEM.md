# bidplace — дизайн-система

Последнее обновление: 2026-09-09

Статус: **Figma phone runtime (`DEC-085`); Pen measurements below are historical**

## Current runtime

One token layer: `packages/design-tokens` `designTokens` (aliases `figmaTokens`).
Values are measured from inspect copy `uMo04w9bgrchWXXDgO4W62`. There is no nested
`designTokens.figma`.

Shared primitives live in `apps/mobile/src/components/figma/` and are the
production masters: `FigmaButton`, `FigmaTextField`, `FigmaChip`, `FigmaIcon`,
`WorkCoverCard`, `AuthorCoverCard`, `AuthorIdentity`, `CoverFrost`,
`AuthorAtmosphere`, `FloatingDock`. Cover overlays frost the artwork
(`backdrop-filter` / duplicated blur on web, `blurRadius` on native) instead of
painting an opaque gradient. Author pages use a 485px blurred photo atmosphere
behind identity. `apps/mobile/src/components/ui` wraps those masters (`Button`,
`TextField`, `AuctionCard` → `WorkCoverCard` portfolio mode).

`AppShell` is a centered 390 column plus `FloatingDock` (Главная / Поиск /
Добавить / Профиль, no cart). Wide windows keep the same column. 1024/1440
compositions are out of this wave.

`FloatingDock` reproduces Figma `Frame 34` as one platform-aware primitive:
36px items contain 24px icons with 6px padding, the row uses 20px gaps and
14px outer padding, and the surface has radius 200, white at 60%, a 0.5px
`#DEDEDE → #F3F3F3` gradient stroke and 6px background blur. It has no drop
shadow. Web portals the dock to `document.body` so `backdrop-filter` samples
the moving page. Native wraps the app content in `BlurTargetView` and uses
`expo-blur` plus the same translucent fill and gradient stroke. Reduced-motion
does not disable blur because blur is a static surface property.

Runtime type is bundled Inter. Figma names Geist on some frames; files are not
in the app.

Skipped nodes and unused variants: [`09-FIGMA-CUTOVER-GAPS.md`](09-FIGMA-CUTOVER-GAPS.md).

## Historical Pen extraction

The remainder of this document records Pen v2 measurements used before the
Figma cutover. Do not treat those breakpoints or Onest/header geometry as the
current runtime. The `.pen` file stays protected and unused at runtime.


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
- Implementation: shared discovery dropdown `components/layout/FilterMenu.tsx`
  (single dismiss + focus return contract for all sort/filter controls).
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

## 6.1. Figma portfolio primitives — 2026-09-09

Read-only source: Figma file `uMo04w9bgrchWXXDgO4W62`, page «Компоненты», plus
Home node `1:2`. Values are the only `designTokens` export (`figmaTokens`
alias).

Shared masters:

- `FigmaIcon` — Hugeicons stroke-rounded, Figma layer names;
- `FigmaButton` — solid / outline / ghost / muted, hover / pressed / disabled;
- `FigmaTextField` — empty, hover, filled, focus, error, success, disabled;
- `FigmaChip` — non-interactive tags (`onLight` / `onDark`);
- `WorkCoverCard` — 264×352 cover; commerce price/timer/status exist as slots
  and stay off unless `mode="commerce"`;
- `AuthorCoverCard` / `AuthorIdentity` — author photo, handle, chips;
- `FloatingDock` — Главная / Поиск / Добавить / Профиль; cart is not an item.

Deferred Figma pieces kept in the registry only: Google icon, AI magic icon,
cart/basket icon, sale badges, prices and timers. Public and author MVP screens
use these masters (`DEC-085`).

Figma card frames name Geist; runtime uses already-bundled Inter until a
licensed Geist file is added. Do not substitute a system font.

## 7. Old system boundary

`docs/modern-ui` and its design language are retired. Runtime components живут
в `apps/mobile/src/components/figma` and wrappers in `components/ui`. There is
no nested Figma token object. Figma is the production visual source (`DEC-085`);
the protected `.pen` file is historical and unused at runtime.

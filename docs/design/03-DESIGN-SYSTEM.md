# bidplace — дизайн-система Pen v2

Последнее обновление: 2026-08-12

Статус: **Measured baseline; motion and responsive verification remain**

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
| Discovery grid container     | 1360 px at 1440 desktop, 40 px outer gutter, four 322 px cards with 24 px gaps        |
| Card title                   | `Onest` 16/700, line-height 20                                                        |
| Card creator/metadata        | 14/500; metric label 12/500; metric value 16/700                                      |
| Creator profile card example | 340×526, media 340×380                                                                |

Exact semantic token names and repeated-value clustering выполняются в WP1.
Card dimensions in the table are canonical screen variants; the reusable
`k5vYGf` reference below remains 322×456. Implementation selects the measured
variant by canonical consumer, not by stretching one card with arbitrary CSS.
Browse Works and Browse Authors use the shared `discoveryMaxWidth` token for
this four-column geometry. The H5vf2 toolbar order is facets → title → state
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

- Buttons and links remain visually and semantically distinct.
- Dropdown/menu is not a generic select; sort/filter controls use appropriate
  listbox/select semantics.
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

## 7. Old system boundary

`docs/modern-ui` and its design language are retired. Runtime components живут
в `apps/mobile/src/components/ui`; параллельного legacy component/token layer
нет. `components/ui` реализует текущую систему, но не заменяет Pen и design docs
как визуальный source of truth.

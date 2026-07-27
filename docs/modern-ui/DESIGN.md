# bidplace DESIGN

Status: **approved target visual system; implementation not started**

Last visual audit: 2026-07-27
Scope: a practical handoff for final bidplace UI work. It describes the target system, not the current application. References to search, filters, saved items or settings describe reusable visual language only; they do not authorize a route, API or control in the final MVP cutover.

## 1. How to use this document

Read this file together with [`00-project-decisions.md`](./00-project-decisions.md). This document explains how the system should look and behave; `00-project-decisions.md` remains the canonical source for target decisions and tokens. Product behaviour remains owned by the product documents.

When a task needs a visual precedent, find it in the [reference lookup](#12-reference-lookup) and open both the exact screenshot and its README. Do not treat a reference as permission to copy its musical, subscription, scanning, or collection behaviour.

Priority when sources differ:

1. bidplace product, auction, privacy, and accessibility rules;
2. [`00-project-decisions.md`](./00-project-decisions.md);
3. this document;
4. the local screenshot and its per-screen README;
5. the external source website.

## 2. Visual thesis

**Warm editorial marketplace**: a quiet archive of meaningful authored objects. The object, its author, story, and provenance lead; controls appear only beside a concrete action.

The resulting grammar is: **warm light canvas, black structure, rare orange signal, imagery as the main source of colour**.

- Content first: hero media, title, author, and auction truth are more important than UI chrome.
- One dominant action per meaning area: a wide black button for a bid, continuation, publication, or another consequential action.
- Progressive disclosure: story, provenance, long metadata, and filters belong in tabs, rails, sheets, or a dedicated route. Current bid, minimum next bid, deadline/status, and the bid CTA never hide there.
- Editorial rhythm: typography, whitespace, thin dividers, and varied content scale create hierarchy. Do not put every section into a card.
- Restricted colour: almost all UI is light/black/gray. Orange is a scarce semantic signal, never general decoration.
- Native restraint: clear controls, safe-area-aware sheets, stable image geometry, and obvious focus/selected states. No invented visual effects.

## 3. Evidence and decisions

The local review confirms the repeated visual patterns in the supplied screenshots: large rounded black actions, light surfaces, a neutral sans with a technical mono role, black selected pills, thin outlined metadata tags, image-led rails, right-aligned subdued technical values, and rare orange annotations.

The following are **not visually provable** from screenshots and are therefore not target facts: the exact MyPlastic font files, an implementation tool, its logo font, exact source CSS/SwiftUI values, or unshown interactions. The uploaded prose is useful as an interpretation, but it cannot overrule the visual evidence or bidplace’s existing decisions.

| Topic from supplied prose | Audit conclusion | bidplace rule |
| --- | --- | --- |
| `SF Pro` / `SF Mono` is Plastic’s exact typography | Plausible visual resemblance; unconfirmed | Use target Inter + PT Mono. A platform-specific fallback needs a real font/coverage check. |
| Custom Poppins ExtraBold logo | Not present in the supplied screenshots and conflicts with the existing brand audit | Do not introduce it. Keep the existing brand behind the future brand adapter. |
| Suggested reconstructed HEX values | Mostly compatible in direction, not measurements | Use only the approved tokens below. |
| 8 px grid with 4 px micro-step | Compatible with the system | Base unit is 4; 8 is the normal rhythm. |
| 56–60 px primary action | Compatible range | Canonical target height is 56 px. |
| Orange for every active state | Too broad if read literally | Use only for the limited semantic cases below; black/white selected controls remain the default. |
| Scanner, music, collection and subscription actions | Reference-specific behaviour | Never copy into bidplace without a scoped product feature. |

The official source entry is [myplastic.app](https://myplastic.app/). Its currently accessible page does not expose enough static information to validate visual details, so all visual claims in this package are grounded in the locally saved screenshots.

## 4. Foundations

### Colour

Use only semantic names through the future token layer. These are target values, not current runtime tokens.

| Token | Value | Use |
| --- | --- | --- |
| `canvas` | `#F7F4EE` | page background |
| `surface` | `#FFFFFF` | sheets, fields, controls, grouped settings |
| `surfaceMuted` | `#F1EEE8` | quiet control background |
| `ink` | `#111111` | primary text, selected controls, primary action |
| `inkSoft` | `#252525` | strong secondary text |
| `textSecondary` | `#77736D` | author, supporting information |
| `textMuted` | `#A5A099` | placeholders and tertiary technical information |
| `border` | `#E2DDD4` | dividers and outlines |
| `chip` | `#EEEAE4` | inactive chip/tab background |
| `placeholder` | `#D8D4CD` | stable image placeholder |
| `accent` | `#D94A24` | rare signal |
| `accentDark` | `#BC3C1B` | pressed/strong accent |
| `accentSoft` | `#FFF0E8` | restrained accent background |
| `success` | `#3F7A48` | confirmed positive result, with text/icon |
| `danger` | `#D6453D` | destructive/error result, with text/icon |
| `overlay` | `rgba(0, 0, 0, 0.22)` | sheet/modal backdrop |

Aim for 85–90% light surface, 8–12% ink/gray, and no more than roughly 2–3% orange. Artwork may introduce strong colours inside its own media or a deliberately curated editorial band; it never changes the base UI palette.

Orange may identify a BackButton, active navigation mark, ending-soon signal, active-filter indicator, or a short editorial date/status such as `НОВИНКА` or `ЗАВЕРШАЕТСЯ`. It must not colour every price, regular link, CTA, badge, or large surface. Status always also has text and/or iconography.

### Typography

| Role | Target |
| --- | --- |
| Display | Inter 700, 36/42 desktop; 32/38 mobile |
| Screen title | Inter 700, 30/36 desktop; 28/34 mobile |
| Section title | Inter 600, 22/28 desktop; 20/26 mobile |
| Card title | Inter 600, 16/21 |
| Body | Inter 400, 17/26 |
| Body small | Inter 400, 15/22 |
| Label | Inter 500, 14/19 |
| Metadata | PT Mono 12/16, tracking `0.03em` |
| Button | PT Mono 15/18, tracking `0.03em` |
| Caption | PT Mono 11/15, tracking `0.06em`; short uppercase status only |
| Numeric | PT Mono 14–18 with tabular figures |

Use sans for names, headings, descriptions, stories, legal text, and forms. Use mono to give short controls, filters, tags, timestamps, bid values, status, and technical facts their archive/utility character. Never set long reading text in mono.

### Space, geometry, and containers

Base unit: 4 px. Approved spacing: **4, 8, 12, 16, 20, 24, 32, 40, 48, 64**.

| Rule | Target |
| --- | --- |
| Mobile gutter | 20 px; 24 px on wide mobile |
| Desktop gutter | 32 px |
| Section gap | 32–40 px |
| Minimum hit target | 44 × 44 px |
| Primary / secondary button | 56 px high |
| Search/input | 50–52 px high |
| Filter chip | 34–36 px high |
| Content tab | 44–46 px high |
| Mobile bottom action | 56–64 px + safe area |
| Detail page max-width | 1180–1280 px |
| Form/settings max-width | 720–960 px |

Radii are intentional, not decorative: `small 8`, `control 14`, `image 16`, `button 18`, `panel 22`, `sheet 28`, `pill 999`. Ordinary content does not need a rounded background. Shadows are off by default; a subtle elevation is allowed only for a sheet, dialog, floating action dock, dropdown, or temporary drag preview.

### Breakpoints

Mobile is the primary composition. Use one route tree and shared component API.

| Viewport | Shell and layout |
| --- | --- |
| Mobile | compact header, scroll content, bottom navigation, sheet, sticky action when needed |
| Desktop | compact sidebar, top search, wider content/grid, contextual panel; use dialog/popover/side panel instead of a mobile sheet |

Exact CSS breakpoints are an implementation concern and must be recorded with the target primitives; do not create a second information architecture for desktop.

## 5. Media, imagery, and composition

Media is evidence of value, not a background decoration.

- Keep the object visible before dense metadata. Product-detail hero uses the original image ratio when it protects the object; a controlled offset overlap may add depth without hiding information.
- Catalog cards use `4:5` or an original ratio where crop would distort the work. Keep card geometry stable through loading/error states.
- Author/seller hero may be `16:9`; a partial next image can show a swipeable sequence without carousel arrows. Do not use it where it hides defects or competes with bidding.
- Round avatars are `1:1`; related work may use a horizontal rail with a partial next item visible.
- Images retain `image` radius. Placeholder has the same ratio and a quiet `placeholder` surface; never jump layout, use a bright shimmer, random gradient, or text error over the image.
- A product hero may use one restrained controlled object-related overlay/offset (the disc effect in the primary reference). It is an editorial composition device, not an icon to reproduce or a required effect on every item.

## 6. Shared components and icon language

| Component/pattern | Visual rule | Behavioural boundary |
| --- | --- | --- |
| PrimaryButton | ink surface, white PT Mono, 56 px, radius 18, no shadow | one decisive action; explicit loading/disabled/error states |
| SecondaryButton | surface with 1 px ink border or muted fill | alternative non-destructive action |
| TextButton | no container; underline only for link-like content | do not make a passive label look actionable |
| IconButton | 44 px target, 18–26 px icon, no unnecessary container | every icon-only action has an accessible name |
| BackButton | orange `ChevronLeft` | return navigation only; do not substitute `ArrowLeft` |
| FilterChip | mono pill; light inactive, ink/white active; real count only | interactive filter/sort only |
| MetadataChip | thin outlined mono capsule | passive fact by default; interactive only when it opens/applies a real filter |
| SegmentedControl | muted track and moving/active ink segment for 2–3 modes | mutually exclusive view mode, not arbitrary navigation |
| ContentTabs | light pills with ink selected tab | progressive detail only; auction truth remains outside |
| Search + filter | quiet field, gray mono placeholder, filter icon in its own control | filters open AppSheet on mobile, popover/side panel on desktop |
| Compact row | thumbnail, title, a quieter second line, technical third line, divider | dense Activity/search/saved context; not a heavy card |
| Row plus/minus | outline plus for reversible add; visually distinct minus/trash for removal | never bids, purchases, or hidden destructive changes; confirm meaningful removal |
| AppSheet | white surface, top radius 28, handle, `Cancel / title / Save` anatomy where choices need confirmation | one cross-platform adapter; focus/escape/drag semantics are required |
| Settings group | calm groups, dividers, separated destructive block | grouped preferences, not product metadata |
| BottomActionBar | restrained floating/sticky mobile dock | may show bid summary + bid CTA; never duplicate or obscure auction data |

Use one icon vocabulary. Inline `→` is a route to a fuller list or category. Chevron means nested route or another layer. Filter/sliders opens filtering. Gear opens settings. Check means selection/confirmation, never the only status signal. Plus and minus have the dedicated meanings above. Use a neutral outline/line weight consistently; do not mix unrelated icon styles.

## 7. Interaction and states

All shared controls explicitly handle default, hover where available, pressed, focus-visible, disabled, loading, selected, error, and reduced-motion states as applicable.

- Press: button scale `0.98` with opacity `0.92`; cards `0.992`/`0.96`; icon opacity `0.6`. Motion uses the approved 80/120/180/260 ms system.
- Focus: a non-colour-only focus ring and logical keyboard order on web.
- Loading: preserves geometry, exposes busy state, and never makes business actions wait for a decorative transition.
- Disabled: visible label/icon with readable contrast and an explanation where it is not obvious.
- Error: plain language, retry/recovery route, safe inputs preserved. Never silently imply a bid/order succeeded.
- Reduced motion: remove translate and scale; retain the state change.
- Sheets/dialogs: return focus on close; close/Cancel is explicit; destructive actions explain the consequence before commit.

## 8. Screen recipes

### Product detail — primary visual direction

Start with [MyPlastic product-page reference](./references/design-photos/myplastic/product-page/README.md), then apply bidplace auction rules.

```text
Back
Object hero / controlled image overlap
Title
Author or seller/provenance link →
Small outlined tags: year · category · material · edition/provenance
Current bid · minimum next bid · remaining time/status
PrimaryButton: Сделать ставку
Tabs: О предмете | История создания | Происхождение
Bid history / related items
Mobile BottomActionBar
```

Tags are short anchors, near-monochrome, and limited. They represent actual facts and may link to a real filter: `НОВИНКА`, year, category, material, edition, or public city/origin. They never carry price, deadline, error, private data, or invented scarcity. Use orange for only a rare semantically important tag, never to make the whole tag row colourful.

### Discovery, search, and filters

Start with [catalog](./references/design-photos/myplastic/catalog/README.md), [discovery sheet](./references/design-photos/myplastic/discovery/README.md), [search](./references/design-photos/myplastic/search/README.md), [versions](./references/design-photos/myplastic/versions/README.md), and [Tracker](./references/design-photos/tracker/README.md).

Use a segmented `Все / Для вас` mode when product scope supports it, a separate filter control, a horizontal chip row, calm image-first rails, and text-plus-arrow headings. Use a partial next card to signal scrolling. The active filter is black/white by default; Tracker’s yellow is not a bidplace colour token.

### Author/seller profile

Start with [author profile](./references/design-photos/myplastic/author/README.md) and [dashboard](./references/design-photos/myplastic/dashboard/README.md). Use a large image or partial-image rail, short public description, `N работ →`, work rails, and optional real collaborators. A gear icon is only a settings route. Circular metrics are optional and limited to real seller operational data; never use decorative dashboards.

### Auth, settings, and empty states

Start with [auth](./references/design-photos/myplastic/auth-login/README.md), [settings](./references/design-photos/myplastic/settings/README.md), and [collection empty state](./references/design-photos/myplastic/collection/README.md). Auth gets one clear task, low density, a large black CTA, and no distracting product media. Settings use quiet grouped rows with destructive actions isolated. Empty screens explain the next actual step rather than importing MyPlastic’s Discogs/music language or illustration.

## 9. Navigation

- Mobile: compact header, bottom navigation for global destinations, local filters in a sheet, and an optional safe-area-aware bottom action bar.
- Desktop: compact sidebar and top search; desktop equivalents replace mobile sheets without changing route ownership.
- Auth and confirmation flows deliberately omit global navigation.
- A navigation icon or arrow appears only when it opens a real route/layer. Passive tags and metadata never mimic buttons.

## 10. Non-negotiable exclusions

- No generic SaaS dashboard, luxury boutique, trading/casino urgency, or eBay-style resale density.
- No decorative gradients, ambient glows, default card shadows, badge stacks, or every-element pill radius.
- No copying Plastic’s vinyl/disc illustrations, music-service actions, scanning, subscription, wishlist, or collection model.
- No passive element styled as a button; no interactive element without a clear label/state.
- No colour-only status, hidden auction-critical data, fake live signals, fake scarcity, or unsupported counts.
- No raw colours, raw spacing, raw motion values, direct third-party visual imports, or custom one-off components in a screen route.

## 11. Extending the reference library

Every new reference gets a service folder, semantic filename, copied image, and a README beside it. Add it to the [photo catalog](./references/design-photos/README.md), then add a line to the [visual audit](./references/REFERENCE-AUDIT.md) stating: what is directly visible, what bidplace takes, what it rejects/adapts, platform/state, and date. A source is approved only after that audit; external links alone are not visual evidence.

## 12. Reference lookup

| Need | Exact screenshot and analysis |
| --- | --- |
| Login / registration hierarchy and big actions | [Auth screenshot](./references/design-photos/myplastic/auth-login/auth-login-mobile-reference-01.png) · [analysis](./references/design-photos/myplastic/auth-login/README.md) |
| Grouped settings and mono utility typography | [Settings screenshot](./references/design-photos/myplastic/settings/myplastic-settings-mobile-reference-01.png) · [analysis](./references/design-photos/myplastic/settings/README.md) |
| Seller dashboard, gear, restrained metrics | [Dashboard screenshot](./references/design-photos/myplastic/dashboard/myplastic-dashboard-mobile-reference-01.png) · [analysis](./references/design-photos/myplastic/dashboard/README.md) |
| Empty state, category switch, close action | [Collection screenshot](./references/design-photos/myplastic/collection/myplastic-collection-empty-mobile-reference-01.png) · [analysis](./references/design-photos/myplastic/collection/README.md) |
| Switcher, filter icon, checkbox AppSheet | [Discovery screenshot](./references/design-photos/myplastic/discovery/myplastic-discovery-filter-mobile-reference-01.png) · [analysis](./references/design-photos/myplastic/discovery/README.md) |
| Editorial image rails, gray metadata, rare orange label | [Catalog screenshot](./references/design-photos/myplastic/catalog/myplastic-catalog-mobile-reference-01.png) · [analysis](./references/design-photos/myplastic/catalog/README.md) |
| Technical right-aligned values and related-items rail | [Product-detail screenshot](./references/design-photos/myplastic/product-detail/myplastic-product-detail-mobile-reference-01.png) · [analysis](./references/design-photos/myplastic/product-detail/README.md) |
| **Primary product detail:** hero, tags, CTA, tabs, story | [Notes state](./references/design-photos/myplastic/product-page/myplastic-product-page-notes-mobile-reference-01.png) · [story state](./references/design-photos/myplastic/product-page/myplastic-product-page-story-mobile-reference-02.png) · [analysis](./references/design-photos/myplastic/product-page/README.md) |
| Author hero, partial next image, `N works →` | [Author screenshot](./references/design-photos/myplastic/author/myplastic-author-profile-mobile-reference-01.png) · [analysis](./references/design-photos/myplastic/author/README.md) |
| Quiet search, `RECENT`, dotted `VIEW ALL` | [Search screenshot](./references/design-photos/myplastic/search/myplastic-search-scan-mobile-reference-01.png) · [analysis](./references/design-photos/myplastic/search/README.md) |
| Sort chips, compact rows, bulk add/remove, plus/minus | [Filter state](./references/design-photos/myplastic/versions/myplastic-versions-filter-mobile-reference-01.png) · [add state](./references/design-photos/myplastic/versions/myplastic-versions-add-mobile-reference-02.png) · [analysis](./references/design-photos/myplastic/versions/README.md) |
| Compact list, filter button, timer hierarchy | [Tracker screenshot](./references/design-photos/tracker/tracker-list-mobile-reference-01.png) · [analysis](./references/design-photos/tracker/README.md) |

The [complete image catalog](./references/design-photos/README.md), [MyPlastic source overview](./references/design-photos/myplastic/README.md), and [visual audit](./references/REFERENCE-AUDIT.md) are the maintained entry points for new agents.

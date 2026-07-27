# Current design baseline report

Status: **repository snapshot for migration planning; no visual migration implemented**

Audit date: 2026-07-27
Method: source inspection of the mobile application, token package, routes, shared components, current product/design owner documents, and existing verification records.

This report is the evidence packet produced by [`07-current-design-research-plan.md`](./07-current-design-research-plan.md). It does not approve a new product flow or replace [`01-current-audit.md`](./01-current-audit.md), which owns the broader CURRENT → TARGET repository audit.

## 1. Executive baseline

The current app is a single Expo Router application for native and web. It uses Tamagui 2.4.5 as the visible primitive/configuration layer, shared `@bidplace/design-tokens`, Inter + Cormorant Garamond, a warm near-white canvas, cobalt primary controls, light bordered panels, and a mobile sheet navigation drawer. Most visual styling still lives in feature/component `style` objects.

The app already carries critical production-like behaviour: buyer OTP and bid retry, server-authoritative listing refresh/reconnect, seller product image/upload/edit gates, role-scoped order handoff, and admin moderation. Those behaviours are migration invariants. A new UI can change hierarchy and component structure; it must not recreate, infer, or relocate the domain rules.

The target system conflicts with the current visual layer, not its business boundaries: it changes cobalt to ink/orange, removes Cormorant as a UI heading role, adds a mono role, reduces generic panels/cards, introduces controlled image-first rails/tags/tabs, and replaces the drawer-oriented mobile shell with the target navigation adapters. This requires a staged bridge; it is not a token-only restyle.

## 2. Evidence and scope

| Evidence | Current source |
| --- | --- |
| Route and feature behaviour | [`apps/mobile/src/app/`](../../apps/mobile/src/app/) and [`apps/mobile/src/features/`](../../apps/mobile/src/features/) |
| Shared UI/layout | [`components/ui`](../../apps/mobile/src/components/ui/) and [`components/layout`](../../apps/mobile/src/components/layout/) |
| Tokens, fonts, media rules | [`packages/design-tokens/src/index.ts`](../../packages/design-tokens/src/index.ts), [`src/theme/tokens.ts`](../../apps/mobile/src/theme/tokens.ts), [`tamagui.config.ts`](../../apps/mobile/tamagui.config.ts) |
| Current product constraints | [`docs/product/05-MVP-RFC.md`](../product/05-MVP-RFC.md), [`09-TRUST-AND-AUCTION-INTEGRITY.md`](../product/09-TRUST-AND-AUCTION-INTEGRITY.md) |
| Current implementation/QA status | [`docs/product/11-PROJECT-STATUS.md`](../product/11-PROJECT-STATUS.md), [`docs/design/04-DESIGN-STATUS.md`](../design/04-DESIGN-STATUS.md) |
| Target visual system and photo evidence | [`DESIGN.md`](./DESIGN.md), [reference audit](./references/REFERENCE-AUDIT.md) |

Not verified in this research: a fresh device run, screen-reader/keyboard run, exact current visual dimensions on all viewports, or production analytics/performance metrics. Existing closed-pilot browser evidence is useful but does not substitute for target visual QA.

## 3. Current runtime and design ownership

| Area | Current state | Planning implication |
| --- | --- | --- |
| Application | Expo 57 / Expo Router / React Native + React Native Web; one route tree | Preserve shared domain logic and routes during visual work. |
| UI primitive | Tamagui 2.4.5 provider, stacks, text, button, sheet, media queries | Do not remove provider/config until all bridge callers are migrated. |
| State/data | React Query + generated API client + feature screens | Retain queries/mutations and API projections; split view layer from feature logic gradually. |
| Media | Expo Image and Expo Image Picker | Wrap in target `AppImage`; preserve stable ratio, cache, upload and error behaviour. |
| Motion | Reanimated and Gesture Handler installed; no shared motion wrapper found | A target motion layer can be introduced without changing business code, but needs accessibility/reduced-motion verification. |
| Icons | No approved icon library/system found | Inventory existing text-based controls, choose a single icon adapter before screen work. |
| Testing | Typecheck, ESLint, Expo export, Vitest, Playwright closed-pilot flow | Add visual/accessibility/device matrix before accepting pilot UI. |

## 4. Current visual foundation

### Tokens and assets

| Dimension | Current evidence | Target-planning effect |
| --- | --- | --- |
| Canvas / surface | `#F7F6F3` / `#FFFFFF` | Close in warmth but target semantic palette must be introduced centrally. |
| Primary | cobalt `#2457E6` with hover/pressed/tint | Direct visual conflict: move to ink primary only through a bridge/token transition. |
| Text | `#171717`, gray secondary/muted | Map to target `ink`, `textSecondary`, `textMuted`; audit contrast. |
| Status | green, yellow/brown, red, blue info | Preserve state semantics; target cannot collapse state into orange or colour-only messaging. |
| Spacing | 2–96 scale, including 6/10/14/28/36/56/80/96 | Target restricts common rhythm to approved 4-based values; migrate local exceptions by component, not globally. |
| Radius | 4/8/12/16/999 | Target uses 8/14/16/18/22/28/999; generic panel radius conflicts with editorial no-card approach. |
| Typography | Inter body; Cormorant Garamond headings/wordmark | Target is Inter + PT Mono; PT Mono asset and Cyrillic coverage are not currently present. |
| Brand | `brand-mark.png`; live Cormorant wordmark | Preserve behind a brand adapter until an approved wordmark/compact mark decision exists. |
| Breakpoints | ≤640, ≤1024, ≥1025, ≥1440 | Keep route tree; validate target shell at equivalent narrow/wide states before deciding exact implementation breakpoints. |

### Direct-style debt that affects sequencing

- Feature screens import Tamagui directly and set typography, colour, gaps, and layout in local `style` objects.
- `ProductCard` contains raw status hex values; `DetailList` references direct palette values; components mix theme palette and token imports.
- `AppButton`, `AppInput`, `Screen`, `Surface/AppCard`, and `OperationalPanel/EntityPanel` encode current radii/spacing/visual hierarchy that many routes inherit.
- `PrimaryButton`, `AppCard`, and `EntityPanel` are compatibility aliases, so a name-only audit will undercount consumers.

## 5. Shared component and primitive map

| Current owner | Current role / consumers | Target successor | Transition classification |
| --- | --- | --- | --- |
| [`AppButton`](../../apps/mobile/src/components/ui/AppButton.tsx) | primary/secondary/subtle/danger; feature forms, bid, seller, order, admin | `PrimaryButton`, `SecondaryButton`, `TextButton` with semantic APIs | adapt behind bridge; split tone meanings before pilot |
| [`AppInput`](../../apps/mobile/src/components/ui/AppInput.tsx) + FormField | native TextInput, label/hint/error | future input/form adapter | retain behaviour, replace visual primitive in form pilot |
| [`Surface/AppCard`](../../apps/mobile/src/components/ui/AppCard.tsx) | generic white bordered panel, auth and content grouping | limited surface/panel use | replace selectively; do not carry generic card usage into target |
| [`OperationalPanel/EntityPanel`](../../apps/mobile/src/components/ui/EntityPanel.tsx) | transactional detail, bid/order/admin sections | domain panel / detail layout | adapt only where a bounded operational surface is still needed |
| [`AppSheet`](../../apps/mobile/src/components/ui/AppSheet.tsx) | Tamagui modal drawer/sheet | target `AppSheet` adapter | retain API idea; replace library only after web/native proof |
| [`StatusBadge`](../../apps/mobile/src/components/ui/StatusBadge.tsx) | listing, participation, seller/product/admin status | explicit status text + limited semantic treatment | adapt; reduce badge chrome but preserve state/meaning |
| [`Screen`](../../apps/mobile/src/components/ui/Screen.tsx) + AppHeader | safe area, header, scroll/padding | mobile/desktop shell adapters | replace in shell pilot only; all routes depend on it |
| [`ProductCard`](../../apps/mobile/src/components/ui/ProductCard.tsx) | catalog image, author, title, price/status | target `AuctionCard` | replace in first pilot; preserve public link and listing facts |
| Loading / Empty / Error | common recovery states | target equivalents | retain semantics; reconcile geometry/copy in each pilot |
| Header + desktop nav + mobile drawer | role-aware navigation and logout | desktop sidebar / mobile tab/navigation adapters | defer exact shell until routes and icon model are decided |

## 6. Route and state baseline

| Area / route | Current visual composition | Behaviour that must survive | Target visual priority | Migration risk |
| --- | --- | --- | --- | --- |
| Catalog `/` | serif page title, responsive 2–4-column `ProductCard` grid | approved product query; loading/error/empty/refetch | image-first `AuctionCard`, discovery hierarchy, filters later only if scoped | medium: data list is safe, but card/layout replacement affects density |
| Product `/product/[publicId]` | horizontal fixed-size gallery, Cormorant title, story/provenance inline, bordered detail and listing panels | realtime refresh, public bid aliases, OTP, minimum bid, idempotent retry, order access | **highest**: primary product reference, tags, CTA, tabs; auction facts stay before tabs | high: densest state/interaction surface |
| Auth `/login`, `/register` | `Screen`, card/form, current buttons/fields | redirect, validation, error and supported auth path | low-density auth sheet and black CTA | medium: behaviour ready, visual shell/form states must remain explicit |
| Activity `/me/activity` | current shared panels/rows and status badges | buyer participation/order visibility and state copy | `CompactAuctionRow`, one legible status per row | medium: privacy/state hierarchy cannot be reduced to colour |
| Order `/order/[publicId]` | operational summary and role-specific actions | authorized contact projection, seller handoff status/retry | calm summary with sticky action only where needed | high: privacy and destructive/action states |
| Seller profile `/(seller)/profile` | form/profile image/status and current panels | `CHANGES_REQUESTED` edit gate, public-photo upload | author/seller profile pattern, grouped settings/real metrics only | high: permission/upload/read-only states |
| Product draft/edit `/(seller)/products/*` | staged forms, panels, image management | locked/unlocked policy, validation, upload/delete/reorder | target staged form and media controls | high: media states and server lock |
| Listing draft `/(seller)/listings/new` | form/panels/actions | start price/date server validation, explicit schedule | target staged auction form | high: price/time correctness and errors |
| Admin `/admin` | compact review panels, badges, action buttons | role guard, confirmation, anonymous bid replacement | same tokens/components without SaaS dashboard | high: destructive/admin confirmation |

## 7. Navigation, media, accessibility, and platform findings

| Concern | Current evidence | Migration constraint |
| --- | --- | --- |
| Mobile navigation | `AppHeader` opens a Tamagui `MobileNavigationDrawer` | Do not install visual tabs while routes/role destinations are undecided; preserve menu/logout access. |
| Desktop navigation | header-embedded `DesktopNavigation` with text links | Target sidebar/top-search needs one route-tree mapping and desktop keyboard/nav QA. |
| Sheets | Tamagui modal `Sheet`, overlay, snap points, Escape close added in drawer | Target sheet/dialog adapter must return focus and have web/native parity. |
| Media | Expo Image in cards/detail/profile; gallery uses `cover`; picker in seller flows | Target image composition cannot crop away item defects, reorder controls, or missing-image recovery. |
| Accessibility | roles/labels/live region and several 44 px targets exist | Preserve these; add systematic focus, screen-reader, keyboard, reduced-motion, and icon-label verification. |
| Responsive | `useMedia`/runtime checks and one `Platform.select` sticky header | Test native/web differences individually; do not create a separate desktop product flow. |

## 8. CURRENT → TARGET planning crosswalk

| Current | Target | Classification | Precondition |
| --- | --- | --- | --- |
| Tamagui provider/direct primitives | bidplace public UI-kit/adapters over the chosen primitive stack | adapt behind bridge | dependency compatibility ADR and pilot adapter proof |
| Cobalt AppButton / current aliases | ink/white button family + TextButton | replace in pilot | complete caller inventory and state matrix |
| Generic white panels/cards | editorial spacing, dividers, deliberate panel use | replace selectively | product-detail and forms decide which panels remain functional |
| Cormorant headings | Inter hierarchy + PT Mono for technical roles | replace in pilot | approved font asset and Cyrillic/weight verification |
| Current `ProductCard` | `AuctionCard` | replace in pilot | preserve image/title/price/deadline/status and link semantics |
| Current gallery + inline story | object hero, factual tags, content tabs | replace in pilot | critical bid data stays visible; photo provenance/crop rules agreed |
| Drawer/header | target mobile/desktop navigation adapters | defer | route map, icon set, and role navigation decision |
| Tamagui AppSheet | target AppSheet API | adapt behind bridge | web/native focus, dismiss, safe-area, and error-action proof |
| Local press opacity | centralized motion pressable | defer | reduced-motion and pointer/keyboard behaviour defined |
| Direct Expo Image | AppImage adapter | adapt in pilot | stable ratios, placeholders, accessibility descriptions |

## 9. Decisions and evidence still required before a migration plan

1. **Target dependency decision:** confirm whether NativeWind/RN Primitives/Reusables/Gorhom/Lucide are still the selected stack and their Expo 57-compatible production versions. No dependency appears in the current manifest.
2. **Font/brand decision:** supply/approve PT Mono and final wordmark/mark assets, then test Cyrillic and web/native loading. Do not infer the source application’s exact fonts.
3. **Navigation decision:** define mobile destinations and desktop equivalent before replacing the drawer; current global routes are limited and role-specific.
4. **Product-detail content decision:** decide the exact factual tag set and tab ownership without hiding bid/deadline/minimum bid/CTA.
5. **Icon decision:** approve one accessible icon family and the role-to-icon mapping.
6. **Visual QA decision:** name owners and capture baseline/target checks for iOS Safari, Android Chrome, macOS Safari/Chrome, Windows Chrome, keyboard, screen reader, reduced motion, long Russian copy, all image states, and reconnect/offline.

## 10. Inputs for the future transition plan

The plan can now be written in this dependency order:

1. freeze the current baseline and acceptance/rollback matrix;
2. approve dependencies, fonts, assets, icon vocabulary, and navigation ownership;
3. introduce token/font/primitive bridges without touching current route behaviour;
4. migrate the bounded pilot: Catalog card/shell, Product detail, Seller product form;
5. pass behaviour, visual, accessibility, and three-platform checks for the pilot;
6. migrate buyer flows, seller flows, and admin in separate role-aware waves;
7. remove old aliases/Tamagui only after no route depends on the bridge.

The detailed phase gates, stop conditions, and rollback principles remain in [`05-migration-plan.md`](./05-migration-plan.md). This report supplies the evidence needed to turn those phases into scoped implementation tasks.

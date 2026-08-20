# Creator-first technical implementation contract

Status: binding implementation contract for the creator-first redesign.
Scope: `apps/mobile` (Expo web + iOS + Android), `packages/design-tokens`.
Visual source of truth: `design/creator-first/spec/**` only. The old UI is a behavior/contract reference, never a visual reference.
Machine-readable companion: `design/creator-first/implementation/implementation-map.yaml`.

Normative words: MUST, MUST NOT, SHOULD, MAY.

---

## 1. Executive decision

The creator-first UI is implemented **inside the existing single Expo app** (`@bidplace/mobile`, Expo 57 / React Native 0.86 / React 19 / React Native Web 0.21 / Expo Router 57) with:

- **Styling:** `StyleSheet.create` + token references. NativeWind is retired (it is configured but has zero usage today).
- **Tokens:** `@bidplace/design-tokens` gains a new canonical creator-first token set (primitive → semantic → component). The legacy `designTokens` export becomes deprecated and is deleted in Wave 9.
- **Fonts:** Piazzolla + Golos Text static TTFs from `design/creator-first/assets/fonts/` via the `expo-font` config plugin (native embed) plus a web font gate. Inter/Onest packages removed in Wave 9.
- **Icons:** Phosphor via one new dependency `phosphor-react-native` (renders `react-native-svg`, already installed) behind a single `Icon` registry. Lucide removed in Wave 9.
- **Motion:** Reanimated 4.5 (already installed, currently unused) becomes the canonical animation system; Gesture Handler 2.32 for gestures; one `InteractiveSurface` primitive owns hover/focus/press.
- **Overlays:** one `AdaptiveModal` abstraction on `@rn-primitives/dialog` + portal (desktop dialog / mobile bottom-sheet presentation). `@gorhom/bottom-sheet` removed (never imported).
- **Media:** `expo-image` behind a new `MediaImage` primitive that keeps the existing `media-recovery.ts` retry state machine.
- **Lists:** one vertical `ScrollView` per screen, deterministic flex-row grids, horizontal snap rails. No FlashList (all collections are server-bounded).
- **Data:** React Query + `packages/contracts` + `packages/api-client` + socket→invalidate realtime, unchanged. No client-side auction business rules. No Zustand.
- **Routes:** the existing route contract is kept verbatim (`/product/[publicId]`, `/seller/[slug]`, `/works`, `/authors`, …). Blueprint vanity routes are recorded as an unresolved product decision (§14).

One component system, four layers under `apps/mobile/src/components/ui/` (primitives → controls → composite → scenes), consumed by thin routes/features.

---

## 2. Current stack audit

Versions verified against `pnpm-lock.yaml` on this worktree.

| Technology | Installed | Current usage | Verdict | Reason |
|---|---|---|---|---|
| expo | 57.0.4 | App platform | keep | Foundation |
| expo-router | 57.0.4 | File routes, Stack, typedRoutes | keep | Route contract owner |
| react / react-dom | 19.2.3 | Runtime | keep | Foundation |
| react-native | 0.86.0 | Runtime | keep | Supports `boxShadow` string, `gap`, `borderCurve` |
| react-native-web | 0.21.2 | Web target | keep | Single-codebase web |
| typescript | 6.0.3 (mobile) | Types | keep | — |
| @tanstack/react-query | 5.101.2 | All server state | keep | Canonical server-state owner |
| react-hook-form + @hookform/resolvers | 7.81.0 / 5.4.0 | Auth forms only | extend | Becomes canonical for all creator-first forms |
| zod | 3.25.76 | contracts + resolvers | keep | Shared validation |
| expo-image | 57.0.1 | `ResilientRemoteImage` | extend | Wrapped by new `MediaImage` |
| expo-font | 57.0.0 | Runtime `useFonts` (Inter/Onest) | extend | Config-plugin embed for Piazzolla/Golos |
| expo-image-picker | 57.0.2 | Media upload | keep | `media_input` upload source |
| expo-linear-gradient | 57.0.1 | `AmbientImageBackground` | remove later | Creator-first system has no decorative gradients |
| react-native-reanimated | 4.5.0 | Installed, unused in `src/` | extend | Canonical motion engine (press, swipe, sticky bar, LIVE pulse) |
| react-native-gesture-handler | 2.32.0 | Root view only | extend | Tap/Pan gestures for animated states |
| react-native-safe-area-context | 5.7.0 | AppShell | keep | Safe areas |
| react-native-screens | 4.25.2 | Router | keep | — |
| @rn-primitives/dialog (+portal) | 1.5.2 | `AppDialog` | extend | Base of `AdaptiveModal` |
| @gorhom/bottom-sheet | 5.2.14 | **Never imported** | remove later | Dead dependency; `AdaptiveModal` covers sheets |
| nativewind + tailwindcss + react-native-css-interop | 4.2.1 / 3.4.17 / 0.2.1 | Configured, **zero `className` usage** | remove later | One styling system only (§6.1) |
| socket.io-client | 4.8.1 | `useListingRealtime` | keep | Realtime invalidation |
| lucide-react-native | 1.27.0 | `AppIcon` | replace | Design contract mandates Phosphor |
| react-native-svg | 15.15.5 | Lucide peer | keep | Phosphor peer too |
| @expo-google-fonts/inter, /onest | 0.4.x | Old typography | remove later | Replaced by Piazzolla/Golos assets |
| @playwright/test | 1.61.1 | e2e (API + Expo web) | keep | Visual + flow verification |
| vitest | 4.1.10 | ~26 logic specs | keep | Unit layer |
| @shopify/flash-list | — | absent | do not add | No unbounded feeds (§6.6) |
| expo-blur | — | absent | do not add | `expo-image` blurRadius + opaque fallback suffice (§6.14) |
| expo-video | — | absent | defer | `video_process_story` is designed_post_mvp (§6.15) |
| zustand / moti / jest / maestro | — | absent | do not add | No owner component |
| React Compiler | not enabled | — | defer | Out of redesign scope; manual memo rules apply |

Existing components whose **behavior** is preserved (visuals fully replaced): `media-recovery.ts` retry machine, `SlideToBid` geometry + PanResponder→(migrated to Gesture Handler), `useListingRealtime`, `useReducedMotion` / `getMotionDuration`, `resolveMediaUrl`, `getSafeRedirect`, `EmailRulesGate` eligibility machine, `ProtectedRoute`, query-key layout and invalidation graph, `AppDialog` focus-return-on-web logic.

---

## 3. Non-negotiable architecture

1. There MUST be exactly one component system for web and native. Separate web-only or native-only UI trees MUST NOT be created when a responsive composition of a shared component can express the difference.
2. Visual values MUST come from `@bidplace/design-tokens`. Inline magic numbers/colors MUST NOT appear in components or screens (exceptions: `0`, `1`, flex fractions, aspect-ratio math derived from tokens).
3. Old visual values (Onest/Inter, legacy colors, radii, spacing) MUST NOT be copied into new components. New code MUST import only the creator-first token set.
4. Server state MUST live in React Query only. It MUST NOT be duplicated into local stores, context, or module singletons.
5. Auction business rules (minimum bid, soft close, winner, eligibility) MUST remain server-owned. The client MAY only map server facts to presentation states.
6. The existing route contract MUST NOT change without an explicit product decision (§14-R1).
7. Every interactive element MUST meet 44×44 hit target, have a role + label, visible focus, and honor reduced motion.
8. Each canonical Pen master MUST have exactly one production component. Screen-local card/dialog/nav copies MUST NOT be created.
9. New dependencies MUST have a named owner component, Expo+iOS+Android+RNW support (or an explicit platform fallback), and MUST be listed in §5 before installation.
10. Lower-cost agents MUST NOT re-open decisions marked `Classification: durable fix` in this contract.

---

## 4. Layer architecture

```
L0 tokens       packages/design-tokens/src/**            (no React)
L1 primitives   apps/mobile/src/components/ui/primitives  Text, Surface, InteractiveSurface,
                                                          MediaImage, Icon, ScreenScroll, VisuallyHidden
L2 controls     apps/mobile/src/components/ui/controls    Button, Chip family, FormField, SearchEntry,
                                                          StatusChip, TabPill, FilterChip, Skeleton,
                                                          ErrorBlock, EmptyState, SectionHeader, InlineFeedback
L3 composite    apps/mobile/src/components/ui/composite   WorkCard, CreatorCard, MediaStack, Rail,
                                                          AuctionPanel, BidDialog, StickyBidBar, AdaptiveModal,
                                                          StoryChapter, ProcessSteps, FactsGroup, CreatorLinks,
                                                          BidHistoryRow, StepShell, MediaInput, ReviewSubmit,
                                                          AuthPanel, SiteFooter
L4 scenes       apps/mobile/src/components/ui/scenes      WorkScene, CreatorScene, GlobalNavigation,
                                                          CreatorActionButton
L5 screens      apps/mobile/src/app/** + src/features/**  routes, queries, mutations, composition only
```

Allowed imports: L(n) MAY import L(<n) and `lib/`. L5 MAY import L1–L4. Lower layers MUST NOT import higher layers. `features/**` owns queries/mutations/presentation mapping; `components/ui/**` MUST stay data-source-agnostic (props in, events out). Legacy components stay in `apps/mobile/src/components/ui/*.tsx` root until their consumers migrate; new code MUST NOT import legacy visual components.

---

## 5. Dependency decisions

| Dependency | Status | Purpose | Platforms | Rejected alternative | Reason |
|---|---|---|---|---|---|
| `phosphor-react-native` | **add** (owner: `primitives/Icon`) | All 25 core + 7 future icons | iOS/Android/web via react-native-svg | `@phosphor-icons/react` (web-only DOM); copying SVGs per route | One package, one registry, RNW-compatible |
| Piazzolla/Golos TTFs (repo assets, not npm) | **add** (owner: font gate) | Typography contract | all | `@expo-google-fonts/*` runtime download | Build-time embed, no layout shift, offline |
| `react-native-reanimated` 4.5.0 | keep→**activate** (owner: `InteractiveSurface`, `MediaStack`, `StickyBidBar`) | UI-thread motion | all | RN `Animated` (JS thread), moti (extra layer) | Already installed; worklets plugin already in babel |
| `@rn-primitives/dialog` | keep (owner: `AdaptiveModal`) | Overlay a11y core | all | native `Modal` formSheet (no web parity); @gorhom | Existing, focus management proven in app |
| `@gorhom/bottom-sheet` | **remove later** (Wave 9) | — | — | — | Zero imports; AdaptiveModal covers mobile sheet |
| `nativewind`, `tailwindcss`, `react-native-css-interop` | **remove later** (Wave 9) | — | — | adopting NativeWind as primary | Zero usage; two styling systems forbidden |
| `lucide-react-native` | **remove later** (Wave 9) | legacy icons until migration | — | keeping both icon sets | One canonical icon technology |
| `@expo-google-fonts/inter`, `/onest` | **remove later** (Wave 9) | legacy fonts until migration | — | — | Replaced typography |
| `expo-linear-gradient` | **remove later** (Wave 9) | legacy ambient bg | — | — | No gradients in creator-first system |
| `expo-video` | **defer** (owner: `VideoProcessStory`, post-MVP) | process video | all | expo-av (deprecated) | Not needed for MVP; do not install now |
| `@shopify/flash-list` | **do not add** | — | — | — | No unbounded lists; §6.6 |
| `expo-blur` | **do not add** | — | — | — | expo-image blurRadius + opaque fallback; §6.14 |
| `zustand` | **do not add** | — | — | — | React Query + local state suffice; §10 |

No other dependency changes are authorized.

---

## 6. Technology decisions by visual capability

### 6.1 Styling

**Decision:** styling system
**Classification:** durable fix
**Selected:** `StyleSheet.create` per component file, values only from creator-first tokens.
**Why:** Current code is already token-driven inline styles; `StyleSheet.create` adds hoisting/stable references without a new toolchain. NativeWind has zero adoption; adopting it now would create a hybrid.
**Alternatives rejected:** NativeWind (unused, second system, Tailwind values duplicate tokens); CSS modules (web-only); staying with inline object literals (unstable references in lists, magic-value drift).
**Consequences:** NativeWind stack is deleted in Wave 9; `global.css` keeps only the web reduced-motion kill switch and focus CSS vars as a plain CSS file.
**Rules:**
- Styles live next to the component in `StyleSheet.create`; dynamic values via small style-builder functions in a sibling `*.styles.ts` when they need breakpoint/state input.
- Platform-specific styles only via `Platform.select` inside the component file or a `Component.web.tsx` split; MUST NOT fork whole screens per platform.
- Responsive style helpers live only in `apps/mobile/src/components/ui/layout/` (§6.7).
- Inline magic values are forbidden; review checklist item; any literal color/px in a diff is a blocking finding.
- Pen values enter code exclusively as token entries in `packages/design-tokens` (Wave 0), never directly in components.
**Lower-cost agent instruction:** never install or use `className`; never write a hex color or px literal outside `packages/design-tokens`.

### 6.2 Design tokens

**Decision:** token architecture and ownership
**Classification:** durable fix (deprecated alias = acceptable workaround, removal in Wave 9)
**Selected:** `@bidplace/design-tokens` exports a new canonical object `creatorTokens` (working name; final export name `tokens`) built as primitive → semantic → component:
- `primitives.ts`: raw palette (vanilla #F7F5F1, ink navy #1F2637, accents terracotta/olive/blue/plum, neutrals), font families, size scale (4px grid), radius scale, duration scale.
- `semantic.ts`: `color.canvas/surface/ink/text.{primary,secondary,muted}/border/accent.{terracotta,olive,blue,plum}/focus/overlay/danger/success`, `typography` roles exactly as `design-system.yaml` (display, screenTitle, sectionTitle, cardTitle, body, bodySmall, label, metadata, price, caption, button, nav) with per-breakpoint sizes, `space`, `radius`, `motion` (durations + easing + reduced-motion zero rule), `elevation` (boxShadow strings), `layer` (content/chrome/popover/modal/toast), `breakpoint` (mobileMax 767, tabletMin 768, desktopMin 1280), `layout` (maxContent 1280 desktop / 928 tablet, gutters 32/24/20, grid columns/gaps), `ratio` (workPortrait 4:5, square 1:1, scene ratios per spec).
- `component.ts`: only where the spec fixes component-scoped values (e.g. `workCard`, `creatorCard.mirrorCaption`, `auctionPanel`, `bottomNav`, `bidDialog` measurements).
**Why:** one owner, one import path, machine-checkable; per-breakpoint typography belongs to tokens, not screens.
**Alternatives rejected:** tokens in app `src/` (breaks package boundary); CSS variables (native has none); mixing new values into legacy `designTokens` (role collisions, forbidden mixing).
**Consequences:** legacy `designTokens` export is marked `@deprecated`, new code MUST NOT import it, Wave 9 deletes it. Exactly one canonical token per visual role. Platform fallbacks (fonts, shadows) are resolved inside the token package, not at call sites.

### 6.3 Fonts

**Decision:** font pipeline
**Classification:** durable fix
**Selected:** copy the 7 verified TTFs from `design/creator-first/assets/fonts/` into `apps/mobile/assets/fonts/`; embed natively via the `expo-font` config plugin (`app.json` plugins → fonts array); on web, gate first paint with `useFonts` for the same files inside root `_layout.tsx` (render `null` until loaded — existing pattern), so no fallback-font flash and no layout shift.
**Weight mapping (fixed):** Piazzolla-Medium 500 / SemiBold 600 / Bold 700 → roles display, screenTitle, sectionTitle, cardTitle, price; GolosText-Regular 400 / Medium 500 / SemiBold 600 / Bold 700 → body, bodySmall, label, metadata, caption, button, nav. Font family names in tokens are the exact TTF family names.
**Fallbacks:** token package resolves `fontFamily` with platform fallback stacks (`Georgia, serif` / `system-ui, sans-serif` on web) used only if loading fails.
**Numeric alignment for bids:** tabular figures in Piazzolla are `needs_verification` (design-system feasibility note) → prices render inside a fixed-width slot sized to the longest fixture string per context (`price` role + `minWidth` from component tokens); Wave 0 verifies `fontVariant: ['tabular-nums']` support in the loaded TTFs and, if supported, replaces slot sizing.
**Alternatives rejected:** `@expo-google-fonts` runtime packages (network fetch, no static guarantee); variable fonts (weight-instancing risk on RNW).

### 6.4 Icons

**Decision:** canonical icon technology
**Classification:** durable fix
**Selected:** Phosphor via `phosphor-react-native` on all platforms, wrapped by a single `primitives/Icon` registry:
- Registry exposes semantic names from `design-system.yaml iconography.required` (25 core + future set); direct package imports outside the registry are forbidden.
- Weights: `regular` default; `fill` only for the approved saved/heart future states.
- Sizes from tokens only (16/20/24/28); color from tokens.
- Accessibility: `Icon` requires either `label` (adds role=image + accessibilityLabel) or `decorative` (hidden from a11y tree). No unlabeled interactive icon.
- Route-local SVG files are forbidden; the 32 SVGs in `design/creator-first/assets/icons/` remain the Pen/reference set, production uses the npm package for identical glyphs.
**Alternatives rejected:** keeping Lucide (contradicts design contract); dual icon sets (drift); hand-copied SVG components (32+ files, no tree-shaking, maintenance).
**Consequences:** legacy `AppIcon` (Lucide) survives untouched until each consumer migrates; deleted in Wave 9.

### 6.5 Images

**Decision:** media primitive
**Classification:** durable fix
**Selected:** new `primitives/MediaImage` wrapping `expo-image`, absorbing the existing `media-recovery.ts` state machine (1s/3s/8s retries, cache-bust, manual retry):
- Props: `uri`, `alt` (required or `decorative`), `aspectRatio` (token ratios), `radius` (token), `contentFit='cover'`, `focalPoint` (default center; passes `contentPosition`), `recyclingKey`, `context` (telemetry label), `placeholder` (surface-tone block, no blurhash in MVP — no server hash field), `transition` (motion token, 0 under reduced motion).
- Error state per spec: surface fill + Phosphor `image-broken` icon + caption; retry affordance where spec defines it.
- Missing media (no URL at all): deterministic `MediaFallback` block (surface tone + work title initial), never a broken request.
- Responsive crop: parent decides rendered size via layout helpers; `MediaImage` never measures the window itself.
- All work cards/scenes/galleries/process steps/creator portraits MUST use `MediaImage`; raw `expo-image` imports outside primitives are forbidden.
**Why extend, not replace:** the recovery machine is proven behavior with e2e coverage; only the visual shell changes.
**Alternatives rejected:** RN `Image` (no cache policy); new gallery lib (Galeria) — the work gallery is `media_stack` with bespoke interactions, a lightbox dependency has no owner in the spec.

### 6.6 Lists and grids

**Decision:** collection technology
**Classification:** durable fix
**Selected:**
- One vertical `ScrollView` per screen (`primitives/ScreenScroll`, owns `contentInsetAdjustmentBehavior`, max-width container, bottom-nav inset).
- Grids (home sections, explore works/creators, profile work grid, process grids): deterministic flex rows computed by `buildGridRows(items, columns)` — pure, unit-tested; columns come from the blueprint per breakpoint (e.g. explore 3/2/1). No masonry libraries; editorial mixed-span rows are explicit row templates from the blueprint, not measurement-driven.
- Horizontal rails (`rail` master): horizontal `ScrollView` with `snapToInterval` = card width + gap, `decelerationRate="fast"`, peek of next card per spec, `disableIntervalMomentum`. Bounded ≤ 8 items by contract.
- Bid history: plain mapped rows (server returns bounded page; «Показать все» loads next page, still bounded).
- FlatList/SectionList/FlashList: NOT used in MVP. Every collection is server-bounded (12-per-page grids with «Показать ещё», ≤8-item rails, ≤10-row histories); virtualization overhead + recycled-cell effects (mirror caption, stack transforms) are a net loss at these sizes.
**Escape hatch:** if a future feed becomes unbounded (>~60 simultaneously mounted cards), that feature MUST adopt FlatList (not FlashList) first and measure before considering FlashList; this is the only revisit trigger.
**Alternatives rejected:** FlashList (new native dep without a real workload); FlatList `numColumns` (cannot express mixed-span editorial rows); CSS grid (web-only).

### 6.7 Responsive layout

**Decision:** responsive system
**Classification:** durable fix
**Selected:** one hook + one helper module, both in `apps/mobile/src/components/ui/layout/`:
- `useBreakpoint()`: wraps `useWindowDimensions`, returns `'mobile' | 'tablet' | 'desktop'` using token breakpoints (mobile <768, tablet 768–1279, desktop ≥1280). The ONLY place `useWindowDimensions` may be called for layout decisions.
- `Container`: max-width (1280/928/full-minus-gutters) + horizontal gutters (32/24/20) + centering.
- `buildGridRows`, `getSpanWidth`: pure span math from layout tokens; unit-tested.
- Order changes between breakpoints are expressed by conditional composition inside scene/screen components (render arrays), never by absolute positioning.
- Sticky/fixed: desktop nav bar sticky via `position: 'sticky'` on web + plain header on native scroll; mobile bottom nav = fixed overlay inside `AppShell` respecting safe-area bottom inset; sticky bid bar per §6.11.
- Safe areas: `SafeAreaProvider` (existing) + insets consumed only in `AppShell`, bottom nav, sticky bid bar, and `AdaptiveModal`.
- No horizontal page scroll: only `Rail` and `MediaStack` may scroll horizontally; e2e asserts `document.body` has no horizontal overflow at 390/1024/1440.
**Forbidden:** route-local `width > N` comparisons; per-screen breakpoint constants; `Dimensions.get` in components.
**Alternatives rejected:** media-query libraries; per-platform screen forks; CSS breakpoints (web-only).

### 6.8 Cards

**Decision:** card architecture
**Classification:** durable fix
**Selected:** exactly one production component per card master; screens pass data, never restyle:
- `WorkCard` (L3): `MediaImage` (4:5) + title + creator + `StatusChip` + price slot. Props are primitives (`title`, `creatorName`, `priceLabel`, `statusKind`, `imageUri`, `href`). Hover (web): translateY(−2) + elevation via `InteractiveSurface`; pressed: scale 0.98. Used by home rails/grids, explore, creator profile grid, recommendations.
- `CreatorCard` (L3): portrait `MediaImage` + mirror caption zone (§6.14) + name/discipline. Sole owner of the mirror/blur effect.
- `MediaStack` (L3): work-detail gallery; Gesture Pan swipe on mobile, arrows + dots on desktop; transform/opacity transitions only; owns current-index local state.
- `WorkScene` (L4): editorial hero composition of `MediaImage` layers + `WorkCard`-adjacent info; desktop tilted layers → mobile stacked (§6.14).
- `CreatorScene` (L4): profile hero composition (portrait + name + facts + links).
- State: all card data arrives via props from screen queries; cards own only transient interaction state (hover/press/index).
- Memoization: `React.memo` ONLY on `WorkCard` and `CreatorCard` (grid/rail children with primitive props). Scenes/one-off composites are not memoized.
**Forbidden:** per-screen card copies; boolean-flag mega-cards (variants are separate small composition wrappers if compositions truly diverge); passing whole query objects into cards.

### 6.9 Motion and gestures

**Decision:** motion system
**Classification:** durable fix
**Selected:** Reanimated 4.5 (`.get()/.set()` API) + Gesture Handler; central rules:
- Animate ONLY `transform` and `opacity`. Layout animation requires a written exception in this contract (currently: none).
- `InteractiveSurface` (L1) is the single press/hover/focus surface: web hover via RNW hover handlers driving a shared value; press via `Gesture.Tap` storing `pressed` 0/1 state, visuals derived by `interpolate`. `Pressable` MAY be used directly only for non-animated tap targets (list rows, nav links).
- MediaStack swipe: `Gesture.Pan` + translateX shared value + snap `withTiming` (motion tokens).
- Card hover tilt/lift: interpolation in `InteractiveSurface`; no 3D/WebGL, max translateY(−2)+shadow per spec.
- Navigation overlay + AdaptiveModal transitions: opacity+translateY, durations from `motion` tokens (panelOpen/panelClose).
- Rails: native scroll physics only, no scroll-linked JS animation.
- Sticky bid bar: visibility from a scroll-position shared value via `useAnimatedScrollHandler` on the screen `ScreenScroll`; translateY enter/exit.
- Loading: skeleton is a static block with a single subtle opacity loop, disabled under reduced motion.
- LIVE pulse: the one approved infinite animation — `withRepeat` opacity pulse on the live dot only; disabled under reduced motion (static dot remains).
- Reduced motion: existing `useReducedMotion` + `getMotionDuration` are the mandatory gate for every duration; CSS kill switch stays in global stylesheet for web.
**Alternatives rejected:** RN `Animated` (JS thread, legacy); moti (redundant layer); CSS-only web animations forking behavior per platform; PanResponder for new gestures (SlideToBid migrates to `Gesture.Pan` when rebuilt).

### 6.10 Dialogs, sheets, overlays

**Decision:** single adaptive overlay abstraction
**Classification:** durable fix
**Selected:** `AdaptiveModal` (L3) on `@rn-primitives/dialog` + `@rn-primitives/portal`:
- Presentation by breakpoint: desktop/tablet → centered dialog (spec widths, e.g. bid dialog 480); mobile → bottom sheet panel (radius top 24, translateY enter, drag-handle visual, full-width).
- One implementation serves: bid dialog, explore filters (mobile), navigation overlay (mobile menu), auth gate prompt, validation/info dialogs, future selection dialogs. Image viewer for MVP is `MediaStack` inline (no separate lightbox).
- Behavior contract: focus trap + focus return (extend existing web focus-restore logic), Escape closes (web), Android back closes (`BackHandler`), backdrop press closes unless `blocking`, `KeyboardAvoidingView` inside mobile sheet, safe-area bottom padding, scrim from `color.overlay` token, `layer.modal` z-index, `accessibilityViewIsModal`/`aria-modal`.
- No snap points, no drag-to-resize in MVP (spec sheets are single-height); if a future sheet needs snap points that feature re-evaluates — NOT by adding @gorhom silently.
**Alternatives rejected:** `@gorhom/bottom-sheet` (unused, JS-gesture sheet, second overlay system); native `Modal presentationStyle=formSheet` (no web equivalent → platform fork); per-feature bespoke overlays (a11y drift).

### 6.11 Auction UI

**Decision:** auction presentation architecture
**Classification:** durable fix
**Selected:**
- Server snapshot: React Query keys unchanged (`['products', publicId]`, `['listings', id, 'bids']`, `['user','activity']`). Realtime: existing `useListingRealtime` socket events (`listing.updated`, `bid.placed`, `listing.ended`) → query invalidation only. No socket payload merging into caches.
- Presentation mapping: pure function `deriveAuctionPanelState(product, listing, viewer, eligibility, connection)` in `features/products/presentation/` returns one of the 13 panel semantic states from `component-specs.yaml auction_panel`. Unit-tested exhaustively. The client MUST NOT compute minimum bid, soft-close extensions, or winner — it renders server-provided `nextMinimum`, `endsAt`, status verbatim.
- `AuctionPanel` (L3) renders the 13 states; `BidDialog` (L3, inside `AdaptiveModal`) runs the 8 dialog states as a local state machine driven by RHF validity + mutation status + server error codes (mapped via contracts error enum). Bid submit keeps Idempotency-Key.
- No optimistic accepted state: `submitting → accepted` only after server 2xx; on invalidation the panel re-derives.
- Countdown: derived from server `endsAt` vs local clock, ticking via a 1s interval only while panel is mounted and status is live; final-minute style from spec; soft-close messaging appears only when the server pushes a new `endsAt`.
- `StickyBidBar` (L3): appears when the inline panel scrolls out (scroll shared value, §6.9); same derived state object, same single mutation — never a second bid path.
- `BidHistoryRow` (L3): privacy format from server (masked bidder labels); no client-side masking logic.
- Self-bid / role-disabled / not-eligible states come from server + auth context flags, rendered as disabled affordances with explanatory text per spec.
- Loading/error: `Skeleton` variant for panel; `ErrorBlock` with retry re-fetching the queries; socket `offline` state shows the spec's reconnect hint without disabling the server-validated form.
**Alternatives rejected:** client auction engine (forbidden by product docs); optimistic bid acceptance (integrity risk); merging socket payloads into cache (drift vs invalidate-and-refetch, existing proven pattern).

### 6.12 Forms and creator publishing

**Decision:** form architecture
**Classification:** durable fix
**Selected:** React Hook Form + `zodResolver` + `packages/contracts` schemas for ALL creator-first forms (auth, onboarding, seller profile, work creation, listing scheduling). The legacy `useState`-field drafts in seller features are replaced during Wave 7, not patched.
- One-question-per-screen onboarding/work-creation: `StepShell` (L3) renders progress + one field group per step; step order and validation from a typed step config array; navigation state = current step index in screen state, answers in one RHF form spanning steps (`mode: 'onTouched'`).
- Async username/slug checks: RHF async validate calling a debounced React Query `queryClient.fetchQuery` (300ms debounce, cancel on change); states pending/available/taken map to `InlineFeedback`.
- Draft hydration: server draft (existing product draft API) is the source; `useForm({ values })` from the query so refetches re-hydrate untouched fields; local unsaved answers persist only in memory (no offline persistence in MVP).
- Media upload: existing pipeline (expo-image-picker → Blob → `api.images.*` FormData) wrapped by `MediaInput` (L3) with spec states (empty/uploading N%/uploaded/error/retry, reorder via up/down controls — no drag-n-drop dependency in MVP); mutation ownership in `features/sellers`.
- Review step: `ReviewSubmit` (L3) renders read-only summary from form values + server draft; submit = existing `products.submit` mutation; success/error per spec.
- Mutations own invalidation lists exactly as today (seller product/profile keys).
**Alternatives rejected:** continuing ad-hoc `useState` forms (no schema reuse, drift); Formik (second form lib); local storage drafts (unowned product behavior).

### 6.13 Navigation

**Decision:** navigation shell
**Classification:** durable fix
**Selected:** Expo Router structure unchanged; visual shell fully replaced by `GlobalNavigation` (L4) with three coordinated parts:
- Desktop/tablet (≥768): top bar — logo symbol 28×28 (`logo-transparent-256.png` asset), nav links (Работы/Авторы), `SearchEntry`, `CreatorActionButton` («Создать», role-aware), account entry. Sticky on web.
- Mobile (<768): minimal top bar (logo + search trigger) + bottom navigation — custom floating pill component per spec (NOT expo-router tabs: routes stay a Stack; the pill renders `Link`s + active state from `usePathname`). Fixed above safe-area inset; content bottom inset via `ScreenScroll`.
- Mobile navigation overlay (full menu) via `AdaptiveModal` sheet presentation.
- `CreatorActionButton` role logic reuses `use-seller-capability` + auth context: guest → auth gate prompt; authenticated non-seller → onboarding entry; seller → work creation. No new role contract.
- Routes/screens mapping (fixed): home→`/`, explore works→`/works`, explore creators→`/authors` (blueprint explore tabs = `TabPill` linking between the two existing routes), work detail→`/product/[publicId]`, creator profile→`/seller/[slug]`, auth→`/login`+`/register`, onboarding→`/profile` flow, work creation→`/products/new`+`/products/[id]`, listing scheduling→`/listings/new`, activity→`/me/activity`, order→`/order/[publicId]`.
- Deep links + browser history + back behavior: inherited from Expo Router; overlay/back interplay: open overlay intercepts Android back first.
**Alternatives rejected:** native bottom tabs (design mandates custom floating pill and the app is Stack-based; converting route groups to tabs changes URL structure risk-free benefit none on web-primary MVP); changing routes to blueprint vanity paths (product decision, §14-R1).

### 6.14 Blur, mirror, editorial effects

Per-effect matrix (fallbacks are mandatory code paths, not TODOs):

| Effect | Native | Web (RNW) | Fallback | Perf risk | New dep |
|---|---|---|---|---|---|
| Mirror caption (creator_card ONLY) | second `expo-image` of the portrait bottom strip, `scaleY: -1` transform + `blurRadius` + opaque-tone veil overlay | same; expo-image maps blurRadius to CSS `filter: blur()` | `mirrorCaptionFallback` token: opaque surface caption (used when reduced-transparency, low-end heuristic, or blur render fails) | Medium: 2× image decode per card — bounded grids only, `recyclingKey`, no animation of blur | none |
| Soft media atmosphere (work_scene bg) | pre-toned flat `color.surface` layers (NO dynamic blur of user media) | same | n/a (static) | none | none |
| Tilted editorial layers | `transform: rotate(±deg per spec)` on `MediaImage` wrappers, `overflow: hidden` clip on parent | same | mobile: stacked untilted per blueprint | Low | none |
| Rounded media | `borderRadius` tokens + `borderCurve: 'continuous'` | borderRadius | — | none | none |
| Shadows/elevation | `boxShadow` string tokens (RN 0.86) | same | Android auto-elevation via RN mapping | Low | none |
| Gradients | none in creator-first system | — | — | — | expo-linear-gradient removed later |

**Hard rule:** full-screen or unbounded dynamic blur of arbitrary creator media is FORBIDDEN. Blur exists only inside the bounded creator_card caption strip.

### 6.15 Video (`video_process_story`, designed_post_mvp)

**Decision:** future video boundary
**Classification:** durable fix (deferred)
**Selected:** when implemented: `expo-video` (SDK-aligned), component `VideoProcessStory` (L3) — poster `MediaImage`, explicit play/pause, mute default ON with speaker toggle, captions track required for upload, NO autoplay, no looping. Until then: work detail renders `ProcessSteps` images only; absence of video needs no placeholder. `expo-video` MUST NOT be installed before the feature wave.
**Alternatives rejected:** expo-av (deprecated path); HTML `<video>` fork (platform split).

### 6.16 Accessibility (fixed contract)

- Touch targets ≥44×44 (visual size may be smaller; hitSlop pads).
- Every control: `accessibilityRole` + label; hints only where action is non-obvious.
- Focus: visible focus ring via `focus` tokens on web (`:focus-visible` CSS var already present) and `InteractiveSurface` focus state; focus order follows DOM/render order — screens MUST render in reading order, no visual-only reordering.
- Keyboard (web): all interactive elements tabbable; MediaStack arrows keyboard-operable; AdaptiveModal traps focus, returns focus, Escape closes.
- Screen reader: dialog = modal semantics; `SectionHeader` uses heading role/level on web; decorative images hidden.
- Reduced motion: every animation gated by `getMotionDuration`; LIVE pulse becomes static dot.
- Contrast: token pairs pre-verified in design-system (text-on-canvas/surface ≥4.5:1); components MUST NOT compose arbitrary token pairs — allowed pairs listed in token docs.
- Text scaling: `allowFontScaling` stays default-on; layouts use flexible height (no fixed-height text rows); e2e checks 200% browser zoom at 1440 with no clipped controls.
- Errors: `InlineFeedback` uses `accessibilityLiveRegion="polite"`/`role=alert` for submit-level errors.
- Live auction updates: price/countdown region uses polite live region on web for price changes only; countdown ticks are NOT announced; bid acceptance announced once.

### 6.17 Testing and visual verification

- **Unit (Vitest):** `deriveAuctionPanelState` (all 13 states + transitions), bid dialog machine (8 states), `buildGridRows`/`getSpanWidth`, breakpoint mapping, price slot formatting, media-recovery machine (existing spec kept), step-config validation, slug-check debounce logic. Pure functions only, node env — matches existing suite style.
- **e2e (Playwright, existing API+Expo-web harness):** per-screen flows (home browse, explore filter, work detail bid happy-path + rejected-bid, creator profile, onboarding step flow, work creation + upload, auth); overlay behavior (focus trap, Escape, backdrop); keyboard-only bid placement; reduced-motion mode (emulate `prefers-reduced-motion`) asserting no transition on LIVE dot; image-error path (block media route → recovery UI); long-content and minimal-content fixtures from `content-fixtures.yaml`.
- **Visual:** Playwright screenshots at 1440×900, 1024×768, 390×844 per completed screen, stored under `apps/mobile/e2e/__screenshots__/creator-first/`, compared manually against Pen exports at wave stop-gates. NO pixel-diff CI gate (brittle); assertion-based layout checks (no horizontal overflow, sticky bar visibility, grid column counts) run in CI instead.
- Definition: a screen is not done until its states (loading/empty/error/missing-media/role variants) each have at least an assertion-level e2e or unit coverage per §13.

### 6.18 21st.dev policy (fixed)

- 21st.dev MAY be used as a source of visual ideas and interaction patterns.
- DOM/Tailwind/shadcn component code MUST NOT be copied into Expo/RNW code.
- A web-only library MUST NOT be added for the sake of a ready-made component.
- Manually translating anatomy/interaction into shared RN primitives is allowed, subject to this contract's layers and tokens.
- Any new library MUST support Expo native + RNW or ship an explicit platform fallback, and MUST go through §5.

---

## 7. Component implementation matrix

All 34 design component IDs from `component-specs.yaml`. Layer key: P=primitives, C=controls, X=composite, S=scenes. Base path `apps/mobile/src/components/ui/`. Shared primitives shorthand: IS=InteractiveSurface, MI=MediaImage, TX=Text, IC=Icon. All components: tokens-only styling, reduced-motion gate, no server state.

| Design id | Production | Path (+`.tsx`) | Layer | Primitives | Tech | State owner | Responsive | Motion | A11y focus | Consumers | Phase | Tests | Forbidden |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| global_navigation | GlobalNavigation | scenes/GlobalNavigation | S | IS,IC,TX | Router Link, sticky web | auth ctx + seller capability (read) | 3 comps: desktop bar / mobile top bar / bottom pill | overlay open transition | landmark nav, focus order | every screen via AppShell | MVP | e2e nav + roles | route-local nav copies; native tabs |
| creator_action | CreatorActionButton | scenes/CreatorActionButton | S | IS,IC,TX | role branch fn | derived from auth+capability | same control, placement differs | press scale | label per role state | GlobalNavigation, profile empty states | MVP | unit role-branch; e2e gate | client role invention |
| search_entry | SearchEntry | controls/SearchEntry | C | IS,IC,TX | TextInput, router push `/search` | local text state | inline ≥768; icon-trigger + overlay <768 | focus transition | search role, label | GlobalNavigation | MVP | e2e submit | own results fetching |
| status_chip | StatusChip | controls/StatusChip | C | TX,IC | pure map status→tone | props only | fixed size | LIVE pulse (only here) | text not color-only | WorkCard, AuctionPanel, rows | MVP | unit map; e2e reduced-motion pulse | client status computation |
| work_card | WorkCard | composite/WorkCard | X | IS,MI,TX + StatusChip | memo, primitive props | props only | width from grid span | hover lift, press 0.98 | single link label | home, explore, profile, rails | MVP | unit props; e2e grid | per-screen copies; query objects as props |
| creator_card | CreatorCard | composite/CreatorCard | X | IS,MI,TX | memo; mirror caption §6.14 | props only | grid span | hover lift | link label = name | home, explore creators, related | MVP | unit fallback logic; e2e blur fallback | blur outside caption strip |
| media_stack | MediaStack | composite/MediaStack | X | MI,IC,IS | Reanimated + Gesture.Pan | local index | swipe mobile / arrows+dots desktop | translateX snap | arrows keyboard, index announced | work_detail, work_scene | MVP | unit index math; e2e swipe+keys | lightbox dep; layout anim |
| work_scene | WorkScene | scenes/WorkScene | S | MI,TX + WorkCard,MediaStack | row templates | props only | tilted desktop / stacked mobile | static (entry fade) | reading order | home hero, work_detail hero | MVP | e2e 3 viewports | dynamic media blur |
| creator_scene | CreatorScene | scenes/CreatorScene | S | MI,TX + FactsGroup,CreatorLinks | row templates | props only | 2-col desktop / stacked mobile | static | h1 name | creator_profile | MVP | e2e 3 viewports | scene-local tokens |
| story_chapter | StoryChapter | composite/StoryChapter | X | MI,TX | alternating templates | props only | side-by-side ≥768 / stacked | static | headings | creator_profile, work_detail | MVP | e2e long/short text | measurement-driven layout |
| process_steps | ProcessSteps | composite/ProcessSteps | X | MI,TX,IC | ordered list | props only | grid ≥768 / vertical | static | list semantics | work_detail | MVP | e2e with fixtures | virtualization |
| creator_links | CreatorLinks | composite/CreatorLinks | X | IS,IC,TX | Linking.openURL, allowlist | props only | wrap row | press | external-link hints | creator_profile | MVP | unit url allowlist | arbitrary url schemes |
| auction_panel | AuctionPanel | composite/AuctionPanel | X | TX,IC + StatusChip,Skeleton,ErrorBlock | renders 13 derived states | derived state via props; queries in feature | side panel desktop / inline mobile | countdown tick, state fade | polite price live region | work_detail | MVP | unit 13 states; e2e live update | business-rule computation |
| bid_dialog | BidDialog | composite/BidDialog | X | TX + FormField,InlineFeedback,AdaptiveModal | RHF+zod, 8-state machine, Idempotency-Key | mutation in feature; machine local | dialog 480 / mobile sheet | modal transition | focus trap, error announce | work_detail, StickyBidBar | MVP | unit 8 states; e2e bid + reject | optimistic accept; 2nd bid path |
| bid_history_row | BidHistoryRow | composite/BidHistoryRow | X | TX | server-masked labels | props only | fixed row | none | row text order | work_detail bids tab | MVP | unit format | client masking |
| facts_group | FactsGroup | composite/FactsGroup | X | TX,IC | definition list | props only | 2-col / 1-col | none | term/value pairs | creator_scene, work_detail | MVP | unit empty-fact skip | invented facts |
| tab_pill | TabPill | controls/TabPill | C | IS,TX | Link or onPress | active from route/props | scrollable row if overflow | active indicator slide | tab role + selected | explore, product tabs | MVP | e2e switch | screen-local tab styles |
| filter_chip | FilterChip | controls/FilterChip | C | IS,TX,IC | toggle | selected via props (URL params owner: screen) | wrap / sheet on mobile | press | selected state announced | explore | MVP | e2e filter flow | local filter state duplication |
| creator_step_shell | StepShell | composite/StepShell | X | TX + Button,Progress visual | step config array | step index in screen; answers in RHF | single column, mobile-first | step transition (translate) | step X of N announced | onboarding, work creation | MVP | unit step config; e2e flow | per-step separate forms |
| form_field | FormField | controls/FormField | C | TX + TextInput | RHF Controller wrapper | RHF | full width | focus border transition | label association, error link | all forms | MVP | unit states; e2e validation | uncontrolled ad-hoc inputs |
| media_input | MediaInput | composite/MediaInput | X | MI,IC,TX + Button | expo-image-picker, FormData mutations | upload state local; mutations feature | grid of slots | progress opacity | upload status announced | work creation, profile | MVP | e2e upload+retry | drag-n-drop dep in MVP |
| inline_validation | InlineFeedback | controls/InlineFeedback | C | TX,IC | tone map | props only | full width | fade in | role=alert / polite | forms, slug check | MVP | unit tones | color-only feedback |
| review_submit | ReviewSubmit | composite/ReviewSubmit | X | TX,MI + Button | read-only summary from RHF values | RHF + submit mutation in feature | single column | none | summary headings | work creation final step | MVP | e2e submit | editing inside review |
| section_header | SectionHeader | controls/SectionHeader | C | TX,IS | optional action link | props only | row / stacked | none | heading role+level (web) | home, explore, profile | MVP | unit | detached custom headers |
| rail | Rail | composite/Rail | X | ScreenScroll(h) + children | horizontal ScrollView snap | props only | peek widths per breakpoint | native snap physics | group label; keyboard scroll (web) | home | MVP | e2e snap + overflow | vertical nesting; virtualization |
| skeleton | Skeleton | controls/Skeleton | C | Surface | static block + opacity loop | none | matches slot | subtle loop, RM-off | aria-hidden, busy on region | all loading states | MVP | e2e reduced motion | shimmer gradients |
| error_block | ErrorBlock | controls/ErrorBlock | C | TX,IC + Button | retry callback | props only | full width | none | alert + retry focus | screens, panel | MVP | e2e retry | silent failures |
| empty_state | EmptyState | controls/EmptyState | C | TX,IC + Button | optional CTA | props only | centered | none | informative text | grids, history, search | MVP | e2e empty fixtures | decorative-only empties |
| sticky_bid_bar | StickyBidBar | composite/StickyBidBar | X | TX + Button | Reanimated scroll-driven visibility | derived auction state via props | mobile/tablet only per spec | translateY enter/exit | not focus-trapping; same action label | work_detail | MVP | e2e scroll show/hide | duplicate bid logic |
| auth_panel | AuthPanel | composite/AuthPanel | X | TX + FormField,Button,InlineFeedback | RHF+zod (existing schemas) | mutations in features/auth | centered card / full mobile | none | error announce, autofill types | /login /register, auth gate | MVP | e2e login/register | new auth contract (§14-R2) |
| footer | SiteFooter | composite/SiteFooter | X | TX,IS | link columns from static config (`composite/site-footer-links.ts`) | none | 3-col / stacked | none | contentinfo landmark | web screens ≥768 | MVP | e2e links | per-page footers |
| follow_creator | FollowCreatorButton | composite/FollowCreatorButton | X | IS,IC,TX | — no server contract yet | server (future) | button | press + fill-icon swap | pressed state announced | creator_profile (future) | designed_post_mvp | deferred | building before server contract exists |
| wishlist_saved_work | SaveWorkButton | composite/SaveWorkButton | X | IS,IC | — no server contract yet | server (future) | icon button on cards | fill swap | label save/saved | WorkCard slot (future) | designed_post_mvp | deferred | local-only fake saves |
| video_process_story | VideoProcessStory | composite/VideoProcessStory | X | MI,IC,IS | expo-video (deferred install) | local playback state | 16:9 bounded | play/pause fade | captions required, no autoplay | work_detail (future) | designed_post_mvp | deferred | autoplay; expo-av |

---

## 8. Screen implementation matrix

All 11 screen IDs from `screen-blueprints.yaml`. Boards (`*_board`, `tablet_1024_derivations`, `future_boards`) are Pen QA artifacts — they map to component state coverage, not routes.

| Screen id | Route | Composition (L3/L4) | Query/mutation owner | Scroll owner | Collections | Responsive | Loading / Empty / Error / Missing media | Role states | Phase | Tests |
|---|---|---|---|---|---|---|---|---|---|---|
| creator_profile | `/seller/[slug]` (existing) | CreatorScene, TabPill, WorkCard grid, StoryChapter, CreatorLinks, FactsGroup, SiteFooter | `features/sellers` (`['public-seller', slug]`) | ScreenScroll | grid 3/2/1 + «Показать ещё» | 2-col hero desktop → stacked mobile | Skeleton scene / EmptyState no-works / ErrorBlock retry / MediaFallback portrait | guest=visitor; owner sees edit entry (existing) | MVP | e2e 3 viewports + empty/error |
| work_detail | `/product/[publicId]` (existing) | WorkScene, MediaStack, AuctionPanel, BidDialog, StickyBidBar, ProcessSteps, StoryChapter, FactsGroup, BidHistoryRow, Rail(related), SiteFooter | `features/products` (product, bids, activity, realtime) | ScreenScroll (+scroll shared value) | bounded rows/rails | 2-col desktop (panel right) → single col, sticky bar mobile | Skeleton / — / ErrorBlock / MediaFallback + recovery | guest, buyer, ineligible, self-view seller, admin-disabled per panel states | MVP | unit state derivation; e2e bid, realtime, keyboard, reduced motion |
| bid_states_board | — (QA board) | AuctionPanel ×13, BidDialog ×8 | fixtures | — | — | — | covered by states themselves | all | MVP (as coverage) | unit exhaustive states |
| home | `/` (existing) | WorkScene hero, Rail, WorkCard/CreatorCard grids, SectionHeader, SiteFooter | `features/home` (`['discovery-home']`) | ScreenScroll | rails ≤8; grids bounded | hero scene scales; rails peek per breakpoint | Skeleton sections / EmptyState per section / ErrorBlock page / MediaFallback | guest vs authed nav only | MVP | e2e 3 viewports + overflow guard |
| explore | `/works` + `/authors` (existing pair; TabPill links between) | TabPill, FilterChip set, WorkCard/CreatorCard grid, EmptyState, SiteFooter | `features/products` list + `features/sellers` list (URL params = filter state) | ScreenScroll | grid 3/2/1, «Показать ещё» pagination | filters row desktop / AdaptiveModal sheet mobile | Skeleton grid / EmptyState with reset / ErrorBlock / MediaFallback | none | MVP | e2e filter flow + pagination |
| creator_action_states_board | — (QA board) | CreatorActionButton role states | fixtures | — | — | — | — | guest/non-seller/seller/pending | MVP (as coverage) | unit role branch |
| creator_onboarding_mobile | `/profile` (existing entry; step flow internal) | StepShell, FormField, MediaInput, InlineFeedback, ReviewSubmit | `features/sellers` profile mutations | StepShell scroll | — | single column all breakpoints | step skeleton / — / inline + submit errors / upload retry | authenticated non-seller (route-gated) | MVP | e2e full flow + slug check |
| work_creation_mobile | `/products/new`, `/products/[id]` (existing) | StepShell, FormField, MediaInput, ProcessSteps editor, ReviewSubmit | `features/sellers` product draft CRUD | StepShell scroll | media slots grid | single column | draft skeleton / — / inline + submit / upload retry | seller only (route-gated) | MVP | e2e create→submit + reorder |
| auth | `/login`, `/register` (existing) | AuthPanel (+ email-verify dialog via AdaptiveModal) | `features/auth` (existing mutations) | ScreenScroll | — | centered card ≥768 / full mobile | button pending / — / InlineFeedback / — | guest only; redirectTo preserved | MVP | e2e login/register/verify |
| tablet_1024_derivations | — (responsive variants) | tablet compositions of above | — | — | — | verified at 1024 | — | — | MVP (as coverage) | e2e 1024 screenshots |
| future_boards | — (post-MVP) | FollowCreatorButton, SaveWorkButton, VideoProcessStory | future contracts | — | — | — | — | — | designed_post_mvp | deferred |

---

## 9. Pen-to-code mapping

Pen masters are 1:1 with design component IDs (Stage-2 master library `components/{id}`); the table in §7 already binds each master to its production component. Additional foundation masters:

| Pen master | Production owner | Token deps | State inputs | Allowed responsive variants | Implementation owner |
|---|---|---|---|---|---|
| foundations/tokens board | `packages/design-tokens` | — (source) | — | — | Wave 0 agent |
| foundations/typography board | tokens `typography` roles | fonts, sizes per breakpoint | — | desktop/tablet/mobile scales | Wave 0 agent |
| foundations/icons board | `primitives/Icon` registry | icon sizes/colors | name, weight | — | Wave 1 agent |
| components/{id} (34 masters) | per §7 row | per §7 primitives/tokens | per §7 state owner | only variants listed in `component-specs.yaml` for that id | wave listed in §11 |
| screens/F-frames (F001–F118) | per §8 screen row | screen composition | screen queries | 1440/1024/390 exactly | screen waves |

Rules: a production component MUST implement every variant its Pen master defines and MUST NOT add variants absent from the master. Frame-level deviations found during implementation are blockers (§12), not improvisation opportunities.

---

## 10. Shared state ownership

| State class | Owner | Rules |
|---|---|---|
| Server state | React Query (existing keys: `discovery-home`, `products*`, `listings*`, `public-seller*`, `public-sellers`, `seller/*`, `user/activity`, `auth/*`, `categories`) | Single source. MUST NOT be copied into useState/context/module vars. Realtime = invalidate only. |
| Form state | React Hook Form per flow | Zod resolvers from `packages/contracts`. No parallel useState fields. |
| Navigation state | Expo Router URL (params own explore filters, product tab, redirectTo) | Filters/tabs read+write URL params; no shadow filter stores. |
| Transient UI state | local `useState`/`useReducer` in the owning component | Overlay open flags, step index, media stack index, menu open. Never global. |
| Animation state | Reanimated shared values in the owning component | Store ground-truth state (pressed 0/1, scrollY), derive visuals via interpolate. |
| Derived presentation state | pure functions in `features/*/presentation/` | `deriveAuctionPanelState`, role branching, price formatting. Unit-tested; no hooks inside. |
| Auth/session | existing `AuthProvider` context | Read-only for UI; mutations via provider methods. |

Zustand/redux/global stores: forbidden. Duplicating server state locally: forbidden.

---

## 11. Implementation sequence

Each wave: implement → run checks → capture screenshots → STOP for review. An agent MUST NOT start the next wave in the same pass.

| Wave | Scope (exact) | Prerequisites | Output | Verification | Stop gate |
|---|---|---|---|---|---|
| 0 | Install `phosphor-react-native`; copy 7 TTFs into app assets + expo-font plugin config; rewrite `packages/design-tokens` (primitive/semantic/component, deprecated legacy alias); tabular-nums verification | this contract | tokens package + fonts loading on 3 platforms | tokens unit tests; typecheck; app boots web+iOS sim with new fonts | founder sees font/token demo screen? No — tokens have no screen; gate = typecheck+tests green |
| 1 | Primitives: Text, Surface, InteractiveSurface, MediaImage (+MediaFallback), Icon registry, ScreenScroll, VisuallyHidden; `layout/` (useBreakpoint, Container, grid math) | Wave 0 | L1 complete | unit: grid math, breakpoint map, media recovery reuse; a11y roles lint | review of primitive API signatures |
| 2 | Controls: Button set, StatusChip, TabPill, FilterChip, FormField, InlineFeedback, SearchEntry, SectionHeader, Skeleton, ErrorBlock, EmptyState; AdaptiveModal | Wave 1 | L2 + overlay | unit state maps; e2e overlay focus/escape/back | control gallery screenshots 3 viewports |
| 3 | Cards/scenes: WorkCard, CreatorCard (mirror caption + fallback), MediaStack, Rail, WorkScene, CreatorScene, StoryChapter, ProcessSteps, FactsGroup, CreatorLinks, BidHistoryRow, SiteFooter | Wave 2 | L3/L4 visual core | unit props/fallback; e2e swipe, snap, blur fallback | card/scene screenshots vs Pen masters |
| 4 | Creator profile screen on `/seller/[slug]` (new composition, existing queries) | Wave 3 | first full screen | e2e 3 viewports, empty/error/missing-media | founder visual approval vs F-frames |
| 5 | Work detail + auction: AuctionPanel (13), BidDialog (8), StickyBidBar, `deriveAuctionPanelState`, realtime wiring | Wave 3 (4 recommended) | auction vertical | unit exhaustive states; e2e bid happy/reject/realtime/keyboard/RM | founder approval; no regression in old bid e2e |
| 6 | Home + Explore: GlobalNavigation (all 3 chrome parts), home composition, explore works/authors + filters | Wave 3 | public surface | e2e nav, filters, pagination, overflow guards | founder approval |
| 7 | Creator publishing: StepShell, MediaInput, ReviewSubmit; onboarding on `/profile`; work creation on `/products/*`; RHF migration of seller drafts | Wave 2 | publishing flows | e2e onboarding + creation + upload retry | founder approval |
| 8 | Post-MVP designed: FollowCreatorButton, SaveWorkButton, VideoProcessStory — ONLY after server contracts exist | explicit founder go + contracts | deferred features | per-feature | product decision |
| 9 | Hardening: delete legacy components/AppIcon/AmbientImageBackground; remove nativewind stack, lucide, @expo-google-fonts, expo-linear-gradient, @gorhom/bottom-sheet; delete deprecated token alias; full visual QA 1440/1024/390; a11y sweep; docs updates | Waves 4–7 shipped | clean tree | full e2e suite; `pnpm why` shows removed deps gone; grep zero legacy imports | final founder sign-off |

Old screens keep working on legacy components until their wave replaces them; both trees coexist only between Waves 4–9 and only in untouched screens.

---

## 12. Rules for lower-cost implementation agents

**MUST read before any wave:** this contract; `implementation-map.yaml`; the wave's rows in §7/§8; the relevant sections of `design/creator-first/spec/component-specs.yaml` + `screen-blueprints.yaml` + `design-system.yaml`; `content-fixtures.yaml` for fixtures; the current wave prompt.

**MUST NOT read as visual reference:** old UI components, old screenshots, `design/pen/bidplace-web.pen`, `design/pen/bidplace-web-v2.pen`, `design/pen/target-solution/**`.

**MUST NOT change:** route files' URL structure; `packages/contracts`; `packages/api-client`; backend; `.pen` files; design specs; this contract; dependency list beyond §5.

**Working discipline:**
- One screen (or one wave scope) per pass. Finish states + tests before touching the next.
- Reuse the §7 component for every master; if a needed variant is missing, STOP and file a blocker — do not fork the component.
- Decisions in §6 marked durable fix are closed. Do not re-evaluate libraries, styling systems, or layer placement.
- Blockers: append to `design/creator-first/implementation/BLOCKERS.md` with component/screen id, spec reference, exact ambiguity, proposed default. Continue with unaffected scope.
- Checks per pass: `pnpm --filter @bidplace/design-tokens build`, typecheck, `vitest` affected specs, relevant Playwright spec(s), and the three-viewport screenshots for touched screens.
- Pen comparison: open the exported frame images for the touched masters/frames (from the Pen build outputs), compare composition, spacing rhythm, and states; measurements come from specs, not from eyeballing.
- Stop when: wave scope done; or a blocker affects >30% of remaining scope; or any protected file would need modification.

---

## 13. Definition of done

**Component:** implements every spec variant/state; tokens-only styling; a11y (role, label, focus, 44×44, reduced motion) verified; unit tests for its pure logic; consumed via its canonical path; no lint/type errors; screenshot in gallery at 3 viewports where visual.

**Screen:** composed only from §7 components; loading/empty/error/missing-media/role states implemented; keyboard path works on web; no horizontal overflow at 390/1024/1440; e2e flow + state assertions green; screenshots at 3 viewports captured; old functionality preserved (existing e2e for that route still green); `docs/design/04-DESIGN-STATUS.md` updated in the same pass.

---

## 14. Risks and unresolved decisions

- **R1 — Route contract vs blueprint vanity routes.** Blueprints propose `/{slug}` and `/{slug}/{publicId}`; the committed product contract is `/seller/[slug]` and `/product/[publicId]`. This contract keeps committed routes (durable default). Vanity routes need an explicit founder/product decision + redirect strategy; nothing blocks implementation.
- **R2 — Auth flow mismatch.** `auth_panel` designs an email+code-first entry; the server contract is email/password registration + email OTP before first bid. Durable default chosen: keep server contract, apply creator-first visuals to existing login/register + verification dialog. Passwordless auth = separate product+backend decision.
- **R3 — Tabular numerals.** Piazzolla static TTFs' `tnum` support is unverified. Default: fixed-width price slots; Wave 0 verifies and may switch to `fontVariant: ['tabular-nums']`. Not a blocker.
- **R4 — expo-image blurRadius on RNW.** Expected to map to CSS filter; Wave 3 verifies on web. Mirror-caption opaque fallback is a mandatory code path either way, so worst case = fallback everywhere on web. Not a blocker.
- **R5 — Explore as two routes.** Blueprint shows one explore screen with tabs; production keeps `/works` + `/authors` with TabPill navigation between them (durable default preserving URLs). If product later wants a single `/explore`, that is a route decision (see R1).
- **R6 — Onboarding route shape.** Step flow lives inside `/profile` (existing seller cabinet entry). If product wants dedicated step URLs (`/profile/steps/n`) for resumability, decide before Wave 7; default (internal step state) is functional.

None of these blocks Waves 0–6.

## 15. Rejected approaches

The following are rejected for this migration and MUST NOT reappear:

1. Copying web-only components (DOM/Tailwind/shadcn/21st.dev code) into Expo/RNW.
2. Screen-local token values or per-screen breakpoint constants.
3. Duplicate card/dialog/nav components per screen.
4. A separate web UI tree next to a separate mobile UI tree.
5. Client-owned auction business rules (minimum computation, soft-close simulation, winner derivation, optimistic acceptance).
6. Pasting Pen-generated HTML/CSS into production code.
7. Giant components configured by stacks of boolean props instead of composition.
8. Arbitrary/full-screen blur of creator media; any blur outside the creator_card caption strip.
9. Unvirtualized unbounded feeds (bounded pagination is the contract; if boundedness breaks, virtualize first).
10. Inaccessible custom controls (no role/label/focus/keyboard path).
11. Speculative dependencies (FlashList, expo-blur, zustand, moti, expo-video-before-its-wave, @gorhom usage).
12. NativeWind/Tailwind adoption mid-migration; two styling systems.
13. Mixing legacy `designTokens` values into creator-first components.
14. Route contract changes without a recorded product decision.

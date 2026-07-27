# bidplace Modern UI — project decisions

Status: **APPROVED TARGET DESIGN**
Implementation status: **NOT STARTED**
Last reviewed: 2026-07-27
Owners: founder / assigned designer / frontend owner — names not recorded
Related references: [`references/myplastic/README.md`](./references/myplastic/README.md), [`references/bidplace-concepts/README.md`](./references/bidplace-concepts/README.md)

This is the target source of truth after migration begins. It is not a description of the current application. When the audit finds a difference, preserve both CURRENT and TARGET and do not silently revise the target.

## 1. Design direction

**Warm editorial marketplace**: a strict editorial/archive feel inspired by MyPlastic, warm image-first discovery inspired by Pinterest, consumer-app simplicity, and transparent auction mechanics.

The product should feel cultural, modern, young, warm, visual, simple, confident, and valuable. It must not look like a generic AI dashboard, corporate SaaS, Material Design, eBay, a casino/trading app, or a luxury boutique.

Principles: image-first, content-first, progressive disclosure, one primary scenario per screen, one dominant CTA per meaning area, color mostly from imagery, nearly monochrome UI, rare orange, and always-visible critical auction information.

Reference priority: bidplace business logic → this document → approved local screenshots → reference README → external website.

## 2. Brand and logo

Use the existing approved lowercase bidplace wordmark when available, in ink or white on a dark background. Use the compact `bp-mark` where space requires it. Do not create a new logo or use the logo as decorative card content. Clear space is at least the height of the letter `b`.

CURRENT: `apps/mobile/assets/brand-mark.png` exists and is used by `apps/mobile/src/components/layout/BrandLogo.tsx`; the wordmark is live text in Cormorant Garamond. No separate wordmark asset or `bp-mark` asset was found in the audit.
TARGET: the wordmark and compact mark remain behind one brand adapter, with exact asset paths recorded before implementation.

## 3. Target v1 tokens

These values are target values, not runtime values. Screens must consume semantic names through the future token layer.

### Color

| Token | Value |
| --- | --- |
| canvas | `#F7F4EE` |
| surface | `#FFFFFF` |
| surfaceMuted | `#F1EEE8` |
| ink | `#111111` |
| inkSoft | `#252525` |
| textSecondary | `#77736D` |
| textMuted | `#A5A099` |
| border | `#E2DDD4` |
| chip | `#EEEAE4` |
| placeholder | `#D8D4CD` |
| accent | `#D94A24` |
| accentDark | `#BC3C1B` |
| accentSoft | `#FFF0E8` |
| success | `#3F7A48` |
| danger | `#D6453D` |
| overlay | `rgba(0, 0, 0, 0.22)` |

Target distribution is approximately 85–90% light surfaces, 8–12% black/gray, and 2–3% orange. Accent is reserved for back, active navigation, ending-soon state, active filter, short editorial metadata, small status, and limited CTA emphasis. It must not color every price, icon, link, badge, or large background.

CURRENT → TARGET: current semantic tokens are `#F7F6F3` canvas, cobalt `#2457E6` primary, `#171717` text, Cormorant/Inter typography, and radii 4/8/12/16/999 in `packages/design-tokens/src/index.ts`; target values above are a planned visual change.

### Typography

Target primary sans is Inter at 400/500/600/700. Target mono is PT Mono Regular, with IBM Plex Mono or Geist Mono as a single fallback only if Cyrillic/font assets fail real checks. The logo is not UI typography.

| Role | Target |
| --- | --- |
| display | Inter 700, 36/42 desktop, 32/38 mobile |
| screenTitle | Inter 700, 30/36 desktop, 28/34 mobile |
| sectionTitle | Inter 600, 22/28 desktop, 20/26 mobile |
| cardTitle | Inter 600, 16/21 |
| body | Inter 400, 17/26 |
| bodySmall | Inter 400, 15/22 |
| label | Inter 500, 14/19 |
| metadata | PT Mono, 12/16, 0.03em |
| button | PT Mono, 15/18, 0.03em |
| caption | PT Mono, 11/15, 0.06em, short uppercase status only |
| numeric | PT Mono, tabular numbers, 14–18 |

Mono is for CTA, filters, deadlines, statuses, bids, metadata, technical values, and short labels—not long descriptions, stories, onboarding, or legal copy.

### Space, size, and radius

Base unit is 4 px. Approved spacing is 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Gutters: 20 px mobile, 24 px wide mobile, 32 px desktop. Section gap is 32–40 px. Minimum touch target is 44×44 px. Primary button is 56 px high; input 50–52 px; filter chip 34–36 px; content tab 44–46 px; mobile bottom action bar 56–64 px plus safe area.

Approved radii: small 8, control 14, image 16, button 18, panel 22, sheet 28, pill 999. Cards do not require a container. Default shadows are forbidden; allow them only for AppSheet, floating action dock, modal, dropdown, or temporary drag preview.

## 4. Components and interaction decisions

- `PrimaryButton`: ink background, surface text, PT Mono, 56 px, radius 18, no shadow.
- `SecondaryButton`: surface, ink text, 1 px border, 56 px, radius 18.
- `TextButton`: no container; underline only when link-like.
- `IconButton`: 44 px minimum touch target, icon 18–26 px, accessible label.
- `BackButton`: Lucide `ChevronLeft`, accent, 44 px target; never `ArrowLeft`.
- `FilterChip`: 34–36 px pill, mono 13; active is ink/surface.
- `MetadataChip`: thin border and mono 12–13; noninteractive unless explicitly stated.
- Product-detail tags: short outlined anchors for year/category/material/edition/provenance; keep the set small, near-monochrome, and connected to real filter dimensions where interactive.
- `SegmentedControl`: muted container, ink active segment, 2–3 options.
- `ContentTabs`: pill tabs for item, making story, and provenance; never hide critical auction data in tabs.
- `AuctionCard`: image-first 4:5, title, current price/bid, deadline/status, at most one secondary metadata line.
- `CompactAuctionRow`: thumbnail, title, price, deadline/status, optional bid count, separators not heavy cards.
- `AppSheet`: one public adapter; bottom sheet on mobile and dialog/popover/side panel on desktop.
- `SettingsRow`: icon, title, optional value, chevron, divider; destructive actions separated.
- `AppImage`: Expo Image, stable aspect ratio, placeholder, blur/thumb hash, caching, transition.
- `BottomActionBar`: mobile sticky current price/state and CTA, safe-area aware, not a duplicate auction panel.

## 5. Motion

Centralize values: instant 80 ms, fast 120 ms, normal 180 ms, slow 260 ms. Shared press presets: icon opacity 0.6; button scale 0.98 and opacity 0.92; card scale 0.992 and opacity 0.96; primary action scale 0.98 and opacity 0.9. Entering presets are FadeIn, FadeInUp, SlideUp, and LayoutTransition.

Business actions must not wait for motion. No per-component springs or bounce for ordinary actions. Reduced motion removes translate and scale. Haptics are optional on native and only for meaningful actions. Sheet physics belongs to the sheet library; ordinary buttons do not need Gesture Handler.

## 6. Responsive and screen invariants

Use one route tree, shared domain logic, and one public component API. Mobile is primary: compact header, bottom navigation, sheets, sticky actions, safe area. Desktop uses compact sidebar, top search, wide content, and visual grid; natural desktop equivalents replace sheets. Use a platform file only for a real layout/behavior difference.

Home always shows discovery content, images, title, price/current bid, and deadline/state. Product detail first viewport always shows gallery, title, current bid, minimum next bid, remaining time/status, and primary CTA. OTP appears only after “Сделать ставку”. Activity is a compact list with one main status. Seller forms are staged and category-dependent; preview is separate from editing. Settings are grouped. Admin uses the same tokens and base components, without a random SaaS shell.

### Primary product-detail reference

The primary visual reference for the future bidplace Product detail page is [`references/design-photos/myplastic/product-page/README.md`](./references/design-photos/myplastic/product-page/README.md). It defines the intended direction for the object hero, controlled image overlap, title/author hierarchy, metadata pills, black primary CTA, progressive disclosure tabs, and restrained black/white information language. It is a target reference, not an implemented screen or a replacement for product/auction rules.

## 7. MUST / MUST NOT

### MUST

- Use centralized semantic tokens and the catalog.
- Isolate third-party libraries behind bidplace components.
- Design web, Android, and iOS together.
- Keep domain logic separate from UI.
- Add every shared component and motion pattern to the relevant document before implementation.
- Keep auction-critical data, public/private boundaries, and accessibility explicit.

### MUST NOT

- Put raw HEX, raw animation values, or direct third-party imports in routes.
- Import Reanimated, Gorhom, Haptics, or Lucide chaotically into screens.
- Copy a component or create two UI solutions for one role.
- Add a token, icon pack, or library without a durable reason and ADR.
- Hide price/deadline, rely on color alone, overuse badges/shadows, or use decorative orange.
- Present target architecture as implemented.
- Mix Tamagui and Modern UI except in a temporary, documented bridge during a future migration.

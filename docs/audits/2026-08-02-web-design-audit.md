# Web design audit — 2026-08-02

## 1. Verdict

- Current web UI is a credible functional Modern UI cutover, but it is **not ready for final design acceptance**: 1 P0, 20 P1 and 7 P2 findings remain.
- Strong foundations are already present: white canvas, real product imagery, semantic text/type roles, content-width buttons, explicit auction facts, role-aware navigation and confirmed destructive dialogs.
- The P0 is product-detail comprehension: at 1024 and 390 the first viewport does not expose the complete auction truth/action set, and the mobile bid dock is too tall.
- Catalog structure is close, but 1024 uses two rather than three columns, narrow card footers break BYN/status, and loading geometry does not match loaded cards.
- Author, activity, seller and admin screens still inherit prototype/form patterns: weak creator identity, omitted auction facts, raw enums/ISO values, unstable media previews and narrow stacked desktop moderation.
- Accessibility is incomplete at the shared layer: no universal focus-visible treatment, reduced-motion branch or reliable focus return; navigation semantics, hit targets and several contrast pairs fail acceptance.
- Header and destructive-dialog regressions from recent commits are genuinely closed: 1440 rail/account, unified 1024/390 mobile header, centered 520px dialog and destructive-before-cancel hierarchy all pass available evidence.
- Nine runtime screenshots and all approved local references were inspected, but current E2E cannot prove buyer CTA, max-role navigation, long/state layouts or deterministic image opacity; fresh regeneration also failed before Playwright due package-manager signature verification.
- Implementation should begin with **Wave A — Structural responsive fixes**, then shared visual-system corrections, then screen polish/acceptance. Do not start with isolated screen styling.

## 2. Evidence reviewed

| Source | What was reviewed | Reliability | Notes |
|---|---|---|---|
| `AGENTS.md` | Repository instructions, document ownership, update rules, skill selection | High | Current HEAD |
| `docs/product/00-PROJECT-INDEX.md` | Document map, reading packages, status definitions | High | Current HEAD |
| `docs/product/01-PRODUCT-FOUNDATION.md` | Core value proposition, brand tone, visual principles, rejected directions | High | Protected; Confirmed |
| `docs/product/05-MVP-RFC.md` | Exact MVP behavior, roles, auction rules, card requirements, contact privacy | High | Confirmed v1.1 |
| `docs/product/11-PROJECT-STATUS.md` | Implementation status of all features; wave 1 and wave 2 state | High | Updated 2026-08-02 |
| `docs/design/00-DESIGN-INDEX.md` | Design doc ownership, reading order | High | Current HEAD |
| `docs/design/01-DESIGN-FOUNDATION.md` | Visual hierarchy, required feeling, trust/clarity, photo requirements, rejected directions | High | Protected; Confirmed |
| `docs/design/02-USER-FLOWS-AND-SCREENS.md` | Canonical routes, screen states, flow constraints | High | Updated 2026-08-01 |
| `docs/design/03-DESIGN-SYSTEM.md` | Current implementation inventory, target principles, missing foundations | High | Updated 2026-08-01 |
| `docs/design/04-DESIGN-STATUS.md` | Per-screen implementation status, remaining QA | High | Updated 2026-08-02 |
| `docs/design/05-DESIGN-HANDOFF.md` | Handoff workflow, naming, required states, QA checklist | High | No Figma linked |
| `packages/design-tokens/src/index.ts` | Legacy token set: colors, spacing, radius, sizes, typography, shadows, layout, brand | High | Code review |
| `packages/design-tokens/src/modern.ts` | Active token set: modernTokens color/space/radius/size/typography/motion/layer | High | Code review |
| `/private/tmp/bidplace-wave2-screenshots/` | Catalog, product-detail and destructive-dialog screenshots at 1440×900, 1024×900 and 390×844 | High for visible geometry; Medium for reproducibility | Nine PNGs exist, timestamped 2026-08-02 01:16. They visually include the mobile-header correction committed one minute later in `e672dda`. A fresh rerun on 2026-08-02 11:49 failed before Playwright because pnpm registry-signature verification could not complete; the existing artifacts remain the only runtime visual evidence. |
| `apps/mobile/e2e/01-wave2-layout-screenshots.spec.ts` | Screenshot E2E: what it asserts (card count, image naturalWidth, no visible heading, mobile card proximity) | Medium | Spec and its nine existing outputs reviewed. It does not wait for image transition completion, assert catalog metadata geometry, use an eligible buyer for product CTA, or cover non-admin navigation variants. |
| `docs/modern-ui/DESIGN.md`, `00-project-decisions.md` and approved local reference pack | Target visual grammar plus MyPlastic/Tracker screenshots for catalog, product, author, auth, settings, dashboard, empty, filters, search and compact rows | High for art direction; Low for current-runtime claims | Used only for composition and density. Explicit task decisions override conflicts: white canvas, linear product sections and unified top mobile header. No reference flow was promoted into product scope. |
| Commit `db4f2d1` | Catalog/product layout overhaul, button width variants, description one-line | High | 15 files, reviewed stat+message |
| Commit `933312d` | Dialog centering via portal wrapper, catalog description clamp, target-width screenshots | High | 10 files, reviewed stat+message |
| Commit `d02ec40` | Isolated wave 2 screenshots, seeded product assertions | High | 3 files, reviewed stat+message |
| Commit `e672dda` | Removed mobile header spacer, desktop account row desktop-only, removed mobile nav top divider | High | 5 files, reviewed diff |
| Product image fixtures and `packages/database/prisma/seed.js` | Three seeded product images, titles, seller and listing states used by screenshot scenario | High | Real local PNGs are loaded in all catalog/product screenshots; no invented placeholder-only catalog conclusion |

## 3. Target visual system

### 3.1 Color tokens

| Area | Current token/value | Target token/value | Exact usage | Rationale |
|---|---|---|---|---|
| Canvas | `color.canvas: '#FFFFFF'` | Keep `#FFFFFF` | Page background, app shell | Matches confirmed white canvas decision |
| Surface | `color.surface: '#FFFFFF'` | Keep `#FFFFFF` | Card surface, dialog surface, inputs | Same as canvas by intent — separated for future theming |
| Muted surface | `color.surfaceMuted: '#F7F7F7'` | Keep `#F7F7F7` | Skeleton placeholder fill, chip bg, empty state bg | Subtle lift without warm cast |
| Border | `color.border: '#E2DDD4'` | Keep `#E2DDD4` | Section dividers, card strokes (if used), header bottom line, input borders | Warm neutral; consistent with product tone |
| Ink (primary text) | `color.ink: '#111111'` | Keep `#111111` | Headings, body, primary labels, PrimaryButton bg | Near-black for maximum readability |
| Ink soft | `color.inkSoft: '#252525'` | Keep `#252525` | Secondary headings, subtitle text | Slightly softer than ink |
| Text secondary | `color.textSecondary: '#77736D'` | Keep `#77736D` | Author names, metadata labels, timestamps, subdued but required captions | Contrast on white is 4.71:1 and passes WCAG AA for normal text |
| Text muted | `color.textMuted: '#A5A099'` | Keep `#A5A099`, but restrict it to placeholders and disabled/non-essential text | Input placeholders and disabled labels only; do not use for required captions | Contrast on white is 2.60:1. User-facing captions must use `textSecondary`; see F-ACC-01 |
| Accent | `color.accent: '#D94A24'` | Keep `#D94A24` for non-text accents; use `accentDark` for small text | Selected indicators, accent backgrounds and large marks | Contrast on white is 4.24:1, so it does not pass AA for the current 14px regular `TextButton`; see F-ACC-02 |
| Accent dark | `color.accentDark: '#BC3C1B'` | Keep `#BC3C1B` | Hover/pressed state for accent | Darker for interactive feedback |
| Accent soft | `color.accentSoft: '#FFF0E8'` | Keep `#FFF0E8` | Accent tint bg, status badge bg | Light warm bg |
| Success | `color.success: '#3F7A48'` | Keep `#3F7A48` | Sold status, successful bid confirmation | Green; clearly distinct from accent/danger |
| Danger | `color.danger: '#D6453D'` | **Proposed token value: `color.danger: '#B63B3B'`** (existing legacy `colors.negative`). Founder approval required | DestructiveButton background, danger-tone text, error messages | Current white-on-danger contrast is 4.40:1 and misses AA for the 15px regular button label; the proposed value reaches 5.71:1 and separates destructive red from orange accent. See F-ACC-02 |
| Overlay | `color.overlay: 'rgba(0,0,0,0.22)'` | Keep | Dialog/sheet backdrop | |
| Chip | `color.chip: '#F5F5F5'` | Keep `#F5F5F5` | Category/tag chip bg | |
| Placeholder | `color.placeholder: '#D8D4CD'` | Keep `#D8D4CD` | Image placeholder, skeleton shimmer | |
| Focus ring | **Missing in modernTokens** | **Proposed token: `color.focus: '#2457E6'`** (existing legacy `colors.primary`). Founder approval required | 2px keyboard focus outline with 2px offset on buttons, links, menu items and other pressables | The active system has no focus role. Legacy `colors.focus: '#7FA1FF'` is only 2.49:1 against white, while `#2457E6` reaches 5.86:1. See F-ACC-03 |
| Disabled opacity | Hardcoded `0.5` in `MotionPressable` and `TextField` | **Proposed token: `opacity.disabled: 0.5`**. Founder approval required | All disabled buttons, inputs and icon buttons | Preserves current rendering while removing duplicated state styling; see F-TOK-02 |

### 3.2 Typography tokens

| Area | Current token/value | Target token/value | Exact usage | Rationale |
|---|---|---|---|---|
| Font family — body | `Inter_400Regular/500Medium/600SemiBold/700Bold` | Keep | All body text, labels and headings | All four faces are registered through Expo `useFonts` in `apps/mobile/src/app/_layout.tsx`, including web |
| Font family — mono | `PTMono_400Regular` | Keep | Prices, metadata, buttons and captions | Registered through Expo `useFonts` in `apps/mobile/src/app/_layout.tsx` |
| Font family — brand | Legacy `brand.fontFamily: 'CormorantGaramond_500Medium'` is unused | No runtime font token required for the current raster wordmark | `BrandLogo` renders approved image assets | Do not load an unused brand font or redesign the wordmark without a founder decision |
| Display | `fontSize: 32, lineHeight: 38, weight: 700` at all widths | Keep 32/38 mobile; approved desktop target 36/42 | Mobile hero; desktop product/author hero only | Responsive desktop role is in approved Modern UI docs but missing from active tokens |
| Screen title | `fontSize: 28, lineHeight: 34, weight: 700` at all widths | Keep 28/34 mobile; approved desktop target 30/36 | Page headers when used | Avoid enlarging catalog because its heading is intentionally absent |
| Section title | `fontSize: 20, lineHeight: 26, weight: 600` at all widths | Keep 20/26 mobile; approved desktop target 22/28 | Linear section headings and major form groups | |
| Card title | `fontSize: 16, lineHeight: 21, weight: 600` | Keep | AuctionCard item name | |
| Body | `fontSize: 17, lineHeight: 26, weight: 400` | Keep | Primary body text, descriptions | |
| Body small | `fontSize: 15, lineHeight: 22, weight: 400` | Keep | Secondary body text, longer descriptions | |
| Label | `fontSize: 14, lineHeight: 19, weight: 500` | Keep | Form labels, button-adjacent labels | |
| Metadata | `PTMono, fontSize: 12, lineHeight: 16, ls: 0.36` | Keep | Timestamps, secondary data | |
| Button text | `PTMono, fontSize: 15, lineHeight: 18, ls: 0.45` | Keep | All button labels | Monospace gives distinctive character |
| Caption | `PTMono, fontSize: 11, lineHeight: 15, ls: 0.66` | Keep | Image captions, footnotes | |
| Numeric (price) | `PTMono, fontSize: 14, lineHeight: 18` | Keep | Price display, bid amounts | |
| Nav | **Missing in modernTokens** | **Proposed token: `typography.nav: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18, weight: '500' }`**. Founder approval required | Desktop rail tooltips, mobile bottom nav labels | Legacy had `nav` role; modernTokens does not |

### 3.3 Spacing, radius, sizing

| Area | Current token/value | Target token/value | Exact usage | Rationale |
|---|---|---|---|---|
| Spacing scale | `x1:4, x2:8, x3:12, x4:16, x5:20, x6:24, x8:32, x10:40, x12:48, x16:64` | Keep | All component and layout spacing | Consistent 4px grid |
| Radius — small | `8` | Keep | Tags, chips, small badges | |
| Radius — control | `14` | Keep | Inputs, selects, compact controls | |
| Radius — image | `16` | Keep | Card images, gallery thumbnails | |
| Radius — button | `18` | Keep `18` for default buttons; use existing `radius.control: 14` only with an approved compact density | Primary, secondary and destructive default buttons | No screenshot evidence proves the default radius is defective; avoid a taste-only global change |
| Radius — panel | `22` | Keep | Dialog panels, sheet panels | |
| Radius — sheet | `28` | Keep | Bottom sheets on mobile | |
| Radius — pill | `999` | Keep | Icon buttons, avatar, full-round elements | |
| Touch target | `size.touch: 44` | Keep `44` | Minimum interactive area for all buttons, links, nav items | Meets 44×44 WCAG target |
| Input height | `size.input: 52` | Keep | Text fields, selects | |
| Button height | `size.button: 56` | Keep `56` for default/form actions; **Proposed token: `size.buttonCompact: 44`** for explicitly compact actions. Founder approval required | Default for primary/secondary/destructive; compact only in dense toolbars or moderation rows | Keeps the established high-confidence form action while giving dense contexts a minimum compliant 44px option |
| Icon size | `size.icon: 20` | Keep `20` | All AppIcon default size | |
| Card media ratio | Hardcoded `4/5` in card, gallery, placeholder and skeleton | **Proposed token: `ratio.productPortrait: 4/5`**. Founder approval required | `AuctionCard`, `ProductGallery`, `ImagePlaceholder` default and catalog skeleton | Preserves the current portrait presentation while preventing fallback/loading drift; see F-TOK-02 |

### 3.4 Layout tokens

| Area | Current token/value | Target token/value | Exact usage | Rationale |
|---|---|---|---|---|
| Page max width | Legacy `layout.pageMaxWidth: 1440`; not consumed by current app | **Proposed active token: `layout.pageMaxWidth: 1440`**. Founder approval required | Optional outer desktop canvas constraint if confirmed by shell/catalog audit | Do not claim the current shell is constrained; final use is assessed in audit units 3 and 5 |
| Content max width | Legacy `layout.contentMaxWidth: 1280`; not consumed by current app | **Proposed active token: `layout.contentMaxWidth: 1280`**. Founder approval required | Reading/form/detail content where an explicit maximum is needed; not the full catalog grid | Keeps a documented legacy value available without applying it indiscriminately |
| Desktop rail width | Hardcoded `72` in `AppHeader` | **Proposed token: `layout.railWidth: 72`**. Founder approval required | Desktop icon-only navigation rail and shell offsets | Preserves current compact width and gives shell/overlay geometry one source of truth; final assessment in audit unit 3 |
| Catalog grid breakpoints | Hardcoded `1025` and `1440` in `ProductListScreen` | Confirmed target: 2 cols below 900px, 3 cols at 900–1439px, 4 cols at 1440px+. **Proposed tokens: `breakpoint.catalogThreeColumn: 900`, `breakpoint.catalogFourColumn: 1440`**. Founder approval required | Catalog grid only; it remains independent from the shell rail breakpoint | Target behavior is confirmed, but active layout tokens do not contain the values; final finding in audit unit 5 |
| Shell breakpoint | Hardcoded `1025` in `AppShell` and `AppHeader` | **Proposed token: `breakpoint.desktopShell: 1025`** | Switch unified mobile header to desktop rail/account row | Preserves the visually validated transition and prevents duplicated magic values |
| Product-detail breakpoint | Reuses shell `1025` | **Proposed token: `breakpoint.productDetailWide: 900`**. Founder approval required | Two-column gallery + title/auction block at 900px+ | Required to satisfy 1024 first-viewport auction hierarchy; see F-PDP-01 |
| Product detail max width | Hardcoded `1180` | **Proposed token: `layout.productDetailMaxWidth: 1180`** | Unified hero and linear detail page container | Preserves current 1440 composition while centralizing the invariant |
| Product hero width | Hardcoded `300` at all widths | `300` below 900; **Proposed token: `layout.productHeroWide: 440`** at 900px+. Founder approval required | Loaded and failed gallery images | See F-PDP-02 |
| Form/list max width | Repeated `760` in activity/seller/admin/order shells | **Proposed token: `layout.formMaxWidth: 760`** | Single-column forms and compact lists only | Preserve current readable measure; moderation widens separately on desktop |
| Author avatar | Hardcoded `64` public; full-width editor preview | **Proposed tokens: `size.authorAvatar: 120`, `size.profileEditorPreview: 200`**. Founder approval required | Public identity and profile form preview/fallback | See F-AUTHOR-01 and F-MEDIA-01 |
| Desktop account control | 56px account row; 32px horizontal gutter; 44px trigger | Keep exactly | Top-right control above desktop content; dropdown through popover layer | Confirmed by 1440 screenshots |
| Mobile header | 56px brand/account row + 44px-min nav row + one outer divider | Target 56px brand row + 56px equal-width nav row + one bottom divider | 390/1024 unified header; icon above up-to-two-line label | Preserves the closed divider fix and accommodates approved-seller labels; see F-NAV-01 |
| Dialog | `maxWidth: 520`, 20px viewport gutter, radius 22, centered | Keep; add viewport-fixed wrapper, `maxHeight: calc(100dvh - 40px)`, internal overflow and `layer.modal: 30` | Bid/destructive confirmations at all widths | Current geometry passes; layer/long-content contract is incomplete; see F-DLG-01 |
| Bottom action | Content-dependent column containing full bid form | 56–64px row + safe area; summary + one CTA | Mobile product bidding only; amount input remains in auction panel | See F-PDP-01 |

### 3.5 Layer (z-index) tokens

| Area | Current token/value | Target token/value | Exact usage | Rationale |
|---|---|---|---|---|
| Content | `layer.content: 0` | Keep | Main page content | |
| Chrome | `layer.chrome: 10` | Keep | Header, rail, sticky elements | |
| Popover | `layer.popover: 20` | Keep | Account menu, tooltips | |
| Modal | `layer.modal: 30` | Keep | Dialogs, sheets, overlay | |

### 3.6 Motion tokens

| Area | Current token/value | Target token/value | Exact usage | Rationale |
|---|---|---|---|---|
| Instant | `motion.instant: 80` | Keep | Opacity toggles, micro-feedback | |
| Fast | `motion.fast: 120` | Keep | Button hover/press, icon state | |
| Normal | `motion.normal: 180` | Keep | Menu open, card hover lift | |
| Slow | `motion.slow: 260` | Keep | Sheet transitions, page transitions | |

### 3.7 Button variants

| Variant | Current bg / text / border | Width default | Height | Radius | Notes |
|---|---|---|---|---|---|
| PrimaryButton | bg: `ink`, text: `surface` | `content` | `56` (minHeight) | `18` | Dark button, content-width by default ✓ |
| SecondaryButton | bg: `surface`, text: `ink`, border: `border 1px` | `content` | `56` | `18` | Outlined variant ✓ |
| DestructiveButton | bg: `danger`, text: `surface` | `content` | `56` | `18` | Current 4.40:1 label contrast misses AA; use approved danger replacement from F-ACC-02 |
| TextButton | text: `accent`, underline | self-start (no width variant) | `touch 44` | none | Use existing `accentDark` for the 14px label so contrast reaches 5.53:1; see F-ACC-02 |
| IconButton | bg: transparent / `ink` (selected) | fixed `44×44` | `44` | `pill` | Toggle-style icon ✓ |
| BackButton | wraps IconButton chevronLeft | fixed `44×44` | `44` | `pill` | ✓ |

## 4. Findings and exact fixes

Shell/header validation (audit unit 3): no new finding. The 1440×900 screenshot and current code confirm a 72px icon rail with hover/focus tooltips and a separate top-right account control. The 1024×900 and 390×844 screenshots confirm one compact mobile header block with logo/account row, navigation row and exactly one bottom divider. The removed mobile spacer and duplicate divider from `e672dda` are not re-reported. Role variants with four mobile destinations remain a regression-evidence gap covered in F-VR-01 during audit unit 9.

**P0**

### [P0] F-PDP-01 — Auction truth and action do not fit the first product viewport

- **Evidence:** In `product-1024.png`, the fixed 300×375 gallery sits alone above title/story and the auction panel; timing/deadline continue below the 900px viewport. In `product-390.png`, only status and the top of the current-price value reach the 844px boundary. The screenshot user is an admin, so no bid CTA is present. For an eligible buyer, code adds a bottom dock containing summary + 52px input + 56px button + gaps/padding (roughly 180–200px), further reducing visible content. This violates the confirmed first-viewport requirement for gallery, title, current bid, minimum, status/time and primary action.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/products/product-screen.tsx` (`isDesktop`, top-block layout, mobile `bidForm`, `bottomAction`); `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/BottomActionBar.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/AuctionPanel.tsx`.
- **Root cause:** product-detail composition is coupled to the 1025px shell breakpoint, and the mobile sticky-action region contains the entire bid form instead of one compact auction summary/action row.
- **Required change:** introduce an independent product-detail wide breakpoint at 900px: at 900px+ render gallery and title/auction column side by side. Below 900px keep the linear stack but move the amount input and validation into `AuctionPanel`; make `BottomActionBar` a single 56–64px row plus safe area with compact minimum/current summary and one `Сделать ставку` button. Reduce the top story preview to two lines on 390 and remove the publication caption from the top block; keep full story/date in linear detail sections.
- **Do not do:** shrink critical type, crop the gallery behind a fixed height, hide minimum/deadline in a tab, or use negative margins/absolute overlaps to force content into the viewport.
- **Acceptance criteria:** at 1440×900 and 1024×900, gallery, author, title, short story, status, current bid, minimum next bid, deadline/time and eligible primary CTA are visible without scrolling. At 390×844, the page shows gallery/title plus status/current bid, while the fixed compact dock simultaneously exposes minimum/current summary and CTA without covering panel text; keyboard opening never hides the active input or CTA.
- **Tests/evidence:** buyer-authenticated product screenshots at all three viewports, plus 390×844 with keyboard/input focused; bounding-box assertions for each critical element; admin screenshot retained separately to verify the non-participation notice.

**P1**

### [P1] F-ACC-01 — Muted captions do not meet text contrast

- **Evidence:** On `/register` at 1440×900, 1024×900 and 390×844, the email-rule caption uses `role="caption" tone="muted"`; the same tone is used for seller-profile supporting text. `AppText` renders it as `#A5A099` on white, a measured contrast of 2.60:1, below the WCAG AA 4.5:1 requirement for the current 11px regular text. Runtime screenshots are unavailable, so this conclusion is code- and token-derived.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/AppText.tsx` (`toneColors.muted`); `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/auth/email-rules-gate.tsx` (`role="caption" tone="muted"`); `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/sellers/seller-profile-screen.tsx` (`tone="muted"`).
- **Root cause:** `textMuted` is exposed as a general text tone even though its contrast only suits placeholders, disabled text or non-essential decoration.
- **Required change:** render required captions and supporting copy with existing `color.textSecondary: '#77736D'` (4.71:1 on white); reserve `color.textMuted` for placeholders and disabled/non-essential content, and document that usage in the token role.
- **Do not do:** increase font size merely to qualify as large text, add a one-off darker hex in either screen, or place the caption on a darker screen-local background.
- **Acceptance criteria:** every readable caption at 11–17px has at least 4.5:1 contrast against its actual background; the two current `tone="muted"` call sites no longer render required content with `#A5A099`.
- **Tests/evidence:** token contrast unit test for `textSecondary` on `canvas`; 1440×900, 1024×900 and 390×844 screenshots of `/register` plus the seller-profile form; automated accessibility scan with no text-contrast violation for those captions.

### [P1] F-ACC-02 — Accent and destructive actions miss normal-text contrast

- **Evidence:** On every route that renders `TextButton`, its 14px regular label is `#D94A24` on white (4.24:1). `DestructiveButton` renders a 15px regular white label on `#D6453D` (4.40:1). Both miss the 4.5:1 AA threshold, and the orange-red accent and red destructive roles are too close to carry action meaning reliably without shape and copy. Runtime screenshots are unavailable; measured token pairs and shared component code are authoritative.
- **Affected code:** `/Users/yayauheny/projects/bidplace/packages/design-tokens/src/modern.ts` (`color.accent`, `color.accentDark`, `color.danger`); `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/Button.tsx` (`TextButton`, `DestructiveButton`); `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/AppText.tsx` (`accent`, `danger` tones).
- **Root cause:** colors were selected without a contrast matrix for their actual foreground/background pair and text size; `danger` also duplicates the warm hue family already assigned to accent.
- **Required change:** use existing `accentDark: '#BC3C1B'` for small accent text (5.53:1 on white). Replace active `color.danger` with proposed `#B63B3B`, the existing legacy negative value (5.71:1 with white), after founder approval; apply it consistently to destructive buttons, error copy and danger icons.
- **Do not do:** bold the existing small label as a substitute for fixing color, add screen-local reds, or distinguish destructive actions only through color without explicit copy and destructive button treatment.
- **Acceptance criteria:** normal-size accent and destructive labels reach at least 4.5:1; destructive actions remain labeled explicitly and are visually distinguishable from links in default, pressed, disabled and loading states.
- **Tests/evidence:** token contrast tests for `accentDark/canvas`, `surface/proposed danger` and `proposed danger/canvas`; screenshots of one `TextButton`, one destructive confirmation and one inline error at all three acceptance viewports.

### [P1] F-ACC-03 — Shared buttons and links have no visible keyboard focus

- **Evidence:** Across `/`, `/product/[publicId]`, `/seller/[slug]`, `/me/activity`, `/admin`, seller forms and login/register, keyboard focus reaches React Native Web pressables but `MotionPressable` styles only `pressed` and `disabled`; `Button`, `IconButton`, `AuctionCard` and `BrandLogo` provide no focus-visible outline. The active token map has no focus role. Runtime focus screenshots are unavailable.
- **Affected code:** `/Users/yayauheny/projects/bidplace/packages/design-tokens/src/modern.ts` (`color`); `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/MotionPressable.tsx` (`MotionPressable`); `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/Button.tsx` (all variants); `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/layout/BrandLogo.tsx` (`Pressable`).
- **Root cause:** the motion primitive defines pointer press feedback but no keyboard focus-visible state, and the legacy focus color was not migrated into `modernTokens`.
- **Required change:** add proposed semantic token `color.focus: '#2457E6'` after founder approval, then render a 2px focus-visible outline with 2px offset from the component edge in the shared pressable/link primitives; ensure the ring is not clipped by card or toolbar containers.
- **Do not do:** add per-screen focus styles, use the low-contrast legacy `#7FA1FF` ring on white, or treat hover/pressed opacity as keyboard focus feedback.
- **Acceptance criteria:** every interactive element has a clearly visible focus indicator with at least 3:1 contrast against adjacent white/surface pixels; the indicator follows logical Tab order and remains visible at 200% zoom without changing layout.
- **Tests/evidence:** Playwright keyboard traversal at 1440×900 and 1024×900 with focus screenshots for rail, account control, card, text button and dialog actions; component test asserting focus-visible styling from the shared primitive.

### [P1] F-OVR-01 — Mobile account dropdown bypasses the overlay layer

- **Evidence:** On `/`, `/product/[publicId]` and every AppShell route at 1024×900 and 390×844, the account control is inside the first mobile-header row. When opened, `AccountMenu` renders `AccountDropdown` as `position: absolute` inside that row with no `zIndex`; only the desktop branch uses `OverlayPortal`. The supplied screenshots do not open the account menu, so they cannot disprove occlusion by the later-painted page content.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/layout/AccountMenu.tsx` (`AccountMenu`, inline `AccountDropdown`); `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/layout/AppHeader.tsx` (mobile account host); `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/layout/OverlayHost.tsx` (`OverlayPortal`).
- **Root cause:** popover ownership differs by viewport: desktop participates in the centralized popover layer, while mobile creates a screen-tree absolute element without an explicit stacking contract.
- **Required change:** render the account dropdown through `OverlayPortal` on web at every viewport, using `bottom-end` placement and `layer.popover: 20`; keep an inline/native adapter only where a web portal is unavailable. Add viewport-edge collision padding of 8px so the 180px menu stays inside 390px and zoomed layouts.
- **Do not do:** add a header-local `zIndex`, move content down while the menu is open, or add negative margins/fixed clipping heights around the header.
- **Acceptance criteria:** the open account menu is fully visible above catalog cards, product auction panel, sticky actions and admin content at 1440×900, 1024×900 and 390×844; it stays at least 8px inside the viewport and does not change document layout.
- **Tests/evidence:** Playwright screenshots with the account menu open over `/`, `/product/seedLive002` and `/admin` at all three viewports; assertions that it is inside `#app-overlay-host`, has z-index 20 and its bounding box stays within the viewport.

### [P1] F-OVR-02 — Account dropdown does not restore focus after Escape

- **Evidence:** At 1025px+ the account menu opens on trigger focus. `closeOnEscape` only calls `closeMenu()`, and `closeMenu` clears state without focusing the trigger. If keyboard focus has moved to `Выйти`, Escape unmounts the focused dropdown content. Existing `navigation.spec.ts` verifies that the menu closes but never asserts `document.activeElement`; no focus-return screenshot or test exists.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/layout/AccountMenu.tsx` (`triggerRef`, `closeMenu`, `closeOnEscape`); `/Users/yayauheny/projects/bidplace/apps/mobile/e2e/navigation.spec.ts` (account-menu test).
- **Root cause:** the custom popover implements open/close events manually but does not implement the focus lifecycle provided by a complete popover primitive.
- **Required change:** keep a focusable trigger ref and return focus to it when the dropdown closes through Escape or an explicit internal close; preserve outside-pointer close without stealing focus from the user's clicked destination.
- **Do not do:** focus `document.body`, force focus return after every pointer click, or hide the failure by removing Escape support.
- **Acceptance criteria:** after opening the account menu, tabbing to `Выйти` and pressing Escape, the menu closes and the account trigger is `document.activeElement`; the next Tab proceeds to the next logical control exactly once.
- **Tests/evidence:** extend `navigation.spec.ts` with keyboard-only open/traverse/Escape assertions at 1440×900 and 1025×900; capture the focus ring on the restored account trigger.

### [P1] F-CAT-01 — Catalog stays at two columns at 1024px

- **Evidence:** `catalog-1024.png` visibly renders two cards across, each nearly half the viewport, while the confirmed target is three columns from 900 through 1439px. `ProductListScreen` uses `width >= 1025 ? 3 : 2`, coupling the grid to the shell breakpoint. The large 4:5 media makes the 1024 view feel like an oversized gallery rather than the required dense catalog.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/products/product-list-screen.tsx` (`columns`, `cardWidth`, catalog wrapper); `/Users/yayauheny/projects/bidplace/packages/design-tokens/src/modern.ts` (missing catalog breakpoint roles).
- **Root cause:** the catalog reuses the desktop-rail threshold instead of its independently confirmed 900px density breakpoint.
- **Required change:** use proposed catalog breakpoint tokens `catalogThreeColumn: 900` and `catalogFourColumn: 1440`; render 2 columns below 900, 3 columns from 900 through 1439, and 4 columns at 1440+. Keep the shell rail transition independent.
- **Do not do:** shrink card type or image height to imitate density, change the shell breakpoint merely to fix the grid, or hide card metadata below a fixed-height crop.
- **Acceptance criteria:** bounding boxes prove exactly 2/3/4 equal-width columns at 390/1024/1440 respectively; at 1024 the first row exposes image, author, title, price with BYN and full status/deadline inside the initial 900px viewport.
- **Tests/evidence:** parameterized layout test for 899, 900, 1439 and 1440 widths; `catalog-1024.png` regenerated with three cards across; bounding-box assertions rather than card-count alone.

### [P1] F-CAT-02 — Mobile card footer breaks price and status hierarchy

- **Evidence:** In `catalog-390.png`, `75 BYN` and `120 BYN` wrap between amount and currency, while `Торги идут · 2 авг.` and `Завершено · 2 авг.` split into separate fragments aligned against the price. A separate `Размещено 2 авг. 2026 г.` line consumes another row immediately above. The result obscures the required scan order image → author → title → description → price → status.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/AuctionCard.tsx` (`publishedLabel`, price/status footer View, numeric and caption text); `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/products/product-list-screen.tsx` (compact two-column context).
- **Root cause:** the same horizontal `space-between` footer is used at every card width, with no no-wrap contract for currency/status; redundant publication metadata competes with auction truth in the narrow card.
- **Required change:** in the two-column compact card, remove the publication-date row, keep description to one line, and stack one-line price above one-line status/deadline with left alignment and `x1` gap. Preserve the horizontal footer only where the measured card width fits both values without truncation. Use `numberOfLines={1}` for each atomic value after giving it adequate width.
- **Do not do:** reduce the 14px price or 11px status font, abbreviate BYN, clip the footer, or remove the description that the confirmed hierarchy requires.
- **Acceptance criteria:** at 390×844 each first-row card shows intact `75 BYN`/`120 BYN` and a readable status/deadline without overlap or interleaving; title stays at two lines maximum and description at one; publication date is absent from the catalog card.
- **Tests/evidence:** `catalog-390.png` with seeded LIVE and ENDED cards; component tests for long title, four-digit price and each listing status; bounding-box assertion that price and status do not intersect and each currency is on the amount line.

### [P1] F-CAT-03 — Loading skeleton uses a different grid than loaded cards

- **Evidence:** On `/` at every target viewport, `CatalogLoading` gives each skeleton `flex: 1, minWidth: 220` inside a wrapping row, while loaded cards use calculated 2/3/4 percentage widths. At 390 the 220px minimum forces a one-column loading state before a two-column result; at 1024 it can create four narrow skeletons before the target three-column result. The screenshot scenario waits for loaded products and never captures loading geometry.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/products/product-list-screen.tsx` (`CatalogLoading`, `columns`, loaded catalog map); `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/Skeleton.tsx`.
- **Root cause:** loading and loaded layouts have separate grid implementations and do not share the breakpoint/card-width calculation.
- **Required change:** calculate catalog columns once and pass the same percentage width/wrapper spacing to skeleton and loaded cards; mirror the 4:5 media plus author/title/description/footer skeleton rows so each card reserves the final height.
- **Do not do:** add a fixed loading container height, show fewer columns only while loading, or fade the layout jump behind a longer animation.
- **Acceptance criteria:** loading, success and failed-image states have identical column count, card x-position and 4:5 media bounds at 390, 1024 and 1440; transition to loaded content moves no card edge by more than 1px.
- **Tests/evidence:** deterministic loading-state screenshots at all three viewports and bounding-box comparisons against loaded cards; unit test for the shared column helper at boundary widths.

### [P1] F-PDP-02 — Product hero is fixed at 300px on every viewport

- **Evidence:** `product-1440.png` shows a 300×375 image occupying barely half of its left column, leaving a large empty band before the title/auction column; the object is less dominant than the panel. The same 300px literal appears at 1024 and 390 because `ProductGallery` owns a fixed width. The primary local product reference instead establishes an image-led hero, while the confirmed product direction requires large object imagery without decorative noise.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/ProductGallery.tsx` (`GalleryImage` and failed-image width `300`); `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/products/product-screen.tsx` (gallery column).
- **Root cause:** gallery media has no responsive size contract and cannot react to the available detail column.
- **Required change:** keep the current 300px mobile image, but at the independent 900px detail breakpoint use proposed token `layout.productHeroWide: 440` (Founder approval required) for both loaded and failed images; center a single image within its column and preserve horizontal overflow/partial-next affordance only when multiple images exist.
- **Do not do:** stretch beyond the source ratio, use `cover` when it crops the object, introduce a screen-local percentage that differs for fallback, or enlarge the image by shrinking auction type.
- **Acceptance criteria:** at 1440 and 1024 the hero is 440×550 with identical loaded/fallback bounds, remains fully visible and balances the adjacent auction column; at 390 it remains 300×375 and never overflows the 20px gutters.
- **Tests/evidence:** gallery component tests for 0/1/multiple/failed images; product screenshots at all three viewports with exact media bounding boxes.

### [P1] F-PDP-03 — Linear detail sections still look like stacked admin panels

- **Evidence:** `product-1440.png` shows `О предмете` inside a large rounded bordered rectangle immediately below the hero; code wraps `О предмете`, `История предмета` and `История ставок` in the same `SurfacePanel`. Sections are technically linear and tab-free, but repeated panel chrome makes editorial reading feel like an admin/settings form rather than a calm object story.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/products/product-screen.tsx` (`SurfacePanel`, `itemStory`, `itemHistory`, `bidHistory`); `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/Separator.tsx`.
- **Root cause:** a generic bordered container is used both for transactional auction truth and ordinary narrative/detail content, erasing the intended distinction.
- **Required change:** keep `AuctionPanel` as the only bordered top-block panel. Replace lower `SurfacePanel` wrappers with plain `DetailSection` composition: metadata eyebrow, 12–16px title/content gap, 32–40px section gap and one neutral divider between sections. Preserve current linear order and all existing data/error/retry behavior.
- **Do not do:** reintroduce tabs, add alternating backgrounds, turn each fact into a chip/card, or remove bid-history loading/error/empty states.
- **Acceptance criteria:** lower sections have no outer border, radius or separate surface; hierarchy comes from section typography, whitespace and dividers; long story text stays within the 680px reading measure on desktop while technical value rows remain scannable.
- **Tests/evidence:** full-page product screenshots for long story, maximum detail items, empty bid history and failed bid-history load at 1440/1024/390; visual assertion that only the auction block retains panel chrome.

### [P1] F-AUTHOR-01 — Author page underplays the person and oversizes each work

- **Evidence:** On `/seller/[slug]`, code renders the author as a 64×64 photo beside a generic page header, then maps `AuctionCard` directly into a one-column 960px container. At desktop that makes each 4:5 work image up to roughly 920×1150, while the creator identity stays thumbnail-sized. No author-page screenshot exists. The approved local author reference supports a stronger person/works hierarchy but cannot add new profile media fields.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/sellers/public-seller-screen.tsx` (`PublicSellerScreen` header and product list); `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/AuctionCard.tsx`.
- **Root cause:** a narrow list page reuses the catalog card without the catalog grid, and the only existing author image has no public-profile size role or fallback.
- **Required change:** keep existing profile data only: render the profile photo at proposed `size.authorAvatar: 120` (Founder approval required) with name, type/country and short description; add failed-image fallback; render works through the same responsive grid primitive as catalog, capped at three columns in the author content width, with a clear `Работы` section label and real count derived from the returned array.
- **Do not do:** invent a cover-image API, collaborators, followers, metrics or recommendations; stretch a 1:1 profile photo into a 16:9 hero; or keep a 920px-wide `AuctionCard` to simulate importance.
- **Acceptance criteria:** author identity is visually stronger than metadata but works remain the main color/image field; desktop shows 2–3 balanced work columns rather than one giant card; mobile uses the corrected two-column card pattern; missing/broken profile photo has stable 120×120 fallback geometry.
- **Tests/evidence:** new `/seller/[slug]` screenshots at 1440×900, 1024×900 and 390×844 for many works, zero works and failed profile photo; bounding-box assertions for avatar and work columns.

### [P1] F-ACT-01 — Purchases rows omit price and deadline already present in data

- **Evidence:** `/me/activity` renders title, the redundant line `Открыть предмет`, a status pill and optional order button. The response contract already contains full `listing` data, including current price and deadline, but neither appears. Long states such as `Ожидаем контакта продавца` share the first horizontal row with the title and can compress it at 390px. Existing E2E covers status/order privacy but has no visual screenshot.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/activity/activity-screen.tsx` (`ActivityRow`); `/Users/yayauheny/projects/bidplace/packages/contracts/src/activity.ts` (`activityResponseSchema`); existing formatter utilities in `/Users/yayauheny/projects/bidplace/apps/mobile/src/lib/formatters.ts`.
- **Root cause:** the row was built as a route/status stub rather than the confirmed compact-auction hierarchy, leaving available auction truth unused.
- **Required change:** keep the same API and route; replace `Открыть предмет` with a compact second/third line using `listing.currentPrice`, absolute deadline and existing status. At 390 stack status below the title and keep price/deadline as an atomic technical row; at 1024/1440 align price/deadline to the right. Keep the optional order action separate below the row.
- **Do not do:** add thumbnail/API data not present in the contract, add search/filter/pagination, reduce deadline type below the caption token, or use status color without text.
- **Acceptance criteria:** every activity row exposes item title, current/final price, deadline, one plain-language status and optional order action; long Russian titles/states neither overlap nor truncate auction truth at 390px; multiple rows remain divider-led and compact.
- **Tests/evidence:** screenshots of empty, loading, error, LEADING, OUTBID, WON/order and LOST states at all viewports; component tests for long title/status and four-digit price; retain privacy E2E.

### [P1] F-FORM-01 — Seller flows expose enums and ISO timestamps as user input

- **Evidence:** `/profile` asks users to type `TELEGRAM` and `BUYER_CONTACTS_SELLER`; product/listing screens display `APPROVED`, `CHANGES_REQUESTED` and other raw statuses; listing draft asks for `2026-07-20T12:00:00.000Z` strings. Product/category selection is a stack of 56px buttons with raw status appended. These are implementation values, not calm consumer-facing controls.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/sellers/seller-profile-screen.tsx` (handoff fields/read-only summary); `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/sellers/product-draft-screen.tsx` (raw product status, category buttons); `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/sellers/listing-draft-screen.tsx` (product selection, status labels, date fields).
- **Root cause:** backend enum/date contracts are bound directly to generic `TextField` and full-size button primitives without a presentation adapter.
- **Required change:** keep payload values unchanged behind shared controls: labelled single-select options `Telegram / Телефон / Instagram`, `Покупатель связывается / Продавец связывается`; localized status labels via one shared map; category single-select chips/rows; accessible date-and-time fields that serialize to ISO internally and show local date/time plus timezone to users. Product choice becomes a compact selectable row with title, localized status and separate edit link.
- **Do not do:** change enum/API values, add a new seller workflow, hide timezone, accept free-form dates and validate only after submit, or shorten 56px buttons into inaccessible text-only targets.
- **Acceptance criteria:** no raw enum constant or ISO placeholder is visible in seller UI; all choices are keyboard/screen-reader operable with selected state; date order/timezone is explicit; existing create/update/listing payloads are unchanged.
- **Tests/evidence:** seller-flow screenshots at 1440/1024/390 for default, selected, disabled, error and long-label states; unit tests for label↔enum and local-date↔ISO adapters; existing auction-creation E2E remains green.

### [P1] F-MEDIA-01 — Seller media editors use unstable, object-hostile geometry

- **Evidence:** In `/profile`, the 1:1 photo preview is `width: 100%` inside a 760px form, so desktop can render a roughly 720×720 image before the fields. In product draft, every authored-object image is `width: 100%, height: 180, contentFit: cover`, cropping it into a wide strip; three separate text actions appear below each image. Loading uses only the generic button label `Загрузка`, not the available selected-image count.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/sellers/seller-profile-screen.tsx` (profile photo section); `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/sellers/product-draft-screen.tsx` (image list, upload/reorder/delete controls); `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/ImagePlaceholder.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/Button.tsx`.
- **Root cause:** form media previews have no editor-specific size/ratio roles and reuse full container width or a fixed landscape crop unrelated to product presentation.
- **Required change:** after founder approval add `size.profileEditorPreview: 200` and reuse `ratio.productPortrait: 4/5`; show profile preview/fallback at 200×200. Render product images as compact 160×200 `contain` thumbnails/rows with filename-position context and 44px labelled move/delete controls; preserve order and confirmation behavior. During upload show `Загружаем изображения: N` using selected asset count without invented byte percentage.
- **Do not do:** crop authored objects with `cover`, keep 720px profile previews, introduce drag-only reordering, or hide destructive delete behind an unlabeled icon.
- **Acceptance criteria:** profile media no longer dominates desktop form; product preview and fallback share 4:5 geometry without crop; move/delete are reachable by touch/keyboard and expose position; upload label includes the truthful selected count and geometry does not jump.
- **Tests/evidence:** screenshots for empty/selected/broken/uploading/many-image states at all viewports; component tests for first/middle/last reorder disabled states and delete confirmation.

### [P1] F-ADM-01 — Desktop moderation is a long narrow action queue

- **Evidence:** Behind `dialog-1440.png`, moderation content is centered in a 760px column while the desktop canvas leaves substantial unused width. Sellers and products are sequential `FormSection`s; each `ModerationCard` puts title, muted status, metadata and 56px approve/destructive actions in one vertical stack. The same structure is appropriate at 390 but makes desktop scanning and seller↔item comparison slow.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/admin/admin-moderation-screen.tsx` (`AdminShell`, seller/product `FormSection`s, `ModerationCard`, action placement).
- **Root cause:** the mobile form composition was reused unchanged at desktop instead of applying a moderation-specific responsive queue layout.
- **Required change:** keep one route and the existing actions, but at 1025px+ widen moderation to 1180px and place seller and product queues in two equal columns; keep order cancellation/replacement as a full-width section below. In each row place title + localized status in one header, evidence text/media below, then approve and destructive actions in a wrapping content-width action row with at least 12px gap; keep destructive confirmation unchanged.
- **Do not do:** build a generic SaaS dashboard, introduce tables that force horizontal scrolling, put dangerous icons without labels, or expose additional admin data/API fields.
- **Acceptance criteria:** at 1440 both moderation queues are visible side by side with no content overlap and a clear title/status/action hierarchy; at 1024/390 they collapse to one column; long names/reasons wrap without moving destructive action into another card.
- **Tests/evidence:** `/admin` screenshots at 1440/1024/390 with long seller/product names, blocking listing, last reason, missing image and all statuses; retain destructive dialog screenshots and action E2E.

### [P1] F-ADM-02 — Admin and order UI leaks internal English domain values

- **Evidence:** `/admin` displays `Order`, `active Order`, `replacement Bid`, `Listing` and the selected reason `BUYER_DECLINED`; the three reason buttons show raw enum constants. `/order/[publicId]` similarly prints raw `order.status`, contact type and `handoffInitiator`. The moderation dialog screenshot visibly includes technical action context behind otherwise clear Russian copy.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/admin/admin-moderation-screen.tsx` (`confirmationText`, cancel/replacement section, reason buttons); `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/orders/order-screen.tsx` (`Details` values and action copy).
- **Root cause:** only seller/product moderation statuses have a presentation map; order, reason, contact and handoff enums are rendered directly.
- **Required change:** add shared localized label maps for existing order status, cancellation reason, contact type and handoff initiator values; use `заказ`, `ставка` and `торги` in visible copy while preserving identifiers only where an administrator genuinely needs to paste/find them. Keep exact enum payloads behind the controls.
- **Do not do:** rename API/domain enums, hide the order public ID, invent new cancellation reasons, or translate values inconsistently in admin versus buyer/seller order screens.
- **Acceptance criteria:** no raw enum or mixed `Order/Bid/Listing` wording appears in visible UI; every admin choice remains unambiguous and maps one-to-one to the existing payload; confirmation copy states the consequence in Russian.
- **Tests/evidence:** screenshot matrix for admin cancel/replacement and buyer/seller/admin order projections; unit tests for every enum label mapping; existing security/privacy E2E remains unchanged.

### [P1] F-NAV-01 — Approved-seller mobile navigation has no width contract

- **Evidence:** At 390px an approved seller receives four destinations: `Каталог`, `Покупки`, `Кабинет продавца`, `Добавить предмет`. Each mobile `NavigationItem` lays icon + full label in a horizontal row with 16px horizontal padding, no `flex`, `minWidth: 0`, line limit or compact-label rule. The only 390 screenshot uses an admin with two items, so overflow/wrapping is invisible to the current suite.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/layout/AppHeader.tsx` (`items`, mobile `NavigationItem`, nav row); `/Users/yayauheny/projects/bidplace/apps/mobile/e2e/01-wave2-layout-screenshots.spec.ts` (admin-only screenshot identity).
- **Root cause:** navigation geometry was validated with the smallest role set, while the maximum role set has a materially larger intrinsic width.
- **Required change:** for mobile, give each destination equal `flex: 1, minWidth: 0`, place icon above label, center text and permit at most two lines without changing the full accessible name. Keep one header bottom divider and the 44px minimum target; do not alter route availability. At 1025px+ retain icon-only rail/tooltips.
- **Do not do:** horizontally scroll global navigation, reduce labels below caption size, hide seller destinations behind the account menu, or abbreviate accessible names.
- **Acceptance criteria:** guest, buyer, pending seller, approved seller and admin navigation fit within 390px with no horizontal overflow, clipped text or overlapping targets; selected state and full accessible labels remain correct.
- **Tests/evidence:** role-parameterized navigation screenshots at 390×844 and 1024×900 plus rail tests at 1025/1440; bounding-box assertions for every destination and a no-horizontal-scroll assertion.

### [P1] F-AUTH-01 — Auth forms are not keyboard-safe and registration copy is misleading

- **Evidence:** `/login` and `/register` use a centered `SafeAreaView` with no `ScrollView` or keyboard avoidance. At 390×844 the four-field registration card may fit before keyboard, but focusing lower inputs reduces the visual viewport and can hide error, submit and login link. Registration description says an account opens `seller- и admin-сценарии`, although ordinary registration does not grant admin access. No auth screenshot exists in the current suite.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/app/(auth)/login.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/app/(auth)/register.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/auth/auth-form.tsx` (`AuthCard`, registration description).
- **Root cause:** the auth composition assumes a full-height viewport and reuses internal role terminology in consumer-facing copy.
- **Required change:** wrap auth content in a keyboard-aware scroll container with 20px mobile gutter, centered alignment only when content fits and a 540px maximum; ensure focused input, its error and primary button can scroll above the keyboard. Replace description with `Создайте аккаунт, чтобы участвовать в торгах и при желании подать заявку продавца.`
- **Do not do:** shrink form type/gaps, make the whole form fixed-height, imply admin access, or add product imagery/new onboarding steps.
- **Acceptance criteria:** every field, error, primary action and auth-switch link is reachable at 390×844 with software keyboard and 200% zoom; desktop remains a low-density single task; no copy implies self-service admin access.
- **Tests/evidence:** login/register screenshots at all viewports plus 390 keyboard-focused first/last field, validation errors, loading and server error; keyboard-only submission and focus-order tests.

### [P1] F-ACC-04 — Reduced-motion preference is not implemented

- **Evidence:** `modernTokens.motion` is consumed by `expo-image` transitions in catalog/gallery, while `MotionPressable` applies pressed opacity unconditionally; `global.css` has no `prefers-reduced-motion` rule or app-level preference adapter. `catalog-1440.png` and `product-1440.png` visibly capture media with lower opacity than cached 1024/390 screenshots, demonstrating that motion timing already affects visual evidence.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/MotionPressable.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/AuctionCard.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/ProductGallery.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/global.css`; `/Users/yayauheny/projects/bidplace/packages/design-tokens/src/modern.ts`.
- **Root cause:** durations are centralized, but preference detection and a reduced-motion branch were never added to shared primitives/media.
- **Required change:** add one cross-platform reduced-motion hook/provider; when enabled, set image transition to 0 and remove future translate/scale while keeping immediate opacity/state feedback. On web honor `prefers-reduced-motion: reduce`; on native honor the platform accessibility setting.
- **Do not do:** disable business actions, add screen-local media flags, rely only on CSS while native keeps motion, or lengthen transitions to make screenshots easier.
- **Acceptance criteria:** reduced-motion mode has no decorative transform/slide/image fade; pressed/selected/loading state remains clear; business requests fire immediately in both modes.
- **Tests/evidence:** unit tests for the preference adapter; Playwright `reducedMotion: reduce` screenshot matrix; native accessibility-setting smoke test; screenshot pixel check that loaded images are fully opaque.

### [P1] F-ACC-05 — Global destination links are incorrectly exposed as tabs

- **Evidence:** At 1024/390, `AppHeader` gives the navigation container `accessibilityRole="tablist"`, but every child is a route `link`, not a tab controlling an associated tabpanel. Screen readers therefore receive incompatible interaction semantics and may expect tab keyboard behavior that is not implemented.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/layout/AppHeader.tsx` (mobile navigation container and `NavigationItem`).
- **Root cause:** a visual navigation row was labelled by appearance rather than by route semantics.
- **Required change:** expose the row as a labelled navigation landmark/list and keep children as links with current-page/selected state supported by the web adapter; retain logical DOM order across roles and viewports.
- **Do not do:** convert routes into tabs, add arrow-key tab behavior, remove accessible current state, or rely on icon shape alone.
- **Acceptance criteria:** accessibility tree reports one global navigation landmark containing links; no `tablist`/`tab` role remains; current destination is announced without changing routing behavior.
- **Tests/evidence:** Playwright accessibility snapshot at 390/1024/1440 for guest/buyer/seller/admin and keyboard traversal assertions.

**P2**

### [P2] F-BTN-01 — Loading changes content-width button geometry

- **Evidence:** On login/register, product/listing drafts, order actions and moderation actions at every viewport, `ButtonContent` replaces the original label with the fixed text `Загрузка`. Because `ButtonBase` defaults to content width, any label longer or shorter than that word changes the button width when loading starts; `MotionPressable` simultaneously applies disabled opacity. Runtime before/after screenshots are unavailable.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/Button.tsx` (`ButtonContent`, `ButtonBase`); `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/MotionPressable.tsx` (`disabled` opacity).
- **Root cause:** loading content replaces the layout-defining label instead of reserving the idle button geometry.
- **Required change:** keep the original label in layout while loading and layer the spinner plus loading copy within the reserved bounds; keep `accessibilityLabel` action-specific and expose `accessibilityState.busy=true`. Use the proposed shared disabled-opacity token rather than another button-local value.
- **Do not do:** assign fixed widths per screen, abbreviate long Russian action labels, or hide overflow to mask the width change.
- **Acceptance criteria:** switching any content-width button between idle and loading changes its outer width and height by no more than 1px; the spinner and loading label remain centered, the control cannot be re-triggered, and assistive technology announces the original action as busy.
- **Tests/evidence:** component snapshot/layout test with short and long Russian labels in idle/loading states; paired screenshots from login, a seller form and admin moderation at 390×844 and 1024×900.

### [P2] F-TOK-02 — Repeated state and media constants can drift

- **Evidence:** Disabled opacity `0.5` is hardcoded independently in `MotionPressable` and `TextField`. Product portrait ratio `4/5` is repeated in `AuctionCard`, `ProductGallery`, `ImagePlaceholder` and the catalog skeleton. The current output is internally consistent, but the design-system contract does not enforce that consistency.
- **Affected code:** `/Users/yayauheny/projects/bidplace/packages/design-tokens/src/modern.ts`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/MotionPressable.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/TextField.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/AuctionCard.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/ProductGallery.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/ImagePlaceholder.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/products/product-list-screen.tsx` (`CatalogLoading`).
- **Root cause:** `modernTokens` has color/space/radius/size roles but no opacity or media-ratio group, so shared visual invariants remain literals.
- **Required change:** after founder approval, add `opacity.disabled: 0.5` and `ratio.productPortrait: 4/5` to the active token map; replace only the equivalent literals in shared controls, product media and loading placeholders.
- **Do not do:** introduce a generic configuration layer, alter the current `4/5` crop as part of tokenization, or combine unrelated screen dimensions into the media token.
- **Acceptance criteria:** no disabled-opacity or product-portrait-ratio literal remains in the affected components; loaded, failed and loading media occupy identical geometry; disabled controls remain visually unchanged from the current baseline.
- **Tests/evidence:** token/unit tests for the new values; screenshot diff of catalog loaded/loading/error-image states at 1440×900, 1024×900 and 390×844 with zero geometry shift.

### [P2] F-TOK-03 — Two public token systems expose conflicting semantics

- **Evidence:** `packages/design-tokens/src/index.ts` exports both legacy roles (`colors.background '#F7F6F3'`, `colors.primary '#2457E6'`, `radius.control 8`) and `modernTokens` (`canvas '#FFFFFF'`, `accent '#D94A24'`, `radius.control 14`). Current application imports use `modernTokens`, so no present mixed rendering was found, but any new direct import can silently reintroduce the retired background, blue primary or smaller radii.
- **Affected code:** `/Users/yayauheny/projects/bidplace/packages/design-tokens/src/index.ts` (public exports); `/Users/yayauheny/projects/bidplace/packages/design-tokens/src/modern.ts` (`modernTokens`).
- **Root cause:** the migration added the modern map without narrowing the package public surface or naming the previous exports as legacy.
- **Required change:** make `modernTokens` the only default public design-system contract; either move old exports to an explicit legacy subpath during migration or remove them after a repository-wide import check. Keep `#2457E6` only if approved for the new semantic focus role, not as a primary-action color.
- **Do not do:** delete exported values before checking package consumers, alias conflicting names to different meanings silently, or migrate components back to `lightTheme`.
- **Acceptance criteria:** production app code has one documented token entry point; lint/type boundaries prevent new imports from the legacy surface; no visual value changes solely because of export cleanup.
- **Tests/evidence:** repository import check, package typecheck/build, and a design-token unit test confirming the canonical white canvas, ink primary action and active semantic roles.

### [P2] F-DLG-01 — Dialog stacking is not bound to the modal token

- **Evidence:** `dialog-1440.png`, `dialog-1024.png` and `dialog-390.png` show the current moderation dialog correctly centered, width-limited and above ordinary content. However, `AppDialog` gives neither overlay nor content `zIndex: modernTokens.layer.modal`; the shared popover host explicitly uses 20. The screenshots cover only a dialog without another open popover, so modal-over-popover ordering is unverified.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/AppDialog.tsx` (`Dialog.Overlay`, centering wrapper, `Dialog.Content`); `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/layout/OverlayHost.tsx` (`layer.popover`).
- **Root cause:** the token map defines `layer.modal: 30`, but the dialog adapter relies on unspecified portal/default stacking instead of applying the shared layer contract.
- **Required change:** make the dialog portal wrapper viewport-fixed and explicitly assign `layer.modal: 30` to the overlay/content stack while keeping the existing 520px maximum, 20px mobile gutter, centered composition and destructive-before-cancel hierarchy.
- **Do not do:** add screen-local z-index values, increase every overlay to an arbitrary large number, or change the confirmed centered dialog into a new mobile sheet.
- **Acceptance criteria:** an open dialog always covers and blocks an already-open account dropdown or tooltip; the dialog remains centered at all three viewports, its backdrop covers the full viewport during scroll, and cancel/destructive controls remain reachable.
- **Tests/evidence:** component stacking test plus Playwright scenario that opens a popover then a dialog and asserts modal z-index 30 > popover 20; screenshots at 1440×900, 1024×900 and 390×844.

### [P2] F-STATE-01 — Shared loading state is duplicate text without progress semantics

- **Evidence:** `PageState loading` renders the supplied title (usually already `Загружаем …`) and then a second literal `Загружаем…`; it has no activity indicator, `progressbar` role or live region. Admin, public author, activity and profile routes use this pattern. Catalog uses a separate skeleton, and several seller/order routes bypass `PageState` with ad-hoc text, so loading/error/empty presentation is inconsistent and absent from the current screenshot suite.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/PageState.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/Skeleton.tsx`; loading/error branches in admin, public seller, activity, seller profile, product/listing draft and order screens.
- **Root cause:** `PageState` is a generic centered container but not a complete state contract; screens supply state wording independently and only the catalog has geometry-preserving loading.
- **Required change:** make loading one announced state: spinner or stable skeleton with `accessibilityRole="progressbar"`, one descriptive message and `accessibilityLiveRegion="polite"`; error keeps plain-language message + content-width retry; empty keeps title + concrete next step only when a real route/action exists. Use geometry-preserving skeletons for catalog/product media, and shared PageState for non-geometric list/form waits.
- **Do not do:** add decorative illustrations/gradients, invent CTAs for unavailable flows, replace useful error copy with codes, or use indefinite shimmer that ignores reduced motion.
- **Acceptance criteria:** no screen shows duplicate loading copy; all asynchronous page loads expose progress semantics; error always offers retry when retry is valid; empty states neither impersonate errors nor introduce unsupported actions.
- **Tests/evidence:** component tests for loading/empty/error/retry semantics; route screenshots for each state at 1440/1024/390; reduced-motion check for any animated indicator.

### [P2] F-ACC-06 — Compact links miss hit targets and duplicate icon labels

- **Evidence:** compact `BrandLogo` renders a 32×32 image inside a Pressable with no 44px minimum. The product author `MotionPressable` is only the 12/16 metadata line. `IconButton` labels both the parent pressable and its child `AppIcon`; `ImagePlaceholder` similarly labels both container and icon, which can cause duplicate announcements. Other shared buttons correctly meet 44px.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/layout/BrandLogo.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/products/product-screen.tsx` (author link); `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/Button.tsx` (`IconButton`); `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/AppIcon.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/modern-ui/ImagePlaceholder.tsx`.
- **Root cause:** visual asset/text bounds define the interactive area, and icon accessibility is assigned at both composite and child levels.
- **Required change:** give compact logo and author links a minimum 44×44 interaction box using transparent padding/alignment; in composite controls keep one accessible label on the parent and mark child icon decorative. Expose an icon label only when `AppIcon` is intentionally standalone.
- **Do not do:** enlarge the visible logo to 44px, remove link labels, add invisible overlapping pressables, or hide standalone informative icons from assistive technology.
- **Acceptance criteria:** every interactive target is at least 44×44; accessibility tree announces each icon button/placeholder once; visible alignment remains unchanged.
- **Tests/evidence:** component hit-box tests, accessibility snapshots and 390×844 touch-target overlay screenshot.

### [P2] F-VR-01 — Screenshot suite can pass while major layout regressions remain

- **Evidence:** the current E2E counts three seeded cards but cannot prove the empty fourth 1440 column; it asserts only mobile card proximity, not price/status/currency visibility or 1024 column count. Product screenshots use an admin, so eligible-buyer input/CTA and mobile dock are absent. Loading, empty, error, failed image, focus, account-open, long content and role-max navigation are not captured. The 1440 images are visibly mid-fade because the test waits for `naturalWidth` but not transition completion. Fresh regeneration on 2026-08-02 failed before Playwright because pnpm signature verification attempted a registry fetch.
- **Affected code:** `/Users/yayauheny/projects/bidplace/apps/mobile/e2e/01-wave2-layout-screenshots.spec.ts`; screenshot artifact workflow around `/private/tmp/bidplace-wave2-screenshots/`; relevant layout E2E files.
- **Root cause:** the suite treats presence/count as a proxy for composition, uses one role identity and ephemeral local outputs, and has no deterministic motion/toolchain setup.
- **Required change:** parameterize viewport × role × route/state; add bounding-box/visibility assertions for required first-viewport elements and exact column widths; wait for fully opaque images or run reduced motion; use eligible buyer for product CTA plus separate admin state; persist named artifacts in CI and pin an offline-reproducible project package-manager invocation.
- **Do not do:** add more screenshots without assertions, increase arbitrary waits, accept faded images as baseline, or expand seed/product scope solely to reach 10–15 items.
- **Acceptance criteria:** the matrix detects wrong 1024 columns, wrapped BYN/status, hidden product auction truth, overlay occlusion, seller-nav overflow and loading geometry; all artifacts identify commit/viewport/role/state and reproduce without external registry access.
- **Tests/evidence:** completed matrix in section 7, CI artifact manifest and a deliberate regression test for each named failure class.

## 5. Screen-by-screen implementation specification

| Screen / route | Keep | Remove | Change | Components/files | Acceptance screenshot |
|---|---|---|---|---|---|
| `/` | White canvas; no large `Каталог` heading/count; real 4:5 images; left-aligned grid after rail; author/title/one-line story/price/status | Catalog publication-date row; any duplicate mobile header divider | Decouple 900/1440 grid breakpoints; compact footer stacks price then status; loading uses identical grid/media geometry | `product-list-screen.tsx`, `AuctionCard.tsx`, `Skeleton.tsx`, `ImagePlaceholder.tsx`, catalog breakpoint/media tokens | `catalog-1440.png`, `catalog-1024.png`, `catalog-390.png`, plus loading and failed-image variants |
| `/product/[publicId]` | White canvas; 4:5 gallery; author/title/short story; explicit auction status/current/minimum/deadline; linear section order; first-bid confirmation | Publication caption from top block; bordered panels around ordinary story/history sections; oversized full bid form in mobile dock | Use independent 900px two-column breakpoint; 440px wide hero; compact 56–64px mobile action row; amount input inside auction panel; plain linear detail sections | `product-screen.tsx`, `ProductGallery.tsx`, `AuctionPanel.tsx`, `BottomActionBar.tsx`, `AppDialog.tsx` | Buyer and admin `product-1440.png`, `product-1024.png`, `product-390.png`; long-story and keyboard-focused variants |
| `/seller/[slug]` | Existing public identity fields and authored works; no private contact | 64px-only identity; one giant full-width card per work | 120px photo/fallback, stronger profile hierarchy, shared responsive works grid capped at three columns | `public-seller-screen.tsx`, shared product grid, `AuctionCard.tsx`, `ImagePlaceholder.tsx` | Author page at 1440/1024/390 with many/zero works and failed photo |
| `/me/activity` | Divider-led compact list, plain-language status, optional order route, privacy behavior | Redundant `Открыть предмет` subline | Add existing current/final price and deadline; responsive long-status composition | `activity-screen.tsx`, formatter helpers | Activity at 1440/1024/390 for empty/error/LEADING/OUTBID/WON/LOST |
| Seller profile (`/profile`) | Existing application fields, moderation lock, content-width save action | Raw enum copy; 100%-width profile preview | Localized shared selectors, 200px media preview/fallback, explicit disabled reason and stable loading | `seller-profile-screen.tsx`, `TextField.tsx`, new shared single-select adapter | New/pending/changes-requested/approved states at 1440/1024/390 |
| Product draft | Staged existing fields, incomplete draft save, moderation submit, confirmed image delete | Raw statuses; 720×180 cover-cropped images; three stacked text actions per image | Localized statuses/category selection; compact 4:5 media rows; truthful upload count; preserved action hierarchy | `product-draft-screen.tsx`, `FormSection.tsx`, `TextField.tsx`, media/action primitives | Empty/filled/locked/uploading/error/many-image states at 1440/1024/390 |
| Listing draft | Existing approved-product guard, schedule rules and two-step create/schedule behavior | Raw status in product button; ISO timestamp entry | Compact selectable product rows, localized status, date/time adapter with timezone, unchanged API serialization | `listing-draft-screen.tsx`, shared select/date controls | Empty/invalid/ready/created/scheduled states at 1440/1024/390 |
| `/admin` | Existing queues, blocking-listing explanations, required-reason dialogs, privacy constraints and action rules | Raw English domain/enums; narrow desktop-only column; passive author rendered as heavy button | Two-column desktop moderation queues, clear row header/status/action anatomy, localized order/reason labels; preserve dialogs | `admin-moderation-screen.tsx`, `FormSection.tsx`, `AppDialog.tsx`, status/enum formatters | Admin queue and each destructive dialog at 1440/1024/390, including long/blocking/empty/error states |
| Login/register | Auth routes without global navigation; one task; labelled fields; content-width primary and text-link switch | Registration promise of admin access; non-scrollable keyboard-obscured composition | Keyboard-aware scroll, centered 540px max only when fitting, truthful buyer/seller-application copy, deterministic loading/error geometry | `(auth)/login.tsx`, `(auth)/register.tsx`, `auth-form.tsx`, `TextField.tsx`, `Button.tsx` | Login/register at 1440/1024/390 plus keyboard, 200% zoom, validation, loading and server-error states |

## 6. Implementation waves

### Wave A — Structural responsive fixes

| Order | Task | Exact files/components | Dependencies | Acceptance criteria | Required checks |
|---|---|---|---|---|---|
| 1 | Centralize shell/catalog/product breakpoints and layout dimensions | `packages/design-tokens/src/modern.ts`; `AppShell.tsx`; `AppHeader.tsx`; `product-list-screen.tsx`; `product-screen.tsx` | Founder decisions on new product-detail size tokens | One 1025 shell threshold; catalog 900/1440 independent; product detail wide from 900; no route/role changes | Design-token unit tests; mobile typecheck/lint; boundary tests at 899/900/1024/1025/1439/1440 |
| 2 | Fix overlay geometry and modal ordering | `OverlayHost.tsx`/`OverlayPortal`; `AccountMenu.tsx`; `AppDialog.tsx` | Layout/layer tokens; no screen changes | Account menu portals at all web widths with 8px collision inset; modal 30 always above popover 20; Escape focus return | `navigation.spec.ts`; overlay/dialog component tests; open-menu/open-dialog screenshots at all viewports |
| 3 | Make catalog loaded/loading/fallback grids identical | `product-list-screen.tsx` (`CatalogLoading`, shared column helper); `AuctionCard.tsx`; `Skeleton.tsx`; `ImagePlaceholder.tsx` | Breakpoint and 4:5 ratio tokens | Exact 2/3/4 columns; same card edges and media bounds in loading/success/failure | Unit boundary tests; bounding-box E2E; catalog screenshots at all viewports/states |
| 4 | Recompose product top block and mobile action geometry | `product-screen.tsx`; `ProductGallery.tsx`; `AuctionPanel.tsx`; `BottomActionBar.tsx` | Product breakpoint/hero decision; button remains content width | 1024 becomes two-column; 390 dock is one 56–64px row + safe area; amount input stays visible/scrollable in panel; auction truth meets F-PDP-01 | Buyer/admin product E2E; keyboard viewport test; first-viewport bounding boxes; screenshots at all widths |
| 5 | Stabilize maximum-role mobile nav and auth viewport containers | `AppHeader.tsx`; `(auth)/login.tsx`; `(auth)/register.tsx` | Shell breakpoint unchanged | Four seller destinations fit 390 without overflow; auth scrolls above keyboard/at 200% zoom; header keeps one divider | Role matrix navigation E2E; auth keyboard/zoom screenshots; no-horizontal-scroll assertion |

### Wave B — Shared component and visual-system fixes

| Order | Task | Exact files/components | Dependencies | Acceptance criteria | Required checks |
|---|---|---|---|---|---|
| 1 | Approve and apply semantic contrast/focus tokens; isolate legacy exports | `packages/design-tokens/src/modern.ts`, `index.ts`; `AppText.tsx`; theme provider | Founder palette decision | Accent text/danger labels pass 4.5:1; focus passes 3:1; app has one canonical token surface; no visual change from export cleanup | Contrast unit tests; repository import/type check; package build |
| 2 | Complete press/focus/reduced-motion/accessibility primitives | `MotionPressable.tsx`; `AppIcon.tsx`; `BrandLogo.tsx`; `ImagePlaceholder.tsx`; reduced-motion provider/hook; `global.css` | Focus token; existing motion durations | One focus-visible contract, 44px targets, one accessible name per composite, zero decorative motion in reduce mode | Component accessibility tests; Playwright accessibility snapshots; reduced-motion screenshots/native smoke test |
| 3 | Stabilize button densities and state geometry | `Button.tsx`; `button-layout.ts`; `Button.spec.ts`; opacity/compact size tokens | Compact-density founder decision | Content width remains default; loading changes size ≤1px; compact is 44px only where explicitly requested; disabled/busy semantics readable | Button layout/state unit tests; long-label/loading screenshots; contrast checks |
| 4 | Normalize card/media/detail primitives | `AuctionCard.tsx`; `ProductGallery.tsx`; `ImagePlaceholder.tsx`; `Skeleton.tsx`; new shared product-grid/detail-section primitive | Wave A grid; ratio/hero tokens | 4:5 loaded/fallback/loading parity; compact footer contract; plain editorial detail sections available without panel chrome | Component snapshots and visual stories for long/missing/failed media |
| 5 | Finish dialog and shared page-state contracts | `AppDialog.tsx`; `PageState.tsx`; `PageHeader.tsx`; `Skeleton.tsx` | Wave A modal geometry; focus primitive | Dialog handles long content/focus/cancel; loading announced once; empty/error/retry variants consistent | Dialog focus/overflow tests; PageState role/live-region tests; state screenshot set |
| 6 | Add presentation adapters for existing seller/admin values | Shared localized status/enum maps; shared single-select, date-time field and compact auction/product row; `TextField.tsx` | No API/domain changes; founder nav/compact typography decision | No raw enum/ISO copy; controls serialize existing values; compact rows retain 44px targets | Mapping/date serialization unit tests; mobile typecheck/lint; existing auction/security E2E |

### Wave C — Screen polish and acceptance

| Order | Task | Exact files/components | Dependencies | Acceptance criteria | Required checks |
|---|---|---|---|---|---|
| 1 | Apply final catalog card hierarchy | `product-list-screen.tsx`; `AuctionCard.tsx` | Waves A/B grid/card primitives | Remove publication row; compact price then status; description preserved; 1440 left edge/4-column density unchanged | Catalog loaded/loading/failure screenshots and bounding-box E2E |
| 2 | Apply editorial product-detail sections and complete buyer/admin states | `product-screen.tsx`; `AuctionPanel.tsx`; `BottomActionBar.tsx`; bid confirmation | Waves A/B product/dialog primitives | Auction panel is sole transactional panel; story/provenance/history/bids are linear; buyer/admin first viewport passes; no tabs | Product state matrix, long-content, keyboard and bid-confirmation E2E |
| 3 | Polish author and purchases compositions | `public-seller-screen.tsx`; `activity-screen.tsx` | Shared grid/compact row/media tokens | 120px author identity + responsive work grid; activity exposes existing price/deadline/status without new API | Author many/zero/failure screenshots; activity status/long-row screenshots; privacy E2E |
| 4 | Replace technical seller controls and media layouts | `seller-profile-screen.tsx`; `product-draft-screen.tsx`; `listing-draft-screen.tsx`; `FormSection.tsx` | Shared adapters/media primitives | Human labels/date-time UI; 200px profile preview; 160×200 product rows; truthful upload count; existing state locks unchanged | Seller-flow screenshots; auction-creation E2E; edit/upload/reorder/delete tests |
| 5 | Recompose moderation and localize order projections | `admin-moderation-screen.tsx`; `order-screen.tsx` | Shared compact rows/maps/dialog | 1180px two-column desktop queue, one-column smaller widths; localized status/reason/order copy; destructive rules unchanged | Admin/order role screenshots; moderation/order/security E2E |
| 6 | Finish auth, long-content and all page states | auth routes/form; every PageState caller; long-label fixtures | Shared state/auth container | Keyboard/zoom safe auth; truthful registration copy; no duplicate loading; all required empty/error/disabled states | Auth/state screenshots at all widths; accessibility scan; long-label tests |
| 7 | Run and persist full visual/accessibility acceptance | `apps/mobile/e2e/01-wave2-layout-screenshots.spec.ts` refactored matrix; CI artifacts | All prior tasks; reproducible pinned toolchain | Every row in section 7 passes; images fully opaque; artifact names include commit/viewport/role/state | Typecheck; lint without fix; unit/integration/E2E; build; Chromium plus manual Safari/Android/iPhone matrix |

## 7. Visual regression matrix

| Viewport | Routes / identity / state | Must be visible in the first viewport | Must not appear | Required proof |
|---|---|---|---|---|
| 1440×900 | `/` as guest/admin; loaded/loading/failed image | 72px rail, top-right account, four equal catalog tracks, real fully opaque 4:5 media, author/title/price/status | Large `Каталог` heading/count; mobile header; fewer-width 3-column cards; faded media | Column/card/image bounding boxes + loaded/loading/failure PNGs |
| 1440×900 | `/product/seedLive002` as eligible buyer and admin | 440×550 hero, author/title/short story, auction status/current/minimum/time, buyer CTA or admin notice | Mobile dock; tabs; bordered story/history panels; cropped/faded hero | Separate buyer/admin PNGs + first-viewport bounding boxes |
| 1440×900 | `/seller/[slug]`, `/me/activity`, seller profile/product draft/listing draft | Author identity + 2–3 work columns; compact price/deadline rows; 760px form measure and localized controls | 64px-only author; giant single work; raw enums/ISO; 720px media preview | Route/state PNGs with long values; media bounds; text assertions |
| 1440×900 | `/admin`, `/order/[publicId]`, login/register | Two moderation columns, localized status/actions; centered 540px auth task; explicit role projection | Generic dashboard chrome; mixed English enums; global nav on auth | Admin/order role PNGs; auth PNGs; privacy assertions |
| 1440×900 | Account open, tooltip focused, destructive/bid dialog over popover | Popover layer 20; modal 30; visible focus ring; centered ≤520px dialog | Card/panel above menu; popover above dialog; focus loss after Escape | z-index/activeElement assertions + overlay PNGs |
| 1024×900 | `/` loaded/loading/failed image | Unified header with one divider, exactly three tracks, first-row image/author/title/BYN/status | Desktop rail; two oversized columns; duplicate account row/divider | Column/card bounding boxes + state PNGs |
| 1024×900 | `/product/seedLive002` buyer/admin | Two-column unified top block and all auction truth/action without scroll | Single stacked 300px hero with auction timing below fold; tabs | Buyer/admin first-viewport bounding boxes + PNGs |
| 1024×900 | Author/activity/seller/admin/auth routes | Responsive work grid, compact activity, one-column moderation, readable forms/auth | Desktop two-column moderation; raw enums; overflowed nav/account | Route PNGs with max role/long content and no-horizontal-scroll assertion |
| 390×844 | `/` for guest/buyer/pending seller/approved seller/admin | One header block, four-role max nav contained, exactly two cards, intact amount+BYN then status | Empty spacer; extra divider; horizontal scroll; interleaved price/status | Role-parameterized header/catalog PNGs + target bounding boxes |
| 390×844 | `/product/seedLive002` eligible buyer/admin; keyboard closed/open | Gallery/title/status/current visible; compact dock summary + CTA; input/error scrolls above keyboard | 180px full-form dock; obscured auction text; tabs; fixed clipped content | Buyer/admin/keyboard PNGs + visualViewport/bounding-box assertions |
| 390×844 | `/seller/[slug]`, `/me/activity`, seller/admin/order flows | Stable media/compact rows, long status wrapping, content-width actions, localized controls | Cover-cropped product strips; raw enum/ISO; overlapping destructive actions | Long/empty/error/loading/media PNGs + accessibility scan |
| 390×844 | Login/register; account open; dialog; 200% zoom/reduced motion | Scrollable focused auth input+error+CTA; in-bounds dropdown; scrollable centered dialog; full focus ring | Keyboard-obscured CTA; offscreen menu; faded media; duplicate announcements | Keyboard/zoom/reduce-motion PNGs, accessibility snapshot and Escape focus assertion |

## 8. Founder decisions required

| Decision | Why it is required | Options | Recommended option | Consequence |
|---|---|---|---|---|
| Approve accessible semantic action colors | Current accent text is 4.24:1 and white-on-danger is 4.40:1; changing semantic color is a visible palette decision | A: keep values and find different treatment; B: use existing `accentDark #BC3C1B` for small accent text and legacy negative `#B63B3B` for danger; C: commission another palette | **B** | Small links/errors/destructive buttons pass AA and destructive red separates from orange accent; no new color is invented |
| Approve focus role `#2457E6` | Active tokens have no focus color; the legacy focus `#7FA1FF` is only 2.49:1 on white | A: proposed legacy primary blue `#2457E6`; B: derive another approved high-contrast color; C: ink-only focus | **A** | One 5.86:1 cross-screen focus ring becomes implementable; blue is reserved for focus, not brand CTA |
| Approve responsive detail/identity sizes | Product 1024 and author/media editor need exact values not fully determined by current tokens | A: `productDetailWide 900`, hero 440, author avatar 120, editor preview 200; B: retain current 1025/300/64/full-width; C: provide designer values | **A** | Satisfies first-viewport/product hierarchy and prevents oversized/cropped seller media without new API |
| Approve shared compact/navigation roles | Dense moderation/product rows need an explicit compact control and nav typography; active tokens have neither | A: `buttonCompact 44` with radius 14 and `nav` Inter 500 13/18; B: keep 56px buttons and caption mono nav everywhere; C: provide designer values | **A** | Dense screens become scannable while retaining 44px targets; default/form buttons remain 56px |
| Approve semantic token additions that preserve current visuals | The audit requires new roles for existing repeated invariants (`disabled 0.5`, product ratio 4:5, rail 72, shell 1025, form 760, product max 1180, catalog 900/1440) | A: add named roles with current/confirmed values; B: leave literals; C: postpone governance | **A** | Removes drift without changing current visuals; enables Wave A/B to share one source of truth |

## 9. Explicit non-goals

The following are explicitly out of scope for this audit and the subsequent design wave:

- новые product flows;
- API и role logic;
- pagination;
- поиск;
- фильтры;
- теги;
- избранное;
- рекомендации;
- расширение seed до 10–15 предметов;
- редизайн brand logo без founder decision.

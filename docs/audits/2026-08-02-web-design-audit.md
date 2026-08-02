# Web design audit — 2026-08-02

## 1. Verdict

<!-- To be completed after all audit units are done -->

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
| Display | `fontSize: 32, lineHeight: 38, weight: 700` | Keep | Screen titles on mobile, hero text | |
| Screen title | `fontSize: 28, lineHeight: 34, weight: 700` | Keep | Page headers when used | |
| Section title | `fontSize: 20, lineHeight: 26, weight: 600` | Keep | Section headings within pages | |
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

No token- or button-level P0 finding was confirmed in audit unit 2.

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

## 5. Screen-by-screen implementation specification

| Screen / route | Keep | Remove | Change | Components/files | Acceptance screenshot |
|---|---|---|---|---|---|

<!-- Populated after audit units 5–9 -->

## 6. Implementation waves

### Wave A — Structural responsive fixes

| Order | Task | Exact files/components | Dependencies | Acceptance criteria | Required checks |
|---|---|---|---|---|---|

### Wave B — Shared component and visual-system fixes

| Order | Task | Exact files/components | Dependencies | Acceptance criteria | Required checks |
|---|---|---|---|---|---|

### Wave C — Screen polish and acceptance

| Order | Task | Exact files/components | Dependencies | Acceptance criteria | Required checks |
|---|---|---|---|---|---|

<!-- Populated in audit unit 10 -->

## 7. Visual regression matrix

<!-- Populated in audit unit 10 -->

## 8. Founder decisions required

<!-- Populated incrementally; finalized in audit unit 10 -->

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

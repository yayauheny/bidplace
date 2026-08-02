# Web design audit — progress

## Current status

- Status: `in_progress`
- Last completed checkpoint: 2026-08-02 12:06
- Current audit unit: 9 — Accessibility, keyboard, long content, responsive regressions
- Next exact action: Cross-check semantics, focus/Tab/Escape, 44px targets, contrast, reduced motion, long labels/content, auth screens and screenshot/E2E blind spots; add unit 9 findings and remaining screen rows
- Blockers: none

## Audit queue

| # | Audit unit | Sources to inspect | Status | Findings added to final audit |
|---|---|---|---|---|
| 1 | Repo instructions, canonical product/design docs, skeleton and queue | AGENTS.md, product/design docs, screenshots, commits | `complete` | Evidence table populated; no findings (documentary unit) |
| 2 | Design tokens, typography, colors, spacing, radii, buttons | packages/design-tokens/src/index.ts, modern.ts, Button.tsx, MotionPressable.tsx, button-layout.ts, AppText.tsx, TextField.tsx, app/_layout.tsx, shared media components | `complete` | F-ACC-01, F-ACC-02, F-ACC-03, F-BTN-01, F-TOK-02, F-TOK-03 |
| 3 | AppShell, AppHeader, desktop rail, mobile header, account control | AppShell.tsx, AppHeader.tsx, BrandLogo.tsx, AccountMenu.tsx; catalog/product screenshots at 1440/1024/390 | `complete` | No new finding: target shell/header geometry confirmed; seller long-label evidence deferred to unit 9 regression gap |
| 4 | OverlayHost, tooltips, account menu, dialogs, stacking and focus | OverlayHost.tsx, AccountMenu.tsx, AppDialog.tsx, navigation.spec.ts, dialog screenshots at 1440/1024/390 | `complete` | F-OVR-01, F-OVR-02, F-DLG-01 |
| 5 | Catalog grid and AuctionCard at 1440/1024/390 | product-list-screen.tsx, AuctionCard.tsx, Skeleton.tsx, ImagePlaceholder.tsx, real fixtures, catalog screenshots | `complete` | F-CAT-01, F-CAT-02, F-CAT-03 |
| 6 | Product detail, gallery, auction panel, linear sections | product-screen.tsx, ProductGallery.tsx, AuctionPanel.tsx, BottomActionBar.tsx, product screenshots, primary product reference | `complete` | F-PDP-01, F-PDP-02, F-PDP-03 |
| 7 | Author page, purchases, seller screens, forms and media | public-seller-screen.tsx, activity-screen.tsx, seller-profile-screen.tsx, product-draft-screen.tsx, listing-draft-screen.tsx, FormSection.tsx, TextField.tsx, contracts and E2E | `complete` | F-AUTHOR-01, F-ACT-01, F-FORM-01, F-MEDIA-01 |
| 8 | Admin moderation, destructive actions, loading/empty/error states | admin-moderation-screen.tsx, order-screen.tsx, PageState.tsx, PageHeader.tsx, Skeleton.tsx, dialog screenshots and E2E | `complete` | F-ADM-01, F-ADM-02, F-STATE-01 |
| 9 | Accessibility, keyboard, long content, responsive regressions | All components and screens cross-check | `not_started` | — |
| 10 | Compile findings, waves, visual regression matrix, final review | All findings from 1–9 | `not_started` | — |

## Reviewed evidence

| Source | What was checked | Concrete conclusion | Final finding IDs |
|---|---|---|---|
| AGENTS.md | Rules, doc ownership, update workflow | Only audit files allowed; no product/design doc changes | — |
| docs/product/00-PROJECT-INDEX.md | Doc map and reading packages | Standard reading package confirmed | — |
| docs/product/01-PRODUCT-FOUNDATION.md | Brand tone: спокойный, уверенный, человеческий, без пафоса; visual: предмет на первом плане, крупные изображения, чистая композиция, редакционная подача, минимум шума | Design must serve value and trust, not decoration | — |
| docs/product/05-MVP-RFC.md | Card requirements (title, author, category, story, technique, materials, dimensions, year, uniqueness, city, delivery, start price, dates, images); auction states; contact privacy | Card hierarchy and auction panel content requirements confirmed | — |
| docs/product/11-PROJECT-STATUS.md | Wave 2 partial: catalog grid, product layout, buttons, dialog, mobile header fix; all screens partial final migration; founder acceptance pending | No screen is fully Implemented; all need QA | — |
| docs/design/01-DESIGN-FOUNDATION.md | Hierarchy: 1. Image+title, 2. Person, 3. Story/materials, 4. Auction status, 5. Price/action, 6. Bid history | Design hierarchy order is canonical | — |
| docs/design/03-DESIGN-SYSTEM.md | Missing foundations: brand tokens, typography approval, focus/keyboard matrix, component docs, offline banner, participation pattern, contrast audit | Multiple system-level gaps documented | — |
| docs/design/04-DESIGN-STATUS.md | All screens partial final migration; founder device/accessibility acceptance pending everywhere | No screen can be marked Implemented yet | — |
| /private/tmp/bidplace-wave2-screenshots/ | Opened all nine catalog/product/dialog PNGs at original resolution; checked timestamps and attempted a fresh E2E run | Existing artifacts show the current target-width layouts; fresh regeneration is blocked before Playwright by pnpm registry-signature verification | Later screen findings; F-VR-01 |
| Commits db4f2d1, 933312d, d02ec40, e672dda | Recent layout fixes: catalog heading removed, description clamped, dialog centered, mobile header spacer removed, mobile nav top divider removed | These issues are already fixed in HEAD; audit must not re-report them | — |
| packages/design-tokens/src/index.ts and modern.ts | Compared all color, type, spacing, radius, size, motion and layer roles plus package exports | Active app uses `modernTokens`, but conflicting legacy exports remain public; active system lacks focus, opacity, media-ratio, nav and layout roles | F-ACC-01, F-ACC-02, F-ACC-03, F-TOK-02, F-TOK-03 |
| Button.tsx, MotionPressable.tsx, button-layout.ts and AppText.tsx | Checked content/compact/block width behavior, loading/disabled states, semantic action colors, touch targets and text tones | Content width is correct by default; loading replaces the width-defining label; muted/accent/danger contrast and focus-visible support are incomplete | F-ACC-01, F-ACC-02, F-ACC-03, F-BTN-01 |
| app/_layout.tsx | Verified runtime font registration | Inter 400/500/600/700 and PT Mono are registered through Expo `useFonts`, including web; no web font-family defect exists | — |
| TextField.tsx, AuctionCard.tsx, ProductGallery.tsx, ImagePlaceholder.tsx and CatalogLoading | Compared repeated state and media literals | Disabled opacity `0.5` and product portrait ratio `4/5` are consistent today but not tokenized | F-TOK-02 |
| docs/modern-ui target docs and approved local reference screenshots | Read art-direction rules and opened product, catalog, author, auth, settings, dashboard, empty, technical-detail, discovery, search, versions and tracker PNGs | References support image-first hierarchy, restrained controls, compact rows and isolated destructive actions; they do not authorize new flows. White canvas, linear detail and unified top mobile header from the task override reference conflicts | — |
| AppShell.tsx, AppHeader.tsx and BrandLogo.tsx plus 1440/1024/390 screenshots | Checked 1025 shell transition, rail width, logo/account placement, nav states and mobile dividers | 1440 rail/account and 1024/390 unified mobile header match confirmed target; no stale spacer or duplicate divider remains | — |
| OverlayHost.tsx, AccountMenu.tsx and navigation.spec.ts | Checked web portal ownership, placement math, outside/Escape close, focus open/return and existing overlay assertions | Desktop dropdown/tooltips use layer 20; mobile account dropdown bypasses portal; Escape close does not prove or implement focus return | F-OVR-01, F-OVR-02 |
| AppDialog.tsx, four dialog call sites and dialog screenshots | Checked centering, 520px maximum, 20px gutter, action ordering, cancel availability and layer contract | Current dialog geometry and destructive/cancel hierarchy pass at all viewports; modal z-index is not explicitly applied or tested against popovers | F-DLG-01 |
| product-list-screen.tsx and catalog screenshots | Checked column math, gutters, left edge, first viewport, loaded/loading composition at 1440/1024/390 | 1440 card width and left edge pass; 1024 wrongly stays two-column; 390 card footer wraps auction truth; loading grid differs from loaded grid | F-CAT-01, F-CAT-02, F-CAT-03 |
| AuctionCard.tsx, ImagePlaceholder.tsx and seeded product PNGs | Checked image source, 4:5 ratio, contain behavior, fallback, text hierarchy and listing states | Real images load and fallback keeps ratio; publication date is redundant; narrow footer lacks an atomic price/status layout | F-CAT-02 |
| product-screen.tsx and product screenshots | Checked responsive top block, first viewport, story duplication, auction truth, mobile/desktop bid form and linear section order | 1440 two-column structure works but hero is undersized; 1024 stacks below 1025; 390 clips current price; screenshots use admin and cannot prove buyer CTA | F-PDP-01, F-PDP-02, F-PDP-03 |
| ProductGallery.tsx, AuctionPanel.tsx and BottomActionBar.tsx | Checked media/fallback geometry, auction labels, status semantics, dock height and safe-area padding | Gallery is fixed 300px; auction content is explicit; mobile dock contains the full form and exceeds target compact height | F-PDP-01, F-PDP-02 |
| public-seller-screen.tsx and author reference | Checked identity hierarchy, profile photo, work layout, empty/error handling and data boundaries | 64px identity is weak and direct one-column AuctionCard mapping becomes oversized on desktop; no new cover/API is justified | F-AUTHOR-01 |
| activity-screen.tsx and activity contract/E2E | Checked compact row content, long status, price/deadline availability, order path and privacy | Contract already exposes listing price/deadline, but row omits them; E2E proves behavior, not layout | F-ACT-01 |
| seller-profile, product-draft and listing-draft screens | Checked max width, group chrome, raw values, selection/date controls, action hierarchy and state locks | Forms fit 760px but expose backend enums/ISO and oversized button lists instead of labelled selectors | F-FORM-01 |
| seller/profile and product-draft media code | Checked preview ratio/fit/fallback, upload wording, reorder/delete targets and confirmation | Profile preview can reach 720px square; product images crop to a 180px strip; upload lacks truthful count | F-MEDIA-01 |
| admin-moderation-screen.tsx and dialog screenshots | Checked desktop/mobile queue geometry, status/evidence/action hierarchy, blocking explanations, destructive confirmation and order maintenance | Confirmations are explicit and centered; desktop queue underuses width and mixes evidence/actions vertically; raw English domain values remain | F-ADM-01, F-ADM-02 |
| PageState.tsx, Skeleton.tsx and route state branches | Checked loading/empty/error semantics, retry, geometry and consistency | PageState duplicates loading copy without progress semantics; catalog skeleton is separate; several routes use ad-hoc state text | F-STATE-01 |

## Findings ledger

| ID | Priority | Short finding | Final report section | Status |
|---|---|---|---|---|
| F-ACC-01 | P1 | Muted captions render at 2.60:1 contrast | 4 / P1 | `confirmed` |
| F-ACC-02 | P1 | Accent and destructive action labels miss 4.5:1 contrast | 4 / P1 | `confirmed` |
| F-ACC-03 | P1 | Shared pressables lack a visible keyboard focus state | 4 / P1 | `confirmed` |
| F-BTN-01 | P2 | Loading changes content-width button geometry | 4 / P2 | `confirmed` |
| F-TOK-02 | P2 | Disabled opacity and product ratio are repeated literals | 4 / P2 | `confirmed` |
| F-TOK-03 | P2 | Conflicting legacy and modern token systems remain public | 4 / P2 | `confirmed` |
| F-OVR-01 | P1 | Mobile account dropdown bypasses the overlay layer | 4 / P1 | `confirmed` |
| F-OVR-02 | P1 | Account dropdown does not restore keyboard focus after Escape | 4 / P1 | `confirmed` |
| F-DLG-01 | P2 | Dialog does not explicitly apply the modal layer token | 4 / P2 | `confirmed` |
| F-CAT-01 | P1 | Catalog uses two instead of three columns at 1024px | 4 / P1 | `confirmed` |
| F-CAT-02 | P1 | Mobile card footer breaks price/currency/status hierarchy | 4 / P1 | `confirmed` |
| F-CAT-03 | P1 | Loading skeleton grid does not match loaded catalog | 4 / P1 | `confirmed` |
| F-PDP-01 | P0 | Auction truth and action do not fit the first product viewport | 4 / P0 | `confirmed` |
| F-PDP-02 | P1 | Product hero is fixed at 300px on every viewport | 4 / P1 | `confirmed` |
| F-PDP-03 | P1 | Linear detail sections retain heavy panel chrome | 4 / P1 | `confirmed` |
| F-AUTHOR-01 | P1 | Author page underplays identity and oversizes works | 4 / P1 | `confirmed` |
| F-ACT-01 | P1 | Purchases rows omit available price and deadline | 4 / P1 | `confirmed` |
| F-FORM-01 | P1 | Seller flows expose raw enums and ISO timestamps | 4 / P1 | `confirmed` |
| F-MEDIA-01 | P1 | Seller media editors use unstable/cropped geometry | 4 / P1 | `confirmed` |
| F-ADM-01 | P1 | Desktop moderation is a long narrow action queue | 4 / P1 | `confirmed` |
| F-ADM-02 | P1 | Admin/order UI leaks internal English domain values | 4 / P1 | `confirmed` |
| F-STATE-01 | P2 | Shared loading state duplicates copy and lacks progress semantics | 4 / P2 | `confirmed` |

## Decisions and assumptions

- Target decisions from user request are treated as confirmed founder decisions (white canvas, desktop rail, catalog grid breakpoints at 900/1440, content-width buttons, centered dialogs, no tabs in product detail, etc.)
- Nine screenshots at `/private/tmp/bidplace-wave2-screenshots/` are available, timestamped 2026-08-02 01:16. A fresh rerun failed before Playwright because pnpm could not verify/fetch its signed release; visual conclusions identify this reproducibility limit.
- Recent commits db4f2d1, 933312d, d02ec40, e672dda already fixed: visible catalog heading, catalog description multi-line, dialog centering, mobile header spacer, mobile nav top divider. These are not reported as findings.
- Two token files coexist: legacy `colors/spacing/radius/sizes/typography/shadows/layout/brand` in index.ts and active `modernTokens` in modern.ts. All current components use modernTokens.
- Measured contrast on white: `textSecondary` 4.71:1, `textMuted` 2.60:1, `accent` 4.24:1, `accentDark` 5.53:1, current `danger` 4.40:1, legacy `negative` 5.71:1, proposed focus `#2457E6` 5.86:1.
- Expo `useFonts` registers Inter 400/500/600/700 and PT Mono under the exact family names used by `modernTokens`; the earlier font-alias concern is disproved.
- Default button height `56` and radius `18` remain unchanged in the target system because no runtime screenshot evidence proves a global visual defect. A separate 44px compact density is only a proposed future token for dense contexts.
- Existing `4/5` product-media ratio is preserved; audit unit 2 recommends tokenizing it, not changing the crop.
- The current 1025px shell breakpoint is acceptable: 1440 uses the icon rail, while 1024/390 use the unified mobile header. Catalog and product-detail composition may use independent breakpoints, as explicitly confirmed by the task.
- The local Modern UI docs use a warm canvas, content tabs and bottom mobile dock in places; the task's later explicit decisions take precedence: white canvas, linear product sections and one unified top mobile header.
- `01-DESIGN-FOUNDATION.md` is protected — cannot be changed without founder/designer decision.
- No Figma workspace is linked. No external design deliverables exist.

## Resume instructions

Start audit unit 9: cross-check all screens/components for semantics, keyboard/focus, touch targets, reduced motion, long labels/content and responsive/evidence blind spots; inspect auth screens and finish the screen specification.

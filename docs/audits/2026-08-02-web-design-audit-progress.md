# Web design audit — progress

## Current status

- Status: `in_progress`
- Last completed checkpoint: 2026-08-02 11:36
- Current audit unit: 3 — AppShell, AppHeader, desktop rail, mobile header, account control
- Next exact action: Inspect AppShell, AppHeader, BrandLogo and AccountMenu for responsive structure, the 1025px rail transition, header geometry and account-control placement; add only unit 3 findings
- Blockers: none

## Audit queue

| # | Audit unit | Sources to inspect | Status | Findings added to final audit |
|---|---|---|---|---|
| 1 | Repo instructions, canonical product/design docs, skeleton and queue | AGENTS.md, product/design docs, screenshots, commits | `complete` | Evidence table populated; no findings (documentary unit) |
| 2 | Design tokens, typography, colors, spacing, radii, buttons | packages/design-tokens/src/index.ts, modern.ts, Button.tsx, MotionPressable.tsx, button-layout.ts, AppText.tsx, TextField.tsx, app/_layout.tsx, shared media components | `complete` | F-ACC-01, F-ACC-02, F-ACC-03, F-BTN-01, F-TOK-02, F-TOK-03 |
| 3 | AppShell, AppHeader, desktop rail, mobile header, account control | AppShell.tsx, AppHeader.tsx, BrandLogo.tsx, AccountMenu.tsx | `not_started` | — |
| 4 | OverlayHost, tooltips, account menu, dialogs, stacking and focus | OverlayHost.tsx, AccountMenu.tsx, AppDialog.tsx | `not_started` | — |
| 5 | Catalog grid and AuctionCard at 1440/1024/390 | product-list-screen.tsx, AuctionCard.tsx, Skeleton.tsx, ImagePlaceholder.tsx | `not_started` | — |
| 6 | Product detail, gallery, auction panel, linear sections | product-screen.tsx, ProductGallery.tsx, AuctionPanel.tsx, BottomActionBar.tsx | `not_started` | — |
| 7 | Author page, purchases, seller screens, forms and media | public-seller-screen.tsx, activity-screen.tsx, seller-profile-screen.tsx, product-draft-screen.tsx, listing-draft-screen.tsx, FormSection.tsx, TextField.tsx | `not_started` | — |
| 8 | Admin moderation, destructive actions, loading/empty/error states | admin-moderation-screen.tsx, PageState.tsx, PageHeader.tsx | `not_started` | — |
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
| /private/tmp/bidplace-wave2-screenshots/ | Attempted ls — directory does not exist | Screenshots are ephemeral E2E artifacts, not persistently available | — |
| Commits db4f2d1, 933312d, d02ec40, e672dda | Recent layout fixes: catalog heading removed, description clamped, dialog centered, mobile header spacer removed, mobile nav top divider removed | These issues are already fixed in HEAD; audit must not re-report them | — |
| packages/design-tokens/src/index.ts and modern.ts | Compared all color, type, spacing, radius, size, motion and layer roles plus package exports | Active app uses `modernTokens`, but conflicting legacy exports remain public; active system lacks focus, opacity, media-ratio, nav and layout roles | F-ACC-01, F-ACC-02, F-ACC-03, F-TOK-02, F-TOK-03 |
| Button.tsx, MotionPressable.tsx, button-layout.ts and AppText.tsx | Checked content/compact/block width behavior, loading/disabled states, semantic action colors, touch targets and text tones | Content width is correct by default; loading replaces the width-defining label; muted/accent/danger contrast and focus-visible support are incomplete | F-ACC-01, F-ACC-02, F-ACC-03, F-BTN-01 |
| app/_layout.tsx | Verified runtime font registration | Inter 400/500/600/700 and PT Mono are registered through Expo `useFonts`, including web; no web font-family defect exists | — |
| TextField.tsx, AuctionCard.tsx, ProductGallery.tsx, ImagePlaceholder.tsx and CatalogLoading | Compared repeated state and media literals | Disabled opacity `0.5` and product portrait ratio `4/5` are consistent today but not tokenized | F-TOK-02 |

## Findings ledger

| ID | Priority | Short finding | Final report section | Status |
|---|---|---|---|---|
| F-ACC-01 | P1 | Muted captions render at 2.60:1 contrast | 4 / P1 | `confirmed` |
| F-ACC-02 | P1 | Accent and destructive action labels miss 4.5:1 contrast | 4 / P1 | `confirmed` |
| F-ACC-03 | P1 | Shared pressables lack a visible keyboard focus state | 4 / P1 | `confirmed` |
| F-BTN-01 | P2 | Loading changes content-width button geometry | 4 / P2 | `confirmed` |
| F-TOK-02 | P2 | Disabled opacity and product ratio are repeated literals | 4 / P2 | `confirmed` |
| F-TOK-03 | P2 | Conflicting legacy and modern token systems remain public | 4 / P2 | `confirmed` |

## Decisions and assumptions

- Target decisions from user request are treated as confirmed founder decisions (white canvas, desktop rail, catalog grid breakpoints at 900/1440, content-width buttons, centered dialogs, no tabs in product detail, etc.)
- Screenshots at /private/tmp/bidplace-wave2-screenshots/ do not exist at audit time; E2E spec confirmed to write there but artifacts are ephemeral
- Recent commits db4f2d1, 933312d, d02ec40, e672dda already fixed: visible catalog heading, catalog description multi-line, dialog centering, mobile header spacer, mobile nav top divider. These are not reported as findings.
- Two token files coexist: legacy `colors/spacing/radius/sizes/typography/shadows/layout/brand` in index.ts and active `modernTokens` in modern.ts. All current components use modernTokens.
- Measured contrast on white: `textSecondary` 4.71:1, `textMuted` 2.60:1, `accent` 4.24:1, `accentDark` 5.53:1, current `danger` 4.40:1, legacy `negative` 5.71:1, proposed focus `#2457E6` 5.86:1.
- Expo `useFonts` registers Inter 400/500/600/700 and PT Mono under the exact family names used by `modernTokens`; the earlier font-alias concern is disproved.
- Default button height `56` and radius `18` remain unchanged in the target system because no runtime screenshot evidence proves a global visual defect. A separate 44px compact density is only a proposed future token for dense contexts.
- Existing `4/5` product-media ratio is preserved; audit unit 2 recommends tokenizing it, not changing the crop.
- `01-DESIGN-FOUNDATION.md` is protected — cannot be changed without founder/designer decision.
- No Figma workspace is linked. No external design deliverables exist.

## Resume instructions

Start audit unit 3: inspect `AppShell.tsx`, `AppHeader.tsx`, `BrandLogo.tsx` and `AccountMenu.tsx`; compare desktop rail/mobile header/account-control geometry at the 1025px transition against confirmed target decisions, then add only unit 3 findings.

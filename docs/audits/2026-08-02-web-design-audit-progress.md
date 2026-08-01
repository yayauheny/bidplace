# Web design audit — progress

## Current status

- Status: `in_progress`
- Last completed checkpoint: 2026-08-02 01:53
- Current audit unit: 2 — Design tokens, typography, colors, spacing, radii, buttons
- Next exact action: Analyze modernTokens and legacy tokens for gaps, populate target visual system table, identify token findings
- Blockers: none

## Audit queue

| # | Audit unit | Sources to inspect | Status | Findings added to final audit |
|---|---|---|---|---|
| 1 | Repo instructions, canonical product/design docs, skeleton and queue | AGENTS.md, product/design docs, screenshots, commits | `complete` | Evidence table populated; no findings (documentary unit) |
| 2 | Design tokens, typography, colors, spacing, radii, buttons | packages/design-tokens/src/index.ts, modern.ts, Button.tsx, button-layout.ts, AppText.tsx | `not_started` | — |
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

## Findings ledger

| ID | Priority | Short finding | Final report section | Status |
|---|---|---|---|---|

## Decisions and assumptions

- Target decisions from user request are treated as confirmed founder decisions (white canvas, desktop rail, catalog grid breakpoints at 900/1440, content-width buttons, centered dialogs, no tabs in product detail, etc.)
- Screenshots at /private/tmp/bidplace-wave2-screenshots/ do not exist at audit time; E2E spec confirmed to write there but artifacts are ephemeral
- Recent commits db4f2d1, 933312d, d02ec40, e672dda already fixed: visible catalog heading, catalog description multi-line, dialog centering, mobile header spacer, mobile nav top divider. These are not reported as findings.
- Two token files coexist: legacy `colors/spacing/radius/sizes/typography/shadows/layout/brand` in index.ts and active `modernTokens` in modern.ts. All current components use modernTokens.
- `01-DESIGN-FOUNDATION.md` is protected — cannot be changed without founder/designer decision.
- No Figma workspace is linked. No external design deliverables exist.

## Resume instructions

Start audit unit 2: analyze modernTokens vs legacy tokens, map all current token usage to target visual system table, identify gaps and findings for tokens/typography/colors/buttons. Files: packages/design-tokens/src/index.ts, modern.ts, Button.tsx, button-layout.ts, AppText.tsx.

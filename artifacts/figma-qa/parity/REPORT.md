# Figma visual parity

Date: 2026-09-13  
Branch: `fix/figma-merge-candidate`  
Base: `1845ab8` (green stabilization)  
Sources: comparison fixtures from `57e4f39` without `non-parity-anna-candidates`; tab typography from `5725bde`; durable evidence from `702211b`.  
Stand: Expo `http://localhost:8011`, API `:3011`, DB `bidplace_figma_comparison_preview`  
No `page.route` for this comparison. Viewport 390×860, DPR 1.  
`document.fonts.ready` and all images complete before each shot.  
Engines: Chromium + WebKit × normal motion + `prefers-reduced-motion`.

Committed evidence in Git:

- this report;
- numeric measurements: `all-summaries.json`, `keyboard-zoom.json`, `before/*.json`, and each state's `measure.json`;
- four contact sheets:
  - `chromium-normal/contact-sheet.png`
  - `chromium-reduced/contact-sheet.png`
  - `webkit-normal/contact-sheet.png`
  - `webkit-reduced/contact-sheet.png`

Per-state `figma.png`, `runtime.png`, `overlay.png`, and `diff.png` are generated temporarily by `apps/mobile/e2e/parity/run.mjs`. They are disposable comparison rasters and are **not** stored in the repository. Reconstruct them locally when a reviewer needs overlays; the contact sheets and measurement JSON are the durable record.

## Success criteria

- Compare geometry and visually significant zones, not full pixel equality across Chromium, WebKit, and the Figma renderer.
- Fix only proven shared token/master misses.
- Do not shrink the dock or weaken type because a screenshot looks larger.
- Do not return Archive, Likes, VK, cart, prices, timers, or active auctions.

## Before / after (Chromium, normal motion, Creator Works)

| Role | Before | After | Figma / decision |
|---|---|---|---|
| Tab label | Inter Medium 16/19, `letter-spacing: normal`, box 70.38×25 @ (115.48, 460) | Inter Medium 16/19, **−0.32px**, box 76.59×25 @ (113.81, 460) | `621:19524` / `621:19870`: Medium 16, −2% = −0.32, hug 58×19; item 78×25 with 20 px count reserve |
| Tab count | Inter Medium 12, weight 500, `line-height: 0`, tracking normal, 7.88×15 @ (177.98, 457) | Inter Regular **12/14/−0.24**, 7.52×14 @ (174.41, 459) | `621:19525` / `621:19871`: Regular 12/14, −2% = −0.24, absolute after the label |
| First 366 card | 366×488 @ (12, 562) | 366×488 @ (12, 562) | Proportions unchanged |
| Dock | 232×64 @ (79, 784), `blur(6px)`, `rgba(255,255,255,0.6)` | same | `439:4633` 232×64. Do not shrink. x=79 is the unused 313 split-FAB (`DEC-088`), not a size miss. Bottom 12 is Playwright safe-area floor, not a capsule bug. |
| Atmosphere | 485×485 @ (−47, −36), opacity 0.5, `blur(40px)`, wash `rgba(255,255,255,0.4)`, radius 200 | same | `621:19476` exact |
| Card 264 | 264×352 @ y=181 | 264×352 @ (304, 181) | Component `874:5458` and first-fold rail `439:4422` |
| CoverFrost | 100 tall, `blur(30px)` | same | Do not grow to Figma 124 — that box includes price/timer (`DEC-087`) |
| Compact 0% | avatar 112 @ (139, 132), tabs y=460 | same | Expanded works endpoint |
| Compact 100% | avatar 48 @ (20, 44), tabs y=186, scrollTop 300 | same | `526:14482` |
| Compact reverse | same boxes as the matching forward step | same | Interpolation is symmetric |

WebKit after: tab 16/19/−0.32, count Regular 12/14/−0.24, box 7.52×14 @ y=459.83. Same CSS geometry as Chromium.

## Compact interpolation (Chromium)

| Step | scrollTop | progress | avatar |
|---|---|---|---|
| 0 / reverse 0 | 0 | 0 | 112 @ (139, 132) |
| 25 / reverse 25 | 75 | 0.274 | 94.48 @ (106.43, 107.91) |
| 50 / reverse 50 | 150 | 0.547 | 76.96 @ (73.85, 83.82) |
| 75 / reverse 75 | 225 | 0.821 | 59.45 @ (41.28, 59.74) |
| 100 / reverse 100 | 300 | 1 | 48 @ (20, 44) |

Mid steps have no official Figma frame. Raster overlay against the 0% or 100% crop is expected; the geometry table is the source.

## Home and dock overlays

| State | Runtime | Note |
|---|---|---|
| Home opening | 264×352 @ (304, 181), frost 100 / `blur(30px)` @ (304, 433) | Peeking rail from `439:4404`. Mean raster delta is commerce/Archive in Figma, not a token miss. |
| Home new Works | 366×488 @ x=12 | Existing cover master. Figma long frame still paints prices/timers. |
| Dock light / dark / color | 232×64, fill 60% white, `blur(6px)`, no shadow | Same capsule on light, dark, and colored artwork. Half-radius vs Figma 12 is the documented product rule (atmosphere 80→40). |

## Keyboard, zoom, reduced motion

`apps/mobile/e2e/parity/keyboard-zoom.mjs` on the comparison stand, Chromium and WebKit:

- ArrowRight / Home / End move focus and `aria-selected` between «Работы» and «Об авторе».
- Zoom 200%: computed tab stays 16/19/−0.32; count stays Regular 12/14/−0.24.
- Reduced-motion captures exist for every state. Compact endpoints still match.

## Fixed

1. `profileTab` tracking **−0.32** (`packages/design-tokens`, `FigmaTabs.web.tsx`).
2. `profileTabCount` Regular **12/14/−0.24**, absolutely placed after the label with 20 px reserve so the tab item stays **25** px (Figma Frame 61).

## Not changed (measured, not a miss)

- Dock 232×64, icon token 18, blur 6, fill 60%.
- Atmosphere bounds/radius/wash/opacity.
- Card 264×352 and 366×488.
- CoverFrost hug-without-price (100, not 124).
- Type scale other than the two tab roles.

## Feelings that measurements did not confirm

- “Dock looks too big” — 232×64 matches `439:4633`.
- “Fonts look too heavy / large” — scale already matched; only tab tracking/count were wrong.
- Full-page pixel inequality — Figma still paints Archive, VK, cart, prices, timers, and the unused 313 dock; engines differ on blur rasters.
- Dock optically heavier — Hugeicons 24 viewBox vs Figma 18×18 inset; not a 232 miss.
- `@vex` ink ~+1.5 px vs Figma renderBounds — browser raster, Chromium ≈ WebKit.
- Frost 100 vs 124 — missing price/timer by `DEC-087`.
- First-fold dock x=38 vs runtime x=79 — unused split-search FAB (`DEC-088`).
- Compact 25/50/75 overlay noise — no official mid-scroll Figma frame.

## Checks

| Check | Result |
|---|---|
| Comparison stand | live `/api/authors/vex` + `/api/portfolio/home`, no `page.route` |
| `pnpm verify` | typecheck 7/7, lint 2/2, API unit 282, contracts 25, client 3, integration 82 passed / 1 skipped, build 7/7 |
| `pnpm --filter @bidplace/mobile test` | 249/249 |
| Expo export | pass (`apps/mobile/dist`, included in verify build) |
| Playwright matrix | **38/38** Chromium + WebKit on this worktree, Expo `:8094`, API `:3004`, DB `bidplace_e2e` (not reset) |
| Keyboard + zoom 200% | pass on comparison stand (both engines) |

## Merge recommendation

Review `fix/figma-merge-candidate` on top of the working Figma line (`1845ab8` + comparison fixtures + tab fix + durable evidence). **Do not merge to `main`.** `main` is still `08b916e`.

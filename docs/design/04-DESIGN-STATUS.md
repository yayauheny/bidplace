# bidplace — статус дизайна и UI-реализации

## 2026-09-13 — S1 ShareSheet Figma acceptance

- `Implemented`: `ShareSheet` matches Figma `597:19045` with a fixed 164px QR
  square, 56px actions, 8px action gap and a ghost copy action; the public URL
  appears only as a selectable fallback after clipboard failure.
- 390/1024/1440 screenshots, long/invalid/QR-error states, real PNG download,
  focus trap, Escape and focus return pass. Evidence:
  `artifacts/figma-qa/S1/REPORT.md`.

## 2026-09-13 — Author compact header follows scroll (H1)

- `Implemented` (mobile web): `CreatorHeader.web.tsx` replaces the
  IntersectionObserver toggle + 240 ms transition with a scroll-linked
  `--creator-progress` on the `creator-scroll` port. Measured at 390×860 with
  offset 264: avatar 112@(139,132) → 96 → 80 → 64 → 48@(20,44) at 0/25/50/75/
  100 %; tabs 450 → 186 and stay at 186 past 100 %; hero height constant 450;
  one share button; focus on «Поделиться профилем» kept at compact. Logo,
  name/city and chips fade to 0 by 50 % and hide at 100 %. Reduced motion:
  progress is 0 until the threshold, then 1. Frames in
  `artifacts/figma-qa/02-author/compact/390-*.png` and `390-reduced-*.png`.
- `Partial`: with three social links the compact handle gets ~54 px of text
  («@an…»); Figma `526:14482` shows two socials and 122 px. Data-driven, not
  a layout defect. Native and ≥1024 are out of scope per founder (mobile web
  only). Task file: `docs/tasks/2026-09-12-figma-finish/16-H1-compact-header.md`.

## 2026-09-13 — Author achievements

`Implemented` for the Frame 219 achievement block: 266 px items, 16 px gap, 3:4 photos with radius 20, marker/line above month and year, and centered text-only cards. Browser checked on Anna at :8083 with both variants and horizontal scrolling; screenshots in `artifacts/figma-qa/02-author/achievements-*.jpg`. Overall author parity remains `Partial`; see the continuation task.

# bidplace — статус дизайна и UI-реализации

## 2026-09-13 — Author state matrix

- `Implemented`: the full-header handle is one 24/29 line with an ellipsis
  (`CreatorHero`, identity block stretched to the 366 column); previously a long
  slug wrapped to two lines. Captured via API patching in
  `artifacts/figma-qa/02-author/matrix/`: long handle (full + compact), 0 and 2
  socials, no achievements, 1024/1440 centered column without overflow. Compact
  header geometry matches `526:14482` (row y 44, tabs y 186).
- Open: A3 compact transition smoothness, A5 font weight hypothesis.

## 2026-09-13 — Home composition against `436:1137`

- `Implemented`: logo 42×32 at y 60 (`logoTop`/`logoGap`, shared with the
  author hero), «Новые работы» heading 24/29 −3 % centered at y 132
  (`sectionTitle` role now carries the Figma line height and tracking), 20px
  heading→cards→button rhythm, 40px between sections, `dockReserve` bottom
  padding. Evidence: `artifacts/figma-qa/07-home/`.
- Open: the Figma home has no vertical section→section value (67 between the
  excluded rails); 40 is the work-page block gap. «Открытие недели» and
  «Активные торги» stay out without a product decision. 1024/1440 not
  re-captured in this pass.

## 2026-09-13 — Cover cards: text-hugging frost, 24px chips, tracking

- `Implemented`: `CoverFrost` now fills a zone that hugs the overlay text
  (`coverFrostZoneStyle`) instead of a fixed 125/56/77 share of the card, which
  matches the Figma auto-layout frames (`874:5459` 125, `745:20736` 102,
  `621:19888` 124 on 366) and stops the frost from growing to 173px on the 366
  author-page card. Compact chips are 24px (`chipX` 9 / `chipY` 3 + 1px border),
  cover typography has the Figma tracking, `AuthorIdentity` chips use the new
  `tinted` tone (`874:5596`).
- Evidence on the Figma sample photo (Dalí, 264 px): runtime title 18/22 −0.36,
  chip 24 h, author card top 56 / bottom 76, chip «Керамика» 83.2×24 against
  Figma 83×24. Files: `artifacts/figma-qa/04-cards/04-cards-runtime-*.png`.
- Remaining `Partial`: gradient chip stroke is a flat 16% white border; frost on
  native is still the retained `expo-image` duplicate; extreme data cases (C5)
  are not screenshot-verified.

## 2026-09-13 — Author avatar crop and works gap

- `Implemented`: the 112px hero avatar crops from the top (`contentPosition="top"`,
  `621:19825`), and the works panel uses the 18px `authorSectionGap` so the first
  366×488 card starts at y 562 like the founder HTML export (was 564). Verified by
  DOM measurement on Anna at 390. Author screen remains `Partial`; open rows are
  listed in `docs/tasks/2026-09-12-figma-finish/14-COMPLETION-MAP.md` §3.2.

## 2026-09-13 — Work page spacing, chips and «Смотреть все»

- `Implemented` against `745:20634` / `745:21209` by DOM measurement at 390:
  share capsule 20px from the right edge; author line 16/19 in #565656 with an
  18px arrow; title block → chips 12px; work chips 80% white, glass border,
  14/17, 29px tall, 6px gap; tabs → panel 24px; panel bottom padding 20px so
  the related heading sits 60px below the last text; related row bleeds to
  the right edge; outline «Смотреть все» (44px, right arrow) opens the author.
  Evidence: `artifacts/figma-qa/03-work/work-after-top-390.png`,
  `work-after-related-390.png`; gap table in
  `docs/tasks/2026-09-12-figma-finish/14-COMPLETION-MAP.md` §3.1.
- Gallery arrows are a deliberate keyboard/pointer addition absent from the
  static Figma frame (W16); not counted as a mismatch.
- Whole-screen status stays `Partial`: error/broken-media captures, 200% zoom,
  reduced motion, Back/Forward tab restoration remain open.

## 2026-09-13 — Work page heading semantics and visual evidence

- `Implemented`: the Work title remains the page `h1`; «Другие работы автора»
  is now an `h2` rather than a second top-level heading.
- `Partial` visual acceptance: real preview data verified at 390/1024/1440,
  including a two-image gallery, no-Story Work, gallery bounds and live label,
  no document overflow, and a missing Work without retry. Evidence:
  `artifacts/figma-qa/03-work/REPORT.md`. Network-error/broken-media capture,
  browser Back/Forward tab restoration, 200% zoom, reduced-motion emulation and
  physical screen-reader review remain.

## 2026-09-13 — Author final composition pass

- `Implemented`: CreatorHero replaces the unused legacy variant; CreatorHeader
  pins one shared FigmaTabs row and repositions the same avatar/handle/actions.
  Profile chips now use white80%/grey border; AuthorAtmosphere fades before the
  content boundary; Internet source glyph includes the ellipse missing in the
  installed Hugeicons RN renderer. Country labels follow the public RFC.
- `Partial` visual acceptance: 390/1024/1440 real-data captures and compact scroll
  checked; full state/zoom/screen-reader matrix and final motion polish remain.
  Evidence: `artifacts/figma-qa/02-author/REPORT.md`. Typecheck, targeted lint,
  seven existing tests and Expo web export pass. No API or privacy changes.

## 2026-09-12 — Work page composition

- `Implemented` on web: `product-screen.tsx` now composes shared `WorkGallery`,
  `FigmaTabs`, and `WorkFactsList`: 3:4 gallery with 20px bottom corners,
  20/24 title, optional Story tab, 14/20 facts, and related work cards.
  Public API data, author navigation and the RFC payment/delivery stub remain
  authoritative; no commerce controls or author cards were added to related works.
- Checks: mobile typecheck, targeted ESLint, five focused tests and Expo web
  export pass. Browser verified the 390px work page and keyboard tab navigation
  with URL state. CSS tab line-height is explicitly expressed in pixels.
- Full screen parity is `Partial`: multi-image gallery, missing-story browser
  states and the complete responsive/accessibility matrix still need visual
  acceptance. An isolated preview stand on Expo :8083 / API :3002 can show
  `seedAnna001` with two photos and `seedAnna002` without a Story tab without
  changing the working database. Deleted/unpublished works must render
  «Работа не найдена», not the retryable load error.

## 2026-09-12 — Shared public ShareSheet

- `Implemented` on web: `components/figma/ShareSheet.tsx` replaces separate
  author/work share flows. Paths are validated against public contract schemas;
  QR preview/download is PNG, filenames are derived from the validated path,
  temporary object URLs are revoked, and HTTP clipboard fallback reports failure.
  Sheet dimmer now uses the existing 50% Figma token.
- Checks: mobile typecheck, targeted lint, 11 focused tests, Expo web export;
  browser confirmed Work sharePath and PNG preview. Embedded-browser download
  events remain unavailable, so saved-file acceptance is `Needs verification`.

## 2026-09-12 — Author visual polish

- `Implemented`: `CreatorSocialLink` uses the Hugeicons Instagram glyph,
  replacing the camera substitute. Shared `FigmaButton` supports a 56px large
  size, used by the QR-sheet actions; the default remains 44px. Category and
  achievement strips hide the horizontal scrollbar while retaining scrolling.
- Checks: mobile typecheck, targeted ESLint, eight existing tests and Expo web
  export pass. Browser checked 390px QR sheet (measured button height 56px),
  1024/1440px author layout (390px content, no document overflow). A prior
  320px check confirmed name/tag wrapping without document overflow.
- `Needs verification`: the embedded browser did not emit a download event
  after the QR download click; file saving is not claimed as verified. Populated
  achievement media and the complete accessibility matrix remain unchecked.

## 2026-09-12 — Author filters and share sheet

- `Implemented` on web: `use-author-works.ts` applies category selection through
  `portfolio.getAuthor`, with separate pagination/cache keys and an unchanged
  total count. Empty and failed category results remain inside the author page.
- `Implemented` on web: `AuthorShare.tsx` opens an `AppDialog` sheet, generates
  QR locally with `qrcode`, downloads SVG and copies the canonical author URL.
  Dialog modal layer is above the dock; Escape restores trigger focus.
- Mobile typecheck, targeted ESLint, four test files (six tests), and Expo web
  export pass. Browser confirmed empty/populated category switching, copy,
  modal stacking, Escape and focus return. QR round-trip decoding is covered
  by `author-qr.spec.ts`; jsqr is a development-only decoder.
- Whole author-screen parity remains `Partial`: native sharing, downloaded
  file handling and the complete responsive/achievement visual matrix need
  verification. Existing API contracts and publication visibility are unchanged.

## 2026-09-12 — Author profile details

- `Partial`: profile typography, 35px discipline chips, separate work count and
  2px active-tab underline follow local Figma `621:19475`. `AuthorAbout.tsx`
  renders biography, optional practice and achievement dates/photos from the
  existing portfolio API. Text content reserves dock clearance; work gutters
  and header atmosphere remain unchanged. Copy failures are now visible.
- Checks: mobile typecheck, targeted ESLint, existing public-seller-tabs test
  and Expo web export passed. Browser checked Works/About with real author
  data; populated achievement media and full responsive/accessibility parity
  still need visual verification. Share/QR and category filters remain gaps;
  no archive, likes or unsupported social controls were added.

## 2026-09-12 — Author header surface boundary

- `Partial`: `public-seller-screen.tsx` confines `AuthorAtmosphere` to the
  header, restores the logo and avatar spacing, and renders full-width white
  tabs and content with the existing 12px work gutters. The 485×485 background,
  offset −47/−36 and 200px bottom radii from `621:19476` remain unchanged.
- Social links share one `FigmaGlassSurface` control group; the existing copy
  action has a separate group. `CreatorSocialLink` supports transparent grouped
  controls while preserving standalone callers. No likes, VK or archive added.
- Typecheck, targeted lint, existing author-tab test and Expo web export pass.
  Browser checks on the built web app confirm grouped horizontal controls,
  white Works/About content and 12px gutters. Full page fidelity and founder
  acceptance remain pending.

## 2026-09-11 — Card geometry and filter stacking checkpoint

- `Partial`: C3 geometry verified at 390 (366×488, radii 24/28); temporary
  catalog identity preview removed. Full matched typography/imagery remains open.
- `Implemented`: FilterMenu uses the existing OverlayPortal; selection above
  cards, Escape/focus return and outside dismissal pass the browser regression.
- Cover frost remains an approximation. See `01-BLUR-CHECKPOINT.md` under
  `docs/tasks/2026-09-11-figma-mvp-components/` for verification and remaining work.

## 2026-09-11 — Author atmosphere scroll correction

- `Partial`: profile atmosphere now belongs to the scroll content. Removed the
  viewport overflow override that disabled web scrolling. Live 390px check:
  320px scroll moves the atmosphere by 320px; focused browser regression passes.
  Full C5 hero composition and exact cover frost parity remain open.
  See `docs/tasks/2026-09-11-figma-mvp-components/01-BLUR-CHECKPOINT.md`.

Последнее обновление: 2026-09-11

Общий статус: **Figma phone cutover Partial for MVP public/author screens**

## 2026-09-11 — Progressive cover frost regions

- `Corrected`: `CoverFrost` is no longer a text-hugging rounded overlay.
  Work cards use a bottom-only 125/352 frost without price; author cards use
  separate 56/352 top and 77/352 bottom frosts. Overlay frames have no 12 px
  inner radius; 24/28 clipping stays on the card.
- `Corrected`: web frost approximates Figma 0→60 / 40→0 progressive background
  blur with one masked `backdrop-filter` ramp (runtime 30 px bottom,
  20 px author top). Stacked blur bands are not used because they read as
  stripes. Native keeps a uniform blur inside the same region as
  compatibility code only. Evidence: `CoverFrost.web.tsx`, `CoverFrost.tsx`,
  `cover-frost-style.ts`, `WorkCoverCard.tsx`, `AuthorCoverCard.tsx`,
  `apps/mobile/e2e/figma-cover-frost.spec.ts`.
- Matched browser-image equality with Figma remains an approximation. No `.pen`
  file changed.

## 2026-09-11 — Focused-route dock ownership

- `Implemented`: `AppShell.tsx` renders `FloatingDock` only while its route is
  focused, using Expo Router `useIsFocused`. Retained stack screens no longer
  leave body portals above the active screen. The earlier blur-layer change
  alone did not fix the reported halo.
- Browser reproduction found two docks after Home → Add → Login. After the
  fix, Login → Home → Add → Login → Home keeps one dock; screenshots show
  no icon halo on Login and live translucent glass on Home.

## 2026-09-11 — Dock post-click halo correction

- `Needs verification`: `FigmaGlassSurface.web.tsx` and `global.css` now put
  backdrop blur on the glass root instead of an overlapping empty sibling.
  The stroke and controls are descendants above that backdrop. Opacity feedback
  and keyboard focus remain unchanged. Existing dock checks follow the new DOM.
- Browser acceptance after repeated navigation remains with the founder.

## 2026-09-11 — Dock viewport white-strip fix

- `Needs verification`: removed the fixed 96px bottom reserve from
  `apps/mobile/src/components/layout/AppShell.tsx`; the scroll viewport now
  extends behind the floating glass dock instead of ending above a white strip.
- Screen compositions and glass tokens are unchanged. Browser visual acceptance
  is delegated to the founder at their request; no new tests were added.

## 2026-09-11 — Unified web glass dock without icon halo

- `Corrected`: production dock is one 232×64 `FigmaGlassSurface` capsule
  (Главная / Поиск / Добавить / Профиль). Search stays inside the capsule.
  Figma first-fold `Frame 46` search FAB and the five-icon cart pill are unused
  variants (`DEC-088`).
- `Corrected`: web glass stacking puts live `backdrop-filter: blur(6px)` on an
  empty backdrop sibling. Icons are not filtered into a halo. Idle / pressed /
  focus add no fill, `filter`, or `box-shadow`. Evidence:
  `FigmaGlassSurface.web.tsx`, `FloatingDockFrame.web.tsx`,
  `apps/mobile/global.css`, `floating-dock.ts`,
  `apps/mobile/e2e/figma-glass-dock.spec.ts`.
- CSS-property-only dock tests are not sufficient for `Implemented`. Visual
  acceptance is the 390 Expo Web dock over white `/login` and over live
  content/stripe, plus the focused Playwright stack/blur checks.
- `Corrected after review`: the web glass master now flattens every supported
  React Native `StyleProp` shape instead of silently dropping style arrays.
  Evidence: `FigmaGlassSurface.web.spec.ts`.
- Public Home / Works / Author / Work screen compositions are unchanged.
- No `.pen` file changed.

## 2026-09-11 — DEC-087 public copy and work_viewed

- `Implemented`: Works and Authors catalog intros, account author labels, and
  reset-password success copy are discovery/account language without
  purchase/auction lexicon. Evidence: `apps/mobile/src/lib/portfolio-copy.ts`.
- Figma works/authors intro still uses «Покупайте самые эксклюзивные…».
  Product contract (`DEC-087`) wins; the visual file is not edited. Gap:
  [`09-FIGMA-CUTOVER-GAPS.md`](09-FIGMA-CUTOVER-GAPS.md).
- `Implemented`: Work detail records `work_viewed`, not `listing_viewed`.
  Admin analytics visitor funnel is `workViewed`.
- Admin moderation copy uses автор / работа; leftover listing lock copy is
  gone.
- No `.pen` file changed.

## 2026-09-11 — Create CTA naming (no visual change)

- `Implemented`: header desktop create control is `CreateWorkAction` with
  `canShowDesktopCreateWork` and `createWorkAction*` layout helpers. Route
  `/products/new`, label «Создать», a11y «Добавить работу» are unchanged.
- Public Home / Works / Author / Work screens are unchanged from P1.
- No `.pen` file changed.

## 2026-09-11 — P3 admin analytics without commerce metrics

- `Implemented`: admin analytics overview cards are users, creators and works.
  Bid/order/listing recovery metrics are gone from the default screen. Ingest
  later the same day switched the live work-view name to `work_viewed`
  (see DEC-087 section above).
  Evidence: `apps/mobile/src/features/admin/admin-analytics-screen.tsx`,
  `apps/api/src/admin/admin-analytics.service.ts`.
- Public Home / Works / Author / Work screens are unchanged from P1.
- No `.pen` file changed.

## 2026-09-10 — P2 admin without commerce recovery

- `Implemented`: admin moderation keeps authors, works and users. Order
  cancel/replace and listing recovery panels are removed from the default
  client because those API methods left `createApiClient`.
- Public Home / Works / Author / Work screens are unchanged from P1.
- No `.pen` file changed.

## 2026-09-10 — P1 portfolio-only public cards

- `Implemented`: public Home / Works / Search / Author / Work grids use
  `WorkCoverCard` directly. The `AuctionCard` wrapper is gone from runtime.
- `Implemented`: `WorkCoverCard` is portfolio-only — title, `@author` chip and
  cover frost. Price, timer and sale-status slots are removed from the active
  component, not left behind as unused commerce mode.
- `Implemented`: `/orders`, `/listings/new`, `/me/activity` and
  `/order/[publicId]` are unmatched routes. Bid dock / `AuctionPlayer` /
  `SlideToBid` are not in the default mobile tree.
- Historical Pen tables below still name `AuctionCard` / `AuctionPlayer` as
  extraction records; they are not current runtime masters.
- No `.pen` file changed.

## 2026-09-10 — Figma cover frost correction C2e

- `Corrected`: web `CoverFrost` now samples the real sharp artwork once through
  `backdrop-filter: blur(30px)` and no longer stacks a second CSS-filtered image
  under the gradient. This removes the previous double-blur/crop contamination.
- The retained Expo native branch keeps one bottom-aligned decorative
  `expo-image` fallback, but native iOS/Android is not a release or acceptance
  target. The entire frost substrate is pointer-inert and excluded from the
  accessibility tree; only the sharp card image remains semantic.
- The shared contract locks Figma nodes `874:5459`, `874:5474` and `874:5543`:
  progressive radius 60, runtime blur 30, 12 px top corners, 12 px padding,
  8 px gap and transparent→`#292929` 70% gradient. Progressive blur has no exact
  CSS equivalent, so matched browser-image acceptance remains pending.
- Verification: 254 mobile unit tests, mobile typecheck/lint and a focused
  Chromium test for live backdrop pixels, no duplicate web image, pointer
  behavior and accessibility pass.
- No screen composition, product flow, Figma file, or `.pen` file changed.

## 2026-09-10 — Coherent error/retry state C1c

- `Corrected`: a failed session check no longer inserts a raw red banner and
  outline retry above a public page's own failure state. Public screens now
  keep one route-owned `PageState`; protected routes reuse that same component.
- `Corrected`: the shared retry action is explicitly centered under its title
  and message. Retryable states expose one polite accessible alert and one dark
  Figma action instead of two competing controls.
- Verification: 252 mobile unit tests, mobile typecheck/lint and two focused
  Playwright public/protected error-state tests pass. A 390×844 browser smoke
  confirms one centered retry composition. Expo web/iOS/Android export passes.
- No product flow, server behavior, Figma file, or `.pen` file changed.

## 2026-09-10 — Figma dock interaction correction C2d

- `Corrected`: dock controls no longer inherit the generic icon press response
  that dropped opacity to 60% and took 200 ms to settle. `MotionPressable` now
  has a scoped dock preset: 82% pressed opacity over 80 ms, with no fill,
  filter or shadow.
- `Corrected`: the 36×36 dock controls now have the captured pill radius, so
  keyboard focus follows the control instead of drawing a square around the
  icon. Focus remains visible and reduced motion removes the transition.
- Verification: 252 mobile unit tests, mobile typecheck/lint and the focused
  Playwright dock blur/focus test pass. Expo web/iOS/Android export passes.
- No screen composition, product flow, Figma file, or `.pen` file changed.

## 2026-09-10 — Figma component library C2c

- `Implemented`: `AuthorAtmosphere` now follows creator node `621:19476` as a
  bounded 485×485 duplicate-photo layer at x=-47/y=-36, with 40 px CSS blur,
  50% layer opacity, 40% white wash and 200 px bottom corners.
- `Corrected`: removed the previous 30% black veil, which darkened colored and
  monochrome profile photos instead of producing the captured pale atmosphere.
- The duplicate media layer and its failed-media descendants are decorative and
  excluded from the accessibility tree; the sharp profile avatar remains the
  only semantic image.
- Verification: 250 mobile unit tests, design-token/mobile typecheck, mobile
  lint and Expo export for web/iOS/Android pass. A local 390 px browser smoke
  with a mocked color profile confirms a pale image-derived field with no black
  veil. Formal matched overlay and physical iOS/Android blur acceptance remain
  pending.
- No screen composition, product flow, Figma file, or `.pen` file changed.

## 2026-09-10 — Figma component library C2b

- `Implemented`: shared failed-media UI now uses the exact scalable vector from
  Figma node `874:5454` at its captured 188×142 geometry and 180° orientation.
- `FigmaImagePlaceholder` is the only vector master. The existing
  `components/ui/ImagePlaceholder` remains a compatibility/layout wrapper, so
  `ResilientRemoteImage` retry behavior and screen APIs are unchanged.
- Removed the previous same-color background/icon combination that could make
  the fallback glyph effectively invisible. No raster upscale or substitute
  artwork is used.
- Verification: 249 mobile unit tests, mobile typecheck and lint pass. The
  shared fallback still requires matched browser and physical-device visual QA.
- No product flow, Figma file, or `.pen` file changed.

## 2026-09-10 — Figma component library C2a

- `Partial`: added `FigmaGlassSurface` with separate captured navigation
  (60% white) and control-group (80% white) presets, a 6 px blur contract,
  0.5 px gradient stroke and radius 200.
- Added `OverlayDimmer` with the exact Frame 140 `#2A2A2A` 50% veil; opacity
  belongs to the color itself and is not compounded by a parent layer.
- Decorative blur and non-interactive dimmer layers are excluded from the
  accessibility tree. Existing `FloatingDock` remains unchanged as the
  navigation-glass acceptance baseline.
- Verification: 247 mobile unit tests, design-token and mobile typecheck, and
  mobile lint pass. The new primitives are not mounted on a screen yet;
  browser background-sampling and physical iOS/Android QA remain in C2.
- No screen composition, product flow, Figma file, or `.pen` file changed.

## 2026-09-10 — Figma component library C1a

- `Partial`: reconciled the shared Expo button and text-field masters against
  local Figma captures `292:5058` and `292:5044`.
- Added the shared 36 px transparent icon-button frame with a 44 px hit target
  and corrected per-icon stroke weights from capture `297:5598`.
- Added the dedicated 38 px `FigmaChoiceChip` selected/unselected master from
  creator works node `621:19943`; static metadata remains in `FigmaChip`.
- Remaining C1 work is replacement of legacy route-local social/icon control
  shells while their owning components are implemented.
- Verification: design-token typecheck, all 239 mobile unit tests, mobile
  typecheck, lint and Expo export for web/iOS/Android pass.
- C1b verification raises the suite to 244 passing mobile unit tests; mobile
  typecheck and lint pass. The new master is not mounted on a screen yet.
- No screen composition or product flow changed in this checkpoint.

## 2026-09-10 — Local Figma handoff integrity and component roadmap

- `Verified`: all 95 supplied capture paths resolve to 79 unique Figma nodes;
  the local library contains the exact same 79 `nodes.json` payloads, 172
  retained rasters and 732 passing checksums.
- `Corrected`: fully deferred search overlays, sold/archive Work states, and
  create-work shipping/buyer-contact/process-story captures are classified as
  `POST_MVP`; the unique source packages remain archived.
- `Planned`: component implementation is split into resumable C1–C8 packages
  in `10-FIGMA-COMPONENT-IMPLEMENTATION-PLAN.md`. Screen composition remains a
  separate workstream.
- Known archive limits: Figma file/version IDs are unavailable in capture
  metadata; 39 captures warn about at least one sub-2× source raster. Those
  files remain reference evidence, not production content.
- No runtime behavior, Figma file, or `.pen` file changed.

## 2026-09-09 — Cover frost, real dock glass, author atmosphere

- `Partial`: work/author cover overlays use `CoverFrost` (blurred artwork slice +
  gradient, not an opaque LinearGradient). Author profile uses `AuthorAtmosphere`
  (485px photo, blur 40, opacity 0.5, scrim). Header chips are `onGlass`.
  Evidence:
  `apps/mobile/src/components/figma/CoverFrost.tsx`,
  `AuthorAtmosphere.tsx`,
  `apps/mobile/src/features/sellers/public-seller-screen.tsx`.
- `Implemented`: `FloatingDock` has the exact Figma `Frame 34` surface contract:
  60% white fill, 6px live background blur, 0.5px gradient stroke, radius 200,
  no drop shadow, 64px height, 36px controls and full-opacity 24px icons. Web
  uses a body portal and native uses `expo-blur` with an Android
  `BlurTargetView`. The MVP dock stays Home / Search / Add / Profile; cart is
  intentionally absent. Evidence: `FloatingDock.tsx`,
  `FloatingDockFrame.web.tsx`, `FloatingDockFrame.tsx`, `AppShell.tsx`,
  `apps/mobile/e2e/figma-glass-dock.spec.ts`.
- Verification: mobile typecheck and all 233 mobile unit tests pass. Expo export
  passes for web, iOS and Android. A Chromium pixel probe confirms `232×64`,
  `blur(6px)`, exact fill/stroke, `box-shadow: none`, and changed pixels when
  blur is disabled.
- Local Expo must rebuild `@bidplace/design-tokens` `dist/` and start Metro with
  `--clear`. `pnpm --filter @bidplace/mobile exec expo start` skips that build.
- `Not implemented`: login as a sheet over the current page; Home opening-of-week
  / auctions (product skip list).
- Figma and `.pen` were not edited.

## 2026-09-09 — Figma phone cutover (`DEC-085`)

- `Implemented`: production shell is a 390 column + `FloatingDock`. Tokens are a
  single Figma layer in `packages/design-tokens`. Public Home / Works / Authors /
  Author / Work, auth chrome, author application (4 screens) and create-work
  (4 screens) use Figma primitives. Search is a stub. Work shows
  `PAYMENT_DELIVERY_STUB`. Home does not render «Открытие недели».
- Evidence: `apps/mobile/src/components/layout/AppShell.tsx`,
  `apps/mobile/src/components/figma/`,
  `apps/mobile/src/features/home/home-screen.tsx`,
  `apps/mobile/src/features/products/product-screen.tsx`,
  `apps/mobile/src/features/sellers/product-draft-wizard.ts`,
  `docs/design/09-FIGMA-CUTOVER-GAPS.md`.
- Checks: `pnpm verify` 2026-09-09; browser Home → Works → Work → Author →
  login at ~390. No `.pen` in the diff.
- `Not implemented`: Figma search overlay, 1024/1440, Geist files, opening-of-week,
  commerce chrome.
- Figma and `.pen` were not edited.

## 2026-09-09 — Figma component library (hidden commerce slots)

- `Partial`: page «Компоненты» from Figma `uMo04w9bgrchWXXDgO4W62` is now a
  shared primitive set under `apps/mobile/src/components/figma/` with values in
  the single `designTokens` export. Icons are Hugeicons stroke-rounded. Buttons, fields,
  chips, work/author covers, author identity and the floating dock exist.
- Commerce price/timer/status on `WorkCoverCard` default to hidden
  (`mode="portfolio"`). Dock has no cart. Google and AI icons are registered
  and unused. Public/author screens render these Figma masters, not Pen
  `AppHeader` / Pen cards.
- Figma named Geist on some card frames; runtime uses bundled Inter until a
  licensed Geist file is added.
- Figma and `.pen` were not modified. Unit coverage is in
  `apps/mobile/src/components/figma/*.spec.ts`.

## 2026-09-09 — Visitor screens reuse existing routes on portfolio data

- `Implemented`: `/product/[publicId]` and `/seller/[slug]` stay the in-app
  visitor URLs. They now load `GET /api/works/:id` and `GET /api/authors/:slug`.
  Auction player, bid CTA, listing status tabs and price sort are not rendered.
  `/works/[publicId]` and `/authors/[slug]` are Redirect-only aliases for RFC
  share paths. No `.pen` or token change. `pnpm verify` passed on 2026-09-09.
- Remaining: Figma search overlay; commerce chrome if `COMMERCE_ENABLED` is later
  true.

## 2026-09-08 — Portfolio-first Figma scope

- `Confirmed`: First MVP is public creator portfolio without commerce (`DEC-082`).
- `Confirmed`: public Creator uses `Работы` / `Об авторе`; public `Архив`, cart, likes
  and notification bell are excluded.
- `Confirmed`: Work creation is photos/title → details → optional plain-text story →
  moderation. Sale, payment/delivery, buyer contact, AI and process blocks are deferred.
- `Confirmed`: Home/Works/Authors/Work keep the approved Figma composition while
  commerce sections, fields and navigation are not rendered.
- `Planned`: file `NM63j9lwRMqpo2HvAiYNll` is the read-only target for the next
  mobile-first implementation. Exact inspect/token/asset handoff remains required.
- `Historical runtime`: current production is still Pen-based and commerce-oriented.
  Neither Figma nor `.pen` was changed by this documentation update.
- Tests were not rerun because runtime behavior did not change.

## 2026-09-06 — Activity cancellation truthfulness

- `Implemented`: existing Activity and Product participation status surfaces
  render `Торги отменены` for a cancelled auction without an Order. A
  cancelled-only Order remains non-navigable. No Pen/Figma redesign.

## 2026-09-05 — Seller Orders inbox

- `Implemented`: current-style `/orders` seller inbox with Activity-like rows,
  loading/empty/error and page fetch. Linked from `/profile` and the account
  menu. Frozen snapshot fields only; no Pen/Figma redesign.

## 2026-09-05 — Order frozen currency display

- `Implemented`: Order detail formats `finalAmount` with the frozen `order.currency` from the deal snapshot. No new layout, Pen node or visual system.

## 2026-09-05 — Rejected Product recovery

- `Implemented`: `ProductDraftScreen` hydrates a `REJECTED` owner detail into
  the same create/edit form, shows the latest moderation reason, and reuses the
  existing `CHANGES_REQUESTED` resubmit action. No new visual system, Pen
  nodes or listing/public routes.
- Remaining: matched Pen overlay, device and accessibility acceptance for the
  Product Creation board are unchanged from the previous Partial/verified split.

## 2026-08-20 — Admin analytics screen

- `Implemented`: admin-only `/admin/analytics` (Expo route `/(admin)/analytics`)
  with KPI overview, acquisition, buyer/seller funnels, marketplace health,
  growth bars, recent activity and needs-attention drilldowns. Linked from
  account menu and moderation. Not a Pen v2 public surface; operational admin UI.

## Текущий результат

- `Implemented`: final Pen v2 review blockers for the shared atmosphere,
  bounded blur overscan, Product About accordion, public creator pagination and
  eligibility-aware auction CTA are now backed by shared runtime code and
  focused tests. Mobile header and SlideToBid runtime primitives are now
  implemented, and Product Creation now has a staged runtime wizard with
  server-backed media/history/review states. Creator Profile Creation and
  moderation workspace are now staged/partial pending full visual acceptance.

- `Implemented`: структура `docs/design/00`–`07` пересобрана с чистого листа
  вокруг нового Pen v2 направления.
- `Implemented`: старая design system в `docs/modern-ui/` выведена из проекта;
  её visual rules и cutover plan больше не действуют.
- `Implemented`: точная локальная копия восстановлена по canonical path; SHA-256
  `685bc2dee4ca643869e678378bf849ab3189c4072b417670df6c64fa6c3181cf`.
- `Implemented`: canonical baseline принят commit `ba3439b`; после него любой
  `.pen` diff запрещён.
- `Confirmed`: `design/pen/bidplace-web-v2.pen` — защищённый визуальный эталон,
  который нельзя менять или удалять во время code work.
- `Verified`: canvas читается в Pen, canonical nodes экспортированы read-only;
  публичная копия доступна по founder-provided Pen URL.
- `Implemented`: reference hierarchy и motion/blur/hover specification внесены
  в `01`, `03`, `05`, `06` и основной аудит `07`.
- `Partial`: production UI перенесён на Pen v2 foundation, header, Browse
  Works, Home, Authors, Search, Product/Auction, Creator Profile, auth
  (login/register/forgot/reset), seller editors и supporting routes. Discovery
  data is server-authoritative, but exact fixed-scale comparison and visual/device
  acceptance are open.
- `Verified`: 1440/1024/390 runtime compositions, Onest/Inter loading,
  responsive overflow, Product URL/back tabs, related public works, focused E2E
  and production Expo exports.
- `Verified`: complete Chromium runtime suite `35/35`, including eight seeded
  catalog products, eight author cards, 1440/1024/390 layouts, loading/error/
  missing-media states, route boundaries and moderation flows.
- `Verified`: the guarded discovery seed now gives all eight public catalog
  cards distinct local main images; the Wave 2 matrix asserts unique image
  sources at 1440/1024/390. Fixture source attribution is recorded outside
  runtime API responses.
- `Verified`: post-implementation API/security audit aligned public Product,
  Bid history, realtime and image visibility; aggregate image limits are
  transactional and bidder aliases are Listing-scoped.
- `Implemented`: admin moderation screen adds **Пользователи** (email lookup, ban/unban, session revoke) and **Восстановление** (needs-order queue, emergency listing cancel) tabs alongside Authors/Works/Orders.
- `Partial`: route/IA для Home, Browse Authors и Search, contracts для
  search/filter/sort/author directory, header/account popover and shared
  controls. Creation story and structured socials are now implemented in the
  API; screen composition and visual acceptance remain open.
- `Implemented`: desktop account popover keyboard-open now moves focus into the
  portaled menu, with Escape returning focus to the trigger; the current header
  follows `Аукционы` / `Авторы` / `Создать` / profile-menu IA. Desktop hover
  dismiss closes after a short grace period only when the pointer leaves both
  trigger and dropdown; hovering nested items (Кабинет, Модерация, Выйти) does
  not count as leaving the menu surface. Full browser execution still needs
  matched Pen screenshots and device verification.
- `Implemented`: Browse Works now consumes server facets for category, author,
  material and uniqueness menus, confirmed price ranges, a separate
  server-backed `Статус` facet, status counts and state tabs; server-side
  sort/query state is URL-backed. The unsupported Pen
  `Тип работы` control remains intentionally omitted because no domain field
  is confirmed. Browse Authors exposes the API-backed activity/name sort
  control. The runtime now matches the measured discovery container at 1440px
  (1360px content width, 40px outer gutter, four 322px cards with 24px gaps),
  while the 1024/390 derived states remain pending screenshot and device
  acceptance.
- `Implemented`: the shared discovery header is contextual on `/authors`: the
  selector is `Авторы`, the direct peer link is `Работы`, and the search
  placeholder is `Найти работу или автора`. Other routes retain the confirmed
  auction context and existing navigation behavior.
- `Implemented`: Product hero now composes the Pen three-column identity,
  natural-ratio artwork and object-facts regions where viewport pressure
  permits; the shared AuctionPlayer is the measured 404×68 compact
  inline/sticky transaction bar, with a verified desktop inline→fixed
  transition after the hero threshold, while the existing bid form and server
  mutation remain the single state owner. Product Creation and Bids now use
  the direct `cK8kD`/`XIzHe` tab compositions: four distinct seeded process images with
  an accessible accordion, server-sorted bids with an explicit leader badge,
  and URL-backed deep links/history. Fixed-scale overlay and device
  acceptance remain pending.
- `Implemented`: `/seller/[slug]` now targets only `MqUMz` (`FINAL — Desktop
Creator / Profile / MVP v1`): centered hero, 120px avatar, handle/copy,
  present structured social links, biography, server-owned status counts and
  work filters, 64px desktop works gutters, and the shared AuctionCard grid.
  `HOXkZ` is not an implementation target. The shared header now uses the
  measured 420 / 480 / 420 desktop zones from `L9UV9`.
- `Implemented`: Creator status controls wrap at narrow widths instead of
  extending document width; Product keeps the same shared bid form in the
  mobile reading flow while the safe-area action remains sticky. Runtime smoke
  passed for Product and Creator at 1440/1024/390. Full Wave C visual/route
  acceptance passes 4/4 across 1440/1024/390; matched Pen overlay review and
  founder/device acceptance remain release gates.
- `Implemented`: Product share is a working public-link action with Web Share,
  clipboard and bounded browser-copy fallback; the result is announced in the
  button label and covered by Product E2E. Discovery facet/sort menus close on
  Escape, outside pointer interaction and accessibility escape, while Creator
  status controls expose a semantic tablist/tabpanel relationship.
- `Implemented`: Product About now has the distinct `О работе`,
  `Характеристики`, `Упаковка` and `Оплата и доставка` accordion anatomy plus
  the public author panel required by `L7ytbv`. Existing `deliveryInfo` is used
  where available; unsupported payment/packaging fields remain honest
  уточняющие states.
- `Implemented`: Creator Profile renders only structured public Telegram,
  Instagram and website fields; the legacy public `socialLink` is no longer
  promoted into a website icon, and E2E covers the absent-structured-social
  state.
- `Implemented`: Product About and Creator Profile now use one shared
  shell-level `AmbientImageBackground` with their public artwork/profile image
  URL, neutral veil, lower fade, safe media fallback and reduced-motion-aware
  fade-in. Product-local blur was removed; runtime checks confirm the shared
  atmosphere is present on both routes. Fixed-scale Pen overlay and
  founder/device acceptance remain release gates.
- `Verified`: local/test seed density now provides eight public works for the
  primary creator profile, with server-owned `2 / 4 / 2` LIVE/SCHEDULED/ENDED
  counts and local thematic media for the two-row Creator Profile composition.
- `Implemented`: the canonical mobile header masters in shared section `h757v`
  now render through `MobileHeader` at widths below 768px. Search open/close,
  menu open/close, outside/Escape dismissal, focus return and role-aware
  Create/Cabinet navigation are implemented; 1440/1024/390 screenshot and
  device/accessibility acceptance remain pending.
- `Partial`: Product Creation board `cK8kD` now maps to the staged
  `ProductDraftScreen` flow for description, images, history, review and
  submit. Owner-detail hydration now preserves creation intro, ordered story
  steps and process-photo metadata across reload/save; exact Pen visual
  comparison, full state screenshots and native picker acceptance remain
  pending.
- `Partial`: the shared mobile menu now uses `min(320px, viewport - 32px)`
  with right-gutter bounds, and Creator Profile fields reuse contract-derived
  Telegram, Instagram, website and handoff validation with field-local errors.
  Targeted regression coverage passes; the full Playwright, visual overlay,
  native-device and screen-reader/keyboard gates remain pending.
- `Partial`: Creator Profile Creation board `JOjIY` now maps to staged public
  identity, structured links, profile photo and private handoff/review states.
  The review intentionally omits private transfer fields; exact Pen comparison
  and device/accessibility acceptance remain pending.
- `Partial`: canonical Pen now includes design-only board `JOjIY` (`FINAL —
  Creator Profile Creation Flow`) with 20 desktop, 9 mobile and 3 tablet states,
  canonical Creator Profile previews, slug and avatar interaction matrices,
  public/private transfer separation and moderation outcomes. Persistent wizard
  previews no longer embed CreatorCard. At ≤767px one reusable compact
  `MobileHeader` shows only the canonical logo plus matching 44px Search, black
  Create (+) and Menu triggers. Search opens a back-trigger + canonical SearchBar
  state; Menu opens a 320px canonical-style dropdown for Auctions, Authors,
  Cabinet and Sign Out, with no duplicated Create or Search. Mobile header/menu
  masters and interaction states live in the dedicated bottom section of
  `FINAL — Shared UI Components`. Tablet/desktop headers are unchanged. No
  frontend/backend implementation or runtime verification has started.
- `Verified`: canonical Pen platform-grid audit aligned Browse Works, Browse
  Authors, Product/Auction, both Creator Profile finals, Product Creation/Bids,
  Product Creation flow and Creator Profile Creation flow to the header's
  Auctions anchor (`x=104`, `width=1232`) using shared Pen layout variables.
  Tablet wizard frames use 48 px and mobile frames use 16 px gutters. Overlay
  and comparison canvases without a platform header remain intentionally scoped
  to their own modal/board coordinate systems.
- `Verified`: all 16 Product Creation and 19 two-column Creator Profile Creation
  desktop states now share centered `WorkspaceLayout` geometry (`1088 = 600 +
  48 + 440`, x=176, top=56). Forms, review, loading, errors, success and
  moderation outcomes keep identical column positions. Three tablet states use
  the centered `928 = 500 + 32 + 396` workspace; nine mobile states remain
  single-column with the approved compact header and collapsible preview.
- `Partial`: canonical Pen now includes design-only board `NRlEW` (`FINAL —
  Admin Moderation Workspace`) with exactly two moderation domains: Authors and
  Works. It contains 23 required desktop, 14 mobile and 4 tablet states, wide
  queue rows without inline decisions, canonical public previews, separated
  private transfer data, centered `800 + 40 + 360` review workspaces, decision
  dialogs/sheets, blocking/conflict/success states and loading/empty/error
  references. Orders are explicitly excluded for future `/admin/orders`.
  Runtime now provides Authors/Works/All queue tabs, search/status filters,
  reasoned decisions and existing order controls; exact visual state coverage
  and device/accessibility acceptance remain pending.

## Screen matrix

| Target           | Pen      | Visual spec       | Data/route                            | Code        | Acceptance             |
| ---------------- | -------- | ----------------- | ------------------------------------- | ----------- | ---------------------- |
| Global Header    | `L9UV9` + `h757v` | measured desktop/tablet and mobile masters | role logic, mobile states and overlays exist | partial | pending visual QA/device QA |
| Home             | `BJd1P`  | exported/readable | `/api/discovery/home`                 | partial     | pending responsive QA  |
| Browse Works     | `H5vf2`  | exported/readable | server query + controls               | partial     | pending responsive QA  |
| Browse Authors   | `N4ebBk` | exported/readable | approved author list API + discipline | partial     | pending visual QA      |
| Product About    | `L7ytbv` | exported/readable | compatible contract                   | implemented | verified               |
| Product Creation | `cK8kD`  | exported/readable | existing fields only                  | implemented | verified               |
| Product Bids     | `XIzHe`  | exported/readable | compatible core fields                | implemented | verified               |
| Creator Profile  | `MqUMz`  | exported/readable | current public links                  | partial     | pending visual/data QA |
| Profile Creation | `JOjIY`  | responsive staged flow | public identity/links + private handoff | partial | pending visual/device QA |
| Admin Moderation | `NRlEW`  | responsive queue/review states | Authors/Works admin contracts | partial | pending visual/device QA |

## Shared component matrix

| Component     | Pen      | Runtime status                                                                  |
| ------------- | -------- | ------------------------------------------------------------------------------- |
| GlobalHeader  | `L9UV9`  | implemented horizontal responsive header                                        |
| AuctionCard   | `k5vYGf` | implemented shared card with media hover and responsive grid                    |
| CreatorCard   | `SrXPq`  | reusable production component uses public discipline; visual acceptance remains |
| AuctionPlayer | `X6Ksg`  | implemented controlled transaction component                                    |
| FilterMenu    | shared discovery controls | implemented shared sort/facet control in `components/layout` |
| ProductTabs   | `Jh9jr`  | keyboard tabs and deep links implemented; browser Back history remains partial  |
| AmbientImageBackground | shared atmosphere | one shell-level image-derived background for Product and Creator; runtime verified |

## Legacy production state

Current Expo UI uses one `designTokens` contract and one `components/ui` layer.
Auth, auction, role, privacy, moderation, media recovery and route behavior
remain protected by tests; runtime code does not replace Pen as visual authority.

## Remaining release gates

1. Keep zero `.pen` diff and verify the canonical checksum after every UI stage.
2. Verify Home/Authors/Search/filter/sort states at 1440/1024/390 and record
   deliberate differences for unsupported H5vf2 controls.
3. Complete founder visual review and physical iOS/Android smoke acceptance.

## Definition of complete

A screen can become code-level `Implemented` only after comparison at
1440/1024/390, loading/empty/error/media states, keyboard/accessibility checks
and affected typecheck/lint/tests/build. Release-level `Accepted` additionally
requires founder/designer and physical-device approval. Documentation-only
mapping or a desktop screenshot is insufficient.

## Product Creation regression verification — 2026-08-13

- `Functional implemented`: creation-story save remains on step 3 so persisted
  steps can receive process photos before the explicit review transition; the
  URL preserves the current step across reload.
- `Automated regression passed`: Product Creation `1/1`, responsive Wave A
  `3/3`, core public route/console Wave One `5/5`, full Chromium `38/38`, and
  Expo production export for web/iOS/Android.
- `Visual compared`: fresh Product and Creator runtime captures were inspected
  at 1440/1024/390 for composition, overflow and responsive action ownership.
- `Needs verification`: formal matched Pen overlay, native-device behavior,
  physical screen-reader QA and founder approval remain open.

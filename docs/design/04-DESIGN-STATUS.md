# bidplace — статус дизайна и UI-реализации

Последнее обновление: 2026-09-23

Общий статус: **Mobile-web 390 Figma public surfaces are Partial; native, desktop, RFC §10 and launch-ready are not claimed**

## 2026-09-24 — Author Cabinet

- `Implemented` (mobile web behavior): approved and suspended Authors use the
  owner-only `/cabinet` route for their Works. Cards distinguish the live public
  Work from an in-progress editing revision, show moderation feedback when it
  is current, and expose edit, hide and restore actions. Empty state, loading,
  retry and incremental page loading use existing primitives and tokens.
- `Unchanged`: public Author/Work visual compositions, dock geometry, native
  and desktop acceptance, and the canonical Pen file.

## 2026-09-23 — Auth return path

- `Implemented` (mobile web behavior): a guest redirected from a protected
  internal route returns to its original pathname and query after Login.
  Unsafe external, data, JavaScript and auth-route targets fall back to Home.
  This changes routing state only; the Auth screens, shared visual primitives,
  tokens and canonical Pen file are unchanged.

## 2026-09-23 — Resumable Author onboarding

- `Implemented` (mobile web behavior): `/profile` uses four URL-owned onboarding
  steps. The server returns the private resume boundary, so malformed or locked
  step URLs clamp safely while earlier unlocked steps remain available. The
  explicit Become Author entry opens an intro dialog; existing drafts resume
  without it. Dirty input is protected from background refetch.
- `Implemented`: Contacts collect only optional public Telegram, Instagram,
  HTTPS website and author-provided email. The public About content renders the
  email only when approved; month-only achievements do not invent a day.
- `Needs verification`: 390px visual/device and full browser flow acceptance.

## 2026-09-22 — Work editor persistence

- `Implemented` (mobile web behavior): Work creation uses three content panels
  plus review: details, main gallery, optional plain-text story, review. The
  editor restores persisted values by id, protects dirty input from background
  refetch, saves before step/in-app route exit, warns on browser unload, and
  persists the exact current form before moderation submit. Save failure keeps
  the author in the editor.
- `Implemented` (scope cleanup): the editor no longer shows packaging,
  delivery, condition, provenance, city, weight or repeated process-media
  blocks. Existing shared form/page primitives and tokens are reused; no new
  visual system or local one-off styling was added.
- Coverage: `product-draft-form.spec.ts`, `product-draft-wizard.spec.ts`, and
  `e2e/product-creation-wizard.spec.ts` cover dirty refetch, step navigation,
  save-before-submit and close/reopen. Product status owner:
  [`../product/11-PROJECT-STATUS.md`](../product/11-PROJECT-STATUS.md).
- `Unchanged`: public Figma surfaces, dock, cabinet, native/desktop acceptance,
  design tokens, and canonical Pen file.

## 2026-09-18 — Global Back flicker

- `Implemented` (mobile web): client-side Back from Work, Author, and
  Search results no longer flashes the outgoing page. Inactive stack
  screens stay laid out and `inert`. Search overlay restores in the same
  paint; dimmer close consumes one history step. Author Search row is
  `[avatar][handle+description]`. Works catalog shows a history-first Back
  after in-app navigation, not on a direct `/works` load. Coverage:
  `e2e/back-navigation-lifecycle.spec.ts`.
  Status owner:
  [`../product/11-PROJECT-STATUS.md`](../product/11-PROJECT-STATUS.md).
- `Unchanged`: FloatingDock geometry, Search header chrome, hover fill
  tokens, Pen file.

## 2026-09-18 — Search overlay

- `Partial` (mobile web): Search is a fullscreen overlay over the current
  public page, not a landing screen. Dock Search opens one history entry on
  the current route (`overlay=search`). Chrome is a white/canvas pill field
  and close with a 0.5px `border`, plus Категории / Авторы / Работы pills
  (Figma `439:4652` / `456:8298` / `456:8392`). Empty query lists the active
  tab; typing live-searches. Back from a result restores tab and query.
  Category tiles use a no-media placeholder: Category has no production
  image and the Figma 9-name taxonomy is not seeded. `/search` is a
  compatibility host for the same overlay; close falls back to Home.
  Coverage: `SearchOverlay.tsx`, `e2e/search-overlay.spec.ts`.
  Status owner:
  [`../product/11-PROJECT-STATUS.md`](../product/11-PROJECT-STATUS.md).
- `Unchanged`: FloatingDock geometry/glass, FilterSheet catalog chrome,
  Works/Authors URL filter contracts, branded page loading/error motion.

## 2026-09-18 — Page loading → error motion lifecycle

- `Implemented` (mobile web): one `InfrastructurePageStatus` instance owns
  blocking loading and infrastructure error. Bounce is 900ms / 16px with a
  rest after squash; pending → error finishes the current CSS iteration, then
  a 520ms double eye blink with accepted error proportions. `motion="glance"`
  exists for later dock use and is not wired. Catalog/Search inline loaders
  stay compact. Status owner:
  [`../product/11-PROJECT-STATUS.md`](../product/11-PROJECT-STATUS.md).
- `Unchanged`: 104px mark, `workTitle` copy, Retry outline large, dock.

## 2026-09-18 — Infrastructure error proportions

- `Implemented` (mobile web): page infrastructure state uses a 104px mark,
  `workTitle` copy, `space.x8` logo→text gap, and a large outline Retry above
  one dock reserve. Chosen over 96 (eyes too small) and 112 (too heavy vs the
  compact message). Status owner:
  [`../product/11-PROJECT-STATUS.md`](../product/11-PROJECT-STATUS.md).
- `Unchanged`: motion, retry ownership, canonical copy, button variant, dock.

## 2026-09-18 — Loading → error visual lifecycle

- `Implemented` (mobile web): blocking page fetch uses
  `InfrastructurePageStatus` and one `AnimatedBidplaceLogo` (`motion`
  `static` | `intro` | `loading` | `error`) at 104px. Loading shows the mark
  only, with a CSS bounce loop. Pending → error finishes the current cycle,
  then a double eye blink and canonical copy + outline Retry. Reduced motion
  keeps a static mark. Inline Search/catalog/tab/form loaders are unchanged.
  Status owner:
  [`../product/11-PROJECT-STATUS.md`](../product/11-PROJECT-STATUS.md).
- `Unchanged`: error policy/copy, retry ownership, PageState empty/not-found,
  SessionAlert.

## 2026-09-17 — Infrastructure error presentation

- `Implemented` (mobile web): page-level infrastructure failures use
  `AnimatedBidplaceLogo` intro at 112px, canonical copy with normal wrapping,
  and a full-width outline retry CTA. Page state is a flex child of `AppShell`
  with dock overlay clearance. Inline nested failures keep copy + outline
  retry only (Search, catalogs, seller works tab, achievements). Public
  `AppShell` does not mount `SessionAlert`. Protected routes own blocking
  session failure. Status owner:
  [`../product/11-PROJECT-STATUS.md`](../product/11-PROJECT-STATUS.md).
- `Unchanged`: PageState / SessionAlert primitives, form validation copy,
  not-found empty states.

## 2026-09-17 — Infrastructure error visual integration

- `Implemented` (mobile web): `InfrastructureErrorState` moved to
  `components/shared/` with `presentation="page" | "inline"`. Page mode is a
  blocking `AppShell` child (Home, Work, Creator, ProtectedRoute, admin/form
  loads). Inline mode is used when chrome stays useful (Search, works/authors
  catalogs, seller works tab, author achievements). Coverage:
  `infrastructure-error-presentation.ts`, `infrastructure-error-state.spec.ts`,
  `figma-error-state.spec.ts`.

## 2026-09-17 — Work/Creator compact navigation glass

- `Partial` (mobile web experiment): compact Work and Creator sticky chrome
  use the same `FigmaGlassSurface preset="navigation"` material as
  FloatingDock, full-width and square (`borderRadius: 0`). Work glass
  follows the existing `StickyDockSurface` activation. Docked tabs are
  transparent. Status owner:
  [`../product/11-PROJECT-STATUS.md`](../product/11-PROJECT-STATUS.md).
- `Unchanged`: Work/Creator sticky physics, Back/Share geometry, dock
  capsule shape.

## 2026-09-17 — Local-only logo intro lab

- `Partial` (lab only): `/dev/logo-motion` is a local experiment for a
  one-shot fall/bounce then pupil glance on a single SVG Bidplace mark
  at 112px. Bounce scales with the wrapper. It is not a production
  loader or Home/dock treatment. Status owner:
  [`../product/11-PROJECT-STATUS.md`](../product/11-PROJECT-STATUS.md).

## 2026-09-17 — Work/Creator tab switch reveals the new panel start

- `Implemented` (mobile web): in-session content-tab switches open the new
  panel from its own start. Status owner:
  [`../product/11-PROJECT-STATUS.md`](../product/11-PROJECT-STATUS.md).

## 2026-09-17 — Share bottom-sheet motion

- `Implemented` (mobile web): Work and Creator Share use the shared bottom
  sheet; it slides in from below, slides out on X, and the backdrop fades.
  Coverage: `e2e/share-sheet-motion.spec.ts`.
- `Unchanged`: sheet chrome, QR, Copy link, centered dialogs, StickyDock.

## 2026-09-17 — StickyDock: shared metrics, persistent Work overlay, Creator park

- `Implemented` (mobile web): Shared `stickyDock.*` (80 / 12 / 48 / 20 / 26 /
  106). Presentational `StickyDockSurface` fills a host owned by each screen.
  Web Work keeps one persistent Back/Share pair; tabs stick at
  `top: stickyDock.actionHeight`; the canvas is
  `surfaceActive = !entry.isIntersecting`. Web Creator parks with measured
  `heroHeight` and `LinearTransition` on `CreatorIdentity`; compact canvas
  follows compact. Coverage: `tokens.ts`, `StickyDockSurface.web.tsx`,
  `WorkHeader.web.tsx`, `CreatorHeader.web.tsx`,
  `e2e/work-header-motion.spec.ts`, `e2e/author-header-motion.spec.ts`.
- `Unchanged`: expanded Work media 520, Creator hysteresis, native Work,
  Figma 186/44.

## 2026-09-16 — Restore expanded Work vertical composition

- `Implemented` (mobile web): Expanded Work rest again uses `sectionGap` 20
  between gallery dots and identity, and `space.x10` 40 between chips and
  tabs. Artwork viewport stays 390×520; dots stay below it. Coverage:
  `WorkHeader.web.tsx`, `WorkHeader.tsx`, `e2e/work-header-motion.spec.ts`.
- `Unchanged`: Creator header, gallery crop, chips/title/tabs typography.

## 2026-09-16 — Creator sticky handoff parks with measured heroHeight

- `Implemented` (mobile web): Creator sticky header is `expanded` / `compact`
  from the measured park `heroHeight - compactStack` with 20px reverse
  hysteresis. CSS sticky parks the header. One `CreatorIdentity` stays
  mounted; compact restyles the same avatar, handle and actions nodes.
  Reanimated `LinearTransition` interpolates that layout change. Tabs stay a
  normal sibling. Coverage: `CreatorHeader.web.tsx`, `CreatorIdentity.tsx`,
  `creator-header-motion.ts`, `e2e/author-header-motion.spec.ts`.
- `Unchanged`: expanded Creator Figma rest layout, native headers,
  Figma 186/44.

## 2026-09-15 — onGlass chips paint a 1px outside gradient ring

- `Implemented` (mobile web): `FigmaChip` `onGlass` uses a masked 1px
  outside `#DEDEDE`→`#F3F3F3` ring (`White border block`). The gradient
  does not fill a plate behind the `rgba(255,255,255,0.80)` surface.
  Work metadata chips `745:21232` pad 6/12 (height 29). Creator profile
  chips `621:19490` keep pad 6/16 (height 35). Coverage:
  `FigmaChip.web.tsx`, `figma-chip-style.ts`, `figma-chip-style.spec.ts`.
- `Unchanged`: Home, quiet buttons, catalog chips, gallery chrome,
  Filter/Sort, native chip border fallback.

## 2026-09-15 — Catalog segment, intro ink, Work back chrome

- `Implemented` (mobile web): `/works` no longer renders leftover
  «Все работы» catalog-segment tabs (`874:5421` / `526:13314`,
  `HIDE_FOR_FIRST_MVP`). Stack is title → intro → Filter/Sort → cards,
  matching `/authors`. Coverage: `product-list-screen.tsx`,
  `product-list-catalog.spec.ts`.
- `Implemented` (mobile web): `/authors` and `/works` intros keep MVP copy
  and use `bodySmall` default ink 14/20/400/−1% `#2A2A2A`
  (`526:12957`, `526:13308`). `textSecondary` `#8A8A8A` is unchanged for
  other `bodySmall`+secondary consumers. Coverage:
  `public-authors-screen.tsx`, `catalog-intro-style.spec.ts`,
  `visual-token.spec.ts`.
- `Implemented` (mobile web): Work gallery inactive dots use
  `color.border` `#DEDEDE` (`745:21219`). Hero chrome is Frame 76
  (`745:21332`) relative to the web hero: 48×48 Back, Like hidden, Share
  kept; no iOS status-bar gap. Coverage: `WorkGallery.tsx`,
  `work-gallery-chrome.ts`, `product-screen.tsx`, `work-page-back.ts`.
- `Unchanged`: Home, creator motion/header, dock/glass blur, Work History,
  `color.divider`, shared glass tokens.

## 2026-09-15 — Author page About tab closer to `621:19475`

- `Implemented` (mobile web): Creator About follows `621:19475` /
  Frame 219 `742:20510`. Atmosphere `621:19476` stays 485 at x −47 inside
  the 390 `AppShell` column (no `100vw` breakout). Inactive tabs use
  `#565656`; profile chips keep glass fill with an outside
  `#DEDEDE`→`#F3F3F3` stroke and pad 6/16; location is city-only;
  achievement dates are `MM.YYYY` 17/24/500 over Frame 221’s 14px ring
  + 2px `#565656` rail. Headings stay 17/600 `#2A2A2A` (not `#565656`).
  Coverage: `CreatorHero.tsx`, `AuthorAtmosphere.tsx`, `AuthorAbout.tsx`,
  `FigmaTabs.web.tsx`, `FigmaChip.web.tsx`.
- `Unchanged`: Home, dock, Works tab grid, public `Архив` stays hidden.

## 2026-09-15 — Shared light quiet button is flat `#EFEFEF`

- `Implemented` (mobile web): `FigmaButton` `quiet` paints flat
  `quietFill` `#EFEFEF` on the control. The `#FFFFFF`→`#999999` @ 0.16
  gradient is a 1px **outside** stroke behind the fill (`439:4419`
  `renderBounds` −1), not a full-size overlay / inset second pill.
  Opening «Смотреть профиль» and New works «Смотреть все» share this.
- `Unchanged`: padding 8/14, radius 28, compact type 13/18/500/−1%,
  Home layout, authors dark `PrimaryButton`, card gradients.

## 2026-09-15 — Home authors fan uses Frame 47 rotation signs

- `Implemented` (mobile web): rear-right `+1deg`, rear-left `-1deg`, origin
  `0 0`. Locked x/y unchanged. Coverage: `home-author-fan.ts`.
- `Unchanged`: photos, Opening, New works, `/authors`, CTA.

## 2026-09-15 — Home authors fan uses Figma top-left rotation

- `Implemented` (mobile web): Frame 47 rear cards rotate around `0px 0px`
  so the 2.45 / 55.6 x values keep ~20px left/right peeks. Front shadow
  stays `0 6px 20px rgba(58,58,58,0.40)` on the 24px shell. CoverFrost
  already darkens toward the bottom; CTA stays `#292929`.
- `Unchanged`: locked x/y/size, photos, Opening, New works, `/authors`.

## 2026-09-15 — Home authors fan silhouette and hover

- `Implemented` (mobile web): Frame 47 fan cards use radius 24 on every
  visual layer. Front shadow sits on a 322×430 / 24px shell with
  `overflow: visible`. Fan `AuthorCoverCard` is `interaction="static"` so
  hover does not scale or square the artwork layer. Coverage:
  `home-new-authors.tsx`, `cover-card-style.ts`, `AuthorCoverCard.tsx`.
- `Unchanged`: Frame 47 positions, `Home.newAuthors` photos, Opening, New
  works, `/authors` radius 28, canonical Pen.

## 2026-09-15 — Home «Новые авторы» Frame 47 fan

- `Implemented` (mobile web): Home authors uses stacked-works Frame `436:1320`
  geometry with `AuthorCoverCard` photos from `Home.newAuthors`. Title
  «Новые авторы». CTA «Смотреть все» → `/authors`. 3/2/1/0 card counts.
  No work price/timer/status. Wrapper does not clip; page stays 390.
- `Unchanged`: Opening, New works horizontal scroller, `/authors` grid,
  canonical Pen, new visual goldens.

## 2026-09-15 — Home «Новые работы» horizontal catalog

- `Implemented` (mobile web): Home «Новые работы» uses the Active-auctions
  `439:4478` header + horizontal scroller, not the previous vertical
  full-width grid. `FigmaButton` `quiet`+`compact` «Смотреть все» → `/works`.
  Cards are existing `WorkCoverCard` (title + `@author`); no auction chrome.
  Stack gap after Opening is `homeSectionStack` 67.
- `Unchanged`: Opening, authors section, stacked Figma «Новые работы»
  prototype, canonical Pen, new visual goldens.

## 2026-09-15 — Opening bio is a one-line muted caption

- `Implemented` (mobile web): Opening `@vex` bio (`439:4415`) is one visual
  line. Seeded `shortDescription` is unchanged. Native uses `numberOfLines={1}`
  / `ellipsizeMode="tail"`. Web uses line-clamp + `pre-line` because RN web
  `numberOfLines={1}` is nowrap and would glue the second phrase into the
  caption. Type stays `authorRowBio` 14/17/400 `#6F6F6F`.
- `Verified` live at 390×860 against first-fold visual `439:4404` / `439:4415`.
- Corrects the previous “unclamped Opening bio” note below.
- `Unchanged`: Opening title, handle, curator note, quiet pill, avatar/work,
  seed/ownership, canonical Pen, visual goldens.

## 2026-09-15 — Home Opening type polish vs `439:4404`

- `Implemented` (mobile web): Opening first-fold type at 390×860 matches
  Inspect for title, `@vex`, curator heading, note, and quiet pill. Inter
  400/500/600 faces are loaded; `font-synthesis: none`. Shared `sectionTitle`
  is unchanged (Opening title matches other Home headings). Author row hugs
  auto-layout `439:4411` instead of a 68px lock.
- Bio line behavior: superseded by the one-line caption note above.
- `Verified` live at 390×860 against `uMo04w9bgrchWXXDgO4W62` / `439:4404`.
- `Unchanged`: Active auctions / New works, work-card overlay, seed/ownership,
  canonical Pen, new visual goldens.

## 2026-09-15 — Phone gallery arrows, achievement photos, History media

- `Implemented` (mobile web): Work gallery prev/next stay in `WorkGallery`
  but are hidden at phone width (390). Swipe, dots and share remain.
- `Implemented`: Author About achievement cards render date → image →
  description when seed supplies image bytes. Grey text-only fallback remains
  for authors without photos.
- `Implemented`: Work `История` renders story paragraphs interleaved with
  non-cover gallery images. Not a process-builder UI.
- `Verified` at 390 on the live stand after reseed (this slice).
- `Unchanged`: Opening typography, Home pixel pass, Active auctions / New
  works, canonical Pen, new visual goldens.

## 2026-09-15 — Production-quality demo catalog copy

- `Implemented` (data only): public profiles and works use production-quality
  copy; Opening curator/work/owner binding is unchanged. Typography, Home
  scroller and pixel Opening stay out of this slice.
- `Unchanged`: canonical Pen, quiet pill tokens, first-fold golden.

## 2026-09-14 — Figma local seed identity for Opening

- `Implemented` (data binding only): Opening left column and profile button use
  `selection.curator`; work-card chip uses `selection.work.author`. Local seed
  is the Figma catalog (`vex` curator, Dali work owned by `pixelp`). Typography,
  spacing, WorkCoverCard overlay and pixel-tolerance stay out of this slice.
- `Unchanged`: canonical Pen, quiet pill tokens, first-fold golden
  `e2e/visual/references/home-opening-figma-390.png`.

## 2026-09-14 — Home Opening curator note and quiet pill

- `Implemented` (mobile web): Opening left column follows first-fold
  `439:4404` (390×860): handle `439:4414`, bio `439:4415`, «Выбор куратора»
  `439:4417` + note `439:4418` when `note` is present, quiet hug pill
  `439:4419`/`439:4420`. New tokens: `textSubtle`, `quietFill`,
  `quietBorderStart`/`End`, `authorRowHandle`, `authorRowBio`,
  `editorialTitle`, `editorial`, `typography.buttonCompact`. `FigmaButton`
  variant `quiet` size `compact` hugs padding 8/14; not 149×34; not `muted`
  or global `outline`.
- `Verified`: first-fold Opening is matched in the live HomeScreen at 390×860
  with the `@vex` network fixture. Horizontal Opening row is constrained to the
  phone column so `AppShell` centering cannot shift the left column off-canvas.
  Opening work photo uses the unclipped 3:4 Figma fill (`264×352` / `528×704`),
  so `WorkCoverCard` `cover` fills the rounded card instead of zooming the
  clipped 86px first-fold strip. Work overlay copy and «Активные торги» stay
  out of this slice.
- `Unchanged`: WorkCoverCard overlay, dock, discovery. Canonical Pen file
  was not touched.

## 2026-09-14 — Share sheet host is an explicit column flex

- `Implemented` (mobile web): `AppDialog` sheet presentation sets
  `flexDirection: 'column'` and the web portal host defaults to the same
  axis, so `flex-end` is vertical. Matches Figma `597:19045` bottom-sheet
  chrome (20px top radii). Dialog presentation stays centered.
- `Verified` at 390: `#app-dialog-host` computed `flex-direction: column`,
  `#app-dialog-content` bottom at the viewport edge. Evidence:
  `app-dialog-host-style.ts`, `app-dialog-layer.web.tsx`, `AppDialog.tsx`,
  `figma-stabilization.spec.ts`.
- `Unchanged`: dock, Home, discovery, author header motion. Canonical Pen
  file was not touched.

## 2026-09-14 — PR C admin chrome after commerce runtime removal

- `Implemented`: admin moderation tabs are authors / works / users.
  `AdminRecoveryPanel` and the Recovery tab are gone. Admin analytics is
  users/authors/works/acquisition/stuck moderation; marketplace bid/order
  widgets are gone. Not a Pen public surface.
- `Unchanged`: public 390 Figma Home/Works/Authors/Search/ShareSheet/dock.
  Canonical Pen file was not touched.

## 2026-09-14 — Mobile-web correction

- `Implemented` (mobile web only): public session retry is an in-flow Yoga
  `View` with `accessibilityRole="alert"` in AppShell, not a fullscreen overlay.
  Compact author-header `visibility` stays CSS layout-preserving on web via a
  platform helper.
- `Unchanged`: 232×64 dock, Home, discovery/search/filters, ShareSheet,
  cards/frost, CreatorHeader.web motion. OverlayHost, dialogs and image pickers
  were not rewritten for the session banner.
- `Not claimed`: Founder Accepted, launch-ready, desktop/tablet/native UI.

## 2026-09-14 — Mobile-web preservation (mobile web only)

- `Implemented`: city + revision application, achievement images in About,
  AdminRecoveryPanel while commerce runtime is loaded, shared `danger`
  button, dock `navigation` / links / `aria-current`, restored
  `media-resilience` in the maintained gate. Auth session error stays on
  `ProtectedRoute`. Dock remains 232×64.
- `Verified` (this branch, this run): maintained `test:e2e` Chromium `41/41`;
  `test:e2e:stabilization` Chromium+WebKit `38/38`. Not founder Accepted or
  launch-ready. Absence of desktop/native is not a remaining defect.
- `Unchanged`: author header motion, Home `curatorSelection`, ShareSheet,
  Works/Authors/Search URL state, cover frost, FigmaTabs typography.

## 2026-09-14 — Mobile-web 390 Figma cutover

- `Implemented` (mobile-web 390 only): Figma tokens and shared primitives,
  `AppShell`, `DEC-088` 232×64 four-item glass dock, deletion of auction /
  listing / order / activity chrome, cover cards with web frost, public Author /
  Work / Home, web compact author header motion, ShareSheet plus `/works` and
  `/authors` aliases, S4 auth composition, S7 filter masters, URL-owned Works /
  Authors / Search with server facets and pagination, and web tab
  label/count typography.
- `Verified` (this branch): not re-used as current evidence. `test:e2e` is the
  maintained mobile-web Playwright gate; `test:e2e:stabilization` is the 38
  visual Chromium+WebKit suite. This gate does not accept native or 1024/1440.
- `Partial`: Figma registration-complete frame has no runtime state because
  login redirects immediately. Author About is not URL-owned. RFC §6 brief
  facts stay unresolved; cards remain title + `@author`.
- `Needs verification` / out of scope: native frost, native compact header,
  native ShareSheet QR, 1024/1440 compositions, RFC §10 create-work, author
  application visual rewrite, and founder Accepted / launch-ready.
- Create-work, author application and admin screens stay on the PR A
  implementations except compile/navigation chrome required by the new shell.
- `.pen`, Figma handoff rasters and QA binaries are not part of this runtime
  branch.

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
| Profile Creation | `JOjIY`  | responsive staged flow | four-step resumable author draft: identity, contacts, about, achievements | partial | pending visual/device QA |
| Admin Moderation | `NRlEW`  | responsive queue/review states | Authors/Works admin contracts | partial | pending visual/device QA |

## Shared component matrix

| Component     | Pen      | Runtime status                                                                  |
| ------------- | -------- | ------------------------------------------------------------------------------- |
| GlobalHeader  | `L9UV9`  | implemented horizontal responsive header                                        |
| AuctionCard   | `k5vYGf` | implemented shared card with media hover and responsive grid                    |
| CreatorCard   | `SrXPq`  | reusable production component uses public discipline; visual acceptance remains |
| AuctionPlayer | `X6Ksg`  | implemented controlled transaction component                                    |
| FilterMenu    | shared discovery controls | implemented shared sort/facet control in `components/layout` |
| ProductTabs   | `Jh9jr`  | implemented keyboard tabs with deep-link/back history                           |
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

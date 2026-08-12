# bidplace — текущий статус проекта

Последнее обновление: 2026-08-12
Статус: Public discovery completion is Partial; trust-critical backend
boundaries remain Implemented; founder visual/device/screen-reader acceptance,
full metadata migration and isolated 10-user rehearsal remain Needs
verification.

## Canonical Pen v2 design direction — 2026-08-10

- `Implemented` as documentation: `docs/design/00`–`07` is rebuilt as the
  canonical Pen-led design module. The former `docs/modern-ui/` design system
  and the old screen-prompt workflow are retired and removed.
- `Confirmed`: `design/pen/bidplace-web-v2.pen` is the immutable visual
  reference for UI implementation. Code work must never edit, delete, rename,
  move, replace, format, or resave it; only a separately authorized design task
  may change it, and it must never be deleted. See `DEC-062`.
- `Implemented` as protected source restoration: the founder-provided local
  file is restored byte-for-byte at `design/pen/bidplace-web-v2.pen`; SHA-256 is
  `03798831d76992080d4edebf53c4c264f8f9754e01bbe81965083f271148d2a9`.
  Canonical roots and the public read-only Pen publication were verified without
  modifying the canvas.
- `Implemented` as specification: selected Foundation/Gamma/Avant Arte patterns,
  card hover, button/menu/tab/sticky motion, artwork-derived blur/atmosphere and
  reduced-motion rules are recorded in design docs. These references do not add
  wallet/NFT/crypto or unsupported marketplace behavior.
- `Partial`: production UI uses Pen v2 foundation for GlobalHeader, Browse
  Works, Product states, Creator Profile, auth, seller editors and supporting
  routes. Public Home, Authors and Search routes now exist; matched visual,
  device and screen-reader acceptance remain open.
- `Partial`: Home/Works routing, Authors directory/API and discovery
  search/filter/sort contracts are implemented in `apps/api/src/discovery`,
  the Product/Seller services and the corresponding mobile routes. Creation
  process data and structured public social links are implemented and projected;
  matched visual/device acceptance remains open. `SellerProfile.discipline` is
  persisted and projected for public CreatorCard/profile surfaces.
- `Verified`: semantic tokens, Onest/Inter runtime loading, 1440/1024/390
  compositions, focused accessibility behavior, Product deep-link/back tabs,
  related public works, E2E and production Expo export. Founder/device visual
  acceptance remains a release gate.
- `Verified`: local/test discovery seed imagery covers eight distinct public
  catalog cards, with source attribution in
  `packages/database/prisma/fixtures/README.md`; the browser matrix confirms
  distinct main image sources without runtime dependence on external URLs.

## Pen v2 content and public-profile contracts — 2026-08-11

- `Implemented`: public Creator Profile detail now returns server-owned
  `statusCounts` for the visible `LIVE`/`SCHEDULED`/`ENDED` listings through
  `packages/contracts/src/public-seller.ts` and
  `apps/api/src/sellers/sellers.service.ts`; the profile UI renders those
  counts without exposing private seller or bidder data. API unit, contract,
  and seeded browser checks pass. Founder visual/device/screen-reader
  acceptance remains a separate release gate.

- `Implemented`: Product image contracts now carry nullable `width`/`height`,
  and `ProductCreationStep` stores validated process text plus optional image
  metadata/data behind the migration
  `packages/database/prisma/migrations/20260811010000_add_pen_v2_content_data`.
  Public Product detail returns `creationIntro` and ordered `creationSteps`
  with image URLs only; binary data remains outside JSON responses.
- `Implemented`: seller profiles persist structured nullable
  `telegramUrl`/`instagramUrl`/`websiteUrl` fields and public author detail
  returns only those public links plus paginated server-side works. Existing
  handoff contact and email fields remain private.
- `Implemented`: public catalog responses expose server-computed discovery
  facets for listing status, category, author, material and uniqueness, with
  confirmed price ranges carried through the URL-backed query contract.
  Product and creator work queries are filtered, sorted and paginated in the
  API rather than derived from a client page slice.
- `Implemented`: owner-only creation-story replace/reorder and creation-step
  image upload/read routes enforce approved-seller, editable-product and
  public-visibility boundaries in `apps/api/src/products` and
  `apps/api/src/images`; contract, API unit and PostgreSQL integration checks
  remain required evidence for the final visual release.
- `Partial`: Pen v2 screen composition is implemented through the shared shell;
  matched visual/runtime acceptance at 1440/1024/390 remains open. The canonical file
  `design/pen/bidplace-web-v2.pen` is locked at SHA-256
  `03798831d76992080d4edebf53c4c264f8f9754e01bbe81965083f271148d2a9`.
- `Implemented`: Browse Works and Browse Authors now use the shared Pen v2
  header/card primitives and server-backed category/material/status/sort state;
  the Works toolbar exposes a separate URL-backed `Статус` facet while the
  state tabs use the same source of truth. The Authors header context is
  `Авторы` / `Работы` with the cross-discovery search placeholder. Exact visual parity and
  responsive/device acceptance remain `Needs verification`.
- `Implemented`: Product hero uses the Pen three-region layout at desktop
  pressure, the compact AuctionPlayer keeps one bid mutation owner, and the
  Creation tab renders ordered API-backed intro/steps with safe process-image
  URLs. Bid validation, role restrictions and privacy behavior remain covered
  by the existing Product/Auction contracts and tests.
- `Verified`: the guarded Creation seed supplies four distinct process-image
  sources, and Product detail moves the same controlled AuctionPlayer between
  inline and fixed desktop placement after the hero scroll threshold. Product
  E2E covers the transition and restoration without changing bid ownership.
- `Implemented`: Public creator profile `/seller/[slug]` uses only the founder
  selected `MqUMz` frame, renders structured public links when present, and
  fetches status/sort/paginated works server-side. Private handoff contacts and
  user email remain outside the public projection.
- `Implemented`: the Product mobile reading flow keeps the shared validated bid
  form available alongside the sticky bottom action; the same mutation owner
  is used at desktop and mobile breakpoints. Creator status controls wrap at
  390px without horizontal document overflow.
- `Implemented`: the public Product share control now copies or shares the
  current Product URL with bounded Web/native fallbacks and visible result
  state. Discovery menus close through Escape/outside interaction, and Creator
  status controls expose semantic tablist/tabpanel relationships; mobile
  typecheck/lint and Product E2E pass.
- `Implemented`: Product About composes the canonical text, characteristics,
  packaging, payment/delivery and author sections from existing public Product
  and SellerProfile fields, with explicit honest states for unsupported details;
  Product layout E2E asserts the required anatomy.

## Public discovery WIP — 2026-08-11

- `Implemented`: `packages/contracts/src/discovery.ts` defines normalized
  public query input/output, status, material, price/year and server sort
  contracts; contract tests cover defaults, trimming, unknown keys, length and
  invalid ranges.
- `Implemented`: `GET /api/discovery/home` returns separate top-auction,
  creator and new-work projections. Product and seller list services select the
  canonical public Listing before server-side filtering, sorting and
  pagination; the client no longer derives Home rankings from a page slice.
- `Partial`: `/`, `/works`, `/authors` and `/search` consume real API data and
  expose loading, empty and retry states. URL-backed Works status/sort controls,
  account popover and bottom-start discovery geometry are implemented, but
  matched 1440/1024/390 screenshots, physical-device QA and full accessibility
  acceptance remain open.
- `Implemented`: `CreatorCard` now follows the Pen anatomy by removing the
  outer card surface, CTA and unsupported work count. `SellerProfile.discipline`
  is persisted through the `20260811000000_add_creator_discipline` migration
  and returned by public/profile contracts; visual acceptance remains open.
- `Implemented`: local SMTP configuration accepts explicit `SMTP_AUTH_MODE`
  (`none` or `login`), treats empty local relay credentials as absent, omits
  Nodemailer auth in `none` mode, requires an explicit production auth mode and
  keeps production TLS/credential checks.
  Coverage is in `apps/api/src/core/config/env.spec.ts` and
  `apps/api/src/otp/otp.service.spec.ts`.
- `Implemented`: public Product discovery now selects canonical listing rows and
  applies filtering, ranking, count and `LIMIT/OFFSET` in PostgreSQL before
  hydrating the requested page. Catalog hydration uses explicit projections and
  does not select `ProductImage.data`; `endingSoon` ranks LIVE/SCHEDULED before
  ENDED and `newest` uses `publishedAt`.
- `Implemented`: `/api/sellers` now accepts only its supported `q`, pagination
  and `activity`/`name` sort contract. Discipline writes and responses share a
  `.max(160)` contract matching the database column.
- `Implemented`: desktop account-menu keyboard open moves focus to Cabinet (or
  Logout when Cabinet is unavailable); navigation and discovery Playwright
  expectations now use the current IA and `/api/discovery/home` interception.
- `Verified`: guarded local/test demo data now provides eight public products
  across scheduled/live/ended states, multiple author/price/uniqueness
  values, and eight approved creators with local thematic PNG media. Full
  Chromium E2E passes `35/35`; mobile unit,
  typecheck, lint and E2E fence also pass. Founder visual/device and
  screen-reader acceptance remain release gates.
- `Verified`: PostgreSQL integration `39/39`, full Chromium E2E `35/35`, mobile
  unit/typecheck/lint and E2E fence pass on the disposable local test database.

## Pen v2 completion and backend/security audit — 2026-08-10

- `Implemented`: Product tabs now use URL state (`about`, `creation`, `bids`)
  with deep links and browser-back restoration; semantic selected state is
  explicit. Product About reuses a shared `AuctionCardGrid` for real public
  works from the same author and never invents recommendation ranking.
- `Implemented`: public Bid history, Product images and realtime Listing joins
  now share the approved Product + approved SellerProfile visibility boundary.
  Non-public media is not marked with public immutable caching.
- `Implemented`: Product image count and aggregate-byte limits are enforced
  inside a serializable transaction across repeated/concurrent uploads, not
  only per multipart request.
- `Implemented`: public bidder aliases are deterministic within one Listing and
  differ between Listings; public UI no longer exposes or reuses a `userId`
  prefix. Duplicate SellerProfile/slug races map to a stable conflict response.
- `Verified`: monorepo typecheck 7/7, lint 2/2, contracts 7/7, API unit 145/145,
  mobile unit 113/113, PostgreSQL integration 39/39, Chromium Playwright 35/35,
  E2E fence and production build 7/7 including web/iOS/Android export.

## Test/demo author media — 2026-08-05

- `Implemented`: the local/test-only seed now uses the supplied 740×493 PNG for the approved demo author `Анна Морозова` (`anna-morozova`); anonymous `GET /api/sellers/:slug/photo` is intentionally allowed for approved public profiles, and the seeded Chromium test verifies both the direct guest HTTP response and the rendered natural dimensions. Existing databases must be re-seeded explicitly to replace the former transparent 1×1 row. Pending moderation fixtures continue using the technical 1×1 placeholder.

## Resilient remote media — 2026-08-05

- `Implemented`: `apps/mobile/src/components/ui/ResilientRemoteImage.tsx` centralizes public and seller/admin remote-image loading. It shows the existing layout-preserving placeholder on failure, retries at 1/3/8 seconds with a bounded three-retry schedule, changes the request URL/key for each retry, resets on successful load or URL change, and exposes a final `Повторить` action after the automatic retry budget is exhausted. Local `ImagePicker` previews remain outside this network retry path.
- `Implemented`: `apps/mobile/src/components/ui/media-recovery.ts` owns the retry state machine, cache-bust URL construction and query-string-free diagnostic sanitization. Development failures emit structured `media_load_failed` records without cookies, tokens or other URL query credentials.
- `Implemented`: AuctionCard, ProductGallery, public AuthorPhoto, admin Product media and remote seller/Product-draft previews use the shared component. `apps/mobile/e2e/media-resilience.spec.ts` covers first guest opening, aborted media fallback and sanitized diagnostic logs; the state-machine suite covers bounded retries, success, URL reset, cache-bust behavior and manual recovery.
- `Verified`: mobile typecheck/lint, media recovery unit 5/5 and targeted Chromium media resilience 2/2 passed on 2026-08-05. The API media terminal `@Res()` fix remains separate and unchanged.

## Wave 1 — trust-critical Order flows and test-only seed boundary — 2026-08-05

- `Implemented`: `apps/api/src/orders/orders.service.ts` and the existing controllers now enforce actor roles at the service boundary. Seller `contacted`, `completed` and `handoff-failed` transitions retain the existing statuses and payloads, while terminal repeats are rejected without a second audit event.
- `Implemented`: `apps/api/test/integration/order-mutations.integration.spec.ts` and `order-replacement.integration.spec.ts` run isolated PostgreSQL fixtures through the public OrdersService boundary. They cover allowed/forbidden seller, buyer, outsider and admin actors, cancellation reasons, terminal/repeated calls, privacy/contact snapshots, ranked Bid replacement, original Order history, append-only audit actor/status/reason/timestamp fields and the one-active-Order invariant.
- `Implemented`: `apps/mobile/e2e/order-handoff.spec.ts` uses the existing seller Order route and action, then reads the authenticated API projection to verify the persisted `CONTACTED` status. No UI route or product behavior was added.
- `Implemented`: `packages/database/prisma/seed.js` fails closed unless `NODE_ENV` is `development` or `test`, `APP_ENV=local` and `ALLOW_DESTRUCTIVE_DEMO_SEED=true`. `apps/api/test/integration/seed-contract.integration.spec.ts` executes the seed against a temporary PostgreSQL schema and verifies Bid count, current prices, counters, winner, buyer identity, one Order and production-like denial with no writes. `DEC-060` is Confirmed; demo Bids remain local/test-only and must be removed or replaced before real MVP release.
- `Verified`: API unit 136/136, contracts 7/7, PostgreSQL integration 20/20, API/mobile lint, API/database/mobile typecheck and Chromium Playwright 29/29 passed on 2026-08-05.

## Wave 2 — auction integrity: stale bid, scheduled bid, soft close — 2026-08-05

- `Implemented`: `apps/api/test/integration/auction-integrity.integration.spec.ts` exercises the ordinary buyer `BidsService` boundary against isolated PostgreSQL fixtures. It proves that a `SCHEDULED` Listing rejects a direct Bid without changing Listing timestamps, price, count, Bid history, audit state or realtime emission.
- `Implemented`: the same PostgreSQL suite creates one canonical snapshot for two buyers, accepts Buyer A's higher Bid, rejects Buyer B's stale minimum with the canonical server minimum, accepts the refetched retry, verifies two-Bid history, current price, count, winner Order and idempotent replay, and proves rejected writes leave persisted state unchanged.
- `Implemented`: PostgreSQL coverage proves the soft-close window is exclusive outside 60 seconds and inclusive at 60 seconds, persists each extension with the accepted Bid, supports the next Bid against the extended deadline, caps total extension at 600 seconds from `originalEndsAt`, rejects the cap boundary without writes, and closes only after the persisted extended deadline.
- `Implemented`: `apps/mobile/e2e/auction-integrity.spec.ts` proves the real Chromium reject → refetch → retry flow through the existing buyer UI and API. The test uses two ordinary verified buyers, confirms the stale attempt, observes the server error and canonical `11.50 BYN` minimum, retries successfully, and verifies API current price, bid count and history. Realtime is isolated only in Buyer B's test context so the initial snapshot remains genuinely stale; no production UI or contract change was made.
- `Verified`: API unit 136/136, API PostgreSQL integration 25/25, API/mobile lint, API/mobile typecheck and targeted Chromium Playwright 1/1 passed on 2026-08-05. No confirmed MVP rule or architecture boundary was changed.

## Wave 3 — core permission, moderation and lifecycle coverage — 2026-08-05

- `Implemented`: `apps/api/test/integration/seller-permissions.integration.spec.ts` runs real HTTP requests through the Nest app, session cookie, `BearerAuthGuard`, controllers, capability checks and PostgreSQL. Guest, ordinary buyer, pending/changes-requested/suspended owners, approved owner and another approved seller are covered for Product, Listing, ProductImage and SellerProfile writes, including denied Listing `PATCH` and image `DELETE`; pending/changes-requested/suspended cases target their own fixture Listing and ProductImage so the status gate is exercised before any ownership ambiguity. Denied paths compare persisted Product, Listing, ProductImage, SellerProfile and AuditEvent state before and after.
- `Implemented`: `apps/api/test/integration/moderation.integration.spec.ts` proves normalized seller application persistence and the existing admin SellerProfile/Product state machines, including SellerProfile `REJECTED`, Product `REJECTED`, accepted Product `ARCHIVED` and active-listing archive lock denial. Accepted transitions persist actor, old/new status, required reason and exactly one append-only AuditEvent; repeated, reasonless and scheduled/live-listing-blocked transitions leave persisted state unchanged.
- `Implemented`: `apps/api/test/integration/auth-transport.integration.spec.ts` proves HTTP registration normalization, session cookie and `/auth/me`, duplicate no-write behavior, allowed-origin login, HttpOnly/SameSite/Path/TTL cookie attributes, logout cookie clearing and session-version invalidation, stale/invalid session rejection and allowed/forbidden CORS response behavior. `apps/api/src/bootstrap.ts` is the shared HTTP configuration used by production `main.ts` and the integration helper, so CORS/proxy tests use the production bootstrap path.
- `Implemented`: `apps/api/test/integration/lifecycle-close.integration.spec.ts` proves no-bid close without winner/Order, canonical equal-amount/equal-timestamp tie ordering, aligned persisted Order/realtime event state and idempotent repeated close.
- `Verified`: API typecheck/lint, unit 136/136, PostgreSQL integration 37/37, mobile typecheck/lint, relevant Chromium Wave 3 5/5, full Chromium E2E 30/30 and `git diff --check` passed on 2026-08-05. No production product rule, status machine, API contract, UI or seed behavior changed.

## Runtime media and moderation hardening — 2026-08-05

- `Implemented`: `apps/api/src/images/images.controller.ts` and `apps/api/src/sellers/sellers.controller.ts` use terminal `@Res()` handling for manual binary responses. `apps/api/test/integration/media-transport.integration.spec.ts` requests an approved Product image and public SellerProfile photo anonymously, verifies `200`, `image/png` and exact bytes, then makes another API request after each response to cover the server lifecycle after media delivery.
- `Implemented`: `apps/mobile/src/features/admin/admin-moderation-screen.tsx` disables Product approval until the related SellerProfile is `APPROVED`, shows `Сначала одобрите автора`, refreshes both moderation queues after SellerProfile approval, and reports Product mutation errors according to the actual action. A new action clears the previous error state.
- `Implemented`: `apps/mobile/src/components/ui/AppDialog.tsx` expresses `pointerEvents` through the style object, removing the web warning without changing dialog behavior.
- `Verified`: API unit 136/136, PostgreSQL integration 38/38, mobile typecheck/lint, and the relevant Chromium moderation scenario 5/5 passed on 2026-08-05. No product rule, API contract, seed behavior or architecture boundary changed.

## Wave A — structural responsive fixes — 2026-08-02

- `Implemented`: A1 centralizes the confirmed responsive contracts in `packages/design-tokens/src/modern.ts`: desktop shell `1025`, catalog columns `900`/`1440`, rail width `72`, product portrait ratio `4/5` and the existing product detail measure `1180`. `AppShell`, `AppHeader`, Catalog and Product consumers use these shared values; `catalog-layout.spec.ts` covers 899/900/1024/1025/1439/1440 boundaries.
- `Partial`: A2 now portals the web account menu at every viewport, clamps its bottom-end geometry to an 8px viewport inset, returns focus to the trigger on Escape, and gives dialogs modal layer 30 with viewport-bounded internal scrolling. Unit/static evidence and browser coverage pass; physical-device and accessibility acceptance remain pending.
- `Implemented`: A3 now uses one catalog grid wrapper for loading and loaded cards, shared 4:5 media geometry for loaded/fallback/skeleton states, and separate atomic price and status/deadline rows. Unit, full static, Expo export, target-width screenshot/bounding-box and browser coverage pass; founder/device/accessibility acceptance remains pending.
- `Implemented`: A4 uses the requested product-wide contract at `900px`: the gallery switches to `440×550`, the author/title/auction block becomes two-column from that boundary, and below it the amount input stays in the scrollable auction panel while the bottom action contains only a short summary and one compact primary action with safe-area padding. Buyer/admin responsive E2E coverage preserves the existing server-side bid restrictions; first-viewport bounds and buyer/admin screenshots are captured at 1440/1024/390.
- `Implemented`: A5 uses compact `44px` buttons with `14px` radius, Inter `500/13/18` navigation typography, equal-width icon-over-label mobile navigation cells, `navigation` semantics instead of tablist semantics, and keyboard-scrollable auth viewports. Responsive browser coverage includes validation errors, enlarged-scale CTA reachability and auth evidence; founder visual/device/accessibility acceptance remains pending. No Wave B/C work is included.

## Wave B — shared component and visual-system fixes — 2026-08-02

- `Implemented`: B1 canonical semantic token surface and contrast roles are in `packages/design-tokens/src/modern.ts`; `AppText`, `TextField`, and the mobile runtime consume the modern surface. Verification: design-tokens build passed and `visual-token.spec.ts` passed 7 tests, including destructive button text on the danger surface.
- `Implemented`: B2 shared focus-visible/reduced-motion contracts, 44px logo/author hit areas, and single-name composite image/icon semantics are in the mobile shared primitives. Mobile typecheck/lint passed; the targeted B2 suite passed 16 tests.
- `Implemented`: B3 shared buttons retain 56px default/44px compact geometry; text-only labels are centered without an idle icon gap, and loading uses an invisible sizing layer plus absolute spinner. Updated button unit and browser centering/width coverage passes; mobile typecheck/lint passed.
- `Implemented`: B4 centralizes the 4:5 media contract and narrow AuctionCard metadata geometry, and adds a reusable plain EditorialSection without changing Product order or auction flow. Targeted media/card coverage passed 11 tests; mobile typecheck/lint passed.
- `Implemented`: B5 PageState separates loading/empty/error/retry and is now used by ProductDraft, ListingDraft and Order route-level loading branches; AppDialog preserves modal layer, bounded scroll, and accessibility semantics, including focus return on cancel/Escape. Targeted state coverage passed 9 tests; route-level browser evidence passes for all three loading branches.
- `Implemented`: B6 localized seller/admin/order presentation paths and date-time normalization live in `apps/mobile/src/lib/presentation.ts`; `SelectableRow` preserves raw API values while presenting 44px localized choices. Adapter coverage passed 12 tests; mobile typecheck/lint passed.
- `Implemented`: final Wave B evidence includes 13 Vitest files / 58 tests and 24/24 disposable PostgreSQL Playwright tests; 21 target-width screenshots are in `/private/tmp/bidplace-wave-b-screenshots`.
- `Partial`: the overall product status remains Partial until founder physical-device, screen-reader, and visual acceptance is recorded.

## Wave C — screen polish and final visual acceptance — 2026-08-03

- `Implemented`: C1 catalog polish preserves the no-heading catalog, confirmed 2/3/4 columns, shared 4:5 bounds and separate price/status-deadline rows. Loading/loaded/failed-media evidence is in the C7 targeted spec.
- `Implemented`: C2 Product detail uses `EditorialSection` for linear story/history/bids and keeps `AuctionPanel` as the only transaction block. `BottomActionBar` remains summary + CTA; bid validation, OTP/rules, realtime, privacy and API contracts are unchanged.
- `Implemented`: C3 public author and purchases use 120px identity fallback, shared responsive AuctionCard grid and divider-led activity rows with existing role-safe data.
- `Implemented`: C4 seller/profile/draft screens use capped previews, 160×200 contain media rows, truthful failed-media states and strict calendar/time validation for readable listing date input with existing ISO serialization and server lock/upload/delete/reorder behavior.
- `Implemented`: C5 admin/order presentation uses two desktop queues within 1180px, compact moderation row actions, author text links, localized order cancellation reason and long-value-safe rows without changing permissions or lifecycle rules.
- `Implemented`: C6 auth copy and shared PageState/Skeleton loading semantics cover truthful registration, one loading announcement, plain-language retry errors and keyboard/zoom-compatible existing forms.
- `Implemented`: C7 targeted `apps/mobile/e2e/wave-c-screen-acceptance.spec.ts` passed 4/4 and the full repository `mobile test:e2e` passed 28/28 with Docker PostgreSQL; 66 commit-stamped screenshots are in `/private/tmp/bidplace-wave-c-screenshots/a852f68` across the 1440×900, 1024×900 and 390×844 route/role/state matrix, including catalog roles, author empty/error, long activity rows and responsive overlay states. Final founder physical-device/screen-reader acceptance remains the remaining gate.

## Runtime defect hardening — 2026-07-31

- `Implemented`: `OverlayHost` now supplies the web overlay boundary through a memoized callback ref; `OverlayPortal` waits for both the boundary and anchor rectangle, and navigation/account anchors use ref-supporting `View` wrappers. Web pointer-events are expressed through styles. Existing account hover/click/focus, Escape/outside dismissal and logout behavior remain in scope.
- `Implemented`: `ImagesController.get` and `SellersController.getPhoto` convert Prisma `Uint8Array` payloads to Node `Buffer` before Express sends them. Controller coverage verifies PNG signature bytes, `image/png`, 200-path handling and anonymous private-media rejection.
- `Partial`: seeded Catalog/Product natural-width assertions, real overlay-host child/visibility/logout assertions, and the 14-test disposable PostgreSQL Playwright suite are historical evidence from the prior baseline; the suite was not rerun against the current moderation/lifecycle changes because PostgreSQL was unavailable. Playwright explicitly disables existing-server reuse; its test-only forwarded IPs keep the production login rate-limit policy unchanged while isolating fixture sessions.

## Волна 1 — private web session, seed and truthful states — 2026-07-30

- `Implemented`: local browser/API configuration uses canonical `http://localhost` origins (`apps/mobile/src/lib/environment.ts`, Playwright webServer and the local CORS bootstrap fallback in `apps/api/src/main.ts`). The fallback is restricted to `NODE_ENV=development` plus `APP_ENV=local`, with production coverage in `apps/api/src/core/config/env.spec.ts`. Requests still use `credentials: 'include'`; the HttpOnly `bidplace_session` cookie, guards and restricted CORS policy were not weakened.
- `Implemented`: `(public)` and `(auth)` now own Expo Router layouts, removing the root references that caused the two legacy route warnings. Public URLs remain unchanged.
- `Implemented`: activity keeps the server-provided empty array separate from network/5xx errors; seller onboarding treats only API 404 as an absent profile; moderation shows pending actions, non-repeatable approval controls and explicit empty sections.
- `Implemented`: the guarded local seed creates four public Products with four local PNG fixtures in `SCHEDULED`, `LIVE`, `ENDED` and a second `SCHEDULED` state, eight approved creator profiles with local profile photos, plus pending SellerProfile and pending Product fixtures. The pending Product remains private because it is `PENDING_REVIEW` and has no public listing.
- `Partial`: `apps/mobile/e2e/wave-one.spec.ts` covers authenticated activity, account logout, new-user seller form, non-admin admin denial, admin approval and reasoned limiting actions, admin bid/activity restrictions and route-warning regression; current browser execution passes as part of the 24-test disposable suite. Founder device/accessibility acceptance remains.
- `Implemented`: moderation limiting actions now require a reason in the shared contract, persist the reason in `AuditEvent`, expose the latest reason and unified `hasBlockingListing` guard in the admin projection, and use `CHANGES_REQUESTED` for ordinary Product correction requests. Scheduled and live listings are blocked by the moderation service; lifecycle activation and bid eligibility also require approved Product and SellerProfile state. API/admin/lifecycle unit and contract coverage passes; browser verification for this wave remains pending without disposable PostgreSQL.
- `Partial`: public author navigation now reuses `GET /api/sellers/:slug/detail` through `/seller/[slug]`, and Product detail links to the author. The generic ended-auction Activity CTA was removed; only an existing winner Order link remains. Device/accessibility acceptance and browser verification remain pending.

## Волна 2 — web UI polish — 2026-07-30

## Wave 2 — catalog/product layout — 2026-08-01

- `Partial`: `product-list-screen.tsx` now starts the catalog grid after the desktop rail, removes the visible Catalog heading/count, and lets `AuctionCard` show stable media, author, title, short description, atomic price with `BYN` and secondary listing status/deadline. Loading, empty, error, query, filters, pagination and seed data are unchanged.
- `Partial`: `product-screen.tsx` now places gallery, author/title and auction together in the desktop top block, preserves the mobile gallery → author/title → auction order, and renders item story, item history and bid history linearly. Auction/bid/realtime/auth logic and public contracts are unchanged.
- `Implemented`: shared `Button` defaults to content width; `compact` and explicit `block` variants are available through `button-layout.ts`, with focused unit coverage in `Button.spec.ts`. `AppDialog` has a desktop max width; media uses stable contain presentation and existing fallbacks.
- `Implemented`: screenshots at 1440/1024/390 px are captured in `/private/tmp/bidplace-wave2-screenshots`; the full disposable PostgreSQL Playwright suite passes 24/24, including catalog/product/dialog and Wave A responsive coverage. Founder device/accessibility and reduced-motion acceptance remain separate.
- `Implemented`: mobile header layout below 1025 px no longer renders the desktop account row; `AppHeader` keeps one bottom divider and no navigation top divider. The 390 px screenshot E2E asserts the first seed card begins directly after navigation; desktop layout remains covered by the full 24/24 suite.
- Deferred by scope: 10–15 works, pagination, search, filters, tags, favorites and recommendations.

- `Partial`: desktop web now has a white canvas, 72 px icon rail and desktop right-side account menu; mobile keeps account access in the AppHeader brand row. `OverlayHost` portals account dropdowns and rail tooltips above content using trigger-rectangle positioning. Account menu supports click, desktop hover and keyboard focus, with Escape/outside dismissal resetting keyboard state and a visible pending-aware `Выйти` action. SellerProfile-derived navigation exposes cabinet/add-product only for `APPROVED`; admin navigation remains Catalog + Moderation.
- `Implemented`: admin bid placement is denied in `BidsService`, admin buyer Activity is denied at `ActivityController`, and Product detail does not request buyer Activity or render a bid form for admin. `BidsService` unit coverage and admin browser API assertions cover the rule.
- `Partial`: public catalog includes approved Products whose Listing is `SCHEDULED`, `LIVE` or `ENDED`, using a shared `LIVE` → `SCHEDULED` → latest `ENDED` selector; the open-only default filter is deferred. Current guarded seed and browser `naturalWidth` checks cover four public demo products, including the fourth card needed for the desktop catalog density. Final founder visual/device/accessibility acceptance is still pending.
- `Partial`: shared `PageHeader`/`PageState` and Product linear section presentation cover the main loading, empty, retry, author, authored-item facts, publication date and public history states; bid history now distinguishes loading, error/retry and empty/data states. Browser automation covers mobile header placement, guest/pending/approved navigation, desktop account hover/focus, admin restrictions and seeded buyer/media states; Wave C targeted evidence is current, while final founder visual/device/accessibility acceptance is still pending.

## Local seed password handling — 2026-07-30

- `Implemented`: `packages/database/prisma/seed.js` now accepts the local-only `SEED_ADMIN_PASSWORD`, hashes it with Argon2 before creating the deterministic admin, seller and buyer records, and never writes the plaintext password to the database. Runtime login continues to verify the submitted password against `User.passwordHash` through `apps/api/src/auth/password-hasher.service.ts`.
- The previous `SEED_ADMIN_PASSWORD_HASH` variable is no longer read by the seed. A local database reset must provide `SEED_ADMIN_PASSWORD` and rerun the guarded demo seed.

## Visual polish — 2026-07-30

- `Implemented`: the light branding source assets are stored in `apps/mobile/assets/branding/`; the current Pen v2 `BrandLogo.tsx` uses the black `bidplace-logo.png` mark at the canonical `38×30` header geometry, while `app.json` uses the light favicon. The separate `bidplace-wordmark-light.*` asset remains available but is not the current Pen v2 header target. The previous placeholder border and duplicated text lockup were removed. Expo web/native rendering still needs founder visual/device acceptance because the supplied source assets are SVG.
- `Partial`: `apps/mobile/src/components/layout/AppShell.tsx` now provides the shared 1025 px responsive shell; all screens that used the repeated `SafeAreaView + AppHeader` composition use the shell, with mobile bottom actions and scroll ownership preserved.
- `Partial`: `apps/mobile/src/lib/environment.ts` provides `getApiAssetUrl`; Catalog/Product/seller profile/Product draft media use it. `ProductGallery` and `AuctionCard` display labeled unavailable-image states after load errors. API image authorization and seeded live-media/device behavior still need direct founder/device verification.
- `Partial`: `product-screen.tsx` places desktop gallery and auction panel in the same row and keeps mobile gallery → auction facts → linear detail sections → bottom action ordering. Auction business logic, realtime refetch, privacy and contracts are unchanged.
- `Partial`: `AppHeader.tsx` applies desktop nav geometry on the Expo Router `Link` itself, so the active Catalog item remains visible on web; `AppIcon.tsx` no longer forwards the native-only `accessible` prop to SVG DOM nodes. `apps/mobile/e2e/navigation.spec.ts` covers the visible root link and the warning regression.
- `Partial`: Login field validation now maps invalid email/password input to Russian messages, while server error handling remains generic/safe for unrecognized errors.
- Automated evidence for this snapshot: mobile typecheck, lint, unit tests (33/33), E2E fence, Expo web export and isolated headless web smoke passed; the smoke found a visible `/` Catalog link and no `accessible` warning. Founder visual/accessibility/device acceptance remains required; no route status is changed to `Implemented`.
- `Partial`: the historical disposable Playwright suite covered the auction creation, bidding and closing regressions; its 14-test result is not current verification for this branch because the rerun could not start without PostgreSQL.

## Auth logout resilience — 2026-07-30

- `Implemented`: `POST /auth/logout` uses `LogoutAuthGuard` to identify only a valid current session. It always clears the session cookie, including when the submitted cookie is missing, expired, malformed, or stale; server-side session invalidation runs only for an authenticated current session. `apps/api/src/auth/logout-auth.guard.spec.ts` covers invalid, stale, and current tokens.

## Auction browser E2E — 2026-07-28

- `Implemented`: three independent Playwright scenarios cover seller Product draft/submission and scheduled Listing preview (`apps/mobile/e2e/auction-creation.spec.ts`), two-buyer canonical bid/outbid/minimum behavior (`auction-bidding.spec.ts`), and lifecycle-driven close with winner Order and loser privacy (`auction-closing.spec.ts`). Shared setup lives in `e2e/support`; there is no `.state.json` or serial dependency.
- `Verified`: `test:e2e:auction` passes against disposable local `bidplace_e2e`; mobile typecheck, E2E lint and the disposable-database fence pass.

## Реализовано

| Поведение                        | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical storage model          | `packages/database/prisma/schema.prisma`, `packages/database/prisma/migrations/20260716000000_baseline/migration.sql`: nullable `phone`, `email_verified_at`, `TermsAcceptance`, `EmailVerificationCode`, moderation enums, handoff snapshot fields and append-only `AuditEvent` are present with the expected partial indexes.                                                                                                                                                                                                                                                                                                                                                                                 |
| Product and Listing rules        | `apps/api/src/products`, `apps/api/src/listings`, `apps/api/src/admin`, `apps/api/src/sellers/seller-capability.ts`, `apps/api/src/products/public-visibility.ts`: draft Product, submit-to-review, approval gate, owner lock after `SCHEDULED`/`LIVE`, shared public visibility predicates and BYN-only auction rules.                                                                                                                                                                                                                                                                                                                                                                                         |
| Seller privacy and image reorder | `apps/api/src/orders/orders.service.ts`, `apps/api/src/images/images.service.ts`: buyer-facing Order projections hide seller contacts in `SELLER_CONTACTS_BUYER`, keep them in `BUYER_CONTACTS_SELLER`; image reordering avoids unique-position collisions and aggregate count/byte capacity is enforced transactionally across uploads.                                                                                                                                                                                                                                                                                                                                                                        |
| Bids and soft close              | `apps/api/src/bids`, `apps/api/src/core/auction/pricing-policy.ts`, `apps/api/src/bids/bid-eligibility.ts`: serializable transaction, idempotency key, self-bid gate, compare-and-update, Listing-scoped public aliases, BYN increment policy, first-bid start-price floor, 60/60/600 soft close, email verification and versioned rules acceptance.                                                                                                                                                                                                                                                                                                                                                            |
| Lifecycle and Order              | `apps/api/src/lifecycle`, `apps/api/src/orders`, `apps/api/src/orders/order-snapshot.ts`, `apps/api/test/integration/order-mutations.integration.spec.ts`, `apps/api/test/integration/order-replacement.integration.spec.ts`: scheduler activation/closing, deterministic winner, atomic Order foundation, role-gated seller handoff, manual admin cancellation/replacement, immutable snapshots and append-only audit. PostgreSQL tests cover terminal repeats, unauthorized actions, ranked replacement and one-active-Order behavior.                                                                                                                                                                        |
| Email verification and rules     | `apps/api/src/otp`, `apps/api/src/auth`, `apps/api/src/core/rules.ts`: hashed one-time OTP, expiry, retry/cooldown/rate limiting, production SMTP transport via nodemailer, versioned service-rules text and test-only bypass validation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Public and realtime API          | `packages/contracts`, `packages/api-client`, `apps/api/src/products/public-visibility.ts`, `apps/api/src/realtime`: public Product, Bid history, media and socket joins share approved Product/SellerProfile gates; projections exclude seller internal identifiers and buyer PII; sockets are origin allow-listed, credential-free, IP rate-limited and room-capped; mobile uses HTTP as canonical snapshot and refetches on reconnect/events.                                                                                                                                                                                                                                                                 |
| Local reset and seed             | The reset guard is present. The deterministic local/test-only seed creates four approved demo Products with local PNG fixtures (three auction states plus a second scheduled vase), eight approved creator profiles with local profile photos, plus pending seller/product moderation fixtures. Bid/Order fixtures require an explicit local/test profile and fail closed in production-like environments; `apps/api/test/integration/seed-contract.integration.spec.ts` verifies current price, bid count, winner and Order consistency. The dedicated `test:e2e-fence` guard and disposable guarded seed smoke pass; the public catalog includes the four approved Products and excludes the pending Product. |
| Prisma generated client          | `packages/database` generates its custom Prisma Client before build. The generated directory is intentionally ignored and is not part of the source baseline.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Partial / needs verification

Current verification (2026-08-10): monorepo typecheck and build pass for all 7
workspaces, lint 2/2, contracts 7/7, API unit 145/145, mobile unit 113/113,
PostgreSQL integration 39/39 and disposable Chromium Playwright 35/35. Founder
visual/device/screen-reader acceptance and the isolated 10-user rehearsal remain
pending.

| Area                          | Current evidence                                                                                                                                                                                                                                                                                                                        | Remaining gap                                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Seller and admin mobile flows | Seller profile, Product draft/edit, Listing draft and `/admin` use the Pen v2 shared primitives. Product retains server edit locks, aggregate image limits, upload/delete/reorder and preview; Listing retains server validation and explicit schedule; destructive admin actions require confirmation while API remains authoritative. | Runtime implementation and automated evidence are complete; founder physical-device/accessibility acceptance remains.                     |
| Product detail UX             | `/product/[publicId]` has gallery/atmosphere, value fields, AuctionPlayer, URL-backed About/Creation/Bids tabs, Listing-scoped aliases, related public author works, OTP/actions, Activity participation, Order link and realtime refetch.                                                                                              | Founder pixel review, physical-device and screen-reader QA remain.                                                                        |
| Tests                         | Typecheck/build 7/7 workspaces, lint 2/2, contracts 7/7, API unit 145/145, mobile unit 113/113, PostgreSQL integration 39/39, E2E fence and disposable Chromium Playwright 35/35 pass.                                                                                                                                                  | WebKit/cross-browser, physical-device and founder accessibility acceptance remain deferred; the isolated 10-user rehearsal remains.       |
| Operations                    | Single-process scheduler and Socket.IO gateway work for MVP. Root `dev` and direct mobile start commands build workspace dependencies first, preventing stale package output at runtime.                                                                                                                                                | Multi-instance deployment requires a distributed lock or external queue before scaling; binary database image storage remains pilot-only. |

## Historical Modern UI implementation baseline — 2026-07-27

This section is a dated historical record and is superseded by the canonical
Pen v2 section above. References to `modernTokens`, `components/modern-ui`, the
left rail and absence of `components/ui` callers no longer describe runtime.

- `feature/modern-ui-final` starts from the documentation baseline before the experimental pilot; the pilot bridge is not the accepted production strategy.
- The redesign has migrated all existing working mobile routes and removed Tamagui, the legacy mobile UI kit, legacy palette/theme exports and Cormorant runtime loading. Server-authoritative auctions, email/rules gates, privacy projections, moderation and seller locks remain unchanged.
- Bid confirmation and client-side increment validation remain confirmed UI behaviour; backend remains authoritative. See `DEC-055`, `DEC-056` and the current design handoff in `docs/design/05-DESIGN-HANDOFF.md`.
- Final UI cutover is Partial final migration: `apps/mobile` has one light-only React Navigation theme derived from `modernTokens`, Inter and PT Mono loading, no production Tamagui or `components/ui` callers, and final navigation on every route. Catalog (`/`) retains its existing API query and public route. Founder iOS/Android, browser/device visual and accessibility acceptance remain required.
- Product/Bid final content is Partial: `features/products/product-screen.tsx`, `features/auth/email-rules-gate.tsx` and `components/modern-ui/AuctionPanel.tsx` render the Product facts, desktop contextual auction panel, mobile safe-area action, OTP/rules gate, confirmation and retry through final primitives. `bid-validation.ts` still validates the confirmed BYN increment table; unknown/no participation requires confirmation; same-amount retry preserves its idempotency key; stale/rejected mutations refetch canonical Product/Bid/Activity projections. The API remains authoritative for minimum, Listing state and close. Final global navigation, iOS/Android smoke and accessibility evidence remain.
- Activity final content is Partial: `features/activity/activity-screen.tsx` renders the server-projected participation and authorized Order link through final `ActivityRow` UI. Shared navigation, device smoke and accessibility evidence remain.
- Order final content is Partial: `features/orders/order-screen.tsx` preserves buyer/seller/admin server projections and seller action refetches through final primitives; the irreversible handoff-failed action now has explicit client confirmation. Full device and accessibility evidence remains.
- Auth final content is Partial: `features/auth/auth-form.tsx` retains RHF/Zod validation, safe redirect and user-facing recovery through final form primitives. Device and accessibility evidence remains.
- Seller profile final content is Partial: `features/sellers/seller-profile-screen.tsx` retains the server `CHANGES_REQUESTED` edit lock and multipart public-photo contract through final primitives. Device acceptance evidence remains.
- Seller Product draft/edit is Partial final migration: `features/sellers/product-draft-screen.tsx` uses `FormSection`, `TextField` and final media/actions, preserves create/update/submit, server locks, image upload/delete/reorder, and confirms only image deletion. Creator input no longer asks for `condition`; an existing returned value is read-only. Listing draft and `/admin` likewise use final primitives, with explicit Listing scheduling and confirmed destructive admin actions. Automated evidence is complete; founder acceptance remains.

## Confirmed MVP implementation gaps — 2026-07-23

This is a dated backlog snapshot. Current implementation and verification facts
in the 2026-08-10 sections above supersede its old rerun/test-count wording;
remaining product boundaries still apply.

| Area                                     | Status             | Required implementation evidence                                                                                                                                                                                                                                                                   |
| ---------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public seller application and capability | Partial            | `POST/PATCH /seller/profile`, seller status projection and the seller-write capability gate now exist, and the mobile application screen uses multipart photo upload; prior closed-pilot browser/E2E evidence is historical and current rerun remains Needs verification.                          |
| Seller profile data                      | Partial            | Handoff contact, handoff initiator, immutable public `fullName`, profile photo upload/public URL and `CHANGES_REQUESTED` edit flow for public and handoff fields now exist in schema, API and mobile; prior browser seller-path evidence is historical and current rerun/device QA remain pending. |
| Product moderation and visibility        | Implemented        | `submit`, admin moderation service, reasoned `CHANGES_REQUESTED` correction flow, LIVE-listing guard, audit records, `publishedAt`, one-image approval gate and shared public catalog/direct visibility predicates are in place.                                                                   |
| Seller handoff actions                   | Implemented        | Order snapshots `sellerHandoffType`, `sellerHandoffValue`, `buyerEmailAtClose` and `handoffInitiator`; seller actions and admin replacement/cancellation preserve audit and role-scoped projections.                                                                                               |
| Timestamps                               | Partial            | Most mutable records have timestamps; the confirmed all-entity `createdAt`/`updatedAt` and Product `publishedAt` requirement is not yet implemented.                                                                                                                                               |
| Pilot analytics                          | Not implemented    | Add minimal first-party funnel and outcome events only; no dashboard or third-party marketing tracker.                                                                                                                                                                                             |
| Production email verification            | Implemented        | `apps/api/src/otp`, `apps/api/src/auth`, `apps/api/src/bids/bid-eligibility.ts` now enforce SMTP-backed email verification, versioned rules acceptance and a test-only bypass that stays disabled in production.                                                                                   |
| Closed-pilot rehearsal                   | Needs verification | Chromium Playwright now covers the buyer path, seller/admin browser flow, seller handoff actions, and the order privacy matrix against disposable PostgreSQL; the isolated 10-user rehearsal still needs to be run.                                                                                |

## Intentional MVP boundaries

- Only `ListingType.AUCTION` and `BYN` exist.
- No `Lot`, central `Auction`, Buy Now, reserve price, reserve UI or USD fixture remains in the runtime model.
- Payment, delivery, chat, automatic winner replacement and notifications are not implemented.
- Manual admin replacement preserves cancelled Order history; automatic replacement is Planned.
- Domain/security tasks do not absorb incidental visual work. The new Pen v2 refactor is governed by `DEC-062` and `docs/design/07-PEN-V2-UI-AUDIT-AND-IMPLEMENTATION-PLAN.md`; `DEC-056` remains authoritative for bid confirmation and client validation.

## Historical closed-pilot verification — 2026-07-19

- Frozen workspace install; full lint and typecheck; API build; Expo web export; Prisma validation; isolated reset and seed passed.
- API typecheck passed on the current tree.
- API unit suite passed: 20 files, 86 tests.
- API integration suite passed: 2 files, 8 tests, against local PostgreSQL.
- Production SMTP env validation passed in `apps/api/src/core/config/env.spec.ts`.
- Chromium E2E, mobile typecheck, lint and seed reset were not rerun in this snapshot.

## Task B Editorial Redesign — 2026-07-19

- Task B Editorial Redesign завершена.
- Выполнен основной type-safety commit.
- Выполнено исправление explicit protected admin route в коммите `79e6ad7` (admin URL теперь `/admin` и защищён administrative guard).
- Проверки: mobile TypeScript проходит; targeted ESLint изменённых файлов проходит; `expo export --platform web` проходит (SPA refresh `/admin` в production зависит от hosting fallback на `index.html`).
- Результаты ручного smoke-test:
  [ЗДЕСЬ Я ВСТАВЛЮ РЕАЛЬНЫЕ РЕЗУЛЬТАТЫ:

- `/` как гость:
- `/admin` как администратор:
- refresh `/admin`:
- `/admin` как обычный пользователь:
- mobile drawer 375 px:
- desktop navigation 1440 px:
- переключение 1024/1025 px:
- browser console:
- краткая проверка основных экранов:
  ]

## Post-Task-B release hardening TODO

- WebKit and full cross-browser matrix; physical-device QA; visual regression; exhaustive seller/admin E2E; full accessibility automation; ten-session browser rehearsal.

## Checks executed for this snapshot

- `packages/database`: Prisma client generation and TypeScript build completed against the updated seller-profile schema.
- `packages/contracts`: TypeScript build completed after seller-profile, order and auth contract updates.
- `packages/api-client`: TypeScript build completed after multipart seller application and auth response updates.
- `apps/api` typecheck passed.
- `apps/api` build passed.
- `apps/api` unit Vitest suite passed: 25 files, 115 tests.
- `apps/api` integration Vitest suite passed against local PostgreSQL after the order snapshot regression was fixed.
- `apps/mobile` typecheck passed after the buyer/seller order projection fixes.
- `apps/mobile` build passed (`expo export`).
- `apps/mobile` Playwright closed-pilot browser suite reran against the current code with Docker PostgreSQL; 24/24 tests passed, including Wave 2 screenshots and Wave A responsive checks.
- `corepack pnpm lint` passed once Turbo was forced through the pinned pnpm 11.7.0 wrapper.
- `corepack pnpm format:check` failed with repo-wide Prettier warnings across 162 files.

See `10-CODE-ARCHITECTURE.md` for boundaries and `05-MVP-RFC.md` for product contract gaps.

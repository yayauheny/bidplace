# bidplace — текущий статус проекта

Последнее обновление: 2026-07-31
Статус: Technical baseline is Partial; API/mobile static checks pass, while Chromium/disposable Playwright acceptance for the current moderation/lifecycle changes is Needs verification because PostgreSQL was unavailable. Founder visual/device/accessibility acceptance and the 10-user rehearsal remain Needs verification.

## Runtime defect hardening — 2026-07-31

- `Implemented`: `OverlayHost` now supplies the web overlay boundary through a memoized callback ref; `OverlayPortal` waits for both the boundary and anchor rectangle, and navigation/account anchors use ref-supporting `View` wrappers. Web pointer-events are expressed through styles. Existing account hover/click/focus, Escape/outside dismissal and logout behavior remain in scope.
- `Implemented`: `ImagesController.get` and `SellersController.getPhoto` convert Prisma `Uint8Array` payloads to Node `Buffer` before Express sends them. Controller coverage verifies PNG signature bytes, `image/png`, 200-path handling and anonymous private-media rejection.
- `Partial`: seeded Catalog/Product natural-width assertions, real overlay-host child/visibility/logout assertions, and the 14-test disposable PostgreSQL Playwright suite are historical evidence from the prior baseline; the suite was not rerun against the current moderation/lifecycle changes because PostgreSQL was unavailable. Playwright explicitly disables existing-server reuse; its test-only forwarded IPs keep the production login rate-limit policy unchanged while isolating fixture sessions.

## Волна 1 — private web session, seed and truthful states — 2026-07-30

- `Implemented`: local browser/API configuration uses canonical `http://localhost` origins (`apps/mobile/src/lib/environment.ts`, Playwright webServer and the local CORS bootstrap fallback in `apps/api/src/main.ts`). The fallback is restricted to `NODE_ENV=development` plus `APP_ENV=local`, with production coverage in `apps/api/src/core/config/env.spec.ts`. Requests still use `credentials: 'include'`; the HttpOnly `bidplace_session` cookie, guards and restricted CORS policy were not weakened.
- `Implemented`: `(public)` and `(auth)` now own Expo Router layouts, removing the root references that caused the two legacy route warnings. Public URLs remain unchanged.
- `Implemented`: activity keeps the server-provided empty array separate from network/5xx errors; seller onboarding treats only API 404 as an absent profile; moderation shows pending actions, non-repeatable approval controls and explicit empty sections.
- `Implemented`: the guarded local seed creates three public Products with three PNG fixtures in `SCHEDULED`, `LIVE` and `ENDED` states, plus pending SellerProfile and pending Product fixtures. The pending Product remains private because it is `PENDING_REVIEW` and has no public listing.
- `Partial`: `apps/mobile/e2e/wave-one.spec.ts` covers authenticated activity, account logout, new-user seller form, non-admin admin denial, admin approval and reasoned limiting actions, admin bid/activity restrictions and route-warning regression; current browser execution is Needs verification because PostgreSQL was unavailable.
- `Implemented`: moderation limiting actions now require a reason in the shared contract, persist the reason in `AuditEvent`, expose the latest reason and unified `hasBlockingListing` guard in the admin projection, and use `CHANGES_REQUESTED` for ordinary Product correction requests. Scheduled and live listings are blocked by the moderation service; lifecycle activation and bid eligibility also require approved Product and SellerProfile state. API/admin/lifecycle unit and contract coverage passes; browser verification for this wave remains pending without disposable PostgreSQL.
- `Partial`: public author navigation now reuses `GET /api/sellers/:slug/detail` through `/seller/[slug]`, and Product detail links to the author. The generic ended-auction Activity CTA was removed; only an existing winner Order link remains. Device/accessibility acceptance and browser verification remain pending.

## Волна 2 — web UI polish — 2026-07-30

## Wave 2 — catalog/product layout — 2026-08-01

- `Partial`: `product-list-screen.tsx` now starts the catalog grid after the desktop rail, removes the visible Catalog heading/count, and lets `AuctionCard` show stable media, author, title, short description, price, publication date and secondary listing status. Loading, empty, error, query, filters, pagination and seed data are unchanged.
- `Partial`: `product-screen.tsx` now places gallery, author/title and auction together in the desktop top block, preserves the mobile gallery → author/title → auction order, and renders item story, item history and bid history linearly. Auction/bid/realtime/auth logic and public contracts are unchanged.
- `Implemented`: shared `Button` defaults to content width; `compact` and explicit `block` variants are available through `button-layout.ts`, with focused unit coverage in `Button.spec.ts`. `AppDialog` has a desktop max width; media uses stable contain presentation and existing fallbacks.
- `Needs verification`: manual screenshots at 1440/1024/390 px, full browser run with disposable PostgreSQL, keyboard/accessibility and reduced-motion acceptance.
- Deferred by scope: 10–15 works, pagination, search, filters, tags, favorites and recommendations.

- `Partial`: desktop web now has a white canvas, 72 px icon rail and desktop right-side account menu; mobile keeps account access in the AppHeader brand row. `OverlayHost` portals account dropdowns and rail tooltips above content using trigger-rectangle positioning. Account menu supports click, desktop hover and keyboard focus, with Escape/outside dismissal resetting keyboard state and a visible pending-aware `Выйти` action. SellerProfile-derived navigation exposes cabinet/add-product only for `APPROVED`; admin navigation remains Catalog + Moderation.
- `Implemented`: admin bid placement is denied in `BidsService`, admin buyer Activity is denied at `ActivityController`, and Product detail does not request buyer Activity or render a bid form for admin. `BidsService` unit coverage and admin browser API assertions cover the rule.
- `Partial`: public catalog includes approved Products whose Listing is `SCHEDULED`, `LIVE` or `ENDED`, using a shared `LIVE` → `SCHEDULED` → latest `ENDED` selector; the open-only default filter is deferred. Public image HTTP response and browser `naturalWidth` checks are historical evidence and need rerun after the current changes. Final founder visual/device/accessibility acceptance is still pending.
- `Partial`: shared `PageHeader`/`PageState` and Product three-tab presentation cover the main loading, empty, retry, author, authored-item facts, publication date and public history states; bid history now distinguishes loading, error/retry and empty/data states. Browser automation covers mobile header placement, guest/pending/approved navigation, desktop account hover/focus, admin restrictions and seeded buyer/media states; prior 14/14 disposable evidence is not current verification. Final founder visual/device/accessibility acceptance is still pending.

## Local seed password handling — 2026-07-30

- `Implemented`: `packages/database/prisma/seed.js` now accepts the local-only `SEED_ADMIN_PASSWORD`, hashes it with Argon2 before creating the deterministic admin, seller and buyer records, and never writes the plaintext password to the database. Runtime login continues to verify the submitted password against `User.passwordHash` through `apps/api/src/auth/password-hasher.service.ts`.
- The previous `SEED_ADMIN_PASSWORD_HASH` variable is no longer read by the seed. A local database reset must provide `SEED_ADMIN_PASSWORD` and rerun the guarded demo seed.

## Visual polish — 2026-07-30

- `Implemented`: the light branding source assets are stored in `apps/mobile/assets/branding/`; `BrandLogo.tsx` uses the black wordmark on desktop and black mark on compact/mobile navigation, while `app.json` uses the light favicon. The previous placeholder border and duplicated text lockup were removed. Expo web/native rendering still needs founder visual/device acceptance because the supplied source assets are SVG.
- `Partial`: `apps/mobile/src/components/layout/AppShell.tsx` now provides the shared 1025 px responsive shell; all screens that used the repeated `SafeAreaView + AppHeader` composition use the shell, with mobile bottom actions and scroll ownership preserved.
- `Partial`: `apps/mobile/src/lib/environment.ts` provides `getApiAssetUrl`; Catalog/Product/seller profile/Product draft media use it. `ProductGallery` and `AuctionCard` display labeled unavailable-image states after load errors. API image authorization and seeded live-media/device behavior still need direct founder/device verification.
- `Partial`: `product-screen.tsx` places desktop gallery and auction panel in the same row and keeps mobile gallery → auction facts → tabs → bottom action ordering. Auction business logic, realtime refetch, privacy and contracts are unchanged.
- `Partial`: `AppHeader.tsx` applies desktop nav geometry on the Expo Router `Link` itself, so the active Catalog item remains visible on web; `AppIcon.tsx` no longer forwards the native-only `accessible` prop to SVG DOM nodes. `apps/mobile/e2e/navigation.spec.ts` covers the visible root link and the warning regression.
- `Partial`: Login field validation now maps invalid email/password input to Russian messages, while server error handling remains generic/safe for unrecognized errors.
- Automated evidence for this snapshot: mobile typecheck, lint, unit tests (17/17), E2E fence, Expo web export and isolated headless web smoke passed; the smoke found a visible `/` Catalog link and no `accessible` warning. Founder visual/accessibility/device acceptance remains required; no route status is changed to `Implemented`.
- `Partial`: the historical disposable Playwright suite covered the auction creation, bidding and closing regressions; its 14-test result is not current verification for this branch because the rerun could not start without PostgreSQL.

## Auth logout resilience — 2026-07-30

- `Implemented`: `POST /auth/logout` uses `LogoutAuthGuard` to identify only a valid current session. It always clears the session cookie, including when the submitted cookie is missing, expired, malformed, or stale; server-side session invalidation runs only for an authenticated current session. `apps/api/src/auth/logout-auth.guard.spec.ts` covers invalid, stale, and current tokens.

## Auction browser E2E — 2026-07-28

- `Implemented`: three independent Playwright scenarios cover seller Product draft/submission and scheduled Listing preview (`apps/mobile/e2e/auction-creation.spec.ts`), two-buyer canonical bid/outbid/minimum behavior (`auction-bidding.spec.ts`), and lifecycle-driven close with winner Order and loser privacy (`auction-closing.spec.ts`). Shared setup lives in `e2e/support`; there is no `.state.json` or serial dependency.
- `Verified`: `test:e2e:auction` passes against disposable local `bidplace_e2e`; mobile typecheck, E2E lint and the disposable-database fence pass.

## Реализовано

| Поведение                        | Evidence                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical storage model          | `packages/database/prisma/schema.prisma`, `packages/database/prisma/migrations/20260716000000_baseline/migration.sql`: nullable `phone`, `email_verified_at`, `TermsAcceptance`, `EmailVerificationCode`, moderation enums, handoff snapshot fields and append-only `AuditEvent` are present with the expected partial indexes.                                                                                        |
| Product and Listing rules        | `apps/api/src/products`, `apps/api/src/listings`, `apps/api/src/admin`, `apps/api/src/sellers/seller-capability.ts`, `apps/api/src/products/public-visibility.ts`: draft Product, submit-to-review, approval gate, owner lock after `SCHEDULED`/`LIVE`, shared public visibility predicates and BYN-only auction rules.                                                                                                |
| Seller privacy and image reorder | `apps/api/src/orders/orders.service.ts`, `apps/api/src/images/images.service.ts`: buyer-facing Order projections hide seller contacts in `SELLER_CONTACTS_BUYER`, keep them in `BUYER_CONTACTS_SELLER`, and image reordering uses a two-phase temporary offset to avoid unique-position collisions; both paths have unit coverage.                                                                                     |
| Bids and soft close              | `apps/api/src/bids`, `apps/api/src/core/auction/pricing-policy.ts`, `apps/api/src/bids/bid-eligibility.ts`: serializable transaction, idempotency key, self-bid gate, compare-and-update, BYN increment policy, first-bid start-price floor, 60/60/600 soft close, email verification and versioned rules acceptance.                                                                                                  |
| Lifecycle and Order              | `apps/api/src/lifecycle`, `apps/api/src/orders`, `apps/api/src/orders/order-snapshot.ts`: scheduler activation/closing, deterministic winner, atomic Order foundation, active-order snapshot, seller handoff actions, manual admin cancellation/replacement and audit.                                                                                                                                                 |
| Email verification and rules     | `apps/api/src/otp`, `apps/api/src/auth`, `apps/api/src/core/rules.ts`: hashed one-time OTP, expiry, retry/cooldown/rate limiting, production SMTP transport via nodemailer, versioned service-rules text and test-only bypass validation.                                                                                                                                                                              |
| Public and realtime API          | `packages/contracts`, `packages/api-client`, `apps/api/src/realtime`: public Product projections exclude seller internal identifiers and buyer PII; listings use `listing:*` events; public sockets are allow-listed by origin, credential-free, IP rate-limited and room-capped; mobile uses HTTP as canonical snapshot and refetches on socket reconnect/events.                                                     |
| Local reset and seed             | The reset guard is present. The deterministic local seed creates three approved Russian-language ceramic demo Products in scheduled, live and ended states, each with one tracked PNG fixture, plus pending seller/product moderation fixtures. The dedicated `test:e2e-fence` guard and disposable guarded seed smoke pass; the public catalog includes the three approved Products and excludes the pending Product. |
| Prisma generated client          | `packages/database` generates its custom Prisma Client before build. The generated directory is intentionally ignored and is not part of the source baseline.                                                                                                                                                                                                                                                          |

## Partial / needs verification

Current verification (2026-07-31): API build/typecheck and unit tests, contracts tests, mobile typecheck/lint and Playwright test discovery passed; the disposable Chromium Playwright suite was attempted but could not start because PostgreSQL at `127.0.0.1:5432` was unavailable. Founder visual/device/accessibility acceptance and the isolated 10-user rehearsal remain pending.

| Area                          | Current evidence                                                                                                                                                                                                                                                                                                                                                                          | Remaining gap                                                                                                                             |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Seller and admin mobile flows | Seller profile, Product draft/edit, Listing draft and `/admin` now use the final mobile primitives. Product retains server edit locks, image upload/delete/reorder and read-only preview; Listing retains server validation and explicit schedule; admin destructive status, cancel and replacement actions require a client confirmation while the API remains the permission authority. | Founder device/accessibility acceptance remains; the final migration is not marked Implemented before that evidence.                      |
| Product detail UX             | `/product/[publicId]` has images, value fields, Listing state, server-deadline countdown, bid history, OTP actions, Activity-derived participation, Order link and realtime refetch. All UI components strictly typed without `any` casts.                                                                                                                                                | Mobile/device accessibility QA remains.                                                                                                   |
| Tests                         | API lint/typecheck, API unit tests, contracts tests, mobile typecheck/lint, Playwright test discovery and seed contract checks passed. Current disposable Chromium execution is Needs verification because PostgreSQL was unavailable; the previous 14-test run is historical evidence only.                                                                                              | WebKit/cross-browser, physical-device and founder accessibility acceptance remain deferred.                                               |
| Operations                    | Single-process scheduler and Socket.IO gateway work for MVP. Root `dev` and direct mobile start commands build workspace dependencies first, preventing stale package output at runtime.                                                                                                                                                                                                  | Multi-instance deployment requires a distributed lock or external queue before scaling; binary database image storage remains pilot-only. |

## Planned final Modern UI cutover — 2026-07-27

- `feature/modern-ui-final` starts from the documentation baseline before the experimental pilot; the pilot bridge is not the accepted production strategy.
- The redesign has migrated all existing working mobile routes and removed Tamagui, the legacy mobile UI kit, legacy palette/theme exports and Cormorant runtime loading. Server-authoritative auctions, email/rules gates, privacy projections, moderation and seller locks remain unchanged.
- Bid confirmation and client-side increment validation are confirmed UI behaviour; backend remains authoritative. See `DEC-055`, `DEC-056` and `docs/modern-ui/10-final-cutover-plan.md`.
- Final UI cutover is Partial final migration: `apps/mobile` has one light-only React Navigation theme derived from `modernTokens`, Inter and PT Mono loading, no production Tamagui or `components/ui` callers, and final navigation on every route. Catalog (`/`) retains its existing API query and public route. Founder iOS/Android, browser/device visual and accessibility acceptance remain required.
- Product/Bid final content is Partial: `features/products/product-screen.tsx`, `features/auth/email-rules-gate.tsx` and `components/modern-ui/AuctionPanel.tsx` render the Product facts, desktop contextual auction panel, mobile safe-area action, OTP/rules gate, confirmation and retry through final primitives. `bid-validation.ts` still validates the confirmed BYN increment table; unknown/no participation requires confirmation; same-amount retry preserves its idempotency key; stale/rejected mutations refetch canonical Product/Bid/Activity projections. The API remains authoritative for minimum, Listing state and close. Final global navigation, iOS/Android smoke and accessibility evidence remain.
- Activity final content is Partial: `features/activity/activity-screen.tsx` renders the server-projected participation and authorized Order link through final `ActivityRow` UI. Shared navigation, device smoke and accessibility evidence remain.
- Order final content is Partial: `features/orders/order-screen.tsx` preserves buyer/seller/admin server projections and seller action refetches through final primitives; the irreversible handoff-failed action now has explicit client confirmation. Full device and accessibility evidence remains.
- Auth final content is Partial: `features/auth/auth-form.tsx` retains RHF/Zod validation, safe redirect and user-facing recovery through final form primitives. Device and accessibility evidence remains.
- Seller profile final content is Partial: `features/sellers/seller-profile-screen.tsx` retains the server `CHANGES_REQUESTED` edit lock and multipart public-photo contract through final primitives. Device acceptance evidence remains.
- Seller Product draft/edit is Partial final migration: `features/sellers/product-draft-screen.tsx` uses `FormSection`, `TextField` and final media/actions, preserves create/update/submit, server locks, image upload/delete/reorder, and confirms only image deletion. Creator input no longer asks for `condition`; an existing returned value is read-only. Listing draft and `/admin` likewise use final primitives, with explicit Listing scheduling and confirmed destructive admin actions. Automated evidence is complete; founder acceptance remains.

## Confirmed MVP implementation gaps — 2026-07-23

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
- Domain/security tasks do not absorb incidental visual work. The separately confirmed final Modern UI cutover is governed by `DEC-055`, `DEC-056` and `docs/modern-ui/10-final-cutover-plan.md`.

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
- `apps/mobile` Playwright closed-pilot browser suite has historical evidence from the prior baseline; rerun against the current code is required after PostgreSQL becomes available.
- `corepack pnpm lint` passed once Turbo was forced through the pinned pnpm 11.7.0 wrapper.
- `corepack pnpm format:check` failed with repo-wide Prettier warnings across 162 files.

See `10-CODE-ARCHITECTURE.md` for boundaries and `05-MVP-RFC.md` for product contract gaps.

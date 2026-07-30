# bidplace — текущий статус проекта

Последнее обновление: 2026-07-30
Статус: Technical baseline is Partial; the current snapshot verifies seller application, buyer/seller order privacy and handoff, image reorder safety, first-bid floor handling, API lint/typecheck/unit/integration tests, mobile typecheck/lint/unit/web export, the disposable-DB fence check and auction browser/E2E verification. Founder device/visual/accessibility acceptance and the 10-user rehearsal remain pending.

## Auction browser E2E — 2026-07-28

- `Implemented`: three independent Playwright scenarios cover seller Product draft/submission and scheduled Listing preview (`apps/mobile/e2e/auction-creation.spec.ts`), two-buyer canonical bid/outbid/minimum behavior (`auction-bidding.spec.ts`), and lifecycle-driven close with winner Order and loser privacy (`auction-closing.spec.ts`). Shared setup lives in `e2e/support`; there is no `.state.json` or serial dependency.
- `Verified`: `test:e2e:auction` passes against disposable local `bidplace_e2e`; mobile typecheck, E2E lint and the disposable-database fence pass.

## Реализовано

| Поведение                        | Evidence                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Canonical storage model          | `packages/database/prisma/schema.prisma`, `packages/database/prisma/migrations/20260716000000_baseline/migration.sql`: nullable `phone`, `email_verified_at`, `TermsAcceptance`, `EmailVerificationCode`, moderation enums, handoff snapshot fields and append-only `AuditEvent` are present with the expected partial indexes.                                    |
| Product and Listing rules        | `apps/api/src/products`, `apps/api/src/listings`, `apps/api/src/admin`, `apps/api/src/sellers/seller-capability.ts`, `apps/api/src/products/public-visibility.ts`: draft Product, submit-to-review, approval gate, owner lock after `SCHEDULED`/`LIVE`, shared public visibility predicates and BYN-only auction rules.                                            |
| Seller privacy and image reorder | `apps/api/src/orders/orders.service.ts`, `apps/api/src/images/images.service.ts`: buyer-facing Order projections hide seller contacts in `SELLER_CONTACTS_BUYER`, keep them in `BUYER_CONTACTS_SELLER`, and image reordering uses a two-phase temporary offset to avoid unique-position collisions; both paths have unit coverage.                                 |
| Bids and soft close              | `apps/api/src/bids`, `apps/api/src/core/auction/pricing-policy.ts`, `apps/api/src/bids/bid-eligibility.ts`: serializable transaction, idempotency key, self-bid gate, compare-and-update, BYN increment policy, first-bid start-price floor, 60/60/600 soft close, email verification and versioned rules acceptance.                                              |
| Lifecycle and Order              | `apps/api/src/lifecycle`, `apps/api/src/orders`, `apps/api/src/orders/order-snapshot.ts`: scheduler activation/closing, deterministic winner, atomic Order foundation, active-order snapshot, seller handoff actions, manual admin cancellation/replacement and audit.                                                                                             |
| Email verification and rules     | `apps/api/src/otp`, `apps/api/src/auth`, `apps/api/src/core/rules.ts`: hashed one-time OTP, expiry, retry/cooldown/rate limiting, production SMTP transport via nodemailer, versioned service-rules text and test-only bypass validation.                                                                                                                          |
| Public and realtime API          | `packages/contracts`, `packages/api-client`, `apps/api/src/realtime`: public Product projections exclude seller internal identifiers and buyer PII; listings use `listing:*` events; public sockets are allow-listed by origin, credential-free, IP rate-limited and room-capped; mobile uses HTTP as canonical snapshot and refetches on socket reconnect/events. |
| Local reset and seed             | The reset guard is present; the disposable `bidplace_e2e` setup was revalidated through Playwright preparation and close fixtures, and the dedicated `test:e2e-fence` guard check passes, but a standalone seed smoke outside E2E was not rerun.                                                                                                                   |
| Prisma generated client          | `packages/database` generates its custom Prisma Client before build. The generated directory is intentionally ignored and is not part of the source baseline.                                                                                                                                                                                                      |

## Partial / needs verification

| Area                          | Current evidence                                                                                                                                                                                                                                                                                                                                                                          | Remaining gap                                                                                                                             |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Seller and admin mobile flows | Seller profile, Product draft/edit, Listing draft and `/admin` now use the final mobile primitives. Product retains server edit locks, image upload/delete/reorder and read-only preview; Listing retains server validation and explicit schedule; admin destructive status, cancel and replacement actions require a client confirmation while the API remains the permission authority. | Founder device/accessibility acceptance remains; the final migration is not marked Implemented before that evidence.                      |
| Product detail UX             | `/product/[publicId]` has images, value fields, Listing state, server-deadline countdown, bid history, OTP actions, Activity-derived participation, Order link and realtime refetch. All UI components strictly typed without `any` casts.                                                                                                                                                | Mobile/device accessibility QA remains.                                                                                                   |
| Tests                         | API lint/typecheck, 115 API unit tests, 10 API integration tests against disposable PostgreSQL, mobile typecheck/lint, 11 mobile unit tests, Expo web export, `apps/mobile:test:e2e-fence`, and the three independent Playwright auction scenarios passed.                                                                                                                                | Auth, admin and broader browser/device/accessibility E2E remain deferred.                                                                 |
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

| Area                                     | Status             | Required implementation evidence                                                                                                                                                                                                                                     |
| ---------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public seller application and capability | Partial            | `POST/PATCH /seller/profile`, seller status projection and the seller-write capability gate now exist, and the mobile application screen uses multipart photo upload; closed-pilot browser/E2E verification of the seller-path passed.                               |
| Seller profile data                      | Partial            | Handoff contact, handoff initiator, immutable public `fullName`, profile photo upload/public URL and `CHANGES_REQUESTED` edit flow for public and handoff fields now exist in schema, API and mobile; browser seller-path verification passed and device QA remains. |
| Product moderation and visibility        | Implemented        | `submit`, admin moderation service, audit records, `publishedAt`, one-image approval gate and shared public catalog/direct visibility predicates are in place.                                                                                                       |
| Seller handoff actions                   | Implemented        | Order snapshots `sellerHandoffType`, `sellerHandoffValue`, `buyerEmailAtClose` and `handoffInitiator`; seller actions and admin replacement/cancellation preserve audit and role-scoped projections.                                                                 |
| Timestamps                               | Partial            | Most mutable records have timestamps; the confirmed all-entity `createdAt`/`updatedAt` and Product `publishedAt` requirement is not yet implemented.                                                                                                                 |
| Pilot analytics                          | Not implemented    | Add minimal first-party funnel and outcome events only; no dashboard or third-party marketing tracker.                                                                                                                                                               |
| Production email verification            | Implemented        | `apps/api/src/otp`, `apps/api/src/auth`, `apps/api/src/bids/bid-eligibility.ts` now enforce SMTP-backed email verification, versioned rules acceptance and a test-only bypass that stays disabled in production.                                                     |
| Closed-pilot rehearsal                   | Needs verification | Chromium Playwright now covers the buyer path, seller/admin browser flow, seller handoff actions, and the order privacy matrix against disposable PostgreSQL; the isolated 10-user rehearsal still needs to be run.                                                  |

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
- `apps/mobile` Playwright closed-pilot browser suite passed against disposable PostgreSQL.
- `corepack pnpm lint` passed once Turbo was forced through the pinned pnpm 11.7.0 wrapper.
- `corepack pnpm format:check` failed with repo-wide Prettier warnings across 162 files.

See `10-CODE-ARCHITECTURE.md` for boundaries and `05-MVP-RFC.md` for product contract gaps.

# bidplace — текущий статус проекта

Последнее обновление: 2026-07-24
Статус: Technical baseline is Partial; the current snapshot verifies seller application, buyer privacy mode, image reorder safety, API unit tests and mobile typecheck, but the API integration suite still has one failing concurrent-bid case and closed-pilot browser/E2E seller-path verification is still pending.

## Реализовано

| Поведение                 | Evidence                                                                                                                                                                                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical storage model   | `packages/database/prisma/schema.prisma`, `packages/database/prisma/migrations/20260716000000_baseline/migration.sql`: nullable `phone`, `email_verified_at`, `TermsAcceptance`, `EmailVerificationCode`, moderation enums, handoff snapshot fields and append-only `AuditEvent` are present with the expected partial indexes. |
| Product and Listing rules | `apps/api/src/products`, `apps/api/src/listings`, `apps/api/src/admin`, `apps/api/src/sellers/seller-capability.ts`, `apps/api/src/products/public-visibility.ts`: draft Product, submit-to-review, approval gate, owner lock after `SCHEDULED`/`LIVE`, shared public visibility predicates and BYN-only auction rules. |
| Seller privacy and image reorder | `apps/api/src/orders/orders.service.ts`, `apps/api/src/images/images.service.ts`: buyer-facing Order projections hide seller contacts in `SELLER_CONTACTS_BUYER`, keep them in `BUYER_CONTACTS_SELLER`, and image reordering uses a two-phase temporary offset to avoid unique-position collisions; both paths have unit coverage. |
| Bids and soft close       | `apps/api/src/bids`, `apps/api/src/core/auction/pricing-policy.ts`, `apps/api/src/bids/bid-eligibility.ts`: serializable transaction, idempotency key, self-bid gate, compare-and-update, BYN increment policy, 60/60/600 soft close, email verification and versioned rules acceptance. |
| Lifecycle and Order       | `apps/api/src/lifecycle`, `apps/api/src/orders`, `apps/api/src/orders/order-snapshot.ts`: scheduler activation/closing, deterministic winner, atomic Order foundation, active-order snapshot, seller handoff actions, manual admin cancellation/replacement and audit. |
| Email verification and rules | `apps/api/src/otp`, `apps/api/src/auth`, `apps/api/src/core/rules.ts`: hashed one-time OTP, expiry, retry/cooldown/rate limiting, production SMTP transport via nodemailer, versioned service-rules text and test-only bypass validation. |
| Public and realtime API   | `packages/contracts`, `packages/api-client`, `apps/api/src/realtime`: public Product projections exclude seller internal identifiers and buyer PII; listings use `listing:*` events; mobile uses HTTP as canonical snapshot and refetches on socket reconnect/events. |
| Local reset and seed      | The reset guard is present; the seed fixture still needs a fresh re-run after the MVP schema updates and was not revalidated in this snapshot. |
| Prisma generated client   | `packages/database` generates its custom Prisma Client before build. The generated directory is intentionally ignored and is not part of the source baseline.                                                                                                         |

## Partial / needs verification

| Area                          | Current evidence                                                                                                                                                                                                | Remaining gap                                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Seller and admin mobile flows | Seller application now includes `fullName`, public profile photo, editable handoff corrections in `CHANGES_REQUESTED`, and status-gated read-only mode outside that state; Product/Listing forms and compact `/admin` moderation controls still exist.             | Device/accessibility QA and browser/E2E seller-path verification remain incomplete.                                                                                               |
| Product detail UX             | `/product/[publicId]` has images, value fields, Listing state, server-deadline countdown, bid history, OTP actions, Activity-derived participation, Order link and realtime refetch. All UI components strictly typed without `any` casts. | Mobile/device accessibility QA remains.                                                                                                   |
| Tests                         | API unit suite passed; `apps/api/test/integration/product-listing.integration.spec.ts` still has one failing concurrent-bid case. Expo Router types and UI codebase typechecked. | Release-hardening browser/device/accessibility matrix remains deferred. |
| Operations                    | Single-process scheduler and Socket.IO gateway work for MVP.                                                                                                                                                    | Multi-instance deployment requires a distributed lock or external queue before scaling; binary database image storage remains pilot-only. |

## Confirmed MVP implementation gaps — 2026-07-23

| Area | Status | Required implementation evidence |
| --- | --- | --- |
| Public seller application and capability | Partial | `POST/PATCH /seller/profile`, seller status projection and the seller-write capability gate now exist, and the mobile application screen uses multipart photo upload; closed-pilot browser/E2E verification of the seller-path remains pending. |
| Seller profile data | Partial | Handoff contact, handoff initiator, immutable public `fullName`, profile photo upload/public URL and `CHANGES_REQUESTED` edit flow for public and handoff fields now exist in schema, API and mobile; browser/device QA remains. |
| Product moderation and visibility | Implemented | `submit`, admin moderation service, audit records, `publishedAt`, one-image approval gate and shared public catalog/direct visibility predicates are in place. |
| Seller handoff actions | Implemented | Order snapshots `sellerHandoffType`, `sellerHandoffValue`, `buyerEmailAtClose` and `handoffInitiator`; seller actions and admin replacement/cancellation preserve audit and role-scoped projections. |
| Timestamps | Partial | Most mutable records have timestamps; the confirmed all-entity `createdAt`/`updatedAt` and Product `publishedAt` requirement is not yet implemented. |
| Pilot analytics | Not implemented | Add minimal first-party funnel and outcome events only; no dashboard or third-party marketing tracker. |
| Production email verification | Implemented | `apps/api/src/otp`, `apps/api/src/auth`, `apps/api/src/bids/bid-eligibility.ts` now enforce SMTP-backed email verification, versioned rules acceptance and a test-only bypass that stays disabled in production. |
| Closed-pilot rehearsal | Needs verification | Existing Chromium E2E covers the buyer path, not the confirmed seller application/moderation flow or the required 10-user rehearsal. |

## Intentional MVP boundaries

- Only `ListingType.AUCTION` and `BYN` exist.
- No `Lot`, central `Auction`, Buy Now, reserve price, reserve UI or USD fixture remains in the runtime model.
- Payment, delivery, chat, automatic winner replacement and notifications are not implemented.
- Manual admin replacement preserves cancelled Order history; automatic replacement is Planned.
- Design is frozen for the next MVP implementation wave: reuse the present UI and do not include a redesign in these domain/security tasks.

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
- `apps/api` unit Vitest suite passed: 22 files, 91 tests.
- `apps/api` integration Vitest suite currently has one failing test in `test/integration/product-listing.integration.spec.ts` (`serializes concurrent accepted Bids into the canonical higher price`), which rejects `11` with `Bid must be at least 12.50`; this remains to be investigated.
- `apps/mobile` typecheck passed after seller application, product and admin UI updates.

See `10-CODE-ARCHITECTURE.md` for boundaries and `05-MVP-RFC.md` for product contract gaps.

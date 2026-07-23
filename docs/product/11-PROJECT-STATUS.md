# bidplace — текущий статус проекта

Последнее обновление: 2026-07-23
Статус: Technical baseline is Partial; confirmed MVP decisions require implementation before the next closed-pilot gate.

## Реализовано

| Поведение                 | Evidence                                                                                                                                                                                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical storage model   | `packages/database/prisma/schema.prisma`: `SellerProfile → Product → Listing → AuctionRules → Bid → Order`; baseline `20260716000000_baseline` создаёт schema с partial indexes `one_active_listing_per_product` и `one_active_order_per_listing`.                    |
| Product and Listing rules | `apps/api/src/products`, `apps/api/src/listings`, `apps/api/src/admin`: draft Product, approval completeness gate, owner lock after `SCHEDULED`/`LIVE`, explicit Listing transitions and BYN-only auction rules.                                                      |
| Bids and soft close       | `apps/api/src/bids`, `apps/api/src/core/auction/pricing-policy.ts`: serializable transaction, idempotency key, self-bid/phone gates, compare-and-update, BYN increment policy, 60/60/600 soft close.                                                                  |
| Lifecycle and Order       | `apps/api/src/lifecycle`, `apps/api/src/orders`: scheduler activation/closing, deterministic winner, atomic Order foundation, owner/admin authorization, manual admin cancellation/replacement.                                                                       |
| Phone verification        | `apps/api/src/otp`, `PhoneVerificationCode`: hashed one-time OTP, expiry, retry/cooldown and rate limiting. A production transport remains blocked by an external provider configuration.                                                                             |
| Public and realtime API   | `packages/contracts`, `packages/api-client`, `apps/api/src/realtime`: public Product projections exclude seller internal identifiers and buyer PII; listings use `listing:*` events; mobile uses HTTP as canonical snapshot and refetches on socket reconnect/events. |
| Local reset and seed      | The reset guard is present, but `packages/database/prisma/seed.js` contains `seedEnded3`, a 10-character Product publicId that violates the 11-character contract and can make the public catalog response fail validation. This requires a fixture fix and rerun. |
| Prisma generated client   | `packages/database` generates its custom Prisma Client before build. The generated directory is intentionally ignored and is not part of the source baseline.                                                                                                         |

## Partial / needs verification

| Area                          | Current evidence                                                                                                                                                                                                | Remaining gap                                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Seller and admin mobile flows | Owner/public Seller APIs, Product/Listing forms, later Product draft editing, draft image upload/review/delete/reordering, and compact `/admin` status and manual Order replacement controls exist.             | Device/accessibility QA remains incomplete.                                                                                               |
| Product detail UX             | `/product/[publicId]` has images, value fields, Listing state, server-deadline countdown, bid history, OTP actions, Activity-derived participation, Order link and realtime refetch. All UI components strictly typed without `any` casts. | Mobile/device accessibility QA remains.                                                                                                   |
| Tests                         | API unit/integration suites, clean migration/reset/seed, full lint/typecheck/build gates and Chromium E2E pass. Expo Router types and UI codebase fully typechecked. `apps/mobile/e2e/closed-pilot.spec.ts` covers Product → UI login → test OTP → Bid → Activity → ended Order, outsider Order denial, ordinary-user admin denial, permitted admin Order access and absent legacy route. | Release-hardening browser/device/accessibility matrix remains deferred. |
| Operations                    | Single-process scheduler and Socket.IO gateway work for MVP.                                                                                                                                                    | Multi-instance deployment requires a distributed lock or external queue before scaling; binary database image storage remains pilot-only. |

## Confirmed MVP implementation gaps — 2026-07-23

| Area | Status | Required implementation evidence |
| --- | --- | --- |
| Public seller application and capability | Not implemented | Public `PENDING_REVIEW` SellerProfile application; admin approval makes the profile itself the seller capability; backend authorization on all seller writes; suspension/revoke tests; capability projection and admin UI. |
| Seller profile data | Partial | Current profile lacks the confirmed profile photo, `fullName`, handoff contact and public-application distinction. Add the confirmed public fields without exposing buyer data automatically. |
| Product moderation and visibility | Partial | Current Product can be approved but has no explicit submitted/review state. Add private-under-review behavior, moderation reason/history and `publishedAt`; change the approval image gate from three to one and limit catalog visibility to scheduled/live Listing. |
| Seller handoff actions | Not implemented | Seller must record contact/result or failure. Extend Order with the confirmed active-order contact projection: seller-selected Telegram/phone/Instagram for buyer, verified buyer email for seller, and privacy mode. |
| Timestamps | Partial | Most mutable records have timestamps; the confirmed all-entity `createdAt`/`updatedAt` and Product `publishedAt` requirement is not yet implemented. |
| Pilot analytics | Not implemented | Add minimal first-party funnel and outcome events only; no dashboard or third-party marketing tracker. |
| Production email verification | Not implemented | Current phone OTP flow does not match the confirmed MVP. Implement production email verification before first Bid, versioned service-rules acceptance and a test-only non-production bypass. |
| Closed-pilot rehearsal | Needs verification | Existing Chromium E2E covers the buyer path, not the confirmed seller application/moderation flow or the required 10-user rehearsal. |

## Intentional MVP boundaries

- Only `ListingType.AUCTION` and `BYN` exist.
- No `Lot`, central `Auction`, Buy Now, reserve price, reserve UI or USD fixture remains in the runtime model.
- Payment, delivery, chat, automatic winner replacement and notifications are not implemented.
- Manual admin replacement preserves cancelled Order history; automatic replacement is Planned.
- Design is frozen for the next MVP implementation wave: reuse the present UI and do not include a redesign in these domain/security tasks.

## Closed-pilot verification — 2026-07-19

- Frozen workspace install; full lint and typecheck; API build; Expo web export; Prisma validation; isolated reset and seed passed.
- API unit and PostgreSQL integration suites passed.
- Chromium E2E passed: 3 tests, real Expo web + API + isolated `bidplace_e2e` database + local test OTP adapter.

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

- `tsc` for contracts, API client, API and mobile;
- API Vitest suite: 19 files, 72 tests;
- mobile Vitest suite: 1 file, 3 tests;
- isolated PostgreSQL integration suite: 2 files, 8 tests; clean migration reset and deterministic seed;
- direct SQL confirmation of Listing seed states and both partial unique indexes.

See `10-CODE-ARCHITECTURE.md` for boundaries and `05-MVP-RFC.md` for product contract gaps.

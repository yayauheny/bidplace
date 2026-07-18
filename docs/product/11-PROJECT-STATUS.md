# bidplace — текущий статус проекта

Последнее обновление: 2026-07-18
Статус: Partial — Product / Listing migration реализована, но pilot UI и полный integration coverage ещё не завершены.

## Реализовано

| Поведение                 | Evidence                                                                                                                                                                                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical storage model   | `packages/database/prisma/schema.prisma`: `SellerProfile → Product → Listing → AuctionRules → Bid → Order`; baseline `20260716000000_baseline` создаёт schema с partial indexes `one_active_listing_per_product` и `one_active_order_per_listing`.                    |
| Product and Listing rules | `apps/api/src/products`, `apps/api/src/listings`, `apps/api/src/admin`: draft Product, approval completeness gate, owner lock after `SCHEDULED`/`LIVE`, explicit Listing transitions and BYN-only auction rules.                                                      |
| Bids and soft close       | `apps/api/src/bids`, `apps/api/src/core/auction/pricing-policy.ts`: serializable transaction, idempotency key, self-bid/phone gates, compare-and-update, BYN increment policy, 60/60/600 soft close.                                                                  |
| Lifecycle and Order       | `apps/api/src/lifecycle`, `apps/api/src/orders`: scheduler activation/closing, deterministic winner, atomic Order foundation, owner/admin authorization, manual admin cancellation/replacement.                                                                       |
| Phone verification        | `apps/api/src/otp`, `PhoneVerificationCode`: hashed one-time OTP, expiry, retry/cooldown and rate limiting. A production transport remains blocked by an external provider configuration.                                                                             |
| Public and realtime API   | `packages/contracts`, `packages/api-client`, `apps/api/src/realtime`: public Product projections exclude seller internal identifiers and buyer PII; listings use `listing:*` events; mobile uses HTTP as canonical snapshot and refetches on socket reconnect/events. |
| Local reset and seed      | Verified 2026-07-18: `prisma migrate reset` applied the rewritten baseline to local PostgreSQL; `prisma/seed.js` created deterministic admin plus scheduled/live/ended BYN Product Listings.                                                                          |

## Partial / needs verification

| Area                          | Current evidence                                                                                                                                                                                    | Remaining gap                                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Seller and admin mobile flows | Owner/public Seller APIs, Product/Listing forms, later Product draft editing, draft image upload/review/delete/reordering, and compact `/admin` status and manual Order replacement controls exist. | Device/accessibility QA remains incomplete.                                                                                               |
| Product detail UX             | `/product/[publicId]` has images, value fields, Listing state, server-deadline countdown, bid history, OTP actions, Activity-derived participation, Order link and realtime refetch.                | Mobile/device accessibility QA remains.                                                                                                   |
| Tests                         | API unit suite and mobile query-cache suite pass; pricing boundaries pass; clean migration and seed were executed manually.                                                                         | Required PostgreSQL race/idempotency/invariant tests and dedicated Product/Order/Activity/realtime unit tests are still incomplete.       |
| Operations                    | Single-process scheduler and Socket.IO gateway work for MVP.                                                                                                                                        | Multi-instance deployment requires a distributed lock or external queue before scaling; binary database image storage remains pilot-only. |

## Intentional MVP boundaries

- Only `ListingType.AUCTION` and `BYN` exist.
- No `Lot`, central `Auction`, Buy Now, reserve price, reserve UI or USD fixture remains in the runtime model.
- Payment, delivery, chat, automatic winner replacement and notifications are not implemented.
- Manual admin replacement preserves cancelled Order history; automatic replacement is Planned.

## Checks executed for this snapshot

- `tsc` for contracts, API client, API and mobile;
- API Vitest suite: 19 files, 72 tests;
- mobile Vitest suite: 1 file, 3 tests;
- isolated PostgreSQL integration suite: 2 files, 8 tests; clean migration reset and deterministic seed;
- direct SQL confirmation of Listing seed states and both partial unique indexes.

See `10-CODE-ARCHITECTURE.md` for boundaries and `05-MVP-RFC.md` for product contract gaps.

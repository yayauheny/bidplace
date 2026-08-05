# Wave 2 — auction integrity progress

Дата: 2026-08-05
Ветка: `feature/auction-integrity-wave-2`
Статус: Implemented

## Scope matrix

| Поведение                             | Actor                   | Current implementation                                        | Required evidence                                            |
| ------------------------------------- | ----------------------- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| Bid on `SCHEDULED` Listing            | ordinary verified buyer | `BidsService.place` rejects non-`LIVE` Listing                | PostgreSQL integration; unchanged Listing/Bid/event state    |
| stale minimum after another buyer Bid | two ordinary buyers     | serializable transaction + compare-and-update + minimum check | PostgreSQL reject/refetch/retry and idempotent replay        |
| Bid outside soft-close window         | ordinary verified buyer | accepted Bid keeps `endsAt`                                   | PostgreSQL persisted state                                   |
| Bid at inclusive 60-second boundary   | ordinary verified buyer | accepted Bid extends `endsAt` by 60 seconds                   | PostgreSQL persisted state and next bid                      |
| soft-close total cap                  | ordinary verified buyer | `resolveSoftCloseEndsAt` caps at original `endsAt + 600s`     | PostgreSQL repeated extensions and rejected post-close state |
| close after extended deadline         | lifecycle service       | close reads persisted `endsAt`                                | PostgreSQL close before/after persisted deadline             |

## Chosen approach

- Use isolated PostgreSQL fixtures and the existing `BidsService`/
  `ListingLifecycleService` public methods. Prisma only creates and reads
  fixture state.
- Use the existing mobile bid form and API client for one real reject →
  refetch → retry Chromium scenario. No UI or contract changes are planned.
- Change runtime code only if the tests demonstrate a mismatch with the
  confirmed MVP/RFC rules.

## Evidence completed

- `apps/api/test/integration/auction-integrity.integration.spec.ts`: 5/5
  PostgreSQL tests passed. The fixture helper uses Prisma only for isolated
  setup and state assertions; every tested mutation uses the public
  `BidsService` or `ListingLifecycleService` boundary.
- `apps/mobile/e2e/auction-integrity.spec.ts`: 1/1 Chromium test passed. Buyer
  A changes the listing through the authenticated API; Buyer B's browser
  submits the stale amount, receives the real server rejection, refetches the
  canonical minimum and retries successfully. API assertions verify two Bid
  rows and the canonical price/count.
- Full API PostgreSQL integration: 25/25. API unit tests: 136/136. API and
  mobile lint and typecheck passed.
- No runtime, API contract, UI, auction rule or product-document changes were
  required. `09-TRUST-AND-AUCTION-INTEGRITY.md` and
  `10-CODE-ARCHITECTURE.md` remain unchanged.

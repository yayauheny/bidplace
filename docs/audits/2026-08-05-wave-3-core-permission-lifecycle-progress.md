# Wave 3 — core permission, moderation and lifecycle coverage

Дата: 2026-08-05
Ветка: `feature/core-permission-lifecycle-coverage`
Статус: In progress

## Scope

Wave 3 closes the remaining server-authority evidence gaps without changing
product rules, statuses, API contracts, UI or seed behavior:

- direct HTTP permission matrix for seller Product, Listing, image and
  SellerProfile writes;
- seller application and reasoned moderation transitions with append-only
  audit assertions;
- HTTP cookie, CORS, `/me`, logout and stale-session transport behavior;
- persisted lifecycle close behavior for no-bid, deterministic ties and
  repeated close.

## Existing authority boundaries

| Boundary            | Current implementation                                                                                                  | Wave 3 evidence                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| seller capability   | `assertApprovedSeller` in Product, Listing and image services; `SellersService.update` permits only `CHANGES_REQUESTED` | real HTTP actor/status matrix and unchanged persisted rows on denial                        |
| HTTP authentication | `BearerAuthGuard`, `AdminGuard`, session-version check and HttpOnly cookie                                              | login → cookie → `/me` → logout → rejected stale session; allowed/disallowed Origin headers |
| moderation          | `AdminModerationService` serializable status transition plus `AuditEvent`                                               | seller/Product transitions, required reasons, actor/old/new status, repeat/lock denial      |
| lifecycle close     | `ListingLifecycleService.close` updates Listing and creates one winner Order transactionally                            | no-bid close, `amount DESC → createdAt ASC → id ASC` tie and idempotent repeat              |

## Test architecture

- PostgreSQL uses the existing isolated schema context from
  `apps/api/test/integration/test-database.ts`.
- Prisma is used only to create fixture state and inspect persisted state.
- Mutations under test use the real Nest HTTP app, guards, controllers and
  services; no Prisma, guard or service mocks are used in integration tests.
- Denied mutations assert unchanged Product, Listing, ProductImage,
  SellerProfile, AuditEvent and relevant counters.

## Baseline

Existing Wave 1 and Wave 2 evidence remains unchanged. The exact commands and
final results will be appended after each block is verified.

## Block A — direct API seller permissions

Status: Implemented

- `apps/api/test/integration/seller-permissions.integration.spec.ts`: 3/3
  PostgreSQL-backed HTTP tests passed.
- `apps/api/test/integration/http-test-app.ts` starts the real Nest app on an
  ephemeral port; requests pass through session cookie, guards, controllers,
  services and PostgreSQL.
- Guest, ordinary buyer, pending/changes/suspended owner, approved owner and
  another approved seller are covered across Product, Listing, ProductImage
  and SellerProfile writes. Every denied mutation compares persisted Product,
  Listing, ProductImage, SellerProfile and AuditEvent state before and after.
- No production defect was found. The fixture initially used an invalid
  underscore-containing slug for `CHANGES_REQUESTED`; the fixture now applies
  the existing slug normalization rule.

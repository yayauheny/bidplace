# Wave 3 — core permission, moderation and lifecycle coverage

Дата: 2026-08-05
Ветка: `feature/core-permission-lifecycle-coverage`
Статус: Implemented

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

| Boundary            | Current implementation                                                                                                  | Wave 3 evidence                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| seller capability   | `assertApprovedSeller` in Product, Listing and image services; `SellersService.update` permits only `CHANGES_REQUESTED` | real HTTP actor/status matrix and unchanged persisted rows on denial                                                     |
| HTTP authentication | `BearerAuthGuard`, `AdminGuard`, session-version check and HttpOnly cookie                                              | registration/login → cookie → `/me` → logout → rejected stale session; allowed/disallowed Origin headers                 |
| HTTP bootstrap      | `loadServerEnv` and `resolveCorsOrigin` configure production CORS and proxy behavior                                    | `configureHttpApp` is shared by `main.ts` and the PostgreSQL HTTP test helper                                            |
| moderation          | `AdminModerationService` serializable status transition plus `AuditEvent`                                               | seller/Product transitions including terminal reject/archive, required reasons, actor/old/new status, repeat/lock denial |
| lifecycle close     | `ListingLifecycleService.close` updates Listing and creates one winner Order transactionally                            | no-bid close, `amount DESC → createdAt ASC → id ASC` tie and idempotent repeat                                           |

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
  and SellerProfile writes, including Listing `PATCH` and ProductImage
  `DELETE`. Every denied mutation compares persisted Product, Listing,
  ProductImage, SellerProfile and AuditEvent state before and after.
- Pending, `CHANGES_REQUESTED` and suspended sellers now each target their own
  fixture Listing and own ProductImage for the denied Listing `PATCH` and image
  `DELETE` cases, proving the seller status gate rather than an ownership
  rejection.
- No production defect was found. The fixture initially used an invalid
  underscore-containing slug for `CHANGES_REQUESTED`; the fixture now applies
  the existing slug normalization rule.

## Block B — seller application and moderation audit

Status: Implemented

- `apps/api/test/integration/moderation.integration.spec.ts`: 3/3
  PostgreSQL-backed HTTP tests passed.
- A real ordinary-user multipart application persists normalized profile data
  and `PENDING_REVIEW` state without an audit event for the application itself.
- Admin approval, `CHANGES_REQUESTED`, re-approval and suspension persist the
  actor, old/new status and required reason with exactly one append-only
  `AuditEvent` per accepted transition.
- Missing reasons, repeated transitions and scheduled-listing moderation locks
  return existing errors and leave all persisted rows and audit state unchanged.
- SellerProfile `REJECTED`, Product `REJECTED` and Product `ARCHIVED` are
  exercised through HTTP with one audit event per accepted transition. The
  active-listing archive lock is denied with unchanged PostgreSQL state.
- No product rule, status machine or API contract was changed.

## Block C — auth transport

Status: Implemented

- `apps/api/test/integration/auth-transport.integration.spec.ts`: 4/4
  PostgreSQL-backed HTTP tests passed.
- Registration normalizes email, phone and display name, establishes the same
  session cookie used by `/auth/me`, and rejects a normalized duplicate without
  an additional persisted row or related write.
- Allowed-origin login sets the existing HttpOnly, SameSite=Lax, Path and
  12-hour session cookie; the cookie authenticates `/auth/me`.
- Logout clears the cookie using the existing epoch-`Expires` contract and
  increments the persisted session version. The old cookie and invalid tokens
  are rejected by the real guard.
- Allowed-origin CORS headers are present; a forbidden origin does not match
  `Access-Control-Allow-Origin`, including for preflight, so the browser cannot
  use the authenticated response.
- No cookie, CORS, CSRF or guard behavior was changed.

## Block D — lifecycle close outcomes

Status: Implemented

- `apps/api/test/integration/lifecycle-close.integration.spec.ts`: 2/2
  PostgreSQL tests passed.
- An expired LIVE Listing with no bids becomes `ENDED` without a winner or
  Order; repeat close leaves persisted state unchanged and emits no second
  event.
- Equal amount/equal timestamp bids use the existing canonical
  `amount DESC → createdAt ASC → id ASC` ordering. The selected Bid becomes the
  sole Order source, and the persisted Listing plus `listing.ended` payload
  agree on status, price, count and deadline.
- No lifecycle rule or tie-break implementation was changed.

## Final verification

All required Wave 3 checks passed on 2026-08-05:

- API typecheck — passed;
- API lint — passed;
- API unit — 33 files, 136 tests passed;
- API PostgreSQL integration — 10 files, 37 tests passed;
- mobile typecheck — passed;
- mobile lint — passed;
- relevant Chromium Wave 3 scenarios (`wave-one.spec.ts`) — 5/5 passed;
- full Chromium E2E suite — 30/30 passed;
- `git diff --check` — passed;
- branch: `feature/core-permission-lifecycle-coverage`.

## Intentionally deferred

No new browser scenario was added because Wave 3 adds no user-facing behavior;
the existing relevant Chromium Wave 3 scenario was rerun. Visual design,
physical-device and screen-reader acceptance, WebKit/cross-browser coverage and
the isolated 10-user rehearsal remain outside this wave.

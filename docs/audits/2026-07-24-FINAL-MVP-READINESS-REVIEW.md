# Final MVP readiness review

Date: 2026-07-24  
Reviewed revision: `feature/editorial-redesign` at `f59c341` (`fix issue: sync api client contracts`)  
Scope: read-only audit of the MVP closure set. No source, schema, migration, contract, seed, lockfile or existing documentation was changed. This report is the sole audit artifact created by the review.

## 1. Executive summary

The implementation has a substantially coherent Product → Listing → AuctionRules → Bid → Order model, server-side bid processing, deterministic closing, moderation gates, and shared Zod contracts. It is **not ready for a technical rehearsal with real users**, a first real transaction, or a public MVP yet.

There are no confirmed P0 findings. Five P1 findings remain, including a broken seller Order projection, auction-price semantics that contradict the confirmed `startPrice` rule, no trustworthy end-to-end proof of concurrent bidding, unauthenticated/unbounded Socket.IO room joins, and OTP SMTP that can fall back to plaintext transport. The buyer/seller completion UI is also incomplete: the current Order screen neither renders the authorised contact fields nor exposes seller handoff actions.

Counts: **P0 0, P1 5, P2 5, P3 2.**

## 2. Audit scope

Reviewed the root and mobile instructions, Product Foundation, MVP RFC, status/architecture documents, product/design ownership indexes, prior Task A/Task B audit plans, README, Prisma schema/baseline migration/seed, contracts, API client, API modules, Expo routes/screens, scheduler, realtime, auth/authorization, tests, environment configuration, Docker Compose and package scripts.

This was a code and configuration audit, not a change task. Destructive seed/reset and E2E setup were deliberately not run because they reset PostgreSQL databases. Dependency audit could not run without network.

## 3. Git state and reviewed revision

At the start, `git status --short` contained only pre-existing untracked objects: `.agents/`, `.pnpm-store/`, `docs 2.zip`, `docs.zip`, and `skills-lock.json`. `git diff --name-only` was empty. The reviewed closure commits are `879e488` and `f59c341`; their previously missing API-client and server dependencies are now committed.

## 4. Source-of-truth documents

| Owner | Audit use |
| --- | --- |
| `docs/product/01-PRODUCT-FOUNDATION.md` | Value-first creator marketplace boundary; no mass resale or artificial bids. |
| `docs/product/05-MVP-RFC.md` | MVP flows, email verification, BYN, scheduled auction, Order privacy and release criteria. |
| `docs/product/08-SELLER-AND-ITEM-POLICY.md` and `09-TRUST-AND-AUCTION-INTEGRITY.md` | Seller moderation and auction/privacy controls. |
| `docs/product/10-CODE-ARCHITECTURE.md` | Intended module and contract boundaries. |
| `docs/product/11-PROJECT-STATUS.md` | Current claimed verification and remaining gaps. |
| `docs/design/00`–`05` | Mobile-first design, UI system, flows and completeness claims. |

The current source of truth is the email-verification MVP RFC. The older phone-verification language in stale test tooling is not an approved implementation requirement.

## 5. Confirmed architecture

- `SellerProfile`, `Product`, `Listing`, `AuctionRules`, `Bid`, and `Order` are separate persistence entities in `packages/database/prisma/schema.prisma`.
- Runtime has only `ListingType.AUCTION` and returns BYN in contracts. No runtime `buyNowPrice` or reserve-price field was found.
- Public IDs are unique and generated with collision retries in Product and Order creation paths.
- Bid writes run in serializable transactions with an optimistic listing compare-and-update; lifecycle closing also uses serializable transactions and a status/deadline compare-and-update.
- Baseline SQL contains the required partial unique indexes for one active Listing per Product and one non-cancelled Order per Listing. Prisma schema cannot express those partial indexes, so migrations—not `db push`—are the authoritative deployment mechanism.

## 6. Test and build results

| Command | Result | Notes |
| --- | --- | --- |
| `corepack pnpm --filter @bidplace/database typecheck` | Pass | Independently run before this audit report. |
| `corepack pnpm --filter @bidplace/api-client build` | Pass | Independently run. |
| `corepack pnpm --filter @bidplace/api typecheck` | Pass | Independently run. |
| `corepack pnpm --filter @bidplace/mobile typecheck` | Pass | Independently run. |
| `corepack pnpm --filter @bidplace/api test` | Pass | 22 files, 94 tests. |
| `git diff --check` | Pass | No whitespace errors. |
| `corepack pnpm format:check` | Fail | 161 files reported by Prettier; many are tracked source/docs, others are existing untracked material. |
| `corepack pnpm lint` | Blocked/fail | Package-manager guard rejects Corepack pnpm 11.10.0 while root declares 11.7.0; lint rules did not execute. |
| `corepack pnpm --filter @bidplace/api build` | Pass | Nest build completed. |
| `corepack pnpm --filter @bidplace/mobile build` | Inconclusive | Expo export began but the combined command did not yield a terminal success/failure record. |
| `corepack pnpm --filter @bidplace/database exec prisma validate --schema prisma/schema.prisma` | Pass | Prisma schema valid. |
| `corepack pnpm --filter @bidplace/api test:integration` | Blocked | PostgreSQL was not running at `127.0.0.1:5432`; no database was created, reset or modified. |
| Playwright E2E | Not run | Existing setup executes `migrate reset --force`; forbidden by this audit’s non-destructive scope. It is also stale; see P1-3. |
| `corepack pnpm audit --offline` | Not available | Advisory endpoint was unreachable; no vulnerability result was fabricated. |

## 7. MVP feature matrix

| Requirement | Status | Evidence / remaining gap | Blocks |
| --- | --- | --- | --- |
| Value-first creator model and no reserve/buy-now/USD | Implemented but insufficiently tested | Prisma enums, contracts, Product/Listing code; E2E has a legacy-route assertion but is stale. | No |
| Seller application and admin approval | Partial | `SellersService`, `AdminModerationService`, seller screen; no verified seller/admin E2E. | Rehearsal |
| Product draft, image upload, moderation and public visibility | Implemented but insufficiently tested | Product/image services, approval predicates, unit tests. | No |
| Scheduled Listing and server activation | Implemented but insufficiently tested | Listing service, lifecycle cron, baseline partial unique index. | Rehearsal |
| Bid validation, idempotency and self-bid prevention | Implemented incorrectly | Server controls exist, but `startPrice` and increment semantics violate RFC; see P1-2. | First transaction |
| Soft close and deterministic close | Implemented but insufficiently tested | `resolveSoftCloseEndsAt`, serializable lifecycle close, unit/integration source. Concurrent DB run unavailable. | Rehearsal |
| Winner/Order creation and manual replacement | Partial | Server transactional paths exist. Seller-facing projection/action path and mobile Order flow are incomplete; see P1-1. | First transaction |
| Email verification and versioned rules | Implemented but insufficiently tested | OTP service, rules acceptance and bid eligibility. SMTP transport is not forced to TLS; see P1-5. | Public launch |
| Public realtime with HTTP refetch | Partial | Client refetches canonical HTTP state after events/reconnect. Gateway is unprotected/unbounded; see P1-4. | Rehearsal |
| Buyer activity and Order result | Partial | Activity route/screen exists; contacts and seller completion controls are absent from Order UI. | First transaction |
| Admin moderation and audit | Partial | Backend state transitions/audit writes exist; UI exposes only a subset of transitions and no audit-event view. | Rehearsal |
| Closed-pilot browser rehearsal | Needs manual verification | E2E script targets removed phone OTP flow. | Rehearsal |

## 8. P0 findings

None confirmed.

## 9. P1 findings

### [P1-1] Seller receives a buyer projection, and neither party can complete handoff in the mobile Order screen

Area: Order privacy and handoff  
Files: `apps/api/src/orders/orders.service.ts:45-60,330-378`; `apps/api/src/orders/orders.controller.ts`; `apps/mobile/src/features/orders/order-screen.tsx`; `packages/api-client/src/orders.ts`  
Requirement: Seller sees only the permitted buyer contact; buyer sees only seller contact allowed by handoff mode; seller can confirm contact/completion/failure.  
Observed behavior: `OrdersController` passes the JWT role (`admin` or `user`) into `OrdersService.get()`. An approved seller has the global role `user`, but `toResponse()` emits the seller projection only for literal role `seller`. Thus a seller opening their own Order receives the buyer projection instead of `buyerEmailAtClose`. The unit test masks this by directly passing an impossible global role `seller`. The API client exposes only GET; the Order screen renders only item, amount and deadline, never contacts or seller action controls.  
Evidence: `auth.mapper.ts` maps roles to `admin | user`; `orders.service.spec.ts:26-33` supplies `seller` directly; the Order screen does not read any contact field.  
Reproduction: Log in as the actual seller (role `user`) and request `/api/orders/:publicId`; `buyerEmailAtClose` is absent. On mobile/web, no authorised handoff data or `contacted/completed/handoff-failed` action is displayed.  
Impact: The first sale cannot be completed through the product; privacy projection is semantically wrong.  
Why tests missed it: Test input uses a role the authenticated application never assigns.  
Recommended correction: Determine response audience from `userId` and `Order` relation (`admin`, `seller`, `buyer`), not global role. Add contact/action methods to API client and render role-specific Order controls and failure states.  
Required tests: Controller/service test with actual seller JWT role `user`; buyer/seller/admin privacy matrix; mobile Order render/action test; E2E completed-handoff path.  
Blocks: technical rehearsal Yes; first real transaction Yes; public MVP Yes. Confidence: High.

### [P1-2] `startPrice` is not the minimum accepted first bid, and increment compliance is not enforced

Area: Auction integrity and money  
Files: `apps/api/src/listings/listings.service.ts:35-47`; `apps/api/src/bids/bids.service.ts:72-101`; `apps/api/src/core/auction/pricing-policy.ts`; `docs/product/05-MVP-RFC.md` sections 7–8  
Requirement: `startPrice` is the minimum price at which the author is willing to sell; bid amount conforms to the approved BYN step policy.  
Observed behavior: Listing creation initializes `currentPrice = startPrice`. Bid placement always requires `amount >= resolveMinimumNextBid(currentPrice)`. A Listing with start price 10 therefore rejects the first bid of 10 and requires at least 10.50. The endpoint verifies only the lower bound, not alignment to the current step; e.g. 10.51 passes for a 0.50 step.  
Evidence: `BidsService.place()` has only `amount.lessThan(minimum)` and no increment-modulus check. Integration fixtures use 10 → 11, so they do not exercise the contractual opening bid or fractional step rule.  
Reproduction: Schedule a Listing with `startPrice: 10`; submit `{amount:10}` as the first eligible bid (rejected) and `{amount:10.51}` (accepted).  
Impact: Violates a confirmed price promise and can produce non-policy bid amounts.  
Why tests missed it: Pricing tests select a step and test soft-close only; no first-bid or invalid-fractional-step test exists.  
Recommended correction: Model a no-bid opening state explicitly, or calculate first minimum from `AuctionRules.startPrice`; validate the exact approved increment policy server-side.  
Required tests: first bid exactly at start price; each boundary; malformed increment; concurrent first bids.  
Blocks: technical rehearsal Yes; first real transaction Yes; public MVP Yes. Confidence: High.

### [P1-3] The required end-to-end rehearsal is stale and cannot prove the current MVP

Area: Verification and buyer flow  
Files: `apps/mobile/e2e/closed-pilot.spec.ts:52-72`; `apps/mobile/e2e/prepare.mjs`; `apps/mobile/playwright.config.ts`; `apps/api/src/otp/otp.controller.ts`; `docs/product/11-PROJECT-STATUS.md`  
Requirement: Browser rehearsal covers registration/login, current verification gate, bid, activity, end state, Order privacy and seller/moderation flow.  
Observed behavior: Playwright expects `/api/auth/phone/request`, phone labels and SMS text, while the current implementation exposes `/api/auth/email/request`, an email/rules gate and `TEST_EMAIL_FILE`. Its config still sets `TEST_OTP_FILE`. It also does not exercise seller application/moderation or a real handoff.  
Evidence: Source paths above; current status accurately says seller-path E2E is pending, but still records an unresolved concurrent-bid status.  
Reproduction: Run E2E after an explicitly authorised disposable-database reset; the phone endpoint/labels are absent.  
Impact: There is no executable proof of the current core buyer flow, and no proof of the seller/Order flow.  
Why tests missed it: Verification transport changed from phone to email without synchronising test harness and UI assertions.  
Recommended correction: Replace phone fixtures/routes/labels with email OTP and rules acceptance; add seller approval → Product approval → Listing → handoff cases.  
Required tests: all required browser matrix scenarios plus deterministic PostgreSQL concurrency test.  
Blocks: technical rehearsal Yes; first real transaction Yes; public MVP Yes. Confidence: High.

### [P1-4] Socket.IO accepts anonymous, unvalidated and unbounded room subscriptions

Area: Realtime security and availability  
Files: `apps/api/src/realtime/realtime.gateway.ts:1-4`; `apps/mobile/src/lib/use-listing-realtime.ts:17-40`  
Requirement: Realtime remains safe under reconnect/loss, does not expose unauthorised data, and is protected against subscription abuse.  
Observed behavior: The gateway has no connection authentication, origin policy tied to `CORS_ORIGIN`, room existence/visibility check, payload validation, room limit or per-socket/IP rate limit. Any remote client can create arbitrary unique `listing:<value>` rooms by emitting `listing.join`.  
Evidence: The entire gateway is a four-line direct `socket.join()` implementation; the configured Socket.IO CORS is `origin: true, credentials: true`.  
Attack path: A script opens sockets and emits millions of distinct IDs. Socket.IO retains room maps and membership until disconnect; this can exhaust memory/CPU. Cross-origin pages can also initiate public stream connections because origin is reflected. Current event payloads are PII-free, so a contact leak was not confirmed.  
Recommended correction: Make public-listing subscriptions explicit and validate listing UUID/visibility; configure Socket.IO origin from server env; cap rooms/messages and add connection/message rate limiting. If private rooms are later introduced, authenticate handshake and authorize each join.  
Required tests: unauthenticated/private listing denial, invalid room rejection, rate-limit/room-cap tests, reconnect canonical-refetch test.  
Blocks: technical rehearsal Yes; first real transaction No; public MVP Yes. Confidence: High.

### [P1-5] Production OTP SMTP can send verification traffic without mandatory TLS

Area: Email verification security  
Files: `apps/api/src/otp/otp.service.ts:55-68`; `apps/api/src/core/config/env.ts:57-88`  
Requirement: Production email verification must protect credentials and one-time codes in transit.  
Observed behavior: Production requires `SMTP_SECURE` but accepts `false`; Nodemailer is configured with `secure: false` and no `requireTLS`. A relay that does not offer STARTTLS can receive SMTP credentials and verification codes in plaintext.  
Attack path: A network attacker on the path to an opportunistic SMTP relay reads a code, completes email verification and bids as the victim during the validity window.  
Recommended correction: Require implicit TLS or STARTTLS in production (`requireTLS`), validate the supported configuration and test rejection of an insecure production relay.  
Required tests: production config rejects plaintext-only configuration; transport includes TLS requirement.  
Blocks: technical rehearsal No; first real transaction No; public MVP Yes. Confidence: High.

## 10. P2 findings

### [P2-1] Current integration evidence is inconclusive

`apps/api/test/integration/product-listing.integration.spec.ts` contains valuable PostgreSQL tests for partial indexes, idempotency, close race and concurrent bids, but could not be run because PostgreSQL was not available. `docs/product/11-PROJECT-STATUS.md` still reports the concurrent-bid case as failing. Do not claim it passes until the current revision runs against a disposable local database. This blocks confident rehearsal, not static code review.

### [P2-2] Lint/format gate is not release-capable

`format:check` fails for 161 files; `lint` cannot start because the available Corepack pnpm is 11.10.0 while project metadata demands 11.7.0. The release baseline has no successful reproducible lint gate in this environment. Fix the version execution path and format only after separating untracked external skill material from repository checks.

### [P2-3] Moderation/audit UI is incomplete for the documented manual process

`AdminModerationScreen` can approve or suspend sellers/products but does not expose `CHANGES_REQUESTED`/`REJECTED` with required reasons, audit-event viewing, or a Listing inspection flow. Backend transition contracts exist, but manual moderation lacks a usable product surface and instruction trail.

### [P2-4] Operational readiness is incomplete

`apps/api/src/core/health/health.service.ts` is liveness only and does not check database readiness. No CI workflow, deployment manifest, backup/restore procedure, structured production monitoring/error tracking or graceful shutdown handling was found. `docker-compose.yml` contains development PostgreSQL credentials and is not a production topology. Single-process scheduler and in-memory rate limits are acceptable only under a documented one-instance pilot control.

### [P2-5] Documentation status is internally stale

`docs/product/11-PROJECT-STATUS.md` has an unfilled Task B manual-smoke placeholder, reports 91 API tests while current unit run reports 94, and records an integration failure that needs a current reproduction. This does not change code behavior but prevents the document from being reliable release evidence.

## 11. P3 findings

- `PhoneVerificationCode` and `phoneVerifiedAt` remain in the database model although the confirmed MVP gate is email. They are not on the current bid path, but increase stale-model maintenance cost.
- API/controller formatting is inconsistent and many one-line modules make sensitive route review harder; this is mainly a maintainability concern once P2-2 is addressed.

## 12. Security review

Positive controls: Argon2 password hashing, HTTP-only session cookie, server-side Zod parsing, generic API exception filter, image MIME/content validation, ownership checks for writes, serializable bid/close transactions, idempotency key unique index, self-bid block, and PII-free realtime event contract tests.

Risks: P1-1 authorisation/projection defect, P1-4 Socket.IO DoS/origin exposure, P1-5 SMTP transport, and the lack of a completed dependency advisory scan. No committed secret was observed; `.env` contents were not read. No password-reset flow or Swagger/debug endpoint was found.

## 13. Auction-integrity review

Server-side time, current price, listing state and winner selection are authoritative. `Bid` placement never trusts client current price, uses serializable transactions and compare-and-update, and lifecycle creates the winner Order transactionally after status transition. Soft close is inclusive at 60 seconds and capped at 600 seconds in `pricing-policy.ts`.

However P1-2 breaks the confirmed opening-price and step invariant, and P2-1 leaves concurrent PostgreSQL behavior unverified in this revision. The code supports a single-process scheduler; database state compare-and-update makes duplicate close calls idempotent, but multi-instance operational testing is absent.

## 14. Authentication and authorization review

Registration/login/logout/session-version checks, admin guard, seller ownership gates, public visibility predicates, and email/rules bid eligibility are present. Direct backend checks exist for the reviewed write endpoints; the mobile route guard is not the sole protection.

The important exception is P1-1: global role is used where record relationship must determine response audience. The browser verification harness is stale (P1-3). No token refresh mechanism exists; expiry returns an authentication failure and the client clears session, which is acceptable only if documented as a re-login flow.

## 15. Privacy review

Public product and seller selects deliberately avoid seller photo BLOBs and seller internal IDs. Public events contain no contact fields. Order snapshots preserve the intended privacy inputs at close time.

P1-1 means the real seller receives the wrong projection, while mobile renders neither projection. P1-4 does not currently leak PII, but it exposes public event infrastructure to abuse. Contacts were not found in public product contracts or realtime payload schemas.

## 16. Frontend and UX review

Product page has loading/error states, canonical-query refetch on realtime events/reconnect, a server-controlled bid gate, BYN display and a countdown that is not the source of truth. Seller profile and Listing draft screens cover basic application/draft/schedule actions.

The Order screen is an incomplete end state (P1-1). The audit did not perform physical-device, browser, keyboard, contrast or screen-reader verification. The current E2E file is stale (P1-3); therefore loading/offline/accessibility claims cannot be promoted to verified.

## 17. Design-system review

Tamagui, local tokens, shared loading/error/empty panels and Expo Image are used. The audit found no functional dark-theme toggle in the critical buyer path. Public product presentation prioritises image, seller and story rather than dashboard widgets.

Manual visual review remains required for iPhone Safari, Android Chrome, desktop breakpoints, contrast and focus order. The formatting gate failure prevents calling design code fully release-clean.

## 18. Performance and operations review

Useful indexes exist for active/ending Listings, bid ordering/history, order access, audit lookup and email/rules records. Public seller projection avoids loading profile BLOBs. Binary product/profile images are still stored in PostgreSQL; this is tolerable for a small closed pilot but needs capacity limits, backup planning and migration path before scale.

`ActivityService` loads related orders and bids without pagination for every bidder activity record, and realtime rooms have no resource bounds. No query-plan evidence, readiness endpoint, production backup/restore test, monitoring or multi-instance runtime test was available.

## 19. Code-quality review

The high-value business invariants are mostly extracted into helpers (`bid-eligibility`, rules acceptance, visibility, seller capability, snapshot mapper). Error swallowing was not found in critical transaction paths. The major quality issue is insufficient test realism: a test passes impossible `seller` role and E2E still uses deleted phone flows. One-line controller/gateway formatting and the broken global lint/format gate increase review cost.

## 20. Documentation consistency review

The MVP RFC correctly makes email—not phone—the production gate. Project Status identifies Partial technical baseline and unverified seller/browser work, but its historical/current test evidence needs reconciliation (P2-5). Architecture documents should explicitly state the one-instance scheduler/realtime/rate-limit limitation and that raw partial unique indexes live in baseline SQL.

## 21. Missing automated tests

- Actual seller (`role: user`) Order projection and buyer/seller/admin privacy matrix.
- First bid equal to `startPrice`; exact invalid fractional step amounts.
- Current email OTP + rules acceptance Playwright flow.
- Seller application, admin approval, Product approval, schedule, close and Order handoff E2E.
- Socket.IO room validation, limits and reconnect behavior.
- Integration run with 10 concurrent bidders and bid/scheduler overlap.
- TLS-required SMTP production configuration.
- Admin moderation reasons/audit UI and Seller `CHANGES_REQUESTED` loop.

## 22. Required manual test script

1. Use an isolated disposable PostgreSQL database; migrate from zero and seed only with explicit non-production destructive approval.
2. Submit seller application with a real image; admin requests changes, approves; verify non-approved seller cannot write Product/Listing.
3. Create and approve Product; create Listing with start price 10; verify intended opening-bid semantics after P1-2 fix.
4. Use two buyers and ten concurrent requests near end time; observe exact price, one winner, max soft-close cap and one Order.
5. Test buyer, seller, outsider and admin Order URLs; verify exact contact projection and seller completed/failed actions.
6. Disconnect/reconnect browser during bid and after close; refresh and confirm canonical HTTP state.
7. Repeat buyer and seller flows on iPhone Safari, Android Chrome, macOS Chrome/Safari and Windows Chrome; record keyboard, focus, contrast, loading, offline and error outcomes.

## 23. Positive observations

- Domain separation and baseline partial unique indexes are appropriate for MVP.
- Server-side bid/current-price logic is not delegated to the client.
- Deterministic winner ordering, idempotency and lifecycle status compare-and-update are correctly intended.
- Product/seller public projections deliberately avoid sensitive BLOB/PII fields.
- Email verification and versioned rules acceptance are centralised rather than duplicated across screens.

## 24. Technical rehearsal gate

**NO-GO.** Required before a controlled rehearsal: close P1-1, P1-2, P1-3 and P1-4; run current PostgreSQL integration suite; make lint reproducible; execute the manual script on a disposable environment.

## 25. First real transaction gate

**NO-GO.** Required before the first real buyer/seller transaction: close P1-1 and P1-2, prove concurrent close/bid behavior against PostgreSQL, and execute current email/rules/seller/Order E2E. SMTP TLS should also be fixed before inviting a non-test buyer.

## 26. Public MVP gate

**NO-GO.** In addition to the first-transaction gates: close P1-4/P1-5, perform dependency advisory scan, configure bounded realtime and production CORS, establish readiness/backup/monitoring/one-instance operating controls, and complete browser/accessibility testing.

## 27. Ordered remediation plan

1. Correct Order audience derivation, client methods and mobile handoff UI; cover privacy matrix.
2. Define and implement canonical opening-bid and exact increment semantics; test all price boundaries.
3. Replace obsolete phone E2E harness with email/rules flow and add seller/moderation/Order tests.
4. Bound and validate Socket.IO subscriptions; configure origin and add abuse tests.
5. Require encrypted SMTP in production and add config/transport tests.
6. Bring up disposable PostgreSQL and run integration/concurrency checks; reconcile status documentation from actual output.
7. Restore reproducible pnpm/lint/format/build gates and complete operational/manual release checks.

## 28. Exact files likely requiring correction

- `apps/api/src/orders/orders.service.ts`
- `apps/api/src/orders/orders.service.spec.ts`
- `apps/api/src/orders/orders.controller.ts`
- `packages/api-client/src/orders.ts`
- `apps/mobile/src/features/orders/order-screen.tsx`
- `apps/api/src/listings/listings.service.ts`
- `apps/api/src/bids/bids.service.ts`
- `apps/api/src/core/auction/pricing-policy.ts`
- `apps/api/src/realtime/realtime.gateway.ts`
- `apps/mobile/src/lib/use-listing-realtime.ts`
- `apps/api/src/otp/otp.service.ts`
- `apps/api/src/core/config/env.ts`
- `apps/mobile/e2e/closed-pilot.spec.ts`
- `apps/mobile/e2e/prepare.mjs`
- `apps/mobile/playwright.config.ts`
- `docs/product/11-PROJECT-STATUS.md`

## 29. Unknowns and limitations

- Integration and E2E were not run because the required database was unavailable and E2E reset is destructive under this audit scope.
- Dependency advisory scan could not reach the registry; no claim about dependency vulnerabilities is made.
- Physical devices, real SMTP delivery, deployment platform, backups/restores and multiple API instances were not available for verification.
- The project has no visible CI/deployment configuration in the repository.

## 30. Final recommendation

Do not invite real buyers or sellers yet. Address P1-1 through P1-5, then run the specified disposable-database and browser rehearsal. Reassess gates from observed results rather than from typechecks or documentation claims.

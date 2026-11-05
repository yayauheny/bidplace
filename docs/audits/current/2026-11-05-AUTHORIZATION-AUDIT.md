# Authorization and data exposure audit — 2026-11-05

Baseline: `origin/main` at `a0f78985681b1e8d1017c66711ace4e5f35b6b68` (PR #99).
Separate managed worktree, branch `fix/authorization-audit`. W5 / PR #100 code is read-only.
No production, edge configuration, secrets or real user data accessed.
Disposable PostgreSQL 18, loopback port 55439, database `bidplace_security_test`;
each integration spec owns a random migrated schema. No W5 database/process used.

## Acceptance and approach

Success requires object substitution checks, session/role revocation checks and actual
HTTP requests backed by isolated PostgreSQL. Unit tests alone do not establish PASS.
Inspect controller → current session → service ownership → transaction → response/cache.
For confirmed defects, first reproduce with a failing regression, then fix at the owner.

## Authorization matrix (prepared before regression edits)

All routes have `/api` prefix. A verified user must also have an active, current session.
Expected refusals are requirements; execution evidence is recorded separately below.

| Endpoint | Action | Required actor | Checked object | Expected refusal |
| --- | --- | --- | --- | --- |
| GET /me/orders | Read open/history summaries | Participant | buyerUserId/sellerUserId from session | Anonymous/banned 401; another user sees only own list |
| GET /orders/:publicId | Read contacts/card | Buyer, seller, active admin | Order parties; current role | Stranger 404, anonymous/banned 401; dealCode lookup 404 |
| POST /orders/:publicId/accept, /decline | Change offered order | Its buyer | buyerUserId, state/deadline | Stranger 404; seller cannot act as buyer |
| POST /orders/:publicId/complete | Complete order | Its seller | sellerUserId, state | Stranger 404; buyer cannot complete |
| POST /orders/:publicId/fail | Fail order | Participant | Party-specific reason and confirmation | Stranger 404; invalid actor/reason refused |
| PUT /orders/:publicId/note | Write private seller note | Its seller | sellerUserId | Stranger 404; buyer 403; buyer response omits note |
| POST /orders/:publicId/offer-next | Make next offer | Approved owner | Order seller/product, ranked bidders | Stranger 404; suspended author 403 |
| GET/PUT /me/contacts | Read/change own contacts | Verified self; fresh login for write | Session sub, no client userId | Anonymous/banned 401; stale write 401; injected identity refused |
| POST /works/:productId/listings | Create sale | Approved verified owner | Product owner, publication and seller state | Foreign owner 403; draft/deleted/suspended refused |
| POST /listings/:id/cancel | Withdraw | Its author | Listing seller, state/bids | Foreign listing 404; committed bids/order refused |
| POST /listings/:id/bids, /purchase | Commit bid/purchase | Eligible verified buyer | Buyer, seller, listing, payload-bound key | Anonymous/banned 401; self/admin/hold 403; key mismatch 409 |
| GET /listings/:id/bids | Read pseudonymous history | Public by current implementation | Listing ID | Unknown 404; no names/contacts; hidden-object policy needs review |
| GET /works/:publicId/lot | Read public lot and viewer state | Public/current optional session | Published visible work | Hidden/deleted/suspended author 404; response no-store |
| POST /orders/:publicId/reports | Submit report | Its participant | Order parties, reporting window | Stranger 404; duplicate/window 409; anonymous 401 |
| GET /admin/reports; POST /admin/reports/:id/resolve | Read/resolve | Active verified admin | Report and order; admin rechecked under user locks | User 403; banned 401; denied action leaves no changes/audit |
| POST /admin/orders/:publicId/outcome, /void-strike | Change outcome/strike | Active verified admin | Order and current admin | User 403; role/status rechecked in transaction; audit required |
| POST /admin/listings/:id/remove | Withdraw any listing | Active admin | Listing and locked admin | User 403, banned 401; audit required |
| POST/PATCH/DELETE /products/:id and submit/hide/unhide/creation | Mutate work | Approved owner (delete has own policy) | Product owner, revisions, sale state | Stranger refused; absent/deleted 404; suspended writes refused |
| GET /seller/products/:id | Read private work | Its author | Product sellerProfile userId | Foreign object 404/403; anonymous 401 |
| GET /works/:publicId, /authors/:slug and discovery | Public projection | Anyone | Published revisions, active approved author, not deleted | Draft/hidden/deleted/suspended excluded/404; no deal contacts |
| GET/PATCH/POST /seller/profile; /author/application*; /author/cabinet/works | Own author state | Self; verified for mutation | Profile from session sub | Foreign IDs cannot select another owner; banned 401 |
| POST/DELETE/PATCH /products/:productId/images*, /photos*, /story-images*, /creation-steps/:stepId/image | Upload/edit/remove | Approved verified owner | Product, image/slot/asset/step ownership and revision | Cross-product/cross-user substitution refused |
| GET /products/:productId/image-operations/:operationKey | Recover upload | Owner | Product + operation identity | Foreign owner refused |
| GET /images/:id?source=true | Read SOURCE | Owner or admin of undeleted work | Product owner and current session role | Public/buyer/stranger 404; private no-store |
| GET /images/:id | Read PREVIEW | Owner/admin, public published image, retained-cover participant | Published revision image membership or order snapshot/party | Draft/foreign/non-cover/deleted-public 404; retained cover private no-store |
| GET /products/:productId/story-images/:assetId | Read story preview | Owner/admin or exact public revision block | Asset membership and product visibility | Held draft asset, cross-product, hidden public read 404 |
| GET /creation-steps/:stepId/image | Read legacy step image | Owner/admin or public work | Step product/seller/status | Draft/hidden/deleted/suspended public read 404 |
| GET /sellers/:slug/photo; /author-achievements/:id/image | Read author media | Owner/admin or public published author content | Profile/revision/achievement membership | Draft/unpublished/foreign image refused |
| PATCH /admin/products/:id/status; /admin/seller-profiles/:id/status | Moderate | Current active admin | Product/profile target freshness + actor at commit | User 403, banned 401; queued demoted/banned actor must not commit |
| GET /admin/users*; POST/PATCH /admin/users/:id/{ban,status,release-hold,revoke-sessions} | Sensitive account controls | Current active admin | Actor/target; self/admin emergency protection | User 403, banned 401; self/admin-target emergency refusal; audit required |
| GET /admin/{products,seller-profiles}* incl revision photo/history | Private moderation reads | Current active admin | Resource and nested revision membership | User 403, anonymous/banned 401; no-store required |
| GET/PUT /me/notification-settings; GET /me/attention; /me/favorites and favorite writes | Own private state | Self (some verified) | Session sub | Foreign body ID cannot change owner; anonymous/banned 401 |
| All state-changing routes | CSRF | Allowed Origin/Referer + X-Bidplace-Request=1 | Request origin; internal tick separately authenticated | Missing/foreign proof 403 |
| POST /auth/logout; GET /auth/me | Session lifecycle | Current session | SID, version, expiry, live role/status | Old SID/version/expired/banned 401; delayed SID write refused |
| GET /orders/:publicId/receipt-data (PR #100 only) | Read saved receipt | Completed-order buyer/seller | Order party/status | Outsider/admin 404, anonymous 401; private no-store (read-only inspection) |

## Execution and findings

**Verdict: PARTIAL.** Two confirmed findings were fixed locally. No confirmed P0,
no demonstrated cross-user private order/contact/SOURCE disclosure in the executed
scenarios. This is not proof that every endpoint × role × concurrent transition is safe.

### F1 — P1: queued administrative writes survive role removal / ban

Baseline locations: `apps/api/src/admin/admin-moderation.service.ts:424` (seller),
`:715` (work), and `apps/api/src/admin/admin-user.service.ts:100` (session revoke).
`SessionAuthGuard` / `AdminGuard` checked the actor before entering a transaction.
After waiting for the resource/user lock, these paths never rechecked the admin.

Reproduction, entirely synthetic and through HTTP:

1. Log in an active admin. Hold the target product/profile row in another transaction.
2. Start `PATCH /api/admin/products/:id/status` with a valid fresh ARCHIVED target,
   or the equivalent seller-profile SUSPENDED request. Wait for PostgreSQL to report
   the HTTP transaction blocked on the row (no timing-only sleeps).
3. Set that admin's role to `user`, or status to `banned` and increment sessionVersion.
   Release the target row. Baseline returns **200**, commits the visibility change
   and writes the admin audit after the actor has lost permission.
4. For `/api/admin/users/:id/revoke-sessions`, hold the actor row, start the POST,
   then change role/status before releasing it. Baseline returns **201** and
   increments the unrelated user's sessionVersion.

A previously authorized actor can queue sensitive writes and execute them after
permission withdrawal. This requires an already authenticated administrator and
an in-flight request; an ordinary user cannot acquire admin rights this way.
Priority P1 reflects administrative integrity and moderation/publication control,
not evidence of anonymous privilege escalation or observed production abuse.

Regression owners: `moderation.integration.spec.ts` (four role/status/resource
cases) and `admin-user-emergency.integration.spec.ts` (two role/status cases).
All six failed with successful HTTP statuses before the fix and pass with **403**
after it; unchanged target state and absent unauthorized audit are also asserted.

Chosen **durable fix**: keep current guards; under the existing target transaction,
lock the actor row and check current active/admin status before writing. Moderation
uses `FOR SHARE`, which permits simultaneous authorized reads but blocks role/status
updates until commit; session revoke already holds `lockUsers`. A small shared
`admin-authorization.ts` assertion is used by both owners. The same moderation
owner check covers catalog proposal resolution after its product lock. Existing
commerce admin actions already recheck actors under user locks and were not changed.

**Acceptable workaround** considered: another pre-transaction guard check. Rejected
because it retains the race. **Hack** considered: hide controls in the UI. Rejected
because direct API requests remain possible. No new auth framework or guard rewrite.
SessionVersion-only revocation of an already admitted request is a separate boundary;
this fix does not claim to cancel every in-flight operation on logout.

### F2 — P2: API image caching outlives visibility revocation

Baseline: `apps/api/src/images/image-upload-policy.ts:126–142`;
`GET /api/images/:id` and story-image controller reads used the product cache kind.
Public images were returned with `public, max-age=31536000, immutable`. The API
correctly returned 404 after hide/delete/suspension/ban, but a conforming browser
or shared cache could reuse the previously fetched response for a year without
calling those authorization checks. These API URLs are separate from public CDN
media-object URLs and are not purged by the object-key revoke/purge lifecycle.

Reproduction: fetch an approved work image anonymously, record its cache policy,
then archive/delete the work, suspend the author or ban its account. An origin
request becomes 404 while the cached old response remains fresh under the old
header. The HTTP regression checks the actual public response policy, SOURCE denial
and subsequent origin denial in all four transitions. These four tests failed on
the old immutable header before the fix and now pass.

Chosen **durable fix**: reuse the existing public revalidation policy
`public, max-age=0, must-revalidate` for API product/story previews. Owner/admin,
SOURCE and retained-cover responses stay `private, no-store`. No authorization
was weakened; CDN/R2 object policies and Cloudflare configuration were not changed.
**Acceptable workaround**: a short positive max-age, rejected because it deliberately
leaves a stale-access window. **Hack**: client cache-busting, rejected because it
cannot constrain other clients. Existing header assertions were updated to the
new policy; no access assertion, timeout or retry threshold was weakened.

Limit: changed headers apply to new/revalidated responses. They cannot retract
already cached immutable responses or downloaded/saved images. Actual browser-cache
and deployed CDN behavior still needs verification; this regression verifies HTTP
headers and origin decisions, not a live browser/CDN purge.

### Executed evidence by boundary

Spec filenames below are in `apps/api/test/integration/` unless otherwise stated.
These use real Nest HTTP + PostgreSQL where the owner is an HTTP integration;
media lifecycle/object-store failure tests use deterministic storage doubles.

| Matrix boundary | Executed owner evidence | Result / limit |
| --- | --- | --- |
| Foreign work writes, submit, uploads, image deletion/reorder, suspended author | `seller-permissions`, `seller-pagination`, `product-write-atomicity`, `image-upload-safety`, `upload-safety`, `work-media-http` | Passed; ownership enforced independently of UI |
| Work draft/revision/hidden/deleted public projections | `portfolio-published-revision`, `portfolio-filters`, `portfolio-route-surface`, `author-hide-listing`, `product-delete`, `rejected-product-recovery`, `moderation-revision-projection` | Passed; includes retained historical order cover |
| Orders, party contacts, private note, accepted transitions, admin outcome and strike audit | `commerce-orders`, `commerce-purchase`, `contacts`, `product-delete` | Passed; buyer/seller/stranger/admin/anonymous and revoked sessions covered |
| Listings, bids, seller ban, purchase eligibility and idempotency | `commerce-listings`, `commerce-bids`, `commerce-purchase`, `commerce-races`, `commerce-seller-ban`, `commerce-tick` | Passed; includes real concurrent bid/ban, duplicate writes and reservation races |
| Reports, party substitution, admin resolution, audit and banned admin | `commerce-reports`, `commerce-attention` | Passed |
| Admin role/status changes while queued | New parameterized cases in `moderation` and `admin-user-emergency` | Six red → green regressions; target/audit unchanged on refusal |
| Other administrative moderation and account emergency controls | `moderation`, `admin-moderation-pagination`, `admin-user-emergency`, `author-story-catalog` | Passed; target freshness, self/admin protection and successful audit paths retained |
| SOURCE/preview/story assets, deletion cover, uploads and revoke | `media-transport`, `work-media-http`, `product-delete`, `media-lifecycle`, `image-upload-safety` | Passed; real HTTP + DB; S3/CDN calls doubled, live storage not tested |
| Session logout/replay/expiry/rotation, CSRF and CORS | `auth-transport`, `social-auth`, `password-reset`, `contacts`; `src/auth/session.service.spec.ts` | Passed; session service current-role assertion includes unit evidence; live providers absent |
| Private client cache and late responses/account replacement | `apps/mobile/src/lib/query-cache.spec.ts`, `unauthorized-session-recovery.spec.ts`, commerce specs | 161 passed; no physical browser/device end-to-end claim |
| Durable OTP/mail/recovery abuse and replay | `auth-abuse` with its separate local DB | 28 passed; test transport, no real SMTP/Turnstile |
| W5 receipt-data | Read-only PR #100 backend patch at `866087d3a4cc3020d6511f10891b3be5e969d55b` | Explicit participant + COMPLETED/completedAt checks; no-store. No confirmed issue in inspected patch; not executed in this main checkout |

Bid history remains public and pseudonymous even after suspension, per the
existing application-security owner. Public-history visibility is not reported as
an IDOR merely because a listing identifier can be substituted. Exact SOURCE and
retained-order-cover policies are separately enforced; suspended authors may still
read their own retained material, and suspended/unverified owners may delete work,
as already documented. These are existing contracts, not new exceptions.

### Commands and observed results

Executed in this worktree. Final runtime: Node **22.20.0**, pnpm **11.7.0**;
Nest **10.4.22**, Prisma **6.19.3**, express-session **1.19.0** (lockfile install).

- `pnpm exec turbo run build typecheck lint test --filter=@bidplace/api...`:
  build/typecheck/lint and upstream checks succeeded (13 tasks); the concurrent
  API unit task exposed a build-assets race and stale header assertion. Build
  finished before the final standalone unit rerun. Config 8, contracts 111 and
  database 1 tests passed. No runtime behavior outside this audit was patched.
- Final `pnpm exec turbo run build typecheck lint --filter=@bidplace/api...`: **10/10 tasks succeeded**, lint without auto-fix.
- `pnpm --filter @bidplace/api test` after build, without an externally forced
  env-path override: **81 files / 1156 tests passed**.
- `pnpm --filter @bidplace/api test:integration` with
  `INTEGRATION_DATABASE_URL` pointing only at loopback 55439:
  **46 files / 602 tests passed**, 29 skipped (28 auth-abuse + 1 browser smoke).
- Separate `auth-abuse.integration.spec.ts`, with its required
  `AUTH_ABUSE_TEST_DATABASE_URL` to `bidplace_auth_abuse_test` on the same disposable
  server: **28/28 passed**. Total executed API integration cases: **630**; one
  browser smoke remains unexecuted.
- Built `@bidplace/api-client...` and `@bidplace/design-tokens`, then executed
  mobile `query-cache.spec.ts`, `unauthorized-session-recovery.spec.ts` and
  `src/features/commerce`: **11 files / 161 tests passed**.

Initial failed attempts are retained as diagnostics: the first local cluster had
C locale / non-UTC timezone, causing four baseline failures in moderation search,
auth-signal expiry and attention timing. A second first-use attempt raced database
creation in three beforeAll hooks. The disposable cluster was recreated with
`en_US.UTF-8`, UTF-8 and UTC and its test database prepared before final tests.
The first API unit run overlapped build-asset copying; a later run inherited an
env-path override that invalidated two env-resolution tests. The first mobile run
lacked built shared-package artifacts (six import-resolution suite failures).
All these failed runs were corrected by setup/sequencing, with no weakened test.
Synthetic expected-failure tests emit media/mail/tick error logs even in green runs.

### Privacy assessment and pilot gates

**Personal data:** no confirmed cross-user contact/order disclosure in executed
HTTP cases. Private order responses and own contact responses use no-store;
response schemas keep seller notes out of buyer cards and deal contacts out of
public work/author projections. F1 affects integrity of administrative actions and
could allow a former administrator to approve/restore content, rather than grant
an ordinary user a general read permission. Previously downloaded private responses
and every possible in-flight read/revocation ordering are not proven retractable.

**Files:** SOURCE stays private and server-authorized; participant cover access
is restricted to the exact saved image, not arbitrary images from that work.
F2 allowed stale display of formerly public derivatives. Live R2 bucket policy,
public URL revoke/purge latency, deployed CORS and old client caches remain outside
local evidence. Existing media compensation/lease limitations in the security
owner remain applicable; this audit did not change them.

**Before the closed pilot:** review and land F1; include F2 so API previews
revalidate; run non-production deployed storage/CDN checks for private SOURCE,
hide/delete/ban revoke, retained cover and allowed/forbidden Origins. W5 receipt
must retain its own integration/browser acceptance before that feature is enabled.
No merge or production deploy is performed by this audit.

**Deferred / not proven:** production traffic timing, live identity/SMTP/Turnstile,
physical device/browser logout/cache behavior, exhaustive endpoint × role ×
concurrent-state combinations, already fetched file revocation, sessionVersion-only
cancellation of admitted operations, and read-after-revoke races for every private
endpoint. The existing browser smoke proxies a frontend on localhost:8081; it was
not run to avoid coupling to the other worker's visual stand. No new founder
product/architecture decision was needed. No P0 or P3 finding was confirmed.

**Maintenance:** one small shared assertion is the admin moderation/emergency
owner, used inside existing transactions. Tests now create a separate real admin
instead of calling moderation as the author. No public DTO, database schema,
commerce mechanic, dependency or W5 code changed. The cost is two actor queries
per moderation transaction and normal lock contention with role/status updates.


Independent read-only review found no confirmed actionable issues in the diff.
The reviewer checked actor-lock compatibility, transaction retries, cache consumers
and fixture changes; it did not rerun tests. Catalog-proposal revocation shares
the new assertion and passed its existing owner integration, but has no new
independent queued-role race case. Documentation link check and `git diff --check`
passed. No required local runtime check remains failing.

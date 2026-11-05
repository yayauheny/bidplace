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
Expected refusals are requirements, not claims of execution. The matrix as a
whole is **Indirectly covered** (source tracing + owner suites); only the specific
restrictions named in the direct-evidence table below are **Directly verified**.
The W5 row and external/browser/native gaps are **Not verified** here.

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

**Verdict: PARTIAL.** F1 and F2 were fixed in the first pass; a confirmed P2 lock cycle was fixed in the second pass below. F1 is recalibrated to P2; the fix is retained. No confirmed P0,
no demonstrated cross-user private order/contact/SOURCE disclosure in the executed
scenarios. This is not proof that every endpoint × role × concurrent transition is safe.

### F1 — P2 (initially P1): queued administrative writes survive role removal / ban

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
Second-pass severity: **P2**. The attacker already needs a valid administrator
session, the request must pass guards before withdrawal, and an operator must
change that admin's row out of band before commit. The current production API
cannot ban/unban another admin, revoke another admin's sessions, or change roles.
The regressions deliberately model an operator changing the DB row; they do not
prove an ordinary API-only privilege-escalation path. Integrity consequences are
serious, but this controlled prerequisite/window does not justify the initial P1.
The transactional defense remains useful and is not rolled back.

Regression owners: `moderation.integration.spec.ts` (four role/status/resource
cases) and `admin-user-emergency.integration.spec.ts` (two role/status cases).
All six failed with successful HTTP statuses before the fix and pass with **403**
after it; unchanged target state and absent unauthorized audit are also asserted.

Chosen **durable fix**: keep current guards; under the existing target transaction,
lock the actor row and check current active/admin status before writing. Moderation
uses `FOR SHARE`, which permits simultaneous authorized reads but blocks role/status
updates until commit; session revoke already holds `lockUsers`. A small shared
`admin-authorization.ts` assertion is used by both owners. The same moderation
owner check covers catalog proposal resolution after its product lock; four direct
HTTP role/ban races for map/reject were added in the second pass. Existing
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

### First-pass evidence by boundary (bounded scenarios, not the full matrix)

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

### First-pass commands and observed results

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


First-pass read-only review of d3c89404 reported no actionable issues; the second pass below subsequently reproduced F3.
The reviewer checked actor-lock compatibility, transaction retries, cache consumers
and fixture changes; it did not rerun tests. Catalog-proposal revocation shares
the new assertion and passed its existing owner integration, and the second pass adds four direct queued-role/ban cases for map/reject. Documentation link check and `git diff --check`
passed. No required local runtime check remains failing.


## Second pass — 2026-11-05

Scope: existing PR #101 at `d3c8940479be662aa23cf6685165bab8616e3409`, not a
new repository-wide scan. Existing current-admin assertions, product/user lock
order, session-revoke check and F2 revalidation policy are retained. No cache
architecture, public contract, W5 code, Cloudflare setting or production changed.

### F3 — P2: real profile/admin/FK deadlock; fixed

`updateSellerStatus` acquired profile P `FOR UPDATE`, then actor A `FOR SHARE`.
A simultaneous ban by **the same active admin A** acquired users A/U `FOR UPDATE`,
then `enqueueRevoke({profileId:P})` inserted `media_operations`. Its immediate
profile FK needs `KEY SHARE` on P. With media enabled and at least one PUBLIC
object, this forms `P → A → P`. It does not require an attacker or role withdrawal.

`work-media-http.integration.spec.ts`, test “serializes profile suspension with a
simultaneous ban by the same admin without a deadlock response”, reproduces through
two real HTTP requests/PostgreSQL transactions. A test barrier pauses only the
first enqueue call; actual row/FK locks and mutations stay real. `pg_locks` proves
moderation is waiting before the ban proceeds. PostgreSQL logged **deadlock
40P01** between `SELECT users ... FOR SHARE` and `INSERT media_operations`.
Before: statuses **[200,500]**. After: **[200,200]**, final states banned/SUSPENDED,
and exactly one authorized audit per action. S3/purge are deterministic doubles.

Smallest **durable fix**: profile target lock becomes `FOR NO KEY UPDATE`. It
continues excluding profile writers/deletion and permits the ban's FK KEY SHARE.
The actor SHARE lock and active-admin assertion are unchanged. Legacy approval
may later upgrade the profile lock when updating unique publishedRevisionId,
but that is after actor acquisition. Broad lock reordering was rejected as an
**acceptable workaround** with larger compatibility risk; swallowing/relabeling
deadlock was rejected as a **hack**. A related cycle could already arise at the
old audit-event actor FK, so this is a confirmed current risk, not a claim that
PR #101 introduced every variant.

Bounded lock-order graph (`→` means acquisition order, `FK` an implicit lock):

```text
profile moderation: profile(NO KEY UPDATE) → actor(SHARE) → writes/audit
work / catalog:     product(UPDATE) → actor(SHARE) → writes/audit
bid / purchase:     product(UPDATE) → sorted users(UPDATE) → writes
ban:                sorted running-auction products(UPDATE) → sorted users(UPDATE)
                    → media-operation FK profile(KEY SHARE) → audit/void bids
outcome / report:   product(UPDATE) → sorted users(UPDATE) → order/report/audit
session revoke:     sorted users(UPDATE) → sessionVersion/audit
hold release:       sorted users(UPDATE) → hold/audit
```

No other incompatible cycle was identified in these traced paths. Ban enqueues
by profileId, not productId: do not invent a direct product-FK cycle. Revoke and
hold release do not subsequently lock profiles. Existing retry code recognizes
P2034 and raw 40001; current role/ban race tests still pass under SERIALIZABLE,
and existing real parallel-signal tests retain both writes with one hold/audit.
Raw 40P01 is not generically retried by this wrapper; the demonstrated root cycle
is removed rather than masked. This is **PASS for this bounded graph/test set**,
not a proof of global deadlock freedom or cancellation of all admitted requests.
Two current admins can concurrently suspend different profiles with two successful
responses and one audit each (new `moderation.integration.spec.ts` case).

### Cache path, measured cost and limits

Actual public mapper: `toImageContracts(..., 'public')` uses delivered public
PREVIEW/FULL URLs when present. Those requests go to the media/CDN hostname,
not Nest. API URLs remain for legacy/fallback/authorized private images, story
reads and retained covers. Worker `publicCacheTtl` does **not** cache `/api/images`.
On that path: Browser → local Worker router → Nest current authorization →
Prisma metadata → private PREVIEW GET → Express ETag/conditional handling.

Local experiment used fresh Chromium/WebKit contexts, real Worker router and
Nest/PostgreSQL, and a counted S3 GET double. It used the ordinary `<img>` path
emitted by installed expo-image 57.0.1 web (no source headers), not the full React
screen. Thirty URLs span three ten-photo works; a single work still permits ten.
The sample PNG is 68 bytes; timings are localhost, not production performance.

| Per browser, each sampled independently | Nest requests (10 / 30 URLs) | Prisma SQL (10 / 30) | S3-double GET (10 / 30) | HTTP result |
| --- | --- | --- | --- | --- |
| Cold document | 10 / 30 | 50 / 150 | 10 / 30 | 200; 680 / 2040 image body bytes |
| Remove and remount same URLs in same document | 0 / 0 | 0 / 0 | 0 / 0 | Decoded/browser image reuse |
| Reload document | 10 / 30 | 50 / 150 | 10 / 30 | 304; zero downstream image body bytes |

Both engines produced those counts. [Raw local samples](../evidence/2026-11-05-authorization-cache.jsonl). Observed cold times: Chromium 95/63 ms,
WebKit 75/79 ms; reload 31/58 ms and 30/119 ms respectively. These single-run
synthetic times are descriptive only. Prisma counting excludes session-store
SQL, migrations and browser decode; the GET double has no real provider latency.
Express computes/checks ETag only **after** authorization, SQL, GET and body read.
Thus 304 saves browser transfer, not R2 GET/read/container work. A new permanent
HTTP ETag regression proves unchanged public data gets 304 while hide gets 404,
even when the old validator is supplied.

Costs can increase linearly on the **API fallback** path: e.g. 1000 reloads of
30 such URLs imply 30,000 Nest requests / 150,000 measured Prisma queries /
30,000 object GETs, even with 304. This is an extrapolation, not measured traffic
or a currency estimate. Normal delivered public CDN derivatives bypass Nest, and
same-document gallery reuse generated no additional work. Keep F2 for the closed
pilot; measure fallback share/object sizes/container wakeups there. Early validators,
versioned URLs or edge caching need a separate demonstrated bottleneck and a
revoke design; none is introduced here. Native expo-image disk/memory behavior,
full React remount timing and production provider billing remain unmeasured.

Worker refuses edge storage for Cookie/Authorization requests. `ImagesService.get`
returns private no-store for owner/admin/SOURCE/retained-cover reads; an unrelated
signed-in user may receive public caching only for already public content. The
Worker's existing credential/private/no-store tests pass. No new public cache of
private data was confirmed; this is source/owner-test evidence, not an exhaustive
cross-browser account-switch experiment.

### Related public JSON and history policy

The local expiry-aware Cache model around the real router/Nest reproduced a work
JSON HIT **29 s after hide** while its API image already returned 404; at 31 s
JSON fetched origin and returned 404. This models the configured **30 s from cache
insertion**, not a measured live Cloudflare purge deadline. An origin fetch begun
before hide and stored later can extend wall time past hide+30 s; provider/network
latency and client QueryClient state are not bounded by this TTL alone. No targeted
JSON purge for these mutations was found in this scoped path. Portfolio/home/facets
may retain previously public summaries for the same configured interval. This
existing window is explicit in COMMERCE §12; it is not a private-SOURCE/contacts leak.

The assumption “authors JSON is cached for 30 s” did **not** hold end to end:
`CsrfMiddleware` matches `/api/authors` with `startsWith('/api/auth')` and supplies
`no-store`, so the router's TTL allowlist is bypassed. Local author detail after
ban returned 404 at 29 s; origin also returned 404. This conservative existing
behavior is documented, not opportunistically optimized in a security PR.

`commerce-bids.integration.spec.ts` now directly follows a saved history URL after
actual author hide/delete, API ban, and ended/cancelled listing fixture states.
All five return 200 with only `{amountMinor, createdAt, participantLabel}` and
no-store. Ban of the seller does not void other users' bids. COMMERCE §12 says
this endpoint is for everyone; §7/DEC-150 preserve trade/bid history. Those support
public pseudonymous history but do not explicitly settle withdrawal after hide.
UUID substitution alone is not evidence of access to a private object, and lack
of direct PII alone is not a complete risk argument: known work/timing/amounts
can still correlate activity.

Options for founder confirmation, **no contract change in this PR**:

- **A — retain lifecycle-independent public latest-20 pseudonymous history.** Keeps
  current transparency/old links and the “everyone” contract; previously public
  trade metadata remains reachable after work withdrawal. Recommended for the
  closed pilot with this limitation explicit, consistent with the current contract.
- **B — require current public work visibility on the public history endpoint.**
  Aligns withdrawal of public work/metadata, but saved bidder links and public
  history disappear after hide/delete/ban. Any participant/admin historical view
  needs an explicit access contract, not a silent fallback. Choose this before
  promising that hide removes every public trade trace.

### Directness of evidence (specific restrictions only)

| Boundary | Directly verified | Indirectly covered | Not verified |
| --- | --- | --- | --- |
| Private SOURCE | `media-transport` anonymous `?source=true` refusal; `commerce-orders` buyer and `product-delete` participant SOURCE refusal; real HTTP/DB, legacy-image fixtures | Private bucket/key separation from mapper/store code + object-store unit checks | Live R2 bucket ACL/direct URL exposure, every role/state combination, complete SOURCE HTTP matrix on S3-backed assets |
| Retained order cover | `product-delete`: buyer/seller exact cover allowed; foreign image/guest/stranger/admin/source refused after delete | Other failure/history transitions in order owner suites | Live storage retention/revoke timing and every older snapshot migration |
| Foreign contacts | `commerce-orders`: buyer/seller/admin/stranger/anonymous card matrix; private seller note projection; `contacts` self-only reads/writes | Other grouped endpoints in planning matrix, DTO/static tracing | Exhaustive account-switch/browser disk-cache and all read/revoke interleavings |
| Blocked user | `admin-user-emergency`, `auth-transport`, `commerce-seller-ban` explicit stale-cookie/ban scenarios | Common SessionService check applied to other endpoints | Universal abortion of requests admitted before ban/logout/version bump |
| Administrative writes | Six original queued role/ban cases; four new map/reject cases with unchanged target/revision/audit and fresh-admin success; same-admin deadlock regression; two-admin concurrency | Remaining admin routes via common guards/source and owner suites | Exhaustive operator withdrawal at every statement of every admin endpoint |
| After hide/delete | `media-transport` 404 and ETag refusal; `product-delete`/`work-media-http` exact membership and fake-storage revoke; local real-browser request counts | Router allowlist and public URL mapping | Live CDN expiry/purge/replicas, native image cache and already rendered pixels |
| W5 receipt-data (PR #100) | None executed in this branch | First-pass read-only backend patch inspection at its reported SHA | Runtime/browser/late-response behavior of PR #100; no PASS for that feature |

The old 630-test total is suite-health context, **not evidence for every cell in
the planning matrix**. Storage doubles and local Cache model are named where used.

### Revocation mechanisms and pilot acceptance

| Mechanism | What F2 does / does not guarantee |
| --- | --- |
| User-saved/downloaded file | No remote deletion or recall guarantee. It is already outside server control. |
| Browser HTTP cache | New/revalidated API responses have zero freshness + must-revalidate. Old year-immutable entries retain their prior policy; F2 is not retroactive. |
| Decoded image / live document | Measured same-document remount can reuse pixels with no network. F2 cannot force an authorization request or erase displayed pixels. |
| Worker API image cache | No allowlist entry; it forwards. F2 does not install a new edge mechanism. |
| Public derivative CDN cache | Separate public-object TTL/purge lifecycle remains unchanged; live purge latency/replicas need measurement. |
| R2 stored objects | F2 changes no object persistence. Lifecycle deletes PUBLIC derivatives on revoke; PRIVATE SOURCE retention is intentional. Doubled tests do not certify live deletion. |
| Server API authorization | A request reaching Nest checks current visibility/membership before bytes/304. It cannot retract bytes already in flight or cancel all transactions admitted before logout. |
| SOURCE | Private authorized read with no-store; never made public by F2. Bucket ACL/storage transport still requires live verification. |
| retained-order-cover | Exact saved PREVIEW may remain intentionally readable to the order's participants after deletion, private no-store; this does not reopen SOURCE or the rest of the work. |

Before pilot: land the confirmed F3 fix with existing F1/F2 checks, then validate
non-production deployed SOURCE ACLs, permitted/forbidden origins, PUBLIC revoke/purge
and participant retained-cover behavior. Accept only explicitly previously public
JSON/decoded-cache/history windows, not private-file disclosure. Keep live revoke
as **Needs verification**. Defer cache optimization/dollar forecasting until actual
fallback traffic is known. F1 is now P2; F2 and F3 are P2. No P0/P1 escalation or
API-only admin takeover was confirmed. No merge or deploy was performed.


### Second-pass verification and handoff

- `pnpm exec turbo run build typecheck lint --filter=@bidplace/api...`: **10/10**
  tasks succeeded, no auto-fix. Final API unit suite: **1156/1156** passed.
- Full API integration with both isolated database URLs: **642 passed**, one
  existing W5-linked frontend browser smoke skipped; **47/47 files passed**.
  This includes all 28 auth-abuse cases and 12 new second-pass cases.
- Unchanged Worker boundary suite: **46/46 passed**. The one-off local browser
  experiment passed and its 14 samples are linked above; the experiment harness
  was removed from the shipping diff. No frontend visual stand was used.
- Initial deadlock fixture hit the existing PUBLIC derivative constraint before
  reproducing the real cycle; it was corrected to a canonical public object.
  New catalog fixture setup needed its own catalog bootstrap and the correct
  existing APPROVED mapped status. The first combined full run then exposed test
  fixture pollution of an existing empty-author assertion. The added case now
  follows that stateful owner suite's earlier scenarios, and its request/barrier/
  spy cleanup is unconditional. The unchanged strict assertion and full suite pass.
- Read-only second review confirmed the lock-mode correction; its test-cleanup
  finding was corrected and verified. No other actionable runtime issue was raised.
- GitHub Verify on the initial `d3c89404` was observed **success**, run 557
  (`42000592876`). CI for the follow-up SHA must be checked independently; the old
  green result is not inherited as evidence for a new commit.
- Work remains **PARTIAL** for the external/privacy/product limits above.
  The same Draft PR #101 is continued; no merge or deploy. No public-history
  decision was inferred from founder silence.

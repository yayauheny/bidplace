# bidplace — application security (engineering)

Последнее обновление: 2026-10-10
Статус: Confirmed (engineering owner)

## 2026-10-30 — Bid placement

**Implemented locally.** `POST /api/listings/:id/bids` requires a session and a verified email. `@RateLimit` allows 10 requests per minute per user per listing (`commerce:bid`); the 11th is `rate_limited` and the counter is in PostgreSQL. The bid transaction locks the product row, then the bidder, then reads database time. The same idempotency key with another amount is `IDEMPOTENCY_KEY_REUSED`. Bid history is public, `Cache-Control: no-store`, omits voided bids, and returns `Участник N` without names or contacts. A failed or missing Turnstile token on the first bid of a session records `TURNSTILE_FAILED` and does not reject that bid. Two distinct signal kinds in 24 hours create a purchase hold. A ban voids that user's bids on running auctions in the same ReadCommitted transaction, under product then user row locks, and recomputes the leader. Three exhausted retries are `conflict`. Publication still checks `user.status` before it publishes. A second account that does not share the author's browser id is not detected.

## 2026-10-30 — Transactional notification outbox

**Implemented locally.** Deal and account mail is inserted on `notification_outbox` in the caller transaction and sent later by tick job `notifications.send`. Delivery is at-least-once: the claim lease and a 10 second send bound stop a hung transport, and a crash or timeout after SMTP has accepted the message can send the same letter again. `attempt_count` increments when the row is claimed, so a poison row stops at 10. `OUTBID` honors `user_notification_settings.outbid_email`; other kinds cannot be turned off. A row is sent only to one verified address. Subjects and interpolated fields drop CR/LF, and a recipient that is not a single address is not handed to SMTP. Enqueue accepts only the keys for that kind, including the discriminator a repeated kind needs (`slot`, `bidId`, `reportId`, or `eventId`). `classifyMailFailure`: SMTP 400–599 is `FAILED` immediately; timeouts and other unknown transport errors retry with backoff up to 10 attempts, then `FAILED`. The error log is the outbox id and kind. Admin retry of `FAILED` rows from the last 48 hours (`created_at`; there is no `failed_at`) resets `attempt_count` and writes `audit_events` in the same transaction only when a row changes. Mail text does not include the other party's contacts. The order link is `PASSWORD_RESET_URL_BASE` or the CORS origin plus `/account/orders/{publicId}`.

## 2026-10-29 — PR73 recovery and publication review

**Implemented locally / live Needs verification.** Exhausted FAILED REVOKE/CLEANUP
keeps the media job failed and success heartbeat unchanged without unbounded retry.
Work approval checks the sale guard before enqueue and again in the locked
publication owner before writes; archive shares that owner. Product row-lock
contention alone maps to 409 after 4s, preserving all other database errors and the
previous transaction-local timeout. Suspended profile restore uses the existing
pre-PUT PUBLIC-only journal and exact source id/generation/revision binding;
only its own FAILED restore is exempt from deletion blocking while SUSPENDED.
PRIVATE, running leases and legitimate shared public references remain protected.
Hidden approval retry accepts only its exact completed current publication and
adds no audit or PUBLIC write. Owner/admin image reads use private cache policy
without a catalog query. Worker scheduled failures expose a fixed error message,
without upstream body/job names/transport details; release hold is a deliberate
no-wake skip. Regression evidence: media lifecycle, author-hide-listing, moderation,
internal-tick, work-media-http, atomicity and cabinet integration owners (97 cases),
API unit/typecheck/lint/build and Cloudflare checks pass locally.

Limits retained: compensation may briefly expose PUBLIC bytes before delete/purge;
there is no R2 provider fencing against a live process paused beyond its lease.
Old FAILED restores without a journal require manual retry. Live R2/CDN/Cron and
production timing remain unverified. Draft CI runs only its fast subset; the 30s
heartbeat keeps the database active while the Container is awake. No remote
verification, release transition or deployment was performed.

## 2026-10-29 — Private scheduler boundary (W2)

**Implemented locally; live Needs verification.** Worker routing rejects public
`/api/internal/*` before DO forwarding/cache and strips `X-Internal-Tick` from
ordinary forwarded traffic. Only scheduled forwarding directly addresses the
private DO, with that header; release hold blocks it. Nest's `InternalTickGuard`
returns 404 for absent/wrong configuration or header and compares equal-length
buffers with `timingSafeEqual`. `INTERNAL_TICK_SECRET` is required on the
production security profile and must have at least 32 characters. No value is
returned or logged. Only exact POST `/api/internal/tick` bypasses CSRF; it uses
no session/rate-limit guard and still requires the private header.

`TickService` keeps single-flight exclusion until I/O settles, isolates job
failures and logs registered names only. It persists success in
`system_heartbeats(name, at)` only after a complete failure-free run within the
cooperative budget. Media recovery keeps operation/object leases, publication
CAS and active-author checks; expired RUNNING publications recover, while
ordinary PENDING/FAILED publication retries remain manual. Persisted delivery
errors prevent successful heartbeat. An individual in-flight I/O can overrun
the 20-second budget; this is not hard cancellation. Apply migration
`20261029010000_system_heartbeats` before starting the runtime. W3 health UI and
notification outbox remain planned. [Rollout and live checks](../ops/CLOUDFLARE-DEPLOYMENT.md).

## 2026-10-05 — Cloudflare deployment boundary (Partial)

The deployment Worker preserves Nest session/role/ownership checks. It
routes API only through the private Container binding; public JSON caching is
allowlisted and bypasses credentials, private routes, mutations and unsafe
responses. Forwarding strips client-supplied proxy headers and uses Cloudflare's
ingress IP for existing Nest limits. Worker unit coverage verifies that boundary.

Recursive Docker exclusions and the image filename gate prevent repository
dotenv/dev-vars files from entering the runtime image. Required Worker secret
names and the Container env allowlist are explicit. Static build checks use a
synthetic canary to detect non-public setting leakage and assert the target API
origin. Live WAF/rate rules, origin bypass, bucket privacy, secrets and purge are
`Needs verification`; prepared configuration is not evidence of cloud setup.
Exact checks/manual acceptance are owned by the
[deployment verification](../audits/current/14-CLOUDFLARE-DEPLOYMENT-VERIFICATION.md)
and [runbook](../ops/CLOUDFLARE-DEPLOYMENT.md).

## 1. Purpose and non-goals

This document owns **application-layer attacker defense** for the bidplace API and
clients: authentication, session invalidation, admin emergency controls, upload
hardening, and request rate limits.

It does **not** own auction integrity, bid ranking, provenance policy, or trust
investigations. Those stay in [`09-TRUST-AND-AUCTION-INTEGRITY.md`](09-TRUST-AND-AUCTION-INTEGRITY.md).

## 2. Auth and passwords

| Control | Status | Modules / tests |
| --- | --- | --- |
| Password hashing (Argon2) | Implemented | `apps/api/src/auth/` |
| Server session with current status, session version and role | Implemented locally | `session.service.ts`, `session-auth.guard.ts`, `optional-session-auth.guard.ts`; absolute 12h expiry, PostgreSQL store, SID rotation, version invalidation |
| Malformed-session handling | Implemented locally | Signed opaque SID through express-session. Optional auth rejects invalid supplied credentials with401; anonymous media remains public. Logout clears invalid cookies without revoking another account. Session owner units + auth-transport integration. |
| Neutral forgot-password (no email enumeration) | Implemented | `password-reset/` + `password-reset.integration.spec.ts` |
| Reset token stored as SHA-256 only; single-use + session bump in one TX | Implemented | `password-reset.service.ts` |
| OIDC signature, state, nonce and S256 PKCE | Implemented locally | `oidc-providers.service.ts` uses openid-client; PostgreSQL browser-bound one-use flows; signed test IdP HTTP coverage |
| Explicit identity linking | Implemented locally | `auth-flow.service.ts`; fresh authentication, current User/version and browser binding; no email auto-merge; logout/account switch cancels pending link |
| Email-code login and pending social email | Implemented locally | Shared auth-abuse engine; purpose/flow/version-bound HMAC; neutral request, shared mail quota, replay/pause/expiry; pending identity has no ordinary principal |
| Recovery invalidates pending provider proofs | Implemented locally | Reset transaction increments version and cancels pending flows/identities/codes; social-auth HTTP owner covers stale proof rejection |
| SMTP single-recipient guard | Implemented | `core/email/smtp-transport.ts` |

**Pros:** predictable auth surface; banned/compromised users cannot keep old cookies.  
**Cons:** no MFA, device binding, or breach-password list yet.  
**Revisit when:** real pilot abuse, credential stuffing, or compliance asks for step-up auth.

Provider configuration and external acceptance are owned by [Web auth rollout](../ops/WEB-AUTH-ROLLOUT.md). Real Google/Telegram smoke is still required.

## 3. Admin emergency controls

| Control | Status | Modules / tests |
| --- | --- | --- |
| Lookup user by email | Implemented | `admin-user.service.ts` |
| Ban/unban with reason; ban increments `sessionVersion` | Implemented | Owner `FraudSignalsService.updateUserStatus` / `banUser` via `AntifraudService`. `AdminUserService.updateStatus` delegates. HTTP `PATCH /api/admin/users/:id/status`. Guards: `SessionAuthGuard`, `AdminGuard`. |
| Revoke all sessions (`sessionVersion++`) | Implemented | `AdminUserService.revokeSessions` calls `AntifraudService.lockUsers` before the bump and audit. HTTP `POST /api/admin/users/:id/revoke-sessions`. Same guards. |
| Release purchase hold | Implemented | `FraudSignalsService.releaseHold` via `AntifraudService`, same id-ordered user lock. HTTP `POST /api/admin/users/:id/release-hold` requires a note. Same guards. |
| Emergency cancel listing `SCHEDULED\|LIVE → CANCELLED` | Implemented | `admin-listing-emergency.service.ts` |
| Author hide vs live listing | Implemented | `POST /products/:id/hide` returns 409 when a `SCHEDULED` or `LIVE` Listing exists; Product, Listing and audit are unchanged. No automatic listing cancel. Coverage: `products.service.spec.ts`, `author-hide-listing.integration.spec.ts` |
| Needs-order queue + manual Order create | Implemented | admin recovery routes + mobile Recovery tab |
| Read-only leftover commerce inventory | Implemented | `scripts/ops/commerce-inventory.mjs`; refuses `--apply`; no secret URLs in report |
| **Cannot ban self or another admin** | Implemented | `FraudSignalsService.updateUserStatus` rejects the acting admin and any `role = admin` target |
| **Cannot revoke self or another admin** | Implemented | `assertSessionRevokeTargetAllowed` in `admin-user.service.ts` |
| Revoke audit uses stable labels `session` / `revoked` | Implemented | `admin-user.service.ts` |

**Pros:** founder can stop abuse without schema churn; guards prevent admin lockout.  
**Cons:** listing emergency cancel still requires listing UUID in UI; no bulk actions.  
**Revisit when:** pilot volume needs search-by-public-id or automated stuck-queue rules.

## 4. Media upload defense

### Attack model

- Decompression bombs and oversized rasters exhausting CPU/RAM during decode.
- Animated GIF/WebP/PNG used for resource burn or unexpected motion in catalog.
- Upload spam against seller endpoints.
- Authorization bypass attempts before expensive work.

### Controls (MVP)

| Control | Status | Detail |
| --- | --- | --- |
| Authz before decode | Implemented | `ImagesService` runs owner + editable product + listing lock + `assertApprovedSeller` before Sharp; the persist TX repeats that guard under `SELECT … FOR UPDATE` |
| Static images only | Implemented | Reject `image/gif` and animated WebP/PNG (`pages`/`frames`/`delay`) |
| Pixel budgets | Implemented | Gallery/story input: **8192px / 50_331_648** pixels (`workImageInputPixelBudgets`); stored masters and other purposes: **4096px / 16_777_216** pixels (`productImagePixelBudgets`) |
| Byte/file caps | Partial acceptance | Gallery input25 MiB, story input10 MiB, stored master5 MiB; no separate story aggregate budget (`DEC-151`). `WORK_PHOTO_LIMITS` and `STORY_LIMITS` own counts. Locked save releases only unused story-purpose holds; cleanup rechecks references, including a story asset still held by another revision. Story POST requires `X-Photo-Revision` and binds that revision; a replay for a different revision is 409 before a new hold. Rejected client encodings are deleted; the source and an accepted URI stay. Verification gaps: W0 journal. |
| Decode outside TX | Implemented | Normalize outside the persist TX; short locked TX for status/listing/capacity check + insert |
| Sequential bounded normalize | Implemented | Metadata gate (`animated: true` for detection) → `rotate().toFormat(jpeg\|png)` with `limitInputPixels`; normalize uses `animated: false` |
| Upload rate limit | Implemented | `@RateLimit` counters persist in PostgreSQL: 20/min per user on gallery upload POSTs; 10/min on creation-step uploads, author achievement upload/delete, and profile photo create/update. Author, achievement, and work decode share one process-local admission of two operations. |
| Achievement / revision photo visibility | Implemented | Public achievement GET only from the published revision; owner/admin can read draft; anonymous/stranger draft reads 404. Owner application photo is private `no-store`. |
| Work publication/sale integrity (W1) | Implemented locally | `product-publication.ts` is the only Product status/published-pointer writer, under transaction row locks and checked CAS. `product-write-guard.ts` owns active-sale rejection for author/image/admin mutation and seller suspension. Hidden revision approval preserves ARCHIVED and performs no PUBLIC PUT; unwritten PUBLIC manifests are not marked READY. Product PUBLIC delivery shares hide’s row lock with lease/generation/status checks and a 60s I/O abort deadline before its 65s transaction timeout. Hide preserves nonrestore approval intent while revoking public copies. PENDING/FAILED nonrestore approval does not block PUBLIC revoke for ARCHIVED Work; PRIVATE and RUNNING protections remain. Work restore durably journals PUBLIC-only compensation before delivery, guarded by its current lease/token/generation. Exact failed-restore compensation can revoke ARCHIVED bytes while retaining PRIVATE sources and legitimate public references; retries rearm cleanup. Partial delivery/restart/journal-outage/shared-reference regressions pass locally. Compensation permits brief exposure before deletion/purge; strict privacy atomicity and live R2/CDN remain unverified. Real DB/transport regressions: `media-lifecycle.integration.spec.ts`, `author-hide-listing.integration.spec.ts`, `product-write-atomicity.integration.spec.ts`. |
| Active author visibility | Implemented | Public Work/Author queries, catalogs and binary media require active author user in addition to existing APPROVED/published-revision guards. Work image GET reuses `portfolioCatalogProductWhere` plus published-image membership, including publication-date/content eligibility. Admin private photo reads use `private, no-store`; `work-media-http.integration.spec.ts` + `sellers.controller.spec.ts`. |
| Catalog hydration visibility | Implemented | Catalog hydration repeats APPROVED/active/published checks after selecting IDs. Controlled PostgreSQL hide/suspend/ban interleavings in `portfolio-filters.integration.spec.ts` exclude revoked records. Counts retain the first-query snapshot. |
| Work upload replay | Implemented | Single-file HTTP key is scoped by owner/purpose/Work. A new upload over gallery count or into an already full byte budget is rejected before Sharp/R2; the locked attach transaction checks actual normalized SOURCE bytes. Large gallery input is single-file and requires an idempotency key; legacy batches retain 5 MiB per file. Replay of bytes already attached to the current revision does not create another image. Checksum conflict and earlier-revision attachment reject with 409 before the capacity short-circuit. `work-media-http.integration.spec.ts`, `upload-safety.integration.spec.ts`. Legacy ImageStore replay persists on ProductImage and is rechecked under the product lock; public fallback bytes strip metadata (`product-write-atomicity.integration.spec.ts`). |
| Canonical storage | Partial | Private SOURCE and metadata-stripped public WebP derivatives are implemented in `core/media` (new SOURCE is a normalized master; original input identity is retained separately); existing ImageStore serves legacy records until verified cutover. Live R2/CDN/restore acceptance remains pending. Architecture owner: `10-CODE-ARCHITECTURE.md`. |

Primary code: `apps/api/src/images/image-policy.ts`, `images.service.ts`, `images.controller.ts`, `portfolio.controller.ts`, `sellers.service.ts`.
Tests: `image-policy.spec.ts`, `image-processing-admission.spec.ts`, `sellers.profile-upload-limit.spec.ts`, `image-upload-safety.integration.spec.ts`, `upload-safety.integration.spec.ts`, `seller-permissions.integration.spec.ts`, `portfolio-published-revision.integration.spec.ts`.

**Pros:** cheap failures for non-owners; bounded decode; no animated surface in MVP catalog.  
**Cons:** live provider acceptance and legacy cutover remain unverified; legacy normalization keeps its existing JPEG/PNG behavior.
**Revisit when:** creators need motion assets, larger prints, or off-DB media; revisit animated policy explicitly with product/design.

## 5. Rate limits and enumeration

| Surface | Pattern | Status |
| --- | --- | --- |
| Register / login | PostgreSQL IP buckets in `rate_limit_counters` plus durable login counters | Implemented (`auth.controller.ts` → `AntifraudService`) |
| OTP send / verify | PostgreSQL IP buckets plus durable mail ledger, cooldowns, OTP pause | Implemented (`otp.service.ts` → `AntifraudService`) |
| Forgot / reset password | PostgreSQL IP buckets plus durable reset ledger and quotas | Implemented (`password-reset/` → `AntifraudService`) |
| Bid place | User + listing resource | Not on active API (commerce runtime archived; leftover Prisma only) |
| Image upload | User, 10/min | Implemented (`images.controller.ts`, profile photo in `sellers.controller.ts`, achievement in `portfolio.controller.ts`) |
| Forgot password response | `{ ok: true }` for accepted valid requests and account-specific suppression; typed errors for validation/Turnstile | Implemented |

Per-IP `@RateLimit` counters are rows in `rate_limit_counters`, owned by
`apps/api/src/antifraud/rate-limit/` and reached through `AntifraudService` or
the guard. The tick job `antifraud-cleanup` deletes expired rows. Mail sends,
login abuse counters, idempotent operations, OTP verify pause, and reset send
quotas stay in PostgreSQL through `apps/api/src/antifraud/auth/` (**DEC-109**).
Auth-abuse policy numbers live in `antifraud/auth/auth-abuse.policy.ts`. Fraud
thresholds live in `antifraud.policy.ts`.

**Pros:** raises cost of spray attacks; mail spend, replay, and IP windows survive a process restart.

**Cons:** image decode admission remains process-local. Live PostgreSQL contention under many replicas is not yet measured.

**Revisit when:** high-contention IP spray needs another store; durable quotas and idempotency stay atomic in PostgreSQL.

### 5.1 Auth abuse ledger, mail truth, Turnstile, disposable email (2026-10-10)

Status: Implemented in code; production SMTP delivery, live Turnstile hostname,
WAF, and coordinated migration rollout remain **Needs verification**.

`AntifraudService` is the public server owner. `AuthAbuseService` in
`apps/api/src/antifraud/auth/` remains the internal owner for registration checks,
login assessment, email-verification send/verify/correction, and password-reset
send quotas. `auth_abuse_operations` stores purpose, owner user, normalized email,
idempotency key, content hash, status, and secret linkage; `auth_abuse_counters`
stores scoped failure/pause state. Short transactions take row locks; SMTP runs
outside the database transaction.

| Mechanism | Detail |
| --- | --- |
| Mail purposes | `email_verification_send`, `password_reset_send`, `email_login_send` share quotas; verification and email-login have separate verify purposes |
| Global mail budgets | `AUTH_MAIL_DAILY_BUDGET` default **200** spends / rolling 24h; `AUTH_MAIL_MONTHLY_BUDGET` default **3000** spends / rolling 31 days (`env.ts`; counts all `MAIL_PURPOSES` with spend statuses) |
| Personal mail quota | **10** spends per rolling 24h **per account and per address** together (`PERSONAL_MAIL_LIMIT` / `PERSONAL_MAIL_WINDOW_MS`); verification, recovery and email-login sends share this pool, not separate per-purpose allowances |
| Send spacing | After 1st/2nd/3rd+ **reserved** spend on the same owner+purpose: 60s / 120s / 300s (`cooldownAfterSends`); not gated on SMTP `accepted` alone |
| Quota spend | `reserved`, `accepted`, and `unknown` spend; definite `rejected` does not |
| OTP code TTL | 5 minutes; one active unused code per send cycle |
| OTP verify pause | Durable `otp_verify` counter per owner (`auth_abuse_counters`); **5** failed verifies then **5** minute pause; survives resend and email correction; after pause expires the failure cycle resets (`refreshOtpPause`) |
| Login Turnstile | After 5 failed password attempts on an email within 15 minutes (distributed email counter) |
| Login pair pause | After 10 failed attempts on the email+IP pair: 5 minute pause only |
| Reset token TTL | 1 hour (unchanged product window) |
| Idempotency | Required on OTP send, OTP verify, and forgot-password send only (not password register/login). Same `(purpose, idempotencyKey)` replays stored outcome without a second SMTP send or verify-attempt recharge |
| Content binding | Send hashes bind owner, purpose, and address; verify hash includes the six-digit code (`verifyContentHash`). Same key with changed content is rejected |

**Email-login boundary (2026-10-22):** CAPTCHA is checked once before neutral
browser/email admission. Rejected/unavailable CAPTCHA spends no cooldown; SMTP
unknown replay never sends twice. Browser admission survives credential-flow
rotation after revoke, while OTP proofs keep their flow/version binding.
Credential refusals return the same 403 EMAIL_LOGIN_REJECTED with no account,
pause or provider details; account OTP counters remain durable. Infrastructure
failures retain 5xx. `social-auth.integration.spec.ts` covers eligibility, expiry,
pause, same-key replay, revoke and successful fresh proof.

**MVP CAPTCHA simplification:** social profile completion already requires a
valid browser-bound Google/Telegram proof, so it has no second registration
CAPTCHA. Real email policy, legal evidence, TTL, single-use transitions and
pending-email restrictions remain server-side. Password registration, mail
requests and adaptive password-login CAPTCHA remain enabled. See DEC-134.

**SMTP outcome truth:** `accepted` means the transport completed without a
classified failure. `rejected` is definite only for the single-recipient guard
or an SMTP `responseCode` in 400–599 (`mail-outcome.ts`). Timeouts, connection
loss, and ambiguous disconnects stay `unknown`. `unknown` does not trigger an
automatic SMTP retry; an already-issued code or reset link may still be usable
until expiry. Clients must not treat `accepted` as proof the message reached the
mailbox.

**Neutral recovery:** `POST /auth/password/forgot` returns `{ ok: true }` for
accepted valid requests and for account-specific suppression (unknown email,
inactive user, quota/cooldown/budget blocks recorded as suppressed operations).
Malformed body, Turnstile refusal, and other typed API errors still fail closed
with their normal status codes; neutrality does not remove safe validation or
infrastructure errors. Suppression is not mailbox-delivery evidence.

**Sessions:** `sessionVersion` does **not** increment on successful login or
registration (registration starts at `0`). Logout, password reset completion,
ban, and admin revoke are the current bump paths. Wrong-password, unknown-account,
and foreign login attempts do not revoke existing sessions; they may trigger
Turnstile challenge and email+IP pair pause only.
Flow creation, login and logout serialize on a PostgreSQL lock for the browser
SID and reject a delayed write when the old SID was rotated or removed.

**Turnstile:** server-side Siteverify only; `TURNSTILE_SECRET_KEY` and
`TURNSTILE_HOSTNAME` are required on the production security profile. Each check
binds `action` (`register`, `login`, `email_login`, `email_verification`, `password_reset`),
hostname, challenge age, and stable validation identity for mail sends.
Mismatch, expiry, or verifier outage fails closed (`TURNSTILE_*` API codes).
The web client calls `useInvisibleTurnstile` (`apps/mobile/src/features/auth/turnstile-widget.tsx`)
and requests a token on submit. There is no visible challenge block. Required
registration, code login, and password reset still fail closed without a valid
proof. `verifySignal` does not throw and is not connected to purchases in W2b.
A missing site key or script blocks those required submits. Native completeness
is not claimed. Cloudflare Invisible mode, or a replacement widget using the
same configured names, remains a founder action.

**Disposable email:** registration and unverified email correction consult a
pinned local list (**9222** domains, commit
`81a8976e63879a11bf4301a28c14e0eb7a7855cf`, SHA-256
`14f873c136310a4e9e8f25a692c67b211aa049eca7642f0c4a435a38b2af8b21`, CC0).
Source, license, and update command: `apps/api/src/antifraud/auth/vendor/SOURCE.md`.
Login and password recovery do not use the list.

Coverage: `auth-abuse.service.spec.ts`, `auth-abuse.policy.spec.ts`,
`mail-outcome.spec.ts`, `turnstile-verifier.spec.ts`, `disposable-email.spec.ts`,
`auth-abuse.integration.spec.ts`, plus auth/OTP/reset service and HTTP integration
specs that delegate to the module.

## 6. Decision table (summary)

| Decision | Status | Pros | Cons | Revisit when |
| --- | --- | --- | --- | --- |
| MVP static-only product images | Implemented | Predictable catalog; lower decode risk | No GIF/motion for creators | Explicit product ask for motion |
| Authz-before-decode uploads | Implemented | Forbidden before CPU spend | Slightly more service logic | N/A unless upload path splits |
| Separate input/output pixel budgets | Implemented | Gallery admits 48MP within 8192px/50M input; stored masters stay within 4096px/16M | Concurrent 48MP decoding on production container needs verification | Creator uploads exceed budget in pilot |
| Admin self/admin incident guards | Implemented | Prevents founder lockout | Stricter emergency ops | Never without alternate break-glass |
| S3-compatible binary image storage | Partial | Keeps binary outside PostgreSQL in production | Needs production bucket and restore drill | Before public launch |

See [`12-DECISION-LOG.md`](12-DECISION-LOG.md) **DEC-068** for the static-only image decision record.

## 7. Environment profiles (fail closed)

Status: Implemented

`apps/api/src/core/config/env-profile.ts` is the single production-like predicate.
Env parsing rejects inconsistent pairs before bootstrap:

| `NODE_ENV` | `APP_ENV` | Result |
| --- | --- | --- |
| `development` | `local` | Allowed local development |
| `test` | `local` | Allowed tests; `TEST_EMAIL_BYPASS` may be enabled |
| `production` | `production` | Production security required |
| `production` | `staging` | Production security required (staging unchanged) |
| `development` or `test` | `staging` | Allowed; no production SMTP/rules requirement |
| `development` or `test` | `production` | Rejected: `APP_ENV=production requires NODE_ENV=production` |
| `production` | `local` (including default) | Rejected: `NODE_ENV=production requires APP_ENV=production or APP_ENV=staging` |

Production security (`NODE_ENV=production` or `APP_ENV=production`) requires SMTP, service rules, `PASSWORD_RESET_URL_BASE`, S3 media configuration, and `SESSION_SECRET` / `OTP_HASH_SECRET` / `INTERNAL_TICK_SECRET` of at least 32 characters. `TEST_EMAIL_BYPASS` cannot be enabled. Session cookies use `secure` on that profile. Local mail transport and default service-rules text cannot run there.

Destructive demo seed remains `NODE_ENV=development|test`, `APP_ENV=local`, and `ALLOW_DESTRUCTIVE_DEMO_SEED=true` only.

Coverage: `env-profile.spec.ts`, `env.spec.ts` matrix, `rules.spec.ts`, `local-mail-transport.spec.ts`, `auth.controller.spec.ts`, `seed-contract.integration.spec.ts`.

**Pros:** `APP_ENV=production` cannot boot with a development/test Node profile; bypass/seed stay local-test-only.
**Cons:** Compose `app` profile must set `APP_ENV=production`; short session/OTP secrets fail production parse.
**Revisit when:** staging gets its own owner rule (SMTP/session policy distinct from production).

## 8. Deferred ops/security (post-pilot)

- **Backup encryption at rest:** `BACKUP_GPG_RECIPIENT` is supported by `scripts/ops/backup-db.sh`; production key management and rotation are not automated yet. See [`docs/ops/00-RELEASE-AND-BACKUP.md`](../ops/00-RELEASE-AND-BACKUP.md).
- **Multi-instance rate limits:** `@RateLimit` counters are PostgreSQL
  `rate_limit_counters` (W2b). Image decode admission remains process-local.
  Durable auth-abuse quotas, pauses, and mail idempotency stay in PostgreSQL
  (**DEC-109**). Revisit another store only for high-contention IP spray, without
  moving atomic quota/idempotency out of PostgreSQL.

### Registration consent boundary —2026-10-20

По DEC-125 подтверждения и18+ обязательны независимо от успешности просмотра
документов. RegistrationLegalEvidence фиксирует принятие серверной редакции,
а не доказательство загрузки/прочтения. Отсутствующие клиентские version допустимы;
если версия передана, сервер проверяет актуальность. В БД всегда записывается
настоящая серверная версия, без пустого/fake значения. Missing/corrupt canonical
source не подменяется fallback. User+evidence создаются атомарно; Turnstile и
session/identity protection не ослабляются. Не объявлять незавершённый пакет
готовым к публичному запуску по одному факту доступной регистрации.

Local manual-test compatibility: ScriptedTurnstileVerifier accepts Cloudflare's
official public dummy token only through the existing test/local factory gate.
Development/staging/production profiles do not enable this verifier. Dummy
tokens have no real action/hostname proof and are not a security-verification
claim. Production Cloudflare Siteverify/action/hostname/expiry checks unchanged.


## 2026-10-22 — Email proof before account creation

Implemented locally (DEC-135): password registration requires a browser-bound
proof for the exact email before creating User/legal evidence; unproved social
onboarding creates neither User nor ExternalIdentity. A trusted provider email
proof remains valid. Email collisions are disclosed only after ownership proof;
no automatic linking occurs. Explicit link still requires the current verified
account session and provider proof.

`EmailProofService` enforces 10-minute expiry, five guesses, three sends per
flow, 60-second resend delay, shared address quota and global auth mail budgets.
Codes are HMAC-only in PostgreSQL. Definite mail rejects invalidate the code;
unknown outcomes retain it and do not trigger automatic resend.

Email-proof replay uses the stored `(flowId, idempotencyKey)` operation, including
older keys after a new send. Definite rejection returns 503 `MAIL_REJECTED` and
atomically records the outcome and clears only its current code/expiry/cooldown.
The rejected reservation still consumes one of the three flow attempts, but no
shared mail quota; replay consumes neither. A fresh key requires fresh CAPTCHA.
Reserved operations replay as unknown without waiting on SMTP; after the normal
60-second cooldown a new reservation remains possible within the same limits.
Late outcomes cannot overwrite a newer code. State reads use one repeatable-read
snapshot; current rejection exposes `sendStatus=rejected` and null deadlines.
An uncertain database write is an infrastructure error, never evidence of SMTP
rejection or permission for automatic resend. Social onboarding refreshes state
and rotates its key only after confirmed `MAIL_REJECTED`; uncertain errors retain it.

Known/unknown email-login failures now use the same durable operation/counter
path, including pause and replay, without creating dummy users. HTTP regression
covers equal outcomes, five-failure pause, expiry, cancellation, browser binding,
mail budgets and pre-proof absence of users. CI requires the isolated abuse DB
and runs the browser owner on Draft auth PRs too. Production timing, live
Google/Telegram/SMTP/Turnstile remain Needs verification.


## 2026-10-23 — Принятое SMTP timing-ограничение (DEC-136)

`AuthAbuseService.sendEmailLogin` ожидает транспорт для известного активного
аккаунта, но возвращает нейтральный ответ без отправки для неизвестного адреса.
Разница времени request остаётся каналом email enumeration, даже при одинаковом
статусе/JSON. Это принятое ограничение MVP, а не доказанная нейтральность SMTP.
Путь verify имеет отдельные SQL/counter/pause-инварианты и проверяется отдельно.

Остаются обязательными browser/purpose/version binding, одноразовость кодов,
CSRF/origin, идемпотентность, shared quotas и accepted/rejected/unknown outcomes.
Для production нужны реальные SMTP/Turnstile/provider проверки и отдельная оценка
timing на целевой инфраструктуре. Асинхронный outbox без надёжного пробуждения
scale-to-zero контейнера не добавляется; причины и альтернативы — DEC-136.


## 2026-10-23 — Opt-in web analytics proof

New web collection is off without both explicit client and API configuration.
The server verifies an environment/purpose-bound signed HttpOnly browser cookie;
malformed proofs never prevent a saved registration. Only actual account creation
can associate the new cohort relation, independently of legacy claims/login.
Page properties and attribution are bounded/allowlisted; no arbitrary URLs,
queries, forms, client timestamps, user identity or environment are accepted.
Database uniqueness/row locks own deduplication and inactivity sessions. New admin
reports require the existing session/admin guards and private no-store responses.
[Proof, configuration and production prerequisites](analytics-contract.md).

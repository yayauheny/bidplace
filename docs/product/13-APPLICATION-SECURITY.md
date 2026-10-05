# bidplace — application security (engineering)

Последнее обновление: 2026-10-05
Статус: Confirmed (engineering owner)

## 2026-10-05 — Cloudflare deployment boundary (Partial)

The deployment Worker preserves Nest JWT/session/role/ownership checks. It
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
| Session JWT with current status, session version and role | Implemented | `auth-token.service.ts`, `bearer-auth.guard.ts`, `optional-bearer-auth.guard.ts` |
| Strict JWT encoding and malformed-session handling | Implemented | Exactly three base64url segments; canonical signature comparison. Optional auth rejects malformed supplied credentials with 401; anonymous media remains public. Logout clears malformed cookies without revoking another account. Token/optional/logout units + `auth-transport.integration.spec.ts`. |
| Neutral forgot-password (no email enumeration) | Implemented | `password-reset/` + `password-reset.integration.spec.ts` |
| Reset token stored as SHA-256 only; single-use + session bump in one TX | Implemented | `password-reset.service.ts` |
| SMTP single-recipient guard | Implemented | `core/email/smtp-transport.ts` |

**Pros:** predictable auth surface; banned/compromised users cannot keep old cookies.  
**Cons:** no MFA, device binding, or breach-password list yet.  
**Revisit when:** real pilot abuse, credential stuffing, or compliance asks for step-up auth.

## 3. Admin emergency controls

| Control | Status | Modules / tests |
| --- | --- | --- |
| Lookup user by email | Implemented | `admin-user.service.ts` |
| Ban/unban with reason; ban increments `sessionVersion` | Implemented | `admin-user.service.ts`, `admin-user-emergency.integration.spec.ts` |
| Revoke all sessions (`sessionVersion++`) | Implemented | same |
| Emergency cancel listing `SCHEDULED\|LIVE → CANCELLED` | Implemented | `admin-listing-emergency.service.ts` |
| Author hide vs live listing | Implemented | `POST /products/:id/hide` returns 409 when a `SCHEDULED` or `LIVE` Listing exists; Product, Listing and audit are unchanged. No automatic listing cancel. Coverage: `products.service.spec.ts`, `author-hide-listing.integration.spec.ts` |
| Needs-order queue + manual Order create | Implemented | admin recovery routes + mobile Recovery tab |
| Read-only leftover commerce inventory | Implemented | `scripts/ops/commerce-inventory.mjs`; refuses `--apply`; no secret URLs in report |
| **Cannot ban/revoke self or other admins** | Implemented | `assertIncidentTargetAllowed` in `admin-user.service.ts` |
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
| Pixel budgets | Implemented | Max edge **4096px**, max **16_777_216** pixels (`productImagePixelBudgets`) |
| Byte/file caps | Implemented | Existing `productImageUploadLimits` unchanged |
| Decode outside TX | Implemented | Normalize outside the persist TX; short locked TX for status/listing/capacity check + insert |
| Sequential bounded normalize | Implemented | Metadata gate (`animated: true` for detection) → `rotate().toFormat(jpeg\|png)` with `limitInputPixels`; normalize uses `animated: false` |
| Upload rate limit | Implemented | `@RateLimit` 10/min per user on product and creation-step upload POSTs, author achievement upload/delete, and profile photo create/update. Author, achievement, and work decode share one process-local admission of two operations. |
| Achievement / revision photo visibility | Implemented | Public achievement GET only from the published revision; owner/admin can read draft; anonymous/stranger draft reads 404. Owner application photo is private `no-store`. |
| Active author visibility | Implemented | Public Work/Author queries, catalogs and binary media require active author user in addition to existing APPROVED/published-revision guards. Admin private photo reads use `private, no-store`; `work-media-http.integration.spec.ts` + `sellers.controller.spec.ts`. |
| Catalog hydration visibility | Implemented | Catalog hydration repeats APPROVED/active/published checks after selecting IDs. Controlled PostgreSQL hide/suspend/ban interleavings in `portfolio-filters.integration.spec.ts` exclude revoked records. Counts retain the first-query snapshot. |
| Work upload replay | Implemented | Single-file HTTP key is scoped by owner/purpose/Work. A new upload over gallery count or total bytes is rejected before Sharp/R2; the locked attach transaction repeats that check. Replay of bytes already attached to the current revision does not create another image. Checksum conflict and earlier-revision attachment reject with 409 before the capacity short-circuit. `work-media-http.integration.spec.ts`, `upload-safety.integration.spec.ts`. |
| Canonical storage | Partial | Private SOURCE and metadata-stripped public WebP derivatives are implemented in `core/media`; existing ImageStore serves legacy records until verified cutover. Live R2/CDN/restore acceptance remains pending. Architecture owner: `10-CODE-ARCHITECTURE.md`. |

Primary code: `apps/api/src/images/image-policy.ts`, `images.service.ts`, `images.controller.ts`, `portfolio.controller.ts`, `sellers.service.ts`.
Tests: `image-policy.spec.ts`, `image-processing-admission.spec.ts`, `sellers.profile-upload-limit.spec.ts`, `image-upload-safety.integration.spec.ts`, `upload-safety.integration.spec.ts`, `seller-permissions.integration.spec.ts`, `portfolio-published-revision.integration.spec.ts`.

**Pros:** cheap failures for non-owners; bounded decode; no animated surface in MVP catalog.  
**Cons:** live provider acceptance and legacy cutover remain unverified; legacy normalization keeps its existing JPEG/PNG behavior.
**Revisit when:** creators need motion assets, larger prints, or off-DB media; revisit animated policy explicitly with product/design.

## 5. Rate limits and enumeration

| Surface | Pattern | Status |
| --- | --- | --- |
| Register / login | IP-scoped limits | Implemented (`auth.controller.ts`) |
| OTP send | IP + user | Implemented (`otp.service.ts`) |
| Forgot / reset password | IP + email bucket | Implemented (`password-reset.controller.ts`) |
| Bid place | User + listing resource | Implemented (`bids.controller.ts`) |
| Image upload | User, 10/min | Implemented (`images.controller.ts`, profile photo in `sellers.controller.ts`, achievement in `portfolio.controller.ts`) |
| Forgot password response | Always `{ ok: true }` | Implemented |

**Pros:** raises cost of spray attacks without changing product contracts.  
**Cons:** in-memory limits assume single API replica (same as scheduler note in architecture).  
**Revisit when:** multi-instance deployment or shared Redis rate-limit store.

## 6. Decision table (summary)

| Decision | Status | Pros | Cons | Revisit when |
| --- | --- | --- | --- | --- |
| MVP static-only product images | Implemented | Predictable catalog; lower decode risk | No GIF/motion for creators | Explicit product ask for motion |
| Authz-before-decode uploads | Implemented | Forbidden before CPU spend | Slightly more service logic | N/A unless upload path splits |
| 4096 / 16M pixel budgets | Implemented | Blocks common bombs | May reject very large art scans | Creator uploads exceed budget in pilot |
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

Production security (`NODE_ENV=production` or `APP_ENV=production`) requires SMTP, service rules, `PASSWORD_RESET_URL_BASE`, S3 media configuration, and `JWT_SECRET` of at least 32 characters. `TEST_EMAIL_BYPASS` cannot be enabled. Session cookies use `secure` on that profile. Local mail transport and default service-rules text cannot run there.

Destructive demo seed remains `NODE_ENV=development|test`, `APP_ENV=local`, and `ALLOW_DESTRUCTIVE_DEMO_SEED=true` only.

Coverage: `env-profile.spec.ts`, `env.spec.ts` matrix, `rules.spec.ts`, `local-mail-transport.spec.ts`, `auth.controller.spec.ts`, `seed-contract.integration.spec.ts`.

**Pros:** `APP_ENV=production` cannot boot with a development/test Node profile; bypass/seed stay local-test-only.
**Cons:** Compose `app` profile must set `APP_ENV=production`; short JWT secrets fail production parse.
**Revisit when:** staging gets its own owner rule (SMTP/JWT policy distinct from production).

## 8. Deferred ops/security (post-pilot)

- **Backup encryption at rest:** `BACKUP_GPG_RECIPIENT` is supported by `scripts/ops/backup-db.sh`; production key management and rotation are not automated yet. See [`docs/ops/00-RELEASE-AND-BACKUP.md`](../ops/00-RELEASE-AND-BACKUP.md).
- **Multi-instance rate limits:** in-memory upload/auth limits remain single-replica until a shared store is chosen (**DEC-069**).

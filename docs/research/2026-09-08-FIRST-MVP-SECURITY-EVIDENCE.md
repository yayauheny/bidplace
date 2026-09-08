# First MVP security evidence

Reviewed 2026-09-08 from tracked source, manifests and local tests. This is not a
substitute for production deployment verification or a legal review.

| Finding | Severity | Evidence and mitigation | Launch state |
| --- | --- | --- | --- |
| Stale JWT admin role | P1, fixed | Bearer and optional guards now load current `User.role`, status and sessionVersion before setting request auth; unit test covers `admin → user`. | Fixed in `5331c90`. |
| Revoked or banned session | P1, mitigated | Guards reject inactive account or changed sessionVersion; admin ban/revoke increments the version. | Requires PostgreSQL integration drill. |
| Unsafe public profile URL | P1, mitigated | Shared `httpsUrlSchema` rejects non-HTTPS writes. `ops:url-preflight` reports legacy counts only; no automatic rewrite occurs. | Manual cleanup required if counts are non-zero. |
| Upload decompression / spoofing | P1, mitigated | Server authorizes before decode, checks limits and normalizes through Sharp. | Requires disposable integration drill. |
| Object storage configuration | P1, mitigated | Production parser requires S3 provider and complete config; S3 adapter does not log credentials. | Live MinIO/S3 restore drill required. |
| In-memory rate limiting in multiple replicas | P2 | Current limits are process-local. Exploit condition: more than one API replica without shared rate-limit storage. | Defer until multi-instance deployment. |
| Backup encryption and retention | P2 | Optional GPG backup exists; provider, key rotation and retention are `UNKNOWN`. | Operations decision before public launch. |
| Dependency advisories | Needs verified audit | Exact lockfile is present, but no registry audit was run in this offline workspace. | Run `pnpm audit --prod` in release environment and triage reachable production findings. |

## Scope checked

Auth guards, password reset, OTP, upload policy, CORS/proxy configuration, rate-limit
guards, Socket.IO boundary, mail transport, public URL contracts, object storage,
audit events and backup scripts were inspected. No real credentials, environment files,
database rows or user data were read.

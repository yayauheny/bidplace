# Release, deploy, backup, and restore

Operational runbook for the pilot single-replica stack. Product contracts remain in
[`docs/product/05-MVP-RFC.md`](../product/05-MVP-RFC.md); architecture constraints in
[`docs/product/10-CODE-ARCHITECTURE.md`](../product/10-CODE-ARCHITECTURE.md).

## Pilot constraints

- One API replica and one PostgreSQL instance.
- Auction lifecycle cron and in-process rate limits assume a single scheduler.
- Product image metadata, checksums and object keys live in PostgreSQL; production
  image bytes live in S3-compatible object storage. A database dump alone does
  not restore media bytes.
- Mobile web is built and hosted separately (`expo export` or static host). The historical Compose `app` override ships API + Postgres only.

## Toolchain and clean checkout gate

Requirements:

- Node.js `22` (see [`.nvmrc`](../../.nvmrc))
- pnpm `11.7.0` (`packageManager` in root `package.json`)
- Docker for local PostgreSQL and integration tests

From a fresh clone:

```bash
pnpm install
cp .env.example .env
pnpm docker:up
pnpm verify
```

`pnpm verify` runs, in order: `typecheck` (Turbo runs `database#generate` first), `lint`, all unit suites
(including mobile), the ops-script unit suite, the disposable E2E database
fence, `test:integration`, and `build`. Maintained browser tests remain separate
because they create a disposable database and start local services.

GitHub Actions runs the same deterministic gate on push and pull requests via [`.github/workflows/verify.yml`](../../.github/workflows/verify.yml). Full browser E2E is intentionally **not** part of automatic CI/CD because it is slow and resource-heavy. Chromium E2E remains available as a manual `workflow_dispatch` workflow in [`.github/workflows/browser-e2e.yml`](../../.github/workflows/browser-e2e.yml), while the full Chromium/WebKit matrix remains a manual release gate.

## Public portfolio packaging (Cloudflare target)

`make build` produces the workspace and `make build-web` produces web assets in
`apps/mobile/dist`; serve SPA fallback for direct author/work/auth links.
`apps/api/Dockerfile` packages the existing NestJS runtime. Frozen install includes
all copied workspace manifests and the Expo patch; API-only deploy allows its
unused mobile patch. Production build and native Argon2/Sharp/Prisma plus HTTP
startup were checked on Linux arm64 with synthetic settings in the earlier pass.
The Cloudflare package additionally verifies linux/amd64 with a disposable DB.
Real Neon TLS, SMTP, R2 and CDN still require provider acceptance.

The public runtime uses external Neon PostgreSQL and the confirmed private/public
R2 + native CDN design. The selected application target is a thin Cloudflare
Worker, Expo Static Assets and one private Nest Container under `bid.place`
(`DEC-098`). The prepared scripts, runtime secret contract, isolated staging,
separate migrations and provider smoke are owned by the
[Cloudflare deployment runbook](CLOUDFLARE-DEPLOYMENT.md); exact local results and
manual blockers are in the
[deployment verification](../audits/current/14-CLOUDFLARE-DEPLOYMENT-VERIFICATION.md).
Prepared code is not evidence of an actual cloud deployment.

## Historical pilot (single-replica Compose)

This is the existing pilot configuration, not the selected public release target.
The public portfolio release targets Cloudflare Containers/Static Assets,
external Neon PostgreSQL and Cloudflare R2/CDN. Default `docker-compose.yml` is local PostgreSQL only.
The existing API profile is in `docker-compose.app.yml`, so local dev no longer
requires production SMTP variables. Do not use its exposed local DB, localhost
CORS default or unconditional proxy trust as a public deployment configuration.

### Pre-deploy

1. Take a backup (see [Backup](#backup)).
2. Record the current API image tag or git SHA.
3. Confirm migrations are reviewed; unsafe migrations need a restore plan.

### Deploy steps

Ensure root `.env` includes the production keys the API container validates when
`NODE_ENV=production` and `APP_ENV=production` (copy from [`.env.example`](../../.env.example) if needed):

- `APP_ENV=production` (Compose `app` profile sets this; `APP_ENV=local` is rejected)
- `JWT_SECRET` (at least 32 characters; the value is never logged)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_AUTH_MODE`, `SMTP_FROM`
- `PASSWORD_RESET_URL_BASE`
- `SERVICE_RULES_OWNER`, `SERVICE_RULES_CONTACT`, `SERVICE_RULES_TEXT`
- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- optional: `CORS_ORIGIN` (defaults to `http://localhost:8081`)

When `SMTP_AUTH_MODE=login`, set `SMTP_USERNAME` and `SMTP_PASSWORD` in `.env`.
Compose forwards both; empty values normalize to absent for `SMTP_AUTH_MODE=none`.
Cloudflare Email Service uses a different profile: `smtp.mx.cloudflare.net`,
port 465, implicit TLS. That contract is in
[Cloudflare deployment](CLOUDFLARE-DEPLOYMENT.md), not in this local Compose file.

```bash
# Build and start API + Postgres
docker compose -f docker-compose.yml -f docker-compose.app.yml --profile app up -d --build

# Apply migrations against the running database
pnpm db:migrate

# Smoke checks
curl -sf http://localhost:3001/api/health
curl -sf http://localhost:3001/api/health/ready
```

`GET /api/health` is liveness only. `GET /api/health/ready` returns `503` when PostgreSQL is unreachable or the probe times out (2s).

Before serving traffic, run a media provider smoke against an isolated prefix;
it writes, reads/checksums and deletes only its own random object:

```bash
MEDIA_PREFLIGHT_PREFIX='ops/preflight/staging' pnpm ops:media-preflight
```

Compose reads the required keys from `.env` at the repo root. Default local Postgres URL inside Compose is:

`postgresql://auction:auction@postgres:5432/bidplace?schema=public`

### Rollback

1. Stop the API container: `docker compose -f docker-compose.yml -f docker-compose.app.yml --profile app stop api`
2. Run the previous API image tag.
3. If the migration was unsafe or partially applied, restore the pre-deploy dump into a fresh database or roll back schema per migration notes, then restart API.

Do not run multiple API replicas behind a load balancer in the pilot; rate limits and cron are not multi-instance safe.

## Media backfill and R2 cutover

Current CLI: `pnpm ops:backfill-media`, dry-run by default; `--apply` enables
object writes and missing-key updates. Runtime selection is a separate operation.
The CLI consumes the source `DATABASE_URL` and target `S3_*` settings from an
operator-controlled environment; do not print or commit credentials.

It covers Product images, seller parent photos, creation-step images, seller
revision photos and achievement images. All source metadata and retained bytes
are checked before writes. Existing target objects are read and verified before
reuse; an incompatible object is not overwritten. After PUT the CLI reads and
checks SHA-256, length and MIME type before recording a missing DB key. Repeated
apply verifies existing objects and does not rewrite a valid object.

1. Confirm the intended source dataset and target bucket. This script copies
   bytes retained in PostgreSQL; it does not fetch an old S3 provider. A
   metadata-only reference needs an existing target or another matching source
   row. Resolve missing objects explicitly before cutover.
2. Freeze uploads, media edits and moderation for the migration window. Paging
   does not provide a cross-table transaction snapshot. Record DB and object
   backups and the previous runtime configuration.
3. Run dry-run and review the five owner counts plus shared-key inventory.
   A source checksum failure must be investigated; do not skip that row.
4. Run `ops:media-preflight` on the actual R2 target, then apply backfill. Run
   apply again: uploads and missing-key updates should be zero and all unique
   objects verified. Original DB bytes stay intact.
5. Switch the API to the verified target with `MEDIA_STORAGE_PROVIDER=s3`.
   Verify all five media classes through owner/admin/public reads and denied
   draft/stranger reads. Enable the separately approved CDN architecture and
   verify cache hits, replacement, unpublication and seller suspension.
6. Complete DB + object restore verification before reopening writes/traffic.

Rollback while writes are frozen: restore the previous runtime configuration;
retained bytes/backups remain available. After new R2-only writes begin, a
provider rollback requires copying those new objects too; switching to the old
database alone is not a complete rollback. Do not delete old DB bytes or objects
as part of this migration.

Live R2/SMTP/CDN evidence remains a release prerequisite. Current verification
and open choices: [launch audit](../audits/2026-10-04-PUBLIC-LAUNCH-READINESS.md).

## Backup

Script: [`scripts/ops/backup-db.sh`](../../scripts/ops/backup-db.sh)

```bash
# Uses DATABASE_URL from the environment or .env-loaded shell
pnpm ops:backup

# Or explicitly
SOURCE_DATABASE_URL='postgresql://auction:auction@127.0.0.1:5432/bidplace?schema=public' pnpm ops:backup
```

Output: `backups/bidplace-<UTC-timestamp>.dump` (custom `pg_dump -Fc` format).

When `bidplace-postgres` is running locally, backup/restore scripts use `docker exec`
so `pg_dump`/`pg_restore` versions match the server (host Postgres 17 clients against
Postgres 16 in Docker will fail).

Optional encryption when `BACKUP_GPG_RECIPIENT` is set:

```bash
BACKUP_GPG_RECIPIENT='ops@example.com' pnpm ops:backup
```

### Retention example

Daily cron (adjust host paths):

```cron
15 2 * * * cd /srv/bidplace && SOURCE_DATABASE_URL='...' pnpm ops:backup && find /srv/bidplace/backups -name 'bidplace-*.dump*' -mtime +14 -delete
```

Keep at least one pre-deploy dump until the deploy is verified.

## Restore drill (local)

Restore always targets a **separate** database name. Scripts refuse `bidplace` and require `restore`, `integration`, `_test`, or `_e2e` in the database name.

```bash
pnpm docker:up

# 1. Backup current local/dev data
SOURCE_DATABASE_URL='postgresql://auction:auction@127.0.0.1:5432/bidplace?schema=public' pnpm ops:backup

# 2. Restore into isolated database
TARGET_DATABASE_URL='postgresql://auction:auction@127.0.0.1:5432/bidplace_restore?schema=public' \
  pnpm ops:restore backups/bidplace-<timestamp>.dump

# 3. Integrity checks (database counts + metadata checksums)
pnpm --filter @bidplace/database build
TARGET_DATABASE_URL='postgresql://auction:auction@127.0.0.1:5432/bidplace_restore?schema=public' \
  pnpm ops:verify-restore
```

Evidence checklist:

- [ ] `pnpm ops:backup` exits 0 and writes a dated dump under `backups/`
- [ ] `pnpm ops:restore` creates `bidplace_restore` and completes without error
- [ ] `pnpm ops:verify-restore` prints table counts and verifies sample `ProductImage.checksum` values
- [ ] `curl -sf localhost:3001/api/health/ready` succeeds against the primary database after deploy smoke
- [ ] `MEDIA_PREFLIGHT_PREFIX='ops/preflight/restore-drill' pnpm ops:media-preflight`
      succeeds against the intended bucket and leaves no test object behind

## Staging smoke

The staging smoke is read-only: it checks health/readiness, public Home/Works/
Authors API reads and verifies that SPA host routes for login, Works, Authors,
profile and cabinet are not host-level 404s. It does not authenticate, create
data or invoke object storage.

```bash
STAGING_API_URL='https://api.staging.example' \
STAGING_WEB_URL='https://staging.example' \
pnpm ops:staging-smoke
```

## Deferred (post-pilot)

- Multi-instance API and shared rate-limit state
- Removal of legacy DB media bytes after a verified object-store cutover
- Full browser/device/a11y CI matrix

See also [`docs/product/13-APPLICATION-SECURITY.md`](../product/13-APPLICATION-SECURITY.md) for backup encryption and multi-instance rate-limit notes.

# Release, deploy, backup, and restore

Operational runbook for the pilot single-replica stack. Product contracts remain in
[`docs/product/05-MVP-RFC.md`](../product/05-MVP-RFC.md); architecture constraints in
[`docs/product/10-CODE-ARCHITECTURE.md`](../product/10-CODE-ARCHITECTURE.md).

## Pilot constraints

- One API replica and one PostgreSQL instance.
- Auction lifecycle cron and in-process rate limits assume a single scheduler.
- Product images live in PostgreSQL `BYTEA`; backup is a database dump, not separate object storage.
- Mobile web is built and hosted separately (`expo export` or static host). The Compose `app` profile ships API + Postgres only.

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

`pnpm verify` runs, in order: `db:generate`, `typecheck`, `lint`, `test:unit`, `test:integration`, and `build`.

GitHub Actions runs the same gate on push and pull requests via [`.github/workflows/verify.yml`](../../.github/workflows/verify.yml).

## Deploy (single-replica Compose)

### Pre-deploy

1. Take a backup (see [Backup](#backup)).
2. Record the current API image tag or git SHA.
3. Confirm migrations are reviewed; unsafe migrations need a restore plan.

### Deploy steps

Ensure root `.env` includes the production keys the API container validates when
`NODE_ENV=production` (copy from [`.env.example`](../../.env.example) if needed):

- `JWT_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_AUTH_MODE`, `SMTP_FROM`
- `PASSWORD_RESET_URL_BASE`
- `SERVICE_RULES_OWNER`, `SERVICE_RULES_CONTACT`, `SERVICE_RULES_TEXT`
- optional: `CORS_ORIGIN` (defaults to `http://localhost:8081`)

When `SMTP_AUTH_MODE=login`, add `SMTP_USERNAME` and `SMTP_PASSWORD` to the
`api` service `environment` in [`docker-compose.yml`](../../docker-compose.yml)
(or a compose override). The default compose file omits them so
`SMTP_AUTH_MODE=none` does not inject empty credential strings.

```bash
# Build and start API + Postgres
docker compose --profile app up -d --build

# Apply migrations against the running database
pnpm db:migrate

# Smoke checks
curl -sf http://localhost:3001/api/health
curl -sf http://localhost:3001/api/health/ready
```

`GET /api/health` is liveness only. `GET /api/health/ready` returns `503` when PostgreSQL is unreachable or the probe times out (2s).

Compose reads the required keys from `.env` at the repo root. Default local Postgres URL inside Compose is:

`postgresql://auction:auction@postgres:5432/bidplace?schema=public`

### Rollback

1. Stop the API container: `docker compose --profile app stop api`
2. Run the previous API image tag.
3. If the migration was unsafe or partially applied, restore the pre-deploy dump into a fresh database or roll back schema per migration notes, then restart API.

Do not run multiple API replicas behind a load balancer in the pilot; rate limits and cron are not multi-instance safe.

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

# 3. Integrity checks (counts + sample image checksums)
pnpm --filter @bidplace/database build
TARGET_DATABASE_URL='postgresql://auction:auction@127.0.0.1:5432/bidplace_restore?schema=public' \
  pnpm ops:verify-restore
```

Evidence checklist:

- [ ] `pnpm ops:backup` exits 0 and writes a dated dump under `backups/`
- [ ] `pnpm ops:restore` creates `bidplace_restore` and completes without error
- [ ] `pnpm ops:verify-restore` prints table counts and verifies sample `ProductImage.checksum` values
- [ ] `curl -sf localhost:3001/api/health/ready` succeeds against the primary database after deploy smoke

## Deferred (post-pilot)

- Multi-instance API and shared rate-limit state
- Object storage for media with DB metadata only
- Full browser/device/a11y CI matrix
- Production SMTP delivery smoke beyond local transports

See also [`docs/product/13-APPLICATION-SECURITY.md`](../product/13-APPLICATION-SECURITY.md) for backup encryption and multi-instance rate-limit notes.

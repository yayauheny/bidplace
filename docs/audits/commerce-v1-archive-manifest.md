# commerce-v1 archive manifest

Date: 2026-09-10  
Status: Verified local freeze (remote push pending operator confirmation)

## Archive references

| Ref | SHA | Purpose |
| --- | --- | --- |
| Branch `archive/commerce-v1` | `598d8696295d18d32956da7dd366dc19464cc366` | Read-only inspection branch |
| Tag `commerce-v1-pre-portfolio` | `598d8696295d18d32956da7dd366dc19464cc366` | Immutable release marker |

Both refs point to commit `598d869` — **Ship portfolio backend wave before commerce archive.**

Do not develop on the archive branch. Do not merge it wholesale back into `main`.
Future `commerce-v2` starts from current `main` and uses this tree as reference only.

## Toolchain

- Node.js `22` (`.nvmrc`)
- pnpm `11.7.0` (`packageManager` in root `package.json`)
- Docker Compose for local PostgreSQL and MinIO (`pnpm docker:up`)

## Prisma migrations

17 migration directories under `packages/database/prisma/migrations/` through
`20260909120000_portfolio_media_socials_curator`.

**Documentation conflict:** `docs/product/10-CODE-ARCHITECTURE.md` still describes a
single unreleased baseline migration. The tree at this SHA contains the full forward
chain above. Resolve deployment inventory before any schema cleanup.

## Verification recorded at freeze (2026-09-10)

Commands:

```bash
pnpm docker:up
pnpm verify
pnpm --filter @bidplace/mobile test
```

Results:

- `pnpm verify`: typecheck 7/7, lint 2/2, API unit 388/388, contracts 31/31,
  integration 102/102, build 7/7 — exit 0
- Mobile vitest: 254/254 — exit 0
- `git diff --name-only -- '*.pen'`: empty at commit time

Commerce capability remains in default Nest composition (`ListingsModule`,
`BidsModule`, `LifecycleModule`, `OrdersModule`, `ActivityModule`, `RealtimeModule`).
Default `COMMERCE_ENABLED=false`; commerce integration tests opt in explicitly.

## Recovery drill

Recorded 2026-09-10 — **passed** from tag `commerce-v1-pre-portfolio` in disposable
worktree `/private/tmp/bidplace-commerce-v1`.

```bash
git worktree add /private/tmp/bidplace-commerce-v1 commerce-v1-pre-portfolio
cd /private/tmp/bidplace-commerce-v1
pnpm install --frozen-lockfile
cp /path/to/local/.env .env   # or cp .env.example .env for first-time setup
pnpm db:generate && pnpm build
pnpm typecheck && pnpm lint && pnpm test:unit && pnpm test:integration
pnpm --filter @bidplace/mobile test
git worktree remove /private/tmp/bidplace-commerce-v1
```

Notes:

- A **fresh worktree** must run `pnpm build` before unit tests: workspace packages
  resolve through `dist/` exports. Plain `pnpm verify` on a clean tree fails until
  build artifacts exist (verify runs tests before build).
- Reuse an already-running local Postgres (`pnpm docker:up` from the primary checkout)
  or point `DATABASE_URL` at an existing instance. A second `docker compose up` in the
  worktree conflicts on container names (`bidplace-postgres`).

Do not store credentials in this manifest.

## Known gaps at this SHA (not archive blockers)

- Home UI does not render «Открытие недели» despite `CuratorSelection` backend
  (`DEC-086`).
- S3 revision atomicity and MinIO-as-local-default remain later work.
- Expo admin curator UI not implemented.
- Staging/production database migration state: **unknown** — operator confirmation
  required before Prisma model removal.

## Safety copies

- Zip backup (outside repo): `/Users/yayauheny/projects/bidplace-pre-cleanup-2026-09-10.zip`
  (~731 MiB, includes `.git`, excludes `.env` and `node_modules`)

## Remote protection (operator)

After push to canonical remote:

1. `git push origin archive/commerce-v1 commerce-v1-pre-portfolio`
2. Protect `archive/commerce-v1` from deletion and direct pushes.
3. Treat tag `commerce-v1-pre-portfolio` as immutable.

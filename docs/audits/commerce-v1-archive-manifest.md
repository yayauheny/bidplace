# commerce-v1 archive manifest

Date: 2026-09-11
Status: Remote freeze verified at `598d869`; GitHub rulesets pending operator `gh auth`

## Archive references

| Ref | SHA | Purpose |
| --- | --- | --- |
| Branch `archive/commerce-v1` | `598d8696295d18d32956da7dd366dc19464cc366` | Read-only inspection branch |
| Annotated tag object `commerce-v1-pre-portfolio` | `3d4acef4c0c404e7dec891c2cfff510c7b970d91` | Immutable tag object |
| Tag `commerce-v1-pre-portfolio^{commit}` | `598d8696295d18d32956da7dd366dc19464cc366` | Peeled commit |

Both the branch and the peeled tag point to commit `598d869` — **Ship portfolio backend wave before commerce archive.** The annotated tag object SHA differs from the commit SHA; that is expected.

Do not develop on the archive branch. Do not merge it wholesale back into `main`.
Future `commerce-v2` starts from current `main` and uses this tree as reference only.

## Remote verification (2026-09-11)

```text
origin/archive/commerce-v1
  = 598d8696295d18d32956da7dd366dc19464cc366
refs/tags/commerce-v1-pre-portfolio^{}
  = 598d8696295d18d32956da7dd366dc19464cc366
refs/tags/commerce-v1-pre-portfolio (tag object)
  = 3d4acef4c0c404e7dec891c2cfff510c7b970d91
```

`git fetch origin archive/commerce-v1` and `git ls-remote origin` confirm the
refs on `github.com/yayauheny/bidplace`. This is no longer a local-only freeze.

## GitHub protection (merge gate)

Rulesets were **not** created in this session: `gh` is installed, but the
operator is not logged in (`gh auth status` empty; no `GH_TOKEN`).

Create two **active** rulesets before merge:

1. Branch `refs/heads/archive/commerce-v1`: `deletion`, `non_fast_forward`, `update`.
2. Tag `refs/tags/commerce-v1-pre-portfolio`: the same rules (immutable tag).

Record the ruleset IDs here after creation. Until then, protection remains the
merge gate, not a claim of repository enforcement.

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

Recorded 2026-09-11 — **passed** from **remote** `origin/archive/commerce-v1`
in disposable worktree `/tmp/bidplace-commerce-v1-recovery-20260911`.

```bash
git fetch origin archive/commerce-v1 tag commerce-v1-pre-portfolio
git rev-parse origin/archive/commerce-v1
# 598d8696295d18d32956da7dd366dc19464cc366
git rev-parse commerce-v1-pre-portfolio^{commit}
# 598d8696295d18d32956da7dd366dc19464cc366
git worktree add /tmp/bidplace-commerce-v1-recovery-20260911 origin/archive/commerce-v1
ls apps/api/src/listings apps/api/src/bids apps/api/src/orders \
   apps/api/src/lifecycle apps/api/src/realtime
git worktree remove /tmp/bidplace-commerce-v1-recovery-20260911
```

Confirmed at `598d869`: `listings.module.ts`, `bids.module.ts`, and
`orders.module.ts` are present. Full `pnpm verify` of the archive tree was not
re-run; SHA + checkout of commerce modules is the recorded evidence.

Earlier 2026-09-10 local-tag recovery (with `pnpm build` caveats) remains in
git history of this file; remote recovery supersedes “push pending”.

Do not store credentials in this manifest.

## Known gaps at this SHA (not archive blockers)

- Home UI does not render «Открытие недели» despite `CuratorSelection` backend
  (`DEC-086`).
- S3 revision atomicity and MinIO-as-local-default remain later work.
- Expo admin curator UI not implemented.
- Staging/production database migration state: **unknown** — operator confirmation
  required before Prisma model removal.
- GitHub rulesets for the archive branch and tag: **not created** until operator
  `gh auth`.

## Safety copies

- Zip backup (outside repo): `/Users/yayauheny/projects/bidplace-pre-cleanup-2026-09-10.zip`
  (~731 MiB, includes `.git`, excludes `.env` and `node_modules`)

# First MVP execution state

## Current checkpoint

```text
Current package: review-hole closure on feature/profile-revision-media (uncommitted)
Base main SHA: 08b916e
Working branch: feature/profile-revision-media
Completed behavior: CommerceEnabledGuard on GET /sellers, /sellers/:slug/detail, /products/:publicId, /me/activity while /works and /authors stay open; owner profile overlays the editing revision; visitor /product and /seller reuse portfolio APIs with Redirect aliases for /works/:id and /authors/:slug; city SQL pagination; Postgres revision keys 404/503; object delete after commit.
Commit SHA: none (WIP on 08b916e)
Checks passed: `pnpm verify` on 2026-09-09 (typecheck 7/7, lint 2/2, API unit 381/381, contracts 30/30, integration 89/89, build 7/7). `git diff --name-only -- '*.pen'` is empty.
Checks failed: none.
Remaining work: Package 07 (Figma/UI) is not started. Do not start it from this branch. Commerce-wave must later restore listing chrome if COMMERCE_ENABLED becomes true; these two public screens stay on portfolio until then.
Known blockers: Belarus lawyer review; production hosting/SMTP/S3 provider facts; staging deploy; object-store backfill/checksum of existing local bytes.
Next exact action: Review this branch. Do not start package 07 from here.
```

## Recovery procedure

1. Read `00-EXECUTION-ORDER.md` and this file.
2. Run `git status --short --branch` and inspect recent commits on the current branch.
3. Do not repeat a behavior already recorded as committed.
4. Continue from **Next exact action**.
5. After each completed task, update product status documentation, verify no `.pen` changes, fast-forward the package branch into `main`, and retain the branch.

## Recovery procedure

1. Read `00-EXECUTION-ORDER.md` and this file.
2. Run `git status --short --branch` and inspect recent commits on the current branch.
3. Do not repeat a behavior already recorded as committed.
4. Continue from **Next exact action**.
5. After each completed task, update product status documentation, verify no `.pen` changes, fast-forward the package branch into `main`, and retain the branch.

# First MVP execution state

## Current checkpoint

| Field | Value |
| --- | --- |
| Current package | 02 — Portfolio Work lifecycle |
| Base main SHA | `2cf5d893d6d57c64e8a2dfd68dcb3ab3856c0c20` |
| Working branch | `feature/portfolio-work-lifecycle` |
| Completed behavior | Package 01 is fast-forwarded into `main` and its branch is retained. The Work revision state/permission/visibility contract is recorded. |
| Commit SHA | Pending package 02 contract checkpoint |
| Checks passed | Package 01: API typecheck/lint and unit tests (328/328); contracts tests (27/27); mobile typecheck/lint and card tests (5/5). |
| Checks failed | API PostgreSQL integration suite cannot start because PostgreSQL is unavailable at `127.0.0.1:5432`; all 21 affected suites fail before test execution. |
| Remaining work | Add revision schema/migration, wire author/admin/public transitions, add concurrency coverage, document and fast-forward package 02. |
| Known blockers | Local PostgreSQL is not running; migration and integration verification need a disposable database. |
| Next exact action | Add the additive ProductRevision schema and migration with a deterministic legacy Product backfill. |

## Recovery procedure

1. Read `00-EXECUTION-ORDER.md` and this file.
2. Run `git status --short --branch` and inspect recent commits on the current branch.
3. Do not repeat a behavior already recorded as committed.
4. Continue from **Next exact action**.
5. After each completed task, update product status documentation, verify no `.pen` changes, fast-forward the package branch into `main`, and retain the branch.

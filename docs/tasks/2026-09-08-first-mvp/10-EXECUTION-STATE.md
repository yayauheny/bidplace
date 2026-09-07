# First MVP execution state

## Current checkpoint

| Field | Value |
| --- | --- |
| Current package | 02 — Portfolio Work lifecycle |
| Base main SHA | `2cf5d89fdf93733f0e8eb93022de8b5c20329213` |
| Working branch | `feature/portfolio-work-lifecycle` |
| Completed behavior | Package 01 is fast-forwarded into `main` and its branch is retained. Package 02 records the Work revision state/permission/visibility contract, additive schema and deterministic legacy backfill migration. New Work creation atomically creates its editing revision; submit moves that revision into review; a published Work now copies into an editing revision before author changes and leaves its current public fields intact. |
| Commit SHA | `446a481` |
| Checks passed | Package 01: API typecheck/lint and unit tests (328/328); contracts tests (27/27); mobile typecheck/lint and card tests (5/5). Package 02 schema build, API typecheck/lint, product service tests (334/334), and image service tests (15/15) pass. |
| Checks failed | API PostgreSQL integration suite cannot start because PostgreSQL is unavailable at `127.0.0.1:5432`; all 21 affected suites fail before test execution. |
| Remaining work | Make submit, moderation, hide/unhide, images, and public queries operate on revision pointers; add concurrency coverage, document and fast-forward package 02. |
| Known blockers | Local PostgreSQL is not running; migration and integration verification need a disposable database. |
| Next exact action | Submit an editing revision of an approved Work without changing its public status, then promote or reject that revision in admin moderation. |

## Recovery procedure

1. Read `00-EXECUTION-ORDER.md` and this file.
2. Run `git status --short --branch` and inspect recent commits on the current branch.
3. Do not repeat a behavior already recorded as committed.
4. Continue from **Next exact action**.
5. After each completed task, update product status documentation, verify no `.pen` changes, fast-forward the package branch into `main`, and retain the branch.

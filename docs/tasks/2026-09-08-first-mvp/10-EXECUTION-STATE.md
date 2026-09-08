# First MVP execution state

## Current checkpoint

| Field | Value |
| --- | --- |
| Current package | 04 — Data and security preflight |
| Base main SHA | `49c3e23` |
| Working branch | `fix/portfolio-security-preflight` |
| Completed behavior | Packages 01 and 02 are fast-forwarded into `main` and their branches are retained. Package 03 adds typed S3-compatible configuration, an AWS SDK backed `ImageStore` adapter, selectable provider DI, additive object-key persistence and deterministic metadata backfill. New product, creation-step and profile uploads record their object key. Production fails closed without S3. Backfill is dry-run by default; restore verification reads S3 objects and compares checksums. |
| Commit SHA | `a02acfe` |
| Checks passed | Database generate/build; API typecheck/lint; API unit tests (342/342); S3 adapter, image and seller tests; Node syntax checks for ops scripts. |
| Checks failed | API PostgreSQL integration suite cannot start because PostgreSQL is unavailable at `127.0.0.1:5432`; all 21 affected suites fail before test execution. |
| Remaining work | Run an actual disposable PostgreSQL + MinIO migration/backfill/restore drill; run release dependency audit; then begin package 05. |
| Known blockers | Local PostgreSQL is not running; migration and integration verification need a disposable database. A local MinIO/S3 endpoint is also not configured. |
| Next exact action | Self-review package 04, fast-forward it into main while retaining its branch, then start package 05 portfolio contracts and API. |

## Recovery procedure

1. Read `00-EXECUTION-ORDER.md` and this file.
2. Run `git status --short --branch` and inspect recent commits on the current branch.
3. Do not repeat a behavior already recorded as committed.
4. Continue from **Next exact action**.
5. After each completed task, update product status documentation, verify no `.pen` changes, fast-forward the package branch into `main`, and retain the branch.

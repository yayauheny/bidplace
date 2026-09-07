# First MVP execution state

## Current checkpoint

| Field | Value |
| --- | --- |
| Current package | 01 — Commerce capability gate |
| Base main SHA | `23fea271c46a8186482341203acfb4b487ffbf17` |
| Working branch | `feature/commerce-capability-gate` |
| Completed behavior | Added the mobile capability surface: commerce navigation is hidden, legacy commerce routes show unavailable, and default portfolio cards do not show a price, timer, bid or sale state. |
| Commit SHA | `58387e1` |
| Checks passed | API typecheck/lint and unit tests (328/328); contracts tests (27/27); mobile typecheck/lint and card tests (5/5). |
| Checks failed | API PostgreSQL integration suite cannot start because PostgreSQL is unavailable at `127.0.0.1:5432`; all 21 affected suites fail before test execution. |
| Remaining work | Commit the package 01 final checkpoint, fast-forward into `main`, and begin package 02. |
| Known blockers | Local PostgreSQL is not running; rerun package integration verification when the service is available. |
| Next exact action | Commit the explicit test opt-in and final package 01 checkpoint, verify the diff, then fast-forward into `main` without deleting this branch. |

## Recovery procedure

1. Read `00-EXECUTION-ORDER.md` and this file.
2. Run `git status --short --branch` and inspect recent commits on the current branch.
3. Do not repeat a behavior already recorded as committed.
4. Continue from **Next exact action**.
5. After each completed task, update product status documentation, verify no `.pen` changes, fast-forward the package branch into `main`, and retain the branch.

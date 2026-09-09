# First MVP execution state

## Current checkpoint

```text
Current package: Figma phone UI cutover on feature/figma-portfolio-ui
Base main SHA: see git
Working branch: feature/figma-portfolio-ui
Completed behavior: One Figma token layer; AppShell phone column + FloatingDock; public Home/Works/Authors/Author/Work from Figma frames on portfolio APIs; auth restyle; 4-step author application and create-work; search stub; payment/delivery stub; DEC-085 / RFC / design gaps journal.
Commit SHA: none (WIP, uncommitted)
Checks passed: pnpm verify 2026-09-09 (typecheck 7/7, lint 2/2, API unit 381, contracts 30, integration 89, build 7/7); mobile vitest 227/227; browser Home→Works→Work→Author→search stub→login/register at ~390; git diff --name-only -- '*.pen' empty.
Checks failed: none recorded yet.
Remaining work: none in this package. Do not edit `.pen` or Figma. Search overlay later.
Known blockers: Belarus lawyer review; production hosting/SMTP/S3; search overlay later.
Next exact action: Commit this branch when asked; keep `.pen` out of the diff.
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

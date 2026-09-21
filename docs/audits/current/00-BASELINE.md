# Current baseline

**Mode:** read only  
**Branch:** `feature/portfolio-mvp-release`  
**Commit:** `69307f8d5017fd2fddda6edf1e1dc49b678f5c57`  
**Date:** 2026-09-21

## Scope and method

- Current target: mobile-web portfolio MVP, primarily 390 px.
- Historical index: `feature/audit-fix-prompts:docs/audits/2026-09-14-project-cleanup/`.
- Historical evidence was not carried forward without a current consumer/path check.
- The branches diverge after merge base `08b916e`; this is not a linear “old audit plus fixes” comparison.
- Current product, architecture, status and design owner documents were read before code inspection.
- Static inspection only. No application code, dependencies, database, network service, seed, migration or canonical Pen file was changed.

## Excluded state

A second checkout at `/Users/yayauheny/projects/bidplace-portfolio-mvp-release` was already dirty and was excluded from evidence. Its local edits and untracked `dev/` and `artifacts/` content are not part of this baseline.

## Baseline verdict

**NEEDS_REVIEW before MVP release.** The public portfolio read path and revision locking are materially stronger than the historical snapshot. The author completion loop is still incomplete in mobile, auth recovery remains split from React Query, the author/work wizards retain loss-prone local state, and the root release gate omits mobile tests and Playwright.

The largest documentation risk is that `05-MVP-RFC.md` says the commerce runtime is preserved fail-closed while `AppModule` exposes no commerce modules or routes. Historical sections of `11-PROJECT-STATUS.md` still describe removed paths as implemented. Current runtime and current product status need one explicit reconciliation.

## Evidence limits

- No claim of green typecheck, lint, unit, integration, build or Playwright.
- No production/staging provider, CORS, backup, restore, SMTP or S3 evidence was inspected.
- Dead-code labels require no current production importer; test-only consumers are called out separately.
- Visual findings are architecture/semantics findings from code and current design documents, not pixel-parity claims.

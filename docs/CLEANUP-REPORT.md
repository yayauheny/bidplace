# Repository cleanup report (2026-10-21)

Base: `feature/portfolio-mvp-release` @ `3818f0f3`. Branch: `refactor/repository-cleanup`.

## Metrics

See `docs/CLEANUP-METRICS.txt` (updated at branch HEAD).

## PR #53 review follow-up (same branch)

| Issue | Fix |
| --- | --- |
| Broken relative links after `docs/archive/` move | Bulk path fixes; `pnpm docs:link-check` (171 markdown files) |
| Removed audit PNGs | Tag `archive/audit-evidence-pre-cleanup` @ `3818f0f3`; [`docs/archive/AUDIT-EVIDENCE-RECOVERY.md`](archive/AUDIT-EVIDENCE-RECOVERY.md); evidence README stubs |
| Frontend agent context | `bidplace-ui` + `AGENT-MAP` — selective reads; no mandatory full `04-DESIGN-STATUS` / release audit |
| Archived First MVP tasks vs reality | [`docs/product/16-PORTFOLIO-ACTIVE-BACKLOG.md`](product/16-PORTFOLIO-ACTIVE-BACKLOG.md); archive backlog marked `archived` |
| Stale README | R2/S3 media + agent entry points |
| Link CI | `scripts/docs/check-markdown-links.mjs` + `pnpm docs:link-check` |

## DELETE (active tree)

| Item | Evidence |
| --- | --- |
| `docs/audits/2026-10-13-wave-prompts/**` | Waves done; DEC-119/120; not in CI |
| `docs/audits/**/evidence/**/*.png` (247) | Manual acceptance; recover via tag above |

## ARCHIVE

| Item | Notes |
| --- | --- |
| `docs/archive/product/11-PROJECT-STATUS-historical.md` | Pre-2026-10-19 status journal |
| `docs/archive/audits/00-EXECUTION-ROADMAP-2026-10-05-full.md` | Short pointer in `docs/audits/current/00-EXECUTION-ROADMAP.md` |
| `docs/archive/tasks/**` | First MVP execution packs |

## COMPACT

`11-PROJECT-STATUS.md`, `AGENTS.md`, `00-PROJECT-INDEX.md`, new `AGENT-MAP.md`.

## KEEP / REVIEW

- `design/figma-handoff/` (~70MB) — REVIEW: LFS or external mirror before new repo
- `docs/audits/00-CURRENT-MVP-READINESS.md` — pointer to backlog/release audit; full 2026-09-08 text at `334d9ba6`
- `12-DECISION-LOG.md` — lookup only

## New repo with clean history?

Still **deferred**. Tag + link-check reduce operational risk; clone size needs separate measure.

## Verify / merge readiness (2026-10-21)

| Item | Result |
| --- | --- |
| Auth integration failure | Fixed in **PR #54** → merged to `feature/portfolio-mvp-release` @ `cc4911e5`; merged into this branch |
| `pnpm docs:link-check` | Pass (171 files) |
| `pnpm verify` (local @ branch tip) | Pass |
| GitHub **Verify** on PR #53 | Pass @ `dc34055e` ([run 39657750412](https://github.com/yayauheny/bidplace/actions/runs/39657750412); first attempt failed on flaky `media-lifecycle.integration.spec.ts`) |

## Verification commands

```bash
pnpm docs:link-check
pnpm --filter @bidplace/contracts test
pnpm verify   # CI parity
```

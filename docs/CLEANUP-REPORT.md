# Repository cleanup report (2026-10-21)

Base branch: `feature/portfolio-mvp-release` @ `3818f0f3`.

## Metrics

See `docs/CLEANUP-METRICS.txt` (before/after file counts and `docs/` size).

## DELETE (active tree)

| Item | Evidence |
| --- | --- |
| `docs/audits/2026-10-13-wave-prompts/**` | Waves W0–W6b done; normative context in FRONTEND audit §17–19, DEC-119/120; not used by CI |
| `docs/audits/**/evidence/**/*.png` (247 files) | Manual acceptance screenshots only; no build/test references; copies remain in git history |

## ARCHIVE (moved, excluded from default agent reads)

| Item | Notes |
| --- | --- |
| `docs/archive/product/11-PROJECT-STATUS-historical.md` | Status journal before 2026-10-19 slice |
| `docs/archive/audits/00-EXECUTION-ROADMAP-2026-10-05-full.md` | Replaced by short pointer in `docs/audits/current/00-EXECUTION-ROADMAP.md` |
| `docs/archive/tasks/**` | First MVP execution packs; stub at `docs/tasks/README.md` |

## COMPACT

| Item | Action |
| --- | --- |
| `docs/product/11-PROJECT-STATUS.md` | ~5k → ~300 lines + pointer table |
| `AGENTS.md` | Mandatory reads → `docs/AGENT-MAP.md` + selective owners |
| `docs/product/00-PROJECT-INDEX.md` | Points to release audit + archive |

## KEEP (unchanged scope)

- `design/figma-handoff/` (~70MB) — secondary Figma export; REVIEW for future LFS or external mirror
- `docs/product/01`, `05`, `10`, `12`, `13`, legal, ops, apps, packages
- `.agents/skills/**` including `vercel-react-native-skills` (referenced by AGENTS)

## REVIEW (not in this PR)

- Refresh `docs/audits/00-CURRENT-MVP-READINESS.md` (Sept snapshot vs current code)
- `design/figma-handoff` size vs live-Figma-only workflow
- New repo with clean history — **not started** (requires separate approval)

## New repo with clean history?

Not justified yet: this PR already shrinks **agent context** and working tree; git object size unchanged without history rewrite. Revisit after measuring clone size and LFS for `design/figma-handoff`.

# Agent map (read first)

**Scope:** portfolio-first public MVP — author portfolio, Work lifecycle, auth, moderation. Commerce/auction code may exist but is not the launch contract (`05-MVP-RFC.md`).

## Always-on constraints

- Product value boundary: `docs/product/01-PRODUCT-FOUNDATION.md` (when changing product behavior).
- Verification: run checks for the affected graph; see `AGENTS.md` §Verification.
- Security-sensitive work: `docs/product/13-APPLICATION-SECURITY.md` + `security` skill — not every task.
- Figma is visual source (`pAPQo6cADmG5XzVmBX76EE`); local `design/figma-handoff` may be stale.

## Pick by task type

| Area | Start here |
| --- | --- |
| Release / blockers | `docs/audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md` |
| Next reviews | `docs/product/16-PORTFOLIO-ACTIVE-BACKLOG.md` |
| Implementation status (recent) | `docs/product/11-PROJECT-STATUS.md` |
| Architecture | `docs/product/10-CODE-ARCHITECTURE.md` |
| MVP contract | `docs/product/05-MVP-RFC.md` |
| UI in `apps/mobile` | `bidplace-ui` skill → `03-DESIGN-SYSTEM.md` + component README; grep `04-DESIGN-STATUS` / release audit, do not read whole files |
| Active backlog (not archive tasks) | `docs/product/16-PORTFOLIO-ACTIVE-BACKLOG.md` |
| Nest/API | `nest` skill + `10-CODE-ARCHITECTURE.md` |
| Deploy / ops | `docs/ops/00-RELEASE-AND-BACKUP.md`, `docs/ops/CLOUDFLARE-DEPLOYMENT.md` |
| Legal publish | `docs/legal/00-FINAL-LEGAL-AUDIT.md` |
| Decisions (lookup only) | `docs/product/12-DECISION-LOG.md` — search/grep, do not read whole file |

## Do not load unless asked

- `docs/archive/**` — historical status, old execution roadmaps, First MVP task packs.
- `docs/audits/**/evidence/**` — acceptance screenshots (removed from tree; see `docs/archive/README.md`).
- Completed execution prompts and the pre-2026-10-21 status journal: `git show d0efc03b:docs/archive/`.
- `docs/research/raw/**` — immutable research archive.
- `design/bidplace-v2-visual-exploration/` — exploration, not production spec.

## Skills

Load **one** domain skill per task (`bidplace-ui`, `nest`, `security`, `ui`, …). Do not inline entire skill corpora (e.g. full React Native rulebooks) unless debugging that layer.

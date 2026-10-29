# Agent map

**Scope:** public launch = author portfolio + direct sales (fixed price and auction, orders, order reports) per `DEC-149`. Work goes in waves from [docs/launch/](launch/README.md); commerce rules have one owner, [COMMERCE.md](launch/COMMERCE.md). Until wave W3 is merged, runtime is portfolio-only. Root `AGENTS.md` owns workflow/security/verification rules.

Read this map, choose one row, then open only relevant headings in its owner. Do not load the product index, full RFC, architecture, status or decision history for every task. Before product-changing code also read product foundation and the relevant RFC sections.

| Task | Owner / next read |
| --- | --- |
| Next work / wave to execute | [Launch plan](launch/README.md) → the wave file in `docs/launch/waves/` + [agent rules](launch/AGENT-RULES.md) |
| Sales, auctions, orders, reports, strikes | [COMMERCE.md](launch/COMMERCE.md); screens — [DESIGN-BRIEF.md](launch/DESIGN-BRIEF.md) |
| Release / checks / external blockers | [Release audit](audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md) |
| Current implementation | [Project status](product/11-PROJECT-STATUS.md) |
| Product contract / ownership | [RFC](product/05-MVP-RFC.md) / [product index](product/00-PROJECT-INDEX.md) |
| Architecture / API | `nest` + relevant [architecture](product/10-CODE-ARCHITECTURE.md) sections; who owns a piece of logic — its «Владельцы логики» table |
| UI in `apps/mobile` | `bidplace-ui` + component README + relevant [design-system](design/03-DESIGN-SYSTEM.md) sections; screen row in [design status](design/04-DESIGN-STATUS.md) |
| Sensitive behavior | `security` + [application security](product/13-APPLICATION-SECURITY.md), together with domain skill |
| Deploy / operations | [Release/backup](ops/00-RELEASE-AND-BACKUP.md), [Cloudflare](ops/CLOUDFLARE-DEPLOYMENT.md), [environment variables ★](ops/ENVIRONMENT.md) — check before any production deploy |
| Legal publication | [Final legal audit](legal/00-FINAL-LEGAL-AUDIT.md) |
| Decision / revision lookup | Search heading/ID in [Decision Log](product/12-DECISION-LOG.md), then read the whole matching entry and any later revisions |
| Performance audit | [PERFORMANCE-AUDIT.md](launch/PERFORMANCE-AUDIT.md) |
| Tech debt / refactor timing | [TECH-DEBT.md](launch/TECH-DEBT.md) |
| Incidents, support, admin routine | [OPERATIONS.md](launch/OPERATIONS.md), [monitor and support setup](launch/MONITORING-AND-SUPPORT.md) |
| Open founder / design / legal questions | [Open decisions](product/14-OPEN-MVP-DECISIONS.md) |
| After launch | [AFTER-WAVES.md](launch/AFTER-WAVES.md), [post-launch backlog](product/15-POST-MVP-BACKLOG.md) |

For large owners, first `rg -n '^##|<topic>' <owner>` and read the matching section range. A search hit alone does not establish the latest decision: follow Revises/Supersedes and later revisions inside that entry.

Do not load by default: audit evidence, `docs/research/raw/**`, design exploration, or full skill rulebooks. Old plans, dated audits and the archive were deleted on 2026-10-28; recover any of them with `git show 036d2cc4:<path>`.

Figma is read-only and controls visuals; exact source priority and `NEEDS-FIGMA` rules are in `AGENTS.md`. Load only applicable skills; security + domain/review combinations remain mandatory when relevant.

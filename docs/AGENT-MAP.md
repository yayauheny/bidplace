# Agent map

**Scope:** portfolio-first public MVP: author portfolio, Work lifecycle, auth and moderation. Commerce code is not the launch contract. Root `AGENTS.md` owns workflow/security/verification rules.

Read this map, choose one row, then open only relevant headings in its owner. Do not load the product index, full RFC, architecture, status or decision history for every task. Before product-changing code also read product foundation and the relevant RFC sections.

| Task | Owner / next read |
| --- | --- |
| Next work / missing feature | [Active backlog](product/16-PORTFOLIO-ACTIVE-BACKLOG.md) |
| Release / checks / external blockers | [Release audit](audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md) |
| Current implementation | [Project status](product/11-PROJECT-STATUS.md) |
| Product contract / ownership | [RFC](product/05-MVP-RFC.md) / [product index](product/00-PROJECT-INDEX.md) |
| Architecture / API | `nest` + relevant [architecture](product/10-CODE-ARCHITECTURE.md) sections |
| UI in `apps/mobile` | `bidplace-ui` + component README + relevant [design-system](design/03-DESIGN-SYSTEM.md) sections; screen row in [design status](design/04-DESIGN-STATUS.md) |
| Sensitive behavior | `security` + [application security](product/13-APPLICATION-SECURITY.md), together with domain skill |
| Deploy / operations | [Release/backup](ops/00-RELEASE-AND-BACKUP.md), [Cloudflare](ops/CLOUDFLARE-DEPLOYMENT.md) |
| Legal publication | [Final legal audit](legal/00-FINAL-LEGAL-AUDIT.md) |
| Decision / revision lookup | Search heading/ID in [Decision Log](product/12-DECISION-LOG.md), then read the whole matching entry and any later revisions |
| Sales / auctions after launch | [Post-MVP backlog](product/15-POST-MVP-BACKLOG.md), including its owner map and open mechanics |

For large owners, first `rg -n '^##|<topic>' <owner>` and read the matching section range. A search hit alone does not establish the latest decision: follow Revises/Supersedes and later revisions inside that entry.

Do not load by default: `docs/archive/**`, audit evidence, dated audits, Pen plans/logs, `docs/research/raw/**`, design exploration, or full skill rulebooks. These are provenance, not current tasks. Current screenshots/videos remain in the tree; older removed evidence has recovery instructions in [archive](archive/README.md).

Figma is read-only and controls visuals; exact source priority and `NEEDS-FIGMA` rules are in `AGENTS.md`. Load only applicable skills; security + domain/review combinations remain mandatory when relevant.

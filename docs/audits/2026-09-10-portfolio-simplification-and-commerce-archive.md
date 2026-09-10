# Portfolio simplification and commerce-v1 archive proposal

Date: 2026-09-10

Status: **Proposal — explicit founder decision required**

Scope: preserve the existing commerce implementation, simplify the active product to a
portfolio-only MVP, and separate source cleanup from Git-history/storage cleanup.

This audit does not authorize code deletion, database migration changes, creation of
branches or tags, or a history rewrite. The working tree was already dirty while this
read-only audit was prepared; all measurements below are a point-in-time snapshot.

## Executive recommendation

Use one actively developed line: `main` becomes portfolio-native and contains only the
MVP that is being tested and shipped. Before removing the old commerce implementation,
preserve one verified commit with two remote references pointing to the same commit:

- protected read-only branch `archive/commerce-v1`;
- annotated tag `commerce-v1-pre-portfolio`.

The branch is convenient to inspect; the tag is an immutable release marker. They do
not duplicate Git objects and therefore add almost no storage by themselves. Do not
continue feature development in the archive and do not periodically merge `main` into
it.

After the archive is proven recoverable, remove the old commerce implementation from
the current `main` in small, independently reviewable commits. If commerce returns, build
`feature/commerce-v2` from the then-current `main` and use the archive as reference
material. Do not merge the archived product wholesale: its DTOs, publication model and
screens will have diverged from the portfolio product.

For the first public version, keep the product purely portfolio-only **without a displayed
price**. A price without a purchase or contact action creates an unclear promise and is a
separate product contract, not a harmless presentation field. If it is wanted later,
model it explicitly on a published work revision (for example, nullable
`displayPriceMinor` plus `displayCurrency`) without reviving `Listing`, sale status,
timers, bids or transaction CTAs.

This recommendation revises the retention part of `DEC-084`, which currently requires
commerce modules, migrations and tests to remain in the active tree. It is consistent
with the public behavior in `DEC-082` and `docs/product/05-MVP-RFC.md`: the current First
MVP is already portfolio-only and exposes no price, auction or purchase behavior. No
deletion may begin until the founder explicitly records a decision that supersedes the
relevant part of `DEC-084`.

## Options considered

| Option                                                      | Classification                    | Benefit                                                                   | Cost / risk                                                                            | Verdict                         |
| ----------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------- |
| Keep all commerce behind `COMMERCE_ENABLED`                 | Acceptable workaround             | Lowest immediate deletion risk                                            | Old concepts remain in default composition, contracts, schema, tests and client naming | Do not use as the final cleanup |
| Maintain portfolio and commerce as two active branches      | Hack                              | Both versions appear readily available                                    | Auth, security, media, schema and design fixes diverge; future merge becomes a rewrite | Reject                          |
| Protect an archive branch and tag, then simplify one `main` | Durable fix                       | Clean active code while preserving exact prior implementation and history | Requires disciplined archive verification and staged removal                           | **Choose**                      |
| Rewrite Git history immediately                             | Destructive maintenance operation | Can reduce clone/object storage                                           | Force-push, invalidated SHAs, mandatory reclones and loss risk                         | Reject for this project phase   |

A zip file is not a substitute for the protected remote refs: it loses normal history,
is easy to misplace, and is difficult to prove complete. A local-only branch is also not
an archive.

## Current evidence

### Product and architecture

- `docs/product/05-MVP-RFC.md` explicitly excludes active auctions, fixed sales, offers,
  bids, prices, timers and commerce statuses from the public MVP.
- `DEC-082` defines the first public release as an author portfolio.
- `DEC-084` retains the old commerce code and disables it fail-closed. This is the exact
  decision that must be revised before physical removal.
- The client still contains transitional vocabulary and adapters such as `AuctionCard`,
  `toAuctionCardItem` and `mode="portfolio"`.
- The API default application composition still registers commerce-related modules,
  including listings, bids, orders, lifecycle, activity and realtime.
- A direct search found at least 22 source files referring to the sampled transitional
  client adapters or default commerce modules. This is a lower bound, not the removal
  manifest.
- The six dedicated API directories `bids`, `listings`, `orders`, `lifecycle`,
  `activity` and `realtime` contain approximately 4,726 TypeScript lines before counting
  shared contracts, admin code, Prisma, seed data, mobile code and integration tests.
- The Prisma tree currently contains 17 migration directories. This conflicts with the
  current wording in `docs/product/10-CODE-ARCHITECTURE.md` that describes a single
  unreleased baseline migration. Resolve the real deployment/migration state before any
  schema cleanup.

### Repository storage snapshot

Measured in this checkout on 2026-09-10:

| Area       |    Size |
| ---------- | ------: |
| `.git`     | 217 MiB |
| `design`   | 306 MiB |
| `apps`     | 130 MiB |
| `packages` |  69 MiB |
| `docs`     | 1.6 MiB |

`git count-objects -vH` reported 151.60 MiB of loose objects and 60.62 MiB in one
pack, with no garbage. No Git LFS rules were found, and Git LFS is not installed in the
current environment.

The largest blobs reachable from all refs are primarily raster Figma handoff assets and
image fixtures. The largest observed blob is about 6.88 MiB; numerous assets are about
6.4 MiB. The current `design/figma-handoff/portfolio-phone-v1` tree contains both First
MVP references and post-MVP commerce frames such as bids, sold state and bid/buy sheets.
Repeated file paths with the same blob hash do not multiply the packed Git object, but
they still increase checkout size, file count and navigation noise.

Important consequence: deleting a file from `main` does not remove its historical blob,
and an archive branch does not materially increase storage when it points to an already
reachable commit. Product simplification and repository-size reduction are related but
must be executed as separate projects.

## Safe preservation procedure

Perform these steps only after the current mixed work is consolidated into a clean,
verified commit:

1. Identify the exact last commit containing the complete, known-good commerce v1
   implementation. Do not use an arbitrary dirty working tree.
2. Run the full existing verification suite for that commit, including commerce-specific
   tests with the required explicit capability configuration.
3. Record the commit SHA, Node/package-manager versions, required service versions,
   migration inventory, test commands and known failures in a small archive manifest.
4. Create `archive/commerce-v1` and annotated tag `commerce-v1-pre-portfolio` at that
   exact SHA.
5. Push both refs to the canonical remote. Protect the archive branch from deletion and
   direct pushes. Treat the tag as immutable.
6. In a disposable worktree, check out the tag, install from the lockfile and rerun the
   recorded build/tests. The archive is not accepted until this recovery drill works.
7. Only then begin removal from `main`.

Example recovery drill (illustrative, not executed by this audit):

```bash
git worktree add /private/tmp/bidplace-commerce-v1 commerce-v1-pre-portfolio
cd /private/tmp/bidplace-commerce-v1
pnpm install --frozen-lockfile
pnpm verify
```

If the old runtime requires environment-specific services, document them without copying
credentials or `.env` contents into the archive manifest.

## Staged cleanup plan for `main`

Each phase should produce a small commit and a review artifact. Do not combine the
database phase with the UI/API removal or with a Git-history rewrite.

### P0 — Decision and exact dependency map

- Record an explicit founder decision that revises the retention clause of `DEC-084`.
- State that commerce is deferred and may be redesigned, not permanently rejected.
- Inventory every import, route, DTO, background job, Socket.IO event, admin action,
  permission, table relation, fixture and test that depends on `Listing`, `Bid`, `Order`
  or sale lifecycle behavior.
- Record whether any local, staging or production-like database has applied each current
  migration or contains data that must be retained.

Exit criterion: a file-level removal graph and a database decision matrix exist; no code
has been deleted.

### P1 — Make the client portfolio-native

- Promote one `WorkCard` master with portfolio names and contracts.
- Remove `AuctionCard`, `toAuctionCardItem`, `mode="portfolio"`, `listing: null` adapters
  and commerce-only slots from public components.
- Remove hidden auction, bid, order, cart, sale-status and realtime client routes/hooks
  that are not part of the portfolio MVP.
- Keep screens thin and preserve current portfolio loading, empty, error, responsive and
  accessibility behavior.

Exit criterion: public UI imports no commerce-named model merely to display a work.

### P2 — Narrow contracts and API clients

- Remove commerce-only public DTO fields, endpoints and generated/client wrappers after
  all portfolio consumers use the portfolio contract.
- Keep author, work, publication revision, media, moderation and share behavior intact.
- Add contract tests proving that portfolio responses do not expose listing, price, bid,
  buyer, order, contact-handoff or sale-status data.

Exit criterion: the default web build has no reachable commerce API client surface.

### P3 — Remove commerce runtime composition

- Remove listings, bids, orders, lifecycle, commerce activity and commerce realtime
  modules from default Nest composition.
- Remove commerce-only scheduler jobs, Socket.IO namespaces/events, admin actions,
  analytics projections and authorization branches.
- Preserve shared infrastructure only when it has a verified non-commerce consumer.
- Add negative integration tests for removed routes and ensure no background commerce
  outcome can run.

Exit criterion: the default API cannot start or execute commerce behavior, even if an old
environment variable is present.

### P4 — Decide persistence separately

Do not infer that tables are safe to delete merely because routes disappeared.

- If no persistent/shared database has ever applied the migrations and no retained data
  exists, create a clean portfolio baseline according to the repository's unreleased
  migration policy.
- If any database has applied them, take a verified backup and restore test, then use
  explicit forward migrations. Do not edit already-applied migration files.
- Remove relations/enums only after all application code, seed paths and tests no longer
  depend on them.
- Keep an export or documented retention policy for any historical personal/contact or
  transaction data before dropping it.

Exit criterion: a fresh database and every supported existing database state reach the
same portfolio schema through tested procedures.

### P5 — Replace tests, do not merely delete proof

- Remove commerce suites only when their behavior is gone from runtime.
- Add portfolio boundary tests: no price/action/status leakage; removed routes fail; no
  commerce scheduler or realtime registration; author/work permissions remain correct.
- Keep security, auth, upload, moderation and publication-revision coverage.
- Run affected unit/integration tests, typecheck, lint and production web/API builds.

Exit criterion: default verification describes the shipped product rather than silently
skipping an existing capability.

### P6 — Dead-code and documentation closure

- Run dependency/cruft searches for commerce terms and verify every remaining occurrence
  is an intentional historical document, migration record or archived reference.
- Remove dependencies made unused by the preceding phases.
- Update architecture, status, MVP gaps, design status and the decision log without
  rewriting historical decisions.
- Verify that no `.pen` file changed.

Exit criterion: one coherent portfolio vocabulary and no runtime mode switchers.

## Storage and asset strategy

Treat storage cleanup as a second track after the product cleanup is stable:

1. Classify tracked large assets as:
   - runtime-required;
   - canonical First MVP design reference;
   - post-MVP/commerce design reference;
   - generated or reproducible artifact.
2. Keep runtime assets and the minimum canonical First MVP handoff in `main`.
3. After the archive refs are remote and recoverable, remove post-MVP commerce captures
   and reproducible exports from the active tree. They remain accessible through the
   archive commit.
4. Do not silently recompress or replace canonical source captures. If smaller previews
   are useful, store them as derived artifacts with documented checksums and keep one
   authoritative source.
5. Decide separately whether future large immutable binaries should use Git LFS or an
   external immutable artifact store. LFS reduces ordinary Git object growth but adds
   hosting, quota and clone dependencies; it is not automatically the right answer for a
   small 217 MiB repository.
6. Rewrite history with `git filter-repo`/BFG only if measured clone or hosting costs
   justify the disruption. First create a mirror backup, coordinate protected branches
   and CI, publish a commit-map, force-push once, and require all contributors to
   re-clone. Never combine that operation with commerce removal.

Near-term recommendation: remove post-MVP commerce captures from the active tree after
archiving, but do **not** rewrite history now. Repack/maintenance can be evaluated after
the current loose-object-heavy work settles; it is not a substitute for asset policy.

## Founder decisions required before execution

Recommended defaults are shown in bold:

1. Is First MVP a pure portfolio with no displayed price? **Yes.**
2. Preserve commerce v1 with a protected remote branch plus annotated tag? **Yes.**
3. After recovery verification, physically remove commerce application code from
   `main`? **Yes.**
4. Remove commerce Prisma models immediately? **No; wait for the deployment and data
   inventory.**
5. Remove post-MVP commerce Figma captures from the active tree after archiving? **Yes;
   retain the canonical First MVP design library.**
6. Introduce Git LFS or rewrite existing history now? **No; decide from a separate size
   audit after cleanup.**

## Acceptance criteria

- `archive/commerce-v1` and `commerce-v1-pre-portfolio` exist on the canonical remote,
  point to the recorded verified SHA and pass a disposable recovery drill.
- Only `main` receives ongoing product, auth, media, security and design work.
- Public client and API use portfolio-native names and contracts without auction adapters,
  commerce modes, prices, timers, bids, orders or purchase actions.
- Default server composition contains no commerce controller, job, realtime handler or
  admin mutation.
- Database migration handling is based on verified deployed state and includes a tested
  fresh path plus any required upgrade path.
- Removed commerce tests are replaced by negative portfolio-boundary tests.
- First MVP design references remain available; post-MVP references remain recoverable
  through the archive.
- Any future commerce work starts from current `main` and ports only deliberate domain
  concepts from the archive.
- No history rewrite occurs as an incidental part of source cleanup.

## Copy-ready task for Grok 4.6 High

```text
Ты проводишь архитектурный и destructive-change review TypeScript-монорепозитория
bidplace (NestJS, React Native/Expo Web, Prisma, Turborepo). Код пока не меняй.

Сначала прочитай:
- AGENTS.md;
- docs/product/00-PROJECT-INDEX.md;
- docs/product/01-PRODUCT-FOUNDATION.md;
- docs/product/05-MVP-RFC.md;
- docs/product/10-CODE-ARCHITECTURE.md;
- docs/product/11-PROJECT-STATUS.md;
- docs/product/12-DECISION-LOG.md, особенно DEC-082 и DEC-084;
- docs/audits/2026-09-10-portfolio-simplification-and-commerce-archive.md.

Цель: проверить proposal по превращению main в простой portfolio-only MVP без цены,
продаж и аукционов, сохранив последнюю полную commerce-v1 реализацию в защищённой
read-only archive-ветке и annotated tag. Будущая commerce-v2 должна начинаться от
актуального main; архив используется только как справочник. Не предлагай две активно
развиваемые ветки.

Сделай только аудит и исполнимый план. Не удаляй файлы, не меняй код/документы/схему,
не создавай ветку или tag, не запускай destructive migrations, git gc/prune,
filter-repo/BFG и force-push. Не читай .env или секреты.

Обязательные результаты:
1. Findings first, по severity, с точными файлами/строками и объяснением риска.
2. Полный file-level dependency map commerce: UI/routes/hooks/adapters, contracts/API
   client, Nest modules/controllers/services/guards/jobs/realtime/admin/analytics,
   Prisma models/relations/enums/migrations/seed и tests.
3. Проверка, какой commit должен стать archive SHA и достаточно ли branch + annotated
   tag для воспроизводимости. Дай recovery drill и список manifest metadata.
4. Последовательность малых коммитов для удаления из main с entry/exit criteria,
   проверками и rollback для каждого шага.
5. Отдельная DB decision matrix: ни одна БД не применяла migrations / local only /
   staging or production-like data exists. Укажи, когда допустим новый baseline, а когда
   нужны только forward migrations и backup/restore test.
6. Докажи, что после cleanup default runtime не регистрирует commerce, публичные DTO не
   раскрывают commerce/contact данные, а старый env flag не может случайно включить
   поведение.
7. Отдельный size audit: размеры текущих tracked assets и reachable historical blobs,
   дубликаты по blob SHA, First-MVP против post-MVP design captures. Объясни отдельно
   эффект удаления из main, archive refs, Git LFS и history rewrite.
8. Перечень документационных конфликтов и точная новая decision-запись, которая должна
   явно пересмотреть retention-часть DEC-084, не переписывая историю.
9. Финальный go/no-go checklist. Все неизвестные пометь как blocker или residual risk;
   не заполняй их догадками.

Проверь фактический dirty state и не смешивай чужие незавершённые изменения со своим
аудитом. Особо перепроверь противоречие: architecture doc говорит о single unreleased
baseline migration, а дерево может содержать много migration directories.
```

## What this proposal does not authorize

- deletion or modification of commerce code, tests, migrations or design sources;
- creation, movement or deletion of Git refs;
- modification of protected product/design documents;
- assuming that no deployed database exists;
- changing the First MVP to display a price;
- Git LFS migration, history rewrite, force-push, garbage collection or remote cleanup.

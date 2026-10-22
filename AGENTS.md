# Repository instructions

## Every task

- Inspect this checkout and applicable nested instructions first. Read [docs/AGENT-MAP.md](docs/AGENT-MAP.md), then only owner sections needed for the task; the product index is navigation, not mandatory extra reading.
- State success criteria and a short practical plan before editing. Identify the cause, compare candidates explicitly as durable fix / acceptable workaround / hack, and choose the smallest durable fix. Resolve material scope, architecture or ownership ambiguity through `grilling` before dependent edits; preserve settled decisions and continue independent work.
- Keep changes limited to the request. Preserve public behavior unless requested otherwise. No speculative abstractions/dependencies, unrelated refactors or error handling; remove only code made unused by this change.
- Find existing components, tokens, contracts and services first. Reuse public package exports and one owner for state/business rules. Keep routes/controllers/screens thin; logic belongs in services/use cases/hooks/domain modules. Use descriptive names.
- Trace only affected boundaries: UI/state → contracts/client → service → repository/database → build/release, including consumers and compatibility. State the concrete effect on future extension, reuse, ownership and maintenance.
- Never hide a cause with `any`, `@ts-ignore`, suppressions, disabled lint rules, empty catches or silent fallbacks. A temporary exception needs explicit acceptance and documentation; it is not a completed durable fix.
- Do not add comments/docs unless requested or needed for a non-obvious invariant; required owner status updates below still apply.

## Security

- Never read, open, print, summarize or quote `.env`, secrets, private keys, certificates, tokens, passwords or credentials. If a secret is required, stop and request a safe alternative.
- Never expose secrets in clients, logs, source maps, analytics, tests or fixtures.
- Auth, permissions, payments/purchases, bids/balances, webhooks, files/uploads, external APIs, admin actions and sensitive data require `security` and [13-APPLICATION-SECURITY.md](docs/product/13-APPLICATION-SECURITY.md); use `nest` too for high-risk backend work.

## Skills and inspection

Load the smallest relevant set; root rules are not duplicated in skills:

| Task | Skill |
| --- | --- |
| Implementation | `implement` |
| Diff/PR/returned work review | `code-review-best-practices`; `review` for generic workflow |
| Requested delegation / worker handoff | `agent` |
| React/Expo UI | `ui`; `bidplace-ui` for `apps/mobile`, then `bidplace-ui-review` |
| NestJS services/persistence/jobs/integrations | `nest` |
| Sensitive behavior or review | `security` together with the domain/review skill |
| Structural code exploration | installed `codebase-memory`; check coverage and use source fallback for gaps |
| Planning/execution handoff | `2step-work` |
| Specific platform issue | focused `vercel-react-native-skills` rules only |

Inspect local code, tests and prior decisions before assumptions; check installed versions before APIs/docs. Use web research only for current/external facts. Do not load full skill corpora or historical journals by default.

## Product and documentation

Portfolio-first MVP is the launch contract. Product value is significant, authored, limited or personally connected items sold directly; general resale, resellers, mass-market goods and artificial bids conflict with it.

- Before product-changing code: read [01-PRODUCT-FOUNDATION.md](docs/product/01-PRODUCT-FOUNDATION.md) and relevant [05-MVP-RFC.md](docs/product/05-MVP-RFC.md) sections. Owners are mapped in [00-PROJECT-INDEX.md](docs/product/00-PROJECT-INDEX.md); keep one owner per claim, link elsewhere.
- Protected product files: `01`–`04`, `06`–`09` in `docs/product/`; protected design principles: `docs/design/01-DESIGN-FOUNDATION.md`. Change only by explicit founder decision (design: founder or assigned designer). If requested behavior conflicts, identify the exact conflict, stop that part and request the decision.
- After code/behavior changes: add one compact dated entry to [11-PROJECT-STATUS.md](docs/product/11-PROJECT-STATUS.md), citing concrete modules/APIs/tables/screens/tests. Use `Implemented`, `Partial`, `Not implemented` or `Needs verification`; never call missing critical behavior/errors/checks Implemented. Keep product statuses (`Confirmed`, `Hypothesis`, `Planned`, `Rejected`) separate.
- Update [10-CODE-ARCHITECTURE.md](docs/product/10-CODE-ARCHITECTURE.md) only for changed architecture, models, packages, contracts, persistence or security invariants. Check RFC alignment and record gaps in status; do not rewrite the RFC to fit code without an explicit contract decision.
- [12-DECISION-LOG.md](docs/product/12-DECISION-LOG.md) is lookup-only and append-oriented. Add only an explicit new/revised/selected/rejected decision, referencing earlier decisions when revised. Never infer founder decisions or rewrite history; preserve rationale, alternatives and revision links.
- `docs/research/raw/*` is immutable: no rewriting/deleting or promoting raw claims to decisions. New research belongs in a separate dated file; conclusions need status/source in the owner document. History/evidence is read only for a specific investigation, never a routine entrypoint.

## UI and Figma

- Before UI changes read [design index](docs/design/00-DESIGN-INDEX.md), relevant [design-system](docs/design/03-DESIGN-SYSTEM.md) sections and screen status; flows only if routes change, foundation only if scope/principles are in question.
- Source priority: live read-only Figma `pAPQo6cADmG5XzVmBX76EE` → exact `design/figma-handoff` node/package → screenshots/current code. Check `INDEX.md`, `catalog.json` and parent `nodes.json` before declaring a node missing. Exports may be stale; report disagreements before choosing values. Pen is removed (`DEC-119`). Never edit Figma during code work.
- Missing/ambiguous nodes, responsive geometry, fonts/assets/interactions or product conflicts: stop the affected implementation and record `NEEDS-FIGMA` / required decision. Figma controls styling; product owners/server contracts control routes/data/privacy/permissions/auction behavior.
- Exact Figma match first: reuse the design system, extend semantic tokens/variants/component APIs when needed; local values only for unique geometry. One semantic token layer (`packages/design-tokens`), one shared primitive per role, thin screens; fix repeatable rules at their owner, never route-local screenshot patches.
- Hover/focus/open/close/blur/sticky/reduced motion follow the design system; static frames do not define interactions. Verify matched screenshots at 390/1024/1440 where frames exist; when only 390 exists, wider exact parity stays `NEEDS-FIGMA`.
- After UI changes update [04-DESIGN-STATUS.md](docs/design/04-DESIGN-STATUS.md); system doc for shared components/tokens, flows doc for route/flow changes. No visual principle/flow change without founder/designer decision. Complete requires loading/empty/error/responsive/accessibility states.
- `~/projects/bidplace-home-figma-completion` is read-only: never switch to it, commit there or alter its Git state.

## Verification and completion

- Verify behavior changes with meaningful checks, extending existing owner specs for uncovered contracts. Prefer unit checks; use integration/e2e for DB/network/permissions/transactions and rendered/manual checks for decorative geometry. No test file per bug or implementation-mirroring tests; use parameterization when clearer.
- Preserve session, permission, concurrency, saving and integrity regressions. Remove obsolete diagnostics/duplicate cases only after checking consumers. Never relax assertions/goldens/thresholds/retries/timeouts for unexplained failures.
- Run relevant typecheck, lint without auto-fix, tests and builds for the affected dependency graph (Turbo filters where possible). Broaden/repeat only for new changes/failures/unresolved concerns. Documentation-only work requires `pnpm docs:link-check` and `git diff --check`; unchanged runtime needs no full build.
- Before finishing: check RFC/architecture alignment, update applicable owners, confirm no silent code/doc contradictions. Report changed files, actual checks/failures, status changes, remaining gaps and open founder decisions. Never claim success with missing/failing required checks.
- Branch: `feature/<short-name>` or `fix/<short-name>`; short specific lowercase commit. Do not mention agents, AI or automation in branches/commits/PRs.

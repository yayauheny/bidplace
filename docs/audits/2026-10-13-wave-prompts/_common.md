# Worker contract (applies to every wave below)

You are an implementation worker in the `bidplace` monorepo (pnpm; `apps/mobile` is Expo / React Native Web / expo-router; `packages/design-tokens`; `apps/api`). Your working directory is a dedicated git worktree. Another agent (the coordinator) writes the task, reviews your diff and commits. Do exactly the wave described after this contract, nothing else.

## Before you start

- Read `AGENTS.md` and obey it. Where this prompt is stricter or more specific, this prompt wins. After wave W0 the Figma file replaces the old Pen reference; until W0 is merged, ignore the Pen sections of `AGENTS.md` only where this prompt explicitly says so.
- Read `docs/product/00-PROJECT-INDEX.md`, `docs/product/01-PRODUCT-FOUNDATION.md`, and only the owner documents relevant to the task. `docs/product/11-PROJECT-STATUS.md` and `docs/design/04-DESIGN-STATUS.md` are very long append-only logs: search them (`rg`), do not read them end to end.
- For UI work also read `docs/design/00-DESIGN-INDEX.md`, `02-USER-FLOWS-AND-SCREENS.md`, `03-DESIGN-SYSTEM.md`.
- Inspect the code before editing. Use symbol names and `rg`, not remembered line numbers: lines quoted in this prompt are hints and may have drifted.

## Rules

1. **Only what the wave lists.** Anything else you notice goes into the report under "noticed, not done", never into the diff.
2. **Search order for every solution:** already in this repo -> already installed dependency -> platform / framework built-in -> minimal new code. **No new dependencies** unless the wave explicitly allows one. A new component or helper needs one named, current responsibility.
3. **Deleting beats adding.** Delete code, tokens, specs and comments made obsolete by your change in the same wave. Excluding docs and lockfiles, deletions must be >= additions; if not, explain why in the report.
4. **Fix the root, once, in the shared place.** Before changing shared code, `rg` all consumers. Forbidden: `@ts-ignore`, `@ts-expect-error`, `any`, empty `catch`, `eslint-disable`, lint/TS suppressions, relaxed assertions, goldens, thresholds, retries or timeouts.
5. **No new literals outside tokens.** No new hex colors, font sizes or sizes in components. One-off geometry is a local named constant with the Figma node id in a comment. Spacing / size / radius values are even integers.
6. **Do not touch:** `design/figma-handoff/**`, `docs/research/raw/**`, protected product docs `docs/product/01..04,06..09`, `docs/design/01-DESIGN-FOUNDATION.md` (only where a wave names exact lines), database schema/migrations/seed, deploy or CI config, any other worktree, `~/projects/bidplace-home-figma-completion`.
7. **Product guard:** do not implement the Archive tab, sale/auction chips, "add to favorites" or bidding UI even if a Figma frame shows them (conflict with `DEC-083`/`DEC-087`). Report it and continue with the rest.
8. **No git writes.** Do not run `git commit`, `git add`, `git rm`, `git checkout`, `git switch`, `git stash`, `git tag`, `git push`. Delete files with plain `rm`. Leave every change uncommitted in the working tree. Use `git --no-optional-locks status --short` and `git --no-optional-locks diff` to look.
9. **Real checks only.** Run what applies and paste the real tail of the output in the report:
   - `pnpm --filter @bidplace/design-tokens build` (if tokens changed)
   - `pnpm --filter @bidplace/mobile typecheck`
   - `pnpm --filter @bidplace/mobile lint` (never `--fix`)
   - `pnpm --filter @bidplace/mobile test` (vitest)
   - `pnpm exec prettier --check <every file you changed>`
   - Playwright (best effort; needs the disposable Postgres/web setup described in `apps/mobile/e2e/README.md`): `pnpm --filter @bidplace/mobile exec playwright test --project=chromium e2e/<spec>.spec.ts`. If it cannot start, write `not run: <reason>`. Never edit a spec only to make it pass; changing an expected number is allowed only when the wave intentionally changes that number, and every such change is listed in the report.
   - A check you did not run is reported as "not run", never as passing. Do not call the wave done while a required check is red.
10. **Docs by `AGENTS.md`:** at most ~10 lines in `docs/product/11-PROJECT-STATUS.md` and, for UI work, `docs/design/04-DESIGN-STATUS.md` (status `Implemented` / `Partial` / `Needs verification`, with modules and tests as evidence). No new `.md` files. `docs/product/12-DECISION-LOG.md` only where the wave tells you to add an entry.
11. **Stop and ask** (finish your report with the question, do not guess) on: a conflict with `DEC-083`/`DEC-087` or another product decision; an ambiguous Figma value; a need for a new dependency; a need to edit a protected document; a live dependency on something the wave tells you to delete.

## Final report (your last message, in this exact order)

1. **Wave and branch/base:** wave name, `git rev-parse --short HEAD`.
2. **Files changed:** one line each with the reason.
3. **Size:** `git --no-optional-locks diff --shortstat` (and a second line excluding docs and lockfiles).
4. **Checks:** every command with its real output tail; a separate list of "not run" with reasons.
5. **Done-when list from the wave:** each item with PASS / FAIL and the command or evidence.
6. **Deviations** from the wave text, with reasons.
7. **Noticed, not done.**
8. **Skipped / unverified and its risk** — 1 to 2 lines (what you did not check and why it could matter).

## Working style

Ponytail: the smallest complete change; reuse what exists; no speculative abstractions, flags, wrappers or options; no comments that restate the code; answer in plain, short sentences.

---

# WAVE W0+W1 FIXES — review corrections (one branch)

Model: sol, effort medium. Work directory: `~/projects/bidplace-ds` on branch `refactor/design-system-w0-w1`.

State you start from (prepared by the coordinator; do not change it with git):

- The branch contains the committed W0 (`404fe1c0`, base `f4c37a8e`).
- The W1 changes are applied on top of it and are **uncommitted** in the working tree (including the untracked `apps/mobile/public/index.html`). The two status logs `docs/design/04-DESIGN-STATUS.md` and `docs/product/11-PROJECT-STATUS.md` already contain both the W0 banner (first line) and the W1 entry below it.
- Your job is to fix the review findings below in that working tree. Do not redo W1 from scratch; keep what already passes (typecheck, lint, the dialog unit tests, the `viewport-fit=cover` export, `OverlayHost` removal, the backdrop assertion).

## Part A — W0 corrections (docs only)

1. `AGENTS.md`, section `## Figma is the visual source`: the old Pen block had two rules that are not Pen-specific and were lost. Add exactly this paragraph at the end of that section (before the sibling-worktree sentence):

   > Figma controls visual composition and styling; product owner documents and server contracts continue to control routes, data, permissions, privacy and auction behavior. If a Figma node is missing, ambiguous or conflicts with a product contract, stop the affected implementation and record the required decision.

2. `docs/product/12-DECISION-LOG.md`, entry `DEC-119`: replace "(recoverable from the local tag `pen-v2-pre-removal` and git history)" with "(recoverable from git history)". Change nothing else in the entry.

## Part B — W1 corrections

Fix every item; each has a "check" that goes into the report.

1. **Simplify `AppDialog` (replace the `sheetContent: 'full' | 'compact'` prop).** The value `'compact'` behaves like `'full'` except for height, and the prop adds about eight nested conditionals (padding, border, radius, elevation, ScrollView, height).
   - Replace it with **one** boolean prop `bare`: "children own their padding, scrolling and size". `AppDialog` then skips its own padding, border, elevation and `ScrollView`, and nothing else.
   - Move the full-height and square-corner behavior of the full-screen filter sheet into `FilterSheet`'s own panel style (`filter-sheet-style.ts`). `AppDialog` must not know about "full" or "compact".
   - If that is impossible without a second new prop on `AppDialog`, STOP and report why.
   - Check: `rg -n "sheetContent" apps/mobile/src` -> empty; the number of conditionals added to `AppDialog` is smaller than before (say the count).
2. **Bottom spacing must not change existing sheets.**
   - At inset 0 every sheet that existed before W1 must have exactly the same bottom spacing as at `f4c37a8e`. Currently non-media sheets went from 12 (pageGutter) + 4 (`space.x1`) = 16 to 20, i.e. +4 px; restore the previous value.
   - Design the prop like this: `bottomSpace?: 20 | 40` is an explicit Figma-defined bottom space; when it is omitted the sheet keeps its existing bottom spacing. In both cases Safe Area is applied as `max(space, insets.bottom)` using the existing pure function (rename its first parameter if "bottomSpace" no longer describes it).
   - Only the compact filter sheet passes `bottomSpace={40}` (Figma: sheet "05 · Фильтры и сортировка", node `7008:1756`, bottom padding 40).
   - The **full-screen** filter sheet must not get the 40: at inset 0 its bottom spacing equals the base value (the old `ScrollView` `paddingBottom` of `space.x4`); with inset > 0 it is `max(that value, inset)`.
   - Check: for each of compact filter, full filter, share sheet, one media sheet — the measured distance (in px, at 390 wide, inset 0) from the last content element to the bottom of the viewport on base `f4c37a8e` versus now. Use Playwright `boundingBox` or `getComputedStyle`. Put the table in the report. Update the unit test for the pure function if its meaning changed (keep one test that fails when `max` is replaced by `+`).
3. **One focus-return helper.** The `onCloseAutoFocus` / opener-capture block is duplicated in `AppDialog.tsx` and `ExitConfirmDialog.tsx`. Extract one small shared function or hook in `components/ui` (named for what it does, for example `useReturnFocus`), use it in both, and delete both copies. Behavior stays: the explicit `returnFocusRef` wins; otherwise the element focused when the dialog opened gets focus back if it is still connected; native does nothing.
   - Check: both files import the helper; `rg -n "onCloseAutoFocus" apps/mobile/src` shows the helper only (plus any pre-existing use you did not add); Escape / outside click / button close on `ExitConfirmDialog` still return focus (describe how you verified).
4. **One centering mechanism and one width cap in the sheet host.** `appDialogHostStyle` currently centers a sheet with `alignItems: 'center'`, `alignSelf: 'center'` and `marginLeft/Right: 'auto'`, and `maxWidth` is set both on the host and on the dialog content. Keep one centering mechanism and one `maxWidth` (`layout.sheetMax`), whichever is smaller and works on web. Update `app-dialog-host-style.spec.ts` to the single mechanism. Unrelated reformatting in `app-dialog-host-style.ts` that Prettier produced may stay, but do not add more.
   - Check: the host-style unit test; the sheet is still centered at 1440 and full-width at 390 (screenshots, see item 6).
5. **Playwright failures: separate regressions from baseline.**
   - Make a read-only copy of the base without writing git: `mkdir /tmp/ds-base && git archive f4c37a8e | tar -x -C /tmp/ds-base`, then install and build it the same way as the working copy (`pnpm install --offline` if the store allows), and run **exactly the failing specs from your last run** there (at least `share-sheet-motion` and the creator-application specs; list each failing test title).
   - Report a table: test, base result, now result. A test that passes on base and fails now is a W1 regression: fix it in this wave. A test that fails on both is baseline: leave it, list it.
   - If the base copy cannot be built or run, write `not run: <reason>`; the coordinator will do the baseline run. Do not weaken any expectation.
   - Auth tests that fail with API 503 because of unfilled legal documents are an environment issue: say so, do not touch them.
6. **Unverified consumers.** For the compact and the full `FilterSheet`, `FilterSortSheet` and `CatalogFilterSheet` (used by `features/.../public-authors-screen` and `product-list-screen`): open each one in the browser at 390 wide, check close by Escape, outside click and button, focus return, and take a screenshot. Also take the compact sheet at 1440 (it must be centered at 390 wide). Save screenshots **outside** the repo (`/tmp/w1-fix-shots/...`) and list them. Add or extend **one existing** Playwright owner spec only if an assertion is cheap (for example opening the `/authors` filter and checking it closes); otherwise report these as manually checked.
7. **Size.** After items 1–4, code-only `git diff --shortstat` (excluding docs and lockfile) must show deletions >= additions. If it does not, say exactly which additions are necessary and why.
8. **Docs.** Update the W1 entries in `docs/design/04-DESIGN-STATUS.md` and `docs/product/11-PROJECT-STATUS.md` and `apps/mobile/src/components/README.md` so they describe the final mechanism (`bare`, optional `bottomSpace`, shared focus helper). Keep them `Partial` / `Needs verification` unless every check above passed; <= 10 lines each; do not touch the W0 banner lines.

## Boundaries

- No new dependency, no new file except the small shared focus helper (and its spec only if it has logic worth testing). The untracked `apps/mobile/public/index.html` stays as it is (the coordinator adds it).
- Do not change `SearchOverlay*`, `OverlayDimmer`, the overlay hooks, `AuthViewport` beyond what already exists, `AppShell` beyond the existing `OverlayHost` removal, tokens (beyond the existing `layout.sheetMax`).
- No git writes (contract rule 8). No visual restyling beyond restoring the base spacing described above.

## Done when

- `rg -n "sheetContent" apps/mobile/src` -> empty; `AppDialog` has the single new boolean `bare` for this purpose.
- `AGENTS.md` contains the Part A paragraph; `DEC-119` no longer mentions the local tag.
- The spacing table (item 2) shows base == now at inset 0 for share sheet, media sheet and full filter sheet, and 40 for the compact filter sheet.
- One focus-return helper used by both dialogs; no duplicated block.
- Host style: one centering mechanism, one `maxWidth`; its unit test passes and still fails if `max` becomes `+` in the pure function's test.
- Playwright table present; no test that passes on base fails now.
- Screenshots listed for compact/full `FilterSheet`, `FilterSortSheet`, `CatalogFilterSheet` at 390 and compact at 1440.
- `pnpm --filter @bidplace/design-tokens build`, `pnpm --filter @bidplace/mobile typecheck`, `lint`, full `test` (the two known baseline-failing suites, `__DEV__ is not defined` and `Unexpected token 'typeof'`, may fail only if they fail identically on base), and `prettier --check` on every file you changed that was Prettier-clean at base.
- Code-only `git diff --shortstat`: deletions >= additions (or the explanation above).

## Stop

`bare` is not enough and a second `AppDialog` prop is needed; a restored base spacing contradicts Figma and you need a design decision (describe both values); a Playwright regression you cannot fix without weakening a test.

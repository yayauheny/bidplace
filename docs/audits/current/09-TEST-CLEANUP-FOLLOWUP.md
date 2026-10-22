# R28-B test cleanup follow-up — 2026-10-03

Owner report for the mutation check of the accepted R28-A tests, the identical-helper extraction, and the read-only sweep. E2E decisions are in `10-E2E-SCOPE-PLAN.md`. This package does not close R28, T02, T06, or R29/T05.

## Scope

- Branch: `fix/behavior-test-coverage`
- Starting SHA: `9e4353585705ef794807a3664635fcad45fde7f7`
- Helper extraction: `feb845064de1c04d776f856615db8ff827eae1a2` — `test: share identical DOM test helpers`
- Category harness correction: `8f3998e77c7536a53a89d8f268b37ecef3510365` — `test: settle category publication without the shared key`
- Integration base of the previous package: `2728212cad2b39d32246899f429baedea60fa675`
- Original checkout `fix/form-field-ownership` was not switched.
- Production diff of the helper commit: empty. The commit is `apps/mobile/src/testing/dom.ts` plus import and local-definition edits in 11 specs.
- `git show --unified=0 feb8450 -- apps/mobile/src` has no added or removed `it(`, `it.each`, or `expect(` lines.

R22, R23, R25, and R33 were not implemented. No browser, API, database, Prisma CLI, migrate, seed, or root verify run.

## Counts

Measured Vitest runtime, Node v22.20.0 / pnpm 11.7.0 / Vitest 4.1.10:

| Run | Result | Log |
| --- | --- | --- |
| Baseline before this package, HEAD `9e43535` | 109 files / 569 tests, exit 0 | `/Users/yayauheny/projects/bidplace-r28b-baseline-mobile-test.log` |
| Targeted consumers after extraction | 11 files / 115 tests, exit 0 | `/Users/yayauheny/projects/bidplace-r28b-helper-targeted.log` |
| Full suite after extraction | 109 files / 569 tests, exit 0, start 10:55:00, duration 9.18s | `/Users/yayauheny/projects/bidplace-r28b-final-mobile-test.log` |

The 109/569 total is the same before and after extraction. That is a measured count, not a claim that every assertion was re-derived by hand.

AST declarations, scanned from current spec files, are not the runtime total:

- `apps/mobile/src`: 109 spec files, 446 `it(` calls, 31 `it.each` / `test.each` calls, 477 declarations. Vitest expands the tables to 569 tests.
- `apps/mobile/e2e`: 26 spec files, 100 `test(` calls, 0 `test.each`. Playwright was not run, so 100 is a declaration count, not a browser result.

## Phase 1 — mutation matrix

Every copy started at `9e4353585705ef794807a3664635fcad45fde7f7`. One production break per copy, under `/private/tmp/bidplace-r28b-mutations/pilot`. Patches: `/private/tmp/bidplace-r28b-mutations/patches/`. Logs: `/private/tmp/bidplace-r28b-mutations/logs/`. Tests and expectations in the copies were not edited. The accepted worktree was rsync-restored after the matrix and does not contain these patches.

Each log records `MUTATION`, `COPY`, `FILE`, `SHA256`, the Vitest command, and `RUN v4.1.10 /private/tmp/bidplace-r28b-mutations/pilot/apps/mobile`. That `RUN` line is the evidence that Vitest loaded the copy. An unpatched `category-query-identity.spec.ts` in the same copy passed 4/4 (`category-unpatched.log`, exit 0).

Fifteen of the nineteen historical copies failed on an assertion of the named behavior. M01–M03 and M05–M11 are those copies. Extra failures in that set are the same mechanism, not a second risk. The four historical M04 copies are not in that set: they timed out inside readiness and did not reach the shared-key assertions. No copy stayed green. No syntax, resolve, or bootstrap failure was used as proof.

| Id | Break | Owner test that caught it | Exit | Extra same-mechanism failures |
| --- | --- | --- | --- | --- |
| M01-works | `listWorks` no longer receives `{ signal }` | H05 and H06 works. `expected undefined to be false` on `request.signal?.aborted` | 1 | H01 works uses the same signal presence check |
| M01-authors | `listAuthors` no longer receives `{ signal }` | H05 and H06 authors, same assertion | 1 | none |
| M02-works | works `queryFn` omits `q`; `toPortfolioWorksListQuery` unchanged | H01 works, outbound params lack `q` | 1 | H03 works and all four H04 works fields fail on the same missing `q` |
| M02-authors | authors `queryFn` omits `q` | H01 authors | 1 | H03 authors and H04 authors `q` / `tag` / `city` / `sort` |
| M03-works | `uniqueCatalogItems` replaced by concatenation | H02 works, expected 13 ids, received 14 | 1 | H03 works, same 13 vs 14 |
| M03-authors | same concatenation | H02 authors | 1 | H03 authors |
| M04 ProductListScreen, historical | `queryKey` changed from `categoryKeys.all` to `['categories', 'detached']` | readiness timed out at 5000ms before `getObserversCount()` | 1 | the three later cases also timed out. That is harness contamination, not three more production breaks |
| M04 ProductDraftScreen, historical | same key change in that screen only | ProductDraftScreen readiness timed out | 1 | PublicSellerScreen and CategoriesSearchPane timed out after it; ProductListScreen passed |
| M04 PublicSellerScreen, historical | same | PublicSellerScreen readiness timed out | 1 | CategoriesSearchPane timed out after it |
| M04 CategoriesSearchPane, historical | same | CategoriesSearchPane readiness timed out; the other three passed | 1 | none |
| M05-works-tab | Works renders a tablist whose text is «Все работы» | `hides the HIDE_FOR_FIRST_MVP catalog-segment tab` | 1 | none |
| M05-works-tone | Works intro `tone="secondary"` | `'Works' intro uses bodySmall without a secondary tone` | 1 | none |
| M05-authors-tone | Authors intro `tone="secondary"` | `'Authors' intro uses bodySmall without a secondary tone` | 1 | Authors was not asked to catch tabs or card order, and it did not |
| M06 | `navigateWorksCatalogBack` is a no-op; `canGoBack` stays true | `calls router.back from the real back control when history exists`; `router.back` called 0 times | 1 | none |
| M07 | `WorkShareControl` returns null | native and web `header shows one Back and one Share and no Like`; expected `['Поделиться работой']`, received `[]` | 1 | none |
| M08 | `contentInset` padding moved from the inner rail to the outer tablist | 24px case: rail `paddingLeft` expected `24px`, received `''` | 1 | omitted-inset case: rail padding expected `0px`, received `''` |
| M09 | web surface returned in the host instead of `document.body` | `view.host.contains(dialog)` expected false, received true | 1 | S07 fails the same host check before dismiss |
| M10 | native surface drops `onRequestClose={onClose}` | `onClose` called 0 times, expected 1 | 1 | none |
| M11 | dimmer path calls `closeWith('pointerdown')` twice | `onDismiss` called 2 times, expected 1 | 1 | none |

The historical M04 logs stay readiness timeouts. `publishMountedConsumer` waited until `categoryKeys.all` was already success with observers greater than 0, which is the invariant the test callback asserts. A detached key never satisfied that wait, so `await published` stayed inside `act`. `releaseSubscriptions` only unsubscribed. After the first 5000ms timeout the later cases in the same process also timed out. Those later timeouts are not evidence that the unpatched consumers lost `categoryKeys.all`. The unpatched file in the same copy passed 4/4. Logs: `/private/tmp/bidplace-r28b-mutations/logs/M04-*.log`.

## Corrected M04

`8f3998e77c7536a53a89d8f268b37ecef3510365` changes only the readiness and disposal path in `category-query-identity.spec.ts`. The four `it.each` rows, fixtures, test names, and the assertions on `categoryKeys.all`, observer count, and `categoriesBody` are unchanged. Readiness now waits for some observed successful query that holds the categories payload. It does not look up `categoryKeys.all`. Failure or disposal settles that wait, so the `act` scope does not stay open.

Unmodified spec: `/Users/yayauheny/projects/bidplace-r28b-m04fix-category.log`, 4 passed, exit 0, 69ms. No act warning or unhandled rejection is in that log.

Each corrected copy changed one production key to `['categories', 'detached']` and ran the whole file, not a filtered case. Patches and logs: `/private/tmp/bidplace-r28b-m04-correction/patches` and `.../logs`. Starting SHA recorded in the logs is `fb779f17affc3da16f5acb93cdda9980da599776`; the spec under test is the corrected file, SHA256 `104f36bff8a77c31001381485eab445b9ca982a556a923e09d7c2647799e38ef`. Vitest printed `RUN v4.1.10 /private/tmp/bidplace-r28b-m04-correction/tree/apps/mobile`. The copies were restored after the runs. The accepted worktree production files were not patched.

| Copy | Result |
| --- | --- |
| ProductListScreen | 1 failed, 3 passed, exit 1. `query?.getObserversCount()` received `undefined` at `toBeGreaterThan(0)` |
| ProductDraftScreen | 1 failed, 3 passed, exit 1. Same assertion |
| PublicSellerScreen | 1 failed, 3 passed, exit 1. Same assertion |
| CategoriesSearchPane | 1 failed, 3 passed, exit 1. Same assertion |

None of the four corrected logs contains `Test timed out`. The other fifteen historical mutations were not repeated.

## Phase 2 — helper reuse

New module `apps/mobile/src/testing/dom.ts` exports only `flush`, `setInput`, and `inputValue`. It does not register hooks, create a QueryClient, change `notifyManager`, install global mocks, or hold fixtures.

| Helper | Moved from | Left local, and why |
| --- | --- | --- |
| `flush`: `act` plus one `setTimeout(0)` | auth-provider-refresh, auth-provider-logout, protected-route-refresh, author-application-achievements, product-draft-save-race, product-draft-submit-lifecycle, product-draft-route-guard, seller-profile-submit, seller-profile-logout, product-draft-fields, seller-profile-fields | Same body still exists in account-logout-button, verify-email-logout, account-logout-reachability, author-cabinet-work-cache, and admin-moderation-screen. Those files were outside the allowlist. `AdminRevisionPhoto` flushes two `Promise.resolve` calls. `AppDialog` flushes two timeouts. |
| `setInput`: aria-label, `HTMLInputElement`, native value setter, bubbling `input` inside `act` | product-draft-save-race, product-draft-submit-lifecycle, product-draft-route-guard, seller-profile-submit | product-draft-fields and seller-profile-fields go through a local `input()`. author-application-achievements also dispatches `change`. |
| `inputValue` | author-application-achievements, product-draft-save-race, seller-profile-submit | no other identical consumer was on the allowlist |

`until` stays local: 8 attempts in the auth-provider settle loops, 12 in seller-profile-logout, seller-profile-submit, protected-route-refresh, and account-logout-reachability, 20 in achievements, save-race, route-guard, submit-lifecycle, author-cabinet-work-cache, and admin-moderation-screen. No shared retry helper was added. The catalog observer harness was not replaced with `flush`.

## Phase 4 — sweep

No production symbol was deleted. No test-only symbol met DELETE NOW: every remaining candidate still has a consumer, a different implementation, or an export whose removal needs a later decision.

| Symbol | Classification | Reason |
| --- | --- | --- |
| `figmaIconNames`, dock item ids, dock actions, `dockItemAccessibility` | KEEP | Live registry and route behavior. Specs assert the rendered set, not only a deferred list. |
| `figmaDeferredIconNames` | DEFER | Asserted equal to `['google', 'ai-magic', 'shopping-basket-01']` in `figma-icon-names.spec.ts`. `FigmaIcon.tsx` does not read it. It is re-exported from `components/figma/index.ts`. In-repo consumers are the spec, the module, and the barrel. Deleting a barrel export is outside this wave. |
| `figmaDeferredDockItemIds`, `figmaUnusedDockVariantIds` | DEFER | Asserted in `floating-dock.spec.ts` (`['cart']`, `split-search-fab`, `five-icon-cart-pill`). The live dock list is `figmaDockItemIds`. Same barrel-export limit as the icon list. |
| `usePortfolioWorks` / `usePortfolioAuthors` second argument `enabled = true` | DEFER | The parameter is forwarded to `useInfiniteQuery`. Current callers pass only route state. It is a production parameter, so this wave does not remove it. |
| Local `flush` / `setInput` copies listed above | KEEP | Different timing or event semantics, or outside the extraction allowlist. |
| `until` with 8, 12, or 20 attempts | KEEP | The attempt counts are part of the existing failure boundary. |
| Catalog observer harness | KEEP | Mutation M01–M03 detected the hook risks through that harness. |
| Commerce inventory, share/QR, `productAction`, auth epoch, portfolio predicates | KEEP | Live product contracts. This sweep did not find them unused. |

M05–M11 detected the catalog chrome, intro tone, Back, Share, tab inset, and search portal or dismiss breaks by assertion. Historical M04 did not: it stopped in readiness. The corrected M04 runs reach `getObserversCount()`. The remaining source-text examples are the deferred icon and dock inventory constants above. They restate a constant. They do not observe a screen.

## Checks after the category harness correction

| Command | Exit | Notes |
| --- | --- | --- |
| `EXPO_NO_DOTENV=1 BIDPLACE_ENV_FILE=/dev/null pnpm exec turbo run typecheck --filter='@bidplace/mobile...'` | 0 | `/Users/yayauheny/projects/bidplace-r28b-m04fix-typecheck.log`. Mobile typecheck cache miss `0ad03b0c5c8c3539`. |
| Category spec | 0 | 4 passed. `/Users/yayauheny/projects/bidplace-r28b-m04fix-category.log` |
| `EXPO_NO_DOTENV=1 pnpm --filter @bidplace/mobile test` | 0 | 109 / 569. `/Users/yayauheny/projects/bidplace-r28b-m04fix-mobile-test.log`, start 11:41:02, duration 8.96s |
| `pnpm --filter @bidplace/mobile lint` | 0 | `/Users/yayauheny/projects/bidplace-r28b-m04fix-lint.log` |
| `EXPO_NO_DOTENV=1 BIDPLACE_ENV_FILE=/dev/null pnpm exec turbo run typecheck build --filter='@bidplace/mobile...'` | 0 | `/Users/yayauheny/projects/bidplace-r28b-m04fix-typecheck-build.log`. 8 successful. Mobile typecheck cache hit `0ad03b0c5c8c3539`. Mobile build cache miss `e5bde5eeba87db29`. |
| `pnpm --filter @bidplace/mobile test:e2e-fence` | 0 | `/Users/yayauheny/projects/bidplace-r28b-m04fix-e2e-fence.log` |
| `git -c core.fsmonitor=false diff --check` | 0 | `/Users/yayauheny/projects/bidplace-r28b-m04fix-diff-check.log` |

## Checks after extraction

All commands ran from the worktree root. Unexpected red did not occur.

| Command | Exit | Notes |
| --- | --- | --- |
| `EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck --filter='@bidplace/mobile...'` before the full suite | 0 | `/Users/yayauheny/projects/bidplace-r28b-helper-typecheck.log`. Mobile typecheck cache miss `9c129db50c02a7ea`. |
| Targeted Vitest of the 11 consumer specs | 0 | 11 files / 115 tests. No act warning or unhandled rejection in the log. |
| `EXPO_NO_DOTENV=1 pnpm --filter @bidplace/mobile test` | 0 | 109 / 569. |
| `pnpm --filter @bidplace/mobile lint` | 0 | `/Users/yayauheny/projects/bidplace-r28b-final-lint.log` |
| `EXPO_NO_DOTENV=1 BIDPLACE_ENV_FILE=/dev/null pnpm exec turbo run typecheck build --filter='@bidplace/mobile...'` | 0 | 8 successful. Cache hits: contracts typecheck `21df80b23b533f08`, design-tokens typecheck `51af8ef023409d45`, design-tokens build `206179f93e09e4eb`, contracts build `425e77c240477454`, api-client typecheck `86b49fae070f4b99`, api-client build `edb62ef9cf2e3eae`, mobile typecheck `9c129db50c02a7ea`. Mobile build cache miss `f553b134d4f70cb1`. |
| `pnpm --filter @bidplace/mobile test:e2e-fence` | 0 | Fence script only. Playwright did not launch a browser. |
| `git -c core.fsmonitor=false diff --check` | 0 | |

Versions checked before the work: Node v22.20.0, pnpm 11.7.0, React 19.2.3, React Query 5.101.2, Vitest 4.1.10, mobile TypeScript 6.0.3. Dist artifacts for contracts, api-client, design-tokens, database, and the generated Prisma client were already present. Prisma CLI was not run.

## Completion checklist

R28, T02, and T06 stay `PARTIAL`. Recommended status: do not mark them `VERIFIED`.

Done in this package:

- M01–M03 and M05–M11 fail on the named assertion. Historical M04 is recorded as readiness timeouts. Corrected M04 fails the shared-key observer assertion for the patched consumer and passes the other three cases.
- Three identical helpers live in one test-only module, and the full mobile suite stays 109/569.
- Remaining deferred symbols and unlike helpers are named.
- E2E reduction is planned in `10-E2E-SCOPE-PLAN.md` and was not applied.

Still required before R28 / T02 / T06 can close:

- A later, explicit decision for the deferred icon and dock constants and for the catalog `enabled` parameter. This package does not delete them.
- Any further helper merge has to compare bodies again. The leftover `flush` copies match the extracted body but were not on this allowlist. `until` attempt counts must stay distinct.
- T06 parent/achievement seam stays with R32. Harness setup, QueryClient, and transport were not unified here.

R28-A replaced the named source-reading cases with hook and component tests. This package did not add a browser replacement, so a Playwright run of one is not an R28 gate.

R29 / T05 stay not verified. Their remaining work is the browser matrix and durations in `10-E2E-SCOPE-PLAN.md`. D04, D05, D09, D10, L04, and R32 keep their own browser requirements.

## NOT RUN

Browsers, Playwright test execution, API server, database, Prisma CLI, migrate, seed, root verify, and any mutation inside the accepted worktree. `.env` was not read. `.pen` and canonical Figma files were not edited. `10-CODE-ARCHITECTURE.md` was not edited.

# R28-C residual cleanup — 2026-10-03

The R28-B sections above stay as history. This section records the residual cleanup after accepted `15d42bf`. It does not accept the package.

## Scope

- Branch: `fix/behavior-test-coverage`
- Integration base: `2728212cad2b39d32246899f429baedea60fa675`
- Starting SHA: `15d42bf7142fa3149c9af3c3d263ffe7c991bbe1`
- A: `907246796b3f595ed3f52306b1cc92e498d17602` — `test: reuse the shared flush in five specs`
- B: `63bb18596b0b1540096cf2bafe38e918d5114e5d` — `test: drop unused Figma inventory constants`
- C: `8029aef45827d9a7e27e1e60f584167352981897` — `test: drop the unused catalog hook enabled argument`
- Original checkout `fix/form-field-ownership` was not switched.
- No merge, rebase, cherry-pick, push, or pull request.

Commit A imports `flush` from `apps/mobile/src/testing/dom.ts` in five specs and deletes the local function. The helper file was not rewritten. Commit B removes `figmaDeferredIconNames`, `figmaDeferredDockItemIds`, and `figmaUnusedDockVariantIds`, their barrel exports, and the single deferred-icon case. Commit C removes the unused second argument of `usePortfolioWorks` and `usePortfolioAuthors` and leaves `enabled: true` on `useInfiniteQuery`.

## Consumer evidence

Before B, those three constants had no consumer outside their declarations, the private mobile barrel, and specs that compared the arrays to themselves. After B, `*.{ts,tsx,js,mjs}` has no remaining reference. `figmaIconNames`, `figmaDockItemIds`, `figmaDockItems`, icon implementations, and the dock assets stay.

Before C, production callers passed only route state: `ProductListScreen`, `PublicAuthorsScreen`, `WorksSearchPane`, and `AuthorsSearchPane`. The hook spec does the same. No `enabled: false` caller was added.

## Counts

| Run | Result | Log |
| --- | --- | --- |
| Baseline, HEAD `15d42bf` | 109 files / 569 tests, exit 0, start 13:43:47, 10.47s | `/Users/yayauheny/projects/bidplace-r28c-baseline-mobile-test.log` |
| Targeted A | 5 files / 35 tests, exit 0, start 13:44:38, 1.73s | `/Users/yayauheny/projects/bidplace-r28c-flush-targeted.log` |
| Targeted B | 2 files / 5 tests, exit 0, start 13:45:19, 150ms | `/Users/yayauheny/projects/bidplace-r28c-metadata-targeted.log` |
| Targeted C | 18 tests, exit 0, start 13:45:37, 989ms | `/Users/yayauheny/projects/bidplace-r28c-hooks-targeted.log` |
| Final | 109 files / 568 tests, exit 0, start 13:46:28, 9.59s | `/Users/yayauheny/projects/bidplace-r28c-final-mobile-test.log` |

568 is 569 minus the one deleted deferred-icon `it`. Spec file count stays 109. Lint, typecheck, build, `test:e2e-fence`, and `git diff --check` exited 0 before the edits and again after C. Final Turbo: six dependency tasks were cache hits; mobile typecheck `4dcc24e15aa117e6` and mobile build `2673b3a9d0fc6265` were cache misses. The fence script is not a browser run.

## Acceptance matrix

Recommendation only. The matrix in `00-EXECUTION-ROADMAP.md` stays `PARTIAL` until review.

| Item | Criterion | Result |
| --- | --- | --- |
| R28 | Source-text behavior checks have owner tests, and M01–M11 catch the named break | Met in R28-A/B. Corrected M04 is one assertion failure and three passes. |
| R28 | Five identical `flush` bodies use the existing helper | Met, `9072467`. Unlike flush and setInput copies were left in place. |
| R28 | Helper-only metadata and the unused `enabled` argument are gone without a behavior change | Met, `63bb185` and `8029aef`. `enabled: true` stays explicit. |
| R28 | A new browser spec replaces a source test | Not required. R28-A/B added no such replacement, and this package adds none. |
| R28 remainder | None inside the card | Recommend `VERIFIED`. |
| T02 | Dead-helper tests and helper-only assertions of removed symbols | Met. R09/R10 removed the earlier dead helpers. This package removed the three metadata constants and one `it`. |
| T02 | Source-text inventory | Met. The named source-reading cases were replaced earlier. `figmaIconNames` equality remains because that array is the live registry. |
| T02 remainder | None | Recommend `VERIFIED`. |
| T06 | Real parent/child consumers | Met. `author-application-achievements.spec.ts` mounts `SellerProfileScreen`, which renders `AuthorApplicationAchievements`. The file covers blocked parent submit/logout/exit, a write that does not start after a parent transition, release after success/failure/unmount, input kept after the save snapshot, retired-session results, a late initial GET, a stale GET after delete, and picker/blob after lock/unlock. This package did not edit that spec. |
| T06 | Identical DOM helpers | Met, including the five flush copies in A. |
| T06 | QueryClient, transports, and typed fixtures | Closed as KEEP. Attempt counts stay 8, 12, and 20. AdminRevisionPhoto waits two microtasks. AppDialog waits two timeouts. Three local `setInput` helpers dispatch through a different input path. A shared form framework was not added. |
| T06 remainder | None for the unit seam | Recommend `VERIFIED` for T06. D10 stays `NEEDS_VERIFICATION` because Chromium and WebKit were not run. That browser gap does not cancel the unit seam. |

## Residual sweep

- KEEP: live icon registry, four dock items, route selection, accessibility, catalog observer harness, and the unlike local helpers named above.
- DELETE PROPOSAL, not executed: `creator-profile.spec.ts`, case `creator profile creation stages public identity, links and private handoff`. Its three-step strings are absent from `apps/mobile/src`. Replacement owners are `author-revision-flow.spec.ts` and `author-application-publication.spec.ts`. Deletion belongs to R29 and needs a browser run of the four-step and privacy cases first.
- DEFER: R29 durations and the maintained browser matrix, including page-2 cases that depend on seed size. Return when a browser run is the assigned task.

## NOT RUN

Browsers, Playwright test execution, API server, database, Prisma CLI, migrate, seed, root verify, and new mutations. `10-E2E-SCOPE-PLAN.md`, protected product documents, `.pen`, and canonical Figma files were not edited.

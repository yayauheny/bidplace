# R28-B test cleanup follow-up — 2026-10-03

Owner report for the mutation check of the accepted R28-A tests, the identical-helper extraction, and the read-only sweep. E2E decisions are in `10-E2E-SCOPE-PLAN.md`. This package does not close R28, T02, T06, or R29/T05.

## Scope

- Branch: `fix/behavior-test-coverage`
- Starting SHA: `9e4353585705ef794807a3664635fcad45fde7f7`
- Helper extraction: `feb845064de1c04d776f856615db8ff827eae1a2` — `test: share identical DOM test helpers`
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

Every intended break was detected by an assertion of the named behavior. Extra failures listed below are the same mechanism, not a second risk. No copy stayed green. No syntax, resolve, or bootstrap failure was used as proof.

| Id | Break | Owner test that caught it | Exit | Extra same-mechanism failures |
| --- | --- | --- | --- | --- |
| M01-works | `listWorks` no longer receives `{ signal }` | H05 and H06 works. `expected undefined to be false` on `request.signal?.aborted` | 1 | H01 works uses the same signal presence check |
| M01-authors | `listAuthors` no longer receives `{ signal }` | H05 and H06 authors, same assertion | 1 | none |
| M02-works | works `queryFn` omits `q`; `toPortfolioWorksListQuery` unchanged | H01 works, outbound params lack `q` | 1 | H03 works and all four H04 works fields fail on the same missing `q` |
| M02-authors | authors `queryFn` omits `q` | H01 authors | 1 | H03 authors and H04 authors `q` / `tag` / `city` / `sort` |
| M03-works | `uniqueCatalogItems` replaced by concatenation | H02 works, expected 13 ids, received 14 | 1 | H03 works, same 13 vs 14 |
| M03-authors | same concatenation | H02 authors | 1 | H03 authors |
| M04 ProductListScreen | `queryKey` changed from `categoryKeys.all` to `['categories', 'detached']` | `'ProductListScreen' keeps an active observer on categoryKeys.all` timed out at 5000ms | 1 | the three later consumers in the same file also timed out |
| M04 ProductDraftScreen | same key change in that screen only | ProductDraftScreen case timed out | 1 | PublicSellerScreen and CategoriesSearchPane timed out after it; ProductListScreen passed |
| M04 PublicSellerScreen | same | PublicSellerScreen case timed out | 1 | CategoriesSearchPane timed out after it |
| M04 CategoriesSearchPane | same | CategoriesSearchPane case timed out; the other three passed | 1 | none |
| M05-works-tab | Works renders a tablist whose text is «Все работы» | `hides the HIDE_FOR_FIRST_MVP catalog-segment tab` | 1 | none |
| M05-works-tone | Works intro `tone="secondary"` | `'Works' intro uses bodySmall without a secondary tone` | 1 | none |
| M05-authors-tone | Authors intro `tone="secondary"` | `'Authors' intro uses bodySmall without a secondary tone` | 1 | Authors was not asked to catch tabs or card order, and it did not |
| M06 | `navigateWorksCatalogBack` is a no-op; `canGoBack` stays true | `calls router.back from the real back control when history exists`; `router.back` called 0 times | 1 | none |
| M07 | `WorkShareControl` returns null | native and web `header shows one Back and one Share and no Like`; expected `['Поделиться работой']`, received `[]` | 1 | none |
| M08 | `contentInset` padding moved from the inner rail to the outer tablist | 24px case: rail `paddingLeft` expected `24px`, received `''` | 1 | omitted-inset case: rail padding expected `0px`, received `''` |
| M09 | web surface returned in the host instead of `document.body` | `view.host.contains(dialog)` expected false, received true | 1 | S07 fails the same host check before dismiss |
| M10 | native surface drops `onRequestClose={onClose}` | `onClose` called 0 times, expected 1 | 1 | none |
| M11 | dimmer path calls `closeWith('pointerdown')` twice | `onDismiss` called 2 times, expected 1 | 1 | none |

M04 is a related timeout, not an unrelated flake. `publishMountedConsumer` waits until `categoryKeys.all` is success with observers greater than 0. A detached key never satisfies that wait, so the case hits 5000ms. Later cases in the same file then time out because that wait never releases the shared transport. The unpatched file in the same copy is green, so the copy itself loads. The test was not changed.

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

Source-text assertions that R28-A already replaced (category key, catalog chrome, intro tone, Back, Share, tab inset, search portal and dismiss) were detected by M04–M11. The remaining source-text examples are the deferred icon and dock inventory constants above. They restate a constant. They do not observe a screen.

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

- Accepted R28-A owners fail the specified local breaks (M01–M11).
- Three identical helpers live in one test-only module, and the full mobile suite stays 109/569.
- Remaining deferred symbols and unlike helpers are named.
- E2E reduction is planned in `10-E2E-SCOPE-PLAN.md` and was not applied.

Still required before R28 / T02 / T06 can close:

- A later, explicit decision for the deferred icon and dock constants and for the catalog `enabled` parameter. This package does not delete them.
- Any further helper merge has to compare bodies again. The leftover `flush` copies match the extracted body but were not on this allowlist. `until` attempt counts must stay distinct.
- Browser specs that replace a source-text risk still need a Playwright run. This package did not run one.
- T06 parent/achievement seam stays with R32. Harness setup, QueryClient, and transport were not unified here.

R29 / T05 stay not verified. There are no browser durations.

## NOT RUN

Browsers, Playwright test execution, API server, database, Prisma CLI, migrate, seed, root verify, and any mutation inside the accepted worktree. `.env` was not read. `.pen` and canonical Figma files were not edited. `10-CODE-ARCHITECTURE.md` was not edited.

# Revalidated historical findings

## Status ledger

| Historical finding                                          | Current status                      | Current evidence                                                                                                                                                           |
| ----------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LOGIC:BL-01 / BL-14 — revision can be edited while pending  | **CONFIRMED; concurrency improved** | `update()` locks the Product row but directly updates the editing revision without checking `canAuthorEditRevision()`; that helper has no production caller.               |
| LOGIC:BL-02 — owner DTO hides editing revision              | **CONFIRMED**                       | `packages/contracts/src/product.ts :: productResponseSchema` and cabinet work schema expose only Product status; profile DTOs, unlike Work DTOs, expose `editingRevision`. |
| LOGIC:BL-12 — profile revision fork race                    | **RESOLVED**                        | `apps/api/src/sellers/ensure-editable-seller-profile-revision.ts :: ensureEditableEditingRevision()` uses profile and revision row locks.                                  |
| VAL:D14 — creation editor is unused                         | **OBSOLETE**                        | `apps/mobile/src/features/sellers/product-draft-screen.tsx :: ProductDraftScreen()` now renders `ProductDraftCreationStep`. Product-scope fit still needs review.          |
| M-LOGIC-08 — duplicate categories cache                     | **CONFIRMED**                       | `product-list-screen.tsx` / `use-author-works.ts` / `CategoriesSearchPane.tsx` use `['categories']`; `product-draft-screen.tsx` uses `['products','categories']`.          |
| M-LOGIC-09 — author double fetch and local filters          | **CONFIRMED**                       | `PublicSellerScreen()` always loads unfiltered pages; `useAuthorWorks()` starts a second query when category is selected. Tab/category remain local state.                 |
| M-LOGIC-11 / DS-03 — dead header stack                      | **CONFIRMED**                       | `AppShell()` mounts `FloatingDock`; no route imports `AppHeader`. The old header tree remains exported and internally connected.                                           |
| CROSS:T1 — mobile checks absent from release gate           | **CONFIRMED**                       | root `test:unit` excludes mobile; `verify` never invokes mobile `test`, `test:e2e-fence` or Playwright.                                                                    |
| VAL:D13 — rules response mismatch                           | **CONFIRMED**                       | contract expects `{ ok: true }`; `AuthService.acceptRules()` returns `AuthResponse`; api-client now parses with the incompatible response schema.                          |
| M-LOGIC-01 / CROSS:B3 — no mobile cabinet                   | **CONFIRMED**                       | API/client expose cabinet and hide/unhide; `apps/mobile/src/app` has no cabinet route and mobile has no caller.                                                            |
| M-LOGIC-03 — stale authenticated UI after 401               | **CONFIRMED**                       | `AuthProvider` owns session state; Query/Mutation caches only log errors and cannot call `clearSession()`.                                                                 |
| M-LOGIC-04 — protected deep link is lost                    | **CONFIRMED**                       | `ProtectedRoute()` redirects to `/login` without `redirectTo`; auth pages already support safe redirects.                                                                  |
| M-LOGIC-05 — application steps live only in memory          | **CONFIRMED**                       | `SellerProfileScreen()` advances local `profileStep`; create mutation runs only on step 3.                                                                                 |
| M-LOGIC-02 / 06 / 13 — editor persistence/hydration         | **CONFIRMED**                       | Work editor still mirrors server data into many `useState`s, submit does not save dirty fields, and close-safe persistence is absent.                                      |
| M-LOGIC-07 / CROSS:G3 — sale/delivery fields in Work editor | **CONFIRMED**                       | `product-draft-screen.tsx :: input()` still sends `packaging` and `deliveryInfo`; current RFC excludes sale/delivery from portfolio creation.                              |
| CROSS:B4 / LOGIC:BL-03 — email verification gate            | **CONFIRMED**                       | OTP updates `User.emailVerifiedAt`; seller/product write paths do not require it. No mobile verification route exists.                                                     |
| LOGIC:BL-07 — duplicate application submit endpoints        | **CONFIRMED**                       | both `/api/author/application/submit` and `/api/seller/profile/submit` call the same domain operation.                                                                     |
| LOGIC:BL-10 — admin reads in controller                     | **CONFIRMED**                       | `apps/api/src/admin/admin.controller.ts` contains Prisma selects, filtering and projection logic.                                                                          |
| CROSS:T7 — stale architecture/status references             | **CONFIRMED, broader**              | current owner docs describe commerce modules and tests absent from the current source tree and `AppModule`.                                                                |

## Current high-value findings

### CUR-01 / Rules acceptance contract is executable but incompatible

**CONFIRMED · P1**

Evidence:

- `packages/contracts/src/rules.ts :: acceptRulesResponseSchema`
- `apps/api/src/auth/auth.service.ts :: acceptRules()`
- `packages/api-client/src/auth.ts :: acceptRules()`

Finding: server returns `{ user }` while the client parses `{ ok: true }`. Any live call fails as `unexpected_response` after the server has already persisted acceptance.

Impact: correctness / legal UX.  
Suggested direction: choose one response shape and enforce it in service, controller and client.  
Related old findings: VAL:D13.

### CUR-01A / Pending Work revision remains writable

**CONFIRMED · P1**

Evidence:

- `apps/api/src/products/products.service.ts :: update()`
- `apps/api/src/products/product-revision-state.ts :: canAuthorEditRevision()`

Finding: the published-product branch locks the Product row and then updates `editingRevisionId` without checking its status. An author can PATCH a revision after submitting it for moderation; the tested helper has no production caller.

Impact: correctness / moderation integrity.  
Suggested direction: apply the revision-state guard inside the locked transaction and add a service/integration regression test.  
Related old findings: LOGIC:BL-01, BL-14.

### CUR-02 / Author completion loop has no mobile cabinet

**CONFIRMED · P0 for author MVP**

Evidence:

- `apps/api/src/portfolio/portfolio.service.ts :: listCabinetWorks()`
- `packages/api-client/src/portfolio.ts :: listCabinetWorks(), hideWork(), unhideWork()`
- `apps/mobile/src/app :: route inventory`

Finding: approved authors can create by direct route, but cannot discover their drafts, moderation states, reasons or hide/unhide controls through mobile navigation.

Impact: correctness / UX.  
Suggested direction: target a bounded cabinet review using existing contracts before changing backend APIs.  
Related old findings: M-LOGIC-01, CROSS:B3.

### CUR-03 / Work review can submit stale persisted values

**CONFIRMED · P0**

Evidence:

- `apps/mobile/src/features/sellers/product-draft-screen.tsx :: input(), save, submit`
- `apps/mobile/src/features/sellers/product-draft-screen.tsx :: ProductDraftReviewStep`

Finding: `submit` calls only the submit endpoint. Dirty title/story/details in local state are not persisted first, while review combines query and local values.

Impact: correctness / data loss.  
Suggested direction: one form owner with explicit save-before-submit and query-backed review.  
Related old findings: M-LOGIC-02, M-LOGIC-13.

### CUR-04 / Auth session and server cache have separate owners

**CONFIRMED · P1**

Evidence:

- `apps/mobile/src/providers/auth-provider.tsx :: AuthProvider()`
- `apps/mobile/src/lib/query-client.ts :: createAppQueryClient()`

Finding: `/me` lives in local context state; global Query/Mutation errors only log. A revoked or expired session can leave protected UI authenticated after a mutation returns 401.

Impact: correctness / UX / security posture.  
Suggested direction: make `/me` a query-owned resource and centralize unauthorized cache/session recovery.  
Related old findings: M-LOGIC-03.

### CUR-05 / Current docs do not describe the current backend assembly

**CONFIRMED · P1 release evidence**

Evidence:

- `apps/api/src/app.module.ts :: AppModule`
- `docs/product/05-MVP-RFC.md :: commerce runtime statement`
- `docs/product/11-PROJECT-STATUS.md :: historical commerce sections`

Finding: the RFC says commerce remains fail-closed, but current runtime assembly contains no listings, bids, orders, lifecycle or realtime modules. The status file mixes current portfolio entries with older implemented claims.

Impact: maintainability / release confidence.  
Suggested direction: run a documentation/runtime reconciliation without inferring a new product decision.  
Related old findings: CROSS:T7, LOGIC:BL-11.

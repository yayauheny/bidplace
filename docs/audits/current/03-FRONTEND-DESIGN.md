# Frontend and design delta

## 2026-09-24 status note

The historical findings below are an index, not a current release verdict.
The current branch includes the author cabinet, server-resumable onboarding,
RHF Work editing and React Query session recovery. Revalidate any remaining
finding against those paths before scheduling UI cleanup.

### FE-01 / Two active component generations remain

**CONFIRMED · P2**

Evidence:

- `apps/mobile/src/components/figma :: FigmaButton, FigmaTextField, FigmaTabs`
- `apps/mobile/src/components/ui :: Button, TextField, PageHeader`

Finding: current screens mix the final Figma family with the older UI family. Equivalent roles have separate APIs, style helpers and tests, increasing visual drift and review cost.

Impact: maintainability / UX.  
Suggested direction: map live consumers by semantic role, choose one production master per role, then remove only unreachable variants.  
Related old findings: DS-01, DS-02, DS-04.

### FE-02 / Legacy header/navigation tree is unreachable

**CONFIRMED · P2**

Evidence:

- `apps/mobile/src/components/layout/AppHeader.tsx :: AppHeader()`
- `apps/mobile/src/components/layout/AppShell.tsx :: AppShell()`
- `apps/mobile/src/components/layout/index.ts :: exports`

Finding: AppShell mounts the floating dock and no route mounts AppHeader. AccountMenu, DiscoveryMenu, HeaderSearch, MobileHeader and related layout helpers survive through internal imports and tests only.

Impact: dead-code / maintainability.  
Suggested direction: a removal review should first separate any reusable redirect/accessibility helpers from the dead render tree.  
Related old findings: M-LOGIC-11, DS-03.

### FE-03 / Public author performs duplicate work queries

**CONFIRMED · P2**

Evidence:

- `apps/mobile/src/features/sellers/public-seller-screen.tsx :: PublicSellerScreen()`
- `apps/mobile/src/features/sellers/use-author-works.ts :: useAuthorWorks()`

Finding: the unfiltered query always runs; selecting a category enables a second infinite query. Category and About tab are not URL state.

Impact: performance / UX / maintainability.  
Suggested direction: one query keyed by URL-owned sort/category; defer tab URL only if the product decision remains open.  
Related old findings: M-LOGIC-09.

### FE-04 / Categories have two cache identities

**CONFIRMED · P2**

Evidence:

- `apps/mobile/src/lib/query-cache.ts :: productKeys.categories`
- `apps/mobile/src/features/sellers/product-draft-screen.tsx :: categories query`
- `apps/mobile/src/features/search/panes/CategoriesSearchPane.tsx :: categories query`

Finding: the same endpoint is cached as both `['categories']` and `['products','categories']`; `productKeys.categories` does not cover all live consumers.

Impact: performance / maintainability.  
Suggested direction: use one exported key/factory across all consumers.  
Related old findings: M-LOGIC-08.

### FE-05 / Work wizard reimplements form state already supplied by installed tools

**CONFIRMED · P1**

Evidence:

- `apps/mobile/src/features/sellers/product-draft-screen.tsx :: ProductDraftScreen()`
- `apps/mobile/package.json :: react-hook-form, @hookform/resolvers, zod`

Finding: 15+ field states, hydration sentinels and manual validation recreate dirty/reset/submission behavior. This causes the stale-submit and refetch-overwrite risks.

Impact: correctness / maintainability.  
Suggested direction: use the existing RHF + contract-derived Zod pattern, with query data as persisted truth.  
Related old findings: VAL:D8, M-LOGIC-02, M-LOGIC-13.

### FE-06 / Application wizard is volatile

**CONFIRMED · P1**

Evidence:

- `apps/mobile/src/features/sellers/seller-profile-screen.tsx :: SellerProfileScreen()`
- `apps/mobile/src/features/sellers/seller-profile-steps.tsx :: SellerProfileCreationStepSelector`

Finding: step and fields are local; only step 3 creates the profile. Reload, close or browser Back before creation loses earlier input.

Impact: correctness / UX.  
Suggested direction: review server draft semantics first, then URL-own the step and persist each completed boundary.  
Related old findings: M-LOGIC-05, CROSS:G1.

### FE-07 / Protected redirects discard the destination

**CONFIRMED · P1**

Evidence:

- `apps/mobile/src/components/shared/protected-route.tsx :: ProtectedRoute()`
- `apps/mobile/src/features/auth/auth-form.tsx :: LoginForm()`

Finding: ProtectedRoute sends guests to `/login` without a return URL although auth forms and `getSafeRedirect` already support it.

Impact: UX.  
Suggested direction: construct the current local pathname/search as the existing safe `redirectTo`.  
Related old findings: M-LOGIC-04.

### FE-08 / Search overlay is cleaner but intentionally incomplete

**CONFIRMED · P2 product completeness**

Evidence:

- `apps/mobile/src/features/search/SearchOverlay.tsx :: SearchOverlay()`
- `apps/mobile/src/features/search/panes/WorksSearchPane.tsx :: WorksSearchPane()`
- `docs/product/11-PROJECT-STATUS.md :: fullscreen search entry`

Finding: URL-owned overlay state, debounce, focus trap and pane errors replace several historical search defects. Works/authors hooks are infinite queries, but the overlay exposes no next-page action and therefore shows only loaded first pages.

Impact: UX.  
Suggested direction: decide whether MVP search is preview or complete results, then add navigation or pagination without duplicating search logic.  
Related old findings: UX-02, UX-05.

### FE-09 / Design token layer is healthy but aliases hide migration state

**CONFIRMED · P3**

Evidence:

- `packages/design-tokens/src/tokens.ts :: designTokens, figmaTokens`
- `apps/mobile/src/components/figma/*`

Finding: `figmaTokens` is a full alias of `designTokens`; both names appear as if they were independent systems. Most geometry is tokenized, with a small number of local component-specific constants.

Impact: maintainability.  
Suggested direction: document the alias as transitional or converge naming when component consolidation is scheduled.  
Related old findings: DS-01.

### FE-10 / Generic UI exports contain likely dead primitives

**CONFIRMED for reachability · P3**

Evidence:

- `apps/mobile/src/components/ui/index.ts :: exports`
- `AmbientImageBackground.tsx`, `EditorialSection.tsx`, `ProductGallery.tsx`, `Skeleton.tsx`

Finding: these primitives have no production importer outside their barrel; similarly, `portfolio-work-adapter` is test-only. Keeping them exported makes dead code appear supported.

Impact: dead-code / maintainability.  
Suggested direction: validate dynamic/import-barrel consumers with typecheck, then remove as one bounded cleanup.  
Related old findings: DS-15, M-LOGIC-11.

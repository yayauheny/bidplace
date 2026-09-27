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

**RESOLVED · 2026-09-26**

Evidence:

- `apps/mobile/src/components/layout/index.ts :: exports`
- `apps/mobile/src/components/layout/AppShell.tsx :: AppShell()`
- `apps/mobile/src/components/figma/FloatingDock.tsx :: FloatingDock()`

Finding: the unreachable AppHeader render tree and its tree-only helpers/tests were removed. AppShell, FloatingDock, BrandLogo, OverlayHost, focus/overlay helpers and `getMobileCreateHref` remain live.

Impact: resolved dead-code / maintainability.
Suggested direction: preserve the retained shared layout infrastructure.
Related old findings: M-LOGIC-11, DS-03.

### FE-03 / Public author query ownership

**RESOLVED · 2026-09-26**

Evidence:

- `apps/mobile/src/features/sellers/use-author-works.ts :: useAuthorWorks()`
- `apps/mobile/src/app/(public)/seller/[slug].tsx :: PublicSellerRoute()`

Finding: one infinite query owns the Author header, Works, category and pagination. A valid `category` is URL-owned; malformed values are omitted before the API call. About remains local UI state under the current product decision.

Impact: resolved performance / UX / maintainability.
Suggested direction: retain the single-owner boundary for later Author query work.
Related old findings: M-LOGIC-09.

### FE-04 / Category cache identity

**RESOLVED · 2026-09-26**

Evidence:

- `apps/mobile/src/lib/query-cache.ts :: categoryKeys.all`
- `apps/mobile/src/features/products/product-list-screen.tsx :: categories query`
- `apps/mobile/src/features/sellers/product-draft-screen.tsx :: categories query`
- `apps/mobile/src/features/sellers/public-seller-screen.tsx :: categories query`
- `apps/mobile/src/features/search/panes/CategoriesSearchPane.tsx :: categories query`

Finding: every live mobile consumer of `api.categories.list()` now uses the exported `categoryKeys.all` identity.

Impact: resolved performance / maintainability.
Suggested direction: add future category consumers to this key.
Related old findings: M-LOGIC-08.

### FE-05 / Work wizard form ownership

**RESOLVED · 2026-09-26**

Evidence:

- `apps/mobile/src/features/sellers/product-draft-screen.tsx :: ProductDraftScreen()`
- `apps/mobile/package.json :: react-hook-form, @hookform/resolvers, zod`

Finding: the current Work editor uses RHF for current edits and persisted revision timestamps for hydration; the historical local-state finding no longer describes release behavior.

Impact: resolved correctness / maintainability.
Suggested direction: retain RHF and query ownership in future editor changes.
Related old findings: VAL:D8, M-LOGIC-02, M-LOGIC-13.

### FE-06 / Application wizard persistence

**RESOLVED · 2026-09-26**

Evidence:

- `apps/mobile/src/features/sellers/seller-profile-screen.tsx :: SellerProfileScreen()`
- `apps/mobile/src/features/sellers/seller-profile-steps.tsx :: SellerProfileCreationStepSelector`

Finding: onboarding stages and resume boundaries are server-owned; URL steps and persisted draft transitions replace the historical volatile flow.

Impact: resolved correctness / UX.
Suggested direction: preserve guarded server advancement.
Related old findings: M-LOGIC-05, CROSS:G1.

### FE-07 / Protected redirect destination

**RESOLVED · 2026-09-26**

Evidence:

- `apps/mobile/src/components/shared/protected-route.tsx :: ProtectedRoute()`
- `apps/mobile/src/features/auth/auth-form.tsx :: LoginForm()`

Finding: protected routes retain a safe internal destination and authentication consumes it through the existing redirect helper.

Impact: resolved UX.
Suggested direction: retain safe redirect normalization for new protected routes.
Related old findings: M-LOGIC-04.

### FE-08 / Search overlay pagination

**RESOLVED · 2026-09-26**

Evidence:

- `apps/mobile/src/features/search/SearchOverlay.tsx :: SearchOverlay()`
- `apps/mobile/src/features/search/panes/WorksSearchPane.tsx :: WorksSearchPane()`
- `docs/product/11-PROJECT-STATUS.md :: fullscreen search entry`

Finding: Works and Authors search panes expose `Показать ещё` only while their existing infinite query has a next page. Loaded rows remain visible while the next page is fetched.

Impact: resolved UX.
Suggested direction: keep the explicit pagination model; no infinite-scroll behavior is introduced.
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

**RESOLVED · 2026-09-26**

Evidence:

- `apps/mobile/src/components/ui/index.ts :: exports`
- `AmbientImageBackground.tsx`, `EditorialSection.tsx`, `ProductGallery.tsx`, `Skeleton.tsx` (removed)
- `apps/mobile/src/features/products/portfolio-work-adapter.ts` (removed)

Finding: unreachable generic UI primitives and the test-only portfolio adapter were removed with their barrel exports and mirror tests.

Impact: resolved dead-code / maintainability.
Suggested direction: revalidate reachability before adding any replacement primitive.
Related old findings: DS-15, M-LOGIC-11.

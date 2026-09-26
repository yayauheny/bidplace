# Backend architecture delta

## 2026-09-24 status note

The current release baseline includes the locked canonical Work revision write
path and server-owned author-application stages. Production configuration fails
closed for S3, and Compose forwards the complete S3 configuration. This document
retains unresolved architecture candidates only; revalidate older sections before
using them as implementation prompts.

### BE-01 / Product revision writes gained row locking but still miss the state guard

**PARTIAL · P1**

Evidence:

- `apps/api/src/products/product-write-guard.ts :: lockProductRowForUpdate()`
- `apps/api/src/products/products.service.ts :: update(), submit()`

Finding: Product row locking and conditional writes improve concurrency. The published-product update branch still writes the editing revision without checking `canAuthorEditRevision()`, so a submitted revision remains mutable.

Impact: correctness / concurrency.  
Suggested direction: retain the row lock, enforce the revision state inside it, and cover PATCH during `PENDING_REVIEW`.  
Related old findings: LOGIC:BL-01, BL-14.

### BE-02 / Seller revision fork now locks profile and revision rows

**RESOLVED historical risk · HIGH confidence**

Evidence:

- `apps/api/src/sellers/seller-profile-revision-lock.ts`
- `apps/api/src/sellers/ensure-editable-seller-profile-revision.ts :: ensureEditableEditingRevision()`

Finding: approved profile editing serializes revision creation and locks the active editing revision.

Impact: correctness / concurrency.  
Suggested direction: retain; review only call sites that bypass this helper.  
Related old findings: LOGIC:BL-12.

### BE-03 / Email verification is an Author-write invariant

**RESOLVED in code · HIGH confidence**

Evidence:

- `apps/api/src/auth/verified-email.guard.ts :: VerifiedEmailGuard`
- `apps/api/src/{sellers,products,images,portfolio}/*controller.ts :: Author write routes`

Finding: the shared guard reads `User.emailVerifiedAt` after Bearer authentication
and blocks Author/profile, Work, image, and achievement mutations with 403.

Impact: security / product contract.
Suggested direction: retain HTTP integration coverage and prove SMTP delivery separately.
Related old findings: LOGIC:BL-03, CROSS:B4, CROSS:T2.

### BE-04 / Application submit has two public routes

**CONFIRMED · P2**

Evidence:

- `apps/api/src/portfolio/portfolio.controller.ts :: submitApplication()`
- `apps/api/src/sellers/sellers.controller.ts :: submitProfileRevision()`

Finding: two URLs expose the same transition and can drift in guards, rate limits, docs and clients.

Impact: maintainability / API consistency.  
Suggested direction: select one canonical route; keep an explicit compatibility adapter only if a real consumer requires it.  
Related old findings: LOGIC:BL-07.

### BE-05 / Portfolio cabinet performs N+1 owner-detail reads

**CONFIRMED · P2**

Evidence:

- `apps/api/src/portfolio/portfolio.service.ts :: listCabinetWorks()`
- `apps/api/src/sellers/sellers.service.ts :: listProducts(), getProduct()`

Finding: cabinet lists products, then calls `getProduct` once per item only to obtain moderation reason. Cost grows linearly and the endpoint has no pagination.

Impact: performance / maintainability.  
Suggested direction: project the required owner fields, including current moderation reason, in one bounded query.  
Related old findings: LOGIC:BL-02, BL-10.

### BE-06 / Admin controller persistence projections

**RESOLVED · verified 2026-09-26**

Evidence:

- `apps/api/src/admin/admin.controller.ts :: listSellers(), listProducts(), updateProduct()`
- `apps/api/src/admin/admin-moderation.service.ts :: listSellerProfiles(), listProducts(), updateProductStatusAndReadback()`
- `apps/api/src/admin/admin-moderation.service.spec.ts :: projects non-draft sellers..., projects product moderation context..., returns the canonical product response...`

Finding: HTTP handlers delegate all moderation persistence projections and product-status readback to the existing moderation service. The controller has no Prisma dependency; the service retains batched listing/reason queries and reads the canonical product response after its transaction commits.

Impact: maintainability / testability.  
Suggested direction: retain the service boundary; keep contracts and moderation transition rules covered at this seam.
Related old findings: LOGIC:BL-10.

### BE-07 / Work creation retains commerce/process fields outside current RFC

**CONFIRMED code; product action NEEDS_REVIEW · P1**

Evidence:

- `packages/contracts/src/product.ts :: productWriteRequestSchema`
- `apps/api/src/products/products.service.ts :: update(), replaceCreation()`
- `docs/product/05-MVP-RFC.md :: Work creation and public Work`

Finding: packaging, delivery information and multi-step creation media remain writable; the current RFC describes a smaller portfolio editor and excludes sale/delivery. These columns may still be retained migration data, so schema deletion is not implied.

Impact: product consistency / maintainability.  
Suggested direction: decide HTTP/UI support separately from database retention; do not drop data without inventory.  
Related old findings: LOGIC:BL-11, M-LOGIC-07, VAL:D14.

### BE-08 / Query parsing uses body semantics and naming

**CONFIRMED · P3**

Evidence:

- `apps/api/src/portfolio/portfolio.controller.ts :: listWorks(), listAuthors(), getAuthor()`
- `apps/api/src/core/validation :: parseBody(), parseQuery()`

Finding: portfolio query objects are passed through `parseBody` while admin uses `parseQuery`. Even if both currently delegate to Zod similarly, this obscures the transport boundary and error semantics.

Impact: maintainability / validation consistency.  
Suggested direction: use the query parser for query inputs and keep one error mapping.  
Related old findings: VAL:D12.

### BE-09 / Route parameters rely on service/database failure shapes

**NEEDS_REVIEW · P3**

Evidence:

- `apps/api/src/products/products.controller.ts :: @Param('id')`
- `apps/api/src/images/images.controller.ts :: productId, stepId, imageId params`

Finding: UUID-like params are forwarded as strings. Several code paths interpolate them as PostgreSQL UUIDs, so malformed values may surface as infrastructure errors rather than stable 4xx responses.

Impact: correctness / API consistency.  
Suggested direction: probe representative malformed params over HTTP before adding broad validation.  
Related old findings: validation audit hypotheses.

### BE-10 / Commerce data remains while commerce runtime is unassembled

**CONFIRMED · P1 documentation/ops**

Evidence:

- `packages/database/prisma/schema.prisma :: Listing, Bid, Order models`
- `apps/api/src/app.module.ts :: imports`
- `scripts/ops/commerce-inventory.mjs`

Finding: retained data and inventory tooling exist, but API runtime modules/routes do not. This may be deliberate preservation, yet current RFC wording says runtime is preserved fail-closed.

Impact: architecture clarity / operations.  
Suggested direction: record the exact retained-data versus executable-runtime boundary in architecture/status docs.  
Related old findings: DATA:D13, LOGIC:BL-11, CROSS:T7.

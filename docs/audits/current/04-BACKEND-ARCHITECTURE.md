# Backend architecture delta

## 2026-09-24 status note

The current release baseline includes the locked canonical Work revision write
path and server-owned author-application stages. Production configuration fails
closed for S3, and Compose forwards the complete S3 configuration. This document
retains unresolved architecture candidates only; revalidate older sections before
using them as implementation prompts.

### BE-01 / Product revision writes enforce editing state

**RESOLVED · verified 2026-09-26**

Evidence:

- `apps/api/src/products/products.service.ts :: update()`
- `apps/api/src/products/product-write-guard.ts :: lockProductRowForUpdate()`
- `apps/api/src/products/product-revision-state.ts :: canAuthorEditRevision()`
- `apps/api/test/integration/product-write-atomicity.integration.spec.ts`

Finding: Product writes lock the row and check the active revision's author-editable state before updating parent or revision fields. Submitted `PENDING_REVIEW` revisions are not writable.

Impact: correctness / concurrency.  
Suggested direction: retain the lock and state check.
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

### BE-04 / Author application submission has one public route

**RESOLVED · verified 2026-09-26**

Evidence:

- `apps/api/src/portfolio/portfolio.controller.ts :: submitApplication()`
- `apps/api/src/portfolio/portfolio.service.ts :: submitApplication()`
- `apps/api/src/sellers/sellers.service.ts :: submitProfileRevision()`

Finding: `POST /api/author/application/submit` is the sole public route. It retains the verified-email guard and delegates to the existing Seller service transition; the former Seller HTTP duplicate is absent.

Impact: maintainability / API consistency.  
Suggested direction: retain the one-route, one-transition boundary.
Related old findings: LOGIC:BL-07.

### BE-05 / Portfolio cabinet uses bounded owner projections

**RESOLVED · verified 2026-09-26**

Evidence:

- `apps/api/src/portfolio/portfolio.service.ts :: listCabinetWorks()`
- `apps/api/test/integration/author-cabinet.integration.spec.ts`

Finding: the cabinet pages ordered product IDs and moderation reason in one bounded query, then loads the page projection in one batched product query. It does not call owner Work detail once per card.

Impact: performance / maintainability.  
Suggested direction: retain page bounds and batched projection.
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

### BE-08 / Portfolio GET queries use query validation

**RESOLVED · verified 2026-09-26**

Evidence:

- `apps/api/src/portfolio/portfolio.controller.ts :: listWorks(), listAuthors(), getAuthor()`
- `apps/api/src/core/validation :: parseQuery()`
- `apps/api/test/integration/portfolio-route-surface.integration.spec.ts`

Finding: public Portfolio GET inputs pass through `parseQuery`. Valid filters retain their response shape and invalid queries retain the structured 400 validation error.

Impact: maintainability / validation consistency.  
Suggested direction: retain the transport-specific parser.
Related old findings: VAL:D12.

### BE-09 / Active UUID-backed routes validate parameters at the boundary

**RESOLVED for current Portfolio/Work runtime · verified 2026-09-26**

Evidence:

- `apps/api/src/{products,images,sellers,portfolio}/*controller.ts :: ParseUUIDPipe`
- `apps/api/test/integration/uuid-params.integration.spec.ts`

Finding: before validation, malformed Product, image, creation-step, owner Work and achievement IDs returned 500 through raw UUID casts or Prisma. The current active routes reject malformed UUIDv4 values with 400 and retain 404 for valid unknown IDs.

Impact: correctness / API consistency.  
Suggested direction: use the same explicit boundary validation for future UUID-backed Portfolio/Work routes.
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

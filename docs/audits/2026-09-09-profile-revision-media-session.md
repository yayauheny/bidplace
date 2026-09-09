# Session audit — profile revision media and review-hole closure

Date: 2026-09-09
Branch: `feature/profile-revision-media` (uncommitted until this commit)
Product contract: [`docs/product/05-MVP-RFC.md`](../product/05-MVP-RFC.md) — not rewritten
Visual contract: `design/pen/bidplace-web-v2.pen` — not in the diff
Verify: `pnpm verify` passed (typecheck 7/7, lint 2/2, API unit 381/381, contracts 30/30, integration 89/89, build 7/7)

This file is the session retrospective for the whole uncommitted slice: unfinished published-revision / media / commerce-read work, the visitor data-source cutover on existing URLs, then review findings and the fixes that closed them. It does not replace [`00-CURRENT-MVP-READINESS.md`](00-CURRENT-MVP-READINESS.md).

## Scope and boundary

- In: public = published revision; owner/admin = editing revision; fail-closed commerce reads; owner cabinet on editing revision; visitor Work/Author on existing `/product` and `/seller` routes; MinIO/local S3 docs; tests and status docs.
- Out: package 07 Figma/tokens/`.pen` cutover; commerce-wave restoration of listing chrome; production S3/SMTP/hosting; Belarus lawyer pack; staging.

Residual product risk, recorded on purpose: if `COMMERCE_ENABLED` later becomes true, `/product/[publicId]` and `/seller/[slug]` stay on portfolio APIs until a separate commerce-wave task. Lots will not reappear by flipping the flag.

## 1. Unfinished parts that this slice completed

These were the open P0–P2 holes before visual/package-07 work: public JSON still mixed live Product rows, commerce catalog still answered, hide was incomplete, revision media had no object-key columns, visitor lists already called portfolio APIs but detail routes still 404'd.

| Gap | Durable fix | Evidence |
|---|---|---|
| Public Work JSON/bytes were live rows | Public catalog/detail and `GET /api/images/:id` use `publishedRevision` / `product_revision_images`. Cover is position `0`. Owner `PATCH`/gallery on `APPROVED`/`ARCHIVED` forks the editing revision first. First approval sets `publishedAt` when missing. | `apps/api/src/products/products.service.ts`, `product-revision-write.ts`, `images.service.ts` |
| Author could not hide a published Work | `POST /api/products/:id/hide` and `/unhide` (`APPROVED` ↔ `ARCHIVED`). Both require `publishedRevisionId`. | `products.controller.ts`, `products.service.ts` |
| Commerce catalog still returned DTOs | `CommerceEnabledGuard` on `GET /api/products`, `GET /api/products/:publicId`, `GET /api/discovery/home`. Default `COMMERCE_ENABLED=false`. Author writes stay open. | `products.controller.ts`, `discovery.controller.ts`, `commerce-disabled-reads.integration.spec.ts` |
| Profile/achievement pending media had no key | Migration adds revision photo columns; keys `seller-profile-revision:{id}` and `seller-achievement:{id}`. First application photo stays `seller-photo:{profileId}`. | `packages/database/prisma/migrations/20260909010000_add_profile_revision_media/` |
| Local object store missing | Compose MinIO `9000`/`9001`, bucket `bidplace-media`; `.env.example` documents stub S3. Postgres `get` of revision/achievement keys is `null`; `put`/`delete` throw `RevisionMediaStorageError` → HTTP 503. | `docker-compose.yml`, `postgres-image-store.ts` |
| Cabinet listed works expensively | `GET /api/author/cabinet/works` loads products plus one `auditEvent.findMany`. | `portfolio.service.ts` |
| Share URLs undefined | Public DTOs expose relative `sharePath` `/works/{publicId}` and `/authors/{slug}`. | `packages/contracts/src/portfolio.ts` |
| Home/Search/Works/Authors still on commerce lists | Those screens already call `api.portfolio.*`. | `home-screen.tsx`, `search-screen.tsx`, `product-list-screen.tsx`, `public-authors-screen.tsx` |

## 2. Visitor data-source cutover (not a visual redesign)

Package 07 / Pen / tokens were not started. Existing in-app URLs were kept. Commerce chrome is hidden, not replaced with price/timer stubs.

| Surface | After this slice |
|---|---|
| `/product/[publicId]` | `api.portfolio.getWork`; related works from the same payload; no bids/activity; no `AuctionPlayer` / `SlideToBid` / bid and creation tabs |
| `/seller/[slug]` | `api.portfolio.getAuthor`; cards via `toAuctionCardItem`; no listing status tabs or price sort |
| `/works` catalog | RFC filters only: `q`, category, materials, newest/oldest |
| `/works/[publicId]`, `/authors/[slug]` | Redirect-only aliases so RFC `sharePath` / QR do not 404 |
| In-app share URL | Still `/product/...` (canonical in-app route) |

Adapter/query helpers: `portfolio-work-adapter.ts`, `portfolio-works-query.ts`, `auction-card-item.ts`.

## 3. Review-hole closure

Code review found fail-closed leaks, owner seeing live copy instead of editing revision, visitor 404s on the routes cards already used, and storage/authz 500s.

### API fail-closed and projection consistency

- `CommerceEnabledGuard` also on `GET /api/sellers`, `GET /api/sellers/:slug/detail`, `GET /api/me/activity`.
- City/title/gallery/`published_at` moved into `publicProductContentSql` and Prisma `city: { not: '' }`. Empty/whitespace city omits the author (no 500). Pagination `total` matches SQL, not a silent mapper drop.
- `toPublicProduct` uses `publishedImages ?? []`, never live `product.images`.
- Hide uses the same `publishedRevisionId` guard as unhide.
- Empty `PATCH` on an approved Work does not fork an editing revision.
- Submit requires `socialLink`. `SUSPENDED` cannot add/delete achievements (403). First-application `REJECTED` can `PATCH`.
- Object delete after commit in `ImagesService.remove` and `deleteAchievement`: row commit first; S3 delete failure is logged, not rolled back.
- Shared `acceptSupportedUploadMimeType`; rate limits on seller profile POST/PATCH and achievement DELETE.

### Owner profile = editing revision

- Owner `GET /api/seller/profile` and `PATCH` overlay public fields from the editing revision; live `status` stays.
- Contract field `editingRevision: { id, version, status } \| null`.
- `GET /api/author/application` uses the same overlay.
- Cabinet: editable if no profile, or `CHANGES_REQUESTED`, or `APPROVED`/`REJECTED` with revision `DRAFT`/`CHANGES_REQUESTED`/`REJECTED`.
- After save on approved: submit via `submitAuthorApplication`.
- City required in `getProfileFieldErrors` / `canContinueFromAbout`.
- Pending photo preview: authenticated `GET /api/author/application/photo` (`requestBlob`), not public `/sellers/:slug/photo`.

## 4. Findings and the fixes that followed

Discovered while implementing and while running unit/integration/`pnpm verify`. None were papered over with `any` / `@ts-ignore` / silent catches.

| Finding | Why it mattered | Fix |
|---|---|---|
| `@bidplace/contracts` is consumed from `dist`; source `editingRevision` was invisible to API Zod | Owner mapper threw `unrecognized_keys` | Rebuild contracts; keep `editingRevision` on `sellerProfileResponseSchema` |
| `toPublicProduct` with empty published gallery failed `publicProductSchema.images.nonempty()` in `getPublic` tests | Tests still fed live `product.images` | Unit test allows `images: []` on the mapper; HTTP public mocks include published gallery; SQL already requires images |
| Empty approved PATCH called `toProductResponse` on a write-guard row without `createdAt` | 500 on no-op save | Return `productSelect` unchanged; test uses `responseProduct: approvedProduct` |
| Create-profile mock used `editingRevision.id = 'revision-id'` | Zod uuid fail after the new field | Valid UUID in the persist test |
| `const listing = null` left bid/player code typed as `never` | Mobile typecheck failed | Strip unused bid/player/tabs chrome from `product-screen.tsx` instead of keeping dead listing machinery |
| Adapter spec imported `toAuctionCardItem` from TSX | Vitest `SyntaxError: Unexpected token 'typeof'` | Move mapper to `auction-card-item.ts` |
| Bids/realtime specs expected `sellerProfile: { status: 'APPROVED' }` only | `publicListingWhere` now requires non-empty city | Assert `...publicListingWhere(...)` |
| Achievement PNG upload and approved profile photo PATCH returned 503 on Postgres | Revision keys cannot be stored in BYTEA; that is fail-closed, not a 500 | Integration expects GIF → 400, PNG image → 503, text achievement → 201 + cross-user DELETE 404; photo PATCH with bytes → 503; text PATCH → 200; guest public photo unchanged |
| Seller pagination integration had `total: 0` | SQL now requires trimmed author city and `published_at` | Fixture sets `city: 'Minsk'` and `publishedAt` |
| Owner pending photo on Postgres is 404 | `get` of revision keys returns null until S3 | Documented `Partial`; guest public photo stays on the published object key |

## 5. Tests added or extended

API unit: hide/unhide other user; hide without `publishedRevisionId`; empty PATCH no fork; blank city omitted; `toPublicProduct` empty gallery; submit without `socialLink`; `SUSPENDED` achievements; `REJECTED` PATCH; Postgres get → null / put typed error; MIME helper.

HTTP integration: commerce-disabled 404 on `/products`, `/products/:id`, `/discovery/home`, `/sellers`, `/sellers/:slug/detail`, `/me/activity` and 200 on `/works`, `/works/:id`, `/authors`, `/authors/:slug`; hide then guest image 404; author without listing on `GET /authors/:slug`; MIME/503/cross-user DELETE; pending photo does not replace public bytes.

Mobile unit (not in `pnpm test:unit`, run separately): adapter getWork → card; editable matrix; city required; `listWorks` query has no status/price.

## 6. Documentation touched

- [`11-PROJECT-STATUS.md`](../product/11-PROJECT-STATUS.md) — two 2026-09-09 entries (P0–P2 then review-hole), verify counts 381/30/89.
- [`10-CODE-ARCHITECTURE.md`](../product/10-CODE-ARCHITECTURE.md) — extra commerce guards, Postgres get/put, visitor reuse + redirects.
- [`10-EXECUTION-STATE.md`](../tasks/2026-09-08-first-mvp/10-EXECUTION-STATE.md) — checkpoint; next action is review, not package 07.
- [`04-DESIGN-STATUS.md`](../design/04-DESIGN-STATUS.md) — same screens, portfolio data source.
- [`00-RELEASE-AND-BACKUP.md`](../ops/00-RELEASE-AND-BACKUP.md) — local MinIO.
- This file — session retrospective.

RFC and other protected product docs were not changed.

## 7. Still open (not this slice)

1. Package 07 Figma/Pen/token cutover.
2. Commerce-wave: restore listing chrome on `/product` and `/seller` when `COMMERCE_ENABLED=true`.
3. Owner pending photo/achievement bytes on Postgres (503/404 until S3).
4. Backfill existing PostgreSQL `BYTEA` into MinIO (`NoSuchKey` on restore checksum).
5. Production S3/SMTP/hosting, staging, Belarus lawyer review.
6. Owner mobile Work wizard is still the older sale-oriented draft screen (F09).

# bidplace — архитектура кода

Последнее обновление: 2026-09-11
Статус: Confirmed technical boundaries for the portfolio-first MVP implementation.
Transitional note (`DEC-087`): P1–P3, Nest-only contract drop, P5, and the
2026-09-11 review-blocker pass (listing write-guard removed from runtime;
live ingest is `work_viewed`) are in this branch. P4 Prisma `Listing`/`Bid`/`Order`
drops remain blocked on staging/prod inventory. Commerce v1 remains recoverable
from origin `archive/commerce-v1` at SHA `598d869`. GitHub rulesets for those
refs are still the merge gate.

## Applications and shared boundaries

- `apps/api` is the authoritative NestJS HTTP process. Default boot has no
  scheduler and no Socket.IO adapter. Controllers parse shared Zod contracts;
  services own business rules and Prisma transactions.
- First-party product analytics ingest lives in `apps/api/src/analytics` (`POST /api/analytics/events`) and persists `AnalyticsEvent` / `AcquisitionAttribution` without duplicating Bid/Order business facts. Admin aggregates are served by `GET /api/admin/analytics/overview` and rendered in Expo admin `/(admin)/analytics`.
- HTTP requests receive `X-Request-Id` (incoming or generated) for correlation in logs and error responses.
- `apps/api/src/sellers` owns the authenticated seller detail boundary `GET /api/seller/products/:id`; it verifies product ownership before returning the shared detail contract, including persisted creation-story steps, process-photo metadata and the latest non-null product moderation reason. `apps/mobile/src/features/sellers/ProductDraftScreen` hydrates from this owner detail before initializing the editable wizard, including `REJECTED` recovery on the same Product.
- Default `AppModule` composes health, auth, analytics ingest, owner product
  write, owner seller profile + photo, images, admin curator/moderation/users,
  and `PortfolioModule`. Removed listing, bid, order, discovery, activity and
  realtime HTTP is unmatched Nest 404. `COMMERCE_ENABLED` is gone; flipping an
  env flag cannot resurrect commerce modules.
  `apps/api/src/portfolio` is the visitor catalog: `listPortfolio` / `getPortfolio`
  read `publishedRevision` fields and `product_revision_images`.
  Expo public Work/Author screens reuse `/product/[publicId]` and `/seller/[slug]`
  but load `GET /api/works` and `GET /api/authors`; thin Redirect aliases exist
  at `/works/[publicId]` and `/authors/[slug]` for RFC share paths.
- `apps/api/src/portfolio` owns strict portfolio-only Home, Work, Author and author
  application projections. It delegates persistence to Product/Seller services and
  validates all public responses with `packages/contracts`; its DTOs never expose
  commerce fields. Canonical share paths are relative (`/works/{publicId}`,
  `/authors/{slug}`). `socialLink` is optional on create/submit/approval, stored
  nullable, owner/persistence-only, and omitted from portfolio public author DTOs.
  Private handoff stays required on the owner profile and is never public.
- `apps/mobile` is an Expo Router client. React Query holds server state. The
  default client does not open Socket.IO; Nest does not register a gateway.
- `apps/mobile/src/components/layout/AppShell.tsx` owns the phone column
  (`maxWidth: 390`) and `FloatingDock`. Pen `AppHeader` is not on the render path
  (`DEC-085`). Route screens remain responsible for their own scroll/content.
- `packages/design-tokens` exports one Figma-measured `designTokens` map
  (`figmaTokens` is the same object). `apps/mobile/src/components/figma/` is the
  production primitive set. `components/ui` wraps shared masters such as
  `Button` and `ImagePlaceholder`. Public grids call `WorkCoverCard` /
  `WorkCoverCardGrid` directly; there is no `AuctionCard` wrapper and no
  commerce overlay mode on the card. Nest does not compose commerce modules.
- `apps/api/src/images/image-policy.ts` owns binary Cache-Control: private media is `no-store`; public Product images keyed by id are immutable; public seller photos and creation-step images (bytes replaced at a stable URL) use short revalidation.
- `apps/api/src/core/image-store` is the media boundary. PostgreSQL retains media
  metadata, ownership, checksum and deterministic object key. Local/test default
  `PostgresImageStore` stores product, creation-step, first-application seller
  photo (`seller-photo:{profileId}`), revision photo
  (`seller-profile-revision:{id}`) and achievement (`seller-achievement:{id}`)
  bytes in BYTEA columns, keeping mime/length/checksum metadata consistent on
  put. Production still requires `MEDIA_STORAGE_PROVIDER=s3`; S3 atomicity and
  MinIO-as-local-default remain later work.
  Local Compose runs MinIO on `9000`/`9001` with bucket `bidplace-media`.
  Production configuration fails closed without complete S3 settings.
  `scripts/ops/backfill-media-to-s3.mjs` is dry-run by default and validates
  checksums before object writes; restore verification reads sampled objects and
  compares their checksums without logging content or credentials.
- `apps/mobile/src/lib/environment.ts` owns API origin validation and `getApiAssetUrl`, which resolves relative media paths while preserving valid absolute HTTP(S) URLs. Media components own truthful missing/error presentation without changing API visibility rules.
- `apps/mobile/src/components/layout/OverlayHost.tsx` owns the web-only overlay boundary for AppShell descendants. Desktop account dropdowns are portaled into the shared host and positioned from trigger rectangles; ordinary page content keeps the lower semantic layer.
- `apps/mobile/src/components/layout/index.ts` is the shared public barrel for shell/header/overlay primitives and discovery `FilterMenu` (single dismiss + focus-return contract). Pure helpers such as `account-menu-hover.ts`, `header-chrome.ts`, `dismissible-overlay.ts` and `focusable-anchor.ts` stay outside that barrel so Node/Playwright can import them without loading React Native.
- `apps/api/src/products/products.mapper.ts` and `apps/api/src/products/products-catalog.query.ts` own the canonical public catalog selection and CTE/order SQL; `products.service.ts` keeps only use-cases and orchestration.
- `packages/contracts` owns runtime HTTP and event shapes; `packages/api-client`
  validates responses with those schemas. Default `createApiClient` composes
  portfolio, auth, owner product write, owner seller profile, categories,
  images, analytics ingest, and admin moderation/users/curator. Listing, order,
  bid, activity and discovery clients are not in the default composition.
  Nest-only listing/bid/order/activity/discovery Zod modules are deleted.
  Prisma Listing/Order enums stay in `enums.ts` until P4.
- `packages/contracts/src/seller-profile.ts` owns the reusable public-link and handoff-contact validation shapes consumed by both seller write contracts and the profile editor; client-side field feedback does not replace server validation. Public `socialLink`, `telegramUrl`, `instagramUrl` and `websiteUrl` use shared `httpsUrlSchema` and accept only `https:` URLs. `socialLink` is optional/nullable; empty strings are rejected. Telegram/Instagram `@handle` forms stay on the separate handoff schemas.
- `packages/database` owns Prisma schema, forward migrations and deterministic
  local/test seed. As of 2026-09-10 the tree contains **17** migration directories
  through `20260909120000_portfolio_media_socials_curator`; the earlier “single
  unreleased baseline migration” wording below is stale and must be reconciled with
  deployment inventory before schema cleanup. The destructive demo seed may run only
  with `NODE_ENV=development|test`, `APP_ENV=local` and
  `ALLOW_DESTRUCTIVE_DEMO_SEED=true`; production-like profiles fail before writes,
  and an API PostgreSQL integration test verifies the seeded portfolio catalog
  (zero listings/bids/orders).
- `apps/api/src/core/config/env-profile.ts` owns the `NODE_ENV` × `APP_ENV` predicates. `APP_ENV=production` requires `NODE_ENV=production`; `NODE_ENV=production` cannot combine with `APP_ENV=local`. Production SMTP, service rules, password-reset URL, JWT length and test-bypass prohibitions apply when either variable is `production`. Staging keeps its previous requirement shape: production security only when `NODE_ENV=production`.
- Socket.IO and `@nestjs/schedule` are not in the default API process. Listing
  close cron and realtime rooms exist only in the commerce archive.

## Persistence model

```text
SellerProfile
  ├─ SellerProfileRevision[]
  │    └─ SellerProfileRevisionAchievement[] (text/date; optional BYTEA)
  └─ Product
       ├─ ProductRevision[]
       │    └─ ProductRevisionImage[]
       ├─ ProductImage[] (legacy metadata)
       ├─ CuratorSelection? (single home slot pointer)
       └─ Listing[]
            ├─ AuctionRules
            ├─ Bid[]
            └─ Order[]
```

`SellerProfile.socialLink` and `SellerProfileRevision.socialLink` are nullable.
`CuratorSelection` is a unique `slot` (`home`) pointing at one Product; Home
`curatorSelection` is returned only when that Work and author pass public
visibility SQL. Admin `PUT`/`DELETE /api/admin/curator-selection` write the
pointer. Production seed does not create a selection.

`Product` and `Order` use immutable 11-character cryptographically random public IDs; internal writes use UUIDs. MVP has only `ListingType.AUCTION` and currency `BYN`. PostgreSQL enforces one active (`SCHEDULED`/`LIVE`) Listing per Product and one non-cancelled Order per Listing with partial unique indexes.

## Confirmed current MVP implementation boundary

- `APPROVED` SellerProfile is the seller capability; `assertApprovedSeller` is the shared write gate for Product, Listing, image and seller writes, while `AdminModerationService` records append-only audit events for moderation transitions;
- SellerProfile stores public profile data separately from buyer identity. The current implementation keeps the handoff contact private, persists public `discipline` separately from the coarse seller type, requires `fullName` plus a public profile photo on seller application, reopens edits only when moderation returns `CHANGES_REQUESTED` for public and handoff corrections, and snapshots the handoff data into Orders; public seller/catalog views reuse shared visibility predicates and narrow seller selects instead of duplicating checks;
- `Product` is the current persistence name for a Work. `ProductRevision` holds
  mutable public Work content and revision-image membership; a Work points
  to its editing and published revisions. Public JSON and image bytes are always
  the published revision. Owner/admin reads and gallery writes use the editing
  revision. A published Work copies its published revision when the author starts
  a new edit (`ensureAuthorEditingRevision`). The prior revision stays public until
  admin approval atomically sets `publishedRevisionId` and copies published fields
  onto `Product`, including `publishedAt` on first publish. Rejections and requested
  changes apply to the editing revision only; hiding/unhiding is `APPROVED` ↔
  `ARCHIVED` on the Work. `ProductImage.position` is an opaque storage slot;
  `ProductRevisionImage.position` is gallery order (cover is `0`). Object rows are
  deleted only when no revision references them. Work writes lock the Product row
  (`SELECT … FOR UPDATE`) and re-check ownership and seller capability inside a
  Read Committed transaction;
- `SellerProfileRevision` gives approved authors an editing-revision pointer and a
  published-revision pointer. Public portfolio author data and `GET /api/sellers/:slug/photo`
  use the published/live pointer. Owner preview is `GET /api/author/application/photo`
  against the editing revision object key. Author submission requires city, photo,
  fullName, slug, country, bio and discipline. Admin moderation copies photo metadata
  only after approval requirements succeed. `SellerProfileRevisionAchievement` belongs
  to that revision (optional image); unpublished achievement bytes 404 for guests.
  A new profile revision copies the prior published achievement records (including
  media metadata), and the append operation locks the revision row before calculating
  position;
- one own Product image is the MVP technical minimum. Maximum file count and
  aggregate bytes are enforced for the whole Product inside a Read Committed
  transaction that locks the Product row, including repeated/concurrent uploads. Condition is not
  mandatory for creator-made Product; the current optional field is preserved
  until a future item-class decision requires migration;
- persisted entities expose `createdAt` and `updatedAt`; append-only audit records retain immutable business facts;
- buyer accepts a versioned service-rules text in auth; OTP and password-reset deliver mail through shared `MailTransport` (`SmtpMailTransport` on the production security profile, `LocalMailTransport` otherwise) with a test-only OTP bypass that can activate only for `NODE_ENV=test` and `APP_ENV=local`;
- password recovery lives in `apps/api/src/password-reset/`: forgot is neutral and never enumerates accounts; per-IP forgot limits run before user lookup and per-email limits after an active user is found; resend cooldown applies only to unused tokens; reset consumes a hashed single-use token, invalidates sibling tokens, updates `passwordHash` and increments `sessionVersion` atomically; `MailTransport` sends reset links; `core/email/smtp-transport.ts` builds Nodemailer options with single-address recipient guard; production requires `PASSWORD_RESET_URL_BASE` for reset links and local dev may fall back to `resolveCorsOrigin()`;
- Prisma Order handoff snapshots remain until P4; winner-order create helpers are not in default boot.
- admin emergency user controls live in `apps/api/src/admin/admin-user.service.ts`: exact email user lookup, reasoned ban/unban with `sessionVersion++` on ban, and session revoke. Listing emergency cancel and needs-order recovery are not in default boot.
- Order snapshot columns remain on Prisma until P4. `GET /api/orders` is unmatched 404. Product image HTTP still uses metadata selects without hydrating `ProductImage.data`. Admin seller approval still reads `profilePhotoData` to check `byteLength`.
- Public discovery is split by contract: portfolio Work catalog uses a PostgreSQL CTE
  over approved products and `product_revision_images` of `published_revision_id`,
  without a Listing join. Author `getAuthor` forwards `q`/`category`/`materials`
  into that catalog query. Seller directory `listPublic` pages with
  `COUNT`/`ORDER BY`/`LIMIT`/`OFFSET` in PostgreSQL: `name` is `full_name, id`;
  `added` is latest public product `created_at, id`. Public authors
  still require a trimmed city. Portfolio Work DTOs include nullable
  `uniqueness` from the published revision; clients join `sharePath` to the
  current origin instead of inventing `/product/` URLs.
- Production SMTP transport must either use implicit TLS or STARTTLS with `requireTLS: true`. `SMTP_AUTH_MODE` explicitly selects `none` or `login`; login requires both `SMTP_USERNAME` and `SMTP_PASSWORD`, while none omits Nodemailer auth. Empty local relay credentials normalize to absent values and production configuration still fails closed for invalid partial auth.
- automatic winner replacement and AI-assisted evidence assessment are outside MVP and have no approved future workflow.

## Integrity and privacy

Commerce bid/order HTTP, Socket.IO rooms and listing lifecycle cron are absent
from default boot (`DEC-087`). Prisma `Listing`/`Bid`/`Order` remain until P4.
Owner product writes do **not** fail closed on leftover listing rows; runtime
guards use editable Product status and ownership only. The bullets that describe
bid placement, buyer activity and listing close are archive/P4 leftover
persistence behavior, not live HTTP.

- Buyer Activity (`GET /api/me/activity`) is unmatched 404 in default boot.
- Bid, soft-close and listing-lifecycle rules live in the commerce archive, not
  in default `apps/api/src`. Bid error codes remain on `apiErrorCodeSchema` for
  other API surfaces; live analytics ingest no longer accepts `bid_*` or
  `listing_viewed` events.
- HTTP errors use one response shape `{ status, code, message, details? }` from
  `ApiExceptionFilter`. Category codes (`bad_request`, `conflict`, …) remain the
  default for plain Nest exceptions. Clients branch on `code`, not `message`.
  Unexpected errors become `internal_error` without leaking internals.
- Public Work and Author JSON share approved Product/SellerProfile gates and
  contain no buyer contacts. Prisma Order projections remain until P4 and are
  not served over HTTP.
- Product image reorder mutates only `ProductRevisionImage` rows of the editing
  revision and must include every editing-revision image id exactly once.
  `ProductImage.position` uniqueness still guards storage slots, not gallery order.
  Leftover `SCHEDULED`/`LIVE` listing rows do not lock owner Work edits, images,
  or creation-story writes.
- Product image uploads enforce **authz-before-decode**: owner + editable Product +
  `assertApprovedSeller` run before Sharp. GIF and animated WebP/PNG are rejected;
  static JPEG/PNG/WebP only, with max edge 4096px and 16_777_216 pixel budget,
  sequential bounded normalize to canonical bytes outside the DB transaction, and
  a short Read Committed transaction that locks the Product row, re-checks owner,
  editable status and capacity then persists via `ImageStore.put`
  (`PostgresImageStore` today). Reads use metadata/authz first,
  then `ImageStore.get`. Per-user upload rate limits apply. See
  `13-APPLICATION-SECURITY.md` and `apps/api/src/images/image-policy.ts`.
- `ImageStore` selects PostgreSQL for legacy/backfill compatibility or an
  S3-compatible adapter when configured. New profile-revision and achievement
  binaries require S3; first application photos may still use Postgres. Full
  MinIO checksum of existing BYTEA rows remains a release/ops gate.

## Runtime topology and extension boundary

The phone shell owns the floating-glass sampling boundary. `AppShell` wraps
route content in `expo-blur` `BlurTargetView`; the platform-specific
`FloatingDockFrame` uses that target on Android and a `document.body` portal to
shared `FigmaGlassSurface` on web. Web glass keeps `backdrop-filter` on an empty
backdrop sibling so icons are not sampled into a halo. Route screens provide
navigation content only and do not implement their own dock blur, fill, border
or elevation.

The API currently assumes a single HTTP replica. The pilot deployment must enforce one API replica via Docker Compose (`docker compose --profile app`). Commerce scheduler/realtime scaling notes apply only if commerce is restored from archive. Do not add future sale types, payments, delivery or automatic winner replacement until a product decision requires them.

Pilot operations are documented in [`docs/ops/00-RELEASE-AND-BACKUP.md`](../ops/00-RELEASE-AND-BACKUP.md):

- `pnpm verify` — clean-checkout gate (`db:generate`, typecheck, lint, unit, integration, build);
- GitHub Actions [`.github/workflows/verify.yml`](../../.github/workflows/verify.yml);
- `GET /api/health` (liveness) and `GET /api/health/ready` (PostgreSQL `SELECT 1`);
- `scripts/ops/` backup/restore/integrity with `pnpm ops:*` aliases.

## Verification

The current 2026-08-10 verification is: typecheck/build 7/7 workspaces, lint
2/2, contracts 7/7, API unit 145/145, mobile unit 113/113, isolated PostgreSQL
integration 39/39, E2E fence and disposable Chromium Playwright 35/35. The
browser suite starts real API and Expo web servers against isolated
`bidplace_e2e`; PostgreSQL integration uses per-suite schemas. Current
implementation status and external founder/device/10-user gates are owned by
`11-PROJECT-STATUS.md`.

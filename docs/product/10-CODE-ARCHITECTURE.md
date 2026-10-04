# bidplace — архитектура кода

Последнее обновление: 2026-10-04
Статус: Confirmed technical boundaries for the portfolio-first MVP implementation.

## 2026-10-04 — Media lifecycle boundary (Partial)

`core/media/MediaLifecycleService` owns additive `MediaAsset`, `MediaObject`,
`MediaOperation` and durable `MediaOperationObject` manifests. The existing Nest
process reconciles persisted operations without another worker or queue service.
Short DB transactions record intent/attach/switch; tiered S3 writes happen outside
transactions. Operations claim exact objects with renewable leases, so restore
cannot overlap an unfinished DELETE of the same object. SOURCE is private and
byte-identical; metadata-stripped WebP derivatives use immutable asset/pipeline
keys. Cloudflare purge is a separate `PublicMediaCache` boundary.

`S3_BUCKET` is private; `S3_PUBLIC_BUCKET` must differ. HTTPS
`MEDIA_PUBLIC_BASE_URL` is a custom-domain origin. `CLOUDFLARE_ZONE_ID` and
`CLOUDFLARE_CACHE_TOKEN` configure exact-URL purge; no secrets enter contracts.
Public objects use browser revalidation and a separate edge TTL. SOURCE uses
`pipelineVersion=source` as a non-null identity discriminator; derivatives use
`p1`. SQL constraints prevent public SOURCE and invalid dimensions.

`POST /api/products/:id/images` optionally accepts `Idempotency-Key` for one
image. Client selections retain one key per file across retries; server stage
scopes it by owner/purpose/Work and rejects checksum conflicts or attachment to
an earlier revision. Submit replay returns the existing pending revision;
completed approve replay requires its exact DONE journal identity. This is limited
to Work actions, without a global HTTP idempotency framework.

Owner Work detail shares the existing publication DTO. Owner/author/admin poll
only active delivery states and show waiting/errors. WorkGallery mounts PREVIEW;
the selected FULL is mounted only while its shared AppDialog viewer is open.
Public Work/Author queries and binary proxy authorization require an active
author user as well as existing publication/revision checks; privileged private
reads are never publicly cached.

`core/media/import-legacy-media.ts` attaches all five legacy owner types using
the existing lifecycle, checksum/length/type verification and CAS, preserving
Bytes. Its one-time CLI defaults to dry-run; apply requires maintenance and
verified public delivery before traffic resumes. Legacy ImageStore/read paths
remain until importer/cutover verification. The package is **Partial** until live
provider acceptance and release integration regression. The historical single-bucket
description below applies to legacy records, not the target production topology.
See [`11-PROJECT-STATUS.md`](11-PROJECT-STATUS.md) for remaining gates.

## Applications and shared boundaries

- `apps/api` is the authoritative NestJS HTTP process. Controllers parse shared Zod contracts; services own business rules and Prisma transactions. Its active product modules are Health, Auth, Analytics, Products, OTP, Password Reset, Admin, Images, Sellers and Portfolio; Categories and core database/mail/time/public-id/image-store modules support that graph. Listing, Bid, Order, Discovery, Activity, lifecycle and Socket.IO application modules are not on the default boot graph.
- First-party product analytics ingest lives in `apps/api/src/analytics` (`POST /api/analytics/events`) and persists `AnalyticsEvent` / `AcquisitionAttribution` without duplicating leftover Bid/Order tables. Admin aggregates are served by `GET /api/admin/analytics/overview` and rendered in Expo admin `/(admin)/analytics`. The overview covers users, authors, published works, acquisition and stuck moderation. Auction/bid/order marketplace metrics are not part of the active overview.
- HTTP requests receive `X-Request-Id` (incoming or generated) for correlation in logs and error responses.
- `apps/api/src/sellers` owns the authenticated seller detail boundary `GET /api/seller/products/:id`; it verifies product ownership before returning the shared detail contract, including persisted creation-story steps, process-photo metadata and the latest non-null product moderation reason. `apps/mobile/src/features/sellers/ProductDraftScreen` hydrates from this owner detail before initializing the editable wizard, including `REJECTED` recovery on the same Product.
- `apps/api/src/portfolio` owns strict portfolio-only Home, Work, Author, facets and
  author application projections. Public Work/Author catalog reads use the published
  `ProductRevision` projection (`listPortfolio` / `getPortfolio`), not Listing
  membership. `GET /api/portfolio/home` returns a server-owned curator selection
  (`CuratorSelection` slot `home`) or `null`. The Home DTO is
  `{ curator, work: { ...work, author }, note }`: `curator` is the editorial
  `SellerProfile` (`curatorSellerProfileId`), `work.author` is the Product
  owner, and `note` is optional editorial copy. There is no sibling `author` on
  the selection. Owner application reads overlay draft
  public fields from `editingRevision` and expose `editingRevision` on the seller
  response; the published author projection stays on the approved revision until
  admin approve. Portfolio DTOs never expose commerce
  fields. Commerce application runtime is archived at
  `feature/commerce-runtime-archive` (`19eb40e`); Prisma Listing/Bid/Order tables
  remain as leftover safety data.
- `apps/mobile` is an Expo Router client. React Query holds server state. There is
  no Socket.IO client in the mobile runtime. Public Search is a feature overlay
  (`apps/mobile/src/features/search/SearchOverlay.tsx`) with one
  `SearchOverlayHost` in the root layout. `SearchOverlayProvider` is the only
  owner of Search session state: it is reconstructed from the current route
  (`overlay=search`, `oq`, `otab`; `/search?q=` is the compatibility alias).
  Overlay focus trap lives
  in `useOverlayFocusTrap` and is shared with `FilterSheet`. Search reuses
  `GET /api/works`, `GET /api/authors` and `GET /api/categories`.
  There is no `/search` API and no second catalog fetch layer. `/search` is a
  compatibility route that opens the same overlay. On web the overlay host
  paints through a synchronous `document.body` portal
  (`search-overlay-surface.web.tsx`); native keeps RN `Modal`. This is so
  Back restores Search in the same commit as the revealed route, not a
  later Modal mount. Installed `expo-router@57.0.4` web `NativeStackView`
  has no public option to keep inactive screens laid out (`freezeOnBlur`
  is iOS/Android only; `@react-navigation/native-stack` is not a direct
  dependency). `patches/expo-router@57.0.4.patch` keeps inactive web
  screens in layout (`display: flex`, `opacity: 0`, `pointerEvents: none`)
  and sets `inert` on the Screen boundary. Search outside click is owned
  only by `useDismissibleOverlay`; the Search dimmer is visual. `AppShell`
  `useIsFocused()` only mounts `FloatingDock` (body portal); it must not
  change page content. Public Back controls use
  `navigateBack({ fallbackHref })` from history, including Works catalog
  (`router.canGoBack()`).
- `apps/mobile/src/components/layout/AppShell.tsx` owns the shared safe-area responsive shell. `AppHeader` is one horizontal, role-aware composition with desktop navigation and a compact mobile navigation row; route screens remain responsible for their own scroll/content and business interactions.
- `apps/mobile/src/components/ui` is the only runtime component system.
  Product tabs are controlled by Expo Router URL state, and related Product/
  Creator grids reuse `WorkCoverCardGrid` rather than duplicating card anatomy.
  Cross-platform UI motion uses `react-native-reanimated`. Creator and Work
  share `stickyDock.*` metrics. Sticky physics stay screen-specific: Creator
  parks with CSS `top: -(heroHeight - stickyDock.actionHeight)` and restyles
  one `CreatorIdentity` with `LinearTransition`. Work keeps one persistent
  Back/Share pair in `StickyDockActionRow` (scrollport-spanning CSS-sticky
  overlay) and parks tabs with `position: sticky; top: stickyDock.actionHeight`.
  Shared handoff math lives in `apps/mobile/src/lib/sticky-handoff.ts`
  (`stickyHandoffThresholds` for Creator). Each screen host owns
  `stickyDock.fullHeight` placement. `StickyDockSurface` is a presentational
  `FigmaGlassSurface preset="navigation"` fill, square and full-width
  (`borderRadius: 0`, web opacity fade). Work activates it with an
  IntersectionObserver sentinel (`rootMargin` top
  `-${stickyDock.actionHeight}px`, `surfaceActive = !entry.isIntersecting`);
  Creator activates it with compact.
- `apps/api/src/images/image-policy.ts` owns binary Cache-Control: private media is `no-store`; public Product images keyed by id are immutable; public seller photos and creation-step images (bytes replaced at a stable URL) use short revalidation. `ImagesService.get` authorizes a Product image from owner id, product and seller status, `publishedRevisionId`, and published-revision membership. That read does not load the public seller profile.
- `apps/api/src/core/image-store` is the media boundary. PostgreSQL retains media
  metadata, ownership, checksum and deterministic object key; S3-compatible storage
  retains binary bytes when `MEDIA_STORAGE_PROVIDER=s3`. Production configuration
  fails closed without complete S3 settings. `scripts/ops/backfill-media-to-s3.mjs`
  is dry-run by default, scans all five media owners in bounded pages, verifies
  source and target checksum/type/length, retains DB bytes and supports reruns.
  Metadata-only references require a verified target object or shared source
  bytes; this tool does not copy objects from another S3 provider. The confirmed
  target is separate private/public R2 buckets with native Cloudflare CDN, a Neon
  operation journal and retry inside NestJS (`DEC-097`). The runtime is implemented
  in `core/media`; live provider/cutover and release checks remain open (boundary
  above). See the [implementation result](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md). Restore
  verification reads sampled objects and compares their checksums without logging
  content or credentials.
- `apps/mobile/src/lib/environment.ts` owns API origin validation and `getApiAssetUrl`, which resolves relative media paths while preserving valid absolute HTTP(S) URLs. Media components own truthful missing/error presentation without changing API visibility rules.
- `apps/mobile/src/components/layout/OverlayHost.tsx` stays mounted by AppShell. It keeps the relative content child and the absolute `app-overlay-host` layer. It does not portal descendants and does not export positioning helpers.
- `apps/mobile/src/components/layout/index.ts` exports the shell, auth and form page primitives, `OverlayHost`, and `navigateBack`. Catalog sort and filter use `FilterSheet` through `CatalogFilterSheet`. `header-chrome.ts` and `dismissible-overlay.ts` stay outside that barrel. The unused `FilterMenu` and `focusable-anchor` helpers were removed.
- `apps/api/src/products/products.mapper.ts` and `apps/api/src/products/products-catalog.query.ts` own the canonical public catalog selection and CTE/order SQL; `products.service.ts` keeps only use-cases and orchestration. Public portfolio Work hydration uses `portfolioCatalogProductSelect`: product id, public id, `publishedAt`, the public seller profile, and the published revision gallery. Parent product fields and the parent image relation are not part of that read. Owner and moderation reads keep `productSelect`.
- `packages/contracts` owns runtime HTTP and event shapes; `packages/api-client` validates responses with those schemas and declares `zod` `^3.24.2` for that import. Public catalog reads can pass an optional `AbortSignal` through that client into `fetch`. Mutations stay uncancelled unless a caller passes a signal.
- `packages/contracts/src/seller-profile.ts` owns the reusable public-link and handoff-contact validation shapes consumed by both seller write contracts and the profile editor; client-side field feedback does not replace server validation. Public `socialLink`, `telegramUrl`, `instagramUrl` and `websiteUrl` use shared `httpsUrlSchema` and accept only `https:` URLs. Telegram/Instagram `@handle` forms stay on the separate handoff schemas.
- `packages/database` owns Prisma schema, additive migrations and deterministic local/test seed. Demo seed may run only with `NODE_ENV=development|test`, `APP_ENV=local` and `ALLOW_DESTRUCTIVE_DEMO_SEED=true`; production-like profiles fail before writes. Local seed is the Figma Home catalog (four public authors plus `pixelp`, nine public works including two demo vex works, no Listing/Bid/Order rows). User-facing seed copy is production-quality (`DEC-092`). `CuratorSelection` points at Dali (`daliEstate1` / `pixelp`) with curator `vex` and the Figma `note`. Pre-production amendment of the unreleased `curator_selections` CREATE TABLE (`note TEXT`, `curator_seller_profile_id`, `DEC-090`/`DEC-091`) is the only in-place migration edit; after first production apply, further columns are additive. Seller `biography` is an additive column (`20260914200000_add_seller_biography`). This does not authorize editing commerce/baseline migrations (`DEC-087`). `scripts/ops/commerce-inventory.mjs` is a read-only leftover-listing inventory; it is not a write path and is not a staging/production dry-run unless that environment is the connected target.
- `packages/config` owns env-file parsing through Node `util.parseEnv`. One leading U+FEFF is removed from the file text before that parse; a later BOM, including one inside a quoted value, stays. A missing file is an empty record. Explicit process env overrides file values. `apps/api/src/core/config/env.ts` validates that merge once and freezes the result. `ServerEnvModule.forRoot` provides that same object as `SERVER_ENV` for one Nest application context. `main.ts` and `apps/api/test/integration/http-test-app.ts` are the bootstrap loaders. Analytics, auth, OTP, password reset, mail, image storage, and rate limits inject the snapshot. `loadServerEnv` still copies unset keys into `process.env`, because `PrismaService` constructs `PrismaClient` without a datasource argument and Prisma reads `DATABASE_URL` from the process environment. A second application context gets its own snapshot through its own `ServerEnvModule.forRoot` call. The provider is the existing Nest dynamic module.
- `apps/api/src/core/config/env-profile.ts` owns the `NODE_ENV` × `APP_ENV` predicates. `APP_ENV=production` requires `NODE_ENV=production`; `NODE_ENV=production` cannot combine with `APP_ENV=local`. Production SMTP, service rules, password-reset URL, JWT length and test-bypass prohibitions apply when either variable is `production`. Staging keeps its previous requirement shape: production security only when `NODE_ENV=production`.
- Release automation is deliberately layered: root `pnpm verify` is the local and
  standard automatic CI gate (including mobile unit tests and the E2E database
  fence). Full browser E2E is not run automatically on pull requests or pushes:
  `.github/workflows/browser-e2e.yml` is a manual `workflow_dispatch` Chromium
  gate, and the manual `portfolio-release-gate.yml` owns the full Chromium/WebKit
  release matrix. Browser setup always targets disposable `bidplace_e2e` under
  `NODE_ENV=test` and `APP_ENV=local`.

## Persistence model

```text
SellerProfile
  ├─ SellerProfileRevision[]
  │    └─ SellerProfileRevisionAchievement[] (text/date + optional image; revision scoped)
  └─ Product
       ├─ ProductRevision[]
       │    └─ ProductRevisionImage[]
       ├─ ProductImage[] (legacy metadata)
       ├─ CuratorSelection? (home editorial pointer: curator SellerProfile + product + optional note)
       └─ Listing[]
            ├─ AuctionRules
            ├─ Bid[]
            └─ Order[]
```

`Product` and `Order` use immutable 11-character cryptographically random public IDs; internal writes use UUIDs. MVP has only `ListingType.AUCTION` and currency `BYN`. PostgreSQL enforces one active (`SCHEDULED`/`LIVE`) Listing per Product and one non-cancelled Order per Listing with partial unique indexes.

## Confirmed current MVP implementation boundary

- `APPROVED` SellerProfile is the seller capability; `assertApprovedSeller` is the shared write gate for Product, Listing, image and seller writes, while `AdminModerationService` records append-only audit events for moderation transitions;
- SellerProfile stores public profile data separately from buyer identity. The current implementation keeps the handoff contact private, persists public `discipline` separately from the coarse seller type, requires `fullName`, a non-blank `city` and a public profile photo on seller application, accepts `socialLink` as null when Telegram/Instagram/website is used, reopens public-field edits for `CHANGES_REQUESTED` and `REJECTED` plus approved-author editing revisions, and snapshots the handoff data into Orders; public seller/catalog views reuse shared visibility predicates and narrow seller selects instead of duplicating checks. `GET /api/authors?sort=added` orders by `seller_profiles.created_at`, not latest work;
- `Product` is the current persistence name for a Work. `ProductRevision` holds
  mutable public Work content and immutable revision-image membership; a Work points
  to its editing and published revisions. A published Work copies its published
  revision when the author starts a new edit. The prior revision and Product public
  projection remain visible until admin approval atomically promotes the next
  revision. Rejections and requested changes apply to the editing revision only;
  hiding/unhiding applies to the approved Work. Hide fails closed when a
  `SCHEDULED` or `LIVE` Listing exists and does not write Product, Listing or
  audit. Work writes lock the Product row
  (`SELECT … FOR UPDATE`) and re-check ownership and seller capability inside a
  Read Committed transaction;
- `SellerProfileRevision` gives approved authors an editing-revision pointer and a
  published-revision pointer. Public portfolio author data is read from the approved
  profile projection; author submission locks edits and admin moderation only promotes
  the approved revision. `SellerProfileRevisionAchievement` belongs to that revision,
  so pending achievements cannot leak into the public author page. Public
  achievement image GET is allowed only from the published revision; owner and
  admin can read draft bytes; anonymous/stranger draft reads return 404. Profile
  field updates, achievement append and achievement delete share one
  `ensureEditableEditingRevision` use case: it locks `seller_profiles` then the
  editing revision (`SELECT … FOR UPDATE`), forks a `DRAFT` from the published
  revision when those pointers still coincide, and copies published achievements
  including media metadata/`data` one row at a time so the fork map is the
  created draft id for that published id. The first add/delete does not require
  a dummy save. After that fork, later deletes accept only the fork map or an
  id that already belongs to the editing revision; content/position matching is
  not used. `PENDING_REVIEW` remains locked. `ImageStore` keys include
  `seller-profile-revision` and `seller-achievement` with the existing seller-photo
  canonical fallback;
- one own Product image is the MVP technical minimum. Maximum file count and
  aggregate bytes are enforced for the whole Product inside a Read Committed
  transaction that locks the Product row, including repeated/concurrent uploads. Condition is not
  mandatory for creator-made Product; the current optional field is preserved
  until a future item-class decision requires migration;
- public Work `История` authors as one `story` text field. The public tab
  interleaves published non-cover `ProductImage` rows between paragraphs.
  `ProductCreationStep` remains owner-only and is not a public History CMS;
- persisted entities expose `createdAt` and `updatedAt`; append-only audit records retain immutable business facts;
- buyer accepts a versioned service-rules text; `auth.service.ts` stores the acceptance and `POST /api/auth/rules/accept` returns the canonical `{ user }` auth response. Mobile derives session capability from one React Query `['user', 'me']` record. A structured 401 from any query or mutation clears that record and user/seller/admin caches once; 403 and infrastructure errors preserve the authenticated state. OTP and password-reset deliver mail through shared `MailTransport` (`SmtpMailTransport` on the production security profile, `LocalMailTransport` otherwise) with a test-only OTP bypass that can activate only for `NODE_ENV=test` and `APP_ENV=local`;
- leftover Listing/Bid/Order rows remain in Prisma. Hide/unhide and admin
  seller/product moderation still fail closed when a `SCHEDULED` or `LIVE`
  Listing exists (`hasBlockingListing`). There is no listing/bid/order HTTP,
  no Socket.IO, no ScheduleModule lifecycle, and no `COMMERCE_ENABLED` gate.
  Ops leftover inventory is `scripts/ops/commerce-inventory.mjs`. The removed
  application code stays on `feature/commerce-runtime-archive` @ `19eb40e`.
- password recovery lives in `apps/api/src/password-reset/`: forgot is neutral and never enumerates accounts; per-IP forgot limits run before user lookup and per-email limits after an active user is found; resend cooldown applies only to unused tokens; reset consumes a hashed single-use token, invalidates sibling tokens, updates `passwordHash` and increments `sessionVersion` atomically; `MailTransport` sends reset links; `core/email/smtp-transport.ts` builds Nodemailer options with single-address recipient guard; production requires `PASSWORD_RESET_URL_BASE` for reset links and local dev may fall back to `resolveCorsOrigin()`;
- admin emergency controls live in `apps/api/src/admin/admin-user.service.ts`: exact email user lookup, reasoned ban/unban with `sessionVersion++` on ban, and session revoke. Listing emergency cancel, needs-order recovery and order replacement HTTP are not on the active boot graph.
- Production SMTP transport must either use implicit TLS or STARTTLS with `requireTLS: true`. `SMTP_AUTH_MODE` explicitly selects `none` or `login`; login requires both `SMTP_USERNAME` and `SMTP_PASSWORD`, while none omits Nodemailer auth. Empty local relay credentials normalize to absent values and production configuration still fails closed for invalid partial auth.
- automatic winner replacement and AI-assisted evidence assessment are outside MVP and have no approved future workflow.

## Integrity and privacy

- HTTP errors use one response shape `{ status, code, message, details?, requestId? }`
  from the existing `ApiExceptionFilter` in `apps/api/src/core/errors/`
  (`error-response-mapper.ts` + `error-logger.ts`). Category codes
  (`bad_request`, `conflict`, …) remain the default for plain Nest exceptions.
  Leftover listing/bid business codes remain in the shared error enum.
  `message` is diagnostic, not UI copy. Unexpected errors become
  `internal_error` without leaking internals.
  Client transport lives in `packages/api-client/src/errors/`. Mobile
  infrastructure UI policy lives in `apps/mobile/src/errors/`; presentation
  lives in `apps/mobile/src/components/shared/InfrastructureErrorState.tsx`
  (`presentation="page"` as an `AppShell` flex child, `presentation="inline"`
  when screen chrome stays useful). Blocking page fetch loading/error share
  `InfrastructurePageStatus` and one `AnimatedBidplaceLogo` instance
  (`motion="loading" | "error"`). Diagnostics for handled infrastructure
  failures use `console.info` via `logInfrastructureError`; Expo LogBox is not
  used as UI. Public `AppShell` does not show session
  bootstrap chrome. `ProtectedRoute` owns blocking session failure.
  The unused `SessionAlert` primitive was removed.
  Validation, password, conflict, rate-limit and domain/not-found copy still
  use the older form mapper and are a future migration.
- Public Work/Author catalog, ProductImage and seller-photo access share
  approved Product/SellerProfile gates and contain no buyer contacts or seller
  internal identifiers. There is no public Listing, Bid history or Socket.IO
  join path on the active API.
- Product image reorder uses a two-phase temporary offset inside a transaction
  so the unique `(productId, position)` constraint never collides during swaps;
  count/byte capacity is checked transactionally before insert. Owner Work writes
  and hide still lock the Product row and fail closed when a leftover
  `SCHEDULED`/`LIVE` Listing exists.
- Product image uploads enforce **authz-before-decode**: owner + editable Product +
  `assertApprovedSeller` run before Sharp. GIF and animated WebP/PNG are rejected;
  static JPEG/PNG/WebP only, with max edge 4096px and 16_777_216 pixel budget,
  sequential bounded normalize to canonical bytes outside the DB transaction, and
  a short Read Committed transaction that locks the Product row, re-checks owner, editable status, blocking
  Listing and capacity then persists via `ImageStore.put` (`PostgresImageStore` today). Reads use metadata/authz first,
  then `ImageStore.get`. Per-user upload rate limits apply. See
  `13-APPLICATION-SECURITY.md` and `apps/api/src/images/image-policy.ts`.
- `ImageStore` now selects PostgreSQL only for legacy/backfill compatibility or an
  S3-compatible adapter for configured production storage. New media paths persist
  metadata and deterministic keys in PostgreSQL while the object store holds bytes;
  full MinIO/PostgreSQL restore verification remains a release gate.

## Runtime topology and extension boundary

`SellerProfile` keeps the current owner-facing mirror for unpublished author
applications while `SellerProfileRevision` is the canonical moderation payload.
Editable draft, changes-requested and rejected saves lock the profile and update
both records in one transaction. A parent `DRAFT` is private and excluded from
moderation and public author predicates; submission is the only transition to
`PENDING_REVIEW`.

Admin moderation reads that revision as an explicit review target and keeps the
parent publication status separate. Review actions address the revision
`{ id, updatedAt }` the moderator saw. Visibility actions address the parent.
The admin seller photo uses the same identity plus the photo checksum, so a
resubmitted revision replaces the displayed bytes. Work and achievement image
reads use the existing endpoints. The mobile API client sends the session
cookie with `credentials: 'include'` and does not attach an Authorization
bearer token. `OptionalBearerAuthGuard` accepts that cookie or a bearer token.
Public and owner projections stay on their existing records.

The active API is an HTTP process. There is no scheduler or Socket.IO adapter on the boot graph. Do not add future sale types, payments, delivery or automatic winner replacement until a product decision requires them. Commerce application code is not restored from leftover Prisma tables; the archive branch is `feature/commerce-runtime-archive` @ `19eb40e`.

Pilot operations are documented in [`docs/ops/00-RELEASE-AND-BACKUP.md`](../ops/00-RELEASE-AND-BACKUP.md):

- `pnpm verify` — clean-checkout gate (typecheck with Turbo `database#generate`, lint, unit, integration, build);
- GitHub Actions [`.github/workflows/verify.yml`](../../.github/workflows/verify.yml);
- `GET /api/health` (liveness) and `GET /api/health/ready` (PostgreSQL `SELECT 1`);
- `scripts/ops/` backup/restore/integrity with `pnpm ops:*` aliases.

## Verification

### Author email verification boundary

`VerifiedEmailGuard` runs after `BearerAuthGuard` on authenticated Author
application, Work, and related media mutations. It reads `User.emailVerifiedAt`
from persistence and returns 403 for an unverified session; read/public routes
remain outside this boundary. Mobile keeps `/me` in `['user','me']` as the sole
session owner after OTP verification.

The current 2026-08-10 verification is: typecheck/build 7/7 workspaces, lint
2/2, contracts 7/7, API unit 145/145, mobile unit 113/113, isolated PostgreSQL
integration 39/39, E2E fence and disposable Chromium Playwright 35/35. The
browser suite starts real API and Expo web servers against isolated
`bidplace_e2e`; PostgreSQL integration uses per-suite schemas. Current
implementation status and external founder/device/10-user gates are owned by
`11-PROJECT-STATUS.md`.

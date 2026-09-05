# bidplace — архитектура кода

Последнее обновление: 2026-09-05
Статус: Confirmed technical boundaries for the current Product / Listing MVP.

## Applications and shared boundaries

- `apps/api` is the authoritative NestJS HTTP, scheduler and Socket.IO process. Controllers parse shared Zod contracts; services own business rules and Prisma transactions.
- First-party product analytics ingest lives in `apps/api/src/analytics` (`POST /api/analytics/events`) and persists `AnalyticsEvent` / `AcquisitionAttribution` without duplicating Bid/Order business facts. Admin aggregates are served by `GET /api/admin/analytics/overview` and rendered in Expo admin `/(admin)/analytics`.
- HTTP requests receive `X-Request-Id` (incoming or generated) for correlation in logs and error responses.
- `apps/api/src/sellers` owns the authenticated seller detail boundary `GET /api/seller/products/:id`; it verifies product ownership before returning the shared detail contract, including persisted creation-story steps, process-photo metadata and the latest non-null product moderation reason. `apps/mobile/src/features/sellers/ProductDraftScreen` hydrates from this owner detail before initializing the editable wizard, including `REJECTED` recovery on the same Product.
- `apps/api/src/discovery` owns the public Home projection. Discovery delegates to
  Product/Seller services, which select the canonical public Listing before
  server-side filters, sort and pagination; clients do not rank a loaded page.
- `apps/mobile` is an Expo Router client. React Query holds server state; Socket.IO only signals a refetch of the canonical HTTP snapshot.
- `apps/mobile/src/components/layout/AppShell.tsx` owns the shared safe-area responsive shell. `AppHeader` is one horizontal, role-aware composition with desktop navigation and a compact mobile navigation row; route screens remain responsible for their own scroll/content and business interactions.
- `apps/mobile/src/components/ui` is the only runtime component system.
  Product tabs are controlled by Expo Router URL state, and related Product/
  Creator grids reuse `AuctionCardGrid` rather than duplicating card anatomy.
- `apps/mobile/src/lib/environment.ts` owns API origin validation and `getApiAssetUrl`, which resolves relative media paths while preserving valid absolute HTTP(S) URLs. Media components own truthful missing/error presentation without changing API visibility rules.
- `apps/mobile/src/components/layout/OverlayHost.tsx` owns the web-only overlay boundary for AppShell descendants. Desktop account dropdowns are portaled into the shared host and positioned from trigger rectangles; ordinary page content keeps the lower semantic layer.
- `apps/mobile/src/components/layout/index.ts` is the shared public barrel for shell/header/overlay primitives and discovery `FilterMenu` (single dismiss + focus-return contract). Pure helpers such as `account-menu-hover.ts`, `header-chrome.ts`, `dismissible-overlay.ts` and `focusable-anchor.ts` stay outside that barrel so Node/Playwright can import them without loading React Native.
- `apps/api/src/products/products.mapper.ts` and `apps/api/src/products/products-catalog.query.ts` own the canonical public catalog selection and CTE/order SQL; `products.service.ts` keeps only use-cases and orchestration.
- `packages/contracts` owns runtime HTTP and event shapes; `packages/api-client` validates responses with those schemas.
- `packages/contracts/src/seller-profile.ts` owns the reusable public-link and handoff-contact validation shapes consumed by both seller write contracts and the profile editor; client-side field feedback does not replace server validation.
- `packages/database` owns Prisma schema, the single unreleased baseline migration and deterministic local/test seed. Bid/Order demo fixtures may run only with `NODE_ENV=development|test`, `APP_ENV=local` and `ALLOW_DESTRUCTIVE_DEMO_SEED=true`; production-like profiles fail before writes, and an API PostgreSQL integration test verifies the seeded auction invariants.
- Realtime Socket.IO configuration is assembled once from validated bootstrap env and then injected through a custom adapter; gateway classes only define event handlers and state, not transport policy.

## Persistence model

```text
SellerProfile
  └─ Product
       ├─ ProductImage[]
       └─ Listing[]
            ├─ AuctionRules
            ├─ Bid[]
            └─ Order[]
```

`Product` and `Order` use immutable 11-character cryptographically random public IDs; internal writes use UUIDs. MVP has only `ListingType.AUCTION` and currency `BYN`. PostgreSQL enforces one active (`SCHEDULED`/`LIVE`) Listing per Product and one non-cancelled Order per Listing with partial unique indexes.

## Confirmed current MVP implementation boundary

- `APPROVED` SellerProfile is the seller capability; `assertApprovedSeller` is the shared write gate for Product, Listing, image and seller writes, while `AdminModerationService` records append-only audit events for moderation transitions;
- SellerProfile stores public profile data separately from buyer identity. The current implementation keeps the handoff contact private, persists public `discipline` separately from the coarse seller type, requires `fullName` plus a public profile photo on seller application, reopens edits only when moderation returns `CHANGES_REQUESTED` for public and handoff corrections, and snapshots the handoff data into Orders; public seller/catalog views reuse shared visibility predicates and narrow seller selects instead of duplicating checks;
- Product requires a moderation state before public visibility. A Product remains private while it is a draft, under review or rejected; `isEditableProductStatus` allows owner writes in `DRAFT`, `CHANGES_REQUESTED` and `REJECTED`; `submit` moves those states into `PENDING_REVIEW` on the same Product, admin moderation records a reasoned append-only audit trail, and the first public Listing transition sets immutable `publishedAt`;
- one own Product image is the MVP technical minimum. Maximum file count and
  aggregate bytes are enforced for the whole Product inside a serializable
  transaction, including repeated/concurrent uploads. Condition is not
  mandatory for creator-made Product; the current optional field is preserved
  until a future item-class decision requires migration;
- persisted entities expose `createdAt` and `updatedAt`; append-only audit records retain immutable business facts;
- buyer accepts a versioned service-rules text before the first Bid; `auth.service.ts` stores the acceptance, `bid-eligibility.ts` requires both `emailVerifiedAt` and the current rules version; OTP and password-reset deliver mail through shared `MailTransport` (`SmtpMailTransport` in production, `LocalMailTransport` in dev/test) with a test-only OTP bypass that cannot activate in production;
- password recovery lives in `apps/api/src/password-reset/`: forgot is neutral and never enumerates accounts; per-IP forgot limits run before user lookup and per-email limits after an active user is found; resend cooldown applies only to unused tokens; reset consumes a hashed single-use token, invalidates sibling tokens, updates `passwordHash` and increments `sessionVersion` atomically; `MailTransport` sends reset links; `core/email/smtp-transport.ts` builds Nodemailer options with single-address recipient guard; production requires `PASSWORD_RESET_URL_BASE` for reset links and local dev may fall back to `resolveCorsOrigin()`;
- active Order handoff snapshots `sellerHandoffType`, `sellerHandoffValue`, `buyerEmailAtClose` and `handoffInitiator` at close. Buyer, seller and admin receive role-scoped projections, seller actions and admin cancellation/replacement enforce actor role at the service boundary, terminal handoff transitions are not repeatable, and admin cancellation/replacement preserves the original record with append-only audit;
- admin emergency controls live in `apps/api/src/admin/admin-user.service.ts` and `admin-listing-emergency.service.ts`: exact email user lookup, reasoned ban/unban with `sessionVersion++` on ban, session revoke, and emergency `SCHEDULED|LIVE → CANCELLED` without bid edits; `AuditTargetType.USER` records user incidents; mobile admin exposes Users and Recovery tabs wired to needs-order API;
- Order audience is resolved from the Order relation itself: admin sees the full admin projection, the seller sees the seller projection when `order.sellerId === userId`, and the buyer sees the buyer projection when `order.buyerId === userId`. Cancelled Orders stay hidden from buyer and seller projections when historical contacts must remain private.
- Public Socket.IO is anonymous but fenced: handshake origins are allow-listed
  from `CORS_ORIGIN`, public transports do not send credentials, joins reuse the
  approved Product/SellerProfile Listing predicate, are rate-limited per IP,
  public rooms are capped per socket, and socket-local room tracking is cleared
  on disconnect.
- Public discovery is split by contract: Product catalog queries use a
  PostgreSQL canonical-listing CTE for server-side filters, status-aware sort,
  total count and page selection before narrow Prisma hydration; Seller
  directory queries expose only `q`, pagination and `activity`/`name` sort.
- Production SMTP transport must either use implicit TLS or STARTTLS with `requireTLS: true`. `SMTP_AUTH_MODE` explicitly selects `none` or `login`; login requires both `SMTP_USERNAME` and `SMTP_PASSWORD`, while none omits Nodemailer auth. Empty local relay credentials normalize to absent values and production configuration still fails closed for invalid partial auth.
- automatic winner replacement and AI-assisted evidence assessment are outside MVP and have no approved future workflow.

## Integrity and privacy

- Bid placement is server-time, serializable, idempotent by
  `(bidderUserId, idempotencyKey)`, self-bid protected, email/rules verified and
  compare-and-update guarded; admin accounts are explicitly denied by the Bids
  service and have no buyer Activity projection. Public aliases hash
  `(listingId, bidderUserId)`, remaining stable within one Listing without
  correlating the user across Listings. Optimistic CAS conflicts retry up to
  three times with full re-validation before returning `LISTING_CHANGED`.
- HTTP errors use one response shape `{ status, code, message, details? }` from
  `ApiExceptionFilter`. Category codes (`bad_request`, `conflict`, …) remain the
  default for plain Nest exceptions; bidding emits stable business codes such as
  `BID_TOO_LOW` via `AppException`. Clients branch on `code`, not `message`.
  Unexpected errors become `internal_error` without leaking internals.
- The 60-second inclusive soft-close window, 60-second extension and 600-second cap live in `core/auction`; the resulting `endsAt` is committed with the Bid.
- Scheduler activation/close is idempotent and closes from database state, choosing the winner by amount, timestamp and ID. Expired Listings always become `ENDED` in a committed transaction before winner Order creation; Order creation is a separate best-effort transaction (shared `createWinnerOrder` helper) and must not roll back the close. Cron activate/close failures are isolated per Listing. Schedule/activation require seller handoff contact. Admin recovery for `ENDED` + Bids + no Order is list + idempotent create-order only (same Bid ranking as close); no new Listing statuses, queues, or outbox.
- Public Product, Listing, Bid history, ProductImage and Socket.IO access share
  approved Product/SellerProfile gates and contain no buyer contacts or seller
  internal identifiers. Order projections stay role-scoped: buyer sees the
  seller snapshot only when the handoff initiator is `BUYER_CONTACTS_SELLER`,
  seller sees the buyer email snapshot, and admin sees the allowed full record.
- Buyer-facing Order privacy mode can hide seller contacts entirely when the seller chooses `SELLER_CONTACTS_BUYER`; the buyer projection returns `null` contact fields in that mode.
- Product image reorder uses a two-phase temporary offset inside a transaction
  so the unique `(productId, position)` constraint never collides during swaps;
  count/byte capacity is checked transactionally before insert.
- Product image uploads enforce **authz-before-decode**: owner + editable Product +
  `assertApprovedSeller` run before Sharp. GIF and animated WebP/PNG are rejected;
  static JPEG/PNG/WebP only, with max edge 4096px and 16_777_216 pixel budget,
  sequential bounded normalize to canonical bytes outside the DB transaction, and
  a short SERIALIZABLE transaction that re-checks owner/capacity then persists via
  `ImageStore.put` (`PostgresImageStore` today). Reads use metadata/authz first,
  then `ImageStore.get`. Per-user upload rate limits apply. See
  `13-APPLICATION-SECURITY.md` and `apps/api/src/images/image-policy.ts`.
- Product images remain binary PostgreSQL storage for the pilot; swapping to object
  storage is a future `ImageStore` adapter change, not a service rewrite.

## Runtime topology and extension boundary

The API currently assumes a single scheduler and Socket.IO instance. The pilot deployment must enforce one API replica via Docker Compose (`docker compose --profile app`). Before multi-instance deployment, lifecycle work needs a distributed lock or external queue and realtime needs an adapter. Do not add future sale types, payments, delivery or automatic winner replacement until a product decision requires them.

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

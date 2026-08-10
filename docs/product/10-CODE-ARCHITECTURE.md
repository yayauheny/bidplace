# bidplace — архитектура кода

Последнее обновление: 2026-08-10
Статус: Confirmed technical boundaries for the current Product / Listing MVP.

## Applications and shared boundaries

- `apps/api` is the authoritative NestJS HTTP, scheduler and Socket.IO process. Controllers parse shared Zod contracts; services own business rules and Prisma transactions.
- `apps/mobile` is an Expo Router client. React Query holds server state; Socket.IO only signals a refetch of the canonical HTTP snapshot.
- `apps/mobile/src/components/layout/AppShell.tsx` owns the shared safe-area responsive shell. `AppHeader` is one horizontal, role-aware composition with desktop navigation and a compact mobile navigation row; route screens remain responsible for their own scroll/content and business interactions.
- `apps/mobile/src/components/ui` is the only runtime component system.
  Product tabs are controlled by Expo Router URL state, and related Product/
  Creator grids reuse `AuctionCardGrid` rather than duplicating card anatomy.
- `apps/mobile/src/lib/environment.ts` owns API origin validation and `getApiAssetUrl`, which resolves relative media paths while preserving valid absolute HTTP(S) URLs. Media components own truthful missing/error presentation without changing API visibility rules.
- `apps/mobile/src/components/layout/OverlayHost.tsx` owns the web-only overlay boundary for AppShell descendants. Desktop account dropdowns are portaled into the shared host and positioned from trigger rectangles; ordinary page content keeps the lower semantic layer.
- `packages/contracts` owns runtime HTTP and event shapes; `packages/api-client` validates responses with those schemas.
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
- SellerProfile stores public profile data separately from buyer identity. The current implementation keeps the handoff contact private, requires `fullName` plus a public profile photo on seller application, reopens edits only when moderation returns `CHANGES_REQUESTED` for public and handoff corrections, and snapshots the handoff data into Orders; public seller/catalog views reuse shared visibility predicates and narrow seller selects instead of duplicating checks;
- Product requires a moderation state before public visibility. A Product remains private while it is a draft or under review; `submit` moves it into review, admin moderation records a reasoned audit trail, and the first public Listing transition sets immutable `publishedAt`;
- one own Product image is the MVP technical minimum. Maximum file count and
  aggregate bytes are enforced for the whole Product inside a serializable
  transaction, including repeated/concurrent uploads. Condition is not
  mandatory for creator-made Product; the current optional field is preserved
  until a future item-class decision requires migration;
- persisted entities expose `createdAt` and `updatedAt`; append-only audit records retain immutable business facts;
- buyer accepts a versioned service-rules text before the first Bid; `auth.service.ts` stores the acceptance, `bid-eligibility.ts` requires both `emailVerifiedAt` and the current rules version, and `otp.service.ts` uses SMTP/nodemailer in production with a test-only bypass that cannot activate in production;
- active Order handoff snapshots `sellerHandoffType`, `sellerHandoffValue`, `buyerEmailAtClose` and `handoffInitiator` at close. Buyer, seller and admin receive role-scoped projections, seller actions and admin cancellation/replacement enforce actor role at the service boundary, terminal handoff transitions are not repeatable, and admin cancellation/replacement preserves the original record with append-only audit;
- Order audience is resolved from the Order relation itself: admin sees the full admin projection, the seller sees the seller projection when `order.sellerId === userId`, and the buyer sees the buyer projection when `order.buyerId === userId`. Cancelled Orders stay hidden from buyer and seller projections when historical contacts must remain private.
- Public Socket.IO is anonymous but fenced: handshake origins are allow-listed
  from `CORS_ORIGIN`, public transports do not send credentials, joins reuse the
  approved Product/SellerProfile Listing predicate, are rate-limited per IP,
  public rooms are capped per socket, and socket-local room tracking is cleared
  on disconnect.
- Production SMTP transport must either use implicit TLS or STARTTLS with `requireTLS: true`; `SMTP_USERNAME` and `SMTP_PASSWORD` must be configured together and partially configured auth is rejected before transport creation.
- automatic winner replacement and AI-assisted evidence assessment are outside MVP and have no approved future workflow.

## Integrity and privacy

- Bid placement is server-time, serializable, idempotent by
  `(bidderUserId, idempotencyKey)`, self-bid protected, email/rules verified and
  compare-and-update guarded; admin accounts are explicitly denied by the Bids
  service and have no buyer Activity projection. Public aliases hash
  `(listingId, bidderUserId)`, remaining stable within one Listing without
  correlating the user across Listings.
- The 60-second inclusive soft-close window, 60-second extension and 600-second cap live in `core/auction`; the resulting `endsAt` is committed with the Bid.
- Scheduler activation/close is idempotent and closes from database state, choosing the winner by amount, timestamp and ID.
- Public Product, Listing, Bid history, ProductImage and Socket.IO access share
  approved Product/SellerProfile gates and contain no buyer contacts or seller
  internal identifiers. Order projections stay role-scoped: buyer sees the
  seller snapshot only when the handoff initiator is `BUYER_CONTACTS_SELLER`,
  seller sees the buyer email snapshot, and admin sees the allowed full record.
- Buyer-facing Order privacy mode can hide seller contacts entirely when the seller chooses `SELLER_CONTACTS_BUYER`; the buyer projection returns `null` contact fields in that mode.
- Product image reorder uses a two-phase temporary offset inside a transaction
  so the unique `(productId, position)` constraint never collides during swaps;
  count/byte capacity is checked transactionally before insert.
- Product images remain binary PostgreSQL storage for the pilot; object storage is a future operational change.

## Runtime topology and extension boundary

The API currently assumes a single scheduler and Socket.IO instance. The pilot deployment must enforce one API replica. Before multi-instance deployment, lifecycle work needs a distributed lock or external queue and realtime needs an adapter. Do not add future sale types, payments, delivery or automatic winner replacement until a product decision requires them.

## Verification

The current 2026-08-10 verification is: typecheck/build 7/7 workspaces, lint
2/2, contracts 7/7, API unit 145/145, mobile unit 113/113, isolated PostgreSQL
integration 39/39, E2E fence and disposable Chromium Playwright 35/35. The
browser suite starts real API and Expo web servers against isolated
`bidplace_e2e`; PostgreSQL integration uses per-suite schemas. Current
implementation status and external founder/device/10-user gates are owned by
`11-PROJECT-STATUS.md`.

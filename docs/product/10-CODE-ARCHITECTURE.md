# bidplace — архитектура кода

Последнее обновление: 2026-07-18
Статус: Confirmed technical boundaries for the current Product / Listing MVP.

## Applications and shared boundaries

- `apps/api` is the authoritative NestJS HTTP, scheduler and Socket.IO process. Controllers parse shared Zod contracts; services own business rules and Prisma transactions.
- `apps/mobile` is an Expo Router client. React Query holds server state; Socket.IO only signals a refetch of the canonical HTTP snapshot.
- `packages/contracts` owns runtime HTTP and event shapes; `packages/api-client` validates responses with those schemas.
- `packages/database` owns Prisma schema, the single unreleased baseline migration and deterministic local/test seed.

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

## Integrity and privacy

- Bid placement is server-time, serializable, idempotent by `(bidderUserId, idempotencyKey)`, self-bid protected, phone-verified and compare-and-update guarded.
- The 60-second inclusive soft-close window, 60-second extension and 600-second cap live in `core/auction`; the resulting `endsAt` is committed with the Bid.
- Scheduler activation/close is idempotent and closes from database state, choosing the winner by amount, timestamp and ID.
- Public Product, Listing and Socket.IO projections contain no buyer contacts or seller internal identifiers. Order contacts are returned only to its seller or admin.
- Product images remain binary PostgreSQL storage for the pilot; object storage is a future operational change.

## Runtime topology and extension boundary

The API currently assumes a single scheduler and Socket.IO instance. Before multi-instance deployment, lifecycle work needs a distributed lock or external queue and realtime needs an adapter. Do not add future sale types, payments, delivery or automatic winner replacement until a product decision requires them.

## Verification

The baseline migration and seed were reset from scratch on local PostgreSQL on 2026-07-18. Current implementation status and remaining tests/UI work are owned by `11-PROJECT-STATUS.md`.

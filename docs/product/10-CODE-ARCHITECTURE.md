# bidplace — архитектура кода

Последнее обновление: 2026-07-23
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

## Confirmed next-MVP implementation boundary

The following is a confirmed target, not a claim about the current schema or API:

- a registered User may submit a public SellerProfile application, but a separately persisted admin grant is required for every seller write;
- SellerProfile stores a public profile photo, public name or seller title, description and at least one public verification source. It is separate from buyer identity, although the registration name may prefill it;
- Product requires a moderation state before public visibility. A Product remains private while it is a draft or under review; its first public transition sets immutable `publishedAt`;
- one own Product image is the MVP technical minimum. Condition is not mandatory for creator-made Product; the current optional field is preserved until a future item-class decision requires migration;
- persisted entities expose `createdAt` and `updatedAt`; append-only audit records retain immutable business facts;
- future automatic winner replacement, including any AI-assisted evidence assessment, is outside MVP and must not be added to lifecycle or Order code without a new decision.

## Integrity and privacy

- Bid placement is server-time, serializable, idempotent by `(bidderUserId, idempotencyKey)`, self-bid protected, phone-verified and compare-and-update guarded.
- The 60-second inclusive soft-close window, 60-second extension and 600-second cap live in `core/auction`; the resulting `endsAt` is committed with the Bid.
- Scheduler activation/close is idempotent and closes from database state, choosing the winner by amount, timestamp and ID.
- Public Product, Listing and Socket.IO projections contain no buyer contacts or seller internal identifiers. The exact buyer-to-seller handoff contact remains an open product and privacy decision; current Order projections must not be treated as the final handoff contract.
- Product images remain binary PostgreSQL storage for the pilot; object storage is a future operational change.

## Runtime topology and extension boundary

The API currently assumes a single scheduler and Socket.IO instance. The pilot deployment must enforce one API replica. Before multi-instance deployment, lifecycle work needs a distributed lock or external queue and realtime needs an adapter. Do not add future sale types, payments, delivery or automatic winner replacement until a product decision requires them.

## Verification

The baseline migration and seed were reset from scratch on local PostgreSQL on 2026-07-19. Closed-pilot Chromium verification starts real API and Expo web servers against isolated `bidplace_e2e`, provisions deterministic users/data, writes OTP only to a test-only file configured by `TEST_OTP_FILE`, and uses a controlled close fixture to assert the canonical Order route. `packages/api-client` wraps the selected fetch implementation so browser-native `fetch` retains its receiver. Current implementation status and remaining tests/UI work are owned by `11-PROJECT-STATUS.md`.

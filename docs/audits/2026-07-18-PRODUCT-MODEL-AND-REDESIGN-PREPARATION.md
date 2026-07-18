# bidplace — подготовительный аудит продуктовой модели и редизайна

Дата: 2026-07-18  
Тип: historical preparation audit; не канонический product contract  
Scope: текущий `feature/project-docs`, включая незакоммиченный working tree  
Ограничение: реализация Task A и Task B не выполнялась

## 1. Executive summary

Текущая архитектура надёжно реализует узкое аукционное ядро, но доменная и публичная модель центрирована вокруг `Lot` и `Auction`. Это расходится с новым направлением, где постоянной сущностью является физическая вещь (`Product`), коммерческим размещением — `Listing`, а аукцион — только один тип правил (`AuctionRules`). Переход затрагивает Prisma, baseline migration, seed, все shared contracts, Nest controllers/services, Socket.IO events, Expo Router, query keys, seller/admin flows и тесты. Его нельзя безопасно смешивать с визуальным редизайном.

Рекомендуемый нейминг: `Product -> Listing -> AuctionRules -> Bid[]`, результат успешного размещения — `Order`. В MVP `ListingType` содержит только `AUCTION`; другие значения заранее не добавляются.

Техническая база для ставок сильная: `BidsService.placeBid()` использует serializable transaction, server time, compare-and-update и post-commit events (`apps/api/src/bids/bids.service.ts:105`). Lifecycle закрывает размещение идемпотентно и детерминированно (`apps/api/src/auctions/auction-closing.service.ts:205`). Для целевой модели не хватает bid idempotency, `originalEndsAt`, soft-close update внутри той же транзакции, durable audit, клиентского realtime/reconnect и безопасного Order/handoff.

Текущее UI-направление, включая незакоммиченные файлы, уже является частью продукта для этого аудита. Оно приблизилось к Cahu/Idle Hour через крупную сетку, editorial typography, header и storefront, но одновременно внесло generic catalog/cart language, demo inventory, swatches и два конкурирующих представления одной сущности. Редизайн должен сохранить полезную основу и убрать marketplace-имитацию.

Переписывание baseline migration **не подтверждено** только по репозиторию. Не найдены remote, CI, deployment manifests или признаки production/staging DB; найден только локальный PostgreSQL. До Task A основатель должен подтвердить, что migrations нигде не применены к общей или ценной базе и никто другой не зависит от неё.

## 2. Repository and documentation scope

Прочитаны и проверены:

- `AGENTS.md`, `README.md`, `apps/mobile/AGENTS.md`;
- все `docs/product/*.md` и `docs/design/*.md`;
- `docs/research/README.md`, релевантные raw-исследования о marketplace, reserve, soft close, trust и presentation;
- `docs/audits/2026-07-18-INITIAL-REPOSITORY-AUDIT.md`;
- все `apps/api/src`, backend unit/integration test inventory;
- все `apps/mobile/src`, Expo Router routes, текущие tracked и untracked UI-файлы;
- `packages/contracts`, `packages/api-client`, Prisma schema, обе migrations и seed;
- design tokens, Tamagui config, package versions, local Docker/config and repository Git evidence.

Не читались `.env`, credentials или secrets. Не устанавливались зависимости. Не запускались migrations, seed или reset.

Working tree до аудита содержал 32 modified tracked files и незакоммиченные storefront/layout/UI files. Они анализируются как фактическая часть проекта, но их незакоммиченный статус остаётся риском стабильности baseline.

## 3. Confirmed current architecture

```text
Expo Router web/native client
  -> @bidplace/api-client
  -> /api NestJS controllers
  -> services + core auction policies
  -> Prisma 6 / PostgreSQL

Nest API process
  -> Socket.IO /realtime rooms auction:{auctionId}
  -> embedded 30-second lifecycle scheduler
```

- Monorepo: pnpm `11.7.0`, Turborepo `2.4.4`, Node requirement `>=22` (`package.json`).
- Backend: NestJS `10.4.x`, Socket.IO `4.8.1`, `@nestjs/schedule` (`apps/api/package.json`).
- Frontend: Expo `57.0.4`, Expo Router `57.0.4`, React `19.2.3`, React Native `0.86.0`, Tamagui `2.4.5`, React Query `5.101.2`, RHF `7.81.0` (`apps/mobile/package.json`).
- Persistence: `User`, `SellerProfile`, `Category`, `Lot`, `LotImage`, `Auction`, `Bid` (`packages/database/prisma/schema.prisma:11`).
- Public HTTP owner: `/api/auctions` (`apps/api/src/auctions/auction-public.controller.ts:11`).
- Bid owner: `POST /api/auctions/:auctionId/bids` (`apps/api/src/bids/auction-bids.controller.ts:11`).
- Scheduler: every 30 seconds, `waitForCompletion` only within one process (`apps/api/src/auctions/auction-closing.scheduler.ts:18`).
- Realtime events: `auction.updated`, `bid.placed`, `auction.ended` (`packages/contracts/src/events.ts:7`).
- Client has no Socket.IO package/subscription; mutation success only invalidates React Query (`apps/mobile/src/features/auctions/hooks.ts:33`).
- Images already use `expo-image`; Tamagui `Sheet` is wrapped by `AppSheet`. No `Dialog`, canonical `Select`, FlashList or app-level Reanimated usage was found.

## 4. Current product inconsistencies

The code still expresses bidplace as an auction/storefront product rather than value-centered commerce:

| Inconsistency                                                 | Evidence                                                                                | Impact                                                 |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `Lot` is the physical object and is 1:1 with `Auction`        | `schema.prisma:62`, `schema.prisma:92`                                                  | Cannot represent repeated listings over time           |
| Public identity is mutable title-derived `Auction.slug`       | `schema.prisma:96`; `/product/[id]` passes it as slug                                   | Route identity belongs to auction attempt, not product |
| Product language remains auction-centered                     | `README.md:33`, `apps/api/src/auctions`, contracts/query keys                           | Agents and clients treat auction as aggregate root     |
| Seller self-activates and publishes                           | `sellers.service.ts`; `AuctionsService.publishAuction()`                                | Conflicts with curated/manual approval                 |
| `buyNowPrice` exists without Buy Now flow                     | schema, contracts, mapper, service, tests, seller form                                  | Premature future mechanic and migration surface        |
| Hidden reserve is required and public                         | `contracts/src/auction.ts:19`; product detail displays it                               | Trust/privacy conflict; new direction removes reserve  |
| USD remains default                                           | seed, seller form, formatter defaults                                                   | Conflicts with confirmed Belarus/BYN market            |
| Public catalog fabricates demo inventory                      | `storefront-home-screen.tsx:17`, `storefront-catalog-screen.tsx:27`, `demo-products.ts` | Makes an empty curated pilot look like mass commerce   |
| `Cart`, variants and color swatches imply fixed-price catalog | `AppHeader.tsx:28`, `ProductCard.tsx:55`                                                | Product promise exceeds implemented mechanics          |

Outdated or historical phrases must not all be blindly deleted. `docs/product/02-PRODUCT-EVOLUTION.md` legitimately records earlier “auction platform” thinking. Current-facing descriptions in `README.md`, architecture/status, UI copy and symbols must be migrated after an explicit decision; historical documents should preserve chronology.

## 5. Current design inconsistencies

Useful work already present in the working tree:

- responsive sticky header and mobile drawer (`components/layout/*`);
- editorial serif/sans pairing and widened layout tokens (`theme/tokens.ts`, `tamagui.config.ts`);
- image-led storefront grid and toolbar (`components/storefront/*`);
- focused auth route shell (`app/(auth)/*`, `features/auth/auth-form.tsx`);
- reusable feedback, form and panel primitives (`components/ui/*`);
- `expo-image` for product, logo and gallery media.

Problems introduced or retained:

- Cahu-like grid is combined with fake variants/swatches, while bidplace objects are unique physical products.
- Home copy says “lifestyle commerce” and “единый visual language”, describing the design exercise rather than customer value (`storefront-home-screen.tsx:35`).
- Header includes `Cart 00/08`, English `EN`, `Search`, `Profile` and dead-end collection/about links (`AppHeader.tsx:25`; `DesktopNavigation.tsx:8`).
- `/auctions/[slug]` redirects to `/product/[slug]`, but legacy auction components/routes/query keys still remain, producing duplicate conceptual ownership.
- Public detail shows only one image and exposes reserve; it lacks provenance, participation, authoritative reconnect and Order result.
- Dark mode follows OS automatically through two parallel palette systems, while some new components hardcode white/light values. There is no visible toggle, but dark behavior is active (`theme-provider.tsx:33`, `palette.ts:8`).
- Radii range to 30 and `full`; cards/panels use repeated containers and shadows, risking “cards inside cards”.
- Mobile lint currently fails in `BrandLogo.tsx:20`, `seller-dashboard-screen.tsx:5`, `storefront-home-screen.tsx:3`.

## 6. Domain naming comparison

| Variant                                              | Clarity                                                          | API/future mechanisms                                                         | Conflicts and agent risk                                                                                             | Assessment                            |
| ---------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `Product -> Sale -> AuctionConfig -> Deal`           | `Sale` can mean campaign or completed sale; `Deal` is colloquial | `/sales` works but conflates active placement with result                     | Conflicts with existing “sale confirmation”; `Config` sounds technical                                               | Reject                                |
| `Product -> Offering -> AuctionTerms -> Transaction` | Precise but less familiar in consumer commerce                   | Extensible; `/offerings` is awkward and `Transaction` suggests payment ledger | Higher onboarding cost; “transaction” overpromises money movement                                                    | Acceptable alternative, not preferred |
| `Product -> Listing -> AuctionRules -> Order`        | Most immediately recognizable                                    | Clean `/products`, `/listings`, `/orders`; `Listing` can support future types | “Listing” can evoke marketplace, but curation policy prevents that; conflicts with current Auction root are explicit | Recommend                             |

`AuctionRules` is preferable to `AuctionConfig`: it represents immutable commercial rules copied at creation, not mutable application configuration. `Order` is preferable to `Deal`: it provides a stable authorization/public route concept without implying that payment/delivery are already automated.

## 7. Recommended final naming

```text
SellerProfile
Product -> ProductImage[]
Product -> Listing[]
Listing -> AuctionRules (only when type = AUCTION)
Listing -> Bid[]
Listing -> Order[] (winner replacement may cancel one and create another)
```

Recommendation status: audit recommendation, not yet a canonical decision. It conflicts with `docs/product/10-CODE-ARCHITECTURE.md:209`, which says not to replace `Auction` with a generic `Sale` before multiple formats. The proposed `Listing` is more constrained than that rejected `Sale` abstraction, but the architecture document and `DEC-003`/`DEC-008`/`DEC-009`/`DEC-034` still require explicit revision before implementation.

## 8. Current-to-target entity map

| Current                  | Target                                | Action                                                                            |
| ------------------------ | ------------------------------------- | --------------------------------------------------------------------------------- |
| `SellerProfile`          | `SellerProfile`                       | preserve concept; rename statuses and add explicit approval controls              |
| `Lot`                    | `Product`                             | rename and expand permanent value/provenance/delivery fields                      |
| `LotImage`               | `ProductImage`                        | rename relation/table; preserve binary validation/storage initially               |
| `Auction`                | split into `Listing` + `AuctionRules` | commercial lifecycle on Listing; auction-only prices/extensions in rules          |
| `Bid.auctionId`          | `Bid.listingId`                       | rename FK, add idempotency and audit ordering                                     |
| none                     | `Order`                               | add post-listing contact workflow; no payment/delivery machine                    |
| `Auction.slug`           | `Product.publicId`                    | generate immutable random public ID; remove title/auction slug from canonical URL |
| `winnerBidId` on Auction | winner/order relation                 | keep result evidence; Order records selected buyer and final amount               |

## 9. Proposed target domain model

Invariants:

1. `Product` is independent of a sale method and survives multiple attempts.
2. A Product can have many Listings over time, but at most one `SCHEDULED` or `LIVE` Listing.
3. MVP `ListingType` is only `AUCTION`; future enum values are not pre-added.
4. `AuctionRules` is immutable after Listing becomes `SCHEDULED`.
5. Product and Listing critical content is editable only in `DRAFT`; scheduling locks it.
6. `Bid` belongs to Listing, has a user-scoped idempotency key and server ordering.
7. `Order` is created after a successful close. Replacement creates a new Order and cancels the old one; history is never rewritten.
8. Seller receives only the accepted buyer’s contact. Other bidder contacts remain private.

## 10. Proposed Prisma model

This is a planning sketch, not implementation:

```prisma
enum SellerProfileStatus { DRAFT APPROVED SUSPENDED }
enum ProductStatus { DRAFT APPROVED ARCHIVED }
enum ListingType { AUCTION }
enum ListingStatus { DRAFT SCHEDULED LIVE ENDED CANCELLED }
enum OrderStatus { PENDING_CONTACT CONTACTED COMPLETED CANCELLED }

model Product {
  id              String   @id @default(uuid()) @db.Uuid
  publicId        String   @unique @map("public_id") @db.VarChar(16)
  sellerProfileId String   @map("seller_profile_id") @db.Uuid
  categoryId      String   @map("category_id") @db.Uuid
  title           String   @db.VarChar(200)
  story           String   @db.Text
  materials       String   @db.Text
  dimensions      String   @db.VarChar(240)
  year            Int?
  condition       String   @db.VarChar(120)
  uniqueness      String   @db.VarChar(160)
  provenance      String   @db.Text
  deliveryInfo    String   @map("delivery_info") @db.Text
  status          ProductStatus @default(DRAFT)
  images          ProductImage[]
  listings        Listing[]
}

model ProductImage {
  id         String   @id @default(uuid()) @db.Uuid
  productId  String   @map("product_id") @db.Uuid
  position   Int
  mimeType   String   @map("mime_type") @db.VarChar(100)
  byteLength Int      @map("byte_length")
  data       Bytes
  checksum   String   @db.Char(64)
  createdAt  DateTime @default(now()) @map("created_at")
  @@unique([productId, position])
  @@index([productId])
}

model Listing {
  id             String   @id @default(uuid()) @db.Uuid
  productId      String   @map("product_id") @db.Uuid
  type           ListingType @default(AUCTION)
  status         ListingStatus @default(DRAFT)
  currency       String   @db.Char(3)
  startsAt       DateTime @map("starts_at")
  originalEndsAt DateTime @map("original_ends_at")
  endsAt         DateTime @map("ends_at")
  currentPrice   Decimal  @map("current_price") @db.Decimal(12, 2)
  bidCount       Int      @default(0) @map("bid_count")
  auctionRules   AuctionRules?
  bids           Bid[]
  orders         Order[]
  @@index([status, startsAt])
  @@index([status, endsAt])
}

model AuctionRules {
  listingId                    String  @id @map("listing_id") @db.Uuid
  startPrice                   Decimal @map("start_price") @db.Decimal(12, 2)
  softCloseWindowSeconds       Int     @map("soft_close_window_seconds")
  softCloseExtensionSeconds    Int     @map("soft_close_extension_seconds")
  softCloseMaxTotalSeconds     Int     @map("soft_close_max_total_seconds")
}

model Bid {
  id             String   @id @default(uuid()) @db.Uuid
  listingId      String   @map("listing_id") @db.Uuid
  bidderUserId   String   @map("bidder_user_id") @db.Uuid
  idempotencyKey String   @map("idempotency_key") @db.VarChar(80)
  amount         Decimal  @db.Decimal(12, 2)
  createdAt      DateTime @default(now()) @map("created_at")
  @@unique([bidderUserId, idempotencyKey])
  @@index([listingId, amount, createdAt, id])
}

model Order {
  id                 String   @id @default(uuid()) @db.Uuid
  publicId           String   @unique @map("public_id") @db.VarChar(16)
  listingId          String   @map("listing_id") @db.Uuid
  sellerId           String   @map("seller_id") @db.Uuid
  buyerId            String   @map("buyer_id") @db.Uuid
  sourceBidId        String   @unique @map("source_bid_id") @db.Uuid
  finalAmount        Decimal  @map("final_amount") @db.Decimal(12, 2)
  contactDueAt       DateTime @map("contact_due_at")
  status             OrderStatus @default(PENDING_CONTACT)
  cancellationReason String?  @map("cancellation_reason") @db.Text
}
```

Prisma cannot express the “one scheduled/live Listing per Product” partial unique constraint. Baseline SQL should add a PostgreSQL partial unique index. Order also needs an invariant preventing more than one non-cancelled Order per Listing; implement it with a partial unique index or a transactionally guarded selector, not a simple `listingId @unique`, because replacement history must remain.

### Public ID generation

| Option                | Entropy/stability                                                                                | Dependency/collision handling                                                 | Assessment                           |
| --------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------ |
| Nano ID               | Strong random URL-safe IDs; length configurable                                                  | New dependency; still requires DB unique index/retry                          | Good, unnecessary dependency here    |
| Node random base64url | `randomBytes(8).toString('base64url')` gives 64 random bits in 11 URL-safe characters            | No dependency; catch unique violation and regenerate in a bounded loop        | Recommended                          |
| Shortened UUID        | Random UUID is available, but truncation silently discards entropy and format intent is unclear  | No dependency; collision retry still required                                 | Acceptable workaround, less explicit |
| Hash of internal UUID | Deterministic and can leak stable relation/predictability assumptions; truncation still collides | Requires encoding/hash policy and cannot simply retry without changing source | Reject                               |

Recommended `publicId`: 11-character Node base64url string from eight cryptographic random bytes, immutable, unique-indexed and regenerated on collision. Do not derive it from title, slug or internal UUID. The same generator can serve Product and Order through a small persistence helper without introducing Nano ID.

## 11. Migration and database assumptions

Evidence found:

- only local `docker-compose.yml` with PostgreSQL 16 and named volume;
- `.env.example` points to localhost;
- no Git remote, CI workflow, deployment manifest, production Dockerfile, staging config or migration pipeline;
- `APP_ENV` supports strings `local|staging|production`, but this is only a schema capability (`apps/api/src/core/config/env.ts:16`);
- integration tests create isolated `*_integration` schemas (`apps/api/test/integration/test-database.ts:16`).

Not provable from repository:

- whether a production/staging/shared development DB exists;
- whether migrations were applied outside local machines;
- whether another developer depends on current schema;
- whether data must be preserved.

Conclusion: baseline rewrite is **conditionally appropriate but blocked on explicit confirmation**. If confirmed no shared/deployed/valuable DB exists, Task A should edit `schema.prisma`, replace the baseline SQL with the target model, fold image table creation into it, remove obsolete migration definitions, update seed and perform a local reset only during Task A. If any shared/deployed DB exists, stop and design additive migrations and data backfill instead.

## 12. Complete occurrence inventory

### Buy Now

Production/schema occurrences:

- `packages/database/prisma/schema.prisma:107`;
- `packages/database/prisma/migrations/20260716000000_baseline/migration.sql:80`;
- `packages/contracts/src/auction.ts:28,43`;
- `apps/api/src/auctions/auction.mapper.ts:38,103`;
- `apps/api/src/auctions/auctions.service.ts:325`;
- `apps/mobile/src/features/seller/auction-create-form.tsx:56,99,233`.

Tests/fixtures: `auction.mapper.spec.ts`, `auctions.service.spec.ts`, `bids.service.spec.ts`, `admin.service.spec.ts`, `sellers.service.spec.ts`, `packages/contracts/test/contracts.test.ts`. Action: delete from all target contracts/schema/UI/tests.

### Reserve

Persistence/core/API: `schema.prisma`, baseline SQL, `contracts/src/auction.ts`, `contracts/src/events.ts`, `core/auction/pricing-policy.ts`, `core/realtime/event-mappers.ts`, `auctions/auction.mapper.ts`, `auctions.service.ts`, `auction-closing.service.ts`, `bids.service.ts`.

Frontend: `components/auction/AuctionStateBanner.tsx`, `features/auctions/auction-detail-screen.tsx`, `features/seller/auction-create-form.tsx`, `features/storefront/model.ts`, `storefront-product-screen.tsx`, demo data.

Tests: auction/bid/seller/admin unit, contracts, `auction-lifecycle.integration.spec.ts`. Action: delete reserve storage, evaluation, public fields/events, form/display and reserve-specific tests; replace close cases with “bid exists/no bid” outcomes.

### USD and currency formatting

- `packages/database/prisma/seed.js:88,135`;
- `apps/mobile/src/features/seller/auction-create-form.tsx:53,204`;
- `apps/mobile/src/lib/formatters.ts:29,34` defaults;
- tests/fixtures in auction, bid, seller, admin, contracts and lifecycle integration;
- demo products carry currency values and price-focused catalog behavior.

Action: enforce `BYN` at Listing creation and shared contracts for MVP; formatter must require currency or default to BYN only in a deliberate product helper.

### Auction-centered paths and symbols

- Backend module/controllers/services/tests: `apps/api/src/auctions/*`, `apps/api/src/bids/*`, `apps/api/src/core/auction/*`.
- Shared: `contracts/src/auction.ts`, `public-auction.ts`, `events.ts`, enum/status exports; `api-client/src/auctions.ts`, admin/seller auction methods.
- Routes: `app/(public)/auctions/[slug].tsx`, `app/(seller)/auctions/new.tsx`.
- Client: `features/auctions/*`, auction query keys/hooks/components, seller/admin auction sections.
- Realtime room/events: `realtime.gateway.ts`, `realtime-events.service.ts`, `event-mappers.ts` and tests.

Recommended action by category:

- rename public/application concepts to product/listing;
- split current `Auction` persistence/service into `Listing` lifecycle plus internal auction policy;
- preserve internally only auction rule/policy/closing symbols that are genuinely auction-specific;
- delete duplicate public `/auctions/[slug]` route after redirects are no longer needed;
- replace query keys and events atomically across contracts/server/client/tests.

### Design inventory

- themes/tokens: `packages/design-tokens/src/index.ts`, `apps/mobile/src/theme/tokens.ts`, `palette.ts`, `tamagui.config.ts`, `theme-provider.tsx`;
- logo: `assets/icon.png` via `BrandLogo.tsx`; no separate approved black/white wordmark assets;
- navigation: `components/layout/*`;
- cards: `AuctionCard.tsx`, `ProductCard.tsx`, `AppCard.tsx`, `EntityPanel.tsx`;
- forms/auth: `AppInput`, `ControlledAppInput`, `FormField`, `auth-form.tsx`;
- sheets: `AppSheet`, `FilterSheet`, mobile `SortMenu`, navigation drawer;
- seller/admin: `features/seller/*`, `features/admin/admin-dashboard-screen.tsx`;
- feedback: `LoadingState`, `EmptyState`, `ErrorState`; no offline/reconnect/success system;
- images: `expo-image` in auction/storefront/logo and seller picker flow;
- icon system: not found; header uses text actions, logo uses app icon;
- modal/dialog: no canonical confirmation dialog;
- motion: product hover/press and Expo Image transitions only; Reanimated dependency exists but no relevant use.

## 13. Route and API migration map

| Current                       | Target                                                     | Action                                                                    |
| ----------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| `GET /api/auctions`           | `GET /api/products`                                        | replace public collection mapper/query                                    |
| `GET /api/auctions/:slug`     | `GET /api/products/:publicId`                              | resolve immutable product ID and include active/recent Listing projection |
| `POST /api/seller/lots`       | `POST /api/products`                                       | rename/expand product draft                                               |
| no product patch              | `PATCH /api/products/:id`                                  | add owner/admin draft edit                                                |
| `POST /api/seller/auctions`   | `POST /api/products/:productId/listings`                   | create AUCTION Listing + AuctionRules                                     |
| publish endpoint              | `PATCH /api/listings/:id`                                  | explicit allowed draft/schedule/cancel transitions                        |
| `GET /api/seller/auctions`    | seller products/listings query                             | preserve dashboard capability under new vocabulary                        |
| `POST /api/auctions/:id/bids` | `POST /api/listings/:id/bids`                              | idempotency key required                                                  |
| seller/admin auction bids     | `GET /api/listings/:id/bids` with role-filtered projection | split public vs restricted shapes                                         |
| none                          | `GET /api/me/activity`                                     | product/listing read model, derived participation status                  |
| none                          | `GET /api/orders/:publicId`                                | seller/current buyer/admin authorization                                  |
| `/auctions/[slug]`            | delete                                                     | canonical route becomes `/product/[publicId]`                             |
| `/product/[id]`               | `/product/[publicId]`                                      | retain route shape, replace slug semantics                                |
| none                          | `/me/activity`, `/order/[publicId]`                        | add after contracts/services exist                                        |

The proposed `PATCH /products/:id` and `PATCH /listings/:id` must use internal UUIDs only on authenticated owner/admin APIs; public reads use `publicId`.

## 14. WebSocket migration map

| Current                    | Target                | Notes                                                         |
| -------------------------- | --------------------- | ------------------------------------------------------------- |
| room `auction:{auctionId}` | `listing:{listingId}` | join after authoritative HTTP snapshot                        |
| `auction.updated`          | `listing.updated`     | include `endsAt`, price, count, status and monotonic revision |
| `bid.placed`               | `bid.placed`          | change `auctionId` to `listingId`; public alias only          |
| `auction.ended`            | `listing.ended`       | include result without buyer PII                              |

Client sequence: fetch Product/Listing snapshot -> connect with listing ID/revision -> apply only newer events -> refetch on reconnect/gap -> never infer winner from event order.

## 15. Bidding and scheduler analysis

Current strengths:

- one service entry point;
- server time and strict `endsAt > now` check;
- serializable transaction with retry;
- compare-and-update on current price and end time;
- deterministic tie-break by amount, creation time and ID;
- idempotent close predicate and post-commit event publication.

Required Task A changes:

1. Insert/replay by `(bidderUserId, idempotencyKey)` inside the transaction.
2. Reject reuse of a key with different listing/amount.
3. Update price, bid count and soft-close `endsAt` in one guarded statement.
4. Persist accepted/rejected attempt audit separately from mutable Bid status if rejected attempts must be investigated.
5. Scheduler selects by current `Listing.endsAt`, then rechecks it inside its serializable transaction.
6. Bid vs scheduler conflict must retry; after retry, exactly one result is valid: accepted+extended or ended+rejected.
7. Events publish only after commit; reconnect uses HTTP snapshot.
8. Add partial indexes/constraints for active Listing and active Order.

## 16. Soft-close implementation analysis

Approved preparation defaults:

```text
window = 60 seconds
extension = 60 seconds
max total extension = 600 seconds
```

On an accepted bid:

```text
if 0 < endsAt - now <= 60s:
  nextEndsAt = min(endsAt + 60s, originalEndsAt + 600s)
else:
  nextEndsAt = endsAt
```

Boundary is inclusive at exactly 60 seconds. Defaults are copied into `AuctionRules`; existing Listings never read mutable global defaults again.

Concurrency detail: two simultaneous bids are serialized. The second evaluates the committed current `endsAt`, so it does not automatically duplicate an extension. The scheduler must guard on the same current `endsAt`; a transaction that observed an expired old value must lose/retry if a bid extended it first.

Current code has no `originalEndsAt`, rule fields, idempotency or client subscription. `mapAuctionUpdatedEventPayload()` already carries `endsAt`, which is reusable after renaming, but it lacks event revision/gap recovery.

## 17. Product and Listing moderation feasibility

| Option                                        | Complexity                                              | Risk                                                                            | Recommendation                                  |
| --------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------- |
| A. Conditional admin controls on normal pages | Low–medium; reuse Product/Seller screens and role guard | Must prevent controls leaking into public projection and add confirmation/audit | Preferred for Task A                            |
| B. Separate admin table                       | Medium–high                                             | Duplicated layouts/data and dashboard feel; unnecessary for first pilot         | Defer                                           |
| C. Admin API only                             | Low                                                     | Safe backend, but operations require manual HTTP tooling and are error-prone    | Acceptable short bridge, not completed pilot UX |
| D. Direct DB edits                            | Lowest code                                             | No durable reason/audit; highest operator risk                                  | Hack; only emergency bootstrap before pilot     |

Task A should implement approval/suspension/archive transitions in services/controllers plus small conditional admin controls on existing SellerProfile/Product pages. A separate review queue, comments and multi-level workflow remain out of scope. Critical edits lock at `SCHEDULED`; changing terms requires cancellation and a new Listing.

## 18. Order and winner-replacement analysis

Minimum close transaction:

1. Close Listing once using DB state.
2. Select highest valid Bid.
3. Create Order with immutable `sourceBidId`, buyer/seller IDs, amount and contact deadline.
4. Expose `/order/[publicId]` only to seller, selected buyer and admin.
5. Keep phone/Telegram out of public Product/Listing/events.

Replacement remains manual:

- cancel current Order with reason;
- show admin ranked valid bids without releasing contacts;
- admin contacts the next bidder outside platform;
- after consent, create a new Order from that bidder’s last valid Bid;
- only then release that buyer’s verified contact to seller.

Future safe automation requires explicit offer state, offer expiry, consent capture, idempotent promotion command, immutable reason/audit and notifications. It must never bulk-reveal bidder contacts or rewrite original bid/winner history.

## 19. Activity analysis

No current route/query/model represents user participation. Bid status is stored globally and cannot directly represent a user-facing status across lifecycle changes.

Target `GET /api/me/activity` should aggregate latest user Bid per Listing with Product and derive:

- `LEADING` from latest accepted bid equals current leading bid while LIVE;
- `OUTBID` from a higher current bid while LIVE;
- `WON` from an Order for the user;
- `LOST` after ENDED without an active Order;
- `AWAITING_SELLER_CONTACT` from Order state;
- `WIN_CANCELLED` from cancelled Order;
- `COMPLETED` from manually completed Order.

Do not persist `LEADING`/`OUTBID` booleans. Add query keys under `['user','activity']`, route `/me/activity`, title “Мои покупки”, and cards centered on Product rather than raw Bid rows.

## 20. Existing frontend component reuse map

| Existing                  | Reuse                    | Required change                                                                         |
| ------------------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `Screen`                  | yes                      | light-only background and finalized responsive spacing                                  |
| `AppHeader` + drawer      | partial                  | remove cart/fake sections; map product navigation and role actions                      |
| `BrandLogo`               | structural only          | replace app icon with approved mono assets when supplied                                |
| `ProductGrid`             | yes for real collections | no demo fallback; prove mobile column density                                           |
| `ProductCard`             | strong base              | remove swatches/variants; add author, current price/time/status sparingly               |
| `ProductToolbar`/Sheets   | partial                  | keep only meaningful filters/sort; accessible focus/keyboard                            |
| `StorefrontProductScreen` | layout base              | replace reserve/catalog framing with gallery, story, provenance and Listing panel       |
| `BidPanel`                | behavior shell           | confirmation, idempotency, phone gate, own status and reconnect                         |
| `AuctionTimer`            | partial                  | server offset, changed endsAt, background resume and non-noisy announcements            |
| `AppButton`               | yes                      | single canonical button; delete `PrimaryButton` alias                                   |
| `AppCard`/`EntityPanel`   | consolidate              | define content vs operational panel; reduce nested containers/shadows                   |
| `AppInput`/`FormField`    | yes                      | light tokens, autofill/keyboard/error QA                                                |
| `AppSheet`                | yes                      | mobile menu/filter/sort; not universal replacement for Dialog                           |
| auth form                 | partial                  | remove heavy card where appropriate; preserve focused single action and redirect-to-bid |
| seller/admin screens      | functional reuse         | vocabulary/model rewrite in Task A, visual hierarchy in Task B                          |

## 21. Existing design-system inventory

- Color: two duplicate semantic light/dark maps plus hardcoded whites, borders and image backgrounds.
- Typography: Inter body + Cormorant Garamond headings; useful editorial direction, not yet approved brand.
- Spacing: 2–96 px scale; suitable.
- Radii: 2–30/full; too broad without component rules.
- Shadows: six shared web strings plus local React Native card shadow; should be reduced.
- Breakpoints: 640/1024/1025/1440; sufficient for target responsive web.
- Controls: 40/48/64 heights and touch 44; large button currently 64, potentially oversized for utility flows.
- Forms: labels/errors exist; auth, seller and admin use shared inputs.
- Feedback: loading/empty/error exist; offline/stale/reconnect/success missing.
- Media: `expo-image` installed and used; gallery shows only first image.
- Icons: no coherent system. Do not add a second UI kit; use a small deliberate icon source only if text actions are insufficient.

Stack applicability:

| Tool             | Existing                      | Use                                                                               |
| ---------------- | ----------------------------- | --------------------------------------------------------------------------------- |
| Tamagui `Sheet`  | yes through `AppSheet`        | mobile menu, filter and sort                                                      |
| Tamagui `Dialog` | package available, no wrapper | confirmations and desktop modal semantics; create one canonical wrapper in Task B |
| Tamagui `Select` | package available, not used   | seller/admin finite choices after keyboard/native QA                              |
| `expo-image`     | installed and used            | Product gallery/card media; retain                                                |
| Reanimated       | installed, no relevant usage  | only limited panel/gallery transitions with reduced-motion support                |
| FlashList        | not installed                 | do not add until real catalog/activity volume proves virtualized list need        |

No extra visual library is required. Task A will need a client realtime transport such as `socket.io-client` unless the existing backend protocol is replaced; that is a functional dependency, not a redesign dependency. A browser E2E tool will also require a separate approved testing choice because none is installed.

## 22. Reference-pattern analysis

References were analyzed from supplied screenshots and current pages on 2026-07-18:

- [Idle Hour Matcha](https://idlehourmatcha.com): minimal `Shop/About` navigation, centered expressive mark, large editorial hero, short sentence and one black CTA. Adopt hierarchy, restraint and identity; do not copy cart/retail mechanics.
- [Cahu Paris collection](https://en.cahuparis.com/collections/ope-f): edge-to-edge high-density product imagery, thin toolbar, minimal card metadata, filters and sorting. Adopt image dominance and whitespace; replace color variants with author/status/time relevant to unique Products.
- imwater screenshots supplied by the founder: precise sans typography, thin borders, focused forms, blue action, black full-screen overlays/panels. Adopt technology clarity and occasional dark overlays; do not make the whole product dark.
- Shopify account screenshots: one focused task, generous whitespace, simple field/action rhythm. Adopt for login/OTP; do not copy purple or Shop branding.
- Artsy/Catawiki/Sotheby’s: use as information-architecture references for provenance, gallery and auction trust, not as visual copies.

Target synthesis: `editorial minimal commerce` + `curated gallery` + `modern transaction utility`; premium through attention and typography, approachable through plain Russian and predictable controls.

## 23. Light-theme and accent recommendations

MVP recommendation: light-only runtime theme. Keep semantic token names, remove OS-driven dark selection and dark theme exports from active configuration. Dark full-screen panels may be local semantic surfaces over imagery; they are not a second global theme.

All proposed default accents meet WCAG AA with white text:

| Family         | Default / contrast white | Hover     | Pressed   | Focus     | Light tint | Fit                                                 |
| -------------- | ------------------------ | --------- | --------- | --------- | ---------- | --------------------------------------------------- |
| Neutral cobalt | `#2457E6` / 5.86:1       | `#1E49C7` | `#18399D` | `#7FA1FF` | `#EEF3FF`  | Clearest utility/action blue; recommended           |
| Indigo         | `#3F46C8` / 7.19:1       | `#3439AB` | `#292E8A` | `#8990F2` | `#EFF0FF`  | More classic/editorial, calm and mature             |
| Blue-violet    | `#5B3FD1` / 6.83:1       | `#4D34B5` | `#3C288E` | `#9A83F5` | `#F2EEFF`  | Younger expression; easiest to drift toward Shopify |

Use accent for primary buttons, focus, links and active participation only. Success/warning/danger remain separate semantic tokens; “leading” must not rely on blue alone. Final selection belongs to explicit Task B approval. Neutral cobalt is the lowest-risk recommendation.

## 24. Task A: isolated domain/application refactor plan

1. Record founder decisions revising naming, reserve, hard/soft close, public route and Order scope.
2. Confirm database/migration assumption.
3. Rewrite schema/baseline/seed for Product, ProductImage, Listing, AuctionRules, Bid idempotency and Order foundation.
4. Replace enums/contracts and public/private projections; BYN only.
5. Refactor Nest modules: Product content, Listing lifecycle, auction policy, bids, Orders, moderation and activity.
6. Implement soft close atomically with current-price/end-time guard.
7. Rename REST routes, client methods, Socket.IO rooms/events and React Query keys.
8. Functionally adapt existing screens/routes without new visual tokens/layouts.
9. Add minimal seller/product admin controls and Order authorization.
10. Migrate tests and run concurrency/reconnect/rehearsal checks.
11. Synchronize canonical product, architecture, status, design flow/status and decisions.

Explicitly excluded: palette, typography, logo, new catalog composition, decorative motion and visual cleanup unrelated to functional adaptation.

## 25. Task B: isolated visual redesign plan

Starts only after Task A contracts/routes are stable.

1. Approve light-only theme, cobalt/indigo choice, typography/license and mono logo assets.
2. Consolidate semantic tokens and canonical primitives.
3. Redesign header/navigation from Idle Hour restraint without cart/shop promises.
4. Redesign real Product grid/card/toolbar from Cahu patterns.
5. Redesign Product detail: gallery, author, story, provenance, price/time/status and bidding utility.
6. Redesign auth/OTP, activity, Order summary, seller forms and conditional admin controls.
7. Specify loading/empty/error/offline/stale/reconnect/success states.
8. QA responsive browser matrix, keyboard, focus, contrast, screen reader, reduced motion and extreme content.
9. Remove demo inventory and duplicate primitives only when replacements are verified.

Task B must not change schema, API semantics, route semantics, soft-close math, Order workflow or product eligibility.

## 26. Test migration plan

### Unit

- public ID generation/collision retry;
- Product/Listing edit locks and moderation transitions;
- BYN formatting;
- activity derivation;
- Order authorization/replacement selection;
- event mapper privacy and revisions.

### PostgreSQL integration

- one active Listing per Product;
- bid idempotency replay and mismatched payload rejection;
- concurrent price ordering;
- Order uniqueness/replacement history;
- scheduler/bid race and rollback.

### Required soft-close matrix

- bid at 61 seconds: no extension;
- exactly 60 seconds: +60;
- at 1 second: +60;
- simultaneous bids: consistent price and at most valid sequential extensions;
- repeated idempotency key: one Bid and same response;
- cap at `originalEndsAt + 600s`;
- bid concurrent with scheduler: either accepted+extended or closed+rejected;
- refresh after extension: new `endsAt` from HTTP;
- reconnect after extension: snapshot then newer events.

### E2E/rehearsal

- public Product -> login -> OTP -> return -> bid -> activity -> Order;
- seller create/edit/schedule locks;
- admin approve/suspend/archive and no-control non-admin view;
- direct `/product/[publicId]`, `/me/activity`, `/order/[publicId]` routes;
- 10 near-simultaneous sessions;
- iPhone Safari, Android Chrome, macOS Chrome/Safari, Windows Chrome;
- narrow/desktop, keyboard, screen reader and offline/reconnect.

No Playwright/Cypress/Detox/Maestro setup currently exists. Frontend has only 3 unit tests in `query-cache.spec.ts`.

## 27. Risks and hidden coupling

1. Current `Auction` contract is reused in public, seller, admin, bid responses and events; one rename affects every layer.
2. `Lot.auction` is 1:1 and `Auction.lotId` unique; repeated Listing requires real data-model change, not aliases.
3. Winner is stored as `winnerBidId` while Bid statuses are mutated; Order replacement needs immutable history.
4. Soft close changes current end-time during the same race scheduler already handles.
5. Embedded scheduler is safe per process only; multi-instance topology remains unresolved.
6. Working-tree storefront and design tokens are uncommitted and mobile lint is red.
7. Demo data currently masks empty/live/error UX and can invalidate design QA.
8. Binary images in PostgreSQL are acceptable for pilot but Product expansion increases DB size/capacity coupling.
9. Public ID collision retry must be implemented around a database unique constraint, not probability alone.
10. New preparation decisions conflict with protected/canonical docs; implementation before explicit revision would create two truths.

## 28. Blocking questions

Implementation must not start until these are answered:

1. Is `Product -> Listing -> AuctionRules -> Order` explicitly approved as canonical naming?
2. Is hard close (`DEC-008`) replaced by the stated 60/60/600 soft close for MVP?
3. Is hidden reserve (`DEC-034`, RFC and trust docs) explicitly removed, with start price equal to seller minimum?
4. Is Order foundation now part of MVP despite roadmap previously placing Order/payment readiness later?
5. Are Product and Seller status sets in this prompt the exact canonical MVP states?
6. Is `/product/[publicId]` the only public detail route and should `/auctions/[slug]` be deleted without a long redirect period?
7. Does any production, staging, shared development or teammate-owned database exist, and have current migrations been applied there?
8. May local data be destroyed/reset during Task A after confirmation?
9. What exact Product fields are required vs optional, especially year, dimensions, delivery and provenance evidence visibility?
10. What are the initial `Order.status` values and contact deadline default?
11. Who is admin, and how is the first admin account bootstrapped without direct DB mutation?
12. Are light-only theme, removal of OS dark mode and neutral cobalt approved for Task B, or only recommended?
13. Which black/white logo files are canonical, or should Task B wait for brand assets?

## 29. Exact files expected to change in Task A

Existing owners:

- `packages/database/prisma/schema.prisma`;
- `packages/database/prisma/migrations/20260716000000_baseline/migration.sql`;
- conditionally remove/fold `packages/database/prisma/migrations/20260717001000_lot_images/migration.sql`;
- `packages/database/prisma/seed.js`;
- all `packages/contracts/src/{enums,lot,auction,public-auction,bid,events,dashboard,index}.ts` and contract tests;
- `packages/api-client/src/{lots,auctions,admin,sellers,index}.ts`;
- `apps/api/src/app.module.ts`;
- current `apps/api/src/{lots,images,auctions,bids,admin,sellers,core/auction,core/realtime}/**` and their tests;
- `apps/api/test/integration/{auction-lifecycle,images}.integration.spec.ts` plus new Product/Listing/Order/activity integration files;
- Expo routes under `apps/mobile/src/app/(public)`, `(seller)`, `(admin)` and new `/me/activity`, `/order/[publicId]` routes;
- `apps/mobile/src/features/{auctions,storefront,seller,admin,sellers}/**`, query cache and tests;
- auction/storefront components only as required for functional contract adaptation.

Expected new module/file groups: `apps/api/src/products/**`, `listings/**`, `orders/**`, `activity/**`; `packages/contracts/src/{product,listing,order,activity}.ts`; corresponding API client and mobile feature files. Exact filenames should follow existing controller/service/module patterns during Task A.

## 30. Exact files expected to change in Task B

- `packages/design-tokens/src/index.ts`;
- `apps/mobile/src/theme/{tokens,palette}.ts`;
- `apps/mobile/tamagui.config.ts`;
- `apps/mobile/src/providers/theme-provider.tsx` and `app/_layout.tsx`;
- `apps/mobile/src/components/layout/*`;
- `apps/mobile/src/components/storefront/*` after Task A renames them to product components;
- `apps/mobile/src/components/ui/{AppButton,PrimaryButton,AppCard,EntityPanel,AppInput,FormField,AppSheet,Screen,StatusBadge,*State}.tsx`;
- Product detail/bid/activity/order/auth/seller/admin screens produced by Task A;
- `apps/mobile/assets/*` only after approved mono logo assets exist;
- UI/accessibility/visual tests and design documentation.

Task B must not touch Prisma, backend services, shared business contracts or API client semantics.

## 31. Required documentation updates after each task

After Task A:

- add explicit revisions to `docs/product/12-DECISION-LOG.md` referencing `DEC-003`, `DEC-008`, `DEC-009`, `DEC-034` and the new domain/public route/Order decisions;
- update protected/RFC documents only after founder approval: `01`, `02`, `05`, `06`, `08`, `09` as required;
- update `10-CODE-ARCHITECTURE.md`, `11-PROJECT-STATUS.md`, README and project index;
- update `docs/design/02-USER-FLOWS-AND-SCREENS.md` and `04-DESIGN-STATUS.md` for route/state changes, without claiming redesign.

After Task B:

- update protected `docs/design/01-DESIGN-FOUNDATION.md` only from the explicit founder design decision;
- update `03-DESIGN-SYSTEM.md`, `04-DESIGN-STATUS.md`, `05-DESIGN-HANDOFF.md` and affected flow descriptions;
- update `11-PROJECT-STATUS.md` only for verified UI behavior/readiness;
- preserve this audit as a historical preparation snapshot.

## 32. Recommended commit sequence

Task A should be a dedicated `feature/product-listing-model` branch with reviewable commits:

1. canonical decision/docs update;
2. schema + baseline + seed;
3. contracts + API client;
4. Product/Listing/AuctionRules services and routes;
5. bid idempotency + soft close + scheduler/events;
6. Order/activity/moderation;
7. functional Expo route/data-layer adaptation;
8. tests/rehearsal fixes and final status docs.

Task B should start from completed Task A on a separate `feature/editorial-redesign` branch:

1. approved brand/tokens/light theme;
2. primitives/header/navigation;
3. Product collection/card/detail and bidding states;
4. auth/activity/Order;
5. seller/admin functional visual layer;
6. responsive/a11y/design QA and docs.

No commit was created by this audit.

## Verification executed for this audit

- TypeScript `--noEmit`: mobile, API, contracts, API client, database, config and design tokens passed.
- API unit: 26 files, 156 tests passed.
- Contracts: 27 tests passed.
- Mobile unit: 3 tests passed.
- API lint: passed.
- Mobile lint: failed with the 3 existing working-tree errors listed in section 5.
- PostgreSQL integration: could not run because `127.0.0.1:5432` was unavailable; 13 DB tests skipped and teardown then reported missing context. The primary database was not started or reset.
- No coverage script or threshold exists for backend or frontend, so statement/branch coverage was not measured. Existing API tests cover services/policies broadly; frontend behavior coverage remains limited to query-cache unit tests.
- No repository E2E runner exists.
- Build/export intentionally not run because they create generated output and the audit permits only one new report file; the previous initial audit records successful API build and Expo exports on the same date.

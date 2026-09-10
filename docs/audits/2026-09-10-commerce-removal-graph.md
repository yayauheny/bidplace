# commerce removal graph (P0–P1)

Date: 2026-09-10  
Status: P0 inventory complete; **P1 client removal executed in active `main`**  
Owner decision: `DEC-087`  
Archive SHA: `598d8696295d18d32956da7dd366dc19464cc366`  
Proposal: [`2026-09-10-portfolio-simplification-and-commerce-archive.md`](2026-09-10-portfolio-simplification-and-commerce-archive.md)

This document is the file-level dependency map for P1–P6. Prisma model
removal is **P4 only** after the database decision matrix is closed.

## Database decision matrix

| Environment | Migration state | Retained commerce data | Decision |
| --- | --- | --- | --- |
| Local dev / test (Compose Postgres on `127.0.0.1:5432`) | Forward chain applied via `pnpm db:migrate` in dev/test | Demo Bid/Order fixtures allowed only with `ALLOW_DESTRUCTIVE_DEMO_SEED=true` | Safe to reset locally; do not infer prod path |
| Staging | **Unknown** — operator confirmation required | **Unknown** | **Blocker** for P4 drops |
| Production-like / pilot | **Unknown** — operator confirmation required | **Unknown** | **Blocker** for P4 drops |

Before P4: record applied migration IDs per environment, run backup + restore drill
(`docs/ops/00-RELEASE-AND-BACKUP.md`), then choose forward migrations or a new
portfolio baseline — never edit already-applied migration files.

## P1 — Client portfolio-native

**Status: done (2026-09-10).** Public screens import `WorkCoverCard` /
`WorkCoverCardGrid` only. Commerce routes and bid primitives are gone from the
default mobile tree. Contracts, Nest, `COMMERCE_ENABLED`, and Prisma remain for P2–P4.

**Removed:** auction vocabulary on public surfaces. **Kept:** `WorkCoverCard`
as the card master.

### Adapters and cards

| File | Role | P1 action |
| --- | --- | --- |
| `apps/mobile/src/components/ui/auction-card-item.ts` | `toAuctionCardItem`, `listing: null` adapter | Remove; map portfolio DTOs directly |
| `apps/mobile/src/components/ui/AuctionCard.tsx` | Wraps `WorkCoverCard` in `mode="portfolio"` | Replace with `WorkCard` or use `WorkCoverCard` directly |
| `apps/mobile/src/components/ui/AuctionCardGrid.tsx` | Re-export | Remove with card rename |
| `apps/mobile/src/components/ui/auction-card-layout.ts` | Price/status chip logic | Remove or fold non-commerce layout only |
| `apps/mobile/src/components/ui/auction-card-layout.spec.ts` | Tests above | Remove/replace |
| `apps/mobile/src/components/ui/index.ts` | Barrel export | Drop auction exports |
| `apps/mobile/src/components/ui/ResilientRemoteImage.tsx` | `AuctionCard` component key | Rename to `WorkCard` |

### Screen consumers

| File | Commerce coupling |
| --- | --- |
| `apps/mobile/src/features/home/home-screen.tsx` | `toAuctionCardItem`, `AuctionCardGrid` |
| `apps/mobile/src/features/search/search-screen.tsx` | same |
| `apps/mobile/src/features/products/product-list-screen.tsx` | `AuctionCard`, adapter |
| `apps/mobile/src/features/products/product-screen.tsx` | related works grid |
| `apps/mobile/src/features/sellers/public-seller-screen.tsx` | author works grid |
| `apps/mobile/src/features/products/portfolio-work-adapter.ts` | `relatedItems` via adapter |
| `apps/mobile/src/features/products/portfolio-work-adapter.spec.ts` | adapter expectations |

### Commerce-only UI (not public MVP)

| File / route | Role |
| --- | --- |
| `apps/mobile/src/components/ui/SlideToBid.tsx` | Bid CTA |
| `apps/mobile/src/components/ui/slide-to-bid-geometry.ts` | Geometry helper |
| `apps/mobile/src/components/ui/slide-to-bid-geometry.spec.ts` | Tests |
| `apps/mobile/src/app/me/activity.tsx` | Buyer activity |
| `apps/mobile/src/app/(seller)/orders.tsx` | Seller inbox |
| `apps/mobile/src/app/(seller)/listings/new.tsx` | Listing creation |
| `apps/mobile/src/app/order/[publicId].tsx` | Order detail |
| `apps/mobile/src/features/orders/order-screen.tsx` | Order UI |
| `apps/mobile/src/features/orders/seller-orders-screen.tsx` | Seller orders |
| `apps/mobile/src/features/activity/activity-screen.tsx` | Activity UI |
| `apps/mobile/src/components/layout/AccountMenu.tsx` | `/orders` link |
| `apps/mobile/src/features/sellers/seller-profile-screen.tsx` | `/orders` link |

### Commerce e2e (remove or move to archive-only CI job later)

- `apps/mobile/e2e/auction-bidding.spec.ts`
- `apps/mobile/e2e/auction-closing.spec.ts`
- `apps/mobile/e2e/auction-creation.spec.ts`
- `apps/mobile/e2e/auction-integrity.spec.ts`
- `apps/mobile/e2e/order-handoff.spec.ts`
- `apps/mobile/e2e/00-seeded-demo.spec.ts` (partial — bid paths)
- `apps/mobile/e2e/wave-one.spec.ts` (partial)
- `apps/mobile/e2e/wave-c-screen-acceptance.spec.ts` (partial)
- `apps/mobile/e2e/wave-b-route-states.spec.ts` (partial)
- `apps/mobile/e2e/support/auction-actions.ts`

**P1 exit (met):** public screens import no `Auction*` adapter; no reachable commerce routes
in default mobile build.

## P2 — Contracts and API client

### Contract modules (`packages/contracts/src/`)

| File | Commerce surface |
| --- | --- |
| `bid.ts` | Bid DTOs |
| `listing.ts` | Listing DTOs |
| `order.ts` | Order projections |
| `activity.ts` | Buyer activity |
| `dashboard.ts` | Seller dashboard listings |
| `discovery.ts` | `priceMin`/`priceMax`, price sorts |
| `public-product.ts` | `listing` nullable field |
| `public-seller.ts` | `priceAsc`/`priceDesc` sorts |
| `events.ts` | Realtime commerce payloads |
| `enums.ts` | Listing/Order enums (shared with Prisma until P4) |
| `index.ts` | Re-exports |

Keep untouched for portfolio: `portfolio.ts`, `seller-profile.ts`, `admin.ts`
(curator selection only — trim listing/order admin schemas in P3).

### API client (`packages/api-client/src/`)

| File | Endpoints |
| --- | --- |
| `listings.ts` | `/api/listings/*`, bids |
| `orders.ts` | `/api/orders/*` |
| `activity.ts` | `/api/me/activity` |
| `admin.ts` | listing emergency, order cancel/replacement, ranked bids |
| `discovery.ts` | commerce home discovery |
| `products.ts` | legacy public product catalog |
| `index.ts` | Client composition |

**P2 exit:** default web/mobile portfolio flows use only `portfolio` (+ auth/seller
write) clients; contract tests prove no commerce fields on portfolio responses.

## P3 — Nest runtime composition

### Default `AppModule` imports to remove

[`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts):

- `ListingsModule`, `BidsModule`, `LifecycleModule`, `OrdersModule`,
  `ActivityModule`, `RealtimeModule`
- Evaluate `DiscoveryModule` — commerce home; portfolio uses `PortfolioModule`

### Module directories (51 TS files under)

- `apps/api/src/bids/` (8 files)
- `apps/api/src/listings/` (5 files)
- `apps/api/src/orders/` (10 files)
- `apps/api/src/lifecycle/` (3 files)
- `apps/api/src/activity/` (5 files)
- `apps/api/src/realtime/` (8 files)
- `apps/api/src/discovery/` (4 files)
- `apps/api/src/core/commerce/` (6 files)
- `apps/api/src/core/auction/` (7 files)

### Controllers guarded by `CommerceEnabledGuard`

- `apps/api/src/products/products.controller.ts`
- `apps/api/src/discovery/discovery.controller.ts`
- `apps/api/src/sellers/sellers.controller.ts` (partial public catalog paths)
- `apps/api/src/listings/listings.controller.ts`
- `apps/api/src/bids/bids.controller.ts`
- `apps/api/src/orders/orders.controller.ts`
- `apps/api/src/activity/activity.controller.ts`

### Admin commerce mutations

- `apps/api/src/admin/admin.controller.ts` — ranked bids, needs-order, emergency
  cancel, order cancel/replacement
- `apps/api/src/admin/admin-listing-emergency.service.ts`
- `apps/api/src/admin/admin-analytics.service.ts` — bid/order/listing aggregates
- `apps/api/src/admin/admin.module.ts` — `OrdersModule`, `RealtimeModule` imports

### Config boundary

- `apps/api/src/core/config/env.ts` — `COMMERCE_ENABLED`
- `apps/api/src/core/commerce/commerce-capability.module.ts`
- `apps/api/src/core/commerce/commerce-enabled.guard.ts`

After P3: delete guard only when no route registers; env flag must not resurrect
commerce via orphaned modules.

### Integration tests (commerce-dedicated)

- `apps/api/test/integration/commerce-disabled-reads.integration.spec.ts`
- `apps/api/test/integration/auction/` (4 specs + fixtures)
- `apps/api/test/integration/order-mutations.integration.spec.ts`
- `apps/api/test/integration/order-replacement.integration.spec.ts`
- `apps/api/test/integration/seller-orders-inbox.integration.spec.ts`
- `apps/api/test/integration/seller-orders-inbox-http.integration.spec.ts`
- `apps/api/test/integration/admin-listing-emergency.integration.spec.ts`
- `apps/api/test/integration/product-listing.integration.spec.ts` (partial)

**P3 exit:** default API boot has no commerce controller, scheduler close job, or
Socket.IO commerce registration; negative tests for removed routes.

## P4 — Persistence (blocked until matrix closed)

### Prisma models — do not drop until P4 approved

From [`packages/database/prisma/schema.prisma`](../../packages/database/prisma/schema.prisma):

- Enums: `ListingType`, `ListingStatus`, `OrderStatus`, `OrderCancellationReason`,
  `HandoffContactType`, `HandoffInitiator`; `AuditTargetType` values `ORDER`, `LISTING`
- Models: `Listing`, `AuctionRules`, `Bid`, `Order`
- Relations: `Product.listings[]`, user bid/order relations, audit targets

### Seed / demo

- `packages/database/prisma/seed.js` — auction demo fixtures
- `apps/api/test/integration/auction/fixtures.ts`
- `apps/api/test/integration/order-fixtures.ts`

**P4 exit:** fresh DB and each supported existing DB reach portfolio schema through
tested upgrade or baseline procedure.

## P5 — Test replacement

Replace removed suites with portfolio boundary tests:

- No price/listing/bid/order fields in `GET /api/portfolio/*`
- Removed commerce routes return 404 (not 403-only)
- No commerce scheduler registration at boot
- Author/work permissions unchanged

## P6 — Documentation and dependency closure

- Cruft search for `AuctionCard`, `Listing`, `COMMERCE_ENABLED`, `/api/orders`
- Update `10-CODE-ARCHITECTURE.md` persistence diagram when models drop
- Update `04-DESIGN-STATUS.md` when post-MVP captures leave active tree
- Verify `git diff --name-only -- '*.pen'` empty

## Shared infrastructure — verify before delete

| Area | Keep if used by portfolio |
| --- | --- |
| `apps/api/src/core/rules-acceptance.ts` | May shrink when bid rules gate removed |
| `packages/contracts/src/rules.ts` | Bid acceptance — portfolio may drop buyer bid flow |
| Analytics admin aggregates | Trim commerce metrics or gate behind archive job |
| `Product` / revision model | **Keep** — portfolio core |
| Handoff fields on `SellerProfile` | **Keep** — private author contact, not commerce sale |

## Go / no-go checklist (P0 complete)

- [x] Archive branch and tag at verified SHA
- [x] Recovery drill passed (with documented build/docker caveats)
- [x] Zip backup outside repo
- [x] `DEC-087` recorded
- [x] File-level removal graph exists
- [x] P1 client portfolio-native executed
- [ ] Remote archive refs pushed and protected
- [ ] Staging/prod DB inventory confirmed

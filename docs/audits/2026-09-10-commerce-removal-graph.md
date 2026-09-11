# commerce removal graph (P0–P6)

Date: 2026-09-11
Status: P0–P3, Nest-only contract drop, P5, P6, and DEC-087 review blockers executed locally; **P4 blocked**; archive refs on origin; **GitHub rulesets pending**
Owner decision: `DEC-087`
Archive SHA: `598d8696295d18d32956da7dd366dc19464cc366`
Proposal: [`2026-09-10-portfolio-simplification-and-commerce-archive.md`](2026-09-10-portfolio-simplification-and-commerce-archive.md)

This document is the file-level dependency map for P1–P6. Prisma model
removal is **P4 only** after the database decision matrix is closed.

## Database decision matrix

| Environment | Migration state | Retained commerce data | Decision |
| --- | --- | --- | --- |
| Local dev / test (Compose Postgres on `127.0.0.1:5432`) | Forward chain applied via `pnpm db:migrate` in dev/test | Neutralize leftover `SCHEDULED`/`LIVE` with `pnpm ops:commerce-inventory --apply` (`CANCELLED`). Seed no longer inserts Listing/Bid/Order. | Safe to reset locally; do not infer prod path |
| Staging | **Unknown** — operator confirmation required | **Unknown** | **Blocker** for P4 drops |
| Production-like / pilot | **Unknown** — operator confirmation required | **Unknown** | **Blocker** for P4 drops |

Before P4: record applied migration IDs per environment, run backup + restore drill
(`docs/ops/00-RELEASE-AND-BACKUP.md`), then choose forward migrations or a new
portfolio baseline — never edit already-applied migration files.

## P1 — Client portfolio-native

**Status: done (2026-09-10).** Public screens import `WorkCoverCard` /
`WorkCoverCardGrid` only. Commerce routes and bid primitives are gone from the
default mobile tree. Nest, `COMMERCE_ENABLED`, and Prisma remain for P3–P4.

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

**Status: done (2026-09-10) for client composition; Nest-only Zod dropped 2026-09-11 (`ab0a7c0`).** `dashboard.ts` deleted
after moving seller product and category list schemas. `createApiClient` no
longer composes listings/orders/activity/discovery. Listing/bid/order/activity
/discovery/events/public-product/public-seller files are deleted. Prisma
Listing/Order enums remain in `enums.ts` until P4.

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

**P2 exit (met):** default web/mobile portfolio flows use only `portfolio`
(+ auth/seller write) clients; contract tests prove no commerce fields on
portfolio responses. Nest-only commerce Zod files are deleted. Prisma enums
remain until P4.

## P3 — Nest runtime composition

**Status: done (2026-09-11, `7c6b187`).** Default boot has no commerce
controllers, listing-close cron, or Socket.IO. Removed routes are unmatched
404, not `CommerceEnabledGuard` 403. `COMMERCE_ENABLED` is deleted.

### Default `AppModule` imports removed

[`apps/api/src/app.module.ts`](../../apps/api/src/app.module.ts):

- `ListingsModule`, `BidsModule`, `LifecycleModule`, `OrdersModule`,
  `ActivityModule`, `RealtimeModule`, `DiscoveryModule`, `ScheduleModule`

### Module directories removed from the active tree

- `apps/api/src/bids/`
- `apps/api/src/listings/`
- `apps/api/src/orders/`
- `apps/api/src/lifecycle/`
- `apps/api/src/activity/`
- `apps/api/src/realtime/`
- `apps/api/src/discovery/`
- `apps/api/src/core/commerce/`
- `apps/api/src/core/auction/` (P6)

**P3 exit (met):** default API boot has no commerce controller, scheduler close
job, or Socket.IO commerce registration. P5 owns the negative HTTP tests.

## P4 — Persistence (blocked until matrix closed)

**Status: blocked.** Staging and production-like migration state remain
**Unknown**. Do not drop `Listing` / `Bid` / `Order` or rewrite applied
migrations until the matrix is filled and backup/restore is confirmed.

### Prisma models — do not drop until P4 approved

From [`packages/database/prisma/schema.prisma`](../../packages/database/prisma/schema.prisma):

- Enums: `ListingType`, `ListingStatus`, `OrderStatus`, `OrderCancellationReason`,
  `HandoffContactType`, `HandoffInitiator`; `AuditTargetType` values `ORDER`, `LISTING`
- Models: `Listing`, `AuctionRules`, `Bid`, `Order`
- Relations: `Product.listings[]`, user bid/order relations, audit targets

### Seed / demo

- `packages/database/prisma/seed.js` — authors + works only; wipe still deletes leftover Listing/Bid/Order
- `scripts/ops/commerce-inventory.mjs` — read-only counts; `--apply` cancels `SCHEDULED`/`LIVE`
- `apps/mobile/e2e/support/e2e-fixtures.ts` — published works only
- `apps/api/test/integration/auction/fixtures.ts` — leftover test helper paths if present
- `apps/api/test/integration/order-fixtures.ts`

**P4 exit:** fresh DB and each supported existing DB reach portfolio schema through
tested upgrade or baseline procedure.

## P5 — Test replacement

**Status: done (2026-09-11, `9c1c222`).**

- No price/listing/bid/order fields in `GET /api/portfolio/home`,
  `GET /api/works`, `GET /api/authors`
- Removed commerce routes return 404 (not 403)
- No commerce scheduler or Socket.IO at boot (`app.module.spec.ts`)
- Author/work permissions unchanged (existing moderation/recovery/atomicity
  suites stay green)

## P6 — Documentation and dependency closure

**Status: done (2026-09-11).** Cruft search on the active tree:

| Needle | Active-tree result |
| --- | --- |
| `AuctionCard` / `SlideToBid` / `toAuctionCardItem` | Absent from `apps/mobile` runtime |
| `COMMERCE_ENABLED` | Absent from `apps/api/src` (negative tests mention the string) |
| `createListingsClient` | Absent |
| `/api/orders` | Unmatched 404; docs updated |
| `RealtimeModule` | Absent from `AppModule`; named only in negative tests |
| `listing.join` / `product.listings` | Prisma relation remains until P4; **runtime write-guard and admin suspend no longer read it** |
| `apps/api/src/core/auction` | Deleted |

- `10-CODE-ARCHITECTURE.md` default boot updated; **persistence diagram unchanged**
- `04-DESIGN-STATUS.md` records admin analytics without commerce metrics
- `git diff --name-only -- '*.pen'` must stay empty

## Review blockers (2026-09-11)

Closed without waiting for P4:

- Listing write-lock and `hasBlockingListing` removed from active API/admin/UI
- Seed and e2e fixtures no longer insert commerce rows
- Public copy without purchase/auction lexicon
- Live ingest `work_viewed`; leftover `listing_viewed` / `bid_*` rejected
- Bid-only `EmailRulesGate` and api-client rules methods deleted

Still out of this merge: Prisma model drops; GitHub rulesets; legal wiring of
`/auth/rules`.


## Shared infrastructure — verify before delete

| Area | Keep if used by portfolio |
| --- | --- |
| `apps/api/src/core/rules-acceptance.ts` | Keep — Nest `GET/POST /api/auth/rules` + `TermsAcceptance` until legal UX |
| `packages/contracts/src/rules.ts` | Keep — versioned acceptance contract; api-client methods removed |
| Analytics admin aggregates | Live dashboard counts `work_viewed` only; commerce events are archive-only |
| `Product` / revision model | **Keep** — portfolio core |
| Handoff fields on `SellerProfile` | **Keep** — private author contact, not commerce sale |

## Go / no-go checklist (P0 complete)

- [x] Archive branch and tag at verified SHA
- [x] Recovery drill passed (with documented build/docker caveats)
- [x] Zip backup outside repo
- [x] `DEC-087` recorded
- [x] File-level removal graph exists
- [x] P1 client portfolio-native executed
- [x] P2 contracts/api-client default composition
- [x] P3 Nest default boot strip
- [x] Nest-only commerce Zod dropped
- [x] P5 negative HTTP/boot tests
- [x] P6 docs/cruft (persistence diagram unchanged until P4)
- [x] Remote archive refs exist on origin at `598d869` (branch + peeled tag)
- [x] Remote recovery drill (checkout commerce modules at archive SHA)
- [ ] GitHub rulesets protecting archive branch + tag (operator `gh auth`)
- [ ] Staging/prod DB inventory confirmed

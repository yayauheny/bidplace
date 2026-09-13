# Commerce runtime v1 archive

Status: frozen working point, not a second production branch  
Archive branch: `feature/commerce-runtime-archive`  
Source SHA: `57bc504dc1d8bdc43e8d9263e64a864ec8e394a4` (`feature/portfolio-foundation`, PR A)  
Recorded: 2026-09-14

This branch preserves the last complete commerce implementation **beside**
the portfolio foundation. Future PR C may remove commerce from the **active
runtime and public contracts**. It must not drop Prisma `Listing` / `Bid` /
`Order` tables, and it must not delete this branch.

`DEC-087` already froze an earlier full commerce-v1 tree at
`598d8696295d18d32956da7dd366dc19464cc366` (`archive/commerce-v1`). This
archive is the later stacked point: that commerce runtime plus published-revision
portfolio APIs. Use this SHA when reconstructing behavior that existed
immediately before PR C.

## How to reuse

Return commerce by **selectively porting** modules, contracts, and tests onto
the then-current architecture. Do **not** merge this branch wholesale into a
future `main`. The tree is a reference snapshot: naming, tests, and mobile
auction UI will be stale relative to later portfolio/Figma work.

## Preserved system

| Area | Location on `57bc504` |
| --- | --- |
| Listings / bids / orders HTTP | `apps/api/src/listings`, `bids`, `orders` |
| Lifecycle jobs | `apps/api/src/lifecycle` (`ListingLifecycleService`, `@nestjs/schedule`) |
| Realtime / Socket.IO | `apps/api/src/realtime`, `socket.io`, `@nestjs/platform-socket.io`, `@nestjs/websockets` |
| Capability gate | `apps/api/src/core/commerce` (`COMMERCE_ENABLED`, `CommerceEnabledGuard`) |
| Admin emergency | `AdminListingEmergencyService`; `GET /api/admin/listings/needs-order`, `POST .../emergency-cancel`, `POST .../create-order` |
| Contracts | `packages/contracts/src/{listing,bid,order,discovery,activity,dashboard,events,public-product,public-seller}.ts` |
| API client | `packages/api-client/src/{listings,orders,discovery,activity}.ts`, `getBidTooLowMinimum` |
| Prisma models | `Listing`, `AuctionRules`, `Bid`, `Order` → `listings`, `auction_rules`, `bids`, `orders` |
| Mobile auction UI | `AuctionCard*`, `AuctionPlayer`, `SlideToBid`, listing/order/activity screens, `use-listing-realtime`, `socket.io-client` |
| Admin recovery UI | `apps/mobile/src/features/admin/AdminRecoveryPanel.tsx` |
| Unit tests | listing/bid/order/lifecycle/realtime/emergency `*.spec.ts`; contracts listing/bid/order cases |
| Integration tests | `apps/api/test/integration/auction/*`, `product-listing`, `order-*`, `admin-listing-emergency`, `seller-orders-inbox*` |
| Mobile e2e | `auction-*.spec.ts`, `order-handoff.spec.ts`, `e2e/support/{auction-actions,listing-state}.ts` |
| Seed fixtures | local/test listings, bids, and one ended Order on `seedLive002` / `seedEnded03` |
| Inventory | `scripts/ops/commerce-inventory.mjs` (read-only; refuses `--apply`) |

## Environment flags

Required for any process that boots this tree:

- `DATABASE_URL` — PostgreSQL
- `JWT_SECRET`
- `NODE_ENV` + `APP_ENV` — same profile rules as current API (`local` / `staging` / `production`)

Commerce-specific:

- `COMMERCE_ENABLED` — defaults to `false`. Listing, bid, and order HTTP return
  `404 Commerce is unavailable` unless set to `true`. Public discovery/products
  still boot with the flag off.
- `ALLOW_DESTRUCTIVE_DEMO_SEED=true` — required together with
  `NODE_ENV=development|test` and `APP_ENV=local` before seed writes listing/bid/order
  demo rows.

Do not invent extra flags to “turn archive mode on”. This branch is just `57bc504`
plus this manifest.

## Migrations and tables

Commerce tables are created in `20260716000000_baseline`:

- `listings`
- `auction_rules`
- `bids`
- `orders`

Later additive migrations keep those tables. `20260905200000_order_deal_snapshot`
extends order deal fields. PR A also adds portfolio revision/curator migrations;
they are present here and are not a license to drop commerce tables.

PR C must **leave** these models, tables, and applied migrations in place until
a founder decision and a verified `pnpm ops:commerce-inventory` on every
supported environment.

## Verification commands

From a clean checkout of this branch:

```bash
pnpm verify
pnpm --filter @bidplace/api test
pnpm --filter @bidplace/api test:integration
pnpm test:ops-inventory
pnpm --filter @bidplace/mobile test:e2e:auction
```

`pnpm verify` on `57bc504` was green, including current main mobile and commerce
HTTP suites. Re-run before treating this SHA as recoverable.

## Known limitations

- This is a **saved working point**, not a maintained production line. Do not
  rebase, amend, or keep landing product work here.
- Default boot has `COMMERCE_ENABLED=false`. Live bids/orders need an explicit
  opt-in.
- Portfolio public catalog on this SHA reads published revisions and requires
  `publishedAt` plus revision images; commerce discovery still uses the older
  product-column predicates.
- Mobile still contains the pre-Figma auction chrome. Later PR B removes that
  UI from the active mobile line; this archive keeps the original screens.
- Older `DEC-087` freeze (`598d869`) does not include the PR A portfolio
  foundation. Prefer this branch for “last runtime before PR C”.
- Seed listing/bid/order writes are fenced to local/test +
  `ALLOW_DESTRUCTIVE_DEMO_SEED`. Wrong `DATABASE_URL` plus that flag can wipe a
  reachable database.
- Do not publish this branch unless explicitly asked.

## After PR C

1. Keep `feature/commerce-runtime-archive` locally (and remotely only if later
   instructed). Do not delete it after PR C merges.
2. Keep Prisma commerce tables and data until inventory + founder decision.
3. Rebuild commerce-v2 from then-current `main` by copying chosen pieces from
   this snapshot, not by merging the branch.

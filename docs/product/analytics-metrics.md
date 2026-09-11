# bidplace — Analytics metrics definitions

Status: Confirmed for admin dashboard MVP
Related: `docs/product/analytics-contract.md`, `DEC-067`, `DEC-087`

## Live dashboard

| Metric | Definition | Source |
| ------ | ---------- | ------ |
| Users | Total `User` rows | PostgreSQL |
| New users | `User.createdAt` in period | PostgreSQL |
| Active users | Distinct `AnalyticsEvent.userId` in period | analytics |
| Creators | Total `SellerProfile` rows | PostgreSQL |
| Works created | `Product.createdAt` in period | PostgreSQL |
| Work viewed | Count `work_viewed` in period | analytics |
| Visitor by source | `AcquisitionAttribution` rows by coalesce(source, `direct`) with `capturedAt` in period | analytics |
| Signup by source | Attributions with `userId` linked and `linkedAt` in period | analytics |
| Stuck moderation | Seller/Product `PENDING_REVIEW` older than 7 days | PostgreSQL |

Live admin overview `visitorFunnel.workViewed` and growth `workViews` count
**only** `work_viewed`. Historical `listing_viewed` rows are not migrated and
not included.

Periods use UTC ranges: `today`, `7d`, `30d`, `90d`, or custom `from`/`to`.

## Archive-only (commerce-v1, not in live dashboard)

These definitions remain so archive recoveries can be read. They are **not**
rendered by `GET /api/admin/analytics/overview` on default boot.

| Metric | Definition | Source |
| ------ | ---------- | ------ |
| Live auctions | `Listing.status = LIVE` now | PostgreSQL |
| Bids | `Bid.createdAt` in period | PostgreSQL |
| Ended auctions | `Listing.status = ENDED` and `closedAt` in period | PostgreSQL |
| Successful auction | `Order` created in period (winner handoff started; not payment/GMV) | PostgreSQL |
| Listing viewed | Count `listing_viewed` in period | analytics (historical rows only) |
| Bid CTA clicked | Count `bid_cta_clicked` in period | analytics (historical rows only) |
| Bid accepted | Count `Bid` in period | PostgreSQL |
| Winner | Count `Order` in period | PostgreSQL |
| Auction with bids | Ended listing with `bidCount > 0` (or ≥1 Bid) | PostgreSQL |
| Auction without bids | Ended listing with `bidCount = 0` | PostgreSQL |
| Unique bidder | Distinct `Bid.bidderUserId` in period | PostgreSQL |
| Time to first bid | Median of (first Bid.createdAt − Listing.startsAt) for listings with bids | PostgreSQL |
| Stale LIVE | `Listing.status = LIVE` and `endsAt < now` | PostgreSQL |

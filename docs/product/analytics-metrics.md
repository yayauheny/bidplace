# bidplace — Analytics metrics definitions

Status: Confirmed for admin dashboard MVP  
Related: `docs/product/analytics-contract.md`, `DEC-067`

| Metric | Definition | Source |
| ------ | ---------- | ------ |
| Users | Total `User` rows | PostgreSQL |
| New users | `User.createdAt` in period | PostgreSQL |
| Active users | Distinct `AnalyticsEvent.userId` in period | analytics |
| Creators | Total `SellerProfile` rows | PostgreSQL |
| Live auctions | `Listing.status = LIVE` now | PostgreSQL |
| Bids | `Bid.createdAt` in period | PostgreSQL |
| Ended auctions | `Listing.status = ENDED` and `closedAt` in period | PostgreSQL |
| Successful auction | `Order` created in period (winner handoff started; not payment/GMV) | PostgreSQL |
| Listing viewed | Count `listing_viewed` in period | analytics |
| Bid CTA clicked | Count `bid_cta_clicked` in period | analytics |
| Bid accepted | Count `Bid` in period | PostgreSQL |
| Winner | Count `Order` in period | PostgreSQL |
| Auction with bids | Ended listing with `bidCount > 0` (or ≥1 Bid) | PostgreSQL |
| Auction without bids | Ended listing with `bidCount = 0` | PostgreSQL |
| Unique bidder | Distinct `Bid.bidderUserId` in period | PostgreSQL |
| Time to first bid | Median of (first Bid.createdAt − Listing.startsAt) for listings with bids | PostgreSQL |
| Visitor by source | `AcquisitionAttribution` rows by coalesce(source, `direct`) with `capturedAt` in period | analytics |
| Signup by source | Attributions with `userId` linked and `linkedAt` in period | analytics |
| Stale LIVE | `Listing.status = LIVE` and `endsAt < now` | PostgreSQL |
| Stuck moderation | Seller/Product `PENDING_REVIEW` older than 7 days | PostgreSQL |

Periods use UTC ranges: `today`, `7d`, `30d`, `90d`, or custom `from`/`to`.

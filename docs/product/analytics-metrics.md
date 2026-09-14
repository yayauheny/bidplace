# bidplace — Analytics metrics definitions

Status: Confirmed for admin dashboard MVP  
Related: `docs/product/analytics-contract.md`, `DEC-067`

| Metric | Definition | Source |
| ------ | ---------- | ------ |
| Users | Total `User` rows | PostgreSQL |
| New users | `User.createdAt` in period | PostgreSQL |
| Active users | Distinct `AnalyticsEvent.userId` in period | analytics |
| Creators | Total `SellerProfile` rows | PostgreSQL |
| Published works | `Product.status = APPROVED` and `publishedRevisionId` is set | PostgreSQL |
| Listing viewed | Count `listing_viewed` in period | analytics |
| Visitor by source | `AcquisitionAttribution` rows by coalesce(source, `direct`) with `capturedAt` in period | analytics |
| Signup by source | Attributions with `userId` linked and `linkedAt` in period | analytics |
| Stuck moderation | Seller/Product `PENDING_REVIEW` older than 7 days | PostgreSQL |

Periods use UTC ranges: `today`, `7d`, `30d`, `90d`, or custom `from`/`to`.
Auction, bid and order marketplace metrics are not part of the active admin overview; leftover `Listing`/`Bid`/`Order` rows are reported by `scripts/ops/commerce-inventory.mjs`.

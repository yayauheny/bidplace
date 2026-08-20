# bidplace — Analytics contract

Status: Confirmed for MVP foundation  
Related: `DEC-046`, `DEC-067`

## Identity

| Concept | Rule |
| ------- | ---- |
| `anonymousId` | Client-generated UUID, persisted on device. Survives logout. Does not survive reinstall. |
| `userId` | Always `User.id` (UUID). Never email, phone, slug, or displayName. |
| Identify | After login/register, subsequent events carry authenticated `userId` from the session. |
| Claim acquisition | On **register** only (`claimAcquisition: true`), first-touch attribution may link to `User.id` once. |
| Logout | Clears authenticated analytics user; keeps `anonymousId`. Never merges User A and User B. |

## Attribution

First-touch only. Stored in `acquisition_attributions` keyed by `anonymousId`.

Fields: `source`, `medium`, `campaign`, `content`, `referrer`, `landingPath`, `capturedAt`.

Later visits do not overwrite first-touch.

## Event naming

Product analytics events use `snake_case`.

Socket.IO events (`bid.placed`, …) are a different contract and are not analytics.

## Current events

| Event | Meaning | Required properties | Source |
| ----- | ------- | ------------------- | ------ |
| `listing_viewed` | Opened product detail | `productPublicId`; optional `listingId`, `sellerProfileId` | Mobile detail screen |
| `seller_viewed` | Opened public creator page | `sellerProfileId`; optional `sellerSlug` | Public seller screen |
| `registration_started` | Opened registration form | (none) | Register form mount |
| `bid_cta_clicked` | Opened bid participation UI | `listingId`; optional `productPublicId` | Product bid CTA |
| `bid_rejected` | API rejected a bid attempt | `listingId`, `errorCode`; optional `productPublicId` | Bid mutation error |

## What NOT to track

Do **not** add analytics duplicates for DB facts:

- registration completed
- seller/product/listing created
- bid accepted
- auction ended / winner / order / handoff

Do **not** send PII: email, phone, password, OTP, tokens, handoff contacts, free-text descriptions.

Do **not** track impressions or search in this foundation.

## Ingest

`POST /api/analytics/events` — best effort, optional auth, rate limited.

Disabled when `ANALYTICS_INGEST_ENABLED=false` (default in `NODE_ENV=test`).

Client disabled when `NODE_ENV=test` or `EXPO_PUBLIC_ANALYTICS_ENABLED=false`.

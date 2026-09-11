# bidplace — Analytics contract

Status: Confirmed for MVP foundation
Related: `DEC-046`, `DEC-067`, `DEC-087`

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

Socket.IO events (`bid.placed`, …) belong to the commerce archive. They are not
live analytics and are not ingested.

## Current events (live ingest)

| Event | Meaning | Required properties | Source |
| ----- | ------- | ------------------- | ------ |
| `work_viewed` | Opened a published Work | `productPublicId`; optional `sellerProfileId` | Work detail (`useTrackWorkView`) |
| `seller_viewed` | Opened public creator page | `sellerProfileId`; optional `sellerSlug` | Public seller screen |
| `registration_started` | Opened registration form | (none) | Register form mount |

`POST /api/analytics/events` **rejects** leftover commerce names
`listing_viewed`, `bid_cta_clicked`, and `bid_rejected`. Historical rows with
those names may remain in Postgres; the live admin funnel does not count them.

## Archive-only events (not in live dashboard)

These names were the commerce-v1 funnel. They are not accepted by current ingest
and are not summed in `GET /api/admin/analytics/overview`.

| Event | Historical meaning |
| ----- | ------------------ |
| `listing_viewed` | Opened product detail during listing funnel |
| `bid_cta_clicked` | Opened bid participation UI |
| `bid_rejected` | API rejected a bid attempt |

Do not migrate historical `listing_viewed` rows into `work_viewed`.

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

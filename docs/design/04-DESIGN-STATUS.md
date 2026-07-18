# bidplace — статус дизайна

Дата снимка: 2026-07-18

Статус документа: Partial — Task A изменила функциональные routes без визуального redesign и без approved Figma source.

## Functional screen status

| Экран                      | Route                                               | Статус                              | Evidence / remaining work                                                                                                                                                                                         |
| -------------------------- | --------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public Product list        | `/`                                                 | Implemented without approved design | `product-list-screen.tsx` reads approved Products; loading and error states exist.                                                                                                                                |
| Product detail and bidding | `/product/[publicId]`                               | Partial                             | Images, value fields, Listing/BYN state, server-deadline countdown, bid history, OTP controls, Activity-derived participation, winner Order link and reconnect refetch exist. Device and accessibility QA remain. |
| My purchases               | `/me/activity`                                      | Partial                             | Activity API projection and basic screen exist; state-specific copy and visual QA remain.                                                                                                                         |
| Order                      | `/order/[publicId]`                                 | Partial                             | Authorized Order summary exists; seller/buyer role copy and final mobile QA remain.                                                                                                                               |
| Seller profile             | `/(seller)/profile`                                 | Implemented without approved design | Canonical SellerProfile create/edit/status flow; loading/error/submission states exist.                                                                                                                           |
| Product draft              | `/(seller)/products/new`, `/(seller)/products/[id]` | Partial                             | Draft Product creation, later editing of unlocked fields, image review and ProductImage upload work. Image deletion/reordering and device QA remain.                                                              |
| Listing draft              | `/(seller)/listings/new`                            | Partial                             | Product selection, BYN start price and explicit schedule request exist; date input usability and seller listing management need QA.                                                                               |
| Admin moderation           | `/(admin)`                                          | Partial                             | Compact SellerProfile/Product review controls and a confirmed manual Order cancellation/replacement flow with anonymous ranked Bids exist. Device and design QA remain.                                           |

## Removed routes and promises

The retired public `/auctions/[slug]`, cart, swatches, fake variants, Buy Now and reserve UI are not part of the Task A surface. The only public commerce route is Product public ID; draft records remain seller-only.

## Design QA still required

- mobile/web keyboard and screen-reader audit for Product, OTP, seller and Order flows;
- loading, empty, network-error, reconnect and long-content states on pilot devices;
- approval of visual treatment before marking any screen `Implemented`;
- admin controls, Product draft image deletion/reordering and image-management flow.

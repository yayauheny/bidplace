# bidplace — статус дизайна

Дата снимка: 2026-07-18

Статус документа: Partial — Task A изменила функциональные routes без визуального redesign и без approved Figma source.

## Functional screen status

| Экран | Route | Статус | Evidence / remaining work |
| --- | --- | --- | --- |
| Public Product list | `/` | Implemented without approved design | `product-list-screen.tsx` reads approved Products; loading and error states exist. |
| Product detail and bidding | `/product/[publicId]` | Partial | Images, value fields, Listing/BYN state, bid history, OTP controls and reconnect refetch exist. Countdown, own participation and winner Order link need QA/completion. |
| My purchases | `/me/activity` | Partial | Activity API projection and basic screen exist; state-specific copy and visual QA remain. |
| Order | `/order/[publicId]` | Partial | Authorized Order summary exists; seller/buyer role copy and final mobile QA remain. |
| Seller profile | `/(seller)/profile` | Implemented without approved design | Canonical SellerProfile create/edit/status flow; loading/error/submission states exist. |
| Product draft | `/(seller)/products/new` | Partial | Draft Product creation and ProductImage upload work; editing an existing draft and approval controls still need a seller workflow screen. |
| Listing draft | `/(seller)/listings/new` | Partial | Product selection, BYN start price and explicit schedule request exist; date input usability and seller listing management need QA. |
| Admin moderation | `/(admin)` | Implemented without approved design | Compact SellerProfile/Product review controls exist; Order cancellation/replacement UI and design QA remain. |

## Removed routes and promises

The retired public `/auctions/[slug]`, cart, swatches, fake variants, Buy Now and reserve UI are not part of the Task A surface. The only public commerce route is Product public ID; draft records remain seller-only.

## Design QA still required

- mobile/web keyboard and screen-reader audit for Product, OTP, seller and Order flows;
- loading, empty, network-error, reconnect and long-content states on pilot devices;
- approval of visual treatment before marking any screen `Implemented`;
- admin controls and Product draft editing/image-management flow.

# bidplace — статус дизайна

Дата снимка: 2026-07-24

Статус документа: Partial — Modern UI pilot перевёл Catalog, Product detail и seller Product draft/edit на target bridge с центрированным контентом, desktop rail и mobile floating bottom dock. Existing domain behaviour сохранён; device/accessibility QA остаётся.

## Functional screen status

| Экран                      | Route                                               | Статус                              | Evidence / remaining work                                                                                                                                                                                         |
| -------------------------- | --------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public Product list        | `/`                                                 | Partial — Modern UI pilot           | `product-list-screen.tsx` now uses image-first AuctionCard and ModernScreen; approved-product query plus loading/error/empty/refetch remain. Device and visual QA remain. |
| Product detail and bidding | `/product/[publicId]`                               | Partial — Modern UI pilot           | Gallery fallback, factual auction summary before tabs, and a persistent action region now meet the pilot viewport rule. OTP, idempotent retry, HTTP-authoritative realtime refetch, aliases and Order access remain unchanged. Closed-pilot Chromium flow passed after the visual move; device and accessibility QA remain. |
| My purchases               | `/me/activity`                                      | Partial                             | Activity API projection and basic screen exist; types derived from ApiClient; state-specific copy and visual QA remain.                                                                                           |
| Order                      | `/order/[publicId]`                                 | Closed-pilot verified               | Authorized Order summary exists; types derived from ApiClient; buyer sees seller contact projection when allowed, seller sees `buyerEmailAtClose`, and seller action loading/error/retry states exist; closed-pilot browser coverage passed for buyer/seller/admin/outsider visibility. Final mobile QA remains.                                                                                                 |
| Seller profile             | `/(seller)/profile`                                 | Closed-pilot verified               | Canonical SellerProfile create/edit/status flow with public photo preview/upload, editable handoff corrections in `CHANGES_REQUESTED`, and read-only states outside that status; closed-pilot browser file-upload/moderation coverage passed. Loading/error/submission states exist.                                                                                                                           |
| Product draft              | `/(seller)/products/new`, `/(seller)/products/[id]` | Partial — Modern UI pilot           | Staged ModernSection layout, target controls and image geometry preserve draft save, moderation submit, lock, upload/delete/reorder paths. Closed-pilot Chromium seller flow passed after the visual move; device and accessibility QA remain. |
| Listing draft              | `/(seller)/listings/new`                            | Closed-pilot verified               | Raw TextInput replaced with AppInput; SectionHeader added; gap tokens migrated to mobileSpacing. Closed-pilot browser coverage passed for create, schedule and auction-link handoff. Date input usability and seller listing management still need QA.                                                       |
| Admin moderation           | `/admin`                                            | Closed-pilot verified               | Protected by explicit administrative guard. Compact SellerProfile/Product review controls and a confirmed manual Order cancellation/replacement flow with anonymous ranked Bids exist; closed-pilot browser coverage passed for seller approval and product moderation. Types derived from ApiClient. Device and design QA remain. |

## Removed routes and promises

The retired public `/auctions/[slug]`, cart, swatches, fake variants, Buy Now and reserve UI are not part of the Task A surface. The only public commerce route is Product public ID; draft records remain seller-only.

## Design QA still required

- mobile/web keyboard and screen-reader audit for Product, OTP, seller and Order flows;
- loading, empty, network-error, reconnect and long-content states on pilot devices;
- approval of visual treatment before marking any screen `Implemented`;
- admin controls and Product draft image-management flow.

# bidplace — статус дизайна

Дата снимка: 2026-07-24

Статус документа: Partial — legacy implementation is functionally verified for closed pilot. Final cutover Phase 0 has NativeWind web configuration and target font loading, but no target route has migrated. The approved transition remains a clean cutover in `../modern-ui/10-final-cutover-plan.md`; no pilot bridge or partial target route is accepted as final implementation.

## Functional screen status

| Экран                      | Route                                               | Статус                              | Evidence / remaining work                                                                                                                                                                                         |
| -------------------------- | --------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public Product list        | `/`                                                 | Implemented without approved design | `product-list-screen.tsx` reads approved Products; loading and error states exist.                                                                                                                                |
| Product detail and bidding | `/product/[publicId]`                               | Closed-pilot verified               | Chromium verifies load, UI login, OTP, rejected unverified bid, accepted Bid and current-price update; closed-pilot browser flow is passing and device/accessibility QA remain. All type casts removed (api.auth properly typed). |
| My purchases               | `/me/activity`                                      | Partial                             | Activity API projection and basic screen exist; types derived from ApiClient; state-specific copy and visual QA remain.                                                                                           |
| Order                      | `/order/[publicId]`                                 | Closed-pilot verified               | Authorized Order summary exists; types derived from ApiClient; buyer sees seller contact projection when allowed, seller sees `buyerEmailAtClose`, and seller action loading/error/retry states exist; closed-pilot browser coverage passed for buyer/seller/admin/outsider visibility. Final mobile QA remains.                                                                                                 |
| Seller profile             | `/(seller)/profile`                                 | Closed-pilot verified               | Canonical SellerProfile create/edit/status flow with public photo preview/upload, editable handoff corrections in `CHANGES_REQUESTED`, and read-only states outside that status; closed-pilot browser file-upload/moderation coverage passed. Loading/error/submission states exist.                                                                                                                           |
| Product draft              | `/(seller)/products/new`, `/(seller)/products/[id]` | Closed-pilot verified               | Raw TextInput replaced with AppInput; fields grouped in OperationalPanel; gap tokens migrated to mobileSpacing. Closed-pilot browser coverage passed for draft create, image upload and submit-to-moderation. Device and accessibility QA remain.                                                               |
| Listing draft              | `/(seller)/listings/new`                            | Closed-pilot verified               | Raw TextInput replaced with AppInput; SectionHeader added; gap tokens migrated to mobileSpacing. Closed-pilot browser coverage passed for create, schedule and auction-link handoff. Date input usability and seller listing management still need QA.                                                       |
| Admin moderation           | `/admin`                                            | Closed-pilot verified               | Protected by explicit administrative guard. Compact SellerProfile/Product review controls and a confirmed manual Order cancellation/replacement flow with anonymous ranked Bids exist; closed-pilot browser coverage passed for seller approval and product moderation. Types derived from ApiClient. Device and design QA remain. |

## Removed routes and promises

The retired public `/auctions/[slug]`, cart, swatches, fake variants, Buy Now and reserve UI are not part of the Task A surface. The only public commerce route is Product public ID; draft records remain seller-only.

## Design QA still required

- mobile/web keyboard and screen-reader audit for Product, OTP, seller and Order flows;
- loading, empty, network-error, reconnect and long-content states on pilot devices;
- approval of visual treatment before marking any screen `Implemented`;
- admin controls and Product draft image-management flow.

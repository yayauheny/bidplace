# bidplace — пользовательские маршруты и экраны

Последнее обновление: 2026-07-24

Статус: MVP flow confirmed by product docs; implementation snapshot is Partial

## Правила карты

- Поведение определяет `../product/05-MVP-RFC.md`; этот документ фиксирует маршруты и фактические UI-состояния.
- Для каждого экрана обязательны loading, empty, error, responsive и accessibility states; realtime-экраны также явно показывают reconnect/offline state.
- Публичные страницы не выводят internal UUID, телефон, email или иные контакты участников.

## Канонические buyer routes

| Экран               | Route                 | Реализованное поведение                                                                                                                                                                                                                                                       | Статус / remaining work                                          |
| ------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Public Product list | `/`                   | Список approved Product из API; loading и error.                                                                                                                                                                                                                              | Implemented without approved design.                             |
| Product detail      | `/product/[publicId]` | Изображения, seller, value fields, scheduled/live/ended Listing, BYN price, server-deadline countdown, minimum next Bid, aliases, OTP actions, idempotent retry and socket-driven refetch. Signed-in buyer sees Activity-derived participation and Order link when it exists. Closed-pilot Chromium coverage passed for buyer login, OTP, bid and refetch. | Partial: device/accessibility QA and state-specific copy remain. |
| My purchases        | `/me/activity`        | Derived Activity statuses, Product links and allowed Order links.                                                                                                                                                                                                             | Partial: visual QA and richer state copy remain.                 |
| Order               | `/order/[publicId]`   | Backend-authorized Order summary for buyer, seller or admin; buyer sees the allowed seller contact projection, seller sees `buyerEmailAtClose`, and seller action states cover `contacted`, `completed` and `handoffFailed`. Closed-pilot Chromium coverage passed for buyer privacy, seller actions and outsider/admin access. | Partial: role-specific mobile QA remains.                        |

The retired `/auctions/[slug]` public route is not a Product route and must not be restored as a compatibility screen. Chromium closed-pilot verification confirms the route is unmatched, and verifies canonical Product, Activity and Order navigation.

## Seller routes

| Экран               | Route                     | Реализованное поведение                                                                                                                     | Статус / remaining work                                      |
| ------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Seller profile      | `/(seller)/profile`       | Create/update SellerProfile, upload a public profile photo, edit handoff corrections while `CHANGES_REQUESTED`, show status, and keep fields read-only outside that state. Closed-pilot Chromium coverage passed for real file upload and moderation gating.            | Closed-pilot verified; device/accessibility QA remains.     |
| New Product draft   | `/(seller)/products/new`  | Creates an incomplete Product draft. Closed-pilot Chromium coverage passed for draft create, image upload, submit to moderation and admin approval.                                                                                                        | Closed-pilot verified; device/accessibility QA remains.     |
| Edit Product draft  | `/(seller)/products/[id]` | Owner can update unlocked draft fields and review, upload, delete or reorder Product images. Server blocks locked Product edits and images. Closed-pilot Chromium coverage passed for seller-side product create and image upload. | Closed-pilot verified; device/accessibility QA remains.     |
| New Auction Listing | `/(seller)/listings/new`  | Select owner Product, set BYN start price and server-validated dates, create then explicitly schedule the Listing. Closed-pilot Chromium coverage passed for schedule create and browser-opened auction link.                          | Closed-pilot verified; seller Listing-management QA remains. |

## Admin route

| Экран      | Route      | Реализованное поведение                                                                                                                                             | Статус / remaining work                                            |
| ---------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Moderation | `/(admin)` | Admin-only SellerProfile approve/suspend, Product approve/archive, and confirmed manual Order cancellation followed by a selected anonymous ranked Bid replacement. Closed-pilot Chromium coverage passed for seller approval and product moderation. | Closed-pilot verified; device/accessibility QA and richer review context remain. |

## Flow constraints

- Phone verification is required by the backend before a Bid; the Product screen presents request/verify controls and must never treat a failed Bid as accepted.
- The HTTP Product snapshot is canonical. Listing socket events only trigger refetch; reconnect performs the same authoritative refresh.
- The Product screen derives participation from `GET /api/me/activity`, never from public Bid identity or event order.
- A seller or admin does not receive bidder contacts from ranked Bid inspection; contact is only revealed through the authorized active Order.
- Seller Product edits and image operations are allowed only while the backend considers the Product unlocked.
- Seller profile edits are allowed only while the backend returns `CHANGES_REQUESTED`; `PENDING_REVIEW`, `APPROVED`, `REJECTED` and `SUSPENDED` are read-only. Handoff contact, handoff initiator and public profile data can all be corrected in that state.
- Public seller detail uses `fullName`, profile photo URL and a public verification link; private handoff contact stays off public routes.
- Order actions are seller-scoped and include `contacted`, `completed` and `handoffFailed`; after each action the mobile client refetches both the Order and activity projections.

## Required manual QA

- iPhone Safari, Android Chrome, macOS Chrome/Safari and Windows Chrome for Product, OTP, Bid, Activity, Order, seller and admin flows;
- keyboard, screen reader, focus, long-content, empty, error and reconnect states;
- ProductImage deletion/reordering flow after its backend contract is implemented.

# bidplace — пользовательские маршруты и экраны

Последнее обновление: 2026-07-18

Статус: MVP flow confirmed by product docs; implementation snapshot is Partial

## Правила карты

- Поведение определяет `../product/05-MVP-RFC.md`; этот документ фиксирует маршруты и фактические UI-состояния.
- Для каждого экрана обязательны loading, empty, error, responsive и accessibility states; realtime-экраны также явно показывают reconnect/offline state.
- Публичные страницы не выводят internal UUID, телефон, email или иные контакты участников.

## Канонические buyer routes

| Экран               | Route                 | Реализованное поведение                                                                                                                                                                                                                                                       | Статус / remaining work                                          |
| ------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Public Product list | `/`                   | Список approved Product из API; loading и error.                                                                                                                                                                                                                              | Implemented without approved design.                             |
| Product detail      | `/product/[publicId]` | Изображения, seller, value fields, scheduled/live/ended Listing, BYN price, server-deadline countdown, minimum next Bid, aliases, OTP actions, idempotent retry and socket-driven refetch. Signed-in buyer sees Activity-derived participation and Order link when it exists. | Partial: device/accessibility QA and state-specific copy remain. |
| My purchases        | `/me/activity`        | Derived Activity statuses, Product links and allowed Order links.                                                                                                                                                                                                             | Partial: visual QA and richer state copy remain.                 |
| Order               | `/order/[publicId]`   | Backend-authorized Order summary for buyer, seller or admin.                                                                                                                                                                                                                  | Partial: role-specific mobile QA remains.                        |

The retired `/auctions/[slug]` public route is not a Product route and must not be restored as a compatibility screen.

## Seller routes

| Экран               | Route                     | Реализованное поведение                                                                                                                     | Статус / remaining work                                      |
| ------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Seller profile      | `/(seller)/profile`       | Create/update SellerProfile and show its status.                                                                                            | Implemented without approved design.                         |
| New Product draft   | `/(seller)/products/new`  | Creates an incomplete Product draft.                                                                                                        | Partial: device/accessibility QA remains.                    |
| Edit Product draft  | `/(seller)/products/[id]` | Owner can update unlocked draft fields and review, upload, delete or reorder Product images. Server blocks locked Product edits and images. | Partial: device/accessibility QA remains.                    |
| New Auction Listing | `/(seller)/listings/new`  | Select owner Product, set BYN start price and server-validated dates, create then explicitly schedule the Listing.                          | Partial: date input and seller Listing-management QA remain. |

## Admin route

| Экран      | Route      | Реализованное поведение                                                                                                                                             | Статус / remaining work                                            |
| ---------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Moderation | `/(admin)` | Admin-only SellerProfile approve/suspend, Product approve/archive, and confirmed manual Order cancellation followed by a selected anonymous ranked Bid replacement. | Partial: device/accessibility QA and richer review context remain. |

## Flow constraints

- Phone verification is required by the backend before a Bid; the Product screen presents request/verify controls and must never treat a failed Bid as accepted.
- The HTTP Product snapshot is canonical. Listing socket events only trigger refetch; reconnect performs the same authoritative refresh.
- The Product screen derives participation from `GET /api/me/activity`, never from public Bid identity or event order.
- A seller or admin does not receive bidder contacts from ranked Bid inspection; contact is only revealed through the authorized active Order.
- Seller Product edits and image operations are allowed only while the backend considers the Product unlocked.

## Required manual QA

- iPhone Safari, Android Chrome, macOS Chrome/Safari and Windows Chrome for Product, OTP, Bid, Activity, Order, seller and admin flows;
- keyboard, screen reader, focus, long-content, empty, error and reconnect states;
- ProductImage deletion/reordering flow after its backend contract is implemented.

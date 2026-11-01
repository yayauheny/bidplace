# bidplace — текущий статус проекта

Срез документации: 2026-10-23, база `872f22fc`. Контракт: [05-MVP-RFC](05-MVP-RFC.md) + продажи `DEC-149`
([COMMERCE](../launch/COMMERCE.md)). Открытая работа — [план запуска](../launch/README.md),
релизные gates и последние результаты — [release audit](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md).
Здесь только текущая сводка; старые checkpoints не являются новым green.

## 2026-11-01 — W4 settings switch web accessibility

**Partial.** `SettingsRow` toggle on web now sets `aria-checked` and activates Space once without scrolling. Enter and click stay on `Pressable`. `[role='switch']` uses the shared focus outline in `apps/mobile/global.css`. Native `accessibilityState` is unchanged. Off, disabled, and black switch colors, and `StatusBadge`, stay NEEDS-FIGMA. Local: `SettingsList.web.spec.ts`, `SettingsList.spec.ts`, and `StatusBadge.spec.ts` — 15 passed; mobile `tsc --noEmit` and `eslint .` exited 0; `EXPO_NO_DOTENV=1 pnpm --filter @bidplace/mobile build:web` exported `apps/mobile/dist` with `[role=switch]:focus-visible`. Chromium loaded `global.css`: light outline `rgb(18, 18, 18)`, black `rgb(255, 255, 255)`, both solid 2px with offset 2px. `e2e/theme-computed-focus.spec.ts` was not run against `/login`. W4 screens (Tasks 3–11) stay Not implemented.

## 2026-11-01 — W4 Task 2 UI primitives

**Partial.** `SettingsRow` in `apps/mobile/src/components/figma/SettingsList.tsx` accepts `toggle` and keeps the previous button row when `toggle` is absent. The switch is role `switch`, named by the row label, 36×20 with a 16×16 thumb (Figma `7008:15192`, on state). `StatusBadge` in `apps/mobile/src/components/ui/StatusBadge.tsx` is a caption label in `neutral` / `accent` / `success` / `danger`. No status-badge frame exists, so that visual is NEEDS-FIGMA. Tests: `SettingsList.spec.ts`, `StatusBadge.spec.ts`. W4 screens (Tasks 3–11) stay Not implemented. Adult-content settings were not added.

## 2026-10-31 — W4 Task 1 foundation fixes

**Implemented** for these four helpers only. W4 screens (Tasks 2–11) stay Not implemented.

`parseMoneyInput` in `apps/mobile/src/lib/money.ts` builds minor units from the whole and fractional digit strings and returns `null` above `Number.MAX_SAFE_INTEGER`. `money.spec.ts`: `90071992547409.90` is `9007199254740990`, `90071992547409.91` is the max safe integer, `90071992547409.92` and 307 nines are `null`. `BUYER_BLOCKED` in `apps/mobile/src/lib/api-error-messages.ts` is «Ставки и покупки для вашего аккаунта ограничены.» (`api-error-messages.spec.ts`); the code still covers antifraud, a ban, and two strikes. `useNow` samples the clock when it turns on (`use-now.spec.ts`). A late lot or contacts response from session A does not replace session B (`query-cache.spec.ts`); `authEpoch` was not rewritten.

Local checks on `fix/w4-foundation-review`: the helper specs plus logout, refresh, draft save, and profile submit — 13 files, 177 passed. Mobile `tsc --noEmit` and `eslint .` exited 0. `EXPO_NO_DOTENV=1 pnpm --filter @bidplace/mobile build:web` exported `apps/mobile/dist`.

## 2026-10-31 — New-account bid burst

**Implemented.** `NEW_ACCOUNT_MAX_AGE_MS` and `isNewAccount` in `apps/api/src/antifraud/antifraud.policy.ts`. When `detectBidBurst` matches, `FraudSignalsService.recordBidSignals` writes `BID_BURST` and, if `User.createdAt` is younger than 24 hours at the transaction `bidCreatedAt`, also `NEW_ACCOUNT_BURST`. Both signals and the single `FRAUD_REVIEW` hold share the bid transaction. The current bid stays accepted; the next bid is `BUYER_BLOCKED`. An older account still records only `BID_BURST` and is not held for that one series. Tests: `antifraud.policy.spec.ts`, `commerce-bids.integration.spec.ts`.

## 2026-10-31 — Work deletion

**Implemented locally / live Needs verification.** `Product.deletedAt`, `ProductsController.remove`, `product-publication.ts`, read filters and `MediaLifecycleService` implement the W6 tombstone path; `product-delete.integration.spec.ts` and `media-lifecycle.integration.spec.ts` cover owner access, sale guards, races, retained order cover, cleanup and purge retry. Public JSON edge cache TTLs for works, authors, portfolio home and facets are 30 seconds (`deploy/cloudflare/src/router.ts`, `router.spec.ts`); live R2/CDN behavior remains unverified. Scoped final independent re-review is pending.

2026-10-31 review fixes: order covers use the published revision and remain available to order participants after later publication; deletion excludes approval events from active funnel counts without deleting audit history. Real order and media cleanup regressions were added; independent re-review remains pending.

| Область | Статус и основание |
| --- | --- |
| Portfolio discovery, author/Work lifecycle и moderation | Implemented для проверенного локального среза: `portfolio`, `products`, `sellers`, `admin-moderation` в `apps/api/src`; revision/public guards и HTTP/media tests. Live acceptance остаётся отдельной. |
| Auth и согласие | Partial (PR #58 синхронизируется и проверяется): серверные сессии, email-code/OIDC и proof до создания пользователя добавлены локально; полная CI-приёмка текущего merge ещё не завершена. Сохранены: одно явное подтверждение (DEC-124/125), атомарный User+evidence, lazy legal GET не блокирует регистрацию; приёмка. Это не юридическая готовность пакета. |
| Author Story / каталоги / история Work | Implemented для проверенного client/API cutover: `use-product-story-editor.ts` вызывает `api.products.replaceCreation`, `ProductsController` → `ProductsService.replaceCreationStory`, revision-owned blocks; UI completion, review. Архивное «B6 не начат» — исторический checkpoint. |
| Responsive UI, account/settings, author/header/footer | Partial: реализация и browser evidence есть; настройки имеют исключённое смещение заголовка, физические устройства/zoom и точный desktop parity не закрыты. [Design status](../design/04-DESIGN-STATUS.md). |
| Фото Work и автора (DEC-131/132) | Partial: `ImageProcessor`/Sharp и пофайловый upload объединены с release wizard; local verify/media E2E прошли. Live R2/CDN, устройства и Figma новых статусов — Needs verification. |
| Удаление своей Work (DEC-123) | Implemented локально / live Needs verification: `DELETE /api/products/:id`, `Product.deletedAt`, история заказов, отзыв медиа и гонки покрыты API integration tests; публичный JSON edge cache ограничен 30 секундами. Live R2/CDN behavior остаётся Needs verification. |
| Legal / операции / live abuse protection | Partial / Needs verification: [legal owner](../legal/00-FINAL-LEGAL-AUDIT.md), [operations](../ops/00-RELEASE-AND-BACKUP.md), [release gates](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md). Локальные tests не доказывают SMTP delivery, production Turnstile или CDN purge. |
| Commerce, избранное/подписки, смена email/password из settings | Partial: the 2026-10-31 W3 rollup is Implemented locally where its tests exist (listings, bids, purchase, orders, tick, reports, attention, favorites, outbox, API client). Trust signals on the author order card and admin order/report views stay Partial. `SUPPORT_TELEGRAM_URL` / `SUPPORT_EMAIL` stay NEEDS-DECISION. The DEC-152 seller gate is Implemented: a banned account cannot open a new bid, purchase, or order, and a due auction ends `ENDED` with no order. Settings email/password stay Not implemented. |

## 2026-10-31 — W3 commerce backend

Server sales on this branch. **Implemented** locally only where a test exists: contracts `packages/contracts/src/commerce.spec.ts` and migrations `20261030130000_commerce_v2`, `20261030180000_order_purchase_idempotency`, `20261030190000_order_failed_by`; pricing and transitions `auction-pricing.spec.ts`, `listing-state.spec.ts`, `order-state.spec.ts`; listings and `dbNow` `commerce-listings.integration.spec.ts`, `db-now.spec.ts`, `listings.service.spec.ts`, `product-write-guard.spec.ts`; bids `commerce-bids.integration.spec.ts`, `ban-void.spec.ts`, `antifraud.policy.spec.ts`; purchase `commerce-purchase.integration.spec.ts`; orders, contacts, and strikes `commerce-orders.integration.spec.ts`, `trust-signals.spec.ts`; tick `commerce-tick.integration.spec.ts`; reports `commerce-reports.integration.spec.ts`; attention and favorites `commerce-attention.integration.spec.ts`, `favorites.integration.spec.ts`; outbox `notification-outbox.spec.ts`, `notifications.integration.spec.ts`; races `commerce-races.integration.spec.ts`; API client `packages/api-client/test/commerce.test.ts`. Per-route behavior is the 2026-10-30 and 2026-10-31 entries below. Client sale UI is W4 and is not this entry.

**Partial:** `GET /api/admin/users/:id` trust counts (`trust-signals.spec.ts`). The author order card and the admin order and report views still do not return those signals (COMMERCE §7).

**NEEDS-DECISION:** `SUPPORT_TELEGRAM_URL` and `SUPPORT_EMAIL` are not read by `apps/api/src/core/config/env.ts`, notification templates, or the web build. They were not added to the container contract or `EXPO_PUBLIC_*` wiring. COMMERCE §8 and [ENVIRONMENT](../ops/ENVIRONMENT.md) still name them as the future support link and mailbox.

**Implemented:** DEC-152 seller gate. `sellerMayAcceptOrders` (`apps/api/src/sellers/seller-capability.ts`) is true only for `users.status = active` and `SellerProfile.status = APPROVED`. `CommerceGuards.sellerMaySell` reads both after `AntifraudService.lockUsers`. A banned seller's new bid or fixed purchase is `LISTING_NOT_OPEN`. `offerNext` throws the approved-seller `ForbiddenException`. The close tick still sets the listing `ENDED` and creates no order; when a bid exists it does not send `AUCTION_ENDED_NO_BIDS`. An existing `ACTIVE` order stays. `SellerProfile` `SUSPENDED` stays a separate author status. User status stays `active|banned`. Test: `commerce-seller-ban.integration.spec.ts`.

**Needs verification before production migrate:** `20261030130000_commerce_v2` drops the baseline `orders`, `bids`, `auction_rules`, `listings`, and `phone_verification_codes` tables and the `seller_profiles.handoff_*` columns. Production emptiness is not proven. Deploy must stop unless those counts are zero. The migration SQL stays as applied locally.

**NEEDS-DECISION:** admin `FAILED` → `COMPLETED` returns `PRODUCT_IN_SALE` while the work has a `SCHEDULED` or `LIVE` listing (stricter than COMMERCE §6.1; orders entry). RFC §14's fail-closed capability is the pre-W3 runtime the RFC header already scopes that way. Live SMTP, Cron, and production remain Needs verification.

## 2026-10-31 — Commerce API client

**Implemented** locally. `createApiClient().commerce` (`packages/api-client/src/commerce.ts`) calls the COMMERCE §12 routes that exist on the API. Success bodies use the exported contract schemas. The caller passes `idempotencyKey` on bid and purchase. Favorites add and remove expect HTTP 204. `POST /api/admin/users/:id/ban`, `GET /api/admin/health`, `POST /api/internal/tick`, and `POST /api/admin/notifications/retry-failed` were not on `createAdminClient` or `createAuthClient`, so this client owns them. Created listing, author cancel, admin remove, place bid, purchase, admin health, tick, and notification retry have no exported response schema; the client parses those bodies with local strict schemas. Tests: `packages/api-client/test/commerce.test.ts` (place bid, order list, favorite).

## 2026-10-30 — Attention lists and favorites

**Implemented** locally. `GET /api/me/attention` returns `attentionResponseSchema` items in kind order `OFFER`, `ACTIVE_ORDER`, `OPEN_REPORT`, `AUCTION_CHOICE`, `CONTACTS_REQUIRED`. Those names are the Task 1 contract; the brief's longer aliases are not the API values. `OFFER` is the buyer's `OFFERED` orders. `ACTIVE_ORDER` is the seller's `ACTIVE` orders (the author still has to mark the deal), not the 72-hour threshold, and the buyer does not see it. `OPEN_REPORT` is both parties of an order with an `OPEN` `ORDER` report. `AUCTION_CHOICE` is the seller's ended auction with a buyer-fault `FAILED` order, no `OFFERED` or `ACTIVE` order on that listing, and no later listing on the work; the item points at the latest `FAILED` order. A fixed-price failure is not a choice. An open next offer or a newer listing clears it. `CONTACTS_REQUIRED` is one item with null ids when `AntifraudService.hasBuyerContact` is false, and it is omitted for an admin. The user payload has no contacts. `GET /api/admin/attention` is `AdminGuard` and `adminAttentionResponseSchema`: `reportedOrders` and `unmarkedOrders` are `orderDetailSchema` (both parties' contacts, even when `showContactsToBuyer` is false), and `blocks` are `adminUserSchema` rows for users with `releasedAt` null holds from `AntifraudService.listActiveHolds` (email, no deal phone). Unmarked means `ACTIVE` and `activatedAt <= dbNow() - 72h`, computed in that read, not a tick job. `PUT`/`DELETE /api/works/:productId/favorite` are idempotent (`createMany` `skipDuplicates`, `deleteMany`). `PUT` is only a public catalog work (404 otherwise). `DELETE` is any existing product. `GET /api/me/favorites` uses catalog `page`/`limit` and `portfolioWorksResponseSchema` through `toPortfolioItem` and `toPortfolioWorkItem`. A hidden work leaves the row and drops off the list. Personal responses are `Cache-Control: private, no-store`. Anonymous is 401; a non-admin on the admin route is 403. Tests: `commerce-attention.integration.spec.ts`, `favorites.integration.spec.ts`.

## 2026-10-30 — Order reports

**Implemented** locally. `POST /api/orders/:publicId/reports` is a participant of an `ACTIVE` order, or of a `COMPLETED`/`FAILED` order within `COMMERCE_LIMITS.reportWindowDays` (14 days, inclusive of the close instant). A stranger gets 404. A second `OPEN` report from the same participant is 409 after a pre-check under the product lock. The other party gets `ORDER_REPORTED` (`orderPublicId`, `reportId`, `workTitle`) with no complaint text and no contacts. `@RateLimit` `commerce:report` allows 5 reports per user per hour; the 6th is 429 and the counter is in PostgreSQL. An open buyer report keeps that seller-marked strike out of `getTrustSignals`. `GET /api/admin/reports` returns `adminReportSchema` (`orderPublicId`, reporter, buyer and seller user ids, `adminNote`) with no contacts, and `POST /api/admin/reports/:id/resolve` requires an admin. Resolve requires `adminNote` (400). `UPHELD` requires `faultSide`; `REJECTED` rejects one. An optional `orderAction` calls `commitOutcome` in the same transaction. The report update is `updateMany` where `status = OPEN`. The same decision is 200 and does not write again. A different decision is 409. `UPHELD` does not void a strike; void-strike stays a separate admin action. `UPHELD` with author fault increments `upheldReportsAgainst`. Launch targets stay `ORDER`. Tests: `commerce-reports.integration.spec.ts`.

## 2026-10-30 — Commerce tick jobs

**Implemented** locally. `CommerceTickService` registers `commerce.activate`, `commerce.close`, `commerce.offers`, and `commerce.reminders`. Each run takes at most 50 rows and one Read Committed transaction per row: product lock, then `AntifraudService.lockUsers` when user rows change, then `dbNow(tx)`, then a conditional update (`count === 1`). Due `SCHEDULED` listings become `LIVE`. A `LIVE` auction whose effective state is `AWAITING_CLOSE` becomes `ENDED`. The winner is the highest non-voided bid (`rankBidders`); close does not skip a held or strike-blocked leader. A ban already voids that bidder's bids, so those bids are not ranked. That winner gets `createOrder` (`AUCTION_WIN`, `ACTIVE`) when `sellerMaySell` is true. A banned seller still ends `ENDED` with no order, and a bid does not send `AUCTION_ENDED_NO_BIDS`. No non-voided bid leaves no order and an author letter `AUCTION_ENDED_NO_BIDS`. The winner's author letter is `AUCTION_ENDED` («Аукцион завершён»), not reserved `LISTING_SOLD`. `offerNext` still skips held and strike-blocked bidders, as built for the orders task and required by COMMERCE §4.5. `expireOffered` applies system `OFFER_EXPIRED` through `assertOrderTransition`, does not build the order card, and does not fail an `ACTIVE` order. Reminders queue `CONFIRM_DEAL_REMINDER`: `slot` `24h` then `48h`, except when `sellerRemindersSent` is 0 and 48h is already due, which sends only `48h` and sets the counter to 2. The 72h admin list is not a job. One failed record is logged with the job name, record id, and error name and message, and the rest of the batch still runs; the job then throws once with the failure count. A thrown job stays failed and does not move `TickService.lastSucceededAt()`, which `GET /api/admin/health` returns as `lastTickAt`. Tests: `commerce-tick.integration.spec.ts`.

## 2026-10-30 — Orders, contacts, strikes

**Implemented** locally. `GET /api/orders/:publicId` is the order card: buyer, author, or active admin, otherwise 404, including a deal code in the path or `?dealCode`. Contacts and the seller note stay on that card (`Cache-Control: private, no-store`); public author and work responses do not carry them. `GET /api/me/orders` is summaries only. `PUT /api/me/contacts` requires a session younger than five minutes and queues `CONTACTS_CHANGED` with `eventId` only. Buyer and seller transitions, `POST /api/orders/:publicId/offer-next`, admin outcome and void-strike, and `POST /api/admin/users/:id/ban` use conditional writes. `commitOutcome` owns fail and complete; `failFixedPriceReservation` calls it and restores a fixed listing. `offerNext` reuses `createOrder` for at most two `SECOND_CHANCE` offers. Two active buyer strikes block bid, purchase, and accept. The buyer's own refusal counts at once; a seller mark counts after 72 hours and not while that buyer's report on the order is open. `GET /api/admin/users/:id` adds `trustSignals` and no contacts. **Partial:** those facts are not on the author order card or the admin order and report views yet (COMMERCE §7). `orders.failed_by` is migration `20261030190000_order_failed_by`. User status stays `active|banned`. `SellerProfile` `SUSPENDED` stays a separate author status (DEC-152). Nothing closes an `ACTIVE` order on its own. **NEEDS-DECISION:** admin `FAILED` → `COMPLETED` is refused (`PRODUCT_IN_SALE`) while the work has a `SCHEDULED` or `LIVE` listing, which is stricter than COMMERCE §6.1. Founder to confirm. Tests: `commerce-orders.integration.spec.ts`, `trust-signals.spec.ts`, `antifraud.policy.spec.ts`.

## 2026-10-30 — Fixed-price purchase

**Implemented** locally. `POST /api/listings/:id/purchase` is on `CommerceModule` (`OrdersService.purchase`, session and verified email, `Cache-Control: no-store`, no purchase rate limit). `createOrder` is the only order insert: public id, deal code, snapshots, deadlines, and the buyer/seller letters. The purchase transaction locks the product, then the buyer, then reads `dbNow(tx)`. The same idempotency key and normalized comment returns that order; a different comment is `IDEMPOTENCY_KEY_REUSED`, and another key after the sale is `LISTING_NOT_OPEN`. The listing becomes `ENDED` and the public mark is `RESERVED`. Author cancel after purchase sees the listing already `ENDED` and returns 409 without writing. `failFixedPriceReservation` marks the order `FAILED` and `restoreFixedPriceListing` returns a fixed-price listing to `LIVE` in the same transaction. Order card, fail, and complete HTTP are the orders entry above. Tests: `commerce-purchase.integration.spec.ts`.

## 2026-10-30 — Bids

**Implemented** locally. `POST /api/listings/:id/bids` and `GET /api/listings/:id/bids` are on `CommerceModule` (`apps/api/src/commerce/bids.service.ts`). Placement is one Read Committed transaction: product row lock, then `AntifraudService.lockUsers`, then `dbNow(tx)`. The same idempotency key and amount returns the stored bid, including a voided bid; a different amount is `IDEMPOTENCY_KEY_REUSED`, checked before insert. The amount must be a multiple of the currency's smallest step. A bid at or after `endsAt` is `LISTING_NOT_OPEN` using that database time. Soft close uses `resolveSoftCloseEndsAt`. The previous leader gets one `OUTBID` row with `bidId` unless `outbidEmail` is off. History is the latest 20 non-voided bids as `Участник N`, numbered from every bid, without names or contacts. `@RateLimit` is 10 requests per minute per user per listing. `assertCanAct` also requires a deal contact, fewer than 2 active buyer strikes, and fewer than 3 reservations (`ACTIVE` orders plus lots the user leads). The public lot `viewer.blockedReason` does not include those three. Ban voiding runs in the same ReadCommitted transaction as the ban, under product then user row locks. An exhausted retry is `conflict`. Fixed-price purchase is the entry above. Order card, fail, and complete HTTP are the orders entry above. A second author account without the shared-browser signal can still bid. Tests: `commerce-bids.integration.spec.ts`, `antifraud.policy.spec.ts`.

## 2026-10-30 — Listings

**Partial.** `CommerceModule` is on the API boot graph. `POST /api/works/:productId/listings` and `POST /api/listings/:id/cancel` use `SessionAuthGuard` and `VerifiedEmailGuard`. `POST /api/admin/listings/:id/remove` requires an admin and writes `audit_events` in the same transaction. `GET /api/works/:publicId/lot` is `Cache-Control: no-store`, returns `viewer: null` when nobody is signed in, and does not lock the viewer row. `assertBuyerEligible` still locks that user. `dbNow(tx)` in `apps/api/src/core/time/db-now.ts` reads `clock_timestamp()` after the product lock. Author cancel is `updateMany` with `authorCancelWhere`. A product is in sale when a `SCHEDULED` or `LIVE` listing exists or an `OFFERED` or `ACTIVE` order exists. The public work response does not include the listing. The worker caches `/api/works` and `/api/authors` for 30s and does not cache `/api/works/:id/lot`. Fixed-price purchase is the entry above. Bid placement and the later `assertCanAct` checks are in the bids entry. Tests: `db-now.spec.ts`, `listings.service.spec.ts`, `listing-state.spec.ts`, `product-write-guard.spec.ts`, `commerce-listings.integration.spec.ts`, `deploy/cloudflare/src/router.spec.ts`.

## 2026-10-30 — Notification outbox and settings

**Implemented** locally. `enqueueNotification` writes `notification_outbox` in the caller transaction (`INSERT ... ON CONFLICT (id) DO NOTHING`) and does not send. A repeated payload is a no-op; `CONFIRM_DEAL_REMINDER` requires `slot` `24h`|`48h`, `OUTBID` requires `bidId`, `ORDER_REPORTED` requires `reportId`, and `CONTACTS_CHANGED` requires `eventId`. `OUTBID` follows `user_notification_settings.outbid_email` (default on); every other kind is always queued. `TickService` job `notifications.send` claims up to 20 due rows for verified addresses (`FOR UPDATE SKIP LOCKED`), increments `attempt_count` at claim, and sends through `MailTransport` with a 10 second bound. Delivery is at-least-once: a timeout or crash after SMTP accept can send the letter again. Unknown SMTP failures back off until 10 attempts, then `FAILED`; a definite SMTP reject is `FAILED` immediately. A due row already at 10 attempts is `FAILED` without another send. The error log has the outbox id and kind, not the address. Templates avoid «выигр» / «приз» / «розыгрыш», link `/account/orders/{publicId}`, and omit the other party's contacts. `GET/PUT /api/me/notification-settings`, admin-only `POST /api/admin/notifications/retry-failed` (`FAILED` created within 48 hours, `attempt_count = 0`, audit `NOTIFICATION_RETRY` only when a row changes), and `GET /api/admin/health` (`lastTickAt`, `TICK_CRON` as `cronConfigured`, live auctions, failed mail, open reports). Tests: `notification-outbox.spec.ts`, `notifications.integration.spec.ts`. Listing HTTP is in the listings entry above. Orders are still Not implemented. Bid placement is in the bids entry. There is no `failed_at`, so the 48-hour retry window uses `created_at`. There is no public site-origin env; the link origin stays `PASSWORD_RESET_URL_BASE` or the CORS origin.

## 2026-10-30 — Commerce pricing and state rules

**Partial.** `packages/contracts/src/commerce.ts` owns `bidStepMinor`. `apps/api/src/commerce/auction-pricing.ts` re-exports it and owns `minimumBidMinor` and soft close (`resolveSoftCloseEndsAt`: inside the window the next end is `now + extension`, capped at `originalEndsAt + max`, and never earlier than the current `endsAt`). `listing-state.ts` owns `effectiveListingState` and `canAuthorCancel`. `order-state.ts` owns `assertOrderTransition` (`ORDER_TRANSITION_NOT_ALLOWED`) and `faultOf`. Listing HTTP and `dbNow` are in the listings entry above. `Clock.now()` is not deal time.

## 2026-10-30 — Commerce V2 schema and contracts

**Partial.** Migration `20261030130000_commerce_v2` recreates sales tables in integer minor units (`BYN`|`RUB`) and adds deal contacts, reports, notification settings/outbox and favorites. Step tables and sale request/response schemas are in `packages/contracts/src/commerce.ts`; contact and notification schemas are in `packages/contracts/src/user.ts`. No sale HTTP yet. `users.phone` stays. `phone_verification_codes` is removed; that model had no readers.

## 2026-10-30 — Antifraud lock order and UTC signal time

**Implemented locally / live Needs verification.** `FraudSignalsService.lockUsers`
locks the named user ids with `ORDER BY id` before any user mutation or audit
insert. `releaseHold`, `updateUserStatus` / `banUser`, and
`AdminUserService.revokeSessions` (through `AntifraudService.lockUsers`) all take
that lock on the admin and the target. `recordSignal` writes
`(clock_timestamp() AT TIME ZONE 'UTC')::timestamp(3)` and keeps `users.updated_at`
with `GREATEST`. `antifraud-signals.integration.spec.ts` covers concurrent
session revoke against ban and against hold release when the admin id sorts
first, an `updated_at` already an hour ahead, and a session `TimeZone` of
`America/Los_Angeles`. Ban owner, guards, routes, and Turnstile action
`email_login` in `13-APPLICATION-SECURITY.md` match the code.
`RATE_LIMIT_MAX_BUCKETS` and `RATE_LIMIT_CLEANUP_INTERVAL_MS` are removed from
`.env.example`; application code does not read them.

**Implemented 2026-10-31 (`DEC-152`, founder confirmed):** account ban is `User.status = banned`;
`SellerProfile` `SUSPENDED` stays a separate author status. New bids, purchases, and orders
on that seller's listings are refused. The close tick ends the listing `ENDED` with no order
([W3 audit](../launch/waves/W3-commerce-backend.md#аудит-плана-2026-10-30)).

Local this session: API unit 688 passed with `BIDPLACE_ENV_FILE` unset.
PostgreSQL integrations passed one file at a time: signals 23, admin emergency
4, rate limit 5, auth transport 24. Together those four files exceed the
existing 10s `beforeAll` limit while waiting on the shared migrate lock; the
limit was not raised. API typecheck and lint passed. Docs link check passed.
Live Cloudflare, SMTP, R2/CDN, and Cron remain Needs verification.

## 2026-10-30 — W2b signal clock and serializable holds

**Implemented locally / live Needs verification.** `FraudSignalsService.recordSignal`
touches `users.updated_at` after the user lock and inserts `fraud_signals.created_at`
from post-lock `clock_timestamp()` (`apps/api/src/antifraud/signals/fraud-signals.service.ts`).
That same timestamp is the inclusive 24-hour lower bound. A stale Serializable
`assertCanAct` then conflicts on `SELECT … FOR UPDATE`, and
`runSerializableTransaction` retries to `BUYER_BLOCKED`.
`antifraud-signals.integration.spec.ts` covers that wait and a signal that
expires while the caller transaction is open. Repeatable Read remains
unsupported. This session: that file passed 18 tests three times; API typecheck
and lint passed. Live Cloudflare, SMTP, R2/CDN, and Cron remain Needs verification.

## 2026-10-29 — W2b antifraud module

**Implemented locally / live Needs verification.** `AntifraudService`
(`apps/api/src/antifraud/`) owns auth abuse, durable `rate_limit_counters`,
invisible Turnstile proof, `fraud_signals`, `purchase_holds`, and canonical
ban/unban. Migration `20261029210000_fraud_signals`. Two distinct signal kinds
in 24 database hours create one hold (`BUYER_BLOCKED`); one kind does not.
Caller transactions are Read Committed, or Serializable with whole-transaction
retry. Signal time is taken after the lock via clock_timestamp. Each
recordSignal touches the user row so stale Serializable snapshots conflict and
retry. Repeatable Read is still unsupported. `POST /api/admin/users/:id/release-hold`
releases a hold. Ban keeps user status `banned`, increments `sessionVersion`
in the transaction, and delivers media revocation after commit. Strikes, the
3-booking cap, bid voiding, and purchase runtime remain W3.
`RATE_LIMIT_MAX_BUCKETS` and `RATE_LIMIT_CLEANUP_INTERVAL_MS` are not read.

Local this session: API unit 686 passed and 2 env-path tests passed in a
separate mocked run (688 total); PostgreSQL integrations 173 passed and 1
browser-smoke opt-in skipped across auth transport, social auth, password
reset, rate limit, signals, admin emergency, and media lifecycle, plus 28
auth-abuse tests; contracts 50 passed. API and mobile typecheck/lint passed.
Direct builds passed for contracts, database, api-client, API, design tokens,
and the mobile web export. Docs link check passed (105 files). Registration
browser at 390 was Chromium and WebKit 1+1 in Task 3 and was not repeated.
Live Cloudflare Invisible mode, SMTP, R2/CDN, and Cron remain Needs verification.

## 2026-10-29 — PR73 review fixes

**Implemented locally / live Needs verification.** Media recovery reports exhausted
FAILED REVOKE/CLEANUP without retrying them or advancing `system_heartbeats`.
`product-publication.ts` rejects nonrestore approval and archive during a sale;
moderation checks before media enqueue. Product lock contention returns
`PRODUCT_STATE_CONFLICT` (409) after a bounded wait. Exact completed hidden
approval retries preserve audit and PUBLIC bytes. Profile restore now shares the
pre-PUT compensation journal, preserving PRIVATE and unrelated public references;
owner/admin image reads skip catalog queries and use private cache policy.
Worker scheduled failures reject with a fixed safe message; release hold skips
forwarding. Local checks: API unit 668 + 2 isolated mocked config-path tests,
97 PostgreSQL integration cases, API typecheck/lint/build, Cloudflare
43 Worker + 25 script tests and typecheck/lint. Draft CI does not cover these
full local gates. No push, Ready transition, remote Verify, merge or deploy.
Provider fencing, live R2/CDN/Cron acceptance and strict privacy atomicity remain
open; the 30s heartbeat keeps the database active while its Container is awake.

## 2026-10-29 — Failed Work restore compensation

**Implemented locally / live Needs verification.** `media-lifecycle.service.ts`
commits generation-bound PUBLIC REVOKE intent before restore delivery, checks the
current source lease, and rearms cleanup for manual retries. Only its exact FAILED
restore on ARCHIVED Work bypasses PUBLIC deletion blocking. PRIVATE originals,
RUNNING leases and legitimate shared public references remain protected.
`media-lifecycle.integration.spec.ts` covers partial two-image delivery, interrupted
failure transition/fresh-service recovery, journal persistence outage, shared
references, same-generation retry and later restore cycles. API media/publication
integration, media unit, typecheck, lint and build checks pass locally.
Compensation does not prevent brief exposure before cleanup/purge. Pre-existing
FAILED restores without a journal require manual retry; live R2/CDN remains open.

## 2026-10-29 — Hidden Work media privacy (Opus P1)

**Implemented locally / live Needs verification.** `core/media/media-lifecycle.service.ts`
keeps ARCHIVED nonrestore revision approval in PRIVATE, advances the publication
pointer/audit, and leaves unwritten PUBLIC manifests unready. Each Product PUBLIC
write shares the hide row lock and rechecks operation lease/generation/status;
PRIVATE reads remain outside the lock. `media-object-store.ts` propagates a 60s
publication abort deadline through reads/body consumption/writes before the 65s
transaction timeout. Hide may wait or fail under slow delivery; it cannot succeed
then be followed by that approval's PUBLIC writes. Explicit restore still delivers
from PRIVATE; profiles, shared-public-reference revoke guards and schema are unchanged.
Regression evidence: `media-lifecycle.integration.spec.ts` checks zero hidden PUTs,
known former URL absence, both deterministic delivery/hide orderings, and restore;
`media-object-store.spec.ts` checks abort-before-write and body cancellation.
Live R2/CDN acceptance remains Needs verification.

## 2026-10-29 — W1 publication state owner

**Implemented locally / live and visual Needs verification.**
`products/product-publication.ts` is the only Product status/published-pointer
writer; author/admin/media use locked conditional transitions. Hidden revision
approval retains ARCHIVED with the new pointer, with media on/off; deterministic
hide/approval, PENDING/FAILED cleanup and manual-retry regressions preserve public
revocation and private sources. `product-write-guard.ts` owns sale checks;
`portfolioCatalogProductWhere` owns catalog/direct/image eligibility. Seller
suspension uses the actual `AdminModerationService` boundary; its state machine
is unchanged. Contracts expose PRODUCT_STATE_CONFLICT/PRODUCT_IN_SALE (409), and
mobile `apiErrorMessage` maps the two approved reasons in hide/save consumers,
including inside cabinet/profile dialogs. API test files now participate in
ordinary typecheck/lint. Local commits, checks, rulings and limits:
[W1 journal](../launch/waves/W1-publication-owner.md#журнал-исполнения-2026-10-29).
No schema/dependency/product-decision change, merge, push or deployment. Longer
copy wrapping/focus/zoom/device screenshots, dedicated auth-abuse/browser opt-ins
and live storage acceptance remain Needs verification. Later waves are not started.

## 2026-10-29 — W2 scheduler tick

**Implemented locally / live Needs verification.** Worker scheduled forwarding
and public internal-route 404, Nest `core/tick` registration/30-second timer,
single-flight/cooperative 20-second budget, private guard and persisted heartbeat
are implemented. Migration `20261029010000_system_heartbeats` adds
`system_heartbeats(name, at)` and must precede this runtime. Enabled media uses
one bounded recovery batch for due revoke/cleanup and expired RUNNING PUBLISH;
manual PENDING/FAILED publication retries and existing leases/CAS remain.
Persisted media failures prevent heartbeat success; old timers only accelerate.
Empty `TICK_CRON` keeps Cron disabled and clears a prior schedule on final deploy;
production-only deployment requires `main`. W3 commerce, admin health and outbox
remain **Not implemented**. Local final checks and commit evidence:
[W2 journal](../launch/waves/W2-scheduler.md#журнал-исполнения-2026-10-29).
No live migration, deployment, provider/CDN or Cron acceptance is claimed.

## 2026-10-29 — Launch documents integration, stage B

**Partial.** Stage A is merged through PR #71 at `95083515`; this supersedes
the pending-main note below. `fix/launch-docs-integration` combines that main
with the unchanged source `fix/launch-docs-review` (`54925364`). Both decision
entries are retained verbatim: commerce `DEC-150` and photo `DEC-151`; the
architecture keeps W0 facts and the planned logic-owner table. Launch README
records the actual W0 state; W1's prompt includes its existing Task 0.
No runtime, API, schema, workflows or product decisions change. Documentation
acceptance uses byte comparisons, `pnpm docs:link-check` and `git diff --check`;
the integration PR records their results and merge. Photo acceptance stays
Partial (`DEC-112`, story CDN, native); W1 and production deploy are not started.

## 2026-10-29 — W0 integration into main, stage A

**Needs verification.** Integration branch `fix/w0-main-integration` starts from
`feature/photo-workflow` at `8f49d646` (merged PR70) and merges `main` at
`5a052ad1` with both histories retained. The sole add/add production workflow
conflict keeps the current W0 file: manual-only deploy, main guard, main Workers
CI branch and existing release/security gates. Production runtime files are unchanged from
W0. PR71 CI exposed the previously recorded async reconciliation test race;
the test now waits through its existing owner helper before unchanged assertions. Local ops32/32, docs links99 and diff checks pass; PR CI and actual main
integration are tracked by the integration PR. No production deploy occurs.
Stage B is reserved for separate integration of `fix/launch-docs-review`
(`54925364`); W0 Complete and W1 readiness are not claimed before that work.

## 2026-10-29 — Partial staging keeps its original story revision

**Partial.** Follow-up review reproduced a remaining `ImagesService` /
`MediaLifecycleService.stage` boundary: after a private object write failed in
R1, replay of its operation key in R2 returned201 and created a hold there.
The upload operation now records its revision in the creation transaction before
object writes. Retry retains that binding, and a conditional update supports
existing unbound operations. The HTTP regression requires409 in R2, no hold in
R2, and successful recovery in R1. No migration, UI or limits changed.
API unit478/478, integration61/61, API typecheck/lint and dependency build pass.
Verification results are recorded in the [W0 journal](../launch/waves/W0-photo-and-trunk.md).

## 2026-10-29 — Story revision binding and rejected encodings

**Partial.** `8a6e3620` requires `X-Photo-Revision` on story upload. The client
stores the editing revision when the photo is selected and sends it again on
replay. The API checks that revision before staging and after the Product lock.
A replay for a different revision returns 409 and does not create a hold. A
lost response on the same revision still returns the existing hold, and the
five-photo limit stays. The revision is not part of the idempotency hash.

`080bc7c6` covers one `mediaAssetId` held by two revisions. Saving the first
releases only its hold. After cleanup, the second reference, `READY`, and the
stored bytes remain. Production cleanup was not changed: the defect did not
reproduce. `ec860de9` deletes a rejected encoding through `deleteGeneratedImage`
when the result is too large or cannot be read; the source file and an accepted
URI stay. `b4af2da2` types that spy. Verify on `9252cee8` rejected the unused
parameter; `8b578f2d` uses the spy argument.

Addressed checks: API image unit 34/34, api-client images 4/4, mobile
prepare/editor/submit 131/131, integration `work-media-http` and
`author-story-catalog` 18/18. Four-package typecheck, API/mobile lint, API
build, and web export pass. Chromium/WebKit story matrix 12/12. Commands and
the unchanged Partial scope are in the
[W0 journal](../launch/waves/W0-photo-and-trunk.md). `DEC-112`, story CDN, and
native acceptance stay open.

## 2026-10-29 — W0 acceptance and main workflow preparation

**Partial.** Supersedes the previous W0 gate refusal: founder explicitly approved
metadata-only save-race fixture corrections, current browser flow/locators and
main-only push checks. `d701f87a` keeps the same save/lease/concurrency assertions
and uses revision-owned gallery positions; backing image identity and exact
locked409 are checked. Browser flows explicitly upload photos and retain
draft/revision recovery and no-extra-write assertions. Shared contract lint is
clean. `8f610267` prepares Verify/production workflow and Workers CI branch for
main; ops32/32 pass. No switch/reset/push/merge/deploy was performed. Actual
cutover remains a founder action (W0 Task5).

Review of `9a2bdf97..8f610267` required one fix. A pending first upload was not
dirty, so transition owners skipped save, and keyed replay called public
`addImage`, which the save's own transition lock blocked. `8a5de85a` marks that
pending intent dirty at staging; public `addImage` still checks the user lock,
and save calls the internal upload. Identity, owner and session guards stay.
Photo limits are `DEC-151`. Published `DEC-150` on `fix/launch-docs-review`
(`54925364`) is the deals decision.

Mobile1138/1138, API476/476, integration59/59, contracts48/48, api-client51/51,
Chromium/WebKit12/12 and ops32/32 pass. Four-package typecheck, API/mobile/shared
lint and API/web builds pass. [W0 journal](../launch/waves/W0-photo-and-trunk.md)
owns commands and results. Overall photos remain Partial: shared-byte reuse
(`DEC-112`), story CDN and native acceptance are outside W0. Merge
`fix/launch-docs-review` after this W0 review and before W1.

## 2026-10-28 — W0 photo/story hardening (`DEC-151`)

**Partial.** Tasks1–4 changes: `replaceProductStory` atomically releases unused
story-purpose revision holds; `ImagesService.addStoryImage` checks admission
before staging and under lock; `SharpImageProcessor` shares gallery/story pixel
budgets. Contracts own 10MiB story input and ten gallery photos; 20MiB story
aggregate budget removed. Media retries stop at20 without resetting timestamps.
Client uploads use `WORK_PHOTO_PREPARE`; upload preserves story text/focus, blank
alt becomes null at serialization while typing keeps spaces; server owns hold release.
A save reconciles an uncertain upload by its existing key before PUT; failure
preserves text and never releases an unseen hold. `story-local-draft.ts` owns v2;
editor uses StyleSheet/tokens, old optional gallery branch removed.

API unit476/476, addressed frontend119/119, four-package typecheck and web export
pass. Integration57/59 (two gallery atomicity failures also on base). Story UI
Chromium/WebKit4/4 pass, before/after390×874 stable (one frame has46 toolbar-edge pixels differing by1 RGB level).
Mandatory browser gates6/12 pass; protected old selectors fail. Full mobile gate
1127/1131 passes; four synthetic picker fixtures lack image metadata. The founder
explicitly declined fixture changes; the protected gate remains unclosed. Assertions
and timeouts remain intact. Independent review stopped at its usage limit; two
concrete findings were reproduced and fixed (upload replay before save, alt typing). Shared lint finds two
pre-existing duplicate enum imports in contracts/admin.ts. Full evidence and
rulings: [W0 journal](../launch/waves/W0-photo-and-trunk.md#журнал-исполнения-2026-10-28).
Task5 (main/CI/deploy) explicitly deferred. `DEC-112` reuse, story CDN and native
acceptance remain open; no overall Implemented claim.

## 2026-10-28 — Launch plan and docs restructure

- Not implemented: commerce (`DEC-149`): listings, bids, orders, reports, strikes,
  notifications outbox, favorites, scheduler tick, share export. Plan:
  [`docs/launch/`](../launch/README.md) waves W0–W7; rules: [COMMERCE](../launch/COMMERCE.md).
  Runtime stays portfolio-only; old commerce stays off (`DEC-084`).
- Docs: old plans, dated audits, `docs/tasks/`, `docs/archive/` and
  `16-PORTFOLIO-ACTIVE-BACKLOG` deleted (recover: `git show 036d2cc4:<path>`);
  `15-POST-MVP-BACKLOG` is post-launch only; `16-COMPONENT-OWNERS` →
  `17-COMPONENT-OWNERS`. `pnpm docs:link-check` passes.

## 2026-10-28 — Story interaction and opening avatar acceptance

**Partial.** Supersedes the control-gutter claims below: the selected story block
is raised so the whole 44×44 trigger receives hits; the neighboring textarea
stays outside that gutter. `product-draft-story.tsx` separates focus from height
measurement and recalculates height only on text/width changes. This prevents
scroll resets caused by transient zero height and handles 390→1024→1440→390
without reloading. `FormPageShell` uses Web keyboard dismissal `none`: RN Web's
`on-drag` blurs on programmatic scroll as well, losing focus while revealing a
field. Native keeps `on-drag`. The inactive gutter still has `pointerEvents="none"`.
`HomeOpening` now uses the existing plain avatar fallback and gray theme surface,
without manual retry controls; automatic retries remain. Plain fallbacks retain
an accessible image description through `ResilientRemoteImage`.

Chromium/WebKit checks cover all nine trigger hit points, independent neighboring
textareas, real wheel scrolling in a short viewport, subsequent keyboard input,
responsive textarea height, and pending/failed avatar requests. Existing photo/
story regression checks remain in scope. Upload/save/DnD and server contracts are
unchanged. [Evidence and actual checks](../audits/evidence/2026-10-28-story-interaction-final/README.md).
Native devices and actual browser zoom 200% remain **Needs verification**; wide
Figma parity stays **NEEDS-FIGMA**. Server gallery/story file reuse remains
**Not implemented**; session SHA-256 does not implement it.

## 2026-10-28 — Story editor control gutter

**Partial.** Story text is a row: the field and a 44px strip outside the
textarea (`product-draft-story.tsx`). Text width is unchanged. The active ⋮
stays in its own strip. A press on the neighbor's right edge or in that
neighbor's strip focuses the neighbor and does not open the other menu.
Inactive strips do not capture the press. Chromium and WebKit covered both
orders for two single-line paragraphs and for heading plus paragraph. WebKit
scrolls from the inactive strip; Chromium has no scrollport on this step.
Native gutter taps remain **Needs verification**. No upload, save, DnD, or
server file-reuse change.
[Evidence](../audits/evidence/2026-10-28-story-editor-controls/README.md).

## 2026-10-28 — Story editor active block controls

**Partial.** User decision, variant A: keep Figma text density (line-height
24/20, 6px gap) and show ⋮ only on the selected block. Hiding ⋮ on inactive
blocks differs from Figma and is accepted. `FigmaIconButton` `frame` is a real
44×44 hit box with the existing glyph centered; story ⋮ and menu delete use it.
Chromium and WebKit measured both at 44×44. Menu stroke is 144.5×51.5,
rx=ry=25.75. Toolbar stays 272.21875×53 against Figma 275×52.
The text field keeps its right gutter. Selection is the block press or Web
focus, and choosing another block closes the previous menu. Native 44×44 is
**Needs verification** on a device (adjacent single-line ⋮, typing beside the
control, scrolling across it, Android parent clip). No upload, save, DnD, or
server file-reuse change. Session SHA-256 is not server reuse.
[Evidence](../audits/evidence/2026-10-28-story-editor-controls/README.md).

## 2026-10-28 — Story editor hit targets

**Partial.** `storyTextMenuFrame` keeps a text ⋮ at least 24px and inside the
gap before the next block. Native `hitSlop` reaches 44px horizontally and half
the free gap vertically; it is not 0. Web still ignores hit slop, so the
measured box is 24×24. Delete stays `FigmaIconButton` compact (Web 34×34,
Native slop to 44). The gap from 44px needs user agreement. The menu ring uses
`figmaButtonStrokeRadius` (measured rx=ry=20.75). Vitest loads
`react-native-svg` through the existing setup stub. Playwright Chromium and
WebKit passed both story scenarios on ports 3011/8091 without `prepare.mjs`.
Toolbar allowance versus 275×52 is −2.78125 by +1.
[Evidence](../audits/evidence/2026-10-28-story-editor-controls/README.md).
Browser zoom 200% and Native iOS/Android were not run. No upload, save, DnD,
or server file-reuse change. Session SHA-256 is not server reuse.

## 2026-10-28 — Story toolbar shared primitives

**Partial.** `figmaButtonSizes` includes `compactIcon` (`figma-button.ts`,
`FigmaButton`). `FigmaIcon` registers `image-02` beside `image-01`.
`typography.subtitle` is 14/20/400/0; `bodySmall` tracking stays −0.14.
`destructiveInk` is `#731A06`; `destructiveFill` is unchanged. Toolbar/menu
surface role remains `surfaceMuted`. Story glyphs use `stroke.icon` (1.3).
`product-draft-story`, `product-block-actions`, `FormPageShell.contentGap`
apply the story geometry (12/6/20 gaps, 52px toolbar, menu styling); `theme.spec`
and `work-media-lifecycle.spec` extended. Typecheck, lint, unit, e2e-fence,
web build pass; Playwright and Native not run (Needs verification). No API change.

## 2026-10-27 — First story input identity and upload status

**Partial.** `product-draft-story` renders the virtual empty paragraph and first
real block through the same keyed subtree; `useProductStoryEditor.addText`
adopts that key. Initial typing preserves the field instance/focus/caret;
blank content still filters out at save. Removed the duplicate empty-story hint.
The existing fixed-height status area now says «Загрузка фотографий» while a card
is sending, with distinct preparation/order/completed states. No DnD changes.
**Not implemented:** automatic server reuse of an identical file selected in
gallery and story. Session SHA-256 only detects repeated gallery selection;
it does not implement shared server media reuse. [Evidence and checks](../audits/evidence/2026-10-27-story-input-status/README.md).

## 2026-10-27 — Photo status and story interaction follow-up

**Partial.** User-selected UI/client scope: `product-draft-images` keeps stable
status geometry and local previews until server decode; session SHA-256 avoids
rereading prior selected files (`expo-crypto`). Duplicate text is explicit.
`ProductBlockActions` keeps a compact menu/focus attached to a block during
movement. `product-draft-story` has a virtual empty text field, direct picker,
growing inputs and no redundant gallery/back controls; blank text is omitted by
`useProductStoryEditor` without changing meaningful block keys. Server media reuse
is deferred, explicit gallery upload retained. No backend/schema/API change.
[Implementation, checks and evidence](../audits/evidence/2026-10-27-photo-story-followup/README.md).
Manual user drag, rounded OS ghost, physical Native and live CDN remain unverified.

## 2026-10-27 — Connected Chrome photo acceptance

**Partial.** Existing test API/Expo Web and an isolated author fixture allowed
three-photo upload and manual photo-editor checks through creation step2 and
ordinary draft editing. Actual browser zoom200% at600×349 CSS viewport: Done is
accessible, tools reachable by scrolling, Done returns to the form. Original CTA
loss remains **not reproduced**, cause unknown. Manual mouse attempts did not
confirm reorder/rounded ghost; physical Native, JS-load smoothness and live CDN
remain unverified. Runtime `ee4b71fd` unchanged; no full test/build rerun.
[Addressed acceptance and screenshots](../audits/evidence/2026-10-27-photo-manual/README.md).

## 2026-10-27 — Manual photo acceptance availability

**Partial.** Runtime `ee4b71fd` is unchanged. This pass checked environment only:
local browser connector disabled; CUA Testing window shows `chrome://intro/`;
checked Web ports8081/8087 are not listening. `simctl` is unavailable and
`adb`/`emulator` are absent from PATH. Manual ghost, true zoom200%, both editor
entries and Native interaction/performance scenarios were not executed.
Original missing CTA remains **not reproduced**. Native `runOnJS(true)` smoothness
under load is a device-check risk, not a proven defect. Existing tests/builds were
not rerun or promoted to manual evidence. No implementation/infrastructure change.
Detailed acceptance record.

## 2026-10-27 — Drag boundary and Native integration

**Partial.** Follow-up above `c96d3f3f`: whole-grid `PhotoDropArea.web` handles
mouse drop on vacant cells/gaps/add tile using fixed parent-cell geometry; outside
release restores order. `SortablePhotoTile.web` no longer owns mouse drop.
Native gesture attaches only to `PhotoDragSurface`, excluding edit/delete/Retry;
`FormPageShell` now supplies bounded edge scrolling and actual scroll delta.
`PaddedGrid.activeItemId` raises the active row across neighboring rows. This
supersedes the earlier “no native edge scroll integration” limitation in code;
physical Native overlap/gesture/cancel acceptance is still **Needs verification**.

Local checks: 1114 unit tests, media14/14 and shared-consumer6/6 Chromium/WebKit,
affected typecheck/lint and e2e fence passed. Final held-mouse/touch/keyboard
rerun4/4 and Web export passed; Web/iOS/Android export also passed.
[Mouse recordings](../audits/evidence/2026-10-27-photo-drag-final/README.md).

Owner tests check button exclusion, scroll-adjusted row insertion, commit/cancel,
scroll edges and cleanup. Browser mouse checks use down/move/up rather than direct
drop dispatch. Recordings and final checks are in the
follow-up audit.
No route/API/media contract or Figma styling change. Native runtime unavailable
(`simctl` absent). System drag ghost and true browser zoom 200% remain unverified;
original CTA disappearance remains **not reproduced**, not declared fixed by the
scroll padding or CSS zoom test. No user window closed; no merge/deploy.

## 2026-10-27 — Photo interaction corrections

**Implemented for tested local Web corrections; overall workflow Partial.**
`PhotoCropSurface.web.tsx`, `photo-editor.tsx`, `SortablePhotoTile` and
`product-draft-images.tsx` correct Original hiding, eager avatar preview, stable
picker slot, insertion preview/cancel and one error banner. Shared
`FormPageShell` owns bottom-action clearance; semantic tokens/shared button own
stage/preview surfaces and creation-action shadow/weight. No route/API/DB/media
revision contract changed. `product-draft-image-actions.ts` owns early preflight
busy, cleanup on unmount and targeted preparing before uncertain-result lookup;
operation keys/bytes, successful-photo reuse and safe replacement remain covered.

[Evidence and limits](../audits/evidence/2026-10-27-photo-fixes/README.md),
implementation review.
Node 22: media 12/12 + focused final media 8/8 + shared-consumer 6/6
Chromium/WebKit passed; affected unit/typecheck/lint and export results are in the
audit. Final keyboard-remount focus 2/2 and full Web/Android/iOS export passed.
Initial extra onboarding check reproduced its missing editor-confirmation
step on baseline `49831921`; helper corrected. Admin's broad acknowledgement
selector conflicted with a transient notice; exact acknowledgement plus all
public-revision checks passed. No assertion or timeout relaxed.

Physical Native (including drag-button exclusion/edge scrolling), actual browser
chrome/OS zoom, exact wide design and live R2/CDN remain Needs verification;
local CSS zoom 2 and Chromium CDP touch are not physical-device acceptance.
`.cursor/` untouched. No merge/deploy.

## 2026-10-27 — Photo state review pack

**Implemented for local Web evidence; workflow remains Partial.** Existing
`work-media-lifecycle.spec.ts` now records selection/duplicates/empty source,
10-photo limit, editor original/crop/rotate/flip/reset/focus/processing failure,
upload/partial failure/retry, discard dialog, order failure/saving/success,
primary deletion, post-reload server gallery and avatar states.
[86 PNG, 34 state categories, HTML gallery and manifest](../audits/evidence/2026-10-27-photo-states/README.md).
Runtime `804fe830` unchanged. Node 22: partial/order scenarios 4/4 and final
editor/avatar/reload rerun 2/2 Chromium/WebKit passed; affected typecheck/lint
passed. Initial capture wrongly expected local recovery after a full page
navigation; corrected to assert server-only gallery per the existing contract.
Physical Native, 200% zoom, session/revision conflict variants and live CDN are
not established by these images. No merge/deploy.

## 2026-10-27 — Photo edit icon reference

**Implemented for tested local Web icon change; workflow remains Partial.** Photo grid edit controls now select
Hugeicons `Edit03Icon` through the shared `FigmaIcon` registry, matching the
founder-provided pencil without an underline. Existing `pencil-edit-01` consumers
in CreatorHeader/CreatorWorkCard retain their icon. Button geometry, labels and
callbacks are unchanged. Node 22: 53 targeted owner/icon tests and affected graph
typecheck/lint, Web export, Chromium/WebKit media checks (2/2), formatting,
docs links and diff check passed. Preparation/error screenshots refreshed and
visually checked; Native rendering was not checked.

## 2026-10-27 — Photo grid acceptance cleanup

**Implemented for tested local Web corrections; workflow remains Partial.**
Above `2569f20b`, removed the standalone grid discard action and restored
«Продолжить» on the disabled upload/error CTA, preserving its availability rules.
Close opens the existing discard confirmation for idle unfinished photos;
cancelling keeps local edits, confirmed successful cleanup closes the form.
Unknown upload responses prevent closing after refused discard; session operation
identity guards late completion. Existing active-upload close/recovery remains.
Node 22.20.0: 1105 mobile tests, 45 targeted lifecycle tests, affected graph
typecheck/lint, Web export, four targeted Chromium/WebKit media cases and two
final close-dialog cases passed. Checks and refreshed error evidence.
Backend/architecture unchanged; Native gestures, 200% zoom and live CDN remain
Needs verification. No merge/deploy.

## 2026-10-27 — Photo workflow review corrections

**Implemented for tested local Web/adapter corrections; workflow remains Partial.**
Follow-up to `43324a17` in
`feature/photo-workflow`: new source validation is independent from prior dedup
candidates; unreadable earlier sources are removed from comparison without
transferring their error. `product-draft-submit-lifecycle.spec.ts` covers
oversized/empty/unreadable → valid in a batch and separate picker selections,
while exact-byte duplicate/reselect coverage remains.
`PhotoEditor` renders preparation errors for both Work/avatar, retains draft
settings and supports retry/cancel. Native crop handles update bounded geometry
on gesture updates, with no pixel preparation until confirmation.
Web keeps four corner handles, circle-only avatar, exact Undo icon, plain
FigmaTabs rail and regular caption typography. Owner tests and actual rendered
browser processing-failure/retry checks added. 1104 mobile tests, affected graph
typecheck/lint and Web/iOS/Android export passed. Final sequential media suite:
8/8 Chromium/WebKit E2E passed without changing assertions/timeouts. E2E fence,
193-file docs link check, formatting and diff check passed.
Four-state screenshots and review.
No backend/API/persistence changes or broad hook refactoring. Native simulator
unavailable (`xcrun simctl` missing); physical gesture/output remains Needs
verification. No merge/deploy.

## 2026-10-26 — Photo workflow, DEC-148

**Partial.** Work selection/confirmation, per-card editor, exact-byte session
deduplication, addressed retry, composition lock, server-confirmed order and
in-process recovery implemented in `product-draft-image-actions.ts`,
`work-photo-session.ts`, `photo-editor.tsx`; avatar uses the same editor before
existing save. Revision crop/slot/version and replacement are owned by
`ImagesService`, contracts and migration `20261026160000_work_photo_slots`.
Cards consume crop; fullscreen retains full pixels. Immutable operation ledger,
owner-only SOURCE, transactional slot switch and cleanup/attach serialization
preserve revision/privacy boundaries. [Architecture](10-CODE-ARCHITECTURE.md).

Node 22.20.0: 1097 mobile unit tests, 470 API unit tests, 7 upload-safety integration
tests, 48 contracts / 51 api-client / 1 database unit tests, affected Turbo
typecheck/lint and API build passed. Web/iOS/Android export passed. Integration
includes crop-only without
stage, stable keyed replay, stale revision/order/delete, concurrent replacements,
staging rollback, controlled cleanup/attach and preserved published FULL. Six
Chromium/WebKit media E2E passed with original timeouts; 390/1024/1440 editor and
320–1440 error-layout evidence captured. E2E fence, docs links (193 files) and
diff check passed. Evidence and limits.
Native device gestures, HEIC, 200% zoom, full visual parity and live R2/CDN remain
Needs verification; wider exact parity is NEEDS-FIGMA.
No merge/deploy. Branch `feature/photo-workflow` starts at `9ef59acd` of
`feature/photo-preparation-core`; integration target remains
`origin/feature/portfolio-mvp-release` (implementation base `ef14bfe1`).
`23250a8b` is original plan context, not an integration base. Earlier preparation
entries below describe their historical cut; this entry supersedes their editor
and API absence statements. Founder Q1–Q5 are Confirmed in DEC-148.

## 2026-10-26 — Устранение повторного save перед photo upload

**Implemented (local checks passed).** `product-draft-save.ts.persistDirtyForm()`
ожидает активный save и проверяет актуальные dirty-поля React Hook Form;
`startUpload()` использует его вместо безусловной записи. `selectImages()`
сохраняет save → picker. При поздних правках владелец save сохраняет их перед
upload, при ошибке/смене владения останавливается. Unmount завершает владение
save operation/generation. Новая копия snapshot/dirty-state не создаётся.
`product-draft-save-race.spec.ts` проверяет реальные `products.update` и
`images.add` через существующую форму; lifecycle/retry owner остаётся прежним.
UI, editor, backend и зависимости не менялись.

Проверено на Node 22.20.0: 80 целевых owner-тестов; Turbo
`typecheck lint test build --filter=@bidplace/mobile...` (1083 mobile + 48
contracts + 51 api-client unit tests, Web/iOS/Android export); 6 media E2E
Chromium/WebKit (`playwright.media.config.ts`, порты 3101/8181), E2E fence,
`docs:link-check` (192 файла), `git diff --check`. Физические устройства и
live R2/CDN остаются Needs verification. Merge/deploy не выполнялись.

Целевая ветка интеграции: `feature/portfolio-mvp-release` (`origin/feature/portfolio-mvp-release`);
база `feature/photo-preparation-core` — `ef14bfe1`, первый коммит — `b978cf50`.
`23250a8b` (`fix/mobile-form-ux`) — контекст исходного плана, а не база этой
реализации. Посторонние изменения не переносились; история не переписывалась.

## 2026-10-26 — Техническая основа подготовки фотографий

**Implemented (local checks).** `product-draft-image-actions.ts` разделяет
`selectImages()` и `startUpload(selection)`; существующий `chooseImages()`
вызывает их сразу. Пачка фиксирует входы, сохраняет последовательность,
Blob/ключ при retry, частичный успех, approved-save и session/operation guards.
Unmount исключает поздний старт/применение результата. `readImageUpload` в
`prepare-image-upload.ts` переиспользует чтение/byte validation без обработки
пикселей; Work сохраняет 25 MiB, фото автора — прежние 1600px / 2 MiB и lifecycle.
Расширены `product-draft-submit-lifecycle.spec.ts` и `prepare-image-upload.spec.ts`;
`product-draft-save-race.spec.ts` сохраняет порядок save → picker.

Проверки на Node 22: Turbo `typecheck lint test build --filter=@bidplace/mobile...`
(1074 mobile + 48 contracts + 51 api-client unit tests; Web/iOS/Android export),
6 media E2E Chromium/WebKit (`playwright.media.config.ts`, порты 3101/8181),
E2E fence, docs links и diff check. API/schema/dependencies и внешний UI не менялись.
Пригодность библиотек и точка расширения — [architecture owner](10-CODE-ARCHITECTURE.md).
Подтверждение перед отправкой и редактор — **Not implemented**; native cropper,
HEIC на устройствах и live R2/CDN — **Needs verification**. Merge/deploy не выполнялись.

## 2026-10-25 — PR #67 final MVP integration

**Implemented for verified local web states; final-SHA CI tracked in PR #67.** Merged `068af087` (PR #66) normally
into Explore at `87a2ab68`. One conflict in this status owner retained both tasks.
`tokens.ts` retains Blur16/Native60 and icon1.3/heavy1.6/active2.5; deleted legacy
blur tokens remain absent. Overlay cards use the new CoverFrost; caption Works
remain without blur. Removed global `lastState` from `use-explore-state.ts` after
both browsers reproduced stale queries on independent Home → Search entry.
Owner unit/E2E regressions cover fresh entries and retained same-entry Back state.
Passed: 1053 mobile unit tests, graph typecheck/lint, 46 Chromium/WebKit E2E plus
six strengthened responsive checks, E2E fence, 192 docs links and diff check.
Web/iOS/Android export results and final-SHA CI are recorded in PR #67.
Native devices, exact desktop parity and blur background/resume remain unverified.

## 2026-10-25 — Dock Search simplification

**Implemented (local checks passed).** Founder
returned Search to the original 24px outline. Latest selection clarification:
inactive 1.3px, selected/pressed 2.5px; Add uses the same 2.5px while pressed
and 1.6px at rest (`DEC-147`, revises `DEC-146`). Removed masks, cutout/per-part rendering and previous 2.6/3.6px trials. The shared
`stroke.iconActive` is now 2.5px for selected Search and pressed Search/Add. Home/Profile retain
selected fill; routes/accessibility are unchanged. Owner dock E2E again compares
Search/Add strokes across selection, reload and Back/Forward. Six Chromium/WebKit
E2E, 1051 mobile unit tests, typecheck/lint, web build, docs links and diff checks
passed. Physical devices not checked.

## 2026-10-25 — Dock Search outline revision

**Implemented (local browser verification passed).** Founder revision: `FloatingDock` fills only
active Home/Profile. Search keeps its original 24px outline: selected/pressed 2.5px like pressed Add, inactive 1.3px; existing navigation state is preserved.
Source: working-copy Figma `7272:2707`, dock Search `7272:2790`. Owner E2E checks
compare Search/Add physical strokes through navigation, reload and Back/Forward.
Passed: six Chromium/WebKit dock E2E, 1051 mobile unit tests, typecheck/lint,
web build, docs links and diff checks. Physical devices not checked.

## 2026-10-25 — Filled active dock icons

**Implemented (local browser verification passed).** `FloatingDock` passes its
existing selected state to `FigmaIcon` for filled Home/Profile glyphs; Search
was subsequently revised to retain its outline (see entry above).
No route/API/auth/permission or navigation-state changes. Passed: 1051 mobile
unit tests, six Chromium/WebKit dock E2E, typecheck/lint and web build. Older dock
fixtures were checked against `8318f956`: direct login now hides the dock and
Home/footer have separate brand links; test routes/selectors were corrected
without weakening geometry, blur or focus assertions. Native devices not checked.

## 2026-10-25 — Explore acceptance refinements

**Implemented (local browser verification passed).** `FigmaTabs` moves one selection fill with
Reanimated and reduced motion; `FigmaIcon` owns constant physical 1.3/1.6px strokes
and the full Back arrow. Explore panes use the Figma empty-search state via
`SearchPaneStatus`/`PageState`; viewport content keeps the footer below the first
screen and active filters remain accessible. No API/schema/route changes.
Passed: 1051 mobile unit tests, 36 Chromium/WebKit E2E, typecheck/lint,
web/iOS/Android exports, 191 docs links and diff checks. Physical native
keyboard/Back/motion and exact desktop parity remain unverified.

## 2026-10-25 — Final cover glass

**Implemented for verified web states; native device acceptance Needs verification.**
`CoverFrost.web`, `cover-frost-style` and
shared blur tokens replace the 2026-10-24 blur60 experiment with approved
Dock-style Blur16/saturate115%/Mask35 for work/author bottoms, retaining the
independent scrim, content-driven panels and sharp controls. `AuthorCoverCard`
top stays a gradient. Unused image props/spec fields were removed. Relative to
PR #66 release base `bfab5198`, Native replaces the second `Image blurRadius=30`
with one original image in `BlurTargetView` and a lower `BlurView` intensity60.
The migration is part of this PR; the earlier comparison used intermediate
`66575248`. Its missing theme mock export was introduced and fixed within the
PR; the release-base theme test passes8/8.
Owner style/browser regressions updated;1049 mobile tests, contracts48/client51,
Chromium/WebKit E2E2/2,12 real catalog/viewport checks, lint/typecheck and
web/iOS/Android exports passed. Acceptance.
Review rerun:38 relevant unit tests passed; Verify/GitGuardian are green on
runtime SHA `85ac01e0` (not a result for later documentation commits).
No API, media pipeline, Dock or compact format changes; physical iOS/Android,
phone catalog smoothness and exact desktop Figma parity remain open.
2026-10-25 review follow-up: **Needs verification** for device load/replacement,
scroll/details return and background/resume (installed expo-blur 57.0.3;
upstream #51845/#51848). Device tooling is unavailable on this host. The
acceptance owner records the original
Blur-to-MVP then Explore synchronization procedure; normal merge `87a2ab68` now
executes it and preserves both token sets.
No dependency patch, Explore edit, merge or Native risk acceptance is recorded.
Verify/GitGuardian also passed on pre-follow-up documentation SHA `6633a3cd`.

## 2026-10-24 — Mobile moderation UI

**Partial (final verification pending).** `AdminModerationScreen` uses opt-in
summary cards; protected detail routes share gallery, vertical comparison,
history and captured-target decisions. Existing Users/catalog actions remain.
Admin dock separates `/admin`, `/analytics`, `/account`; ordinary dock unchanged.
Mobile source/UX review fixes and local checks are in the UI audit.
No role/migration/deploy. Hardware/exact desktop parity remain unverified.

## 2026-10-24 — Moderation filter contract clarification

**Implemented (local verification passed).** `adminQueueQuerySchema` now describes existing overlapping
filters: `APPROVED` selects the parent; review filters select editing revisions.
Extended seller/Work summary integration assertions cover approved parents with
pending edits. No selection logic, authorization, DTO fields or UI taxonomy changed.
17 owner HTTP/PostgreSQL tests, 47 contracts tests, contracts/API typecheck, API
lint/build with dependencies, docs links and diff checks passed. Independent
review has no substantial open findings; remote CI is recorded in PR #62.

## 2026-10-23 — Admin foundation

**Implemented (local verification passed).** Protected summary/detail/history API in
`AdminController`/`AdminModerationService`, revision submission cursor with unknown
time, separate snapshots, additive audit metadata and restore generations.
Seller restore, replay and media completion/deletion ownership corrected in the
existing lifecycle. Owner integration specs cover three restore cycles, outage,
lease takeover, UTC/history and private preview. Full `pnpm verify` passed;
follow-up API checks passed after the final inline-history correction.
No production migration/deploy.
Scope, compatibility and verification.

## 2026-10-24 — Analytics review corrections

**Partial (local verification passed; production prerequisites remain).** `publicAnalyticsPage` now follows canonical `/seller/[slug]`
and excludes its redirect alias. `WebAnalyticsCollector` preserves delivery without
Web Locks using one in-tab queue; simultaneous cold tabs can establish separate
browser identities. Extended owner units and navigation browser checks cover both
modes: 1036 mobile unit tests and eight Chromium/WebKit scenarios passed, as did
typecheck, lint, web build and docs links. Independent review has no substantial
open findings; remote CI is recorded in PR #63. No production enablement.

## 2026-10-23 — Analytics foundation

**Partial (local verification passed; production prerequisites remain).** Additive version 2 web ingestion in
AnalyticsService/AnalyticsProvider, signed browser proof, database dedupe/shared
inactivity sessions, three registration creation boundaries and protected
`/api/admin/analytics/foundation` with UTC/cohort/first-publication metrics.
Existing collection/dashboard remain legacy; new flags default off. Additive
migration only; no production enabling, policy publication or consent UI.
Full workspace verify, Cloudflare checks and Chromium/WebKit opt-in/off scenarios
passed; independent review has no remaining substantial findings.
[Definitions](analytics-metrics.md), scope/checks.

## 2026-10-23 — Оптимизация документации

**Implemented (docs only).** Сокращены `AGENTS.md`, карта чтения и product index;
текущие design/project/release сводки отделены от полных исторических журналов.
Убраны устаревшие execution-промпты с восстановлением из Git; DEC, security,
legal, raw research и evidence сохранены. Изменений API/UI/БД/deploy нет.
Измерения, список удалений и проверки — cleanup report.

## 2026-10-23 — Фото в объединённом MVP

**Partial (local verification passed).** SOURCE — приватный нормализованный
мастер до 5 МиБ (портрет до 2 МиБ); галерея принимает до 25 МиБ/8192 px/50M,
мастер до 4096 px; JPEG/PNG/WebP, EXIF-поворот, compact 16-bit PNG,
удаление metadata из публичных производных. Сохраняются partial success,
abort/timeout/idempotency и совместимость p1/p2.

До выпуска API обязательны миграции `20261022120000_normalized_media_source`
и `20261022180000_legacy_image_upload_identity`. Production migrations/deploy
не выполнены этим проходом. Результаты объединённого дерева: `pnpm verify`
(479 API unit, 1023 mobile, 159 integration, 28 прежних skips, web/iOS/Android
exports), 6 media E2E Chromium/WebKit и production web build прошли по записи
PR #59. CI точного merge SHA в этой документационной задаче не перепроверялся.

## 2026-10-23 — Portfolio design

**Browser-verified; native/live acceptance remains Partial.** `ProductDraftImagesStep`
использует адаптивные media tiles и bottomAction; автор — пять визуальных шагов
без изменения numeric URL/API стадий, с сохранением фото и сверкой после потерянного
ответа create. Общие CoverFrost, icon-button surface и creation chrome обновлены;
существующий footer проверен на нужных routes. Backend/API/media lifecycle не менялись.
Проверки, независимые ревью, Figma mapping и ограничения —
portfolio audit.

## История и обновление

- Полный журнал 20–23 октября.
- Журнал до 19 октября.

После изменения поведения обновить нужную строку и добавить одну короткую запись
со статусом, owner-модулями и фактически выполненными проверками. Детали приёмки
оставлять по ссылке в owner audit; не копировать его целиком сюда.


## 2026-10-23 — PR #58: auth + фото на актуальной MVP

**Partial (local verification passed; production gates remain).** База `7d0dc179`
объединена с auth `2e6fc2d1` в `feature/web-auth`. Сохранены SessionService,
EmailProofService/AuthAbuseService, normalized SOURCE/ImageProcessor, upload API
и новые auth/media migrations. Upgrade с MVP проверен с сохранением пользователя
и SOURCE; существующие security/media owners прошли полный `pnpm verify`; 32/32
Chromium/WebKit auth/media browser checks прошли. E2E API-транспорт получил
обязательные Origin/CSRF headers без изменения assertions/timeouts.
CI startup Expo воспроизвёл ошибку React Native из-за `NODE_ENV=test`:
только dev server получает development-окружение; workflow очищает группы
Expo/Vitest/Playwright при завершении и показывает Expo log при сбое.
Auth DEC-133–135 не перекрывают фото DEC-131/132. DEC-136 фиксирует синхронный
SMTP и открытый request timing; verify оценивается отдельно.

Проверки, измерения, причины выбора SMTP и оставшиеся gates.
Ready — только после полного зелёного CI итогового SHA; merge/deploy не выполняются.

## 2026-10-23 — PR #58: SMTP rejection/replay

**Partial (release gates remain).** `EmailProofService` воспроизводил ложный
успех replay после SMTP rejection и раздельную запись outcome/очистки кода.
Исправление связывает replay с ledger операции, атомарно снимает код/cooldown
только её активного ключа, сохраняет расход трёх flow attempts и общие квоты.
`AuthFlowService` читает согласованный email state; `OnboardingForm` обновляет
rejected state и меняет ключ без reload, сохраняя ключ при неопределённом сбое.
HTTP owner покрывает delayed SMTP, поздние outcomes, rollback и потерю commit
acknowledgement; client submit owner — три класса отказа. Результаты итогового
SHA и CI — [PR #58](https://github.com/yayauheny/bidplace/pull/58) и
отчёт.
DEC-136 и production gates сохраняются; merge/deploy не выполняются.


## 2026-10-23 — Сохранение незавершённого upload retry

**Implemented (client guard).** `useProductDraftImageActions` не открывает новый
picker, пока сохранена незавершённая пачка; `ProductDraftImagesStep` блокирует
Add до её завершения либо явной отмены остатка. Отмена не удаляет сохранённые
фотографии. Retry сохраняет Blob/ключ и не повторяет успешные файлы;
существующие lifecycle unit/media browser owners проверяют блокировку и повторное
разрешение выбора. Интро автора приглашает создать portfolio без обещания продаж.
Backend/API/media contract не изменены; детали проверок —
portfolio audit.


## 2026-10-23 — Завершение галереи перед продолжением

**Implemented (client flow guard).** `canOpenProductWizardStep` и
`useProductDraftNavigation` блокируют последующие шаги при незавершённой upload
очереди. Continue/step selector используют то же правило; после retry/cancel
переход разрешён. Lifecycle/media browser owners проверяют ошибку, retry и отмену;
серверный контракт и возможность сохранить частичный draft не менялись.

## 2026-10-24 — Mobile analytics UI

**Partial (local API/mobile/adaptive acceptance and builds passed; CI/hardware pending).**
`AdminAnalyticsScreen` replaces legacy overview consumption with the protected
foundation API: browsers/sessions/views/all registrations, proven 30-day cohort,
first-publication growth and current moderation. Existing read contract accepts
opt-in activity fields; no persistence/dependency changes. Server collection
permission and client build collector are distinct; unknown history/coverage and
immature/empty cohorts stay explicit. PostgreSQL19 owner tests, period11 and client49
pass. Mobile screenshots/review and final checks: audit.

Analytics UI accessibility follow-up: labelled period/metric panels and
keyboard/DOM associations use the existing public-screen pattern; no API change.

## 2026-10-24 — Analytics day selection review

**Partial (local browser/typecheck/lint passed; hardware/production remain open).**
`AdminAnalyticsGrowth` replaces up to 90 inline day tabs with one existing
`FigmaSelectField` and compact searchable `FilterSheet`. `FilterOptionRow` adds
opt-in radio navigation; the group preserves ordering, one Tab entry and focus
return. Independent source review found no remaining actionable issues.
No API, service, table, migration or dependency changes in this correction.
Checks and evidence: analytics audit.

Moderation UI accessibility follow-up: labelled detail tabpanel and queue selection
toolbars replace dangling references; web keyboard/DOM acceptance4/4 passes. Native
selected-state branches are covered by owner units; physical screen reader remains
Needs verification.

## 2026-10-24 — Moderation UI review follow-up

**Partial (checks in progress).** `AdminModerationDetail` returns through existing
navigation after a decision, preserving a mounted queue/search/filter/scroll
instead of querying an unrelated default next item. Existing PUBLISH
PENDING/RUNNING metadata blocks further revision decisions and exposes status
refresh; FAILED retry and parent restoration keep their existing server rules.
No API, persistence or permission changes. Owner19 tests and independent source
review passed; browser/CI results are recorded in PR #64.

## 2026-10-25 — Unified Explore

**Partial / Needs verification.** `apps/mobile/src/features/explore` owns one
canonical route, URL codec, navigation-entry drafts/scroll, inline Reanimated
header and three panes reusing `usePortfolioWorks`, `usePortfolioAuthors` and
`categoryKeys.all`. Works/Authors/Search aliases and Dock/Home/Desktop/footer
are migrated; old overlay/provider/surfaces and standalone catalogs removed.
No backend/API/auth/media changes. Owner regressions cover X/filter separation,
section drafts, reload/Back/Forward, pagination/retry and result-tree identity.
Verified:1047 mobile unit tests, typecheck/lint,70 Chromium/WebKit E2E +8 geometry checks, Web/iOS/Android exports, fence and docs links. PR44 reconciliation and remaining device/design gaps:
Explore report.

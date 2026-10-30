# bidplace — архитектура кода

Последнее обновление: 2026-10-30
Статус: Confirmed technical boundaries for the portfolio-first MVP implementation.

## 2026-10-31 — Work deletion

`DELETE /api/products/:id` takes the Product row lock, checks ownership without requiring a verified email or an approved seller, and uses `deleteProduct` in `product-publication.ts` to set `deletedAt` after the open-sale guard. Curator removal, audit and media revoke enqueue share the transaction; retained Product, revision, order and image rows are not cascaded. Active reads and late product writers reject tombstones. Order summaries expose `coverImageUrl` from the existing snapshot; after deletion `ImagesService.get` serves its private preview only to a buyer or seller on an order referencing that exact image. Public derivatives are revoked asynchronously through the existing lifecycle. Edge JSON may remain cached for 30 seconds on works/authors and 60 seconds on home/facets.

An author restore excludes deleted works when building its media manifest. A previously queued restore rechecks each Work asset under the related Product row locks before a PUBLIC write; it skips assets with no eligible published Work. Second-chance offers reject deleted works and correcting a retained fixed-price order does not relist one.

## 2026-10-30 — Order reports

`ReportsController` and `ReportsService` (`apps/api/src/commerce/`) own `POST /api/orders/:publicId/reports`, `GET /api/admin/reports`, and `POST /api/admin/reports/:id/resolve`. Create and resolve are one Read Committed transaction: product lock, `AntifraudService.lockUsers`, then `dbNow(tx)`. Only an order buyer or seller can create a report; anyone else is 404. `ACTIVE` is always in the window. `COMPLETED` and `FAILED` are allowed through `closedAt + reportWindowDays` (14). The duplicate open report is a `findFirst` under that lock, not a unique-violation catch. The other party is queued `ORDER_REPORTED` with `reportId` and without the report text. Resolve requires `adminNote`. `OrdersService.assertActiveAdmin` runs inside the transaction. The status write is `updateMany` where `status = OPEN` and `count === 1`. When that matches and `orderAction` is set, `commitOutcomeInTransaction` applies the admin transition, letters, and `ORDER_OUTCOME` audit in the same transaction. The same decision is 200 and does not write again. A different decision is 409. The report audit is `REPORT_RESOLVE` with reason `{publicId}: {adminNote}` and `newStatus` `{status}:{fault}|{orderAction}`. Create and resolve responses use `reportSchema`. `GET /api/admin/reports` uses `adminReportSchema` (`orderPublicId`, reporter, buyer and seller ids, `adminNote`) and carries no contacts. `@RateLimit` on create is 5 per user per hour (`commerce:report`). `getTrustSignals` still owns strike freeze and upheld author-fault counts.

## 2026-10-30 — Commerce tick

`CommerceTickService` (`apps/api/src/commerce/commerce-tick.ts`) registers four `TickService` jobs: `commerce.activate`, `commerce.close`, `commerce.offers`, `commerce.reminders`. A run selects at most 50 due rows with `clock_timestamp()`, then one Read Committed transaction per row. The transaction locks the product, locks the affected users through `AntifraudService.lockUsers` when it changes user state, then reads `dbNow(tx)`. Status and reminder writes are conditional (`count === 1`); a miss returns without a second letter or order. Activate sets due `SCHEDULED` listings to `LIVE`. Close ends a `LIVE` auction only when `effectiveListingState` is `AWAITING_CLOSE`, then calls `createOrder` (`AUCTION_WIN`, `ACTIVE`) for `rankBidders(...)[0]`, the highest non-voided bid. Close does not skip a held or strike-blocked leader. Voided bids never enter that ranking. No non-voided bid still ends the listing and queues `AUCTION_ENDED_NO_BIDS`. `offerNext` still skips purchase-blocked bidders (COMMERCE §4.5). `OrdersService.expireOffered` is the offer-expiry writer: system `OFFER_EXPIRED` through `assertOrderTransition` with `card: false`, so the tick does not build the order card; `failedBy = system`, `ORDER_FAILED` to both parties with `failedAt`. A lost race is not a tick failure. Reminders do not lock users. They send `CONFIRM_DEAL_REMINDER` `slot` `24h` at `sellerRemindersSent = 0` when only 24h is due, and `48h` at `1`. When `sellerRemindersSent` is 0 and 48h is already due, one letter uses `slot` `48h` and the counter becomes 2. Nothing here fails an `ACTIVE` order. The 72-hour admin attention list stays a query. A thrown record is logged and skipped; after the batch the job throws one error with the failure count. `TickService` logs that error name and message, marks the job failed, and skips the heartbeat.

## 2026-10-30 — Order lifecycle

`OrdersController` exposes the order card, list, accept, decline, complete, fail, note, and offer-next routes, plus admin void-strike and outcome. A viewer who is not the buyer, the seller, or an active admin gets 404. A `dealCode` query or a public id that is not 11 url-safe characters is 404 before the lookup. The card is `Cache-Control: private, no-store`. Contacts are returned only when `activatedAt` is set, except an active admin always sees them. Buyer contacts then go to the seller and admin. Seller contacts then go to the admin, and to the buyer only when `showContactsToBuyer` is not false; otherwise the buyer gets `sellerContactHint` and `sellerContacts: null`. The seller note is null for the buyer. `sellerContactHint` is a required key and is null when the contacts are shown. `GET /api/me/orders` returns `orderSummarySchema` rows and no contacts.

`commitOutcome` is the status-write owner. It locks the product, then the parties (and the actor) through `AntifraudService.lockUsers`, then reads `dbNow(tx)`. `assertOrderTransition` decides the status change. The service still checks the 3-reservation cap and buyer contacts through `assertCanAct` on accept, and requires `confirm: true` before a buyer `BUYER_REFUSED`. Admin outcome requires a reason. The status `updateMany` is conditional on the current status (`count === 1`). A failed `FIXED_PURCHASE` whose listing is still fixed and `ENDED` calls `restoreFixedPriceListing`. Completing one while that listing is `LIVE` ends it. `FAILED` queues `ORDER_FAILED` for the counterparty, or both parties when the actor is admin or system. `COMPLETED` queues `DEAL_COMPLETED` for both, with the deal code and names and without contacts. An admin actor writes `audit_events` `ORDER_OUTCOME` in the same transaction. The audit reason is `{publicId}: {reason}` because `AuditEvent` has no public id column. `failFixedPriceReservation` calls this path with no principal, so an admin actor there stores a null `actorUserId`.

`offerNext` is seller-only on an ended auction that already has a buyer-fault failure. Inside the product-row lock it calls `assertApprovedSeller` and `assertWorkCanTakeNextOffer`: a `COMPLETED` order on the work is `PRODUCT_ALREADY_SOLD`, and a `SCHEDULED` or `LIVE` listing is `PRODUCT_IN_SALE`. It creates the next order only through `createOrder` (`SECOND_CHANCE`, `OFFERED`, `offerExpiresAt` = `dbNow` plus `contactWindowHours`). At most two such offers. A blocked or voided candidate is skipped. A full cap returns `NO_NEXT_BIDDER` even when the latest offer is still `OFFERED`. An open offer below the cap returns `ORDER_TRANSITION_NOT_ALLOWED`. Admin `FAILED` → `COMPLETED` also refuses with `PRODUCT_IN_SALE` while a scheduled or live listing exists.

`PUT /api/me/contacts` is `ContactsController`. Freshness uses the process clock against `session.principal.authenticatedAt` (five minutes), the same clock as login linking, not `dbNow`. The write locks the user, updates only the sent fields, and queues `CONTACTS_CHANGED` with a new `eventId`. `showToBuyer` updates `seller_profiles.show_contacts_to_buyer` and is refused when the user has no seller profile.

Buyer strikes stay in antifraud. `orders.failed_by` (`buyer|seller|admin|system`, migration `20261030190000_order_failed_by`) records who marked the failure. `isActiveBuyerStrike` counts the buyer's own refusal immediately. A seller mark, including `BUYER_REFUSED`, waits `COMMERCE_LIMITS.strikeDelayHours` and stays inactive while the buyer's `OPEN` report on that order exists. A null marker keeps the older split so rows written before this column still match. `POST /api/admin/orders/:publicId/void-strike` sets `strikeVoidedAt` and writes `ORDER_VOID_STRIKE`. `POST /api/admin/users/:id/ban` calls `AntifraudService.banUser`. `GET /api/admin/users/:id` adds `getTrustSignals` counts (completed orders, active strikes, seller-fault failures, upheld reports, `memberSince`, `emailVerified`) and no contacts. User status remains `active|banned`. Nothing in this path closes an `ACTIVE` order by time. System `OFFER_EXPIRED` is `OrdersService.expireOffered`, called by the commerce tick.

## 2026-10-30 — Fixed-price purchase

`OrdersService` (`apps/api/src/commerce/orders.service.ts`) is the only order insert. `createOrder` allocates `publicId` (`PublicIdService.generate`, 11 characters `[A-Za-z0-9_-]`), a 6-digit `dealCode` from `crypto.randomInt`, snapshots, and deadlines from the caller’s `now`. `ACTIVE` sets `activatedAt` and `contactDeadlineAt` (`now` plus `contactWindowHours`); `OFFERED` sets `offerExpiresAt` and leaves those null. Letters in that same transaction: `FIXED_PURCHASE`+`ACTIVE` queues `PURCHASED` and `LISTING_SOLD`; `AUCTION_WIN`+`ACTIVE` queues `BID_WON` and `AUCTION_ENDED`; `SECOND_CHANCE`+`OFFERED` queues `OFFER_RECEIVED` for the buyer. The payload discriminator is `orderPublicId`. It does not include the deal code or contacts.

`POST /api/listings/:id/purchase` is one Read Committed transaction: product row lock, buyer via `AntifraudService.lockUsers`, then `dbNow(tx)`. Idempotency is a pre-check on `(listingId, buyerUserId, idempotencyKey)` under that lock. The amount is the listing price. `canPurchaseFixed` requires a live fixed-price listing. `assertBuyerEligible` uses action `purchase`. The author must still be `APPROVED`. The listing update is `updateMany` to `ENDED` with `count === 1`. A unique violation on `one_open_order_per_product` is `LISTING_NOT_OPEN` after the transaction rolls back. The public mark is `RESERVED`. `SOLD` stays `COMPLETED`. Turnstile is checked on every purchase. `AntifraudService.recordPurchaseSignals` records a failed or missing Turnstile result and a shared browser with the seller, using the same helper as `recordBidSignals`. Idempotency-key and comment shape stay on `purchaseRequestSchema`. An order public id that is not 11 url-safe characters throws.

`orders.idempotency_key` is nullable `VARCHAR(80)`, unique with listing and buyer (`20261030180000_order_purchase_idempotency`). PostgreSQL treats null keys as distinct, so auction orders omit the key. Author cancel of an `ENDED` listing is `canAuthorCancel` and returns 409 without a write. `failFixedPriceReservation` delegates to `commitOutcome`, which restores a fixed listing that is still `ENDED` and queues `ORDER_FAILED`.

## 2026-10-30 — Bids

`BidsService` places bids on `POST /api/listings/:id/bids` and lists them on `GET /api/listings/:id/bids`. Both are `Cache-Control: no-store`. The write is one Read Committed transaction. It locks the product row, then the bidder with `AntifraudService.lockUsers`, then reads `dbNow(tx)`. Idempotency is a pre-check under those locks: the same key and amount returns the stored bid, including a voided one, and a freshly read lot; a different amount throws `IDEMPOTENCY_KEY_REUSED` without relying on a unique-violation catch. Amounts above `COMMERCE_LIMITS.maxAmountMinor` or not a multiple of the currency's smallest step (`minimumStepUnitMinor`) are `BID_AMOUNT_INVALID`. A bid at or after `endsAt` is `LISTING_NOT_OPEN` even while `status` is still `LIVE`. Soft close and `createdAt` use that same `dbNow`. `OUTBID` carries `bidId`. History numbers every bidder by first bid, including voided bids, and returns the latest 20 non-voided rows as `Участник N`.

`assertCanAct` (`bid`, `purchase`, `accept-offer`) still checks status, hold, and email, then a non-empty deal contact (`BUYER_CONTACTS_REQUIRED`), active buyer strikes (`BUYER_BLOCKED` at 2), and reservations (`BUYER_ORDER_LIMIT` at 3). A reservation is an `ACTIVE` order or a `SCHEDULED`/`LIVE` auction whose highest non-voided bid is that user. `describeBuyer` does not apply those three, so a public lot can show `blockedReason: null` for a buyer the next bid will refuse. `AntifraudService.recordBidSignals` runs after the bid insert. A failed or missing Turnstile token on the first bid of a session records `TURNSTILE_FAILED` and the bid still commits.

`AntifraudService.onBan` runs inside the ban transaction. The ban runs ReadCommitted with row locks: product rows first, then the admin and user rows, so the void sees bids committed while it waited for the user lock. Phase 1 locks the products of running auctions where the user has a live bid, sorted. The ban then locks the admin and the user and updates status. Phase 2 voids those bids and recomputes `currentPriceMinor`, the leader, and `bidCount`. A product found only in phase 2 throws `RetryableTransactionConflict` and the transaction reruns. After three attempts that conflict is `conflict` (409). Ended auctions are left alone. Antifraud does not import commerce. Publication delivery still reads `user.status` in its own transaction: `switchPublication` refuses a profile whose user is not `active`, and `publishRevision` does the same for a work.

## 2026-10-30 — Listings

`CommerceModule` (`apps/api/src/commerce/`) is on the API boot graph. It owns listing create, author cancel, admin remove and `GET /api/works/:publicId/lot`. It does not import `ProductsService`. Deal time is `dbNow(tx)` in `apps/api/src/core/time/db-now.ts`: `SELECT clock_timestamp()` inside the caller transaction, after `lockProductRowForUpdate`. `Clock` is not deal time. Author cancel uses `authorCancelWhere` and `updateMany` (`count === 1`). Admin remove writes `audit_events` in that same transaction and, for an auction, enqueues `LISTING_REMOVED` with `listingId` (and optional `workTitle`) for the seller and each non-voided bidder. A product is in sale in `product-write-guard.ts` when it has a `SCHEDULED` or `LIVE` listing or an `OFFERED` or `ACTIVE` order. Portfolio work JSON stays free of listing fields. `/lot` is `Cache-Control: no-store` and does not lock the viewer row. `assertBuyerEligible` locks that user before the same flags. The worker's 30s public cache matches `/api/works` and `/api/authors` only, so `/api/works/:id/lot` is not cached. Bid placement and bid history are the Bids section. Fixed-price purchase is the section above. Order card, fail, and complete HTTP are not on the boot graph. The pre-W3 commerce application remains archived at `feature/commerce-runtime-archive` @ `19eb40e`.

## 2026-10-30 — Notification outbox

`apps/api/src/notifications/` is on the API boot graph and owns transactional mail. `enqueueNotification` inserts `notification_outbox` inside the caller transaction and does not call `MailTransport`. The row id is a SHA-256 of the user, kind, and canonical payload. A repeat is `INSERT ... ON CONFLICT (id) DO NOTHING` and does not catch a unique violation, so the caller transaction stays open. That id is permanent for the same payload, so a kind that can fire again must carry a discriminator: `CONFIRM_DEAL_REMINDER.slot` is `24h` or `48h`, `OUTBID` requires `bidId`, `ORDER_REPORTED` requires `reportId`, `CONTACTS_CHANGED` requires `eventId`, and `LISTING_REMOVED` requires `listingId`. Enqueue rejects any other key for that kind. `NotificationDeliveryService` registers tick job `notifications.send`. One run first marks due `PENDING` rows with `attempt_count >= 10` as `FAILED`, then claims at most 20 due rows whose user has `emailVerifiedAt` and `attempt_count < 10`, with `FOR UPDATE SKIP LOCKED`. The claim sets `attempt_count = attempt_count + 1` and leases `next_attempt_at` before the send. Each send is bounded to 10 seconds. Delivery is at-least-once: a crash or timeout after SMTP has already accepted the message can send it again. Unknown transport failures use a bounded backoff through attempt 10; `classifyMailFailure` `rejected` (SMTP 400–599 or a recipient that is not a single address) becomes `FAILED` immediately. Failure logs contain the outbox id and kind only. `GET/PUT /api/me/notification-settings` reads and upserts `outbid_email`. `POST /api/admin/notifications/retry-failed` is admin-only and, in one transaction, returns `FAILED` rows with `created_at` in the last 48 hours to `PENDING` (`attempt_count = 0`) and writes `audit_events` (`NOTIFICATION_RETRY`) only for rows that changed. There is no `failed_at`, so the window stays on `created_at`. `GET /api/admin/health` is admin-only: `TickService.lastSucceededAt()`, `cronConfigured` from optional `TICK_CRON`, live `listings`, failed outbox rows, and the oldest open report. The order link is `/account/orders/{publicId}` on `PASSWORD_RESET_URL_BASE` or the CORS origin. `AUCTION_ENDED` requires `listingId` and may include `orderPublicId`. Commerce tick jobs are the section above.

## 2026-10-30 — Commerce V2 persistence

Sales tables follow COMMERCE §10: `Listing` (`FIXED`|`AUCTION`, minor units, contact window), `AuctionRules.stepTableCode`, `Bid` (`voidedAt`, idempotency unique on listing + bidder + key), `Order`, `Report`, `UserNotificationSettings`, `NotificationOutbox` and `FavoriteWork`. Partial unique indexes and currency/contact-window checks are raw SQL in `20261030130000_commerce_v2`. Deal contacts are optional `users.contact_*` columns; `users.phone` remains. Pure sale rules live in `apps/api/src/commerce/auction-pricing.ts`, `listing-state.ts` and `order-state.ts`. `bidStepMinor` is exported from `packages/contracts/src/commerce.ts`. Listing HTTP is `CommerceModule` (see Listings above). Bid HTTP is the Bids section. Fixed-price purchase and `orders.idempotency_key` are the Fixed-price purchase section. Order card, fail, and complete HTTP are not on the boot graph.

## 2026-10-29 — Scheduler tick (W2, local implementation)

`apps/api/src/core/tick/TickService` is the single scheduling/recovery owner.
Domain modules register bounded jobs during module initialization; the global
`TickModule` starts one unreferenced 30-second timer after bootstrap and clears
it on shutdown. HTTP and the timer share process-local single-flight exclusion;
an overlapping invocation returns `skipped: true`. Jobs share one `now` and a
cooperative 20-second deadline. Later jobs stop at the deadline; an in-flight
I/O can overrun, and exclusion stays held until it settles. Failed jobs do not
stop subsequent jobs and log only the registered name.

The additive migration `20261029010000_system_heartbeats` creates the two-column
`system_heartbeats(name, at)` table. Only an unskipped, failure-free run completed
within budget upserts `tick` with PostgreSQL `now()`; `lastSucceededAt()` reads
that durable heartbeat. Apply the migration before starting this runtime.

The Worker scheduled handler calls the private `portfolio-api` Durable Object
with `POST /api/internal/tick` and `X-Internal-Tick`. Public `/api/internal/*`
requests receive 404 before the Container is called, and forwarded requests lose
any caller-supplied tick header. Nest independently requires `InternalTickGuard`.
`RELEASE_HOLD=closed` blocks scheduled forwarding without treating the deliberate
skip as a scheduled failure. Other non-success HTTP responses, malformed tick
results and failed jobs reject the scheduled promise with a fixed safe message;
response bodies and transport errors are not logged. `TICK_CRON` is deploy config:
empty disables Cron; final deployment explicitly clears any old schedule. While
awake, the timer runs without Cron; sleeping Containers have no schedule-driven
recovery until Cron is enabled or a visit wakes them. Cloudflare config/scripts
support only production and guard deployment to `main` (`DEC-102`).

Enabled `MediaLifecycleService` registers `media` and keeps its existing timers
as acceleration only. One batch executor selects up to eight operations and
sixteen abandoned STAGING assets, respecting the supplied deadline. It recovers
due REVOKE/CLEANUP and expired RUNNING PUBLISH below the retry ceiling through
the existing leases and publication CAS/active-author guards. PENDING/FAILED
PUBLISH and UPLOAD remain explicit/manual paths. Persisted operation failures
fail the job and prevent heartbeat success, including exhausted FAILED
REVOKE/CLEANUP at the retry ceiling; these require manual intervention and are
not automatically retried. The 30-second heartbeat continues while the Container
is awake, so this runtime does not let its database idle then. Existing leases also arbitrate
legacy-timer/direct-call overlap. The notification outbox job and
`GET /api/admin/health` are implemented. Commerce activate, close, offer expiry, and reminder jobs are implemented. The admin
health UI remains planned. Live scheduled execution is **Needs verification**; setup and
post-deploy checks belong to the [runbook](../ops/CLOUDFLARE-DEPLOYMENT.md).

## 2026-10-29 — Hidden Work delivery lock

Product PUBLIC delivery in `core/media/media-lifecycle.service.ts` takes the same
Product row lock as hide for one derivative at a time, checking current operation
lease/generation and visibility before external delivery. PRIVATE reads occur
before the lock. ARCHIVED nonrestore approval updates the revision pointer/audit
without PUBLIC writes or READY manifests; restore uses existing PRIVATE bytes.
A 60s total abort signal reaches S3 requests and body consumption; the I/O-bearing
transaction has a 65s timeout. This bounds the new per-object lock scope, with hide
waiting or failing under slow delivery rather than succeeding ahead of a late PUT.
The shared Product write guard bounds row-lock waits to 4s, below the default 5s
request transaction timeout, maps only PostgreSQL `55P03` through Prisma `P2010`
to `PRODUCT_STATE_CONFLICT` (409), and restores the prior transaction-local lock
timeout after acquisition. Required early read and canonical write locks remain;
archive sale checking belongs to the visibility owner, without a third caller lock.

Work and suspended profile restore commit a PUBLIC-only REVOKE journal before delivery, under the
PUBLISH row lock and current lease/token/generation check. Its identity binds the
source operation/generation; revision timestamp disambiguates later restore
cycles. FAILED retries rearm that journal. Only its corresponding FAILED restore
on an ARCHIVED Product or SUSPENDED profile is exempt from PUBLIC deletion blocking; active RUNNING,
PRIVATE/CLEANUP and public-reference guards remain. Existing recovery handles
partial writes and expired RUNNING restore attempts without automatically retrying
ordinary FAILED/PENDING publications. Compensation permits brief exposure before
cleanup/purge; strict privacy atomicity and live R2/CDN acceptance remain open.
R2 has no provider fencing here: correctness still relies on bounded delivery
finishing before the longer operation/object lease; a process paused beyond its
lease remains a live-verification limit.

## 2026-10-26 — Photo workflow (DEC-148)

`product-draft-image-actions.ts` owns selection, sequential preparation/upload,
addressed retry and confirmed server order. Client byte-deduplication was removed
by `DEC-151`; the server retains operation identity and input checksums.
`chooseImages()` now adds local cards; `startUpload()` is explicit. Save remains
before picker; `persistDirtyForm()` waits for active saves and current React Hook
Form dirtiness before delayed upload without duplicating the form state model.
Session/operation/product guards retire late work. Composition is locked during
active batches and order writes; closing retains the per-user/Work React Query
session. Logout removes private queries and generated resources. Picker files
are never deleted. Recovery lasts for this process/tab only; uncertain writes
are reconciled by operation identity rather than array position.

`photo-editor.tsx` reuses FormPageShell, FigmaTabs and shared controls.
`PhotoCropSurface.web.tsx` uses react-advanced-cropper 0.20.1; Native uses
react-native-zoom-toolkit 5.1.1 CropZoom and existing gesture/reanimated owners.
`photo-edit.ts` applies confirmed flips/quarter-turns once from the retained
opening source. Work crop remains normalized metadata over the full transformed
file; crop-only never reencodes/uploads bytes. Avatar crop produces pixels before
the existing 1600px/2 MiB preparation policy. Reset restores the editor opening,
cancel leaves confirmed state unchanged. Generated object URLs/cache files have
explicit disposal. Native runtime, HEIC and hardware gestures need verification.

`ProductRevisionImage` owns unique `slotId`, optimistic `version` and nullable
validated `crop`; revision fork copies crop but creates new slots. Physical
ProductImage changes on replacement; slot/position persist. Published revision
references keep their original files/crop. `MediaOperation.photoResult` is an
immutable replay ledger, populated conditionally for older keyed uploads.
`ImagesService.editPhoto` stages outside the transaction, then locks Product and
rechecks owner/revision/version before switching; rollback queues staged cleanup.
Cleanup retires an unreferenced asset under its row lock before external deletion;
attach only accepts STAGING/READY. Legacy nontransactional storage rejects replace.

API: owner GET `products/:id/image-operations/:key`, PATCH (crop JSON) / POST
(multipart replacement) `products/:id/photos/:slotId`; request carries revision,
version and operation key. Upload negotiates slot results with `X-Photo-Response:
slots`; old clients retain `{ok:true}`. `X-Photo-Revision` guards add; optional
revision guards also cover reorder/delete. `images/:id?source=true` is owner/admin
only and no-store; legacy files may have only normalized preview bytes. Public
cards use CroppedPhoto; fullscreen continues to use full media.
Migration: `20261026160000_work_photo_slots` (slot/version/crop, bounds CHECK,
operation result). Apply migration and deploy API/client together: new image
metadata extends strict product contracts; upload-response negotiation alone does
not make older product clients compatible. No new service or background infrastructure.

Prototype selection: advanced-cropper supports resizable frame, pan/zoom, rotate,
flip and keyboard; react-image-crop lacks pan/zoom and easy-crop lacks the required
resizable frame. Native CropZoom embeds the approved screen; a modal-only native
cropper would replace it. Chromium/WebKit isolated prototype checked transform,
reset/cancel, crop output and PNG transparency. Device calibration remains open.

Client refinement 2026-10-28 (`DEC-151`): gallery after `preparePhotoEdit` and
story selection both call `prepareImageUpload` with `WORK_PHOTO_PREPARE`
(3840px / 10 MiB / 25 MiB source / quality0.85, PNG retained). Crops and avatar
policy keep their existing owners. `WorkPhotoCard` retains the local preview until
remote decode; URI callbacks and disposal remain session-scoped.
`useProductStoryEditor` separates saving from uploading: text stays editable
during upload, composition actions wait, and save still blocks mutations.
Editable alt retains spaces; serialization trims it or produces null.
Before story PUT, an uncertain upload is reconciled once via the internal keyed
upload (`8a5de85a`). Public `addImage` still refuses a user transition lock;
save calls that same upload without the lock because the save owns it. Pending
selection is dirty at staging, so Continue, close and submit do not skip the
save. Replay failure prevents PUT and keeps text/file/key; identity and owner
guards are checked again after waiting. This prevents cleanup of an unseen
accepted upload during a text-only save. Story upload also sends
`X-Photo-Revision` (`8a6e3620`). The client captures the editing revision with
the pending file. `ImagesService.addStoryImage` rejects a missing or different
revision before staging and again after the Product lock; the operation row
stores that revision atomically when the upload operation is created, before
object writes, without putting it in the idempotency hash. Failed staging keeps
the binding; existing unbound operations are bound conditionally before writes. A replay for
another revision is 409 and does not create a hold. The same revision can still
replay a lost response, including at the five-photo limit. `story-local-draft.ts` owns mandatory-v2 serialization,
identity restore and recovery-only quarantine of old unscoped v2 copies;
v1/content merging and adoption from unscoped keys are removed. This quarantine
preserves the protected revision recovery regression without applying old text.

`replaceProductStory` releases only unused `STORY_IMAGE` holds of the editing
revision after writing blocks, under the existing Product lock and in the same
transaction as `MediaLifecycleService.enqueueCleanup`. Gallery holds and other
revisions are excluded; the client no longer issues post-save DELETEs.
`ImagesService` checks five-hold admission before staging and repeats it under
the Product lock; attached keyed uploads can replay at capacity. Cleanup retains
its existing reference/asset-lock checks. One story asset referenced by two
revisions stays `READY` with its bytes after the first revision releases its
hold (`080bc7c6`); cleanup code did not change. `prepareImageUpload` deletes an
encoding that is too large or cannot be read through `deleteGeneratedImage`
(`ec860de9`) and keeps the source file and the URI it returns. `tick`, claim and outstanding-work
selection exclude twenty-attempt operations; terminal failure preserves
`nextAttemptAt` and logs only operation id/kind once. No database migration.
Shared-byte lookup (`DEC-112`), story CDN and native acceptance remain open.

## 2026-10-05 — Cloudflare application deployment (Partial)

`deploy/cloudflare` owns the thin Worker routing `/api/*` to one private Nest
Container (existing Dockerfile, root build context, linux/amd64) and serving Expo
SPA Static Assets. The required `PortfolioApi` Durable Object is only a Container
adapter; auth/permissions and all database access remain in Nest. `DEC-098`
updates the hosting portion of `DEC-097`; public/private R2 boundaries are unchanged.

Anonymous JSON GET has an explicit allowlist and short cache TTL; Cookie/Bearer,
private/admin/mutation/error responses bypass storage. The Worker removes
untrusted proxy headers before forwarding Cloudflare's ingress IP to Nest.
Runtime vars/secrets are allowlisted into Container env; no secrets are embedded
in static assets/image. Existing media reconciliation is preserved and can issue
SQL while Container runs; natural Container sleep is not an automatic retry SLA.

Production-only config, deploy/image/migration scripts and CI gates are
prepared; the deploy branch guard requires `main` (`DEC-102`). Live domains,
secrets, Neon/R2 and cache behavior remain unverified.
The [deployment runbook](../ops/CLOUDFLARE-DEPLOYMENT.md) owns setup/configuration;
the [verification record](../audits/current/14-CLOUDFLARE-DEPLOYMENT-VERIFICATION.md)
owns exact results and blockers. Migration is a separate operator step, never cold start.

## 2026-10-04 — Media lifecycle boundary (Partial)

`core/media/MediaLifecycleService` owns additive `MediaAsset`, `MediaObject`,
`MediaOperation` and durable `MediaOperationObject` manifests. The existing Nest
process reconciles persisted operations without another worker or queue service.
Short DB transactions record intent/attach/switch; tiered S3 writes happen outside
transactions. Operations claim exact objects with renewable leases, so restore
cannot overlap an unfinished DELETE of the same object. SOURCE is private; new uploads store a normalized master up to 5 MiB
(2 MiB for author photos), while existing/imported sources retain their bytes; metadata-stripped WebP derivatives use immutable asset/pipeline
keys. Cloudflare purge is a separate `PublicMediaCache` boundary.

`S3_BUCKET` is private; `S3_PUBLIC_BUCKET` must differ. HTTPS
`MEDIA_PUBLIC_BASE_URL` is a custom-domain origin. `CLOUDFLARE_ZONE_ID` and
`CLOUDFLARE_CACHE_TOKEN` configure exact-URL purge; no secrets enter contracts.
Public objects use browser revalidation and a separate edge TTL. SOURCE uses
`pipelineVersion=source` as a non-null identity discriminator; derivatives use
`p2` for normalized uploads and `p1` for existing/imported objects. SQL constraints prevent public SOURCE and invalid dimensions.

`POST /api/products/:id/images` optionally accepts `Idempotency-Key` for one
image. Client selections retain one key per file across retries; server stage
scopes it by owner/purpose/Work and rejects checksum conflicts or attachment to
an earlier revision. Submit replay returns the existing pending revision;
completed approve replay requires its exact DONE journal identity. This is limited
to Work actions, without a global HTTP idempotency framework.

Owner Work detail shares the existing publication DTO. Owner/author/admin poll
only active delivery states and show waiting/errors. WorkGallery mounts PREVIEW;
the selected FULL is mounted only while its shared AppDialog viewer is open.
Public Work/Author queries and binary proxy authorization require an active
author user as well as existing publication/revision checks; privileged private
reads are never publicly cached.

`core/media/import-legacy-media.ts` attaches all five legacy owner types using
the existing lifecycle, checksum/length/type verification and CAS, preserving
Bytes. Its one-time CLI defaults to dry-run; apply requires maintenance and
verified public delivery before traffic resumes. Legacy ImageStore/read paths
remain until importer/cutover verification. The package is **Partial** until live
provider acceptance and release integration regression. The historical single-bucket
description below applies to legacy records, not the target production topology.
See [`11-PROJECT-STATUS.md`](11-PROJECT-STATUS.md) for remaining gates.

## 2026-10-24 — Protected moderation UI reads

`includeCard=true` adds optional bounded thumbnail identity, author and review-kind/
delivery metadata to summary items. Default strict response shapes stay unchanged.
The existing service reads ID page and narrow selectors in one RepeatableRead
transaction; no detail hydration per card. Media stays behind authenticated reads.
`AdminModerationScreen` owns queue route/query state; detail routes own preview/
comparison/history and captured-target decisions. `WorkGallery` accepts an optional
private renderer/thumbnails; existing public consumers retain their presentation.
`FormPageColumns` adaptive opt-in keeps the same children/state through resize.
Navigation is still FloatingDock/DesktopHeader/useAppNavigation, with independent
moderation/analytics access inputs and admin-only grants. Profile goes to account.

## 2026-10-23 — Admin moderation foundation

`AdminModerationService` retains mutation ownership; protected summary/detail/
history reads extend `AdminController` and the shared contracts/client. Summary
SQL uses revision submission time and revision ID, with unknown times explicitly
last. Summary filters are non-exclusive: `APPROVED` tests parent status, other
statuses test the editing revision with legacy parent fallback, and `ALL` does
not constrain status. Parent approval does not itself guarantee public visibility;
consumers keep parent/review statuses separate. Legacy list/cursor contracts are preserved. Detail reuses revision selectors
and mappers, with separate published/review snapshots and decision target.

`AuditEvent` adds nullable action/revision/operation/generation metadata and an
optional unique event key; legacy rows remain unknown. Submission, decision and
publication completion are distinct facts in their existing owner transactions.
`MediaOperation.generation` identifies reopened restore cycles; retry keeps it.
Restore refreshes actor/manifest. Finalization locks target then operation and
checks fresh ownership; bounded DELETE/purge renew leases between objects.
Existing delivery DTOs stay unchanged and select by latest operation update.
Migration, compatibility and evidence: admin foundation audit.

## 2026-10-23 — Version 2 web analytics foundation

The existing AnalyticsService ingests additive `/api/analytics/web-events` into
`AnalyticsEvent`; environment/eventId uniqueness deduplicates delivery. Existing
`AcquisitionAttribution` owns immutable server first touch, browser cookie proof,
row-locked inactivity sessions and a separate proven `registeredUserId` relation.
No new service/table/queue. Three actual account-creation boundaries link proof
after saving the user; attribution failure cannot roll back registration. Login
and legacy identify do not link the new relation.

`AnalyticsProvider` observes allowlisted public pathname changes; canonical author
views use `/seller/[slug]`, while the share alias forwards UTM/preview without an
event of its own. Web Locks
serialize tab requests/initial cookie response. Without them, per-tab delivery
continues sequentially; simultaneous cold tabs can establish separate identities
before the browser saves a cookie. Server/client flags are independent
and default off. Cloudflare forwards the optional server flag and explicitly
builds the separate client flag as false unless configured. Existing v1 DTOs and
collection remain; legacy acquisition queries exclude v2. Corrected product,
cohort, UTC growth and revision-age operations use a new protected foundation
read in AdminAnalyticsService. `SellerProfile.firstPublishedAt` records only known
first publication; no historical backfill. [Contracts/configuration](analytics-contract.md),
[metric definitions](analytics-metrics.md), audit.

## Владельцы логики (2026-10-29, DEC-150)

Rule: each topic has exactly one owner; callers use it instead of copying the
logic. A topic is either one file of named functions (the TypeScript
equivalent of a Java utility class) or a Nest service when it needs state, DB or
DI. No scattered per-screen or per-controller helpers. Existing files are not
rewritten for style; a wave moves only what it touches. Statuses below are code
facts; "Planned" owners are created by the named launch wave.

| Topic | Owner | Status |
| --- | --- | --- |
| Whether a user may act (auth abuse, rate limits, Turnstile, signals and holds, ban, buyer contacts, strikes, reservation cap) | `apps/api/src/antifraud/` (`AntifraudService`, `@RateLimit`) | Implemented locally — W2b, plus W3 checks inside `assertCanAct` |
| Product publication and visibility transitions | `apps/api/src/products/product-publication.ts` | Implemented locally — W1 |
| Whether a Product is in sale | `apps/api/src/products/product-write-guard.ts` | Implemented locally — `SCHEDULED`/`LIVE` listing or `OFFERED`/`ACTIVE` order |
| Public Product/image eligibility | `apps/api/src/products/public-visibility.ts` (`portfolioCatalogProductWhere`) | Implemented locally — W1 |
| Lot and order transitions, pricing, order reports | `apps/api/src/commerce/` `listing-state.ts`, `order-state.ts`, `order-offers.ts`, `auction-pricing.ts`, `listings.service.ts`, `bids.service.ts`, `orders.service.ts`, `commerce-tick.ts`, `reports.service.ts` | Partial — listing, bid, purchase, order lifecycle, the commerce tick, and order reports are local; attention and favorites remain |
| API errors | `apps/api/src/core/errors/` (`AppException` + mapper) | Implemented |
| Business time | `apps/api/src/core/time/` (`dbNow(tx)` for deal time; `Clock` is the process clock) | Implemented locally — `dbNow` reads `clock_timestamp()` in the caller transaction |
| Scheduled jobs | `apps/api/src/core/tick/TickService` | Implemented locally — W2; live Needs verification |
| Transactional emails | notification outbox, `enqueueNotification` | Implemented locally — W3 |
| Client cache keys and invalidation | `apps/mobile/src/lib/query-cache.ts` | Implemented; W4 adds commerce keys |
| Client error texts | `apps/mobile/src/lib/api-error-messages.ts` | Implemented locally — W1; sale codes extend in W4 |
| Money formatting, ticking time | `apps/mobile/src/lib/money.ts`, `use-now.ts` | Planned — W4 |
| Leave-screen guard | `apps/mobile/src/lib/use-prevent-remove.ts` | Planned — W7 |
| Formats, limits, error codes | `packages/contracts` | Implemented |
| Colors and sizes | `packages/design-tokens` via `useAppTheme` | Implemented |

## Antifraud owner — 2026-10-29 (W2b)

Public callers use `AntifraudService` and `@RateLimit`. ESLint rejects imports
under `antifraud/` except the module itself and its `index.ts` barrel. The barrel
exports the service, rate-limit decorator/guard, and the types `SignalKind`,
`ActorAction`, and `BanHook`. `detectBidBurst` stays internal. Decision
functions stay internal.

Auth abuse lives in `antifraud/auth/` with the previous error contracts.
`verifyRequired(action, token, ip)` still fails closed. `verifySignal(action, token, ip)`
returns `passed | failed | missing` and does not throw. Bid placement records
`TURNSTILE_FAILED` when that result is `failed` or `missing`. The client hook is `useInvisibleTurnstile` and
requests a token on submit. Rate limits are rows in `rate_limit_counters`
(`key`, `window_start`, `expires_at`, `count`). `TickService` job
`antifraud-cleanup` deletes expired rows with `FOR UPDATE SKIP LOCKED`.
`RATE_LIMIT_MAX_BUCKETS` and `RATE_LIMIT_CLEANUP_INTERVAL_MS` are not read.

`fraud_signals` and `purchase_holds` come from migration
`20261029210000_fraud_signals`. One active hold per user is the partial unique
index `purchase_holds_one_active_user` (`released_at IS NULL`). User status stays
`active | banned`. `SUSPENDED` remains a seller-profile status. Two distinct
signal kinds inside 24 database hours create one hold and one `FRAUD_HOLD` audit;
repeating one kind only records. There is no automatic permanent ban.

`recordSignal` and `assertCanAct` lock that user inside the caller transaction
and hold the lock until the caller commits or rolls back. Supported isolation is
Read Committed, or Serializable retried as a whole through
`runSerializableTransaction`. Repeatable Read is still unsupported. Signal time
is `(clock_timestamp() AT TIME ZONE 'UTC')::timestamp(3)` after the lock, so a
non-UTC session TimeZone cannot shift the stored `timestamp(3)`. Each
`recordSignal` touches the user row so a stale Serializable snapshot conflicts
and retries. `updated_at` uses `GREATEST` against that same UTC timestamp.
The window has an inclusive 24-hour lower bound and no upper bound. `assertCanAct` allows only
`bid | purchase | accept-offer` when the user is active, the email is verified,
a deal contact is present, fewer than 2 buyer strikes are active, fewer than 3
reservations are open, and no hold is active. A hold, inactive user, missing
user, or too many strikes is `BUYER_BLOCKED`; a missing email proof is
`EMAIL_VERIFICATION_REQUIRED`; a blank contact is `BUYER_CONTACTS_REQUIRED`;
the reservation cap is `BUYER_ORDER_LIMIT`. `recordBidSignals` is called from
`BidsService` after the bid insert. `AntifraudService.onBan` runs registered
hooks inside the ban transaction: product locks, then the user lock and status
update, then void. `BidsService` registers that hook. Antifraud does not import commerce.

`FraudSignalsService.lockUsers` is the only multi-user row lock. It selects
`users.id` with `ORDER BY id FOR UPDATE`. `releaseHold` and an unban call it on
the admin and target before any user mutation or audit insert, inside their own
serializable transactions. A ban runs ReadCommitted with those row locks so the
in-transaction void can see a bid that committed while the user lock waited. `AdminUserService.revokeSessions`
calls the same helper through `AntifraudService` before its version bump and
audit, so an audit actor foreign key cannot lock the admin after the target.
The service requires an active admin, a reason or note, and rejects
self and admin-account status changes. `sessionVersion` increments only on the
transition to `banned`. Media revocation is enqueued in that transaction and
delivered after commit; object-store delivery is not rolled back with the ban.
`AdminUserService` delegates ban, unban, and hold release. HTTP release is
`POST /api/admin/users/:id/release-hold` behind the existing session and admin
guards. Ban/unban is `PATCH /api/admin/users/:id/status`. Session revoke is
`POST /api/admin/users/:id/revoke-sessions`.

## Work publication owner — 2026-10-29 (W1)

`product-publication.ts` owns `assertRevisionTransition`,
`transitionProductVisibility` and `publishRevision`, using the existing shared
`ProductStatus`. Only this module writes Product status/published pointer and
copies published Product fields. Author/admin/media callers retain authorization,
review targets, audit and publication intent. Writes lock the Product inside the
caller transaction and use conditional updates with exact row counts; publication
also checks revision identity/time and the expected published pointer. Stale
snapshots return `stale`; lost conditional writes throw `PRODUCT_STATE_CONFLICT`
(409). The old revision helper is removed; SellerProfile's machine is unchanged.

Approving a new revision of an ARCHIVED Work advances its published pointer but
keeps ARCHIVED, with media enabled or disabled. Explicit unhide restores the
published revision after media delivery. Hide cancels restore intents, preserving
ordinary revision approval. PUBLIC revoke may bypass a PENDING/FAILED nonrestore
approval only for an ARCHIVED Work; running leases, PRIVATE sources and cleanup
reference checks stay protected. Deterministic approval/hide and pending/failed
cleanup/manual-retry regressions live in `media-lifecycle.integration.spec.ts`.

`assertProductNotInSale` and `findSellerProductIdsInSale` own the sale policy in
`product-write-guard.ts`; its shared query/constant also serves admin affordances.
Author edits/submits, image mutation, nonrestore publication approval and archive
reuse this owner. Moderation checks before media enqueue, and `publishRevision`
checks again under the Product lock before any revision/content/pointer writes;
author suspension calls it from `AdminModerationService`. Active-lot mutations
return `PRODUCT_IN_SALE` (409). Future orders extend this owner, not its callers.
`ImagesService.get`, catalog/direct Product reads and analytics reuse
`portfolioCatalogProductWhere`; public images must also belong to the published
revision. Authorized owner/admin image reads skip this catalog query and return
private `no-store` bytes. Moderation retries of hidden approvals require the exact
current published pointer and a DONE nonrestore PUBLISH journal matching the
original target timestamp; stale/different targets retain their conflict behavior.

The mobile `apiErrorMessage` owner maps these two codes in cabinet/profile hide
and draft/story saves; unknown errors retain existing fallbacks. Hide reasons are
inside the open confirmation dialog. Source geometry/tokens are unchanged;
wrapping, real focus/zoom and responsive screenshots remain Needs verification.

## Applications and shared boundaries

- `apps/api` is the authoritative NestJS HTTP process. Controllers parse shared Zod contracts; services own business rules and Prisma transactions. Its active product modules are Health, Auth, Antifraud, Analytics, Products, OTP, Password Reset, Admin, Images, Sellers, Portfolio and Commerce; Categories and core database/mail/time/public-id/image-store modules support that graph. `AppModule` imports global `AntifraudModule` (`apps/api/src/antifraud/`). `CommerceModule` serves listing create, author cancel, admin remove, the public lot, bid placement and bid history. Order, Discovery, Activity, lifecycle and Socket.IO application modules are not on the default boot graph.
- First-party product analytics ingest lives in `apps/api/src/analytics` (`POST /api/analytics/events`) and persists `AnalyticsEvent` / `AcquisitionAttribution` without duplicating leftover Bid/Order tables. Legacy admin aggregates remain at `GET /api/admin/analytics/overview`. Expo admin `/(admin)/analytics` now reads only protected `GET /api/admin/analytics/foundation`, including opt-in daily sessions and server collection permission, through the existing service/query owners. Auction/bid/order marketplace metrics are not part of the active overview.
- HTTP requests receive a server-generated `X-Request-Id`. An inbound `X-Request-Id` is not accepted. The same id is returned on the response and written to the request summary and unexpected-error log.
- `apps/api/src/sellers` owns the authenticated seller detail boundary `GET /api/seller/products/:id`; it verifies product ownership before returning the shared detail contract, including persisted creation-story steps, process-photo metadata and the latest non-null product moderation reason. `apps/mobile/src/features/sellers/ProductDraftScreen` hydrates from this owner detail before initializing the editable wizard, including `REJECTED` recovery on the same Product.
- `apps/api/src/portfolio` owns strict portfolio-only Home, Work, Author, facets and
  author application projections. Public Work/Author catalog reads use the published
  `ProductRevision` projection (`listPortfolio` / `getPortfolio`), not Listing
  membership. `GET /api/portfolio/home` returns a server-owned curator selection
  (`CuratorSelection` slot `home`) or `null`. The Home DTO is
  `{ curator, work: { ...work, author }, note }`: `curator` is the editorial
  `SellerProfile` (`curatorSellerProfileId`), `work.author` is the Product
  owner, and `note` is optional editorial copy. There is no sibling `author` on
  the selection. Owner application reads overlay draft
  public fields from `editingRevision` and expose `editingRevision` on the seller
  response; the published author projection stays on the approved revision until
  admin approve. Portfolio DTOs never expose commerce
  fields. The public lot is only `GET /api/works/:publicId/lot`. The pre-W3
  commerce application stays archived at `feature/commerce-runtime-archive`
  (`19eb40e`). W3 listings are the new `CommerceModule`.
- `apps/mobile` is an Expo Router client. React Query holds server state. Public
  discovery has one canonical `/explore` route (`DEC-137`), composed by
  `features/explore/explore-screen.tsx` with one active Works/Authors/Categories
  pane. `use-explore-state.ts` owns URL state, independent section drafts and
  navigation-entry session offsets. A new independent Search entry starts from
  canonical defaults; no process-global last query is carried between entries.
  Existing entry Back/Forward still restores its drafts and offsets. Infinite pages stay in the existing React
  Query cache; no duplicated result store or new API is introduced. `/works`,
  `/authors` and `/search` redirect with validated supported params. Root
  `LegacySearchRedirect` translates old `overlay=search&oq&otab` links after share
  aliases resolve; it removes only those legacy params from the origin entry.
  Search opening, typing, section changes and X use `router.setParams` (replace).
  X clears only the active query, preserving filters and sort. Category selection
  pushes a logical Works transition; detail Back restores the navigation entry.
  `ExploreHeader` uses layout-measured Reanimated progress without changing the
  result tree. Search is inline; sheets retain shared `AppDialog` lifecycle.
  Existing `GET /api/works`, `/api/authors`, `/api/categories` and
  `/api/portfolio/facets` are reused unchanged. There is no `/search` API.
  `patches/expo-router@57.0.4.patch` still keeps inactive web screens laid out and
  inert; `AppShell` focus only controls dock mounting. History-first Back uses
  `navigateBack`, with Home as direct Explore fallback.
- `apps/mobile/src/components/layout/AppShell.tsx` owns the shared safe-area responsive shell. `AppHeader` is one horizontal, role-aware composition with desktop navigation and a compact mobile navigation row; route screens remain responsible for their own scroll/content and business interactions.
- `apps/mobile/src/components/ui` is the only runtime component system.
  Text-button geometry and the 16-cell visual matrix live in
  `packages/design-tokens` (`figma-button.ts`); `FigmaButton` in
  `apps/mobile/src/components/figma` is the only text-button renderer, with
  `FigmaButtonSurface` (single `Svg` for fill/overlay/stroke),
  `useCssBorderBox` in `use-css-border-box.ts` (fractional web border-box via
  `getComputedStyle` for `FigmaButton` and search `FigmaSearchGlass`), and
  read-only `FigmaButtonStatePreview` reusing the same private visual content
  for the `/dev/figma-buttons` matrix stand.
  Search overlay chrome lives in `packages/design-tokens` (`search-chrome.ts`,
  `searchChromeStrokeViewport` for full stroke bounds) and `FigmaSearchGlass`;
  it does not reuse the text-button matrix or the dock glass stroke.
  Product tabs are controlled by Expo Router URL state, and related Product/
  Creator grids reuse `WorkCoverCardGrid` rather than duplicating card anatomy.
  Cover effects share `CoverFrost` and semantic blur tokens. PR #66 replaces
  the release-base Native blurred image copy with `BlurTargetView` around the
  original image and a subsequent `BlurView`; Web uses one masked backdrop
  filter. Native intensity is separate from the web pixel radius; Android
  below SDK31 uses tint/scrim fallback. Device runtime remains unverified.
  Cross-platform UI motion uses `react-native-reanimated`. Creator and Work
  share `stickyDock.*` metrics. Sticky physics stay screen-specific: Creator
  parks with CSS `top: -(heroHeight - stickyDock.actionHeight)` and restyles
  one `CreatorIdentity` with `LinearTransition`. Work keeps one persistent
  Back/Share pair in `StickyDockActionRow` (scrollport-spanning CSS-sticky
  overlay) and parks tabs with `position: sticky; top: stickyDock.actionHeight`.
  Shared handoff math lives in `apps/mobile/src/lib/sticky-handoff.ts`
  (`stickyHandoffThresholds` for Creator). Each screen host owns
  `stickyDock.fullHeight` placement. `StickyDockSurface` is a presentational
  `FigmaGlassSurface preset="navigation"` fill, square and full-width
  (`borderRadius: 0`, web opacity fade). Work activates it with an
  IntersectionObserver sentinel (`rootMargin` top
  `-${stickyDock.actionHeight}px`, `surfaceActive = !entry.isIntersecting`);
  Creator activates it with compact.
- `apps/api/src/images/image-policy.ts` owns binary Cache-Control: private media is `no-store`; public Product images keyed by id are immutable; public seller photos and creation-step images (bytes replaced at a stable URL) use short revalidation. `ImagesService.get` authorizes a Product image from owner id, product and seller status, `publishedRevisionId`, and published-revision membership. That read does not load the public seller profile.
- `apps/api/src/core/image-store` is the media boundary. PostgreSQL retains media
  metadata, ownership, checksum and deterministic object key; S3-compatible storage
  retains binary bytes when `MEDIA_STORAGE_PROVIDER=s3`. Production configuration
  fails closed without complete S3 settings. `scripts/ops/backfill-media-to-s3.mjs`
  is dry-run by default, scans all five media owners in bounded pages, verifies
  source and target checksum/type/length, retains DB bytes and supports reruns.
  Metadata-only references require a verified target object or shared source
  bytes; this tool does not copy objects from another S3 provider. The confirmed
  target is separate private/public R2 buckets with native Cloudflare CDN, a Neon
  operation journal and retry inside NestJS (`DEC-097`). The runtime is implemented
  in `core/media`; live provider/cutover and release checks remain open (boundary
  above). See the [implementation result](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md). Restore
  verification reads sampled objects and compares their checksums without logging
  content or credentials.
- `apps/mobile/src/lib/environment.ts` owns API origin validation and `getApiAssetUrl`, which resolves relative media paths while preserving valid absolute HTTP(S) URLs. Media components own truthful missing/error presentation without changing API visibility rules.
- `AppShell` owns page Safe Area and `FloatingDock`; `AppDialog` owns sheet portals, backdrop, motion, focus and bottom inset. Catalog sort and filter use `FilterSheet` through `CatalogFilterSheet`. `components/layout/index.ts` exports shell, auth and form page primitives and `navigateBack`; `OverlayHost` was removed. `header-chrome.ts` and `dismissible-overlay.ts` stay outside that barrel.
- `apps/api/src/products/products.mapper.ts` and `apps/api/src/products/products-catalog.query.ts` own the canonical public catalog selection and CTE/order SQL; `products.service.ts` keeps only use-cases and orchestration. Public portfolio Work hydration uses `portfolioCatalogProductSelect`: product id, public id, `publishedAt`, the public seller profile, and the published revision gallery. Parent product fields and the parent image relation are not part of that read. Owner and moderation reads keep `productSelect`.
- `packages/contracts` owns runtime HTTP and event shapes; `packages/api-client` validates responses with those schemas and declares `zod` `^3.24.2` for that import. Public catalog reads can pass an optional `AbortSignal` through that client into `fetch`. Mutations stay uncancelled unless a caller passes a signal.
- `packages/contracts/src/seller-profile.ts` owns the reusable public-link and handoff-contact validation shapes consumed by both seller write contracts and the profile editor; client-side field feedback does not replace server validation. Public `socialLink`, `telegramUrl`, `instagramUrl` and `websiteUrl` use shared `httpsUrlSchema` and accept only `https:` URLs. Telegram/Instagram `@handle` forms stay on the separate handoff schemas.
- Mobile author application (`apps/mobile/src/features/sellers/seller-profile-screen.tsx`, `author-application-*-step.tsx`, `AuthorApplicationAchievements.tsx`) renders four URL-owned steps against portfolio application reads/writes. Shared Zod in `seller-profile.ts` describes DTO and write payloads (for example `shortDescription: null` clears on PATCH); step UI and local hints are not readiness or stage authority. Server clamp, `applicationStage`, and validation errors remain authoritative. Achievement append/delete are JSON writes validated on the API (`z.output`); Work creation-story media and steps stay on the separate Product path.
- `packages/database` owns Prisma schema, additive migrations and deterministic local/test seed. Demo seed may run only with `NODE_ENV=development|test`, `APP_ENV=local` and `ALLOW_DESTRUCTIVE_DEMO_SEED=true`; production-like profiles fail before writes. Local seed is the Figma Home catalog (four public authors plus `pixelp`, nine public works including two demo vex works, no Listing/Bid/Order rows). User-facing seed copy is production-quality (`DEC-092`). `CuratorSelection` points at Dali (`daliEstate1` / `pixelp`) with curator `vex` and the Figma `note`. Pre-production amendment of the unreleased `curator_selections` CREATE TABLE (`note TEXT`, `curator_seller_profile_id`, `DEC-090`/`DEC-091`) is the only in-place migration edit; after first production apply, further columns are additive. Seller `biography` is an additive column (`20260914200000_add_seller_biography`). This does not authorize editing commerce/baseline migrations (`DEC-087`). `scripts/ops/commerce-inventory.mjs` is a read-only leftover-listing inventory; it is not a write path and is not a staging/production dry-run unless that environment is the connected target.
- `packages/config` owns env-file parsing through Node `util.parseEnv`. One leading U+FEFF is removed from the file text before that parse; a later BOM, including one inside a quoted value, stays. A missing file is an empty record. Explicit process env overrides file values. `apps/api/src/core/config/env.ts` validates that merge once and freezes the result. `ServerEnvModule.forRoot` provides that same object as `SERVER_ENV` for one Nest application context. `main.ts` and `apps/api/test/integration/http-test-app.ts` are the bootstrap loaders. Analytics, auth, OTP, password reset, mail, image storage, and rate limits inject the snapshot. `loadServerEnv` still copies unset keys into `process.env`, because `PrismaService` constructs `PrismaClient` without a datasource argument and Prisma reads `DATABASE_URL` from the process environment. A second application context gets its own snapshot through its own `ServerEnvModule.forRoot` call. The provider is the existing Nest dynamic module.
- `apps/api/src/core/config/env-profile.ts` owns the `NODE_ENV` × `APP_ENV` predicates. `APP_ENV=production` requires `NODE_ENV=production`; `NODE_ENV=production` cannot combine with `APP_ENV=local`. Production SMTP, service rules, password-reset URL, session/OTP key length and test-bypass prohibitions apply when either variable is `production`. Staging keeps its previous requirement shape: production security only when `NODE_ENV=production`.
- Release automation is deliberately layered: root `pnpm verify` is the local and
  standard automatic CI gate (including mobile unit tests and the E2E database
  fence). Full browser E2E is not run automatically on pull requests or pushes:
  `.github/workflows/browser-e2e.yml` is a manual `workflow_dispatch` Chromium
  gate, and the manual `portfolio-release-gate.yml` owns the full Chromium/WebKit
  release matrix. Browser setup always targets disposable `bidplace_e2e` under
  `NODE_ENV=test` and `APP_ENV=local`.

## Persistence model

```text
SellerProfile
  ├─ SellerProfileRevision[]
  │    ├─ SellerProfileRevisionAchievement[] (date + description; new writes have no image)
  │    └─ SellerProfileRevisionDirection[] (Category IDs)
  └─ Product
       ├─ ProductRevision[]
       │    ├─ ProductRevisionImage[]
       │    ├─ ProductRevisionStoryBlock[] / ProductRevisionStoryAsset[]
       │    ├─ ProductRevisionTerm[] (CatalogTerm MATERIAL | TECHNIQUE)
       │    └─ CatalogProposal[]
       ├─ ProductImage[] (legacy metadata)
       ├─ CuratorSelection? (home editorial pointer: curator SellerProfile + product + optional note)
       └─ Listing[]
            ├─ AuctionRules
            ├─ Bid[]
            └─ Order[]
```

`Product` and `Order` use immutable 11-character cryptographically random public IDs; internal writes use UUIDs. Listing currency is `BYN` or `RUB` in integer minor units. PostgreSQL enforces one `SCHEDULED`/`LIVE` Listing per Product, one `OFFERED`/`ACTIVE` Order per Product, and one `COMPLETED` Order per Product with partial unique indexes.

## Confirmed current MVP implementation boundary

- New account nickname writes use `newAccountSlugSchema` from the public
  `@bidplace/contracts` export: registration, claim-slug, availability and
  registration form validation share 3–20 characters and the existing grammar
  (`DEC-107`). Stored `User.slug` and claim responses retain the separate
  1–120 character `accountSlugSchema` read contract. Future write endpoints
  must reuse the write schema; narrowing a response schema would reject
  historical accounts. This introduces no new persistence owner or migration.
- `apps/mobile/src/lib/local-form-draft.ts` is the browser-only form-draft
  boundary (DEC-121). Keys are `bidplace:draft:<accountId>:<scope>:<entityId>`
  in `localStorage` — scoped to the account and to one Work or one seller
  application, never shared across accounts or entities; the analytics
  AsyncStorage is not used. A draft payload passes a Zod schema that allows an
  incomplete first step (strict submit validation does not apply), and corrupt
  JSON or unavailable storage yields `null`, never a form crash. Writing is
  throttled (~400 ms) during editing and does not depend on `beforeunload`.
  `features/sellers/local-form-restore.ts` adapts the two form owners: a stored
  draft applies only while its `baseToken` (server revision token) matches the
  loaded server state — the server revision wins on mismatch, so simultaneous
  editing from several devices resolves to the last successful server save and
  no sync/conflict UI exists. Restored values hydrate the form as dirty and go
  into the next ordinary save; server hydration/refetch does not clear them.
  Drafts are cleared on logout/session change (`account-logout`), on a
  confirmed submit, and on a successful save with no edits after the request
  snapshot. After the first confirmed create, the `…:new` key is migrated to
  the confirmed entity id (`noteEntityCreated`) so a revisit cannot re-create
  the entity. Passwords, OTP, tokens, registration/auth forms, blob URLs and
  file bytes are never stored. Account-wide clear (logout) also bumps a
  per-account write epoch: delayed writers capture it at schedule time and
  drop the write after retirement, so a debounced write pending at logout
  cannot resurrect the cleared private draft. The live writer persists only
  unsaved input — a clean form (e.g. after `reset(persisted)` following a
  confirmed save) clears the local snapshot instead of repersisting it, while
  edits made after the request stay. Unavailable or failing storage surfaces a
  visible message through the owners' existing danger-text pattern (restore
  hook `storageError`); it never breaks the form. Stored form payloads are validated as data, not
  as submittable forms: the envelope is schema-checked and each field is
  accepted only when its JSON shape matches the form's own default, so an
  unfinished intermediate value (half-typed email or year) never rejects the
  other fields; business validation stays with the server save/submit path.
  The story draft (`use-product-story-editor.ts`) is versioned: v2 blocks carry
  stable keys (`server block id ?? client key`) and IMAGE placeholders
  (mediaAssetId + altText), so edits, deletions, reordering and duplicate
  texts restore exactly by block identity; pre-v2 text-only payloads keep the
  legacy content-merge semantics, which cannot record deletions or image
  positions and is not migrated.
- `apps/mobile/src/features/auth/nickname-suggestion-generator.ts` is the
  replaceable synchronous nickname-generation boundary. Its sole current
  adapter confines `unique-names-generator` and curated bundled dictionaries to
  `unique-names-generator-adapter.ts`, then validates every candidate with the
  shared write contract. A curated color-or-animal stem plus a three-digit
  suffix provides a bounded 49,500-value local space. `RegisterForm` owns
  attempt-local suggestions and the explicit `Next` orchestration;
  `useSlugAvailability` owns one in-flight check and stale-result invalidation.
  The existing availability API is only a
  preflight read; `register` and the unique `User.slug` constraint remain the
  authority. No generator API, registry, reservation, or persistence was added.

- `APPROVED` SellerProfile is the seller capability; `assertApprovedSeller` is the shared write gate for Product, Listing, image and seller writes, while `AdminModerationService` records append-only audit events for moderation transitions;
- `User.slug` is the only canonical nickname and the public `/authors/:slug` address. `seller_profiles.slug` stays as a copied column. Migration `20261008040000_add_user_slug` requires this order: exclude writes from the old API, wait until writes it already accepted have finished, apply the migration, start this build, compare nicknames, and only then open access. The local gate is `RELEASE_HOLD=closed` in `deploy/cloudflare/src/router.ts`, which returns 503 before cache or `PortfolioApi`. `/_release/stop` and `/_release/state` are listed in `assets.run_worker_first`. An authorized `POST /_release/stop` confirms `getState()` after `stop('SIGTERM')`. Opening reads the published container image from Wrangler; a Worker var does not prove that image. Migration also refuses while another session can still commit. This gate is not deployed; production still serves the previous Worker. Drop the column only in a later migration, after this application is the only writer, every still-null account slug has been copied, every profile slug equals the account slug, and no live query reads the profile column. Profile creation copies the already stored account slug in the same transaction. Publication and moderation do not copy a revision snapshot onto `users.slug` or `seller_profiles.slug`. While the old column exists, a public read uses `users.slug` and falls back to the profile column only when the account slug is still null. Visibility still requires `seller_profiles.status = APPROVED` and `users.status = active`.
- SellerProfile stores public profile data separately from buyer identity. The current implementation keeps the handoff contact private, persists public `discipline` separately from the coarse seller type, requires `fullName` and a public profile photo on seller application; `city` is optional (`DEC-114`); accepts `socialLink` as null when Telegram/Instagram/website is used, reopens public-field edits for `CHANGES_REQUESTED` and `REJECTED` plus approved-author editing revisions, and snapshots the handoff data into Orders; public seller/catalog views reuse shared visibility predicates and narrow seller selects instead of duplicating checks. `GET /api/authors?sort=added` orders by `seller_profiles.created_at`, not latest work;
- Seller profile writes (`POST` and `PATCH /api/seller/profile`) accept JSON or `multipart/form-data`. In multipart the profile fields are one JSON `data` part and the optional photo is the `profilePhoto` part (`seller-profile-write-body.ts`). Invalid JSON in `data` returns 400 `data must be a JSON object`; a parsed body that fails the schema returns the usual validation error. On PATCH an absent field keeps the stored value, `null` clears a nullable field (`city`, contacts), and `[]` clears the direction list. One save is one request; the client never sends the string `"null"`.
- `Product` is the current persistence name for a Work. `ProductRevision` holds
  mutable public Work content and immutable revision-image membership; a Work points
  to its editing and published revisions. A published Work copies its published
  revision when the author starts a new edit. The prior revision and Product public
  projection remain visible until admin approval atomically promotes the next
  revision. Rejections and requested changes apply to the editing revision only;
  hiding/unhiding applies to the approved Work. Hide fails closed when a
  `SCHEDULED` or `LIVE` Listing exists and does not write Product, Listing or
  audit. Work writes lock the Product row
  (`SELECT … FOR UPDATE`) and re-check ownership and seller capability inside a
  Read Committed transaction;
- `SellerProfileRevision` gives approved authors an editing-revision pointer and a
  published-revision pointer. Public portfolio author data is read from the approved
  profile projection; author submission locks edits and admin moderation only promotes
  the approved revision. `SellerProfileRevisionAchievement` belongs to that revision,
  so pending achievements cannot leak into the public author page. Public
  achievement image GET is allowed only from the published revision; owner and
  admin can read draft bytes; anonymous/stranger draft reads return 404. Profile
  field updates, achievement append and achievement delete share one
  `ensureEditableEditingRevision` use case: it locks `seller_profiles` then the
  editing revision (`SELECT … FOR UPDATE`), forks a `DRAFT` from the published
  revision when those pointers still coincide, and copies published achievements
  including media metadata/`data` one row at a time so the fork map is the
  created draft id for that published id. The first add/delete does not require
  a dummy save. After that fork, later deletes accept only the fork map or an
  id that already belongs to the editing revision; content/position matching is
  not used. `PENDING_REVIEW` remains locked. `ImageStore` keys include
  `seller-profile-revision` and `seller-achievement` with the existing seller-photo
  canonical fallback;
- one own Product image is the MVP technical minimum. Maximum file count and
  aggregate bytes are enforced for the whole Product inside a Read Committed
  transaction that locks the Product row, including repeated/concurrent uploads. Condition is not
  mandatory for creator-made Product; the current optional field is preserved
  until a future item-class decision requires migration;
- public Work `История` authors as one `story` text field. The public tab
  interleaves published non-cover `ProductImage` rows between paragraphs.
  `ProductCreationStep` remains owner-only and is not a public History CMS;
- persisted entities expose `createdAt` and `updatedAt`; append-only audit records retain immutable business facts;
- buyer accepts a versioned service-rules text; `auth.service.ts` stores the acceptance and `POST /api/auth/rules/accept` returns the canonical `{ user }` auth response. Mobile derives session capability from one React Query `['user', 'me']` record. A structured 401 from any query or mutation clears that record and user/seller/admin caches once; 403 and infrastructure errors preserve the authenticated state. Registration and forgot-password require Turnstile proof; login accepts an optional adaptive Turnstile token after challenge. **Idempotency keys are required only** on email OTP send, OTP verify, and forgot-password (`packages/contracts/src/auth.ts`, `packages/api-client/src/auth.ts`); register/login do not take idempotency keys. Email verification state exposes `serverNow`, `sendStatus`, and deadline fields from the API; mobile `use-email-verification.ts` drives copy and local countdown ticks only and does not auto-send mail. OTP send/verify and password-reset send delegate durable quotas, pauses, operation replay, and SMTP outcome classification to `AntifraudService` (`antifraud/auth/`); per-IP limits are PostgreSQL `rate_limit_counters` in `antifraud/rate-limit/`. Mail still flows through shared `MailTransport` (`SmtpMailTransport` on the production security profile, `LocalMailTransport` otherwise) with a test-only OTP bypass only for `NODE_ENV=test` and `APP_ENV=local`. Unverified email correction and OTP verify share the same user row lock and expiry recheck as reset completion. Policy numbers and SMTP/Turnstile rules are owned by [`13-APPLICATION-SECURITY.md`](13-APPLICATION-SECURITY.md) (**DEC-109**);
- Listing create, author cancel, admin remove, `POST /api/listings/:id/bids`,
  `GET /api/listings/:id/bids` and `GET /api/works/:publicId/lot`
  are served by `CommerceModule`. Order HTTP is absent. Hide/unhide and
  admin seller/product moderation fail closed when a `SCHEDULED` or `LIVE`
  listing or an `OFFERED` or `ACTIVE` order exists. There is no Socket.IO, no
  ScheduleModule lifecycle, and no `COMMERCE_ENABLED` gate. The pre-W3
  application code stays on `feature/commerce-runtime-archive` @ `19eb40e`.
- password recovery lives in `apps/api/src/password-reset/`: forgot is neutral and never enumerates accounts; per-IP forgot limits run before user lookup; durable reset-send ledger, cooldowns, and Turnstile run through `AuthAbuseService`; reset consumes a hashed single-use token, invalidates sibling tokens, updates `passwordHash` and increments `sessionVersion` atomically under the user lock; `MailTransport` sends reset links; `core/email/smtp-transport.ts` builds Nodemailer options with single-address recipient guard; production requires `PASSWORD_RESET_URL_BASE` for reset links and local dev may fall back to `resolveCorsOrigin()`;
- admin emergency controls live in `apps/api/src/admin/admin-user.service.ts`: exact email user lookup and session revoke stay there. Revoke locks the admin and target through `AntifraudService.lockUsers` before the version bump and audit. Reasoned ban/unban and purchase-hold release delegate to `AntifraudService` (`sessionVersion++` only when status becomes `banned`) and use that same id-ordered lock. `POST /api/admin/users/:id/release-hold` requires a note. Listing admin remove is `POST /api/admin/listings/:id/remove` on `CommerceModule` and writes `audit_events` in that transaction. Needs-order recovery and order replacement HTTP are not on the active boot graph.
- Production SMTP transport must either use implicit TLS or STARTTLS with `requireTLS: true`. `SMTP_AUTH_MODE` explicitly selects `none` or `login`; login requires both `SMTP_USERNAME` and `SMTP_PASSWORD`, while none omits Nodemailer auth. Empty local relay credentials normalize to absent values and production configuration still fails closed for invalid partial auth.
- automatic winner replacement and AI-assisted evidence assessment are outside MVP and have no approved future workflow.

## Integrity and privacy

- HTTP errors use one response shape `{ status, code, message, details?, requestId? }`
  from the existing `ApiExceptionFilter` in `apps/api/src/core/errors/`
  (`error-response-mapper.ts` + `error-logger.ts`). Category codes
  (`bad_request`, `conflict`, …) remain the default for plain Nest exceptions.
  Leftover listing/bid business codes remain in the shared error enum.
  `message` is diagnostic, not UI copy. Unexpected errors become
  `internal_error` without leaking internals.
  Client transport lives in `packages/api-client/src/errors/`. Mobile
  infrastructure UI policy lives in `apps/mobile/src/errors/`; presentation
  lives in `apps/mobile/src/components/shared/InfrastructureErrorState.tsx`
  (`presentation="page"` as an `AppShell` flex child, `presentation="inline"`
  when screen chrome stays useful). Blocking page fetch loading/error share
  `InfrastructurePageStatus` and one static `BidplaceMark`. Diagnostics for handled infrastructure
  failures use `console.info` via `logInfrastructureError`; Expo LogBox is not
  used as UI. Public `AppShell` does not show session
  bootstrap chrome. `ProtectedRoute` owns blocking session failure.
  The unused `SessionAlert` primitive was removed.
  Validation, password, conflict, rate-limit and domain/not-found copy still
  use the older form mapper and are a future migration.
- Public Work/Author catalog, ProductImage and seller-photo access share
  approved Product/SellerProfile gates and contain no buyer contacts or seller
  internal identifiers. There is no public Listing, Bid history or Socket.IO
  join path on the active API.
- Product image reorder uses a two-phase temporary offset inside a transaction
  so the unique `(productId, position)` constraint never collides during swaps;
  count/byte capacity is checked transactionally before insert. Owner Work writes
  and hide still lock the Product row and fail closed when a leftover
  `SCHEDULED`/`LIVE` Listing exists.
- Product image uploads enforce **authz-before-decode**: owner + editable Product +
  `assertApprovedSeller` run before Sharp. GIF and animated WebP/PNG are rejected;
  static JPEG/PNG/WebP only, with max edge 4096px and 16_777_216 pixel budget,
  sequential bounded normalize to canonical bytes outside the DB transaction, and
  a short Read Committed transaction that locks the Product row, re-checks owner, editable status, blocking
  Listing and capacity then persists via `ImageStore.put` (`PostgresImageStore` today). Reads use metadata/authz first,
  then `ImageStore.get`. Per-user upload rate limits persist in PostgreSQL and apply to product, creation-step,
  achievement, and profile-photo uploads. Author, achievement, and work decode share
  one process-local admission of two operations; nested pipeline validation reuses
  that slot and releases it on failure. A new Work upload that exceeds gallery count or targets an already full byte
  budget is rejected before Sharp/R2. The locked transaction checks the remaining
  capacity against the normalized SOURCE. Replaying bytes already attached to the current revision does
  not create another image. See
  `13-APPLICATION-SECURITY.md` and `apps/api/src/images/image-policy.ts`.
- Publication is confirmed in the request that enqueued it. HTTP success means the
  journal operation is `DONE` and the published revision matches. R2 work stays
  outside the database transaction; the previous public snapshot remains until
  that switch commits. A busy lease or a swallowed `run()` result is not success.
  Retry uses the same operation identity. A missing upload SOURCE requires the
  file to be sent again. Hide, suspend, ban and replacement still enqueue revoke.
  The Nest executor retries `REVOKE`/`CLEANUP` and recovers expired RUNNING
  `PUBLISH` through the shared tick batch (W2). Startup schedules the
  existing five-second timer and does not wait for recovery before the API
  finishes initializing. A failed tick, including a failed abandoned-staging
  scan, keeps that timer even when later counts are zero. The timer is removed
  after a successful read shows no work, or on shutdown. Staging intent and
  young `STAGING` assets keep the existing ten-minute orphan scan. The executor
  does not poll while that queue is empty and does not automatically retry
  PENDING/FAILED publication or upload. The central 30-second tick remains the
  recovery entrypoint while awake, independently of this acceleration timer.
  `DEC-101` withdraws the five-minute deadline after a stop, crash, or
  sleep. The executor, purge, and recovery after startup stay. Private SOURCE
  stays. An old public URL may remain until that recovery succeeds. This is
  not a wake of a stopped process.
- `ImageStore` now selects PostgreSQL only for legacy/backfill compatibility or an
  S3-compatible adapter for configured production storage. New media paths persist
  metadata and deterministic keys in PostgreSQL while the object store holds bytes;
  full MinIO/PostgreSQL restore verification remains a release gate.

## Runtime topology and extension boundary

`SellerProfile` keeps the current owner-facing mirror for unpublished author
applications while `SellerProfileRevision` is the canonical moderation payload.
Editable draft, changes-requested and rejected saves lock the profile and update
both records in one transaction. A parent `DRAFT` is private and excluded from
moderation and public author predicates; submission is the only transition to
`PENDING_REVIEW`.

Admin moderation reads that revision as an explicit review target and keeps the
parent publication status separate. Review actions address the revision
`{ id, updatedAt }` the moderator saw. Visibility actions address the parent.
The admin seller photo uses the same identity plus the photo checksum, so a
resubmitted revision replaces the displayed bytes. Work and achievement image
reads use the existing endpoints. The mobile API client sends the session
cookie with `credentials: 'include'` and does not attach an Authorization
bearer token. `OptionalBearerAuthGuard` accepts that cookie or a bearer token.
Public and owner projections stay on their existing records.

The active API is an HTTP process with the global TickModule and `CommerceModule` on its boot graph. There is no Socket.IO adapter on the boot graph. Do not add future sale types, payments, delivery or automatic winner replacement until a product decision requires them. The pre-W3 commerce application is not restored from the archive branch `feature/commerce-runtime-archive` @ `19eb40e`. W3 listings are a new module.

## Author story and catalog — 2026-10-11

`DEC-112`–`DEC-114` and `DEC-116` are implemented in the API. Story blocks belong
to the editing or published `ProductRevision` and reference `MediaAsset`.
`storyToken` detects a stale save; `ProductRevision.version` stays the edition
number. `STORY_IMAGE` uploads create a private draft hold and do not add a gallery
image. Categories stay in `Category` with `active`. Materials and techniques are
`CatalogTerm` rows. Author directions are Category IDs on the profile revision.
Country is an ISO alpha-2 code from the same list as `GET /countries`. City is
optional in readiness and public predicates. Catalog proposals are separate rows;
confirming one updates the pending revision and does not publish it. A decision
locks the product row and re-reads the proposal. Re-selecting a proposal keeps
its status, including `REJECTED`. `Category.normalizedName` and
`CatalogTerm (role, normalizedName)` are the name identity; slug stays the stable
key. Bootstrap inserts missing starter rows and does not overwrite admin names
or visibility. Public story bytes are an IMAGE block on the published revision.
A story-asset hold retains the file for the editing revision and does not publish
it. `MediaLifecycleService` publishes, revokes, restores and checks that link.
Public search and material facets read published term names and story-block text.
Owner and public materials/technique strings are the selected term names, or
null when the selection is empty. Owner detail and product writes use the
editing revision. The owner list, hide/unhide, and the admin product snapshot
use the published revision when `publishedRevisionId` is set, otherwise the
editing revision. The stored columns are a freshness side effect
of `writeTermLabel`, not a read source and not a write contract. Product create
and update return the editing revision after `syncWorkSelection` in the same
transaction. Owner, admin, and public author DTOs include selected term,
category, and direction metadata, including hidden rows. `GET /categories` and
`GET /catalog/terms` stay active-only. `normalizeCatalogName` is the only name
identity; writers set `normalizedName`, and the column has no SQL default or
insert trigger. The earlier client-cutover warning described the 2026-10-11
checkpoint. The current mobile story owner calls `api.products.replaceCreation`
with revision blocks; client/API integration and its verification are tracked in
[project status](11-PROJECT-STATUS.md) and the
UI completion audit.

Contracts belong to [05-MVP-RFC.md](05-MVP-RFC.md); affected consumers, migration
and API work are in the backend plan.
The next sales wave has its own [complete product plan](15-POST-MVP-BACKLOG.md)
(`DEC-115`), without changing the active boot graph.

Pilot operations are documented in [`docs/ops/00-RELEASE-AND-BACKUP.md`](../ops/00-RELEASE-AND-BACKUP.md):

- `pnpm verify` — clean-checkout gate (typecheck with Turbo `database#generate`, lint, unit, integration, build);
- GitHub Actions [`.github/workflows/verify.yml`](../../.github/workflows/verify.yml);
- `GET /api/health` (liveness) and `GET /api/health/ready` (PostgreSQL `SELECT 1`);
- `scripts/ops/` backup/restore/integrity with `pnpm ops:*` aliases.

## Verification

### Author email verification boundary

`VerifiedEmailGuard` runs after `BearerAuthGuard` on authenticated Author
application, Work, and related media mutations. It reads `User.emailVerifiedAt`
from persistence and returns 403 for an unverified session; read/public routes
remain outside this boundary. Mobile keeps `/me` in `['user','me']` as the sole
session owner after OTP verification. `/verify-email` uses
`verify-email-copy.ts` for state-first status text (none / accepted without
mailbox proof / unknown / rejected) and reason lines; Turnstile unavailable on
web is explicit fail-closed UI, not native widget proof.

### Auth abuse persistence and rollout (2026-10-10)

Additive migrations `20261010010000_auth_abuse_protection` and
`20261010100000_auth_abuse_legacy_import` introduce `auth_abuse_operations` and
`auth_abuse_counters`. Integration coverage exercises them only on fresh isolated
PostgreSQL databases (`auth-abuse.integration.spec.ts`). Production rollout is a
separate operator step: stop old writers, apply both migrations, deploy this
build, then resume traffic. The legacy import spends one quota unit per retained
OTP or reset row at source `createdAt`, imports status as `unknown` without
inventing SMTP acceptance, copies the latest unused OTP attempt count, and starts
one five-minute cutover pause when that count is already ≥5. Deleted mail history
and former in-memory login counters are not recoverable; missing historical
mailbox addresses attribute spend to the user's current email. Do not treat
imported rows as complete historical quota truth.

Automated verification counts and browser evidence for this branch are owned by
`11-PROJECT-STATUS.md`.


### Auth background and shared sheet interaction (2026-10-18, DEC-122)

Expo Router root anchor `index` and transparent auth presentation preserve the
existing background screen. The auth layout also owns one persistent visual dimmer;
AuthViewport retains only the transparent dismissal overlay, so child auth routes
do not tear down and restart background dimming (2026-10-19). AuthViewport owns auth close guards and dismisses to
its return target; it no longer renders HomeScreen as a second background.
SheetDragSurface owns only gesture detection/translation, with web Pointer Events
and a native PanResponder adapter. AppDialog, FilterSheet and AuthViewport declare
the draggable header and supply the existing close callback. This avoids separate
route-local gesture implementations; persistence, auth service, API and database
boundaries are unchanged. useReturnFocus handles force-mounted sheet close cycles.


### Shared web sheet backdrop (2026-10-19)

AppProviders mounts SheetBackdropProvider under the semantic theme owner.
AppDialog registers ordinary sheet/mediaSheet open lifetimes; one visual portal
stays mounted across handoffs. This owner does not manage content, route history,
focus traps, save state or permissions. Dialog.Overlay remains the dismissal hit
layer below panels. Native/isolated rendering retains its existing per-dialog
implementation; centered confirmations, auth and Search keep their flow layers.
useReturnFocus records weak opener ancestry for handoffs without retaining closed
DOM scopes. See audits/2026-10-19-TRANSITION-MATRIX.md for coverage and limits.

### Registration evidence and document delivery —2026-10-20

DEC-125: AuthService.register reads readRegistrationLegalVersion (edition +
source digest) instead of the public document endpoint. Canonical source
parsing/hashing is shared in legal-documents.ts; readPublishedLegalDocuments
additionally rejects unresolved placeholders before exposing bodies.
New clients submit confirmed actions without a revision; the server owns the
revision at atomic User/evidence creation. Explicit legacy revisions still
undergo mismatch rejection. No new database state or acceptance stage.
RegisterForm completes navigation after the AuthProvider rendered the installed
account, checked against the captured epoch/controller/focus receipt.

## 2026-10-20 — Shared calendar boundary

`components/ui/DateField` owns temporary selection and confirmation, shared
FigmaSelectField and AppDialog own presentation. `DateSelection.tsx` is the web
implementation using modular public React Aria exports; Metro selects
`DateSelection.native.tsx` for Expo/system picker. `lib/calendar-date.ts` owns
canonical string conversion and reuses the existing contract schema. Existing
seller date exports delegate without changing null labels or local draft schema.
UI never changes date-only values to timezone-dependent instants. No API,
database migration or scheduling domain was added.

`AppDialogSheetMotion` owns one Reanimated shared translation across enter, drag,
cancel and exit on web/native. SheetDragSurface handles the header gesture only;
it neither wraps the sheet in another transform nor resets an accepted dismissal.
Web retains one live DOM tree, makes entering/closing content inert and removes it
only after the timing completion. AuthViewport commits dismissal navigation from
onExited; useReturnFocus restores at the real FocusScope close. Guarded dismissal
animates back to rest. ReduceMotion.System remains the shared timing policy.
Native shares this owner but device runtime still needs verification.

Metro's transform cache identity includes the explicit public build configuration
(API URL, public site key, app environment and analytics flag). Sequential preview
and isolated-test exports must never reuse a bundle compiled for another origin.
metro.config.js and environment.spec own this build/release invariant.


### Public navigation / bleed layout ownership — 2026-10-21

Public route context scopes navigation presentation; shared use-app-navigation
retains the existing auth/capability/search owners for dock and desktop header.
AppShell owns Safe Area and selects chrome; PageColumn owns constrained geometry
inside both normal and full-bleed scroll hosts. No domain/API/persistence boundary
changed. Visual and motion contract: docs/design/03-DESIGN-SYSTEM.md.


### Ordinary page chrome (2026-10-21)

`AppShell` owns desktop/dock visibility; `PageScrollView` composes the existing
`PageColumn`, `SiteFooter` and dock clearance in one scrollport. Its branded
variant owns the responsive central mark. `SiteFooter` shares the wide-layout
policy with navigation and uses existing auth/create routes and legal IDs.
`FormPageShell` includes it for account/settings only by default. Full-screen
forms and overlays retain their existing layout. `BidplaceLogo` is the shared
contain-fitted combined SVG for header/footer.


UI review follow-up (2026-10-21): the existing PageChromeContext carries actual
`desktop` and `dock` visibility from AppShell. PageScrollView consumes this state
for dock clearance; screens do not independently derive navigation visibility.
No server, persistence or API boundary changed. Focus-after-enter lives in the
existing use-return-focus module and is shared by auth and general dialogs.

## 2026-10-22 — Normalized image processing boundary

`images/ImageProcessor` is the Nest DI contract; `core/media/SharpImageProcessor`
in `media-pipeline.ts` owns all Sharp calls, including the legacy normalization
entry point re-exported by `image-policy.ts`. Controllers and business services
use the contract/policy rather than codec APIs. Normalization is bounded: preserve
compact inputs or use a smaller lossless result, then progressively encode and
resize oversized sources without cropping or flattening alpha. Derivatives are
built from the persisted master, so upload recovery can reproduce their checksums.

An idempotent gallery request accepts one JPEG/PNG/WebP up to 25 MiB; legacy
multi-file requests retain 5 MiB; story input is 10 MiB (`DEC-151`). Gallery and
story input is bounded at 8192px per edge / 50_331_648 pixels;
stored masters and other purposes retain 4096px / 16_777_216 pixels. `WorkImageUploadInterceptor` keeps large
input single-file, avoiding a ten-file 250 MiB buffered request. Gallery admission
allows 20 requests/minute for the initial ten files and manual retries; the shared
process admission remains two image-processing operations.

`MediaOperation.inputChecksum` hashes the submitted MIME and bytes independently
of the normalized object checksum. Nullable values preserve old replay behavior;
new assets use `MediaProvenance.NORMALIZED`. Apply migration
`20261022120000_normalized_media_source` before the new API release. No existing
objects are rewritten. Both p1 and p2 URLs remain accepted by transport/contracts.

The Work hook reads/uploads one asset at a time, releases confirmed Blob/File
references, invalidates owner queries after each confirmation, and retains the
current file/key for retry. Its size-based deadline (60 seconds plus one second
per 64 KiB; 460 seconds at 25 MiB), explicit timeout message and session/unmount
abort preserve unknown-response replay. Wizard, native Back and browser
Back/unload are guarded during preparation/upload. Preparation and per-file
results use existing UI components; portrait preparation uses the Expo helper
from PR #56, with a final 640px fallback instead of 256px.

Review corrections (2026-10-23; story extended by `DEC-151`): gallery/story input is bounded at 8192px per edge /
50_331_648 pixels; stored masters and other purposes retain 4096px / 16_777_216
pixels. Compact 16-bit PNGs remain byte-identical. Oversized artwork is encoded
at quality 90/82/70, then resized to 2560/1600px with a final 1600px quality-60
attempt; no 800/256px gallery fallback remains.

Legacy ImageStore uploads persist a nullable unique owner/Work/key hash and
submitted MIME/byte checksum on ProductImage. Replay runs before processing
and again under the product row lock; conflicting bytes or an earlier revision
return 409. Only metadata-stripped PREVIEW bytes are stored in this publicly
served fallback. Lifecycle-enabled uploads check legacy identities too,
preserving retries across cutover. Apply migration
`20261022180000_legacy_image_upload_identity` before the API release.

Upload retries reuse a verified persisted SOURCE when available, so encoder
policy changes do not alter a partially written operation manifest.

## Server sessions (2026-10-22)

AuthService returns the existing user and current sessionVersion internally;
SessionService rotates/saves an opaque SID with express-session/connect-pg-simple.
AuthSession migration owns auth_sessions; store runtime DDL is disabled and its
schema follows DATABASE_URL. SessionAuthGuard and optional/logout guards use one
principal resolver, current User role/status/version and absolute 12h expiry.
Late session saves cannot bypass logout/reset/admin version invalidation.
Flow creation, account switching and logout hold a PostgreSQL advisory lock on
the browser SID while saving session state. Before a delayed request writes, it
rechecks that its previously loaded SID still exists, so an old request cannot
recreate a session after rotation or logout. The lock is shared across API
workers and is released after the session write.
Bootstrap owns session middleware and CSRF origin/custom-header checks; api-client
uses cookies and marks mutations. JWT issuer and bearer client transport removed.
SocialAuthModule extends this transport through one AuthFlowService and
OidcProvidersService. openid-client owns discovery, client-secret Basic auth,
PKCE, state/nonce and signed ID-token validation for Google and Telegram. AuthFlow
rows bind one attempt to the digest of an opaque browser SID, with a ten-minute
TTL and transactional stage transitions. ExternalIdentity keys are issuer/subject
and user/provider; no email auto-link or provider tokens are persisted.

Social creation writes a real email, nullable password, nickname, legal evidence
and identity atomically. Only authoritative Google email can skip email proof;
other identities remain pending without a principal. The existing abuse/OTP
store binds HMAC codes to purpose, user, email, flow and session version. Its
shared mail budgets and pauses include email-login. A separate neutral
email_login_request ledger records resend admission equally for known and unknown
addresses. AuthAbuseService owns its CAPTCHA, admission, cooldown and state. The
ledger binds browser SID digest plus email, independently of a credential flow;
rotation after revoke preserves cooldown and replay. Turnstile succeeds before
admission is recorded. OTP/real mail operations still bind their own flow/version.
The neutral ledger grants no authentication or SMTP-delivery claim.
Email-login resend reads only the three newest ledger rows through the
`purpose, contentHash, createdAt` index; the cooldown policy needs no older
history.

Email-login verify exposes one typed EMAIL_LOGIN_REJECTED for all credential
refusals, including unknown/ineligible/expired/paused/revoked attempts; durable
OTP counters and private outcomes remain unchanged, and infrastructure 5xx are
not masked. A new request replaces a stale eligible flow before issuing fresh
proof. Provider cancellation/failure retains the safe server-owned returnPath.
Social profile completion requires its browser-bound OIDC proof, email policy,
nickname and legal consent, without a second registration CAPTCHA. Anonymous
mail requests and password registration retain their CAPTCHA checks.

Completed domain proof transitions through ready/issuing before SID rotation.
A failed session save restores the anonymous flow for a bounded retry without
repeating domain writes. Account switching cancels older browser-bound flows;
completion rechecks cancellation after save. Password reset closes pending
proofs and identities; version checks protect logout/ban/admin revocation.

Web login/code/onboarding and settings use shared contracts/api-client and
AuthProvider's existing epoch installation. Private auth queries live under the
purged user namespace; public provider availability is separate. Native provider
login and exact new Figma compositions are outside this wave. Local verification
and remaining external acceptance: 11-PROJECT-STATUS.md and
[rollout runbook](../ops/WEB-AUTH-ROLLOUT.md).


## 2026-10-22 — Pre-account email proof and neutral verify

`EmailProofService` owns browser-bound email proof in `auth_flows`: hashed code,
10-minute flow/code lifetime, five guesses per code, three sends per flow,
60-second resend delay. `auth/register/email/request` and `verify` precede
`auth/register`; the latter creates a verified user and legal evidence.
The public registration contract no longer accepts phone or a second CAPTCHA;
CAPTCHA is required before sending the proof. API client and registration UI
change together. No User or ExternalIdentity is written for unproved social
onboarding. Existing pending identities remain bound to their user/version.

Proof mail reserves `email_proof_send` in the common abuse ledger under the
existing global mail lock; account/address quotas and global budgets include it.
Delivery status distinguishes accepted, rejected and unknown; definite reject
invalidates the pending code. Session flow, purpose, address and TTL bind proof.
Replay is owned by the flow-scoped abuse operation, not the flow's current code
pointer. Rejection outcome and conditional code/cooldown cleanup commit together;
SMTP holds no database lock. Reserved replay never waits for transport, and late
finalization updates only its own operation/code. Onboarding state reads flow and
current mail outcome in a repeatable-read transaction. Existing error/state
contracts carry rejection; no queue, schema or public type is added.
The additive `20261022040000_auth_email_proof` migration must precede API rollout.

Email-login refusal uses the same counter, operation replay, code lookup and
pause writes for registered and unregistered subjects. Unregistered subjects
use their flow UUID, never a synthetic User row; their ledger owner is null and
they cannot authenticate. Shared existing OTP policy remains the owner. This
keeps account counters durable without a response sleep or a second auth engine.

## 2026-10-24 — Mobile analytics read extension

`analyticsFoundationQuerySchema.includeActivity` opts into optional
`serverCollectionEnabled` and `growth[].sessions`. Existing default responses stay
unchanged for strict clients; the API client forwards AbortSignal. The controller
supplies server `ANALYTICS_WEB_ENABLED`, separate from public client configuration.
Existing PostgreSQL growth aggregation counts distinct sessions per active UTC day;
no table, migration, service or dependency is added. The feature-owned period helper
and single-series SVG view reuse Bidplace shells, tabs, fields and PaddedGrid.

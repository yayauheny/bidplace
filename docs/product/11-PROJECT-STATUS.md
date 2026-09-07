# bidplace — текущий статус проекта

## 2026-09-08 — First MVP scope changed to public portfolio

- `Confirmed product`: `DEC-082`–`DEC-084` replace the first public release target
  with creator profiles and portfolio Work; commerce moves to the post-MVP backlog.
- `Not implemented`: current runtime remains Pen-based and commerce-oriented. Auction,
  Bid, Order and handoff code still exists and does not yet have the required
  server-authoritative default-off capability.
- `Planned`: portfolio Work revisions, object storage, creator onboarding, simplified
  Work creation, portfolio discovery and the read-only Figma cutover are tracked in
  [`00-FIRST-MVP-BACKLOG.md`](../tasks/2026-09-06-reconciliation/00-FIRST-MVP-BACKLOG.md).
- `Deferred`: seller history, auction lifecycle residuals, fixed/offer, handoff and the
  completed creator-commerce research are preserved in
  [`99-POST-MVP-BACKLOG.md`](../tasks/2026-09-06-reconciliation/99-POST-MVP-BACKLOG.md).
- `Needs verification`: no code status was promoted. This was a documentation-only
  scope reconciliation; tests were not run and Figma/`.pen` were not changed.

## 2026-09-07 — Work/Order boundaries and research gate

- `Implemented` (docs only): `DEC-079` confirms portfolio-first Work states,
  persistent fixed sale, relist boundaries and permanent sold history; `DEC-080`
  confirms one format-neutral Order/public code without synthetic Bid; `DEC-081`
  selects controlled test-data reset and defers in-app notifications/general reports.
- `Needs research`: contact timeout, chat dependency, second chance, outcome
  confirmation, contact disclosure, edit/remoderation and the business evidence an
  Order must preserve are assigned to a browser-only GPT researcher. The exact
  persistence model remains the later technical contract. The researcher receives a
  standalone prompt and returns text plus direct web sources without repository access:
  [`../tasks/2026-09-06-reconciliation/10-CREATOR-COMMERCE-FLOWS-RESEARCH.md`](../tasks/2026-09-06-reconciliation/10-CREATOR-COMMERCE-FLOWS-RESEARCH.md).
- `Not implemented`: all named changes are product/documentation boundaries. Current
  auction-only schema, mandatory `sourceBidId`, seller-only handoff transitions and
  live snapshot fallback remain unchanged.
- `Needs future design cutover`: current `docs/design/*` still governs the Pen-based
  runtime. The founder-selected original Figma is a read-only source for the later
  redesign; its exact file/version and inspect/token/asset handoff must be recorded
  before replacing the current design authority.
- This entry supersedes the 2026-09-06 stress-test status below: D04 is closed by
  `DEC-081`; only D01–D03 remain open.
- Tests were not rerun for this docs-only task.

## 2026-09-07 — open architecture gaps retained

- `Implemented` (docs only): обнаруженные в T07 технические пробелы и варианты их
  решения сохранены в
  [`../audits/01-OPEN-ARCHITECTURE-GAPS.md`](../audits/01-OPEN-ARCHITECTURE-GAPS.md).
  Карта покрывает Work-level deal uniqueness, Order sources, handoff outcomes,
  second chance, snapshots, contact disclosure, notifications, Work/Listing boundary
  и complaints.
- `Needs founder decision`: рекомендуемые направления не являются утверждённой
  архитектурой и не меняют RFC, decision log, schema или runtime.
- Code behavior is unchanged. Tests were not rerun for this docs-only task.

## 2026-09-06 — MVP deal decision stress-test

- `Implemented` (research/docs only): D01–D04 проверены как единая модель
  `Work → Listing → Bid/offer → Order → handoff`. Рекомендации, rejected alternatives,
  race/abuse invariants и вопросы юристу находятся в
  [`../research/2026-09-06-MVP-DEAL-DECISION-STRESS-TEST.md`](../research/2026-09-06-MVP-DEAL-DECISION-STRESS-TEST.md).
- `Needs founder decision`: memo не меняет RFC или decision log. D01–D04 остаются
  открыты в [`14-OPEN-MVP-DECISIONS.md`](14-OPEN-MVP-DECISIONS.md).
- `Needs future implementation`: текущая БД ограничивает активный Order только на
  уровне Listing, а seller единолично меняет `CONTACTED`, `COMPLETED` и
  `HANDOFF_FAILED`. Для Work-first/fixed/offer нужен Work-level deal invariant и
  раздельные pending/confirmed outcomes.
- Code behavior is unchanged. Tests were not rerun for this docs-only task.

## 2026-09-06 — current documentation and legal UX research

- `Implemented` (docs only): выполненные task-prompts и закрытые legal-вопросники
  удалены из активной структуры; текущие blockers сведены в
  [`../audits/00-CURRENT-MVP-READINESS.md`](../audits/00-CURRENT-MVP-READINESS.md),
  активные задачи — в
  [`../tasks/2026-09-06-reconciliation/00-FIRST-MVP-BACKLOG.md`](../tasks/2026-09-06-reconciliation/00-FIRST-MVP-BACKLOG.md).
- `Implemented` (research): Belarus legal UX findings перенесены в
  [`../research/2026-09-06-BELARUS-LEGAL-UX-PATTERNS.md`](../research/2026-09-06-BELARUS-LEGAL-UX-PATTERNS.md).
  Research определяет понятные места controls, но не заменяет заключение юриста.
- `Needs verification`: отдельный обязательный PD consent из `DEC-078` требует
  purpose-by-purpose legal basis check. Это не отменяет решение основателя молча;
  финальный registration contract остаётся заблокирован вопросом 1 из
  [`../legal/06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md`](../legal/06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md).
- Code behavior is unchanged by this documentation update. Tests were not rerun.
- `Planned` (docs only): backlog содержит независимые security/dependency evidence и
  public-pilot operations reviews. Они не разрешают открытые вопросы автоматически и
  не меняют runtime.

## 2026-09-06 — Belarus launch scope

- `Implemented` (docs only): `DEC-076` separates auction from direct fixed-price
  sale. Buyer price offers are optional only for fixed sale; payment and delivery
  always stay outside bidplace.
- `Implemented` (docs only): `DEC-077` makes Belarus law the current operator,
  public-document and legal-review workstream. Earlier BY+RF packs are historical.
- `Implemented` (docs only): `DEC-078` records the founder-selected document set,
  registration layout, separate 18+, cookie banner, BYN, fixed-buy/accepted-offer
  outcomes and text-only V1 error report. Exact legal basis and wording remain
  subject to the focused Belarus questions and final review of adapted drafts.

## 2026-09-06 — Product write atomicity

- `Implemented`: owner Product field, submit, creation-story, ProductImage add/remove/reorder and creation-step image writes take the Product row lock (`SELECT … FOR UPDATE`) inside a Read Committed transaction and re-check owner, approved seller, editable status (`DRAFT`/`CHANGES_REQUESTED`/`REJECTED`) and the absence of a `SCHEDULED`/`LIVE` Listing before mutating. Conditional `updateMany` predicates back Product row writes. Listing `SCHEDULE` and admin Product moderation take the same row lock. Image decode stays outside the TX; a lost race rolls back with the TX so Postgres image bytes are not left behind. `remove`/`reorder` re-read the image set under the row lock (`temporaryBase` from locked rows). `SCHEDULE` repeats handoff and `startsAt > now` after the lock and writes `publishedAt` from that post-lock clock.
- Coverage: unit `product-write-guard.spec.ts`, `products.service.spec.ts`, `images.service.spec.ts`, `listings.service.spec.ts`; PostgreSQL `product-write-atomicity.integration.spec.ts` (fail-closed `pg_blocking_pids` barrier, forced update↔submit, media↔moderation, story↔Listing lock, concurrent update/submit, REJECTED resubmit, add↔remove/reorder, `ListingsService.transition('SCHEDULE')` vs Product leaving `APPROVED` and vs admin `CHANGES_REQUESTED`).
- `Verified`: API unit 325/325; PostgreSQL `product-write-atomicity.integration.spec.ts` 11/11; API typecheck; eslint on changed product/image/listing files.
- Decision unchanged: `DEC-071`. RFC §6 owner edit/resubmit loop is preserved.

## 2026-09-06 — reconciliation review and product correction

- `Implemented` (docs only): `DEC-075` revises the product assumptions recorded
  in `DEC-072`. Work-first portfolio is target MVP scope. Offer expiry,
  counteroffer, next bidder/contact release, contact window policy and currency
  expansion are explicitly open pending marketplace research and written Belarus
  legal review.
- `Needs verification`: current runtime still implements auction + BYN, manual
  admin replacement and fixed 48-hour Order contact snapshots. These are truthful
  code facts, not final target mechanics.
- `Partial`: seller Orders inbox exists but hides `CANCELLED` history; expired
  scheduled cancellation exists without author notification/relist. Activity
  distinguishes a cancelled auction from an outbid state and selects a relevant
  Order deterministically.
- Full repository verification on `fix/mvp-reconciliation-review` passed:
  typecheck 7/7, lint 2/2, API unit 302, contracts 27, integration 73 and build
  7/7. Passing tests do not cover the named concurrency/product gaps.
- Current audit: `../audits/00-CURRENT-MVP-READINESS.md`; backlog:
  `../tasks/2026-09-06-reconciliation/00-FIRST-MVP-BACKLOG.md`; legal questions:
  `../legal/06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md`.

## 2026-09-06 — Seller inbox HTTP 401/403

- `Implemented`: no route or permission change. Guest `GET /api/orders` remains 401 (`BearerAuthGuard`); admin remains 403 (`listForSeller` `role !== 'user'`).
- Coverage: HTTP `seller-orders-inbox-http.integration.spec.ts` (guest 401, admin 403). Service-level admin deny remains in `seller-orders-inbox.integration.spec.ts`.
- `Verified`: PostgreSQL integration 73/73 including the new HTTP file (2/2).

## 2026-09-06 — Deterministic buyer Activity projection

- `Implemented`: `ActivityService` requests only the current buyer's Orders
  with explicit `createdAt DESC, id DESC` order and then deterministically
  selects a non-cancelled Order before a cancelled historical row. Equal-class
  ties use the same `createdAt`/`id` ordering. A cancelled Listing with no
  Order now returns shared status `AUCTION_CANCELLED` (`Торги отменены`) rather
  than `OUTBID`; cancelled-only Orders remain `WIN_CANCELLED` with no order
  detail link.
- Scope preserved: no pagination, next-bidder, payment or contact-release
  behavior was added.
- `Verified`: API unit 319/319; contracts 27/27; mobile presentation 12/12;
  contracts/API/mobile typecheck; filtered API/mobile/contracts lint; API and
  Expo builds.

## 2026-09-06 — Bounded lifecycle tick batch

- `Implemented`: `ListingLifecycleService.run` activate, expired-`SCHEDULED` cancel, and LIVE close `findMany` queries use `take: LIFECYCLE_TICK_BATCH_SIZE` (50) and stable `orderBy`. Activate orders by `startsAt`/`id`; cancel and close keep `endsAt`/`id`. Remainder stays for the next 30s tick. No queue or distributed lock.
- Coverage: `listing-lifecycle.service.spec.ts` asserts `take`/`orderBy` on all three tick queries.
- `Verified`: lifecycle unit 5/5; API typecheck; eslint on `src/lifecycle/listing-lifecycle.service.ts`; PostgreSQL `lifecycle.integration.spec.ts` in the 73/73 suite.
- Remaining: prove `51 → 50 + 1`, prevent poison-prefix starvation and record the
  single/multi-instance scheduler policy. Active task:
  [`../tasks/2026-09-06-reconciliation/03-LIFECYCLE-BOUNDED-PROGRESS.md`](../tasks/2026-09-06-reconciliation/03-LIFECYCLE-BOUNDED-PROGRESS.md).

## 2026-09-06 — Narrow SellerProfile and ProductImage hydration

- `Implemented`: `placeBid`, public Product GET, listing get/transition/create, lifecycle `ensureWinnerOrder`, admin Order replace/recovery and product moderation no longer `include` full `SellerProfile`. Shared `sellerProfileAuthSelect` / `sellerProfileHandoffSelect` omit `profilePhotoData`. `getPublic` reuses `productImageMetadataSelect` so `ProductImage.data` is not copied into the product page. Image-store byte GET paths unchanged. Listing owner responses omit nested `product`.
- Coverage: `bids.service.spec.ts`, `products.service.spec.ts`, `listings.service.spec.ts`, `listing-lifecycle.service.spec.ts`, `orders.service.spec.ts`, `admin-moderation.service.spec.ts`.
- `Verified`: targeted API unit 43/43; API typecheck; eslint on changed `src/{bids,products,listings,lifecycle,orders,admin,sellers}` files.

## 2026-09-05 — Order projection select without seller photo bytes

- `Implemented`: `orderWithProductSelect` for `GET /api/orders` and `GET /api/orders/:publicId` loads Order snapshot scalars plus `listing.currency` and `product.title`/`publicId` only. `SellerProfile` (including `profilePhotoData`) and live `buyer`/`seller` joins are not selected. Replacement/recovery create TXs now use `sellerProfileHandoffSelect` (no photo bytes); see 2026-09-06 hydration note.
- Coverage: `orders.service.spec.ts` asserts `get` `findUnique` and list `findMany` use the same projection select (`listing.currency` + `product.publicId`/`title`; no `sellerProfile`, `buyer`, or `seller`).
- `Verified`: API orders unit 26/26; API typecheck; eslint on `src/orders`; PostgreSQL integration 71/71 including `seller-orders-inbox.integration.spec.ts` (2/2).

## 2026-09-05 — Seller Orders inbox

- `Implemented`: `GET /api/orders` lists the authenticated seller's non-cancelled Orders with `page`/`limit` (max 100). `sellerId` comes from the session, not the query. Admin is denied. Projection is the seller Order contract and reads frozen snapshot title/currency/product public id (`DEC-074`).
- `Implemented`: Expo `/(seller)/orders` (`/orders`) reuses Activity-style current UI with loading/empty/error/pagination. Linked from seller profile and the account menu. Not a Pen/Figma redesign.
- Coverage: `orders.service.spec.ts` list bounds and admin deny; `contracts.test.ts` rejects `sellerId` query; PostgreSQL `seller-orders-inbox.integration.spec.ts`; HTTP `seller-orders-inbox-http.integration.spec.ts` (guest 401, admin 403).
- `Verified`: contracts 27/27; API orders unit 22/22; API typecheck/lint on `src/orders`; mobile typecheck; PostgreSQL inbox 2/2 plus HTTP 2/2 in the 2026-09-06 73/73 suite.

## 2026-09-05 — Immutable Order deal snapshot

- `Implemented`: new Orders freeze `snapshotTitle`, `snapshotCurrency` and `snapshotProductPublicId` at create. `listingId` and `finalAmount` remain the Listing identity and price snapshot. `createWinnerOrder` and admin replacement load Listing/Product inside the create TX via `loadOrderDealSnapshot` / `createOrderSnapshot`. GET projections prefer frozen fields; historical null columns fall back to live Product/Listing. Additive Prisma only; old rows are not rewritten. Decision: `DEC-074`.
- Coverage: `order-snapshot.spec.ts`; `create-winner-order.spec.ts` create payload and fail-closed missing title; `orders.service.spec.ts` frozen vs live title; PostgreSQL lifecycle close, recovery and replacement including post-create Product title change.
- `Verified`: contracts 26/26; targeted API unit 20/20; API typecheck/lint on `src/orders`; mobile typecheck after api-client rebuild; PostgreSQL integration 19/19 (lifecycle, recovery, replacement).

## 2026-09-05 — Expired SCHEDULED listings (P0-D)

- `Implemented`: cron in `listing-lifecycle.service.ts` cancels `SCHEDULED` rows with `endsAt <= now` to `CANCELLED` + `closedAt`, audit reason `EXPIRED_SCHEDULED_WINDOW` (nullable `AuditEvent.actorUserId`), realtime `listing.updated`, no Order. Activation window unchanged. Decision: `DEC-073`.
- Coverage: `state-machine.spec.ts`; `listing-lifecycle.service.spec.ts`; PostgreSQL `lifecycle.integration.spec.ts` including missing-handoff expired windows and idempotent rerun.
- `Verified`: API typecheck/lint; lifecycle/state-machine unit; PostgreSQL integration 68/68 including expired SCHEDULED cancel.

## 2026-09-05 — Mutable image cache (QW-06)

- `Implemented`: `getImageCacheControl({ isPublic, kind })` in `apps/api/src/images/image-policy.ts`. Private remains `private, no-store`. Public Product images by id stay `public, max-age=31536000, immutable` because add/delete allocate a new id and do not replace bytes in place. Public seller photo (`/sellers/:slug/photo`) and creation-step (`/creation-steps/:stepId/image`) use `public, max-age=0, must-revalidate`.
- Coverage: parameterized `image-policy.spec.ts`; `images.controller.spec.ts` product + creation-step; `sellers.controller.spec.ts` photo; `media-transport.integration.spec.ts` product vs seller headers.
- `Verified`: API typecheck/lint; image/seller unit 35/35; PostgreSQL integration 66/66 including `media-transport`.

## 2026-09-05 — BY+RF lawyer pack (P0-B)

- `Superseded`: этот исторический BY+RF пакет удалён из рабочего дерева после
  `DEC-077`. Текущая юридическая работа ограничена Беларусью; исходная версия остаётся
  в Git. Актуальный список — `docs/legal/06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md`.

## 2026-09-05 — Expanded MVP product contract (P0-A)

- `Superseded` (product): the former `DEC-072` defaults were revised by
  `DEC-075`–`DEC-077`; they are not current implementation instructions.
- `Not implemented` (code): fixed-price Listing, optional offers, and `RUB` runtime. Current runtime remains `AUCTION` + `BYN`. Order snapshot (`DEC-074`) and seller inbox are in place; P0-E remains unstarted.
- Protected `01` / `08` / `09` were not rewritten. RFC §3, §9, §12, §14, §19 and §21 were updated to match `DEC-072`.

## 2026-09-05 — Rejected Product recovery (QW-04)

- `Implemented`: Product `REJECTED` is owner-editable on the same Product ID.
  `isEditableProductStatus` in `packages/contracts` now includes `REJECTED`
  alongside `DRAFT` and `CHANGES_REQUESTED`; `ProductsService.update` /
  `submit`, creation-story writes and `ImagesService` reuse that gate.
  `submit` moves `REJECTED → PENDING_REVIEW` atomically with an append-only
  `AuditEvent`; previous rejection reasons are not rewritten.
- `Implemented`: owner detail `GET /api/seller/products/:id` returns
  `lastModerationReason`. `ProductDraftScreen` hydrates the same form, shows the
  reason for `REJECTED`/`CHANGES_REQUESTED`, and resubmits without creating a
  new Product. Public catalog/direct predicates still require `APPROVED`.
  Admin cannot reopen `REJECTED` through the seller write path or the admin
  product status machine.
- Coverage: `products.service.spec.ts`, `images.service.spec.ts`,
  `sellers.service.spec.ts`, `admin-moderation.service.spec.ts`,
  `contracts.test.ts`, `product-draft-state.spec.ts`, PostgreSQL HTTP
  `rejected-product-recovery.integration.spec.ts`.
- `Verified`: contracts 15/15; targeted API unit 37/37; API unit 236/236;
  mobile helper 3/3; API lint; contracts/API typecheck; integration 2/2 plus
  related seller-permissions/moderation 6/6.
- Decision: **DEC-071**. RFC §6 records the owner resubmit loop.

## 2026-09-05 — Order contact deadline (QW-05)

- `Implemented`: shared `orderContactSchedule(now)` in `apps/api/src/orders/order-contact-deadline.ts` stores matching `createdAt` and 48-hour `contactDueAt` on every new auction Order. Lifecycle close and admin `createOrderForEndedListing` go through `createWinnerOrder`, which computes the schedule internally from `now` and cannot take a custom deadline. Manual replacement uses the same schedule once before publicId retry. Idempotent recovery returns the existing Order without extending the deadline. Historical Orders are not migrated. Seller 24/48/72 configuration is not added. `contactDueAt` remains a snapshot, not a `HANDOFF_FAILED` gate. Decision: `DEC-070`.
- Coverage: `order-contact-deadline.spec.ts`; `create-winner-order.spec.ts` asserts create payload schedule; lifecycle close asserts exact `closeAt + 48h`; recovery and replacement assert exact `contactDueAt - createdAt === 48h` and unchanged retry deadline.
- `Verified`: API typecheck, lint, build; API unit `233/233`; PostgreSQL integration `63/63` including lifecycle close, admin recovery and replacement.

## 2026-09-05 — Buyer Activity statuses (QW-02)

- `Implemented`: `packages/contracts/src/activity.ts` adds `CONTACTED` and `HANDOFF_FAILED`. `ActivityService` maps every Order status and LIVE/ENDED/SCHEDULED/CANCELLED Listing without Order; cancelled wins return `orderPublicId: null` while keeping the Product publicId.
- `Implemented`: Activity and product participation copy use `auctionParticipationLabels` (`Связались`, `Сделка не состоялась`, `Покупка отменена`). Order GET privacy for cancelled Orders is unchanged.
- Coverage: table-driven `activity.service.spec.ts`; cancelled-order navigation omission; `presentation.spec.ts` labels.
- `Verified`: contracts tests 23/23; API unit 265/265; API typecheck/lint; mobile presentation unit 12/12; mobile typecheck/lint.

## 2026-09-05 — HTTPS-only public seller links (QW-01)

- `Implemented`: `packages/contracts/src/primitives.ts` `httpsUrlSchema` is the shared HTTPS-only URL contract. Seller public write and response fields `socialLink`, `telegramUrl`, `instagramUrl` and `websiteUrl` in `packages/contracts/src/seller-profile.ts` use it. Mobile profile validation and creator-profile e2e reuse the same schema and HTTPS error copy.
- `Implemented`: Telegram/Instagram `@handle` and private PHONE handoff schemas are unchanged. Media URL resolution is unchanged.
- Coverage: parameterized contract tests for https vs `http`/`javascript`/`data`/`file`/relative/`ftp`; existing handle cases; `profile-validation.spec.ts`.
- `Needs verification`: Playwright `creator-profile.spec.ts` copy update is in tree; run against a live app when e2e is next executed.

## 2026-09-05 — Fail-closed environment matrix (QW-03)

- `Implemented`: `apps/api/src/core/config/env-profile.ts` centralizes production-like predicates. `APP_ENV=production` requires `NODE_ENV=production`; `NODE_ENV=production` cannot combine with `APP_ENV=local`. SMTP, service rules, `PASSWORD_RESET_URL_BASE`, 32-character `JWT_SECRET`, test-bypass prohibition, SMTP mail transport, secure session cookies and production service-rules text follow that profile.
- `Implemented`: `TEST_EMAIL_BYPASS` parses only for `NODE_ENV=test` and `APP_ENV=local`. Destructive demo seed still fails closed outside `NODE_ENV=development|test`, `APP_ENV=local` and `ALLOW_DESTRUCTIVE_DEMO_SEED=true`. Compose `app` profile now sets `APP_ENV=production`. Staging combinations are unchanged except that `NODE_ENV=production` plus `APP_ENV=staging` continues to require production security.
- Coverage: parameterized `env.spec.ts` matrix; `env-profile.spec.ts`; `rules.spec.ts`; `local-mail-transport.spec.ts`; cookie `secure` in `auth.controller.spec.ts`; seed denial includes `development`/`production` in `seed-contract.integration.spec.ts`.
- `Verified`: API typecheck, lint, build; API unit `260/260`; seed-contract PostgreSQL integration `5/5`.

## 2026-08-22 — ImageStore + MailTransport ports (review fixes)

- `Implemented`: `core/image-store/` — `ImageStore` port with `PostgresImageStore`;
  product/creation-step/seller photo bytes written via `put` and read via `get`.
- `Implemented`: seller photo and creation-step writes — meta update + `ImageStore.put`
  in the same Prisma transaction (`SellersService`, `ImagesService.addCreationStepImage`).
- `Implemented`: `ImagesService.add` — Sharp outside TX; SERIALIZABLE TX re-checks
  owner/capacity, then `create` + `ImageStore.put` per image.
- `Implemented`: `get` / `getCreationStepImage` — authz before `imageStore.get`;
  Prisma queries exclude binary columns.
- `Implemented`: `core/mail/` — unified `MailTransport` for OTP and password-reset.
- Coverage: `postgres-image-store.spec.ts`, `images.service.spec.ts`,
  `media-transport`, `image-upload-safety`, `password-reset` integration.
- `Verified`: API typecheck; API unit 228/228; targeted integration 5/5 (`media-transport`, `image-upload-safety`).

## 2026-08-22 — Release / backup / restore (P0-5)

- `Implemented`: pinned Node `22` (`.nvmrc`); root `test:unit` and `pnpm verify`
  (`db:generate` → typecheck → lint → unit → integration → build).
- `Implemented`: GitHub Actions [`.github/workflows/verify.yml`](../../.github/workflows/verify.yml)
  with PostgreSQL service container.
- `Implemented`: `GET /api/health/ready` — Prisma `SELECT 1` with 2s timeout; `503`
  when DB unreachable; liveness remains `GET /api/health` (`health.service.ts`,
  `health.service.spec.ts`). Playwright waits on `/api/health/ready`.
- `Implemented`: API `Dockerfile` (`pnpm deploy --prod` runtime layout),
  `docker compose --profile app` with production env from `.env`, ops runbook
  [`docs/ops/00-RELEASE-AND-BACKUP.md`](../ops/00-RELEASE-AND-BACKUP.md).
- `Implemented`: `scripts/ops/backup-db.sh`, `restore-db.sh`,
  `verify-restore-integrity.mjs` with `pnpm ops:backup|restore|verify-restore`;
  local restore drill to `bidplace_restore` verified counts + 5 image checksums
  (2026-08-22).
- `Verified`: `pnpm verify`; health/ready smoke; restore drill evidence in ops doc;
  Compose `app` profile image boot + `/api/health/ready` smoke (2026-08-22).
- `Implemented` (review polish): ready probe clears timeout in `finally`;
  Prisma `binaryTargets` for debian/linux-arm64 deploy engines; Compose omits
  empty `SMTP_USERNAME`/`SMTP_PASSWORD` unless `SMTP_AUTH_MODE=login`.
- Pilot P0-1…P0-5 closed. Remaining pre-pilot queue: P1 stuck SCHEDULED
  auto-rule and separate UI/release-gate items in status history.

## 2026-08-21 — Image upload TX boundary follow-up (P0-4 polish)

- `Implemented`: `ImagesService.add` runs authz, then Sharp normalize **outside**
  `runSerializableTransaction`; SERIALIZABLE TX only re-checks owner/capacity and
  persists normalized bytes.
- `Implemented`: Multer `fileFilter` returns `400 Unsupported image type` for GIF
  and other disallowed MIME types (not empty-upload wording).
- `Implemented`: animated WebP detection via metadata read with `animated: true`
  (`pages`/`delay` gate); unit fixture + `image-policy.spec.ts` coverage.
- `Implemented`: early `maxFiles` capacity gate before Sharp normalize when the
  product is already full (`images.service.ts`, `images.service.spec.ts`).
- Coverage: `images.service.spec.ts` (authz-before-decode spy), extended
  `image-policy.spec.ts`, `image-upload-safety.integration.spec.ts`.
- `Verified`: API typecheck; targeted unit + integration.

## 2026-08-21 — Image upload safety (P0-4) + admin incident guards

- `Implemented`: `ImagesService` validates ownership and approved-seller capability
  **before** Sharp decode/normalize. Controller accepts multipart byte limits only;
  `validateAndNormalizeProductImageUploads` runs in the service.
- `Implemented`: static-only policy — GIF and animated WebP/PNG rejected; max edge
  4096px and 16_777_216 pixels; sequential bounded normalize stores canonical JPEG/PNG
  bytes (`apps/api/src/images/image-policy.ts`).
- `Implemented`: upload rate limits (10/min per user) on product and creation-step
  image POSTs (`images.controller.ts`).
- `Implemented`: admin incident guards — cannot ban/revoke self or other admins;
  session revoke audit uses `oldStatus: session`, `newStatus: revoked`.
- `Implemented`: engineering owner doc [`13-APPLICATION-SECURITY.md`](13-APPLICATION-SECURITY.md);
  **DEC-068** in decision log.
- Coverage: `image-policy.spec.ts`, `image-upload-safety.integration.spec.ts`,
  extended `admin-user.service.spec.ts`, `admin-user-emergency.integration.spec.ts`.
- `Verified`: API unit + targeted integration; API/mobile typecheck.
- Remaining pilot P0: release/backup (P0-5) only. Stuck SCHEDULED auto-rule queue
  remains P1.

## 2026-08-21 — Emergency admin controls (P0-3)

- `Implemented`: `AdminUserService` with `GET /api/admin/users?email=`,
  `PATCH /api/admin/users/:id/status` (ban/unban + reason, ban increments
  `sessionVersion`), and `POST /api/admin/users/:id/revoke-sessions`.
- `Implemented`: `AdminListingEmergencyService` with
  `POST /api/admin/listings/:listingId/emergency-cancel` for `SCHEDULED|LIVE →
  CANCELLED` (bids preserved, no Order create, append-only `AuditEvent`, realtime
  `listing.updated`). Idempotent when already `CANCELLED`.
- `Implemented`: `AuditTargetType.USER` migration
  `20260821130000_add_audit_target_user`; contracts + `api-client` admin methods.
- `Implemented`: mobile admin tabs **Пользователи** (`AdminUsersPanel`) and
  **Восстановление** (`AdminRecoveryPanel`) — email lookup, ban/revoke, needs-order
  queue, emergency cancel by listing id.
- Coverage: unit `admin-user.service.spec.ts`, `admin-listing-emergency.service.spec.ts`,
  `state-machine.spec.ts`; PostgreSQL HTTP
  `admin-user-emergency.integration.spec.ts`, `admin-listing-emergency.integration.spec.ts`.
- `Verified`: API/mobile typecheck; targeted integration suites.
- Remaining pilot P0: ~~image limits (P0-4)~~, release/backup (P0-5). Stuck
  SCHEDULED auto-rule queue remains P1.

## 2026-08-21 — Password recovery (P0-2)

- `Implemented`: `PasswordResetModule` (`apps/api/src/password-reset/`) with
  `POST /api/auth/password/forgot` and `POST /api/auth/password/reset`.
  Forgot always returns neutral `{ ok: true }` (unknown email, banned user, SMTP
  failure after token create). Reset stores only `sha256(token)`, invalidates
  outstanding tokens, updates password hash and increments `sessionVersion` in
  one transaction.
- `Implemented`: shared SMTP helper in `apps/api/src/core/email/` used by OTP
  and password-reset transports; single-address recipient guard.
- `Implemented`: contracts `forgotPasswordRequestSchema` /
  `resetPasswordRequestSchema`, `ApiErrorCode.PASSWORD_RESET_INVALID`, and
  `api-client` auth methods.
- `Implemented`: mobile routes `(auth)/forgot-password` and
  `(auth)/reset-password` with feature forms, login link, localized invalid-link
  copy, and success → login (no auto-login).
- `Implemented`: `PasswordResetToken` persistence +
  `20260821120000_add_password_reset_tokens` migration; production requires
  `PASSWORD_RESET_URL_BASE`.
- Coverage: unit `password-reset.service.spec.ts`, `core/email/smtp-transport.spec.ts`;
  PostgreSQL HTTP `password-reset.integration.spec.ts` (neutral forgot, replay,
  session invalidation, second-forgot invalidates first token).
- `Verified`: API/contracts typecheck; API unit + integration; mobile schema
  unit for confirm-password mismatch.
- Review polish (2026-08-21): resend cooldown applies only to unused tokens;
  per-email forgot rate limit runs after active-user lookup; reset link base
  falls back to `resolveCorsOrigin()` in local dev; mobile forgot flow preserves
  `redirectTo`; local OTP/reset mail artifacts ignored via `.gitignore`.
- Remaining pilot P0: image limits, release/backup.

## 2026-08-21 — Irreversible auction close (P0-1)

- `Implemented`: `ListingLifecycleService.close` commits `LIVE → ENDED` in its
  own SERIALIZABLE transaction, emits `listing.ended`, then creates the winner
  Order via `createWinnerOrder` in separate short-lived transactions. Generic
  Order failures leave `ENDED` without Order and are logged; they no longer roll
  back the close.
- `Implemented`: shared `createWinnerOrder` helper
  (`apps/api/src/orders/create-winner-order.ts`) for close and admin recovery.
  Each create attempt is its own SERIALIZABLE TX. On `P2002`, classification uses
  `getPrismaUniqueConstraintTargets` **after** the failed TX ends: `public_id`
  retries with a new id; `source_bid_id` resolves via a fresh root
  `findUnique` to `already_exists`. Exhausted publicId attempts throw without
  undoing `ENDED`. Admin recovery writes its AuditEvent in the same TX as create
  via optional `onCreated`.
- `Implemented`: cron `run()` isolates activate/close per Listing so one failure
  does not stop the remaining expired queue.
- Ranking and admin recovery API unchanged; no new Listing statuses, queues, or
  outbox.
- Coverage: unit `create-winner-order.spec.ts` (fresh-TX retry mocks), lifecycle
  cron isolation; PostgreSQL real `orders_public_id_key` collision → retry → one
  Order; secondary generate-throw → `ENDED` + admin recovery
  (`lifecycle.integration.spec.ts`); `order-recovery.integration.spec.ts` green.
- `Verified`: API typecheck; eslint on touchpoints; API unit helper/lifecycle;
  auction PostgreSQL integration under `test/integration/auction/`.
- Remaining pilot P0 (image limits, release/backup) are unchanged.

## 2026-08-20 — Admin Order recovery for ended Listings

- `Implemented`: admin path for `Listing=ENDED`, Bids present, Order absent:
  `GET /api/admin/listings/needs-order` and
  `POST /api/admin/listings/:listingId/create-order`.
- `Implemented`: `OrdersService.listEndedWithoutOrder` and
  `createOrderForEndedListing` (SERIALIZABLE). Winner is re-read from canonical
  Bid ranking (`amount DESC`, `createdAt ASC`, `id ASC`). Existing non-cancelled
  Order is returned unchanged; cancelled-only history conflicts; no Bids or
  missing handoff conflicts. Repeated retry does not duplicate Orders.
- Auction state / winner semantics at close were not changed; no new Listing
  statuses, queues, outbox, or workflow engine.
- Contracts: `adminListingNeedsOrderItemSchema`,
  `adminListingsNeedingOrderResponseSchema`,
  `adminCreateListingOrderResponseSchema`. Client methods on `@bidplace/api-client`.
- Coverage: `apps/api/test/integration/auction/order-recovery.integration.spec.ts`.
- `Partial` (superseded 2026-08-21): recovery API was complete, but close could
  still roll back `ENDED` on generic Order create failure until the two-step
  close fix.
- `Verified`: API typecheck; API unit `178/178` (orders filter); auction
  PostgreSQL integration including recovery (all passed under `auction/`);
  eslint on recovery touchpoints.

## 2026-08-20 — Analytics foundation + admin dashboard

- `Implemented`: first-party analytics ingest (`AnalyticsEvent`,
  `AcquisitionAttribution`), request `X-Request-Id` + request logging,
  `POST /api/analytics/events`, and `GET /api/admin/analytics/overview`.
- `Implemented`: mobile anonymousId / first-touch / identify / logout reset and
  funnel events `listing_viewed`, `seller_viewed`, `registration_started`,
  `bid_cta_clicked`, `bid_rejected` (no impressions/search/`bid_accepted`).
- `Implemented`: admin UI `/admin/analytics` (overview, acquisition, funnels,
  marketplace health, growth, recent activity, needs attention); linked from
  account menu and moderation. Public seller profiles now expose `id` for
  stable `seller_viewed` joins.
- `Implemented`: docs `analytics-contract.md`, `analytics-metrics.md`, `DEC-067`.
- `Partial` vs `05-MVP-RFC.md` §16: remaining planned names
  (`email verification*`, `participation viewed`, `auction closed`, handoff
  outcomes) stay DB-derived or deferred; not duplicated as analytics events.
- `Verified`: API unit `178/178`, mobile unit `201/201`, contracts `13/13`,
  API/mobile typecheck and lint.

## 2026-08-19 — Post-refactor hardening

## 2026-08-20 — Auction core concurrency and close hardening

- `Implemented`: `BidsService.place` retries CAS `LISTING_CHANGED` up to 3 times
  with full re-validation against a fresh Listing snapshot; `LISTING_CHANGED`
  remains only after retries are exhausted.
- `Partial` (corrected 2026-08-21): earlier claim that Order creation was
  best-effort inside the same close transaction was wrong for generic
  `Order.create` failures (they rolled back `ENDED`). Two-step close now matches
  the intended invariant; see 2026-08-21 entry.
- `Implemented`: schedule/activation require seller handoff contact; activation
  cron also filters on non-null handoff fields.
- `Implemented`: auction business integration suites live under
  `apps/api/test/integration/auction/` (bidding, lifecycle, soft-close) with
  Listing/Bid DB invariants after concurrent scenarios.
- Error contract / business codes were not changed in this pass.
- `Verified`: API unit `167/167`, PostgreSQL integration `46/46`, API
  typecheck/lint. E2E not re-run in this pass.

## 2026-08-20 — API error contract for bidding

- `Implemented`: unified API errors keep `{ status, code, message, details? }`.
  Category codes remain the default for plain Nest exceptions; bidding now throws
  `AppException` with stable business codes (`BID_TOO_LOW`, `LISTING_NOT_OPEN`,
  `SELF_BID_FORBIDDEN`, `ADMIN_BID_FORBIDDEN`, eligibility and idempotency codes,
  `LISTING_CHANGED`, `LISTING_NOT_FOUND`). `BID_TOO_LOW` includes `details.minimumBid`.
- `Implemented`: `ApiExceptionFilter` honors explicit codes/details, maps Zod
  validation to `validation_error`, and masks unexpected exceptions as
  `internal_error`. Shared `ApiErrorCode` lives in `packages/contracts`;
  `@bidplace/api-client` parses codes and exposes `getBidTooLowMinimum`.
- `Implemented`: Product bid UI branches on `ApiErrorCode.BID_TOO_LOW` instead of
  HTTP 400 + message heuristics.
- Bid placement rules, soft close and auction lifecycle were not changed.
- `Verified`: contracts `13/13`, api-client `2/2`, API unit `166/166`, API
  typecheck/lint, mobile typecheck, PostgreSQL integration `40/40`.

## 2026-08-19 — Post-refactor hardening

- `Implemented`: Product Creation step-1 validation keeps a unique field error
  (`Введите название`) and a distinct form-level summary
  (`Проверьте обязательные поля`) so screen readers and Playwright are not
  given two copies of the same live text. Coverage is in
  `product-draft-wizard.spec.ts` and `product-creation-wizard.spec.ts`.
- `Implemented`: desktop account-menu Escape stays closed until the pointer
  leaves the trigger; the Playwright hover suite now leaves the trigger before
  reopening. Overlay dismiss listeners no longer resubscribe every render.
- `Implemented`: `components/layout/index.ts` no longer re-exports the pure
  hover delay constant. Node/Playwright imports
  `account-menu-hover.ts` directly.
- `Verified`: mobile typecheck/lint, mobile unit `195/195`, API typecheck,
  API unit `158/158`, PostgreSQL integration `40/40`, focused Playwright
  `11/11` (account menu + wizard) with the three former failures repeating
  `30/30`, and the full disposable Chromium suite `49/49`.

## 2026-08-16 — Desktop account menu hover items

- `Implemented`: desktop account dropdown hover tracking uses `pointerenter` /
  `pointerleave` on the portal surface instead of a nested `Pressable` hover
  wrapper. Hovering Кабинет, Модерация or Выйти no longer schedules a dismiss.
  Coverage is in `account-menu-hover.spec.ts` (unit + Playwright).

## 2026-08-19 — Phase 7 screen splitting cleanup

- `Implemented`: Phase 7 component extraction keeps the same screen behavior while
  making screens orchestration-only (public seller, admin moderation, seller
  profile steps, and seller product-draft wizard steps). Verified with
  `pnpm --filter @bidplace/mobile typecheck`, `lint`, and `vitest` passing.

## 2026-08-19 — Phase 8 API products mapper/catalog query split

- `Implemented`: moved `publicCatalogProductSelect` and `toCreationStepContract`
  into `apps/api/src/products/products.mapper.ts` and updated sellers imports
  accordingly.
- `Implemented`: moved the canonical-listing CTE, status-aware catalog sort,
  and LIKE escaping (`publicCatalogCte`, `publicCatalogOrderBy`,
  `escapeLikePattern`) into `apps/api/src/products/products-catalog.query.ts`,
  keeping SQL behavior unchanged.
- `Verified`: `pnpm --filter @bidplace/api typecheck`, `lint`, unit `test`
  and integration `test:integration` passing.

## 2026-08-13 — Product Creation contract and E2E determinism

- `Implemented`: Product submit, moderation and public visibility now share the
  confirmed creator-made Product requirement boundary from `05-MVP-RFC.md`
  section 11 and `DEC-044`. `condition` and `packaging` remain supported
  nullable metadata but no longer block submission or public projection;
  `deliveryInfo` and the other confirmed required fields remain enforced. The
  shared public Product contract accepts the existing nullable representation.
- `Implemented`: Product Creation writes the selected wizard step to the URL,
  restores it after reload and keeps the author on the creation-story step after
  saving so a newly persisted step can receive its process photo before an
  explicit move to review. Image-picker read failures are visible and do not
  silently discard the selected operation.
- `Implemented`: the Playwright API web server builds the API workspace
  dependency graph before startup, preventing stale compiled contracts from
  being loaded with current application source. A 12-minute global watchdog
  prevents a stalled full suite from running indefinitely. Core public-route
  E2E now rejects legacy React Native Web `shadow*`, `pointerEvents` and
  `useNativeDriver` warnings.
- `Verified`: API unit `158/158`, mobile unit `156/156`, contracts `12/12`,
  PostgreSQL integration `40/40`, API/mobile typecheck and lint, Product
  Creation Playwright `1/1`, responsive Wave A `3/3`, core route/console Wave
  One `5/5`, the full disposable Chromium suite `38/38`, and Expo production
  export for web/iOS/Android pass. Fresh Product and Creator captures were
  inspected at 1440/1024/390. Matched Pen overlay, native device, screen-reader
  and founder acceptance remain `Needs verification`.

## 2026-08-12 — Final Pen v2 review blockers

- `Implemented`: public creator work pagination now preserves `status`/`sort`, loads additional server pages through `useInfiniteQuery`, and exposes loading/retry states in `apps/mobile/src/features/sellers/public-seller-screen.tsx`.
- `Implemented`: `SellersService.getPublic` applies canonical listing selection, filtering, ordering, counts and `LIMIT/OFFSET` in PostgreSQL before hydrating `publicCatalogProductSelect`; public lists do not select `ProductImage.data`. Coverage is in `apps/api/test/integration/seller-pagination.integration.spec.ts` and `apps/api/src/sellers/sellers.service.spec.ts`.
- `Implemented`: bid CTA eligibility is derived from the authenticated session and current rules response in `apps/mobile/src/features/auth/email-rules-gate.tsx` and `email-rules-eligibility.ts`; guests receive the login return route, admins remain excluded, and unavailable email/rules states do not expose an active bid action.
- `Implemented`: `AmbientImageBackground` uses the shared Expo `LinearGradient` primitive with explicit stops and a bounded 1.1× clipped media overscan; `apps/mobile/src/components/ui/ambient-image-background-style.spec.ts` covers the geometry contract.
- `Implemented`: Product About accordion rows close on repeated activation through one shared toggle helper with semantic expanded state.
- `Verified`: API unit `154/154`, mobile unit `143/143`, contracts `11/11`, API/mobile/database typechecks, API/mobile lint, PostgreSQL integration `40/40`, and the full disposable Chromium Playwright suite `38/38` pass on 2026-08-12. The five prior Playwright failures were corrected in the responsive Wave 2/Wave B evidence flows, product scroll assertion, and Wave C responsive selectors.
- `Partial`: all requested Final Pen v2 flows now have staged runtime implementations and browser evidence; matched Pen overlay comparison, native/device accessibility, and founder acceptance remain open. The canonical Pen baseline is the attached SHA recorded in the implementation audit.
- `Verified`: fresh Wave 2 catalog captures at 1440/1024/390 now reset the production catalog scroll container before capture, preserving the Pen frame's filters, title, state toolbar and grid in the evidence. The full Playwright suite remains `38/38` after this verification fix.
- `Partial`: final Pen v2 mobile header implementation now exists in `apps/mobile/src/components/layout/MobileHeader.tsx` and is selected below the shared 768px breakpoint. It provides the canonical 72px logo/Search/Create/Menu row, route-aware search/menu states, focus return and role-aware Create/Cabinet navigation. Runtime screenshots and browser/native accessibility acceptance remain pending.
- `Partial`: final Pen v2 auction participation now uses `SlideToBid` in `apps/mobile/src/components/ui/SlideToBid.tsx`. Product detail refetches the auction snapshot before confirmation, validates against the fresh minimum, and preserves the existing server/idempotency mutation. Unit `128/128` and targeted buyer/integrity Playwright `2/2` pass; full visual/device/accessibility acceptance remains pending.
- `Partial`: final Pen v2 Product Creation now has a staged `ProductDraftScreen` flow: draft description, 1–10 images, persisted creation story/process photos, review and moderation submit. The owner-only `GET /api/seller/products/:id` detail route hydrates `creationIntro`, ordered `creationSteps` and process-photo metadata before the wizard initializes; local empty state is not persisted while that detail is loading. The reload/save regression and full Playwright `38/38` pass; matched Pen overlay, native picker and accessibility acceptance remain pending.
- `Partial`: final Pen v2 mobile menu uses the shared `getMobileMenuWidth` contract (`min(320px, viewport - 32px)`) with 320/375/390 coverage in unit and browser tests. Visual/device/accessibility acceptance remains pending.
- `Partial`: final Pen v2 Creator Profile Creation now stages public identity, structured public links, profile photo, private handoff data and a public-only review before submit in `apps/mobile/src/features/sellers/seller-profile-screen.tsx`. Telegram, Instagram, website and handoff validation reuse shared contract schemas, show field-local errors and block progression while the server remains authoritative. Targeted creator profile Playwright coverage passes; visual/device/accessibility acceptance remains pending.
- `Partial`: final Pen v2 Admin Moderation now separates Authors and Works queues with search/status filters, filtered empty states, existing reasoned confirmations and server-owned status decisions in `apps/mobile/src/features/admin/admin-moderation-screen.tsx`. Targeted admin Playwright `1/1` passes; full responsive state screenshots and device/accessibility acceptance remain pending.

Последнее обновление: 2026-08-12
Статус: Public discovery completion is Partial; trust-critical backend
boundaries remain Implemented; founder visual/device/screen-reader acceptance,
full metadata migration and isolated 10-user rehearsal remain Needs
verification.

## Canonical Pen v2 design direction — 2026-08-10

- `Implemented` as documentation: `docs/design/00`–`07` is rebuilt as the
  canonical Pen-led design module. The former `docs/modern-ui/` design system
  and the old screen-prompt workflow are retired and removed.
- `Confirmed`: `design/pen/bidplace-web-v2.pen` is the immutable visual
  reference for UI implementation. Code work must never edit, delete, rename,
  move, replace, format, or resave it; only a separately authorized design task
  may change it, and it must never be deleted. See `DEC-062`.
- `Implemented` as protected source restoration: the founder-provided local
  file is restored byte-for-byte at `design/pen/bidplace-web-v2.pen`; SHA-256 is
  `685bc2dee4ca643869e678378bf849ab3189c4072b417670df6c64fa6c3181cf`.
  Canonical roots and the public read-only Pen publication were verified without
  modifying the canvas.
- `Implemented` as specification: selected Foundation/Gamma/Avant Arte patterns,
  card hover, button/menu/tab/sticky motion, artwork-derived blur/atmosphere and
  reduced-motion rules are recorded in design docs. These references do not add
  wallet/NFT/crypto or unsupported marketplace behavior.
- `Partial`: production UI uses Pen v2 foundation for GlobalHeader, Browse
  Works, Product states, Creator Profile, auth, seller editors and supporting
  routes. Public Home, Authors and Search routes now exist; matched visual,
  device and screen-reader acceptance remain open.
- `Partial`: Home/Works routing, Authors directory/API and discovery
  search/filter/sort contracts are implemented in `apps/api/src/discovery`,
  the Product/Seller services and the corresponding mobile routes. Creation
  process data and structured public social links are implemented and projected;
  matched visual/device acceptance remains open. `SellerProfile.discipline` is
  persisted and projected for public CreatorCard/profile surfaces.
- `Verified`: semantic tokens, Onest/Inter runtime loading, 1440/1024/390
  compositions, focused accessibility behavior, Product deep-link/back tabs,
  related public works, E2E and production Expo export. Founder/device visual
  acceptance remains a release gate.
- `Verified`: local/test discovery seed imagery covers eight distinct public
  catalog cards, with source attribution in
  `packages/database/prisma/fixtures/README.md`; the browser matrix confirms
  distinct main image sources without runtime dependence on external URLs.

## Pen v2 content and public-profile contracts — 2026-08-11

- `Implemented`: public Creator Profile detail now returns server-owned
  `statusCounts` for the visible `LIVE`/`SCHEDULED`/`ENDED` listings through
  `packages/contracts/src/public-seller.ts` and
  `apps/api/src/sellers/sellers.service.ts`; the profile UI renders those
  counts without exposing private seller or bidder data. API unit, contract,
  and seeded browser checks pass. Founder visual/device/screen-reader
  acceptance remains a separate release gate.

- `Implemented`: Product image contracts now carry nullable `width`/`height`,
  and `ProductCreationStep` stores validated process text plus optional image
  metadata/data behind the migration
  `packages/database/prisma/migrations/20260811010000_add_pen_v2_content_data`.
  Public Product detail returns `creationIntro` and ordered `creationSteps`
  with image URLs only; binary data remains outside JSON responses.
- `Implemented`: seller profiles persist structured nullable
  `telegramUrl`/`instagramUrl`/`websiteUrl` fields and public author detail
  returns only those public links plus paginated server-side works. Existing
  handoff contact and email fields remain private.
- `Implemented`: public catalog responses expose server-computed discovery
  facets for listing status, category, author, material and uniqueness, with
  confirmed price ranges carried through the URL-backed query contract.
  Product and creator work queries are filtered, sorted and paginated in the
  API rather than derived from a client page slice.
- `Implemented`: owner-only creation-story replace/reorder and creation-step
  image upload/read routes enforce approved-seller, editable-product and
  public-visibility boundaries in `apps/api/src/products` and
  `apps/api/src/images`; contract, API unit and PostgreSQL integration checks
  remain required evidence for the final visual release.
- `Partial`: Pen v2 screen composition is implemented through the shared shell;
  matched visual/runtime acceptance at 1440/1024/390 remains open. The canonical file
  `design/pen/bidplace-web-v2.pen` is locked at SHA-256
  `03798831d76992080d4edebf53c4c264f8f9754e01bbe81965083f271148d2a9`.
- `Implemented`: Browse Works and Browse Authors now use the shared Pen v2
  header/card primitives and server-backed category/material/status/sort state;
  the Works toolbar exposes a separate URL-backed `Статус` facet while the
  state tabs use the same source of truth. The Authors header context is
  `Авторы` / `Работы` with the cross-discovery search placeholder. Exact visual parity and
  responsive/device acceptance remain `Needs verification`.
- `Implemented`: Product hero uses the Pen three-region layout at desktop
  pressure, the compact AuctionPlayer keeps one bid mutation owner, and the
  Creation tab renders ordered API-backed intro/steps with safe process-image
  URLs. Bid validation, role restrictions and privacy behavior remain covered
  by the existing Product/Auction contracts and tests.
- `Verified`: the guarded Creation seed supplies four distinct process-image
  sources, and Product detail moves the same controlled AuctionPlayer between
  inline and fixed desktop placement after the hero scroll threshold. Product
  E2E covers the transition and restoration without changing bid ownership.
- `Implemented`: Public creator profile `/seller/[slug]` uses only the founder
  selected `MqUMz` frame, renders structured public links when present, and
  fetches status/sort/paginated works server-side. Private handoff contacts and
  user email remain outside the public projection.
- `Implemented`: the Product mobile reading flow keeps the shared validated bid
  form available alongside the sticky bottom action; the same mutation owner
  is used at desktop and mobile breakpoints. Creator status controls wrap at
  390px without horizontal document overflow.
- `Implemented`: the public Product share control now copies or shares the
  current Product URL with bounded Web/native fallbacks and visible result
  state. Discovery menus close through Escape/outside interaction, and Creator
  status controls expose semantic tablist/tabpanel relationships; mobile
  typecheck/lint and Product E2E pass.
- `Implemented`: Product About composes the canonical text, characteristics,
  packaging, payment/delivery and author sections from existing public Product
  and SellerProfile fields, with explicit honest states for unsupported details;
  Product layout E2E asserts the required anatomy.
- `Implemented`: public Creator Profile no longer maps the legacy `socialLink`
  into a website control; only structured public social fields are rendered,
  preserving the handoff-contact boundary.
- `Implemented`: Product About and public Creator Profile now receive one
  shared shell-level image-derived atmosphere. The public artwork/profile-photo
  URL is used only for a decorative blurred layer with neutral veil, lower fade,
  safe fallback and reduced-motion-aware appearance; no private fields or image
  binary data enter the UI. Fixed-scale visual and founder/device acceptance
  remain `Needs verification`.
- `Verified`: guarded local/test seed data now provides twelve public products
  and eight works for the primary public creator profile, with deterministic
  local media and `LIVE/SCHEDULED/ENDED` listing coverage. This supports the
  selected Creator Profile density without changing production contracts.

## Public discovery WIP — 2026-08-11

- `Implemented`: `packages/contracts/src/discovery.ts` defines normalized
  public query input/output, status, material, price/year and server sort
  contracts; contract tests cover defaults, trimming, unknown keys, length and
  invalid ranges.
- `Implemented`: `GET /api/discovery/home` returns separate top-auction,
  creator and new-work projections. Product and seller list services select the
  canonical public Listing before server-side filtering, sorting and
  pagination; the client no longer derives Home rankings from a page slice.
- `Partial`: `/`, `/works`, `/authors` and `/search` consume real API data and
  expose loading, empty and retry states. URL-backed Works status/sort controls,
  account popover and bottom-start discovery geometry are implemented, but
  matched 1440/1024/390 screenshots, physical-device QA and full accessibility
  acceptance remain open.
- `Implemented`: `CreatorCard` now follows the Pen anatomy by removing the
  outer card surface, CTA and unsupported work count. `SellerProfile.discipline`
  is persisted through the `20260811000000_add_creator_discipline` migration
  and returned by public/profile contracts; visual acceptance remains open.
- `Implemented`: local SMTP configuration accepts explicit `SMTP_AUTH_MODE`
  (`none` or `login`), treats empty local relay credentials as absent, omits
  Nodemailer auth in `none` mode, requires an explicit production auth mode and
  keeps production TLS/credential checks.
  Coverage is in `apps/api/src/core/config/env.spec.ts` and
  `apps/api/src/otp/otp.service.spec.ts`.
- `Implemented`: public Product discovery now selects canonical listing rows and
  applies filtering, ranking, count and `LIMIT/OFFSET` in PostgreSQL before
  hydrating the requested page. Catalog hydration uses explicit projections and
  does not select `ProductImage.data`; `endingSoon` ranks LIVE/SCHEDULED before
  ENDED and `newest` uses `publishedAt`.
- `Implemented`: `/api/sellers` now accepts only its supported `q`, pagination
  and `activity`/`name` sort contract. Discipline writes and responses share a
  `.max(160)` contract matching the database column.
- `Implemented`: desktop account-menu keyboard open moves focus to Cabinet (or
  Logout when Cabinet is unavailable); navigation and discovery Playwright
  expectations now use the current IA and `/api/discovery/home` interception.
- `Verified`: guarded local/test demo data now provides eight public products
  across scheduled/live/ended states, multiple author/price/uniqueness
  values, and eight approved creators with local thematic PNG media. Full
  Chromium E2E passes `35/35`; mobile unit,
  typecheck, lint and E2E fence also pass. Founder visual/device and
  screen-reader acceptance remain release gates.
- `Verified`: PostgreSQL integration `39/39`, full Chromium E2E `35/35`, mobile
  unit/typecheck/lint and E2E fence pass on the disposable local test database.

## Pen v2 completion and backend/security audit — 2026-08-10

- `Implemented`: Product tabs now use URL state (`about`, `creation`, `bids`)
  with deep links and browser-back restoration; semantic selected state is
  explicit. Product About reuses a shared `AuctionCardGrid` for real public
  works from the same author and never invents recommendation ranking.
- `Implemented`: public Bid history, Product images and realtime Listing joins
  now share the approved Product + approved SellerProfile visibility boundary.
  Non-public media is not marked with public immutable caching.
- `Implemented`: Product image count and aggregate-byte limits are enforced
  inside a serializable transaction across repeated/concurrent uploads, not
  only per multipart request.
- `Implemented`: public bidder aliases are deterministic within one Listing and
  differ between Listings; public UI no longer exposes or reuses a `userId`
  prefix. Duplicate SellerProfile/slug races map to a stable conflict response.
- `Verified`: monorepo typecheck 7/7, lint 2/2, contracts 7/7, API unit 145/145,
  mobile unit 113/113, PostgreSQL integration 39/39, Chromium Playwright 35/35,
  E2E fence and production build 7/7 including web/iOS/Android export.

## Test/demo author media — 2026-08-05

- `Implemented`: the local/test-only seed now uses the supplied 740×493 PNG for the approved demo author `Анна Морозова` (`anna-morozova`); anonymous `GET /api/sellers/:slug/photo` is intentionally allowed for approved public profiles, and the seeded Chromium test verifies both the direct guest HTTP response and the rendered natural dimensions. Existing databases must be re-seeded explicitly to replace the former transparent 1×1 row. Pending moderation fixtures continue using the technical 1×1 placeholder.

## Resilient remote media — 2026-08-05

- `Implemented`: `apps/mobile/src/components/ui/ResilientRemoteImage.tsx` centralizes public and seller/admin remote-image loading. It shows the existing layout-preserving placeholder on failure, retries at 1/3/8 seconds with a bounded three-retry schedule, changes the request URL/key for each retry, resets on successful load or URL change, and exposes a final `Повторить` action after the automatic retry budget is exhausted. Local `ImagePicker` previews remain outside this network retry path.
- `Implemented`: `apps/mobile/src/components/ui/media-recovery.ts` owns the retry state machine, cache-bust URL construction and query-string-free diagnostic sanitization. Development failures emit structured `media_load_failed` records without cookies, tokens or other URL query credentials.
- `Implemented`: AuctionCard, ProductGallery, public AuthorPhoto, admin Product media and remote seller/Product-draft previews use the shared component. `apps/mobile/e2e/media-resilience.spec.ts` covers first guest opening, aborted media fallback and sanitized diagnostic logs; the state-machine suite covers bounded retries, success, URL reset, cache-bust behavior and manual recovery.
- `Verified`: mobile typecheck/lint, media recovery unit 5/5 and targeted Chromium media resilience 2/2 passed on 2026-08-05. The API media terminal `@Res()` fix remains separate and unchanged.

## Wave 1 — trust-critical Order flows and test-only seed boundary — 2026-08-05

- `Implemented`: `apps/api/src/orders/orders.service.ts` and the existing controllers now enforce actor roles at the service boundary. Seller `contacted`, `completed` and `handoff-failed` transitions retain the existing statuses and payloads, while terminal repeats are rejected without a second audit event.
- `Implemented`: `apps/api/test/integration/order-mutations.integration.spec.ts` and `order-replacement.integration.spec.ts` run isolated PostgreSQL fixtures through the public OrdersService boundary. They cover allowed/forbidden seller, buyer, outsider and admin actors, cancellation reasons, terminal/repeated calls, privacy/contact snapshots, ranked Bid replacement, original Order history, append-only audit actor/status/reason/timestamp fields and the one-active-Order invariant.
- `Implemented`: `apps/mobile/e2e/order-handoff.spec.ts` uses the existing seller Order route and action, then reads the authenticated API projection to verify the persisted `CONTACTED` status. No UI route or product behavior was added.
- `Implemented`: `packages/database/prisma/seed.js` fails closed unless `NODE_ENV` is `development` or `test`, `APP_ENV=local` and `ALLOW_DESTRUCTIVE_DEMO_SEED=true`. `apps/api/test/integration/seed-contract.integration.spec.ts` executes the seed against a temporary PostgreSQL schema and verifies Bid count, current prices, counters, winner, buyer identity, one Order and production-like denial with no writes. `DEC-060` is Confirmed; demo Bids remain local/test-only and must be removed or replaced before real MVP release.
- `Verified`: API unit 136/136, contracts 7/7, PostgreSQL integration 20/20, API/mobile lint, API/database/mobile typecheck and Chromium Playwright 29/29 passed on 2026-08-05.

## Wave 2 — auction integrity: stale bid, scheduled bid, soft close — 2026-08-05

- `Implemented`: `apps/api/test/integration/auction-integrity.integration.spec.ts` exercises the ordinary buyer `BidsService` boundary against isolated PostgreSQL fixtures. It proves that a `SCHEDULED` Listing rejects a direct Bid without changing Listing timestamps, price, count, Bid history, audit state or realtime emission.
- `Implemented`: the same PostgreSQL suite creates one canonical snapshot for two buyers, accepts Buyer A's higher Bid, rejects Buyer B's stale minimum with the canonical server minimum, accepts the refetched retry, verifies two-Bid history, current price, count, winner Order and idempotent replay, and proves rejected writes leave persisted state unchanged.
- `Implemented`: PostgreSQL coverage proves the soft-close window is exclusive outside 60 seconds and inclusive at 60 seconds, persists each extension with the accepted Bid, supports the next Bid against the extended deadline, caps total extension at 600 seconds from `originalEndsAt`, rejects the cap boundary without writes, and closes only after the persisted extended deadline.
- `Implemented`: `apps/mobile/e2e/auction-integrity.spec.ts` proves the real Chromium reject → refetch → retry flow through the existing buyer UI and API. The test uses two ordinary verified buyers, confirms the stale attempt, observes the server error and canonical `11.50 BYN` minimum, retries successfully, and verifies API current price, bid count and history. Realtime is isolated only in Buyer B's test context so the initial snapshot remains genuinely stale; no production UI or contract change was made.
- `Verified`: API unit 136/136, API PostgreSQL integration 25/25, API/mobile lint, API/mobile typecheck and targeted Chromium Playwright 1/1 passed on 2026-08-05. No confirmed MVP rule or architecture boundary was changed.

## Wave 3 — core permission, moderation and lifecycle coverage — 2026-08-05

- `Implemented`: `apps/api/test/integration/seller-permissions.integration.spec.ts` runs real HTTP requests through the Nest app, session cookie, `BearerAuthGuard`, controllers, capability checks and PostgreSQL. Guest, ordinary buyer, pending/changes-requested/suspended owners, approved owner and another approved seller are covered for Product, Listing, ProductImage and SellerProfile writes, including denied Listing `PATCH` and image `DELETE`; pending/changes-requested/suspended cases target their own fixture Listing and ProductImage so the status gate is exercised before any ownership ambiguity. Denied paths compare persisted Product, Listing, ProductImage, SellerProfile and AuditEvent state before and after.
- `Implemented`: `apps/api/test/integration/moderation.integration.spec.ts` proves normalized seller application persistence and the existing admin SellerProfile/Product state machines, including SellerProfile `REJECTED`, Product `REJECTED`, accepted Product `ARCHIVED` and active-listing archive lock denial. Accepted transitions persist actor, old/new status, required reason and exactly one append-only AuditEvent; repeated, reasonless and scheduled/live-listing-blocked transitions leave persisted state unchanged.
- `Implemented`: `apps/api/test/integration/auth-transport.integration.spec.ts` proves HTTP registration normalization, session cookie and `/auth/me`, duplicate no-write behavior, allowed-origin login, HttpOnly/SameSite/Path/TTL cookie attributes, logout cookie clearing and session-version invalidation, stale/invalid session rejection and allowed/forbidden CORS response behavior. `apps/api/src/bootstrap.ts` is the shared HTTP configuration used by production `main.ts` and the integration helper, so CORS/proxy tests use the production bootstrap path.
- `Implemented`: `apps/api/test/integration/lifecycle-close.integration.spec.ts` proves no-bid close without winner/Order, canonical equal-amount/equal-timestamp tie ordering, aligned persisted Order/realtime event state and idempotent repeated close.
- `Verified`: API typecheck/lint, unit 136/136, PostgreSQL integration 37/37, mobile typecheck/lint, relevant Chromium Wave 3 5/5, full Chromium E2E 30/30 and `git diff --check` passed on 2026-08-05. No production product rule, status machine, API contract, UI or seed behavior changed.

## Runtime media and moderation hardening — 2026-08-05

- `Implemented`: `apps/api/src/images/images.controller.ts` and `apps/api/src/sellers/sellers.controller.ts` use terminal `@Res()` handling for manual binary responses. `apps/api/test/integration/media-transport.integration.spec.ts` requests an approved Product image and public SellerProfile photo anonymously, verifies `200`, `image/png` and exact bytes, then makes another API request after each response to cover the server lifecycle after media delivery.
- `Implemented`: `apps/mobile/src/features/admin/admin-moderation-screen.tsx` disables Product approval until the related SellerProfile is `APPROVED`, shows `Сначала одобрите автора`, refreshes both moderation queues after SellerProfile approval, and reports Product mutation errors according to the actual action. A new action clears the previous error state.
- `Implemented`: `apps/mobile/src/components/ui/AppDialog.tsx` expresses `pointerEvents` through the style object, removing the web warning without changing dialog behavior.
- `Verified`: API unit 136/136, PostgreSQL integration 38/38, mobile typecheck/lint, and the relevant Chromium moderation scenario 5/5 passed on 2026-08-05. No product rule, API contract, seed behavior or architecture boundary changed.

## Wave A — structural responsive fixes — 2026-08-02

- `Implemented`: A1 centralizes the confirmed responsive contracts in `packages/design-tokens/src/modern.ts`: desktop shell `1025`, catalog columns `900`/`1440`, rail width `72`, product portrait ratio `4/5` and the existing product detail measure `1180`. `AppShell`, `AppHeader`, Catalog and Product consumers use these shared values; `catalog-layout.spec.ts` covers 899/900/1024/1025/1439/1440 boundaries.
- `Partial`: A2 now portals the web account menu at every viewport, clamps its bottom-end geometry to an 8px viewport inset, returns focus to the trigger on Escape, and gives dialogs modal layer 30 with viewport-bounded internal scrolling. Unit/static evidence and browser coverage pass; physical-device and accessibility acceptance remain pending.
- `Implemented`: A3 now uses one catalog grid wrapper for loading and loaded cards, shared 4:5 media geometry for loaded/fallback/skeleton states, and separate atomic price and status/deadline rows. Unit, full static, Expo export, target-width screenshot/bounding-box and browser coverage pass; founder/device/accessibility acceptance remains pending.
- `Implemented`: A4 uses the requested product-wide contract at `900px`: the gallery switches to `440×550`, the author/title/auction block becomes two-column from that boundary, and below it the amount input stays in the scrollable auction panel while the bottom action contains only a short summary and one compact primary action with safe-area padding. Buyer/admin responsive E2E coverage preserves the existing server-side bid restrictions; first-viewport bounds and buyer/admin screenshots are captured at 1440/1024/390.
- `Implemented`: A5 uses compact `44px` buttons with `14px` radius, Inter `500/13/18` navigation typography, equal-width icon-over-label mobile navigation cells, `navigation` semantics instead of tablist semantics, and keyboard-scrollable auth viewports. Responsive browser coverage includes validation errors, enlarged-scale CTA reachability and auth evidence; founder visual/device/accessibility acceptance remains pending. No Wave B/C work is included.

## Wave B — shared component and visual-system fixes — 2026-08-02

- `Implemented`: B1 canonical semantic token surface and contrast roles are in `packages/design-tokens/src/modern.ts`; `AppText`, `TextField`, and the mobile runtime consume the modern surface. Verification: design-tokens build passed and `visual-token.spec.ts` passed 7 tests, including destructive button text on the danger surface.
- `Implemented`: B2 shared focus-visible/reduced-motion contracts, 44px logo/author hit areas, and single-name composite image/icon semantics are in the mobile shared primitives. Mobile typecheck/lint passed; the targeted B2 suite passed 16 tests.
- `Implemented`: B3 shared buttons retain 56px default/44px compact geometry; text-only labels are centered without an idle icon gap, and loading uses an invisible sizing layer plus absolute spinner. Updated button unit and browser centering/width coverage passes; mobile typecheck/lint passed.
- `Implemented`: B4 centralizes the 4:5 media contract and narrow AuctionCard metadata geometry, and adds a reusable plain EditorialSection without changing Product order or auction flow. Targeted media/card coverage passed 11 tests; mobile typecheck/lint passed.
- `Implemented`: B5 PageState separates loading/empty/error/retry and is now used by ProductDraft, ListingDraft and Order route-level loading branches; AppDialog preserves modal layer, bounded scroll, and accessibility semantics, including focus return on cancel/Escape. Targeted state coverage passed 9 tests; route-level browser evidence passes for all three loading branches.
- `Implemented`: B6 localized seller/admin/order presentation paths and date-time normalization live in `apps/mobile/src/lib/presentation.ts`; `SelectableRow` preserves raw API values while presenting 44px localized choices. Adapter coverage passed 12 tests; mobile typecheck/lint passed.
- `Implemented`: final Wave B evidence includes 13 Vitest files / 58 tests and 24/24 disposable PostgreSQL Playwright tests; 21 target-width screenshots are in `/private/tmp/bidplace-wave-b-screenshots`.
- `Partial`: the overall product status remains Partial until founder physical-device, screen-reader, and visual acceptance is recorded.

## Wave C — screen polish and final visual acceptance — 2026-08-03

- `Implemented`: C1 catalog polish preserves the no-heading catalog, confirmed 2/3/4 columns, shared 4:5 bounds and separate price/status-deadline rows. Loading/loaded/failed-media evidence is in the C7 targeted spec.
- `Implemented`: C2 Product detail uses `EditorialSection` for linear story/history/bids and keeps `AuctionPanel` as the only transaction block. `BottomActionBar` remains summary + CTA; bid validation, OTP/rules, realtime, privacy and API contracts are unchanged.
- `Implemented`: C3 public author and purchases use 120px identity fallback, shared responsive AuctionCard grid and divider-led activity rows with existing role-safe data.
- `Implemented`: C4 seller/profile/draft screens use capped previews, 160×200 contain media rows, truthful failed-media states and strict calendar/time validation for readable listing date input with existing ISO serialization and server lock/upload/delete/reorder behavior.
- `Implemented`: C5 admin/order presentation uses two desktop queues within 1180px, compact moderation row actions, author text links, localized order cancellation reason and long-value-safe rows without changing permissions or lifecycle rules.
- `Implemented`: C6 auth copy and shared PageState/Skeleton loading semantics cover truthful registration, one loading announcement, plain-language retry errors and keyboard/zoom-compatible existing forms.
- `Implemented`: C7 targeted `apps/mobile/e2e/wave-c-screen-acceptance.spec.ts` passed 4/4 and the full repository `mobile test:e2e` passed 28/28 with Docker PostgreSQL; 66 commit-stamped screenshots are in `/private/tmp/bidplace-wave-c-screenshots/a852f68` across the 1440×900, 1024×900 and 390×844 route/role/state matrix, including catalog roles, author empty/error, long activity rows and responsive overlay states. Final founder physical-device/screen-reader acceptance remains the remaining gate.

## Runtime defect hardening — 2026-07-31

- `Implemented`: `OverlayHost` now supplies the web overlay boundary through a memoized callback ref; `OverlayPortal` waits for both the boundary and anchor rectangle, and navigation/account anchors use ref-supporting `View` wrappers. Web pointer-events are expressed through styles. Existing account hover/click/focus, Escape/outside dismissal and logout behavior remain in scope.
- `Implemented`: `ImagesController.get` and `SellersController.getPhoto` convert Prisma `Uint8Array` payloads to Node `Buffer` before Express sends them. Controller coverage verifies PNG signature bytes, `image/png`, 200-path handling and anonymous private-media rejection.
- `Partial`: seeded Catalog/Product natural-width assertions, real overlay-host child/visibility/logout assertions, and the 14-test disposable PostgreSQL Playwright suite are historical evidence from the prior baseline; the suite was not rerun against the current moderation/lifecycle changes because PostgreSQL was unavailable. Playwright explicitly disables existing-server reuse; its test-only forwarded IPs keep the production login rate-limit policy unchanged while isolating fixture sessions.

## Волна 1 — private web session, seed and truthful states — 2026-07-30

- `Implemented`: local browser/API configuration uses canonical `http://localhost` origins (`apps/mobile/src/lib/environment.ts`, Playwright webServer and the local CORS bootstrap fallback in `apps/api/src/main.ts`). The fallback is restricted to `NODE_ENV=development` plus `APP_ENV=local`, with production coverage in `apps/api/src/core/config/env.spec.ts`. Requests still use `credentials: 'include'`; the HttpOnly `bidplace_session` cookie, guards and restricted CORS policy were not weakened.
- `Implemented`: `(public)` and `(auth)` now own Expo Router layouts, removing the root references that caused the two legacy route warnings. Public URLs remain unchanged.
- `Implemented`: activity keeps the server-provided empty array separate from network/5xx errors; seller onboarding treats only API 404 as an absent profile; moderation shows pending actions, non-repeatable approval controls and explicit empty sections.
- `Implemented`: the guarded local seed creates four public Products with four local PNG fixtures in `SCHEDULED`, `LIVE`, `ENDED` and a second `SCHEDULED` state, eight approved creator profiles with local profile photos, plus pending SellerProfile and pending Product fixtures. The pending Product remains private because it is `PENDING_REVIEW` and has no public listing.
- `Partial`: `apps/mobile/e2e/wave-one.spec.ts` covers authenticated activity, account logout, new-user seller form, non-admin admin denial, admin approval and reasoned limiting actions, admin bid/activity restrictions and route-warning regression; current browser execution passes as part of the 24-test disposable suite. Founder device/accessibility acceptance remains.
- `Implemented`: moderation limiting actions now require a reason in the shared contract, persist the reason in `AuditEvent`, expose the latest reason and unified `hasBlockingListing` guard in the admin projection, and use `CHANGES_REQUESTED` for ordinary Product correction requests. Scheduled and live listings are blocked by the moderation service; lifecycle activation and bid eligibility also require approved Product and SellerProfile state. API/admin/lifecycle unit and contract coverage passes; browser verification for this wave remains pending without disposable PostgreSQL.
- `Partial`: public author navigation now reuses `GET /api/sellers/:slug/detail` through `/seller/[slug]`, and Product detail links to the author. The generic ended-auction Activity CTA was removed; only an existing winner Order link remains. Device/accessibility acceptance and browser verification remain pending.

## Волна 2 — web UI polish — 2026-07-30

## Wave 2 — catalog/product layout — 2026-08-01

- `Partial`: `product-list-screen.tsx` now starts the catalog grid after the desktop rail, removes the visible Catalog heading/count, and lets `AuctionCard` show stable media, author, title, short description, atomic price with `BYN` and secondary listing status/deadline. Loading, empty, error, query, filters, pagination and seed data are unchanged.
- `Partial`: `product-screen.tsx` now places gallery, author/title and auction together in the desktop top block, preserves the mobile gallery → author/title → auction order, and renders item story, item history and bid history linearly. Auction/bid/realtime/auth logic and public contracts are unchanged.
- `Implemented`: shared `Button` defaults to content width; `compact` and explicit `block` variants are available through `button-layout.ts`, with focused unit coverage in `Button.spec.ts`. `AppDialog` has a desktop max width; media uses stable contain presentation and existing fallbacks.
- `Implemented`: screenshots at 1440/1024/390 px are captured in `/private/tmp/bidplace-wave2-screenshots`; the full disposable PostgreSQL Playwright suite passes 24/24, including catalog/product/dialog and Wave A responsive coverage. Founder device/accessibility and reduced-motion acceptance remain separate.
- `Implemented`: mobile header layout below 1025 px no longer renders the desktop account row; `AppHeader` keeps one bottom divider and no navigation top divider. The 390 px screenshot E2E asserts the first seed card begins directly after navigation; desktop layout remains covered by the full 24/24 suite.
- Deferred by scope: 10–15 works, pagination, search, filters, tags, favorites and recommendations.

- `Partial`: desktop web now has a white canvas, 72 px icon rail and desktop right-side account menu; mobile keeps account access in the AppHeader brand row. `OverlayHost` portals account dropdowns and rail tooltips above content using trigger-rectangle positioning. Account menu supports click, desktop hover and keyboard focus, with hover dismiss after leaving both trigger and dropdown, route-change reset, Escape/outside dismissal resetting keyboard state and a visible pending-aware `Выйти` action. SellerProfile-derived navigation exposes cabinet/add-product only for `APPROVED`; admin navigation remains Catalog + Moderation.
- `Implemented`: admin bid placement is denied in `BidsService`, admin buyer Activity is denied at `ActivityController`, and Product detail does not request buyer Activity or render a bid form for admin. `BidsService` unit coverage and admin browser API assertions cover the rule.
- `Partial`: public catalog includes approved Products whose Listing is `SCHEDULED`, `LIVE` or `ENDED`, using a shared `LIVE` → `SCHEDULED` → latest `ENDED` selector; the open-only default filter is deferred. Current guarded seed and browser `naturalWidth` checks cover four public demo products, including the fourth card needed for the desktop catalog density. Final founder visual/device/accessibility acceptance is still pending.
- `Partial`: shared `PageHeader`/`PageState` and Product linear section presentation cover the main loading, empty, retry, author, authored-item facts, publication date and public history states; bid history now distinguishes loading, error/retry and empty/data states. Browser automation covers mobile header placement, guest/pending/approved navigation, desktop account hover/focus, admin restrictions and seeded buyer/media states; Wave C targeted evidence is current, while final founder visual/device/accessibility acceptance is still pending.

## Local seed password handling — 2026-07-30

- `Implemented`: `packages/database/prisma/seed.js` now accepts the local-only `SEED_ADMIN_PASSWORD`, hashes it with Argon2 before creating the deterministic admin, seller and buyer records, and never writes the plaintext password to the database. Runtime login continues to verify the submitted password against `User.passwordHash` through `apps/api/src/auth/password-hasher.service.ts`.
- The previous `SEED_ADMIN_PASSWORD_HASH` variable is no longer read by the seed. A local database reset must provide `SEED_ADMIN_PASSWORD` and rerun the guarded demo seed.

## Visual polish — 2026-07-30

- `Implemented`: the light branding source assets are stored in `apps/mobile/assets/branding/`; the current Pen v2 `BrandLogo.tsx` uses the black `bidplace-logo.png` mark at the canonical `38×30` header geometry, while `app.json` uses the light favicon. The separate `bidplace-wordmark-light.*` asset remains available but is not the current Pen v2 header target. The previous placeholder border and duplicated text lockup were removed. Expo web/native rendering still needs founder visual/device acceptance because the supplied source assets are SVG.
- `Partial`: `apps/mobile/src/components/layout/AppShell.tsx` now provides the shared 1025 px responsive shell; all screens that used the repeated `SafeAreaView + AppHeader` composition use the shell, with mobile bottom actions and scroll ownership preserved.
- `Partial`: `apps/mobile/src/lib/environment.ts` provides `getApiAssetUrl`; Catalog/Product/seller profile/Product draft media use it. `ProductGallery` and `AuctionCard` display labeled unavailable-image states after load errors. API image authorization and seeded live-media/device behavior still need direct founder/device verification.
- `Partial`: `product-screen.tsx` places desktop gallery and auction panel in the same row and keeps mobile gallery → auction facts → linear detail sections → bottom action ordering. Auction business logic, realtime refetch, privacy and contracts are unchanged.
- `Partial`: `AppHeader.tsx` applies desktop nav geometry on the Expo Router `Link` itself, so the active Catalog item remains visible on web; `AppIcon.tsx` no longer forwards the native-only `accessible` prop to SVG DOM nodes. `apps/mobile/e2e/navigation.spec.ts` covers the visible root link and the warning regression.
- `Partial`: Login field validation now maps invalid email/password input to Russian messages, while server error handling remains generic/safe for unrecognized errors.
- Automated evidence for this snapshot: mobile typecheck, lint, unit tests (33/33), E2E fence, Expo web export and isolated headless web smoke passed; the smoke found a visible `/` Catalog link and no `accessible` warning. Founder visual/accessibility/device acceptance remains required; no route status is changed to `Implemented`.
- `Partial`: the historical disposable Playwright suite covered the auction creation, bidding and closing regressions; its 14-test result is not current verification for this branch because the rerun could not start without PostgreSQL.

## Auth logout resilience — 2026-07-30

- `Implemented`: `POST /auth/logout` uses `LogoutAuthGuard` to identify only a valid current session. It always clears the session cookie, including when the submitted cookie is missing, expired, malformed, or stale; server-side session invalidation runs only for an authenticated current session. `apps/api/src/auth/logout-auth.guard.spec.ts` covers invalid, stale, and current tokens.

## Auction browser E2E — 2026-07-28

- `Implemented`: three independent Playwright scenarios cover seller Product draft/submission and scheduled Listing preview (`apps/mobile/e2e/auction-creation.spec.ts`), two-buyer canonical bid/outbid/minimum behavior (`auction-bidding.spec.ts`), and lifecycle-driven close with winner Order and loser privacy (`auction-closing.spec.ts`). Shared setup lives in `e2e/support`; there is no `.state.json` or serial dependency.
- `Verified`: `test:e2e:auction` passes against disposable local `bidplace_e2e`; mobile typecheck, E2E lint and the disposable-database fence pass.

## Реализовано

| Поведение                        | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical storage model          | `packages/database/prisma/schema.prisma`, `packages/database/prisma/migrations/20260716000000_baseline/migration.sql`: nullable `phone`, `email_verified_at`, `TermsAcceptance`, `EmailVerificationCode`, moderation enums, handoff snapshot fields and append-only `AuditEvent` are present with the expected partial indexes.                                                                                                                                                                                                                                                                                                                                                                                 |
| Product and Listing rules        | `apps/api/src/products`, `apps/api/src/listings`, `apps/api/src/admin`, `apps/api/src/sellers/seller-capability.ts`, `apps/api/src/products/public-visibility.ts`: draft Product, submit-to-review, approval gate, owner lock after `SCHEDULED`/`LIVE`, shared public visibility predicates and BYN-only auction rules.                                                                                                                                                                                                                                                                                                                                                                                         |
| Seller privacy and image reorder | `apps/api/src/orders/orders.service.ts`, `apps/api/src/images/images.service.ts`: buyer-facing Order projections hide seller contacts in `SELLER_CONTACTS_BUYER`, keep them in `BUYER_CONTACTS_SELLER`; image reordering avoids unique-position collisions and aggregate count/byte capacity is enforced transactionally across uploads.                                                                                                                                                                                                                                                                                                                                                                        |
| Bids and soft close              | `apps/api/src/bids`, `apps/api/src/core/auction/pricing-policy.ts`, `apps/api/src/bids/bid-eligibility.ts`: serializable transaction, idempotency key, self-bid gate, compare-and-update, Listing-scoped public aliases, BYN increment policy, first-bid start-price floor, 60/60/600 soft close, email verification and versioned rules acceptance.                                                                                                                                                                                                                                                                                                                                                            |
| Lifecycle and Order              | `apps/api/src/lifecycle`, `apps/api/src/orders`, `apps/api/src/orders/order-snapshot.ts`, `apps/api/test/integration/order-mutations.integration.spec.ts`, `apps/api/test/integration/order-replacement.integration.spec.ts`: scheduler activation/closing, deterministic winner, atomic Order foundation, role-gated seller handoff, manual admin cancellation/replacement, immutable snapshots and append-only audit. PostgreSQL tests cover terminal repeats, unauthorized actions, ranked replacement and one-active-Order behavior.                                                                                                                                                                        |
| Email verification and rules     | `apps/api/src/otp`, `apps/api/src/auth`, `apps/api/src/core/rules.ts`: hashed one-time OTP, expiry, retry/cooldown/rate limiting, production SMTP transport via nodemailer, versioned service-rules text and test-only bypass validation. Password recovery: `apps/api/src/password-reset`, `PasswordResetToken`, neutral forgot + session-invalidating reset.                                                                                                                                                                                                                                                                                                                                                      |
| Public and realtime API          | `packages/contracts`, `packages/api-client`, `apps/api/src/products/public-visibility.ts`, `apps/api/src/realtime`: public Product, Bid history, media and socket joins share approved Product/SellerProfile gates; projections exclude seller internal identifiers and buyer PII; sockets are origin allow-listed, credential-free, IP rate-limited and room-capped; mobile uses HTTP as canonical snapshot and refetches on reconnect/events.                                                                                                                                                                                                                                                                 |
| Local reset and seed             | The reset guard is present. The deterministic local/test-only seed creates four approved demo Products with local PNG fixtures (three auction states plus a second scheduled vase), eight approved creator profiles with local profile photos, plus pending seller/product moderation fixtures. Bid/Order fixtures require an explicit local/test profile and fail closed in production-like environments; `apps/api/test/integration/seed-contract.integration.spec.ts` verifies current price, bid count, winner and Order consistency. The dedicated `test:e2e-fence` guard and disposable guarded seed smoke pass; the public catalog includes the four approved Products and excludes the pending Product. |
| Prisma generated client          | `packages/database` generates its custom Prisma Client before build. The generated directory is intentionally ignored and is not part of the source baseline.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Partial / needs verification

Current verification (2026-08-12): API/mobile/database typechecks and lint,
API unit 154/154, mobile unit 143/143, contracts 11/11, PostgreSQL integration
40/40 and disposable Chromium Playwright 38/38 pass. Founder visual/device/
screen-reader acceptance and the isolated 10-user rehearsal remain pending.

| Area                          | Current evidence                                                                                                                                                                                                                                                                                                                        | Remaining gap                                                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Seller and admin mobile flows | Seller profile, Product draft/edit, Listing draft and `/admin` use the Pen v2 shared primitives. Product retains server edit locks, aggregate image limits, upload/delete/reorder and preview; Listing retains server validation and explicit schedule; destructive admin actions require confirmation while API remains authoritative. | Runtime implementation and automated evidence are complete; founder physical-device/accessibility acceptance remains.                               |
| Product detail UX             | `/product/[publicId]` has gallery/atmosphere, value fields, AuctionPlayer, URL-backed About/Creation/Bids tabs, Listing-scoped aliases, related public author works, OTP/actions, Activity participation, Order link and realtime refetch.                                                                                              | Founder pixel review, physical-device and screen-reader QA remain.                                                                                  |
| Tests                         | API/mobile/database typechecks and lint, contracts 11/11, API unit 154/154, mobile unit 143/143, PostgreSQL integration 40/40, E2E fence and disposable Chromium Playwright 38/38 pass; Expo iOS/Android exports pass.                                                                                                                  | Formal Pen pixel-diff overlay, native physical-device and founder screen-reader acceptance remain deferred; the isolated 10-user rehearsal remains. |
| Operations                    | Single-process scheduler and Socket.IO gateway work for MVP. Root `dev` and direct mobile start commands build workspace dependencies first, preventing stale package output at runtime.                                                                                                                                                | Multi-instance deployment requires a distributed lock or external queue before scaling; binary database image storage remains pilot-only.           |

## Historical Modern UI implementation baseline — 2026-07-27

This section is a dated historical record and is superseded by the canonical
Pen v2 section above. References to `modernTokens`, `components/modern-ui`, the
left rail and absence of `components/ui` callers no longer describe runtime.

- `feature/modern-ui-final` starts from the documentation baseline before the experimental pilot; the pilot bridge is not the accepted production strategy.
- The redesign has migrated all existing working mobile routes and removed Tamagui, the legacy mobile UI kit, legacy palette/theme exports and Cormorant runtime loading. Server-authoritative auctions, email/rules gates, privacy projections, moderation and seller locks remain unchanged.
- Bid confirmation and client-side increment validation remain confirmed UI behaviour; backend remains authoritative. See `DEC-055`, `DEC-056` and the current design handoff in `docs/design/05-DESIGN-HANDOFF.md`.
- Final UI cutover is Partial final migration: `apps/mobile` has one light-only React Navigation theme derived from `modernTokens`, Inter and PT Mono loading, no production Tamagui or `components/ui` callers, and final navigation on every route. Catalog (`/`) retains its existing API query and public route. Founder iOS/Android, browser/device visual and accessibility acceptance remain required.
- Product/Bid final content is Partial: `features/products/product-screen.tsx`, `features/auth/email-rules-gate.tsx` and `components/modern-ui/AuctionPanel.tsx` render the Product facts, desktop contextual auction panel, mobile safe-area action, OTP/rules gate, confirmation and retry through final primitives. `bid-validation.ts` still validates the confirmed BYN increment table; unknown/no participation requires confirmation; same-amount retry preserves its idempotency key; stale/rejected mutations refetch canonical Product/Bid/Activity projections. The API remains authoritative for minimum, Listing state and close. Final global navigation, iOS/Android smoke and accessibility evidence remain.
- Activity final content is Partial: `features/activity/activity-screen.tsx` renders the server-projected participation and authorized Order link through final `ActivityRow` UI. Shared navigation, device smoke and accessibility evidence remain.
- Order final content is Partial: `features/orders/order-screen.tsx` preserves buyer/seller/admin server projections and seller action refetches through final primitives; the irreversible handoff-failed action now has explicit client confirmation. Full device and accessibility evidence remains.
- Auth final content is Partial: `features/auth/auth-form.tsx` retains RHF/Zod validation, safe redirect and user-facing recovery through final form primitives; forgot/reset flows live in `(auth)/forgot-password`, `(auth)/reset-password` with neutral success and invalid-link states. Device and accessibility evidence remains.
- Seller profile final content is Partial: `features/sellers/seller-profile-screen.tsx` retains the server `CHANGES_REQUESTED` edit lock and multipart public-photo contract through final primitives. Device acceptance evidence remains.
- Seller Product draft/edit is Partial final migration: `features/sellers/product-draft-screen.tsx` uses `FormSection`, `TextField` and final media/actions, preserves create/update/submit, server locks, image upload/delete/reorder, and confirms only image deletion. Creator input no longer asks for `condition`; an existing returned value is read-only. Listing draft and `/admin` likewise use final primitives, with explicit Listing scheduling and confirmed destructive admin actions. Automated evidence is complete; founder acceptance remains.

## Confirmed MVP implementation gaps — 2026-07-23

This is a dated backlog snapshot. Current implementation and verification facts
in the 2026-08-10 sections above supersede its old rerun/test-count wording;
remaining product boundaries still apply.

| Area                                     | Status             | Required implementation evidence                                                                                                                                                                                                                                                                   |
| ---------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public seller application and capability | Partial            | `POST/PATCH /seller/profile`, seller status projection and the seller-write capability gate now exist, and the mobile application screen uses multipart photo upload; prior closed-pilot browser/E2E evidence is historical and current rerun remains Needs verification.                          |
| Seller profile data                      | Partial            | Handoff contact, handoff initiator, immutable public `fullName`, profile photo upload/public URL and `CHANGES_REQUESTED` edit flow for public and handoff fields now exist in schema, API and mobile; prior browser seller-path evidence is historical and current rerun/device QA remain pending. |
| Product moderation and visibility        | Implemented        | `submit`, admin moderation service, reasoned `CHANGES_REQUESTED` correction flow, `REJECTED` owner edit/resubmit on the same Product (`DEC-071`), LIVE-listing guard, audit records, `publishedAt`, one-image approval gate and shared public catalog/direct visibility predicates are in place. |
| Seller handoff actions                   | Implemented        | Order snapshots contacts plus frozen deal fields (`DEC-074`); seller inbox `GET /api/orders` is session-scoped and paginated; seller actions and admin replacement/cancellation preserve audit and role-scoped projections.                                                                  |
| Timestamps                               | Partial            | Most mutable records have timestamps; the confirmed all-entity `createdAt`/`updatedAt` and Product `publishedAt` requirement is not yet implemented.                                                                                                                                               |
| Pilot analytics                          | Implemented        | First-party ingest + admin `/admin/analytics` dashboard (`DEC-067`). Canonical events in `analytics-contract.md`; metrics definitions in `analytics-metrics.md`. Remaining RFC §16 names are DB-derived or deferred, not duplicate analytics events. |
| Production email verification            | Implemented        | `apps/api/src/otp`, `apps/api/src/auth`, `apps/api/src/bids/bid-eligibility.ts` now enforce SMTP-backed email verification, versioned rules acceptance and a test-only bypass that stays disabled in production.                                                                                   |
| Closed-pilot rehearsal                   | Needs verification | Chromium Playwright now covers the buyer path, seller/admin browser flow, seller handoff actions, and the order privacy matrix against disposable PostgreSQL; the isolated 10-user rehearsal still needs to be run.                                                                                |

## Intentional MVP boundaries

- Only `ListingType.AUCTION` and `BYN` exist.
- No `Lot`, central `Auction`, Buy Now, reserve price, reserve UI or USD fixture remains in the runtime model.
- Payment, delivery, chat, automatic winner replacement and notifications are not implemented.
- Manual admin replacement preserves cancelled Order history; automatic replacement is Planned.
- Domain/security tasks do not absorb incidental visual work. The new Pen v2 refactor is governed by `DEC-062` and `docs/design/07-PEN-V2-UI-AUDIT-AND-IMPLEMENTATION-PLAN.md`; `DEC-056` remains authoritative for bid confirmation and client validation.

## Historical closed-pilot verification — 2026-07-19

- Frozen workspace install; full lint and typecheck; API build; Expo web export; Prisma validation; isolated reset and seed passed.
- API typecheck passed on the current tree.
- API unit suite passed: 20 files, 86 tests.
- API integration suite passed: 2 files, 8 tests, against local PostgreSQL.
- Production SMTP env validation passed in `apps/api/src/core/config/env.spec.ts`.
- Chromium E2E, mobile typecheck, lint and seed reset were not rerun in this snapshot.

## Task B Editorial Redesign — 2026-07-19

- Task B Editorial Redesign завершена.
- Выполнен основной type-safety commit.
- Выполнено исправление explicit protected admin route в коммите `79e6ad7` (admin URL теперь `/admin` и защищён administrative guard).
- Проверки: mobile TypeScript проходит; targeted ESLint изменённых файлов проходит; `expo export --platform web` проходит (SPA refresh `/admin` в production зависит от hosting fallback на `index.html`).
- Результаты ручного smoke-test:
  [ЗДЕСЬ Я ВСТАВЛЮ РЕАЛЬНЫЕ РЕЗУЛЬТАТЫ:

- `/` как гость:
- `/admin` как администратор:
- refresh `/admin`:
- `/admin` как обычный пользователь:
- mobile drawer 375 px:
- desktop navigation 1440 px:
- переключение 1024/1025 px:
- browser console:
- краткая проверка основных экранов:
  ]

## Post-Task-B release hardening TODO

- WebKit and full cross-browser matrix; physical-device QA; visual regression; exhaustive seller/admin E2E; full accessibility automation; ten-session browser rehearsal.

## Checks executed for this snapshot

- `packages/database`: Prisma client generation and TypeScript build completed against the updated seller-profile schema.
- `packages/contracts`: TypeScript build completed after seller-profile, order and auth contract updates.
- `packages/api-client`: TypeScript build completed after multipart seller application and auth response updates.
- `apps/api` typecheck passed.
- `apps/api` build passed.
- `apps/api` unit Vitest suite passed: 25 files, 115 tests.
- `apps/api` integration Vitest suite passed against local PostgreSQL after the order snapshot regression was fixed.
- `apps/mobile` typecheck passed after the buyer/seller order projection fixes.
- `apps/mobile` build passed (`expo export`).
- `apps/mobile` Playwright closed-pilot browser suite reran against the current code with Docker PostgreSQL; 24/24 tests passed, including Wave 2 screenshots and Wave A responsive checks.
- `corepack pnpm lint` passed once Turbo was forced through the pinned pnpm 11.7.0 wrapper.
- `corepack pnpm format:check` failed with repo-wide Prettier warnings across 162 files.

See `10-CODE-ARCHITECTURE.md` for boundaries and `05-MVP-RFC.md` for product contract gaps.

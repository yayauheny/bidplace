# W3 — Продажи: бэкенд — план реализации

> **Для агентов:** выполнять через superpowers `subagent-driven-development`
> (рекомендуется) — задач много, свежий контекст на каждую. Шаги — чекбоксы.
> Общие правила — [AGENT-RULES.md](../AGENT-RULES.md).

**Goal:** сервер полностью реализует [COMMERCE.md](../COMMERCE.md): лоты
(фиксированная цена и аукцион), ставки, покупка, заказы со статусами, следующий
участник, страйки, жалобы, письма через очередь, «требует внимания», избранное,
контакты и настройки уведомлений.

**Architecture:** новый модуль `apps/api/src/commerce/` с тонкими контроллерами
и сервисами по сущностям; правила — чистые функции (`auction-pricing.ts`,
`listing-state.ts`, `order-state.ts`), которые покрыты unit-тестами
`it.each`. Каждое изменяющее действие — одна транзакция `ReadCommitted` с
первым шагом `lockProductRowForUpdate`, условными переходами и временем
`now()` базы. Фоновая работа — задачи `TickService` (W2). Письма — строки
`notification_outbox` в той же транзакции. Контракты — `packages/contracts/src/commerce.ts`.

**Spec:** [COMMERCE.md](../COMMERCE.md) целиком — единственный источник правил.
Справочник кода: ветка `archive/commerce-v1` (`598d8696`) — только чистые
функции и тесты к ним, не модули целиком (`DEC-087`).

**Ветка:** `feature/commerce-backend` от `main`. Факты проверены на `6720b7af`.
Зависит от: W1 (хелпер «в продаже», модуль публикации), W2 (тик), W2b (антифрод).

## Global Constraints

- Деньги — `Int` в минимальных единицах + `currency` (`BYN`|`RUB`); `Decimal`
  в новых полях не использовать. Таблица шагов — одна, в контрактах, общая с клиентом.
- Правила переходов лота и заказа — только в `listing-state.ts` и `order-state.ts`.
  Сервисы не сравнивают статусы руками.
- Все записи статусов — условные (`updateMany where status in` + `count === 1`).
- Порядок блокировок в одной транзакции: сначала строки работ
  (`lockProductRowForUpdate`, несколько — по возрастанию id), затем пользователи
  (`AntifraudService.lockUsers`, сортирует сам). Блокировать работу после
  пользователя нельзя; бан набирает работы заранее и при новой работе после
  блокировки пользователя бросает `RetryableTransactionConflict`.
- Время сделки — `SELECT now()` внутри транзакции; владелец времени — один
  существующий `apps/api/src/core/time/` (`Clock.now()` вне транзакции уже есть;
  `dbNow(tx)` добавляется туда же, отдельной папки `clock` не создавать), в
  новом коде `new Date()` для бизнес-времени нет (TECH-DEBT B5).
- Решения «может ли пользователь действовать» (контакты, страйки, 3 брони, блоки,
  бан, лимиты частоты) — только `AntifraudService` из W2b; `commerce` вызывает
  `assertCanAct(tx, …)` и сообщает факты, но не считает сам. Новые правила —
  в `antifraud`, не в `commerce-guards.ts`.
- Ошибки — `AppException` с кодами из COMMERCE.md §12; существующие коды
  переиспользуются.
- Чтения заказа — только участник или админ; чужой заказ — 404.
- Контакты сторон — только в ответе карточки заказа. В публичных ответах,
  списках ставок, логах, аналитике и письмах (кроме письма участнику со ссылкой
  на заказ) их нет. Имена участников в списке ставок — «Участник N».
- Действия покупателя (ставка, покупка, принятие) — `SessionAuthGuard` +
  `VerifiedEmailGuard`; ставки — `@RateLimit` из `antifraud` 10/мин на лот.
- Админ-действия — `AdminGuard` + запись `auditEvent` (как в модерации).
  `auditEvent` — только внутри той же транзакции, что и изменение (как
  `admin-user.service.ts`, не как `catalog.service.ts`, который пишет после коммита).
- Статус автора `APPROVED` перепроверяется внутри транзакции под блокировкой
  работы (создание лота, ставка, покупка): `ProductsService.create` сейчас
  проверяет до транзакции — этот приём не копировать.
- `commerce` не импортирует `ProductsService` (он тянет каталог и медиа):
  только `product-write-guard` и маленький читатель работы внутри `commerce`.
- Лимиты частоты (в базе после W2b) — только от спама; ни одно правило денег и
  броней на них не держится.
- Автоматических переходов у `ACTIVE` заказа нет: «Продано» ставит автор (или
  админ по спору); тик только напоминает (COMMERCE §6.3).
- Не делать: realtime/WebSocket, оплату, доставку, публичные рейтинги и отзывы,
  жалобы на работы и авторов в интерфейсе, автоставки, резервную цену, «купить сейчас».

## Review Focus

1. 50 человек ставят одновременно — итоговая цена равна максимальной принятой
   ставке, ни одна принятая ставка не потеряна, `bidCount` верный. → Task 11.
2. Двое нажали «Купить» одновременно — ровно один заказ. → Task 6, шаг 1; Task 11.
3. Посторонний открывает `/api/orders/:publicId` или видит контакты — 404, контактов нет. → Task 7, шаг 1.
4. Контейнер спал во время конца аукциона — ставка после `endsAt` отклонена, заказ
   создан первым тиком, ровно один. → Task 5, шаг 1; Task 8, шаг 1.
5. Покупатель с двумя сорванными сделками не может ставить и покупать; админ
   снимает страйк — может. → Task 7, шаг 4.

## Facts

- `packages/database/prisma/schema.prisma`: `ListingType { AUCTION }`,
  `ListingStatus { DRAFT SCHEDULED LIVE ENDED CANCELLED }`, `OrderStatus
  { PENDING_CONTACT CONTACTED COMPLETED HANDOFF_FAILED CANCELLED }`,
  `HandoffContactType`, `HandoffInitiator`; `Listing.currentPrice Decimal`,
  `bidCount`; `AuctionRules.incrementPolicyCode 'MVP_BYN_V1'`; `Bid`
  `@@unique([bidderUserId, idempotencyKey])`, `idempotencyKey VarChar(80)`;
  `Order.sourceBidId` обязательный `@unique`, `sellerId`/`buyerId` → `User`,
  снимки `sellerHandoff*`, `buyerEmailAtClose`. `SellerProfile.handoff*` (~152–154).
  `User.phone @unique`, `phoneVerifiedAt`.
- Baseline-миграция: `one_active_listing_per_product` (~206),
  `one_active_order_per_listing` (~215), полный уникальный индекс ставок (~207).
  Миграции: `packages/database/prisma/migrations/<YYYYMMDDHHMMSS>_<snake>/migration.sql`;
  частичные индексы — raw SQL.
- `apps/api/src` модулей продаж нет. Читатели `listing`: `product-write-guard.ts`,
  `products.service.ts`, `images.service.ts`, `admin-moderation.*`,
  `admin-analytics.*`, `core/contracts/persistence-value.parsers.ts`.
- Ошибки ставок в `packages/contracts/src/error.ts` 17–22: `BID_TOO_LOW`,
  `LISTING_NOT_OPEN`, `LISTING_NOT_FOUND`, `LISTING_CHANGED`,
  `SELF_BID_FORBIDDEN`, `ADMIN_BID_FORBIDDEN` — никто не бросает.
- Инфраструктура: `runReadCommittedTransaction` (`core/database/transaction.ts`
  23–34, ретраи конфликтов); `lockProductRowForUpdate` (`product-write-guard.ts`);
  `AppException`; `parseBody(schema, body)`; `SessionAuthGuard`,
  `OptionalSessionAuthGuard`, `VerifiedEmailGuard`, `CurrentUser`, `AdminGuard`;
  `RateLimit` (`scope: 'user-resource'`); `PublicIdService.generate()` (как в
  `products.service.ts` ~118); `MailTransport.send({ to, subject, text })`
  (`core/mail/`), письма собираются строкой на месте.
- Тесты: `apps/api/test/integration/test-database.ts`
  (`createIntegrationDatabaseContext`), `http-test-app.ts` (`createHttpTestApp`,
  `HttpTestClient`), `permission-fixtures.ts` (`createPermissionFixture`).
- Архив `archive/commerce-v1`: `apps/api/src/core/auction/pricing-policy.ts`
  (`calculateBidStep`, `resolveMinimumBidAmount`, `resolveSoftCloseEndsAt`),
  `state-machine.ts`, `bids.service.ts` (идемпотентность), спеки к ним.
- Контакты автора сейчас: `SellerProfile.telegramUrl`, `instagramUrl`,
  `publicEmail`, `socialLink`, `websiteUrl` (публичные ссылки профиля — не то
  же, что приватные контакты для сделки).

## Бэкенд

Структура модуля (создаётся по задачам):

```text
apps/api/src/commerce/
  commerce.module.ts
  auction-pricing.ts      listing-state.ts      order-state.ts      (чистые функции + *.spec.ts)
  commerce-guards.ts      // assertBuyerEligible: проверки лота + antifraud.assertCanAct
  listings.controller.ts  listings.service.ts
  bids.service.ts
  orders.controller.ts    orders.service.ts     order-offers.ts     // следующий участник
  reports.controller.ts   reports.service.ts
  commerce-tick.ts        // задачи тика
  attention.service.ts
  commerce.mapper.ts      // модели → контракты
apps/api/src/notifications/
  notifications.module.ts notification-outbox.ts  notification-templates.ts  notification-settings.controller.ts
apps/api/src/favorites/
  favorites.module.ts     favorites.controller.ts  favorites.service.ts
```

### Task 1: Схема и контракты

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Create: `packages/database/prisma/migrations/<ts>_commerce_v2/migration.sql`,
  `packages/contracts/src/commerce.ts`, `packages/contracts/src/commerce.spec.ts`
- Modify: `packages/contracts/src/index.ts`, `packages/contracts/src/error.ts`,
  `packages/contracts/src/user.ts` (контакты, настройки уведомлений),
  `apps/api/src/core/errors/error-response-mapper.ts`,
  `apps/api/src/core/contracts/persistence-value.parsers.ts` и другие читатели
  старых полей (по `rg`)
- Test: `packages/database` проверка миграции (как принято), `commerce.spec.ts`

В той же миграции: `AuditTargetType` += `REPORT`; удалить неиспользуемую
`PhoneVerificationCode`. `users.phone` / `phoneVerifiedAt` не трогать
(COMMERCE §10); телефон для сделки — новый `contactPhone` без SMS. Каждое удаление — `Ruling:`.

**Interfaces:**
- Produces (контракты):

```ts
export const COMMERCE_CURRENCIES = ['BYN', 'RUB'] as const
export const BID_STEP_TABLES: Record<Currency, readonly { belowMinor: number | null; stepMinor: number }[]>
export const COMMERCE_LIMITS = { maxAmountMinor: 100_000_000, auctionMinDays: 1, auctionMaxDays: 14,
  scheduleMaxDays: 30, buyerActiveOrders: 3, buyerStrikesToBlock: 2,
  contactWindowHours: [1, 6, 24, 48, 72], defaultContactWindowHours: 24,
  sellerReminderHours: [24, 48], adminAttentionHours: 72, strikeDelayHours: 72,
  reportWindowDays: 14 } as const
export const createListingRequestSchema   // discriminated union по type
export const placeBidRequestSchema, purchaseRequestSchema, failOrderRequestSchema, orderNoteRequestSchema,
  createReportRequestSchema, resolveReportRequestSchema, userContactsRequestSchema, notificationSettingsSchema
export const publicLotSchema, bidHistoryResponseSchema, orderSummarySchema, orderDetailSchema,
  attentionResponseSchema, reportSchema, trustSignalsSchema
```

  Схема БД — COMMERCE.md §10 дословно по полям и индексам.

- [ ] **Шаг 1: падающий спек контрактов.** `commerce.spec.ts`: `it.each` по
  таблицам шагов (границы: BYN 24,99 → 0,50; 25,00 → 1; 999,99 → 10; 1000 → 25;
  RUB аналогично); `createListingRequestSchema` отклоняет: валюту вне списка,
  сумму ≤ 0 и > предела, аукцион короче 1 / длиннее 14 дней, `startsAt` дальше
  30 дней, `priceMinor` у аукциона, `contactWindowHours` вне списка; контакты:
  Telegram `@name`/ссылка, Instagram, VK, телефон `+` и 7–15 цифр.
- [ ] **Шаг 2:** FAIL → контракты → PASS.
- [ ] **Шаг 3:** схема Prisma и одна миграция: удалить старые таблицы и enum
  продаж, `seller_profiles.handoff_*`; создать новые по §10; добавить контакты в
  `users`, `seller_profiles.showContactsToBuyer`, `bids.voidedAt`; частичные
  индексы и CHECK срока связи raw SQL. Прод пуст — данные не переносить.
- [ ] **Шаг 4:** починить компиляцию читателей старых полей (`rg "handoff|currentPrice|incrementPolicyCode|PENDING_CONTACT|HANDOFF_FAILED"`),
  не меняя их поведение, кроме перехода на новые имена.
- [ ] **Шаг 5:** `pnpm --filter @bidplace/database` генерация и применение миграции
  на `bidplace_e2e`; `typecheck` по графу → PASS.
- [ ] **Шаг 6:** коммит `feat: commerce v2 schema and contracts`.

### Task 2: Чистые правила

**Files:**
- Create: `apps/api/src/commerce/auction-pricing.ts`, `listing-state.ts`,
  `order-state.ts` + `*.spec.ts` к каждому

**Reuse:** перенести из архива `calculateBidStep`/`resolveMinimumBidAmount`/
`resolveSoftCloseEndsAt` и их тесты, переписав на `Int` и таблицу из контрактов.

**Interfaces:**

```ts
// auction-pricing.ts
bidStepMinor(currency: Currency, currentMinor: number): number
minimumBidMinor(input: { currency; startPriceMinor; currentPriceMinor: number | null; bidCount: number }): number
resolveSoftCloseEndsAt(input: { endsAt: Date; originalEndsAt: Date; now: Date;
  windowSeconds; extensionSeconds; maxTotalSeconds }): Date
// listing-state.ts
type EffectiveListingState = 'SCHEDULED' | 'LIVE' | 'AWAITING_CLOSE' | 'ENDED' | 'CANCELLED'
effectiveListingState(listing: { status; startsAt; endsAt: Date | null }, now: Date): EffectiveListingState
canAuthorCancel(listing: { type; status; bidCount }, now: Date): boolean
// order-state.ts
type OrderActor = 'buyer' | 'seller' | 'system' | 'admin'
type OrderTransition = { to: OrderStatus; failReason?: OrderFailReason }
assertOrderTransition(order: { status; offerExpiresAt; contactDeadlineAt },
  actor: OrderActor, next: OrderTransition, now: Date): void  // ORDER_TRANSITION_NOT_ALLOWED
faultOf(reason: OrderFailReason): FaultSide
```

- [ ] **Шаг 1: падающие спеки.** `auction-pricing`: `it.each` границ шагов;
  первая ставка = старт; продление: за 61 с — без изменений, за 60 с — `now+60`,
  потолок `original+600`, после конца — без изменений. `listing-state`: все
  комбинации статуса и времени. `order-state`: каждая строка таблицы COMMERCE §6.1
  — разрешена своему актору и запрещена остальным; «не вышел на связь» и «неверные
  контакты» до/после `contactDeadlineAt`; у `system` нет переходов из `ACTIVE`;
  `faultOf` по каждой причине.
- [ ] **Шаг 2:** FAIL → реализовать → PASS.
- [ ] **Шаг 3:** коммит `feat: commerce pricing and state rules`.

### Task 3: Очередь писем и настройки

**Files:** Create: `apps/api/src/notifications/*` (см. структуру).
Modify: регистрация задачи `notifications.send` в `TickService`.
Test: `notification-outbox.spec.ts`, `apps/api/test/integration/notifications.integration.spec.ts`.

**Interfaces:**

```ts
type NotificationKind = 'BID_WON' | 'PURCHASED' | 'LISTING_SOLD' | 'AUCTION_ENDED_NO_BIDS' | 'OFFER_RECEIVED'
  | 'CONFIRM_DEAL_REMINDER' | 'DEAL_COMPLETED' | 'ORDER_FAILED' | 'ORDER_REPORTED' | 'LISTING_REMOVED'
  | 'OUTBID' | 'CONTACTS_CHANGED'          // DEAL_COMPLETED — данные чека (COMMERCE §6.2), без контактов
enqueueNotification(tx, input: { userId: string; kind: NotificationKind; payload: Record<string, string | number> }): Promise<void>
renderNotification(kind, payload): MailMessage   // notification-templates.ts, тексты по COMMERCE §1 и §9
GET/PUT /api/me/notification-settings
POST /api/admin/notifications/retry-failed   // FAILED за 48 ч → PENDING, attemptCount = 0, auditEvent
GET /api/admin/health → { lastTickAt, cronConfigured, liveAuctions, failedNotifications, openReports, oldestOpenReportAt }
// cronConfigured — из `TICK_CRON`, переданного в контейнер (W2); при false и liveAuctions > 0 админка показывает предупреждение
```

- [ ] **Шаг 1: падающие тесты:** `OUTBID` не ставится в очередь, если выключено;
  обязательные ставятся всегда; задача отправляет до 20, ошибка транспорта →
  ретрай с задержкой, после 10 попыток `FAILED` и один `error`-лог без адреса;
  тексты: `it.each` по виду — нет слов «выигр», «приз», «розыгрыш», есть ссылка
  на заказ, нет контактов второй стороны. Инъекция: название, комментарий и имя
  с `\r\nBcc: a@b.c` → тема без CR/LF, один получатель; адрес без
  `emailVerifiedAt` — не отправляется. `retry-failed` возвращает в очередь только
  `FAILED` за 48 ч; `/api/admin/health` — только админу.
- [ ] **Шаг 2:** FAIL → реализовать → PASS.
- [ ] **Шаг 3:** коммит `feat: notification outbox and settings`.

### Task 4: Лоты

**Files:**
- Create: `commerce.module.ts`, `commerce-guards.ts`, `listings.controller.ts`,
  `listings.service.ts`, `commerce.mapper.ts`
- Modify: `apps/api/src/products/product-write-guard.ts` (расширить
  `assertProductNotInSale` и `findSellerProductIdsInSale` открытыми заказами),
  `apps/api/src/app.module.ts` (ответ работы не меняется: лот — только в некэшируемом `/lot`)
- Test: `apps/api/test/integration/commerce-listings.integration.spec.ts`

**Interfaces:**
- Produces: `POST /api/works/:productId/listings`, `POST /api/listings/:id/cancel`,
  `POST /api/admin/listings/:id/remove`; `GET /api/works/:publicId/lot` →
  `PublicLot | null` с `serverNow` и `viewer` для вошедшего, `Cache-Control: no-store`
  (ответ работы кэшируется Worker'ом 30 с — `deploy/cloudflare/src/router.ts`
  `publicCacheTtl`; лот в него не кладётся).
  `assertBuyerEligible(tx, { userId, listing }): Promise<void>` — проверки лота
  (своя работа, админ, статус) + `antifraud.assertCanAct(tx, userId, action)`.
  В `/lot` — `contactWindowHours`.

- [ ] **Шаг 1: падающие тесты** (`it.each` по причине отказа): чужая работа,
  скрытая работа, автор не одобрен, почта не подтверждена, уже есть лот,
  открытый заказ, проданная работа (`PRODUCT_ALREADY_SOLD`). Успех: фикс и
  аукцион (сейчас и по расписанию), срок связи по умолчанию 24 ч и выбранный. Снятие: фикс — всегда до покупки; аукцион —
  только без ставок; админ — любой, с `auditEvent`. Ответ `/lot` и метки
  «Забронировано»/«Продано» по таблице COMMERCE §3.2; `viewer.blockedReason` для
  каждой причины отказа покупателю; ответ без сессии не содержит `viewer`;
  заголовок `no-store`; тест Worker: `/api/works/x/lot` не кэшируется. Скрыть работу с лотом → `PRODUCT_IN_SALE`.
  `startsAt` на час позже `now()` базы → `SCHEDULED`, ставка → `LISTING_NOT_OPEN`.
- [ ] **Шаг 2:** FAIL → реализовать → PASS.
- [ ] **Шаг 3:** коммит `feat: create and cancel listings`.

### Task 5: Ставки

**Files:**
- Create: `apps/api/src/commerce/bids.service.ts`
- Modify: `listings.controller.ts` (маршруты ставок), `commerce-guards.ts`
- Test: `apps/api/test/integration/commerce-bids.integration.spec.ts`

**Interfaces:**
- Produces: `POST /api/listings/:id/bids` → `{ bid, lot }`; `GET /api/listings/:id/bids` → последние 20.
  `placeBid(userId, listingId, input): Promise<PlaceBidResult>`.
- Consumes: Task 2, `assertBuyerEligible` (Task 4), `enqueueNotification` (Task 3).

- [ ] **Шаг 1: падающие тесты** (`it.each`): до начала, после `endsAt` (тик не
  прошёл) → `LISTING_NOT_OPEN`; своя работа → `SELF_BID_FORBIDDEN`; админ →
  `ADMIN_BID_FORBIDDEN`; ниже минимума → `BID_TOO_LOW`; не кратно шагу / выше
  предела → `BID_AMOUNT_INVALID`; лидер → `BID_ALREADY_LEADING`; 3 активных
  заказа → `BUYER_ORDER_LIMIT`; 2 страйка → `BUYER_BLOCKED`; повтор ключа —
  тот же ответ; ключ с другой суммой → `IDEMPOTENCY_KEY_REUSED`; ставка за 30 с
  до конца продлевает `endsAt`; предыдущему лидеру — письмо «перебили» в
  очереди, если не выключено. Список ставок без имён и контактов.
  Лимит: 11-я ставка на этот лот за 60 с → 429, первая на другой лот → 200
  (`@RateLimit` из `antifraud`, переживает рестарт). Без контактов →
  `BUYER_CONTACTS_REQUIRED`. Лимит броней считает активные заказы **и** лоты,
  где пользователь сейчас лидер (COMMERCE §7, C8). Страйки, брони и контакты
  добавляются в `antifraud.assertCanAct` (не в `commerce`).
  Сигналы: первая ставка в сессии с проваленным/пустым `turnstileToken` →
  `TURNSTILE_FAILED` (ставка принята); серия по `detectBidBurst` → `BID_BURST`;
  общий браузер с автором лота → `SHARED_BROWSER_WITH_SELLER`; два разных вида —
  `BUYER_BLOCKED` на следующей ставке. Бан: `AntifraudService.onBan(handler)` —
  `commerce` регистрирует аннулирование ставок пользователя в идущих аукционах
  (`voidedAt`) с пересчётом цены и лидера под блокировкой работы; `antifraud` не
  импортирует `commerce`. Ставки второго аккаунта автора сверх сигнала браузера
  — остаточный риск, записать в отчёт, не «закрыто».
- [ ] **Шаг 2:** FAIL → реализовать (блокировка работы → `dbNow` → проверки →
  вставка ставки → условное обновление `currentPriceMinor`, `bidCount`, `endsAt`) → PASS.
- [ ] **Шаг 3:** коммит `feat: place bids`.

### Task 6: Покупка по фиксированной цене

**Files:** Modify: `listings.service.ts` / `listings.controller.ts`; Create: `orders.service.ts` (создание заказа — одна функция для всех источников).
Test: `apps/api/test/integration/commerce-purchase.integration.spec.ts`.

**Interfaces:**
- Produces: `POST /api/listings/:id/purchase`;
  `createOrder(tx, input: { listing; buyerUserId; amountMinor; source; sourceBidId?; status: 'ACTIVE' | 'OFFERED'; buyerComment?; now }): Promise<Order>`
  (номер, код сделки, снимок, сроки, письма — здесь и только здесь).

- [ ] **Шаг 1: падающие тесты:** успех (заказ `ACTIVE`, лот `ENDED`, метка
  «Забронировано», письма обоим); два параллельных `purchase` → один 200 и один
  `LISTING_NOT_OPEN`; покупка снятого лота; условия покупателя как в Task 5.
  `publicId` заказа — `^[A-Za-z0-9_-]{11}$` (`PublicIdService.generate()`), пример
  `BP-7K3M9Q` из макетов не использовать; код сделки — `crypto.randomInt`, ни один
  маршрут не принимает его в пути или query. Два `purchase` с одним ключом —
  один заказ и одинаковый ответ; с другим ключом — `LISTING_NOT_OPEN`.
  `contactDeadlineAt = activatedAt + contactWindowHours`. Срыв заказа по
  фиксированной цене (любая причина) → лот снова `LIVE` в той же транзакции,
  метка пропадает; параллельная новая покупка — ровно один открытый заказ.
- [ ] **Шаг 2:** FAIL → реализовать → PASS.
- [ ] **Шаг 3:** коммит `feat: fixed price purchase`.

### Task 7: Заказы, контакты, страйки

**Files:**
- Create: `orders.controller.ts`, `order-offers.ts`, `apps/api/src/antifraud/trust-signals.ts`
- Modify: `orders.service.ts`, `apps/api/src/antifraud/*` (страйки, брони, контакты в `assertCanAct`)
- Modify: `apps/api/src/admin/*` (снять страйк, сменить исход, бан, сигналы доверия в карточке пользователя — только данные API), `packages/contracts/src/user.ts`, `apps/api/src/auth/*` или `me`-контроллер (контакты, настройки)
- Test: `apps/api/test/integration/commerce-orders.integration.spec.ts`, `trust-signals.spec.ts`

**Interfaces:**
- Produces: маршруты заказов из COMMERCE §12; `PUT /api/me/contacts`;
  `getTrustSignals(tx | prisma, userId): Promise<TrustSignals>`;
  `offerNext(sellerUserId, orderPublicId): Promise<OrderDetail>`;
  `POST /api/admin/orders/:publicId/void-strike`, `/outcome`, `POST /api/admin/users/:id/ban`
  (→ `antifraud.banUser`).

- [ ] **Шаг 1: падающие тесты доступа** (`it.each` по роли: покупатель, автор,
  посторонний, админ, аноним): карточка — 200/200/404/200/401; контакты
  покупателя — автору и админу; контакты автора — покупателю только при
  `showContactsToBuyer = true` (иначе поле отсутствует, есть подсказка со сроком
  связи), админу всегда; в `FAILED` контакты остаются; заметка автора только
  автору и админу. `GET /api/authors/:slug` и `GET /api/works/:publicId`
  не содержат `contactPhone`/`contactTelegram`/`contactInstagram`. После
  `revokeSessions` старая кука → 401 на заказе. `PUT /api/me/contacts` требует
  сессию не старше 5 минут (как привязка входа) и ставит письмо
  `CONTACTS_CHANGED` владельцу; после смены вторая сторона видит новые контакты.
- [ ] **Шаг 2: падающие тесты переходов**: каждая строка COMMERCE §6.1 через
  API, включая «не вышел на связь» и «неверные контакты» до/после
  `contactDeadlineAt` при сроке 1 ч и 72 ч (время двигать через данные, не через
  sleep); отказ покупателя без подтверждения в теле (`confirm: true`) → 400.
- [ ] **Шаг 3: следующий участник:** после `FAILED` аукциона по вине покупателя —
  ничего автоматически; `offer-next` — второму по его лучшей ставке
  (`offerExpiresAt = now + contactWindowHours`), затем третьему; четвёртого нет →
  `NO_NEXT_BIDDER`; заблокированный и аннулированный кандидат пропускается;
  принять при 3 бронях → `BUYER_ORDER_LIMIT`; «Выставить снова» — новый лот
  проходит.
- [ ] **Шаг 4: страйки:** два `FAILED` по вине покупателя → ставка, покупка,
  принятие → `BUYER_BLOCKED`; админ снимает страйк (`auditEvent`) → снова можно.
  Отказ самого покупателя — страйк сразу; страйк по отметке автора
  (`BUYER_REFUSED`/`BUYER_NO_CONTACT`/`BUYER_INVALID_CONTACTS`) начинает считаться
  через 72 ч и не считается, пока по заказу есть открытая жалоба покупателя
  (COMMERCE §7, C9). `void-strike`, `outcome`, `ban` без `reason` → 400;
  `auditEvent` хранит актора, `publicId` заказа, прежнее и новое значение.
  `getTrustSignals` считает по данным (it.each по набору заказов и жалоб).
  `COMPLETED` → письмо `DEAL_COMPLETED` обеим сторонам.
- [ ] **Шаг 5:** FAIL → реализовать → PASS.
- [ ] **Шаг 6:** коммит `feat: order lifecycle, contacts and strikes`.

### Task 8: Задачи тика

**Files:** Create: `apps/api/src/commerce/commerce-tick.ts`. Modify: `commerce.module.ts` (регистрация в `TickService`).
Test: `apps/api/test/integration/commerce-tick.integration.spec.ts`.

**Interfaces:**
- Produces задачи (каждая — до 50 записей за запуск, отдельная транзакция на запись):
  `commerce.activate` (`SCHEDULED → LIVE`), `commerce.close` (`closeListing`),
  `commerce.offers` (истечение `OFFERED`), `commerce.reminders` (письма автору
  через 24 и 48 ч без отметки, условное `sellerRemindersSent`).
  «Требует внимания» у админа (72 ч) вычисляется запросом, не задачей.

- [ ] **Шаг 1: падающие тесты:** лот с `endsAt` в прошлом и ставками → один
  заказ `AUCTION_WIN` для лучшей ставки и письма; без ставок → `ENDED` без
  заказа, письмо автору; два параллельных запуска → один заказ; предложение с
  истёкшим сроком → `FAILED OFFER_EXPIRED`; `ACTIVE` без отметки через 25 ч —
  одно письмо, через 49 ч — второе, повторный запуск не дублирует; через 30 дней
  статус всё ещё `ACTIVE` (автозакрытия нет).
  `/api/admin/health.lastTickAt` = `TickService.lastSucceededAt()` (W2).
- [ ] **Шаг 2:** FAIL → реализовать → PASS.
- [ ] **Шаг 3:** коммит `feat: commerce tick jobs`.

### Task 9: Жалобы и разбор

**Files:** Create: `reports.controller.ts`, `reports.service.ts`. Modify: admin-маршруты.
Test: `apps/api/test/integration/commerce-reports.integration.spec.ts`.

**Interfaces:** `POST /api/orders/:publicId/reports`, `GET /api/admin/reports?status=OPEN`,
`POST /api/admin/reports/:id/resolve { status, faultSide?, adminNote?, orderAction?: { to; failReason? } }`.

- [ ] **Шаг 1: падающие тесты:** жалоба участника в окне 14 дней — да, на 15-й —
  нет; покупатель жалуется после отметки автора «не состоялась» — да; посторонний
  — 404; вторая открытая от того же — 409; вторая сторона получает письмо без
  текста жалобы; открытая жалоба покупателя замораживает страйк; разбор админом меняет
  заказ по таблице и пишет `auditEvent`; `UPHELD` с виной автора учитывается в
  `getTrustSignals`. 6-я жалоба от одного пользователя за час → 429; `resolve`
  без `adminNote` → 400.
- [ ] **Шаг 2:** FAIL → реализовать → PASS.
- [ ] **Шаг 3:** коммит `feat: order reports and admin resolution`.

### Task 10: «Требует внимания» и избранное

**Files:** Create: `attention.service.ts` (+ маршрут), `apps/api/src/favorites/*`.
Test: `commerce-attention.integration.spec.ts`, `favorites.integration.spec.ts`.

**Interfaces:** `GET /api/me/attention` → `{ items: AttentionItem[] }`
(`OFFER_RECEIVED`, `ORDER_NEEDS_CONFIRMATION`, `AUCTION_FAILED_CHOICE`, `ORDER_REPORTED`,
`CONTACTS_REQUIRED`); `GET /api/admin/attention` → заказы с открытой жалобой (с
контактами обеих сторон), `ACTIVE` без отметки ≥ 72 ч, активные блоки антифрода;
`PUT/DELETE /api/works/:productId/favorite` (идемпотентно), `GET /api/me/favorites`
(курсорная пагинация как в каталоге; только публичные работы).

- [ ] **Шаг 1: падающие тесты** (`it.each` по виду элемента); избранное: дважды
  PUT — одна строка; скрытая работа пропадает из списка, но строка не удаляется.
- [ ] **Шаг 2:** FAIL → реализовать (один запрос на вид, без N+1) → PASS.
- [ ] **Шаг 3:** коммит `feat: attention list and favorite works`.

### Task 11: Гонки

**Files:** Create: `apps/api/test/integration/commerce-races.integration.spec.ts`.

- [ ] **Шаг 1:** сценарии COMMERCE §11 через `Promise.all` на реальной БД:
  50 ставок разных пользователей с возрастающими суммами (итог: цена = максимум
  из принятых, `bidCount` = числу строк `bids`, у отклонённых — только
  `BID_TOO_LOW`); 10 одновременных
  покупок; снятие против покупки; первая ставка против снятия; ставка против
  тика закрытия; два тика; бан против ставки того же пользователя; срыв
  фиксированной покупки против новой покупки.
- [ ] **Шаг 2:** прогнать 5 раз подряд — стабильно PASS. Нестабильность — дефект
  кода, не теста; таймауты не увеличивать.
- [ ] **Шаг 3:** коммит `test: commerce race scenarios`.

## Фронтенд

Только клиент API (интерфейс — W4).

### Task 12: `packages/api-client`

**Files:** Create: `packages/api-client/src/commerce.ts`. Modify: `src/index.ts`. Test: спек клиента по образцу существующих.

**Interfaces:** `createCommerceClient(context)` — метод на каждый маршрут
COMMERCE §12, парсинг ответов схемами из `commerce.ts`; `idempotencyKey`
передаёт вызывающий.

- [ ] Тест на 2–3 представительных метода (путь, метод, тело, разбор ответа) → реализовать → PASS → коммит `feat: commerce api client`.

## Документы и проверки

### Task 13

- [ ] `10-CODE-ARCHITECTURE.md`: модуль продаж, строки «Владельцы логики»
  (продажи, часы, письма, антифрод), инварианты транзакций, очередь писем,
  частичные индексы. `docs/ops/ENVIRONMENT.md` — `SUPPORT_TELEGRAM_URL`,
  `SUPPORT_EMAIL` (контейнер и сборка веба). `11-PROJECT-STATUS.md`: запись
  по каждому блоку (`Implemented` только с тестами). Расхождения с RFC — в статус.
- [ ] Проверки: `typecheck`, `lint` для `@bidplace/contracts`, `@bidplace/database`,
  `@bidplace/api-client`, `@bidplace/api`, `@bidplace/mobile` (компилируется);
  API unit + вся интеграция; `git diff --check`; `pnpm docs:link-check`.
- [ ] `EXPLAIN` для трёх горячих запросов (лот по работе, мои заказы, список
  `attention`) — индекс используется; вывод в отчёт.
- [ ] Коммит `docs: record commerce backend`.

## Промпт исполнителю

```text
Работай в /Users/yayauheny/projects/bidplace, ветка feature/commerce-backend от main.
Прочитай AGENTS.md, docs/launch/AGENT-RULES.md, docs/launch/COMMERCE.md и целиком
docs/launch/waves/W3-commerce-backend.md. Скиллы: implement, nest, security +
superpowers subagent-driven-development, test-driven-development,
verification-before-completion. Task 1 → Task 13 по порядку. Один коммит на задачу. Правила — только
из COMMERCE.md; если правило там неясно, это вопрос основателю, а не Ruling.
Push/merge/deploy не делать. Отчёт по AGENT-RULES §6.
```

## Промпт ревьюеру

```text
Прочитай docs/launch/AGENT-RULES.md §7, docs/launch/COMMERCE.md и
docs/launch/waves/W3-commerce-backend.md. Ревью ветки feature/commerce-backend
против main. Скиллы: code-review-best-practices, nest, security. Сам прогони
интеграционные тесты продаж (гонки — 3 раза), сверь каждую строку таблиц
COMMERCE §3.2, §6.1, §7, §11 с кодом и тестами. Вердикт по AGENT-RULES §7.
```

Инварианты:
- каждое изменяющее действие продаж: транзакция → блокировка работы → `dbNow` →
  проверки → условные записи; ни одного `update` статуса без условия;
- правила переходов только в `listing-state.ts`/`order-state.ts`;
- заказ создаётся только `createOrder`;
- письма только через `enqueueNotification` внутри транзакции;
- контакты только в карточке заказа участнику/админу (автора — по его настройке);
- «можно ли действовать» решает только `antifraud`;
- деньги — `Int` + валюта.

Красные флаги: `Decimal` или `float` для денег; `new Date()` для решений о
сроках внутри транзакции; `Serializable` без причины; полиморфные «стратегии»
лотов вместо `type`; таблица блокировок или рейтинга внутри `commerce`
(блоки — только `antifraud`); таймер, сам завершающий заказ; WebSocket;
жалобы на работы/авторов в API запуска; удаление заказов, ставок, жалоб.

## Аудит плана 2026-10-30

Проверено по `feature/commerce-backend` (`66181a00`), ветка не менялась.

- Deadlock ставка/покупка против бана **не подтверждён**: ставка, покупка и
  заказы блокируют работу, затем пользователя; бан (`updateUserStatus` +
  хук `onBan` в `bids.service.ts`) блокирует работы по id до пользователей и
  перепроверяет набор. Deadlock Postgres приходит как `P2034` и повторяется
  `runReadCommittedTransaction`. Порядок записан в Global Constraints.
- `users.phone`: Task 1 противоречил COMMERCE §10; исправлено в пользу §10,
  ветка поле сохранила (читатель — `auth.mapper.ts`).
- Предложенное решение `DEC-152` (ожидает подтверждения основателя): бан = `User.status =
  banned`, `SUSPENDED` — только профиль автора, лоты снимает админ отдельно.
- **Пробел при утверждении DEC-152 (проверено на `d8df946c`):** статус
  продавца-пользователя не проверяется ни в одном пути продаж, поэтому по лотам
  забаненного продавца проходят:
  - ставка — `CommerceGuards.describeBuyer` (`commerce-guards.ts`) проверяет
    только покупателя; `BidsService.placeBid` не проверяет и `SellerProfile`;
  - покупка — `OrdersService` (`orders.service.ts` ~174–179) проверяет только
    `SellerProfile.status` через `assertApprovedSeller`;
  - тик — `CommerceTick.closeOne` (`commerce-tick.ts` ~178–247) вызывает
    `createOrder` (`AUCTION_WIN`) без проверки продавца.
  До подтверждения DEC-152 не считать это согласованным требованием к W3.
  Принятие уже созданного предложения (`accept` → `commitOutcomeInTransaction`)
  продавца тоже не проверяет; по `DEC-152` действующие заказы разбираются
  вручную, поэтому это не дефект. Тестов на забаненного продавца нет. Фикс —
  одна проверка в одном владельце для ставки, покупки и тика, плюс
  интеграционный тест на каждый из трёх путей; исход лота в тике при
  забаненном продавце (закрыть без заказа) — `Ruling:` исполнителя.

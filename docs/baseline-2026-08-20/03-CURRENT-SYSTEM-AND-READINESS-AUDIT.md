# bidplace — реальное состояние системы и готовность к пилоту

Снимок проверен на branch `fix/final-pen-v2-rework`, HEAD `aadfba3d900080686488d9104bba0374338fc326`.

> **Актуализация 2026-08-21 (P0-1).** `ListingLifecycleService.close` больше не
> держит `ENDED` и `Order.create` в одной транзакции. Generic ошибка создания
> Order оставляет Listing в `ENDED`; admin recovery остаётся путём восстановления.
> Evidence: `docs/product/11-PROJECT-STATUS.md` (запись 2026-08-21),
> `apps/api/test/integration/auction/lifecycle.integration.spec.ts`,
> `apps/api/src/orders/create-winner-order.ts`. Остальные P0 ниже без изменений.

Цель этого файла — не описывать желаемый продукт, а честно отвечать: что уже существует, какие реальные поля и маршруты доступны, что работает частично и что блокирует живую продажу.

## 1. Короткий вывод

Архитектуру переписывать с нуля не нужно. Modular NestJS monolith, PostgreSQL/Prisma, shared Zod contracts, typed API client, React Query, Expo Router и Socket.IO подходят текущему масштабу.

Проект остаётся **NO-GO для первого необратимого реального аукциона** из-за оставшихся P0 (P0-1 закрыт 2026-08-21):

1. ~~обычная ошибка `Order.create()` может откатить `ENDED`~~ — **закрыто**: двухфазный close;
2. ~~нет forgot/reset password~~ — **закрыто 2026-08-21**: neutral forgot, hashed token, session invalidation;
3. founder не может безопасно остановить проблемный Listing или заблокировать User без ручной БД;
4. загрузка изображения допускает дорогой decode до полной проверки capability и не ограничивает pixels/frames/concurrency;
5. не доказаны воспроизводимый production release, backup и restore.

Новые Fixed/Offer/Scheduled decisions добавляют архитектурную работу, но не отменяют эти P0.

Актуализация scope: Fixed/Offer больше не входят в первый MVP и не являются launch-blocker. Новый подтверждённый design/code gap — у автора нет структурированных карточек опыта, выставок и других фактов, нет выбора трёх публичных акцентов и нет соответствующих contract/API/storage полей.

## 2. Текущая архитектура

```text
apps/api
  NestJS HTTP + scheduler + Socket.IO

apps/mobile
  Expo Router для web/iOS/Android

packages/contracts
  Zod-схемы запросов, ответов и событий

packages/api-client
  типизированный клиент с runtime validation

packages/database
  Prisma schema, migrations, seed

packages/design-tokens
  текущий общий слой токенов
```

Правильные границы уже существуют:

- Product отделён от Listing;
- AuctionRules отделены от Product;
- Bid и Order — отдельные сущности;
- server time и transaction определяют результат;
- public/private projections разделены;
- realtime не подменяет canonical HTTP state;
- analytics пишет first-party events отдельно от Bid/Order facts.

## 3. Реальная модель данных

### User

Сейчас хранит:

- `email` — обязательный и уникальный;
- `passwordHash`;
- `displayName`;
- `role` строкой, обычно user/admin;
- `status` строкой, default active;
- `sessionVersion`;
- `emailVerifiedAt`;
- legacy `phone`, `phoneVerifiedAt` и phone codes;
- Terms acceptances;
- bids, buyer/seller orders, audit events.

Проблемы/границы:

- ~~password recovery отсутствует~~ — **закрыто 2026-08-21**: neutral forgot, hashed token, session invalidation;
- User status есть, но полного reasoned admin ban/unban flow нет;
- phone verification — legacy, не текущий auth direction;
- social login отсутствует и сейчас не приоритет.

### SellerProfile

Реальные публичные поля:

- `slug`;
- `sellerType`;
- `discipline`;
- `fullName`;
- `country`;
- profile photo;
- `shortDescription`;
- legacy `socialLink`;
- структурированные `telegramUrl`, `instagramUrl`, `websiteUrl`.

Не реализовано:

- универсальные карточки фактов автора;
- период/одиночный год/факт без даты;
- ручной выбор и порядок максимум трёх публичных акцентов;
- полный публичный список «Опыт и события».

Реальные приватные поля передачи:

- `handoffContactType`: Telegram, Phone или Instagram;
- `handoffContactValue`;
- `handoffInitiator`: buyer contacts seller либо seller contacts buyer.

Статусы:

```text
PENDING_REVIEW
APPROVED
CHANGES_REQUESTED
REJECTED
SUSPENDED
```

Capability: создавать/изменять Product, Listing и изображения может только approved seller. Public projection не должен раскрывать handoff contact.

Известный security gap: generic URL schema допускает не только HTTPS для public links. До пилота нужен allowlist безопасных schemes.

### Product

Реальные поля:

- `title`;
- `categoryId`;
- `story`;
- `technique`;
- `materials`;
- `dimensions`;
- `weight`;
- `year`;
- `condition`;
- `uniqueness`;
- `provenance`;
- `city`;
- `packaging`;
- `deliveryInfo`;
- `creationIntro`;
- `publishedAt`;
- 1–10 Product images;
- до 20 creation steps с title, body и optional process image.

Статусы:

```text
DRAFT
PENDING_REVIEW
CHANGES_REQUESTED
APPROVED
REJECTED
ARCHIVED
```

Фактический contract различает optional/nullable поля. Для creator-made work `condition` и `packaging` не являются обязательным gate. `deliveryInfo` и подтверждённые обязательные данные проверяются при submit/publication в service layer.

Текущий storage: оригинальные Product, process и profile images хранятся как BYTEA в PostgreSQL. Для закрытого пилота это допустимо, но требует безопасного decode, thumbnails/versioned URLs и capacity plan.

### Listing

Реальный `ListingType` содержит только:

```text
AUCTION
```

Поля:

- `productId`;
- `type`;
- `status`;
- `currency = BYN`;
- `startsAt`;
- `originalEndsAt`;
- `endsAt`;
- `currentPrice`;
- `bidCount`;
- `closedAt`.

Статусы:

```text
DRAFT
SCHEDULED
LIVE
ENDED
CANCELLED
```

AuctionRules:

- `startPrice`;
- `incrementPolicyCode = MVP_BYN_V1`;
- soft close `60 / 60 / 600`.

Listing create contract принимает только `startsAt`, `endsAt`, `startPrice`. После create отдельное действие `SCHEDULE` переводит draft дальше. Такой двухшаговый UI может оставлять и размножать DRAFT после reload.

Fixed price, `allowOffers`, универсальный release mode, quantity/edition и publication lock в schema отсутствуют.

### Bid

Поля:

- `listingId`;
- `bidderUserId`;
- `idempotencyKey`;
- `amount`;
- `createdAt`.

Инварианты сервиса:

- email и текущие правила приняты;
- self-bid запрещён;
- admin не ставит;
- server time/status/minimum authoritative;
- serializable transaction;
- CAS retry до трёх полных попыток;
- стабильные business codes, включая `BID_TOO_LOW` с `details.minimumBid`;
- aliases стабильны только внутри одного Listing.

### Order

Поля сейчас полностью привязаны к аукциону:

- обязательный `listingId`;
- обязательный и unique `sourceBidId`;
- seller/buyer IDs;
- `finalAmount`;
- `contactDueAt`;
- snapshot seller handoff contact;
- snapshot buyer email;
- handoff initiator;
- status/cancellation reason.

Статусы:

```text
PENDING_CONTACT
CONTACTED
COMPLETED
HANDOFF_FAILED
CANCELLED
```

Cancellation reasons:

```text
BUYER_DECLINED
BUYER_UNREACHABLE
ADMIN_CANCELLED
```

Order уже имеет role-scoped buyer/seller/admin projections. Но Product title для `productSummary` читается из изменяемого Product, а не из snapshot. Seller inbox отсутствует. Fixed и accepted Offer не могут создать Order без пересмотра source model.

### TermsAcceptance

Сейчас доказательство состоит из:

- `userId`;
- `rulesVersion`;
- `acceptedAt`.

Не хранится immutable archive текста/хэш документа. Для юридически значимого доказательства нужна подтверждённая юристом модель версий, архива и retrieval.

### Analytics

Реализованы:

- `AnalyticsEvent`;
- `AcquisitionAttribution` first-touch;
- anonymousId в AsyncStorage;
- link userId после register;
- request ID/logging;
- admin overview.

События: listing viewed, seller viewed, registration started, bid CTA clicked, bid rejected. Bid/Order outcomes берутся из business DB.

Открытые gaps:

- event idempotency/retention/abuse budget;
- неверные/несуществующие drilldown routes;
- несогласованные attribution длины contract vs VARCHAR;
- server-owned environment и bounds;
- auction sold-rate cohorts;
- будущая общая модель Fixed/Auction/Offer.

## 4. Реальные пользовательские маршруты

### Public

- `/` — Home;
- `/works` — список работ;
- `/authors` — список авторов;
- `/search` — поиск;
- `/product/[publicId]` — работа, About/Creation/Bids и auction action;
- `/seller/[slug]` — публичная витрина автора.

### Auth

- `/login`;
- `/register`;
- `/forgot-password` — запрос ссылки с neutral `{ ok: true }`;
- `/reset-password?token=` — новый пароль и invalidation сессий.

Social login routes отсутствуют и не приоритетны.

### Buyer

- `/me/activity` — «Мои покупки» по ставкам пользователя;
- `/order/[publicId]` — role-aware Order detail.

Activity statuses уже существуют:

```text
LEADING
OUTBID
WON
LOST
AWAITING_SELLER_CONTACT
WIN_CANCELLED
COMPLETED
```

Экран имеет loading/error retry/empty/list. В карточке пока нет полноценного preview image. Cancelled Order может создавать плохую навигацию/403 в отдельных состояниях — P1.

### Seller

- `/profile` в seller group — создание/редактирование профиля;
- `/products/new`;
- `/products/[id]` — server-backed Product draft editor;
- `/listings/new` — отдельная auction configuration.

Нет единого «Мои работы/продажи», seller Order inbox и resume списка Listing drafts. Продавец может открыть конкретный Product editor, если знает маршрут/переходит из существующего UI.

### Admin

- `/admin` — authors/works moderation;
- `/admin/analytics` — metrics.

API содержит:

- seller/product moderation;
- Order cancellation/replacement;
- ranked bids;
- `GET /api/admin/listings/needs-order`;
- `POST /api/admin/listings/:listingId/create-order`.

Но missing-Order recovery пока API-only: admin screen не показывает очередь/action. Нет safe user ban/unban, session revoke, emergency Listing hide/cancel и stuck-SCHEDULED recovery UI/API.

## 5. Реальное состояние основных экранов

| Экран | Код | Данные | Главный пробел |
|---|---|---|---|
| Home | частично | real discovery API | новый дизайнерский scope/voting не подтверждён backend |
| Works | частично/реализован функционально | server filters/sort/pagination | visual/founder/device acceptance |
| Authors | частично | approved profiles | visual/device acceptance |
| Search | реализован базово | works/authors | новая Figma должна сохранить реальные query limits |
| Product | функционально силён | real Product/Listing/Bid | auction-only, Fixed/Offer отсутствуют |
| Creator | функционально | public profile + works | точная visual acceptance |
| Auth | реализован email/password | register/login/session/forgot/reset | stable all-domain error codes |
| Email gate | реализован | email OTP + rules | production SMTP/recovery proof |
| Become creator | частично | реальные public/private fields | final design/device QA, rejected recovery |
| Create work | частично/функционально | real Product fields/story/images | designer хочет один проход с sale config; код разделён |
| Create sale | auction-only | starts/ends/start price | draft resume, Fixed/Offer/generalized Sale |
| My purchases | реализован базово | Activity | richer cards/states, cancelled link issue |
| My sales | нет | products/listings/orders разрознены | отдельный кабинет и seller Order inbox |
| Order/handoff | реализован по direct route | role-scoped Order | discoverability seller, snapshots, legal copy |
| Admin moderation | частично | authors/works | incident controls и recovery queues |
| Admin analytics | реализован | PG aggregations | correctness/routes/bounds |

## 6. P0 до живого пилота

### P0-1: close и outcome в одной транзакции — закрыто 2026-08-21

Ранее `close()` делал `ENDED` и `Order.create` в одной serializable transaction, и generic ошибка откатывала `ENDED`.

Текущее поведение:

```text
TX1: LIVE → ENDED (commit)
→ emit listing.ended
createWinnerOrder: each attempt is a fresh TX
  P2002 public_id → retry outside aborted TX
  P2002 source_bid_id → root findUnique → already_exists
```

Real PostgreSQL `orders_public_id_key` collision leaves `ENDED` and creates exactly one Order after retry. Secondary generate-throw still proves generic post-close errors cannot roll back to `LIVE`. Cron изолирует activate/close per Listing. См. `11-PROJECT-STATUS.md` 2026-08-21.

### P0-2: нет восстановления пароля — закрыто 2026-08-21

Ранее не было forgot/reset routes, token model и mobile screens.

Текущее поведение:

```text
POST /auth/password/forgot → always { ok: true }
  active user → invalidate unused tokens → create tokenHash → send link
  SMTP fail → delete token, still { ok: true }
POST /auth/password/reset → passwordHash + usedAt + sessionVersion++ in one TX
```

Mobile: `/forgot-password`, `/reset-password?token=`, login link on sign-in. См. `11-PROJECT-STATUS.md` 2026-08-21.

### P0-3: нет emergency controls

При prohibited item, compromised seller или abuse admin вынужден использовать SQL. Нужны маленькие reasoned/idempotent/audited actions, а не generic CRUD:

- hide/cancel Sale;
- ban/unban User;
- revoke sessions;
- inspect affected bids/deals;
- recovery queue.

### P0-4: image resource exhaustion

Multipart validation вызывает тяжёлый `sharp(...animated).raw().toBuffer()` до полной seller capability boundary, параллельно и без pixel/frame budget. Нужны authorization first, request rate limit, max dimensions/pixels/pages/frames, bounded decode и canonical normalization.

### P0-5: release/backup/restore

Нельзя доказать, что чистый checkout воспроизводимо проходит полный gate и production DB/media восстанавливаются. Нужны exact toolchain, one CI gate, deploy runbook, backup policy, restore в отдельную БД и sample integrity checks.

## 7. P1 до/в начале первых 5–10 пользователей

- seller Orders inbox;
- generic Deal inbox с учётом будущего Fixed/Offer;
- stuck expired SCHEDULED rule и admin recovery;
- UI для `needs-order`;
- immutable Order identity snapshot;
- адекватный replacement contact deadline;
- DB constraints для cross-listing Bid/Order и active deal invariants;
- server-backed Sale draft resume без duplicates;
- recovery для `REJECTED` Product/Seller states;
- keyboard-operable Bid confirmation;
- точные Activity states без forbidden link;
- stable codes для auth/seller/product/order;
- HTTPS-only public social links;
- SMTP smoke и patched dependencies;
- `/health` readiness с БД;
- environment fail-closed consistency;
- metadata-only Product reads, versioned media URLs и thumbnails;
- analytics contract/DB lengths, route links, cohorts, bounds;
- воспроизводимый full browser E2E.

## 8. Новые gaps из multi-format решения

Их не было в старом audit scope, потому что решение принято позже:

- `ListingType` всё ещё только AUCTION;
- `Order.sourceBidId` обязателен;
- `currentPrice`, `bidCount`, `endsAt` смешаны с общими полями Listing;
- Fixed rules отсутствуют;
- Offer entity/lifecycle отсутствует;
- release не отделён от auction scheduling;
- Sale status не отделён от Deal status;
- quantity/edition отсутствуют;
- publication lock не закреплён backend-инвариантом;
- currency concept есть, но contract буквально допускает только BYN;
- admin operations auction-specific и неполны;
- analytics dashboard концептуально auction-heavy;
- Create Product и Create Listing разделены, тогда как новый seller UX хочет один последовательный проход.

Это не повод строить generic workflow engine. Нужен небольшой domain architecture pass до Fixed implementation.

## 9. Ревью значимых commits

### `7189219`

Корректно добавлены:

- business error contract для bidding;
- CAS retry до трёх попыток;
- seller handoff gate;
- admin needs-order API;
- idempotent recovery при уже существующем Order;
- новые integration suites.

Не подтверждены или неполны на момент аудита (часть закрыта позже):

- ~~unconditional `ENDED` при generic Order failure — P0~~ — **закрыто 2026-08-21** (двухфазный close + real publicId collision + generate-throw integration);
- пропущенный целиком SCHEDULED interval — P1;
- recovery UI — P1;
- ~~retry P2002 внутри той же failed PostgreSQL transaction~~ — **закрыто 2026-08-21** (каждая попытка createWinnerOrder — fresh TX; P2002 обрабатывается после abort).

Формулировка после 2026-08-21: **необратимость close доказана для generic Order failure**; остальные pilot P0 остаются.

### `450d405`

Полезная first-party analytics foundation реализована и не должна заменяться SaaS только ради dashboard. Но до доверия метрикам нужны fixes из P1: routes, limits, environment authority, cohort definitions, idempotency/retention.

## 10. Что не надо менять из-за аудита

- modular monolith;
- PostgreSQL/Prisma;
- Expo Router как один responsive product;
- shared contracts/API client;
- React Query + canonical refetch;
- current bidding concurrency approach;
- manual moderation;
- DB blob storage немедленно целиком — сначала limits/derivatives/capacity;
- канонический Pen в code task.

## 11. Evidence, необходимый для смены статуса

Функция становится «Реализовано» только если одновременно есть:

- server behavior;
- shared contract;
- UI primary flow и error/retry states, если пользовательская функция;
- unit test;
- PostgreSQL integration для transaction/permission/data boundary;
- browser E2E для полного role flow;
- typecheck/lint/build affected graph;
- обновлённый этот файл с commit и точными модулями;
- отсутствие `.pen` diff;
- для release/security — отдельная rehearsal evidence, не только unit tests.

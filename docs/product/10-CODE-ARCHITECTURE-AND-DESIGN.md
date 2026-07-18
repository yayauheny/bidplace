# bidplace — код, архитектура и дизайн

Последнее обновление: 2026-07-18  
Статус: Confirmed как целевая рамка; фактический снимок сверён с репозиторием 2026-07-18

## 1. Назначение

Этот документ связывает целевые архитектурные правила bidplace с фактической структурой кода. Точный статус функций и расхождения с MVP принадлежат `11-PROJECT-STATUS.md`.

## 2. Фактический baseline

- TypeScript monorepo;
- pnpm `11.7.0` и Turborepo `2.4.4`;
- Node.js `22+`;
- NestJS `10.4.x`;
- PostgreSQL `16` локально и Prisma `6.19.3`;
- Zod `3.24.x` как runtime contract validation;
- Expo Router `57`, React `19.2.3`, React Native `0.86`, Tamagui `2.4.5`;
- React Query `5.101.2` и React Hook Form `7.81.0`;
- Socket.IO `4.8.1` на backend;
- argon2;
- Vitest, ESLint и Prettier.

```text
apps/
├── api       NestJS HTTP API, scheduler и Socket.IO gateway
└── mobile    Expo Router client для native и web
packages/
├── contracts       Zod-схемы и общие типы
├── api-client      typed HTTP client
├── database        Prisma schema, migrations, generated client и seed
├── design-tokens   общие визуальные токены
├── config          загрузка и валидация окружения
├── eslint-config   общий ESLint config
└── tsconfig        базовые TypeScript configs
```

## 3. Фактические границы приложений

### `apps/api`

- `auth` — регистрация, вход, текущая сессия, logout и guards;
- `sellers` — seller profile и публичная страница продавца;
- `categories` — публичный справочник;
- `lots` и `images` — создание лота, binary image storage, чтение, удаление и порядок;
- `auctions` — создание, публикация, public read и lifecycle scheduler;
- `bids` — ставка и история ставок;
- `admin` — списки, ban пользователя, hide аукциона и просмотр ставок;
- `core` — config, Prisma, validation, errors, rate limit, time и realtime.

Controllers остаются тонкими; бизнес-правила находятся в services и `core/auction`.

### `apps/mobile`

Expo Router разделяет public, auth, seller и admin route groups. React Query хранит server state, общий API client валидирует ответы Zod-схемами, формы используют RHF. На момент снимка клиент обновляет аукцион после HTTP mutation; Socket.IO subscription в mobile отсутствует.

### Shared packages

`@bidplace/contracts` является владельцем HTTP/event shapes. `@bidplace/api-client` использует эти схемы на границе клиента. Prisma-типы не публикуются как API-контракт.

## 4. Фактическая модель хранения

Prisma содержит:

- `User` — email, phone, password hash, role, status и `sessionVersion`;
- `SellerProfile` — capability продавца и публичные поля;
- `Category`;
- `Lot`;
- `LotImage` — бинарные данные, MIME, размер, checksum и position;
- `Auction`;
- `Bid`.

Миграции: baseline и перенос изображений из legacy URL-array в `lot_images`. Отдельных сущностей verification, moderation review, audit log, handoff, sale confirmation и analytics нет.

Фактические auction statuses:

```text
draft | scheduled | active | ended | sold | cancelled | failed | hidden
```

Это не полностью совпадает с продуктовой машиной состояний из `05-MVP-RFC.md`: `pending_review`, `ended_with_winner`, `ended_no_winner`, `sale_confirmed` и `handoff_failed` отсутствуют.

## 5. HTTP API

- глобальный prefix: `/api`;
- auth: `/api/auth/*`;
- public: categories, auctions, sellers и опубликованные images;
- seller: profile, lots, auctions и bid history;
- admin: users, auctions и bids;
- ошибки нормализуются общим exception filter;
- request/response schemas принадлежат `packages/contracts`;
- auth принимает HttpOnly cookie либо bearer token.

`reservePrice` сейчас входит в общий `Auction` contract и поэтому раскрывается public API. Это фактическое расхождение, а не целевой принцип.

## 6. Ставка и конкурентность

Единый entry point: `BidsService.placeBid(userId, auctionId, input)`.

Реализовано:

- запрет self-bid;
- active/start/end/lot checks по server time;
- minimum increment;
- serializable transaction с retry;
- compare-and-update по `currentPrice` и `endsAt`;
- атомарные price, bidCount и bid status;
- post-commit Socket.IO events.

Не реализовано:

- phone verification gate;
- idempotency key и уникальный индекс;
- ограничение MVP currency до BYN;
- долговечный audit record.

## 7. Lifecycle и winner

Nest scheduler запускается каждые 30 секунд с `waitForCompletion`. Lifecycle service:

- активирует scheduled auctions по server time;
- закрывает due scheduled/active auctions в serializable transaction;
- выбирает highest eligible bid с детерминированным tie-break;
- проверяет reserve;
- записывает `sold`/`failed`, winner и bid statuses;
- защищён status predicate, поэтому повторное закрытие идемпотентно;
- публикует events после commit.

Долговечный close audit отсутствует. Scheduler встроен в API process; отдельная deployment topology и single-scheduler guarantee не описаны.

## 8. Realtime

Backend публикует:

- `auction.updated`;
- `bid.placed`;
- `auction.ended`.

Gateway объединяет подключения по `auctionId`. Event payloads проходят Zod validation и не содержат email/phone. Не реализованы event version, gap detection, reconnect snapshot и mobile subscription. HTTP/DB остаются источником истины.

## 9. Изображения

Backend ограничивает число и размер файлов, проверяет declared MIME, signature и декодирование через Sharp, не принимает SVG, хранит checksum и отдаёт `nosniff`/ETag/cache policy. Draft images доступны owner/admin, published images — публично. Есть транзакционные delete/reorder и integration tests.

Не реализованы требования минимум трёх изображений, content moderation и внешнее object storage.

## 10. Security boundaries

Реализовано:

- argon2 password hashing;
- signed expiring session token;
- session invalidation через `sessionVersion`;
- active-user check на каждом guarded HTTP request;
- admin guard;
- in-memory rate limit для register/login/bids/lot creation;
- owner checks для seller resources;
- отсутствие stack trace в HTTP 5xx response;
- image content validation и защита draft images.

Открытые риски:

- нет phone verification и abuse trail;
- rate limit не распределён между instances;
- admin mutations и bids не пишутся в audit log;
- public contract раскрывает hidden reserve;
- seller profile активируется без admin approval;
- нет CI security scan, backup/restore evidence и production deployment config.

## 11. Tests

### Unit

Покрыты auth/token/guards, rate limit, contracts, persistence parsers, seller/lot/image/auction/bid services, lifecycle, realtime publisher и admin operations.

### Integration

Есть PostgreSQL tests для concurrent bids, close race, duplicate close, reserve cases, transaction rollback и image access/mutations.

### Missing

- end-to-end mobile flow;
- 10-user rehearsal/load test;
- client reconnect/gap recovery;
- phone verification;
- moderation, privacy, handoff и sale confirmation;
- production deployment, backup и restore verification.

## 12. Configuration and operations

Environment schema валидируется Zod и включает database, API/CORS, proxy, rate-limit, image limits, JWT и optional Telegram settings. Локальный `docker-compose.yml` поднимает только PostgreSQL. Production Dockerfile, deployment manifests, CI workflow, observability, backups и restore test не найдены.

Seed требует исправления: он использует удалённое поле `Lot.images`, legacy statuses и USD, поэтому не подтверждает готовый BYN demo flow.

## 13. Целевые принципы

1. Backend — источник истины.
2. Audit-first для bids, close, handoff и будущих payments.
3. Не строить future marketplace заранее.
4. Manual operations предпочтительнее premature automation.
5. Одна доменная норма — одна реализация.
6. WebSocket ускоряет отображение, но не определяет результат.
7. Contracts меняются совместно в server, shared schema и client.

## 14. Целевые extension points

- `SellerKind`: `CREATOR`, `PUBLIC_PERSON`, `AUTHORIZED_REPRESENTATIVE`; `BRAND` не добавлять сейчас.
- `ProvenanceRelation`: created/owned/signed/authorized first-party; MVP — created.
- Не заменять `Auction` общей `Sale` abstraction до появления минимум двух дополнительных форматов.
- Payments после validation требуют Order, Payment, Ledger, Payout, Refund и Delivery; balance только через ledger.

## 15. Design principles

- content first: предмет, человек, история, детали, затем аукцион;
- mobile first для social traffic;
- calm urgency без дешёвого давления;
- editorial quality и крупные изображения;
- visible trust signals;
- без mass-market языка, discount-first UI и бесконечных шумных grids.

Фактические UI-расхождения перечислены в `11-PROJECT-STATUS.md`; текущий storefront не является основанием менять продуктовый контракт.

## 16. Anti-patterns

- business logic в UI;
- winner из socket order;
- hard delete bids;
- manual price edit;
- scattered status strings;
- balance без ledger;
- отсутствие idempotency;
- public PII или hidden reserve;
- generic abstractions до спроса;
- AI moderation до правил;
- discount-first design.

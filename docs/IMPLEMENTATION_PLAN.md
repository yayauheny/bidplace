# План реализации

## 1. Принцип выполнения

Работа идёт по небольшим валидируемым срезам.

Не делаем огромный one-shot implementation.

Порядок:

- сначала фиксируем решения и RFC;
- затем backend и тесты;
- потом web;
- потом polish и foundation для следующих этапов.

## 2. Приоритеты реализации

### Сначала

- backend domain model;
- auth;
- Prisma schema;
- core auction logic;
- tests;
- seed data.

### Потом

- web list;
- auction page;
- seller page;
- seller create flow;
- minimal admin.

### После стабилизации MVP

- buy now;
- richer seller flow;
- categories UX;
- report/moderation improvements.

## 3. План по этапам

### Этап 0. Документация и фиксация решений

Результат:

- продуктовые решения зафиксированы;
- MVP scope зафиксирован;
- roadmap зафиксирован;
- implementation order зафиксирован.

Задействованные файлы:

- `docs/PRODUCT_DECISIONS.md`
- `docs/RFC_MVP_AUCTIONS.md`
- `docs/FUTURE_ROADMAP.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/ARCHITECTURE.md`
- `docs/API_CONTRACTS.md`

### Этап 1. Backend foundation

Сделать:

- подключить Prisma schema;
- описать enum-ы и сущности MVP;
- подготовить миграции;
- подключить auth module;
- добавить `argon2`;
- завести seller module;
- завести lot module;
- завести auction module;
- завести bid module.

Проверка:

- Prisma generate проходит;
- миграция применяется локально;
- typecheck проходит.

### Этап 2. Auction domain logic

Сделать:

- создание seller profile;
- создание lot;
- создание auction;
- publish flow;
- bid placement;
- reserve logic;
- winner selection;
- cron auction closing.

Проверка:

- unit tests на bid rules;
- integration tests на auction lifecycle.

### Этап 3. Realtime

Сделать:

- WebSocket gateway;
- подписка клиента на auction room;
- события `auction.updated`, `bid.placed`, `auction.ended`.

Проверка:

- ручная локальная проверка;
- integration coverage на event trigger points по возможности.

### Этап 4. Admin MVP

Сделать:

- список пользователей;
- бан пользователя;
- список аукционов;
- просмотр ставок;
- скрытие аукциона.

Проверка:

- базовые route tests;
- ручная проверка сценариев.

### Этап 5. Web MVP

Сделать:

- список аукционов;
- страница аукциона;
- история ставок;
- таймер;
- seller page;
- форма создания seller profile;
- форма создания аукциона;
- простая auth UI.

Проверка:

- typecheck;
- lint;
- ручная локальная прогонка сценария.

### Этап 6. Demo data и polish

Сделать:

- seed data;
- базовый `Timeframe`-концепт;
- русские тексты через i18n-слой;
- базовая согласованность design tokens.

Проверка:

- локальный запуск с наполненными данными;
- быстрая UX-проверка flow.

## 4. Скрипты, которые стоит добавить

### Root

- `dev`
- `dev:api`
- `dev:web`
- `build`
- `lint`
- `typecheck`
- `test`
- `test:api`
- `db:generate`
- `db:migrate`
- `db:seed`
- `db:studio`

### `apps/api`

- `dev`
- `build`
- `lint`
- `typecheck`
- `test`
- `test:watch`
- `test:cov`
- `prisma:generate`
- `prisma:migrate`
- `seed`

## 5. Минимальный technical baseline

### ORM и БД

- PostgreSQL
- Prisma
- UUID everywhere
- snake_case в БД
- camelCase в TypeScript

### Индексы

Стратегия:

- сначала только PK/UNIQUE;
- вручную добавить только нужные рабочие индексы;
- остальные по факту реальной нагрузки.

MVP explicit indexes:

- `auctions(status, ends_at)`
- `bids(auction_id, created_at)`

### Auth

- email/password
- `argon2`
- user identity общая для buyer и seller

### Storage

- локальный storage в dev
- интерфейс `FileStorageService`
- future `S3FileStorageService`

### Realtime и jobs

- WebSocket для ставок
- cron внутри backend
- без отдельной queue infrastructure на MVP

### Shared layer

- `contracts` шарим сразу
- `design-tokens` шарим сразу
- полноценный общий UI-kit не делаем до стабилизации web

## 6. Что проверять после каждого этапа

- данные соответствуют зафиксированным статусам;
- новые поля не ломают future roadmap;
- тесты закрывают изменение поведения;
- API и web опираются на shared contracts;
- нет случайного расширения scope.

## 7. Что не забыть после MVP

- buy now;
- report flow;
- seller moderation pipeline;
- relist/reopen failed auctions;
- richer seller profile;
- chat;
- orders/payments/payouts;
- shipping;
- analytics;
- mobile.

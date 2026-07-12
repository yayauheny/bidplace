# Архитектура

## Цель

`bidplace` строится как creator-first аукционная площадка для физических авторских и коллекционных вещей.

Базовый продуктовый фокус:

- timed auctions;
- creator/influencer storefront;
- быстрый direct-link sharing;
- сбор ставок и определение победителя;
- минимизация ручной рутины продавца.

## Анти-цели

Проект сознательно не строится как:

- общий ресейл-маркетплейс;
- CRM;
- складская система;
- классический e-commerce каталог;
- live-video аукционная платформа на старте.

## Монорепо

Монорепо нужно, чтобы держать в одном месте:

- backend API;
- web-клиент;
- mobile-клиент на будущее;
- общие контракты;
- общие design tokens;
- общие конфигурации.

## Структура

### `apps`

- `apps/api` — NestJS backend, Prisma, auth, доменная логика, WebSocket, cron jobs.
- `apps/web` — web MVP, публичные страницы, seller page, admin section.
- `apps/mobile` — будущий mobile client после проверки web MVP.

### `packages`

- `packages/contracts` — общие Zod-схемы, enum-ы, DTO и event payloads.
- `packages/api-client` — typed client поверх REST API.
- `packages/design-tokens` — общие токены цветов, spacing, radius, типографика.
- `packages/config` — общие конфиги.
- `packages/tsconfig` — shared tsconfig.
- `packages/eslint-config` — shared eslint config.

## Разделение ответственности

### Backend

Backend остаётся источником истины для:

- пользователей;
- seller profiles;
- лотов;
- аукционов;
- ставок;
- модерационных статусов;
- выбора победителя;
- будущих order/payment/dispute flows.

### Contracts

`packages/contracts` не должен повторять Prisma-модели один в один.

Его задача:

- описывать входные/выходные данные API;
- хранить enum-ы и validation schemas;
- задавать единый формат для web/mobile;
- не тащить persistence-детали наружу.

### Web

`apps/web` отвечает за:

- список аукционов;
- карточку аукциона;
- seller page;
- создание аукциона;
- минимальную admin-панель;
- future i18n structure.

### Mobile

На MVP не входит в delivery scope.

На текущем этапе шарим только:

- contracts;
- design tokens;
- бизнес-решения;
- при необходимости чистую domain-логику без UI.

Общий cross-platform UI kit сейчас не строим.

## Доменные модули backend

Текущая целевая декомпозиция:

- `core/config` — env validation;
- `core/database` — Prisma integration;
- `core/logger` — базовое логирование;
- `core/health` — healthcheck;
- `auth` — email/password auth;
- `users` — user profile, buyer identity;
- `sellers` — seller profile, seller type, moderation status;
- `lots` — lot metadata и изображения;
- `auctions` — auction lifecycle;
- `bids` — bid placement and bid history;
- `realtime` — WebSocket события;
- `admin` — минимальные admin actions;
- `reports` — future report/dispute foundation.

## Базовые архитектурные решения

- PostgreSQL — основная БД.
- Prisma — ORM и миграции.
- UUID — primary key во всех основных сущностях.
- REST API без `/v1` на MVP, префикс `/api`.
- WebSocket для realtime-обновлений ставок и статусов.
- Cron внутри `apps/api` для закрытия аукционов на MVP.
- Локальное файловое хранилище в dev, абстракция под S3 на будущее.
- i18n-структура закладывается сразу, контент MVP сначала на русском.

## Cron vs jobs infrastructure

На MVP используется простой cron внутри backend:

- один инстанс backend;
- периодическая проверка истёкших аукционов;
- идемпотентное завершение в транзакции.

Полноценная jobs-инфраструктура откладывается до этапа, где реально нужны:

- несколько backend-инстансов;
- очередь;
- retries;
- delayed jobs;
- распределённые блокировки;
- обработка большого количества фоновых событий.

## Индексы

На MVP не добавляем индексы без подтверждённого query pattern.

Базовый план:

- PK и UNIQUE constraints как часть модели;
- явный composite index `auctions(status, ends_at)` для cron и списка активных аукционов;
- явный composite index `bids(auction_id, created_at)` для истории ставок;
- остальные индексы добавлять по факту через измерения и `EXPLAIN ANALYZE`.

## Что уже заложить в модель, но не реализовывать сразу

- `buy_now_price`;
- `reserve_price`;
- seller/influencer differentiation через `sellerType`;
- moderation status;
- report/dispute foundation;
- fee model с buyer fee и seller fee;
- future order/payment/payout сущности;
- future chat;
- future drops;
- future offers / proxy bids / soft close / relist.

## Что не делать в первом срезе

- notifications;
- watchlist;
- comments/likes/social feed;
- встроенные платежи;
- встроенная доставка;
- analytics dashboards;
- recommendations engine;
- live auctions;
- universal mobile/web UI library.

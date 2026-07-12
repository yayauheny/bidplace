# bidplace

Creator-first аукционная площадка для продажи физических авторских и ценных коллекционных вещей.

Текущий фокус:

- timed auctions;
- seller pages;
- direct-link sharing;
- сбор ставок;
- определение победителя;
- foundation под future payments, delivery, moderation и marketplace growth.

## Что это за проект

`bidplace` не строится как общий ресейл-маркетплейс, CRM или складская система.

Продуктовая цель:

- дать креаторам, small brands и публичным людям простой способ быстро выставить вещь на аукцион;
- собрать всех заинтересованных покупателей в одном месте;
- не терять победителя и его контакты;
- позже добавить безопасные расчёты, доставку и trust layer.

## Текущий статус

Репозиторий находится на этапе подготовки MVP-аукционов.

Источник истины по продукту и архитектуре уже зафиксирован в `docs/`.

Ключевой сценарий MVP:

- seller создаёт лот и аукцион;
- публикует ссылку;
- buyer делает ставки;
- система закрывает аукцион по таймеру;
- seller получает контакт победителя.

## Документация

Начинать отсюда:

1. [docs/README.md](/Users/yayauheny/projects/bidplace/docs/README.md)
2. [docs/PRODUCT_DECISIONS.md](/Users/yayauheny/projects/bidplace/docs/PRODUCT_DECISIONS.md)
3. [docs/RFC_MVP_AUCTIONS.md](/Users/yayauheny/projects/bidplace/docs/RFC_MVP_AUCTIONS.md)
4. [docs/FUTURE_ROADMAP.md](/Users/yayauheny/projects/bidplace/docs/FUTURE_ROADMAP.md)
5. [docs/IMPLEMENTATION_PLAN.md](/Users/yayauheny/projects/bidplace/docs/IMPLEMENTATION_PLAN.md)
6. [docs/ARCHITECTURE.md](/Users/yayauheny/projects/bidplace/docs/ARCHITECTURE.md)
7. [docs/API_CONTRACTS.md](/Users/yayauheny/projects/bidplace/docs/API_CONTRACTS.md)

## Технологии

- TypeScript
- Turborepo
- pnpm workspaces
- NestJS
- Next.js
- PostgreSQL
- Prisma
- Zod
- ESLint
- Prettier
- Docker Compose

## Структура монорепы

```txt
apps/
  api/        # backend API, domain logic, realtime, cron jobs
  web/        # web MVP и admin section
  mobile/     # future mobile client

packages/
  api-client/
  config/
  contracts/
  design-tokens/
  eslint-config/
  tsconfig/

docs/
```

`packages/eslint-config` и `packages/tsconfig` — конфигурационные пакеты, а не продуктовые build targets.

## Базовые архитектурные решения

- PostgreSQL — основная БД
- Prisma — ORM и миграции
- UUID — primary key strategy
- REST API с префиксом `/api`
- WebSocket для realtime ставок
- Cron внутри backend для закрытия аукционов на MVP
- Локальное файловое хранилище в dev, абстракция под S3 на будущее
- Shared contracts и design tokens, без общего UI-kit на старте

## Локальный запуск

### Требования

- Node.js 22+
- pnpm 11+
- Docker Desktop или Docker Engine

### Быстрый старт

```bash
pnpm install
cp .env.example .env
pnpm docker:up
pnpm dev
```

## Скрипты корня

- `pnpm dev` — запустить все dev-сервисы
- `pnpm build` — собрать workspace
- `pnpm lint` — прогнать lint
- `pnpm typecheck` — прогнать TypeScript checks
- `pnpm format` — форматирование через Prettier
- `pnpm format:check` — проверка форматирования
- `pnpm clean` — очистка build output и `node_modules`
- `pnpm docker:up` — поднять локальный PostgreSQL
- `pnpm docker:down` — остановить PostgreSQL
- `pnpm docker:logs` — смотреть логи PostgreSQL

## Локальная база данных

Docker Compose поднимает PostgreSQL локально на `5432`.

- database: `bidplace`
- user: `auction`
- password: `auction`

Backend использует `DATABASE_URL` из корневого `.env`.

## Принципы разработки

- минимальный корректный scope;
- без лишних абстракций;
- backend, web и shared packages остаются слабо связанными;
- contracts отделены от database entities;
- бизнес-логика не уходит в controllers и UI;
- future expansion учитывается в модели, но не реализуется раньше времени.

## Что не входит в текущий MVP

- buy now
- drops
- custom requests
- payments
- shipping
- notifications
- watchlist
- chat
- analytics
- mobile app

## Что дальше

Ближайший практический этап:

- Prisma schema;
- shared contracts;
- auth;
- auction domain logic;
- tests;
- затем web MVP поверх готового backend.

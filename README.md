# bidplace

Курируемая площадка прямых продаж значимых, авторских, ограниченных или связанных с конкретным человеком вещей.

Текущий фокус:

- timed auctions;
- seller pages;
- direct-link sharing;
- сбор ставок;
- определение победителя;
- foundation под future payments, delivery, moderation и trust layer.

## Что это за проект

`bidplace` не строится как общий ресейл-маркетплейс, CRM или складская система.

Продуктовая цель:

- дать creators и публичным людям простой способ напрямую продать значимую вещь своей аудитории;
- собрать всех заинтересованных покупателей в одном месте;
- не терять победителя и его контакты;
- позже добавить безопасные расчёты, доставку и дополнительные механизмы доверия.

Обычный resale, массовые товары, перекупщики и искусственные ставки продукту противоречат.

## Текущий статус

Репозиторий находится в Phase 0: техническая устойчивость перед первым реальным пилотом.

Источник истины по продукту, архитектуре и фактическому состоянию находится в `docs/product/`.

Ключевой сценарий MVP:

- seller создаёт лот и аукцион;
- публикует ссылку;
- buyer делает ставки;
- система закрывает аукцион по таймеру;
- система определяет победителя из состояния базы данных.

Полный handoff и подтверждение продажи пока не реализованы. Актуальный снимок: [`docs/product/11-PROJECT-STATUS.md`](docs/product/11-PROJECT-STATUS.md).

## Документация

Начинать отсюда:

1. [Канонический индекс](docs/product/00-PROJECT-INDEX.md)
2. [Продуктовая основа](docs/product/01-PRODUCT-FOUNDATION.md)
3. [MVP RFC](docs/product/05-MVP-RFC.md)
4. [Roadmap на 24 месяца](docs/product/06-ROADMAP-24-MONTHS.md)
5. [Архитектура и дизайн](docs/product/10-CODE-ARCHITECTURE-AND-DESIGN.md)
6. [Фактический статус проекта](docs/product/11-PROJECT-STATUS.md)
7. [Журнал решений](docs/product/12-DECISION-LOG.md)
8. [Правила хранения исследований](docs/research/README.md)

## Технологии

- TypeScript
- Turborepo
- pnpm workspaces
- NestJS
- Expo Router
- React Native
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
  mobile/     # Expo Router frontend for web, iOS and Android

packages/
  api-client/
  config/
  contracts/
  database/
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
- backend, mobile/frontend и shared packages остаются слабо связанными;
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
- native app store release

## Что дальше

Ближайший практический этап:

- Prisma schema;
- shared contracts;
- auth;
- auction domain logic;
- tests;
- затем развивать единый Expo frontend поверх готового backend.

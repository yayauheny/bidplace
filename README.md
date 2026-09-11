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

- seller создаёт Product и Auction Listing;
- публикует ссылку;
- buyer делает ставки;
- система закрывает аукцион по таймеру;
- система определяет победителя и создаёт минимальный Order из состояния базы данных.

Полный handoff и подтверждение продажи пока не реализованы. Актуальный снимок: [`docs/product/11-PROJECT-STATUS.md`](docs/product/11-PROJECT-STATUS.md).

## Документация

Начинать отсюда:

1. [Канонический индекс](docs/product/00-PROJECT-INDEX.md)
2. [Продуктовая основа](docs/product/01-PRODUCT-FOUNDATION.md)
3. [MVP RFC](docs/product/05-MVP-RFC.md)
4. [Roadmap на 24 месяца](docs/product/06-ROADMAP-24-MONTHS.md)
5. [Архитектура](docs/product/10-CODE-ARCHITECTURE.md)
6. [Фактический статус проекта](docs/product/11-PROJECT-STATUS.md)
7. [Индекс дизайн-документации](docs/design/00-DESIGN-INDEX.md)
8. [Журнал решений](docs/product/12-DECISION-LOG.md)
9. [Правила хранения исследований](docs/research/README.md)

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
- Изображения хранятся в PostgreSQL как `ProductImage`; внешнее object storage пока не реализовано
- Shared contracts и design tokens, без общего UI-kit на старте

## Локальный запуск

### Требования

- Node.js 22 (см. [`.nvmrc`](.nvmrc); `engines.node` в `package.json`)
- pnpm 11.7.0 (`corepack enable` или установка вручную)
- Docker Desktop или Docker Engine (PostgreSQL для dev, integration и restore drill)

### Быстрый старт

```bash
pnpm install
cp .env.example .env
pnpm docker:up
pnpm dev
```

### Verify gate

Полный clean-checkout gate для CI и локальной проверки перед релизом:

```bash
pnpm docker:up
pnpm verify
```

`pnpm verify` выполняет `db:generate`, `typecheck`, `lint`, `test:unit`, `test:integration` и `build`. Для integration нужен запущенный PostgreSQL (`pnpm docker:up`). GitHub Actions запускает тот же gate в [`.github/workflows/verify.yml`](.github/workflows/verify.yml).

Операционный runbook (deploy, backup, restore drill): [`docs/ops/00-RELEASE-AND-BACKUP.md`](docs/ops/00-RELEASE-AND-BACKUP.md).

## Скрипты корня

- `pnpm dev` — запустить все dev-сервисы
- `pnpm build` — собрать workspace
- `pnpm lint` — прогнать lint
- `pnpm typecheck` — прогнать TypeScript checks
- `pnpm test:unit` — unit-тесты API и contracts
- `pnpm test:integration` — integration-тесты API (нужен PostgreSQL)
- `pnpm verify` — полный gate: generate, typecheck, lint, unit, integration, build
- `pnpm ops:backup` — `pg_dump` backup текущей БД
- `pnpm ops:restore` — restore dump в отдельную БД (`TARGET_DATABASE_URL` обязателен)
- `pnpm ops:verify-restore` — counts и sample checksum после restore
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

Для воспроизводимого local/test seed нужны `SEED_ADMIN_EMAIL` и `SEED_ADMIN_PASSWORD`. Они задаются локально (через `.env`); seed хеширует пароль Argon2 перед записью. Реальные production credentials не должны использоваться.

**Внимание**: команда удаляет все данные из настроенной базы. Запуск разрешён только для disposable local DB. Точная команда:

```bash
ALLOW_DESTRUCTIVE_DEMO_SEED=true pnpm db:reset:demo
```

Seed создаёт admin, visitor (`visitor@bidplace.test`), восемь одобренных авторов и пятнадцать опубликованных работ без listings, bids и orders. У каждой работы есть история создания (`story`, `creationIntro` и четыре `creationSteps`).

Prisma Client в `packages/database/src/generated/prisma/` является локальным generated output и не коммитится. Перед typecheck или build database package выполните `pnpm --filter @bidplace/database generate`; database build выполняет генерацию автоматически.

## Принципы разработки

- минимальный корректный scope;
- без лишних абстракций;
- backend, mobile/frontend и shared packages остаются слабо связанными;
- contracts отделены от database entities;
- бизнес-логика не уходит в controllers и UI;
- future expansion учитывается в модели, но не реализуется раньше времени.

## Что не входит в текущий MVP

- buy now и reserve price
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

Ближайший практический этап — закрыть блокеры технического rehearsal и реального пилота из
[`docs/product/11-PROJECT-STATUS.md`](docs/product/11-PROJECT-STATUS.md), не расширяя MVP.

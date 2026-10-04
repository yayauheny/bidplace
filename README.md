# bidplace

Курируемая площадка прямых продаж значимых, авторских, ограниченных или связанных с конкретным человеком вещей.

Первый публичный релиз — portfolio-only MVP: авторы, работы и прямые ссылки.
Продажи, ставки, платежи и связанные workflow отложены.

## Что это за проект

`bidplace` не строится как общий ресейл-маркетплейс, CRM или складская система.

Продуктовая цель:

- дать creators и публичным людям простой способ напрямую продать значимую вещь своей аудитории;
- собрать всех заинтересованных покупателей в одном месте;
- не терять победителя и его контакты;
- позже добавить безопасные расчёты, доставку и дополнительные механизмы доверия.

Обычный resale, массовые товары, перекупщики и искусственные ставки продукту противоречат.

## Текущий статус

Репозиторий готовится к первому публичному portfolio MVP.

Источник истины по продукту, архитектуре и фактическому состоянию находится в `docs/product/`.

Ключевой сценарий MVP:

- автор регистрируется и подтверждает email;
- заполняет профиль и создаёт работы с изображениями;
- после модерации профиль и работы доступны публично;
- опубликованные изображения выдаются через Cloudflare R2/CDN.

R2/CDN ещё требуют реализации и внешней проверки; локальные auth-проверки пройдены.
Актуальный снимок: [`docs/product/11-PROJECT-STATUS.md`](docs/product/11-PROJECT-STATUS.md).

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
- Commerce-модули сохранены, но выключены в portfolio runtime
- Медиа используют `ImageStore`: PostgreSQL для legacy/local и S3-compatible adapter;
  целевая production-архитектура — private/public R2 buckets и Cloudflare CDN
- Shared contracts и design tokens, без общего UI-kit на старте

## Локальный запуск

### Требования

- Node.js 22.x (см. [`.nvmrc`](.nvmrc); `engines.node` в `package.json`)
- pnpm 11.7.0 (`corepack enable` или установка вручную)
- Docker Desktop или Docker Engine (PostgreSQL для dev, integration и restore drill)

### Quick start

Один раз создайте корневой `.env` из шаблона и задайте локальную конфигурацию.
Production credentials для локальной разработки не нужны.

```bash
cp .env.example .env
make install
make dev
```

`make dev` ждёт готовности локального PostgreSQL, генерирует Prisma client,
применяет существующие migrations к настроенной БД и запускает NestJS + Expo.
API: `http://localhost:3001/api`; web: `http://localhost:8081`.
БД не очищается и demo seed автоматически не выполняется. Перед запуском проверьте,
что локальный `DATABASE_URL` указывает на предназначенную для разработки БД.

Для отдельного процесса: `make dev-api` или `make dev-web`.
Для внешней dev-БД запустите `make generate`, `make db-migrate` и нужные процессы
отдельно; `make dev-infra` поднимает только локальный PostgreSQL.

### Проверка и пересборка

```bash
make rebuild
make check
make test
make build-web
```

`make rebuild` последовательно очищает build/generated/cache, устанавливает
зависимости по lockfile, выполняет codegen и собирает весь workspace через Turbo.
`make clean` сохраняет `node_modules`, конфигурацию и данные БД.
`make check` ничего не исправляет автоматически. `make test` запускает unit и ops
тесты; integration и браузерные release gates выполняются отдельно.

| Target       | Команда / действие                                                            |
| ------------ | ----------------------------------------------------------------------------- |
| `help`       | Краткое описание всех целей                                                   |
| `doctor`     | Node/pnpm/Docker/Compose и наличие конфигурации, без чтения env-содержимого   |
| `install`    | `pnpm install --frozen-lockfile` → `make generate`                            |
| `dev`        | `dev-infra` → `generate` → `db-migrate` → `pnpm dev`                          |
| `dev-api`    | `turbo run dev --filter=@bidplace/api`                                        |
| `dev-web`    | `pnpm --filter @bidplace/mobile web`                                          |
| `dev-infra`  | `pnpm docker:up`: PostgreSQL с ожиданием healthcheck                          |
| `build`      | `pnpm build`: весь dependency graph                                           |
| `build-web`  | `turbo run build:web --filter=@bidplace/mobile`: web + shared packages/tokens |
| `rebuild`    | `clean` → `install` (включая generate) → `build`                              |
| `generate`   | `turbo run generate`: сейчас Prisma client; tokens собирает build             |
| `db-migrate` | `pnpm db:migrate`: `prisma migrate deploy`, без reset                         |
| `check`      | `pnpm typecheck` → `pnpm lint` → `pnpm format:check`                          |
| `test`       | `pnpm test:unit` → `pnpm test:ops`                                            |
| `clean`      | Workspace `dist`, Expo/Turbo caches и generated Prisma; работает до install   |

`make help` и `make doctor` не требуют установки workspace dependencies.
`doctor` проверяет только наличие env-файла или имён runtime keys; корректность
обязательных значений проверяет API при старте. Для команд нужен GNU Make
(стандартный `make` в macOS/Linux). Deploy targets появятся после выбора hosting.

### Verify gate

Полный clean-checkout gate для CI и локальной проверки перед релизом:

```bash
pnpm docker:up
pnpm verify
```

`pnpm verify` выполняет `typecheck` (включая Turbo `database#generate`), `lint`, `test:unit`, `test:ops`, E2E database fence, `test:integration` и `build`. Для integration нужен запущенный PostgreSQL (`pnpm docker:up`). GitHub Actions запускает тот же gate в [`.github/workflows/verify.yml`](.github/workflows/verify.yml).

Операционный runbook (deploy, backup, restore drill): [`docs/ops/00-RELEASE-AND-BACKUP.md`](docs/ops/00-RELEASE-AND-BACKUP.md).

## Скрипты корня

- `pnpm dev` — запустить все dev-сервисы
- `pnpm build` — собрать workspace
- `pnpm lint` — прогнать lint
- `pnpm typecheck` — прогнать TypeScript checks
- `pnpm test:unit` — unit-тесты API и contracts
- `pnpm test:integration` — integration-тесты API (нужен PostgreSQL)
- `pnpm verify` — полный gate: generate, typecheck, lint, unit, ops, E2E fence, integration, build
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

Для воспроизводимого local/test seed нужны `SEED_ADMIN_EMAIL` и `SEED_ADMIN_PASSWORD_HASH`. Они задаются локально (через `.env`), сырой пароль в Git не хранится. Реальные production credentials не должны использоваться.

**Внимание**: команда удаляет все данные из настроенной базы. Запуск разрешён только для disposable local DB. Точная команда:

```bash
ALLOW_DESTRUCTIVE_DEMO_SEED=true pnpm db:reset:demo
```

Этот legacy seed предназначен для disposable local/test БД. Для production
нужен отдельный обозначенный demo catalog без тестовых логинов; его импорт ещё
не реализован.

Prisma Client в `packages/database/src/generated/prisma/` является локальным generated output и не коммитится. Turbo task `generate` создаёт client один раз перед `build`, `typecheck` и `test`. Для прямого запуска package scripts сначала выполните `pnpm db:generate` или `pnpm exec turbo run build --filter=@bidplace/database`.

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

# Release, deploy, backup, and restore

Operational runbook for the pilot single-replica stack. Product contracts remain in
[`docs/product/05-MVP-RFC.md`](../product/05-MVP-RFC.md); architecture constraints in
[`docs/product/10-CODE-ARCHITECTURE.md`](../product/10-CODE-ARCHITECTURE.md).

## Pilot constraints

- One API replica and one PostgreSQL instance.
- Auction lifecycle cron and in-process rate limits assume a single scheduler.
- Product image metadata, checksums and object keys live in PostgreSQL; production
  image bytes live in S3-compatible object storage. A database dump alone does
  not restore media bytes.
- Mobile web is built and hosted separately (`expo export` or static host). The historical Compose `app` override ships API + Postgres only.

## Toolchain and clean checkout gate

Requirements:

- Node.js `22` (see [`.nvmrc`](../../.nvmrc))
- pnpm `11.7.0` (`packageManager` in root `package.json`)
- Docker for local PostgreSQL and integration tests

From a fresh clone:

```bash
pnpm install
cp .env.example .env
pnpm docker:up
pnpm verify
```

`pnpm verify` runs, in order: `typecheck` (Turbo runs `database#generate` first), `lint`, all unit suites
(including mobile), the ops-script unit suite, the disposable E2E database
fence, `test:integration`, and `build`. Maintained browser tests remain separate
because they create a disposable database and start local services.

GitHub Actions runs the same deterministic gate on push and pull requests via [`.github/workflows/verify.yml`](../../.github/workflows/verify.yml). Full browser E2E is intentionally **not** part of automatic CI/CD because it is slow and resource-heavy. Chromium E2E remains available as a manual `workflow_dispatch` workflow in [`.github/workflows/browser-e2e.yml`](../../.github/workflows/browser-e2e.yml), while the full Chromium/WebKit matrix remains a manual release gate.

## Public portfolio packaging (Cloudflare target)

`make build` produces the workspace and `make build-web` produces web assets in
`apps/mobile/dist`; serve SPA fallback for direct author/work/auth links.
`apps/api/Dockerfile` packages the existing NestJS runtime. Frozen install includes
all copied workspace manifests and the Expo patch; API-only deploy allows its
unused mobile patch. Production build and native Argon2/Sharp/Prisma plus HTTP
startup were checked on Linux arm64 with synthetic settings in the earlier pass.
The Cloudflare package additionally verifies linux/amd64 with a disposable DB.
Real Neon TLS, SMTP, R2 and CDN still require provider acceptance.

The public runtime uses external Neon PostgreSQL and the confirmed private/public
R2 + native CDN design. The selected application target is a thin Cloudflare
Worker, Expo Static Assets and one private Nest Container under `bid.place`
(`DEC-098`). The prepared scripts, runtime secret contract, isolated staging,
separate migrations and provider smoke are owned by the
[Cloudflare deployment runbook](CLOUDFLARE-DEPLOYMENT.md); exact local results and
manual blockers are in the
[deployment verification](../audits/current/14-CLOUDFLARE-DEPLOYMENT-VERIFICATION.md).
Prepared code is not evidence of an actual cloud deployment.

## Historical pilot (single-replica Compose)

This is the existing pilot configuration, not the selected public release target.
The public portfolio release targets Cloudflare Containers/Static Assets,
external Neon PostgreSQL and Cloudflare R2/CDN. Default `docker-compose.yml` is local PostgreSQL only.
The existing API profile is in `docker-compose.app.yml`, so local dev no longer
requires production SMTP variables. Do not use its exposed local DB, localhost
CORS default or unconditional proxy trust as a public deployment configuration.

### Pre-deploy

1. Take a backup (see [Backup](#backup)).
2. Record the current API image tag or git SHA.
3. Confirm migrations are reviewed; unsafe migrations need a restore plan.

### Deploy steps

Ensure root `.env` includes the production keys the API container validates when
`NODE_ENV=production` and `APP_ENV=production` (copy from [`.env.example`](../../.env.example) if needed):

- `APP_ENV=production` (Compose `app` profile sets this; `APP_ENV=local` is rejected)
- `SESSION_SECRET` (at least 32 characters; the value is never logged)
- `OTP_HASH_SECRET` (independent key, at least 32 characters)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_AUTH_MODE`, `SMTP_FROM`
- `PASSWORD_RESET_URL_BASE`
- `SERVICE_RULES_OWNER`, `SERVICE_RULES_CONTACT`, `SERVICE_RULES_TEXT`
- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- optional: `CORS_ORIGIN` (defaults to `http://localhost:8081`)

When `SMTP_AUTH_MODE=login`, set `SMTP_USERNAME` and `SMTP_PASSWORD` in `.env`.
Compose forwards both; empty values normalize to absent for `SMTP_AUTH_MODE=none`.
Cloudflare Email Service uses a different profile: `smtp.mx.cloudflare.net`,
port 465, implicit TLS. That contract is in
[Cloudflare deployment](CLOUDFLARE-DEPLOYMENT.md), not in this local Compose file.

```bash
# Build and start API + Postgres
docker compose -f docker-compose.yml -f docker-compose.app.yml --profile app up -d --build

# Apply migrations against the running database
pnpm db:migrate

# Smoke checks
curl -sf http://localhost:3001/api/health
curl -sf http://localhost:3001/api/health/ready
```

`GET /api/health` is liveness only. `GET /api/health/ready` returns `503` when PostgreSQL is unreachable or the probe times out (2s).

Before serving traffic, run a media provider smoke against an isolated prefix;
it writes, reads/checksums and deletes only its own random object:

```bash
MEDIA_PREFLIGHT_PREFIX='ops/preflight/staging' pnpm ops:media-preflight
```

Compose reads the required keys from `.env` at the repo root. Default local Postgres URL inside Compose is:

`postgresql://auction:auction@postgres:5432/bidplace?schema=public`

### Rollback

1. Stop the API container: `docker compose -f docker-compose.yml -f docker-compose.app.yml --profile app stop api`
2. Run the previous API image tag.
3. If the migration was unsafe or partially applied, restore the pre-deploy dump into a fresh database or roll back schema per migration notes, then restart API.

Do not run multiple API replicas behind a load balancer in the pilot; rate limits and cron are not multi-instance safe.

## Media backfill and R2 cutover

Current CLI: `pnpm ops:backfill-media`, dry-run by default; `--apply` enables
object writes and missing-key updates. Runtime selection is a separate operation.
The CLI consumes the source `DATABASE_URL` and target `S3_*` settings from an
operator-controlled environment; do not print or commit credentials.

It covers Product images, seller parent photos, creation-step images, seller
revision photos and achievement images. All source metadata and retained bytes
are checked before writes. Existing target objects are read and verified before
reuse; an incompatible object is not overwritten. After PUT the CLI reads and
checks SHA-256, length and MIME type before recording a missing DB key. Repeated
apply verifies existing objects and does not rewrite a valid object.

1. Confirm the intended source dataset and target bucket. This script copies
   bytes retained in PostgreSQL; it does not fetch an old S3 provider. A
   metadata-only reference needs an existing target or another matching source
   row. Resolve missing objects explicitly before cutover.
2. Freeze uploads, media edits and moderation for the migration window. Paging
   does not provide a cross-table transaction snapshot. Record DB and object
   backups and the previous runtime configuration.
3. Run dry-run and review the five owner counts plus shared-key inventory.
   A source checksum failure must be investigated; do not skip that row.
4. Run `ops:media-preflight` on the actual R2 target, then apply backfill. Run
   apply again: uploads and missing-key updates should be zero and all unique
   objects verified. Original DB bytes stay intact.
5. Switch the API to the verified target with `MEDIA_STORAGE_PROVIDER=s3`.
   Verify all five media classes through owner/admin/public reads and denied
   draft/stranger reads. Enable the separately approved CDN architecture and
   verify cache hits, replacement, unpublication and seller suspension.
6. Complete DB + object restore verification before reopening writes/traffic.

Rollback while writes are frozen: restore the previous runtime configuration;
retained bytes/backups remain available. After new R2-only writes begin, a
provider rollback requires copying those new objects too; switching to the old
database alone is not a complete rollback. Do not delete old DB bytes or objects
as part of this migration.

Live R2/SMTP/CDN evidence remains a release prerequisite. Current verification
and open choices: launch audit.

## Backup

Script: [`scripts/ops/backup-db.sh`](../../scripts/ops/backup-db.sh)

```bash
# Uses DATABASE_URL from the environment or .env-loaded shell
pnpm ops:backup

# Or explicitly
SOURCE_DATABASE_URL='postgresql://auction:auction@127.0.0.1:5432/bidplace?schema=public' pnpm ops:backup
```

Output: `backups/bidplace-<UTC-timestamp>.dump` (custom `pg_dump -Fc` format).

When `bidplace-postgres` is running locally, backup/restore scripts use `docker exec`
so `pg_dump`/`pg_restore` versions match the server (host Postgres 17 clients against
Postgres 16 in Docker will fail).

Optional encryption when `BACKUP_GPG_RECIPIENT` is set:

```bash
BACKUP_GPG_RECIPIENT='ops@example.com' pnpm ops:backup
```

### Retention example

Daily cron (adjust host paths):

```cron
15 2 * * * cd /srv/bidplace && SOURCE_DATABASE_URL='...' pnpm ops:backup && find /srv/bidplace/backups -name 'bidplace-*.dump*' -mtime +14 -delete
```

Keep at least one pre-deploy dump until the deploy is verified.

## Restore drill (local)

Restore always targets a **separate** database name. Scripts refuse `bidplace` and require `restore`, `integration`, `_test`, or `_e2e` in the database name.

```bash
pnpm docker:up

# 1. Backup current local/dev data
SOURCE_DATABASE_URL='postgresql://auction:auction@127.0.0.1:5432/bidplace?schema=public' pnpm ops:backup

# 2. Restore into isolated database
TARGET_DATABASE_URL='postgresql://auction:auction@127.0.0.1:5432/bidplace_restore?schema=public' \
  pnpm ops:restore backups/bidplace-<timestamp>.dump

# 3. Integrity checks (database counts + metadata checksums)
pnpm --filter @bidplace/database build
TARGET_DATABASE_URL='postgresql://auction:auction@127.0.0.1:5432/bidplace_restore?schema=public' \
  pnpm ops:verify-restore
```

Evidence checklist:

- [ ] `pnpm ops:backup` exits 0 and writes a dated dump under `backups/`
- [ ] `pnpm ops:restore` creates `bidplace_restore` and completes without error
- [ ] `pnpm ops:verify-restore` prints table counts and verifies sample `ProductImage.checksum` values
- [ ] `curl -sf localhost:3001/api/health/ready` succeeds against the primary database after deploy smoke
- [ ] `MEDIA_PREFLIGHT_PREFIX='ops/preflight/restore-drill' pnpm ops:media-preflight`
      succeeds against the intended bucket and leaves no test object behind

## Staging smoke

The staging smoke is read-only: it checks health/readiness, public Home/Works/
Authors API reads and verifies that SPA host routes for login, Works, Authors,
profile and cabinet are not host-level 404s. It does not authenticate, create
data or invoke object storage.

```bash
STAGING_API_URL='https://api.staging.example' \
STAGING_WEB_URL='https://staging.example' \
pnpm ops:staging-smoke
```

## Запуск продаж

Единственный чек-лист перед реальным аукционом. Cloudflare-уточнения —
[граница тика](CLOUDFLARE-DEPLOYMENT.md#w2-проверка-после-будущего-деплоя).
W5 и W7 целиком сюда не входят. Согласие с правилами сделок (W6) остаётся
отдельной незакрытой зависимостью: черновик текстов не является публикацией.

Статусы: `LOCAL VERIFIED` — видно в исходниках этого SHA; `NEEDS LIVE VERIFICATION` —
шаг для основателя в кабинете; `NOT RUN` — проверка не выполнялась и не считается
пройденной. Дата свидетельств: 2026-11-02. SHA исходников: `14256245`. SHA
выложенного Worker не читался.

### 0. Обязательные ★

Объект: каждое имя со ★ в [ENVIRONMENT.md](ENVIRONMENT.md). Исполнитель: основатель.
Шаг: в GitHub Environment `prod` и в Cloudflare сверить, что имя задано. Значение
не копировать в репозиторий, чат или этот файл. Ожидание: пустых обязательных
имён нет; `TICK_CRON` для реального аукциона равен `*/5 * * * *`, а не пустой
строке. Пустой `TICK_CRON` Cron не создаёт и спящий контейнер не будит.

Статус: `NOT RUN`. Наличие имени в документации или пустая строка в
`deploy/cloudflare/wrangler.jsonc` не считаются настройкой. Живые значения
2026-11-02 не читались:

`DATABASE_URL`, `SESSION_SECRET`, `OTP_HASH_SECRET`, `S3_ACCESS_KEY_ID`,
`S3_SECRET_ACCESS_KEY`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `CLOUDFLARE_CACHE_TOKEN`,
`TURNSTILE_SECRET_KEY`, `INTERNAL_TICK_SECRET`, `RELEASE_CONTROL`, `NODE_ENV`,
`APP_ENV`, `API_URL`, `CORS_ORIGIN`, `PASSWORD_RESET_URL_BASE`, `TRUST_PROXY`,
`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_AUTH_MODE`, `SMTP_FROM`,
`SERVICE_RULES_OWNER`, `SERVICE_RULES_CONTACT`, `SERVICE_RULES_TEXT`,
`TURNSTILE_HOSTNAME`, `TEST_EMAIL_BYPASS`, `MEDIA_STORAGE_PROVIDER`, `S3_ENDPOINT`,
`S3_REGION`, `S3_BUCKET`, `S3_PUBLIC_BUCKET`, `MEDIA_PUBLIC_BASE_URL`,
`CLOUDFLARE_ZONE_ID`, `ANALYTICS_WEB_ENABLED`, `TURNSTILE_SITE_KEY`,
`EXPO_PUBLIC_ANALYTICS_WEB_ENABLED`, `CLOUDFLARE_API_TOKEN`, `NEON_DIRECT_URL`,
`TICK_CRON`, `SUPPORT_TELEGRAM_URL`, `SUPPORT_EMAIL`.

### 1. Workers, Containers, Cron

Объект: Worker `bidplace-production`, один Container, Cron. Исполнитель: основатель.
Шаг: Cloudflare → Workers & Pages → `bidplace-production` → Settings → Containers
и Cron Triggers. Ожидание: план Workers Paid, `max_instances` 1, при пустом
`TICK_CRON` список Cron пуст. Статус плана и живого Cron: `NOT RUN`.
Исходник расписания `LOCAL VERIFIED`: пустой `TICK_CRON` удаляет triggers и
deploy записывает `crons: []` (`scripts/cloudflare/config.mjs`,
`scripts/cloudflare/deploy.mjs`). В закоммиченном `wrangler.jsonc` ключа
`triggers` нет.

### 2. Приватная граница тика

Объект: `GET https://bid.place/api/internal/tick`. Исполнитель: основатель после
сверки выложенного Worker. Шаг уже сделан один раз, повтор не нужен для отчёта:

```bash
curl -sS -D - -o /dev/null --max-time 20 https://bid.place/api/internal/tick
```

Ожидание исходника: пустой HTTP 404 Worker, без тела и без `x-powered-by`.
Наблюдение 2026-11-02T21:14:39Z: HTTP 404, `content-type: application/json`,
`x-powered-by: Express`, есть `x-request-id`. Это расхождение формы ответа с
ожидаемым ответом Worker. Один GET не показывает, выполнился ли тик, и не
показывает, пропущена ли проверка внутреннего секрета. Статус границы:
`NEEDS LIVE VERIFICATION`. Основатель сверяет выложенный маршрут `/api/*` с
`deploy/cloudflare/src/router.ts` и повторяет одну проверку. Этот запрос не
использовать как доказательство Cron.

### 3. Neon: backup, PITR, отдельное восстановление

Объект: ветка production Neon и копия в новой ветке. Исполнитель: основатель.
Production `DATABASE_URL` и данные production не менять.

Шаг:

1. Основатель сначала подтверждает протокол сопоставления эталонного снимка
   с точкой восстановления `T`. Нужны доказанное окно без записей, включая
   фоновых writers и уже идущие транзакции, либо проверенный механизм привязки
   снимка к точке восстановления. До подтверждения протокола gate остаётся
   `NOT RUN`; сами counts его не доказывают. Остановка production-записей не
   выполняется в рамках подготовки интеграционного PR.
2. Согласованный эталон чисел `orders`, `bids`, `listings` и запросов связности
   снимать в `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;`, затем запросы
   ниже, затем `COMMIT`. Обычный `READ ONLY` при default READ COMMITTED не даёт
   общего snapshot для нескольких запросов ([PostgreSQL 16](https://www.postgresql.org/docs/16/transaction-iso.html)).
   `now()`/время BEGIN само по себе
   не устанавливает эквивалентность снимка точке `T` при конкурентных commits.
3. По подтверждённому протоколу восстановить PITR **в новую ветку Neon** на `T`.
   Записать длительность и фактическую метку ветки. Несовпадение метки с `T`
   или недоказанное соответствие эталона не засчитывать как PASS.
4. Те же запросы выполнить по URL новой ветки. С production их не запускать
   повторно вместо эталона. Позже снятый production snapshot эталон не заменяет.

```sql
SELECT count(*) AS orders FROM orders;
SELECT count(*) AS bids FROM bids;
SELECT count(*) AS listings FROM listings;

SELECT count(*) AS bids_without_listing
FROM bids b LEFT JOIN listings l ON l.id = b.listing_id
WHERE l.id IS NULL;

SELECT count(*) AS orders_without_listing
FROM orders o LEFT JOIN listings l ON l.id = o.listing_id
WHERE l.id IS NULL;

SELECT count(*) AS orders_bid_mismatch
FROM orders o LEFT JOIN bids b ON b.id = o.source_bid_id
WHERE o.source_bid_id IS NOT NULL
  AND (b.id IS NULL OR b.listing_id <> o.listing_id
       OR b.bidder_user_id <> o.buyer_user_id);

SELECT count(*) AS auction_order_without_bid
FROM orders o
WHERE o.source IN ('AUCTION_WIN', 'SECOND_CHANCE')
  AND o.source_bid_id IS NULL;

SELECT count(*) AS order_listing_mismatch
FROM orders o JOIN listings l ON l.id = o.listing_id
WHERE o.product_id <> l.product_id
   OR o.seller_user_id <> l.seller_user_id;
```

Ожидание: числа строк совпали с эталоном точки `T`; пять проверок связности
дали 0 и на эталоне, и на новой ветке. Статус: `NOT RUN`. Флага «backup
включён» недостаточно.

Локальный drill — другая проверка, тоже `NOT RUN`:

```bash
pnpm ops:backup
TARGET_DATABASE_URL='postgresql://…/bidplace_restore?schema=public' pnpm ops:restore backups/bidplace-<timestamp>.dump
TARGET_DATABASE_URL='postgresql://…/bidplace_restore?schema=public' pnpm ops:verify-restore
```

`scripts/ops/restore-db.sh` отказывается восстанавливать в базу `bidplace` и
требует в имени `restore`, `integration`, `_test` или `_e2e`.
`pnpm ops:verify-restore` печатает `users`, `listings`, `bids`, `orders`,
`productImages`. Для дампа эталон — состояние источника в момент дампа, не
позднейший production. Этот скрипт не заменяет PITR-сверку точки `T` и сам
связность не проверяет. Дамп базы не восстанавливает байты медиа.

### 4. R2, CDN, CORS, отзыв

Объект: `https://media.bid.place` и кэш. Исполнитель: основатель.
Шаг CORS, один запрос, URL взять из уже опубликованной работы:

```bash
curl -sI -H 'Origin: https://bid.place' 'https://media.bid.place/<path>'
```

Ожидание: ответ разрешает origin `https://bid.place`. Статус: `NOT RUN`.
На главной 2026-11-02T21:14:21Z (HTTP 200, `cf-cache-status: HIT`, 1414 байт)
ссылки на медиа не было.

Отзыв, `NOT RUN`: скрыть одну работу существующим действием, дождаться REVOKE,
запросить старый URL, тот же URL с `?media_retry=1` и с другим query.
Ожидание: все три больше не отдают объект. `purge success=true` само по себе
не считается успехом. Кабинеты и бакеты этой проверкой не менять заранее.

### 5. Почта

Объект: SPF, DKIM, DMARC, письма входа и обязательные письма сделок
([COMMERCE §9](../launch/COMMERCE.md#9-уведомления)). Исполнитель: основатель.
Шаг DNS: подтвердить записи Cloudflare Email Sending (MX, SPF, DKIM на
`cf-bounce`, DMARC на `_dmarc`). Код входа и сброс пароля отправить на Gmail,
Яндекс и Mail.ru, не на verified destination. Темы не менять:
`bidplace email verification code`, `bidplace password reset`.

Обязательные письма сделок проверять на двух-трёх тестовых аккаунтах
основателя. Чужие заказы и оплату не создавать. Каждое письмо — на ящик
Gmail, Яндекс и Mail.ru. SMTP `250` недостаточно: письмо видно в ящике и не
только в спаме. Повтор после сбоя возможен; ровно одну доставку не обещать.
Статус всей почты: `NOT RUN`.

| Событие | Получатель | Безопасный сценарий | Ожидаемая доставка |
| --- | --- | --- | --- |
| Ваша ставка лучшая | покупатель | Тестовый аукцион с одной ставкой тестового покупателя, закрытие по Cron из пункта 9 | Тема «Ваша ставка лучшая» в ящике покупателя |
| Аукцион завершён | автор | Тот же аукцион со ставкой | Тема «Аукцион завершён» в ящике автора |
| Аукцион завершён без ставок | автор | Отдельный тестовый аукцион без ставок | Тема «Аукцион завершён», в тексте — без ставок |
| Вы забронировали работу | покупатель | Фиксированная цена: тестовый покупатель подтверждает одну тестовую работу | Тема «Работа забронирована» в ящике покупателя |
| Работа забронирована | автор | Та же фиксированная покупка | Тема «Работа забронирована» в ящике автора |
| Вам предлагают работу | следующий покупатель | После срыва тестового аукциона автор нажимает «Предложить следующему» | Тема «Вам предлагают работу» |
| Отметьте, состоялась ли сделка | автор | Тестовый заказ оставить без отметки | Тема «Отметьте, состоялась ли сделка» через 24 ч и повтор через 48 ч. Это не проверка 10 минут |
| Сделка состоялась | оба | Автор отмечает «Сделка состоялась» на тестовом заказе | Тема «Сделка состоялась» обоим, со ссылкой на заказ |
| Сделка не состоялась | вторая сторона | Тестовый покупатель отказывается или автор отмечает отказ | Тема «Сделка не состоялась» второй стороне, с причиной |
| По вашему заказу открыта жалоба | вторая сторона | Участник тестового заказа отправляет одну жалобу | Тема «По вашему заказу открыта жалоба» без текста жалобы |
| Аукцион остановлен администрацией | автор и участники | Администратор снимает один тестовый аукцион, на котором уже есть ставка | Тема «Аукцион остановлен» |
| Контакты в профиле изменены | владелец аккаунта | Тестовый пользователь меняет свой контакт при входе не старше 5 минут | Тема «Контакты в профиле изменены» только ему |

«Вашу ставку перебили» выключается в настройках и в этот обязательный список
не входит.

### 6. Turnstile

Объект: виджет и WAF. Исполнитель: основатель.
Шаг: Cloudflare → Turnstile: режим Invisible, hostname `bid.place`.
В Security → Bots: Bot Fight Mode выключен. Один вход и одна регистрация не
получают challenge на `/api/auth/*`. Ожидание: виджет невидимый, auth не
блокируется WAF. Статус: `NOT RUN`. Имя `TURNSTILE_HOSTNAME` в репозитории
не доказывает живой виджет.

### 7. Поддержка и монитор

Объект: UptimeRobot, `SUPPORT_TELEGRAM_URL`, `SUPPORT_EMAIL`. Исполнитель:
основатель. Шаг: пока `TICK_CRON` пуст, монитор только на `https://bid.place/`,
интервал 5 минут, ожидание HTTP 200. Монитор на `/api/*` не ставить: он будит
контейнер. Открыть ссылку поддержки и отправить одно письмо на почту поддержки.
Ожидание: пуш UptimeRobot пришёл, ссылка открылась, письмо дошло.
Статус: `NOT RUN`. Состав — [MONITORING-AND-SUPPORT.md](../launch/MONITORING-AND-SUPPORT.md).

Пока Cron выключен, ежедневный взгляд — админка «Здоровье»: свежий тик и
предупреждение, если аукционы идут при пустом Cron. Это тоже `NOT RUN`.

### 8. Откат

Объект: предыдущий образ и схема. Исполнитель: основатель.
Шаг: checkout последнего принятого release и полный повторный deploy Worker
и image. Ожидание: работает предыдущий образ. Откат только версии Worker
может оставить новый Container. Автоматического отката схемы нет; разрушающая
миграция требует проверенного восстановления в отдельную ветку или прямого
исправления вперёд. Данные базы не откатывать отдельно от медиа.
Статус процедуры: `NOT RUN`. Исходник ограничения `LOCAL VERIFIED` в
[откате Cloudflare](CLOUDFLARE-DEPLOYMENT.md#production-deploy-и-rollback).

### 9. Тестовый аукцион и `TICK_CRON`

Объект: один тестовый аукцион после `TICK_CRON=*/5 * * * *`. Исполнитель:
основатель. С `endsAt` и все 10 минут ожидания сайт не открывать и не
вызывать `/api/health`, `/api/health/ready`, `/api/internal/tick` и другой
опрос API. Закрытие, время заказа и доставку смотреть в базе и в почтовом
ящике.

Критерий W6: лот закрыт, заказ лучшей ставки создан, письмо «Ваша ставка
лучшая» доставлено покупателю. Все три момента — не позже 10 минут после
`endsAt`. Секунда `endsAt` по-прежнему не обещается. Статус: `NOT RUN`.

В Cloudflare → Cron Triggers записать запуски без ошибок. `system_heartbeats.at`
для `name = 'tick'` записать отдельно. Heartbeat не подставляет время создания
заказа и не подставляет время доставки письма.

Если за эти 10 минут открывали сайт или вызывали API, проверка не зачтена,
даже когда лот, заказ или письмо уже появились.

### 10. Остановка торгов

Объект: уже идущие лоты. Исполнитель: основатель.
Шаг: только [OPERATIONS.md §3.8](../launch/OPERATIONS.md#38-мошенничество-захват-аккаунта-бан):
снять каждый лот, заблокировать аккаунт, открытые заказы разобрать вручную.
Ожидание: нового общего выключателя нет; `RELEASE_HOLD=closed` гасит весь API
и не является процедурой остановки аукциона. Статус исполнения: `NOT RUN`.
Отсутствие отдельного флага в исходниках: `LOCAL VERIFIED` на `14256245`.

### 11. Согласие правил сделок

Объект: публикация W6. Исполнитель: основатель после утверждения черновика.
Шаг не выполнять из этого чек-листа. Реальные продажи остаются закрытыми,
пока согласие текущей версии не требуется на ставку, покупку, принятие
предложения и создание лота. Статус: `NOT RUN`.

### Наружные ответы 2026-11-02

Эти три запроса не доказывают Cron, почту, backup или Turnstile. `/api/health`
и `/api/health/ready` будят контейнер.

| Запрос | Результат |
| --- | --- |
| `GET https://bid.place/` | 200, `cf-cache-status: HIT`, 21:14:21Z |
| `GET https://bid.place/api/health` | 200, `{"status":"ok"}`, 21:14:40Z |
| `GET https://bid.place/api/health/ready` | 200, `{"status":"ok","database":"ok"}`, 21:14:40Z |

## Deferred (post-pilot)

- Multi-instance API and shared rate-limit state
- Removal of legacy DB media bytes after a verified object-store cutover
- Full browser/device/a11y CI matrix

See also [`docs/product/13-APPLICATION-SECURITY.md`](../product/13-APPLICATION-SECURITY.md) for backup encryption and multi-instance rate-limit notes.

Google/Telegram settings and the coordinated session cutover are described in
[Web auth rollout](WEB-AUTH-ROLLOUT.md).

# W2 — Надёжный тик: таймер в контейнере и Cron по настройке — план реализации

> **Для агентов:** выполнять через superpowers `subagent-driven-development`
> (рекомендуется) или `executing-plans`. Шаги — чекбоксы. Общие правила —
> [AGENT-RULES.md](../AGENT-RULES.md).

**Goal:** фоновая работа (медиа сейчас; закрытие аукционов, предложения,
напоминания по заказам и письма — с W3) выполняется одним идемпотентным тиком:
пока контейнер не спит — внутренним таймером, а когда спит — по Cloudflare Cron,
если он включён настройкой `TICK_CRON`.

**Architecture:** у Worker появляется `scheduled()`; он вызывает через
Durable Object `POST /api/internal/tick` с внутренним секретом. Внешние запросы
к `/api/internal/*` Worker отбрасывает (404). В Nest — `TickService` со списком
задач; каждая задача идемпотентна (условные переходы, лизы), поэтому двойной
вызов безопасен. `TickService` сам запускает тик каждые 30 с, пока процесс жив;
Cron нужен только чтобы будить спящий контейнер. Существующие in-process таймеры
медиа остаются как ускорение.

**Расписание — настройка деплоя, по умолчанию выключено** (решение основателя
2026-10-29): `TICK_CRON` пусто → `triggers` в конфиг Worker не попадают,
контейнер спит без посетителей, просроченная работа (закрытие аукциона, письма)
выполняется в первые 30 с после любого визита. Когда пойдут реальные аукционы —
`TICK_CRON="*/5 * * * *"`. Переменная помечена ★ в
[ENVIRONMENT.md](../../ops/ENVIRONMENT.md).

**Spec:** [COMMERCE.md](../COMMERCE.md) §3.2, §4.4, §6.3, §9; `DEC-101`
(срок отзыва при сне снят, восстановление после старта обязательно).

**Ветка:** `feature/scheduler-tick` от `main`. Факты проверены на `6720b7af`.
Зависит от: W0 (основная ветка `main`). Можно параллельно с W1.

## Global Constraints

- Расписание — из `TICK_CRON` при сборке конфига Worker
  (`scripts/cloudflare/config.mjs`); пусто или нет → без `triggers`; значение
  проверяется как cron-выражение, мусор — ошибка деплоя. В `wrangler.jsonc`
  расписание руками не пишется.
- Секрет `INTERNAL_TICK_SECRET` — секрет Worker; передаётся в контейнер через
  `containerEnvironment`; в Nest проверяется в `serverEnvSchema` (обязателен в
  production). Значение агент не создаёт и не читает — только имя.
- Сравнение секрета — постоянное по времени (`timingSafeEqual` в Nest;
  `secretMatches` уже есть в Worker).
- Тик не публичный: Worker возвращает 404 на внешний `/api/internal/*` до вызова
  контейнера; контейнер без верного заголовка тоже отвечает 404.
- Один тик за раз в процессе (флаг `running`); перекрывающийся вызов возвращает
  `{ skipped: true }`. `max_instances = 1`, поэтому распределённая блокировка не нужна.
- Каждая задача тика ограничена по объёму (как медиа: 8 + 16) и времени (общий
  бюджет 20 с); не уложилась — продолжит на следующем тике.
- Ошибка одной задачи логируется (`error` с именем задачи, без данных
  пользователей) и не останавливает другие; ответ тика содержит список упавших.
- Новые зависимости не добавлять (`@nestjs/schedule` не нужен).

**Цена решения.** Cron раз в 5 минут почти не даёт контейнеру уснуть
(`sleepAfter = 10m`); раз в минуту — не даёт совсем. Поэтому на старте Cron
выключен, а включается одной переменной, когда появятся реальные аукционы.
`/api/admin/health` (W3 Task 3) показывает предупреждение «идут аукционы, а Cron
выключен».

## Review Focus

1. Кто-то снаружи вызывает `/api/internal/tick` — 404, контейнер не будится. → Task 1, шаг 1.
2. Контейнер спал 2 часа (Cron выключен) — первый визит будит его, и в течение
   30 с внутренний тик выполняет просроченную работу. → Task 2, шаг 1; Task 3, шаг 1.
3. Два тика наложились — работа не выполнена дважды. → Task 2, шаг 1.
4. Одна задача падает каждый раз — остальные продолжают работать. → Task 2, шаг 1.
5. Секрета нет в окружении production — сервер не стартует (а не тик открыт без секрета). → Task 2, шаг 4.

## Facts

- `deploy/cloudflare/src/index.ts`: класс `PortfolioApi extends Container`
  (`defaultPort 3001`, `sleepAfter '10m'`, `envVars = containerEnvironment(this.env)`);
  default export — только `fetch` → `routeRequest`. `scheduled` нет.
- `deploy/cloudflare/src/router.ts`: API-пути → `env.API.getByName('portfolio-api').fetch(...)`;
  `_release/*` защищены `secretMatches` (`release-gate.ts` ~102).
- `deploy/cloudflare/src/environment.ts` ~14: `workerOnlySecrets = ['RELEASE_CONTROL']`;
  `containerEnvironment` бросает при отсутствии обязательной настройки.
- Тесты Worker: `environment.spec.ts`, `router.spec.ts`; запуск — `pnpm cloudflare:check`.
- `wrangler.jsonc`: `triggers` нет; env `staging`, `production` (~49).
- `apps/api/src/core/media/media-lifecycle.service.ts`: включён только при
  `S3_PUBLIC_BUCKET`; `onModuleInit` → `arm()` (5 с); `tick()` берёт до 8
  `REVOKE`/`CLEANUP` и до 16 старых `STAGING`; `PUBLISH`/`UPLOAD` в тик не
  попадают; лиз 5 мин.
- Env: `apps/api/src/core/config/env.ts` `loadServerEnv` → `serverEnvSchema`.
- Глобальный префикс Nest — `api` (`bootstrap.ts`).

## Бэкенд

### Task 1: Worker — расписание и закрытый маршрут

**Files:**
- Modify: `deploy/cloudflare/src/index.ts`, `deploy/cloudflare/src/router.ts`,
  `deploy/cloudflare/src/environment.ts`, `deploy/cloudflare/wrangler.jsonc`,
  `docs/ops/CLOUDFLARE-DEPLOYMENT.md`
- Test: `deploy/cloudflare/src/router.spec.ts`, `deploy/cloudflare/src/environment.spec.ts`

**Reuse:** `routeRequest`, `env.API.getByName('portfolio-api')`, `containerEnvironment`.

**Interfaces:**
- Produces: `export async function runScheduledTick(env: Environment): Promise<Response>`
  в `router.ts` (или рядом) — один вызов DO
  `POST http://container/api/internal/tick` с заголовком `X-Internal-Tick: <секрет>`;
  default export получает `scheduled(controller, env, ctx) { ctx.waitUntil(runScheduledTick(env)) }`.

- [ ] **Шаг 1: падающие тесты.** `router.spec.ts`: `it.each` по `GET/POST /api/internal/tick`,
  `/api/internal/x` → 404, `API.fetch` не вызван. `runScheduledTick` вызывает
  DO ровно раз с методом `POST`, путём `/api/internal/tick` и заголовком секрета.
  При `RELEASE_HOLD=closed` тик не вызывается. `environment.spec.ts`:
  `INTERNAL_TICK_SECRET` обязателен и попадает в `containerEnvironment`.
  Тест сборки конфига: `TICK_CRON` пусто → `triggers` нет; `*/5 * * * *` →
  `triggers.crons = ['*/5 * * * *']`; мусор → ошибка; то же значение уходит в
  `vars.TICK_CRON` (необязательная настройка контейнера — по ней W3 показывает
  в «Здоровье», что Cron выключен).
- [ ] **Шаг 2:** FAIL.
- [ ] **Шаг 3:** реализовать; `scripts/cloudflare/config.mjs` подставляет `triggers` из `TICK_CRON`.
- [ ] **Шаг 4:** `pnpm cloudflare:check` → PASS.
- [ ] **Шаг 5:** `CLOUDFLARE-DEPLOYMENT.md`: расписание, секрет (только имя и как
  задать: `wrangler secret put INTERNAL_TICK_SECRET --env production`), `TICK_CRON`
  (пусто по умолчанию, когда ставить `*/5`), цена «контейнер не спит».
  Строки `INTERNAL_TICK_SECRET` и `TICK_CRON` — в `docs/ops/ENVIRONMENT.md`.
- [ ] **Шаг 6:** коммит `feat: wake api with a cron tick`.
- [ ] **Шаг 7: один контур и честный шаблон окружения.** `DEC-102` — только
  production: удалить `env.staging` из `wrangler.jsonc` и ветки `staging` в
  `scripts/cloudflare/{deploy,migrate,config,build-web}.mjs` и `package.json`
  (`cloudflare:deploy:staging`, `cloudflare:build:staging`); путь без проверки
  релизной ветки исчезает вместе с ними. `.env.example` и `scripts/doctor.mjs`
  называют `JWT_SECRET`, который API не читает, — заменить на имена из
  `apps/api/src/core/config/env.ts` (`SESSION_SECRET`, `OTP_HASH_SECRET`,
  `ANALYTICS_WEB_ENABLED`); README — `SEED_ADMIN_PASSWORD` вместо
  `SEED_ADMIN_PASSWORD_HASH`. Только имена, без значений. `pnpm cloudflare:check` →
  PASS; коммит `chore: single production contour and accurate env template`.

### Task 2: Nest — внутренний тик

**Files:**
- Create: `apps/api/src/core/tick/tick.module.ts`, `tick.controller.ts`,
  `tick.service.ts`, `internal-tick.guard.ts`, `tick.service.spec.ts`
- Modify: `apps/api/src/app.module.ts`, `apps/api/src/core/config/env.ts`
  (схема), `.env.example` (только имя переменной, без значения)
- Test: `apps/api/test/integration/internal-tick.integration.spec.ts`

**Reuse:** `ApiExceptionFilter`; логгер проекта; `ConfigService`/`serverEnv`, как
в других guard'ах.

**Interfaces:**
- Produces:

```ts
type TickJob = { name: string; run(now: Date, budget: { deadline: number }): Promise<number> } // число обработанных
class TickService { register(job: TickJob): void; run(now?: Date): Promise<TickResult> }
type TickResult = { skipped: boolean; jobs: { name: string; processed: number; failed: boolean }[] }
TickService.lastSucceededAt(): Promise<Date | null>   // для /api/admin/health (W3)
```

  Каждый запуск без `skipped` и без упавших задач делает `upsert` строки
  `system_heartbeats(name = 'tick', at = now())` — новая таблица из двух колонок,
  миграция в этой задаче. Без неё основатель не узнает, что тик молчит (OPERATIONS §1).

  `POST /api/internal/tick` → `200 TickResult`. Задачи регистрируют модули-владельцы
  в `onModuleInit` (медиа — Task 3; продажи и письма — W3 Task 3 и Task 8).
  `TickService` в `onApplicationBootstrap` взводит один таймер `run()` каждые 30 с
  (`unref`, снимается в `onModuleDestroy`); тот же флаг `running` защищает от
  наложения с внешним вызовом.

- [ ] **Шаг 1: падающие тесты** (`tick.service.spec.ts`): задачи вызываются по
  порядку регистрации с одним `now`; упавшая задача → `failed: true`, следующие
  выполнены, один `error`-лог с именем задачи; второй `run` во время первого →
  `skipped: true`, задачи не вызваны; превышение бюджета → оставшиеся задачи
  пропущены и помечены `processed: 0`; поддельные таймеры: после старта через
  30 с `run` вызван сам, после `onModuleDestroy` — больше нет.
- [ ] **Шаг 2:** FAIL → реализовать → PASS.
- [ ] **Шаг 3: интеграция.** Без заголовка / с неверным → 404; с верным → 200
  и `TickResult`; эндпоинт не требует сессии и не имеет rate limit. CSRF-проверка
  (Origin + `x-bidplace-request`) для этого маршрута отключена, проверка секрета —
  нет. После успешного запуска `lastSucceededAt()` вернул его время; после
  запуска с упавшей задачей — прежнее.
- [ ] **Шаг 4:** `INTERNAL_TICK_SECRET` — обязателен при `NODE_ENV=production`
  (тест схемы env: отсутствие → ошибка запуска), ≥ 32 символов.
- [ ] **Шаг 5:** коммит `feat: add internal tick endpoint`.

### Task 3: Медиа — задача тика

**Files:**
- Modify: `apps/api/src/core/media/media-lifecycle.service.ts`,
  `apps/api/src/core/media/media.module.ts` (или где регистрируется сервис)
- Test: `apps/api/src/core/media/media-lifecycle.recovery.spec.ts`,
  `apps/api/test/integration/media-lifecycle.integration.spec.ts` (добавить случай)

**Interfaces:**
- Consumes: `TickService.register`.
- Produces: задача `media` вызывает существующий `tick()`; публичная сигнатура
  `tick()` не меняется.

- [ ] **Шаг 1: падающий тест.** Операция `REVOKE` с `nextAttemptAt` в прошлом,
  in-process таймеры не взведены (имитация «проснулись») → после
  `TickService.run()` операция выполнена.
- [ ] **Шаг 2:** регистрация задачи (только когда сервис `enabled`); PASS.
- [ ] **Шаг 3: проверка зависших `PUBLISH`.** Найти, как восстанавливается
  `PUBLISH` с истёкшим лизом после рестарта. Если не восстанавливается —
  добавить его в выборку `tick()` тем же условием, что `REVOKE`, с тестом. Если
  восстанавливается иначе — `Ruling:` с объяснением.
- [ ] **Шаг 4:** коммит `feat: run media recovery from the tick`.

## Фронтенд

Изменений нет.

## Документы и проверки

### Task 4

- [ ] `10-CODE-ARCHITECTURE.md`: тик — единственная гарантия фоновой работы;
  задачи регистрируют владельцы; Worker закрывает `/api/internal/*`.
  `11-PROJECT-STATUS.md`: запись; живой запуск по расписанию — `Needs verification`
  до первого деплоя.
- [ ] Проверки: `pnpm cloudflare:check`; `typecheck`/`lint` `@bidplace/api`; API
  unit + интеграция (`internal-tick`, `media-lifecycle`); `git diff --check`;
  `pnpm docs:link-check`.
- [ ] Коммит `docs: record scheduled tick`.
- [ ] В отчёт — шаги для основателя после деплоя: задать секрет; через 2 минуты
  в логах контейнера есть ответ тика; `curl -i https://bid.place/api/internal/tick` → 404.

## Промпт исполнителю

```text
Работай в /Users/yayauheny/projects/bidplace, ветка feature/scheduler-tick от main.
Прочитай AGENTS.md, docs/launch/AGENT-RULES.md, целиком docs/launch/waves/W2-scheduler.md.
Скиллы: implement, nest, security, workers-best-practices + superpowers
subagent-driven-development (или executing-plans), test-driven-development.
Task 1 → Task 4, один коммит на задачу. Секреты не создавать и не читать.
Деплой не делать. Отчёт по AGENT-RULES §6.
```

## Промпт ревьюеру

```text
Прочитай docs/launch/AGENT-RULES.md §7 и docs/launch/waves/W2-scheduler.md.
Ревью ветки feature/scheduler-tick против main. Скиллы: code-review-best-practices,
security, workers-best-practices. Сам прогони pnpm cloudflare:check и тесты тика,
проверь Review Focus. Вердикт по AGENT-RULES §7.
```

Инварианты:
- `/api/internal/*` недоступен снаружи на двух уровнях (Worker и контейнер);
- тик идемпотентен: двойной вызов не удваивает работу;
- одна упавшая задача не блокирует остальные и не пропадает молча;
- секрет не в логах, не в ответах, не в клиентском бандле.

Красные флаги: `@nestjs/schedule` или второй планировщик; распределённые
блокировки; тик, который сам решает бизнес-правила (правила — у владельцев задач);
сравнение секрета через `===`; пустой `catch`.

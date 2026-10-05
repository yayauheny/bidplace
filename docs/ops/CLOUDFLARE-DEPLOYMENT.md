# Bidplace: Cloudflare deployment

Дата проверки документации: 2026-10-05. Код — в `feature/cloudflare-deployment`,
base release `507bb5b`. Реального deployment пока нет. Результаты и blockers:
[deployment verification](../audits/current/14-CLOUDFLARE-DEPLOYMENT-VERIFICATION.md).

## Архитектура

`bid.place` → Worker: `/api` и `/api/*` → один private Nest Container, остальные
запросы → Expo SPA Static Assets. Nest → Neon + private/public R2. Public медиа
идут напрямую через `media.bid.place`; JWT, role, ownership и moderation остаются
в Nest. Worker не подключается к БД. `PortfolioApi` DO — обязательный adapter
Cloudflare Containers, не новая очередь или business storage.

Basic Container: 0.25 vCPU / 1 GiB, `max_instances=1`, одно постоянное имя DO,
порт 3001, idle sleep 10 минут, без cron/keepalive. Internet access нужен для
Neon TCP/5432, SMTP/587 или 465, R2 и purge HTTPS. Автоматических миграций на
старте нет. [Container class](https://developers.cloudflare.com/containers/api/container-class/),
[configuration](https://developers.cloudflare.com/containers/configuration/wrangler/).

## Ресурсы и домены — вручную

1. Добавить `bid.place` в Cloudflare; в Porkbun заменить nameservers на назначенные
   Cloudflare, сохранив необходимые DNS records. Регистратор остаётся Porkbun.
   Проверить DNSSEC при смене delegation по
   [full zone setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/).
2. Включить Workers Paid/Containers в аккаунте; подтвердить бюджет. Создать
   workers `bidplace-staging` и `bidplace-production`, отдельно их runtime secrets.
3. Создать четыре R2 buckets Standard: `bidplace-media-private/public` и
   `bidplace-staging-media-private/public`. Разделение предотвращает destructive
   staging smoke по production objects. Обе пары используют одинаковую
   jurisdiction; endpoint соответствует ей.
4. На public buckets подключить R2 Custom Domains `media.bid.place` и
   `media-staging.bid.place`. Private buckets: без public domain и без `r2.dev`.
   На public отключить `r2.dev` после подключения domain. Не создавать Worker
   route на media hosts.
5. Worker Custom Domains: `bid.place` и `staging.bid.place`. Wrangler создаёт
   соответствующий маршрут/DNS. `workers_dev=false`, `preview_urls=false`.
   `bidplace.lol` зарезервирован для будущего dev и сейчас не подключается.

Источники: [Get started](https://developers.cloudflare.com/containers/get-started/),
[Worker Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/),
[workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/),
[R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/).

## Vars и secrets

Owner — `deploy/cloudflare/wrangler.jsonc`, allowlist Container —
`deploy/cloudflare/src/environment.ts`, server validation — `apps/api/src/core/config/env.ts`.
`.env.example` — schema-derived local template с пустыми secrets; не production env file.
Optional unset параметры закомментированы, иначе empty string может не пройти
server validation. `TELEGRAM_BOT_TOKEN` — secret сохранённого legacy scope,
не входит в portfolio runtime; `TEST_EMAIL_FILE` — только локальный transport,
в cloud Container не передаётся. Они не нужны для этого deployment.

Заполнить **non-secret vars** отдельно в `env.staging.vars` и
`env.production.vars`: `S3_ENDPOINT`, `CLOUDFLARE_ZONE_ID`, `SMTP_HOST`,
`SMTP_FROM`, `SERVICE_RULES_OWNER/CONTACT/TEXT`. Bucket names и media domains уже
раздельные; если изменить их, изменить contract до deploy. Остальные vars:
NODE_ENV/APP_ENV, API_PORT/API_URL/CORS_ORIGIN/TRUST_PROXY, upload/rate caps,
SMTP_PORT/SECURE/AUTH_MODE, PASSWORD_RESET_URL_BASE, TEST_EMAIL_BYPASS,
ANALYTICS_INGEST_ENABLED, MEDIA_STORAGE_PROVIDER, S3_REGION/S3_BUCKET/S3_PUBLIC_BUCKET,
MEDIA_PUBLIC_BASE_URL. Названия/правила публичны и секретами не являются.

**Runtime secrets — имена, значения вводит оператор в Cloudflare**:

| Name | Назначение |
|---|---|
| DATABASE_URL | Neon pooler URL; отдельный для каждого environment |
| JWT_SECRET | Независимый случайный secret, минимум 32 chars |
| S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY | R2 Object Read & Write, только два buckets данного environment |
| SMTP_USERNAME / SMTP_PASSWORD | Выбранный внешний SMTP; profile здесь AUTH_MODE=login |
| CLOUDFLARE_CACHE_TOKEN | Zone → Cache Purge только для зоны `bid.place` |

Не использовать Global API Key или account-wide R2 admin token. Purge token
shared zone технически может purging production и staging: выдавать отдельные
tokens для диагностики/rotation, но ограничение конкретным host не обещается.
[Purge API permissions](https://developers.cloudflare.com/api/resources/cache/methods/purge/),
[R2 bucket-scoped credentials](https://developers.cloudflare.com/r2/api/tokens/).

Для каждого имени выполнить interactive command, например:
`pnpm exec wrangler secret put JWT_SECRET --config deploy/cloudflare/wrangler.jsonc --env staging`.
Повторить отдельно для production. CLI first-time secret setup может создать
пустой Worker; он ещё не application deployment. Required secret declarations
есть в обоих environments. `envVars` передаёт allowlist в Container при старте;
значения отсутствуют в source/image/frontend. Vars preflight тоже fail closed.
[Required secrets](https://developers.cloudflare.com/workers/wrangler/configuration/#secrets-configuration-property),
[Container environment](https://developers.cloudflare.com/containers/examples/env-vars-and-secrets/).

Подготовленный вариант: runtime в Cloudflare. GitHub хранит код/Verify CI;
application credentials в GitHub не дублируются. Если будет выбрано Actions
deployment — только отдельный least-privilege deploy token и non-secret account ID.
Этот выбор ещё ожидает ответа основателя; внешняя настройка не выполнена.

## Neon и migrations

Создать отдельный staging branch/database, проверить, что его роль/URL не имеет
доступа к production. Runtime URL — TLS pooler (`-pooler` hostname), начать с
`connection_limit=3&pool_timeout=10`; это лимит Prisma connections на процесс,
не гарантия отсутствия SQL pressure. Не печатать URL. Нужен один Nest instance.
[Neon pooling](https://neon.com/docs/connect/connection-pooling),
[Prisma pool](https://www.prisma.io/docs/orm/v6/prisma-client/setup-and-configuration/databases-connections/connection-pool).

Перед каждым deployment — backup и просмотр новых migrations, затем оператор
на trusted machine запускает `pnpm cloudflare:migrate staging` (production: `pnpm cloudflare:migrate production --confirm-production`) с отдельно безопасно
переданным `DATABASE_URL` migration role. Script не загружает repository dotenv;
schema/migrations копируются во временный каталог. Не брать runtime Worker
credentials в build. Database migrations не часть container CMD/deploy script.
Neon поддерживает migrations через pooler, но отдельная direct connection/role
удобна для контроля schema privileges:
[Neon Prisma migration support](https://neon.com/blog/better-postgres-with-prisma-experience).

## Build, первый staging deploy и CI

Node 22, pnpm 11.7.0, Docker daemon; root monorepo — build context.

```sh
pnpm install --frozen-lockfile
pnpm cloudflare:check
pnpm cloudflare:build:staging
pnpm cloudflare:image:verify
# После resource/vars/secrets setup и отдельного migration step:
pnpm cloudflare:deploy:staging
```

Deploy script проверяет vars, Worker, строит SPA для нужного origin, проверяет
production-like amd64 image, затем вызывает Wrangler. Smoke создаёт и удаляет
только собственные disposable DB/API/network; runtime placeholders используются
исключительно локальным smoke и не загружаются в Cloudflare. Docker/Prisma build
уже внутри Dockerfile; не требуется отдельный generate/build перед image build.
[Static Assets SPA](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/),
[Image management](https://developers.cloudflare.com/containers/guides/image-management/).

GitHub Verify выполняет существующий `pnpm verify`, Worker gate, staging web и
amd64 image smoke. Production branch остаётся `feature/portfolio-mvp-release`:
PR → required Verify / protected branch → deploy. Branch protection требуется
включить вручную; конфиг CI не включает её автоматически.

Workers Builds поддерживает root monorepo/pnpm и Dockerfile image build. Native
integration — предпочтительный вариант **после** required CI gate. Root directory
`/`, Node version 22.20.0, pnpm 11.7.0, production branch только release.
Не включать production full deploy для остальных branches. Обычный
`versions upload` не выкатывает новый Container и не создаёт полноценный preview.
Staging — отдельный Worker, отдельная source branch/full deploy.
[Git integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/),
[Container deploy and previews](https://developers.cloudflare.com/containers/guides/deploy/).

Docker **run/network** smoke внутри Workers Builds документально не подтверждён;
скрипт с image gate полностью проверен локально/GitHub-compatible, не на Builds.
До активации automatic Builds подтвердить этот gate там либо отдельно согласовать
deployment command после обязательного GitHub gate. Не обходить проверку молча.

## Production deploy и rollback

После staging smoke перенести review-approved package в release, выполнить CI
на exact release HEAD, отдельные migrations и `pnpm cloudflare:deploy` из clean
release checkout. Script запрещает production с другой ветки; на Workers Builds
проверяет `WORKERS_CI_BRANCH`. Новая ветка сейчас не интегрирована и не pushed.
Wrangler сам строит/публикует image в Cloudflare registry; Docker Hub не нужен.
Deployment не транзакционный: Worker может активироваться до завершения image
rollout. Дождаться Container state и реального API smoke, не только exit 0 CLI.

Rollback — checkout последнего принятого release commit и повторный полный deploy
Worker **и image**. Не ограничиваться rollback Worker version: Container может
остаться новым. Schema rollback автоматически отсутствует; destructive migrations
требуют tested restore либо forward fix. Не откатывать данные отдельно от media.

## Media cache — mandatory before live smoke

На двух public media hosts настроить cache rule: cache eligible, **Ignore query
string целиком**, browser TTL respect origin, edge TTL respect `s-maxage` (код:
86400s). Не повышать browser TTL: текущий `max-age=0` нужен для revoke ≤5min.
Никаких cookie/Origin/header cache-key variants. Expression должен match host/path
без GET-only ограничения, иначе purge может не применить тот же key. Не применять
ignore-query к application API: там параметры фильтров меняют JSON.
[R2 caching](https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/),
[Cache keys](https://developers.cloudflare.com/cache/how-to/cache-keys/),
[Single-file purge](https://developers.cloudflare.com/cache/how-to/purge-cache/purge-by-single-file/),
[Browser/edge directives](https://developers.cloudflare.com/cache/concepts/cache-control/).

Smart Tiered Cache может уменьшить R2 misses между PoPs; включить доступный
вариант после базового smoke. Cache Reserve/Images/дополнительный CDN не нужны.
`purge success=true` — только приём запроса; проверить старый URL после hide,
также `?media_retry=1` и произвольный query, во втором PoP по возможности.

## Smoke — staging, затем production без destructive test suite

- `/` и прямой deep link открывают SPA; JS/CSS/font requests 200, correct API origin.
- `/api/health` 200, `/api/health/ready` 200 и DB ok. Unknown API path даёт Nest 404,
  не SPA 200. Anonymous cache MISS → HIT на одной странице/PoP; Cookie/Bearer
  requests не shared cache. Filters остаются разными ключами; TTL 30/60s,
  categories 1800s. JSON revoke visibility может отставать максимум на короткий TTL.
- Register → email OTP → verified login → owner/admin permissions, forgot/reset →
  письмо, logout → old session invalid. Protected anonymous/stranger requests rejected.
- Author → draft Work → image private R2 → submit → moderation → approve delivery
  DONE → public PREVIEW → viewer FULL → edit/republish атомарно → hide/revoke.
  Проверить реальное CDN MISS/HIT, metadata stripping, SOURCE privacy и старые URL.
- Private R2 не открывается анонимно; нет public Container bypass URL, production
  workers.dev/version URLs выключены. Источник авторизации — Nest.
- Image/source/frontend не содержат runtime credentials; не печатать их при проверке.
  Локальная проверка исходников не заменяет cloud secret/inventory verification.
- Дать контейнеру уснуть без browser polling/health probes, проверить новый cold
  request и Neon activity. Успешный пустой recovery снимает пятисекундный timer.
  Timer остаётся, только пока есть REVOKE/CLEANUP или чтение recovery не удалось.
  Спящий Container сам не просыпается для DEC-097; это отдельный live acceptance.

## Защита, logs и экономичные настройки

Nest limits остаются. Edge rate rules прежде всего на login/register/forgot/email
request и uploads; analytics — если enabled. Free zone предоставляет одну rate
rule с ограниченными fields; method/host grouping зависит от плана. Workers Paid
не включает автоматически платный WAF plan. Нельзя молча покупать Pro/Business.
Не ставить browser challenge на XHR API без проверенного клиентского flow.
[Current rate-rule availability](https://developers.cloudflare.com/waf/rate-limiting-rules/).

Worker observability включена, per-request invocation logs выключены. Container
startup/errors доступны; existing Nest request logs сохранены, поэтому не
обещается полное устранение request logging. Paid Workers Logs retention сейчас
7 дней; тариф меняется 2026-12-01. Не включать бессрочный Logpush/response bodies.
[Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/).

Нет внешнего периодического `/ready` и keepalive. Даже `/health` будит Container;
использовать ручной deploy smoke, не частый origin monitor. No useless polling
остается **Partial**: текущий journal executor 5s сохранён, analytics enabled
сохранён. Полный removal требует отдельного подтверждённого scope. Цена зависит
от активности; см. [FinOps audit](../audits/current/13-FINOPS-SCALE-TO-ZERO-AUDIT.md).

## Common failures

- Vars/secrets missing: заполнить contract, не ослаблять server validation.
- Worker live/API unavailable: first provisioning/rollout, Container logs, Neon TLS/pool.
- Wrong architecture/native module: повторить amd64 gate, проверить Node/OpenSSL/Prisma engine.
- SPA на `/api`: run_worker_first и Worker path; deep link 404 — SPA export/config.
- CDN DYNAMIC/отозванный URL HIT: domain/cache rule/purge token и query/header key.
- OTP/reset не доставляются: SMTP TLS/auth/from/DNS; не включать production bypass.
- БД не засыпает: incoming browser polls, media SQL loop, analytics, external probes;
  default idle Container timeout сам не устраняет application SQL во время работы.

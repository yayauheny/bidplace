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
`env.production.vars`: `S3_ENDPOINT`, `CLOUDFLARE_ZONE_ID`, `SMTP_FROM`,
`SERVICE_RULES_OWNER/CONTACT/TEXT`. `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` и
`SMTP_AUTH_MODE` уже заданы профилем Cloudflare Email Service. Bucket names и
media domains уже раздельные; если изменить их, изменить contract до deploy.
Остальные vars: NODE_ENV/APP_ENV, API_PORT/API_URL/CORS_ORIGIN/TRUST_PROXY,
upload/rate caps, PASSWORD_RESET_URL_BASE, TEST_EMAIL_BYPASS,
ANALYTICS_INGEST_ENABLED, MEDIA_STORAGE_PROVIDER, S3_REGION/S3_BUCKET/S3_PUBLIC_BUCKET,
MEDIA_PUBLIC_BASE_URL. Названия/правила публичны и секретами не являются.

**Runtime secrets — имена, значения вводит оператор в Cloudflare**:

| Name | Назначение |
|---|---|
| DATABASE_URL | Neon pooler URL; отдельный для каждого environment |
| JWT_SECRET | Независимый случайный secret, минимум 32 chars |
| S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY | R2 Object Read & Write, только два buckets данного environment |
| SMTP_USERNAME / SMTP_PASSWORD | Cloudflare Email Service SMTP. Username — литерал `api_token`. Password — отдельный API token с Email Sending: Edit |
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

Модель секретов, `DEC-100`:

- Восстанавливаемая копия — зашифрованное хранилище оператора и его резервная
  копия вне GitHub и вне Cloudflare.
- GitHub Environments может быть источником значений в момент deployment.
- Cloudflare хранит runtime-копии, которые нужны Container.
- GitHub Secrets не резервная копия: сохранённые значения штатно не читаются обратно.
- Staging и production разделены. Новый CI workflow для этой модели не добавляется.
- `scripts/cloudflare/deploy.mjs` не читает значения секретов. Если позже
  появится GitHub Actions deploy, передача не должна оставлять значения в logs,
  artifacts, image или frontend bundle. `wrangler secret put` вводит значение
  интерактивно; не передавать secrets через `--var` и не печатать их в команде.

## Cloudflare Email Service

Выбор провайдера — `Confirmed` (`DEC-100`). Настройка аккаунта, DNS, credentials
и доставка в почтовый ящик — `Needs verification`. Runtime Nodemailer не менялся:
`buildSmtpTransportOptions` уже собирает host, port 465, `secure: true` и
`AUTH login`. SDK, Workers email binding и новый mail adapter не добавляются.
Смена провайдера остаётся заменой конфигурации.

В `env.staging.vars` и `env.production.vars` уже заданы несекретные параметры:

- `SMTP_HOST=smtp.mx.cloudflare.net`
- `SMTP_PORT=465`
- `SMTP_SECURE=true` — implicit TLS. Порт 587 и STARTTLS этот endpoint не принимает.
- `SMTP_AUTH_MODE=login`

`SMTP_FROM` остаётся пустым, пока оператор не укажет адрес. Preflight падает,
пока он пуст. Не подставлять фиктивный адрес.

Официальные источники:
[SMTP](https://developers.cloudflare.com/email-service/api/send-emails/smtp/),
[Send emails](https://developers.cloudflare.com/email-service/get-started/send-emails/),
[Pricing](https://developers.cloudflare.com/email-service/platform/pricing/).

### Проверка аккаунта

1. В том же Cloudflare account, где будут Workers, открыть Email Service →
   Email Sending.
2. Убедиться, что доступна отправка произвольным получателям. Для этого нужен
   Workers Paid. Email Routing на Workers Free доставляет только на verified
   destination addresses и не закрывает OTP и reset.
3. Домен отправителя должен использовать Cloudflare DNS.

### Домен и DNS

1. Email Sending → Onboard Domain. Выбрать домен этого аккаунта.
2. Подтвердить DNS-записи, которые Cloudflare добавляет сам: MX, SPF и DKIM на
   поддомене `cf-bounce`, и DMARC TXT на `_dmarc.<домен>`. Не копировать чужие
   значения и не добавлять отдельный mail A/AAAA для этого SMTP.
3. Дождаться применения записей. Адрес `SMTP_FROM` должен быть на этом домене.
   Записать его отдельно в `env.staging.vars` и `env.production.vars`.
   Адреса окружений могут различаться; host и порт — нет.

### Credentials

1. Создать два API token, каждый только с Email Sending: Edit. Один для staging,
   один для production. Не использовать Global API Key и не переиспользовать
   R2 или cache token.
2. Для каждого environment:
   `pnpm exec wrangler secret put SMTP_USERNAME --config deploy/cloudflare/wrangler.jsonc --env <staging|production>`
   и ввести литерал `api_token`.
3. Тем же способом задать `SMTP_PASSWORD` — сам token. Повторить для второго
   environment другим token.
4. Положить восстанавливаемые копии в зашифрованное хранилище оператора и в его
   резервную копию вне GitHub и Cloudflare. Не рассчитывать прочитать значение
   обратно из GitHub Secrets или из Cloudflare secret.

### Доставка, не только SMTP acceptance

SMTP `250` и отсутствие ошибки `mail.send` не доказывают, что письмо в ящике.
Проверить оба окружения на реальном ящике, не на verified destination address,
потому что такие адреса не расходуют квоту и не проверяют произвольную доставку:

1. Запросить код подтверждения email. В ящике, включая spam, должно быть письмо
   `bidplace email verification code` с шестизначным кодом. Код должен пройти
   проверку в приложении.
2. Запросить сброс пароля. В ящике должно быть письмо `bidplace password reset`
   со ссылкой на `PASSWORD_RESET_URL_BASE` этого окружения. Ссылка должна
   открывать сброс и принимать новый пароль.
3. Отказ на границе API и адрес из suppression list квоту не тратят. Принятое
   письмо и hard bounce тратят. До этой проверки доставка остаётся
   `Needs verification`.

### Квота

Workers Paid включает 3 000 исходящих писем на аккаунт за billing month,
далее $0.35 за 1 000. Это квота писем, не пользователей. Email Service входит
в расходы Cloudflare внутри общего бюджета `DEC-099`: около $5–7 в месяц,
потолок $10, вместе с Neon. Квота не останавливает отправку и не останавливает
расходы. Overage остаётся внутри этого бюджета.

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
86400s). Не повышать browser TTL: origin отдаёт `max-age=0`. `DEC-101` снимает
цель отзыва ≤5 минут; старый URL может оставаться до успешного purge и
recovery.
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
- Остановить и снова запустить Container. Незавершённый REVOKE должен
  продолжиться после запуска. Успешный пустой recovery снимает пятисекундный
  timer и прекращает SQL-чтения. Timer остаётся, только пока есть
  REVOKE/CLEANUP или чтение recovery не удалось. `DEC-101` не требует, чтобы
  спящий процесс сам проснулся ради снятого пятиминутного срока. Старый
  публичный URL может работать до успешного восстановления.

## Защита, logs и экономичные настройки

Nest limits остаются. Edge rate rules прежде всего на login/register/forgot/email
request и uploads; analytics — если enabled. Free zone предоставляет одну rate
rule с ограниченными fields; method/host grouping зависит от плана. Workers Paid
не включает автоматически платный WAF plan. Нельзя молча покупать Pro/Business.
Не ставить browser challenge на XHR API без проверенного клиентского flow.
[Current rate-rule availability](https://developers.cloudflare.com/waf/rate-limiting-rules/).

Зона `bid.place` сейчас на Free Website, $0. Cloudflare Pro не нужен для этого
MVP и не заменяет Workers Paid. Workers Paid ($5/месяц) нужен для Container и
Email Sending; он не оплачивает Neon. Neon остаётся на Free, пока хватает его
квот: платного перерасхода нет, при исчерпании compute база приостанавливается.
`suspend_timeout_seconds=0` на текущем endpoint — пауза по умолчанию плана, не
always-on. Data API не включается. Потолок $10 автоматически не гарантируется.

Worker observability включена, per-request invocation logs выключены. Container
startup/errors доступны; existing Nest request logs сохранены, поэтому не
обещается полное устранение request logging. Paid Workers Logs retention сейчас
7 дней; тариф меняется 2026-12-01. Не включать бессрочный Logpush/response bodies.
[Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/).

Нет внешнего периодического `/ready` и keepalive. Даже `/health` будит Container;
использовать ручной deploy smoke, не частый origin monitor. No useless polling
остается **Partial**: текущий journal executor 5s сохранён, analytics enabled
сохранён. `DEC-101` снимает пятиминутный срок и не удаляет executor. Полный
removal требует отдельного подтверждённого scope. Цена зависит
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

## Актуальный operator checklist

Этот список — единственный текущий перечень недостающих настроек. Более ранние
handoff-абзацы сохраняют историю проверок. `DEC-101` снимает требование
самостоятельно проснуться ради пятиминутного срока. Значения секретов сюда не
входят. Этот пакет их не создавал и не читал.

| Что ввести | Куда | Как проверить | Статус |
|---|---|---|---|
| Workers `bidplace-staging` и `bidplace-production`, custom domains `staging.bid.place` и `bid.place`; `workers.dev` и preview URLs выключены | Cloudflare account `56b0c4b96497366c262447d2a18bf632`. Имена и routes уже в `deploy/cloudflare/wrangler.jsonc` | В dashboard оба Worker существуют, hostname открывает свой Worker | Needs verification. Зона `bid.place` (`f10d49913e125d8b0d424018322aeb07`) создана и `pending`. Workers не развёрнуты |
| Отдельный Neon staging branch/database и роль без доступа к production. Runtime URL — TLS pooler | Neon; затем secret `DATABASE_URL` отдельно для staging и production. Миграция: `pnpm cloudflare:migrate staging` после backup. Production — `pnpm cloudflare:migrate production --confirm-production` | Роль staging не читает production. URL не печатать. После будущего deploy `/api/health/ready` отвечает | Needs verification |
| Четыре R2 bucket из контракта, public hosts `media-staging.bid.place` и `media.bid.place`, cache rule ignore entire query string на каждом media host. Browser TTL не повышать. Правило не применять к API | R2 location `weur`. `S3_ENDPOINT` и `CLOUDFLARE_ZONE_ID` записаны в обоих environments | Buckets существуют и `r2.dev` выключен. Custom domain и cache rule появятся после делегирования зоны | Partial. Buckets созданы и закрыты. Hosts и cache rule не подключены, зона `pending` |
| Email Sending на Workers Paid, onboard домена отправителя, DNS которые добавляет Cloudflare: MX, SPF и DKIM на `cf-bounce`, DMARC на `_dmarc`. Адрес `SMTP_FROM` на этом домене | Email Service и `env.staging.vars` / `env.production.vars`. Host `smtp.mx.cloudflare.net`, port `465`, `SMTP_SECURE=true`, `login` уже заданы | Preflight больше не называет пустой `SMTP_FROM`. Доставка в ящик — отдельная live-проверка ниже | Needs verification. `SMTP_FROM` пуст, preflight fail-closed |
| Runtime secrets по именам: `DATABASE_URL`, `JWT_SECRET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `SMTP_USERNAME` (литерал `api_token`), `SMTP_PASSWORD` (отдельный Email Sending: Edit token), `CLOUDFLARE_CACHE_TOKEN` | `pnpm exec wrangler secret put <NAME> --config deploy/cloudflare/wrangler.jsonc --env <staging\|production>`. Восстанавливаемая копия — зашифрованное хранилище оператора вне GitHub и Cloudflare | Wrangler показывает наличие имён. Значения не печатать. Staging и production различаются | Needs verification |
| Пустые публичные vars: `SMTP_FROM`, `SERVICE_RULES_OWNER`, `SERVICE_RULES_CONTACT`, `SERVICE_RULES_TEXT`. `S3_ENDPOINT` и `CLOUDFLARE_ZONE_ID` уже заполнены | `env.staging.vars` и `env.production.vars` | `validateConfig` проходит, когда оставшиеся поля непусты. До этого preflight падает на пустом `SMTP_FROM` и правилах | Needs verification. Подтверждённых правил сервиса в материалах нет |

Live acceptance после этих настроек и будущего staging deploy. Локальные тесты
её не закрывают:

- реальная доставка OTP и reset и полный auth flow: регистрация, код из ящика,
  verified login, forgot/reset по ссылке окружения, logout делает старую сессию
  недействительной;
- author → work → private upload → submit → moderation → public PREVIEW → FULL
  → edit/republish → hide;
- после `DONE` и фактической очистки CDN старый media URL, тот же URL с
  `?media_retry=1` и произвольный query недоступны. `purge success=true` —
  только приём запроса. F11/D08 этим локальным пакетом не закрывается;
- pending `REVOKE` продолжается после остановки и следующего запуска;
- успешный пустой recovery прекращает SQL-чтения;
- самостоятельное пробуждение спящего процесса только ради снятого срока не
  требуется. Старый публичный URL может работать до успешного восстановления.

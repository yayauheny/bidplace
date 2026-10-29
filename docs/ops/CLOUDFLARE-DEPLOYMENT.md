# Bidplace: Cloudflare deployment

Дата проверки документации: 2026-10-06. Реального deployment пока нет.
Текущий путь — один production contour, `DEC-102`. Конфиг и скрипты
Cloudflare принимают только `production`; staging-команды удалены. Branch gate
deploy-скрипта и ручного workflow совпадает: `main`. Более ранние staging-шаги
ниже сохраняют историю и не являются обязательным deployment. Результаты:
[deployment verification](../audits/current/14-CLOUDFLARE-DEPLOYMENT-VERIFICATION.md).

## Текущий production path

Один контур: Worker `bidplace-production`, сайт `https://bid.place`, Neon
project `calm-rain-59989397`, default branch `production`
`br-polished-haze-b2d6rop9`, database `neondb`. Public media
`https://media.bid.place`. Staging Neon branch удалена основателем. Оставшиеся
staging buckets и DNS этой волной не удаляются и в deploy не входят.

Ручной запуск — `.github/workflows/production-deploy.yml`, только
`workflow_dispatch`. Push, PR и расписание deploy не запускают. GitHub
показывает кнопку Run workflow после того, как этот файл есть на default
branch `main`. Default branch не менять. Запускать workflow нужно с branch
`main`: Actions → Production deploy → Run workflow →
`main`. Job отклоняет любой другой ref. Checkout, checks, production SPA
build, image gate, необязательная migration и deploy относятся к одному
`github.sha`.

Параллельный production deploy не стартует, пока предыдущий не закончился.
Уже идущая migration не отменяется.

Migration — отдельный шаг. В поле `confirm_migration` нужно ввести ровно
`migrate-production`, иначе migration пропускается. Неверная фраза останавливает
job и не печатается. Первый deploy должен включать эту фразу. Script —
`pnpm cloudflare:migrate production --confirm-production`. В шаг попадает только
secret `NEON_DIRECT_URL` под именем `DATABASE_URL`: прямой Neon hostname без
`-pooler`. Pooled `DATABASE_URL` в этот шаг не передаётся.

Deploy вызывает существующий `scripts/cloudflare/deploy.mjs`. Он снова проходит
check, production build и image gate уже без runtime credentials, затем
`wrangler deploy --secrets-file`. JSON создаётся в `RUNNER_TEMP` с правами
`0600`, лежит вне checkout, не попадает в artifacts или cache и удаляется при
выходе. `SMTP_USERNAME` workflow записывает как литерал `api_token`; отдельный
secret для него не нужен. Job использует существующий GitHub Environment
`prod`. Новое Environment не создаётся, и secrets не дублируются на уровне
repository. `SERVICE_RULES_OWNER`, `SERVICE_RULES_CONTACT`,
`SERVICE_RULES_TEXT` и `CLOUDFLARE_ACCOUNT_ID` читаются из variables этого
Environment и попадают только в временный production config. В записанном
production Wrangler эти три поля пустые. Пустое правило останавливает deploy
до Wrangler. Перед migration CI проверяет наличие secrets и что pooled
`DATABASE_URL` и direct `NEON_DIRECT_URL` ведут в production `neondb`, не
печатая значения. Workflow использует GitHub Secrets `TURNSTILE_SITE_KEY`
(публичный site key) и `TURNSTILE_SECRET_KEY` (backend). Workflow передаёт
site key в Build the production SPA и в Deploy production. `build-web.mjs`
берёт непустой caller, иначе непустой `TURNSTILE_SITE_KEY` из Wrangler vars,
обрезает пробелы и кладёт результат в `EXPO_PUBLIC_TURNSTILE_SITE_KEY`.
Записанный Wrangler держит это поле пустым, поэтому production build без
caller останавливается до Expo export. Site key не входит в `workerSecrets`
и не пишется в secrets-file. `TURNSTILE_SECRET_KEY` остаётся только в проверке
production settings и в payload Container. `gateEnvironment` удаляет его до
дочерней сборки и оставляет public site key. Значения не печатаются. Локально
это проверяют `scripts/cloudflare/config.spec.mjs` и `deploy.spec.mjs` на
синтетическом env, без живых secrets и без запросов в GitHub или Cloudflare.

Environment `prod` — источник значений для этого deploy, не восстановимая
копия. Оригиналы остаются в зашифрованном хранилище оператора. Секреты не
читаются обратно из GitHub и повторно не вводятся.

## W2: проверка после будущего деплоя

Локальная реализация не подтверждает live запуск. До нового runtime применить
миграцию `20261029010000_system_heartbeats`; задать `INTERNAL_TICK_SECRET` в
Environment `prod` по [реестру окружения](ENVIRONMENT.md) и передать штатным
deploy-путём Worker → Container. Для ручного задания Worker имя команды:
`wrangler secret put INTERNAL_TICK_SECRET --env production`; значение не писать
в отчёты/логи. Деплой выполняется основателем позже, из `main`.

После деплоя разбудить Container обычным визитом и за две минуты проверить через
доверенное подключение к БД, что `system_heartbeats` со `name = 'tick'` обновляет
`at` каждые успешные тики. Успешный тик не пишет отдельный response-лог; отсутствие
ошибок в логах само по себе не доказывает работу. Проверить
`curl -i https://bid.place/api/internal/tick` → 404 (также POST); такой публичный
запрос не должен будить Container.

При пустом `TICK_CRON` Cron выключен; deploy явно снимает старое расписание.
Проверять пробуждение спящего Container по расписанию нужно только после явного
включения Cron настройкой и проверки его наличия в Cloudflare. Затем подтвердить
новый heartbeat после scheduled invocation и отсутствие ошибок задач. При пустом
расписании recovery после сна проверяется обычным визитом и последующим тиком;
ответа Cron через две минуты ожидать нельзя. Health UI/outbox добавляет W3.

## Архитектура

`bid.place` → Worker: `/api` и `/api/*` → один private Nest Container, остальные
запросы → Expo SPA Static Assets. Nest → Neon + private/public R2. Public медиа
идут напрямую через `media.bid.place`; JWT, role, ownership и moderation остаются
в Nest. Worker не подключается к БД. `PortfolioApi` DO — обязательный adapter
Cloudflare Containers, не новая очередь или business storage.

Basic Container: 0.25 vCPU / 1 GiB, `max_instances=1`, одно постоянное имя DO,
порт 3001, idle sleep 10 минут; Cron выключен при пустом `TICK_CRON`. Internet access нужен для
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

Полный список переменных со ★ обязательных, без значений —
[ENVIRONMENT.md](ENVIRONMENT.md); перед любым production deploy пройти его
целиком. Расписание тика — `TICK_CRON` (W2): пусто по умолчанию, Cron Trigger
не создаётся; `*/5 * * * *` при реальных аукционах. GitHub workflow берёт
`TICK_CRON` из variables Environment `prod`; локальный deploy — из окружения
оператора. `scripts/cloudflare/config.mjs` проверяет пять полей Cron, диапазоны,
списки, шаги и документированные имена/расширения Cloudflare. Неверная строка
останавливает deploy. То же расписание передаётся в `vars.TICK_CRON` и контейнер.
Записанный `wrangler.jsonc` не содержит расписания. Пустая настройка удаляет
шаблонные triggers; временный production config передаёт Wrangler `crons: []`,
чтобы снять и ранее включённое расписание. Простое отсутствие `triggers`
сохранило бы его ([правила удаления Cron](https://developers.cloudflare.com/workers/configuration/cron-triggers/#remove-a-cron-trigger)).

Worker вызывает private DO один раз: `POST /api/internal/tick` с заголовком
`X-Internal-Tick`. Внешний `/api/internal/*`, включая альтернативные кодировки,
отвечает 404 до обращения к контейнеру. Пути вне точного API namespace
(например, `/API/*`) остаются в Static Assets и не вызывают контейнер. При `RELEASE_HOLD=closed` Cron контейнер
не будит. `INTERNAL_TICK_SECRET` обязателен в контракте Worker и передаётся только
в контейнер; GitHub workflow проверяет его наличие и включает в secrets-file.
Оператор задаёт его интерактивно из каталога `deploy/cloudflare`:
`wrangler secret put INTERNAL_TICK_SECRET --env production`. Значение не
передаётся в командной строке и не попадает в браузер.

При старте Cron выключен. Включать `*/5 * * * *` при первых реальных аукционах:
при `sleepAfter = 10m` тик каждые пять минут почти не даёт контейнеру уснуть,
поэтому оплачивается почти постоянная работа контейнера. Расписание исполняется
по UTC; обновление Cron у Cloudflare распространяется с задержкой.
[Scheduled handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/)
использует `ctx.waitUntil` для выполнения тика.

Owner — `deploy/cloudflare/wrangler.jsonc`, allowlist Container —
`deploy/cloudflare/src/environment.ts`, server validation — `apps/api/src/core/config/env.ts`.
`.env.example` — schema-derived local template с пустыми secrets; не production env file.
Optional unset параметры закомментированы, иначе empty string может не пройти
server validation. `TELEGRAM_BOT_TOKEN` — secret сохранённого legacy scope,
не входит в portfolio runtime; `TEST_EMAIL_FILE` — только локальный transport,
в cloud Container не передаётся. Они не нужны для этого deployment.

Заполнить **non-secret vars** в `env.production.vars`: `S3_ENDPOINT`, `CLOUDFLARE_ZONE_ID`, `SMTP_FROM`,
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
| SESSION_SECRET | Независимый случайный secret, минимум 32 chars |
| OTP_HASH_SECRET | Отдельный случайный ключ HMAC для OTP, минимум 32 chars |
| INTERNAL_TICK_SECRET | Авторизация внутреннего тика; обязателен независимо от включения Cron |
| S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY | R2 Object Read & Write, только два buckets данного environment |
| SMTP_USERNAME / SMTP_PASSWORD | Cloudflare Email Service SMTP. Username — литерал `api_token`. Password — отдельный API token с Email Sending: Edit |
| CLOUDFLARE_CACHE_TOKEN | Zone → Cache Purge только для зоны `bid.place` |

Не использовать Global API Key или account-wide R2 admin token. Purge token
shared zone технически может purging production и staging: выдавать отдельные
tokens для диагностики/rotation, но ограничение конкретным host не обещается.
[Purge API permissions](https://developers.cloudflare.com/api/resources/cache/methods/purge/),
[R2 bucket-scoped credentials](https://developers.cloudflare.com/r2/api/tokens/).

Для каждого имени выполнить interactive command, например:
`pnpm exec wrangler secret put SESSION_SECRET --config deploy/cloudflare/wrangler.jsonc --env staging`.
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

`SMTP_FROM` — `noreply@bid.place`. Пустое значение по-прежнему валит preflight.
`SERVICE_RULES_TEXT` пуст, пока черновик не утверждён, и тоже валит preflight.

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

Перед каждым обычным deployment — backup и просмотр новых migrations, затем оператор
на trusted machine запускает `pnpm cloudflare:migrate production --confirm-production` с отдельно безопасно
переданным `DATABASE_URL` migration role. Для `20261008040000_add_user_slug`
этот прежний порядок не использовать. Механизм ниже локальный: production не
переключался, образ API не заменялся и контейнер production не останавливался.

Канал управления — переменная Worker `RELEASE_HOLD` и секрет Worker
`RELEASE_CONTROL`. Секрет не копируется в контейнер. Публичного вызова остановки
без этого секрета нет: неверный или пустой `Authorization: Bearer` даёт 404 и не
вызывает контейнер. `sleepAfter` и `max_instances` блокировкой не являются.

Порядок выпуска `20261008040000_add_user_slug`:

1. Создать `RELEASE_CONTROL` длиной не короче 32 символов в GitHub Environment
   `prod` и в операторском хранилище секретов. Значение не печатать и не
   записывать в vars контейнера. До этого production workflow не запускать.
2. Подготовительный запуск workflow `Production deploy` на
   `main`: `release_hold=closed`,
   `keep_container=true`, `confirm_migration` пустой. Wrangler получает
   `--containers-rollout none` и `--keep-vars`, проверка нового образа API
   пропускается. Прежний production-образ остаётся. После успеха `GET` и `POST`
   на `https://bid.place/api` и `https://bid.place/api/*` возвращают 503 и
   `Cache-Control: no-store` до кэша и контейнера. Повторный запрос и перезапуск
   Worker блокировку не снимают.
3. Остановить прежний контейнер одним запросом оператора, не из браузера
   посетителя: `POST https://bid.place/_release/stop` с заголовком
   `Authorization: Bearer` и значением `RELEASE_CONTROL`. Команда вызывает
   `stop('SIGTERM')` у `@cloudflare/containers` 0.3.7. Nest уже включает
   `enableShutdownHooks()`, Prisma отключается в `onModuleDestroy`. Успешный
   возврат `stop()` недостаточен. Повторять `GET https://bid.place/_release/state`
   с тем же заголовком, пока HTTP 200 и `status` равен `stopped` или
   `stopped_with_code`. HTTP 409 означает, что контейнер ещё не завершился.
   HTTP 404 означает, что секрет не принят. Эти адреса входят в
   `assets.run_worker_first`, поэтому SPA fallback их не перехватывает.
   Тело ответа и секрет не печатать.
4. Отдельный запуск workflow: `confirm_migration=migrate-production`,
   `release_hold=closed`, `keep_container=false`. Job сначала требует живой
   `GET /_release/state` с HTTP 200 и конечным статусом. Затем
   `pnpm cloudflare:migrate` отказывается, если другая сессия этой базы в
   состоянии `active`, `idle in transaction` или `idle in transaction (aborted)`.
   Обычный `idle` не блокирует: мёртвый процесс новую команду уже не начнёт, а
   незавершённая транзакция ещё видна как `idle in transaction` и миграцию
   останавливает. Транзакция, успевшая закоммититься во время SIGTERM, видна
   копированию slug. После копирования прежний процесс дописать строку не может.
   Затем deploy публикует новый образ с `RELEASE_HOLD=closed` и `RELEASE_ID`
   этого коммита. Доступ остаётся закрыт. Установленный Wrangler 4.147.0 сначала
   загружает Worker, и только потом отправляет образ контейнера и запускает его
   rollout. Если публикация контейнера срывается, команда завершается ошибкой,
   но новая версия Worker уже может быть живой. `RELEASE_ID` и любая переменная
   образа этого не доказывают.
5. Проверить никнеймы отдельным запуском: `release_hold=open`,
   `keep_container=false`, `confirm_migration` пустой. Перед открытием скрипт
   требует, чтобы `https://bid.place/api` всё ещё отвечал 503 `no-store`, а
   `RELEASE_ID` совпадал с этим коммитом. Затем читает `wrangler deployments status`,
   `wrangler containers images list`, `wrangler containers list` и
   `wrangler containers info` для `bidplace-production-portfolioapi-production`.
   Открытие разрешено только когда в реестре есть тег этого Worker version,
   приложение контейнера изменено не раньше этого deployment, rollout не активен,
   состояние `ready` или `active`, а публичный API ещё закрыт. На прямом Neon
   URL нужна записанная миграция `20261008040000_add_user_slug` и ноль строк,
   где `users.slug` отличается от `seller_profiles.slug`. Только после этого
   Worker получает `RELEASE_HOLD=open` без замены образа. Ошибка любого шага не
   заменяет текущий Worker, поэтому закрытая блокировка сохраняется.
6. После открытого доступа следующий обычный выпуск образа использует
   `release_hold=keep`. Он сохраняет текущее значение `RELEASE_HOLD` через
   `--keep-vars`. Пустой `release_hold` workflow отклоняет.

`seller_profiles.slug` этой миграцией не удаляется. Удаление — отдельная
миграция после равенства никнеймов и после того, как ни один живой запрос не
читает старую колонку.

Script не загружает repository dotenv;
schema/migrations копируются во временный каталог. Не брать runtime Worker
credentials в build. Database migrations не часть container CMD/deploy script.
Neon поддерживает migrations через pooler, но отдельная direct connection/role
удобна для контроля schema privileges:
[Neon Prisma migration support](https://neon.com/blog/better-postgres-with-prisma-experience).

## Build и CI

Node 22, pnpm 11.7.0, Docker daemon; root monorepo — build context.

```sh
pnpm install --frozen-lockfile
pnpm cloudflare:check
pnpm build:web
pnpm cloudflare:image:verify
# Production deploy: ручной workflow из раздела «Текущий production path».
```

Deploy script проверяет vars, Worker, строит SPA для нужного origin, проверяет
production-like amd64 image, затем вызывает Wrangler. Smoke создаёт и удаляет
только собственные disposable DB/API/network; runtime placeholders используются
исключительно локальным smoke и не загружаются в Cloudflare. Docker/Prisma build
уже внутри Dockerfile; не требуется отдельный generate/build перед image build.
[Static Assets SPA](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/),
[Image management](https://developers.cloudflare.com/containers/guides/image-management/).

GitHub Verify выполняет существующий `pnpm verify`, Worker gate, production web и
amd64 image smoke. Production branch остаётся `main`:
PR → required Verify / protected branch → deploy. Branch protection требуется
включить вручную; конфиг CI не включает её автоматически.

Workers Builds поддерживает root monorepo/pnpm и Dockerfile image build. Native
integration — предпочтительный вариант **после** required CI gate. Root directory
`/`, Node version 22.20.0, pnpm 11.7.0, production branch только `main`.
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

Текущий deploy — production workflow выше, GitHub Environment `prod`.
Staging branch, staging Worker и staging secrets в этот список не входят.
Оставшиеся staging buckets и DNS не удалять этой волной. Секреты уже лежат в
`prod`; переносить их в Repository secrets не нужно. GitHub не является
резервной копией.

| Что проверить | Куда | Как проверить | Статус |
|---|---|---|---|
| Workflow на `main` и на `main`, без смены default branch | `.github/workflows/production-deploy.yml`, `environment: prod` | Actions показывает Production deploy. Run на release branch. Другой ref job отклоняет | Needs verification. Файл подготовлен. Push и run не выполнялись |
| `SERVICE_RULES_OWNER`, `SERVICE_RULES_CONTACT`, `SERVICE_RULES_TEXT`, `CLOUDFLARE_ACCOUNT_ID` | Variables Environment `prod`. Для первого запуска owner `bidplace`, contact `work.evles@gmail.com`, текст правил утверждён временно | Пустые значения останавливают job до Wrangler. Репозиторий не хранит production owner | Operator entered. Значения этой волной не читались |
| Secrets Environment `prod`: `NEON_DIRECT_URL` для migration, pooled `DATABASE_URL` для runtime, остальные runtime secrets workflow | Settings → Environments → `prod`. Оригиналы — в зашифрованном хранилище оператора | Имена совпадают с workflow. Значения не читать и не вводить повторно | Operator reported entered. Значения этой волной не читались |

Live acceptance после реального production deploy. Локальные тесты её не
закрывают:

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

Google/Telegram settings and the coordinated session cutover are described in
[Web auth rollout](WEB-AUTH-ROLLOUT.md).

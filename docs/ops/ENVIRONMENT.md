# Переменные окружения bidplace

Последнее обновление: 2026-10-29. Владелец списка — этот файл; схема сервера —
`apps/api/src/core/config/env.ts`, контракт деплоя —
`deploy/cloudflare/src/environment.ts`, конфиг Cloudflare —
`deploy/cloudflare/wrangler.jsonc`, сборка веба — `scripts/cloudflare/build-web.mjs`.

**Значений здесь нет и быть не должно.** Только имя, зачем, где задаётся и что
сломается. Секреты не вставлять ни в этот файл, ни в чаты, ни в отчёты.

**★** — без переменной прод не запустится или не выполнит обещание продукта
(вход, письма, фото, аукционы, поддержка, аналитика). Перед любым реальным
прод-деплоем агент проходит все ★ и первым пунктом пишет незакрытые
([AGENT-RULES.md](../launch/AGENT-RULES.md) §8).

## Где что задаётся

| Место | Что там | Как задать |
| --- | --- | --- |
| Секрет Worker | Пароли, ключи, строки подключения | `wrangler secret put <ИМЯ> --env production` или файл секретов скрипта деплоя |
| `vars` в `wrangler.jsonc` | Публичные настройки (адреса, лимиты, флаги) | Правка файла в репозитории, `env.production.vars` |
| Окружение машины деплоя | Токены деплоя и тексты, которые подставляются при выкладке | Переменные терминала при `scripts/cloudflare/deploy.mjs` |
| Сборка веба | `EXPO_PUBLIC_*` — попадают в браузер, поэтому только публичные | Выводятся `build-web.mjs` из `vars`; руками не задаются |

Контейнер API получает только `requiredSecrets` + `containerVariables` +
заданные `optionalContainerSettings` (`deploy/cloudflare/src/environment.ts`).
Новая переменная, которую читает API, должна попасть в этот контракт, иначе в
контейнере её не будет.

## Состояние ★ на 2026-10-29 (по `wrangler.jsonc`)

| Переменная | Состояние |
| --- | --- |
| `SERVICE_RULES_OWNER`, `SERVICE_RULES_CONTACT`, `SERVICE_RULES_TEXT` | В production пусто в файле; подставляются скриптом деплоя из окружения машины — без них деплой падает |
| `TURNSTILE_SITE_KEY` | Пусто в файле; передаётся при сборке. После W2b — ключ в режиме Invisible |
| `ANALYTICS_WEB_ENABLED`, `EXPO_PUBLIC_ANALYTICS_WEB_ENABLED` | Нет в `vars` → аналитика выключена. Решение основателя: включить (`true`) к запуску |
| `INTERNAL_TICK_SECRET`, `TICK_CRON` | Появятся в W2 |
| `SUPPORT_TELEGRAM_URL`, `SUPPORT_EMAIL` | Появятся в W3/W4 |

## Секреты Worker (передаются в контейнер)

| Имя | ★ | Зачем | Что сломается без неё |
| --- | --- | --- | --- |
| `DATABASE_URL` | ★ | Подключение к Neon через pooler (`-pooler` в хосте — проверяет деплой) | API не стартует |
| `SESSION_SECRET` | ★ | Подпись сессий; в проде не короче 32 символов | API не стартует; смена — выход всех пользователей |
| `OTP_HASH_SECRET` | ★ | Хеш одноразовых кодов, не короче 32 | API не стартует; смена — недействительны выданные коды |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | ★ | Доступ к R2 (фото) | Загрузка и показ фото |
| `SMTP_USERNAME`, `SMTP_PASSWORD` | ★ | Отправка писем через Cloudflare Email | Коды входа, письма сделок |
| `CLOUDFLARE_CACHE_TOKEN` | ★ | Очистка кэша CDN при скрытии/удалении фото | Скрытое фото ещё отдаётся по старой ссылке |
| `TURNSTILE_SECRET_KEY` | ★ | Проверка Turnstile на сервере | Регистрация не проходит |
| `INTERNAL_TICK_SECRET` | ★ | Подпись внутреннего вызова тика (W2) | Тик по Cron отклоняется — аукционы не закрываются |

## Секрет только Worker

| Имя | ★ | Зачем | Что сломается |
| --- | --- | --- | --- |
| `RELEASE_CONTROL` | ★ | Ключ управления выпуском (`/_release/*`), не короче 32; в контейнер не попадает | Деплой не может открыть доступ |

## Переменные контейнера (`vars`)

| Имя | ★ | Зачем | По умолчанию | Что сломается |
| --- | --- | --- | --- | --- |
| `NODE_ENV`, `APP_ENV` | ★ | Профиль; в облаке `production` + `production`/`staging` | — | Деплой отказывает |
| `API_PORT` | | Порт API в контейнере | 3001 | — |
| `API_URL`, `CORS_ORIGIN`, `PASSWORD_RESET_URL_BASE` | ★ | Адрес сайта; три значения должны совпадать с доменом маршрута | — | Деплой отказывает; ссылки в письмах |
| `TRUST_PROXY` | ★ | Брать IP клиента из заголовков Cloudflare | false | Лимиты и антифрод считают всех одним IP |
| `RATE_LIMIT_MAX_BUCKETS`, `RATE_LIMIT_CLEANUP_INTERVAL_MS` | | Лимиты в памяти; удаляются в W2b (лимиты в базе) | 10000 / 60000 | — |
| `LOT_IMAGE_MAX_FILES`, `LOT_IMAGE_MAX_FILE_BYTES`, `LOT_IMAGE_MAX_TOTAL_BYTES` | | Лимиты загрузки фото | 8 / 5 МБ / 40 МБ | — |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_AUTH_MODE`, `SMTP_FROM` | ★ | Почтовый сервер и адрес отправителя | — | Письма не уходят; API не стартует в проде |
| `SERVICE_RULES_OWNER`, `SERVICE_RULES_CONTACT`, `SERVICE_RULES_TEXT` | ★ | Владелец, контакт и текст правил сервиса (`core/rules.ts`) | — | Деплой и API не стартуют |
| `TURNSTILE_HOSTNAME` | ★ | Домен, для которого принимается токен Turnstile | — | Регистрация не проходит |
| `TEST_EMAIL_BYPASS` | ★ | Должно быть `false` в облаке | false | Деплой отказывает при `true` |
| `AUTH_MAIL_DAILY_BUDGET`, `AUTH_MAIL_MONTHLY_BUDGET` | | Потолок писем входа | 200 / 3000 | При превышении коды не отправляются |
| `ANALYTICS_INGEST_ENABLED` | | Приём событий аналитики сервером | true вне тестов | — |
| `MEDIA_STORAGE_PROVIDER` | ★ | `s3` в проде | postgres | API не стартует |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_PUBLIC_BUCKET` | ★ | R2: приватный и публичный бакеты (разные) | — | Фото |
| `MEDIA_PUBLIC_BASE_URL` | ★ | Свой HTTPS-домен медиа, не `*.r2.dev`, не домен сайта | — | Фото не показываются |
| `CLOUDFLARE_ZONE_ID` | ★ | Зона для очистки кэша | — | Очистка кэша |

## Необязательные настройки контейнера

| Имя | ★ | Зачем | По умолчанию | Что сломается |
| --- | --- | --- | --- | --- |
| `ANALYTICS_WEB_ENABLED` | ★ | Сервер принимает браузерную аналитику и атрибуцию. Решение основателя: `true` с запуска | false | Нет данных воронки |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | | Вход через Google; все три или ни одной | — | Кнопки нет |
| `TELEGRAM_CLIENT_ID`, `TELEGRAM_CLIENT_SECRET`, `TELEGRAM_REDIRECT_URI` | | Вход через Telegram; все три или ни одной | — | Кнопки нет |

## Сборка веба (`EXPO_PUBLIC_*`, видны в браузере)

| Имя | ★ | Откуда | Что сломается |
| --- | --- | --- | --- |
| `TURNSTILE_SITE_KEY` → `EXPO_PUBLIC_TURNSTILE_SITE_KEY` | ★ | Окружение машины деплоя или `vars`; сборка падает без него | Регистрация |
| `EXPO_PUBLIC_ANALYTICS_WEB_ENABLED` | ★ | `vars`; `true` только если там ровно `true` | Браузер не шлёт аналитику, даже если сервер принимает |
| `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_APP_ENV`, `EXPO_PUBLIC_ANALYTICS_ENABLED` | | Выводятся из `API_URL`, цели и `ANALYTICS_INGEST_ENABLED` | — |

Аналитика включается **двумя** флагами: `ANALYTICS_WEB_ENABLED=true` (сервер) и
`EXPO_PUBLIC_ANALYTICS_WEB_ENABLED=true` (сборка).

## Машина деплоя (не попадают в Worker)

| Имя | ★ | Зачем |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | ★ | Выкладка через Wrangler |
| `NEON_DIRECT_URL` | ★ | Прямое подключение к Neon для шага открытия доступа (не логируется) |
| `DATABASE_URL_UNPOOLED` | | Миграции без pooler, если используется |
| `WORKERS_CI_BRANCH` | | Имя ветки в CI; деплой прода только с ветки выпуска |
| `EXPECTED_RELEASE_ID`, `RELEASE_HOLD`, `RELEASE_ID`, `RELEASE_IMAGE` | | Ставит сам скрипт деплоя; руками не задавать |

## Появятся волнами запуска

| Имя | ★ | Волна | Где | Зачем | Что сломается |
| --- | --- | --- | --- | --- | --- |
| `TICK_CRON` | ★ | W2 | Окружение машины деплоя → `triggers` в конфиге Worker (`scripts/cloudflare/config.mjs`) и необязательная настройка контейнера (для «Здоровья») | Расписание тика. **Пусто (по умолчанию)** — Cron нет, тик идёт только таймером внутри контейнера каждые 30 с, пока контейнер не спит. При первых реальных аукционах — `*/5 * * * *`. Неверная строка — ошибка деплоя | Пусто + спящий контейнер → аукцион закроется только при следующем визите; админка «Здоровье» предупреждает |
| `INTERNAL_TICK_SECRET` | ★ | W2 | Секрет Worker → контейнер | См. выше | Тик по Cron отклоняется |
| `SUPPORT_TELEGRAM_URL` | ★ | W3/W4 | `vars` → контейнер (письма) и сборка (`EXPO_PUBLIC_…`) | Ссылка «Поддержка» в подвале, настройках, заказе, письмах ([MONITORING-AND-SUPPORT.md](../launch/MONITORING-AND-SUPPORT.md)) | Пользователю некуда написать |
| `SUPPORT_EMAIL` | ★ | W3/W4 | Так же | Почта для обращений и ответов на запросы о данных | То же |

## Только локально и в тестах

`BIDPLACE_ENV_FILE`, `TEST_EMAIL_FILE`, `OIDC_TEST_ISSUER`, `TURNSTILE_VERIFIER`
(`test` запрещён в проде), `CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV` (скрипт
ставит `false`). `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBAPP_URL` объявлены в схеме,
но кодом не читаются — кандидаты на удаление.

# Cloudflare deployment verification

Дата: 2026-10-05. Статус: LOCAL_CHECKS_COMPLETE / NOT_READY_FOR_STAGING.
Ветка: `feature/cloudflare-deployment`.
Исходный remote release: `507bb5b422878a38099b70ce7bfd9a59e9c16189`.
Production не деплоился; Cloudflare/Neon resources и secrets не читались.
Code/test commit: `5e2c927799d3a3242c1a60cdb725e19cf5d7cf41`.
Runtime safety commit: `161f3d8`; FinOps audit commit: `6a1922a`.
Следующий commit меняет только этот verification record; production code тот же.

## 2026-10-05 — Upload safety follow-up

Ветка `fix/portfolio-upload-safety` создана от локального deployment HEAD
`bf6eb9831f6b81cb25971c2c5ec425994b2588dc`. Remote
`feature/cloudflare-deployment` отсутствует; другая ветка не подставлялась.
Release `507bb5b422878a38099b70ce7bfd9a59e9c16189` и deployment code
`5e2c927799d3a3242c1a60cdb725e19cf5d7cf41` не изменялись. Push и deploy нет.
Cloudflare account и секреты не читались и не менялись.

F13 и F14 закрыты локальным durable fix. F11 и D08 не закрыты: purge по-прежнему
отправляет exact base URL, а live acceptance base URL, `?media_retry=1` и
произвольного query после hide/revoke не выполнялась. F01–F03 не менялись.
Статус пакета остаётся **NOT READY FOR STAGING**.

Node 22.20.0, pnpm 11.7.0. Итоговые команды ниже — exit 0.

| Проверка | Результат |
|---|---|
| `pnpm verify` | typecheck 13/13, lint 2/2, config 8, API unit 57 files / 382, contracts 32, api-client 28, database 1, mobile 111 files / 581, ops 31 pass / 0 fail, integration 28 files / 126, build 8/8 |
| `pnpm cloudflare:check` | Worker typecheck/lint, 26 unit + 7 script tests |
| `pnpm cloudflare:build:staging` | SPA export verified for `https://staging.bid.place` |
| `pnpm build:web` | SPA export verified for `https://bid.place` |
| `pnpm cloudflare:image:verify` | linux/amd64: native modules, migrated disposable DB, HTTP/auth boundary, SIGTERM passed |
| media Playwright `--workers=1 --retries=0` | 2 passed, Chromium and WebKit. Первый старт остановился до тестов: Prisma заблокировал `migrate reset` для агента. Повтор использовал только fenced local `bidplace_e2e` |
| `git diff --check` | PASS; no `.pen` changes |

Рекурсивное исключение dotenv, frontend origin assertions, SIGTERM hooks,
proxy-header sanitization, public JSON cache, private/public R2 и один Container
этим follow-up не переписывались. Историческая таблица ниже остаётся записью
deployment pass и не переписывается этими результатами.

## 2026-10-05 — Synchronous publication follow-up

Ветка `fix/portfolio-media-execution` создана от
`2a3a11024a101e91f47553ff7ecb76b4f9f1367a`. Push и deploy нет. Секреты и
аккаунты не читались и не менялись. Статус пакета остаётся
**NOT READY FOR STAGING**: live cache/purge (F11, D08) не принимались.

D10 больше не крутит пустой 5s loop. Executor REVOKE/CLEANUP сохранён.
F01 не закрыт, потому что мёртвый процесс без пробуждения по-прежнему не
гарантирует отзыв за 5 минут из DEC-097.

Node 22.20.0, pnpm 11.7.0.

| Проверка | Результат |
|---|---|
| `pnpm verify` | exit 0: typecheck 13/13, config 8, API unit 383, contracts 32, api-client 28, database 1, mobile 582, ops 31/0, integration 128, build 8/8 |
| `pnpm cloudflare:check` | exit 0: 26 unit + 7 script |
| `pnpm cloudflare:build:staging` | SPA export verified for `https://staging.bid.place` |
| `pnpm build:web` | SPA export verified for `https://bid.place` |
| `pnpm cloudflare:image:verify` | linux/amd64: native modules, migrated disposable DB, HTTP/auth boundary, SIGTERM passed |
| media Playwright `--workers=1 --retries=0` | Идентичный повтор: 2 passed, 54.9s. Первый WebKit остановился на ожидании `POST /api/products` до публикации |
| full Chromium/WebKit `--workers=1 --retries=0` | 210 passed / 2 failed, 0 skipped, 0 retries, 11.8m. Оба отказа — Home Opening visual, post-MVP |
| `git diff --check` | PASS; no `.pen` changes |

## 2026-10-05 — Recovery trigger follow-up

Code `659a6cc648aef7269fedfc96ce8a56a901d22bf8` на
`fix/portfolio-media-execution`. Push и deploy нет. Секреты и аккаунты не
читались. Пакет остаётся **NOT READY FOR STAGING**: F11/D08 и пробуждение
остановленного Container не закрыты. Пустой 5s poll не возвращён.

Node 22.20.0, pnpm 11.7.0.

| Проверка | Результат |
|---|---|
| `pnpm verify` | exit 0: typecheck 13/13, config 8, API unit 387, contracts 32, api-client 28, database 1, mobile 582, ops 31/0, integration 132, build 8/8 |
| `pnpm cloudflare:check` | exit 0: 26 unit + 7 script |
| `pnpm cloudflare:build:staging` | SPA export verified for `https://staging.bid.place` |
| `pnpm build:web` | SPA export verified for `https://bid.place` |
| `pnpm cloudflare:image:verify` | linux/amd64: native modules, migrated disposable DB, HTTP/auth boundary, SIGTERM passed |
| `playwright test work-media-lifecycle.spec.ts --workers=1 --retries=0` | No tests found. Maintained `playwright.config.ts` ignores that file |
| media config `--workers=1 --retries=0` | 2 passed, 1.1m, Chromium and WebKit |
| full Chromium/WebKit `--workers=1 --retries=0` | 210 passed / 2 failed, 0 skipped, 0 retries, 12.8m. Оба отказа — Home Opening, mismatch около 0.122 при пороге 0.12, post-MVP |
| `git diff --check` | PASS; no `.pen` changes |

## 2026-10-05 — Non-blocking recovery follow-up

Продолжение `fix/portfolio-media-execution`, code
`1d6ab422d3896a1f0a64d9d0d32ea60bd7221c9c` от
`59b5de6fa999502a645462107d132d6a1d92993e`. Новая ветка не создавалась.
Release branch не менялся. Push и deploy нет. Секреты и аккаунты не читались.
Пакет остаётся **NOT READY FOR STAGING**: F01 и F11/D08 открыты. Локальные
тесты не подтверждают спящий Container и live CDN/purge. Golden, thresholds и
timeouts не менялись. Два Home Opening visual failures остаются post-MVP.

Node 22.20.0, pnpm 11.7.0.

| Проверка | Результат |
|---|---|
| `pnpm verify` | exit 0: typecheck 13/13, lint 2/2, config 8, API unit 389, contracts 32, api-client 28, database 1, mobile 582, ops 31/0, integration 132, build 8/8 |
| `pnpm cloudflare:check` | exit 0: 26 unit + 7 script |
| `pnpm cloudflare:image:verify` | linux/amd64: native modules, migrated disposable DB, HTTP/auth boundary, SIGTERM passed |
| media config `--workers=1 --retries=0` | 2 passed, 1.0m, Chromium and WebKit |
| full Chromium/WebKit `--workers=1 --retries=0` | 210 passed / 2 failed, 0 skipped, 0 retries, 12.0m. Home Opening: Chromium 0.12231040564373898, WebKit 0.12205687830687831, threshold 0.12 |

## 2026-10-05 — Release compatibility follow-up

Проверенное дерево `f10021d2fb362ce3f81ffa9c77208a5efc069ea9`, code
`1d6ab422d3896a1f0a64d9d0d32ea60bd7221c9c`. Remote release остаётся
`507bb5b422878a38099b70ce7bfd9a59e9c16189` и является предком. Merge не нужен.
Release branch не менялся. Push и deploy нет. Секреты не читались.

Код можно перенести в release fast-forward. Публичный запуск по-прежнему
**NOT READY FOR STAGING**. F01 и F11/D08 локальными тестами не закрываются.
Реальный staging нужен для Worker deploy, R2, live purge base URL,
`?media_retry=1` и произвольного query, и для отзыва при реально спящем
Container.

Node 22.20.0, pnpm 11.7.0. Этот проход не повторял image verify и SPA export.

| Проверка | Результат |
|---|---|
| `pnpm verify` | exit 0: typecheck 13/13, lint 2/2, config 8, API unit 389, contracts 32, api-client 28, database 1, mobile 582, ops 31/0, integration 132, build 8/8 |
| `pnpm cloudflare:check` | exit 0: 26 unit + 7 script |
| full Chromium/WebKit `--workers=1 --retries=0` | первый прогон 209 passed / 3 failed, 12.3m. Home Opening прежние. Дополнительно WebKit compact handoff, 1500ms; изолированный повтор этого теста прошёл |
| media config `--workers=1 --retries=0` | первый прогон 1 failed / 1 passed; идентичный повтор 2 passed, 1.0m |

## 2026-10-05 — Delete-during-save follow-up

Первый Chromium media отказ классифицирован как production defect и исправлен
в `2c9dc89eb185e478860da2f9178bc7d0421a3b00`. WebKit compact header остаётся
post-MVP. После исправления dedicated media gate: 2 passed, 1.0m, workers 1,
retries 0, disposable `bidplace_e2e`. Полная запись:
`docs/audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md`. Статус по-прежнему
**NOT READY FOR STAGING**. F01 и F11/D08 локальными тестами не закрываются.
Image verify в этом проходе не повторялся.

## 2026-10-05 — Local MVP completion

Проверенный runtime `a8d0acb50be727ceda257289deb3c9d042beed66`. Код готов к
fast-forward в `feature/portfolio-mvp-release`. Staging не готов. Публичный
запуск не готов. F01, F11 и D08 открыты. D10 в реестре выше описывает прежний
постоянный пятисекундный цикл; текущий executor снимает timer после успешного
пустого чтения. DEC-097 не отменён.

Полный Chromium/WebKit: 210 passed / 2 failed, 12.2m, только Home Opening
visual. Dedicated media на том же коде: два последовательных 2/2.
`pnpm cloudflare:check`, staging export, production export и image verify —
exit 0. Push и deploy нет.

## Критерии и решение

Проверенный SPA export, linux/amd64 Nest image, тонкий Worker, изолированные
staging/production contracts, repeatable deploy и smoke runbook. Native Nest в
существующем Dockerfile + Worker routing — **durable fix**. Перенос Nest в
Worker — большой ненужный refactor. Изменение media journal/retry — отдельное
решение: отключить timer отдельно было бы **hack** с нарушением публикации.

## Постоянный реестр

| ID | Проблема / severity | Где найдена | MVP | Решение / причина |
|---|---|---|---|---|
| D01 | Нет Cloudflare deployment boundary / High | release source, no Wrangler/Worker | Да | Сейчас: Worker + Static Assets + один private Container, без business logic. |
| D02 | Nest не вызывает shutdown hooks по SIGTERM / High | `apps/api/src/main.ts` | Да | Сейчас: enableShutdownHooks; image smoke проверяет exit 0 и освобождение процесса. |
| D03 | `.env.example` contract требует сверки; optional empty strings нарушают validation / Medium | server schema vs deployment | Да | Исправлено: шаблон создан заново из schema без чтения исходных dotenv-файлов. Optional unset закомментированы; generated string проверена в памяти с synthetic required local settings. |
| D04 | Preview не включает новую container image / High | official Deploy Containers docs | Да | Сейчас: отдельный staging full deploy, отключены production preview/workers.dev. |
| D05 | Bare proxy headers позволяют обойти per-IP limit / High | Worker → Nest TRUST_PROXY=true | Да | Сейчас: удалить входящие forwarding headers, поставить доверенный CF-Connecting-IP. HTTP cookies/body сохраняются. |
| D06 | Vary: Origin мешает простому cache allowlist / Medium | Nest CORS response | Да | Сейчас: только same-origin/без Origin public GET; разрешён один Vary: Origin; другие Vary не кэшируются. |
| D07 | SMTP, rules и cloud IDs отсутствуют / High | production server schema, cloud vars | Да | Manual до staging: fail closed, не фиктивные production значения. |
| D08 | Live R2 cache keys/purge неизвестны / High | FinOps F11 | Да | Manual cache rule ignore all query только на public media host + revoke variant smoke. Код media не расширяется. |
| D09 | Runtime secrets location / Medium | последний ответ основателя vs pasted task | Да | Открытый выбор: рекомендуем Cloudflare; GitHub только CI/deploy. Подготовленный contract использует Worker Secrets, внешних writes нет. |
| D10 | 5s media SQL loop / High при непрерывной работе | FinOps F01 | Да | Сохранено подтверждённое поведение; optimization отдельным решением. Не заявлять, что polling устранён. |
| D11 | Workers Builds Docker run smoke не подтверждён / Medium | docs подтверждают Dockerfile build, не весь local smoke | Deployment | CI image gate — GitHub Verify; native Builds full deploy после gate. Нельзя считать successful Worker version upload full preview. |
| D12 | Web bundle 14 MB / Low | staging Expo export | Не блокирует | Post-MVP: измерить transfer/compression; файл ниже Static Assets 25 MiB. Без UX/code-splitting refactor в этой задаче. |
| D13 | Nested dotenv попадает в Docker image / High | packages/database/.env filename и packaged @bidplace/database/.env в local image | Да | Исправлено: recursive .dockerignore exclusion и image filename gate PASS. Содержимое не читалось, credential presence неизвестна; ни один image не pushed. Два старых task images удалены; глобальный BuildKit cache не очищался. |
| D14 | Production export сохраняет staging API origin / High | последовательный Expo export и bundle origin assertion | Да | Исправлено: --clear на export и assertion целевого origin; staging и production exports PASS. Реальный stale Metro artifact, test не ослаблен. |

## Проверенный код и границы

- `deploy/cloudflare/src/index.ts`: `PortfolioApi`, порт 3001, startup port probe
  `/api/health`, sleep 10m, internet access для Neon/SMTP/R2. Один basic instance.
- `src/router.ts`: selective API routing; JWT/permissions/DB остаются в Nest.
  Public JSON cache 30/60s, categories 1800s; полный query входит в key.
  Credentials/Range/unsafe responses не попадают в shared cache.
- `src/environment.ts` и Wrangler: explicit vars/required secrets, разные domains
  и bucket pairs, production bypass выключен. Необходимые non-secret cloud vars
  намеренно пусты: deploy preflight требует заполнить их до Wrangler deploy.
- `scripts/cloudflare`: target-specific SPA export с cache clear, native image
  gate, release-only production deploy, отдельная operator Neon migration.
- Existing `products.mapper.ts` заменяет public image URL через `publicVariant`
  только для READY public derivatives; `WorkGallery.tsx` использует этот URL для
  PREVIEW и `full.url` только при открытом viewer. Media paths/metadata/cache
  headers не переписаны. SOURCE/private выдачу не переводили в public bucket.
- Установлены exact Wrangler 4.147.0 / Containers 0.3.7 / workers-types
  5.20261004.1. Lockfile также обновил build-tool esbuild peer resolution
  0.27.7 → 0.28.1; API/mobile graphs проверены с этим lockfile.

## Результаты локальных проверок

Node 22.20.0, pnpm 11.7.0. Все итоговые команды ниже — exit 0.

| Проверка | Результат | Evidence в `/private/tmp/` |
|---|---|---|
| `pnpm cloudflare:check` | Worker/scripts lint без autofix, Worker typecheck; 26 unit + 7 script tests | `bidplace-cloudflare-edge-checks.log` |
| `turbo run typecheck lint test build --filter=@bidplace/api...` | 14/14 tasks; API 372, contracts 32, config 8, database 1 tests | `bidplace-cloudflare-api-checks.log` |
| `turbo run typecheck lint test --filter=@bidplace/mobile...` | 9/9 tasks; mobile 111 files / 581 tests | `bidplace-cloudflare-mobile-checks.log` |
| `pnpm test:ops` | 31 passed | `bidplace-cloudflare-ops-checks.log` |
| `pnpm --filter @bidplace/mobile test:e2e-fence` | PASS | verification terminal output |
| `pnpm cloudflare:build:staging` | SPA export, target `https://staging.bid.place`, synthetic secret canary absent | `bidplace-cloudflare-web-staging.log` |
| `pnpm build:web` | SPA export, target `https://bid.place`, staging origin/canary absent | `bidplace-cloudflare-web-production.log` |
| Wrangler deploy `--dry-run` staging / production | Schema, binding/migration, assets and root Docker build context accepted; no upload | `bidplace-cloudflare-wrangler-staging.log`, `bidplace-cloudflare-wrangler-production.log` |
| Local Wrangler Static Assets HTTP | `/` и Work/Author deep links 200 HTML | `bidplace-cloudflare-assets-smoke.log` |
| `pnpm cloudflare:image:verify` | Final linux/amd64 build; filename-only dotenv gate; Sharp WebP, Argon2, Prisma; all migrations; HTTP/auth boundary; SIGTERM exit 0 | `bidplace-cloudflare-image-final.log` |
| `git diff --check` | PASS; no `.pen` changes | verification terminal output |

Image HTTP smoke: `/api/health` и `/api/health/ready` 200, categories 200,
`/api/auth/me` 401, unknown API 404. CPU/RAM limits: 0.25 / 1 GiB. Это собственная
disposable PostgreSQL DB, без live Neon/R2/SMTP credentials; созданные containers
и network удалены. Runtime dotenv gate не читает содержимое найденных файлов.

Первый API graph attempt упал из-за sandbox EPERM Prisma cache; повтор с
разрешённым доступом прошёл. Первый production export выявил D14, исходная
проверка сохранена. Это не отменяет итоговые успешные прогоны после исправления.

## NOT RUN / остающиеся blockers

1. **Cloud resources/configuration**: DNS delegation, Worker/Container provisioning,
   четыре R2 buckets и custom domains, cache/purge rule, secrets, SMTP/rules vars.
   Ни один ресурс не создан и ни один настоящий secret не проверен этой задачей.
2. **Neon**: отдельные staging DB/role и runtime/migration credentials, backup,
   reviewed migration deploy на реальной БД. Local migrations не доказывают Neon readiness.
3. **Cloud acceptance**: Worker → Container cold start, session cookies/OTP/reset,
   весь portfolio lifecycle через настоящие R2/CDN, revoke query variants,
   private/bypass checks, фактическое sleep/Neon поведение.
4. **CI activation**: branch protection + выбранный deploy integration. Workers
   Builds Dockerfile build подтверждён; запуск полного Docker run/network gate
   в Builds пока не проверен. GitHub gate подготовлен, удалённый CI не запускался.
5. **Открытые решения**: runtime secrets location; optimization существующего
   media SQL executor. Подготовлен вариант Cloudflare runtime secrets, credentials
   в GitHub не добавлялись. Current retry сохранён; no-useless-polling остаётся Partial.

Полный `pnpm verify`, API integration suite и Chromium/WebKit portfolio suite
заново в этом deployment pass не запускались. Это не integration regression
итогового release HEAD; source release baseline описан в
[MVP release audit](12-PORTFOLIO-MVP-RELEASE-AUDIT.md).

Локально пакет сборки и проверок подготовлен. **NOT READY FOR STAGING** до
resource/vars/secrets setup и live smoke; **не production release acceptance**.
Нет push, PR, release integration или реального deployment.
Практические manual шаги и официальные источники:
[Cloudflare deployment runbook](../../ops/CLOUDFLARE-DEPLOYMENT.md).

Изменений canonical Pen, golden, visual thresholds, auth/media бизнес-правил нет.

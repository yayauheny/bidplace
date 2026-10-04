# Публичный запуск: авторизация, R2 и CDN

Дата: 2026-10-04. Статус: **Partial — функциональные локальные проверки прошли; global format, deployment и внешний smoke открыты**.

Подтверждённый scope: portfolio-only MVP с регистрацией, авторскими профилями,
редактированием и публикацией работ. R2 и прямая CDN-раздача обязательны.
Домен `bid.place`; frontend/backend в контейнерном runtime, БД — Neon.
Hosting не выбран (Render — кандидат); R2 настроен на уровне account, buckets
ещё не созданы. Google после запуска. Собственный SMTP/Postfix исключён;
существующему verification/reset flow нужен минимальный внешний SMTP.
Все принятые ответы и фазы реализации: [второй проход](2026-10-04-R2-MEDIA-IMPLEMENTATION-PLAN.md).

Владельцы требований: [MVP RFC §16](../product/05-MVP-RFC.md#16-release-gates),
[архитектура](../product/10-CODE-ARCHITECTURE.md),
[статус кода](../product/11-PROJECT-STATUS.md),
[release runbook](../ops/00-RELEASE-AND-BACKUP.md).

## Что проверено и исправлено

| Область                         | Результат                                                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Регистрация без телефона        | Исправлено: пустое необязательное поле нормализуется в `null`; прежняя схема блокировала отправку формы                                              |
| Переход после регистрации/входа | Исправлено: переход ждёт подтверждённое состояние `AuthProvider`; прежний переход мог отправить уже зарегистрированного пользователя обратно в Login |
| Email verification              | Реальная форма: отправка локальным test transport, ошибка короткого кода, подтверждение, переход в Profile                                           |
| Login/session/logout            | Неверный пароль, вход через форму, reload с сохранением сессии, выход и последующий `/auth/me` → 401                                                 |
| Password recovery               | Forgot/reset через формы, новый пароль принимается, старый пароль и повторно использованная ссылка отвергаются                                       |
| Одобрение автора                | Исправлено: `discipline` проверяется сервером до APPROVED; отсутствие → 409 без изменения профиля, revision и audit                                  |
| Save and exit в browser test    | Тест ждёт фактический выход перед `page.goto`; прежняя навигация могла отменить PATCH в WebKit                                                       |
| Backfill медиа                  | Поддержаны все пять владельцев: `ProductImage`, `SellerProfile`, `ProductCreationStep`, `SellerProfileRevision`, `SellerProfileRevisionAchievement`  |

Это проверка локального поведения. Доставка реальных писем, production cookie/TLS,
доступ к Cloudflare R2 и работа edge-кеша ею не подтверждены.

## Evidence

Node 22.20.0, pnpm 11.7.0. Проверки выполнялись в изолированной копии tracked
source без пользовательских `.env`, с установленными workspace dependencies
и синтетической конфигурацией. Изменённые production/test файлы были скопированы
из текущего checkout; сторонние рабочие деревья не менялись.

- `pnpm verify` → exit 0: typecheck, lint, unit suites, 31 ops tests,
  disposable DB fence, 25 integration files / 102 tests и build.
  API unit: 51 files / 342 tests. Mobile: 109 files / 573 tests.
  Evidence: `/private/tmp/bidplace-launch-root-verify.log`.
- Logout → auth lifecycle → city publication в Chromium и WebKit:
  **16 passed, 0 skipped, 0 flaky**, один worker, одна disposable DB,
  одна подготовка на оба браузера; schema `e2e_launch_readiness`.
  Evidence: `/private/tmp/bidplace-launch-auth-publication.log`, `.json`,
  `-artifacts/`. Полный maintained browser baseline этим не заменён.
- Backfill: 9 unit tests; dry-run, все пять видов, общие object keys,
  контроль source/target SHA-256, отсутствие перезаписи несовпадающего объекта,
  сбой read-after-write, повторный запуск и paging.
- Дополнительно реальный Prisma/PostgreSQL в отдельной временной схеме,
  синтетический S3-транспорт: пять объектов проверены, пять ссылок записаны,
  повторный запуск сделал 0 uploads / 0 updates; исходные байты сохранены.
  Evidence: `/private/tmp/bidplace-launch-media-prisma-verification-final.log`.
- Dry-run на browser-fixture DB отказал на фиктивном checksum существующей
  тестовой строки до записи в S3/БД. Эти fixture данные не подтверждают
  целостность production-источника. Исторический лог:
  `/private/tmp/bidplace-launch-media-inventory.log`.

- Developer Makefile (15 targets, including presence-only doctor): isolated clean checkout `make rebuild` → exit 0,
  8 successful uncached Turbo tasks; `make build-web` → exit 0, 4 successful
  tasks, web-only output. `make test` → exit 0, unit suites and 31 ops tests.
  Logs: `/private/tmp/bidplace-make-rebuild.log`,
  `/private/tmp/bidplace-make-build-web.log`, `/private/tmp/bidplace-make-test.log`.
- `make dev`: separate disposable PostgreSQL container/volume on port 55432;
  migrations + API readiness, Authors and Expo web → 200. Runtime env passthrough
  applies only to uncached Turbo `dev`; production build stays strict.
  Log: `/private/tmp/bidplace-make-dev-smoke-final.log`. Smoke resources removed.
- `make check`: typecheck/lint passed, global Prettier failed. HEAD comparison
  found 372 existing files; new warnings corrected, generated Expo files excluded. Doctor passed with
  synthetic runtime keys and failed as expected when configuration was absent.
  Final formatter still reports 371 existing files. No mass formatting or archive
  rewrite. Logs: `/private/tmp/bidplace-make-check-final.log`,
  `/private/tmp/bidplace-format-baseline.log`, `/private/tmp/bidplace-make-format-final.log`.
- API Docker image built successfully after packaging fixes; final local tag
  `bidplace-launch-readiness:make`, image
  `sha256:23ec664ff5cab2af2437f7379c05a83e591d5caeabe33b0c9d445352ec43079d`.
  Production-profile runtime on Linux arm64 with synthetic settings and external
  test PostgreSQL: health/readiness, Authors/Home → 200, anonymous session → 401;
  Argon2/Sharp/Prisma native modules passed. SMTP/R2 use invalid test addresses
  and were not called. AMD64, Neon TLS and real providers are not verified.
  Logs: `/private/tmp/bidplace-make-api-image-build.log`,
  `/private/tmp/bidplace-container-runtime-smoke.log`.

Артефакты `/private/tmp` локальные и временные. Перед release сохранить нужные
evidence в постоянное хранилище. Настоящие credentials не запрашивались и не читались.

## Полученный полный R29/T05 baseline

Основная release line в repository — `feature/portfolio-mvp-release`.
Рабочая `fix/public-launch-readiness` основана на этой линии; local release ref
отстаёт от `origin/feature/portfolio-mvp-release`. Отдельное имя `mvp/portfolio`
в repository не существует. Commit R29: `b9d0f5f`, base `433c8d4` на
`fix/browser-suite-scope`; его source не содержит production fixes этого прохода.

JSON evidence подтверждает **175 passed / 29 failed / 0 skipped / 0 retries**,
204 tests, 32.7 минуты. В failed входят 19 assertion failures и 10 timeouts.
R29/T05 остаются открыты; это не green baseline и не ускорение.

| Группа                                              | Failed executions | Следующая проверка                                                                                                       |
| --------------------------------------------------- | ----------------: | ------------------------------------------------------------------------------------------------------------------------ |
| City publication                                    |                 1 | На текущем коде уже есть wait completed save-and-exit и targeted pass обоих браузеров; не приравнивать к новому full run |
| Four-step author submit                             |                 2 | Воспроизвести submit, проверить запрос/ответ и состояние формы; не увеличивать timeout                                   |
| Legacy three-step profile                           |                 2 | Сохранён; не удалять до работоспособности актуального owner и переноса всех проверок                                     |
| Work wizard                                         |                12 | Пять 120s timeouts на браузер + два WebKit Back URL failures; проверить request/response и актуальный flow               |
| Session-check URL                                   |                 2 | Проверить protected/public session ownership на текущем auth code                                                        |
| Cover frost, dock, ShareSheet, Home loading/Opening |                10 | Отделить stale assertions от реального поведения/визуальной регрессии по canonical reference                             |

Изолированные page-2 owners и переименованные URL/Back tests прошли в обоих
браузерах по отчёту. Это полезное покрытие, но новые условия публикации работают
только после доставки медиа; базовый upload/create/publish flow требует отдельного
green доказательства. Known approval/discipline gap закрыт текущей production
правкой с unit + HTTP/PG tests, которая ещё не входит в release branch/R29 base.

Evidence: `/private/tmp/bidplace-r29-full-after-20261004.json`, `.log`,
`-artifacts/`. Результаты выше сняты с его JSON; полный suite здесь повторно
не запускался. Требуется совместный regression после интеграции изменений.

## Готовность R2

Текущий `S3ImageStore` использует S3-compatible API и настраиваемый endpoint;
отдельная замена SDK для R2 не требуется. R2 использует account endpoint
и region `auto`: [Cloudflare S3 API](https://developers.cloudflare.com/r2/api/s3/api/).
Совместимость существующего адаптера с настоящим bucket пока **Needs verification**.

Backfill переносит байты из PostgreSQL. Если строка уже содержит только metadata,
объект должен существовать в целевом bucket либо его байты должны быть у другой
строки с тем же key. Перенос из другого S3 bucket этот скрипт не выполняет.
Он не меняет runtime provider, не удаляет исходные байты и не включает CDN.
Порядок cutover и rollback: [runbook](../ops/00-RELEASE-AND-BACKUP.md#media-backfill-and-r2-cutover).

## CDN — вариант подтверждён

Выбран private R2 для SOURCE/приватных variants + отдельный public R2 bucket
с собственным custom domain и встроенным Cloudflare CDN. В public попадают
только derivatives опубликованного snapshot; текущий общий bucket открыть нельзя.
Custom domain и cache settings требуют live проверки:
[Cloudflare public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/).

Публикация ждёт доставки всех медиа; до готовности сохраняется предыдущий snapshot,
admin видит ожидание. Hide/suspend/delete удаляют public derivatives и запускают
purge с целевым временем ≤5 минут; уже скачанные копии не отзываются.
Последний ответ Q01 заменяет прежнее решение отложить отзыв.

Незавершённые операции записываются в Neon и повторяются внутри existing NestJS.
Worker, отдельный процесс, Redis и queue service не вводятся.
Это согласованная архитектура; live R2/CDN и соответствующий runtime ещё
**Not implemented**. Прежний Worker prototype остался за пределами repository
в `/private/tmp/bidplace-cdn-worker-proposal` и не входит в релиз.

## Что осталось до публичного включения

| Пакет                 | Оставшаяся работа                                                                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R2/CDN implementation | Two-bucket SOURCE/derivative pipeline, публикация после доставки, operation journal + Nest retry, отзыв/purge; тесты и live cache-hit/revocation smoke                                         |
| Infrastructure        | Выбрать площадку и домены web/API; подготовить production deployment, TLS, CORS, trust proxy, подключение Neon и резервные копии                                                               |
| Migration/demo        | Создать buckets/custom domain, provider preflight, inventory/source backup, пяти-owner migration, явно помеченный demo catalog без тестовых логинов, verify и cutover                          |
| SMTP                  | Выбрать провайдера, подтвердить sender domain, проверить реальные OTP/reset письма и reset URL на production-домене                                                                            |
| Release verification  | Полный maintained Chromium/WebKit baseline; deploy smoke публичных страниц, авторизации и медиа; restore drill; оставшиеся RFC §16 UI/device/accessibility gates                               |
| Public documents      | Подтвердить актуальные согласованные portfolio-first тексты и требуемые controls. Текущий [manifest](../legal/09-PORTFOLIO-LEGAL-REVIEW-MANIFEST.md) сообщает `external lawyer review pending` |

Это несколько пакетов. Green локального gate не означает публичный deployment.
Marketplace, payments, тарифы, Google, HEIC и destructive удаление legacy bytes
отложены; минимальные portfolio Rules/Privacy не останавливают техническую реализацию.
Состояние документов и согласование публикации остаются фактическим release gap.

## Что ещё нужно решить/предоставить

1. Production hosting и конфигурация доменов web/API. Render пока не выбран.
2. Реальные private/public buckets, custom domain и внешний SMTP; credentials
   настраиваются безопасно в runtime, без передачи в чат.
3. Источник demo catalog и право его публичного показа; тестовые логины исключаются.
4. Готовые минимальные portfolio-only Rules/Privacy и реквизиты оператора.
5. В плане FULL предусмотрена загрузка по открытию viewer и подготовка derivative
   при upload. Если подразумевалась генерация только при открытии, это отдельное
   уточнение; новый on-demand processing flow не утверждён.

Ответы по CDN, отзыву, retry, Google, Neon и scope зафиксированы;
повторно выбирать эти варианты не требуется.

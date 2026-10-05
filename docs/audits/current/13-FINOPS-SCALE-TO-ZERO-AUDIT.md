# Bidplace — FinOps / infrastructure economics / scale-to-zero audit

Дата проверки: 2026-10-05. Статус: COMPLETE, только аудит.

Источник кода: remote `origin/feature/portfolio-mvp-release`, обновлённый через
`git fetch origin refs/heads/feature/portfolio-mvp-release:refs/remotes/origin/feature/portfolio-mvp-release`.
Анализируемый SHA: `507bb5b422878a38099b70ce7bfd9a59e9c16189`.
Отдельная docs-only ветка: `feature/finops-audit`. Production/test код не меняется.
Секреты, dotenv-файлы и реальные production подключения не читаются.

## Метод и границы

Критерий: подтверждённый call graph критичных расходов, все runtime таймеры и
retry, отдельные модели compute/DB/storage/operations, актуальные официальные
тарифы, минимальный implementation backlog и открытые решения.
Вычисления — оценка, а не измеренный production bill. Период модели — 30 дней /
720 часов. Live Cloudflare/Neon конфигурация и фактические метрики не доступны.

Упрощение media до synchronous/manual retry рассматривается как предложение.
Оно не отменяет автоматически подтверждённые атомарную публикацию, приватность
SOURCE, безопасный restore и отзыв публичных derivatives с purge.

## Проверка

- Remote HEAD подтверждён; основной portfolio release сохранён.
- Поиск runtime timers нашёл media reconciliation, четыре media-delivery polling
  owners, in-memory rate-limit cleanup и ограниченные image/query retries.
- Cloudflare pricing проверен по основному official docs hostname;
  preview-копии docs не используются как канонический ценовой источник.

## Основной вывод

R2/CDN boundary уже подходит для дешёвой публичной раздачи. Самые значимые
расходы возникают вокруг неё: media polling держит БД активной во время работы
Nest, analytics превращает просмотры в записи, публичный JSON не имеет
подтверждённого edge cache, Sharp повторно преобразует исходник, verification
скачивает целые объекты. Эти механизмы важнее выбора между двумя дешёвыми
Docker runtimes.

Нельзя просто удалить `schedule()`: approve сегодня ставит PUBLISH в журнал,
а REVOKE/CLEANUP также выполняются этим executor. Удаление таймера без
синхронного завершения соответствующих действий оставит публикацию pending и
может нарушить отзыв. Требуется отдельный локальный implementation-пакет.

Стандартный Cloudflare Container class засыпает по входящей активности;
исходящий SQL сам по себе не обновляет этот таймер. Поэтому утверждение
«текущий loop гарантированно держит Cloudflare Container 24/7» **не доказано**.
Во время работы Container loop гарантированно создаёт SQL-активность. Railway,
напротив, оценивает исходящий трафик и с таким loop не уснёт.
Источники: [Container class](https://developers.cloudflare.com/containers/api/container-class/),
[Railway Serverless](https://docs.railway.com/deployments/serverless).

## Реестр проблем — сохраняется по ходу аудита

Severity: **High** — риск консистентности/отзыва или исчерпания ресурсов;
**Medium** — значимый повторный расход; **Low** — оптимизация после измерений.
`Подтверждено` означает статическое подтверждение в данном SHA; live billing,
CDN rules и производительность не измерены. `Сейчас` ниже — рекомендация,
не выполненное изменение и не новое решение основателя.

| ID | Проблема / severity | Где найдена | Влияет на MVP | Решение сейчас / post-MVP и причина |
|---|---|---|---|---|
| F01 | 5s reconciliation / High | `apps/api/src/core/media/media-lifecycle.service.ts` | Да: публикация, отзыв, расходы Neon | Частично. Публикация подтверждается в инициировавшем запросе, пустой 5s loop при простое снят. Executor REVOKE/CLEANUP сохранён. F27/F28 исправлены: ошибка чтения и молодой STAGING оставляют одноразовый timer, подтверждённый простой его снимает. F29/F30 исправлены: старт API не ждёт recovery, а упавший scan старых STAGING сохраняет timer. Отдельно: DEC-097 revoke ≤5 минут после мёртвого процесса без пробуждения не гарантирован. |
| F02 | Unlimited provider retry и неисправимый UPLOAD / High | `media-lifecycle.service.ts` run/fail | Да: outage и pending state | Исправлено для публикации и UPLOAD: повтор — то же явное действие и та же identity. Потерянный SOURCE получает `SOURCE_RESEND_REQUIRED` и не подхватывается executor. REVOKE по-прежнему повторяется executor-ом, потому что DEC-097 не отменён. |
| F03 | Четыре 5s delivery polling owners / Medium | admin, seller profile, product draft | Да: UI ожидания и нагрузка | Исправлено: `refetchInterval` снят. FAILED/PENDING/RUNNING показывают повтор действия и не планируют новый poll. |
| F04 | Analytics: HTTP и DB write на view, без retention / High на росте | analytics client, API service, analytics tables | Наблюдаемость, не core flow | Частично: события одного хода объединены, attribution не читается без attribution/claim. По подтверждённому ответу основателя флаги и основные метрики сохраняются. События всё ещё пишутся в Neon; retention и sampling не утверждены. |
| F05 | Два user lookup на verified mutation / Medium | Bearer guard `:52`, Verified guard `:20` | Да: auth и DB | Сейчас: единый свежий request user snapshot с email verification. Сохранить проверку ban/role/sessionVersion; stateless JWT здесь неприемлем. |
| F06 | Public JSON достигает origin без подтверждённого edge cache / High на росте | portfolio controller/service, public products/authors/categories | Да: catalog и Neon | Сейчас: whitelist public GET + короткий TTL, исключить private/auth/admin и personalized responses. Worker/runtime config в repo отсутствует. |
| F07 | Public queries stale immediately / Medium | `apps/mobile/src/lib/query-client.ts:22`, public hooks/screens | Да: navigation и повторные чтения | Сейчас: согласованные staleTime; проверить explicit invalidation после publish/edit/hide. Window-focus refetch уже выключен. |
| F08 | Лишние Sharp encode и повтор обработки replay / Medium, High при abuse | pipeline `:22,25,55`; stage `:102–104`; sellers controller `:69,98` | Да: upload CPU/RAM | Сейчас: одна safety validation + нужные derivatives, idempotency lookup до дорогой обработки. Header-only validation не заменяет проверку декодирования. |
| F09 | Полный GET для existence/verification / Medium | lifecycle `:558–595`, object store `:90–99` | Да: upload/publish latency | Сейчас после identity tests: HEAD вместо полных verification GET для trusted immutable writes. Само число Class B при HEAD не сокращается. |
| F10 | Image retry ×4 и разные cache keys / Medium | `media-recovery.ts`, `ResilientRemoteImage.tsx:98` | Да: outage и CDN | Сейчас предложено 1 auto retry + manual; не размножать ключи immutable CDN URL. Параллельные ошибки без jitter дают всплеск. |
| F11 | Purge base URL не покрывает retry-query variants / High, live rules unknown | public-media-cache `:22–32`, media-recovery query builder | Да: revoke ≤5min | Не закрыто. Локальный контракт по-прежнему purge exact base URL. Live acceptance base URL, `?media_retry=1` и произвольного query после hide/revoke обязательна до публичного запуска. Cloudflare account и секреты этим пакетом не менялись. |
| F12 | /ready SQL и eager $connect на cold start / High при частом monitor | health `:37`; PrismaService `:9–11`; ops docs `:97–101` | Да: доступность и сон | Сейчас: readiness для deploy/diagnostics; внешний monitor не должен регулярно будить origin. /health без SQL полезен только на уже работающем процессе. |
| F13 | Profile image uploads без request rate limit; pre-normalize вне admission / High | sellers controller create/update; portfolio achievement pre-normalize | Да: CPU abuse | Исправлено локально, durable: общий `RateLimit` 10/min на create и update фото профиля; reentrant admission на decode/normalize. Redis, очередь и новый limiter framework не добавлены. Слот один на операцию и освобождается в `finally`. |
| F14 | Work capacity проверяется после stage; orphan cleanup только при runtime / Medium | `ImagesService.addMedia`; lifecycle orphan scan | Да: rejected uploads тратят Sharp/R2 | Исправлено локально, durable: count/byte отказ до `stage`/Sharp/R2. Locked recheck и orphan scan сохранены. Replay уже прикреплённых bytes не является новой загрузкой. Чужие bytes и старая revision остаются 409. |
| F15 | Rate limits per-process + O(N) scan каждого consume / High при abuse | rate-limit service `:17–92`; bootstrap `:11` | Да: auth/upload denial-of-wallet | Сейчас: edge protection и небольшой replica cap; локально не сканировать все buckets на каждом request. Контейнерный restart/scale-out умножает допустимые попытки. |
| F16 | Нет явного pool cap; новые replicas подключают Neon | PrismaService; Prisma 6.19.3 | Да: connection saturation | Сейчас: pooled Neon endpoint, ограниченный pool/replicas, direct migrations; проверить row locks/transactions. Не читать connection strings в аудите. |
| F17 | COUNT OVER + OFFSET, произвольные search keys / Medium на росте | products service `:803–827`; sellers `:875–900`; pagination schema | Да: public catalog | Сейчас cache/rate bound; EXPLAIN на realistic fixture перед indices/cursor. Cursor/full-text — post-MVP до появления измеренного bottleneck. |
| F18 | Full author achievements/gallery data в списках / Medium | products mapper `:230`; public seller mapper `:26–46` | Да: DB egress/payload | Post-MVP: slim card DTO после измерения. Сейчас не rewrite contracts ради предположения; image binary/FULL автоматически не загружается. |
| F19 | Journal/tombstones/OTP/reset/attribution history не имеют runtime retention / Medium | media schema/runtime, auth OTP/reset, analytics tables | Storage и restore cost | Post-MVP либо bounded manual maintenance до больших объёмов; не удалять audit/PII/required revisions без политики. |
| F20 | 1 log/request, /ready и failed tick logs; fallback raw URL / Low→Medium | request logging `:27–70`, lifecycle `:55` | Расход и диагностика | Сейчас конфигурационный sampling/retention; исключить query из route fallback, не логировать credentials/payload. Ошибки безопасности сохранять. |
| F21 | API /auth/me на каждом полном browser boot | auth provider `:48–53`; auth controller `:139`; service `:141` | Да: visitor origin wake | Post-MVP оптимизация bootstrap; guest без cookie даёт 401 без SQL, но будит Nest/$connect. Нельзя читать HttpOnly cookie в JS или отказаться от session freshness. |
| F22 | SDK + UI + journal retry складываются / Medium | object store `:54,78`; query retry `:23`; media lifecycle | Да: outage | Сейчас считать разные budgets, bounded response and explicit retry; не ставить большой timeout ради успеха. 2 SDK attempts — всего две попытки, не три. |
| F23 | Private media API proxy имеет authz/DB/bytes расходы / Low, ожидаемо | images/author-photo/achievement read services | Да: owner drafts | Сохранить privacy. Public R2 derivatives уже обходят API; private signed URLs — отдельный post-MVP выбор, сейчас не требуются. |
| F24 | Runtime deployment, cache/sleep/region/probe policies не versioned | отсутствуют Worker/Wrangler/provider deployment configs | Да: цена и cloud correctness | До deploy зафиксировать выбранные настройки, только минимальный provider adapter. Аудит не выбирает platform и не создаёт инфраструктуру. |
| F25 | STAGING scan без state/createdAt index, retained READY SOURCE и старые revisions | media schema `:633–649`, remove `:907–919` | Storage/scan cost на росте | Post-MVP после F01: измерить EXPLAIN и retained bytes; индексы/retention локально, не универсальный migration/GC framework. |
| F26 | Unbounded legacy owner list и большие admin aggregates | sellers service `:802–819`, admin analytics `:111+` | Не основной текущий cabinet path | Post-MVP; endpoint существует, но runtime call из текущих screens не найден. Не выдавать dormant путь за активный N+1 каждого public request. |
| F27 | DB outage останавливает recovery executor / High | `media-lifecycle.service.ts` recover/orphan callbacks | Да: REVOKE/CLEANUP могут остаться без исполнения при живом процессе | Исправлено локально. Ошибка чтения означает неизвестное состояние и оставляет следующий одноразовый timer. Таймер снимается только после успешного подтверждения, что работы нет, либо при shutdown. |
| F28 | Young STAGING после restart или failed stage остаётся без orphan trigger / Medium | `media-lifecycle.service.ts` startup recover и `stage()` | Да: накопление частичных private objects и manifests | Исправлено локально. Молодой STAGING при старте и сохранённый staging intent до записи объектов получают одноразовый grace timer. Прикреплённые assets, действующий lease и READY SOURCE не удаляются. Пустой простой не опрашивается. |
| F29 | Startup recovery блокирует `app.init()` / High | `media-lifecycle.service.ts` `onModuleInit` | Да: медленный REVOKE/CLEANUP задерживает весь API | Исправлено локально. Старт только ставит уже существующий одноразовый timer на 5 секунд и не ждёт `recover()`. Новый scheduler не добавлен, timeout не увеличен. |
| F30 | Ошибка scan старых STAGING теряет retry / Medium | `media-lifecycle.service.ts` `recover()` после падения `tick()` | Да: abandoned STAGING может остаться без следующей попытки при живом процессе | Исправлено локально. Упавший `tick()` сохраняет следующий проход через существующий timer до проверки counts. Нулевые counts после ошибки scan не считаются успехом. После успешного пустого прохода чтения прекращаются. |

## 2026-10-05 — Review `e26e912`: recovery blockers F27/F28

Проверен локальный `fix/portfolio-media-execution` HEAD
`e26e912b22c58bf4b2f7e20b021a4aacd1f1fe6f` относительно `2a3a110`.
Production-код в этом review не менялся. Отдельная ветка
`fix/portfolio-media-recovery-review` хранит только уточнение этого аудита.

**F27 / High / MVP / исправить сейчас.** При запланированном recovery с
незавершённым REVOKE временный отказ БД ломает и `tick()`, и проверку
`revokeWorkOutstanding()`. Последняя возвращает `false` через catch, таймер уже
снят перед callback, новый не ставится. После восстановления БД процесс остаётся
живым, но отзыв не возобновляется без нового enqueue или рестарта. Это отдельный
локальный дефект, а не уже известное ограничение остановленного Container.

**F28 / Medium / MVP / исправить сейчас.** При рестарте через минуту после
частичной загрузки `tick()` не выбирает STAGING моложе десяти минут, UPLOAD
исключён из executor, а `onModuleInit()` не ставит orphan timer. Через десять
минут очередной scan сам не возникает. Дополнительно `stage()` ставит этот timer
только после успешной записи объектов; ошибка до строки 273 также может оставить
частичную загрузку без trigger. Последующие независимые операции иногда маскируют
проблему, но не обеспечивают очистку.

Воспроизведение на заново собранном текущем API с fake timers и синтетическим
Prisma stub, без сети, production БД, dotenv или credentials:

- Pending REVOKE сначала ставит timer; во время его callback БД недоступна,
  после возврата БД `scheduledRetries = 0`, новых чтений нет.
- Один STAGING возрастом одна минута при старте: один initial asset scan,
  `scheduledOrphanScans = 0`, будущего scan нет.
- Локальный воспроизводитель: `/private/tmp/bidplace-e26e912-recovery-review.cjs`.
  Сценарии и результаты выше сохранены здесь независимо от времени жизни tmp.

Durable fix — локальные изменения существующих recovery/orphan triggers и
regression tests для обеих ситуаций, включая failed stage. Acceptable workaround
— принудительный рестарт или следующее enqueue; для сохранённой гарантии отзыва
этого недостаточно. Hack — считать ошибку чтения БД отсутствием работы или просто
вернуть постоянный пустой 5s poll. Новые сервисы и изменение DEC-097 не нужны.

Независимо повторены: API analytics/cache unit 10/10, mobile analytics/delivery
unit 12/12, API build, `git diff --check` — PASS, Node 22.20.0. Полные `pnpm verify`,
browser suite и live Cloudflare acceptance этим review не повторялись.
Предыдущие 210 passed / два Home Opening failures остаются отчётом исполнителя.
Пакет требует F27/F28 перед рекомендацией к integration regression; F11/D08 и
пробуждение остановленного процесса остаются отдельными открытыми вопросами.

## 2026-10-05 — F27/F28 recovery triggers

Сравнение:

| Вариант | Класс | Почему |
|---|---|---|
| Ошибка чтения оставляет следующий одноразовый timer; молодой STAGING и сохранённый staging intent получают grace timer; подтверждённое отсутствие работы и shutdown снимают timers | Durable fix | Сохраняет журнал, leases и DEC-097 executor. Простой не читает SQL повторно. |
| Рестарт сервера или следующее enqueue как единственный способ продолжить | Acceptable workaround | Для живого процесса после короткого отказа БД этого недостаточно. |
| Считать ошибку чтения отсутствием работы или вернуть постоянный пустой 5s poll | Hack | Либо теряет отзыв, либо возвращает простой Neon. |

Выбран durable fix. Публикация, UPLOAD и потерянный SOURCE по-прежнему не повторяются executor-ом. F11 и пробуждение остановленного Container не закрыты.

Доказательство простоя: `media-lifecycle.recovery.spec.ts` после пустого startup и после возврата БД без оставшейся работы продвигает fake time на 15 минут и видит тот же набор чтений. Scheduler не планирует следующий запрос.

Доказательство recovery: pending REVOKE переживает отказ чтения и после возврата БД доходит до DONE тем же timer, без нового enqueue и без рестарта. STAGING возрастом одна минута после restart очищается, когда наступает существующий grace period. Частичная запись с отказом provider очищается тем же путём, а UPLOAD остаётся FAILED. Прикреплённый asset и объект с действующим lease не удаляются.

Evidence: `media-lifecycle.service.ts`, `media-lifecycle.recovery.spec.ts`, `media-lifecycle.integration.spec.ts`.

Проверки на Node 22.20.0 / pnpm 11.7.0, code `659a6cc648aef7269fedfc96ce8a56a901d22bf8`: `pnpm verify` exit 0 (API unit 387, integration 132, mobile 582, ops 31/0, build 8/8); `pnpm cloudflare:check` exit 0; staging и production SPA export exit 0; `pnpm cloudflare:image:verify` exit 0; dedicated media config 2 passed; полный Chromium/WebKit 210 passed / 2 failed Home Opening. Push и deploy не выполнялись. F11 остаётся `Needs verification`.

## 2026-10-05 — F29/F30 startup recovery

Повторная проверка F27/F28 на `59b5de6fa999502a645462107d132d6a1d92993e` оставила два края. Новая ветка не создавалась. Архитектура не расширялась.

**F29 / High / MVP.** `onModuleInit` делал `await recover()`. Nest не заканчивает `app.init()`, пока этот hook не вернётся. Зависший REVOKE или CLEANUP в R2 задерживает доступность всего API.

**F30 / Medium / MVP.** `tick()` падает на `mediaAsset.findMany` для старых STAGING. Следующие counts возвращают нули, epochs совпадают, и timer снимается. Пустые counts не подтверждают, что упавший scan выполнился. Следующей попытки нет, пока кто-то снова не поставит работу.

Воспроизведение до правки, `media-lifecycle.recovery.spec.ts`, Node 22.20.0:

- Реальный `NestFactory.create` плюс `app.init()` при `findMany`, который не резолвится: за 1 секунду статус `blocked`.
- Один отказ `mediaAsset.findMany` и нулевые counts: через 5 секунд новых чтений нет (`expected 4 to be greater than 4`).

Сравнение:

| Вариант | Класс | Почему |
|---|---|---|
| Старт только вызывает существующий `arm()` на 5 секунд. Упавший `tick()` вызывает тот же `arm()` до проверки counts, поэтому нулевой count не снимает новый timer. Успешный пустой проход и shutdown по-прежнему снимают timers | Durable fix | `app.init()` не ждёт R2. Повтор scan идёт тем же одноразовым timer. Пустой простой не читает SQL. |
| Поднять timeout hook или вынести recovery в новый scheduler | Acceptable workaround | Либо оставляет блокировку, либо расширяет архитектуру, которую этот пакет запрещает. |
| Не ждать `recover()` и считать упавший scan успешным, если counts нулевые | Hack | API стартует, но потерянный STAGING больше не очищается. |

Выбран durable fix. Timeout 5 секунд и orphan timeout 10 минут не менялись. Publication и UPLOAD автоматически не повторяются. Прикреплённые assets, действующий lease и нужный private SOURCE по-прежнему не удаляются. F01 не закрыт: мёртвый процесс без пробуждения не гарантирует отзыв за 5 минут. F11/D08 не закрыты: локальные тесты не подтверждают live CDN/purge.

После правки те же regression-тесты: unit `media-lifecycle.recovery.spec.ts` 6/6, integration `media-lifecycle.integration.spec.ts` 15/15.

Проверки на Node 22.20.0 / pnpm 11.7.0, ветка `fix/portfolio-media-execution`, code `1d6ab422d3896a1f0a64d9d0d32ea60bd7221c9c` от `59b5de6fa999502a645462107d132d6a1d92993e`. Push и deploy не выполнялись. Golden, thresholds и timeouts не менялись.

| Проверка | Результат |
|---|---|
| `pnpm verify` | exit 0: typecheck 13/13, lint 2/2, config 8, API unit 389, contracts 32, api-client 28, database 1, mobile 582, ops 31/0, integration 132, build 8/8 |
| `pnpm cloudflare:check` | exit 0: 26 unit + 7 script |
| `pnpm cloudflare:image:verify` | exit 0: linux/amd64 image, native modules, migrated disposable DB, HTTP/auth boundary and SIGTERM passed |
| media Playwright `--config=playwright.media.config.ts --workers=1 --retries=0` | 2 passed, 1.0m |
| full Chromium/WebKit `--workers=1 --retries=0` | 210 passed / 2 failed, 0 skipped, 0 retries, 12.0m. Оба отказа — Home Opening visual: Chromium 0.12231040564373898, WebKit 0.12205687830687831, threshold 0.12. Остаются post-MVP |

F01 остаётся открытым: локальные тесты не подтверждают отзыв при спящем Container. F11/D08 остаются `Needs verification`: локальные тесты не подтверждают live CDN/purge. Перед integration regression нужен повтор portfolio browser gate на объединённом дереве без изменения golden. Локальный green не является live acceptance.

## 2026-10-05 — Release compatibility

`origin/feature/portfolio-mvp-release` обновлён и остаётся
`507bb5b422878a38099b70ce7bfd9a59e9c16189`. Это предок
`f10021d2fb362ce3f81ffa9c77208a5efc069ea9`, поэтому merge не делался.
Release branch не двигался. Push и deploy нет.

Повторные проверки того же дерева, Node 22.20.0 / pnpm 11.7.0: `pnpm verify`
exit 0 (API unit 389, integration 132, mobile 582, ops 31/0, build 8/8);
`pnpm cloudflare:check` exit 0 (26 unit + 7 script). Первый полный
Chromium/WebKit: 209 passed / 3 failed, 12.3m. Два отказа — прежние Home
Opening. Третий — WebKit compact handoff, poll 1500ms на `y === 12`; Chromium
в том же прогоне прошёл, изолированный повтор WebKit прошёл за 18.5s. Timeout
не менялся. Первый media gate: Chromium не дождался `1/10 изображений`, диалог
удаления остался открытым при `2/10`; WebKit прошёл. Идентичный повтор media:
2 passed, 1.0m.

Код готов к fast-forward в release. Публичный запуск не готов: F01 и F11/D08
открыты. Реальный staging должен отдельно подтвердить спящий Container и live
CDN/purge. DEC-097 не отменён.

## 2026-10-05 — Browser failure classification

Первый Chromium media отказ — production defect: подтверждённое удаление
изображения терялось, пока обычное сохранение ещё шло. Исправление
`2c9dc89eb185e478860da2f9178bc7d0421a3b00`. WebKit compact header — post-MVP
visual timing; дизайн не менялся. Успешный повтор не объясняет первый отказ.
Полная запись: `docs/audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md`.
F01 и F11/D08 остаются открытыми. Media architecture не менялась.

## 2026-10-05 — F13/F14 upload safety

Сравнение до правки:

| Вариант | F13 | F14 |
|---|---|---|
| Durable fix | Существующий `RateLimitGuard` 10/min и один reentrant admission вокруг уже существующего лимита в 2 слота | Дешёвый count/byte precheck до `stage`, повтор в блокирующей транзакции, replay не считается новой загрузкой |
| Acceptable workaround | Только rate limit, Sharp в контроллере остаётся вне admission | Отклонять полную галерею лишь в транзакции, уже после Sharp/R2 |
| Hack | Поднять лимит слотов или проглатывать 503 | Считать полный replay успешным, ослабив capacity |

Выбран durable fix. Media execution model, postgres/local storage, MIME/magic, pixel/animation checks, реальное декодирование, byte-identical private SOURCE и stripping metadata у public derivatives не менялись. F01–F03 не менялись.

Evidence: `sellers.controller.ts`, `image-processing-admission.ts`, `media-pipeline.ts`, `image-policy.ts`, `images.service.ts`; `sellers.profile-upload-limit.spec.ts`, `image-processing-admission.spec.ts`, `images.service.spec.ts`, `upload-safety.integration.spec.ts`. Существующие `media-pipeline.spec.ts`, `work-media-http.integration.spec.ts` и `media-lifecycle.integration.spec.ts` остаются зелёными для SOURCE/privacy/metadata.

Проверки на Node 22.20.0 / pnpm 11.7.0, ветка `fix/portfolio-upload-safety` от `bf6eb9831f6b81cb25971c2c5ec425994b2588dc`: `pnpm verify` exit 0 (API unit 382, integration 126, mobile unit 581, ops 31/0, build 8/8); `pnpm cloudflare:check` exit 0; staging и production SPA export exit 0; `pnpm cloudflare:image:verify` exit 0; dedicated media Playwright 2 passed. Push и deploy не выполнялись.

F11 остаётся `Needs verification`. `CloudflarePublicMediaCache.purge` по-прежнему отправляет exact base URL (`public-media-cache.spec.ts`). Локальный hide/revoke в `work-media-http.integration.spec.ts` проверяет purge этих URL, но не live cache key, `?media_retry=1` и произвольный query.

Sync/manual recovery не является утверждённым пересмотром `DEC-097`. Ручное восстановление конфликтует с целью автоматического revoke ≤5 минут после crash/outage: остановленный процесс сам не запускает journal. Q01 ниже остаётся открытым предложением, не решением.

## 2026-10-05 — синхронная публикация, executor отзыва сохранён

Сравнение:

| Вариант | Класс | Почему |
|---|---|---|
| Подтверждать публикацию в том же запросе по журналу и `publishedRevisionId`; снять пустой 5s loop; оставить executor только для REVOKE/CLEANUP и разового orphan scan | Durable fix | Сохраняет журнал, identity и предыдущий snapshot. Убирает простой Neon. Не обещает одну транзакцию PostgreSQL+R2. |
| Реже будить тот же loop | Acceptable workaround | Меньше SQL, простой остаётся, а HTTP по-прежнему может означать только enqueue. |
| Удалить executor и считать F01 закрытым | Hack | Отменяет цель отзыва ≤5 минут из DEC-097 без отдельного подтверждения. |

Выбран durable fix. F01 не закрыт: если процесс мёртв и его ничто не будит, автоматический отзыв за 5 минут по-прежнему не гарантирован. Executor не удалён.

Аналитика на одном сценарии после уже сохранённой attribution: `listing_viewed` + `seller_viewed` + `registration_started` в одном ходе дают 1 HTTP ingest и 0 чтений attribution. Раньше каждый `track()` открывал свой запрос, и каждый запрос читал attribution. Сами события по-прежнему пишутся в Neon через `createMany`. Флаги `ANALYTICS_INGEST_ENABLED` и `EXPO_PUBLIC_ANALYTICS_ENABLED` не менялись.

Evidence: `media-lifecycle.service.ts`, `admin-moderation.service.ts`, `products.service.ts`, `media-delivery.ts`, `analytics/client.ts`, `analytics.service.ts`; `media-lifecycle.integration.spec.ts`, `work-media-http.integration.spec.ts`, `analytics.spec.ts`, `analytics.service.spec.ts`.

Измерение на одном сценарии, unit: после сохранения attribution три события одного хода — 1 HTTP и поле attribution отсутствует (`analytics.spec.ts`). Сервер для `listing_viewed` + `seller_viewed` без attribution вызывает `createMany` один раз и не вызывает `acquisitionAttribution.findUnique` (`analytics.service.spec.ts`). Просмотры по-прежнему пишутся в Neon.

Проверки пакета на Node 22.20.0 / pnpm 11.7.0: `pnpm verify` exit 0; `pnpm cloudflare:check` exit 0; staging и production SPA export exit 0; `pnpm cloudflare:image:verify` exit 0; dedicated media 2 passed на повторе; полный Chromium/WebKit 210 passed / 2 failed Home Opening. Push и deploy не выполнялись. F11 остаётся `Needs verification`.

## Таймеры, polling и retry: полный runtime inventory

Числа в этой таблице — предел до изменения 2026-10-05. Пустой 5s media loop и
polling доставки на author, work и admin сняты. Текущее состояние описано в
разделе «синхронная публикация» выше.

| Механизм | Частота / budget | HTTP в час / за 30d | DB и compute impact | Нужность / предложение |
|---|---|---|---|---|
| Nest media recursive timeout | Было 5s после завершения tick | 0 inbound; provider requests только при operations | Было ≤720 ticks/h; ≤518 400/30d; idle ≥2 ORM reads/tick → до 1 036 800; per replica | Снято для простоя. Executor остаётся и будится только при REVOKE/CLEANUP или разовом orphan scan. |
| Admin authors polling | Было 5s, author tab и pending | Было ≤720 × loaded pages/h | Auth SELECT + list query/relations | Снято. Экран показывает ошибку или ожидание и ручной повтор. |
| Admin works polling | Было аналогично, works tab | Аналогично | Auth SELECT + moderation list/relations | Снято вместе с authors. |
| Seller profile delivery | Было 5s при PENDING/RUNNING/FAILED | Было ≤720/h | Guard + profile/revision/journal reads | Снято. Повтор — то же действие публикации. |
| Work draft delivery | Было аналогично | Было ≤720/h | Guard + owner detail + latest audit reason | Снято. Повтор — то же действие. |
| Rate-limit cleanup | 60s, unref | 0 / 0 | ≤43 200 scans/30d, только RAM; ещё scan каждого consume | Не причина Neon SQL; inexpensive periodic cleanup можно сохранить. |
| Image recovery timeout | 1/3/8s, 3 retries после ошибки | Не periodic: 4 attempts/image/mount | CDN/R2; legacy/private URI — API + DB | Bounded, но outage ×4. Manual reset даёт новый budget. |
| React Query | Global 1 retry; public override 2 retries | ≤2 либо ≤3 attempts/query/failure episode | Origin/DB multiplication; successful path ×1 | Сохранить transient-only policy, не retry 401/403/404/conflict. |
| S3 SDK | `maxAttempts=2`, abort 30s/command | ≤2 wire attempts/logical command | R2 counts/active CPU/RAM/network during failure | Bounded внутри одного command; journal повторяет episode без cap. |
| Readiness deadline | Одноразовый timeout 2s/request | Частота определяется caller | SQL SELECT 1; Promise.race не отменяет DB query | Не daemon, не автоматически включённый monitor. |
| Search debounce | Одноразовый timeout после input, отмена при изменении | Зависит от typing, 0 idle | Снижает search calls, не держит DB ночью | Сохранить. |
| Share image object URL revoke | Одноразовый 1s | 0 / 0 | Локальное освобождение browser memory | Сохранить. |

TanStack Query по умолчанию не polling в скрытой browser tab. Delivery refetch
на author, work и admin больше не планируется, включая FAILED. Одинаковый query
key может дедуплицировать observers. Исторические значения в таблице — предел
для одного owner до снятия polling, не сумма всех пользователей и не число
измеренных SQL statements.
[TanStack polling options](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

В runtime search не найдены cron/ScheduleModule, отдельный queue worker,
connection warmer, view-counter или lastSeen write на public GET. Test harness,
manual backfill/preflight/backup scripts не считаются production timers.

## Media: минимальное упрощение и ограничения scale-to-zero

Current call graph: admin approve → validation/lock → enqueue PUBLISH в короткой
transaction → ответ с pending → tick → lease → R2 transfer/verification →
короткая transaction с revision CAS → public snapshot switch → enqueue REVOKE.
Hide/suspend/delete и owner hide также enqueue revoke. `run()` ловит failure и
пишет FAILED; `await run()` **не является доказательством успешной публикации**.
Если operation уже leased другим request, `run()` может сразу вернуться.

| Кандидат | Класс решения | Trade-off |
|---|---|---|
| Использовать существующий журнал/leases/CAS; выполнять publish/revoke в инициировавшем HTTP request, manual retry того же operation; убрать пустой timer и UI polling целым пакетом | **Durable fix — рекомендуемый**, после решения Q01 ниже | Portable, без новых сервисов. Требуются HTTP outcome state, deadline, повтор revoke и recovery после crash. |
| Увеличить 5s до 60s / запускать tick только при входящем request | **Acceptable workaround**, если явно принят | Меньше SQL, но 60s всё ещё меньше Neon inactivity 5min; без входящих requests revoke остаётся незавершённым. Не гарантирует цель ≤5min. |
| Удалить schedule, положиться на кнопку Approve / Promise после ответа | **Hack — отвергнуть** | Ничто не доставляет queued publish/revoke; post-response task может быть заморожен/убит runtime. |

Минимальная граница будущей реализации:

1. Validation и создание/получение той же idempotent journal operation в короткой
   DB transaction. HTTP идемпотентность/immutable object identities сохраняются.
2. R2 I/O **вне** длительной PostgreSQL transaction. Существующие conditional
   PUT, per-object lease, expected revision timestamp и status CAS сохраняются.
3. Успех отдаётся после durable DONE + проверенного publication state. При
   занятой lease — honest in-progress; при failure — pending/FAILED и explicit
   retry того же operation. UI не показывает «опубликовано» после enqueue.
4. Предыдущая версия остаётся публичной до успешного switch; частичная новая
   версия не выдаётся. Старые public variants обрабатываются через тот же журнал.
5. Hide/suspend/delete закрывают DB visibility сразу, затем выполняют delete+
   purge в request. Failure purge должен быть виден и доступен для manual retry;
   иначе старая прямая CDN ссылка остаётся доступной.
6. Незавершённые leases после crash recover по истечении TTL, а не через снятие
   locks вручную. Админ видит outstanding operations. Abandoned staging cleanup
   остаётся явной bounded admin/maintenance операцией без регулярного daemon.

**Открытый конфликт Q01:** «без polling/cron/queue/daemon и только manual retry»
не позволяет гарантировать автоматический revoke ≤5min после crash/outage, если
после него нет ни одного входящего запроса. Даже текущий timer внутри sleeping
Container не даёт такого wall-clock SLA в отсутствие runtime. Нужен явный выбор:
manual recovery с заявленным ограничением либо источник bounded automatic
execution, уже отдельно согласованный. Аудит рекомендует manual для MVP, но
не ослабляет подтверждённый `DEC-097` молча.

Постоянные timers, Cloud Run request-only CPU и настоящая работа без трафика
несовместимы. Ни смена runtime, ни `.unref()` не делают background retries
гарантированными. Не добавлять DO alarm/Queues/cron как скрытую «оптимизацию».

Acceptance будущего малого пакета: двойной Approve/timeout retry не создаёт
новую публикацию; failure R2 сохраняет старую; crash после PUT recover;
stale revision не публикуется; hide/republish/restore races сохраняют существующие
гарантии; purge-query variants отозваны; idle SQL и media polling отсутствуют.
Использовать существующие service/integration/browser media gates, а не подменять
их увеличением timeouts. Этот аудит эти тесты не запускал и implementation не делал.

## Analytics и authentication amplification

Analytics включена по умолчанию вне test, если frontend flag не `'false'`;
server default тоже true. `track()` вызывает flush сразу; batch size 25 — это
верхняя граница уже накопленного batch, **не** batching window. In-flight flush
сериализован, события одной entity дедуплицируются в рамках client session.
Следовательно не каждый render/remount пишет событие, но новые views/reloads
обычно дают отдельный POST. Attribution initialization и account claim могут
дать дополнительный POST без events.

Один обычный batch с существующей attribution: 1 HTTP + 1 attribution SELECT +
1 createMany. Валидная cookie добавляет OptionalBearerAuthGuard SELECT. Новая
attribution/claim требует дополнительных SELECT/INSERT/UPDATE. Неизвестный
исход POST может повторить rows: уникальных event IDs нет. На error очередь
возвращается в память, retry происходит при следующем flush trigger; отдельного
retry timer нет, queue не ограничена размером.

Модель **1 записанное событие на page view**, 30d, без дополнительной attribution
активности и повторов. Это scenario, не browser traffic measurement:

| Views/day | HTTP/month | ORM calls guest / authenticated | Event rows/month | Storage с индексами, assumption 0,5–1,5 KiB/event |
|---:|---:|---:|---:|---:|
| 1 000 | 30 000 | 60 000 / 90 000 | 30 000 | 15,36–46,08 MB |
| 10 000 | 300 000 | 600 000 / 900 000 | 300 000 | 153,6–460,8 MB |
| 100 000 | 3 000 000 | 6 000 000 / 9 000 000 | 3 000 000 | 1,536–4,608 GB |

Schema: UUID PK + четыре вторичных индекса (`eventName`, `anonymousId`, `userId`
с createdAt, плюс createdAt). Размер — предположение для small JSON, не
`pg_total_relation_size`; attribution, TOAST, bloat/WAL/history и база портфолио
в диапазон не включены. Retention/delete для event/attribution не найден.
При 100k/day аналитика одна превышает 1GB Free раньше конца месяца.

Рекомендуемый MVP вариант — **оба** флага false: server runtime
`ANALYTICS_INGEST_ENABLED=false`, client build-time
`EXPO_PUBLIC_ANALYTICS_ENABLED=false` и rebuild static export. Server flag один
отменяет writes, но оставляет HTTP, parse/rate work и authenticated guard SELECT.
Generic page traffic можно смотреть через существующий Cloudflare Web Analytics
beacon; он бесплатный, но не заменяет product events/conversion attribution.
[Web Analytics](https://developers.cloudflare.com/web-analytics/about/).

Если нужны product events: короткое flush window, flush on lifecycle boundary,
bounded queue и 25-event batches; events за короткую session можно свести в
один POST. Теоретические 25× для полных batches не обещать одиночным визитам.
Согласовать retention, например 30d **как предложение**, а не удалять историю
по собственной инициативе. У `DEC-047` есть отдельная политика бессрочного
audit/PII до legal/privacy решения; не переносить analytics retention на неё.

Auth user SELECT нужен для актуальных ban/role/sessionVersion. Verified mutation
делает второй user SELECT для emailVerifiedAt; объединить поля в trusted request
context даст **2 → 1** guard lookup без потери freshness. Это экономит `M`
queries при `M` verified writes, а не все auth DB reads. `/auth/me` делает guard
lookup и отдельный contract user SELECT; OTP service повторно читает email/
verification. RolesGuard сам не читает DB. Logout sessionVersion UPDATE нужен;
не убирать ради экономии.

Registration SELECT-before-INSERT тоже не обязательно waste: он избегает
дорогого Argon2 для существующей email/phone, unique constraint уже закрывает
race. Предлагать его удаление без benchmark было бы ложной оптимизацией.

## Public JSON, edge cache и React Query

| Public API | Logical Prisma/raw query calls на успешный origin request | Предлагаемый edge TTL | Предлагаемый staleTime |
|---|---:|---:|---:|
| `/api/categories` | 1 | 30min | 30min |
| `/api/portfolio/facets` | 3: materials + cities + disciplines | 5min | 5min |
| `/api/portfolio/home` | 5 без selection, до 8 с hydrated curator selection | 60s | 60s |
| `/api/works`, `/api/authors` | 2; на пустой page — page query + fallback count | 30s | 30s |
| `/api/works/:publicId` | 3: detail + related page/hydration | 30s | 30s |
| `/api/authors/:slug` | 3: author + work page/hydration, header повторяется на page 2 | 30s | 30s |

Это **не exact SQL statement count**: Prisma relation selects могут выполнять
несколько SQL. Фактический DB egress/CPU нужен из safe synthetic benchmark.
Lists используют COUNT OVER и hydrate IDs; не N+1 на каждый Work в явном TS loop.
Facets DISTINCT возвращает все уникальные значения; response shape bounded
недостаточно без знания cardinality данных.

У этих public controllers нет auth guard/personalization, response не ставит
cache headers. В repo нет подтверждённого Worker/cache rules deployment.
Cloudflare по умолчанию не кеширует JSON, custom R2 domain сам по себе этого
не меняет. [Default cache behavior](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/).

Минимальный cache: только whitelist public GET, успешный JSON 200; не cache
401/403/5xx/Set-Cookie. Query key включает только validated filters/sort/page/limit,
порядок normalizes; q/город/теги **не игнорировать**. Обход на Cookie/Authorization
как безопасный старт уменьшает authenticated hit ratio, но исключает утечку;
для этих явно публичных routes отдельный anonymous-origin fetch можно рассмотреть
после проверки contract. Не применять Cache Everything к `/api/*`.

Public JSON publish/unhide/republish становится виден не позже TTL; hide/suspend
может ещё присутствовать в JSON 30–60s. Это ниже 5min target, если TTL не продлён
stale-while-revalidate/serve-stale. Media delete+purge остаются обязательны:
JSON TTL не отзывает прямую старую media URL. Если требуется немедленный JSON
hide, это отдельный explicit purge/TTL выбор. В MVP короткого TTL достаточно
как предложение; не строить event invalidation bus.

Модель 100 одинаковых Home requests/min, один key/PoP, TTL 60s: 6 000 origin
requests/h → примерно 60; до 48 000 logical ORM calls/h → 480 для наполненной
Home. За 30d: 4 320 000 requests → ~43 200, 34 560 000 calls → ~345 600.
Это ~99% reduction **origin**; несколько PoPs/cache eviction/miss races/unique
search keys увеличат misses. Cache API локален edge, не глобальный mutex.
При 30s TTL ~2 misses/min. Worker requests продолжают тарифицироваться, когда
router/Workers Caching участвует в выдаче.
[Workers cache/billing](https://developers.cloudflare.com/workers/platform/pricing/).

Cache, который всё равно даёт SQL каждую минуту, снижает DB workload, но
**не позволяет Neon уснуть** с 5min idle. Кроме того, generic visitor bootstrap
`/auth/me` и analytics могут будить API даже при cached Home. Поэтому обещание
«вся публичная страница только edge и zero origin» пока неверно.

Frontend `staleTime=0` означает reuse cached data с background refetch при
mount/reconnect. `refetchOnWindowFocus=false` уже полезен. Public staleTime
из таблицы ограничит навигационный шум; `gcTime=5min` означает, что после долгого
отсутствия data может быть удалена — это не retention TTL. Не ставить Infinity
публичному каталогу и не применять эти TTL к приватным owner/admin/auth.
При edit/publish/hide нужна existing explicit invalidation; client refresh не
пробивает edge TTL автоматически. [TanStack defaults](https://tanstack.com/query/v5/docs/react/guides/important-defaults).

## Sharp: реальные call graphs и работа на upload

R2 включён, fresh successful upload, один static JPEG/PNG/WebP. Ни legacy import,
ни SDK retry, ни публикация в counts ниже не входят. Metadata parses — число
явных `metadata()`; каждый encoder также читает headers internally. Decode/encode
— запущенные transform pipelines, не измеренная работа libvips.

```text
Work: ImagesController → ImagesService.addMedia
  → media.stage → buildMediaPipeline
  → validateAndNormalize(original) [metadata + normalize encode]
  → metadata(original) → PREVIEW(original) → FULL(original)

Author: SellersController POST/PATCH
  → validateAndNormalize(original) [metadata + normalize encode]
  → SellersService.preparePhoto → media.stage → тот же pipeline
  → validateAndNormalize(original) [metadata + normalize encode]
  → metadata(original) → PREVIEW(original)
  → readPreview(R2) → повтор checksum для profile/revision

Achievement: PortfolioController → outer validateAndNormalize
  → SellersService.addAchievement → preparePhoto → тот же author pipeline
  → readPreview(R2) → checksum в DB + ещё раз в response

Creation step: ImagesService.addCreationStepImage
  → media.stage(LEGACY_CREATION_STEP) → inner normalize + metadata + PREVIEW
```

| Path | Explicit metadata | Decode / encode pipelines | PREVIEW / FULL encode | Binary SHA-256 calls | Private PUT / GET attempts |
|---|---:|---:|---:|---:|---:|
| Work image | 2 | 3 / 3 | 1 / 1 | 10 | 3 / 6 |
| Author create / photo edit | 3 | 3 / 3 | 1 / 0 | 9 create, 8 edit | 2 / 5 |
| Achievement with image | 3 | 3 / 3 | 1 / 0 | 9 | 2 / 5 |
| Creation step image | 2 | 2 / 2 | 1 / 0 | 7 | 2 / 4 |

Hash арифметика: stage с `n` variants = `n` pipeline hashes + 1 повторный SOURCE
hash для idempotency + `2n` pre/post write hashes → `3n+1`. Author create ещё
дважды хеширует PREVIEW (profile и revision); edit один раз; achievement дважды
(DB и response). Work additionally hashes маленькую строку idempotency identity,
это не full-image hash. Publish добавляет 2 binary hashes на derivative.

Normalized bytes внутри pipeline выбрасываются. Outer normalized photo также
заменяется readPreview результатом. После локальной коррекции возможны Work
2 decode/encode, author/achievement/creation 1; один metadata admission pass,
повторная проверка успешного decode через derivative transform и сохранение
original SOURCE byte-for-byte. Reuse SHA из manifest уменьшает лишние hashes;
не дублировать validation целиком в controller/service/pipeline. `sharp.clone()`
не считать гарантией ровно одного физического decode без profiling.

Stage lookup расположен **после** всех encodes, поэтому успешный HTTP replay
с DONE operation не делает PUT, но повторяет transforms и hashes. Cheap original
hash/MIME + existing identity lookup до transforms — durable local fix; mismatch
и stale revision guards сохранить. Это особенно полезно при retry после timeout.

Admission=2 ограничивает только buildMediaPipeline; outer normalization photo
проходит вне него. Ограничения на вход уже есть: ≤5 MiB/file, edge ≤4096px,
≤16 777 216 pixels, отсутствие animation, MIME/magic validation. Один raw RGBA
bitmap такого размера ~64 MiB; два параллельных плюс originals, encodes, Node,
Prisma, Argon2 и libvips intermediates заметно больше. 256 MiB instance **не
рекомендуется** без RSS benchmark. Для выбора 512MiB/1GiB нужны реальные CPU/RSS,
не догадка о «лёгком» Nest. Не расширять HEIC/pixel caps ради этого аудита.

## R2: operations, bytes, storage и verification

Объектные keys immutable; PUT уже `IfNoneMatch='*'`. `writeVerified`:
pre-hash → GET existing → PUT if missing → GET verified → post-hash. Unknown
PUT outcome добавляет GET в catch. SDK может дать два wire attempts каждому
command. S3 HEAD есть, но этим write path не используется.

Ниже **logical commands**, включая miss GET attempts; billing successful/error
commands определяется R2, поэтому table не выдаёт все misses за измеренный bill.
Нормальный success без retries. `p` = PREVIEW bytes, `f` = FULL bytes, `S` = SOURCE.

| Work action, 1 asset | Сейчас GET / HEAD / PUT / DELETE / LIST | После узкой HEAD verification | Class A / B logical attempts до → после |
|---|---|---|---|
| Upload SOURCE+PREVIEW+FULL | 6 / 0 / 3 / 0 / 0 | 0 / 6 / 3 / 0 / 0 | 3 / 6 → 3 / 6 |
| First publish двух derivatives | 6 / 0 / 2 / 0 / 0 | 2 / 4 / 2 / 0 / 0 | 2 / 6 → 2 / 6 |
| Republish reuse current objects, без byte change | 6 / 0 / 0 / 0 / 0 | 2 / 4 / 0 / 0 / 0 | 0 / 6 → 0 / 6 |
| Republish с новым asset | Upload + first publish = 12 / 0 / 5 / 0 / 0 | 2 / 10 / 5 / 0 / 0 | 5 / 12 → 5 / 12 |
| Hide/revoke двух public derivatives | 0 / 0 / 0 / 2 / 0 + 2 purge HTTP | Без изменения command counts | 0 / 0 → 0 / 0; DELETE не тарифицируется |
| Cleanup detached asset | До 5 DELETE (3 private + 2 public) и 2 purge | То же | Bytes/reference/READY SOURCE rules могут оставить часть объектов |

Речь о двух derivatives одной Work image, не всей Work. Gallery `g` images
умножает transfer часть на `g`; journal/locks/queries отдельно. New upload +
publish = **5 PUT + 12 GET**, а не один S3 PUT. Publication создаёт обе public
копии через GET+PUT; CopyObject/ListObjects в этом runtime не используются.
Delete бесплатен для R2, но DB checks и provider purge HTTP стоят runtime time.
После публикации enqueueRevoke перебирает также текущие public objects, которые
`isPublic()` пропускает; это лишние DB checks, не лишние DELETE.

HEAD замена **не** экономит Class B count: GET и HEAD принадлежат одному классу.
Она убирает download verification bytes/checksum CPU, уменьшает latency и RAM.
Trust boundary: sha256 metadata сам по себе не доказательство содержимого,
если bucket имеет сторонних writers. Здесь trusted byte manifest + original
hash + conditional immutable PUT дают основание проверять HEAD metadata/type/
length. Оставить full GET integrity проверку для import/restore/diagnostics и
сценария недоверенного объекта; зафиксировать это в tests до смены поведения.
Если нужны меньше **operations**, более узкий PUT→HEAD после known immutable
create даёт 3→2 commands/object, но требует доказанного conditional-write
collision/unknown-success handling; не включать его автоматически в безопасную
HEAD-only оценку.

При new upload и publish container отправляет `S+2(p+f)` и получает
`S+3(p+f)`: private PUT, verified GET, private GET при publish, public PUT и
verified GET. Сценарий **S=5MiB, p=0,25MiB, f=1,5MiB**: upload **8,5MiB**,
download **10,25MiB** через container. С HEAD verification download снижается
до `p+f=1,75MiB`, upload остаётся **8,5MiB**. R2 egress=0 не делает этот
CPU/RAM/wall time и egress **самого runtime** бесплатными. Для Cloud Run/Render/Fly outbound PUT bytes в R2 тарифицируются
их runtime, не R2.

Retained storage Work asset = `S+2p+2f`: original и private derivatives + public
derivatives. При тех же предположениях 8,5MiB ≈8,913MB/asset; 1 000 assets
≈8,913GB, 5 000 ≈44,564GB. Source READY намеренно сохраняется; старые revisions
удерживают reference и private derivatives. Это не автоматически orphan.
Нужна отдельная storage retention policy, не удаление SOURCE «для экономии».

Default public objects сейчас `max-age=0,must-revalidate,s-maxage=86400`:
browser перепроверяет, CDN может держать сутки. Такое browser поведение помогает
revoke и не является случайной ошибкой; увеличивать browser TTL до года без
принятия новой гарантии нельзя. Public WebP идёт directly CDN/R2, FULL URL metadata
в JSON не скачивает binary; Work viewer делает lazy FULL уже сейчас. SOURCE
public path fail-closed. Legacy/private owner media проходит через API с DB authz,
buffering и no-store — ожидаемая цена privacy, не причина публиковать private bucket.

На outage initial+3 retries → 10/20/50 mounted images дают **40/80/200 attempts**
за одну цепочку (последовательные delays суммарно ~12s без времени ошибок).
После proposal 1 auto retry — 20/40/100; manual нажатие запускает новую цепочку.
Это application attempts: browser reuse/dedup/cache может уменьшить wire count;
разные image instances/query keys могут увеличить. Query params стандартно
входят в CDN key, поэтому успешный retry variant может пережить base purge.
[Cache keys](https://developers.cloudflare.com/cache/how-to/cache-keys/),
[single-file purge](https://developers.cloudflare.com/cache/how-to/purge-cache/purge-by-single-file/).

**Самая простая candidate cache rule для F11:** Ignore Query String только на
отдельном public media host/immutable asset path: R2 objects не имеют query
семантики. Это доступно на всех zone plans; выборочное исключение одного param
в custom key может быть Enterprise-only. Не игнорировать query у public JSON.
Правило должно совпадать при purge, без GET-only match. Проверить base+retry+
произвольный query variant и Origin/CORS варианты live CDN после delete/purge.
Удаление client cache-bust само по себе не запрещает третьим лицам создавать
новые query keys; normalization на media domain устраняет весь этот класс.

## Проверенные тарифы на 2026-10-05

USD, без налогов, домена и стороннего SMTP; allowances обычно account/project
scope, **не новые free quotas на каждый bucket/container**. Цена storage —
средний сохранённый объём во времени; размеры GB и GiB не смешивать.

### Cloudflare compute, router и обязательный DO

| Dimension | Included Workers Paid / overage |
|---|---|
| Account base | $5/month, один раз |
| Container RAM | 25 GiB-hours; $0,0000025/GiB-second |
| Container active CPU | 375 vCPU-minutes = 22 500 seconds; $0,000020/vCPU-second |
| Container provisioned disk | 200 GB-hours; $0,00000007/GB-second |
| Container egress, Europe/North America | 1TB/month; $0,025/GB выше |

RAM/disk считаются за running time по provisioned instance, CPU по активному
usage; asleep compute не считается. R2 public delivery не является Container
egress. [Containers pricing](https://developers.cloudflare.com/containers/platform/pricing/).

Для сравнения используем basic: 0,25 vCPU, 1GiB, 4GB disk. Lite 256MiB не
считать достаточным для этого приложения; standard-1 сразу 4GiB. Это модель,
не выбранный production instance. [Instance types](https://developers.cloudflare.com/containers/platform/limits/).

Workers Paid дополнительно включает 10M requests и 30M CPU-ms; overage
$0,30/M requests, $0,02/M CPU-ms. Static Asset requests бесплатны, если routing
действительно отдаёт их через assets и не запускает paid router на каждый файл.
Cache hit с выполнением Worker не устраняет request billing.
[Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/).

DO required **только как инфраструктурный adapter Containers**, не вместо Neon
business state. Paid: 1M requests, затем $0,15/M; 400k GB-s duration, затем
$12,50/M GB-s с округлением excess вверх до million. Duration — wall time active/
non-hibernatable, 128MB/DO независимо от реального RSS. SQLite storage: 25B rows
read, 50M written, 5GB-month included; затем $0,001/M reads, $1/M writes, $0,20/GB.
Alarms тоже requests/writes. Один непрерывно active DO за 30d =331 776GB-s и
входит в allowance; **два** =663 552, excess округляется до 1M → $12,50.
Не предполагать, что Container sleep автоматически означает zero DO duration.
[DO pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/).

Worker/DO timers/alarms, routing strategy и число replicas пока отсутствуют в
release config. Formula ниже использует один DO, а `DO_extra` остаётся переменной.
Не создавать DO per visitor/author и не добавлять бизнес-логику туда.

Logs на дату аудита: Paid 20M events/month included, $0,60/M extra, retention7d.
Container stdout попадает туда при enabled observability. С **2026-12-01**
официально объявлена другая Cloudflare Observability pricing; повторить pricing
check до этой даты. Logpush: отдельный request/export и destination storage.
[Workers logs pricing](https://developers.cloudflare.com/workers/platform/pricing/#workers-logs),
[Container logs](https://developers.cloudflare.com/containers/faq/).

### Neon

Free: 100 CU-hours/project/month, 1GB/project (20GB/account), 5GB public transfer/
project, 5min idle suspend. Free исчерпание CU-hours/transfer приостанавливает
compute; превышение storage блокирует writes. Это **не** автоматическое платное
overage. Paid Launch $0,106/CUh, Scale $0,222/CUh, storage $0,35/GB-month;
paid public transfer 500GB/project, затем $0,10/GB. Paid monthly minimum сейчас
**нет**; старое утверждение «Launch minimum $5» неактуально. Restore history
$0,20/GB-month, snapshot storage $0,09/GB-month — отдельные объёмы; branch сверх
allowance $1,50/month. [Current Neon pricing](https://neon.com/pricing).

Увеличение Free storage с 0,5 до 1GB объявлено **2026-10-02**;
paid transfer до 500GB — **2026-06-01**. Использованы эти новые условия, не
старые search snippets. [Free update](https://neon.com/blog/neon-free-plan-1-gb-per-project),
[transfer update](https://neon.com/blog/more-data-transfer-on-paid-plans).

Не добавлять Neon Auth/Functions/Object Storage: наши auth/R2 остаются прежними.
Разные read replicas/branches — отдельный compute usage, не бесплатная HA.
На 0,25CU непрерывные 720h =180CUh; Free хватает максимум на 400h≈16,67d при
постоянной активности. Launch compute за те же 180CUh =**$19,08**, без вычета
Free 100CUh из paid plan; 1GB DB storage ещё $0,35 плюс выбранная history.

Active hours считаются по объединению интервалов SQL activity плюс sleep tail,
а не по количеству запросов: 1 миллион SELECT может иметь тот же 180CUh floor,
что 1 запрос/min. Compute autoscaling выше 0,25CU увеличит цену сверх модели.
Idle connection сама по себе не доказательство постоянного wake; регулярный
SQL доказан. Logical replication from Neon тоже может удерживать runtime,
но в данном release такой configuration не найдена.
[Scale-to-zero](https://neon.com/docs/introduction/scale-to-zero).

### R2 Standard

10GB storage, 1M Class A, 10M Class B included/month; выше $0,015/GB-month,
$4,50/M A и $0,36/M B. PUT/COPY/LIST — A; GET/HEAD — B; DELETE и egress free.
Округление billable GB/M operations вверх. Private/public buckets делят allowance
аккаунта. Infrequent Access имеет retrieval/min-duration условия; сейчас не нужен.
[R2 pricing](https://developers.cloudflare.com/r2/pricing/).

Поэтому 10k fresh Work uploads+publishes/month дают 50k A и 120k B logical
attempts — намного ниже free. При CDN miss даже 3M preview reads/month внутри
10M B; 60M image reads без cache дают ~(60−10)×$0,36=$18 и гораздо больше load.
Cached public delivery не делает R2 GET на каждый hit. 44,564GB полностью
сохранённые весь месяц → округлённый paid excess35GB → **$0,525/month**.
На early MVP permanent DB activity обычно дороже этих operations/storage.

### Cloud Run request-based

Tier1: 2M requests, 180k vCPU-sec, 360k GiB-sec included; сверх $0,40/M requests,
$0,000024/vCPU-sec, $0,0000025/GiB-sec. CPU/RAM allocated **во время billed wall
interval**, включая ожидание DB/R2 и startup/shutdown; concurrent requests не
оплачивать повторно за перекрывающийся interval одной instance. Idle min=0
instance без requests не оплачивается; min>0 имеет idle charge. Регион может
изменять rate/free-tier discount. [Cloud Run pricing](https://cloud.google.com/run/pricing).

Request-based CPU вне request throttled: текущий daemon нельзя считать надёжно
совместимым. Google docs также отдельно предупреждают о billing native health
probes; учитывать тип probe, не объявлять любой liveness «всегда бесплатным».
Не переходить на always-allocated/min1 только ради сохранения нашего timer.
[Billing settings](https://docs.cloud.google.com/run/docs/configuring/billing-settings).

External runtime egress в R2/Neon/Cloudflare отдельно; EU destination Premium
network first tier примерно $0,12/GiB, далее tiers. Cloud Run free internet
transfer allowance имеет региональные условия: не вычитать North America
allowance из EU bill автоматически. Artifact Registry, Cloud Build и Google
logs также отдельно. Это скрытые строки, которые не видны в compute $0.
[Network rates](https://cloud.google.com/vpc/network-pricing).

## Финансовая модель и сценарии

Период 30d =2 592 000s. `H` — суммарные running instance-hours,
`C` — active vCPU-seconds. `max(x,0)`; shared included usage уже не занято другими
apps аккаунта. Не относится к реальному invoice.

```text
CF basic = 5
  + max(H − 25, 0) × 3600 × 0.0000025
  + max(4H − 200, 0) × 3600 × 0.00000007
  + max(C − 22500, 0) × 0.000020
  + Worker_extra + DO_extra + logs_extra + network_extra

Neon Launch = CUh × 0.106 + DB_GBmonth × 0.35
  + history_GBmonth × 0.20 + snapshot_GBmonth × 0.09
  + extra_branch_months × 1.50 + max(egress_GB − 500,0) × 0.10

Cloud Run Tier1, 1vCPU/1GiB =
  max(billed_instance_seconds − 180000,0) × 0.000024
  + max(billed_instance_seconds − 360000,0) × 0.0000025
  + max(requests − 2000000,0) × 0.40/1000000
  + cold_start_shutdown + network/build/registry/logs
```

Для CF basic RAM/disk + account base, до CPU/DO/logs/network:

| Running h/month | 0 | 25 | 30 | 35 | 100 | 500 | 720 |
|---|---:|---:|---:|---:|---:|---:|---:|
| USD | 5,00 | 5,00 | 5,045 | 5,09 | 5,7254 | 9,7286 | **11,93036** |

Аналогичный always-running lite даёт $6,70748, но 256MiB недостаточность не
проверена; standard-1 с 4GiB даёт около $32,10 до CPU. Выбор size важнее копеек
R2 verification. Lite savings не являются рекомендацией развернуть upload API
на неподтверждённой RAM.

| Pattern | CF basic H | Neon active H, current loop / sync proposal | Что значит |
|---|---:|---:|---|
| Нет incoming requests весь месяц, container уже asleep | 0 | 0 / 0 | Compute0, CF account$5; stored data продолжает считаться. |
| 5 коротких отдельных visits/day, gap>15min, Container sleep10min | ~25 | ~37,5 / ~12,5 | Current loop SQL до shutdown + Neon5min tail; без него SQL tail ~5min/visit. CF~$5; Free CU fits. |
| Активность непрерывно 1h/day, без остального трафика | ~35 | ~37,5 / ~32,5 | CF~$5,09; DB~9,375/8,125CUh, sleep между bursts. |
| Requests равномерно весь день, gap<5min | 720 | 720 / 720 | Таймер не единственная причина always-on DB; даже sync не создаёт idle window. |
| Внешний /ready каждые10–60s | 720 | 720 / 720 | Monitoring сам отменяет экономию сна. |

Cold-start processing time, overlap, boot queries и реальный routing увеличат/изменят
эти приблизительные H. Убирая loop, нужно считать sleep tails, а не обещать
«без SQL users значит 0CUh» сразу после последнего request.

Дополнительная иллюстрация: **backend HTTP**, не page views; одинаковые лёгкие
requests, 0,2s billed wall/request (100ms rounding учтён), 0,020 active CPU-sec/
request в CF, без overlap, cold starts/analytics/uploads/cache. Это заданные
параметры, не benchmark. CF1 replica/DO и uniform traffic; Worker CPU within
included budget. Neon0,25CU uniformly active, DB average1GB, без history:

| HTTP/day | HTTP/month | CF runtime/account, USD | Cloud Run backend, USD | Neon Launch compute+1GB, USD |
|---:|---:|---:|---:|---:|
| 1 000 | 30 000 | 11,93036 | 0 | 19,43 |
| 10 000 | 300 000 | 11,93036 | 0 | 19,43 |
| 100 000 | 3 000 000 | 12,98036 | 11,08 | 19,43 |

CF third row: CPU overage $0,75 + DO request overage $0,30. DO duration one
always-active router fits400kGB-s; extra replicas, alarms and RPC sessions can
change it. Cloud Run third row: CPU$10,08 + RAM$0,60 + requests$0,40.
Cloud Run + CF frontend/R2 may use free routing or already-paid Worker: add
**$0 or $5** per actual routing plan, not assume included twice. At 100k/day
Worker Free daily request allowance leaves no headroom for extra API calls.
Network, R2 bytes, email, backups, domain/tax excluded from these component rows.

No-traffic CF basic account floor$5 vs Cloud Run backend floor$0; uniform1k/day
CF+Neon around **$31,36** vs Cloud Run+Neon **$19,43** before optional paid
router/egress/restore. These numbers do not establish enough RAM/CPU at growth.
With sparse traffic Free Neon can fit; with always-on cannot. 100k/day real
pageviews can produce many more HTTPs than last row, requiring measured capacity.

## Health, pools, abuse, logs и orphan cost

Readiness10/30/60s даёт **259 200 / 86 400 / 43 200 SQL attempts за 30d**.
Это не столько же distinct DB wakeups: интервалы <5min оставляют compute active,
обычно initial wake и постоянный activity window. /health handler SQL не делает,
но routing его к спящему API запускает Nest и eager `$connect()` к Neon.
Частый внешний origin liveness также продлевает Container sleep. Static/edge
uptime и origin deploy smoke — разные проверки; не прикрывать warmup healthcheck.
Repo Dockerfile не содержит HEALTHCHECK; ops docs показывают manual curls,
Playwright startup использует health. Активного production uptime schedule
в versioned config не найдено.

Prisma6.19.3 native engine pool по умолчанию physical CPUs×2+1; container может
видеть больше host CPUs, чем quota. Нет explicit runtime pool cap в constructor.
Один Prisma singleton правильный, `$connect` на cold start intentional but costly.
Первый safe candidate: Neon pooled host, pool3–5/replica **после** нагрузки и
max-instance cap; direct URL только migrations/ops. Не пытаться открывать новую
Prisma instance на каждый request и не переключать driver ради economics.
Neon pooler transaction-mode поддерживает до10k clients, а active backend pool
на0,25CU соответствует ~104 max connections; client allowance ≠10k SQL
concurrency. Existing locks внутри transactions должны сохраниться.
[Prisma6 pool](https://www.prisma.io/docs/orm/v6/prisma-client/setup-and-configuration/databases-connections/connection-pool),
[Neon pooling](https://neon.com/docs/connect/connection-pooling).

Abuse cost: register5/IP/min и login10/IP/min существуют; Argon2 defaults без
local admission позволяют distributed IP concurrency. OTP request3/user/min,
10/IP/min, persisted60s cooldown; verify5/code и10/user/min,20/IP/min. Reset
IP/email limits + persisted cooldown, records failure cleanup есть. Это хорошая
защита для одной instance, но memory buckets reset on restart/scale-out.
Profile photo rate limit отсутствует; upload processing особенно дорог.
Не заменять Argon2 слабым hash и не убирать pixel/magic/decode guards.

TRUST_PROXY=true доверяет всей forwarded chain; origin должен быть недоступен
для обхода edge, Worker обязан strip/spoof-safe forward client IP. Иначе attacker
управляет rate-limit identity. Public search q<=120, materials<=20, limit<=100,
page без upper cap: high OFFSET/ILIKE и unique keys могут делать дорогие misses;
whitelist cache не заменяет origin authorization или edge abuse limits.
Rate limit Map max10k ограничивает RAM, но linear cleanup каждого consume и
eviction non-expired buckets создают CPU cost и могут облегчать обход quotas.
Сейчас нужны edge controls в рамках выбранного zone plan + local fixes,
а не Redis/новый distributed service. Paid WAF features не считать автоматически
включёнными в $5 Workers.

SMTP0background daemon: sendMail происходит внутри request, current transport
timeouts10s. Burst OTP/reset = mail bill + active request/Neon work; отправлять
только один validated recipient. No self-hosted SMTP proposal. Provider limits и
send/day budget нужны как настройки, без новой mail platform.

Logs: каждый handled request кроме liveness создаёт log с requestId/status/time/
userId; /ready не исключён. Request/response bodies, JWT и mail secrets в штатном
interceptor не пишутся. Fallback route=`request.url` может включать query в
unmatched requests; strip query полезно до expose, не считать доказанной утечкой.
Tick errors на outage до~720/h; sampling repeated errors, retention, request logs
и dynamic URL labels ограничить без удаления security/admin audit. Google/Render/
Fly external log destinations имеют отдельные quotas, не подключать их в этом
audit ради самого monitoring.

Orphans: journal records, media objects manifests и DELETED tombstones остаются;
STAGING older10min bounded batch16 проверяет reference до cleanup. READY SOURCE
и исторические revisions могут сохранять bytes намеренно. При sync/manual без
timer нужен явный bounded maintenance action; это не повод blanket delete
detached IDs или storage по UUID без DB reference/lease checks. Migration уже
keyset paginated take5, manual command, не вечный expense daemon. Не добавлять
ListObjects на каждый request для «починки orphan».

## Runtime shortlist: Cloudflare Containers и Cloud Run

| Критерий | Cloudflare-centric | Cloud Run + Cloudflare + Neon |
|---|---|---|
| Fixed account floor | $5 Workers Paid | Backend$0 min0; CF router$0/$5 по plan |
| Idle/sleep | Provisioned RAM/disk платные пока running; class default10min incoming inactivity | Request-based min0 idle unbilled; instance может сохраняться warm без billed idle |
| Native dependencies | Текущий Docker с Sharp/Argon2/Prisma | Тот же Docker; согласовать service port и `API_PORT`, не менять Nest |
| Скрытая цена | Worker requests/CPU, per-container DO duration/requests/storage, logs/replicas | Allocated CPU при DB/R2 wait, egress, registry/build/logs, origin adapter |
| Cold start | Nest+Prisma+Neon boot, latency не измерена | Тот же app boot + regional startup, latency не измерена |
| Placement | Нужны constraints near Neon; default near requester/pre-fetched instance | Один region near Neon, price tier проверить для него |
| R2 latency | Один provider не доказывает colocation с R2/Neon | Region→R2 network; убрать лишние verification downloads |
| Origin protection | Worker→DO binding, проверить отсутствие bypass | `*.run.app` не становится private от CF DNS: IAM/ingress/IAP либо проверяемая origin restriction |
| Deploy complexity | Небольшой Wrangler/DO adapter, image rollout/sleep config | Google project/IAM/registry/deploy + CF routing, больше control planes |
| Lock-in | Router adapter proprietary; Nest/state portable | Runtime/IAM config proprietary; Nest/state portable |
| Existing daemon | SQL работает до sleep; shutdown может оборвать operation | Request-only CPU не гарантирует post-response daemon |

DO — обязательный infrastructure adapter Containers, не предложение перенести
business state из Neon. Новая DO scheduling policy beta для обычного Nest
service не нужна. Worker Smart Placement не равен Container placement.
[Placement](https://developers.cloudflare.com/containers/concepts/placement/),
[scheduling policies](https://developers.cloudflare.com/containers/configuration/scheduling-policy/).

Практическая ловушка: `enableInternet=false` в Container разрешает только
allowed HTTP/HTTPS80/443. Neon Prisma TCP5432 и SMTP587 этим не разрешаются;
нельзя копировать такой пример и объявлять portable backend работающим.
[Outbound traffic](https://developers.cloudflare.com/containers/configuration/outbound-traffic/).

Cloud Run IAM-origin требует authenticated proxy requests; Cloudflare Worker
не считается внутренним Google ingress. Нельзя ставить `internal`, предполагая,
что CF пройдёт, либо оставить bypass origin и считать edge IP limits защитой.
External LB/private networking не включён автоматически в compute$0 модель.
HTTP/1 request cap32MiB покрывает single5MiB upload; multipart budget проверяется
при deploy. Nest JWT/role/ownership нужны независимо от защиты origin.
[Access controls](https://docs.cloud.google.com/run/docs/overview/what-is-cloud-run),
[request limits](https://docs.cloud.google.com/run/quotas).

## Остальные провайдеры: sanity check

| Runtime | Minimum, CPU/RAM, idle | Sleep/cold и egress | Docker/static и применимость |
|---|---|---|---|
| Railway | Hobby$5 **включает** $5 usage; actual RAM$10/GB-month, CPU$20/vCPU-month. Idle RAM billed. |5min без **outbound** packets (~5–10min); loop не даёт sleep. Egress$0,05/GB; cold request может502. | Docker да; static через service consume compute, CF export отдельно. Простые CI, app/state portable. [Plans](https://docs.railway.com/pricing/plans), [sleep](https://docs.railway.com/deployments/serverless). |
| Koyeb | Docs Starter base0; Standard1vCPU/1GB$0,0144/h (~$10,71/744h), Eco0,5vCPU/1GB~$5,36/month. Provisioned running resources billed. | Standard min0 idle5min; deep cold1–5s, light~200ms preview. Eco не тот же scale-to-zero; network конфликт ниже. | Docker да, static через service или CF; Free512MB0,1CPU/1h sleep официально не production. App portable. [Instances](https://www.koyeb.com/docs/reference/instances), [sleep](https://www.koyeb.com/docs/run-and-scale/scale-to-zero). |
| Fly.io | Нет current general free tier. Example1GB shared1 always-on$6,70 US/$7,73 Frankfurt. Provisioned CPU/RAM за started time. | min_running0 + proxy stop/suspend: inactive CPU/RAM0, rootfs$0,15/GB-month остаётся. EgressEU$0,02/GB; cold зависит от режима, не измерен. | Docker да, static machine/CF; volume/dedicated IP отдельно, shared IPv4 free. Portable, больше VM config. [Pricing](https://docs.fly.io/about/pricing), [autostop](https://fly.io/docs/reference/fly-proxy-autostop-autostart/). |
| Render | Hobby workspace0 + paid web512MB0,5CPU$7/month или2GB1CPU$25. Provisioned paid idle billed. | Paid zero-idle не baseline. Free15min sleep, wake~1min, не prod recommendation. Hobby5GB transfer, extra$0,15/GB. | Docker да, static sites отдельно. Проще стабильный deploy, хуже zero-idle cost. [Pricing](https://render.com/pricing), [free](https://render.com/docs/free), [egress](https://render.com/docs/outbound-bandwidth). |
| Vercel | Pro$20/month с$20 usage credit; Hobby personal/non-commercial. Fluid active CPU + provisioned memory при invocation, idle0. Frankfurt CPU$0,184/h, RAM$0,0152/GB-h;1M invocations included, extra$0,60/M. | OCI Functions incoming sleep5min; app cold неизвестен. Transfer/edge request quotas отдельно, не смешивать старые buckets и credit. | **Docker/OCI уже да** и Nest zero-config. Standard payload4,5MB конфликтует с single5MiB; без proof не drop-in. Static да, platform-specific config. [Pro](https://vercel.com/docs/plans/pro-plan), [rates](https://vercel.com/docs/functions/usage-and-pricing). |
| Fastly Compute | Usage/free10M Compute requests +100M vCPU-ms; выше$0,50/M req,$0,05/M CPU-ms. Нет обычного Nest container RAM meter. | Request/WASM edge, idle0; CDN отдельно100GB free,EU$0,12/GB;1M CDNreq free затем$0,01/10k. | Static CDN да, **не runtime для OCI/native stack**; серьёзный port или отдельный Docker origin. Высокий lock-in, не MVP shortlist. [Pricing](https://www.fastly.com/pricing), [WASM runtime](https://github.com/fastly/js-compute-runtime). |

Koyeb primary-source conflict: organizations docs дают Starter$0/Pro$29 (usage$10),
FAQ network not yet billed100GB/future$0,04; pricing page показывает Core/included
$10, 1TB network иEU/US$0,02. Не смешивать эти условия и не обещать minimum0
без проверки конкретного offer. [Plans docs](https://www.koyeb.com/docs/reference/organizations),
[FAQ](https://www.koyeb.com/docs/faqs/pricing), [pricing](https://www.koyeb.com/pricing).

Vercel OCI подтверждён свежими official docs2026: `Dockerfile.vercel`/`PORT`,
VCR и existing native dependencies через image. Старый тезис «Docker невозможен»
исключён. Standard4,5MB payload всё ещё опубликован; не объявлять upload совместимым
до проверки. Direct client upload/proxy не внедряется ради выбора Vercel. Старый
250MB bundle cap не считать запретом OCI: есть larger Fluid bundle paths.
[Docker support](https://vercel.com/kb/guide/does-vercel-support-docker-deployments),
[payload cap](https://vercel.com/docs/errors/function_payload_too_large),
[larger bundles](https://vercel.com/kb/guide/troubleshooting-function-250mb-limit).

**Рекомендация, не выбор:** минимальная цена редких requests — Cloud Run
request-based min0. Два control planes вместо трёх и единый CF routing — аргумент
за Containers basic со short sleep и$5 floor. Railway/Render могут быть проще,
но не решают Neon activity; Fly — экономичная Docker альтернатива. Нельзя назвать
CF cheapest без CPU/RSS/network/cold benchmark. Сначала убрать amplification,
затем выбрать runtime; app не переписывать в edge/WASM.

## Открытые решения и минимальный implementation backlog

Ответы не были нужны для завершения аудита. В этом проходе решения не приняты.

| Q | Что решить | Предложение / причина |
|---|---|---|
| Q01 | Sync/manual вместо DEC-097 automatic retry, **включая revoke**; гарантия после crash/outage? | Не утверждено и не пересматривает `DEC-097`. Manual recovery конфликтует с автоматическим revoke ≤5 минут после crash/outage: без execution trigger остановленный процесс не отзывает public media. Не просто снять timer. |
| Q02 | CF Container или Cloud Run; budget и допустимая cold latency? | Два shortlist кандидата; нужен замер и безопасный origin route. |
| Q03 | Нужна custom product analytics на первом запуске? | Если нет — оба flags false + static rebuild; если да — batch/retention и конкретные product questions. |
| Q04 | Neon Free или Launch PAYG; compute ceiling, region и history? | Free не выдерживает180CUh/month; Launch cap/sleep избегает quota suspension. History отдельно. |
| Q05 | Принимаем JSON stale30–60s после hide/publish? | Короткий TTL вместо invalidation service; media revoke отдельно. |
| Q06 | Ignore Query String только для immutable public media host? | All-plan candidate для revoke/cache fragmentation; live proof base/variants. |
| Q07 | Storage/analytics/OTP/journal maintenance policy, retained budget? | Bounded manual cleanup, без daemon; не удалять audit/PII/required revisions без решения. |

Предлагаемые coherent implementation этапы; **не выполняются этим аудитом**:

1. Safety/economics: F11 purge-key proof остаётся live-only. F13/F14 закрыты
   локальным durable fix в upload safety package. F15 proxy/origin protection и
   replica cap, F12 отсутствие origin warmup monitor остаются.
2. Idle fix целиком F01–F03: sync/manual publish/revoke/journal recovery,
   честный outcome/pending/error UI, existing idempotency/media gates.
3. Reduction: Q03 flags или batching, F05 one user lookup, F06 cache whitelist,
   F07 staleTime и explicit invalidation.
4. Upload: F08 safe validation/cheap replay, F09 trusted HEAD verification;
   сравнить commands/bytes/CPU/RSS на одном fixture, сохранить corrupted/mismatch
   checks и original metadata/SOURCE privacy.
5. Post-MVP по измерениям: slim DTO, pagination/index tuning, retention и manual
   orphan maintenance. Не добавлять services/queues/cron/frameworks/новые storage.

Короткий проверочный замер перед deploy: safe synthetic DB + isolated R2 prefix,
idle10–20min и полный publish/edit/revoke; CPU/RSS/wall time, R2 commands/DB calls,
CDN HIT/MISS/base-query purge, Neon activity, origin bypass. Не строить новую
observability platform. Size/pool/concurrency/sleep/probes/cache rules зафиксировать
в versioned deployment config. Credentials не читать в audit и не писать в bundle.

## Проверка результата и ограничения

- Обновлён remote release HEAD `507bb5b422878a38099b70ce7bfd9a59e9c16189`;
  исходное release дерево чистое, docs branch отдельная.
- Owner docs проверены: index/foundation/MVP RFC/architecture/status/security,
  DEC-047/097 и ops release/backup. Продукт portfolio-only сохранён.
- Прочитаны runtime timer/query/auth/analytics/media/health/Docker/Prisma paths
  и existing media tests. Neon/Render pricing markdown получен прямо с official
  pages, web extractor отвергал content-type; source conflicts сохранены.
- Арифметика независимо проверена Python/assertions:1 036 800 idle reads,
  CF basic$11,93036/720h,180CUh, analytics rows/storage, probe intervals,
  Cloud Run$11,08 и media byte directions. Это не load test.
- Code/integration/build/browser suites **не запускались в audit-only task**:
  production/tests не менялись. Previous release green не выдаётся за новый
  прогон. Existing media e2e mock provider R2/purge не доказывает live CDN key,
  actual billing/sleep или cloud SLA.
- Founder decisions, implementation statuses и protected product/design docs
  не менялись. Один постоянный audit обновлялся по ходу работы.

Code release readiness и экономическая готовность выбранной platform — разные
свойства. Аудит не отзывает ранее проверенный пакет и не даёт deployment approval;
он фиксирует условия scale-to-zero и cloud revoke для следующего малого прохода.

## Неизвестные live данные

- Неизвестны selected Container instance type, sleep policy, routing/replica count,
  фактический Neon plan/region, production pool limits и live cache rules.
- Неизвестны реальные page views, длительности запросов/Sharp, размеры derivatives,
  cache hit ratio, частота публикаций и media outage. Модель обязана показывать
  эти переменные явно, не подменяя их придуманными измерениями.

## Верификация артефакта

Документ сверен с указанным release SHA и официальными тарифами на дату аудита.
Арифметика моделей проверена отдельным Python расчётом. Изменений production,
tests, Prisma, dependencies и Pen нет; application suite повторно не запускался,
поскольку этот коммит содержит только аудит. Live billing и cloud settings
остаются непроверенными.

Legacy `S3ImageStore` не задаёт собственные `maxAttempts` и deadline; приведённый
в inventory бюджет двух SDK attempts относится к новому media object store.
Не переносить этот бюджет на legacy путь без отдельной проверки SDK settings.

# Portfolio-only MVP — постоянный release audit

Дата: 2026-10-04. База: `316b6c18c96f854a46d3ee12bddb9194710365e9`.
Проверенная release-ветка: `feature/portfolio-mvp-release`. Media implementation сохранена
в `feature/portfolio-media-lifecycle`; integration package перенесён fast-forward.

## 2026-10-05 — Product correctness follow-up

Ветка `feature/portfolio-google-design`, база `00d7ed6`. Release ref сохраняется.
Этот проход исправляет подтверждённые ошибки публичности и session HTTP boundary;
Google OAuth, визуальные изменения и архитектурный refactoring не входят в пакет.
Критерии: скрытые/заблокированные данные не попадают в catalog hydration после
committed revoke; malformed credentials не вызывают 500; logout очищает invalid
cookie; корректные JWT и гостевые публичные чтения продолжают работать.

Выбраны durable fixes: существующие visibility predicates на hydration query и
локальная строгая валидация auth boundary. Repeatable Read всего каталога — более
широкий вариант с другим snapshot contract; не выбран. Удаление проблемных auth
headers как workaround и подавление ошибок через fallback не применяются.

| ID | Проблема | Severity | Где найдена | Влияние на MVP | Решение сейчас / post-MVP | Причина |
| --- | --- | --- | --- | --- | --- | --- |
| P01 | После выбора catalog ID финальный read проверяет только ID; hide/suspend/ban между запросами может вернуть непубличную работу/автора | P1 | ProductsService.loadPortfolioCatalogPage, SellersService.listPortfolioAuthors; старый A02/R23 | Public visibility / moderation | Сейчас: исправлено, шесть PostgreSQL interleavings проходят; release regression pending | Изменение публичности учитывается при hydration; A02/R23 остаётся Partial вне этой границы |
| P02 | Ошибка разбора Authorization или percent-encoded session cookie выходит из optional/logout guard до проверки токена | P2 | OptionalBearerAuthGuard, LogoutAuthGuard | Media HTTP 500; logout не очищает повреждённую cookie | Сейчас: malformed auth regression и локальная корректировка, IN_PROGRESS | Public media должно сохранять auth failure contract, logout уже поддерживает invalid session |
| P03 | JWT verifier игнорирует четвёртую часть и допускает неканоническую signature encoding | P2 | AuthTokenService.verify | Ослабленная проверка формата сессии; не обход подписи/ownership | Сейчас: strict format regression и проверка signature, IN_PROGRESS | Валидна ровно подписанная JWT serialization |
| P04 | Старый roadmap содержит устаревшие browser verification статусы | P3 docs | 00-EXECUTION-ROADMAP.md, R29/T05 и другие исторические строки | Не runtime blocker | Сейчас: R29/T05 синхронизирован как Partial и связан с актуальным evidence; остальные IDs сохраняют свой acceptance | Full release: 210/2 известных visual, не прежние 29 failures и не полностью green |

Checkpoint: baseline production с новыми tests воспроизводит 11 auth unit
failures (9 passed) и 10 HTTP/DB failures (17 passed). P01: пять visibility races
падают, unpublish case уже проходит и сохраняется как negative regression.
P02: HTTP media 500 вместо 401, logout 500 вместо 201; empty cookie даёт guest
200. P03: extra JWT segment даёт HTTP 200 вместо 401. Evidence:
`/private/tmp/bidplace-product-auth-red.log`,
`/private/tmp/bidplace-product-http-red.log`.
Первый rerun выявил пропущенный import существующего Work predicate в новой
правке (`product-unit-green.log`: 40/2, `product-http-green.log`: 14/13); import
исправлен до commit. Эти логи не являются green evidence. Повторные проверки
IN_PROGRESS. Внешние
deployment gates D01/D03/D04 и Home Opening V01 остаются открытыми.

Граница P01: hydration повторяет visibility predicates. Pagination total всё
ещё относится к первой выборке; page может укоротиться при одновременном revoke.
Изменения после hydration не отзывают уже сформированный response. Согласованный
snapshot и повторное применение search/filter при concurrent republish остаются
post-MVP частью A02/R23; finding целиком не объявляется закрытым.

Targeted v2: unit 42/42, HTTP/DB 27/27, backend typecheck/build 9/9 и lint
exit 0. Evidence: `/private/tmp/bidplace-product-unit-green-v2.log`,
`/private/tmp/bidplace-product-http-green-v2.log`,
`/private/tmp/bidplace-product-api-graph.log`,
`/private/tmp/bidplace-product-api-lint.log`. Эти проверки подтверждают fixes;
полный release gate ещё не запускался.

## Release verification и handoff

Фактический release HEAD, на котором последовательно выполнены все проверки:
`9af7ecc5f4062405014e9b83b9b3b77d4240370b`. Это integration HEAD с docs;
код/tests идентичны подтверждённому `0f1a499`. Release перенесён fast-forward,
конфликтов нет. Текущий evidence commit меняет только этот audit, product status
и design status; application/test tree должен оставаться идентичным проверенному
release HEAD. Финальный deploy SHA определяется этим docs-only commit и указан
в Git release ref/handoff; это не новая версия production/test кода.

| Release gate | Фактический результат | Integration baseline |
| --- | --- | --- |
| `pnpm verify` | exit 0; API 358, mobile 581, integration 112, ops 31; build 8/8 | Совпадает |
| Full Chromium/WebKit, workers=1/retries=0 | 210 passed / 2 failed / 0 skipped / 0 retries, 719.4s, exit 1 | Все 212 статусов/attempts совпадают |
| Dedicated media, workers=1/retries=0 | 2 passed / 0 failed / 0 skipped / 0 retries, 55.8s, exit 0 | Оба статуса/attempts совпадают |

Единственные browser failures — `Home Opening author column matches first-fold
390×860 capture`, один Chromium и один WebKit. V01 — подтверждённый post-MVP debt;
golden/threshold/timeout, production logic и tests не менялись. Новых critical
failures нет. **Release code package принят для normal push/deployment handoff.**
R29/T05 полный visual gate остаётся Partial/open.

Evidence:

- `/private/tmp/bidplace-release-verify.log`;
- `/private/tmp/bidplace-release-browser.log`, `.json`, `-artifacts/`;
- `/private/tmp/bidplace-release-media.log`, `.json`, `-artifacts/`;
- `/private/tmp/bidplace-release-browser-baseline-comparison.json`;
- `/private/tmp/bidplace-release-final-attestation.json` — final release SHA,
  docs-only delta и результат проверки remote ref после normal push;
- `/private/tmp/bidplace-release-regression-source.json` — tracked source SHA256;
  повторно проверен после каждого gate. Только owned test-copy fence port 55433
  отличается; root fence остаётся 5432, как и в integration baseline.

Main checkout `/Users/yayauheny/projects/bidplace` — release branch. Старый
одноимённый каталог `bidplace-portfolio-mvp-release` остаётся detached 69307f8 с
незакоммиченными изменениями и не является источником этого release package.
Inventory остальных checkouts сохранён; чужие изменения не переносились.
Normal push разрешён основателем при этих результатах; force push исключён.
Внешняя конфигурация и deployment в этот проход не входили.

## Финальный результат integration pass (исторический checkpoint)

Проверенный code/test HEAD: `0f1a4996ec1ef6737c8b1888b7ee5b44f1b95aed`,
`feature/portfolio-mvp-integration`. Media/Work implementation — `047f2c7` на
`feature/portfolio-media-lifecycle`. Integration собрана от release `6c0fac7`;
release ref не изменён. Последующий commit обновляет только status/evidence docs.

- **Critical portfolio lifecycle проходит** в Chromium/WebKit: author/auth,
  create/upload/save/submit/moderation/publish/public/PREVIEW/FULL,
  edit/atomic republish/hide/revoke. Unknown upload response не дублирует gallery;
  delivery outage сохраняет старую публикацию и показывает waiting, recovery
  публикует подготовленную revision. Полный HTTP integration также проверяет ban,
  ownership, bad/reused keys, restore, exact purge и retry.
- **`pnpm verify` exit 0**: typecheck/lint, API unit 358, mobile unit 581,
  contracts 32, API-client 28, config 8, database 1, ops 31; integration
  27 files / 112 passed; build 8/8.
- **Default browser: 210 passed / 2 failed**, 0 skipped, 0 retries,
  706.1s (11.8m), exit 1. Единственные failures — V01 Home Opening visual,
  по одному на engine; post-MVP по утверждённому scope. Полный suite не green.
- **Dedicated media browser: 2 passed / 0 failed**, 0 skipped/retries,
  58.0s, exit 0. Реальный Nest/Prisma/Sharp/UI; synthetic R2/purge transport.
- **Критических code blockers больше не обнаружено. Пакет готов к переносу в
  release и проверке release HEAD.** R29/T05 остаётся Partial/open по полному
  gate: два visual failures не скрыты. Новых сервисов/dependencies/architecture,
  timeout/threshold изменений, canonical design edits нет.

Evidence на этом HEAD:

- `/private/tmp/bidplace-portfolio-integration-final-verify.log`;
- `/private/tmp/bidplace-portfolio-integration-final-browser.log`, `.json`,
  `-artifacts/`;
- `/private/tmp/bidplace-portfolio-integration-final-media.log`, `.json`,
  `-artifacts/`;
- `/private/tmp/bidplace-portfolio-integration-final-source.json` — SHA256 tracked
  source, проверен после verify/browser/media; отличается только owned
  disposable fence port в test copy (55433), root остаётся 5432.

До первого public traffic остаются D01 (live R2/CDN/cache/purge), D03
(production startup/TLS/email/restore) и D04 (минимальные portfolio Rules/Privacy).
L01 нужен только если существующие ценные данные должны попасть в production.
В этом code pass внешняя конфигурация и deployment не выполнялись. Push/PR нет.

## Живой журнал проблем

Обновляется во время работы. P1 — безопасность или critical path; P2 — регрессия
вне critical path; P3 — косметика/тестовый debt. Последний приоритет основателя:
безопасный portfolio-only запуск, cosmetic и некритический legacy — post-MVP.

| ID | Проблема | Severity | Где найдена | Влияние на MVP | Решение сейчас / post-MVP | Причина |
| --- | --- | --- | --- | --- | --- | --- |
| W01 | Save/submit wizard отменяет переход поздним history.back | P1 | ProductDraftScreen, frozen baseline и R29 wizard | Блокирует создание/submit | Сейчас: исправлено, все 20 browser wizard проходят; подтверждено browser gate | Источник — cleanup собственного history sentinel после navigation |
| W02 | Повтор upload после потерянного ответа дублирует файл | P1 | ImagesService/client, HTTP и browser outage test | Блокирует надёжный upload | Сейчас: стабильная identity/Blob retry, negative cases проходят; подтверждено media v4 | Нужно повторить уже совершённую запись, а не загрузить новый объект |
| W03 | Повтор submit/approve после неизвестного ответа не подтверждает прежний результат | P1 | ProductsService/AdminModerationService, HTTP lifecycle | Нарушает retry critical path | Сейчас: pending revision replay + exact DONE journal proof; full integration 112/112 passed | Без глобального idempotency framework |
| W04 | Ban оставляет public author/Work и proxy media доступными | P1 | Public selectors, catalogs, HTTP ban после restore | Блокирует безопасную модерацию | Сейчас: active user filters, private cache policy, purge; integration подтверждён | Existing media revoke и public read расходились |
| W05 | Owner/admin не показывает delivery pending/error | P1 | Owner DTO/screens/admin | Блокирует понятный publish | Сейчас: waiting/error notice + polling только active states | Publish уже ждёт медиа; интерфейс должен показывать фактический статус |
| W06 | Нет lazy FULL viewer | P1 | WorkGallery/work-header | Требование critical path | Сейчас: PREVIEW page, выбранный FULL только в mounted viewer; media v4 passed | Существующие image/dialog primitives без нового дизайна |
| W07 | ShareSheet initial focus теряется на entering animation | P2 | AppDialog, оба browser R29 owners | Keyboard/viewer regression | Сейчас: локальный shared fix, 2 browser passed | Reanimated скрывает входящую view во время раннего autofocus |
| W08 | R2 stage происходит до финальной gallery capacity check | P3 | ImagesService.addMedia | Не блокирует; лимит галереи всё равно enforced в locked transaction | Post-MVP: ранняя оптимизация отказа по capacity | Отказ может оставить временный unattached SOURCE до существующего cleanup; replay на полной галерее должен оставаться успешным |
| W09 | Viewer navigation с двумя полными подписями может не поместиться в narrow row | P2 | Новый WorkGallery, intrinsic content buttons | FULL viewer должен работать на 390 px | Сейчас: flexWrap существующего ряда; browser проверяет оба control bounds и второй FULL | Минимальная локальная layout правка без новых размеров/components |
| W10 | При сокращении live gallery во время открытого viewer подпись может сохранить прежний index | P3 | WorkGallery: image index clamp есть, title использует state index | Не блокирует сохранённую gallery / основной flow | Post-MVP, needs browser reproduction | Обнаружено static review; второстепенный UX при background refresh, SOURCE/visibility не затрагивает |
| T01 | Author submit locator выбирает retained profile screens | P2 | author-revision-flow, HTTP 201 и DOM reproduction | Только ложный critical failure | Сейчас: POST/status owner, current-frame locator; оба браузера прошли | Production submit успешен, timeout увеличивать нельзя |
| T02 | Старый three-step creator/private handoff | P2 | creator-profile, actual four-step flow | Только obsolete coverage | Сейчас: заменён отдельным four-step public-links owner после green canonical submit | Старые поля/этапы удалены из portfolio contract; privacy test сохранён |
| T03 | Frost/glass mocks без required biography | P2 | strict public contracts и оба R29 specs | Только stale fixture | Сейчас: исправлены mocks; glass прошёл | Не маскировать schema validation fallback |
| T04 | Frost проверяет catalog geometry/radius на Home | P3 | figma-cover-frost, design-system Home cards | Не блокирует | Сейчас: Work 264×352, Author front 322×430/radius24; подтверждено browser gate | Сверено с design-system Frame47; промежуточная правка ошибочно использовала Work size для Author, production не менялся |
| T05 | Session error test ждёт неверный Dock destination | P2 | figma-error-state, real auth retry | Ложный failure | Сейчас: unknown auth → login; explicit protected retry → profile; подтверждено browser gate | Два разных подтверждённых состояния auth |
| T06 | Home loading test ждёт progressbar | P3 | home-figma / branded InfrastructurePageStatus | Не блокирует | Сейчас: current branded owner, остальные state assertions проходят | UI уже заменён ранее, production не менялся |
| T07 | Browser Back fixture уходит до завершения profile setup | P2 | WebKit dirty/clean Back /cabinet | Ложный failure критического flow | Сейчас: ждать profile content; оба Back проходят | Expected URL и saved-value assertions сохранены |
| T08 | Search overlay tabs требует отсутствие load-more при наличии page 2 | P2 stale test | integration 3d06036, оба engine; Works probe page 2 passed | Только stale assertion; runtime pagination уже существовал до этого пакета | Сейчас: server pagination boundary в mixed-data owner + обязательные isolated Search page-2 owners | Реальный page=2 на 13 работах подтверждён, existing search-panes units покрывают Works/Authors; production не меняется |
| V01 | Home Opening visual mismatch >0.12 | P3 | visual/home-opening-figma, оба браузера | Не блокирует portfolio lifecycle | Post-MVP; тест остаётся failing, golden/threshold не меняются | Основатель исключил косметику из текущего scope |
| E01 | Worklets не исполняется в Node Vitest | P3 | Full mobile unit import | Только test runtime | Сейчас: Vitest bridge adapter, full mobile 581 passed | Реальный bridge проверяется Expo/browser; dependency уже установлен |
| E02 | Prisma advisory lock timeout под parallel build | P3 | Full integration setup | Только test execution | Сейчас: один worker, без увеличения timeout; 112 passed | Разные schemas используют общий migration lock; результаты не считать production defects |
| E03 | Изменение test copy во время browser run включило HMR | P3 | Первый диагностический прогон | Только недостоверное evidence | Сейчас: такой run отброшен, все результаты подтверждены на frozen source | Никогда не sync/build shared packages во время browser verification |
| E04 | Media test routes зарегистрированы после Nest 404-handler; команды fault/tick возвращали 404 | P1 verification | bidplace-work-media-final/v3.log, проверка HTTP statuses | Прежний green НЕ доказывает R2 outage/CDN image delivery | Сейчас: routes до app.init, явный existing tick, fault/status/WebP assertions; media v4: 2 passed, HTTP/WebP asserted | Предыдущий test игнорировал ответы команд и image 404; production retry не меняется |
| E05 | Search authors probe использовал q=discipline, которое не входит в text-search поля | P3 test fixture | initial search proof: works 2 passed, authors 2 failed | Не production defect | Сейчас: explicit fullName-prefix query в isolated fixture, final proof 6/6 passed | q ищет fullName/slug/shortDescription; tag — отдельный filter |
| G01 | Четыре dirty checkout и семь missing/prunable registrations | P3 repo hygiene | Read-only inventory всех 43 worktrees | Не блокирует чистый main release checkout; опасно включать неизвестные изменения | Сейчас: inventory, сохранить чужие изменения; cleanup вне scope | Старый одноимённый detached checkout не является release ref; выбран только подтверждённый Git package |
| L01 | Неизвестен состав ценных legacy данных | P2 conditional | Cutover inventory не подключался | Блокирует только перенос нужных данных | Минимальный importer уже сделан в предыдущем scope и проверен; больше tooling не делать | Не запускать на личной/production БД без inventory/backup/maintenance |
| D01 | Live R2 custom domain/cache/purge не проверен | P1 deployment gate | Transport doubles, внешние bucket/domain не подключались | До публичного traffic нужно подтвердить | Deployment acceptance, не новый code scope | Green application tests не доказывают Cloudflare config или ≤5 минут purge |
| D02 | Release transfer и release-source regression требовали подтверждения | P1 closed | release 9af7ecc, текущий handoff | Critical code blocker закрыт | Сейчас: FF без конфликтов; verify green, full 210/2 известных visual, media 2/2; normal push следующий | Все per-test статусы совпадают с baseline, production/test tree не меняется |
| D03 | Production startup/TLS, реальная email delivery и restore drill не подтверждены | P1 deployment gate | RFC §16.9, test email transport; площадка/SMTP не выбраны в сообщениях основателя | Не code blocker этого прохода; проверить до public traffic | Deployment pass, без hosting/SMTP implementation здесь | Unit/browser doubles не доказывают внешнюю доставку или production конфигурацию; production env fail closed |
| D04 | Portfolio Rules/Privacy ещё не подготовлены по сообщению основателя | P1 public-launch gate | Ответ основателя, RFC §13 / §16.6 | До первого публичного запуска нужен минимальный пакет фактического portfolio продукта | Отдельный launch gate; технические проверки не останавливает | Не создавать marketplace документы, не выдавать technical green за выполнение RFC legal gate |

Checkpoint перед integration: full unit зелёный (358 API / 581 mobile, включая cache
negative case), typecheck/lint/build 17/17; integration 112/112, включая bad key,
multi-file key и prior-revision replay 409. Browser v5: 40 passed / 2 failed
(только frost Author geometry); все author/Work, session retry, links validation,
ShareSheet и Home states passed в обоих браузерах. Media v4 — **2 passed / 0 failed,
55.5s**, с исправленным E04: HTTP fault/tick 200, WebP CDN 200, два FULL, responsive
control bounds, republish/revoke. Полный pnpm verify exit 0, frost v4 — 2 passed / 0 failed, 43.6s.
V01 остаётся post-MVP. Code blockers critical portfolio flow больше не обнаружены.
Integration checkpoint: пакет сохранён в `047f2c75f6cedca193879f932cb58013d10952ea`.
Создана `feature/portfolio-mvp-integration` от release `6c0fac7`, fast-forward
включил media package; release ref не изменён. Durable fix для test coverage —
перенести deterministic page-2 owners из `b9d0f5f` и убрать только прежние условные
assertions. Acceptable workaround — оставить обе группы assertions, но это сохраняет
избыточный условный owner. Hack — отключить pagination/ослабить assertions — отвергнут.
Старые status docs и уже исправленные author locators из test package не переносятся
поверх новых. Full browser matrix готовится, source во время прогона заморожен.

## Scope и результат

Продолжение существующего R2 lifecycle, без изменения выбранной архитектуры.
Новых сервисов, зависимостей, таблиц, очередей и workers нет. Private SOURCE,
public derivatives, журнал и retry остаются в существующем NestJS.

Исправленные production defects:

- Work wizard после save/submit мог выполнить отложенный `history.back()` из
  cleanup уже после перехода и вернуть пользователя на предыдущий экран. Теперь
  успешная запись сначала завершает traversal собственного history sentinel,
  затем reset/navigation; проверки auth epoch/generation сохраняются после await.
  Dirty browser Back сохраняет данные до выхода.
- Потерянный HTTP-ответ upload приводил к новой загрузке или требовал нового
  выбора файла. HTTP `Idempotency-Key`, стабильный ключ каждого файла в client и
  retry выбранных Blob дают одну галерею. Идентичность включает owner, purpose,
  Work и checksum; иной файл с тем же ключом и повтор из предыдущей revision
  получают 409. Двойной submit возвращает текущую pending revision. Повтор approve
  после завершения доставки подтверждается DONE-записью существующего журнала,
  без второй публикации/audit; неправильный timestamp остаётся 409.
- После user ban public queries и proxy выдачи проверяли APPROVED автора, но не
  active пользователя. Теперь Work/Author/catalоgs, фото и связанные изображения
  закрываются сразу; затем существующий executor удаляет public objects и делает
  exact-URL purge. Приватное чтение admin не получает public Cache-Control.
- ShareSheet пытался установить фокус, когда входящая Reanimated view ещё была
  скрыта. Shared AppDialog завершает initial focus после entering animation,
  не перехватывая уже установленный фокус внутри диалога. Escape/return focus
  сохраняются; используются установленный Worklets и прежние motion tokens.

Завершённый runtime/UI:

- Owner Work detail возвращает latest PUBLISH `publication`; owner Work,
  author profile и admin показывают ожидание/ошибку доставки. Pending/Running/
  Failed обновляются каждые 5 секунд; Done/Cancelled останавливают polling.
- Work page монтирует PREVIEW. FULL монтируется только после открытия viewer,
  для текущего изображения; закрытие демонтирует FULL. Legacy URL без FULL
  сохраняет прежний просмотр. Loading/error используют ResilientRemoteImage,
  viewer — существующий AppDialog, кнопки и tokens.
- Одноразовый import использует существующие stage/attach/restore. Пять owners,
  keyset pagination, MIME/length/checksum, CAS привязки, dry-run по умолчанию,
  повтор после сбоя и сохранение старых Bytes. Новый migration framework отсутствует.

## Acceptance и verification

Изолированная копия tracked source без личных dotenv; Node 22.20.0,
pnpm 11.7.0; собственный PostgreSQL 16 на 55433. Реальные NestJS, HTTP,
Prisma, Sharp и формы; только R2/purge transport синтетический.
Browser: один worker, Chromium → WebKit, retries 0.

Основной owner: `e2e/work-media-lifecycle.spec.ts` +
`playwright.media.config.ts` + test-only `media-server.mjs`.

```text
create → upload с потерянным ответом → retry без дубля → save → submit
→ moderation → delivery outage/ожидание → public 404 → recovery
→ public PREVIEW → viewer FULL → edit → replace image → submit
→ republish outage, старая revision остаётся public → recovery/atomic pointer
→ старый derivative удалён → hide → public 404/удаление нового derivative
```

Viewer дополнительно проверяет close focus, Escape/return focus, reduced motion
и отсутствие overflow при 390/1024/1440. HTTP owner дополняет browser permissions,
checksum conflict, duplicate submit/approve, stale timestamp, hide/unhide, ban,
catalog exclusion, exact purge и сохранение SOURCE.

| Gate | Итог | Evidence |
| --- | --- | --- |
| Полный `pnpm verify` | Exit 0: typecheck/lint, unit, ops, E2E fence, integration, builds | `/private/tmp/bidplace-work-verify-final.log` |
| Unit | config 8, API 358, contracts 32, API client 28, database 1, mobile 581 passed | тот же verify log |
| API integration | 27 files / 112 passed, без пропущенных cases | тот же verify log + `bidplace-work-integration-v3.log` |
| Build | 8/8 tasks, API + Expo web/Android/iOS bundles | тот же verify log |
| Ops | 31 passed | verify log + `bidplace-work-ops-final.log` |
| Critical author/Work и R29 owners | 40 passed, 2 failed только frost geometry; все critical owners passed в обоих браузерах, 0 retries | `/private/tmp/bidplace-work-critical-v5.log` / `.json`, artifacts рядом |
| Полный Work media lifecycle | **2 passed, 55.5s**, 0 retries/skips; E04 исправлен, asserted HTTP/WebP/fault/tick | `/private/tmp/bidplace-work-media-v4.log` / `.json`, `-artifacts/` |
| Frost follow-up | 2 passed, 43.6s, 0 retries/skips; geometry/radius сверены с Home Frame47 | `/private/tmp/bidplace-work-frost-v4.log` / `.json` |
| Home Opening visual | 2 failures воспроизведены; post-MVP, исходный порог 0.12 | `/private/tmp/bidplace-work-critical-final.log` / `.json` |

Изменения code/test проверены до commit на frozen candidate; документация
обновляется после результатов. Browser DB fence только в изолированной копии
адаптирован к собственному порту 55433. В полном verify восстановлен исходный
fence 5432; root fence не менялся и прошёл.

Исторические прогоны не перезаписаны:

- `/private/tmp/bidplace-work-r29-targeted.log`: 57 passed / 17 failed,
  6.6m; воспроизведение и классификация.
- `/private/tmp/bidplace-work-critical-v3.log`: 24 passed / 2 failed,
  2.4m; оба author сценария и все 20 Work wizard passed; ShareSheet ещё failed.
- `/private/tmp/bidplace-dialog-fixed.log`: 2 passed, 37.8s; ShareSheet исправлен.
- `/private/tmp/bidplace-work-media-browser-v2.log`: 2 passed, 62.2s;
  **недостаточное evidence**, E04: не проверялись ответы test commands и CDN
  image responses. Не засчитывать как R2 outage/media acceptance.
- `/private/tmp/bidplace-work-critical-final.log` / `.json`: 36 passed / 8 failed,
  4.0m; выявлены дополнительные stale creator locator, Home card geometry и
  конечное ожидание auth retry. Они исправлены для следующего прогона.
- `/private/tmp/bidplace-work-unit-final.log`: первый полный unit run выявил
  отсутствие Vitest adapter для native Worklets и асинхронный JSDOM traversal.
  Adapter исправлен; отдельный delayed-pop test сохраняет проверку ожидания.
- `/private/tmp/bidplace-work-integration-final.log`: 80 passed / 32 not run из-за
  Prisma migration advisory lock под параллельным build. Timeout не увеличен;
  последовательный `/private/tmp/bidplace-work-integration-v2.log` — 112 passed.

### Классификация всех 29 historical R29 failures

Источник: `b9d0f5f`, `/private/tmp/bidplace-r29-full-after-20261004.json`:
204 tests, 175 passed / 29 failed, 0 skipped / retries. Это отдельная ветка
`fix/browser-suite-scope`; её пакет pagination owner ещё не интегрирован здесь.

| Historical failure | Браузеры / число | Класс | Причина и owner |
| --- | --- | --- | --- |
| City publication | Chromium / 1 | STALE TEST | Гонка save-and-exit; исправлена ранее на этой ветке. Current test ждёт выхода и выбирает unique slug. |
| New author four-step submit | оба / 2 | STALE TEST | HTTP 201/PENDING_REVIEW воспроизведены; locator видел несколько retained profile frames. Owner ждёт конкретный submit и текущий status. |
| Three-step creator/private handoff | оба / 2 | DUPLICATE / OBSOLETE COVERAGE | Старый step/URL slug/private handoff вне текущей application. До замены four-step owner прошёл оба браузера. Replacement сохраняет отдельную validation публичных ссылок; public privacy owner остаётся. |
| Cover frost | оба / 2 | STALE TEST | Mock не содержал required biography; далее ожидал catalog 366×488 на Home вместо Work 264×352 / Author front 322×430 (design-system). Frost/pixel assertions сохранены. |
| Session check failure on Home | оба / 2 | STALE TEST | При неизвестной auth Dock ведёт login. Explicit profile navigation сохраняет protected retry; после успешного retry authenticated user остаётся profile. |
| Dock glass samples page | оба / 2 | STALE TEST | Mock не содержал required biography; live blur assertions сохранены. |
| ShareSheet focus/Escape/download | оба / 2 | REAL DEFECT | Initial focus проигрывал entering animation. Shared fix подтверждён в обоих браузерах. |
| Home loading/error/broken/zoom/motion | оба / 2 | STALE TEST | Ожидал progressbar вместо branded infrastructure loading owner. Проверки остальных states сохранены. |
| Work keeps later steps after step 1 | оба / 2 | REAL DEFECT | History cleanup отменял successful save/navigation. |
| Work patches existing draft → step 2 | оба / 2 | REAL DEFECT | Та же navigation race. |
| Work validation without locking tabs | оба / 2 | REAL DEFECT | Та же navigation race на save/переходе; validation assertions сохранены. |
| Work persists values before submit | оба / 2 | REAL DEFECT | Та же navigation race; persisted values проверяются. |
| Work saves dirty draft before close | оба / 2 | REAL DEFECT | Та же navigation race; restore по id проверяется. |
| Work dirty browser Back | WebKit / 1 | STALE TEST | Previous profile setup не завершился: Back пришёл в cabinet. Fixture теперь ждёт profile content перед Work navigation; save и восстановление values проверяются. |
| Work clean browser Back | WebKit / 1 | STALE TEST | Та же fixture history race, прежний expected profile URL сохранён. |
| Home Opening golden | оба / 2 | REAL DEFECT | Visual mismatch воспроизведён выше неизменного 0.12. Golden/threshold/tokens/.pen не правились. Остаточный visual parity defect. |

Итого: 14 REAL DEFECT (12 runtime исправлены, 2 visual остаются),
13 STALE TEST, 2 DUPLICATE / OBSOLETE COVERAGE. Таймауты существующих Work/
author tests не увеличивались; тесты не удалялись и не отключались ради green.
R29/T05 остаётся открытым: targeted evidence не заменяет full integration gate.

## Минимальный legacy cutover

Инструмент `apps/api/src/import-legacy-media.ts` не запускался на реальной базе.
Не делалась инвентаризация личных данных или чтение dotenv/credentials.
Если существующие данные нужны в первой production базе, оператор:

1. Делает backup; останавливает записи и public traffic.
2. Передаёт конфигурацию серверу безопасным существующим способом.
3. После API build запускает dry-run:

   ```bash
   node apps/api/dist/import-legacy-media.js
   ```

4. Только после проверки inventory:

   ```bash
   node apps/api/dist/import-legacy-media.js --apply --maintenance-confirmed
   ```

5. При ошибке сохраняет maintenance и повторяет. Проверяет публичные derivatives
   и страницы до включения трафика. Bytes сохраняются; это не авторизует destructive
   demo seed в production. Состав ценных исходных данных пока не установлен.

## Remaining gates и integration recommendation (исторический integration checkpoint)

- Реальный R2 custom domain/cache/purge ещё не проверен: транспортные doubles
  доказывают application flow, а не конфигурацию Cloudflare или SLA ≤5 минут.
- Legacy import нужен только при сохранении имеющихся данных; исходный объём
  не исследовался и не переносился. Инструмент проверен на disposable PostgreSQL.
- Home Opening visual parity остаётся реальным дефектом. Он не мешает проверить
  portfolio lifecycle на временном integration HEAD, но full visual gate не green.
- Полный Chromium/WebKit regression на temporary integration 0f1a499 выполнен:
  210 passed / 2 post-MVP visual failed; dedicated media 2 passed. Перенос и
  regression на `feature/portfolio-mvp-release` ещё не выполнены. Push/PR нет.

**Integration regression завершён; пакет готов к переносу в release.** Critical
code blockers закрыты, backend/local verify зелёный; первый public deployment
ещё требует внешних gates.
После интеграции нужна проверка конкретного integration/release HEAD и внешних
D01/D03/D04 gates. Cosmetic V01 и небольшие W08/W10 не задерживают этот code pass.

Пакет включает media kernel от 316b6c1 и этот Work/author/runtime follow-up.
Integration handoff:

1. Выполнено: temporary integration от `feature/portfolio-mvp-release` включает
   media package. Release ref не менялся.
2. Выполнено: test scope package `b9d0f5f` сверен с текущими author locators и
   creator replacement; deterministic page-2 owners сохранены, старые статусы
   не перенесены поверх новых. Дополнительный T08 подтверждён и исправлен.
3. Выполнено на source HEAD 0f1a499: `pnpm verify`, full default browser matrix
   (210 passed / 2 post-MVP visual failures, 0 retries) **и media gate** (2 passed).
   Команды для повторения gate:

   ```bash
   pnpm --filter @bidplace/mobile exec playwright test --workers=1 --retries=0
   pnpm --filter @bidplace/mobile exec playwright test --config=playwright.media.config.ts --workers=1 --retries=0
   ```

   Требуется disposable DB по исходному E2E fence. Default matrix не запускает
   media scenario, поскольку ему нужен отдельный test transport server. Не
   отключать failing visual tests и не менять threshold; их post-MVP disposition
   виден в audit, полный R29/T05 не объявляется VERIFIED этим targeted pass.
4. После приемлемого integration regression переносить подтверждённый пакет в
   release и проверять release HEAD. Deploy/startup/live-provider acceptance
   выполняются по существующему launch checklist; hosting/SMTP/Google/monitoring
   и новая infrastructure не реализовывались здесь.

## Integration execution checkpoint

`3d060361db61536d673f1da8aa32207f05171ef9` — temporary integration candidate,
release ref остаётся `6c0fac75dc3557ffbe2aad1824c6b0585028a1b3`.
Из test package перенесены четыре pagination files; author fixes уже содержатся
в media package. Старые product-status записи не копировались поверх новых.
Полный `pnpm verify` на integration candidate завершён: exit 0; API 358, mobile
581, integration 112; build 8/8. Evidence:
`/private/tmp/bidplace-portfolio-integration-verify.log`. Source manifest после
verify совпадает по всем tracked files. Default browser matrix выполняется, 208 cases / 1 worker / 0 retries.
Chromium достиг Work wizard; author/auth/page-2/ShareSheet/Home states прошли,
Chromium завершён: новый Search overlay tabs failure T08 и ожидаемый visual V01.
Work/auth/author/page-2 owners прошли; WebKit выполняется. Итог пока не зафиксирован.
Tracked source SHA256 manifest сохранён в
`/private/tmp/bidplace-portfolio-integration-source.json`. Test copy без dotenv.
Для browser-run будет изменён только ожидаемый порт disposable fence на 55433,
который принадлежит этому прогону; production/root fence сохраняет 5432.
Во время browser matrix code/build shared packages не меняются.

First full integration matrix completed on 3d06036: **204 passed, 4 failed,
0 skipped, 0 retries, 11.7m, exit 1**. Both failures per browser: T08 Search
expects no load-more despite existing pagination, and V01 Home Opening visual.
All author/auth/Work/page-2 runtime owners passed in both engines. Evidence:
`/private/tmp/bidplace-portfolio-integration-browser.log`, `.json`, `-artifacts/`.
T08 will be reproduced with 13 matching works / 9 authors before updating its
stale expectation. Durable fix: preserve current runtime pagination and assert
actual server page boundary; acceptable workaround: conditional check in existing
mixed-data owner only; hack: remove the assertion with no replacement — rejected.

Search proof before stale assertion update: works page 2 passed Chromium/WebKit;
authors 2 failures caused by new probe fixture query E05, not runtime. Evidence:
`/private/tmp/bidplace-portfolio-search-proof.log`, `.json`, `-artifacts/`.
The author fixture now exposes its fullName prefix explicitly; no query contract
change. Mixed-data Search owner now checks the real first response's pagination.
Existing runtime `WorksSearchPane/AuthorsSearchPane` and load-more unit behavior
are unchanged. Full final matrix and dedicated media gate are next.

Search final targeted gate: **6 passed, 0 failed, 0 skipped, 0 retries,
48.9s, exit 0**, both engines. Required Works 13→12+1 and Authors 9→8+1,
same q/sort on page 2, last href once, no duplicates, no button after last page;
updated tabs/history owner passed. Lint and mobile typecheck exit 0. Evidence:
`/private/tmp/bidplace-portfolio-search-final.log`, `.json`, `-artifacts/`.
T08 confirmed **STALE TEST**, no production Search changes. E05 corrected.
Final integration commit is being saved; then full verify/default/media gates.

Final integration candidate `0f1a4996ec1ef6737c8b1888b7ee5b44f1b95aed`:
`pnpm verify` **exit 0**, API 358 / mobile 581 / integration 112 / ops 31,
8/8 build tasks. Evidence: `/private/tmp/bidplace-portfolio-integration-final-verify.log`.
Final tracked-source manifest matches after verify; source unchanged except
owned disposable fence port in the test copy. Full browser 212-case matrix
is starting; media gate follows. Release ref is unchanged.

Final matrix checkpoint: Chromium auth/author/Work wizard, updated Search tabs
and both mandatory Search page-2 owners passed on 0f1a499. No new runtime
failure markers. Source remains frozen; WebKit and dedicated media are pending.

Final full browser matrix on 0f1a499: **210 passed / 2 failed / 0 skipped /
0 retries / 11.8m / exit 1**. Only failures: V01 Home Opening visual, one per
engine; both classified post-MVP. All auth/author/Work, old R29 runtime owners,
mandatory catalog/Search page 2 passed. Threshold/golden unchanged. Evidence:
`/private/tmp/bidplace-portfolio-integration-final-browser.log`, `.json`,
`-artifacts/`. Source SHA256 rechecked: only owned test-copy fence port differs.
Dedicated media gate starts on the same frozen source.

Final dedicated media gate completed: **2 passed, 0 failed, 0 skipped,
0 retries, 58.0s, exit 0** on the same 0f1a499 source. Source manifest still
matches except the owned fence port. Final summary above supersedes intermediate
checkpoints. No live provider or production data was accessed.

Own disposable `bidplace-media-integration` removed after all runs completed.
Evidence files remain; user PostgreSQL and production state were not changed.

## Release transfer pass — 2026-10-04

Founder request: transfer confirmed 9af7ecc package to release, sequentially
verify/default-browser/media, then normal push if baseline matches. No code/test,
visual, threshold, timeout or provider changes in this pass.

Refs fetched from origin successfully. Before transfer: local release 6c0fac7,
remote release 37527d2; both are ancestors of confirmed integration 9af7ecc.
Durable fix selected: `merge --ff-only 9af7ecc` preserves the exact tested tree.
Acceptable workaround: cherry-pick/recreate package, unnecessary history/conflict
risk; hack: force-push or ignore unknown remote changes — rejected.

Transfer completed without conflicts. Actual release verification HEAD:
`9af7ecc5f4062405014e9b83b9b3b77d4240370b`. Diff vs integration HEAD is empty;
diff vs tested code/test 0f1a499 contains only four docs. Frozen source manifest:
`/private/tmp/bidplace-release-regression-source.json`. Results pending.

Worktree inventory: 43 registrations, 32 clean, 4 dirty, 7 missing/prunable;
read-only check used `--no-optional-locks` / disabled fsmonitor. Dirty unrelated
checkouts: figma-visual-parity (artifacts), mobile-web-final-validation
(artifacts), rejected-product-recovery (code/docs), old detached checkout
`bidplace-portfolio-mvp-release` at 69307f8 (code/tests/docs). None was reset,
cleaned, switched or merged. Main release checkout was clean before transfer.
Detailed inventory: `/private/tmp/bidplace-release-worktree-inventory.json`.

Sequential plan: `pnpm verify` → full Chromium/WebKit (workers=1/retries=0)
→ dedicated media (workers=1/retries=0). Only known V01 visual failures accepted
as post-MVP. Then docs-only evidence commit; verify code/test identity to this
release HEAD before normal push. No provider/deployment work.

Release gate 1 completed on 9af7ecc: `pnpm verify` **exit 0**. Typecheck/lint,
unit/ops/fence, backend integration and build pass; build 8/8 (Turbo cache).
Evidence: `/private/tmp/bidplace-release-verify.log`. Source SHA256 matches after
verify. For browser only, owned test-copy fence port changes to 55433; root fence
stays 5432, same isolation exception as integration baseline. Full browser next.

Release browser checkpoint: Chromium completed auth/author/Work, catalog/Search
page 2 and history owners. Only known V01 visual failure so far; WebKit starts.
Frozen verification copy unchanged; main checkout has audit-only progress edits.

Release gate 2 completed: **210 passed / 2 failed / 0 skipped / 0 retries /
719.4s / exit 1**. Only known V01 Home Opening visual
failures, one per engine. All 212 per-test statuses and attempt/retry counts
match integration baseline, not just totals. Source checksum still matches
except the owned fence port. Evidence: `/private/tmp/bidplace-release-browser.log`,
`.json`, `-artifacts/`; comparison:
`/private/tmp/bidplace-release-browser-baseline-comparison.json`.
Dedicated media gate runs next on the same frozen 9af7ecc source.

Release gate 3 completed: **2 passed / 0 failed / 0 skipped / 0 retries /
55.8s / exit 0**. Per-test statuses/attempts match integration
media baseline. Frozen source manifest rechecked after all three sequential gates.
All requested checks completed; final changes limited to evidence/status docs.

Own `bidplace-release-regression` stopped/removed after all gates. Evidence retained.

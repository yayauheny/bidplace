# Portfolio-only MVP — постоянный release audit

Дата: 2026-10-04. База: `316b6c18c96f854a46d3ee12bddb9194710365e9`.
Ветка: `feature/portfolio-media-lifecycle`. Release —
`feature/portfolio-mvp-release`; перенос в неё не выполнялся.

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
| V01 | Home Opening visual mismatch >0.12 | P3 | visual/home-opening-figma, оба браузера | Не блокирует portfolio lifecycle | Post-MVP; тест остаётся failing, golden/threshold не меняются | Основатель исключил косметику из текущего scope |
| E01 | Worklets не исполняется в Node Vitest | P3 | Full mobile unit import | Только test runtime | Сейчас: Vitest bridge adapter, full mobile 581 passed | Реальный bridge проверяется Expo/browser; dependency уже установлен |
| E02 | Prisma advisory lock timeout под parallel build | P3 | Full integration setup | Только test execution | Сейчас: один worker, без увеличения timeout; 112 passed | Разные schemas используют общий migration lock; результаты не считать production defects |
| E03 | Изменение test copy во время browser run включило HMR | P3 | Первый диагностический прогон | Только недостоверное evidence | Сейчас: такой run отброшен, все результаты подтверждены на frozen source | Никогда не sync/build shared packages во время browser verification |
| E04 | Media test routes зарегистрированы после Nest 404-handler; команды fault/tick возвращали 404 | P1 verification | bidplace-work-media-final/v3.log, проверка HTTP statuses | Прежний green НЕ доказывает R2 outage/CDN image delivery | Сейчас: routes до app.init, явный existing tick, fault/status/WebP assertions; media v4: 2 passed, HTTP/WebP asserted | Предыдущий test игнорировал ответы команд и image 404; production retry не меняется |
| L01 | Неизвестен состав ценных legacy данных | P2 conditional | Cutover inventory не подключался | Блокирует только перенос нужных данных | Минимальный importer уже сделан в предыдущем scope и проверен; больше tooling не делать | Не запускать на личной/production БД без inventory/backup/maintenance |
| D01 | Live R2 custom domain/cache/purge не проверен | P1 deployment gate | Transport doubles, внешние bucket/domain не подключались | До публичного traffic нужно подтвердить | Deployment acceptance, не новый code scope | Green application tests не доказывают Cloudflare config или ≤5 минут purge |
| D02 | Release integration HEAD ещё не собран/проверен | P1 release gate | feature/portfolio-mvp-release | Нельзя назвать release branch ready | После critical gate подготовить handoff; не merge автоматически | Существует отдельный test branch и итоговый full regression не проводился |
| D03 | Production startup/TLS, реальная email delivery и restore drill не подтверждены | P1 deployment gate | RFC §16.9, test email transport; площадка/SMTP не выбраны в сообщениях основателя | Не code blocker этого прохода; проверить до public traffic | Deployment pass, без hosting/SMTP implementation здесь | Unit/browser doubles не доказывают внешнюю доставку или production конфигурацию; production env fail closed |
| D04 | Portfolio Rules/Privacy ещё не подготовлены по сообщению основателя | P1 public-launch gate | Ответ основателя, RFC §13 / §16.6 | До первого публичного запуска нужен минимальный пакет фактического portfolio продукта | Отдельный launch gate; технические проверки не останавливает | Не создавать marketplace документы, не выдавать technical green за выполнение RFC legal gate |

Текущий checkpoint: full unit зелёный (358 API / 581 mobile, включая cache
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

## Remaining gates и integration recommendation

- Реальный R2 custom domain/cache/purge ещё не проверен: транспортные doubles
  доказывают application flow, а не конфигурацию Cloudflare или SLA ≤5 минут.
- Legacy import нужен только при сохранении имеющихся данных; исходный объём
  не исследовался и не переносился. Инструмент проверен на disposable PostgreSQL.
- Home Opening visual parity остаётся реальным дефектом. Он не мешает проверить
  portfolio lifecycle на временном integration HEAD, но full visual gate не green.
- Полный Chromium/WebKit regression на временном integration HEAD, затем на
  `feature/portfolio-mvp-release` — ещё не выполнен. Никакого merge/push/PR нет.

**Пакет готов к integration regression.** Critical code blockers закрыты, полный
backend/local verify зелёный; это не подтверждение первого public deployment.
После интеграции нужна проверка конкретного integration/release HEAD и внешних
D01/D03/D04 gates. Cosmetic V01 и небольшие W08/W10 не задерживают этот code pass.

Пакет включает media kernel от 316b6c1 и этот Work/author/runtime follow-up.
Подготовка integration:

1. Создать временный integration HEAD от актуального
   `feature/portfolio-mvp-release` и интегрировать media package. В этом проходе
   release ref не менялся.
2. Сверить отдельный test scope package `b9d0f5f` с текущими author locator и
   creator replacement: не терять deterministic page-2 owners; документацию
   согласовать с этим audit, а не переносить старые статусы поверх новых.
3. На том же source HEAD выполнить `pnpm verify`, полный default browser matrix
   (0 retries) **и отдельный media gate**:

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

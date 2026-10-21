# Portfolio MVP — release gates

Дата среза журнала: 2026-10-06…10-07. Подневные прогоны, SHA деплоев и классификация старых падений тестов сняты с рабочего дерева.

Полный журнал: `git show d0efc03b:docs/audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md`.

Открытые launch gates из этого среза (не перепроверялись в этой очистке): **D01**, **D03**, **D04**. Строки таблицы со статусом «Сейчас: исправлено» — закрытые на том checkpoint дефекты, не новый прогон. Не ставьте им `Done` заново без свежей проверки.

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
| D04 | Legal pack подготовлен 12 октября (DEC-118); подключение и publication inputs остаются | P1 public-launch gate | [Единый юридический аудит](../../legal/00-FINAL-LEGAL-AUDIT.md), RFC §13 / §16.6 | Тексты в `docs/legal/site`; незаполненные реквизиты, analytics legal basis и runtime consent/cleanup требуют завершения | Отдельный launch gate; технические проверки не останавливает | Не выдавать подготовку текстов или technical green за готовность публикации |

Checkpoint перед integration: full unit зелёный (358 API / 581 mobile, включая cache
negative case), typecheck/lint/build 17/17; integration 112/112, включая bad key,
multi-file key и prior-revision replay 409. Browser v5: 40 passed / 2 failed
(только frost Author geometry); все author/Work, session retry, links validation,
ShareSheet и Home states passed в обоих браузерах. Media v4 — **2 passed / 0 failed,
55.5s**, с исправленным E04: HTTP fault/tick 200, WebP CDN 200, два FULL, responsive
control bounds, republish/revoke. Полный pnpm verify exit 0, frost v4 — 2 passed / 0 failed, 43.6s.
V01 остаётся post-MVP. Code blockers critical portfolio flow больше не обнаружены.

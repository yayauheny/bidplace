# Повторное ревью draft-restore

Статус: IN PROGRESS. Проверяемый HEAD `10cb5a33`, база `cc611483`, checkout `/Users/yayauheny/projects/bidplace-seller-profile-structure`. Аудит ведётся отдельно в ветке `fix/draft-restore-audit` основного checkout. Код приложения не меняется.

## Порядок и критерии

1. R1–R4/O1: восстановление форм и истории, холодная загрузка, типы и ревизии.
2. R5/R8/storage: logout, подтверждённое сохранение и ошибки хранения.
3. R9: update → submit, поздний ввод, session guards.
4. R6/R10/R7: history lifecycle, abort auth, публичные ссылки.
5. План аудита и документация: доказательства закрытия, приоритет следующей волны.

Каждая находка содержит сценарий, источник, влияние сейчас, риск будущих изменений, минимальный durable fix и проверку. Предположения не считаются подтверждёнными дефектами. Число строк само по себе не замечание. Сервер, SDK, визуальный дизайн и глобальная переделка history вне scope.

## Исходные факты

- Рабочее дерево проверяемой ветки чистое. Diff: 27 файлов, +2534/−460, 13 коммитов после `cc611483`.
- Handoff утверждает закрытие всех R1–R10/O1/storage и 845 passing mobile tests; это сведения исполнителя, ещё не независимая проверка.
- Граф generation `2026-10-15T20:43:45Z`: coverage возвращает `metadata_changed` для story/local restore, AuthViewport, draft guard/save и storage. Материальные выводы проверяются по текущим исходникам.
- Первая попытка делегировать story-review остановилась из-за лимита дочернего исполнителя; этот ответ не является результатом ревью. Проверка продолжается основным ревьюером.
- Основной аудит предыдущего этапа: `/Users/yayauheny/.codex/visualizations/2026/10/15/01a1419d-e107-7f51-ba62-d6b0d4498018/draft-routing-review.md`; исходный handoff волны 1 находится рядом в `draft-restore-wave-1-prompt.md`.

## Журнал

- Срез 0: зафиксированы scope, SHA, исходные заявления и ограничения графа. Проверки и находки будут добавляться ниже по мере подтверждения.

## Срез 1 — восстановление и формат данных

Независимая проверка HEAD: 50/50 штатных тестов (local-form-restore, story editor, product-save-race, browser guard, local-form-draft). Дополнительные изолированные проверки в `/private/tmp/draft-routing-review/wave-review.spec.ts` и `/private/tmp/bidplace-story-review/wave-review.spec.ts`: **4/4 красные assertions**, не ошибки запуска. Они не добавлены в код проекта.

### DR-01 — P1: ревизия истории не входит в контракт локального восстановления

- Источники: `apps/mobile/src/features/sellers/use-product-story-editor.ts`: схема `storyLocalDraftSchema`, `restoreDraft`, identity-effect; `apps/api/src/products/product-story.ts:204` (`copyRevisionStory`), `products.service.ts:267` (новая editing revision).
- Сценарий A: чистая история r1/token4 → refetch r2/token0 с другим текстом. Редактор сохраняет текст r1, просто меняя identity. Ветка sameProduct+clean+serverHydrated не доказывает, что это собственное сохранение. Тест ожидает `New revision`, получает `Old`.
- Сценарий B: в storage остался v2/token4 предыдущей ревизии; открывается r2/token0. Ключ account/product и проверка `stored.token < serverToken` пропускают старый черновик, который замещает историю r2. Тест ожидает `New revision`, получает `Old local draft`.
- Серверный token принадлежит ProductRevision; создание новой ревизии копирует blocks с новыми id и не переносит token. Поэтому сравнение чисел между ревизиями некорректно. Backend менять не требуется.
- Пользователь сейчас: устаревшие блоки вместо актуальных; восстановленное старое содержимое становится dirty и может попасть в следующий save. Это не согласованная политика last-successful-server-save.
- Риск развития: **высокий** — один строковый identity используется вместо явного различения загрузки, собственного save и внешней смены ревизии.
- Целевое решение: единый явный snapshot `{accountId, productId, revisionId, storyToken}` для local/base/save; восстанавливать только совместимый snapshot после готовности server owner. Переход на другую revision гидратирует её данные; исключение собственного save разрешать только по подтверждённой операции, не через эвристику sameProduct+clean. Старый неоднозначный payload не применять к иной ревизии; совместимость документировать. Сохранить существующий тест wizard own-save/refetch.
- Проверка: два описанных unit-сценария + опубликованная Work → новая editing revision → reload/save в обоих браузерах; сохранение порядка/IMAGE/поздних шагов. R1/R2/R4 нельзя считать полностью принятыми только по happy path. Retag/token assumptions существовали раньше, волна исправила отдельные проявления, но не закрыла требуемую isolation-границу.

### DR-02 — P2: shape-проверка не проверяет элементы массивов

- Источник: `local-form-restore.ts:33`, `sameStorageShape`; defaults массивов Work пустые.
- Подтверждено: `{materialProposals:[{bad:true}],title:'Keep'}` попадает в RHF как object[] вместо string[]. Ветка `reference.length === 0` принимает любой массив; для непустого reference проверяется только первый элемент.
- Пользователь сейчас: требуется повреждённый/несовместимый локальный payload; обычный ввод корректен. Это не доказательство удалённого обхода серверной валидации. Приоритет ниже потери обычного ввода.
- Риск развития: **высокий** — значения defaults не являются описанием типов; будущие массивы/nullable/nested поля создадут скрытые несовместимости. `as never` не восполняет runtime-проверку.
- Целевое решение: loose storage schema у владельцев полей (string/string[] без email/year business refinements), по возможности базовая структурная схема + refinement для submit. Общий restore получает schema/parser, а не угадывает тип по примеру. Проверять все элементы, сохранять остальные корректные поля; не копировать бизнес-правила и не строить универсальный recursive validator.
- Проверка: mixed массивы, пустые массивы, незавершённый email/year, неизвестные поля и корректные выборы. R3 happy path исправлен, заявленная проверка структуры неполна.

### DR-03 — P2: web-only storage warning показывается вне browser runtime

- Источники: `local-form-restore.ts:108`, `storageWritable`; оба owner-screen выводят `restore.storageError` без platform gate.
- Подтверждено изолированным тестом: при отсутствии global localStorage mount выдаёт сообщение о потере черновика. Это ожидаемое окружение native, где browser restore не обещан. Настоящий device не запускался.
- Пользователь сейчас: постоянное ложное предупреждение на native; на обычном web данный сценарий не влияет.
- Риск развития: **средний** — отсутствие capability смешано с отказом операции.
- Целевое решение: явно разделить `unsupported` и `failed` в storage capability; web warning только при ошибке поддерживаемого browser storage. Не расширять продукт до native persistence ради подавления сообщения.
- Проверка: native/unsupported без предупреждения; browser SecurityError/QuotaExceededError с предупреждением.

## Срез 2 — сохранение, logout и browser history

### DR-04 — P2: ошибка storage видима только для основных полей

- Источники: `use-product-story-editor.ts:204`, `AuthorApplicationAchievements.tsx:235` игнорируют boolean от `writeFormDraft`; `local-form-restore.ts` показывает только собственную ошибку.
- Сценарий: storage доступен при mount; затем запись истории превышает quota (или storage перестаёт работать), основные поля не меняются. Введённая история остаётся лишь в памяти, предупреждения нет. Изолированная проверка story-only write с QuotaExceededError падает: editor.error/storageError пусты. Achievements имеют тот же необработанный результат по исходнику, отдельный runtime-тест не выполнялся.
- Пользователь сейчас: незавершённый текст может исчезнуть после закрытия без обещанного предупреждения. Probe из одного байта на mount не проверяет последующие записи.
- Риск развития: **средний/высокий** — три владельца записи расходятся по error/clear/session semantics.
- Целевое решение: общий узкий storage-result contract (`unsupported / ok / failed`) и единый способ передать состояние каждого локального writer в существующую область уведомления формы. Не смешивать storage error с серверной validation error, не запрещать серверное сохранение. Успех основной формы не должен скрывать продолжающуюся ошибку story/achievement.
- Проверка: quota после mount отдельно для основных полей, story и достижения; повторная успешная запись снимает соответствующую ошибку. Не нужен новый универсальный form engine.

### DR-05 — P2, архитектурный риск R5: epoch отменяет старую запись, но не закрывает владельца

- Исправленный сценарий edit → clearAccountFormDrafts → old timer действительно покрыт и проходит. Эту часть R5 принимаю.
- Новая проверка owner hook: clear → новый edit до завершения logout → timer. Ключ появляется снова: schedule захватывает уже увеличенный accountDraftEpoch. Тест красный. Это проверка границы writer, не полный browser logout.
- Источники: `local-form-draft.ts:32` (отдельный Map), `local-form-restore.ts:113`, `use-product-story-editor.ts:195`, `AuthorApplicationAchievements.tsx:231`; `account-logout.ts:57`; `auth-provider.ts:304` закрывает private session после ответа logout, `beginAuthWrite` сам write gate не закрывает.
- В seller owner `fieldsEditable = editable && !guard.inputsLocked`; после подтверждённого выхода вызывается endLockedTransition перед сетевым logout; canWrite local restore учитывает private cache, но не logoutStarted. Поэтому session boundary нельзя доказывать только тестом таймера, созданного до clear. Полный UI-сценарий позднего ввода не прогонялся; не утверждаю воспроизведённую браузерную утечку.
- Пользователь сейчас: потенциальное сохранение приватного локального ввода после команды logout; same-account повторный login может восстановить его. Другому аккаунту ключ напрямую не отдаётся.
- Риск развития: **высокий** — auth epoch, account draft epoch и owner locks образуют разные определения «сессия закрыта». Handoff ошибочно пишет «второй механизм сессий не вводился»: новый Map именно дополнительный механизм retirement локальных writers.
- Целевое решение: один явный owner завершения клиентской сессии должен закрывать все private writers на logout intent и освобождать storage; запрет действует до следующей разрешённой сессии, а не только для ранее scheduled callbacks. Использовать существующие session leases/epoch там, где они покрывают это правило; не разносить очередные checks по трём editors. Отдельно описать replacement без logout (сейчас принят как оставшееся ограничение, не переобъявлять исправленным).
- Проверка до закрытия: delayed logout + ввод/reset/поздний callback после начала выхода → ни один из трёх ключей не создаётся; повторный вход нового пользователя; logout failure. Не менять server logout semantics.

### Принятые части волн 2–4 и ограничения

- **R8:** clean-save больше не пишет снимок снова; targeted regression прошла, поздний ввод сохраняется через существующий persistedFieldOverrides. Сериализация всего значения и dirty owner остаются в одном hook.
- **R9:** confirmSavedProduct действительно общий для ordinary save и update-success/submit-failure, generation/private-cache guards сохранены. Штатная owner regression прошла. На этом срезе подтверждённого нового дефекта R9 нет. Возможное последующее упрощение: передавать подтверждение update через локальную operation, не плодить ещё refs; не назначать рефакторинг без пользовательской причины.
- **R6:** независимо выполнен реальный Chromium и WebKit с текущим browser guard, синтетическими history entries и stub persist (без backend): clean → dirty → pending → clean не добавляет второй sentinel; один Back возвращает `/profile`. Это подтверждает первоначальную flag-chain регрессию, но не заменяет полную интеграцию Expo wizard.
- **R7:** исходники обоих Redirect сохраняют overlay/oq/otab и прежние параметры через typed href; исправление соответствует находке. App E2E в этом ревью повторно не запускалось.
- **R10:** `rememberLeave` передаёт delta, commitLeave выполняет обратный traversal вместо replace. Код исправляет описанную причину. Только сообщённый исполнителем app-E2E; независимого full AuthViewport/browser прогона нет. Отсутствие unit само по себе не дефект, если покрыта реальная браузерная последовательность.
- **O1:** лишний sameBlocks удалён; pending-блокировка осталась, identity guard и очистка после успешного save сохранены.
- **Архитектура history:** сохраняются глобальный monkeypatch pushState/replaceState, обработчик popstate с stopImmediatePropagation, sentinel владельца Work и Expo Router. Риск высокий для новых способов навигации; исправленные отдельные сценарии не доказывают отсутствие конфликтов. Цель — роутер владеет маршрутами/URL, один ограниченный web-adapter владеет только отсутствующей в SDK защитой unsaved traversal. Перед заменой нужна матрица deep-link/reload/Back/Forward/двойной Back/save failure/auth dismiss и проверка возможностей установленного SDK; миграцию/private imports не делать механически. Этот architecture gate не означает глобальное переписывание сейчас.

### Собственные проверки на этом срезе

- Полный mobile Vitest: **845/845, 135 файлов**, 14.91 s, Node 22, EXPO_NO_DOTENV=1. Запущен до просьбы экономить прогоны; больше не повторяется.
- `tsc --noEmit`: PASS. `git diff --check cc611483..10cb5a33`: PASS. Target worktree чистое.
- Дополнительные 2 assertions story storage/logout: FAIL, как описано DR-04/05; вместе с предыдущими probes 6 красных проверок. Они не входят в штатные 845 и не являются подтверждением full UI для logout.
- Chromium/WebKit isolated R6: PASS. Первоначально sandbox блокировал запуск процесса, после разрешённого запуска проверка завершилась; это не app failure.
- Production build, полный E2E, API/DB, native device и Figma visual parity в этом ревью не повторялись.

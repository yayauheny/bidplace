# Повторное ревью draft-restore

Статус: REVIEW COMPLETE для ограниченного scope; пакет требует доработки. Это не полный аудит backend или release certification. Проверяемый HEAD `10cb5a33`, база `cc611483`, checkout `/Users/yayauheny/projects/bidplace-seller-profile-structure`. Аудит ведётся отдельно в ветке `fix/draft-restore-audit` основного checkout. Код приложения не меняется.

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


**ТЗ исполнителю — выбранный способ: явная привязка к server revision, без эвристического merge.**

1. Работать в `use-product-story-editor.ts` и существующей owner-spec; callers — `product-draft-screen.tsx`, миграция `new → productId` и текущий save response. Сначала добавить две красные регрессии выше. Не менять API/contracts/backend.
2. В новом локальном envelope хранить `revisionId` вместе с `storyToken`; account/product остаются в ключе. Пока owner не получил account/product/server snapshot, не применять product-story к случайному token0. Для ещё не созданного продукта оставить отдельный `new` lifecycle; переносить его только при подтверждённом create, не при любом появлении id.
3. Убрать правило «sameProduct + clean означает own-save». Новый server revision принимается как новый baseline. Подтверждённый собственный save учитывать через сохранённый результат конкретной операции и его identity; последующий refetch согласовывается с этим результатом. Не сохранять старые block ids/token, если сервер уже вернул новую revision. Не угадывать идентичность по равенству текста.
4. Не применять legacy/v2 snapshot без revisionId к новой неизвестной revision. Старый неоднозначный payload не делать dirty и не отправлять автоматически. Выбранная политика совместимости: сохранить исходную локальную запись нетронутой до явного действия/завершения потока и показать существующей областью ошибки, что её нельзя автоматически восстановить; не создавать migration framework. Это сознательное ограничение совместимости, указать в отчёте. Если потребуется новая пользовательская механика восстановления — отдельное согласование, не придумывать UI.
5. Для совместимой revision применять точный упорядоченный snapshot с исходными block keys, включая пустой список и IMAGE refs. Никаких Blob/base64. Новый server token той же revision побеждает stale local согласно принятому правилу; failed save не очищает local.
6. Gate: owner-spec с cold/cache mount, r1→r2, stale storage, own-save/refetch, IMAGE и delete-all; один адресный browser сценарий опубликованной Work → новая revision → reload в Chromium/WebKit. Сравнить late wizard steps до/после. **Не Done**, если исправлен reload, но собственный save возвращает визард назад.

### DR-02 — P2: shape-проверка не проверяет элементы массивов

- Источник: `local-form-restore.ts:33`, `sameStorageShape`; defaults массивов Work пустые.
- Подтверждено: `{materialProposals:[{bad:true}],title:'Keep'}` попадает в RHF как object[] вместо string[]. Ветка `reference.length === 0` принимает любой массив; для непустого reference проверяется только первый элемент.
- Пользователь сейчас: требуется повреждённый/несовместимый локальный payload; обычный ввод корректен. Это не доказательство удалённого обхода серверной валидации. Приоритет ниже потери обычного ввода.
- Риск развития: **высокий** — значения defaults не являются описанием типов; будущие массивы/nullable/nested поля создадут скрытые несовместимости. `as never` не восполняет runtime-проверку.
- Целевое решение: loose storage schema у владельцев полей (string/string[] без email/year business refinements), по возможности базовая структурная схема + refinement для submit. Общий restore получает schema/parser, а не угадывает тип по примеру. Проверять все элементы, сохранять остальные корректные поля; не копировать бизнес-правила и не строить универсальный recursive validator.
- Проверка: mixed массивы, пустые массивы, незавершённый email/year, неизвестные поля и корректные выборы. R3 happy path исправлен, заявленная проверка структуры неполна.


**ТЗ исполнителю — выбранный способ: базовые структурные Zod-схемы у владельцев.**

1. В `product-draft-form.ts` выделить raw shape: все скалярные поля — string; `materialTermIds`, `techniqueTermIds`, `materialProposals`, `techniqueProposals` — string[]. В `profile-validation.ts` raw shape: string-поля и `directionCategoryIds: string[]`. Никаких trim/email/URL/year/UUID refinements на restore.
2. Existing save schemas построить на этих shapes с прежними refinements/transforms; не менять их поведение (в частности нормализацию country и ограничения catalog). Типы defaults выводить из raw shape, не из примеров значений.
3. В `local-form-restore.ts` удалить `sameStorageShape` и `fieldShapes`. Передавать из двух screen owners raw field parsers. Разбирать известные поля по schema.shape; неверное поле пропустить целиком, корректные соседние поля восстановить. Для массива валидировать каждый элемент. Unknown fields не передавать RHF. Не добавлять `any`, `as never` вместо валидации, JSON recursive inference или fallback «принять всё».
4. Gate: `[validString, {}]` не проходит; пустой string[] проходит; title сохраняется при невалидном соседнем поле; email `unfinished@` и year `20-` сохраняются дословно. Existing validation/save tests должны подтвердить, что запись на сервер не стала мягче. Проверить два caller после смены сигнатуры, typecheck и changed-file lint.

### DR-03 — P2: web-only storage warning показывается вне browser runtime

- Источники: `local-form-restore.ts:108`, `storageWritable`; оба owner-screen выводят `restore.storageError` без platform gate.
- Подтверждено изолированным тестом: при отсутствии global localStorage mount выдаёт сообщение о потере черновика. Это ожидаемое окружение native, где browser restore не обещан. Настоящий device не запускался.
- Пользователь сейчас: постоянное ложное предупреждение на native; на обычном web данный сценарий не влияет.
- Риск развития: **средний** — отсутствие capability смешано с отказом операции.
- Целевое решение: явно разделить `unsupported` и `failed` в storage capability; web warning только при ошибке поддерживаемого browser storage. Не расширять продукт до native persistence ради подавления сообщения.
- Проверка: native/unsupported без предупреждения; browser SecurityError/QuotaExceededError с предупреждением.


**ТЗ исполнителю — выбранный способ: capability gate перед browser storage.**

1. В `local-form-draft.ts` отделить неподдерживаемую платформу от отказа web storage; web с заблокированным localStorage — failed, native без Web API — unsupported. Проверки одной лишь `typeof localStorage` недостаточно, чтобы отличить эти случаи.
2. `local-form-restore.ts` не запускает probe и не ставит warning для unsupported. Оба owner-screen продолжают использовать существующее место вывода сообщения; отдельные platform-if по JSX не плодить. Совместить result contract с DR-04.
3. Gate: тест с native platform и отсутствующим localStorage даёт пустое предупреждение; web getter SecurityError и web quota дают сообщение. Нет AsyncStorage/new dependency и нет обещания native draft recovery.

## Срез 2 — сохранение, logout и browser history

### DR-04 — P2: ошибка storage видима только для основных полей

- Источники: `use-product-story-editor.ts:204`, `AuthorApplicationAchievements.tsx:235` игнорируют boolean от `writeFormDraft`; `local-form-restore.ts` показывает только собственную ошибку.
- Сценарий: storage доступен при mount; затем запись истории превышает quota (или storage перестаёт работать), основные поля не меняются. Введённая история остаётся лишь в памяти, предупреждения нет. Изолированная проверка story-only write с QuotaExceededError падает: editor.error/storageError пусты. Achievements имеют тот же необработанный результат по исходнику, отдельный runtime-тест не выполнялся.
- Пользователь сейчас: незавершённый текст может исчезнуть после закрытия без обещанного предупреждения. Probe из одного байта на mount не проверяет последующие записи.
- Риск развития: **средний/высокий** — три владельца записи расходятся по error/clear/session semantics.
- Целевое решение: общий узкий storage-result contract (`unsupported / ok / failed`) и единый способ передать состояние каждого локального writer в существующую область уведомления формы. Не смешивать storage error с серверной validation error, не запрещать серверное сохранение. Успех основной формы не должен скрывать продолжающуюся ошибку story/achievement.
- Проверка: quota после mount отдельно для основных полей, story и достижения; повторная успешная запись снимает соответствующую ошибку. Не нужен новый универсальный form engine.


**ТЗ исполнителю — выбранный способ: каждый writer сообщает свой результат, форма агрегирует.**

1. Сохранить storage read/write в `local-form-draft.ts`; определить один тип результата и общий текст ошибки, не вводить глобальный event bus.
2. `useLocalFormRestore` и `useProductStoryEditor` возвращают локальное `storageError`; `AuthorApplicationAchievements` передаёт своё состояние parent через небольшой callback, аналогично существующему onDraftChange. Не подменять story.error, который уже обслуживает серверное сохранение/загрузку.
3. В `product-draft-screen.tsx` агрегировать form/story storage error, в `seller-profile-screen.tsx` — form/achievement. Одно сообщение в существующем alert-area, пока хотя бы один источник failed. Успех writer A снимает только ошибку A. При unmount/смене identity дочерний источник сбрасывается.
4. Проверить также `noteEntityCreated`: failed write под новым id не должен удалять единственную ещё существующую копию под `new`. Перенос `new → id` считать успешным только после успешной записи destination; сообщение обязательно при ошибке. Это проверка необходимой смежной границы, runtime-дефект migration в данном аудите отдельно не воспроизводился.
5. Gate: mount probe успешен, затем quota только story/achievement; пользователь видит warning, ввод остаётся, server save доступен. После успешного retry сообщение исчезает только для восстановившегося writer. Unit owner tests достаточны для ошибок; один screen integration проверяет сборку сообщения.

### DR-05 — P2, архитектурный риск R5: epoch отменяет старую запись, но не закрывает владельца

- Исправленный сценарий edit → clearAccountFormDrafts → old timer действительно покрыт и проходит. Эту часть R5 принимаю.
- Новая проверка owner hook: clear → новый edit до завершения logout → timer. Ключ появляется снова: schedule захватывает уже увеличенный accountDraftEpoch. Тест красный. Это проверка границы writer, не полный browser logout.
- Источники: `local-form-draft.ts:32` (отдельный Map), `local-form-restore.ts:113`, `use-product-story-editor.ts:195`, `AuthorApplicationAchievements.tsx:231`; `account-logout.ts:57`; `auth-provider.ts:304` закрывает private session после ответа logout, `beginAuthWrite` сам write gate не закрывает.
- В seller owner `fieldsEditable = editable && !guard.inputsLocked`; после подтверждённого выхода вызывается endLockedTransition перед сетевым logout; canWrite local restore учитывает private cache, но не logoutStarted. Поэтому session boundary нельзя доказывать только тестом таймера, созданного до clear. Полный UI-сценарий позднего ввода не прогонялся; не утверждаю воспроизведённую браузерную утечку.
- Пользователь сейчас: потенциальное сохранение приватного локального ввода после команды logout; same-account повторный login может восстановить его. Другому аккаунту ключ напрямую не отдаётся.
- Риск развития: **высокий** — auth epoch, account draft epoch и owner locks образуют разные определения «сессия закрыта». Handoff ошибочно пишет «второй механизм сессий не вводился»: новый Map именно дополнительный механизм retirement локальных writers.
- Целевое решение: один явный owner завершения клиентской сессии должен закрывать все private writers на logout intent и освобождать storage; запрет действует до следующей разрешённой сессии, а не только для ранее scheduled callbacks. Использовать существующие session leases/epoch там, где они покрывают это правило; не разносить очередные checks по трём editors. Отдельно описать replacement без logout (сейчас принят как оставшееся ограничение, не переобъявлять исправленным).
- Проверка до закрытия: delayed logout + ввод/reset/поздний callback после начала выхода → ни один из трёх ключей не создаётся; повторный вход нового пользователя; logout failure. Не менять server logout semantics.


**ТЗ исполнителю — выбранный способ: session-scoped разрешение записи, не schedule-scoped epoch.**

1. Сначала воспроизвести на реальном owner: seller form → начать logout с deferred API → попытка ввода/поздний reset после начала → закончить logout → storage пуст. Добавить вариант callback после logout. Если UI запрещает все такие события, сохранить красный lower-level test и документировать архитектурный риск без выдуманного UI-bug.
2. Владелец разрешения записи — клиентская auth/session boundary (`auth-provider.tsx` и существующие query-cache session utilities), а не AccountLogoutButton. Все три draft writers получают разрешение/lease текущей сессии от этого owner; каждый отложенный write проверяет ту же lease при выполнении. Logout закрывает lease до сети, новый login/install выдаёт новую. Нельзя получить разрешение просто повторным schedule после clear.
3. Удалять дополнительный accountDraftEpoch Map и его проверки только после подключения всех трёх writers и миграции `new → id` к единому правилу. Не добавлять четвёртый номер версии в screen. Local storage cleanup и отмена pending writers должны происходить на одной boundary; публичный query cache при этом не очищать.
4. Существующую конкуренцию auth operations, abort и canWritePrivateCache не переписать походя. Если переиспользование текущей retirement-функции меняет порядок auth API/UI — остановить эту часть и представить конкретную разницу; не выбирать silent fallback. Backend/logout endpoint неизменен.
5. Gate: pending logout, logout failure, повторный login того же account, другой account и поздний callback. Проверить, что новые разрешённые черновики после login пишутся, а старые callbacks не получили новую lease. Session replacement без logout явно описать; расширение обещанного очищения не маскировать под найденный баг.

### Принятые части волн 2–4 и ограничения

- **R8:** clean-save больше не пишет снимок снова; targeted regression прошла, поздний ввод сохраняется через существующий persistedFieldOverrides. Сериализация всего значения и dirty owner остаются в одном hook.
- **R9:** confirmSavedProduct действительно общий для ordinary save и update-success/submit-failure, generation/private-cache guards сохранены. Штатная owner regression прошла. На этом срезе подтверждённого нового дефекта R9 нет. Возможное последующее упрощение: передавать подтверждение update через локальную operation, не плодить ещё refs; не назначать рефакторинг без пользовательской причины.
- **R6:** независимо выполнен реальный Chromium и WebKit с текущим browser guard, синтетическими history entries и stub persist (без backend): clean → dirty → pending → clean не добавляет второй sentinel; один Back возвращает `/profile`. Это подтверждает первоначальную flag-chain регрессию, но не заменяет полную интеграцию Expo wizard.
- **R7:** исходники обоих Redirect сохраняют overlay/oq/otab и прежние параметры через typed href; исправление соответствует находке. App E2E в этом ревью повторно не запускалось.
- **R10:** `rememberLeave` передаёт delta, commitLeave выполняет обратный traversal вместо replace. Код исправляет описанную причину. Только сообщённый исполнителем app-E2E; независимого full AuthViewport/browser прогона нет. Отсутствие unit само по себе не дефект, если покрыта реальная браузерная последовательность.
- **O1:** лишний sameBlocks удалён; pending-блокировка осталась, identity guard и очистка после успешного save сохранены.
- **Архитектура history:** сохраняются глобальный monkeypatch pushState/replaceState, обработчик popstate с stopImmediatePropagation, sentinel владельца Work и Expo Router. Риск высокий для новых способов навигации; исправленные отдельные сценарии не доказывают отсутствие конфликтов. Цель — роутер владеет маршрутами/URL, один ограниченный web-adapter владеет только отсутствующей в SDK защитой unsaved traversal. Перед заменой нужна матрица deep-link/reload/Back/Forward/двойной Back/save failure/auth dismiss и проверка возможностей установленного SDK; миграцию/private imports не делать механически. Этот architecture gate не означает глобальное переписывание сейчас.

**ТЗ для отдельного history review:** owners — `auth-browser-history.ts`, `AuthViewport.tsx`, `product-draft-browser-guard.ts`, `product-draft-navigation.ts`; не начинать с удаления guards. Составить таблицу, кто меняет index/URL/entries, кто блокирует pop и кто завершает traversal. В installed Expo Router 57 проверить публичные возможности по exports/source; public usePreventRemove не предполагать. Целевой контракт adapter: одна операция request/confirm/cancel/complete traversal и один lifecycle регистрации; экран не вычисляет собственный history delta. Router остаётся владельцем URL/step. **Done для review:** доказанная карта и сравнённый вариант router-only против необходимого web adapter с конкретными непокрываемыми сценариями; **Done для будущей реализации:** browser matrix проходит и старые monkeypatch/listeners удалены после переключения consumers. Если штатный Router текущей версии не покрывает поведение, документировать точную границу адаптера; не обещать его удаление без доказательства.


### Собственные проверки на этом срезе

- Полный mobile Vitest: **845/845, 135 файлов**, 14.91 s, Node 22, EXPO_NO_DOTENV=1. Запущен до просьбы экономить прогоны; больше не повторяется.
- `tsc --noEmit`: PASS. `git diff --check cc611483..10cb5a33`: PASS. Target worktree чистое.
- Дополнительные 2 assertions story storage/logout: FAIL, как описано DR-04/05; вместе с предыдущими probes 6 красных проверок. Они не входят в штатные 845 и не являются подтверждением full UI для logout.
- Chromium/WebKit isolated R6: PASS. Первоначально sandbox блокировал запуск процесса, после разрешённого запуска проверка завершилась; это не app failure.
- Production build, полный E2E, API/DB, native device и Figma visual parity в этом ревью не повторялись.

## Срез 3 — архитектура UI, black-тема и качество плана

Уточнение основателя: цель — централизованные настройки стилей и общие компоненты, удобство следующих изменений; не только минимальный патч. В этой задаче только аудит и приоритизация, реализация запрещена. Нужна подготовка к black-теме; палитру и геометрию не выдумываем.

### AR-01 — P1 до массовой доводки экранов: ThemeProvider не является владельцем всех цветов

- Факты HEAD: `packages/design-tokens/src/tokens.ts:6` экспортирует статический light-объект; `apps/mobile/src/providers/theme-provider.tsx:7` передаёт только navigation theme и обещает future token map без переписывания компонентов. `AppText.tsx:25` вычисляет toneColors на уровне модуля; `FigmaIcon` по умолчанию читает статический designTokens.color. Простая смена value NavigationThemeProvider не меняет эти consumers.
- Дополнительные источники: `packages/design-tokens/src/figma-button.ts:55` — самостоятельная палитра кнопок/градиентов; `search-chrome.ts:8` — собственные fill/gradient/typography.color/tab colors; `apps/mobile/global.css:2` — focus #2457e6, тогда как designTokens.color.focus = #004DFF. Button style/surface используют отдельные figmaButtonTokens. Речь о конкретных проверенных consumers, не об исчерпывающей инвентаризации всех литералов проекта.
- Пользователь сейчас: light работает по существующему контракту; отсутствие black не является регрессией этого пакета. Но одинаковая настройка focus уже имеет два источника.
- Риск развития: **высокий** — смена темы/контрастности требует правок в разных слоях; новые экраны закрепят статические цвета и часть компонентов останется light.
- Целевое решение: один публичный семантический контракт в `@bidplace/design-tokens`, две совместимые цветовые карты light/black; метрики/типографика/радиусы/space общие, пока дизайн не требует различий. Один runtime theme owner доставляет выбранную карту компонентам и navigation; web CSS variables получают значения из того же источника. Native использует тот же контракт через реактивного consumer, а не независимую палитру. Не мутировать глобальный singleton на смене темы и не оставлять module-level color snapshots.
- Компонентные спецификации (`button`, `field`, `search`) могут сохранять собственные состояния/геометрию, но их цвета ссылаются на семантические роли общей темы. Удаляется независимая палитра, а не полезная матрица состояний кнопки. Не объединять роли лишь потому, что сегодня они имеют одинаковый hex: surface поля, карточки и overlay могут различаться в black.
- Минимальный gate архитектуры: смена theme обновляет AppText, Button/Icon, TextField, Sheet/Dialog, search, navigation и focus без remount экрана; нет дублирующей ручной CSS-палитры; light не меняет согласованный вид. Реальные значения black и contrast states — по live Figma/решению дизайнера (`NEEDS-FIGMA` до проверки); не объявлять тему готовой по наличию provider.


**ТЗ исполнителю — выбранная архитектура: semantic color maps + один React theme owner.**

1. `packages/design-tokens/src/tokens.ts`: оставить общий owner метрик/типографики; выделить полный набор семантических цветовых ролей. Карты `light`/`black` имеют один TypeScript key contract со строковыми значениями (не literal-type только light hex). Сохранить осмысленные нынешние имена, не устраивать массовое переименование ради красивого API. Цвета/градиенты/shadow colors тоже принадлежат теме; geometry/blur/opacity не менять автоматически при смене темы.
2. `packages/design-tokens/src/figma-button.ts`: удалить независимые значения `colors` и gradient endpoints, связать `figmaButtonMatrixCell` с переданной semantic palette. Состояния и metrics оставить здесь. Если роли нет, добавить её в общий контракт (например onAction/actionDisabled/borderGradient), а не fallback hex. `search-chrome.ts`: убрать независимые fill/gradient/field.typography.color/tab fill/label; связать их с теми же тематическими ролями. Различные роли могут иметь одинаковое light значение.
3. `apps/mobile/src/providers/theme-provider.tsx`: сделать владельцем активной карты приложения через React context и `useAppTheme`; внутри него вычислять navigation theme из этой же карты. Подключение уже есть в `providers/app-providers.tsx`, второй root provider не добавлять. На первом этапе default остаётся light; не добавлять пользовательский переключатель, auto/system или persistent preference без запроса. Для acceptance использовать управляющий prop/test harness с light/black.
4. `components/ui/AppText.tsx`: tone→role mapping может быть статическим, но role→color разрешается внутри render по `useAppTheme`, не через нынешний module-level toneColors. `FigmaIcon.tsx` default color также из theme; явный caller color сохраняется. `TextField.tsx`, `FigmaTextField.tsx`, `FigmaSelectField.tsx`, `AppDialog.tsx` и `AuthViewport.tsx` — заменить статические theme-dependent цвета, сохранить размеры/focus/ARIA.
5. Цепочка кнопки: `FigmaButton.tsx`/`FigmaButtonSurface.tsx` читают active palette; чистые функции `figma-button-style.ts` и token matrix получают palette явным аргументом. Не вызывать hook из helper и не держать импортированный mutable theme singleton. `ui/Button.tsx` продолжает делегировать этому renderer.
6. Поиск: обновить `FigmaSearchGlass.tsx`, `FigmaSearchGlass.web.tsx`, `FigmaSearchChromeStroke.tsx`, `features/search/SearchOverlayTabs.tsx`, `search-overlay-header-style.ts`. В последнем module-level destructuring допустим для metrics, но не для color. SVG gradients и CSS glass должны читать активные роли, иначе часть поиска останется светлой.
7. Web CSS: `global.css` использует `--bidplace-focus`, без собственного hex. Выбранный способ связи — генерировать статические light/black CSS variable blocks из того же token package на build/dev preparation и выбирать их root theme attribute из ThemeProvider. Initial root default — light; portaled overlays наследуют root variables. Не вручную копировать значения и не создавать CSS-only dark palette. Если сборочный pipeline уже умеет такую генерацию — расширить его вместо второго скрипта. Проверить `src/app/_layout.tsx` импорт global.css и scripts запуска/build до подключения.
8. Перед завершением выполнить consumer inventory по `designTokens.color`, `figmaButtonTokens`, `searchChromeTokens`, `StyleSheet.create`, `elevation` и CSS/SVG color literals в production src. Каждый остаток классифицировать: динамический consumer / постоянный asset color / ещё не мигрирован. Не заявлять готовность всей темы, если оставшиеся экраны всё ещё импортируют static light. Все live theme consumers должны войти в тот же план миграции; список выше — проверенное начало, не исчерпывающий список.
9. Black значения требуют live Figma/дизайнерского решения. До их получения можно завершить wiring и проверить его тестовой контрастной палитрой, но ставить `Needs verification`, не выдавать тестовую палитру за дизайн. Не выбирать #000 автоматически для каждой surface.
10. **Done:** смена theme без remount обновляет текст/иконку/кнопку/поле/sheet/search/navigation/CSS-focus; нет лишних literal palettes; typecheck ловит пропущенную роль black; light screenshots не изменились; keyboard focus/disabled/error/overlay контраст проверен на согласованных палитрах. Достаточно общей component gallery и одного representative экрана на первом gate; все screens visual acceptance — следующая волна. Тест на наличие строки/импорта не заменяет эту проверку.

### AR-02 — P2: централизация компонентов нужна по роли, не по папке

- `components/ui/Button.tsx` уже делегирует rendering в `FigmaButton`: это полезный общий owner, не два разных renderer только из-за двух каталогов. `FigmaButton` → button-style/surface → token matrix нужно сохранить как прозрачную цепочку.
- Цель: один renderer и публичные варианты для button/field/text/icon/dialog/tab/card; тонкие продуктовые wrappers допустимы, если выражают реальную роль и не добавляют вторую палитру/размеры/state machine. Общие состояния hover/focus/pressed/disabled/loading принадлежат компоненту.
- Screen содержит композицию и уникальную геометрию, подтверждённую Figma. Повторяющиеся отступы, цвета, высоты controls, шрифтовые роли — централизованы. Не заставлять любую уникальную координату становиться глобальной переменной: это создаёт свалку одноразовых токенов вместо системы.
- Выигрыш: изменение роли/темы распространяется на consumers; новый экран не копирует реализацию контрола. Gate: карта роли → owner → consumers, отсутствие второго независимого renderer для одной обязанности, проверка light/black состояний общих primitives.


**ТЗ исполнителю — выбранный способ: consolidation через существующих owners.**

1. Составить таблицу живых consumers для `AppText`, `ui/Button`→`FigmaButton`, `TextField/FigmaTextField/FigmaSelectField`, `FigmaTabs`, `AppDialog`, `WorkCoverCardGrid`, `AppShell`; каждую роль привязать к фактическому renderer и variant API. Не объявлять любой wrapper дублем автоматически.
2. Начать с кнопок/полей: вынести повторяющийся набор размеров/типографики/состояний в существующий variant owner. Consumers меняют props, а не свои копии style. Figma-specific вариант сохранять, если геометрия реально отличается; не подгонять под ближайший размер.
3. Theme миграцию выполнять по AR-01. Затем удалять только реально заменённые implementation/styles/exports после проверки импортов и динамических consumers. Rename каталогов, массовое дробление экранов и новый UI framework не требуются.
4. **Done:** карта owner/variant согласована с кодом; изменение одного variant отражается во всех его consumers; preserved href/disabled/loading/a11y; native/web различия остаются явными; нет потери focus/pointer behavior. Новые регрессии добавлять в owner specs, не по одному файлу на каждую косметическую находку.

### PL-01 — P2: «current» план содержит устаревшие источники и неподтверждённые закрытия

- `docs/audits/current/06-NEXT-REVIEWS.md` §10 всё ещё называет Pen каноническим, хотя действуют Figma и DEC-119. §4 Application draft persistence помечен RESOLVED без привязки к проверяемому SHA и новой local-storage границе. `UI-CLEANUP-PHASE-1-CLOSURE.md` с отдельным старым cabinet E2E blocker нельзя использовать как текущую сводку принятия `10cb5a33`.
- `00-EXECUTION-ROADMAP.md` хранит полезную историю и множество статусов 2026-09/10; ID R01–R35 не те же, что R1–R10 draft-routing. Нельзя закрывать архитектурный R25 только потому, что исправлен draft R6/R10.
- Целевое решение: одна актуальная короткая очередь с namespace ID (`draft/…`, `architecture/…`, `ui/…`), base/HEAD, owner, доказательством и следующим gate. Историю оставить append-only; активные строки перепроверить по ancestry/consumers. Заменить Pen в активных инструкциях, а не переписывать архивную историю. В owner-status вернуть Partial для неполной restore/storage границы после принятия замечаний; этим аудитом owner-доки не редактировались.


**ТЗ исполнителю — выбранный способ: актуальная сводка поверх сохранённой истории.**

1. В `docs/audits/current/06-NEXT-REVIEWS.md` исправить активный source на live Figma; заменить недоказанное RESOLVED по local draft на ссылку к DR-01…05 и точный проверяемый SHA. Не удалять старые evidence records.
2. В `00-EXECUTION-ROADMAP.md` добавить сверху короткую актуальную карту очереди; явно отделить старые R01–R35 от draft/R1–R10. Сверять наличие коммитов через ancestry, не по названию ветки. Не считать прочтение отчёта новой проверкой.
3. `11-PROJECT-STATUS.md` — итог Partially implemented/`Partial` для незакрытых restore/storage границ; закрытые R8/R9/O1 остаются закрытыми. `04-DESIGN-STATUS.md` — только фактическое поведение, без утверждения новой visual acceptance. Никакого нового DEC за исправление ошибки без нового продуктового решения.
4. **Done:** следующий исполнитель из одной актуальной очереди понимает owner, base, открытые ID и gate; нет активной инструкции применять Pen; каждый Implemented/Verified имеет source evidence и scope; отсутствуют противоречия «всё закрыто» и открытых DR.

### PL-02 — P2: старые количественные критерии не равны архитектурному качеству

- В `2026-10-13-FRONTEND-DESIGN-SYSTEM-AUDIT.md` есть разумные цели: общий shell, семантические роли, одна матрица controls, Figma source. Но gates «экран ≤200 строк», «нет токена без чтений», blanket чётность размеров/перенос single-use token локально не могут сами принимать изменения.
- С black-темой single-use semantic role может быть необходима; две роли одинакового цвета могут расходиться. Запрет нечётности не должен перекрывать подтверждённую геометрию, hairline и web border-box. Figma-specific отступы не исправляют арифметикой только ради метрики.
- Целевое решение: принимать ownership/reuse/theme propagation и реальные сценарии; объём diff/длина экрана — повод посмотреть, не формальный запрет. Новый helper должен убирать текущую дублирующую ответственность. Не дробить screen на wrappers ради лимита и не считать grep/токен-тест визуальной приёмкой.
- План §10 с «read-only reviews first» полезен. Порядок поправить: корректность восстановления → theme/token ownership и базовые primitives → массовая доводка экранов. Старые backend/release scopes не объявлять закрытыми по frontend tests.


**ТЗ исполнителю — выбранный способ: принимать ответственность и поведение, не объём.**

1. Не переписывать исторический аудит 2026-10-13; в активном плане явно переопределить gates ≤200 строк, отрицательный diff и token usage count как диагностические подсказки.
2. Заменить их на проверяемые условия: один owner обязанности; нет дублированной палитры; state/lifecycle contracts сохранены; live Figma geometry и themed states подтверждены.
3. Удаление токена допустимо только после всех dynamic consumers и Figma роли; single-use семантические роли для black не удалять. No-hex check должен различать theme roles и разрешённые постоянные asset colors.
4. **Done:** маленький экран с копией save logic не проходит приёмку, большой чисто композиционный экран не отклоняется только за длину; checklists не позволяют закрыть визуал по grep/unit вместо рендера.

## Итог приёмки четырёх волн

| Пункт | Независимая оценка |
|---|---|
| R1 cold hydration | Исходная regression исправлена, owner tests PASS; общая смена revision остаётся DR-01 |
| R2 mount restore | Обычный mount исправлен; revision isolation неполна (DR-01) |
| R3 incomplete fields | Незавершённый email/year восстанавливается; массивы не проверяются (DR-02) |
| R4 exact story restore | v2 сохраняет edit/delete/order/IMAGE в той же revision; cross-revision DR-01; legacy merge ограничен и документирован |
| O1 | Принято: фиктивное сравнение удалено, pending contract сохранён |
| R5 logout | Старые delayed writes отменяются; owner lifetime не закрыт для новых writes (DR-05), UI-сценарий требует адресного подтверждения |
| R8 clean-save | Принято в проверенном owner scope |
| Storage error | Неполно: story/achievement + unsupported runtime (DR-03/04) |
| R9 update/submit | Принято в проверенном owner scope |
| R6 sentinel | Первоначальный сценарий подтверждён исправленным в обоих браузерах; интеграционный wizard run — evidence исполнителя |
| R10 auth traversal | Причина исправлена в коде; app-browser acceptance опирается на отчёт исполнителя, не повторена независимо |
| R7 aliases | Передача требуемых query подтверждена исходниками; app-E2E evidence исполнителя |

Вердикт: **не принимать формулировку «все находки закрыты, Partial снят»**. Большая часть исправлений полезна; откат пакета целиком не рекомендуется. DR-01 и DR-04 требуют завершения до признания сохранности локального ввода. DR-02 — обязательное завершение обещанного storage schema contract. DR-03 можно не блокировать web-MVP, если native явно вне релиза; это всё равно дефект общего hook. DR-05 — отдельный session-owner gate, не очередной локальный if.

## Приоритетная очередь работ

| Очерёдность | Задача / owner | Влияние на пользователя сейчас | Риск следующих изменений | Критерий завершения |
|---|---|---|---|---|
| 1, P1 | DR-01: story revision/base/save ownership | Устаревшее содержимое вместо новой revision | Высокий | Совместимый snapshot restore; чужая revision не применяется; own-save/refetch и обычный wizard не ломаются |
| 2, P2 | DR-04 + DR-02: storage contract трёх редакторов | Невидимая потеря локальной копии; некорректный JSON принимается как форма | Высокий | Typed loose payload, все writers передают ошибку, нет нового form framework |
| 3, P2 | DR-05: session retirement + DR-03 capability | Возможная повторная запись после logout; ложный native warning | Высокий / средний | Сначала адресный UI logout test; единый запрет writers до следующей сессии, unsupported не ошибка |
| 4, P1 до массовых экранов | AR-01: централизованные семантические токены и theme delivery | Текущий light не блокирует; black пока отсутствует | Высокий | Одна карта ролей, light/black values, реактивные consumers, CSS/navigation из того же owner |
| 5, P2 до массовых экранов | AR-02: карта общих компонентов и variants | Убирает разные настройки одинаковых controls | Высокий | Один owner на роль; компонентные состояния централизованы; light visual gate |
| Параллельно документации | PL-01/02: актуальный план и evidence | Предотвращает ложное закрытие и повторную работу | Высокий | Один текущий backlog с SHA/ID/owner/gate; Figma source; история сохранена |
| Затем | Доводка экранов через общие primitives | Видимый результат для пользователя | Средний | Figma, responsive/a11y/loading/error; fixes общих ролей делаются в owner |
| Отдельный bounded review | History adapter / SDK capability inventory | Подтверждённые прошлые сбои исправлены | Высокий | Матрица переходов и один owner адаптера; миграция только по обоснованной потребности |

Нет основания блокировать всю работу над дизайном до нулевого техдолга. Согласовывать Figma и доводить отдельные композиции можно параллельно. **Массовое копирование/перекрашивание экранов стоит начать после пунктов 4–5**, чтобы не делать второй проход по тем же consumers. Не включать старые commerce/backend рефакторинги в эту очередь без текущего пользовательского риска.

## Оценка готовности, 0–10

Это экспертная оценка готовности к переходу от техдолга к доводке экранов по проверенному frontend scope и прочитанным планам. Это **не процент выполненных задач, не измерение всех долгов репозитория и не оценка production security**. Backend invariants, release operations, live Figma и каждый экран заново не аудировались.

| Ось | Оценка | Почему |
|---|---|---|
| Переход проекта к преимущественной доводке экранов | **6/10, предварительно** | Есть рабочие shared primitives, большой зелёный test baseline и исправления основных regression; остаются сохранность revision/storage и нет общей runtime theme-системы |
| Завершённость текущего draft-restore пакета | **6/10** | Большинство R исправлено, но объявление полного closure опережает доказательства и пропущенные границы |
| Основа для централизованной black-темы | **3/10** | Есть пакет токенов и компонентные роли, но несколько палитр и статические consumers; навигационный provider не переключает UI |
| Общие компоненты как основа доводки дизайна | **6/10** | Кнопки уже делегируют в общий renderer; нужна единая theme supply и проверенная карта ролей, не переименование каталогов |
| Проверяемость затронутого frontend | **8/10** | 845 tests и tsc проходят, targeted browser evidence есть; новые boundary probes показывают пробелы, полный UI/native/Figma не проверен |
| План как готовая очередь исполнения | **5/10** | Полезные owner scopes, но устаревшие ссылки/статусы, пересекающиеся ID и количественные gates |

**Цель ближайших двух срезов — около 8/10 для перехода к экранам:** (A) закрыть данные/revision/storage/session gates и привести статусы к фактам; (B) закрепить theme/token ownership и базовые primitives с неизменным light. Это условная целевая оценка, не обещание результата до проверок. После этого оставшиеся технические улучшения можно вести адресно вместе с экранами.

## Что сознательно не делалось

- Код приложения, тесты репозитория, canonical product/design documents, SDK, backend и Figma не менялись. Изменён только этот аудит в отдельной ветке.
- После просьбы экономить прогоны broad tests/build не запускались. Новые проверки — только ограниченные probes описанных границ и один синтетический browser сценарий в двух движках.
- Полный auth-layout, production build, независимый app-E2E всех волн, API/DB suites, настоящие native устройства, live Figma и визуальные скриншоты не проверены в этом ревью. Их прежние результаты не выдаются за мои.
- Не проводился exhaustive поиск всех token literals/dead code; перечислены проверенные архитектурные примеры. Оставшиеся backend/архивные debt IDs не объявлены закрытыми.
- Аудит коммитится по срезам локально; push/merge/deploy не выполнялись. Рекомендации являются заданиями будущему исполнителю, не уже сделанными исправлениями.

## Простыми словами: что осталось до работы преимущественно над UI

**По текущим замечаниям.** Основной механизм уже работает. Нужно закончить его края: не подставлять старую историю в новую редакцию товара; строго проверять типы локальных полей, сохраняя незавершённый текст; показывать ошибку записи для истории и достижений; доказать, что после выхода никакой запоздалый ввод не воскресит черновик. Это один пакет «сохранность ввода и сессия», который разумно разбить на 2 небольших изменения: revision/restore и storage/logout. Браузерный Back с первоначальной проблемой исправлен; всё переписывать заново не требуется.

**По оставшимся волнам.** Следующий обязательный фундамент — единая тема/токены и общие компоненты. Сейчас цвета централизованы лишь частично: общая палитра есть, но кнопки/поиск/CSS и статические чтения её обходят. Сначала провести одну настройку темы через общие элементы, затем доводить экраны на этих элементах. Отдельно обновить активный план, чтобы старые статусы и Pen не уводили исполнителя в сторону. Широкое переустройство history/SDK и старые backend/commerce долги не включать автоматически в этот этап; они требуют своих доказательств и приоритетов.

**На пальцах по объёму.** До безопасной массовой UI-доводки осталось примерно **два инженерных пакета и одна короткая приёмка**: (1) данные/черновики/сессия, (2) theme/token/component foundation, (3) адресные проверки, light visual regression и актуальная очередь. Это ориентир **3–5 небольших PR**, а не обещание срока: theme consumer inventory может увеличить объём. Править дизайн отдельных экранов и готовить Figma можно уже параллельно; массово раскрашивать/копировать controls до общей темы невыгодно.

Оценка перехода сейчас **6/10**, цель после этих gates — **около 8/10**: достаточно, чтобы UI стал основной работой, а оставшийся техдолг исправлялся по конкретным сценариям. Это не обещание «весь репозиторий без долгов». Для готовой black-темы дополнительно нужны согласованные дизайн-значения и контраст; её технический каркас можно подготовить раньше, не выдумывая внешний вид.

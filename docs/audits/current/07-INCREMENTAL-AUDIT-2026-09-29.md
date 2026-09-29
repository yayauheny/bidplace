# Дополнительный аудит: session, editor lifecycle и новые тесты

Дата: 2026-09-29. Read-only анализ production; изменения только документационные.
Текущий план и статусы задач: [canonical roadmap](00-EXECUTION-ROADMAP.md).
Этот документ — evidence, а не второй backlog. Исходный аудит сохранён.

## Границы и воспроизводимость

- Checkout, в котором записан документ: `c5ec96c`, до новой audit-ветки. Это **не** свежая release-ветка.
- Проверенная локальная remote-tracking release: `8e0dee2` (merge R04). Fetch в этом проходе не выполнялся.
- Новый production-код и тесты прочитаны из `fix/owner-editor-state` @ `69c4aff` в `/Users/yayauheny/projects/bidplace-owner-editor-state`; этот worktree не изменялся.
- Сравнение роста и reachability: исходный baseline `7d2d547` → `69c4aff`. Findings ниже относятся к `69c4aff`, если не сказано иное. Не считать неслитый код частью release.
- Это дополнительный целевой проход по новым механизмам, а не повторная исчерпывающая сертификация всех 414 production-файлов. Сначала прочитан production, затем tests, затем существующие audit-файлы для сверки.
- Области: AuthProvider/QueryClient, profile/Work/cabinet, achievements, admin media/projection, contracts и request wrapper; import consumers, task/build boundaries. Native/browser/DB/S3 в этом проходе не запускались.
- Использованы code-review-best-practices и security. Секреты и реальные env-файлы не читались.

Ни один ранее незавершённый finding не переведён в VERIFIED этим аудитом.

## 1. CONFIRMED DEFECTS / DEBT

### D09 — refresh сессии обходит retirement private cache

**P1 · HIGH · R31 / Wave 2.**

**Файл/символ:** `apps/mobile/src/providers/auth-provider.tsx :: sessionQuery, refreshSession, setAuthenticatedSession`; `apps/mobile/src/lib/query-cache.ts :: advanceAuthEpoch, clearAuthenticatedSession`.

**Что не так:** login/register и explicit cleanup обновляют generation, но `refreshSession()` просто делает `sessionQuery.refetch()`. Полученный другой user заменяет `['user','me']`, не удаляя seller/admin cache прежнего пользователя и не меняя epoch. Защита поздних callbacks считает старую операцию актуальной.

**Reachability:** `author-email-verification.ts :: verifyEmailAndRefresh` и `components/shared/protected-route.tsx` вызывают refresh. Другой user возможен, например, после изменения cookie в другой вкладке. Это условный сценарий смены identity, а не утверждение, что каждый email refresh её меняет.

**Evidence:** production AuthProvider + real QueryClient в jsdom: initial user A → cache `['seller','profile']={owner:'A'}` → mock `/me` возвращает B → actual refresh. Получено: session B, private cache A сохранён, epoch не изменился. Дополнительный assertion падает; существующий logout test проходит. Браузерная смена cookie не воспроизводилась. Серверный auth bypass не заявляется.

**Почему потом хуже:** новые epoch guards дают ложное ощущение общей изоляции, тогда как один штатный вход обновления auth обходит её.

**Минимальное исправление:** один auth-owned transition для identity change, anonymous и explicit new session; retirement/cancel private reads и mutation continuation generation. Same-user refresh метаданных email не должен без причины уничтожать dirty forms. Учесть initial `/me`, refresh и ошибку refresh отдельно.

**Риск:** HIGH — можно случайно сбрасывать формы при обычном refresh либо оставить гонку в порядке cancel/remove/set session.
**Объединение:** узкий correctness PR R31; не ждать большого A06 refactor. Тестировать A→B, A→null, same-user metadata refresh и поздний callback A после B.

### D10 — дочерний редактор achievements сохраняет старые field/picker races

**P2 · HIGH для потери текста; MEDIUM для session/submit пересечений · R32 / Wave 2.**

**Файл/символ:** `apps/mobile/src/features/sellers/AuthorApplicationAchievements.tsx :: addAchievement, chooseImage, achievementsBusy`; parent `seller-profile-screen.tsx :: AuthorApplicationAchievements`.

**Что не так:** поле «Описание достижения» не получает `editable={!achievementsBusy}`, в отличие от year/month/day. Во время add можно набрать новый текст, но `onSuccess` безусловно делает `setBody('')` и очищает media. Picker проверяет editable только до await, без selection/epoch проверки после picker/blob. Busy дочерних mutations не возвращается родителю, поэтому parent submit не знает о незавершённом add/delete.

**Reachability/evidence:** живой компонент встроен в profile editor, когда есть профиль и разрешён шаг achievements. Прямые setter/handler paths подтверждены статически: add A → ввод B → success A → очистка B. Это не regression последних commits: ранее не охваченный участок. Runtime reproduction данного компонента в этом проходе не выполнялся. Гонка add↔submit может закончиться серверным отказом; обход guards не заявляется.

**Почему потом хуже:** общий profile lifecycle исправлен, а вложенная часть формы имеет независимые state и операции. Пользователь воспринимает их как одну форму.

**Минимальное исправление:** выбрать явную семантику add (заблокировать всю локальную форму или snapshot reconciliation); mutation variables вместо closure, selection/session check; определить минимальное согласование pending child writes с parent submit. Использовать React Query/RHF по месту, не новый store.

**Риск:** MEDIUM — нельзя потерять независимость сохранённых achievements и полей профиля, менять серверную публикацию или блокировать logout навсегда.
**Объединение:** R32, enrich L02/T04. Тестировать реальный child, а не его null-mock.

## 2. CLEANUP OPPORTUNITIES

### C06 — helper save→submit остался только ради тестов

**P3 · HIGH · R09 / Wave 3.**

**Файл/символ:** `apps/mobile/src/features/sellers/product-draft-form.ts :: persistProductDraftBeforeSubmit`; `product-draft-form.spec.ts`.

**Что не так/evidence:** после `6cbb56a` production screen выполняет update→epoch check→submit самостоятельно. Поиск имени во всём mobile src на `69c4aff`: определение и spec, production consumers отсутствуют; barrel export не найден. Тест helper больше не доказывает последовательность реального экрана.

**Почему потом хуже:** в repo остаются две версии ответственности, одна выглядит покрытой и безопасной, но не исполняется в runtime.

**Исправление:** в R09 повторить consumer search и удалить helper вместе с только его тестами. Сохранить остальные mapper/hydration tests этого файла и production-screen regressions.
**Риск:** LOW. **Объединение:** R09 + dead-helper часть T02. Не возвращать helper в runtime только ради сохранения теста.

## 3. ARCHITECTURE RISKS

### A06 — profile query и session lifecycle имеют несколько владельцев

**P2 · HIGH · R33 / Wave 6, сначала Plan.**

**Файлы/символы:** `hooks/use-seller-capability.ts :: useSellerCapability`; `features/sellers/seller-profile-screen.tsx :: useProfileData, keepConfirmedPendingProfile`; `lib/query-cache.ts :: authEpochs, authEpochListeners`; `lib/use-private-cache-epoch.ts`; `providers/auth-provider.tsx`.

**Evidence:** два useQuery с одним `['seller','profile']` имеют повторённые queryFn/session checks, но только screen задаёт structuralSharing для pending snapshots. Экран и capability hook используются в живых profile/cabinet/dock flows. Cache один, а его read policy задаётся в нескольких местах. Дополнительно два WeakMap и useSyncExternalStore создают отдельный канал session invalidation поверх auth query; consumers вручную синхронизируют refs/state/effects.

**Риск:** изменение любого владельца может ослабить сохранение pending или retirement данных. Сам факт нескольких observers допустим; проблема — разные options/политики для одного ресурса. Runtime зависимость от порядка mount не доказана и не объявляется defect.

**Направление Plan:** единая feature-owned queryOptions factory для owner profile; auth provider владеет lifecycle generation, редакторы владеют только локальным input/transition. Сравнить:

1. Сохранить monotonic epoch, убрать дублирование options и документировать единственный transition owner.
2. Session-owned QueryClient/private-key namespace с явным rollout public cache.
3. QueryCache subscription вместо отдельного listener registry, если доказаны эквивалентные semantics.

Уже установленная React Query 5.101.2 предоставляет QueryCache.subscribe, queryOptions и cancellation. Но AbortSignal не отменяет уже принятый сервером mutation; он **не заменяет** проверку принадлежности callback сессии. Same-user logout/login должен отличаться от metadata refresh.

**Риск исправления:** HIGH. **Объединение:** R33 с решением по L02/A04 boundaries, но не один глобальный refactor. Не удалять epoch guards до regression equivalence.

## 4. LIBRARY / FRAMEWORK REPLACEMENT OPPORTUNITIES

### L05 — admin media вручную владеет request state

**P3 · HIGH как opportunity · R34 / Wave 4.**

**Файл/символ:** `features/admin/AdminRevisionPhoto.tsx :: useAdminObjectUrl, AdminRevisionPhoto, AdminReviewImage`; admin screen consumers.

**Evidence:** local effect самостоятельно вызывает loader, хранит failed/loading через uri, отбрасывает поздний результат. При ошибке нет штатного retry action; remount повторяет fetch. И фото ревизии, и gallery используют этот механизм. Это не утверждение о текущей неправильной авторизации: runtime использует cookies.

**Точная замена:** request lifecycle (effect invocation, late request result state, loading/error/retry) → установленный React Query `useQuery`/feature queryOptions с identity по entity/revision/checksum/session. `URL.createObjectURL/revokeObjectURL` остаётся локальным resource effect: Query не должен хранить отозванные URLs. Для request cancellation — R08/AbortSignal, когда доступен в api-client.

**Почему проще:** одна политика retry/error/request ownership вместо новой мини-системы загрузки внутри UI. Не обещается, что количество строк обязательно уменьшится.

**Сохранить:** checksum refetch, old-response protection, decode error, object URL cleanup, private retirement, отсутствие public media leakage. Выбрать и явно задать retention/retry; defaults React Query не считать автоматически подходящими для private blobs.

**Риск:** MEDIUM — приватные bytes в QueryCache, memory/GC и session cleanup. **Объединение:** R34 после R08 и принятого auth boundary R33; низкий приоритет. Не заменять достижение с работающим прямым URL без причины.

### Обогащение L02, L04, A04: где framework помогает, а где не заменяет семантику

- RHF `reset`/`setValue` и mutation variables уже разумно использованы в corrections. `keepDirtyValues` не является заменой snapshot reconciliation: dirty до отправки и изменение после отправки — разные события.
- React Query `scope.id` сериализует mutations **через очередь**, а не игнорирует повторный клик. Автоматическая замена synchronous refs на scope запустит отложенную вторую запись. Рассматривать только там, где очередь является нужной продуктовой семантикой.
- QueryFunctionContext.signal и fetch AbortSignal — существующий R08/L04; не создавать второй finding. API client всё ещё не принимает signal на просмотренной базе.
- `usePreventRemove` и browser history нельзя механически объединять. Сохранить R25 как Plan, не заменять manual history очередной библиотекой.
- Nest ParseUUIDPipe уже используется новым admin photo endpoint; Prisma satisfies/GetPayload и Zod contracts уже применены в admin projection. Здесь нет основания заменять их generic repository/DTO framework.

## 5. FOLDER / MODULE STRUCTURE PROBLEMS

Обогащение L02/S01/A04, без нового косметического finding:

- Work screen вырос с 739 строк (`7d2d547`) до 972 (`69c4aff`); profile — с 205 до 575. В них теперь одновременно rendering, RHF hydration/reconciliation, media selection, session generation, cache arbitration и navigation transitions.
- Размер — индикатор, не самостоятельный defect. После correctness fixes извлекать по ответственности: feature query options; pure snapshot reconciliation; lifecycle hook с явной ownership. Не создавать универсальную state machine всех форм и не делать массовый rename Sellers→Authors/Products→Works.
- `AdminRevisionPhoto.tsx` теперь содержит и Work image component. Если R34 будет выполняться, дать media module имя по реальной ответственности. Отдельный rename PR сейчас не оправдан.

## 6. TEST REVIEW — выполнен после production

### T06 — новые component suites дублируют harness, но пропускают границы вложенной формы

**P2 · HIGH · R28 / Wave 7; поведенческое покрытие D10 входит в R32 сразу.**

**Файлы:** `seller-profile-submit.spec.ts`, `seller-profile-logout.spec.ts`, `product-draft-save-race.spec.ts`, `product-draft-route-guard.spec.ts`, `product-draft-submit-lifecycle.spec.ts`.

**Evidence:** повторены React Native/UI/Router/API mocks, createRoot/QueryClient, DOM click/input/flush helpers. В profile submit suite `AuthorApplicationAchievements` заменён на null: исправный parent не подтверждает D10. Router guard suite моделирует регистрацию/dispatch, а не запускает реальную router/browser lifecycle; появились act warnings. Production-component tests существенно сильнее старых source-text assertions — удалять их как «implementation tests» нельзя.

**Почему потом хуже:** фиксы harness копируются между файлами, разные defaults auth/query скрывают пропуски сценариев. Растёт число зелёных тестов, но не доказательства взаимодействия parent/child и browser.

**Исправление:** сначала реальные regressions D09/D10; затем вынести только повторяющуюся механическую инфраструктуру и typed fixtures. Сохранять per-test ownership, fresh QueryClient и управляемые deferred promises. Не создавать universal fake app и не переносить всё в E2E. Исправить act warnings без подавления console. Удалять старые helper-only tests вместе с C06.

**Риск:** MEDIUM. **Объединение:** R28/T02; D10 coverage раньше, в R32. Время полного suite в этом проходе не измерялось; оснований заявлять, что suite медленный, нет. T05 не закрыт.

## Сверка с прежним аудитом и evidence

- C01/C02: появился конкретный новый test-only helper C06. Это кандидат, код не удалён.
- D04/D05: corrections расширили coverage, но browser NOT RUN; остаются NEEDS_VERIFICATION на owner-editor ветке. Последний review выявил pre-save timestamp boundary в Work hold (T0 rejected → update T1 → submit T2 → late T1). Это открытая часть R05, не новый ID.
- L02/A04/S01: расширены evidence по screen responsibilities; предыдущие решения не отменены.
- T01/R04: подтверждён ранее отдельным review; текущий старый checkout не является доказательством rollback этого исправления.
- T04: добавить real parent/achievement seam; сохранить PARTIAL, не объявлять queue/S3/concurrency покрытыми.
- Верхняя строка roadmap в старом checkout расходится с evidence некоторых выполненных R01/R30. Не переносить статусы автоматически между ветками. Это limitation ведения документа, не новый runtime finding.

Проверки этого прохода:

1. Static imports/references и чтение production, затем tests; измерение файлов по двум Git snapshots.
2. Node 22.20.0, actual AuthProvider + real QueryClient. Временный Vite transform добавил refresh regression только в память runner: **1 existing passed, 1 additional failed**, cache A остался и epoch не изменился. DB/browser не нужны.
3. Ближайший независимый correction review на том же `69c4aff`: 70 focused tests passed; два дополнительных pre-save-boundary regressions failed. Это ранее полученное evidence, не повторный полный прогон этого аудита.
4. Full mobile/API suites, clean build, браузеры и external providers в этом дополнительном аудите не запускались. Числа 486/109 — отчёт implementation, не независимый результат этого прохода.

## Приоритет и упаковка работы

1. Закрыть оставшийся boundary R05, не добавлять поверх него abstraction.
2. R31/D09: auth refresh correctness, небольшой отдельный PR.
3. R32/D10: achievements lifecycle и реальные parent/child regressions.
4. R08/L04: cancellation через существующий fetch, не новая библиотека.
5. R09/C06: удалить только доказанно лишний helper и его тесты.
6. R33/A06: выбрать query/session ownership; потом поэтапная реализация.
7. L02/R15/R16: уменьшать screen orchestration после выбора границ.
8. R28/T06: собрать общую тестовую инфраструктуру после production corrections.
9. R34/L05: admin media query lifecycle — только если стоимость оправдана.
10. R25/A04: navigation decision отдельно, с браузерными доказательствами.

**Не трогать сейчас:** серверные locks/state machines, Zod response validation, правильные Prisma projection selects, epoch checks до эквивалентной замены, канонический дизайн, исторические данные, массовые rename, новую библиотеку state-management. Не объединять auth correctness, весь editor refactor и browser history в один PR.

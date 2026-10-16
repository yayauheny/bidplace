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

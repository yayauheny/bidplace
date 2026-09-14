# Публичные media после hide и stale auth

Приоритет: Needs reproduction; severity после проверки
Источник: CROSS media-cache/optional-auth hypotheses; DATA process-image hypothesis
Статус: Not started.

## Готовый промпт

Выполни только `25-public-media-cache`. Прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md), [карту](../02-FINDING-MAP.md) и релевантные источники с namespace в карте. Это обязательные части задания; отчёты сначала перепроверяются.

### Готовность к старту

После 07/16 для интеграции; initial read-only reproduction отдельно.

### Границы

Public media response/cache policy, CDN assumptions, optional auth boundary, isolated browser tests.

### Задание

Раздели origin404, fresh браузер, ранее закэшированную копию и CDN. Hide не может отозвать уже скачанные байты; не обещай невозможное и не считай screenshot копию server leak. Проверь согласованный уровень revocation, Cache-Control и authenticated/public variants; решение по cache TTL/purge привяжи к privacy contract. Invalid stale cookie в optional public GET не должен менять security без анализа обоих путей.

### Приёмка

Воспроизводимый browser/cache scenario, origin и configured CDN semantics подтверждены. Новые неавторизованные reads fail-closed где должны; private/draft media не становятся public. Документированы пределы ранее выданных данных. Если изменение нужно — test matrix hide/unhide/revision switch/stale cookie, без production purge.

Общие checks/Definition of Done обязательны. Непройденные/недоступные проверки = Partial/Blocked, не Done.

### Не входит / условия остановки

Никакого абсолютного обещания удаления из чужого browser cache; не вводить CDN если его нет.

### Результат

IDs, reproduction/fix evidence, diff/commit, commands/results, documentation, оставшиеся риски и решения. Соседние пакеты автоматически не запускать.

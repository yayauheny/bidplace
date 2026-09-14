# Ключи queries и история автора

Приоритет: P2 после core loop
Источник: M-LOGIC-08,09
Статус: Not started.

## Готовый промпт

Выполни только `18-query-state`. Прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md), [карту](../02-FINDING-MAP.md) и релевантные источники с namespace в карте. Это обязательные части задания; отчёты сначала перепроверяются.

### Готовность к старту

После 05; About URL decision отдельно.

### Границы

Category key consumers, public author infinite hook/URL mapper/tests.

### Задание

Один categories key; перепроверь противоречивую строку аудита «нет живого query». Убери лишний unfiltered fetch при category filter только сохранив нужную author metadata. Query key включает параметры ответа, не tab без влияния на запрос. URL category соответствует принятому history contract. About tab/sort control только по уже принятому решению, не по вкусу. getNextPageParam может быть нужным API TanStack, не удалять слепо.

### Приёмка

List/draft разделяют cache, нет redundant requests при корректно заданной политике freshness. Смена category не смешивает pages, Back/Forward восстанавливает утверждённые параметры. Empty/error filtered results не теряют author header.

Общие checks/Definition of Done обязательны. Непройденные/недоступные проверки = Partial/Blocked, не Done.

### Не входит / условия остановки

Не добавлять новый sort control или удалять URL sort без contract decision.

### Результат

IDs, reproduction/fix evidence, diff/commit, commands/results, documentation, оставшиеся риски и решения. Соседние пакеты автоматически не запускать.

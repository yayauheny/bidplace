# Выборки и производительность

Приоритет: P2 после MVP / по измерениям
Источник: D8, D10, D14, BL-10
Статус: Not started.

## Готовый промпт

Выполни только `09-query-efficiency`. Обязательно прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md) и соответствующие IDs в [data audit](../sources/01-data.md) / [logic audit](../sources/02-business-logic.md). Они являются частью задания.

### Готовность к старту

После 02 и 05.

### Границы

Admin/cabinet pagination, analytics aggregation, catalog query plans/indexes.

### Задание

Измерь realistic synthetic объёмы. Сначала агрегирование analytics в SQL, затем обоснованные bounded lists. EXPLAIN для индексов и latest author activity. Не вычисляй activity после LIMIT, если она определяет порядок. Keyset только по доказанной пользе и согласованному API. Делай отдельные небольшие изменения.

### Приёмка

Aggregates совпадают на границах дат/timezones. Pagination не теряет pending queue, total верен. Stable tie-breakers; до/после измерения доказывают пользу. Forward migrations проверены на disposable DB; изменённая UI pagination проверена.

Дополнительно выполни общие проверки и Definition of Done. Недоступные проверки означают Partial/Blocked с конкретным остатком, а не Done.

### Не входит / условия остановки

Без blanket indexes/cursor migration ради 15 fixtures. Нет пользы — Deferred.

### Результат

Закрытые IDs, evidence, changed files/commit, команды и результаты, обновлённая документация, риски/решения и статус. Не выполнять соседние пакеты автоматически.

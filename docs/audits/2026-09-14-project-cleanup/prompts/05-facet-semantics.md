# Точные facet значения

Приоритет: P2, принятый discovery scope
Источник: D9
Статус: Not started.

## Готовый промпт

Выполни только `05-facet-semantics`. Обязательно прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md) и соответствующие IDs в [data audit](../sources/01-data.md) / [logic audit](../sources/02-business-logic.md). Они являются частью задания.

### Готовность к старту

Можно параллельно 01 в отдельном worktree.

### Границы

Product/Seller catalog queries, normalization, contract/integration/browser tests.

### Задание

Перепроверь DEC-089; согласуй trim/case выдачи facets и comparisons. Substring заменить только для exact facets, не для text search. Отдельно установи AND/OR для multi-select из контракта, не угадывай по аудиту. SQL остаётся параметризованным.

### Приёмка

«Холст» не совпадает с «Холст, масло». Case/edge whitespace согласованы. Tags/city проверены по их контрактам. Multi-select, total, pagination и public-only predicates согласованы. Apply/Reset, URL и text search не регрессируют.

Дополнительно выполни общие проверки и Definition of Done. Недоступные проверки означают Partial/Blocked с конкретным остатком, а не Done.

### Не входит / условия остановки

Без FTS/keyset или новых controls.

### Результат

Закрытые IDs, evidence, changed files/commit, команды и результаты, обновлённая документация, риски/решения и статус. Не выполнять соседние пакеты автоматически.

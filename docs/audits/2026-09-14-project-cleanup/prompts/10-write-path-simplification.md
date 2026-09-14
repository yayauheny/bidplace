# Упрощение write paths

Приоритет: P2 после correctness
Источник: BL-08, BL-09; часть BL-15
Статус: Not started.

## Готовый промпт

Выполни только `10-write-path-simplification`. Обязательно прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md) и соответствующие IDs в [data audit](../sources/01-data.md) / [logic audit](../sources/02-business-logic.md). Они являются частью задания.

### Готовность к старту

После 01–04 и 08.

### Границы

ProductsService mapping/write orchestration, SellersService responsibilities, regression tests.

### Задание

Сохрани модель revision/published. Сделай lock → state check → revision write → нужная legacy sync явными. Объединяй поля только при общей semantics, сохраняя omitted/null/default. SellersService дели по ответственностям с пользой для consumers, без DI-пирамиды/механического дробления.

### Приёмка

Tests покрывают unpublished/approved/hidden и writable/locked states. Права, ошибки, PATCH/public output не меняются. Дубли mappings уменьшаются, путь вызовов проще.

Дополнительно выполни общие проверки и Definition of Done. Недоступные проверки означают Partial/Blocked с конкретным остатком, а не Done.

### Не входит / условия остановки

Изменение persistent source of truth D3 только в 11, не скрывать в refactor.

### Результат

Закрытые IDs, evidence, changed files/commit, команды и результаты, обновлённая документация, риски/решения и статус. Не выполнять соседние пакеты автоматически.

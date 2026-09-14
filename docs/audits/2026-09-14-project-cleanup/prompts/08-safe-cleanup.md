# Безопасное удаление лишнего кода

Приоритет: P2 после correctness
Источник: BL-07, D7; legacy часть BL-15
Статус: Not started.

## Готовый промпт

Выполни только `08-safe-cleanup`. Обязательно прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md) и соответствующие IDs в [data audit](../sources/01-data.md) / [logic audit](../sources/02-business-logic.md). Они являются частью задания.

### Готовность к старту

После 01–04; до 10.

### Границы

Wrappers/DI/selects/parse helpers и consumers/tests.

### Задание

Для каждого удаления проверь imports, DI, dynamic use, scripts/public exports. Unused hide/unhide/injection удаляй по доказательству. Совпадающие helpers объединяй при общей семантике. HTTP alias не удалять только потому, что default client его не зовёт: нужен compatibility/consumer proof. BYTEA исключай из select только если байты не нужны для publish/copy. Legacy ветки требуют data inventory.

### Приёмка

Nest boot/routes проходят, API поведение сохранено. Media publication работает с новыми selects. Для каждого удаления есть доказательство; число слоёв/повторов уменьшено без generic framework.

Дополнительно выполни общие проверки и Definition of Done. Недоступные проверки означают Partial/Blocked с конкретным остатком, а не Done.

### Не входит / условия остановки

Portfolio projections сохранить. Неизвестные external consumers/inventory означают оставить конкретный кандидат.

### Результат

Закрытые IDs, evidence, changed files/commit, команды и результаты, обновлённая документация, риски/решения и статус. Не выполнять соседние пакеты автоматически.

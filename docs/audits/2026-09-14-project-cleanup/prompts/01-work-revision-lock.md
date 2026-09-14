# Блокировка Work revision

Приоритет: P1, до MVP
Источник: BL-01, BL-14; часть BL-08
Статус: Not started.

## Готовый промпт

Выполни только `01-work-revision-lock`. Обязательно прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md) и соответствующие IDs в [data audit](../sources/01-data.md) / [logic audit](../sources/02-business-logic.md). Они являются частью задания.

### Готовность к старту

Нет; до 02.

### Границы

ProductsService.update, product-revision-write/state, ImagesService add/delete/reorder, unit/integration tests.

### Задание

Подключи canAuthorEditRevision ко всем путям изменения content/gallery. Проверяй revision status внутри TX под Product row lock. Сохрани правильный fork approved revision и draft/changes-requested/rejected semantics.

### Приёмка

Published/hidden Work с pending revision отклоняют PATCH/add/delete/reorder без side effects; код ошибки согласован с контрактом. После changes requested edit разрешён. Guest до approve видит прежнюю версию. Проверь submit/edit/approve concurrency в disposable PostgreSQL, а не только helper.

Дополнительно выполни общие проверки и Definition of Done. Недоступные проверки означают Partial/Blocked с конкретным остатком, а не Done.

### Не входит / условия остановки

Не переписывать весь service; DTO/очередь в 02, полный refactor в 10.

### Результат

Закрытые IDs, evidence, changed files/commit, команды и результаты, обновлённая документация, риски/решения и статус. Не выполнять соседние пакеты автоматически.

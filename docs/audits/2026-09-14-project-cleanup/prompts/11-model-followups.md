# Модель данных и schema follow-ups

Приоритет: P2 после MVP, inventory gates
Источник: D3, D4, D13; legacy BL-15
Статус: Not started.

## Готовый промпт

Выполни только `11-model-followups`. Обязательно прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md) и соответствующие IDs в [data audit](../sources/01-data.md) / [logic audit](../sources/02-business-logic.md). Они являются частью задания.

### Готовность к старту

После 10; отдельное обоснование каждого шага.

### Границы

Schema/query ownership, category FK, inventory plan.

### Задание

Раздели на шаги. A: FK revision category после orphan inventory и выбора delete policy по существующей Category relation. B: оцени identity+pointers вместо duplicated content, всех consumers и migration compatibility; реализация только при ясном плане. C: BYTEA/commerce/PhoneVerificationCode/legacy branches оставь до inventory, backfill/restore и существующих gates.

### Приёмка

FK запрещает dangling references и соблюдает выбранную delete policy без молчаливого удаления данных. SoT change, если обоснован, сохраняет public list/detail/facets, owner/admin и staged migration. Deferred removals имеют точные prerequisites.

Дополнительно выполни общие проверки и Definition of Done. Недоступные проверки означают Partial/Blocked с конкретным остатком, а не Done.

### Не входит / условия остановки

Applied migrations не переписывать. Не DROP по отсутствию UI. D14 остаётся 09; анализ не разрешает production migration.

### Результат

Закрытые IDs, evidence, changed files/commit, команды и результаты, обновлённая документация, риски/решения и статус. Не выполнять соседние пакеты автоматически.

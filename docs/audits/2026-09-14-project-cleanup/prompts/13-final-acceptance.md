# Документы и итоговая приёмка

Приоритет: Финальный gate
Источник: Расхождения обоих аудитов; результаты 01–12
Статус: Not started.

## Готовый промпт

Выполни только `13-final-acceptance`. Обязательно прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md) и соответствующие IDs в [data audit](../sources/01-data.md) / [logic audit](../sources/02-business-logic.md). Они являются частью задания.

### Готовность к старту

После выбранных пакетов; повторить после остальных аудитов.

### Границы

Evidence reconciliation, readiness/gaps, owner status/architecture, release checks.

### Задание

Сопоставь commits/tests с IDs. Исправь текущие claims COMMERCE_ENABLED/media support/revision DTO/socialLink/counts по фактам. Исторические записи не переписывай: датированное supersedes. ILIKE не объявлять FTS bug без определения требования. Пройди author edit → submit → admin queue → decision → public output.

### Приёмка

Все IDs fixed/partial/deferred/rejected/needs verification с evidence. verify и mobile suite плюс затронутые integration/browser запущены на одной базе. Storage/staging/внешние gates отдельно. Неполученные аудиты и founder decisions остаются открытыми; нет утверждения о готовности всего MVP по двум отчётам.

Дополнительно выполни общие проверки и Definition of Done. Недоступные проверки означают Partial/Blocked с конкретным остатком, а не Done.

### Не входит / условия остановки

Новые bugs не исправлять без отдельного scope. Дизайн и безопасность целиком пока не проверены.

### Результат

Закрытые IDs, evidence, changed files/commit, команды и результаты, обновлённая документация, риски/решения и статус. Не выполнять соседние пакеты автоматически.

## Дополнение после новых аудитов

Расширение: итоговый gate теперь после выбранных 01–25, не только первых 13. CROSS:T7 и DS-14 относятся к документальной сверке (visual prerequisite — 22). Verdict NO-GO в source03 — датированная оценка аудитора, не новый независимо проверенный вердикт этого planning pack. Проверяй final author loop и legal/ops/storage gates; визуальный UX-аудит ещё ожидается.

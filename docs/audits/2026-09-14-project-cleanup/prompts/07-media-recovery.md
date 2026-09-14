# DB/S3 failure recovery

Приоритет: P1 launch candidate, сценарии перепроверить
Источник: D5
Статус: Not started.

## Готовый промпт

Выполни только `07-media-recovery`. Обязательно прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md) и соответствующие IDs в [data audit](../sources/01-data.md) / [logic audit](../sources/02-business-logic.md). Они являются частью задания.

### Готовность к старту

Fault preflight отдельно; реализацию сериализовать с 01–04, финальный drill после 06.

### Границы

S3 ImageStore, upload/delete consumers, minimal recovery persistence, disposable MinIO tests, ops/security docs.

### Задание

Построй порядок await put/commit/delete. Не считай доказанным «put упал, commit прошёл», если ошибка откатывает TX. Проверь orphan после commit failure, timeout с неизвестным результатом, crash, delete failure и stable-key overwrite. Сравни compensation/reconciliation, staged upload/confirm, outbox; выбери минимальный durable вариант по доказанным гарантиям, не по названию из аудита.

### Приёмка

Fault tests до/после put/commit/unlink, retry и restart. Public metadata не ведёт на неподтверждённые bytes, прежние bytes не теряются. Orphans обнаруживаются и убираются retry-механизмом, переживающим restart. Cleanup не удаляет referenced/published media. Ошибки не только логируются. Recovery drill воспроизводим.

Дополнительно выполни общие проверки и Definition of Done. Недоступные проверки означают Partial/Blocked с конкретным остатком, а не Done.

### Не входит / условия остановки

Не обещать атомарный Prisma+S3 commit. Production provider/deploy вне scope; не ослаблять S3 requirement.

### Результат

Закрытые IDs, evidence, changed files/commit, команды и результаты, обновлённая документация, риски/решения и статус. Не выполнять соседние пакеты автоматически.

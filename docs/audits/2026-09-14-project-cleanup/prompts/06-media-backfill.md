# Полнота media backfill

Приоритет: P1 условный: запуск с BYTEA данными
Источник: D6; D13 как ограничение
Статус: Not started.

## Готовый промпт

Выполни только `06-media-backfill`. Обязательно прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md) и соответствующие IDs в [data audit](../sources/01-data.md) / [logic audit](../sources/02-business-logic.md). Они являются частью задания.

### Готовность к старту

Сначала key inventory; storage gate вместе с 07.

### Границы

backfill/restore scripts, key families, fixtures/tests, ops docs.

### Задание

Сопоставь все ImageStore key families и byte sources. Добавь revision photos/achievements при подтверждении. Явно обрабатывай дубли ключей, пустые placeholders, missing bytes; не затирай правильный S3 object пустыми данными. Сохрани dry-run default, checksums и идемпотентность.

### Приёмка

Dry-run counts верны по типам. Изолированный перенос/повтор и restore checksum проходят. Mismatch/missing source видны как failure/gap. После второго profile approve photo и achievements доступны. Нет секретов в отчёте; production перенос не объявлен выполненным.

Дополнительно выполни общие проверки и Definition of Done. Недоступные проверки означают Partial/Blocked с конкретным остатком, а не Done.

### Не входит / условия остановки

Не удалять BYTEA и не запускать shared staging/prod. Без реального безопасного inventory launch evidence остаётся Needs verification.

### Результат

Закрытые IDs, evidence, changed files/commit, команды и результаты, обновлённая документация, риски/решения и статус. Не выполнять соседние пакеты автоматически.

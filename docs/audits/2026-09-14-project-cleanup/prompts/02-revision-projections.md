# Ревизии в очереди и кабинете

Приоритет: P1, до MVP
Источник: D1, D2, BL-02, BL-15; часть BL-10
Статус: Not started.

## Готовый промпт

Выполни только `02-revision-projections`. Обязательно прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md) и соответствующие IDs в [data audit](../sources/01-data.md) / [logic audit](../sources/02-business-logic.md). Они являются частью задания.

### Готовность к старту

После 01; согласовать contracts с 04.

### Границы

Owner/admin/cabinet contracts/mappers, admin lists, mobile moderation/cabinet/editor, HTTP/browser tests.

### Задание

Добавь editing revision id/status отдельно от live status. Admin показывает отправленные поля/фото и корректные действия для Work/Profile. Pending queue включает повторную модерацию и hidden Work. Проверь старые moderation reasons и неверный текст о снятии с публикации. Перенос list orchestration из controller только в рамках этого поведения.

### Приёмка

После resubmit обе сущности видны в очереди и owner pending. До approve публичная версия прежняя, после новая. Request changes/reject не скрывают прежнюю версию; hidden остаётся hidden после approve. Guest DTO не содержит editing data. Browser тест использует очередь, а не только прямой PATCH. Матрица live × revision документирована.

Дополнительно выполни общие проверки и Definition of Done. Недоступные проверки означают Partial/Blocked с конкретным остатком, а не Done.

### Не входит / условия остановки

Не менять live status для удобства фильтра и не редизайнить UI. D1/BL-02 закрываются одним пакетом.

### Результат

Закрытые IDs, evidence, changed files/commit, команды и результаты, обновлённая документация, риски/решения и статус. Не выполнять соседние пакеты автоматически.

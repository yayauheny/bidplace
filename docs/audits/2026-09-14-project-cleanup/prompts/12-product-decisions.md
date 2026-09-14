# Legacy API и последствия ban

Приоритет: Decision-gated
Источник: BL-11, BL-13, D11, D12; process-media hypothesis
Статус: Not started.

## Готовый промпт

Выполни только `12-product-decisions`. Обязательно прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md) и соответствующие IDs в [data audit](../sources/01-data.md) / [logic audit](../sources/02-business-logic.md). Они являются частью задания.

### Готовность к старту

Read-only подготовка сейчас; продуктовая реализация после ясного решения.

### Границы

Consumer/contract inventory, варианты решения и узкие follow-up prompts.

### Задание

A: ban vs suspend/hide: предложи admin-композицию/runbook с recovery, не меняй public visibility молча. B: legacy creation/write fields: проверь существующие решения/consumers, предложи compatibility cut, сохрани story/uniqueness/data history. C: воспроизведи creationIntro overwrite и process-image authorization; UUID entropy не гарантия privacy. Подтверждённый leak выдели срочным security fix отдельно от полного legacy cut.

### Приёмка

Decision deliverable содержит варианты, рекомендацию, affected routes/data/UI, точное необходимое решение и tests. После выбора implementation тестирует login/session revocation и согласованную публичность. Legacy cut имеет consumer/compatibility proof без автоматического удаления данных.

Дополнительно выполни общие проверки и Definition of Done. Недоступные проверки означают Partial/Blocked с конкретным остатком, а не Done.

### Не входит / условия остановки

Передача этого задания не является выбором ban semantics или одобрением удаления API. При достаточном уже принятом решении повторного согласования не требовать.

### Результат

Закрытые IDs, evidence, changed files/commit, команды и результаты, обновлённая документация, риски/решения и статус. Не выполнять соседние пакеты автоматически.

## Дополнение после новых аудитов

Дополнение CROSS:T6: отсутствие ban→public404 test не даёт основание ввести такую семантику. Uniqueness required, About tab URL, curator UI и destructive styling — отдельные точные развилки в 14/18/22/23. Не повторять согласование уже ясных founder decisions.

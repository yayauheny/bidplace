# Сериализация fork профиля

Приоритет: P1-порядок, исходный BL-12 P2
Источник: BL-12
Статус: Not started.

## Готовый промпт

Выполни только `03-profile-concurrency`. Обязательно прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md) и соответствующие IDs в [data audit](../sources/01-data.md) / [logic audit](../sources/02-business-logic.md). Они являются частью задания.

### Готовность к старту

После 02 из-за общего sellers.service; до 04.

### Границы

SellersService update/submit, parent/revision lock helpers, concurrency tests.

### Задание

Воспроизведи двойной PATCH после approve. Выбери единый порядок locks для update/submit/achievement/admin затронутых путей. Перечитай состояние под lock. Catch P2002 не заменяет invariant; отображай только ожидаемые конфликты.

### Приёмка

Concurrent fork не даёт 500, создаёт одну актуальную editing revision и сохраняет PATCH semantics. Submit/edit и approve/edit не обходят state gate. Нет обратного lock order; управляемые concurrency tests без случайных sleep.

Дополнительно выполни общие проверки и Definition of Done. Недоступные проверки означают Partial/Blocked с конкретным остатком, а не Done.

### Не входит / условия остановки

Не вводить distributed lock/queue и не рефакторить каталоги.

### Результат

Закрытые IDs, evidence, changed files/commit, команды и результаты, обновлённая документация, риски/решения и статус. Не выполнять соседние пакеты автоматически.

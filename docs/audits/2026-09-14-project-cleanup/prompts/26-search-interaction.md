# Поиск: Enter и пустые результаты

Приоритет: P1/P2 до MVP; severity перепроверить
Источник: UX-02, UX-05
Статус: Not started.

## Готовый промпт

Выполни только `26-search-interaction`. Прочитай [условия](../01-EXECUTION-RULES.md), [порядок](../README.md), [карту](../02-FINDING-MAP.md) и [UX source](../sources/07-visual-ux.md). Перепроверь finding на текущей базе; старые screenshots/номера строк не свежая приёмка.

### Готовность к старту

После 14 при shared input изменениях; сериализовать Search с 20 copy и 27 headings.

### Границы

Search screen и FilterSearchField submit API, targeted unit/browser tests.

### Задание

Одна команда поиска для кнопки и Enter; используй существующие platform input/form APIs без search library. Сохрани draft до submit, URL committed query, независимые Work/Author запросы. Добавь onSubmitEditing/returnKeyType или web form по текущему stack, не вызывай submit дважды. Для нулевого результата один итоговый empty, но только после успешного завершения обеих загрузок; error/loading не превращать в «не найдено».

### Приёмка

Enter и кнопка дают одинаковый URL/запрос. IME composition не вызывает преждевременный submit, whitespace/empty соответствует контракту. Пока одна сторона loading/error, другая показывает собственный результат и retry. Полный успешный ноль даёт один empty; частичный hit не скрывается. Back/Forward восстанавливает committed query; фильтры не начинают неожиданно применять draft по Enter.

Общие checks и Definition of Done обязательны. Не выполненные проверки отражай Partial/Blocked.

### Не входит / условия остановки

Не вводить live-search/debounce или общий агрегированный query; штатные независимые retry сохранить.

### Результат

Finding IDs, evidence, diff/commit, commands/results, screenshots с методом, документация, риски/решения и статус. Не выполнять другие пакеты автоматически.

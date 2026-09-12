# P1 · Общие controls фильтров и сортировки

Рекомендуемый исполнитель: Sol high.
Зависимости: До catalog assembly; не зависит от завершения автора.

## Промпт для передачи

Работай в `/Users/yayauheny/projects/bidplace`. Выполни только задачу «P1 · Общие controls фильтров и сортировки».
Сначала прочитай `docs/tasks/2026-09-12-figma-finish/01-RULES.md`: это обязательная часть задания, включая источники, ограничения, браузерную приёмку и формат завершения.

Источники в read-only `design/figma-handoff/portfolio-phone-v1`: `874:5434`; filters `526:12980`, `526:13009`, `526:13065`, `526:13142`, `584:17554`.
Разрешённая область: Новые/существующие masters `FilterSortBar`, `FilterSheet`, option/search/action в `components/figma`; существующие hooks фильтров только для подключения demonstration consumer.

Собери query-free masters панели и sheet по source nodes. Выбранные значения и callbacks приходят извне. Сначала сверь реальные contracts category/material/direction/city, single/multi selection и сортировку. Если источник предлагает unsupported filter, не имитировать фильтрацию на клиенте.

Критерии: закрыто/открыто, selected/unselected, search-empty, apply/reset/cancel, длинные labels и ошибка/disabled count-action визуально проверены. Focus trap, Escape, возврат focus, отсутствие dock поверх modal, scroll длинного списка работают. Не реализовывать search overlay, auction/buy/archive tabs. Не менять server filtering и не превращать этот пакет в переписывание каталогов. Передай assembly-задачам точные props и короткий usage example.

Без эталона и итогового browser screenshot задача визуально не принята. Typecheck/lint/tests/build — отдельный технический gate. Не подменяй проверку дизайна тестами и не расширяй scope. Сохрани отчёт по правилам01, обнови статусы и сделай отдельный коммит только своих изменений.

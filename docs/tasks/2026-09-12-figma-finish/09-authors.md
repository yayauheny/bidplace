# P2 · Сборка каталога авторов

Рекомендуемый исполнитель: Terra; Grok/Composer после пилота.
Зависимости: 04 и 06 приняты.

## Промпт для передачи

Работай в `/Users/yayauheny/projects/bidplace`. Выполни только задачу «P2 · Сборка каталога авторов».
Сначала прочитай `docs/tasks/2026-09-12-figma-finish/01-RULES.md`: это обязательная часть задания, включая источники, ограничения, браузерную приёмку и формат завершения.

Источники в read-only `design/figma-handoff/portfolio-phone-v1`: authors default `526:12904`; filters direction/city из06.
Разрешённая область: `features/sellers/public-authors-screen.tsx` и непосредственно используемые hooks.

Собери каталог авторов из готовых masters, сохрани public API eligibility, pagination и существующие фильтры. Не делай клиентскую подмену серверной выдачи.

Критерии:390px совпадение композиции, реальные переходы на автора, filter/apply/reset, Back и длинное имя/теги. Loading/empty/error/next page проверены. Не меняй AuthorCoverCard и общеэкранную атмосферу внутри каталога. Если не хватает API поля, укажи gap без fake data. Shared identity/card уже существуют — не создавать второй master.

Без эталона и итогового browser screenshot задача визуально не принята. Typecheck/lint/tests/build — отдельный технический gate. Не подменяй проверку дизайна тестами и не расширяй scope. Сохрани отчёт по правилам01, обнови статусы и сделай отдельный коммит только своих изменений.

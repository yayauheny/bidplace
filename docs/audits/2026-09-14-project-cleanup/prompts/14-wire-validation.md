# PATCH, multipart и границы валидации

Приоритет: P1 correctness (VAL:D1 исходный P0); до form fixes
Источник: VAL:D1–D5, D8, D10; VAL:H1–H5
Статус: Not started.

## Готовый промпт

Выполни только `14-wire-validation`. Прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md), [карту](../02-FINDING-MAP.md) и релевантные источники с namespace в карте. Это обязательные части задания; отчёты сначала перепроверяются.

### Готовность к старту

До 04/15/17 в contracts; после перепроверки текущей базы.

### Границы

packages/contracts, api-client transport, server request parsing, точечные form adapters/errors; не весь RHF refactor.

### Задание

Зафиксируй таблицу omitted=skip/null=clear/empty semantics по каждому полю. Для multipart выбери стандартный JSON payload part или явное согласованное кодирование очистки; не вводи глобальный null codec для всех endpoints. Сохрани file+JSON и HTTPS. Установи max по фактическим DB columns и charset semantics; не ужесточай response на legacy rows без inventory. Auth compose общие rules, normalization до email validation, password не trim. Optional phone и uniqueness required должны следовать продукту: при неопределённости отдельное решение. Отобрази VALIDATION_ERROR field paths доступно, сохрани form-level/network errors.

### Приёмка

HTTP multipart PATCH действительно очищает URL; omitted сохраняет, invalid HTTPS не проходит, guest projection безопасна. Work PATCH clear по разрешённым optional fields; title и publish requirements не ослаблены. Boundary/max+1, Unicode длины и oversized HTTP проверены. Empty optional phone/normalized email согласованы UI/API. Server fieldErrors видны у правильного поля, client parse не выдаёт необработанный exception.

Общие checks/Definition of Done обязательны. Непройденные/недоступные проверки = Partial/Blocked, не Done.

### Не входит / условия остановки

Не навязывать null всем полям или обязательность uniqueness. Localize errors без копий rules. VAL:D13 legal response — 20.

### Результат

IDs, reproduction/fix evidence, diff/commit, commands/results, documentation, оставшиеся риски и решения. Соседние пакеты автоматически не запускать.

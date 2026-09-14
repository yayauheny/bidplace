# Кабинет, hide/unhide и начало редактирования

Приоритет: P1 core loop (источники P0)
Источник: M-LOGIC-01; CROSS:B3; часть M-LOGIC-12
Статус: Not started.

## Готовый промпт

Выполни только `17-author-cabinet`. Прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md), [карту](../02-FINDING-MAP.md) и релевантные источники с namespace в карте. Это обязательные части задания; отчёты сначала перепроверяются.

### Готовность к старту

После 02/16, затем 15 integration; design reference preflight 22.

### Границы

Cabinet screen/route/query, dock navigation, owner Work/Profile start-edit capability; существующий API.

### Задание

Свяжи listCabinetWorks с реальным достижимым экраном и показом live/revision состояний. Добавь hide/unhide и корректные invalidations. Разреши начать editing опубликованного профиля/Work по server semantics, не разрешая правку уже pending revision. Не делай пустой PATCH при каждом mount: форк только по явному действию/первому изменению, повторяемо. Установи route/approved design из owner docs; если frame или flow отсутствует — подготовь конкретный design gap, не выдумывай кабинет под предлогом существующего API.

### Приёмка

Автор на 390 находит draft после Close, resume/edit published доступны; pending lock сохранён. Hide даёт guest API404, unhide восстанавливает; owner доступ сохранён. Profile APPROVED/APPROVED может начать fork. Empty/loading/error/retry, long list, keyboard доступны. Путь create→cabinet→edit→moderate проверен без ручного ввода секретного URL.

Общие checks/Definition of Done обязательны. Непройденные/недоступные проверки = Partial/Blocked, не Done.

### Не входит / условия остановки

Public cache revocation отдельно 25. Не удалять API из-за нулевых старых callers; не менять Product.status для UI.

### Результат

IDs, reproduction/fix evidence, diff/commit, commands/results, documentation, оставшиеся риски и решения. Соседние пакеты автоматически не запускать.

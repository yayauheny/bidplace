# Work: save, review, submit и close

Приоритет: P1 data correctness (исходный P0 для submit)
Источник: M-LOGIC-02,06,07,10,13; VAL:D8,D11; CROSS:G3
Статус: Not started.

## Готовый промпт

Выполни только `15-work-editor-persistence`. Прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md), [карту](../02-FINDING-MAP.md) и релевантные источники с namespace в карте. Это обязательные части задания; отчёты сначала перепроверяются.

### Готовность к старту

После 01/02/14; согласовать навигацию с 17 и отдельную dirty packaging работу.

### Границы

Work editor/form adapters, mutation orchestration, relevant wizard tests; UI composition сохраняется.

### Задание

Один владелец пользовательского draft; RHF использовать если реально уменьшает ручные states, не обязательная перепись. Submit сначала сохраняет текущий snapshot, затем отправляет именно его; failure не продолжает submit. Review показывает тот же snapshot, исключи смешение local/server. На Close сохраняй непустой draft, failure удерживает на экране. Не reset dirty form на refetch/id hydration, особенно после create. Не подменяй local submit outcome одним Product.status: live APPROVED не отражает pending revision. Packaging omit перепроверь в чужом dirty diff без присвоения изменений; не null старые данные.

### Приёмка

Изменить сохранённое A→B, перейти review/submit: admin получает B. Save failure не вызывает submit; retry не создаёт duplicate. Close/reload восстанавливает поля; поздний fetch не стирает новые символы. Locked pending нельзя менять. Четыре шага проходят Playwright 390 в disposable среде; старый тест не диктует UI.

Общие checks/Definition of Done обязательны. Непройденные/недоступные проверки = Partial/Blocked, не Done.

### Не входит / условия остановки

Browser unload нельзя надёжно чинить async save: для требования reload/history рассмотри своевременный persist, явно покажи границы. Aliases deep links не удалять по старым тестам.

### Результат

IDs, reproduction/fix evidence, diff/commit, commands/results, documentation, оставшиеся риски и решения. Соседние пакеты автоматически не запускать.

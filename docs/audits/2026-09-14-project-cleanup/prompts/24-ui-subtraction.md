# Удаление недостижимого UI и лишних зависимостей

Приоритет: P2 cleanup; native Deferred
Источник: DS-03,09–11,13,15; M-LOGIC-11; VAL:D6,D7,D9,D14,D15
Статус: Not started.

## Готовый промпт

Выполни только `24-ui-subtraction`. Прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md), [карту](../02-FINDING-MAP.md) и релевантные источники с namespace в карте. Это обязательные части задания; отчёты сначала перепроверяются.

### Готовность к старту

После 22/17/23 и выявления active consumers; contracts cleanup сериализовать с 14/20.

### Границы

Unused headers/composed UI/props/fonts/tokens/deps, safe contract leftovers; отдельные малые commits.

### Задание

Докажи reachability включая barrels/routes/platform suffix/config/side effects. Удали только доказанно лишнее header tree/OverlayHost, сохрани useDismissibleOverlay при FilterSheet caller. Неиспользуемый draft process builder не подключать. CreatorCard mapper/public projections сохранить. Fonts/deps удалять после runtime/bundle проверки. NativeWind — отдельная optional попытка с glass CSS/build proof; не обязательный removal. Semantic aliases одного цвета могут быть разными ролями. Unused publicSeller schema не alias на несовместимый DTO ради имени. Общие ok/achievement schemas только при одинаковой семантике. USER audit enum не расширять до реального HTTP consumer; retained enums/error compatibility не удалять автоматически.

### Приёмка

Для каждого удаления consumer proof; app boot/export/mobile tests проходят, public/owner screens и glass/frost/dock визуально прежние. Tests удаляются вместе с исчезнувшей ответственностью, не ради зелёного gate. Нет новых wrappers. Native tabs parity явно Deferred, не скрытая регрессия.

Общие checks/Definition of Done обязательны. Непройденные/недоступные проверки = Partial/Blocked, не Done.

### Не входит / условия остановки

Desktop/native вне acceptance не значит разрешение удалить поддерживаемую платформу. Чужой header E2E gate заменить корректным runtime evidence до удаления.

### Результат

IDs, reproduction/fix evidence, diff/commit, commands/results, documentation, оставшиеся риски и решения. Соседние пакеты автоматически не запускать.

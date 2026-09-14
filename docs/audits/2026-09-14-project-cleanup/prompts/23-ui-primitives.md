# Единые tokens, controls, sheets и icons

Приоритет: P2 polish/accessibility до приёмки affected UI
Источник: DS-02,04–08,12
Статус: Not started.

## Готовый промпт

Выполни только `23-ui-primitives`. Прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md), [карту](../02-FINDING-MAP.md) и релевантные источники с namespace в карте. Это обязательные части задания; отчёты сначала перепроверяются.

### Готовность к старту

После 22; owner controls после 04, reject UI после 02; serialize shared files.

### Границы

Live shared primitives/tokens/CSS; Share/AppDialog/FilterSheet; auth link/owner choice; scoped visual tests.

### Задание

Проверь actual Figma nodes через required skills до точных visual changes. Один focus source из tokens в CSS без ручной второй палитры. Compare installed dialog primitive vs custom traps: разные sheet roles оправданы, удаление готовой a11y инфраструктуры ради вида не цель. Share chrome адаптируй к reference, сохрани focus/escape/dismiss/scroll semantics; без flags-комбайна. Один icon registry по подтверждённым glyphs. DestructiveButton одинакового цвета с primary не доказательство дефекта: проверь design intent/labels/confirm, не выдумывай красный. Choice controls по owner frame, не автоматически public chip. Auth link role/size по approved state. Повторный value не всегда одна semantic роль.

### Приёмка

Before/after screenshots одинаковых states 390 и matched reference; keyboard focus виден, contrast, focus trap/restore, Escape, zoom/reduced-motion проверены в runtime. QR download/copy не сломаны. Admin destructive/reject reason controls безопасны. Одна semantic focus binding, измеренные gradient/close tokens где оправдано.

Общие checks/Definition of Done обязательны. Непройденные/недоступные проверки = Partial/Blocked, не Done.

### Не входит / условия остановки

Fixture swatches не pixel proof. Отсутствие close glyph в README не доказывает отсутствие его в Figma. Owner/admin не просмотрены аудитором — не заявлять parity без проверки.

### Результат

IDs, reproduction/fix evidence, diff/commit, commands/results, documentation, оставшиеся риски и решения. Соседние пакеты автоматически не запускать.

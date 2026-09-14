# Dock, читаемость и увеличение

Приоритет: Needs reproduction; до visual acceptance
Источник: UX-03, UX-10
Статус: Not started.

## Готовый промпт

Выполни только `28-dock-readability`. Прочитай [условия](../01-EXECUTION-RULES.md), [порядок](../README.md), [карту](../02-FINDING-MAP.md) и [UX source](../sources/07-visual-ux.md). Перепроверь finding на текущей базе; старые screenshots/номера строк не свежая приёмка.

### Готовность к старту

После 22/23/27 и актуальных screen changes; до 24 если там меняется shell.

### Границы

AppShell/FloatingDock shared clearance, Work/Author tab content, cover title clipping, targeted browser geometry/screenshots.

### Задание

Воспроизведи 390×844 и 390×860, длинные title/chips/tab content, начало/конец/середину scroll. Раздели fixed overlay на scrollable content, действительно недостижимый/закрытый текст и пожелание уместить первый абзац above fold. Аудитный критерий «tabpanel.y+12<dock.y» не универсальный контракт и не повод сжать все отступы. Проверь native browser zoom/доступные реальные text scaling способы отдельно от CSS zoom; последний только диагностический эксперимент. Если требуется иной first fold, число chips, card line clamp или gallery region — найди разрешённую composition, иначе конкретный design decision. Не сокращай 3:4 gallery и не скрывай факты самовольно.

### Приёмка

Все четыре dock actions достижимы при подтверждённом zoom сценарии без clipping; содержание Work/Author можно прочитать и keyboard focus не закрыт fixed controls. Есть корректный reserve до конца scroll и согласованная first-fold композиция. Long titles доступны по принятому visual/accessibility контракту; не обещать вместить произвольно длинный title в две строки. Before/after одинаковые viewport/DPR/zoom с точным методом; short/tall screens и safe area проверены. Ограничения browser zoom честно записаны.

Общие checks и Definition of Done обязательны. Не выполненные проверки отражай Partial/Blocked.

### Не входит / условия остановки

Не вводить второй dock, route-local magic offsets или новый gallery scroll region без решения. Отсутствие scrollWidth overflow не доказывает отсутствие clipping. Не выдавать CSS zoom proof за браузерную приёмку.

### Результат

Finding IDs, evidence, diff/commit, commands/results, screenshots с методом, документация, риски/решения и статус. Не выполнять другие пакеты автоматически.

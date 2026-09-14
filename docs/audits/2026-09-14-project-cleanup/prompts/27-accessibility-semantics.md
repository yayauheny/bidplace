# Семантика заголовков, ошибок и диалогов

Приоритет: P1/P2 shared correctness до приёмки
Источник: UX-04, UX-06, UX-07; DS-04 a11y пересечение
Статус: Not started.

## Готовый промпт

Выполни только `27-accessibility-semantics`. Прочитай [условия](../01-EXECUTION-RULES.md), [порядок](../README.md), [карту](../02-FINDING-MAP.md) и [UX source](../sources/07-visual-ux.md). Перепроверь finding на текущей базе; старые screenshots/номера строк не свежая приёмка.

### Готовность к старту

После 22; сериализовать FigmaTextField с 14 и FilterSheet/AppDialog с 23.

### Границы

AppText consumers/heading props, FigmaTextField error associations, FilterSheet accessibility, runtime DOM/a11y tests.

### Задание

Раздели typography и semantic heading level: не превращай все screenTitle автоматически в h1 и все sectionTitle в один уровень. Назначь уровни по структуре страниц, сохраняя вид. Error text имеет стабильный уникальный DOM id, input aria-invalid/describedby сохраняет также hint и корректно очищается. Для FilterSheet реальный computed accessible name должен ссылаться на существующий title id. Проверь Tab/Shift+Tab/focus restore/background interaction в реальной среде; snapshot фона сам по себе не доказательство сломанной ловушки. Используй существующий primitive/isolation механизм, inert/aria-hidden только с правильной portal границей и cleanup; не скрыть сам dialog или его ancestor.

### Приёмка

На Home/Works/Authors/Search/AuthorAbout/Work и изменённых auth screens понятная heading hierarchy с одним page heading по принятой структуре; нет случайных нескольких h1 секций. Error association работает до/после retry, динамически, без duplicate ids/озвучивания. Dialog называется «Фильтры», Tab/Shift+Tab остаются внутри, Escape/close восстанавливают opener, фон недоступен пока modal открыт и восстанавливается после close/unmount. Keyboard/DOM checks не выдавать за physical screen-reader acceptance.

Общие checks и Definition of Done обязательны. Не выполненные проверки отражай Partial/Blocked.

### Не входит / условия остановки

Не ослаблять Zod и не переписывать trap без воспроизведения. Не связывать один typography token с неизменным semantic level по всему приложению.

### Результат

Finding IDs, evidence, diff/commit, commands/results, screenshots с методом, документация, риски/решения и статус. Не выполнять другие пакеты автоматически.

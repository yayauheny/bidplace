# Figma → поддерживаемый Bidplace UI

Дата: 2026-10-16. Практический процесс и рекомендации; не новая визуальная спецификация. Внешние источники проверены на дату записи. Код экранов, Figma, tokens/theme runtime и CI этим документом не меняются.

## Что использовать

**Основной вход: ссылка на конкретный frame/component + официальный Figma MCP. Резерв: .figmacapture.zip + та же ссылка + дата.** PNG нужен для сравнения, JSON — для измерений/структуры, assets — для настоящих изображений. Это совместно необходимые данные, а не конкурирующие форматы.

| Вариант | Роль для проекта |
|---|---|
| Figma MCP | Предпочтительный доступ к текущему узлу, структуре, свойствам и screenshot; не автогенератор готового приложения |
| Figma to Prompt AI package | Полезный переносимый snapshot: manifest + nodes + reference + assets; принимать после проверки полноты/актуальности |
| Figma to Code HTML/JSX/Tailwind | Прототип/дополнительное свидетельство; DOM JSX не равен React Native JSX, generated styles не должны становиться второй дизайн-системой |
| Figma to HTML / Framer | Другой целевой renderer/workflow; не рекомендую как основу переноса в существующий Expo/RNW проект |
| Code Connect | Следующий полезный шаг после определения masters: связать Figma instances с настоящими компонентами и props проекта |

Официальный Figma MCP разделяет получение дизайн-контекста и работу агента: адаптация архитектуры и переиспользование остаются за агентом. См. [MCP vs agent](https://developers.figma.com/docs/figma-mcp-server/mcp-vs-agent/). Code Connect добавляет реальные component mappings в контекст: [интеграция](https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/). Для новой настройки использовать текущие [template files](https://developers.figma.com/docs/code-connect/template-files/), а не копировать устаревшие parser-based примеры. Доступ/тариф проверить в workspace перед настройкой; mappings не были созданы или опубликованы этим заданием.

Не нужно покупать ещё три экспортера в надежде получить архитектуру автоматически. Пока Code Connect не настроен, достаточно проверяемой таблицы node → component path → variant/props в handoff; затем наиболее используемые button/field/dialog/card связать официально. Настройка Code Connect не исправляет плохой компонент: сначала выбрать правильный renderer.

## Что выяснилось по присланному примеру

Архив `01_·_Вход___email_и_пароль.figmacapture.zip`: producer runkids/figma-to-prompt 0.2.7, capturedAt 2026-10-16T10:34:20.568Z, root `7008:20543`, reference **390×874**. Node tree: 420 узлов, включая 35 INSTANCE; 211 узлов имеют variableBindings. Есть Auto Layout (48 vertical, 104 horizontal); остальные 268 layout.mode=none не означают, что весь дизайн плохой — сюда входят тексты/векторы.

Полезно: это не просто картинка. Но manifest не содержит fileKey/fileVersionId/sourceUrl; supplied URL указывает на `7006:119`, а выбранный login-frame — `7008:20543`. Ссылку на точный frame нужно прикладывать отдельно. Live metadata подтвердили имя/размер login-frame и его детей. Первый design-context запрос по исходной ссылке вернул ошибку выбора; полного high-fidelity live context в этой консультации не получено. ZIP inspected как dated snapshot, не как доказательство полного совпадения всей текущей Figma.

Внутри есть 7 PNG 1×1, фото 1560×2080, отдельный raster для верхней полосы, reference PNG, full-frame SVG около 15.5 MB и prompt.md около 423 KB. Мелкие assets связаны в том числе с содержимым под шторкой/за пределами кадра; нельзя объявлять все семь сломанными или использовать их вместо видимого изображения. Сначала проверяется нужный slot. Большой SVG/PNG целого экрана — эталон/fallback, не реализация интерфейса.

Frame включает страницу товара под шторкой, скрытое/внекадровое содержимое, цену/другие работы и образец системной строки. Реальная шторка: `7008:20754`, header `7008:20755`, form region `7008:20761`; поля `7008:20762`/`7008:20764`, primary button `7008:20766`. UI task на вход не разрешает перенос аукционов/корзины/всего фонового товара или рисование iOS status bar в приложении. Google/Telegram в макете также не разрешают включать неподдержанный login provider.

Сгенерированный prompt требует semantic HTML и копирования отдельных координат/prototype settings. Это указания экспортера, не контракт Expo-приложения. Exact RGBA equality в fidelity metadata характеризует экспортный reference, не доказывает совпадение RNW в браузере и не оправдывает растеризацию UI. На screenshot Figma to Code уже видны предупреждения SVG render failures; исходный HTML-файл не приложен, качество его всего кода не проверялось.

Для экспорта отдавать один экран/состояние за раз с окружающим reference. Для отдельной шторки полезны и контекстный screenshot, и её точный subtree. Сохранять структуру/variables/components; не уплощать всё в SVG. Режим Full/all допустим как архив, но агент читает выбранные subtrees. Режим Pixel Perfect не должен навязывать pixel coordinates как production layout. Reference 1× достаточен для проверки 390 CSS px; 2× полезен для деталей. Настоящие raster assets экспортировать с достаточным размером для их slot/DPR; векторы оставлять SVG, если это поддерживаемый asset, а не целая форма.

## Почему появляются расхождения

Причина обычно состоит из нескольких независимых границ:

1. Неясно, какой frame/version является актуальным.
2. Агент видит координаты, но не контракт изменения ширины/высоты.
3. Figma component не связан с существующим renderer и возникает его копия.
4. Размеры/цвета выбираются локально вместо общей роли/variant.
5. Приёмка ограничивается успешной сборкой или одним screenshot на 390.

Простая замена ZIP на другой экспорт не закрывает пункты 2–5. Skills улучшают процесс, но не дают математической гарантии: ограничения должны подтверждаться проверками и review.

## Что означает адаптивность на вашем стеке

Expo/React Native Web не требует переписывать приложение на HTML/Tailwind ради адаптивности. Основной механизм — Flexbox, доступная ширина контейнера, wrapping, maxWidth, aspectRatio, content-driven height и корректный scroll. RN размеры — логические единицы, не физические пиксели дисплея. См. [Flexbox](https://reactnative.dev/docs/flexbox), [размеры](https://reactnative.dev/docs/height-and-width), [измерение окна](https://reactnative.dev/docs/dimensions).

390 — контрольный размер макета. Например, при gutter=12 карточная колонка может быть `availableWidth − 24`, а не постоянные 366. При ширине 414/440 содержимое использует доступное пространство; шрифт и touch target не умножаются на width/390. На desktop контейнер ограничивает ширину, а реальное изменение композиции может требовать breakpoint. Breakpoint не зло, если принадлежит layout owner и связан с содержимым/дизайном, а не названием телефона.

В проверяемом `10cb5a33` AppShell уже использует width:100%, maxWidth=contentMax+2*gutter и общие insets. Поэтому «весь проект жёстко 390» — уже неточная формулировка. Нужно проверить остальные consumers/особые layouts, а не автоматически переписать всё. Основной checkout и reviewed worktree имеют разные базы; сначала выбрать нужный SHA.

Для login sheet нельзя переносить y=329 и height=545 как универсальное правило. Шторка привязана к своему host, контент определяет нужную высоту, доступная высота ограничивает её и включает scroll; keyboard/Safe Area учитываются один раз. Конкретные max width/desktop presentation берутся из утверждённых owner/design правил. Если их нет — дизайнер задаёт их, агент не выдумывает.

Изменение ширины, browser zoom, размер текста и клавиатура — разные проверки. Браузерный pinch zoom также не равен перерасчёту layout на другую ширину. Для веба ориентиры — [reflow при 320 CSS px](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) и [увеличение текста до 200%](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html). Native fontScale требует отдельной проверки. Нельзя отключать zoom/font scaling или прятать overflow ради совпадения картинки.

## Что подготовить с дизайнером

- Компоненты/instances и variants для повторяющихся controls, а не копии Frame N с близкими значениями.
- Auto Layout для основных flow regions; явные Fill/Hug/Fixed, min/max и правила переноса. [Руководство Figma](https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout-in-Figma).
- Семантические variables, light/black modes и типографические роли. [Modes](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables). Одинаковый текущий hex может выражать разные роли; экспортная цветовая палитра сама по себе не является token model.
- Для mobile достаточно базового frame и понятных правил на узком/широком/коротком viewport; не обязательно рисовать каждый iPhone. Для desktop нужны хотя бы ключевая композиция и правила колонок/навигации, а не растянутый мобильный screenshot.
- Ошибки/disabled/loading/long text, hover/focus/pressed, scroll и keyboard behavior. Статичный красивый экран этих правил полностью не задаёт.

Необязательно идеально переделывать весь Figma-файл до первого экрана. Начать с общих button/field/sheet и одного вертикального среза; закрепить соответствия и повторять процесс.

## Централизация без новой свалки переменных

Целевой поток: Figma roles → один публичный semantic token contract → active theme → shared component variants → screen composition. Роли живут в packages/design-tokens, runtime theme — у одного provider. CSS focus, SVG gradients, shadow colors, кнопки/поиск и navigation получают значения от него. См. AR-01/02 в [аудите](../audits/2026-10-16-DRAFT-RESTORE-REVIEW.md).

Цвет, типографика, radius, повторяемые spacing/control states централизуются. Уникальное положение декоративного элемента допустимо как локальная named constant с node provenance. Не надо превращать каждый x/y в global token, запрещать каждое число или сливать роли лишь по hex. Component variants могут иметь собственную геометрию, но не независимую палитру. Большой файл не обязательно плох; два владельца одной обязанности — реальная причина очистки.

Тёмная тема не должна требовать копий экранов. Но существующие static color imports и module-level derived styles надо подключить к активной теме; один NavigationThemeProvider их не переключает. Это миграция способов потребления стилей, не переписывание backend/форм/всего приложения. После неё следующая тема действительно в основном меняет карты значений и подтверждённые visual states.

## Ежедневный процесс и skills

1. `$bidplace-figma-intake` — источник, scope, пропуски, mapping и layout contract. Без него не начинать большой visual diff.
2. `$bidplace-ui` — реализация на существующих owners; устраняет причины отличий на уровне tokens/components, не route-local overrides.
3. `$bidplace-ui-review` — rendered acceptance и проверка consumers, responsive/zoom/accessibility. Исполнитель применяет сам; review человеком/другим агентом полезен для shared changes.

Навыки лежат в `.agents/skills` этой ветки, не установлены во все соседние worktrees. Перед использованием в рабочей ветке перенести коммит workflow после проверки diff; он не меняет код приложения. Для агента без skill discovery передать точные пути и потребовать прочитать их. Новые skills могут потребовать нового чата для появления в каталоге.

Короткий ежедневный запрос:

```text
Используй bidplace-figma-intake, затем bidplace-ui и bidplace-ui-review.
Checkout/ветка: …
Экран/маршрут и разрешённые изменения: …
Figma: ссылка на конкретный frame, node id …
Резервный AI package: …, дата …
Состояния: …
Сначала проверь источник, сопоставь узлы с нашими компонентами/вариантами
и опиши Fill/Hug/Fixed, scroll и responsive rules. Не добавляй функции
из фонового макета, которых нет в product contract.
Реализуй через существующие shared owners и семантические токены.
Проверь reference size, узкую/широкую/короткую ширину, keyboard/zoom
и затронутые состояния. Приложи screenshots и оставшиеся расхождения.
Недостающий desktop/black дизайн пометь NEEDS-FIGMA; не выдумывай.
Не объявляй UI готовым только по тестам или одному screenshot.
```

## Как принимать результат без ручного поиска каждого дефекта

Для каждой задачи оставлять короткий evidence record: SHA/source/node, mapping, viewport/state/browser, ссылки на эталон и результат, измеренные отклонения, commands и unverified. При reference size совпадают структура, геометрия, шрифты/переносы, assets и состояния; на остальных ширинах проверяется естественное поведение. Screenshot diff помогает, но не оправдывает абсолютную раскладку или увеличение tolerance при неизвестной причине.

Для экрана: 390 reference, 320/414/440 robustness, короткая высота, 200% zoom/text; 1024/1440 — desktop robustness, а parity только при наличии соответствующего дизайна. Для маленького общего компонента проверять component gallery и representative consumers, не прогонять всё приложение. Chromium для итераций, WebKit для затронутых typography/focus/overlay сценариев. Реальные native устройства/эмуляторы — если есть native acceptance.

Автоматические ограждения следующим отдельным небольшим пакетом: проверка theme key completeness; ограничение raw colors в theme-dependent UI с явными asset exceptions; запрет новых screen-local renderer copies через review; целевые Playwright overflow/focus/visual regression сценарии. Они пока не установлены этим заданием. Нужна одна component gallery для текущих состояний; Storybook можно добавить при реальной необходимости, новая зависимость не обязательна.

## Порядок перехода и пределы гарантии

Не возвращаться к Pen и не удалять всю папку design вслепую: отдельно классифицировать current sources, historic captures и live runtime assets по consumers. Историю сохранить; устаревшие инструкции вывести из активного входа. Начать с принятых audit fixes сохранности данных и theme/component foundation, затем один эталонный экран (login sheet), потом остальные экраны.

Skills созданы/обновлены, проверка их формата выполняется отдельно. Их наличие не означает, что токены уже мигрированы, Code Connect настроен или UI соответствует Figma. Нулевой риск ошибок обещать нельзя; цель — маленькие контролируемые изменения и обязательные доказательства, чтобы ошибки ловились до вашей ручной приёмки.

Проверка самих навыков: штатный `quick_validate.py` не запустился из-за отсутствия PyYAML в доступных Python runtimes. Без установки зависимостей выполнена проверка через уже установленный `yaml@2.9.0`: frontmatter, допустимые поля/имена, длины, отсутствие TODO scaffold и относительные ссылки — PASS для трёх skills; `git diff --check` — PASS. Это проверка структуры, не гарантия качества будущей реализации. На присланном архиве вручную проверен intake-проход: несовпадающие page/root IDs, provenance gaps, размеры assets, отдельный overlay subtree и непригодность whole-frame fallback как UI. Независимый forward-test другого агента и новая реализация экрана не выполнялись.

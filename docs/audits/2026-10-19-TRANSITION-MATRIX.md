# Общий аудит переходов, изображений и шторок

База `208cd3b0`, ветка `fix/image-flicker`. Пользователь поручил исправить
причины во всех потребителях, а не только в одном экране. Scope: frontend web.

## Критерии

- При смене содержимого открытого sheet-flow затемнение не исчезает и не удваивается.
- Картинки нижней страницы не пересоздаются при шторках/поиске/возврате.
- Скрытая страница не оставляет body-portaled диалог над новой страницей.
- Фильтры, Search tabs/query, профиль/работа/галерея, Back/Forward, auth, focus
  и save/dirty guards сохраняют контракты. Смену реального контента не выдаём
  за запрещённое обновление изображений.

## Найденные владельцы (по исходникам актуального checkout)

AppDialog: обычные dialog/sheet/mediaSheet; FilterSheet/FilterSortSheet/ShareSheet,
CreatorHeader/AuthorShare, категории профиля/каталога, country/directions/terms,
intro и внутренние формы. WorkGallery — centered AppDialog. ExitConfirmDialog
самостоятельно владеет вложенным подтверждением. Auth dimmer уже общий. Search
использует отдельный persistent SearchOverlayHost/Surface и OverlayDimmer.
AppShell знает isFocused страницы; AppDialog пока не знает активности страницы.

Две явные цепочки передачи между разными AppDialog: профиль «Действия → QR»
и «Поделиться → Пожаловаться → Скоро появится». У них отдельные fade-слои.
CatalogFilterSheet при входе в раздел сохраняет тот же FilterSheet instance.
ResilientRemoteImage меняет lifetime только при смене URI; нет оснований удалять
retry/recovery или отключать blur без воспроизведения проблемы.

Граф относится к другому checkout/базе; актуальные владельцы и consumers
проверены исходниками/rg. Полный переиндекс не выполнялся.

## Матрица и результаты — заполняется по мере проверки

| Поток | Статус |
| --- | --- |
| Auth login/forgot/back, изображения/scroll | Passed: оба движка, итоговый код |
| Профиль actions → QR | Fixed: red → green в обоих движках, alpha 0,49–0,51 + focus return |
| Профиль share → report | Fixed: red → green в обоих движках, alpha 0,49–0,51 + focus return |
| Back со страницы с открытой шторкой | Passed: оба движка; утечка не воспроизвелась |
| Каталог → filter → section → Back | Passed: оба движка, раздел и обратный переход, alpha 0,49–0,51 |
| Search tabs/query → result → Back | Passed: tabs/query/close и Home scroll=120; result/Back — прежний search gate не повторялся целиком |
| Work share/full gallery → close/Back | Passed: share → Escape, full viewer → Escape, исходные загруженные img сохранены |
| Формы country/directions/terms и confirmation | Наследуют общий owner (source); все внутренние формы отдельно в браузере не открывались |

Сервер, API, права и БД не меняются. Открытые аппаратные/zoom/legal ограничения
предыдущих отчётов не считаются автоматически закрытыми.


## Подтверждённые находки

**TM-01 — сейчас, визуальная надёжность и общий ownership.** Оба handoff-теста
красные в Chromium и WebKit: независимые fade-слои дают alpha около 0,44 вместо
0,5. Это тот же класс пользовательской вспышки, что был в auth, но другой owner.
Выбран durable fix: SheetBackdropProvider владеет только визуальным затемнением
обычных web AppDialog sheets. Каждый AppDialog регистрирует своё фактическое open;
одновременная передача между экземплярами сохраняет тот же слой. Close/focus,
содержимое, guards, centered confirmations и уровни auth не переносим в registry.

Критерии: два handoff (4 engine cases) должны пройти диапазон alpha 0,49–0,51;
все потребители FilterSheet/ShareSheet автоматически используют тот же owner;
последнее закрытие/unmount убирает слой; быстрая передача и тема не пересоздают
его. Вне root provider и на native остаётся существующее поведение AppDialog.

Варианты: единый слой — durable fix; склейка только двух экранных цепочек —
локальный workaround с повторением правил в следующих потребителях; таймеры,
opacity-хаки фотографий или отключение motion — отклонены. Backend не затронут.
Back с открытой шторкой страницы: **2/2 passed** на исходном коде, утечка portal
в этой проверенной цепочке не подтвердилась; отдельного focus refactor не делаем.


## Промежуточная приёмка

Общий visual fix: **26/26** Chromium + WebKit. Owner unit checks: **34/34**.
Типы/lint/format/build прошли. Search/catalog/gallery/Back не потребовали
локальных runtime-патчей; inherited AppDialog layer устраняет оба handoff.

**TM-02 — сейчас, доступность.** Вручную после menu → QR → Close фокус ушёл в
body: return-focus запомнил кнопку удалённой первой шторки. Нужен fallback к
её исходному opener в уже существующем useReturnFocus, без отдельного manager.
Критерий: обе цепочки возвращают фокус на внешний trigger; вложенный диалог,
пока родитель открыт, возвращает фокус в родительское поле как прежде.


## Итог

**Implemented для общего web-механизма.** `SheetBackdropProvider` устанавливается
один раз под ThemeProvider в AppProviders. Он хранит только набор открытых
обычных sheets и рисует один визуальный слой. AppDialog оставляет прозрачный
click/dismiss слой ниже панели (`modal - 1`), собственный контент, фокус и callbacks.
Передача A → B не перезапускает dimmer. Последний close/unmount убирает его.

В `useReturnFocus` цепочка opener хранится через WeakMap DOM scopes. Если кнопка
предыдущей шторки удалена, выбирается ближайший живой opener из цепочки; если
родительский диалог остаётся открыт, фокус возвращается в его поле/кнопку.
Explicit returnFocusRef остаётся приоритетным. Нового focus trap/роутера нет.

- Итоговый browser gate: **26/26**, 13 сценариев × Chromium/WebKit, 44,4 с.
- Unit: **36/36** по пяти owner specs (AppDialog web/native, theme,
  ResilientRemoteImage, WorkGallery); в том числе lifetime общего слоя и
  сохранение фокуса в ещё открытом родителе.
- tsc, lint/format изменённых файлов, production web export, diff-check: passed.
- Живая приёмка браузером: profile actions → QR → close; Focus defect был
  воспроизведён и закрыт регрессией. Статика на localhost:7899 обновлена.
- API, схемы БД, permissions/save/submit/dirty guards и тексты не менялись.

### Что действительно исправлено

TM-01 (общий dimmer handoff) и TM-02 (focus fallback) закрыты. Для остальных
проверенных публичных переходов дополнительных runtime-патчей не понадобилось.
Неподтверждённые GPU-проблемы, retry изображений, blur и deliberate content
updates не маскировались CSS-хакaми или preload всех фото.

### Граница приёмки

Проверена матрица публичных сценариев и общий owner. Это не утверждение, что
все возможные экраны/состояния приложения вручную просмотрены. Country,
directions, term pickers, admin/recovery и author intro наследуют AppDialog,
но их внутренние сценарии сохранения не прогонялись. Centered confirmations
имеют отдельный обоснованный уровень; auth и Search сохраняют своих flow owners.
Native использует прежний per-dialog backdrop; физический iPhone, native-приложение,
TC-02 zoom и большой legacy auth/legal case остаются вне этой приёмки.
Push/merge/deploy и полные suites не выполнялись.

### Текущие consumers — покрытие исходниками

Эти файлы используют общий AppDialog напрямую или через FilterSheet/ShareSheet;
список не выдаётся за браузерную приёмку каждого внутреннего flow.

- `apps/mobile/src/components/figma/FilterSheet.tsx` — AppDialog.
- `apps/mobile/src/components/figma/FilterSortSheet.tsx` — FilterSheet.
- `apps/mobile/src/components/figma/ShareSheet.tsx` — AppDialog.
- `apps/mobile/src/components/figma/WorkGallery.tsx` — AppDialog.
- `apps/mobile/src/features/admin/admin-moderation-screen.tsx` — AppDialog.
- `apps/mobile/src/features/auth/legal-document-viewer.tsx` — AppDialog.
- `apps/mobile/src/features/discovery/CatalogFilterSheet.tsx` — FilterSheet.
- `apps/mobile/src/features/products/product-screen.tsx` — ShareSheet.
- `apps/mobile/src/features/sellers/AuthorIntroDialog.tsx` — AppDialog.
- `apps/mobile/src/features/sellers/AuthorShare.tsx` — FilterSheet.
- `apps/mobile/src/features/sellers/CreatorHeader.tsx` — FilterSheet, ShareSheet.
- `apps/mobile/src/features/sellers/author-cabinet-screen.tsx` — AppDialog.
- `apps/mobile/src/features/sellers/author-directions-picker-sheet.tsx` — FilterSheet.
- `apps/mobile/src/features/sellers/country-picker-sheet.tsx` — FilterSheet.
- `apps/mobile/src/features/sellers/product-catalog-term-sheet.tsx` — FilterSheet.
- `apps/mobile/src/features/sellers/product-draft-screen.tsx` — AppDialog.
- `apps/mobile/src/features/sellers/public-seller-screen.tsx` — AppDialog, FilterSheet.
- `apps/mobile/src/features/sellers/seller-profile-screen.tsx` — AppDialog.

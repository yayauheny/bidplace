# Диагностика мигания изображений и свайпа шторок

18 октября 2026. Base `386d1b7d` (актуальный fix/draft-restore). Отдельная ветка fix/image-flicker. По уточнению пользователя: сначала причины и долгосрочные варианты, без production-правок. Использованы implement/bidplace-ui/bidplace-ui-review и grilling; решения о маршрутизации ещё не выбраны.

## 1. Подтверждено: вход создаёт новую Home вместо сохранения фона

`components/layout/AuthViewport.tsx:335–345` при focused && !screen монтирует `<HomeScreen hideDock />`. Исходная страница остаётся в navigation stack. Home содержит полноценные query observers, ScrollView, фото, cover frost; это отдельный экземпляр с собственной жизнью изображений, а не тот же фон под overlay.

В WebKit на синтетических данных (одна Work и одна Author photo) перед входом 2 img. После нажатия dock «Профиль» и открытия login — 4 img с попарно одинаковыми URL. Оригинальные img остаются isConnected=true. Поэтому одновременно присутствуют старое дерево и новая копия Home, и новая копия проходит собственный load/decode/paint. При медленной сети/декодировании это создаёт реальный риск вспышки фона. Дублирование подтверждено, точный вид вспышки на физическом iPhone здесь не измерен.

Дополнительная проблема композиции: вход с другой публичной страницы всё равно показывает Home, а не фактическую страницу под ним. Это исходное устройство презентации, не ошибка цвета токена.

## 2. Подтверждено: закрытие повторно создаёт страницу назначения

`AuthViewport.commitLeave` для close-button без navigation action/traversal использует router.replace(destination). После Home→login→close браузерная проба показывает: оригинальные 2 img остаются, появляются новые img фона назначения (всего снова 4 после удаления временного auth-фона). Следовательно, даже если изображения были загружены на Home, возвращение показывает новый экземпляр с новым image lifetime. Байты могут быть из cache, но DOM/lazy load/decode не сохраняются как у исходной страницы.

Важно: существующие browser Back/Forward/auth abort guards уже имеют регрессии. Нельзя заменить все replace на back: прямой URL /login, redirect query, внешняя вкладка и завершение login имеют другие требования. Нельзя исправить это глобальной чисткой history.

## 3. Обычные переходы: повторная загрузка всех картинок не подтверждена

В измеренной цепочке Home→login→close→«Смотреть все»→Back после close счётчики image DOM insert/remove и src mutations не менялись на обычной навигации, исходные DOM img оставались подключены. Значит для этой пробы MotionPressable/re-render не перемонтирует все img и recovery не меняет URL при каждом клике.

Ограничения: destination works запросы в этой диагностической пробе не были полностью замоканы и завершились CORS/network ошибками; поэтому это наблюдение lifecycle исходного Home, а не полная функциональная приёмка каталога. Переход «Смотреть профиль» отдельно в готовом populated потоке не воспроизведён. Не выдавать эти данные за найденную причину всех симптомов.

Возможная отдельная причина iPhone: compositing при переключении backdrop-filter/mask/opacity/transform. Подозреваемые владельцы: `CoverFrost.web.tsx` (full inset backdrop-filter + mask), `FigmaGlassSurface.web.tsx`/global.css (body portal dock blur), `AppShell` (dock unmount при потере фокуса), navigation screen visibility и Reanimated sheet/backdrop transitions. **Это гипотеза**, не подтверждённый WebKit баг. Не применять translateZ(0), will-change, opacity .999, глобальное отключение blur или таймеры до измерения.

## 4. Что необходимо измерить до изменения общей графики

1. Повторить на физическом iPhone из локальной сборки: login open/close, «Смотреть профиль», оба «Смотреть все», Back. Снять короткое видео и связать с текущим SHA/URL.
2. Для каждого перехода: document navigation или SPA; img node identity; src/currentSrc; complete/naturalWidth; image requests/errors; состояние скрытого/показанного screen. Одних counters addedNodes недостаточно: MutationObserver может считать вставленные вложенные узлы несколько раз.
3. На изолированном reproduction по одному временно убрать dock backdrop, card frost, переход opacity/transform. Возврат исходного эффекта должен возвращать вспышку — только тогда выбирать compositing fix. Эти варианты — диагностика, не допускаемое новое оформление продукта.
4. Сравнить cold/warm cache и сеть с задержкой. Проверять загруженные картинки, placeholders и реальные failures отдельно. Не скрывать stale failure новым preload/cache слоем.

## 5. Варианты долгосрочного решения auth-фона

| Вариант | Оценка | Последствия |
|---|---|---|
| Вход как route-aware overlay над существующим публичным screen, с корректным direct-link fallback | **Рекомендуемый durable fix** | Один фон/scroll/query owner, URL/history сохраняются. Нужен согласованный маршрут презентации и проверка Back/Forward/abort/deep link. Login/forgot sheets и full-screen register не надо насильно делать одинаковыми. |
| Один постоянный presentation host вне заменяемых route trees, маршруты управляют открытием | Durable alternative | Центральное управление и будущие sheets, но шире затрагивает route ownership. Выбирать лишь если доступная Expo Router presentation не покрывает требуемый web-flow. |
| Memo/preload/keepLoaded только для нового Home либо ручной cached screenshot | Workaround | Дублирующие screen/query owners остаются; screenshot теряет живую композицию/состояние. Не считать корневым решением. |
| CSS GPU hacks или отключение всех transitions/blur | Hack без доказанной причины | Маскирует или меняет дизайн, риски Safari и памяти. Не применять. |

Материальный вопрос перед реализацией: фон входа должен оставаться текущей публичной страницей (рекомендуется) или всегда быть Home? Сейчас визуально всегда Home. Это влияет на выбранную route presentation; не менять молча. После выбора сравнить поддерживаемые API установленного Expo Router 57, не мигрировать SDK для удобства.

## 6. Почему свайпа сейчас нет

`AppDialog` (sheet/mediaSheet) и `AuthViewport` имеют отдельные Dialog/Animated/ScrollView owners. `FilterSheet`/share/media используют AppDialog, auth рисует собственную шторку. В обоих путях отсутствует gesture controller закрытия. Нарисованная ручка не подключена к жесту. Поэтому изменение только FilterSheet не закроет login и оставит две разные реализации.

Целевой общий механизм: один sheet gesture/motion owner, используемый AppDialog и auth, вызывает существующий **request dismissal**, а не прямо setOpen(false) или router.back(). Продуктовые guards остаются у владельцев форм/сессии. Не создавать новый routing/history manager в gesture helper.

Рекомендуемый пользовательский контракт для обсуждения:
- вниз с ручки/шапки — интерактивно тянет шторку; короткий/отменённый жест возвращает её;
- из содержимого — движение передаётся шторке только при scrollTop=0 и вертикальном downward intent; горизонтальные carousels, поля/выделение текста и scroll внутри не перехватываются;
- dirty auth открывает прежнее подтверждение, busy остаётся открытым; guard rejection возвращает шторку в исходное положение;
- centered confirm dialogs не получают свайп автоматически, шторки sheet/mediaSheet — получают;
- Escape/крест/backdrop остаются доступными; reduced motion не отключает сам жест; focus return после фактического закрытия;
- использовать установленный gesture/motion stack, без новой библиотеки. Сначала проверить доступные API конкретной установленной версии и web touch/pointer cancellation.

Альтернатива первого шага: свайп только за ручку/шапку. Проще и безопаснее для форм, но не полностью соответствует ожиданию «тянуть всю шторку как на iPhone». Не выбирать без обсуждения, если пользователь ожидает жест из содержимого.

## 7. Порядок дальнейшей работы и приёмка

1. Закончить разделение причин визуального мигания; не менять жесты параллельно, чтобы не спутать результаты.
2. Выбрать auth background contract и owner presentation, сделать один корневой фикс. Gate: исходный image DOM/scroll сохраняются, нет второй Home/query observer при переходе; direct link fallback корректен; guards и browser history regressions проходят.
3. Если iPhone compositing-проблема остаётся — отдельный узкий фикс доказанного layer owner с сохранением frost/design.
4. После стабилизации фона — shared swipe owner и подключение двух sheet paths. Gates: auth clean/dirty/busy, share/filter/media sheets, top-scroll/inner-scroll, cancel/short/horizontal gesture, short viewport/keyboard, focus/reduced motion; Chromium/WebKit и физический iPhone.

## Выполненные проверки и состояние

Собственные: текущие source + dependency source (`expo-image@57`, RNW Pressable), graph coverage (для ResilientRemoteImage/MotionPressable metadata match, AuthViewport изменён — прочитан source); два WebKit lifecycle прогона с синтетическими Home/media и реальными Expo components, 1/1 + 1/1 (17.1s первичный/3.8s warm). Счётчики доказывают дерево, а не готовое pixel-исправление. API/DB/секреты не использовались, route fixtures синтетические.

Нет production-изменений. Отдельный worktree создан на 386d1b7d, зависимости установлены offline. Собственный Expo diagnostic server на localhost:8095; это не пользовательский LAN server 7899. Временный probe/config удаляются после фиксации результатов. Полные suites/build не запускались. Утверждения об отсутствии остальных причин не делаются: physical iPhone compositing и полноценный profile/works flow ещё требуют проверки.

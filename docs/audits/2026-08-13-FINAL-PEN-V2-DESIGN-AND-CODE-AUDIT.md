# Bidplace Pen v2 — финальный аудит дизайна и кода

- Дата: 2026-08-13
- Ветка: `feature/final-pen-v2-flows`
- Проверенный HEAD: `2dbfea1`
- Основной диапазон review: `8817185..2dbfea1`

Статус: **Rejected / Not design-ready / Needs implementation and visual verification**

## 1. Итоговый вердикт

Редизайн нельзя считать законченным. Функциональная основа заметно продвинулась: API, серверные ограничения, создание черновиков, модерационные мутации, responsive routes и автоматические тесты существуют. Но текущий UI не воспроизводит canonical Pen с необходимой точностью, а несколько ключевых пользовательских сценариев реализованы в другой композиции и с другой логикой.

Главные причины:

1. Автоматические тесты проверяли наличие элементов, маршруты, overflow и приблизительную геометрию, но не выполняли matched overlay/pixel-diff с Pen.
2. В документации кодовый статус и acceptance-чеклисты были закрыты раньше founder visual review.
3. Ключевые экраны строились как расширение прежних крупных компонентов, а не как последовательное воспроизведение финальных Pen-композиций.
4. В UI осталось много фиксированных ширин и локальных стилей, из-за чего шапка, hero, AuctionPlayer и контентные панели ломаются на промежуточных ширинах и длинных русских строках.
5. Email verification, принятие правил и подготовка ставки смешаны с разметкой Product hero, хотя Pen задаёт отдельный модальный state machine.
6. Экран модерации нарушает явно закреплённое решение Pen: отдельно «Авторы» и «Работы», без общей выдачи и без Orders в этой рабочей области.
7. Есть не только визуальные, но и продуктовые риски: возможна тихая потеря этапа истории создания; модератор не получает полный материал истории создания; admin list API не пагинирован.

**Релизный вывод:** текущий статус должен быть не `Implemented/Verified`, а `Partial / Rework required`. Проходящие unit/E2E/build проверки сохраняют ценность, но не являются доказательством готовности дизайна.

## 2. Источник истины и сохранность Pen

Canonical source:

- `design/pen/bidplace-web-v2.pen`
- attached source: `/Users/yayauheny/Downloads/bidplace-web-v2 (3)/bidplace-web-v2.pen`
- SHA-256 обоих файлов: `685bc2dee4ca643869e678378bf849ab3189c4072b417670df6c64fa6c3181cf`

Проверенные FINAL roots:

- `L7ytbv` — Desktop Product / Auction / Gamma Final Polish;
- `nTnuM` — Auction Participation Flow;
- `Mycgk` — Product Creation Desktop Flow;
- `JOjIY` — Creator Profile Creation Flow;
- `NRlEW` — Admin Moderation Workspace;
- также актуальны финальные Browse/Creator/Shared UI roots из design registry.

Важно: в review-диапазоне canonical `.pen` присутствует как крупная baseline-замена, но текущий repository-файл побайтно совпадает с приложенным актуальным источником. Дальнейшая работа не должна редактировать, удалять, форматировать или регенерировать этот файл. Pen используется только для чтения и visual acceptance.

## 3. Что было проверено

Аудит включает:

- diff и commit ledger `8817185..2dbfea1`;
- текущий frontend-код Product, header, authors, works, creator, wizards и moderation;
- соответствующие API/controllers/contracts;
- текущие unit/E2E acceptance tests и screenshot suites;
- design handoff/status/audit log;
- локальный web runtime на `/works`, `/authors`, `/seller/anna-morozova`, `/product/seedEnded03`;
- founder screenshots фактического runtime и Pen reference screenshots;
- warnings Expo/React Native Web.

Не выполнены в рамках этого аудита:

- production-код не менялся;
- formal Pen overlay/pixel-diff не создавался;
- физические iOS/Android устройства и screen reader не запускались;
- внешний Pen API не использовался.

## 4. Приоритеты

- **P0** — потеря безопасности/денег/данных, требующая немедленной остановки. Подтверждённого P0 в проверенном bid path нет.
- **P1** — release blocker: ключевой flow сломан, данные могут теряться, либо экран явно не соответствует утверждённому Pen.
- **P2** — существенное качество/масштабируемость/адаптивность, исправить до visual approval.
- **P3** — polish, предупреждения и технический долг, закрыть до объявления production-ready.

## 5. Сводка findings

| ID | Приоритет | Область | Вывод |
| --- | --- | --- | --- |
| F-01 | P1 | Header | Две фиксированные колонки по 420 px создают смещение и не используют общий центрированный grid |
| F-02 | P1 | AuctionPlayer | Фиксированные колонки 84/112 px ломают BYN и status; player/CTA крупнее и иной формы, чем в Pen |
| F-03 | P1 | Bid eligibility | Email/rules UI рендерится inline в hero вместо отдельного модального flow |
| F-04 | P1 | Bid modal | На странице одновременно существует inline BidForm и dialog BidForm; композиция и intent расходятся с Pen |
| F-05 | P1 | Atmosphere | Blur технически есть, но сильный тёплый veil превращает фон в почти плоскую заливку |
| F-06 | P1 | Product About | Панели, радиусы, ширины и вертикальный ритм не совпадают с `L7ytbv`; блок выглядит растянутым |
| F-07 | P1 | Moderation IA | Реализованы Authors/Works/All вместе и Orders ниже; Pen требует ровно два отдельных домена и исключает Orders |
| F-08 | P1 | Moderation data | Admin Product projection не содержит creation story/process photos, поэтому решение принимается по неполному материалу |
| F-09 | P1 | Product creation | Частично заполненный этап фильтруется, а сервер удаляет отсутствующие ID — возможна тихая потеря текста и process image |
| F-10 | P1 | Acceptance | Документация закрывает visual checklist без Pen overlay и founder approval |
| F-11 | P2 | Public loading | Ошибки загрузки были видны пользователю; сейчас не воспроизводятся, причина не диагностирована и readiness dev-stack не проверяется |
| F-12 | P2 | Search/surfaces | Тёплые `surfaceStrong/surfaceWarm/glass` дают желтоватый поиск вместо нейтрального серого |
| F-13 | P2 | Creation UX | Новый creation step нельзя снабдить фото до сохранения; после сохранения wizard перескакивает вперёд |
| F-14 | P2 | Admin API | Admin authors/products загружаются без pagination/filter/search query contract |
| F-15 | P2 | Component size | ProductScreen, product/profile wizard и moderation стали монолитами 633–1402 строк |
| F-16 | P2 | Forms | Wizard fields вручную держатся во множестве `useState`, хотя уже установлены RHF/Zod и `useFieldArray` |
| F-17 | P2 | Gesture | SlideToBid вручную построен на PanResponder/Animated, хотя установлены Gesture Handler/Reanimated |
| F-18 | P3 | Web warnings | `shadow*`, `pointerEvents` prop и `useNativeDriver` дают подтверждённые RN Web warnings |
| F-19 | P3 | Tabs/counter | Текущий код не показывает «Торги 0», но сохраняет count в API компонента; screenshot указывает на stale bundle/older revision |
| F-20 | P2 | Visual fixtures | Тесты проверяют уникальность/загрузку изображений, но не их art direction и соответствие Pen |

## 6. Подробные findings и варианты исправления

### F-01 — Header не следует общей сетке [P1]

**Доказательство:** `apps/mobile/src/components/layout/AppHeader.tsx:424-504`.

При inline search header состоит из:

- левой колонки `width: 420`;
- гибкого search с `maxWidth: 480`;
- правой колонки `width: 420`;
- внешних padding/gap.

Это не shared max-width frame и не responsive `minmax`. На 1180–1400 px три острова конкурируют за ширину. Визуально logo/nav/search/account группируются слева либо search сжимается не так, как в Pen. Founder screenshot со «съехавшей шапкой» соответствует этой причине.

**Durable fix:** один центрированный header container с тем же max width/gutters, что у page canvas. Внутри — три flex-области: `auto minmax(minSearch, maxSearch) auto`, без симметричных фиктивных 420 px. На RN Web это реализуется flex: left/right `flexShrink: 0`, search `flex: 1`, `minWidth: 0`, общий `maxWidth` и `alignSelf: center`.

**Acceptable variant:** определить 3 явных responsive presets (wide/compact/mobile) и измеренные размеры из Pen; переключать структуру, а не только gap.

**Hack — не использовать:** отрицательные margin, transform translateX, дополнительный spacer или width, вычисленный под один screenshot.

**Acceptance:** bounding boxes header на 1440/1024/768/390; logo и крайние actions совпадают с Pen grid; search остаётся центрированным; длинные labels не двигают account action.

### F-02 — AuctionPlayer ломает текст и не совпадает с Pen [P1]

**Доказательство:** `apps/mobile/src/components/ui/AuctionPlayer.tsx:54-157`, вызов в `product-screen.tsx:628-678`.

Проблемы:

- price slot фиксирован на 84 px и не имеет `numberOfLines={1}`;
- timing/status slot фиксирован на 112 px;
- весь player принудительно получает 404 px в wide hero;
- CTA принудительно 124×44;
- `statusTone` и `participationTone` объявлены, но не используются;
- start/minimum labels спрятаны в absolute element с opacity 0 вместо ясной семантики;
- текст `120,00 BYN` переносится на две строки, status обрезается как `Торги зав...`;
- текущая высота/радиус/тень/кнопка визуально крупнее final render.

**Durable fix:** пересобрать player как канонический compact intrinsic component: гибкие metric cells с `minWidth: 0`, рассчитанные Pen gaps, price/status строго в одну строку, CTA только необходимой ширины. Для ended/scheduled/live должны быть отдельные композиционные variants, а не один layout с обрезанным текстом.

**Acceptable variant:** responsive presets `wide`, `compact`, `mobileSticky`, каждый с измеренной шириной и допустимыми label variants.

**Hack — не использовать:** уменьшение шрифта по длине строки, ручные переносы `B\nYN`, скрытие overflow или увеличение player до исчезновения ошибки.

**Acceptance:** `90`, `120`, `1 200`, `12 500 BYN`; live/scheduled/ended; русский и длинный status; 1440/1024/390; ни одного wrap/ellipsis там, где Pen показывает полную строку.

### F-03 — Email verification/rules реализованы inline, а не modal flow [P1]

**Доказательство:** `apps/mobile/src/features/auth/email-rules-gate.tsx:125-282`; inline insertion в `product-screen.tsx:599-621`, `1095-1121`, `1216-1222`.

`EmailRulesGate` возвращает обычные `View`, `TextField` и buttons. ProductScreen вставляет их под artwork/AuctionPlayer и в BottomActionBar. Поэтому код отправки/подтверждения висит ниже ставки, что видно на founder runtime и прямо противоречит `nTnuM`.

Также текущий flow не моделирует все Pen states:

- start;
- sending code;
- code sent/empty;
- filled;
- incorrect;
- expired;
- loading;
- success с короткой задержкой;
- resend countdown;
- восстановление bid intent после success.

**Durable fix:** Product screen должен владеть единым `AuctionParticipationDialog` state machine. Нажатие CTA открывает dialog. State machine выполняет eligibility → verification → rules → refresh auction snapshot → bid. `useEmailRulesEligibility` остаётся data hook, но presentation больше не рендерится inline.

Новая dependency не нужна: в проекте уже есть `@rn-primitives/dialog` и `AppDialog`.

**Acceptable variant:** reducer с discriminated union states. XState ради этого flow не нужен.

**Hack — не использовать:** завернуть текущий inline fragment в случайный absolute View или открывать отдельный modal для каждого API call без единого state owner.

### F-04 — BidForm продублирован в hero и dialog [P1]

**Доказательство:** `product-screen.tsx:599-621`, `1216-1222`, `1363-1399`.

Один `BidForm` живёт под player; второй — внутри `AppDialog` вместе со `SlideToBid`. Это создаёт два места редактирования одного amount, усложняет focus/error semantics и делает фактический экран не похожим на Pen.

**Durable fix:** в hero оставить только AuctionPlayer CTA. Единственный BidForm располагается в participation dialog. После каждого eligibility transition dialog сохраняет draft amount/intent, обновляет server snapshot и открывает bid state без дублирования.

**Acceptance:** до нажатия CTA на product page отсутствуют bid input/email code/rules controls; весь flow имеет `role=dialog`, focus trap, Escape/outside policy, focus return и responsive modal/sheet composition.

### F-05 — Dynamic atmosphere слишком вымыта [P1]

**Доказательство:** `AmbientImageBackground.tsx:15-79`; `ambient-image-background-style.ts:3-12`; warm tokens в `packages/design-tokens/src/tokens.ts:3-27`.

Технически изображение присутствует и `blurRadius={64}` применяется. Но поверх него наложен vertical veil, доходящий до `surfaceWarm`, а shell/header также используют тёплые `#FBFBF8`/glass. Итог — слабая, почти плоская бежевая заливка вместо читаемых image-derived blue/yellow/pink clouds и мягкого перехода в белый.

**Durable fix:** сохранить один shared `AmbientImageBackground`, но настроить:

- opacity/blur/scale image layer по Pen;
- отдельный neutral contrast veil;
- bottom fade в canvas, начинающийся на измеренной высоте;
- glass header с нейтральным tint;
- platform-specific rendering: Web CSS filter/backdrop where useful, native `expo-image` blur.

`expo-image` и `expo-linear-gradient` уже достаточны. Библиотека извлечения палитры не обязательна: размывается само artwork.

**Acceptable variant:** shared semantic component с presets `product` и `creator`, отличающими только crop/fade height, но не двумя копиями реализации.

**Hack — не использовать:** захардкодить сине-жёлтый gradient для каждого fixture или создавать ручные цвета в seed.

**Acceptance:** sharp artwork не размывается; фон явно наследует цвета конкретного artwork/avatar; нижняя часть плавно становится white; текст сохраняет WCAG contrast; reduced motion не отключает сам background.

### F-06 — Product About не воспроизводит блоки `L7ytbv` [P1]

**Доказательство:** `product-screen.tsx:703-813`, `1313-1335`.

Левая область получает `flex: 2`, padding/background, но не фиксирует канонические panel radius/max width/paddings. Author panel и related works вычисляются рядом с route-local разметкой. На runtime блок выглядит растянутым по странице, а вертикальные интервалы и поверхность не совпадают с reference.

**Durable fix:** извлечь `ProductAboutPanel` и `ProductAuthorSummary`, задать измеренную two-column grid, panel radius/surface/padding, accordion rows и related section из Pen. Данные остаются прежними, меняется только композиция.

**Acceptable variant:** один responsive component с desktop two-column и mobile stacked variants.

**Hack — не использовать:** добавлять случайные margin/padding прямо в 1402-строчный ProductScreen до визуального сходства одного viewport.

### F-07 — Moderation IA нарушает явный scope Pen [P1]

**Доказательство:** canonical `NRlEW` context: «Exactly Authors and Works. Orders are excluded and belong to future /admin/orders». Код: `admin-moderation-screen.tsx:49-83`, `257-321`, `330-515`, `515-595`.

Фактически:

- default tab — `all`;
- видны кнопки `Авторы`, `Работы`, `Все`;
- обе FormSection присутствуют одновременно;
- ниже на той же странице расположен order cancel/reassignment tool.

Это ровно тот вариант, от которого founder отказался.

**Durable fix:** `/admin/authors` и `/admin/works` либо один route с обязательным domain segment. На экране существует только выбранный domain, его search/filter/list/detail/decision states. Orders переносятся в отдельный будущий `/admin/orders` и не входят в этот этап.

**Acceptable variant:** `/admin?domain=authors|works` без `all`, но DOM и запрос второго domain не должны монтироваться.

**Hack — не использовать:** скрывать одну из двух колонок CSS при сохранении обоих запросов/секций или оставлять Orders collapsed внизу.

### F-08 — Модератор не видит историю создания [P1]

**Доказательство:** `apps/api/src/admin/admin.controller.ts:34-43`, `100-130`; `packages/contracts/src/admin.ts:87-99`; карточка works `admin-moderation-screen.tsx:401-499`.

Admin projection расширяет базовый `productSchema`, но не owner/public detail с `creationIntro`, ordered `creationSteps` и process images. UI показывает основное изображение, автора, город и story. Модератор может одобрить работу, не увидев контент вкладки «Создание», который станет публичным.

**Durable fix:** отдельный admin moderation detail contract с только нужными public-review полями, включая creation story/process image metadata. Не переиспользовать owner-private contract целиком. List endpoint остаётся summary; detail загружается при выборе карточки.

**Security:** private handoff/transfer contacts не должны попадать в public preview или общий list payload.

### F-09 — Replace creation может тихо удалить этап и фото [P1]

**Доказательство:** клиент `product-draft-screen.tsx:229-240`, сервер `products.service.ts:430-473`.

Клиент фильтрует этап, если пуст title **или** body. Сервер удаляет все существующие steps, чьи ID отсутствуют во входящем массиве. Если автор временно очистил одно поле существующего этапа и нажал save, step исчезает; связанное process image также может быть удалено каскадом. UI удаления на `product-draft-screen.tsx:778-786` не требует подтверждения.

**Durable fix:** не фильтровать существующие steps. Валидировать каждую непустую row field-locally и блокировать save. Удаление — только отдельное явное действие с confirmation для persisted step. Backend replace contract должен отличать `update/create/delete`, либо принимать complete list только после строгой валидации без silent omission.

**Acceptable variant:** complete-list replace остаётся, но UI никогда не отправляет partially invalid list, а удаление имеет explicit `deletedIds`/confirmation.

**Hack — не использовать:** сохранять пустую строку как пробел или показывать generic error после уже выполненного delete.

### F-10 — Acceptance docs преждевременно закрыты [P1]

**Доказательство:** `docs/design/05-DESIGN-HANDOFF.md:120-134` содержит закрытые `[x]`; `docs/design/04-DESIGN-STATUS.md` помечает Product About implemented/verified и atmosphere runtime verified; при этом те же документы признают отсутствие matched Pen overlay/founder/device acceptance.

Screenshot tests создают изображения и проверяют элементы/геометрию, но не сравнивают их с Pen. Например, `01-wave2-layout-screenshots.spec.ts:274-279` просто сохраняет product screenshot. `38/38` означает functional pass, не visual parity.

**Durable fix:** разделить статусы:

- `Functional implemented`;
- `Automated regression passed`;
- `Visual compared`;
- `Founder approved`;
- `Native/accessibility verified`.

Нельзя переводить screen в `Visual verified`, пока нет сохранённого overlay/diff и явного founder approval.

### F-11 — Public pages периодически не загружались [P2, diagnosis required]

Founder screenshots показывают `Не удалось загрузить работы`, а также сбои author/profile content. При текущей runtime-проверке `/works`, `/authors`, `/seller/anna-morozova` и product detail загрузились; дефект не воспроизведён. Поэтому нельзя честно утверждать конкретную contract-регрессию.

Возможные причины:

1. API/PostgreSQL ещё не готовы при старте web;
2. dev stack работал на другой БД/seed;
3. HMR/stale bundle после смены контрактов;
4. временный 5xx/network error;
5. query c `retry: false` на creator detail делает единичный сбой финальным до ручного retry.

**Нужная диагностика:** на следующем воспроизведении сохранить URL, response status/body, API stack trace и timestamp. Добавить dev-stack readiness/health gate до открытия frontend и E2E smoke «cold start → works/authors/creator/product».

**Не делать:** маскировать проблему вечным skeleton или silent fallback на fixtures.

### F-12 — Search и surfaces слишком тёплые [P2]

**Доказательство:** `HeaderSearch` использует `surfaceStrong` (`AppHeader.tsx:303-341`), а tokens задают `surfaceWarm #FBFBF8`, `surfaceStrong #F1F1ED`, glass с warm RGB.

На ambient page оттенки дополнительно смешиваются с backdrop, поэтому search выглядит желтоватым. Pen показывает нейтральный светло-серый control.

**Durable fix:** разделить semantic tokens `controlNeutral`, `canvasWarm`, `glassNeutral`; search не должен наследовать artwork tint. Применить один shared header control token ко всем header variants.

### F-13 — Process photo UX требует лишнего возврата [P2]

**Доказательство:** upload action показывается только если `step.id` существует (`product-draft-screen.tsx:750-777`). После `replaceCreation` wizard сразу делает `setWizardStep(4)` (`229-251`).

Новый этап невозможно сразу снабдить фото. Автор сохраняет историю, попадает на review, затем должен вернуться на Step 3 и загрузить фото.

**Durable fix:** Step 3 сохраняет text rows, получает IDs, остаётся на Step 3 и последовательно загружает выбранные local assets; только после завершения/явного Continue открывается Review. RHF `useFieldArray` может хранить persisted ID и pending local image в одной row model.

### F-14 — Admin lists не масштабируются [P2]

**Доказательство:** `AdminController.listSellers/listProducts` выполняет `findMany` без limit/cursor; frontend загружает обе коллекции и фильтрует локально.

**Durable fix:** отдельные query contracts для authors/works: status, q, sort, cursor/page, limit; DB pagination и count/facets; detail endpoint по ID. После разделения routes frontend не запрашивает другой domain.

### F-15 — Монолитные screen-файлы затрудняют точную реализацию [P2]

Текущие размеры:

- `product-screen.tsx` — 1402 строки;
- `product-draft-screen.tsx` — 886;
- `seller-profile-screen.tsx` — 633;
- `admin-moderation-screen.tsx` — 667.

В одном файле смешаны queries, mutations, state machines, formatting и layout. Это объясняет, почему новый flow добавлялся поверх старой композиции.

**Durable scoped decomposition:** извлекать только по текущим boundaries:

- `ProductHero`, `ProductAboutPanel`, `AuctionParticipationDialog`;
- `useProductDraftForm` + step components;
- `useCreatorProfileForm` + step components;
- `AdminAuthorsQueue`, `AdminWorksQueue`, detail/decision dialog.

Не нужен абстрактный «универсальный экран» или новый state framework.

### F-16 — Wizard forms не используют уже установленный form stack [P2]

В `apps/mobile/package.json` уже есть `react-hook-form`, `@hookform/resolvers` и Zod. Auth forms уже демонстрируют проектный pattern. Product/creator wizards используют множество локальных `useState` и отдельные ручные validators.

**Durable simplification:** RHF + shared contract-derived Zod schemas; `useFieldArray` для creation steps/social links; step trigger validation для текущего шага; server errors маппятся в field errors.

Плюсы: меньше кода, меньше рассинхронизации, dirty-state/navigation guard, field-local errors, проще persistence.

### F-17 — SlideToBid дублирует возможности установленных библиотек [P2]

**Доказательство:** `SlideToBid.tsx` — 184 строки PanResponder + Animated. В проекте уже установлены `react-native-gesture-handler` и `react-native-reanimated`, а root обёрнут GestureHandlerRootView.

**Durable simplification:** `Gesture.Pan()` + Reanimated shared value/spring. Это переносит drag на UI thread, одинаково работает web/native и устраняет Animated native-driver warning. Сохранить чистые geometry helpers/tests и accessibility action fallback.

**Acceptable workaround:** `useNativeDriver: Platform.OS !== 'web'` уберёт warning, но не решит JS gesture complexity.

### F-18 — RN Web warnings не закрыты [P3]

Подтверждено runtime и кодом:

- `pointerEvents` как prop в `AmbientImageBackground.tsx:36-47`;
- `useNativeDriver: true` в Ambient и SlideToBid;
- legacy `shadowColor/shadowOpacity/shadowRadius/shadowOffset` в shared elevation token и AccountMenu.

**Исправление:**

- перенести pointerEvents в style;
- Reanimated либо platform-specific driver;
- platform-specific elevation helper: Web `boxShadow`, native shadow/elevation. Не заменять все токены только на `boxShadow`, иначе пострадает native.

### F-19 — «Торги 0» похоже на stale bundle, но API компонента не очищен [P3]

Founder screenshot показывает `Торги 0`. На текущем HEAD `ProductTabs.tsx:75-115` визуально рендерит только label; count используется только в accessibilityLabel. Текущий runtime также не показал видимый `0`.

Вывод: screenshot, вероятно, сделан на older revision/stale Metro bundle. Если после полного `expo start --web --clear` count остаётся видимым, frontend обслуживает другой build/worktree.

Если founder требует отсутствие count вообще, удалить `bidCount` из публичного API ProductTabs и из вызова `product-screen.tsx:1319-1322`, чтобы старое поведение не вернулось.

### F-20 — Fixtures не являются visual reference [P2]

E2E проверяет 8 author cards, 12 product cards, уникальные image URLs и `naturalWidth > 0`. Он не проверяет art direction, crop, subject, palette или соответствие Pen. Поэтому stock portraits и случайные изображения могут пройти тесты, оставаясь визуально чужими.

**Durable fix:** отдельный visual fixture manifest с утверждёнными local assets, expected crop/aspect/attribution; screenshots сравниваются с approved baseline. Не использовать внешние нестабильные image URLs в visual acceptance.

## 7. Что сделано корректно и должно быть сохранено

Чтобы rework не превратился в переписывание проекта:

- canonical Pen совпадает с приложенным source;
- сервер остаётся владельцем auction snapshot/minimum/status;
- bid idempotency и admin exclusion не следует переносить на клиент;
- admin endpoints защищены auth/admin guards;
- owner-only detail hydration истории создания добавлена;
- responsive mobile menu width fix для 320/375/390 сохранён;
- structured social links и field-level profile validation полезны;
- shared Ambient component — правильное направление, проблема в настройке, не в самой идее reuse;
- AppDialog — подходящий существующий primitive для modal flows;
- unit/integration/E2E остаются regression net, их не надо удалять из-за visual rejection.

## 8. Почему тесты не поймали проблемы

1. Screenshot tests сохраняют PNG, но не делают `toHaveScreenshot` против approved Pen-derived baseline.
2. Геометрические assertions проверяют overflow/число колонок/наличие title, но не canonical x/y/width/height для header, player и panels.
3. Product screenshot снимается, но не падает из-за жёлтого search, слабого blur или неправильного radius.
4. Auction tests проверяют успешную ставку и slider, но не отсутствие inline email form до CTA.
5. Moderation tests проверяют approve/conflict, но не запрет `All`, отсутствие Orders и completeness creation story.
6. E2E стартует контролируемый API/DB и не доказывает устойчивость обычного локального cold start.
7. Docs смешали functional, automated и visual acceptance в один статус.

## 9. Рекомендуемая последовательность исправления

Каждый этап — отдельный commit и запись в audit log. Не смешивать visual geometry, backend contracts и unrelated refactor.

### Этап 0 — вернуть честный статус

- пометить Product/Header/Participation/Moderation как `Partial/Rework required`;
- открыть visual checklist;
- зафиксировать этот аудит как baseline;
- production-код не менять в этом commit.

### Этап 1 — shared visual foundation

- header grid;
- neutral control/glass tokens;
- platform elevation helper;
- Ambient tuning;
- warning cleanup;
- screenshots header/ambient 1440/1024/390.

### Этап 2 — Product hero и AuctionPlayer

- разложить ProductHero на канонические columns;
- исправить player intrinsic geometry и variants;
- точно воспроизвести CTA/radii/typography;
- проверить long Russian/BYN strings.

### Этап 3 — Auction participation state machine

- убрать inline BidForm/EmailRulesGate из hero;
- реализовать единственный responsive dialog flow;
- все verification states из `nTnuM`;
- refresh snapshot перед bid;
- SlideToBid через Gesture Handler/Reanimated;
- focus, Escape, outside, reduced motion, retry/expired/outbid.

### Этап 4 — Product content blocks

- Product About panel;
- Author summary;
- creation/bids tabs;
- related works;
- убрать неутверждённый visible counter окончательно;
- matched screenshots default/creation/bids.

### Этап 5 — creation wizard correctness

- RHF/useFieldArray;
- исключить silent deletion;
- explicit delete confirmation;
- pending process photo в одной step row;
- persistence/reload/back/refresh matrix;
- backend tests update/create/delete with image.

### Этап 6 — moderation domain split

- `/admin/authors` и `/admin/works`;
- убрать All и Orders;
- server pagination/filter/search;
- detail contracts;
- creation story/process media в work review;
- decision/conflict/success states по Pen.

### Этап 7 — public reliability и fixtures

- cold-start health/readiness test;
- capture/diagnose intermittent API failure;
- approved local visual fixtures;
- error/retry states centered and responsive.

### Этап 8 — acceptance

- fresh clean build, не HMR-only;
- 1440/1024/390 screenshots всех required states;
- matched overlay с соответствующим Pen root;
- Playwright functional suite;
- iOS/Android smoke;
- keyboard/screen-reader/reduced-motion;
- founder approval;
- только после этого `Implemented/Verified`.

## 10. Обязательная commit-схема

Рекомендуемые subjects:

1. `docs: record pen v2 rejection audit`
2. `fix: align shared header and atmosphere`
3. `fix: match product hero and auction player`
4. `fix: move auction eligibility into dialog`
5. `fix: align product content panels`
6. `fix: preserve creation story edits`
7. `feat: split admin moderation domains`
8. `test: add pen v2 visual acceptance`
9. `docs: record final pen v2 evidence`

После каждого commit в implementation log указывать:

- scope;
- Pen root/state;
- changed files;
- candidate fixes и выбранный durable fix;
- checks;
- screenshot paths;
- deliberate deviations;
- remaining risks.

## 11. Visual acceptance matrix

Минимум:

| Экран/flow | 1440 | 1024 | 390 | States |
| --- | --- | --- | --- | --- |
| Header | да | да | да | guest, buyer, seller, admin, menu/search open |
| Works | да | да | да | loading, loaded, empty, error, filters/sort |
| Authors | да | да | да | loaded, empty, error, sort |
| Creator | да | да | да | 8 works, socials, ambient, no media |
| Product | да | да | да | live, scheduled, ended, no listing, sticky player |
| Product tabs | да | да | да | about, creation, bids/empty/error |
| Verification | да | да | да | start/sending/sent/filled/wrong/expired/loading/success |
| Bid | да | да | да | default/quick/custom/error/loading/outbid/ended/server error |
| Product wizard | да | да | да | every step, errors, upload, review, success, moderation outcomes |
| Creator wizard | да | да | да | every step, invalid links, review, success |
| Admin authors | да | да | да | queue/detail/reason/success/conflict/error |
| Admin works | да | да | да | queue/detail/story/media/reason/success/conflict/error |

Для visual pass недостаточно просто сохранить кадр. На каждый кадр нужны:

- exact Pen node/root;
- одинаковый viewport;
- overlay или approved baseline diff;
- tolerance policy;
- запись reviewer/founder decision.

## 12. Backend/API checklist

- [ ] admin author list имеет pagination/q/status/sort;
- [ ] admin work list имеет pagination/q/status/sort;
- [ ] work moderation detail включает creation intro/steps/process media;
- [ ] private transfer/handoff fields не попадают в public projection;
- [ ] creation replace не удаляет partially edited persisted step;
- [ ] explicit delete покрыт transaction/integration tests;
- [ ] cold-start health/readiness проверяет DB/API перед frontend acceptance;
- [ ] auction snapshot/bid остаются server-authoritative;
- [ ] idempotency и conflict semantics не ослаблены.

## 13. Frontend checklist

- [ ] header использует shared centered grid без 420 px mirror columns;
- [ ] search neutral gray и не окрашивается artwork tint;
- [ ] Product/Creator используют один Ambient implementation;
- [ ] background readable, artwork sharp, fade плавный;
- [ ] AuctionPlayer не переносит BYN и status;
- [ ] player/CTA совпадают с Pen по размеру/radius;
- [ ] email/rules/bid отсутствуют inline в hero;
- [ ] verification и bid — единый dialog flow;
- [ ] Product About/Author/related works совпадают с Pen panels;
- [ ] ProductTabs не показывает неутверждённый count;
- [ ] creation wizard не теряет text/images;
- [ ] moderation показывает ровно один domain;
- [ ] Orders отсутствуют в moderation workspace;
- [ ] RN Web console не содержит указанных deprecation/driver warnings;
- [ ] error/retry controls центрированы как единый PageState.

## 14. Ограничения для следующего агента

Нельзя:

- редактировать/удалять `design/pen/bidplace-web-v2.pen`;
- возвращать старую design system;
- подменять API fixtures на hardcoded production UI;
- обходить server validation/permissions;
- закрывать visual status только по green tests;
- использовать `any`, `@ts-ignore`, silent catch, negative-margin hacks;
- добавлять dependency без доказательства, что установленный stack не решает задачу;
- смешивать Orders обратно с Authors/Works moderation;
- проводить массовый unrelated refactor.

Нужно переиспользовать:

- design tokens, но исправить semantic separation warm/neutral;
- `AppDialog`/`@rn-primitives/dialog`;
- React Query/API client/contracts;
- RHF + Zod resolver;
- Gesture Handler + Reanimated;
- `expo-image` + `expo-linear-gradient`;
- существующие server-owned auction/security rules.

## 15. Как отличить stale runtime от текущей ошибки

Перед visual review:

1. сохранить dirty founder files без изменения;
2. подтвердить branch/HEAD;
3. остановить старые Metro/Expo процессы;
4. запустить web с очищенным bundler cache;
5. проверить API health и текущую DB/seed;
6. в DevTools подтвердить загруженный bundle/route responses;
7. повторить screenshot.

Если после clean start виден `Торги 0`, а текущий source его не рендерит, запущена другая копия/сборка. Если pages снова не загрузятся, сохранить HTTP evidence до нажатия «Повторить».

## 16. Definition of Done

Работа готова только когда одновременно выполнено:

1. функциональные tests/typecheck/lint/build зелёные;
2. нет P1/P2 findings из этого аудита;
3. все required states имеют fresh screenshots;
4. screenshots сопоставлены с canonical Pen, а не только просмотрены отдельно;
5. founder явно принял визуальный результат;
6. native smoke и accessibility gates записаны;
7. status docs не противоречат evidence;
8. audit log содержит полный commit ledger и remaining risks;
9. canonical Pen SHA не изменён.

До выполнения этих условий корректный статус проекта: **Partial / Rework required / Not approved**.

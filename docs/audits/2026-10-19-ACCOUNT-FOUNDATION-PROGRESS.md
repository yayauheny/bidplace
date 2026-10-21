# Account foundation — файл выполнения (волны 1–2)

Ветка: `fix/account-foundation` (от `7a9e0d04` = `fix/image-flicker`).
Старт: 2026-10-19. Push/merge/deploy не выполняются. Волна 3 (ФВ /account) — отдельным пакетом после Figma intake.

## Подтверждённые владельцы (проверено по коду 7a9e0d04)

- Ширина шторок: `packages/design-tokens/src/tokens.ts:610` (`sheetMax: 390`);
  `apps/mobile/src/components/ui/app-dialog-host-style.ts:22`;
  `apps/mobile/src/components/layout/AuthViewport.tsx:391` (+ `maxWidth: 350` на ~603 — требует отдельной проверки);
  AppDialog, FilterSheet/FilterSortSheet, ShareSheet.
- Данные: `authKeys.session` + `staleTime: Infinity` (`providers/auth-provider.tsx:203-206`);
  `sellerProfileQueryKey = ['seller','profile']` (`features/sellers/seller-profile-data.ts:10`), общий ключ для `useProfileData` и `useSellerCapability`;
  auth epoch + `canWritePrivateCache`; `ResilientRemoteImage`.

## Волна 1 — общая ширина шторок

Правило: viewport ≤600 CSS px — sheet на всю ширину; >600 — ограничение 390.
Центрированные диалоги не растягивать. `maxWidth:350` в AuthViewport проверить отдельно (sheet vs fullscreen). Не менять `sheetMax` токен без проверки всех потребителей.

- [x] причина / варианты / выбранное решение: `sheetMax` имел только 2 потребителя
  (host-style + AuthViewport); оба через общий хелпер. `maxWidth:350` = измеренная
  колонка формы 390-листа (auth.paddingX=20 → внутр. 350); fullscreen-регистрация
  использует тот же cap → оставлен без изменений, wide desktop sheet тоже.
- [x] реализация: `layout.sheetFillViewportMax: 600` (tokens.ts),
  `sheetWidthConstraint()` + `viewportWidth` в `app-dialog-host-style.ts`;
  AppDialog передаёт `width`; AuthViewport — sheet content maxWidth и cap формы
  (sheet ≤600 → без cap, иначе 350; fullscreen → 350).
- [x] адресные owner-тесты: app-dialog-host-style.spec +7 кейсов (320/390/414/440/600 → '100%', 601/1024 → sheetMax); host-style 17/17, AppDialog specs 18/18.
- [x] проверки: tsc чисто, eslint (mobile-файлы) чисто; design-tokens пересобран.
- [x] коммит `ba00fb37`.

## Волна 2 — данные аккаунта и кэш

staleTime 60с, gcTime 5мин для общего запроса; отсутствие профиля кэшируется как отсутствие; 401/сетевые ошибки ≠ «нет профиля»; инвалидация после собственных изменений; auth epoch сохранён. Фото: существующая медиаполитика; проверить проекцию editing vs published; без новых запросов ради оптимизации.

- [x] фактическая проекция имени/фото установлена и исправлена (AF-03):
  - публичный автор: `toPublicSellerProfile` → фото из `publishedRevision.profilePhotoAsset`
    (publicVariant PREVIEW), fallback `/api/sellers/:slug/photo`;
  - owner-ответ `toSellerProfileResponse` → `profilePhotoUrl = /api/sellers/:slug/photo`;
    эндпоинт `getPhoto` (sellers.service.ts:1017) читает БАЗОВОЕ фото
    `sellerProfile.profilePhotoAssetId/ObjectKey` — для APPROVED с editing-ревизией
    это опубликованное фото A, а НЕ editing (прежний вывод в этом файле был неверен);
    editing-фото отдаёт только `getEditingPhoto` (sellers.service.ts:748);
  - запись: update APPROVED-автора пишет фото только в `sellerProfileRevision`;
    approve (admin-moderation.service.ts:323-378, media-disabled путь) копирует
    фото editing-ревизии в базовый профиль (`...approvedPhoto`), media-enabled путь
    — через `enqueuePublication`; fork новой editing-ревизии копирует published-фото
    в неё (sellers.service.spec «copies approved achievements…»).
- [x] сценарий published A → editing B → public A → approve → public B подтверждён
  трассировкой кода и закреплён адресной регрессией в admin-moderation.service.spec
  (approve-запись несёт `seller-photo:editing-b`, не сохраняет `published-a`).
  Предел гарантии теста: это approve mapping с мокнутой записью
  `tx.sellerProfile.update`, НЕ end-to-end цепочка чтения фото и не media-asset
  ветка; read-сторона покрыта отдельно существующими спеками (sellers.controller.spec:
  getPhoto отдаёт байты базового профиля; sellers.service.spec: update APPROVED
  форкает ревизию). 43/43 в admin-moderation.service.spec + sellers.service.spec.
- [x] решение для /account (PROJECTION-GAP-01 закрыт, API НЕ расширял): прежний
  «пробел» исчез после корректной трассировки — опубликованная идентичность
  достаётся существующим контрактом: публичная проекция автора по slug
  (`/api/authors/:slug`, publishedRevision) для имени + `/api/sellers/:slug/photo`
  для фото; owner query остаётся источником приватных статусов/кабинета.
  Suspended/недоступный public profile — отдельное состояние без подмены editing
  identity. Вариант «серверное поле published-идентичности» не нужен.
- [x] query options согласованы: общий `fetchSellerProfile` (seller-profile-data.ts),
  единый ключ, staleTime 60s / gcTime 5min в `useProfileData` и `useSellerCapability`;
  404 → кэшированный null; guard эпохи сохранён: payload не пишется после смены
  сессии, при отказе guard'а null сохраняет семантику not_found (потребители читают
  «отсутствует», а не «ошибка»). Потребители проверены: экран редактора, форма,
  submission (setQueryData/invalidate уже по точному ключу), FloatingDock/cabinet/
  public screen через capability — типизации расширены на `| null`.
- [x] предзагрузка аватара НЕ добавлена: измеренного выигрыша нет; повторных запросов
  в пределах staleTime теперь нет и без неё (null-кэш + 60s). Загрузчик картинок не создавался.
- [x] проверки: новый owner-spec seller-profile-data.spec (7 кейсов: stale/gc значения,
  успех 1 запрос, absence-null 1 запрос, 401/network не кэшируются ×2, race-not_found,
  payload не пишется после закрытия сессии); sellers + account-logout-reachability
  341/341; tsc чисто; eslint чисто.
- [x] коммит `2eed81dd`.

## Корректирующий проход по аудиту ревью (AF-01…AF-04)

### AF-01 — текущая ошибка приоритетнее кэшированного null

- [x] регрессия воспроизведена: 404 → кэшированный null → refetch с network/500
  оставлял экран/кабинет в состоянии «нет профиля» (TanStack держит data=null
  вместе с error).
- [x] решение: общий `classifySellerProfileQuery` (seller-profile-data.ts) —
  текущая ошибка (network/5xx/401) = isError даже поверх null; отсутствие =
  успешный null ИЛИ актуальная not_found. Потребители: экран редактора
  (`missingProfile`) и `useSellerCapability` (isError/isAbsent).
- [x] регрессии: predicate unit-кейсы (seller-profile-data.spec, 5 кейсов);
  characterization «refetch failure over cached absence → infrastructure error,
  не wizard»; новый use-seller-capability.spec (absent-null / network-over-null /
  401). 32/32 адресно; tsc/eslint чисто.
- [x] коммит `6e89f8b9`.

### AF-03 — проекция фото

- [x] трассировка и адресная регрессия — см. «фактическая проекция» выше;
  коммит `d14734e6` доказывает approve mapping (мок записи), а не всю цепочку
  чтения фото; остаток чит-стороны покрыт существующими спеками, см. там же.

### AF-02 — production build + браузерная приёмка ширин

- [x] production web build на Node 22 текущего SHA (metro-cache очищен, т.к.
  EXPO_PUBLIC_* кешируется): успешно, entry-4f37e9e3; статика 7899 перезапущена
  на новый dist (API 3001 жив, bidplace_dev).
- [x] Chromium + WebKit, измерения (boundingBox, после settle-задержки):
  login sheet 320→320, 390→390, 414→414, 440→440, 600→600 (full-bleed ≤600 ✓);
  601→390, 1024→390 ✓; в обоих браузерах одинаково. Внутреннее поле:
  inputWidth = sheetWidth−66 на каждой ширине (601/1024 → 324) — поля заполняют
  внутреннюю ширину с существующими отступами ✓.
- [x] login→forgot→login (A→B→A): ширина 390 на каждом шаге, меняется только
  высота (545/447/545) — width jump нет ✓.
- [x] fullscreen-регистрация: цепочка DOM подтверждает maxWidth:350px колонки
  формы и на 390, и на 1024 (input 324 внутри 350) ✓.
- [x] centered dialog: exit-confirm «Прервать регистрацию» 366×?, left 12 =
  (390−366)/2, top 337 — centeredDelta 0 по обеим осям, оба браузера ✓.
  «Скоро появится» — bottom-anchored sheet по дизайну (390 full width, не target).
- [x] короткая высота 390×500: sheet height 476, bottom = 500, drag-handle
  на месте, в пределах вьюпорта ✓ (первый замер гонялся с анимацией — settle
  400ms).
- [x] свайп вниз закрывает sheet, URL остаётся `/` — оба браузера ✓.
- [x] finding: после Escape фокус = BODY. Причина: FloatingDock полностью
  размонтируется пока auth sheet открыт и пересоздаёт триггер при закрытии —
  восстановить фокус на тот же узел невозможно; pointer-click триггеру фокус не
  даёт (RN-web mousedown preventDefault). ЗАКРЫТО корректирующим проходом AR-01
  ниже (фокус восстанавливается на новый экземпляр открывшего пункта dock).
- [x] evidence: `docs/audits/current/evidence/2026-10-19-sheet-widths/`
  (screenshots + measurements.json, 33 записи).

### AF-04 — canonical docs

- [x] 11-PROJECT-STATUS.md, 04-DESIGN-STATUS.md — записи 2026-10-19 account
  foundation; shared width policy добавлена в 03-DESIGN-SYSTEM.md.

## Корректирующий проход AR-01…AR-03 (повторное ревью)

### AR-01 — восстановление фокуса после auth-close у общего владельца

- [x] решение: pending opener. `use-return-focus.ts`: `rememberPendingOpener(selector)`
  (consume-on-read), selector = aria-label в скоупе `[data-testid="figma-floating-dock"]`;
  restore = живой element → свежий узел по selector (guard: не внутри диалога) →
  fallback. `FloatingDock.tsx`: перед навигацией на auth-маршруты запоминает opener
  (только web + гость). `AuthViewport.tsx`: `onOpenAutoFocus/onCloseAutoFocus`
  на Dialog.Content; restore активируется только `commitLeave` (успешный вход фокус
  не забирает), focus-on-open — первый input шторки, только если фокус ещё вне неё.
  Без timeout-подгонки и фокуса на случайную первую кнопку.
- [x] gate: новая спека `e2e/auth-focus-restore.spec.ts` (6 тестов × Chromium/WebKit:
  Escape/крест/свайп для «Профиль» и «Добавить» после keyboard-open из dock,
  login↔forgot, dirty-confirm на /register) + регистрация в playwright.sheet-local.
  Прогон конфига: 40 passed, 12 failed — все 12 это ровно 6 пред-редов auth-layout
  × 2 браузера; воспроизведены на base-сборке той же ветки (сигнатура
  environmental: стенд bidplace_dev без чекбокса и копии «политику
  конфиденциальности»), к AR-01 не относятся.
- [x] коммит `012c3e33`.

### AR-03 — cleanup capability spec

- [x] `use-seller-capability.spec.ts`: afterEach корректно размонтирует React root
  через act, очищает QueryClient и лишь затем удаляет контейнер; mounted-фикстуры
  ведутся mount()'ем. Удаления DOM недостаточно — устранена утечка mount'ов.
- [x] проверки: vitest 3/3, eslint чисто. Коммит `dcef9124`.

### AR-02 — формулировки о покрытии AF-03

- [x] прогресс-файл и 11-PROJECT-STATUS приведены к реальному охвату: тест d14734e6
  доказывает approve mapping с мокнутой записью, а не end-to-end цепочку чтения фото;
  read-сторона покрыта существующими спеками (getPhoto → базовый профиль;
  update APPROVED → fork ревизии). Большой integration suite ради формулировки
  не запускался.

## Разбор 6 падений auth-layout (после AR-gate)

Gate конфига sheet-local давал 12 failed = 6 уникальных × Chromium/WebKit. Разбор:
ни одно падение не является «environmental» — у каждого установлена конкретная причина.
Production UI не менялся; исправлены только тесты и добавлен изолированный стаб.

1. «filled login closes… providers stay unavailable» — timeout на link
   'политику конфиденциальности'. Контракт логина: «Ознакомьтесь с
   [политикой персональных данных и cookies] и [пользовательским соглашением]»
   (auth-legal-text.tsx, variant='login'); заголовки диалогов — реальные названия
   документов. Причина: устаревшие имена ссылок/заголовков прежней legal-копии.
   Контент диалога гейтится GET /api/auth/legal, который на стенде намеренно 503
   (см. ниже) → тест получил изолированный стаб legal (page.route).
2. «browser back leaves a filled login and confirms a filled registration» —
   timeout waitForResponse('**/api/auth/rules') + несуществующий checkbox
   /соглашаюсь/. Контракт регистрации: гейт GET /api/auth/legal (5 документов) +
   4 именованных consent-чекбокса (auth-form.tsx:1147-1180). Причина: устаревший
   тест под снятый контракт rules+единое согласие. Тот же дефект в общем хелпере
   expectAuthBrowserHistory (тест «without the Navigation API»).
3. «register email title layout is stable across viewport resize» — poll
   y∈[319;321.5] ложный (факт 161 без фикстуры legal / 200.5 с ней: состав шторки
   изменился) + «Дальше» disabled без legal-документов. Причина: устаревшие
   захардкоженные координаты и отсутствие legal-гейта в тесте. Обновлено до
   измеренного baseline 199.25–201.75; добавлен стаб legal.
4. «auth composition is stacked in the S4 phone column» — expectS4Register ждал
   текст 'Я соглашаюсь с политикой конфиденциальности и правилами сервиса'
   (однострочное согласие снятого контракта). Причина: устаревший helper. Заменён
   на проверку 4 consent-чекбоксов; rules-стаб → legal-стаб. Далее в том же тесте
   обнаружено: register — presentation='screen', хост диалога по политике волны 1
   ≤600 во всю ширину (host: appDialogHostStyle) — проверка brand-mark переведена
   в скоуп диалога (марк домашней страницы позади полностью перекрыт).
5. «nickname suggestions check availability only on explicit Next» —
   checkbox /соглашаюсь/ не найден + rules-стаб. Причина: тот же снятый контракт.
   Плюс устаревшие геометрические константы никнейм-шага (shell 51→50 по токену
   size.input=50; Y-координаты ±0.5px) — обновлены по замерам обоих браузеров.
   mark/wordmark замеряются в скоупе диалога.

Латентные находки по ходу разбора (не правились, вне скоупа):
- GET /api/auth/legal на стенде 503 НАМЕРЕННО: все 5 опубликованных документов
  содержат незаполненный плейсхолдер юрлица «[ПОЛНОЕ НАИМЕНОВАНИЕ ИП]», а
  legal-documents.ts отказывает в публикации при незаполненных юрфактах. Регистрация
  против реального API заблокирована до решения по юрлицу; в тестах это закрыто
  изолированным стабом (page.route), БД и production-guard не тронуты.
- Легкий флейк backdrop-close: boundingBox шторки, снятый до конца enter-анимации,
  отправлял клик в подползший под точку лист; добавлен settle 400ms (тот же приём,
  что в wave-1 acceptance).
- WebKit при CSS zoom 1.5 округляет дробную ширину вверх (scrollWidth 256 vs
  clientWidth 255) без переполнения — допуск 1px в конкретной проверке zoom.

Gate после исправлений: playwright sheet-local 52/52 (Chromium + WebKit),
auth-layout 16/16. eslint чисто. Production-код приложения не изменён.

## Открытые вопросы

- (волна 3) Figma intake /account и /account/settings — ждёт отдельного пакета.
- Browser zoom 200% / увеличение текста — Needs verification с прошлой волны
  (ручные шаги переданы; CSS zoom не считается заменой).
- PROJECTION-GAP-01 закрыт трассировкой (AF-03): API-расширение не требуется,
  опубликованная идентичность берётся из существующего публичного контракта.

## Проверки/наблюдения по мере работы

- Сеть (локальный стенд, старая сборка API — код фото-эндпоинта между ветками не менялся):
  `GET /api/sellers/vex/photo` → 200, `Cache-Control: public, max-age=0, must-revalidate`,
  `Content-Type: image/png`. Стабильный URL без cache-busting — подтверждено кодом
  (`sellerProfilePhotoUrl(slug)`). Медиаполитика (private/no-store для приватного) не трогалась.
- Восстановление после гонки эпох: на base 404 проходил мимо guard'а (guard только на
  успехе); новый код guard'ит null — без сохранения семантики not_found ломались 2
  сценария seller-profile-submit.spec (ошибка «Private cache is closed» читалась как
  поломка, а не отсутствие). Исправлено явным rethrow not_found для refusal-ветки.
- Локальный стенд 7899/3001 сейчас отдаёт старую сборку (fix/draft-restore); для
  кликабельной проверки волны 1 нужен rebuild web + перезапуск (не выполнялся —
  вне скоупа волн).

## Волна 3A — account primitives (tokens + компоненты)

Intake: `docs/archive/tasks/2026-10-19-account-ui` (README §4/§6, HANDOFF). Экраны не
строились — только примитивы и токены; 3B/3C отдельными коммитами.

### Mapping ролей (зафиксирован до кода, как требует intake)

Типографика (designTokens.typography):
- accountName 20/26 Inter600 −0.4; accountHandle 14/20 Inter500 −0.14;
- settingsTitle 18/22 Inter600 −0.18 (source line-height `normal` — 22 разумный,
  rendered-baseline проверка в приёмке экрана);
- settingsSection 12/16 Inter500 −0.12; settingsRow 14/20 Inter500 −0.28 (source
  `normal`);
- coverCaptionAuthor 14/17 Inter600 −0.14 (tracking не зафиксирован в intake,
  взят по аналогии workChip — на ревью).

Семантика (theme.ts, обе палитры; black provisional):
- accountMeta #858585 → НЕ добавлял, reuse `gray2` (точный semantic-эквивалент);
- settingsDivider #EFEFEF → новая роль (hex-близнец quietFill, но purpose —
  hairline-разделитель ≠ fill; комментарий в коде);
- accountAvatarPlaceholder #E0E0E0 / black #2E2E2E (близнеца нет);
- settingsSurface #FBFBFB / black #1E1E1E (близнеца нет);
- destructive #D22F0B — НЕ добавлял, роль только с волной удаления 3D.

Метрики: size.accountAvatar 100, size.settingsRowIcon 20,
size.settingsHeaderGlyph 28; radius.ownerCard 16, radius.settingsSurface 26;
ratio.ownerCardMedia 179/236; space.settingsSurfacePadX 14, coverCaptionGap 10.
Существующие avatar112/card24/sheetMax НЕ тронуты; light сохранён.

### Расширения компонентов (shortlist)

- WorkCoverCard: named-вариант `variant="caption"` (media 179/236 radius 16,
  caption ниже: author coverCaptionAuthor + title authorRowBio, без frost).
  Default variant и потребители не изменены; href расширен до
  `/product/... | /products/...` типизированно.
- BackButton: четвёртый вариант `settings` (plain glyph 28, touch 44).
- ResilientRemoteImage: опциональный `retryable` (default true — поведение
  существующих потребителей не меняется); для аватара без retry-цикла.
- FigmaIcon: иконки `setting-07` (Setting07Icon) и `log-out` (LogOutIcon,
  точное совпадение data-name из capture).
- Новые: AccountIdentity (100px round avatar + name/handle; НЕ CreatorIdentity),
  SettingsGroup/SettingsRow (single-purpose под settings-экран).

### Проверки 3A

- design-tokens build (tsc) — чисто; eslint изменённых файлов — чисто;
  mobile tsc --noEmit — чисто.
- Runtime/визуальная приёмка НЕ выполнялась (примитивы без экранов);
  rendered-baseline settingsTitle/settingsRow и tracking coverCaptionAuthor —
  Needs verification в приёмке экранов.
- Открытый вопрос ревьюеру: reuse gray2 для accountMeta и отдельная роль
  settingsDivider при hex-близнеце quietFill — трактовка правила
  «exact semantic-equivalent», может быть переопределена.

## Волна 3B — /account

- Группа `(account)`: ProtectedRoute БЕЗ requireVerifiedEmail (verified guard
  остаётся только у (seller)); root Stack регистрирует группу по паттерну.
- Единый cabinet controller `use-author-cabinet` (works infinite query +
  visibility mutation + invalidate): им пользуются и /cabinet (screen
  ужат до того же контроллера, ключ тот же — запросы не дублируются).
- Dock profile: guest → login с return URL (прежнее), admin → /admin
  (прежнее), signed-in non-admin → /account (новое). «Добавить» не тронут.
- Identity: APPROVED — published fullName/photo из owner profile (AF-03,
  editing revision не смешивается); остальные состояния — серый placeholder,
  displayName/@slug из сессии; legacy null slug → Share открывает объяснение
  и claim-flow через /profile, /authors/null не конструируется.
- Public identity: `use-account-public-identity` — тот же cache/key/shape,
  что публичный экран автора (author первой страницы, без fetchNextPage),
  enabled только APPROVED+slug, staleTime60s/gcTime5min общие константы.
  Ошибка публичного DTO не блочит экран: share fallback — typed
  `/authors/<slug>` из общего `authorSharePath`.
- AuthorShare: флаг `owner` скрывает «Пожаловаться» (default прежний).
- Работы: заголовок «Работы», PaddedGrid + gridColumnsFromWidth
  (min179/gap8/max3, onLayout-замер), OwnerWorkCard = caption-карточка +
  статус/модерация + primary/hide/restore как siblings вне Link карточки;
  primary action по authorCabinetPrimaryAction (locked/moderation → «Открыть»);
  hide через AppDialog confirm; empty owner state прежний.
- Состояния: loading/error InfrastructurePageStatus + доступный logout;
  SUSPENDED read-only (без create/hide/restore), статус «Профиль ограничен»;
  CTA: Стать автором/Продолжить заявку/Посмотреть заявку/Создать работу.

### Проверки 3B

- mobile tsc --noEmit чисто; eslint затронутых файлов чисто.
- Unit: author-profile-destination 8, ResilientRemoteImage 9,
  account-logout 7+4 — 28/28.
- E2E/runtime-приёмка НЕ выполнялась (по intake — отдельный этап 4);
  навигация dock → /account и экран в целом Needs verification в браузере.
- E2E-аудит: существующие specs кликают profile dock только для guest
  (→/login) и admin (→/admin) — оба поведения не изменены; /cabinet
  deep-link сохранён.

## Волна 3C — /account/settings

- Реальные строки среза: «Публичный профиль» → существующий /profile
  (verified-email guard и intro решают прежние владельцы, editor не переписан)
  и «Выйти» через useAccountLogout (очистка drafts/cache, replace '/').
- hideDock=true; шапка по capture: Back settings | «Настройки» settingsTitle |
  «Закрыть» (x, = router.back).
- Группа «Главное» (label 12/16 gray-2, поверхность #FBFBFB r26): row user →
  «Публичный профиль» со trailing arrow-right; отдельная поверхность без label:
  log-out → «Выйти» (busy guard).
- Не включены: email/password change, language/currency, support/community,
  Premium/adult/favorites — пустые группы не показываются.
- SettingsGroup label стал опциональным, SettingsRow получил trailingArrow/busy
  (default-поведение прежних потребителей не изменено — других потребителей нет).
- Иконки сверены с capture: «Публичный профиль» = user, «Выйти» = log-out.

### Проверки 3C

- tsc --noEmit и eslint затронутых файлов чисто.
- Runtime/browser-приёмка не выполнялась — этап 4 (Needs verification).

## Волна 3D — план удаления (docs-only, без кодинга)

- План: [`docs/archive/tasks/2026-10-19-account-ui/DELETE-BACKEND-PLAN.md`](../archive/tasks/2026-10-19-account-ui/DELETE-BACKEND-PLAN.md).
- Прочитаны products/portfolio/media/admin reads + transactions,
  schema (Product/Listing/ProductImage/CuratorSelection), suspended guards,
  public-visibility централизация, Cache-Control точки.
- Ключевые решения плана: tombstone `Product.deletedAt` (ARCHIVED не
  переиспользуется); DELETE 204 идемпотентен; чужое/несуществующее → 404;
  гонки через runReadCommittedTransaction + FOR UPDATE; listing live → 409;
  CuratorSelection снимается в той же tx; media revoke через media-lifecycle,
  физические байты не удаляются; suspended → 403 (рекомендация, на review);
  минимальный owner/integration набор тестов; ограничение закэшированных
  публичных media зафиксировано честно.
- Открытые вопросы на review: uniform 404 vs Forbidden для чужого id,
  suspended policy, видимость удалённых в admin moderation.
- Код не писался; UI delete CTA не добавлялся (запрещено без рабочего API).

## Повторное ревью 2026-10-20 (account-wave3-review) — AC-01…AC-07 + DP-01

База правок: `e7ff97c3` (auth-layout test-only) поверх волн 3A–3D.
Все находки закрыты коммитами `e59c35bc` (AC-03/01/02/05/04/06),
`aaa0972d` (AC-07 specs), `fb8923c4` (AC-07 browser gate). Документы и
DP-01 — отдельным коммитом. Push/merge/deploy не выполнялись.

- **AC-03 (маршруты).** Реальные адреса: `(account)/account/index.tsx`
  (AccountScreen) и `(account)/account/settings.tsx`
  (AccountSettingsScreen); легаси `account.tsx`/`settings.tsx` удалены
  (`git rm`). Проверка: e2e dock→/account, прямой goto и refresh
  /account/settings, Back/закрытие — 10/10 Chromium/WebKit.
- **AC-01 (public identity).** `use-account-public-identity` собран из
  общих `authorWorksBaseOptions` (тот же cache/key/shape/queryFn, что
  публичный экран автора) + общие staleTime 60s/gcTime 5min; возвращает
  `{author, isLoading, isError, refetch}`. Дедупликация с экраном автора
  доказана спеком (один network-вызов на два observer'а). Тип `PublicAuthor`
  — `portfolioAuthorSchema._output`. Форма данных не менялась.
- **AC-02 (ошибки действий).** Контроллер `use-author-cabinet.ts`
  возвращает `{pendingHideId, setPendingHideId, mutation, retry}`:
  attempt фиксируется в `onMutate`, retry перезапускает тот же mutate.
  Hide: ошибка внутри диалога + retry, диалог открыт пока mutation
  pending. Restore: inline-ошибка над grid + retry. Ошибка первой
  страницы без данных — полноэкранная; ошибка следующей страницы при
  сохранённых данных — inline, работы остаются. Проверки:
  account-consumer.spec 9/9 (hide 2 вызова после retry, restore 2 вызова,
  next-page fail → retry → вторая страница подгружена).
- **AC-04 (published identity A vs editing B).** AccountScreen при
  APPROVED берёт имя/фото/шеринг только из public author; owner profile
  (editing overlay) не читается. E2E: published fullName виден, editing
  Name B отсутствует. Фото — `Фото профиля: <published>` из public author.
- **AC-05 (композиция).** FormPageShell — единый scroll-owner экрана;
  skeleton identity с reserved geometry; локальная ошибка identity
  («Не удалось загрузить профиль» + «Повторить»), кабинет ниже живёт.
  Проверки: consumer spec + e2e.
- **AC-06 (caption/компоненты).** `WorkCoverCaption` экспортирован
  (author `coverCaptionAuthor`, title — новая роль `coverCaptionTitle`
  14/17/500/−0.28, numberOfLines 2); OwnerWorkCard использует его в
  no-cover ветке; дублирующей разметки нет. ResilientRemoteImage —
  `fallback: 'labelled' | 'plain'` (аватар в AccountIdentity — plain).
  AccountIdentity — row (avatar100 + flex1/minWidth0 колонка + cta slot),
  handle nullable. SettingsRow: `flex:1/minWidth:0`, AppText flexShrink,
  props trailingArrow/busy; SettingsGroup label опционален, красится
  `accountMeta`. Новые semantic-роли: `accountMeta` (light #858585,
  black provisional #8F8F8F — пользователям не включена), `coverCaptionTitle`.
- **AC-07 (consumer-регрессии + gate).** `account-consumer.spec.ts` 9/9:
  plain account (identity из сессии, CTA «Стать автором», секции работ
  нет, Share/settings есть, share path typed `/authors/<slug>`), approved
  A-over-B, key-parity с useAuthorWorks, identity error + retry + живой
  grid, suspended read-only (cached public identity не показывается,
  hide/restore отсутствуют), failed hide (диалог + retry), failed restore
  (inline + retry той же попытки), next-page failure (работы остаются +
  inline retry). Session-switch намеренно не дублирован
  (author-cabinet-work-cache). Browser gate `e2e/account-screen.spec.ts`
  10/10 Chromium+WebKit: dock→account (с ожиданием гидратации сессии —
  гостевой dock-клик не навигирует), published identity, настройки
  (пуш/закрытие/прямой URL/refresh), guest neutral not-found
  /authors/<slug> до публикации, 320 без горизонтального переполнения,
  настройки на коротком viewport, прокрутка контента аккаунта внутри
  shell на 320×568.
- **Прочие проверки.** Production web build (expo export, Node 22) на
  `aaa0972d` зелёный. Адресные specs 42/42 (5 файлов), tsc --noEmit и
  eslint чисто. Полный suite/build повторно не гонялся (по условию
  ревью). FormPageShell получил `testID="form-page"` для однозначного
  скоупа поверх стека маршрутов (RN Web отдаёт data-testid).
- **DP-01 (delete-план).** Уточнён по пяти пунктам ревью
  (DELETE-BACKEND-PLAN.md): `{ok:true}` вместо 204 (несовместим с
  requestJson), tombstone-проверки под существующим lock у всех поздних
  writers (включая admin approve — lock подтверждён чтением кода),
  CDN purge через существующий revoke-путь с success/failure-тестами,
  owner/admin bypass для direct image GET не вводится, противоречие
  reads-vs-moderation снято (активные очереди фильтруются, audit-история
  остаётся). Статус: план на review, кодинг не начинался, delete CTA в UI
  не добавлялся.
- **Остаток (Needs verification).** Физический iPhone/native-прогон
  экрана аккаунта; browser zoom 200% и увеличение текста (ручные шаги
  переданы ранее); точная Figma-сверка композиции /account — следующий
  этап (один экран по exact Figma node), она же закроет визуальный
  эталон caption/отступов.

## Второе повторное ревью 2026-10-20 (CR-01/02/03 + DP-02)

База: `fb8923c4` + docs-пакет. Коммиты: `5ffafb5e` (CR-01/02/03 код),
`1d482747` (CR-02 уточнение e2e), `56d11b8a` (DP-02 план). Кодинг
удаления не начинался; push/merge/deploy не выполнялись.

- **CR-01 (intent принадлежит работе и действию).** Контроллер
  `use-author-cabinet.ts` переведён на intent `{workId, action:
  'hide'|'restore'}`; API `{intent, begin, cancel, restore, confirm,
  retry, mutation}`, `sameIntent`. Restore — одношаговый begin+mutate.
  Pending блокирует смену цели; поздний onSuccess закрывает confirm
  только своего intent; begin/cancel делают mutation.reset при
  смене/отмене. Legacy `author-cabinet-screen.tsx` на том же контроллере
  (inline-ошибка при `mutation.isError` безопасна — ошибка всегда
  текущего intent). Кнопка «Скрыть» (`owner-work-card.tsx`) получила
  `disabled={visibilityPending}`. Регрессии (сначала красные):
  failed hide A→cancel→B адресует только B; failed restore A→hide
  confirm B не вызывает unhide A; pending A блокирует перенацеливание,
  поздний success не ломает чужой confirm; retry повторяет ту же
  операцию. Проверка: account-consumer.spec **14/14**, адресные 28/28.
- **CR-02 (возврат из настроек).** Settings Back = `dismissTo('/account')`
  (существующий паттерн AuthViewport): естественный стек возвращает к
  живому /account, прямая загрузка/reload — тоже к /account (web-стек
  под свежей загрузкой содержит index, `navigateBack` уходил бы на '/' —
  критерии ревьюера выполнены иначе named механизмом). Крест = `replace`.
  E2E обновлён: natural Back, direct/fresh Back, reload→крест (reload-close
  НЕ исключён из теста), account direct→Back→'/'. Gate **10/10
  Chromium+WebKit** после обоих коммитов.
- **CR-03 (дубль slug/@slug).** `account-screen.tsx`: при отсутствии
  displayName имя = один `@slug`, handle = null. Регрессия-спек
  единственности `@slug` в account-consumer.spec.
- **DP-02 (план 3D).** `56d11b8a`: единый `200 {ok:true}` и в §6 тестов
  (оставшиеся `204` устранены); фактическая cache policy установлена
  чтением кода и зафиксирована как решение до кодинга (owner JSON →
  `private, no-store`; публичные JSON → `no-store`/`must-revalidate`;
  product images остаются `immutable`, отзыв не гарантируется;
  отдельный edge-purge не вводится); аналитическая «отдельная строка»
  снята (активные метрики фильтруются по deletedAt, новые панели не
  вводятся). TTL-формулировка §7 приведена к фактической политике.
- **Проверки.** account-consumer.spec 14/14; адресные specs 28/28 (3
  файла); e2e account-screen 10/10 Chromium+WebKit; tsc/eslint чисто.
  Полный suite/build повторно не гонялся (условие ревью). Production
  build на `aaa0972d` остаётся актуальным для runtime (после `5ffafb5e`
  — адресные проверки + e2e, без повторного build; runtime-изменения
  ограничены контроллером/экранами аккаунта).
- **Остаток (Needs verification, не этот проход).** Визуальные детали
  (ширина CTA, insets, поля settings) — для измеренной приёмки этапа 4,
  которую ревьюер выполняет сам по сохранённому intake ace4a323;
  физический iPhone/native; browser zoom 200%/увеличение текста.

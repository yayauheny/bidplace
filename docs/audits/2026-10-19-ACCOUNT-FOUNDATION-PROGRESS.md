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

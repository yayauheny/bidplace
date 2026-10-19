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

- [x] фактическая проекция имени/фото установлена:
  - публичный автор: `toPublicSellerProfile` → фото из `publishedRevision.profilePhotoAsset`
    (publicVariant PREVIEW), fallback `/api/sellers/:slug/photo`;
  - owner-ответ `toSellerProfileResponse` → `profilePhotoUrl = /api/sellers/:slug/photo`
    ВСЕГДА; эндпоинт отдаёт `sellerProfile.profilePhotoAssetId/ObjectKey` — текущее
    РЕДАКТИРУЕМОЕ фото; имя/контакты в owner-ответе при `revisionOwnsFields` —
    редактируемые значения.
- [x] пробел зафиксирован (решенение ревьюера, API не расширял):
  **PROJECTION-GAP-01** — в owner-контракте нет опубликованной проекции идентичности
  (published имя/фото). `/api/sellers/:slug/photo` для владельца отдаёт editing-фото;
  публичная проекция published-фото живёт в другом контракте (`/api/authors/:slug`,
  по slug). Для /account одобренного автора по продукту нужно опубликованное фото —
  текущей проекцией это не достаётся без выдачи editing-значений за опубликованные.
  Варианты на решение: (а) публичный запрос по slug для APPROVED (второй запрос),
  (б) серверное поле published-идентичности в owner-ответе (расширение API).
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

## Открытые вопросы

- (волна 3) Figma intake /account и /account/settings — ждёт отдельного пакета.
- PROJECTION-GAP-01: опубликованная идентичность в owner-контракте — нужно решение
  ревьюера (варианты а/б выше). API самостоятельно не расширял.

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

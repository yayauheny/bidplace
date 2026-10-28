# W4 — Продажи: интерфейс — план реализации

> **Для агентов:** выполнять через superpowers `subagent-driven-development`
> (рекомендуется). Шаги — чекбоксы. Общие правила — [AGENT-RULES.md](../AGENT-RULES.md).

**Goal:** в `apps/mobile` покупатель может купить работу или сделать ставку,
автор — выставить и снять лот, оба — вести заказ до конца, пожаловаться и
найти поддержку; есть настройки контактов и уведомлений, избранное, точка
«требует внимания», анимации шапки работы и автора.

**Architecture:** новая папка `src/features/commerce/` (экраны и хуки продаж);
данные — React Query через одну фабрику ключей и `api.commerce` (W3, Task 12);
действия — `useMutation` с инвалидацией по фабрике; тексты ошибок — одна таблица
`src/lib/api-error-messages.ts` (W1); деньги — одна функция форматирования.
Экраны тонкие: разметка + хук. Общие элементы — существующие `ui/` и `figma/`;
новые общие компоненты — только перечисленные в **Files: Create** в `components/`.

**Spec:** [COMMERCE.md](../COMMERCE.md), [DESIGN-BRIEF.md](../DESIGN-BRIEF.md) (по
разделу на экран), Figma узлы из брифа.

**Ветка:** `feature/commerce-ui` от `main`. Факты проверены на `6720b7af`.
Зависит от: W3 (API и клиент), экраны F1–F10 из DESIGN-BRIEF §13 или явное
решение основателя о сборке без них.

## Global Constraints

- Скиллы `bidplace-ui`, затем `bidplace-ui-review`; перед экраном — Figma узел
  из брифа (только чтение) и `03-DESIGN-SYSTEM.md`.
- Цвета, отступы, радиусы, типографика — токены `packages/design-tokens`; inline
  `style={{` только для уникальной геометрии.
- Ключи React Query — только из `src/lib/query-cache.ts` (фабрики); строковых
  массивов ключей в фичах нет.
- Приватные данные продаж (заказы, «требует внимания», избранное, контакты,
  настройки) — под корнями auth-scoped ключей, чтобы `clearAuthenticatedSession`
  их чистил.
- Опрос вместо realtime (COMMERCE §12): `refetchInterval` только когда лот `LIVE`
  и экран в фокусе; на вебе — только при видимой вкладке.
- Таймер — одно значение времени на экран (хук `useNow(intervalMs)`), не таймер
  на каждую карточку. Серверное время: смещение из заголовка `Date` ответа или
  поля `serverNow` в ответе лота (выбрать одно — `Ruling:`).
- Каждый экран: загрузка, пусто, ошибка (`PageState` / `InfrastructurePageStatus`),
  ошибка действия на месте; доступность — роли и подписи кнопок, фокус в листах.
- Списки сделок и избранного — существующая сетка/список с пагинацией; без
  новой библиотеки списков.
- Не делать: корзину, оплату, чат, ленту уведомлений, пуши, ПК-пиксель-перфект.

## Review Focus

1. Время вышло, а кнопка «Сделать ставку» ещё активна и ставка «уходит» — блок
   сам переключается в «подводим итоги», ошибка сервера показывается понятно. → Task 3.
2. Пользователь вышел из аккаунта на общем устройстве — чужие заказы и контакты
   не остаются в кэше. → Task 1, шаг 1.
3. Две быстрые нажатия «Поставить» — одна ставка (один idempotency-ключ на попытку). → Task 4.
4. Автор случайно нажимает «Не состоялась» — подтверждение с последствием; после — заказ обновлён в хабе без перезагрузки. → Task 6.
5. Страница работы с аукционом открыта 10 минут — не растёт число запросов
   сверх опроса, нет лишних перерисовок всей страницы каждую секунду. → Task 3, шаг 4.

## Facts

- Маршруты: `src/app/(public)/product/[publicId].tsx` (работа),
  `src/app/(account)/account/index.tsx`, `settings.tsx`; `(seller)/cabinet.tsx`;
  `(admin)/admin.tsx`. `ProtectedRoute` в `(account)/_layout.tsx`; `(seller)` —
  подтверждённая почта.
- Работа: `src/features/products/product-screen.tsx` — `useQuery(['portfolio-work', publicId])`,
  вкладки из `work-content.ts` (`story`, `details`, `delivery`), заглушка
  `payment-delivery-stub.ts`; `WorkHeader.tsx` / `.web.tsx` (web —
  `IntersectionObserver` + `StickyDockSurface`); `WorkActions.tsx` (назад, поделиться).
- `product-screen.spec.ts`: describe `Work page commerce stub` (нет «корзин»/«купить»)
  и `Work top chrome` (нет Like, ~257–277) — меняются намеренно: продажи и
  избранное теперь в продукте (`DEC-149`).
- Автор: `src/features/sellers/CreatorHeader.tsx` (Reanimated, `scrollY`),
  `public-seller-screen.tsx` — единственный `useAnimatedScrollHandler`.
  E2E `e2e/author-static-header.spec.ts`, `e2e/work-header-motion.spec.ts`,
  `playwright.motion.config.ts`.
- Общие: `AppDialog` (`presentation="sheet"`), `PrimaryButton`/`SecondaryButton`/`TextButton`,
  `TextField`, `DateField`, `PageState`, `FigmaTabs`, `FigmaChip`/`FigmaChoiceChip`,
  `SettingsGroup`/`SettingsRow` (`components/figma/SettingsList.tsx`; переключателя
  нет), `StickyDockSurface`/`StickyDockActionRow`, `WorkCoverCardGrid`,
  `FigmaIcon`, `MotionPressable`. Switch, Badge — нет.
- Кэш на краю: Worker кэширует анонимные `GET /api/works/:publicId` и
  `/api/authors/:slug` на 30 с (`deploy/cloudflare/src/router.ts` `publicCacheTtl`);
  лот — отдельный некэшируемый `/lot`.
- Данные: `src/lib/query-cache.ts` — `authKeys`, `categoryKeys`, auth-scoped
  корни `user`, `seller`, `admin`, `clearAuthenticatedSession`,
  `canWritePrivateCache`; `usePrivateCacheEpoch`.
- Ошибки: `classifyApiError`, `getApiErrorCode` из `@bidplace/api-client`;
  таблица текстов — `src/lib/api-error-messages.ts` (создаётся в W1).
- Библиотеки: Reanimated 4.5, gesture-handler, expo-image, React Query 5. React
  Compiler выключен. FlashList/LegendList/Zustand нет.
- Тесты: Vitest (`apps/mobile/vitest.config.ts`, `src/testing/`), Playwright
  (`playwright.config.ts`, проекты chromium/webkit, `e2e/support/`).

## Фронтенд

```text
apps/mobile/src/features/commerce/
  use-lot.ts              LotPanel.tsx            BidSheet.tsx          PurchaseDialog.tsx
  CreateLotSheet.tsx      use-lot-actions.ts
  deals-screen.tsx        use-deals.ts            OrderRow.tsx
  order-screen.tsx        use-order.ts            OrderActions.tsx      ReportSheet.tsx
  attention-dot.tsx       use-attention.ts
  favorite-button.tsx     use-favorite.ts         favorites-screen.tsx
apps/mobile/src/lib/money.ts       apps/mobile/src/lib/use-now.ts
apps/mobile/src/app/(account)/account/deals.tsx · orders/[publicId].tsx · favorites.tsx · contacts.tsx
```

### Task 1: Основа — ключи, деньги, время, ошибки

**Files:**
- Modify: `src/lib/query-cache.ts`, `src/lib/api-error-messages.ts`
- Create: `src/lib/money.ts`, `src/lib/use-now.ts` + спеки
- Test: `src/lib/query-cache.spec.ts` (или существующий спек кэша)

**Interfaces:**

```ts
export const portfolioKeys = { work: (publicId: string) => readonly unknown[]; works: (q) => ... }
export const commerceKeys = { // все под корнем 'user' (чистится при выходе), кроме bids
  lot: (publicId: string, viewerId: string | null), // ['user', viewerId ?? 'anonymous', 'lot', publicId]: ответ содержит viewer
  bids: (listingId: string), orders: (role, state), order: (publicId), attention: (),
  favorites: (), favorite: (productId), contacts: (), notificationSettings: () }
formatMoney(minor: number, currency: 'BYN' | 'RUB'): string   // Intl.NumberFormat вынесен на уровень модуля
parseMoneyInput(text: string, currency): number | null        // в минимальные единицы
useNow(intervalMs: number, enabled: boolean): number
invalidateWorkSurfaces(queryClient, { publicId?, sellerSlug? }): Promise<void> // один список: work, lot, works, home, author, owner works
```

- [ ] **Шаг 1: падающие тесты:** после `clearAuthenticatedSession` в кэше нет
  ключей `commerceKeys.*` (кроме `bids`), закэшированный лот без `viewer`
  у следующего пользователя не показывается; `invalidateWorkSurfaces` трогает ровно
  свой список ключей (сейчас скрытие работы из кабинета, со страницы автора и
  сохранение черновика сбрасывают разные наборы — заменить все три вызова); `formatMoney` — `it.each` (125000 BYN
  → «1 250 BYN», 1250 → «12,50 BYN», RUB → «₽»); `parseMoneyInput` («12,5», «12.50»,
  «1 250», мусор → null); все коды продаж COMMERCE §12 имеют текст.
- [ ] **Шаг 2:** FAIL → реализовать → PASS.
- [ ] **Шаг 3:** заменить `['portfolio-work', …]` и `['portfolio-works', …]` в
  фичах на `portfolioKeys`; `rg "queryKey: \['" src/features` → пусто.
- [ ] **Шаг 4:** коммит `feat: commerce query keys, money and time helpers`.

### Task 2: Общие недостающие примитивы

**Files:**
- Modify: `src/components/figma/SettingsList.tsx` (вариант строки с переключателем)
- Create: `src/components/ui/StatusBadge.tsx` (метка статуса по токенам; если в
  Figma есть компонент метки — по нему)
- Test: спеки рядом, `theme.spec.ts` при новых токенах

**Interfaces:** `SettingsRow` получает `toggle?: { value: boolean; onChange(v: boolean): void; disabled?: boolean }`
(роль `switch`, подпись = `label`); `StatusBadge({ tone: 'neutral' | 'accent' | 'success' | 'danger'; label })`.

- [ ] Падающий тест (роль, состояние, нажатие) → реализовать по Figma `7008:15149` → PASS → коммит `feat: settings toggle row and status badge`.

### Task 3: Блок лота на странице работы

**Files:**
- Create: `use-lot.ts`, `LotPanel.tsx`
- Modify: `product-screen.tsx`, `work-content.ts`, `WorkHeader*.tsx` (место
  кнопки), `product-screen.spec.ts`
- Delete: `src/features/products/payment-delivery-stub.ts` и его реэкспорт
- Test: `LotPanel.spec.tsx`, `product-screen.spec.ts`, e2e `e2e/commerce-lot.spec.ts`

**Interfaces:** `useLot(publicId)` — `useQuery(commerceKeys.lot(publicId))` к
`GET /api/works/:publicId/lot` → `{ lot, effectiveState, remainingMs, minimumBidMinor, viewer }`;
опрос — COMMERCE §12. Данные работы остаются в своём запросе (он кэшируется на краю).

- [ ] **Шаг 1: падающие тесты:** `it.each` по строкам таблицы DESIGN-BRIEF §1 —
  видимый текст и доступность кнопки; таймер дошёл до 0 → «подводим итоги» без
  нового запроса; вкладка «Оплата и доставка» → «Как проходит сделка» только при лоте.
- [ ] **Шаг 2:** обновить `product-screen.spec.ts`: describe-заглушка удаляется,
  вместо неё — работа без лота не показывает кнопок продаж (тот же смысл для портфолио).
- [ ] **Шаг 3:** FAIL → реализовать → PASS.
- [ ] **Шаг 4:** e2e: страница аукциона 60 с — запросов к `/lot` ≤ 7, ответ работы
  запрошен один раз, других API-запросов нет; при скрытой вкладке опроса нет.
- [ ] **Шаг 5:** коммит `feat: lot panel on work page`.

### Task 4: Ставка и покупка

**Files:** Create: `BidSheet.tsx`, `PurchaseDialog.tsx`, `use-lot-actions.ts`. Test: спеки, e2e `commerce-lot.spec.ts`.

**Interfaces:** `usePlaceBid(listingId)`, `usePurchase(listingId)` — `useMutation`;
idempotency-ключ создаётся при открытии листа/диалога и меняется после успеха
или смены суммы.

- [ ] **Шаг 1: падающие тесты:** двойное нажатие → один запрос; `BID_TOO_LOW` →
  поле обновлено новой минимальной, текст из таблицы; подтверждение крупной
  ставки (> 2× минимальной); аноним → вход с возвратом; покупка → переход в
  карточку заказа; `LISTING_NOT_OPEN` → блок обновлён.
- [ ] **Шаг 2:** FAIL → реализовать (DESIGN-BRIEF §2–3) → PASS.
- [ ] **Шаг 3:** коммит `feat: bid sheet and purchase dialog`.

### Task 5: Выставление и снятие (автор)

**Files:** Create: `CreateLotSheet.tsx`. Modify: `LotPanel.tsx` (вид автора),
`src/features/account/owner-work-card.tsx` (действие «Выставить»). Test: спеки.

- [ ] Падающие тесты: переключение типа меняет поля; дата окончания считается
  и показывается; валидация совпадает со схемой контрактов (та же схема,
  `createListingRequestSchema.safeParse`); снятие аукциона со ставками недоступно
  с объяснением → реализовать (DESIGN-BRIEF §4) → PASS → коммит `feat: create and cancel lots`.

### Task 6: Хаб сделок и карточка заказа

**Files:** Create: `deals-screen.tsx`, `use-deals.ts`, `OrderRow.tsx`,
`order-screen.tsx`, `use-order.ts`, `OrderActions.tsx`, `ReportSheet.tsx`,
маршруты `deals.tsx`, `orders/[publicId].tsx`. Modify: `account-screen.tsx`
(вход в сделки). Test: спеки, e2e `e2e/commerce-orders.spec.ts`.

- [ ] **Шаг 1: падающие тесты:** `it.each` по строкам таблицы DESIGN-BRIEF §6
  (роль × статус → кнопки); опасные действия требуют подтверждения; после
  действия инвалидируются `order`, `orders`, `attention`, `portfolioKeys.work`;
  «Вернуть в продажу» только у автора автозакрытого заказа (30 дней);
  контакты как ссылки (`mailto:`, `tel:`, `https://t.me/…`); после `FAILED`
  контактов нет; жалоба — повторная показывает «уже на рассмотрении».
- [ ] **Шаг 2:** FAIL → реализовать (DESIGN-BRIEF §5–7) → PASS.
- [ ] **Шаг 3:** e2e: покупка → карточка → «Сделка состоялась» → метка «Продано»
  на странице работы (Chromium и WebKit).
- [ ] **Шаг 4:** коммит `feat: deals hub and order card`.

### Task 7: Настройки, контакты, поддержка

**Files:** Modify: `account-settings-screen.tsx`. Create: `contacts.tsx` маршрут +
форма в `src/features/account/`. Test: спеки.

- [ ] Падающие тесты: переключатель «перебили» сохраняет и откатывается при
  ошибке; форма контактов — валидация схемой контрактов, пустое = удалить;
  «Поддержка» открывает Telegram из конфигурации → реализовать (DESIGN-BRIEF §8)
  → PASS → коммит `feat: deal contacts, notification settings and support`.

### Task 8: «Требует внимания» и избранное

**Files:** Create: `attention-dot.tsx`, `use-attention.ts`, `favorite-button.tsx`,
`use-favorite.ts`, `favorites-screen.tsx`, маршрут `favorites.tsx`. Modify:
шапка главной / `DesktopHeader` / док (место точки — по Figma), `WorkActions.tsx`,
`product-screen.spec.ts` (в шапке работы появилось сердце избранного — обновить `Work top chrome`).

- [ ] Падающие тесты: точка видна при элементах и скрыта без них; аноним точку
  не запрашивает; избранное — оптимистичное переключение с откатом; аноним → вход
  → реализовать (DESIGN-BRIEF §9–10) → PASS → коммит `feat: attention dot and favorite works`.

### Task 9: Анимации шапки

**Files:** Modify: `WorkHeader.tsx` (native), `WorkHeader.web.tsx`,
`CreatorHeader.tsx`, `public-seller-screen.tsx`, `product-screen.tsx`
(`PageScrollView animated`). Test: `e2e/work-header-motion.spec.ts`,
`e2e/author-static-header.spec.ts`.

- [ ] **Шаг 1:** прочитать движение в Figma (`get_motion_context` для узлов из
  DESIGN-BRIEF §11). Нет данных о движении → `NEEDS-FIGMA`, задачу остановить.
- [ ] **Шаг 2:** падающий e2e: прокрутка закрепляет панель по макету, reduced
  motion — сразу закреплено; один `useAnimatedScrollHandler` на экран, анимируются
  только `transform`/`opacity`.
- [ ] **Шаг 3:** реализовать для 390, проверить 1024/1440 «не сломано»; PASS.
- [ ] **Шаг 4:** коммит `feat: work and author header motion`.

### Task 10: Админ

**Files:** Modify/Create в `src/features/admin/` и `(admin)`: список жалоб,
карточка жалобы, действия по заказу и лоту, блок «Здоровье» (`GET /api/admin/health`:
последний тик, неотправленные письма с кнопкой «Повторить», открытые жалобы),
недельные цифры продаж на экране аналитики (SQL по `listings`, `bids`, `orders`,
`reports` — список в [OPERATIONS.md](../OPERATIONS.md) §2). Test: спеки.
Действия «Снять страйк» и «Разобрать жалобу» без причины не отправляются.

- [ ] Падающие тесты по действиям DESIGN-BRIEF §12 → реализовать на существующих
  примитивах админки → PASS → коммит `feat: admin reports and deal actions`.

## Бэкенд

Изменений нет. Если не хватает поля в ответе API — остановиться и описать
(изменение контракта — задача W3, не правка «по месту»).

## Документы и проверки

### Task 11

- [ ] `04-DESIGN-STATUS.md`: каждый экран со статусом и пометками `NEEDS-FIGMA`;
  `03-DESIGN-SYSTEM.md`: переключатель в `SettingsRow`, `StatusBadge`;
  `09`-флоу не трогать без решения (маршруты сделок — в `04`/flows doc, если он
  ведёт маршруты); `11-PROJECT-STATUS.md`: запись.
- [ ] Проверки: `typecheck`, `lint` `@bidplace/mobile`; mobile unit; e2e
  `commerce-lot`, `commerce-orders`, `work-header-motion`, `author-static-header`
  (Chromium и WebKit); `pnpm --filter @bidplace/mobile build:web`; скриншоты 390
  для каждого экрана из брифа в отчёт; `git diff --check`; `pnpm docs:link-check`.
- [ ] Коммит `docs: record commerce ui`.

## Промпт исполнителю

```text
Работай в /Users/yayauheny/projects/bidplace, ветка feature/commerce-ui от main.
Прочитай AGENTS.md, docs/launch/AGENT-RULES.md, docs/launch/COMMERCE.md,
docs/launch/DESIGN-BRIEF.md и целиком docs/launch/waves/W4-commerce-ui.md.
Скиллы: bidplace-ui, затем bidplace-ui-review; implement; superpowers
subagent-driven-development, test-driven-development. Figma — только чтение.
Task 1 → Task 11 по порядку, один коммит на задачу. Экрана нет в Figma и нет
решения основателя о сборке без макета — NEEDS-FIGMA, задачу остановить, идти
дальше. Отчёт по AGENT-RULES §6 со скриншотами 390.
```

## Промпт ревьюеру

```text
Прочитай docs/launch/AGENT-RULES.md §7, DESIGN-BRIEF.md и
docs/launch/waves/W4-commerce-ui.md. Ревью ветки feature/commerce-ui против main.
Скиллы: bidplace-ui-review, code-review-best-practices, security (кэш и контакты).
Сам прогони unit и e2e продаж, открой экраны на 390, сверь таблицы DESIGN-BRIEF
§1 и §6 с поведением. Вердикт по AGENT-RULES §7.
```

Инварианты:
- правила продаж не продублированы в клиенте: доступность кнопок — из ответа
  API (`blockedReason`, статусы, сроки), клиент только показывает;
- один источник ключей кэша, приватные ключи чистятся при выходе;
- одна функция денег, один хук времени на экран;
- новые общие компоненты — только `SettingsRow` toggle и `StatusBadge`.

Красные флаги: `setInterval` в компонентах карточек; `queryKey: ['…']` строкой в
фиче; локальные цвета/отступы вместо токенов; анимация `height`/`top`; запросы
за пределами опроса; тексты «выиграли», «оплата картой»; правки API-контрактов
в этой ветке.

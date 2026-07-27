# Отчёт по рефакторингу дизайн-слоя

Статус: **планирование по фактическому состоянию; исходный код не менялся**

Дата исследования: 2026-07-27
Базовый commit: `f2c7760` (`feature/modern-ui-docs`)

Этот отчёт преобразует текущий baseline из [`08-current-design-baseline-report.md`](./08-current-design-baseline-report.md) в выполнимую карту рефакторинга. Он не утверждает новый продуктовый flow, не разрешает замену библиотек и не меняет канонические дизайн-документы. Целевая визуальная система определена в [`00-project-decisions.md`](./00-project-decisions.md); бизнес-инварианты принадлежат [`../product/05-MVP-RFC.md`](../product/05-MVP-RFC.md) и [`../product/09-TRUST-AND-AUCTION-INTEGRITY.md`](../product/09-TRUST-AND-AUCTION-INTEGRITY.md).

## 1. Итог

Нужен поэтапный **view-layer refactor**, а не глобальная замена токенов и не перенос domain logic в новый UI-kit.

Текущий mobile-клиент содержит 14 route-файлов, 10 feature-экранов, 19 shared UI-компонентов и 4 компонента layout. Визуальная зависимость сосредоточена в четырёх узлах:

| Узел | Фактические потребители | Почему нельзя заменить сразу |
| --- | ---: | --- |
| `Screen` | 10 экранов | Владеет safe area, header, scroll и page padding. Глобальная смена одновременно меняет все роли и состояния. |
| `AppButton` | 9 feature-экранов | Одна реализация обслуживает ставку, OTP, seller submit, handoff и admin actions, но её `tone` смешивает их смысл. |
| `OperationalPanel` | 7 feature-экранов | Generic white-panel визуально противоречит target, однако сейчас группирует критические транзакционные блоки. |
| loading/error | 10+ экранов | Семантика recovery уже есть и должна пережить смену геометрии без ложного success. |

Выбранный путь — **долговечное решение:** сохранить Expo Router, React Query, API client, feature queries/mutations и guards; постепенно вводить public bidplace adapters поверх UI primitive; мигрировать route-by-route. Это безопаснее token-only restyle, который изменил бы старые панели, кнопки и nav во всех ролях до проверки пилота.

## 2. Что остаётся неприкосновенным

Визуальный рефакторинг не должен изменять следующие слои и файлы, кроме минимального подключения уже проверенного UI adapter:

| Слой | Владельцы | Инвариант |
| --- | --- | --- |
| Route и access control | `apps/mobile/src/app/**`, `components/shared/protected-route.tsx` | URL, роли public/buyer/seller/admin и redirect semantics остаются прежними. |
| Server state | `features/**`, `providers/api-provider.tsx`, `lib/query-*` | React Query keys, API projections, mutation/retry/invalidation не переезжают в presentational компоненты. |
| Bid и realtime | `features/products/product-screen.tsx`, `lib/use-listing-realtime.ts` | HTTP snapshot авторитетен; socket только инициирует refetch; OTP, idempotency и server rejection остаются без изменений. |
| Privacy и Order | `features/orders/order-screen.tsx`, `features/activity/activity-screen.tsx` | Контакты и Order projections показываются только сервером разрешённой роли; публичные alias не превращаются в identity. |
| Seller/admin permissions | `features/sellers/**`, `features/admin/admin-moderation-screen.tsx` | Locked product, `CHANGES_REQUESTED`, upload/reorder и destructive moderation не становятся client-side rules. |

Любая необходимость поменять эти правила — stop condition и отдельное product/security решение, а не часть дизайна.

## 3. Варианты и выбранная стратегия

| Вариант | Оценка | Решение |
| --- | --- | --- |
| Заменить текущие цвета, шрифты и radius в `packages/design-tokens` одним изменением | Hack: затронет все текущие экраны, но не решит Cormorant, panels, direct styles, navigation и missing states; rollback невозможен по экрану. | Не использовать. |
| Параллельно переписать весь `apps/mobile` на target stack | Acceptable workaround только для нового приложения; здесь создаст слишком большую поверхность регрессий для ставок, order и seller flows. | Не использовать. |
| Добавить target adapters, перенести ограниченный pilot, затем роль-за-ролью убрать legacy | Durable fix: сохраняет data/route contracts, даёт поэкранный rollback и выявляет web/native отличия до масштабирования. | Выбрано. |

## 4. Карта изменений по слоям

### 4.1 Foundation и bridge — первая волна

Эти файлы формируют единственную допустимую точку совместимости. Их нельзя удалять, пока хотя бы один legacy route импортирует Tamagui-компонент.

| Действие | Файлы | Изменение | Объём |
| --- | --- | --- | --- |
| Добавить target semantic token map рядом с current map | `packages/design-tokens/src/index.ts`, `apps/mobile/src/theme/tokens.ts` | Не перезаписывать текущие `colors`/`lightTheme`; экспортировать отдельные target semantic names через bridge. | 2 modified |
| Проверить и подключить font assets | `apps/mobile/package.json`, `apps/mobile/src/app/_layout.tsx`, `apps/mobile/tamagui.config.ts` | Только после ADR: PT Mono + Cyrillic/weight/web/native проверка. Cormorant и existing brand остаются до миграции всех callers. | 0–3 modified, gated |
| Сохранить provider boundary | `apps/mobile/src/providers/theme-provider.tsx`, `apps/mobile/src/providers/app-providers.tsx` | Новый primitive provider, если выбран, подключается рядом с Tamagui и только на bridge boundary. | 1–2 modified, gated |
| Создать public UI-kit | новая папка `apps/mobile/src/components/ui-kit/` | `AppText`, `AppIcon`, `MotionPressable`, button family, `AppImage`, `AppSheet`; route не импортирует новую библиотеку напрямую. | 6–10 new |
| Сохранить legacy exports | `apps/mobile/src/components/ui/index.ts`, `AppButton.tsx`, `AppSheet.tsx`, `AppCard.tsx` | Временный адаптер/compatibility export, отмеченный владельцем и сроком удаления. | 3–5 modified |

Dependency decision (NativeWind/RN Primitives/Reusables/Gorhom/Lucide) пока **не подтверждён manifest**: в `apps/mobile/package.json` установлены Tamagui 2.4.5, Reanimated 4.5.0, Gesture Handler и Expo Image, но target-only зависимости отсутствуют. До точных Expo 57-compatible версий и ADR foundation нельзя начинать.

### 4.2 Пилот — единственный допустимый первый перенос экранов

| Pilot slice | Изменить | Создать/адаптировать | Оставить без изменения | Причина |
| --- | --- | --- | --- | --- |
| Catalog `/` | `features/products/product-list-screen.tsx`, `components/ui/ProductCard.tsx` | `AuctionCard`, `AppImage`, loading-card geometry | query approved Products, route/link, error/empty/retry | Ограниченный list surface; проверяет image rail, grid и card semantics. |
| Product `/product/[publicId]` | `features/products/product-screen.tsx` | `ProductGallery`, `AuctionSummary`, `BidButton`, `ContentTabs`, `BottomActionBar`, reconnect/stale presentation | `useListingRealtime`, 3 queries, bid mutation, `EmailRulesGate`, aliases and Order link | Самый рискованный, но единственный способ проверить target hierarchy против auction truth. |
| Seller Product create/edit | `features/sellers/product-draft-screen.tsx` | `SellerProductForm`, `AppImage` upload/reorder view, staged field layout | categories/products queries, save/submit/upload/delete/reorder mutations and server lock | Проверяет forms, keyboard, permission and media states, не меняя policy. |

Минимальный pilot затрагивает **5–7 существующих UI/feature файлов плюс 6–10 новых adapters/domain components**. `Screen` и `AppHeader` следует менять только через opt-in pilot shell prop или новый `ModernScreen` adapter; их глобальная замена запрещена в этой волне.

### 4.3 Последующие волны

| Волна | Existing files в основном | Ожидаемый объём | Предусловие |
| --- | --- | --- | --- |
| Buyer | `activity-screen.tsx`, `order-screen.tsx`, `features/auth/*`, `components/ui/{DetailList,StatusBadge,FormField,ControlledAppInput}.tsx` | 6–10 modified, 2–4 new | Pilot pass; отдельная privacy/OTP/retry matrix. |
| Seller | `seller-profile-screen.tsx`, `listing-draft-screen.tsx`, related image/form components | 4–7 modified, 1–3 new | Product form pilot pass; device keyboard/upload QA. |
| Navigation | `components/layout/{AppHeader,DesktopNavigation,MobileNavigationDrawer,BrandLogo}.tsx`, `Screen.tsx` | 5 modified, 2–3 new | Явное решение о mobile destinations, desktop equivalent и icon family. |
| Admin | `admin-moderation-screen.tsx`, confirmation/dialog adapters | 1–3 modified, 1–2 new | AppDialog proof; destructive-action and narrow-screen QA. |
| Legacy removal | `tamagui.config.ts`, `providers/theme-provider.tsx`, all remaining direct Tamagui callers, manifest | 30+ callers across app/component/features | Только когда `rg "from 'tamagui'" apps/mobile/src` не вернёт production callers и все платформы пройдут acceptance. |

## 5. Точные технические точки рефакторинга

### Retain as behaviour owners

- `features/products/product-screen.tsx` — сначала отделить view sections от current queries/mutations; не извлекать bid rules или realtime в UI-kit.
- `features/sellers/product-draft-screen.tsx` — form state и media mutations остаются feature-level; новый `SellerProductForm` получает values, handlers, errors и read-only state.
- `features/orders/order-screen.tsx` и `features/activity/activity-screen.tsx` — role-dependent projection остаётся в screen/feature layer, а не в `CompactAuctionRow` или panel.
- `components/shared/protected-route.tsx` — не заменять визуальным navigation guard.

### Adapt behind an adapter

- `AppInput` + `FormField` + `ControlledAppInput`: сохранить label/hint/error binding и RHF contract; сменить только target field geometry/typography.
- `AppSheet`: current Tamagui sheet остаётся fallback, пока новый adapter не докажет focus trap, Escape, dismissal, safe-area и native/web parity.
- `LoadingState`, `EmptyState`, `ErrorState`: оставить recovery semantics и retry; добавить skeleton/media geometry на уровне domain screen.
- `StatusBadge`: разделить semantic status text от нынешнего pill chrome; не полагаться на color.
- `BrandLogo`: сохранить единственный brand boundary, не создавать wordmark в route.

### Replace in pilot or after it

- `ProductCard` → `AuctionCard`: единственный нынешний consumer — catalog, поэтому bounded replacement безопасен после сохранения link/image/title/price/status/deadline.
- Cormorant usage (`fontFamilies.serif*`, `BrandLogo`, navigation, Product/list titles) → target typography roles только с verified PT Mono and brand decision.
- `OperationalPanel`/`Surface`: не удалять глобально. Для Product разложить editorial sections с divider/space; для forms and admin оставить функциональные surfaces там, где это помогает scanability и error recovery.
- `AppButton`/`PrimaryButton` alias: разделить public semantic API на `PrimaryButton`, `SecondaryButton`, `TextButton`, destructive-confirm action; не переносить старый `tone` как target API.

## 6. Риски и обязательная проверка

| Риск | Защита / acceptance |
| --- | --- |
| Bid data исчезает из first viewport или tab | Product screenshot/functional check: current bid, minimum next bid, server deadline/status и CTA видны до tabs. |
| Reconnect/offline выглядит как success | Сохраняется `useListingRealtime` refetch; явные stale/reconnect copy; rejected bid не меняет success UI. |
| OTP и idempotency ломаются визуальным переносом | Existing Chromium flow плюс manual double-submit, stale-minimum и retry check на target detail. |
| Contact leaks in compact UI | Buyer/seller/admin/outsider Order visual tests; reusable row never получает raw contacts. |
| Seller lock или upload state потеряны | Draft/edit check for locked state, `CHANGES_REQUESTED`, picker denial, upload failure, delete/reorder error. |
| Cross-platform divergence | iOS Safari, Android Chrome, macOS Safari/Chrome, Windows Chrome; keyboard, screen reader, reduced motion, long Russian text. |
| Target dependency destabilises Expo 57 | Exact production version, official compatibility evidence, isolated adapter proof, build/typecheck before any route migration. |

Stop and rollback to the last verified pilot commit if routing, authorization, public/private projection, bid correctness, form submit, accessibility, or platform build regresses. The old screen/component stays available until its replacement passes the matrix.

## 7. Реалистичный объём и порядок работ

| Этап | Состав | Примерный change set | Не является частью этапа |
| --- | --- | ---: | --- |
| Gate | ADR, assets, version evidence, screenshot matrix | documentation + no source change | package install, route redesign |
| Foundation | bridges and 6–10 public adapters | 6–12 files | массовая смена tokens/screens |
| Pilot | Catalog, Product, Seller Product form | 11–17 files | Activity, Order, admin, nav migration |
| Role waves | buyer → seller → nav → admin | 16–28 files | Tamagui removal |
| Retirement | remove all remaining legacy imports/config | 30+ callers | until all verification passes |

Итого, полный переход — ориентировочно **35–55 source files, 12–20 новых adapter/domain components и несколько отдельных verification tasks**, а не одно изменение темы. Пересчитать estimate следует после решения по dependencies, font assets и navigation; сейчас эти три решения являются критическим path.

## 8. Ready-to-start checklist

- [ ] Назначены owner и ADR для exact target dependencies и Expo 57 compatibility.
- [ ] PT Mono, final wordmark/compact mark и Cyrillic web/native loading подтверждены.
- [ ] Утверждены mobile destinations, desktop equivalent и accessible icon vocabulary.
- [ ] Зафиксирована baseline screenshot/accessibility matrix на четырёх browser/device contexts.
- [ ] Для pilot описаны loading, empty, error, offline/reconnect, long-content, keyboard и screen-reader states.
- [ ] Есть отдельные acceptance checks для bid/OTP/realtime, Order privacy, seller locks/uploads.
- [ ] Первый implementation PR ограничен foundation или одним pilot slice, а не глобальным token change.

После выполнения этих условий начать с foundation bridge, затем с Catalog. Product detail переносить только после того, как button/image/sheet/font adapters доказаны на web и native.

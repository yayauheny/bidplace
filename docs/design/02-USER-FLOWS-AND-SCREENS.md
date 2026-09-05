# bidplace — пользовательские потоки и экраны

Последнее обновление: 2026-09-05

Статус: **Runtime scope implemented; matched Pen overlay and founder/device acceptance pending**

## 1. Граница текущего редизайна

Pen v2 задаёт публичный web-модуль: Global Header, Home, Browse Works, Browse
Authors, Product tabs, AuctionPlayer и Creator Profile. Остальные работающие
routes сохраняют поведение и должны пережить смену общего shell, но не имеют
нового утверждённого визуального target в текущем Pen-реестре.

## 2. Карта экранов

| Экран              | Pen node | Route                 | Contract status                                            |
| ------------------ | -------- | --------------------- | ---------------------------------------------------------- |
| Global Header      | `L9UV9`  | общий shell           | role-aware shell and account/discovery overlays implemented; visual gate pending |
| Home               | `BJd1P`  | `/`                   | `/api/discovery/home` supplies top, creators and new works; visual gate pending |
| Browse Works       | `H5vf2`  | `/works`              | server-backed search, sort, status, category, author, material, price and uniqueness |
| Browse Authors     | `N4ebBk` | `/authors`            | approved seller directory API, route, photos and discipline |
| Product / About    | `L7ytbv` | `/product/[publicId]` | public product hero, facts, related works and AuctionPlayer |
| Product / Creation | `cK8kD`  | тот же Product route  | ordered ProductCreationStep data and safe process media |
| Product / Bids     | `XIzHe`  | тот же Product route  | participant alias/bid/time with Listing-scoped privacy |
| Creator Profile    | `MqUMz`  | `/seller/[slug]`      | `MVP v1` creator profile; structured public links only |

Решение о `/`, `/works`, `/authors`, `/search?q=...` и server-authoritative
discovery contracts зафиксировано в `DEC-065`. Pen по-прежнему управляет
композицией, а product/API boundaries — данными, видимостью и permissions.

## 3. Global Header и роли

Canonical header: `L9UV9`.

| Роль   | Pen evidence | Обязательное поведение                                                |
| ------ | ------------ | --------------------------------------------------------------------- |
| Guest  | `H4bCnh`     | public discovery + login/register actions                             |
| Buyer  | `GEnsG`      | public discovery + доступные buyer actions                            |
| Seller | `S5B4C2`     | buyer/public actions + seller capability routes только при разрешении |
| Admin  | `kilAz`      | catalog/moderation; без bidding и buyer activity                      |

Discovery group `SYE9r`, Search `VKsEM`, user actions `AG6gK`, search bar
`Uulvx`, navigation `BF8Nr`, menu trigger `MsOKe`, menu `SHHWu`, Works item
`B0EaXH`, Authors item `VUDwA`, actions `hLoyZ`.

Search и Authors используют поддержанные API contracts; client-only matching и
ranking не допускаются. Back/forward restoration и URL-backed discovery state
реализованы; fixed-scale overlay и physical-device acceptance остаются внешним
release gate.

## 4. Discovery flow

Целевой путь: discovery entry → Works/Authors → карточка → Product или Creator
Profile → связанная работа.

### Home `BJd1P`

Секции: header `CV9fF`, Works intro `t0SBW8`, section `mGtKx`, auction card
`WxEOg`, creator card `b8iVxg`, editorial work card `b60Eaa`.

Top/New и набор creators приходят из отдельного `/api/discovery/home`; экран
остаётся Partial до matched responsive screenshots и проверки всех состояний.

### Browse Works `H5vf2`

Header `WT8GE`, title `MO2OC`, toolbar `Evfb1`, grid `nWd4G`. Controls:
primary tabs `Jefsy`, auction tabs `g7INs`, state chip `yFl4g`, sort `s2ARGu`.

Сохраняются текущие public visibility, states `SCHEDULED`/`LIVE`/`ENDED`,
pagination и API contract. Реализованы server-backed search, sort, category,
author, material, price, status и uniqueness controls. Pen `Тип работы`
намеренно скрыт до появления подтверждённого domain field.

AuctionCard media масштабируется только внутри clipped viewport; toolbar menu
открывается с shared panel motion. Hover/focus/open states определены в `03` и
обязательны, хотя static screen показывает только отдельные snapshots.

### Browse Authors `N4ebBk`

Header `FnXJy`, Works/Authors navigation `LuxiL`, title `wiPHC`, controls
`usLfn`, grid `O8lu9`. Используется CreatorCard `SrXPq` с photo `k9hN07`, name
`atoev`, discipline `sUQFf`.

Bio variant `S1BHg` и comparison board `BvSRz` не являются production target.
Никаких ratings, sales, followers, verified, awards или ranking.

## 5. Product flow

Один route `/product/[publicId]` использует общую рамку, ProductTabs `Jh9jr` и
AuctionPlayer `X6Ksg`.

- About `L7ytbv`: integrated header/hero `iSDm7`, tabs `TrdWx`, content
  `QSHsB`.
- Creation `cK8kD`: tabs `a6wx43`, story `kuP8Q`, sticky player `i1AJd`.
- Bids `XIzHe`: tabs `BNobs`, history `Ko0lA`, sticky player `BOdiT`.
- Tabs: About `CBb5S`, Creation `bzabH`, Bids `ryIwP`, underline `KSVlN`.
- Player: bid `w8O9kE`, time `k7l1d`, action `xozqk`.

Bid history показывает только participant alias, bid amount и time. Wallet,
NFT, blockchain, identity leakage и новые financial fields запрещены.

Tabs могут быть URL state или локальным accessible state только после фиксации
deep-link/back behavior. Bid action сохраняет confirmation, OTP/rules gate,
canonical refetch и server error handling.

Hero может использовать artwork-derived blurred atmosphere по `03`, но sharp
artwork, readable transaction data и единственный AuctionPlayer всегда выше
декоративного слоя. Tab и inline→sticky transitions не размножают state.

## 6. Creator Profile `MqUMz`

Header `P7BDB`, creator hero `aAJ8B`, works `NFpuI`; карточки работ переиспользуют
AuctionCard `k5vYGf`. Это публичная авторская страница, не seller dashboard.

Creator hero использует restrained atmosphere только при наличии real public
photo/artwork; grid cards наследуют тот же media-hover contract, что Browse.

Показываются только разрешённые публичные данные. Structured Telegram,
Instagram и website links отображаются только из public contract. Private
handoff contact никогда не появляется здесь.

## 7. Остальные routes

Auth, Activity, Order, seller Orders inbox, seller application/profile, Product/Listing draft и
admin moderation остаются функционально обязательными. Admin moderation включает
Authors/Works/Orders plus **Пользователи** (ban/revoke) and **Восстановление**
(needs-order queue, emergency cancel). Смена Global Header или
tokens не должна делать их недоступными. Их визуальная миграция требует
отдельных Pen targets или явного правила наследования новой системы.

### Seller Orders inbox

`/orders` lists the current seller's non-cancelled deals from `GET /api/orders`.
Cards show frozen snapshot title, amount/currency, contact deadline and buyer
email, then open `/order/[publicId]`. Loading, empty, error/retry and
"Загрузить ещё" pagination are required. Current-style UI, not a Pen target.

### Seller product draft

`/products/new` and `/products/[id]` hydrate from owner detail.
`REJECTED` and `CHANGES_REQUESTED` reopen the same form with the latest
moderation reason and resubmit the same Product. `PENDING_REVIEW` and
`APPROVED` stay locked. Public visibility remains false until a later
`APPROVED`.

### Auth (mobile)

| Экран | Route | Поведение |
| ----- | ----- | --------- |
| Sign in | `/login` | email/password; ссылка «Забыли пароль?» → forgot |
| Register | `/register` | email/password registration |
| Forgot password | `/forgot-password` | email submit; always neutral success |
| Reset password | `/reset-password?token=` | new password + confirm; invalid/expired token → recoverable error |

После успешного reset пользователь возвращается на `/login`. Deep link token
парсится из query string; expired/replay token показывает localized error state.
Login → forgot сохраняет `redirectTo` query param через auth routes.

## 8. Обязательные состояния каждого реализуемого экрана

- default и realistic long content;
- loading/skeleton;
- empty;
- recoverable error + retry;
- missing/failed media;
- disabled/permission denied;
- keyboard focus, hover, pressed и validation;
- guest и релевантные authenticated roles;
- 1440 desktop, 1024 tablet и 390 mobile;
- zoom/text scaling и reduced motion.

Статус `Implemented` запрещён, пока состояния и responsive behavior не
проверены.

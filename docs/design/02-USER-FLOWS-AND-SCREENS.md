# bidplace — пользовательские потоки и экраны

Последнее обновление: 2026-08-10

Статус: **Target mapped; route and data gaps remain**

## 1. Граница текущего редизайна

Pen v2 задаёт публичный web-модуль: Global Header, Home, Browse Works, Browse
Authors, Product tabs, AuctionPlayer и Creator Profile. Остальные работающие
routes сохраняют поведение и должны пережить смену общего shell, но не имеют
нового утверждённого визуального target в текущем Pen-реестре.

## 2. Карта экранов

| Экран              | Pen node | Route                 | Contract status                                            |
| ------------------ | -------- | --------------------- | ---------------------------------------------------------- |
| Global Header      | `L9UV9`  | общий shell           | role logic существует; новый shell не реализован           |
| Home               | `BJd1P`  | не решён              | нужен отдельный IA/data decision                           |
| Browse Works       | `H5vf2`  | текущий `/`           | каталог существует; search/filter/sort не поддержаны       |
| Browse Authors     | `N4ebBk` | отсутствует           | directory route и list API отсутствуют                     |
| Product / About    | `L7ytbv` | `/product/[publicId]` | основной public contract существует                        |
| Product / Creation | `cK8kD`  | тот же Product route  | dedicated process model не подтверждён                     |
| Product / Bids     | `XIzHe`  | тот же Product route  | participant/bid/time доступны в текущем contract           |
| Creator Profile    | `MqUMz`  | `/seller/[slug]`      | basic public profile существует; links ограничены contract |

Нельзя назначать Home или Authors маршрут, менять `/` или добавлять API только
на основании макета. Это отдельные продуктовые/архитектурные решения.

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

Search и Authors могут появиться как enabled controls только после появления
поддержанного route/API contract. До этого нужно согласовать честное состояние,
а не подключать client-only псевдопоиск.

## 4. Discovery flow

Целевой путь: discovery entry → Works/Authors → карточка → Product или Creator
Profile → связанная работа.

### Home `BJd1P`

Секции: header `CV9fF`, Works intro `t0SBW8`, section `mGtKx`, auction card
`WxEOg`, creator card `b8iVxg`, editorial work card `b60Eaa`.

Открытые решения: route, критерии Top/New, набор authors, pagination/carousel и
источники данных. Пока решения нет, Home — visual target, не implementation
scope.

### Browse Works `H5vf2`

Header `WT8GE`, title `MO2OC`, toolbar `Evfb1`, grid `nWd4G`. Controls:
primary tabs `Jefsy`, auction tabs `g7INs`, state chip `yFl4g`, sort `s2ARGu`.

Сохраняются текущие public visibility, states `SCHEDULED`/`LIVE`/`ENDED`,
pagination и API contract. Неподдержанные search, filters и sorting остаются
blocked до отдельного решения.

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

Показываются только разрешённые публичные данные. Текущий contract имеет один
`socialLink`; три независимых social links из визуального target не реализуются
до изменения contract. Private handoff contact никогда не появляется здесь.

## 7. Остальные routes

Auth, Activity, Order, seller application/profile, Product/Listing draft и
admin moderation остаются функционально обязательными. Смена Global Header или
tokens не должна делать их недоступными. Их визуальная миграция требует
отдельных Pen targets или явного правила наследования новой системы.

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

# bidplace — статус дизайна и UI-реализации

Последнее обновление: 2026-08-11

Общий статус: **Pen v2 public discovery implementation is Partial; automated type/lint/unit checks pass, while founder/device acceptance and metadata completion remain pending**

## Текущий результат

- `Implemented`: структура `docs/design/00`–`07` пересобрана с чистого листа
  вокруг нового Pen v2 направления.
- `Implemented`: старая design system в `docs/modern-ui/` выведена из проекта;
  её visual rules и cutover plan больше не действуют.
- `Implemented`: точная локальная копия восстановлена по canonical path; SHA-256
  `03798831d76992080d4edebf53c4c264f8f9754e01bbe81965083f271148d2a9`.
- `Implemented`: canonical baseline принят commit `f7450e4`; после него любой
  `.pen` diff запрещён.
- `Confirmed`: `design/pen/bidplace-web-v2.pen` — защищённый визуальный эталон,
  который нельзя менять или удалять во время code work.
- `Verified`: canvas читается в Pen, canonical nodes экспортированы read-only;
  публичная копия доступна по founder-provided Pen URL.
- `Implemented`: reference hierarchy и motion/blur/hover specification внесены
  в `01`, `03`, `05`, `06` и основной аудит `07`.
- `Partial`: production UI перенесён на Pen v2 foundation, header, Browse
  Works, Home, Authors, Search, Product/Auction, Creator Profile, auth, seller
  editors и supporting routes. Discovery data is server-authoritative, but
  visual/device acceptance and remaining metadata are open.
- `Verified`: 1440/1024/390 runtime compositions, Onest/Inter loading,
  responsive overflow, Product URL/back tabs, related public works, focused E2E
  and production Expo exports.
- `Verified`: post-implementation API/security audit aligned public Product,
  Bid history, realtime and image visibility; aggregate image limits are
  transactional and bidder aliases are Listing-scoped.
- `Partial`: route/IA для Home, Browse Authors и Search, contracts для
  search/filter/sort/author directory, header/account popover and shared
  controls. Creation story and structured socials are now implemented in the
  API; screen composition and visual acceptance remain open.
- `Implemented`: desktop account popover keyboard-open now moves focus into the
  portaled menu, with Escape returning focus to the trigger; the current header
  follows `Аукционы` / `Авторы` / `Создать` / profile-menu IA. Full browser
  execution still needs matched Pen screenshots and device verification.
- `Implemented`: Browse Works now consumes server facets for category/material
  menus, status counts and state tabs, and server-side sort/query state is
  URL-backed. Browse Authors now exposes the API-backed activity/name sort
  control. The exact 1440 composition and 1024/390 derived states remain
  pending screenshot and device acceptance.
- `Implemented`: Product hero now composes the Pen three-column identity,
  artwork and object-facts regions where viewport pressure permits; the shared
  AuctionPlayer is the measured compact inline/sticky transaction bar, while
  the existing bid form and server mutation remain the single state owner.
  Product Creation now renders ordered creation intro/steps and process media;
  product screenshot and responsive acceptance remain pending.

## Screen matrix

| Target           | Pen      | Visual spec       | Data/route             | Code        | Acceptance |
| ---------------- | -------- | ----------------- | ---------------------- | ----------- | ---------- |
| Global Header    | `L9UV9`  | measured baseline | role logic and overlays exist | partial | pending visual QA |
| Home             | `BJd1P`  | exported/readable | `/api/discovery/home` | partial | pending responsive QA |
| Browse Works     | `H5vf2`  | exported/readable | server query + controls | partial | pending responsive QA |
| Browse Authors   | `N4ebBk` | exported/readable | approved author list API + discipline | partial | pending visual QA |
| Product About    | `L7ytbv` | exported/readable | compatible contract    | implemented | verified   |
| Product Creation | `cK8kD`  | exported/readable | existing fields only   | implemented | verified   |
| Product Bids     | `XIzHe`  | exported/readable | compatible core fields | implemented | verified   |
| Creator Profile  | `MqUMz`  | exported/readable | current public links   | partial | pending visual/data QA |

## Shared component matrix

| Component     | Pen      | Runtime status                                               |
| ------------- | -------- | ------------------------------------------------------------ |
| GlobalHeader  | `L9UV9`  | implemented horizontal responsive header                     |
| AuctionCard   | `k5vYGf` | implemented shared card with media hover and responsive grid |
| CreatorCard   | `SrXPq`  | reusable production component uses public discipline; visual acceptance remains |
| AuctionPlayer | `X6Ksg`  | implemented controlled transaction component                 |
| ProductTabs   | `Jh9jr`  | implemented keyboard tabs with deep-link/back history        |

## Legacy production state

Current Expo UI uses one `designTokens` contract and one `components/ui` layer.
Auth, auction, role, privacy, moderation, media recovery and route behavior
remain protected by tests; runtime code does not replace Pen as visual authority.

## Remaining release gates

1. Keep zero `.pen` diff and verify the canonical checksum after every UI stage.
2. Complete discipline, structured social and creation-story data contracts;
   verify Home/Authors/Search/filter/sort states at 1440/1024/390.
3. Complete founder visual review and physical iOS/Android smoke acceptance.

## Definition of complete

A screen can become code-level `Implemented` only after comparison at
1440/1024/390, loading/empty/error/media states, keyboard/accessibility checks
and affected typecheck/lint/tests/build. Release-level `Accepted` additionally
requires founder/designer and physical-device approval. Documentation-only
mapping or a desktop screenshot is insufficient.

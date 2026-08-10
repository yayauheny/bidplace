# bidplace — статус дизайна и UI-реализации

Последнее обновление: 2026-08-10

Общий статус: **Pen v2 runtime migration implemented; final full-suite QA in progress**

## Текущий результат

- `Implemented`: структура `docs/design/00`–`07` пересобрана с чистого листа
  вокруг нового Pen v2 направления.
- `Implemented`: старая design system в `docs/modern-ui/` выведена из проекта;
  её visual rules и cutover plan больше не действуют.
- `Implemented`: точная локальная копия восстановлена по canonical path; SHA-256
  `bdb29835e0fc9c431deaf632992362a291fd6b6922a8e858553aea3822bd9b76`.
- `Implemented`: canonical baseline принят commit `ef5b7c2`; после него любой
  `.pen` diff запрещён.
- `Confirmed`: `design/pen/bidplace-web-v2.pen` — защищённый визуальный эталон,
  который нельзя менять или удалять во время code work.
- `Verified`: canvas читается в Pen, canonical nodes экспортированы read-only;
  публичная копия доступна по founder-provided Pen URL.
- `Implemented`: reference hierarchy и motion/blur/hover specification внесены
  в `01`, `03`, `05`, `06` и основной аудит `07`.
- `Implemented`: production UI перенесён на Pen v2 foundation, header, Browse
  Works, Product/Auction, Creator Profile, auth, seller editors и supporting
  routes.
- `Verified`: 1440/1024/390 runtime compositions, Onest/Inter loading,
  responsive overflow, focused E2E and production Expo exports.
- `Needs decision`: route/IA для Home и Browse Authors, а также contracts для
  search/filter/sort/author directory и creation story.

## Screen matrix

| Target           | Pen      | Visual spec       | Data/route             | Code        | Acceptance |
| ---------------- | -------- | ----------------- | ---------------------- | ----------- | ---------- |
| Global Header    | `L9UV9`  | measured baseline | role logic exists      | implemented | verified   |
| Home             | `BJd1P`  | exported/readable | blocked by IA/data     | none        | not run    |
| Browse Works     | `H5vf2`  | exported/readable | compatible contract    | implemented | verified   |
| Browse Authors   | `N4ebBk` | exported/readable | route/API absent       | none        | not run    |
| Product About    | `L7ytbv` | exported/readable | compatible contract    | implemented | verified   |
| Product Creation | `cK8kD`  | exported/readable | existing fields only   | implemented | verified   |
| Product Bids     | `XIzHe`  | exported/readable | compatible core fields | implemented | verified   |
| Creator Profile  | `MqUMz`  | exported/readable | current public links   | implemented | verified   |

## Shared component matrix

| Component     | Pen      | Runtime status                                               |
| ------------- | -------- | ------------------------------------------------------------ |
| GlobalHeader  | `L9UV9`  | implemented horizontal responsive header                     |
| AuctionCard   | `k5vYGf` | implemented shared card with media hover and responsive grid |
| CreatorCard   | `SrXPq`  | not implemented as reusable production component             |
| AuctionPlayer | `X6Ksg`  | implemented controlled transaction component                 |
| ProductTabs   | `Jh9jr`  | implemented accessible keyboard tabs                         |

## Legacy production state

Current Expo UI uses one `designTokens` contract and one `components/ui` layer.
Auth, auction, role, privacy, moderation, media recovery and route behavior
remain protected by tests; runtime code does not replace Pen as visual authority.

## Remaining release gates

1. Keep zero `.pen` diff and verify the canonical checksum after every UI stage.
2. Resolve Home/Browse Authors/search/filter/sort data and route decisions before
   implementing those blocked surfaces.
3. Complete full-suite regression QA and founder/device visual acceptance.

## Definition of complete

A screen can become `Implemented` only after visual comparison at 1440/1024/390,
loading/empty/error/media states, keyboard/accessibility checks, affected
typecheck/lint/tests/build and founder/designer acceptance. Documentation-only
mapping or a desktop screenshot is insufficient.

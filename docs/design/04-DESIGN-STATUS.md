# bidplace — статус дизайна и UI-реализации

Последнее обновление: 2026-08-10

Общий статус: **Canonical Pen restored and verified read-only; implementation not started**

## Текущий результат

- `Implemented`: структура `docs/design/00`–`07` пересобрана с чистого листа
  вокруг нового Pen v2 направления.
- `Implemented`: старая design system в `docs/modern-ui/` выведена из проекта;
  её visual rules и cutover plan больше не действуют.
- `Implemented`: точная локальная копия восстановлена по canonical path; SHA-256
  `bdb29835e0fc9c431deaf632992362a291fd6b6922a8e858553aea3822bd9b76`.
- `Needs baseline commit`: восстановленный canonical file сейчас является
  намеренным одноразовым repository addition. До code implementation его и
  документацию нужно принять как baseline; после этого любой `.pen` diff
  запрещён.
- `Confirmed`: `design/pen/bidplace-web-v2.pen` — защищённый визуальный эталон,
  который нельзя менять или удалять во время code work.
- `Verified`: canvas читается в Pen, canonical nodes экспортированы read-only;
  публичная копия доступна по founder-provided Pen URL.
- `Implemented`: reference hierarchy и motion/blur/hover specification внесены
  в `01`, `03`, `05`, `06` и основной аудит `07`.
- `Not implemented`: production UI пока не перенесён на Pen v2.
- `Needs verification`: точные 1024/390 compositions, runtime font loading,
  advanced instance integrity и renderer screenshot comparison ещё не закрыты.
- `Needs decision`: route/IA для Home и Browse Authors, а также contracts для
  search/filter/sort/author directory и creation story.

## Screen matrix

| Target           | Pen      | Visual spec       | Data/route             | Code           | Acceptance |
| ---------------- | -------- | ----------------- | ---------------------- | -------------- | ---------- |
| Global Header    | `L9UV9`  | measured baseline | role logic exists      | legacy shell   | not run    |
| Home             | `BJd1P`  | exported/readable | blocked by IA/data     | none           | not run    |
| Browse Works     | `H5vf2`  | exported/readable | partial contract       | legacy `/`     | not run    |
| Browse Authors   | `N4ebBk` | exported/readable | route/API absent       | none           | not run    |
| Product About    | `L7ytbv` | exported/readable | mostly available       | legacy screen  | not run    |
| Product Creation | `cK8kD`  | exported/readable | process model gap      | legacy content | not run    |
| Product Bids     | `XIzHe`  | exported/readable | compatible core fields | legacy history | not run    |
| Creator Profile  | `MqUMz`  | exported/readable | partial public links   | legacy screen  | not run    |

## Shared component matrix

| Component     | Pen      | Runtime status                                                    |
| ------------- | -------- | ----------------------------------------------------------------- |
| GlobalHeader  | `L9UV9`  | not implemented; current shell uses desktop rail                  |
| AuctionCard   | `k5vYGf` | behavior exists; anatomy/style requires refactor                  |
| CreatorCard   | `SrXPq`  | not implemented as reusable production component                  |
| AuctionPlayer | `X6Ksg`  | behavior exists across current product UI; requires consolidation |
| ProductTabs   | `Jh9jr`  | target not implemented                                            |

## Legacy production state

Current Expo UI remains the functional baseline. Its auth, auction, role,
privacy, moderation, media recovery and route behavior must not regress. Names
such as `modernTokens` or `components/modern-ui` do not grant visual authority;
they identify migration targets.

## Gates before implementation

1. Commit/accept the restored canonical baseline, then require zero `.pen` diff.
2. Finish exact node/instance measurements and approve 1024/390 derivations.
3. Verify Onest/Inter runtime assets, weights, Cyrillic and fallback metrics.
4. Decide unresolved route/data conflicts or remove blocked controls from the
   implementation scope without changing Pen.
5. Export fixed-scale acceptance screenshots and fixtures.
6. Start code work in the order defined by `07`.

## Definition of complete

A screen can become `Implemented` only after visual comparison at 1440/1024/390,
loading/empty/error/media states, keyboard/accessibility checks, affected
typecheck/lint/tests/build and founder/designer acceptance. Documentation-only
mapping or a desktop screenshot is insufficient.

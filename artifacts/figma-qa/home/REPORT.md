# Home — opening of the week and Figma composition

Date: 2026-09-13  
Stand: Expo web `:8091` against `GET /api/portfolio/home` via Playwright
`page.route` (contract-correct bodies; seed/DB unchanged).  
Figma inspect: `uMo04w9bgrchWXXDgO4W62` first fold `439:4404` (390×860) and
long frame `436:1137` (390×3372). References:
`figma-439-4404-first-fold.png`, `figma-436-1137-long.png`.

Runtime first-fold and full-page use the same selected payload. Inner
`ScrollView` is expanded for full-page capture because document `fullPage`
stays at the 390 column viewport.

## Status

| Claim | Status | Evidence |
|---|---|---|
| «Открытие недели» from `curatorSelection` only | Implemented | `home-sections.ts`, selected/null e2e |
| Omit block when selection is null / unavailable | Implemented | null screenshots; hidden/rejected never leave the API as a Work DTO |
| No newest/random/hardcoded fallback | Implemented | `home-sections.spec.ts` |
| Portfolio opening rhythm (image, author, peeking card, real routes) | Implemented | first-fold + DOM table below |
| «Новые работы» from `WorkCoverCard` 366×488 / 20 | Implemented | `436:1274` list geometry, not fan `436:1320` |
| «Новые авторы» or `/authors` CTA after works | Implemented | RFC §5; not Figma parity |
| No prices, timers, badges, auctions, cart | Implemented | selected screenshots; dock 232×64 |
| Native iOS/Android | Not implemented | outside this gate |

## Screenshots

| File | Viewport | What |
|---|---|---|
| `home-selected-390-first-fold.png` | 390×844 | selected, scroll 0 |
| `home-selected-390-full.png` | 390×1911 | same data, full column |
| `home-null-390-first-fold.png` | 390×844 | `curatorSelection: null` |
| `home-null-390-full.png` | 390×1470 | same null payload |
| `home-works-empty-390.png` | 390×1270 | opening + authors, no works |
| `home-authors-empty-390.png` | 390×844 | works + «Все авторы» |
| `home-loading-390.png` | 390×844 | `Загружаем bidplace…` |
| `home-error-390.png` | 390×844 | error + «Повторить» |
| `home-broken-media-390.png` | 390×1911 | selected image 404 fallback |
| `home-long-copy-390.png` | 390×1911 | long title / slug / bio |
| `home-reduced-motion-390.png` | 390×844 | `prefers-reduced-motion` |
| `home-zoom-200-390.png` | 390×1420 | `zoom: 2`, no horizontal overflow |
| `home-selected-390-860.png` | 390×860 | first-fold height match |
| `home-selected-390-844-column.png` | 390×844 | phone column |
| `home-selected-1024.png` | 1024×768 | centered 390 column |
| `home-selected-1440.png` | 1440×900 | centered 390 column |

## DOM vs Figma (`439:4404` / `436:1137`)

From `measurements.json` (selected, 390×844, boxes relative to
`app-shell-content` except shell/dock):

| Element | Figma | Runtime |
|---|---|---|
| Opening block | `439:4406` 390×401 at (0, 132) | `#home-opening` 366×401 at (12, 132); rail bleeds with `-pageGutter` |
| «Открытие недели» | 24/29 at (12, 132), text box 205×29 | `sectionTitle` 24/29 −0.72 at (12, 132), 366×29 |
| Author column | 280×324 at (12, 181) | 280×134 at (12, 181) |
| Avatar | 54×54 | 54×54 |
| Handle | 22/25 medium `@vex` | `authorName` 22/24 semibold `@slug` |
| Bio | Figma `#6F6F6F` 17 px line | `bodySmall` / `textMuted` `#8A8A8A`, one line |
| Editorial «Выбор куратора» + blurb | 280×182 | absent — not in `portfolioHomeResponse` |
| «Смотреть профиль» | 149×34 at author y 290 | existing muted `FigmaButton` (~44 px) under the identity row |
| Selected work card | 264×352 at (304, 181) | 264×352 at (304, 181) |
| Extra rail cards | four 264 cards, gap 12 | one server-owned Work only |
| Next section | «Активные торги» at y 600 (gap 67) | «Новые работы» at y 573 (gap 40 = `space.x10`) |
| Work cards | `436:1274` 366×488, gap 20 | 366×488, gap 20 |
| Fan/stack `436:1320` | 366×548 | not implemented |
| Authors | no Figma node | RFC §5 `CreatorCardGrid` or «Все авторы» |
| Dock | first fold 232+64 search FAB; long 288 with cart | production 232×64 at (79, 768), no cart (`DEC-088`) |

## Verified states

- **selected**: opening, works, authors; profile → `/seller/{slug}`; work →
  `/product/{publicId}`; «Смотреть все» → `/works`; «Смотреть всех» → `/authors`.
- **null**: opening omitted; newest work is not promoted into the opening slot.
- **hidden / rejected / unavailable**: same UI as null. The home contract
  already returns `curatorSelection: null`; the client does not invent a
  second payload.
- **loading / error+retry**: PageState; retry restores opening.
- **works empty**: opening + authors remain.
- **authors empty**: works remain; short «Все авторы» → `/authors`.
- **broken selected media**: accessible fallback
  `Изображение недоступно: Портрет сестры`. The red Expo log chip on that
  screenshot is harness noise from the 404, not a dock contract change.
- **long title/slug**: ellipsis, no horizontal overflow.
- **dock reserve**: last CTA sits above the 232×64 dock.
- **keyboard**: focused work cover activates with Enter.
- **200% zoom / reduced motion**: captured; no overflow at zoom 2.
- **390×860, 390×844, 1024, 1440**: phone column width 390; 1024/1440 column
  center equals viewport/2.

## Remaining deltas (not claimed as parity)

1. No Figma editorial copy («Выбор куратора», curator blurb) — API has no field.
2. No «Активные торги», prices, timers, sale/release badges, cart.
3. One selected Work instead of a four-card opening rail.
4. Author column is 134 px tall, not 324, because editorial is omitted; CTA
   therefore sits higher than Figma y 290.
5. Handle and bio use existing tokens, not a new type role (22/24 semibold vs
   22/25 medium; `#8A8A8A` vs `#6F6F6F`).
6. Section gap 40 vs Figma 67 (67 is opening→auctions on the excluded rail).
7. «Новые работы» is the vertical master list (`436:1274`), not the fan
   (`436:1320`).
8. «Новые авторы» is RFC §5, not a Figma Home node.
9. Native is unverified.

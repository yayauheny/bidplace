# Home — runtime capture 2026-09-13

Stand: Expo Web `:8083`, API `:3002` (`bidplace_preview`), viewport 390×844 @2x.

| File | What |
|---|---|
| `home-390-first-fold.png` | `/` first fold after the composition fix |

DOM against Figma `436:1137` / `439:4404`:

| Element | Figma | Runtime |
|---|---|---|
| Logo | 42×32 at (174, 60) | 42×32 at (174, 60) |
| «Новые работы» | 24/29 600 −3 %, #2A2A2A, centered, y 132 | 24/29 600 −0.72 px, rgb(42,42,42), centered, y 132 |
| Heading → first card | 20 | 20 (card y 181) |
| Cards | 366×488, gap 20 | 366×488, gap 20 |
| Cards → «Смотреть все» | 20 | 20 |
| Section → section | Figma shows 67 between the excluded rails; not defined for the vertical list | 40 (`space.x10`, the work-page block gap) |
| Bottom | dock overlay | `size.dockReserve` padding |

«Открытие недели» and «Активные торги» rails are intentionally absent (product decision pending / no auctions in the portfolio phase). The «Авторы» section has no Figma node; it reuses the same heading role and rhythm.

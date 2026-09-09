# home / default / 390×3372

- Original Figma name: `Главная`
- Node ID: `436:1137`
- Source folder basename: `Главная.figmacapture (1)`
- Matching zip: `Главная.figmacapture (1).zip` (same `nodes.json` SHA)
- Scope: `KEEP_FIRST_MVP`
- Confidence: high

Full scrolled Home page. Same Russian title as the 860-high fold, but a
different node, viewport, and pixel hash. Keep both.

Sections in order: «Открытие недели», «Активные торги», then two «Новые
работы» blocks (`436:1320` Frame 47 at `y: 1068`, then `436:1274` Frame 46 at
`y: 1683`). There is no «Новые авторы» block in this capture.

`Активные торги`, prices, timers, sale badges (`В продаже`, `Релиз`), and the
cart icon stay in the snapshot as `HIDE_FOR_FIRST_MVP`. «Новые работы» is
First MVP. RFC §5 still allows optional «Открытие недели»; the current phone
cutover does not render it.

## Dock

One five-icon pill, not the fold's split FAB.

| Layer | Node | Fact |
|-------|------|------|
| Pill | `436:1366` | Frame 34, 288×64 at `x: 51`, `y: 760` |
| Icons | `436:1366` | logo, search, plus, cart, user |
| Glass fill | `436:1366` | `#FFFFFF` opacity `0.6` |
| Blur | `436:1366` | Figma **background** blur radius `12` |
| Radii | `436:1366` | `200` |
| Stroke | `436:1366` | style `White border block`, `#DEDEDE` → `#F3F3F3` |

Do not rebuild glass from the flattened PNG.

## Asset map

| File | Node ID | Node name | Role |
|------|---------|-----------|------|
| `assets/001-436_1145.png` | `436:1145` | Rectangle 2 | `@vex` avatar (same hash as fold `439:4412`) |
| `assets/002-436_1155.png` | `436:1155` | Frame 5 | Featured work raster (same hash as fold `439:4422`) |
| `assets/003-436_1170.png` | `436:1170` | Frame 11 | 1×1 placeholder thumb |
| `assets/004-436_1184.png` | `436:1184` | Frame 9 | 1×1 placeholder thumb |
| `assets/006-436_1276.png` | `436:1276` | Frame 16 | «Радуга (Mask Series 1997 no.8)» |
| `assets/007-436_1290.png` | `436:1290` | Frame 17 | «Ваза "Блоссом"» |
| `assets/008-436_1304.png` | `436:1304` | Frame 18 | «Память» |
| `assets/009-436_1322.png` | `436:1322` | Frame 16 | Second «Радуга» raster |
| `assets/010-436_1336.png` | `436:1336` | Frame 17 | Second vase raster |
| `assets/011-436_1350.png` | `436:1350` | Frame 18 | Second «Память» raster |

`assets/005-436_1198.png` was a byte-identical alias of `004-436_1184.png` and
was not copied. Both packages keep their own copies of the shared avatar /
featured hashes so each package stays readable without cross-links.

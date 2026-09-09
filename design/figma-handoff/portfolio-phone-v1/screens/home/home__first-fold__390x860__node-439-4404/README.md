# home / first-fold / 390×860

- Original Figma name: `Главная`
- Node ID: `439:4404`
- Source folder basename: `Главная.figmacapture`
- Matching zip: `Главная.figmacapture.zip` (same `nodes.json` SHA)
- Scope: `KEEP_FIRST_MVP`
- Confidence: high

First phone fold of Home, not a crop of the long page. Viewport is 390×860.
The long Home frame is a different node (`436:1137`, 390×3372) and is stored
separately. This package stops after «Открытие недели» and the top of
«Активные торги». It does not contain «Новые работы».

`Активные торги`, prices, timers, «В продаже», and the cart icon stay in the
snapshot as `HIDE_FOR_FIRST_MVP`. RFC §5 still allows optional «Открытие
недели»; the current phone cutover does not render it.

## Dock

Split chrome, not the five-icon pill on the long Home frame.

| Layer | Node | Fact |
|-------|------|------|
| Row | `456:8284` | Frame 182, 313×64 at `x: 38`, `y: 760` |
| Pill | `439:4633` | Frame 34, 232×64: logo, plus, cart, user |
| Search FAB | `456:8265` | Frame 46, 64×64 |
| Glass fill | both pills | `#FFFFFF` opacity `0.6` |
| Blur | both pills | Figma **background** blur radius `12` |
| Radii | both pills | `200` |
| Stroke | both pills | style `White border block`, `#DEDEDE` → `#F3F3F3` |

Do not rebuild glass from the flattened PNG.

## Asset map

| File | Node ID | Role |
|------|---------|------|
| `001-439_4412.png` | `439:4412` | Layer raster |
| `002-439_4422.png` | `439:4422` | Layer raster |
| `003-439_4437.png` | `439:4437` | 1×1 placeholder |
| `004-439_4451.png` | `439:4451` | 1×1 placeholder |

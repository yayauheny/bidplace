# creator / share-sheet / 390×874

- Original Figma name: `Каталог работ / идут торги / сделать ставку`
- Node ID: `526:13756`
- Source folder basename: `Каталог_работ___идут_торги___сделать_ставку.figmacapture`
- Scope: `KEEP_FIRST_MVP`
- Confidence: medium

Visible state is the creator share sheet over the author hero. The source
folder and root frame name say «catalog / live auction / bid»; the reference
PNG and node tree do not. Underlay tab underline `526:13860` is the about
tab, not `Работы`.

Share/QR is First MVP. Related-work prices, timers, sale badges, `Архив`,
like, and cart stay in the snapshot as `HIDE_FOR_FIRST_MVP` / `POST_MVP`.

## Stack

1. Off-viewport related-work strip (`526:13757`) with commerce cards
2. Author page frame `526:13820` (390×859)
3. Dimmer `526:13880` — `#2A2A2A` at 50% opacity (also captured alone)
4. Sheet `597:19045` — «Поделиться», QR slot, download/copy actions

## Atmosphere

Same formula as the about package, same image hash `e877cde9ee970b0686af6c8c1d61db7758a6938a`.

| Layer | Node | Fact |
|-------|------|------|
| Atmospheric photo | `526:13821` | 485×485 at `x: -47`, `y: -36` |
| Image fill | `526:13821` | `scaleMode: fill`, transform `[[1,0,0],[0,0.67,0.17]]` |
| White veil | `526:13821` | `#FFFFFF` opacity `0.4` |
| Node opacity | `526:13821` | `0.5` |
| Bottom radii | `526:13821` | `200` |
| Blur | `526:13821` | Figma **layer** blur, radius `80` |
| Sharp avatar | `526:13826` | 112×112 crop, no layer blur |
| Overlay dimmer | `526:13880` | solid dark veil, not a photo blur and not `backdrop-filter` |

## Asset map

| File | Node ID | Node name | Role |
|------|---------|-----------|------|
| `assets/001-526_13762.png` | `526:13762` | Frame 9 | 1×1 related-work placeholder |
| `assets/004-526_13804.png` | `526:13804` | Frame 11 | 1×1 related-work placeholder (different bytes) |
| `assets/005-526_13821.png` | `526:13821` | Rectangle 2 | Atmospheric / hero raster |
| `assets/006-526_13826.png` | `526:13826` | Rectangle 2 | Sharp avatar |

Aliases not stored: `002-526_13776.png` and `003-526_13789.png` are
byte-identical to `001-526_13762.png`.

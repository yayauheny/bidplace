# creator / about / 390×1609

- Original Figma name: `Страница автора / Об авторе`
- Node ID: `621:19475`
- Source folder basename: `Страница_автора___Об_авторе.figmacapture`
- Scope: `KEEP_FIRST_MVP`
- Confidence: high

Public creator about tab. First MVP keeps biography, practice, optional
achievements, share/QR, and the `Работы` / `Об авторе` tabs. The captured
`Архив` tab, heart, and cart icon stay in the snapshot as
`HIDE_FOR_FIRST_MVP`.

## Atmosphere

Do not rebuild this from the flattened PNG.

| Layer | Node | Fact |
|-------|------|------|
| Atmospheric photo | `621:19476` | 485×485 at `x: -47`, `y: -36`; same image hash as the sharp avatar |
| Image fill | `621:19476` | `scaleMode: fill`, transform `[[1,0,0],[0,0.67,0.17]]` |
| White veil | `621:19476` | second fill `#FFFFFF` opacity `0.4` |
| Node opacity | `621:19476` | `0.5` |
| Bottom radii | `621:19476` | `bottomLeft` / `bottomRight` `200` |
| Blur | `621:19476` | Figma **layer** blur, radius `80` (not `backdrop-filter`) |
| Sharp avatar | `621:19481` | 112×112 crop of the same image hash, no layer blur |
| Dock glass | `621:19558` | white 60% fill + **background** blur radius `12` |

The rendered `reference.png` and `assets/001-621_19476.png` are visual
oracles. Author photos in the app stay dynamic.

## Asset map

| File | Node ID | Node name | Role |
|------|---------|-----------|------|
| `assets/001-621_19476.png` | `621:19476` | Rectangle 2 | Atmospheric / hero raster (390×529 export of the blurred photo layer) |
| `assets/002-621_19481.png` | `621:19481` | Rectangle 2 | Sharp circular avatar source (417×417) |
| `assets/003-621_19582.png` | `621:19582` | Rectangle 14 | Exhibition card photograph (450×600) |
| `assets/004-621_19587.png` | `621:19587` | Rectangle 14 | Second exhibition raster (116×447) |

Logo and tab-bar icons are compact vectors inside `nodes.json`, not separate
SVG files in this capture.

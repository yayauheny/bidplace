# Import report — portfolio-phone-v1

Inputs were read from user-provided `.figmacapture` folders. Source folders
were not modified, moved, or renamed. Classification used manifest, nodes,
and the reference PNG. Folder names were the lowest-priority signal.

## 1. Страница_автора___Об_авторе.figmacapture

- Determined screen/state: `creator` / `about`
- Confidence: high
- Destination: `screens/creator/creator__about__390x1609__node-621-19475/`
- Duplicate/conflict: unique node `621:19475`, unique reference SHA
  `8f189a22563c45a1b665b19d9670a5150a4b37cb46f5c1b38f776766b63a6521`

Evidence:

- Manifest root name «Страница автора / Об авторе», node `621:19475`,
  viewport 390×1609
- Nodes: `@vex`, «Илья Васильев», tabs «Работы / Архив / Об авторе»,
  «Биография», «Практика и подход», «Выставки и достижения»
- About-tab underline `621:19533` fill `#2A2A2A`; works/archive underlines white
- Reference PNG matches the about composition

Saved:

- `reference.png` from `references/001-621_19475.png`
- `nodes.json`
- `assets/001-621_19476.png` … `004-621_19587.png`
- `metadata/source-manifest.json`
- `metadata/source-prompt.md`
- `metadata/fidelity-coverage.json`
- `metadata/figma-locator.json`

Excluded:

| File | Reason |
|------|--------|
| `fallbacks/001-621_19475.svg` | Whole-frame SVG with `<image>` / `data:image` base64 photographs (1 725 434 bytes) |
| `fallbacks/001-621_19475.png` | Byte-identical to `references/001-621_19475.png` |
| `.DS_Store` | Finder junk |

Warnings:

- Manifest `fileKey` is null.
- Plugin warned that some rasters are below 2× source detail.
- `Архив`, like, and cart remain in the capture; scope of those slots is
  `HIDE_FOR_FIRST_MVP`. The about surface itself is `KEEP_FIRST_MVP`.

## 2. Каталог_работ___идут_торги___сделать_ставку.figmacapture

- Determined screen/state: `creator` / `share-sheet`
- Confidence: medium
- Destination: `screens/creator/creator__share-sheet__390x874__node-526-13756/`
- Duplicate/conflict: unique node `526:13756`, unique reference SHA
  `87f707c472745f62bdd99b8fb0e710ef3cb2079aa63c803fae6afd455a8bdd74`

Evidence:

- Manifest root name claims a works catalog / live auction / bid frame
- Node tree contains «Страница автора», `@vex`, share sheet «Поделиться»,
  dimmer `526:13880`, and an off-viewport «Другие работы автора» block
- About-tab underline `526:13860` is `#2A2A2A`, so the underlay is not the
  works tab
- Reference PNG shows the author hero plus the share sheet

Saved:

- `reference.png` from `references/001-526_13756.png`
- `nodes.json`
- `assets/001-526_13762.png`
- `assets/004-526_13804.png`
- `assets/005-526_13821.png`
- `assets/006-526_13826.png`
- capture metadata (manifest, prompt, fidelity, locator)

Excluded:

| File | Reason |
|------|--------|
| `fallbacks/001-526_13756.svg` | Whole-frame SVG with `<image>` / `data:image` base64 (294 895 bytes) |
| `fallbacks/001-526_13756.png` | Byte-identical to `references/001-526_13756.png` |
| `assets/002-526_13776.png` | Byte-identical to `assets/001-526_13762.png` (`f4bfc50376bceedb0438d206ed45bd53cf7e1d63a7af2b0c3dfda58d7f458b48`); alias of node `526:13776` |
| `assets/003-526_13789.png` | Same byte-identical alias for node `526:13789` |
| `.DS_Store` | Finder junk |

Warnings:

- Do not treat the source folder name or root frame name as a works catalog.
- Related-work commerce cards (price, timer, «В продаже») stay in `nodes.json`
  with `HIDE_FOR_FIRST_MVP` / `POST_MVP` slot status.
- Avatar/atmosphere rasters match the about package by SHA. Both copies were
  kept so each package stays readable without cross-links.

## 3. Frame_140.figmacapture

- Determined screen/state: unclassified overlay dimmer
- Confidence: low
- Destination: `_unclassified/unclassified__overlay-dimmer__390x874__node-526-13880/`
- Duplicate/conflict: not a second screen; it is the dimmer child of
  `526:13756`

Evidence:

- Manifest root name «Frame 140», node `526:13880`, 390×874
- `nodes.json` is a single empty frame: solid `#2A2A2A` at 50% opacity,
  prototype overlay
- Reference PNG is a flat dark rectangle with no UI text

Saved:

- `reference.png`, `nodes.json`, and capture metadata

Excluded:

| File | Reason |
|------|--------|
| `fallbacks/001-526_13880.svg` | Whole-frame fallback; 174-byte gray rect already described by `nodes.json` and the reference PNG |
| `fallbacks/001-526_13880.png` | Byte-identical to `references/001-526_13880.png` |
| `.DS_Store` | Finder junk |

Warnings:

- Not classified as a product screen. Keep as a dimmer oracle for the
  share-sheet stack.

## Summary lists

### Removed whole-frame SVG

- `Страница_автора___Об_авторе.figmacapture/fallbacks/001-621_19475.svg`
- `Каталог_работ___идут_торги___сделать_ставку.figmacapture/fallbacks/001-526_13756.svg`
- `Frame_140.figmacapture/fallbacks/001-526_13880.svg`

### SVG with embedded raster/base64

- `001-621_19475.svg`
- `001-526_13756.svg`

### Byte-identical duplicates

- About fallback PNG = about reference PNG
- Share-sheet fallback PNG = share-sheet reference PNG
- Frame 140 fallback PNG = Frame 140 reference PNG
- Share-sheet `002-526_13776.png` and `003-526_13789.png` = `001-526_13762.png`

### Unclassified packages

- `Frame_140.figmacapture` → overlay dimmer

### Conflicts

- None

### Unreadable inputs

- None of the three packages failed to read

### Files larger than 10 MB that were still saved

- None. Largest saved file is about `nodes.json` (157 638 bytes) and about
  `reference.png` (312 936 bytes). The 1.7 MB about SVG was excluded.

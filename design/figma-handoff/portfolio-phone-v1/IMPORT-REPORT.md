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

## Second intake — 2026-09-09

All 18 user-supplied paths were read. Downloads were not modified. Zips were
opened read-only; large fallback SVGs were not copied into the repo.

### Aliases of packages already in the library

| Input | Alias of | Evidence |
|-------|----------|----------|
| `Каталог_работ___идут_торги___сделать_ставку.figmacapture` | `526:13756` share-sheet | same folder already imported |
| `Каталог_работ___идут_торги___сделать_ставку.figmacapture.zip` | `526:13756` | same `nodes.json` SHA `d8ff0f07…` |
| `Страница_автора___Об_авторе.figmacapture` | `621:19475` about | already imported |
| `Страница_автора___Об_авторе.figmacapture.zip` | `621:19475` | same nodes SHA `1fea8ecf…` |
| `Страница_автора___Об_авторе.figmacapture (2).zip` | `621:19475` | same nodes SHA; later `capturedAt` |
| `Frame_140.figmacapture` | `526:13880` dimmer | already imported |
| `Frame_140.figmacapture.zip` | `526:13880` | same nodes SHA `18eeb689…` |
| `Страница_автора___Работы.figmacapture.zip` | `526:13351` works | same nodes SHA as the `(1)` folder |
| `Страница_автора___Работы.figmacapture (1).zip` | `526:13351` works | same nodes SHA as the `(1)` folder |

### New unique packages

#### Страница_автора___Работы.figmacapture (1)

- Screen/state: `creator` / `works`
- Confidence: high
- Destination: `screens/creator/creator__works__390x2703__node-526-13351/`
- Evidence: root name «Работы», tab underline `#2A2A2A` on «Работы», work cards
- Saved: reference PNG 390×2703, nodes, four work rasters, avatar, atmosphere, metadata
- Excluded: `fallbacks/001-526_13351.svg` (48 663 711 bytes, `<image>` / base64); fallback PNG = reference

#### Страница_автора___Работы.figmacapture (2).zip

- Screen/state: `creator` / `works` with owner «Редактировать профиль»
- Confidence: high
- Destination: `screens/creator/creator__works__390x2703__node-621-19820/`
- Evidence: different node `621:19820`, atmosphere `y: -128`, extra edit button
- Excluded: `fallbacks/001-621_19820.svg` (48 680 486 bytes, embedded raster)

#### Страница_автора___Об_авторе.figmacapture (1).zip

- Screen/state: `creator` / `about` (text exhibition list)
- Confidence: high
- Destination: `screens/creator/creator__about__390x1328__node-526-14122/`
- Evidence: node `526:14122`, 390×1328, no photo carousel
- Excluded: whole-frame SVG 907 908 bytes with embedded raster

#### Страница_автора___Об_авторе.figmacapture (3).zip

- Screen/state: `creator` / `about` (quote fold, different photo)
- Confidence: high
- Destination: `screens/creator/creator__about__390x860__node-526-14225/`
- Evidence: node `526:14225`, quote, hat/palette avatar
- Excluded: whole-frame SVG 680 850 bytes with embedded raster

#### Страница_автора.figmacapture.zip

- Screen/state: `creator` / `default` (header only)
- Confidence: medium
- Destination: `screens/creator/creator__default__390x859__node-526-13892/`
- Evidence: hero + about tab, empty body
- Excluded: whole-frame SVG 269 257 bytes with embedded raster

#### Страница_автора.figmacapture (1).zip

- Screen/state: `creator` / `default` (header, alternate photo)
- Confidence: medium
- Destination: `screens/creator/creator__default__390x860__node-526-14046/`
- Evidence: node `526:14046`, gallery/suit photo, bell control
- Excluded: whole-frame SVG 1 225 859 bytes with embedded raster

#### Страница_автора_навигация_страинцы_автора.figmacapture.zip

- Screen/state: `creator` / `scrolled`
- Confidence: high
- Destination: `screens/creator/creator__scrolled__390x860__node-526-14482/`
- Evidence: compact `@vex` sticky header, atmosphere `y: -340`, about body
- Excluded: whole-frame SVG 888 753 bytes with embedded raster

#### Страница_автора_навигация_страинцы_автора.figmacapture (1).zip

- Screen/state: `creator` / `scrolled`
- Confidence: high
- Destination: `screens/creator/creator__scrolled__390x860__node-526-14560/`
- Evidence: same chrome, different photo hash `21a9484e…`
- Excluded: whole-frame SVG 1 667 027 bytes with embedded raster

#### Frame_219.figmacapture.zip

- Screen/state: `components` / achievements timeline
- Confidence: high
- Destination: `components/achievements-timeline__1471x641__node-742-20510/`
- Evidence: 1471×641, year markers, exhibition cards, graduation card
- Excluded: whole-frame SVG 1 170 173 bytes with embedded raster

## Summary lists

### Removed whole-frame SVG

- `001-621_19475.svg` (1.7 MB)
- `001-526_13756.svg` (295 KB)
- `001-526_13880.svg` (174 B gray rect)
- `001-526_13351.svg` (48.7 MB)
- `001-621_19820.svg` (48.7 MB)
- `001-526_14122.svg`
- `001-526_14225.svg`
- `001-526_13892.svg`
- `001-526_14046.svg`
- `001-526_14482.svg`
- `001-526_14560.svg`
- `001-742_20510.svg`

### SVG with embedded raster/base64

All listed whole-frame SVGs except the 174-byte Frame 140 rect.

### Byte-identical duplicates / aliases

- First-intake fallback PNGs = their reference PNGs
- Share-sheet `002` / `003` assets = `001-526_13762.png`
- Catalog zip = imported share-sheet
- About zip and About `(2)` zip = imported `621:19475`
- Frame 140 zip = imported dimmer
- Works zip and Works `(1)` zip = imported `526:13351`

### Unclassified packages

- `Frame_140.figmacapture` / `.zip` → overlay dimmer

### Conflicts

- None

### Unreadable inputs

- None

### Files larger than 10 MB that were still saved

- None. Largest saved rasters are work covers ≈ 5.7 MB. Both ~48 MB
  whole-frame SVGs were excluded.

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

## Third intake — 2026-09-09 (Home + Search)

All seven user-supplied paths were read. Downloads were not modified. The two
«Главная» copies are **not** duplicates: one is the first fold, one is the
full page. Zips were opened read-only; whole-frame SVGs were not copied.

### Aliases

| Input | Alias of | Evidence |
|-------|----------|----------|
| `Главная.figmacapture.zip` | `439:4404` first-fold | same nodes SHA `213f06a9…` as `Главная.figmacapture` |
| `Главная.figmacapture (1).zip` | `436:1137` full Home | same nodes SHA `3cb1bc23…` as `Главная.figmacapture (1)` |

### New unique packages

#### Главная.figmacapture

- Screen/state: `home` / `first-fold`
- Confidence: high
- Destination: `screens/home/home__first-fold__390x860__node-439-4404/`
- Evidence: node `439:4404`, viewport 390×860, «Открытие недели» + top of
  «Активные торги», no «Новые работы». Split dock: 4-icon pill `439:4633`
  plus search FAB `456:8265`.
- Saved: reference PNG 390×860, nodes, avatar, featured raster, two unique
  1×1 placeholder thumbs, metadata
- Excluded: `fallbacks/001-439_4404.svg` (47 606 326 bytes, `<image>` /
  base64); fallback PNG = reference; `assets/005-439_4465.png` byte-identical
  to `004-439_4451.png`

#### Главная.figmacapture (1)

- Screen/state: `home` / `default`
- Confidence: high
- Destination: `screens/home/home__default__390x3372__node-436-1137/`
- Evidence: node `436:1137`, viewport 390×3372, adds two «Новые работы»
  blocks and a 5-icon dock `436:1366`. Different pixels from the fold.
- Saved: reference PNG 390×3372, nodes, shared-hash avatar/featured copies,
  six work rasters, metadata
- Excluded: `fallbacks/001-436_1137.svg` (71 647 322 bytes, embedded raster);
  fallback PNG = reference; `assets/005-436_1198.png` alias of `004`

#### Поиск_пупап_авторы.figmacapture.zip

- Screen/state: `search` / `authors`
- Confidence: high
- Destination: `screens/search/search__authors__390x860__node-456-8298/`
- Evidence: node `456:8298`, selected tab `456:8381` `Обычная: Черная`
- Excluded: `fallbacks/001-456_8298.svg` (1 547 808 bytes, `<image>`)

#### Поиск_пупап_категории.figmacapture.zip

- Screen/state: `search` / `categories`
- Confidence: high
- Destination: `screens/search/search__categories__390x860__node-439-4652/`
- Evidence: node `439:4652`, selected tab `456:8248`, 3×3 category grid
- Excluded: `fallbacks/001-439_4652.svg` (10 448 058 bytes, `<image>`)

#### Поиск_пупап_работы.figmacapture.zip

- Screen/state: `search` / `works-results`
- Confidence: high
- Destination: `screens/search/search__works-results__390x860__node-456-8392/`
- Evidence: node `456:8392`, selected tab `456:8427`, work cards with
  `Торги` / `Продано` / `Анонс`
- Excluded: `fallbacks/001-456_8392.svg` (23 762 083 bytes, `<image>`)

### Third-intake SVG exclusions

- `001-439_4404.svg` (47.6 MB)
- `001-436_1137.svg` (71.6 MB)
- `001-456_8298.svg` (1.5 MB)
- `001-439_4652.svg` (10.4 MB)
- `001-456_8392.svg` (23.8 MB)

### Files larger than 10 MB that were still saved (this intake)

- None. Largest new raster is `006-436_1276.png` ≈ 4.8 MB.

## Fourth intake — 2026-09-09 (Work, catalogs, filters)

All 18 user-supplied paths were read. Downloads were not modified. Same
Russian names with different node IDs were kept as separate packages.

### Aliases of packages already in the library

| Input | Alias of | Evidence |
|-------|----------|----------|
| `Главная.figmacapture.zip` | `439:4404` first-fold | nodes SHA `213f06a9…` |
| `Главная.figmacapture (1).zip` | `436:1137` full Home | nodes SHA `3cb1bc23…` |
| `Поиск_пупап_авторы.figmacapture.zip` | `456:8298` | nodes SHA `593715be…` |
| `Поиск_пупап_категории.figmacapture.zip` | `439:4652` | nodes SHA `5b183e14…` |
| `Поиск_пупап_работы.figmacapture.zip` | `456:8392` | nodes SHA `9e84711b…` |
| `Каталог_работ___идут_торги___сделать_ставку.figmacapture.zip` | `526:13756` creator share-sheet | nodes SHA `d8ff0f07…` |

### New unique packages

#### Каталог_работ.figmacapture.zip

- `works` / `default` → `screens/works/works__default__390x2350__node-526-13248/`
- Evidence: node `526:13248`, «Все работы» underline `#2A2A2A`
- Excluded: whole-frame SVG 48 511 612 bytes

#### Каталог_авторов.figmacapture (1).zip

- `authors` / `default` → `screens/authors/authors__default__390x2350__node-526-12904/`
- Evidence: author cards with name, `@slug`, chips
- Excluded: whole-frame SVG 5 476 228 bytes

#### Каталог_работ___вкладка_детали.figmacapture.zip

- `work` / `details` → `screens/work/work__details__390x2390__node-745-21209/`
- Evidence: body is sizes/edition/auth; tab chrome still underlines «История»
- Confidence: medium
- Excluded: SVG 33 579 850 bytes; `005` alias of `004`

#### Каталог_работ___идут_торги___вкладка_история.figmacapture.zip

- `work` / `history` → `screens/work/work__history__390x2390__node-745-20634/`
- Evidence: «История» selected, story copy + detail crop
- Excluded: SVG 50 062 615 bytes

#### Каталог_работ___завершен_.figmacapture.zip

- `work` / `sold` → `screens/work/work__sold__390x862__node-526-12278/`
- Evidence: «Продано», locked CTA, first-fold 862
- Excluded: SVG 15 369 195 bytes; four 1×1 aliases

#### Каталог_работ___идут_торги___Участие_в_торгах.figmacapture.zip

- `work` / `share-sheet` → `screens/work/work__share-sheet__390x874__node-597-18787/`
- Evidence: overlay title «Поделиться», QR slot. Folder name lies.

#### Каталог_работ___идут_торги___Участие_в_торгах.figmacapture (1).zip

- `work` / `bid-sheet` → `screens/work/work__bid-sheet__390x874__node-526-12056/`
- Evidence: «Участие в торгах», stepper, increments. Scope `POST_MVP`.

#### Каталог_работ___идут_торги___Участие_в_торгах.figmacapture (2).zip

- `work` / `buy-sheet` → `screens/work/work__buy-sheet__390x874__node-526-12173/`
- Evidence: «Купить работу». Scope `POST_MVP`.

#### Фильтры_.figmacapture (1).zip

- `filters` / `root` → `screens/filters/filters__root__390x860__node-526-12980/`
- Evidence: Категория / Материалы / Цена / radio row

#### Фильтры_чекбоксы.figmacapture.zip

- `filters` / `cities` → `screens/filters/filters__cities__390x860__node-526-13009/`
- Evidence: city list; header wrongly says «Материалы»

#### Фильтры_чекбоксы.figmacapture (1).zip

- `filters` / `city-search` → `screens/filters/filters__city-search__390x860__node-526-13065/`
- Evidence: title «Город», typeahead «Сама» over materials rows

#### Фильтры_чекбоксы.figmacapture (2).zip

- `filters` / `materials-radio` → `screens/filters/filters__materials-radio__390x860__node-526-13142/`
- Evidence: radio list, Акрил selected; header «Набор радио кнопок»

### Fourth-intake SVG exclusions

- `001-745_21209.svg` (33.6 MB)
- `001-745_20634.svg` (50.1 MB)
- `001-526_12278.svg` (15.4 MB)
- `001-526_12173.svg` (15.0 MB)
- `001-526_12056.svg` (15.1 MB)
- `001-597_18787.svg` (14.9 MB)
- `001-526_13248.svg` (48.5 MB)
- `001-526_12904.svg` (5.5 MB)
- plus compact filter whole-frame SVGs (no separate rasters were needed)

### Files larger than 10 MB that were still saved (this intake)

- None. Largest new raster is hero `001-745_21210.png` ≈ 6.4 MB.

## Fifth intake — create-work, apply, auth, Work variants, filters

40 user paths were scanned. 11 were byte-aliases of packages already in the
library (Work details/history/sold, share/bid/buy sheets, three checkbox
filter zips, duplicate history zip). **29 new unique packages** were imported.
After import, all **58** catalog packages were backfilled from Downloads so
each has the standard handoff set (`reference.png`, `nodes.json`, four
metadata files, unique `assets/`, `README.md`).

### New packages (29)

| Surface | Count | Examples |
|---------|------:|----------|
| `create-work` | 9 | basics, details, story, shipping, statuses sheet |
| `apply` | 10 | identity, contacts, about, bio, landing, abort |
| `auth` | 4 | login board, register complete/error, email-code board |
| `work` | 5 | bids, announcement, not-for-sale, sold 922, history 2706 |
| `filters` | 1 | materials-checkboxes |

### Aliases skipped (11)

- `Каталог_работ___вкладка_детали.figmacapture.zip` → `745:21209` (already imported)
- `Каталог_работ___идут_торги___вкладка_история.figmacapture.zip` → `745:20634`
- `Каталог_работ___завершен_.figmacapture.zip` → `526:12278`
- Three «Участие в торгах» zips → share/bid/buy already imported
- `Каталог_работ___идут_торги___сделать_ставку.figmacapture.zip` → creator share sheet `526:13756`
- `Фильтры_чекбоксы.figmacapture.zip` / `(1)` / `(2)` → cities / city-search / materials-radio
- `Каталог_работ___идут_торги___вкладка_история.figmacapture (2).zip` → byte-alias of `(1)`

### What was copied into each package

- `reference.png` from `references/*.png` (byte-identical, no re-encode)
- `nodes.json` from `design/nodes.json` (unformatted)
- `metadata/source-prompt.md`, `source-manifest.json`, `fidelity-coverage.json`, `figma-locator.json`
- every **unique** raster from `assets/` (photographs and layer PNGs)
- package `README.md` with scope and asset map

### What was excluded

- whole-frame SVG fallbacks with embedded photographs (up to ~50 MB per Work page)
- fallback PNGs byte-identical to `reference.png`
- byte-identical duplicate assets within a package (common 1×1 placeholders)
- sanitized secrets from JSON metadata (`/Users/` paths, tokens)

### Fifth-intake scope notes

- Create-work sale status / time / price fields: `HIDE_FOR_FIRST_MVP`
- Search overlays; create-work shipping, buyer-contact, process-story and statuses;
  Work sold/archive/bids/announcement; auth email-code: `POST_MVP`
- Three auth boards are 1123 px-wide multi-phone frames, not 390 phone captures
- Four «Фильтры чекбоксы» zips are four different nodes — all kept

### Library completeness check

- Packages in catalog: **58**
- Packages with full standard file set: **58 / 58**
- Unique layer rasters saved: **158** across all packages
- Symlinks to Downloads: **0**
- Files larger than 10 MB in library: **0** (largest raster ≈ 6.9 MB)

## Sixth intake — 2026-09-09 (foundation component sets)

User noted three missing foundation captures from Downloads. All three were
imported as shared component packages (not phone screens).

| Input | Surface | Node | Destination |
|-------|---------|------|-------------|
| `Поля_ввода.figmacapture.zip` | text fields | `292:5044` | `components/text-fields__789x552__node-292-5044/` |
| `Кнопки.figmacapture.zip` | buttons | `292:5058` | `components/buttons__714x283__node-292-5058/` |
| `Иконки_кнопок.figmacapture.zip` | button icons | `297:5598` | `components/button-icons__250x174__node-297-5598/` |

Evidence: each zip is a Figma `COMPONENT_SET` with variant rows (input states,
button outline/black/disabled/hover/pressed, icon variants). No unique layer
rasters — vectors only in `nodes.json`.

Excluded: whole-frame SVG fallbacks (`001-292_5044.svg` 137 KB,
`001-292_5058.svg` 62 KB, `001-297_5598.svg` 18 KB) — vector-only sets, no
embedded photos; reference PNG copied as `reference.png`.

### Updated library completeness

- Packages in catalog: **61**
- Packages with full standard file set: **61 / 61**
- Unique layer rasters saved: **158** (unchanged; new packages have empty `assets/`)
- Symlinks to Downloads: **0**

## Seventh intake — 2026-09-10 (cards, filter chrome, materials)

User supplied 20 paths. **18 imported**, **2 skipped as byte aliases**.

### Aliases

| Input | Alias of | Evidence |
|-------|----------|----------|
| `Frame_5.figmacapture (1).zip` | `874:5458` | same `nodes.json` SHA as `Frame_5.figmacapture.zip` |
| `Frame_9.figmacapture` (folder) | `874:5473` | same `nodes.json` SHA as `Frame_9.figmacapture.zip` |

### Imported

| Input | Role | Node | Destination |
|-------|------|------|-------------|
| `Frame_6.figmacapture.zip` | author cover card | `874:5576` | `components/author-cover-card__264x352__node-874-5576/` |
| `Frame_4.figmacapture.zip` | author cover card | `874:5540` | `components/author-cover-card__264x352__node-874-5540/` |
| `Frame_4.figmacapture (1).zip` | author cover card | `874:5564` | `components/author-cover-card__264x352__node-874-5564/` |
| `Frame_33.figmacapture.zip` | author identity row | `874:5591` | `components/author-identity-row__348x84__node-874-5591/` |
| `Frame_5`…`17` (10 zips) | work cover card samples | `874:5458`…`874:5685` | `components/work-cover-card__264x352__node-*/` |
| `Frame_77.figmacapture.zip` | filter + sort bar | `874:5434` | `components/filter-sort-bar__293x43__node-874-5434/` |
| `Frame_57.figmacapture.zip` | catalog segment tabs | `874:5421` | `components/catalog-segment-tabs__390x28__node-874-5421/` |
| `Живопись_…_автор.zip` | materials taxonomy label | `874:5420` | `components/materials-taxonomy-label__278x214__node-874-5420/` |
| `Vector.figmacapture.zip` | image placeholder vector | `874:5454` | `components/image-placeholder-vector__188x142__node-874-5454/` |

Two «Frame 4» captures kept separate (`874:5540` vs `874:5564`). Ten work-card
samples share 264×352 geometry but differ in overlay layout and photo hash.

Excluded whole-frame SVG fallbacks > 5 MB: `874:5458`, `874:5487`, `874:5473`,
`874:5616`, `874:5631` (14–17 MB each, embedded photos).

### Updated library completeness

- Packages in catalog: **79**
- Packages with full standard file set: **79 / 79**
- Unique layer rasters saved: **172** (+14 photo assets from card captures)
- Symlinks to Downloads: **0**

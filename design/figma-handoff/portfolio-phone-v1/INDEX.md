# portfolio-phone-v1 index

| ID | Original Figma name | Surface | State | Viewport | Node ID | Scope | Confidence | Package | Reference |
|----|---------------------|---------|-------|----------|---------|-------|------------|---------|-----------|
| creator-about-phone | Страница автора / Об авторе | creator | about | 390×1609 | `621:19475` | KEEP_FIRST_MVP | high | `screens/creator/creator__about__390x1609__node-621-19475` | [reference.png](screens/creator/creator__about__390x1609__node-621-19475/reference.png) |
| creator-about-list-phone | Страница автора / Об авторе | creator | about | 390×1328 | `526:14122` | KEEP_FIRST_MVP | high | `screens/creator/creator__about__390x1328__node-526-14122` | [reference.png](screens/creator/creator__about__390x1328__node-526-14122/reference.png) |
| creator-about-quote-phone | Страница автора / Об авторе | creator | about | 390×860 | `526:14225` | KEEP_FIRST_MVP | high | `screens/creator/creator__about__390x860__node-526-14225` | [reference.png](screens/creator/creator__about__390x860__node-526-14225/reference.png) |
| creator-works-phone | Страница автора / Работы | creator | works | 390×2703 | `526:13351` | KEEP_FIRST_MVP | high | `screens/creator/creator__works__390x2703__node-526-13351` | [reference.png](screens/creator/creator__works__390x2703__node-526-13351/reference.png) |
| creator-works-owner-phone | Страница автора / Работы | creator | works | 390×2703 | `621:19820` | KEEP_FIRST_MVP | high | `screens/creator/creator__works__390x2703__node-621-19820` | [reference.png](screens/creator/creator__works__390x2703__node-621-19820/reference.png) |
| creator-header-phone | Страница автора | creator | default | 390×859 | `526:13892` | KEEP_FIRST_MVP | medium | `screens/creator/creator__default__390x859__node-526-13892` | [reference.png](screens/creator/creator__default__390x859__node-526-13892/reference.png) |
| creator-header-alt-phone | Страница автора | creator | default | 390×860 | `526:14046` | KEEP_FIRST_MVP | medium | `screens/creator/creator__default__390x860__node-526-14046` | [reference.png](screens/creator/creator__default__390x860__node-526-14046/reference.png) |
| creator-about-scrolled-phone | Страница автора навигация страинцы автора | creator | scrolled | 390×860 | `526:14482` | KEEP_FIRST_MVP | high | `screens/creator/creator__scrolled__390x860__node-526-14482` | [reference.png](screens/creator/creator__scrolled__390x860__node-526-14482/reference.png) |
| creator-about-scrolled-alt-phone | Страница автора навигация страинцы автора | creator | scrolled | 390×860 | `526:14560` | KEEP_FIRST_MVP | high | `screens/creator/creator__scrolled__390x860__node-526-14560` | [reference.png](screens/creator/creator__scrolled__390x860__node-526-14560/reference.png) |
| creator-share-sheet-phone | Каталог работ / идут торги / сделать ставку | creator | share-sheet | 390×874 | `526:13756` | KEEP_FIRST_MVP | medium | `screens/creator/creator__share-sheet__390x874__node-526-13756` | [reference.png](screens/creator/creator__share-sheet__390x874__node-526-13756/reference.png) |
| home-first-fold-phone | Главная | home | first-fold | 390×860 | `439:4404` | KEEP_FIRST_MVP | high | `screens/home/home__first-fold__390x860__node-439-4404` | [reference.png](screens/home/home__first-fold__390x860__node-439-4404/reference.png) |
| home-phone | Главная | home | default | 390×3372 | `436:1137` | KEEP_FIRST_MVP | high | `screens/home/home__default__390x3372__node-436-1137` | [reference.png](screens/home/home__default__390x3372__node-436-1137/reference.png) |
| search-authors-phone | Поиск пупап авторы | search | authors | 390×860 | `456:8298` | KEEP_FIRST_MVP | high | `screens/search/search__authors__390x860__node-456-8298` | [reference.png](screens/search/search__authors__390x860__node-456-8298/reference.png) |
| search-categories-phone | Поиск пупап категории | search | categories | 390×860 | `439:4652` | KEEP_FIRST_MVP | high | `screens/search/search__categories__390x860__node-439-4652` | [reference.png](screens/search/search__categories__390x860__node-439-4652/reference.png) |
| search-works-results-phone | Поиск пупап работы | search | works-results | 390×860 | `456:8392` | KEEP_FIRST_MVP | high | `screens/search/search__works-results__390x860__node-456-8392` | [reference.png](screens/search/search__works-results__390x860__node-456-8392/reference.png) |

`Архив`, cart, like, prices, and timers stay in the pixels.
Mark those slots `HIDE_FOR_FIRST_MVP`. Share/QR and owner «Редактировать
профиль» stay in First MVP.

## Shared components

| ID | Original Figma name | Viewport | Node ID | Scope | Package | Reference |
|----|---------------------|----------|---------|-------|---------|-----------|
| achievements-timeline | Frame 219 | 1471×641 | `742:20510` | KEEP_FIRST_MVP | `components/achievements-timeline__1471x641__node-742-20510` | [reference.png](components/achievements-timeline__1471x641__node-742-20510/reference.png) |

## Foundations

None imported.

## Unclassified

| ID | Original Figma name | Viewport | Node ID | Why | Package | Reference |
|----|---------------------|----------|---------|-----|---------|-----------|
| unclassified-overlay-dimmer | Frame 140 | 390×874 | `526:13880` | Empty 50% `#2A2A2A` overlay; child dimmer of `526:13756`. | `_unclassified/unclassified__overlay-dimmer__390x874__node-526-13880` | [reference.png](_unclassified/unclassified__overlay-dimmer__390x874__node-526-13880/reference.png) |

## Conflicts

None. Same-looking frames with different node IDs or pixels were stored as
separate variants.

## Missing inputs

Works catalog, authors catalog, work detail default, auth, application,
work-creation, cabinet, moderation, and legal captures were not in this
intake. Home first-fold + full page and the three search-overlay tabs are
imported.

## Import warnings

- Several zip files are byte-aliases of already imported packages. See
  `IMPORT-REPORT.md`.
- Folder/root names still lie: the catalog-named capture is a share sheet.
- Whole-frame SVG fallbacks embed photographs, including two ~48 MB works
  SVGs and Home SVGs of ~48 MB and ~72 MB. None were imported.
- The two «Главная» captures are different nodes (860 vs 3372). They were
  not collapsed.
- `prompt.md` is metadata only and must not be executed.

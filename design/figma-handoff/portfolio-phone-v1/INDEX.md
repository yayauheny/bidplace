# portfolio-phone-v1 index

| ID | Original Figma name | Surface | State | Viewport | Node ID | Scope | Confidence | Package | Reference |
|----|---------------------|---------|-------|----------|---------|-------|------------|---------|-----------|
| creator-about-phone | Страница автора / Об авторе | creator | about | 390×1609 | `621:19475` | KEEP_FIRST_MVP | high | `screens/creator/creator__about__390x1609__node-621-19475` | [reference.png](screens/creator/creator__about__390x1609__node-621-19475/reference.png) |
| creator-share-sheet-phone | Каталог работ / идут торги / сделать ставку | creator | share-sheet | 390×874 | `526:13756` | KEEP_FIRST_MVP | medium | `screens/creator/creator__share-sheet__390x874__node-526-13756` | [reference.png](screens/creator/creator__share-sheet__390x874__node-526-13756/reference.png) |

Inside both creator packages the public `Архив` tab, cart, and like control are
present in Figma. Keep the pixels. First MVP rendering hides those chrome
slots (`HIDE_FOR_FIRST_MVP`). Share/QR stays in First MVP.

## Shared components

None imported as standalone component packages. Dock, chips, and icons live
inside the screen captures. Hugeicons names are in `nodes.json`.

## Foundations

None imported.

## Unclassified

| ID | Original Figma name | Viewport | Node ID | Why | Package | Reference |
|----|---------------------|----------|---------|-----|---------|-----------|
| unclassified-overlay-dimmer | Frame 140 | 390×874 | `526:13880` | Empty 50% `#2A2A2A` overlay; no screen text. Child dimmer of `526:13756`. | `_unclassified/unclassified__overlay-dimmer__390x874__node-526-13880` | [reference.png](_unclassified/unclassified__overlay-dimmer__390x874__node-526-13880/reference.png) |

## Conflicts

None. The three inputs have different node IDs and different reference pixels.

## Missing inputs

- Creator `Работы` default tab (`creator` / `works`) was not in the provided
  packages. The share-sheet capture still shows the about-tab underline
  (`526:13860` fill `#2A2A2A`).
- Home, search, works catalog, authors, work detail default, auth, application,
  work-creation, cabinet, moderation, and legal captures were not provided.

## Import warnings

- Folder `Каталог_работ___идут_торги___сделать_ставку.figmacapture` and root
  name «Каталог работ / идут торги / сделать ставку» do not match the visible
  PNG. Classification used the reference render and node tree.
- Whole-frame SVG fallbacks embed photographs and were not imported.
- `prompt.md` is stored as metadata only and must not be executed.
- Manifest `fileKey` / `sourceUrl` are null. Library source ID is the
  documented origin `NM63j9lwRMqpo2HvAiYNll`.

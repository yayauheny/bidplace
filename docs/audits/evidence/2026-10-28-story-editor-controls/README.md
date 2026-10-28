# Story editor controls — 2026-10-28

Status: **Partial**. Follow-up on `feature/photo-workflow` above `e4506b3f`.

PNG files in this folder are the original Playwright screenshots from the
2026-10-28 rerun. Viewport 390×874, `fullPage`, device scale 1. Chromium and
WebKit each wrote five frames. They are gitignored by
`docs/audits/**/evidence/**/*.png` and are added with `git add -f`. The
gitignore rule itself is unchanged. Older evidence folders were not replaced.

| File | What it shows |
| --- | --- |
| `*-photos-five-plus-add-390.png` | Five different accepted photos plus the add tile |
| `*-story-empty-390.png` | Step 3, empty story, «Пропустить» |
| `*-story-two-paragraphs-390.png` | Two paragraphs; ⋮ only on the selected block |
| `*-story-menu-open-390.png` | Open block menu, SVG gradient ring and divider |
| `*-story-heading-paragraph-390.png` | Heading «Заголовок», reference paragraph, «Закончить» |
| `*-toolbar.json` | Toolbar box and computed gradient paint |

## Figma → до → после

| | Figma | До | После |
| --- | --- | --- | --- |
| Text ⋮ | `4563:32795`, 43×43, on every block | 24×24 Web box. Native hit slop was short of 44×44. | User decision, variant A: ⋮ only on the selected block (accepted difference from Figma). Real 44×44 box, muted 42px glyph centered. Chromium and WebKit, mouse and touch: center and corners hit that button. The neighbor field does not take those points. Line-height 24/20 and the 6px gap stay. Native 44×44 is Needs verification on a device. |
| Menu paint | Gradient ring and 1×26 divider on `4563:33344` | Rect 134.5×41.5 with rx=ry=20.75 after the earlier ellipse fix. | `figmaButtonStrokeRadius` on the taller panel. Chromium and WebKit both measure 144.5×51.5 with rx=ry=25.75, so the ends are semicircles. Divider stays 1×26. |
| Delete | Compact icon, `destructiveInk` `#731A06` | Web box 34×34. | Real 44×44 `FigmaIconButton` box, 18px glyph centered. Measured 44×44 in Chromium and WebKit. Native size is Needs verification on a device. |
| Paragraph | Body copy | Paragraph used `subtitle` (tracking 0). | Paragraph is `bodySmall`, tracking −0.14. That tracking is the review decision. The intro stays `subtitle` at 0. Story ⋮ stroke stays 1.3. Photo buttons and icon-button defaults stay 1.6. |
| Toolbar at «Закончить» | `4563:32790`, 275×52 | Not measured against a fixed allowance. | Chromium and WebKit both 272.21875×53. The test allows exactly −2.78125 width and +1 height: three icons are 42px rather than 43px, padding is 4 rather than 4.5, and the 43px `compactIcon` row plus 8px padding and 1px+1px borders exceed minHeight 52. |

## Checks

- Chromium and WebKit: `story editor polish` and `keeps photo status geometry stable` passed.
- Current step is the existing label «Шаг 3 из 4». RN Web does not map `accessibilityState.selected` on `role=button` to `aria-selected`.
- Hit checks: active 44×44 target (mouse and touch), corners and center, click on an inactive block, Tab/Enter/Escape, move, delete, image description. Locators follow `data-block-key`.
- After a non-empty paragraph the label is «Закончить». Whitespace still shows «Пропустить». Focus/blur keeps computed font-size, weight, line-height, letter-spacing, wrapping, and height. The first field and menu-open position stay put.
- Browser zoom 200% was not run.
- Native iOS/Android was not run. `simctl` is not available. Needs verification on a device: tap ⋮ on adjacent single-line blocks, type in the right gutter, scroll across the control, and check that Android does not clip the 44×44 box.
- 1024/1440 exact story parity stays NEEDS-FIGMA. This folder is 390 only.
- Upload, save, drag-and-drop, and server file reuse were not changed. Session SHA-256 is not server reuse.

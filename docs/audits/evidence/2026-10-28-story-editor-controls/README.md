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
| `*-story-two-paragraphs-390.png` | Two paragraphs, separate ⋮ hit boxes |
| `*-story-menu-open-390.png` | Open block menu, SVG gradient ring and divider |
| `*-story-heading-paragraph-390.png` | Heading «Заголовок», reference paragraph, «Закончить» |
| `*-toolbar.json` | Toolbar box and computed gradient paint |

## Figma → до → после

| | Figma | До | После |
| --- | --- | --- | --- |
| Text ⋮ | `4563:32795`, 43×43, top −10 | 42×42, then a 20×20 box. The 42px circle overlapped the next block by 16px. | Web box 24×24 on a 20px line (pitch 26). Center and side midpoints hit that block; corners are not the neighbor. Native hit slop is 10px left/right (44px wide) and 1px vertically on this pitch (26px tall). Short of 44×44. Needs user agreement. |
| Menu paint | Gradient ring and 1×26 divider on `4563:33344` | `experimental_backgroundImage` computed as `none`. Rect 134.5×41.5 used rx=ry=31, which SVG clamps per axis into an ellipse. | `react-native-svg` `LinearGradient`, computed `url(#…)`. `figmaButtonStrokeRadius` sets both axes to 20.75, so the ends are semicircles. |
| Delete | Compact icon, `destructiveInk` `#731A06` | Custom 34×34 pressable, no hit slop. | `FigmaIconButton` `compact`, `tone="danger"`. Web box stays 34×34 (RN Web ignores hit slop). Native hit slop is `(44−34)/2`. The Web box is short of 44px and needs user agreement. |
| Paragraph | Body copy | Paragraph used `subtitle` (tracking 0). | Paragraph is `bodySmall`, tracking −0.14. That tracking is the review decision. The intro stays `subtitle` at 0. Story ⋮ stroke stays 1.3. Photo buttons and icon-button defaults stay 1.6. |
| Toolbar at «Закончить» | `4563:32790`, 275×52 | Not measured against a fixed allowance. | Chromium and WebKit both 272.21875×53. The test allows exactly −2.78125 width and +1 height: three icons are 42px rather than 43px, padding is 4 rather than 4.5, and the 43px `compactIcon` row plus 8px padding and 1px+1px borders exceed minHeight 52. |

## Checks

- Chromium and WebKit: `story editor polish` and `keeps photo status geometry stable` passed.
- Current step is the existing label «Шаг 3 из 4». RN Web does not map `accessibilityState.selected` on `role=button` to `aria-selected`.
- Hit checks: two paragraphs, heading plus paragraph, open menu, image description, and move up/down. Locators follow `data-block-key`.
- After a non-empty paragraph the label is «Закончить». Whitespace still shows «Пропустить». The first field, caret, and menu-open position stay put.
- Browser zoom 200% was not run. The font-size substitution is gone.
- Native iOS/Android was not run. `simctl` is not available in this environment.
- 1024/1440 exact story parity stays NEEDS-FIGMA. This folder is 390 only.
- Upload, save, drag-and-drop, and server file reuse were not changed. Session SHA-256 is not server reuse.

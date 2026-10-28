# Story editor controls — 2026-10-28

Status: **Partial**. Follow-up on `feature/photo-workflow` above `e4506b3f`.

PNG files in this folder are the original Playwright screenshots. Viewport
390×874, `fullPage`, device scale 1. Chromium and WebKit each wrote five
frames. Older evidence folders were not replaced.

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
| Text ⋮ | `4563:32795`, 43×43, top −10 | 42×42. A 20px line plus the 6px gap leaves a 16px overlap. The next block captured the lower part of the first control. | Square equals the block height, top 0, cap 42. A paragraph is 20px; a heading is 24px. Presses stay on that block. A 42/44px target does not fit this pitch. |
| Menu paint | Gradient ring and 1×26 divider on `4563:33344` | `experimental_backgroundImage` computed as `background-image: none` on this RN Web. | `react-native-svg` `LinearGradient`. Chromium and WebKit computed stroke and fill are `url(#…)`, not `none`. |
| Delete | Compact icon, `destructiveInk` `#731A06` | Custom 34×34 pressable, no hit slop. | `FigmaIconButton` `compact`, `tone="danger"`. Web DOM box stays 34px (RN Web ignores hitSlop). Native hit slop is still `(44−34)/2`. |
| Paragraph | Body copy | Paragraph used `subtitle` (tracking 0). | Paragraph is `bodySmall`, tracking −0.14. That tracking is the review decision. The intro stays `subtitle` at 0. Story ⋮ stroke stays 1.3. Photo buttons and icon-button defaults stay 1.6. |
| Toolbar at «Закончить» | `4563:32790`, 275×52 | Not measured in this pass. | Chromium and WebKit both 272.22×53. Width: three icons are 42px rather than 43px, padding is 4 rather than 4.5. Height: minHeight 52, used border 1px+1px, and the 43px `compactIcon` row plus 8px padding exceeds 52. |

## Checks

- Chromium and WebKit: `story editor polish` and `keeps photo status geometry stable` passed.
- Current step is the existing label «Шаг 3 из 4». RN Web does not map `accessibilityState.selected` on `role=button` to `aria-selected`.
- Hit checks: two paragraphs, heading plus paragraph, open menu, image description, and move up/down. Locators follow `data-block-key`.
- After a non-empty paragraph the label is «Закончить». Whitespace still shows «Пропустить». The first field, caret, and menu-open position stay put.
- Browser zoom 200% was not run. The font-size substitution is gone.
- Native iOS/Android was not run. `simctl` is not available in this environment.
- 1024/1440 exact story parity stays NEEDS-FIGMA. This folder is 390 only.
- Upload, save, drag-and-drop, and server file reuse were not changed. Session SHA-256 is not server reuse.

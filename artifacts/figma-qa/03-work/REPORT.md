# Work page — 2026-09-13

Status: `Partial` visual acceptance. Source nodes: `745:21209`, `745:20634`,
`621:19311`.

| Element | Figma source | Runtime result |
|---|---|---|
| Gallery | `745:21210`, `745:20635` | 390×520 (3:4), bottom radius 20; two-image arrows clamp at both ends and announce `Фото N из 2`. |
| Share | `745:21344` | 36 px control with 28 px glyph. |
| Tabs | `745:22501`, `745:22504`, `745:22507` | Shared 16/19 `FigmaTabs`; keyboard selection and URL state verified. |
| Related heading | `745:21259` | 20/24 presentation retained; semantic level corrected to `h2` below the Work `h1`. |
| Empty Story | RFC §11 | `seedAnna002?tab=story` removes the invalid query and opens Details without an empty tab. |

Spacing pass (same day, after `917b704`), DOM-measured at 390 on `seedAnna001`:
share capsule right edge 370 (Figma `621:19450` 370); author line 16/19 #565656
at y 590; chips 29 px tall, gap 6, row at 621 (Figma `745:21231` formula
558+24+8+19+12); tabs 725, panel 775 (+24), related heading 995 (+20 padding
+40 gap), cards 1039, «Смотреть все» 168×44 at 1411. Screens:
[top after](work-after-top-390.png), [related after](work-after-related-390.png).

Browser evidence:

- [two-image gallery, 390](work-multi-390.png)
- [no Story, 390](work-no-story-390.png)
- [centered phone column, 1024](work-1024.png)
- [centered phone column, 1440](work-1440.png)
- [missing Work, 390](work-404-390.png)
- [Figma history reference](../../../design/figma-handoff/portfolio-phone-v1/screens/work/work__history__390x2390__node-745-20634/reference.png)

Verified in the interactive browser: next/previous gallery bounds, accessible
`Фото 1/2` and `Фото 2/2` labels, 390/1024/1440 widths without document overflow,
optional Story removal, invalid deep-link normalization, Details → Delivery
tab selection with URL synchronization, 404 without retry, and related Works
excluding the current Work.

Remaining visual gates: controlled network-error and broken-gallery-media capture,
200% browser zoom, reduced-motion emulation, and physical screen-reader review.
These remain `Needs verification`; the whole Work screen is not claimed as fully
accepted. The screenshots use real preview data rather than the different Figma
artwork, so they do not establish pixel equality of crop or font antialiasing.
Browser Back/Forward tab restoration also remains open: `setParams` does not add
a history entry, while Expo Router `push` retains a second Product screen in the
stack. That stack growth was rejected rather than shipped as a workaround.

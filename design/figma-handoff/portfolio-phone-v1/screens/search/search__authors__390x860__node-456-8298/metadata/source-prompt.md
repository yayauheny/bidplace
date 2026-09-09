# Pixel-perfect Figma rebuild: Поиск пупап авторы

## Guidelines
- Reproduce this component with **pixel-perfect visual fidelity** using the JSON spec below
- Use semantic HTML elements
- The JSON contains the full node tree with layout, style, and children
- Preserve JSON child order as paint order unless the parent has `layout.itemReverseZIndex: true`; normally later siblings render above earlier siblings
- Preserve `style.fills` and `style.strokes` paint-stack order when present; convenience fields like `backgroundColor` and `imageFillHash` only summarize the first renderable paints
- Preserve `textStyleRanges` when present; node-level text style is only the common/default style
- Preserve `reactions` as the interaction contract; implement every trigger/action in order instead of inferring behavior from pixels or node names
- Preserve `prototype` scrolling, fixed-layer, and overlay settings; these behaviors cannot be recovered from the reference PNG
- Use `componentPropertyDefinitions` as the component's typed public API and `componentPropertyDetails` as the active instance values; do not coerce booleans to strings
- Preserve `annotations`, `componentPropertyReferences`, `variableBindings`, `explicitVariableModes`, and `referencedVariables` as developer-authored contracts; use the catalog's per-mode values and code syntax for prototype state
- `layout.mode`: horizontal → flex row, vertical → flex column
- `layout.wrap: wrap` → `flex-wrap: wrap`; preserve wrapped-track spacing/alignment
- `layout.mode: grid` → CSS Grid with exact tracks, gaps, anchors, and spans
- `layout.mode: none` → position children by `layout.x/y` relative to the parent
- `layout.layoutPositioning: absolute` → remove from parent flex flow and position by `layout.x/y`
- `layout.sizing`: hug → auto, fill → 100%/flex:1, fixed → explicit px
- Normalize the selected root frame to left: 0, top: 0; root `layout.x/y` is Figma canvas position
- Use `box-sizing: border-box` so width/height include padding and borders
- `style.variables` → use as CSS custom properties
- INSTANCE nodes → reusable sub-components, import or stub them

## Design Tokens
### Colors
- `#FFFFFF` (background)
- `#FFFFFF` (background)
- `#2A2A2A` (text)
- `#2A2A2A` (text)
- `#6F6F6F` (text)
- `#6F6F6F` (text)
- `#FFFFFF` (background), opacity: 0.6
- `#FFFFFF` (background), opacity: 0.6
- `#2A2A2A` (border)
- `#2A2A2A` (border)
- `#2A2A2A` → `var(--Black)` (text)
- `#F3F3F3` (background)
- `#FFFFFF` (border)
- `#F3F3F3` (background)
- `#FFFFFF` (border)
- `#292929` (background)
- `#292929` (background)
- `#FFFFFF` (text)
- `#FFFFFF` (text)
### Typography
- Inter 500 14px/18px, letter-spacing: -1%
- Inter 400 13px
- Inter 400 16px, letter-spacing: -1%
### Spacing & Radii
- Spacing scale: 2px, 4px, 6px, 8px, 10px, 12px, 14px
- Border radii: 80px, 100px, 200px

## Interaction Contract
Implement these Figma prototype settings and reactions explicitly. Preserve scrolling, fixed layers, overlay behavior, trigger/action order, and transitions; do not infer a different behavior from appearance or node names.
- `Поиск пупап авторы` (`456:8298`) prototype settings: `{"overflowDirection":"none","fixedChildIds":["456:8367"],"overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 164` (`456:8300`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 164 > Frame 166` (`456:8348`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159` (`456:8351`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 40` (`456:8352`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 40 > Frame 32` (`456:8354`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 158` (`456:8357`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 158 > Frame 32` (`456:8359`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 159` (`456:8362`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 159 > Frame 32` (`456:8364`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 183` (`456:8367`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 183 > Frame 157` (`456:8368`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 183 > Frame 157 > Frame 34` (`456:8369`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 183 > Frame 157 > Frame 34 > Frame 39` (`456:8370`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 183 > Frame 157 > Frame 34 > Frame 39 > search-01` (`456:8371`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 183 > Frame 157 > Frame 156` (`456:8375`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 183 > Frame 157 > Frame 156 > Frame 39` (`456:8376`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 183 > Frame 157 > Frame 156 > Frame 39 > x` (`456:8377`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 183 > Frame 77` (`456:8379`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 183 > Frame 77 > Кнопки` (`456:8380`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 183 > Frame 77 > Кнопки` (`456:8381`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поиск пупап авторы > Frame 183 > Frame 77 > Кнопки` (`456:8382`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`

## Component API Contract
Use the documented component properties as the public API. Preserve typed defaults, variants, and active values instead of coercing them from labels.
### Поиск пупап авторы > Frame 183 > Frame 157 > Frame 34 > Поиск (`456:8374`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поиск пупап авторы > Frame 183 > Frame 77 > Кнопки (`456:8380`)
- Active property values: `{"Icon":{"type":"INSTANCE_SWAP","value":"297:5597"},"Иконка правая":{"type":"BOOLEAN","value":false},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Без обводки"}}`
### Поиск пупап авторы > Frame 183 > Frame 77 > Кнопки (`456:8381`)
- Active property values: `{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5596"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}}`
### Поиск пупап авторы > Frame 183 > Frame 77 > Кнопки (`456:8382`)
- Active property values: `{"Icon":{"type":"INSTANCE_SWAP","value":"297:5596"},"Иконка правая":{"type":"BOOLEAN","value":false},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Без обводки"}}`

## Fidelity Risk Summary
- Estimated risk: high (39 visible nodes, max depth 6)
- Layout risks: 1 clipped containers, 1 boxes extend outside the root viewport, 39 nodes with constraints, 6 nodes with target aspect ratio
- Asset risks: 3 image fills, 3 image fills with crop/filter/opacity metadata, 4 vector-like nodes
- Paint risks: 5 blur effect nodes, 39 nodes with layer blend mode, 6 nodes with detailed stroke metadata

## Fidelity Warnings
These are extracted from the JSON and mark places where the convenience fields may not be enough.
- [critical] Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 40 > Frame 32: progressive-blur - Progressive blur has no exact CSS equivalent and requires the Figma-rendered fallback.
- [critical] Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 158 > Frame 32: progressive-blur - Progressive blur has no exact CSS equivalent and requires the Figma-rendered fallback.
- [critical] Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 159 > Frame 32: progressive-blur - Progressive blur has no exact CSS equivalent and requires the Figma-rendered fallback.

## Geometry Checklist
Use these absolute boxes after normalizing the selected root to left 0, top 0. They are derived from `layout.x/y` and help catch drift before styling polish.
- Root `layout.x/y` is the Figma canvas position; do not offset the rendered component by it.
### Bounding Boxes
- Поиск пупап авторы [FRAME]: left 0, top 0, width 390, height 860, signals: root/clips
- Поиск пупап авторы > Vector [VECTOR]: left 174, top -1196, width 42, height 32, signals: top-level/vector
- Поиск пупап авторы > Frame 164 [FRAME]: left 0, top 136, width 390, height 152, signals: top-level
- Поиск пупап авторы > Frame 164 > Frame 166 [FRAME]: left 0, top 136, width 390, height 152
- Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 [FRAME]: left 0, top 136, width 390, height 152
- Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 40 [FRAME]: left 8, top 136, width 374, height 44
- Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 40 > Rectangle 2 [RECTANGLE]: left 8, top 136, width 44, height 44, signals: image
- Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 40 > Frame 32 [FRAME]: left 52, top 136, width 330, height 44
- Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 40 > Frame 32 > @vex [TEXT]: left 64, top 140, width 312, height 18
- Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 40 > Frame 32 > Ищу логику в абсурде. Стираю грань между реальностью и сном [TEXT]: left 64, top 160, width 312, height 16
- Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 158 [FRAME]: left 8, top 190, width 374, height 44
- Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 158 > Rectangle 2 [RECTANGLE]: left 8, top 190, width 44, height 44, signals: image
- Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 158 > Frame 32 [FRAME]: left 52, top 190, width 330, height 44
- Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 158 > Frame 32 > @vex [TEXT]: left 64, top 194, width 312, height 18
- Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 158 > Frame 32 > Ищу логику в абсурде. Стираю грань между реальностью и сном [TEXT]: left 64, top 214, width 312, height 16
- Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 159 [FRAME]: left 8, top 244, width 374, height 44
- Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 159 > Rectangle 2 [RECTANGLE]: left 8, top 244, width 44, height 44, signals: image
- Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 159 > Frame 32 [FRAME]: left 52, top 244, width 330, height 44
- Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 159 > Frame 32 > @vex [TEXT]: left 64, top 248, width 312, height 18
- Поиск пупап авторы > Frame 164 > Frame 166 > Frame 159 > Frame 159 > Frame 32 > Ищу логику в абсурде. Стираю грань между реальностью и сном [TEXT]: left 64, top 268, width 312, height 16
- Поиск пупап авторы > Frame 183 [FRAME]: left 12, top 20, width 366, height 98, signals: top-level
- Поиск пупап авторы > Frame 183 > Frame 157 [FRAME]: left 12, top 20, width 366, height 52
- Поиск пупап авторы > Frame 183 > Frame 157 > Frame 34 [FRAME]: left 12, top 20, width 302, height 52
- Поиск пупап авторы > Frame 183 > Frame 157 > Frame 34 > Frame 39 [FRAME]: left 20, top 28, width 36, height 36
- Поиск пупап авторы > Frame 183 > Frame 157 > Frame 34 > Frame 39 > search-01 [FRAME]: left 26, top 34, width 24, height 24
- Поиск пупап авторы > Frame 183 > Frame 157 > Frame 34 > Frame 39 > search-01 > Vector [VECTOR]: left 43, top 51, width 4, height 4, signals: vector
- Поиск пупап авторы > Frame 183 > Frame 157 > Frame 34 > Frame 39 > search-01 > Vector [VECTOR]: left 29, top 37, width 16, height 16, signals: vector
- Поиск пупап авторы > Frame 183 > Frame 157 > Frame 34 > Поиск [TEXT]: left 64, top 36.5, width 48, height 19
- Поиск пупап авторы > Frame 183 > Frame 157 > Frame 156 [FRAME]: left 326, top 20, width 52, height 52
- Поиск пупап авторы > Frame 183 > Frame 157 > Frame 156 > Frame 39 [FRAME]: left 334, top 28, width 36, height 36
- Поиск пупап авторы > Frame 183 > Frame 157 > Frame 156 > Frame 39 > x [FRAME]: left 340, top 34, width 24, height 24
- Поиск пупап авторы > Frame 183 > Frame 157 > Frame 156 > Frame 39 > x > Vector [VECTOR]: left 346, top 40, width 12, height 12, signals: vector
- Поиск пупап авторы > Frame 183 > Frame 77 [FRAME]: left 12, top 80, width 366, height 38
- Поиск пупап авторы > Frame 183 > Frame 77 > Кнопки [INSTANCE]: left 12, top 80, width 114, height 38, signals: component
- Поиск пупап авторы > Frame 183 > Frame 77 > Кнопки > Кнопка [TEXT]: left 33.5, top 89, width 71, height 20
- Поиск пупап авторы > Frame 183 > Frame 77 > Кнопки [INSTANCE]: left 138, top 80, width 114, height 38, signals: component
- Поиск пупап авторы > Frame 183 > Frame 77 > Кнопки > Кнопка [TEXT]: left 169, top 89, width 52, height 20
- Поиск пупап авторы > Frame 183 > Frame 77 > Кнопки [INSTANCE]: left 264, top 80, width 114, height 38, signals: component
- Поиск пупап авторы > Frame 183 > Frame 77 > Кнопки > Кнопка [TEXT]: left 295.5, top 89, width 51, height 20

## Assets
Image files included with this spec — use as `<img>` or CSS `background-image`:
- `Frame_40_Rectangle_2.png` → Rectangle 2 (44×44, crop, scaling 0.5, transform [[1,0,0],[0,0.67,-0.01]])
- `Frame_158_Rectangle_2.png` → Rectangle 2 (44×44, fill, scaling 0.5, transform [[1,0,0],[0,1,0]])
- `Frame_159_Rectangle_2.png` → Rectangle 2 (44×44, fill, scaling 0.5, transform [[1,0,0],[0,1,0]])

## Pixel Perfect Template
You are rebuilding this Figma frame for an exact visual match. Treat the JSON as geometry/style data and the reference image/assets as visual evidence.

### Required Inputs
- JSON component structure below.
- If a whole-frame reference image is supplied separately, use it as the visual source of truth.
- Use every listed exported image file exactly; if any required asset is missing, stop and ask for it.

### Render Target
- Build one exact 390×860 frame.
- Set `html, body { margin: 0; }` and global `box-sizing: border-box`.
- Normalize the selected root frame to `left: 0; top: 0`; root `layout.x/y` is only Figma canvas position.

### Verification Loop
1. Implement the frame at the exact target size.
2. Capture a lossless PNG screenshot at that same size; do not use JPEG/WebP compression.
3. Compare it against the reference image; give the screenshot to the user for Figma to Prompt's built-in **Verify AI screenshot** checker.
4. If the checker reports a non-zero diff, download its correction ZIP and use reference.png, candidate.png, visual-diff.png, and verification.json to fix position, size, color, typography, image crop, vector geometry, and z-order.
5. Repeat until the screenshot is visually indistinguishable.

Do not approximate missing images, icons, logos, or text. If a required path or asset cannot be loaded, stop and ask for the correct input.

## Implementation Checks
- Build against one exact 390×860 viewport with `html, body { margin: 0; }` and global `box-sizing: border-box`.
- Screenshot comparison against the reference render is required; do not declare completion from code inspection alone.
- For text, set explicit `font-size`, `font-weight`, `line-height`, and CSS `letter-spacing`; convert percent letter spacing to px from the font size.
- For mixed text, use `textStyleRanges` to split spans and preserve range-level fills, styles, links, and paragraph/list metadata.
- For `layout.mode: none`, position children from their `layout.x/y` offsets relative to the parent.
- `layout.wrap: wrap` → `flex-wrap: wrap`; use `counterAxisSpacing` as the wrapped-track gap and preserve `counterAxisAlignContent`.
- `layout.mode: grid` → CSS Grid; map row/column counts, gaps, track sizes, anchors, spans, and `gridChildHorizontalAlign/gridChildVerticalAlign` exactly.
- Apply `layout.minWidth/maxWidth/minHeight/maxHeight` as CSS size bounds without replacing the extracted fixed target size.
- Preserve `layout.relativeTransform` for rotation/skew; use `layout.x/y` as the containing-parent offset and avoid applying translation twice.
- `layout.renderBounds` is the effect/stroke-inclusive box relative to the regular node box; use its offset and size when positioning a rendered fallback or checking visual overflow.
- For `layout.layoutPositioning: absolute`, remove that node from the parent flex flow and position it by `layout.x/y` even when the parent uses auto layout.
- `layout.itemReverseZIndex: true` reverses sibling paint order; otherwise later JSON siblings paint above earlier siblings.
- Preserve `style.textAlignVertical` inside fixed text boxes and map `style.textAutoResize` to wrapping/intrinsic sizing behavior.
- `style.textTruncation: ending` requires an ellipsis; combine it with `style.maxLines` using deterministic line clamping.
- Preserve `style.textDecorationStyle`, offset, thickness, color, and skip-ink behavior; a plain underline is not equivalent to a wavy or dotted decoration.
- Preserve the exact font face from `style.fontStyleName`, map `style.openTypeFeatures` to `font-feature-settings`, and honor paragraph/list/hanging/leading-trim metadata.
- Preserve `prototype.overflowDirection`, `fixedChildIds`, and overlay settings as runtime behavior; fixed layers stay above scrolling content.
- Treat `annotations`, `componentPropertyReferences`, `variableBindings`, `explicitVariableModes`, and `referencedVariables` as developer-authored implementation constraints.
- `style.cornerSmoothing` is a Figma squircle, not a plain CSS rounded rectangle; use the bundled fallback or exact superellipse geometry when required.
- Rebuild partial ellipses and donut shapes from `arcData` instead of rendering a full oval.
- Preserve paint metadata such as fill opacity, image crop transforms, image filters, and gradient transforms when present in `style`.
- `style.advancedEffects` records Figma noise, texture, and glass parameters. Treat the node-matched rendered fallback as authoritative because plain CSS cannot reproduce these effects exactly.
- Any critical `unsupported-fill-*` or `unsupported-effect-*` warning means the known node contains a visual feature the native implementation must not silently drop.
- Multiple visible fills/strokes and Figma linear-burn/linear-dodge compositing are critical fallback cases; browser background layers or blend modes are not accepted as pixel-equivalent evidence.
- Preserve stroke metadata such as stroke alignment, caps, joins, dash pattern, miter limit, and side-specific stroke weights when present in `style`.
- Render exact SVG paths from `vectorPaths`, `fillGeometry`, or `strokeGeometry` when present; do not replace them with approximate icons.
- For `TEXT_PATH`, place the exact text on `vectorPaths` beginning at `textPathStartData`; use the bundled rendered fallback if browser text-path metrics differ.
- For `TRANSFORM_GROUP`, reproduce every `transformModifiers` repeat in order, including repeat type, count, axis, offset, and whether the offset uses px or relative units.
- Give the final exact-size screenshot to the user so they can run Figma to Prompt's built-in **Verify AI screenshot** checker.

## Tree Outline
```
Поиск пупап авторы (FRAME, fixed×fixed)
├── Vector (VECTOR, fixed×fixed)
├── Frame 164 (FRAME, vertical, fixed×hug)
│   └── Frame 166 (FRAME, vertical, fill×hug)
│       └── Frame 159 (FRAME, vertical, fill×hug)
│           ├── Frame 40 (FRAME, horizontal, fill×hug)
│           │   ├── Rectangle 2 (RECTANGLE, fixed×fixed)
│           │   └── Frame 32 (FRAME, vertical, fill×hug)
│           │       ├── @vex (TEXT, fill×hug) "@vex"
│           │       └── Ищу логику в абсурде. Стираю грань между реальностью и сном (TEXT, fill×hug) "Ищу логику в абсурде. Стираю грань между…"
│           ├── Frame 158 (FRAME, horizontal, fill×hug)
│           │   ├── Rectangle 2 (RECTANGLE, fixed×fixed)
│           │   └── Frame 32 (FRAME, vertical, fill×hug)
│           │       ├── @vex (TEXT, fill×hug) "@vex"
│           │       └── Ищу логику в абсурде. Стираю грань между реальностью и сном (TEXT, fill×hug) "Ищу логику в абсурде. Стираю грань между…"
│           └── Frame 159 (FRAME, horizontal, fill×hug)
│               ├── Rectangle 2 (RECTANGLE, fixed×fixed)
│               └── Frame 32 (FRAME, vertical, fill×hug)
│                   ├── @vex (TEXT, fill×hug) "@vex"
│                   └── Ищу логику в абсурде. Стираю грань между реальностью и сном (TEXT, fill×hug) "Ищу логику в абсурде. Стираю грань между…"
└── Frame 183 (FRAME, vertical, fixed×hug)
    ├── Frame 157 (FRAME, horizontal, fill×hug)
    │   ├── Frame 34 (FRAME, horizontal, fill×hug)
    │   │   ├── Frame 39 (FRAME, horizontal, hug×hug)
    │   │   │   └── search-01 (FRAME, fixed×fixed)
    │   │   │       ├── Vector (VECTOR, fixed×fixed)
    │   │   │       └── Vector (VECTOR, fixed×fixed)
    │   │   └── Поиск (TEXT, hug×hug) "Поиск"
    │   └── Frame 156 (FRAME, horizontal, hug×hug)
    │       └── Frame 39 (FRAME, horizontal, hug×hug)
    │           └── x (FRAME, fixed×fixed)
    │               └── Vector (VECTOR, fixed×fixed)
    └── Frame 77 (FRAME, horizontal, fill×hug)
        ├── Кнопки (INSTANCE, horizontal, fill×hug)
        │   └── Кнопка (TEXT, hug×hug) "Категории"
        ├── Кнопки (INSTANCE, horizontal, fill×hug)
        │   └── Кнопка (TEXT, hug×hug) "Авторы"
        └── Кнопки (INSTANCE, horizontal, fill×hug)
            └── Кнопка (TEXT, hug×hug) "Работы"
```

## Component Structure
```
{"id":"456:8298","name":"Поиск пупап авторы","type":"FRAME","layout":{"width":390,"height":860,"x":1833,"y":109,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"overflow":"hidden","mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"},"children":[{"id":"456:8299","name":"Vector","type":"VECTOR","layout":{"width":42,"height":32}},{"id":"456:8300","name":"Frame 164","type":"FRAME","layout":{"width":390,"height":152,"y":136,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":14,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"456:8348","name":"Frame 166","type":"FRAME","layout":{"width":390,"height":152,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"456:8351","name":"Frame 159","type":"FRAME","layout":{"width":390,"height":152,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":10,"strokesIncludedInLayout":true,"padding":{"top":0,"right":8,"bottom":0,"left":8},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"456:8352","name":"Frame 40","type":"FRAME","layout":{"width":374,"height":44,"x":8,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":0,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"456:8353","name":"Rectangle 2","type":"RECTANGLE","layout":{"width":44,"height":44,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":84,"y":84},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"image","sourceType":"IMAGE","imageHash":"e877cde9ee970b0686af6c8c1d61db7758a6938a","scaleMode":"crop","transform":[[1,0,0],[0,0.67,-0.01]],"scalingFactor":0.5}],"borderRadius":100,"imageFillHash":"e877cde9ee970b0686af6c8c1d61db7758a6938a","imageFillScaleMode":"crop","imageFillTransform":[[1,0,0],[0,0.67,-0.01]],"imageFillScalingFactor":0.5}},{"id":"456:8354","name":"Frame 32","type":"FRAME","layout":{"width":330,"height":44,"x":44,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":2,"strokesIncludedInLayout":true,"padding":{"top":4,"right":6,"bottom":4,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","blurEffects":[{"type":"background","radius":60,"blurType":"progressive","startRadius":0,"startOffset":{"x":0.5,"y":0},"endOffset":{"x":0.5,"y":1}}]},"children":[{"id":"456:8355","name":"@vex","type":"TEXT","text":"@vex","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":14,"fontWeight":500,"lineHeight":18,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"ending","maxLines":1,"leadingTrim":"none"},"layout":{"width":312,"height":18,"x":12,"y":4,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"456:8356","name":"Ищу логику в абсурде. Стираю грань между реальностью и сном","type":"TEXT","text":"Ищу логику в абсурде. Стираю грань между реальностью и сном","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#6F6F6F"}],"color":"#6F6F6F","fontFamily":"Inter","fontStyleName":"Regular","fontSize":13,"fontWeight":400,"textAlignVertical":"top","textAutoResize":"height","textTruncation":"ending","maxLines":1,"leadingTrim":"none"},"layout":{"width":312,"height":16,"x":12,"y":24,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}],"fidelityWarnings":[{"code":"progressive-blur","severity":"critical","message":"Progressive blur has no exact CSS equivalent and requires the Figma-rendered fallback."}]}]},{"id":"456:8357","name":"Frame 158","type":"FRAME","layout":{"width":374,"height":44,"x":8,"y":54,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":0,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"456:8358","name":"Rectangle 2","type":"RECTANGLE","layout":{"width":44,"height":44,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":84,"y":84},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"image","sourceType":"IMAGE","imageHash":"5a44c93911ad5574cc6786b8b16d22043f2e7c5d","scaleMode":"fill","transform":[[1,0,0],[0,1,0]],"scalingFactor":0.5}],"borderRadius":100,"imageFillHash":"5a44c93911ad5574cc6786b8b16d22043f2e7c5d","imageFillScaleMode":"fill","imageFillTransform":[[1,0,0],[0,1,0]],"imageFillScalingFactor":0.5}},{"id":"456:8359","name":"Frame 32","type":"FRAME","layout":{"width":330,"height":44,"x":44,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":2,"strokesIncludedInLayout":true,"padding":{"top":4,"right":6,"bottom":4,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","blurEffects":[{"type":"background","radius":60,"blurType":"progressive","startRadius":0,"startOffset":{"x":0.5,"y":0},"endOffset":{"x":0.5,"y":1}}]},"children":[{"id":"456:8360","name":"@vex","type":"TEXT","text":"@vex","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":14,"fontWeight":500,"lineHeight":18,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"ending","maxLines":1,"leadingTrim":"none"},"layout":{"width":312,"height":18,"x":12,"y":4,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"456:8361","name":"Ищу логику в абсурде. Стираю грань между реальностью и сном","type":"TEXT","text":"Ищу логику в абсурде. Стираю грань между реальностью и сном","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#6F6F6F"}],"color":"#6F6F6F","fontFamily":"Inter","fontStyleName":"Regular","fontSize":13,"fontWeight":400,"textAlignVertical":"top","textAutoResize":"height","textTruncation":"ending","maxLines":1,"leadingTrim":"none"},"layout":{"width":312,"height":16,"x":12,"y":24,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}],"fidelityWarnings":[{"code":"progressive-blur","severity":"critical","message":"Progressive blur has no exact CSS equivalent and requires the Figma-rendered fallback."}]}]},{"id":"456:8362","name":"Frame 159","type":"FRAME","layout":{"width":374,"height":44,"x":8,"y":108,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":0,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"456:8363","name":"Rectangle 2","type":"RECTANGLE","layout":{"width":44,"height":44,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":84,"y":84},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"image","sourceType":"IMAGE","imageHash":"cc2525a15d7ea240dc2212cf059d1e1f630c6e0a","scaleMode":"fill","transform":[[1,0,0],[0,1,0]],"scalingFactor":0.5}],"borderRadius":100,"imageFillHash":"cc2525a15d7ea240dc2212cf059d1e1f630c6e0a","imageFillScaleMode":"fill","imageFillTransform":[[1,0,0],[0,1,0]],"imageFillScalingFactor":0.5}},{"id":"456:8364","name":"Frame 32","type":"FRAME","layout":{"width":330,"height":44,"x":44,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":2,"strokesIncludedInLayout":true,"padding":{"top":4,"right":6,"bottom":4,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","blurEffects":[{"type":"background","radius":60,"blurType":"progressive","startRadius":0,"startOffset":{"x":0.5,"y":0},"endOffset":{"x":0.5,"y":1}}]},"children":[{"id":"456:8365","name":"@vex","type":"TEXT","text":"@vex","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":14,"fontWeight":500,"lineHeight":18,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"ending","maxLines":1,"leadingTrim":"none"},"layout":{"width":312,"height":18,"x":12,"y":4,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"456:8366","name":"Ищу логику в абсурде. Стираю грань между реальностью и сном","type":"TEXT","text":"Ищу логику в абсурде. Стираю грань между реальностью и сном","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#6F6F6F"}],"color":"#6F6F6F","fontFamily":"Inter","fontStyleName":"Regular","fontSize":13,"fontWeight":400,"textAlignVertical":"top","textAutoResize":"height","textTruncation":"ending","maxLines":1,"leadingTrim":"none"},"layout":{"width":312,"height":16,"x":12,"y":24,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}],"fidelityWarnings":[{"code":"progressive-blur","severity":"critical","message":"Progressive blur has no exact CSS equivalent and requires the Figma-rendered fallback."}]}]}]}]}]},{"id":"456:8367","name":"Frame 183","type":"FRAME","layout":{"width":366,"height":98,"x":12,"y":20,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"456:8368","name":"Frame 157","type":"FRAME","layout":{"width":366,"height":52,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"456:8369","name":"Frame 34","type":"FRAME","layout":{"width":302,"height":52,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":8,"strokesIncludedInLayout":true,"padding":{"top":8,"right":8,"bottom":8,"left":8},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.6,"color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","backgroundOpacity":0.6,"strokeStyleName":"White border block","borderRadius":200,"strokes":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","gradientType":"linear","css":"linear-gradient(#DEDEDE 0%, #F3F3F3 100%)","gradientStops":[{"color":"#DEDEDE","position":0},{"color":"#F3F3F3","position":1}],"transform":[[0.89,0.11,0],[-0.11,0.11,0.5]]}],"blurEffects":[{"type":"background","radius":12,"blurType":"normal"}]},"children":[{"id":"456:8370","name":"Frame 39","type":"FRAME","layout":{"width":36,"height":36,"x":8,"y":8,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":6,"right":6,"bottom":6,"left":6},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"456:8371","name":"search-01","type":"FRAME","layout":{"width":24,"height":24,"x":6,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"456:8372","name":"Vector","type":"VECTOR","layout":{"width":4,"height":4}},{"id":"456:8373","name":"Vector","type":"VECTOR","layout":{"width":16,"height":16}}]}]},{"id":"456:8374","name":"Поиск","type":"TEXT","text":"Поиск","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":48,"height":19,"x":52,"y":16.5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"456:8375","name":"Frame 156","type":"FRAME","layout":{"width":52,"height":52,"x":314,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":8,"strokesIncludedInLayout":true,"padding":{"top":8,"right":8,"bottom":8,"left":8},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.6,"color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","backgroundOpacity":0.6,"strokeStyleName":"White border block","borderRadius":200,"strokes":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","gradientType":"linear","css":"linear-gradient(#DEDEDE 0%, #F3F3F3 100%)","gradientStops":[{"color":"#DEDEDE","position":0},{"color":"#F3F3F3","position":1}],"transform":[[0.89,0.11,0],[-0.11,0.11,0.5]]}],"blurEffects":[{"type":"background","radius":12,"blurType":"normal"}]},"children":[{"id":"456:8376","name":"Frame 39","type":"FRAME","layout":{"width":36,"height":36,"x":8,"y":8,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":6,"right":6,"bottom":6,"left":6},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"456:8377","name":"x","type":"FRAME","layout":{"width":24,"height":24,"x":6,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"456:8378","name":"Vector","type":"VECTOR","layout":{"width":12,"height":12}}]}]}]}]},{"id":"456:8379","name":"Frame 77","type":"FRAME","layout":{"width":366,"height":38,"y":60,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"456:8380","name":"Кнопки","type":"INSTANCE","layout":{"width":114,"height":38,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":8,"right":10,"bottom":8,"left":10},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#F3F3F3"}],"backgroundColor":"#F3F3F3","borderRadius":80,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"borderColor":"#FFFFFF","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Icon":"297:5597","Иконка правая":"false","Иконка левая":"false","Обычная":"Без обводки"},"componentPropertyDetails":{"Icon":{"type":"INSTANCE_SWAP","value":"297:5597"},"Иконка правая":{"type":"BOOLEAN","value":false},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Без обводки"}},"children":[{"id":"I456:8380;278:4581","name":"Кнопка","type":"TEXT","text":"Категории","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":14,"fontWeight":500,"lineHeight":20,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":71,"height":20,"x":21.5,"y":9,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"456:8381","name":"Кнопки","type":"INSTANCE","layout":{"width":114,"height":38,"x":126,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":8,"right":10,"bottom":8,"left":10},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#292929"}],"backgroundColor":"#292929","borderRadius":80,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Иконка правая":"false","Icon":"297:5596","Иконка левая":"false","Обычная":"Черная"},"componentPropertyDetails":{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5596"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}},"children":[{"id":"I456:8381;278:4690","name":"Кнопка","type":"TEXT","text":"Авторы","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Inter","fontStyleName":"Medium","fontSize":14,"fontWeight":500,"lineHeight":20,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":52,"height":20,"x":31,"y":9,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"456:8382","name":"Кнопки","type":"INSTANCE","layout":{"width":114,"height":38,"x":252,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":8,"right":10,"bottom":8,"left":10},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#F3F3F3"}],"backgroundColor":"#F3F3F3","borderRadius":80,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"borderColor":"#FFFFFF","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Icon":"297:5596","Иконка правая":"false","Иконка левая":"false","Обычная":"Без обводки"},"componentPropertyDetails":{"Icon":{"type":"INSTANCE_SWAP","value":"297:5596"},"Иконка правая":{"type":"BOOLEAN","value":false},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Без обводки"}},"children":[{"id":"I456:8382;278:4581","name":"Кнопка","type":"TEXT","text":"Работы","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":14,"fontWeight":500,"lineHeight":20,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":51,"height":20,"x":31.5,"y":9,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}]}],"prototype":{"overflowDirection":"none","fixedChildIds":["456:8367"],"overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}}
```

## Capture Bundle Inputs (Authoritative)
- Keep this bundle intact. Resolve every path relative to the bundle root.
- Review `mcp/figma-locator.json` before calling a Figma MCP tool. Prefer each node's exact `locator.sourceUrl`; otherwise pass its `locator.fileKey` and colon-form `locator.nodeId` through the MCP tool's documented inputs.
- Locator data is for discovery or refresh only. An MCP re-capture creates a new immutable capture; it never replaces the evidence in this bundle.
- This capture has no Figma file key, so MCP cannot reopen its source; rely on the bundled evidence.
- Review `fidelity/coverage.json` before implementation. Every listed node must use its exact pixel fallback or an equivalent implementation proven by the final RGBA comparison.
- Use the reference renders below as the visual source of truth and iterate with screenshot comparison.
- Authoritative target: `references/001-456_8298.png` at exactly 390×860 CSS pixels. Do not infer the viewport from Figma's fractional geometry or another asset.
- Reference determinism gate passed: two consecutive Figma renders were RGBA-identical. If a later reference becomes unstable, stop exact verification until the changing content is frozen.
- Provide the final exact-size screenshot so the user can load it into Figma to Prompt's built-in `Verify AI screenshot` checker.
- Reference render: `references/001-456_8298.png`
- Match design assets by their manifest `nodeId`; bundled paths override any generated filename elsewhere in this prompt.
- Design asset for node `456:8353`: `assets/001-456_8353.png`
- Design asset for node `456:8358`: `assets/002-456_8358.png`
- Design asset for node `456:8363`: `assets/003-456_8363.png`
- Rendered fallbacks are Figma-authored precision assets. Use the PNG variant for the exact 1× target; use the outlined, unsimplified SVG variant when the node must scale. Preserve semantics or interactions with an accessible overlay when needed.
- Rendered fallback (pixel) for node `456:8298` (context-dependent-effect): `fallbacks/001-456_8298.png`
- Rendered fallback (vector) for node `456:8298` (context-dependent-effect): `fallbacks/001-456_8298.svg`

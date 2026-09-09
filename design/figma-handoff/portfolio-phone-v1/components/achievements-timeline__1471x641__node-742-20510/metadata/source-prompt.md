# Pixel-perfect Figma rebuild: Frame 219

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
- `#565656` (background)
- `#565656` (background)
- `#2A2A2A` → `var(--Black)` (text)
- `#2A2A2A` → `var(--Black)` (text)
- `#F3F3F3` (background)
- `#F3F3F3` (background)
### Typography
- Inter 500 18px/24px, letter-spacing: -3%
- Inter 400 14px/20px, letter-spacing: -1%
- Inter 500 20px/28px, letter-spacing: -1%
### Spacing & Radii
- Spacing scale: 3px, 4px, 10px, 12px, 16px
- Border radii: 6px, 20px, 21px

## Interaction Contract
Implement these Figma prototype settings and reactions explicitly. Preserve scrolling, fixed layers, overlay behavior, trigger/action order, and transitions; do not infer a different behavior from appearance or node names.
- `Frame 219` (`742:20510`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215` (`742:20499`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 214` (`742:20500`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 214 > Frame 225` (`744:20575`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 214 > Frame 225 > Frame 222` (`744:20553`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 214 > Frame 225 > Frame 222 > Frame 221` (`744:20554`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 214 > Frame 216` (`742:20502`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 213` (`742:20505`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 213 > Frame 224` (`744:20574`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 213 > Frame 224 > Frame 222` (`744:20558`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 213 > Frame 224 > Frame 222 > Frame 221` (`744:20559`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 213 > Frame 217` (`742:20507`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 216` (`742:20517`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 216 > Frame 223` (`744:20573`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 216 > Frame 223 > Frame 222` (`744:20563`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 216 > Frame 223 > Frame 222 > Frame 221` (`744:20564`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 216 > Frame 217` (`742:20519`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 215` (`742:20511`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 215 > Frame 226` (`744:20576`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 215 > Frame 226 > Frame 222` (`744:20568`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 215 > Frame 226 > Frame 222 > Frame 221` (`744:20569`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 215 > Frame 217` (`742:20513`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 219 > Frame 215 > Frame 215 > Frame 217 > Frame 220` (`742:20536`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`

## Component API Contract
Use the documented component properties as the public API. Preserve typed defaults, variants, and active values instead of coercing them from labels.
### Frame 219 > Frame 215 > Frame 214 > Frame 225 > 2026 (`742:20501`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Frame 219 > Frame 215 > Frame 214 > Frame 216 > Картина "Алиса в Зазеркалье" — современное произведение, представленное на выставке Кунибала Ректора, посвящённой футуристическим темам и времени. (`742:20504`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Frame 219 > Frame 215 > Frame 213 > Frame 224 > 2026 (`742:20523`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Frame 219 > Frame 215 > Frame 213 > Frame 217 > Картина "Алиса в Зазеркалье" — современное произведение, представленное на выставке Кунибала Ректора, посвящённой футуристическим темам и времени. (`742:20509`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Frame 219 > Frame 215 > Frame 216 > Frame 223 > 2026 (`742:20527`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Frame 219 > Frame 215 > Frame 216 > Frame 217 > Картина "Алиса в Зазеркалье" — современное произведение, представленное на выставке Кунибала Ректора, посвящённой футуристическим темам и времени. (`742:20521`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Frame 219 > Frame 215 > Frame 215 > Frame 226 > 2016 (`742:20525`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Frame 219 > Frame 215 > Frame 215 > Frame 217 > Frame 220 > Закончил ВУЗ технико-прикладнических наук (`742:20515`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`

## Fidelity Risk Summary
- Estimated risk: high (42 visible nodes, max depth 6)
- Layout risks: 1 clipped containers, 42 nodes with constraints, 6 nodes with target aspect ratio
- Asset risks: 3 image fills, 3 image fills with crop/filter/opacity metadata
- Paint risks: 42 nodes with layer blend mode

## Geometry Checklist
Use these absolute boxes after normalizing the selected root to left 0, top 0. They are derived from `layout.x/y` and help catch drift before styling polish.
- Root `layout.x/y` is the Figma canvas position; do not offset the rendered component by it.
### Bounding Boxes
- Frame 219 [FRAME]: left 0, top 0, width 1471, height 641, signals: root/clips
- Frame 219 > Frame 215 [FRAME]: left 40, top 60, width 1112, height 520.67, signals: top-level
- Frame 219 > Frame 215 > Frame 214 [FRAME]: left 40, top 60, width 266, height 520.67
- Frame 219 > Frame 215 > Frame 214 > Frame 225 [FRAME]: left 40, top 60, width 266, height 42
- Frame 219 > Frame 215 > Frame 214 > Frame 225 > Frame 222 [FRAME]: left 40, top 60, width 266, height 14
- Frame 219 > Frame 215 > Frame 214 > Frame 225 > Frame 222 > Frame 221 [FRAME]: left 40, top 60, width 14, height 14
- Frame 219 > Frame 215 > Frame 214 > Frame 225 > Frame 222 > Frame 221 > Rectangle 21 [RECTANGLE]: left 42, top 62, width 10, height 10
- Frame 219 > Frame 215 > Frame 214 > Frame 225 > Frame 222 > Rectangle 23 [RECTANGLE]: left 54, top 66, width 252, height 2
- Frame 219 > Frame 215 > Frame 214 > Frame 225 > 2026 [TEXT]: left 40, top 78, width 266, height 24
- Frame 219 > Frame 215 > Frame 214 > Frame 216 [FRAME]: left 40, top 114, width 266, height 466.67
- Frame 219 > Frame 215 > Frame 214 > Frame 216 > Rectangle 14 [RECTANGLE]: left 40, top 114, width 266, height 354.67, signals: image
- Frame 219 > Frame 215 > Frame 214 > Frame 216 > Картина "Алиса в Зазеркалье" — современное произведение, представленн... [TEXT]: left 40, top 480.67, width 266, height 100
- Frame 219 > Frame 215 > Frame 213 [FRAME]: left 322, top 60, width 266, height 520.67
- Frame 219 > Frame 215 > Frame 213 > Frame 224 [FRAME]: left 322, top 60, width 266, height 42
- Frame 219 > Frame 215 > Frame 213 > Frame 224 > Frame 222 [FRAME]: left 322, top 60, width 266, height 14
- Frame 219 > Frame 215 > Frame 213 > Frame 224 > Frame 222 > Frame 221 [FRAME]: left 322, top 60, width 14, height 14
- Frame 219 > Frame 215 > Frame 213 > Frame 224 > Frame 222 > Frame 221 > Rectangle 21 [RECTANGLE]: left 324, top 62, width 10, height 10
- Frame 219 > Frame 215 > Frame 213 > Frame 224 > Frame 222 > Rectangle 23 [RECTANGLE]: left 336, top 66, width 252, height 2
- Frame 219 > Frame 215 > Frame 213 > Frame 224 > 2026 [TEXT]: left 322, top 78, width 266, height 24
- Frame 219 > Frame 215 > Frame 213 > Frame 217 [FRAME]: left 322, top 114, width 266, height 466.67
- Frame 219 > Frame 215 > Frame 213 > Frame 217 > Rectangle 14 [RECTANGLE]: left 322, top 114, width 266, height 354.67, signals: image
- Frame 219 > Frame 215 > Frame 213 > Frame 217 > Картина "Алиса в Зазеркалье" — современное произведение, представленн... [TEXT]: left 322, top 480.67, width 266, height 100
- Frame 219 > Frame 215 > Frame 216 [FRAME]: left 604, top 60, width 266, height 520.67
- Frame 219 > Frame 215 > Frame 216 > Frame 223 [FRAME]: left 604, top 60, width 266, height 42
- Frame 219 > Frame 215 > Frame 216 > Frame 223 > Frame 222 [FRAME]: left 604, top 60, width 266, height 14
- Frame 219 > Frame 215 > Frame 216 > Frame 223 > Frame 222 > Frame 221 [FRAME]: left 604, top 60, width 14, height 14
- Frame 219 > Frame 215 > Frame 216 > Frame 223 > Frame 222 > Frame 221 > Rectangle 21 [RECTANGLE]: left 606, top 62, width 10, height 10
- Frame 219 > Frame 215 > Frame 216 > Frame 223 > Frame 222 > Rectangle 23 [RECTANGLE]: left 618, top 66, width 252, height 2
- Frame 219 > Frame 215 > Frame 216 > Frame 223 > 2026 [TEXT]: left 604, top 78, width 266, height 24
- Frame 219 > Frame 215 > Frame 216 > Frame 217 [FRAME]: left 604, top 114, width 266, height 466.67
- Frame 219 > Frame 215 > Frame 216 > Frame 217 > Rectangle 14 [RECTANGLE]: left 604, top 114, width 266, height 354.67, signals: image
- Frame 219 > Frame 215 > Frame 216 > Frame 217 > Картина "Алиса в Зазеркалье" — современное произведение, представленн... [TEXT]: left 604, top 480.67, width 266, height 100
- Frame 219 > Frame 215 > Frame 215 [FRAME]: left 886, top 60, width 266, height 408.67
- Frame 219 > Frame 215 > Frame 215 > Frame 226 [FRAME]: left 886, top 60, width 266, height 42
- Frame 219 > Frame 215 > Frame 215 > Frame 226 > Frame 222 [FRAME]: left 886, top 60, width 266, height 14
- Frame 219 > Frame 215 > Frame 215 > Frame 226 > Frame 222 > Frame 221 [FRAME]: left 886, top 60, width 14, height 14
- Frame 219 > Frame 215 > Frame 215 > Frame 226 > Frame 222 > Frame 221 > Rectangle 21 [RECTANGLE]: left 888, top 62, width 10, height 10
- Frame 219 > Frame 215 > Frame 215 > Frame 226 > Frame 222 > Rectangle 23 [RECTANGLE]: left 900, top 66, width 252, height 2
- Frame 219 > Frame 215 > Frame 215 > Frame 226 > 2016 [TEXT]: left 886, top 78, width 266, height 24
- Frame 219 > Frame 215 > Frame 215 > Frame 217 [FRAME]: left 886, top 114, width 266, height 354.67
- Frame 219 > Frame 215 > Frame 215 > Frame 217 > Frame 220 [FRAME]: left 886, top 114, width 266, height 354.67
- Frame 219 > Frame 215 > Frame 215 > Frame 217 > Frame 220 > Закончил ВУЗ технико-прикладнических наук [TEXT]: left 898, top 263.34, width 242, height 56

## Assets
Image files included with this spec — use as `<img>` or CSS `background-image`:
- `Frame_216_Rectangle_14.png` → Rectangle 14 (266×355, fill, scaling 0.5, transform [[1,0,0],[0,0.89,0.06]])
- `Frame_217_Rectangle_14.png` → Rectangle 14 (266×355, fill, scaling 0.5, transform [[0.75,0,0.12],[0,1,0]])

## Pixel Perfect Template
You are rebuilding this Figma frame for an exact visual match. Treat the JSON as geometry/style data and the reference image/assets as visual evidence.

### Required Inputs
- JSON component structure below.
- If a whole-frame reference image is supplied separately, use it as the visual source of truth.
- Use every listed exported image file exactly; if any required asset is missing, stop and ask for it.

### Render Target
- Build one exact 1471×641 frame.
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
- Build against one exact 1471×641 viewport with `html, body { margin: 0; }` and global `box-sizing: border-box`.
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
Frame 219 (FRAME, fixed×fixed)
└── Frame 215 (FRAME, horizontal, hug×hug)
    ├── Frame 214 (FRAME, vertical, fixed×hug)
    │   ├── Frame 225 (FRAME, vertical, fill×hug)
    │   │   ├── Frame 222 (FRAME, horizontal, fill×hug)
    │   │   │   ├── Frame 221 (FRAME, horizontal, fixed×fixed)
    │   │   │   │   └── Rectangle 21 (RECTANGLE, fixed×fixed)
    │   │   │   └── Rectangle 23 (RECTANGLE, fill×fixed)
    │   │   └── 2026 (TEXT, fill×hug) "2026"
    │   └── Frame 216 (FRAME, vertical, fill×hug)
    │       ├── Rectangle 14 (RECTANGLE, fill×fixed)
    │       └── Картина "Алиса в Зазеркалье" — современное произведение, представленное на выставке Кунибала Ректора, посвящённой футуристическим темам и времени. (TEXT, fill×hug) "Картина "Алиса в Зазеркалье" — современн…"
    ├── Frame 213 (FRAME, vertical, fixed×hug)
    │   ├── Frame 224 (FRAME, vertical, fill×hug)
    │   │   ├── Frame 222 (FRAME, horizontal, fill×hug)
    │   │   │   ├── Frame 221 (FRAME, horizontal, fixed×fixed)
    │   │   │   │   └── Rectangle 21 (RECTANGLE, fixed×fixed)
    │   │   │   └── Rectangle 23 (RECTANGLE, fill×fixed)
    │   │   └── 2026 (TEXT, fill×hug) "2026"
    │   └── Frame 217 (FRAME, vertical, fill×hug)
    │       ├── Rectangle 14 (RECTANGLE, fill×fixed)
    │       └── Картина "Алиса в Зазеркалье" — современное произведение, представленное на выставке Кунибала Ректора, посвящённой футуристическим темам и времени. (TEXT, fill×hug) "Картина "Алиса в Зазеркалье" — современн…"
    ├── Frame 216 (FRAME, vertical, fixed×hug)
    │   ├── Frame 223 (FRAME, vertical, fill×hug)
    │   │   ├── Frame 222 (FRAME, horizontal, fill×hug)
    │   │   │   ├── Frame 221 (FRAME, horizontal, fixed×fixed)
    │   │   │   │   └── Rectangle 21 (RECTANGLE, fixed×fixed)
    │   │   │   └── Rectangle 23 (RECTANGLE, fill×fixed)
    │   │   └── 2026 (TEXT, fill×hug) "2026"
    │   └── Frame 217 (FRAME, vertical, fill×hug)
    │       ├── Rectangle 14 (RECTANGLE, fill×fixed)
    │       └── Картина "Алиса в Зазеркалье" — современное произведение, представленное на выставке Кунибала Ректора, посвящённой футуристическим темам и времени. (TEXT, fill×hug) "Картина "Алиса в Зазеркалье" — современн…"
    └── Frame 215 (FRAME, vertical, fixed×hug)
        ├── Frame 226 (FRAME, vertical, fill×hug)
        │   ├── Frame 222 (FRAME, horizontal, fill×hug)
        │   │   ├── Frame 221 (FRAME, horizontal, fixed×fixed)
        │   │   │   └── Rectangle 21 (RECTANGLE, fixed×fixed)
        │   │   └── Rectangle 23 (RECTANGLE, fill×fixed)
        │   └── 2016 (TEXT, fill×hug) "2016"
        └── Frame 217 (FRAME, vertical, fill×hug)
            └── Frame 220 (FRAME, horizontal, fill×fixed)
                └── Закончил ВУЗ технико-прикладнических наук (TEXT, fill×hug) "Закончил ВУЗ технико-прикладнических нау…"
```

## Component Structure
```
{"id":"742:20510","name":"Frame 219","type":"FRAME","layout":{"width":1471,"height":641,"x":1321,"y":1667,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"overflow":"hidden","mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"},"children":[{"id":"742:20499","name":"Frame 215","type":"FRAME","layout":{"width":1112,"height":520.67,"x":40,"y":60,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":16,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"742:20500","name":"Frame 214","type":"FRAME","layout":{"width":266,"height":520.67,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"744:20575","name":"Frame 225","type":"FRAME","layout":{"width":266,"height":42,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":4,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"744:20553","name":"Frame 222","type":"FRAME","layout":{"width":266,"height":14,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":0,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"744:20554","name":"Frame 221","type":"FRAME","layout":{"width":14,"height":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":3,"right":3,"bottom":3,"left":3},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"backgroundColor":"#565656","borderRadius":21},"children":[{"id":"744:20555","name":"Rectangle 21","type":"RECTANGLE","layout":{"width":10,"height":10,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":6,"y":6},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":21}}]},{"id":"744:20556","name":"Rectangle 23","type":"RECTANGLE","layout":{"width":252,"height":2,"x":14,"y":6,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"backgroundColor":"#565656","borderRadius":6}}]},{"id":"742:20501","name":"2026","type":"TEXT","text":"2026","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Medium","fontSize":18,"fontWeight":500,"lineHeight":24,"letterSpacing":-3,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":266,"height":24,"y":18,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]},{"id":"742:20502","name":"Frame 216","type":"FRAME","layout":{"width":266,"height":466.67,"y":54,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"742:20503","name":"Rectangle 14","type":"RECTANGLE","layout":{"width":266,"height":354.67,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"image","sourceType":"IMAGE","imageHash":"56b2d6d943dce5f7fdb5043f1ce2669c3a77aed5","scaleMode":"fill","transform":[[1,0,0],[0,0.89,0.06]],"scalingFactor":0.5}],"borderRadius":20,"imageFillHash":"56b2d6d943dce5f7fdb5043f1ce2669c3a77aed5","imageFillScaleMode":"fill","imageFillTransform":[[1,0,0],[0,0.89,0.06]],"imageFillScalingFactor":0.5}},{"id":"742:20504","name":"Картина \"Алиса в Зазеркалье\" — современное произведение, представленное на выставке Кунибала Ректора, посвящённой футуристическим темам и времени.","type":"TEXT","text":"Картина \"Алиса в Зазеркалье\" — современное произведение, представленное на выставке Кунибала Ректора, посвящённой футуристическим темам и времени.","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Regular","fontSize":14,"fontWeight":400,"lineHeight":20,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":266,"height":100,"y":366.67,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]}]},{"id":"742:20505","name":"Frame 213","type":"FRAME","layout":{"width":266,"height":520.67,"x":282,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"744:20574","name":"Frame 224","type":"FRAME","layout":{"width":266,"height":42,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":4,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"744:20558","name":"Frame 222","type":"FRAME","layout":{"width":266,"height":14,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":0,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"744:20559","name":"Frame 221","type":"FRAME","layout":{"width":14,"height":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":3,"right":3,"bottom":3,"left":3},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"backgroundColor":"#565656","borderRadius":21},"children":[{"id":"744:20560","name":"Rectangle 21","type":"RECTANGLE","layout":{"width":10,"height":10,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":6,"y":6},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":21}}]},{"id":"744:20561","name":"Rectangle 23","type":"RECTANGLE","layout":{"width":252,"height":2,"x":14,"y":6,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"backgroundColor":"#565656","borderRadius":6}}]},{"id":"742:20523","name":"2026","type":"TEXT","text":"2026","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Medium","fontSize":18,"fontWeight":500,"lineHeight":24,"letterSpacing":-3,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":266,"height":24,"y":18,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]},{"id":"742:20507","name":"Frame 217","type":"FRAME","layout":{"width":266,"height":466.67,"y":54,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"742:20508","name":"Rectangle 14","type":"RECTANGLE","layout":{"width":266,"height":354.67,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":246,"y":328},"mode":"none","sizing":{"horizontal":"fill","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"image","sourceType":"IMAGE","imageHash":"c4c97f5eefb5cc7f972312b5c340652b2710dc20","scaleMode":"fill","transform":[[0.75,0,0.12],[0,1,0]],"scalingFactor":0.5}],"borderRadius":20,"imageFillHash":"c4c97f5eefb5cc7f972312b5c340652b2710dc20","imageFillScaleMode":"fill","imageFillTransform":[[0.75,0,0.12],[0,1,0]],"imageFillScalingFactor":0.5}},{"id":"742:20509","name":"Картина \"Алиса в Зазеркалье\" — современное произведение, представленное на выставке Кунибала Ректора, посвящённой футуристическим темам и времени.","type":"TEXT","text":"Картина \"Алиса в Зазеркалье\" — современное произведение, представленное на выставке Кунибала Ректора, посвящённой футуристическим темам и времени.","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Regular","fontSize":14,"fontWeight":400,"lineHeight":20,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":266,"height":100,"y":366.67,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]}]},{"id":"742:20517","name":"Frame 216","type":"FRAME","layout":{"width":266,"height":520.67,"x":564,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"744:20573","name":"Frame 223","type":"FRAME","layout":{"width":266,"height":42,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":4,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"744:20563","name":"Frame 222","type":"FRAME","layout":{"width":266,"height":14,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":0,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"744:20564","name":"Frame 221","type":"FRAME","layout":{"width":14,"height":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":3,"right":3,"bottom":3,"left":3},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"backgroundColor":"#565656","borderRadius":21},"children":[{"id":"744:20565","name":"Rectangle 21","type":"RECTANGLE","layout":{"width":10,"height":10,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":6,"y":6},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":21}}]},{"id":"744:20566","name":"Rectangle 23","type":"RECTANGLE","layout":{"width":252,"height":2,"x":14,"y":6,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"backgroundColor":"#565656","borderRadius":6}}]},{"id":"742:20527","name":"2026","type":"TEXT","text":"2026","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Medium","fontSize":18,"fontWeight":500,"lineHeight":24,"letterSpacing":-3,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":266,"height":24,"y":18,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]},{"id":"742:20519","name":"Frame 217","type":"FRAME","layout":{"width":266,"height":466.67,"y":54,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"742:20520","name":"Rectangle 14","type":"RECTANGLE","layout":{"width":266,"height":354.67,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":246,"y":328},"mode":"none","sizing":{"horizontal":"fill","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"image","sourceType":"IMAGE","imageHash":"c4c97f5eefb5cc7f972312b5c340652b2710dc20","scaleMode":"fill","transform":[[0.75,0,0.12],[0,1,0]],"scalingFactor":0.5}],"borderRadius":20,"imageFillHash":"c4c97f5eefb5cc7f972312b5c340652b2710dc20","imageFillScaleMode":"fill","imageFillTransform":[[0.75,0,0.12],[0,1,0]],"imageFillScalingFactor":0.5}},{"id":"742:20521","name":"Картина \"Алиса в Зазеркалье\" — современное произведение, представленное на выставке Кунибала Ректора, посвящённой футуристическим темам и времени.","type":"TEXT","text":"Картина \"Алиса в Зазеркалье\" — современное произведение, представленное на выставке Кунибала Ректора, посвящённой футуристическим темам и времени.","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Regular","fontSize":14,"fontWeight":400,"lineHeight":20,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":266,"height":100,"y":366.67,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]}]},{"id":"742:20511","name":"Frame 215","type":"FRAME","layout":{"width":266,"height":408.67,"x":846,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"744:20576","name":"Frame 226","type":"FRAME","layout":{"width":266,"height":42,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":4,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"744:20568","name":"Frame 222","type":"FRAME","layout":{"width":266,"height":14,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":0,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"744:20569","name":"Frame 221","type":"FRAME","layout":{"width":14,"height":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":3,"right":3,"bottom":3,"left":3},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"backgroundColor":"#565656","borderRadius":21},"children":[{"id":"744:20570","name":"Rectangle 21","type":"RECTANGLE","layout":{"width":10,"height":10,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":6,"y":6},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":21}}]},{"id":"744:20571","name":"Rectangle 23","type":"RECTANGLE","layout":{"width":252,"height":2,"x":14,"y":6,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"backgroundColor":"#565656","borderRadius":6}}]},{"id":"742:20525","name":"2016","type":"TEXT","text":"2016","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Medium","fontSize":18,"fontWeight":500,"lineHeight":24,"letterSpacing":-3,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":266,"height":24,"y":18,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]},{"id":"742:20513","name":"Frame 217","type":"FRAME","layout":{"width":266,"height":354.67,"y":54,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#F3F3F3"}],"backgroundColor":"#F3F3F3","borderRadius":20},"children":[{"id":"742:20536","name":"Frame 220","type":"FRAME","layout":{"width":266,"height":354.67,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":12,"right":12,"bottom":12,"left":12},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"742:20515","name":"Закончил ВУЗ технико-прикладнических наук","type":"TEXT","text":"Закончил ВУЗ технико-прикладнических наук","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Medium","fontSize":20,"fontWeight":500,"lineHeight":28,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":242,"height":56,"x":12,"y":149.34,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]}]}]}]}]}
```

## Capture Bundle Inputs (Authoritative)
- Keep this bundle intact. Resolve every path relative to the bundle root.
- Review `mcp/figma-locator.json` before calling a Figma MCP tool. Prefer each node's exact `locator.sourceUrl`; otherwise pass its `locator.fileKey` and colon-form `locator.nodeId` through the MCP tool's documented inputs.
- Locator data is for discovery or refresh only. An MCP re-capture creates a new immutable capture; it never replaces the evidence in this bundle.
- This capture has no Figma file key, so MCP cannot reopen its source; rely on the bundled evidence.
- Review `fidelity/coverage.json` before implementation. Every listed node must use its exact pixel fallback or an equivalent implementation proven by the final RGBA comparison.
- Use the reference renders below as the visual source of truth and iterate with screenshot comparison.
- Authoritative target: `references/001-742_20510.png` at exactly 1471×641 CSS pixels. Do not infer the viewport from Figma's fractional geometry or another asset.
- Reference determinism gate passed: two consecutive Figma renders were RGBA-identical. If a later reference becomes unstable, stop exact verification until the changing content is frozen.
- Provide the final exact-size screenshot so the user can load it into Figma to Prompt's built-in `Verify AI screenshot` checker.
- Reference render: `references/001-742_20510.png`
- Match design assets by their manifest `nodeId`; bundled paths override any generated filename elsewhere in this prompt.
- Design asset for node `742:20503`: `assets/001-742_20503.png`
- Design asset for node `742:20508`: `assets/002-742_20508.png`
- Rendered fallbacks are Figma-authored precision assets. Use the PNG variant for the exact 1× target; use the outlined, unsimplified SVG variant when the node must scale. Preserve semantics or interactions with an accessible overlay when needed.
- Rendered fallback (pixel) for node `742:20510` (context-dependent-effect): `fallbacks/001-742_20510.png`
- Rendered fallback (vector) for node `742:20510` (context-dependent-effect): `fallbacks/001-742_20510.svg`

# Pixel-perfect Figma rebuild: Создание работы 

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
- `#2A2A2A` (border)
- `#2A2A2A` (border)
- `#DEDEDE` (background)
- `#DEDEDE` (background)
- `#2A2A2A` (background)
- `#2A2A2A` (background)
- `#2A2A2A` (text)
- `#2A2A2A` (text)
- `#8A8A8A` (border)
- `#8A8A8A` (border)
- `#8A8A8A` (text)
- `#8A8A8A` (text)
- `#F3F3F3` (border)
- `#F3F3F3` (border)
- `#F3F3F3` (background)
- `#F3F3F3` (background)
- `#565656` (text)
- `#565656` (text)
- `#292929` (background)
- `#292929` (background)
- `#FFFFFF` (text)
- `#FFFFFF` (text)
### Typography
- Inter 600 24px, letter-spacing: -2%
- Inter 400 16px/24px
- Inter 600 16px, letter-spacing: -2%
- Inter 400 12px
- Inter 500 16px/26px, letter-spacing: -2%
### Spacing & Radii
- Spacing scale: 2px, 4px, 8px, 10px, 12px, 12.08px, 13px, 14px, 16px, 20px, 24px
- Border radii: 18px, 20px, 21px, 80px

## Interaction Contract
Implement these Figma prototype settings and reactions explicitly. Preserve scrolling, fixed layers, overlay behavior, trigger/action order, and transitions; do not infer a different behavior from appearance or node names.
- `Создание работы ` (`873:4445`) prototype settings: `{"overflowDirection":"none","fixedChildIds":["873:4469"],"overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219` (`873:4446`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139` (`873:4447`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139 > Frame 218` (`873:4448`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139 > Frame 218 > arrow-left-02` (`873:4449`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139 > Frame 218 > Frame 151` (`873:4452`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139 > Frame 218 > x` (`873:4457`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139 > Frame 121` (`873:4459`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139 > Frame 121 > Frame 122` (`873:4460`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206` (`873:4462`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Поля ввода` (`877:5977`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Поля ввода` (`873:4463`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Поля ввода` (`873:4464`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Поля ввода` (`873:4465`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 217` (`873:4481`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 217 > Frame 201` (`873:4482`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 217 > Frame 201 > Frame 199` (`873:4483`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 217 > Frame 201 > Frame 199 > arrow-up-03` (`873:4484`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 217 > Frame 201 > Frame 200` (`873:4488`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190` (`873:4467`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Кнопки` (`873:4468`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`

## Component API Contract
Use the documented component properties as the public API. Preserve typed defaults, variants, and active values instead of coercing them from labels.
### Создание работы  > Frame 219 > Frame 206 > Поля ввода (`877:5977`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Создание работы  > Frame 219 > Frame 206 > Поля ввода (`873:4463`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Создание работы  > Frame 219 > Frame 206 > Поля ввода (`873:4464`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Создание работы  > Frame 219 > Frame 206 > Поля ввода (`873:4465`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Создание работы  > Frame 219 > Frame 206 > Frame 190 > Кнопки (`873:4468`)
- Active property values: `{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5597"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}}`

## Fidelity Risk Summary
- Estimated risk: high (41 visible nodes, max depth 7)
- Layout risks: 2 clipped containers, 41 nodes with constraints, 9 nodes with target aspect ratio
- Asset risks: 1 image fills, 1 image fills with crop/filter/opacity metadata, 7 vector-like nodes
- Paint risks: 41 nodes with layer blend mode, 12 nodes with detailed stroke metadata

## Geometry Checklist
Use these absolute boxes after normalizing the selected root to left 0, top 0. They are derived from `layout.x/y` and help catch drift before styling polish.
- Root `layout.x/y` is the Figma canvas position; do not offset the rendered component by it.
### Bounding Boxes
- Создание работы [FRAME]: left 0, top 0, width 390, height 728, signals: root/clips
- Создание работы > Frame 219 [FRAME]: left 12, top 84, width 366, height 527, signals: top-level
- Создание работы > Frame 219 > Frame 139 [FRAME]: left 12, top 84, width 366, height 69
- Создание работы > Frame 219 > Frame 139 > Frame 218 [FRAME]: left 12, top 84, width 366, height 28
- Создание работы > Frame 219 > Frame 139 > Frame 218 > arrow-left-02 [FRAME]: left 12, top 84, width 28, height 28
- Создание работы > Frame 219 > Frame 139 > Frame 218 > arrow-left-02 > Vector [VECTOR]: left 18.42, top 98, width 15.75, height 0, signals: vector
- Создание работы > Frame 219 > Frame 139 > Frame 218 > arrow-left-02 > Vector [VECTOR]: left 17.83, top 91, width 7, height 14, signals: vector
- Создание работы > Frame 219 > Frame 139 > Frame 218 > Frame 151 [FRAME]: left 64, top 95, width 262, height 6
- Создание работы > Frame 219 > Frame 139 > Frame 218 > Frame 151 > Rectangle 3 [RECTANGLE]: left 164, top 95, width 6, height 6
- Создание работы > Frame 219 > Frame 139 > Frame 218 > Frame 151 > Rectangle 4 [RECTANGLE]: left 178, top 95, width 6, height 6
- Создание работы > Frame 219 > Frame 139 > Frame 218 > Frame 151 > Rectangle 2 [RECTANGLE]: left 192, top 95, width 6, height 6
- Создание работы > Frame 219 > Frame 139 > Frame 218 > Frame 151 > Rectangle 5 [RECTANGLE]: left 206, top 95, width 6, height 6
- Создание работы > Frame 219 > Frame 139 > Frame 218 > Frame 151 > Rectangle 6 [RECTANGLE]: left 220, top 95, width 6, height 6
- Создание работы > Frame 219 > Frame 139 > Frame 218 > x [FRAME]: left 350, top 84, width 28, height 28
- Создание работы > Frame 219 > Frame 139 > Frame 218 > x > Vector [VECTOR]: left 357, top 91, width 14, height 14, signals: vector
- Создание работы > Frame 219 > Frame 139 > Frame 121 [FRAME]: left 12, top 124, width 366, height 29
- Создание работы > Frame 219 > Frame 139 > Frame 121 > Frame 122 [FRAME]: left 12, top 124, width 366, height 29
- Создание работы > Frame 219 > Frame 139 > Frame 121 > Frame 122 > Оплата и доставка [TEXT]: left 12, top 124, width 366, height 29
- Создание работы > Frame 219 > Frame 206 [FRAME]: left 12, top 173, width 366, height 438
- Создание работы > Frame 219 > Frame 206 > Поля ввода [INSTANCE]: left 12, top 173, width 366, height 52, signals: component
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Обычный [TEXT]: left 25, top 187, width 122, height 24
- Создание работы > Frame 219 > Frame 206 > Поля ввода [INSTANCE]: left 12, top 237, width 366, height 52, signals: component
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Обычный [TEXT]: left 25, top 251, width 57, height 24
- Создание работы > Frame 219 > Frame 206 > Поля ввода [INSTANCE]: left 12, top 301, width 366, height 52, signals: component
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Обычный [TEXT]: left 25, top 315, width 75, height 24
- Создание работы > Frame 219 > Frame 206 > Поля ввода [INSTANCE]: left 12, top 365, width 366, height 52, signals: component
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Обычный [TEXT]: left 25, top 379, width 108, height 24
- Создание работы > Frame 219 > Frame 206 > Frame 217 [FRAME]: left 12, top 429, width 366, height 122
- Создание работы > Frame 219 > Frame 206 > Frame 217 > Frame 201 [FRAME]: left 13, top 430, width 364, height 120
- Создание работы > Frame 219 > Frame 206 > Frame 217 > Frame 201 > Frame 199 [FRAME]: left 13, top 430, width 90, height 120, signals: clips
- Создание работы > Frame 219 > Frame 206 > Frame 217 > Frame 201 > Frame 199 > arrow-up-03 [FRAME]: left 38, top 470, width 40, height 40
- Создание работы > Frame 219 > Frame 206 > Frame 217 > Frame 201 > Frame 199 > arrow-up-03 > Vector [VECTOR]: left 48, top 476.67, width 20, height 0, signals: vector
- Создание работы > Frame 219 > Frame 206 > Frame 217 > Frame 201 > Frame 199 > arrow-up-03 > Vector [VECTOR]: left 58, top 483.33, width 0, height 20, signals: vector
- Создание работы > Frame 219 > Frame 206 > Frame 217 > Frame 201 > Frame 199 > arrow-up-03 > Vector [VECTOR]: left 51.33, top 483.33, width 13.33, height 6.67, signals: vector
- Создание работы > Frame 219 > Frame 206 > Frame 217 > Frame 201 > Frame 200 [FRAME]: left 117, top 461.5, width 260, height 57
- Создание работы > Frame 219 > Frame 206 > Frame 217 > Frame 201 > Frame 200 > Добавьте фото вашей упаковки [TEXT]: left 117, top 461.5, width 260, height 19
- Создание работы > Frame 219 > Frame 206 > Frame 217 > Frame 201 > Frame 200 > Формат изображения 3:4 Масимальный размер 10МБ [TEXT]: left 117, top 488.5, width 260, height 30
- Создание работы > Frame 219 > Frame 206 > Frame 190 [FRAME]: left 12, top 563, width 366, height 48
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Кнопки [INSTANCE]: left 12, top 563, width 366, height 48, signals: component
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Кнопки > Кнопка [TEXT]: left 152, top 574, width 86, height 26
- Создание работы > Change-This [VECTOR]: left 0.44, top 0, width 389.56, height 49.78, signals: top-level/image/vector

## Assets
Image files included with this spec — use as `<img>` or CSS `background-image`:
- `Создание_работы__Change-This.png` → Change-This (390×50, crop, scaling 0.5, transform [[1,0,0],[0,0.06,0]], filters {"saturation":0.5})

## Pixel Perfect Template
You are rebuilding this Figma frame for an exact visual match. Treat the JSON as geometry/style data and the reference image/assets as visual evidence.

### Required Inputs
- JSON component structure below.
- If a whole-frame reference image is supplied separately, use it as the visual source of truth.
- Use every listed exported image file exactly; if any required asset is missing, stop and ask for it.

### Render Target
- Build one exact 390×728 frame.
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
- Build against one exact 390×728 viewport with `html, body { margin: 0; }` and global `box-sizing: border-box`.
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
Создание работы  (FRAME, fixed×fixed)
├── Frame 219 (FRAME, vertical, fixed×hug)
│   ├── Frame 139 (FRAME, vertical, fill×hug)
│   │   ├── Frame 218 (FRAME, horizontal, fill×hug)
│   │   │   ├── arrow-left-02 (FRAME, fixed×fixed)
│   │   │   │   ├── Vector (VECTOR, fixed×fixed)
│   │   │   │   └── Vector (VECTOR, fixed×fixed)
│   │   │   ├── Frame 151 (FRAME, horizontal, fill×hug)
│   │   │   │   ├── Rectangle 3 (RECTANGLE, fixed×fixed)
│   │   │   │   ├── Rectangle 4 (RECTANGLE, fixed×fixed)
│   │   │   │   ├── Rectangle 2 (RECTANGLE, fixed×fixed)
│   │   │   │   ├── Rectangle 5 (RECTANGLE, fixed×fixed)
│   │   │   │   └── Rectangle 6 (RECTANGLE, fixed×fixed)
│   │   │   └── x (FRAME, fixed×fixed)
│   │   │       └── Vector (VECTOR, fixed×fixed)
│   │   └── Frame 121 (FRAME, vertical, fill×hug)
│   │       └── Frame 122 (FRAME, vertical, fill×hug)
│   │           └── Оплата и доставка (TEXT, fill×hug) "Оплата и доставка"
│   └── Frame 206 (FRAME, vertical, fill×hug)
│       ├── Поля ввода (INSTANCE, horizontal, fixed×hug)
│       │   └── Обычный (TEXT, hug×hug) "Город продажи"
│       ├── Поля ввода (INSTANCE, horizontal, fixed×hug)
│       │   └── Обычный (TEXT, hug×hug) "Оплата"
│       ├── Поля ввода (INSTANCE, horizontal, fixed×hug)
│       │   └── Обычный (TEXT, hug×hug) "Доставка"
│       ├── Поля ввода (INSTANCE, horizontal, fixed×hug)
│       │   └── Обычный (TEXT, hug×hug) "Комментарий"
│       ├── Frame 217 (FRAME, horizontal, fill×hug)
│       │   └── Frame 201 (FRAME, horizontal, fill×hug)
│       │       ├── Frame 199 (FRAME, horizontal, fixed×fixed)
│       │       │   └── arrow-up-03 (FRAME, fixed×fixed)
│       │       │       ├── Vector (VECTOR, fixed×fixed)
│       │       │       ├── Vector (VECTOR, fixed×fixed)
│       │       │       └── Vector (VECTOR, fixed×fixed)
│       │       └── Frame 200 (FRAME, vertical, fill×hug)
│       │           ├── Добавьте фото вашей упаковки (TEXT, fill×hug) "Добавьте фото вашей упаковки"
│       │           └── Формат изображения 3:4 Масимальный размер 10МБ (TEXT, fill×hug) "Формат изображения 3:4 Масимальный разме…"
│       └── Frame 190 (FRAME, vertical, fixed×hug)
│           └── Кнопки (INSTANCE, horizontal, fill×hug)
│               └── Кнопка (TEXT, hug×hug) "Завершить"
└── Change-This (VECTOR, fixed×fixed)
```

## Component Structure
```
{"id":"873:4445","name":"Создание работы ","type":"FRAME","layout":{"width":390,"height":728,"x":1943,"y":108,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"overflow":"hidden","mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"},"children":[{"id":"873:4446","name":"Frame 219","type":"FRAME","layout":{"width":366,"height":527,"x":12,"y":84,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":20,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4447","name":"Frame 139","type":"FRAME","layout":{"width":366,"height":69,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4448","name":"Frame 218","type":"FRAME","layout":{"width":366,"height":28,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":24,"strokesIncludedInLayout":true,"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4449","name":"arrow-left-02","type":"FRAME","layout":{"width":28,"height":28,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4450","name":"Vector","type":"VECTOR","layout":{"width":15.75,"height":0}},{"id":"873:4451","name":"Vector","type":"VECTOR","layout":{"width":7,"height":14}}]},{"id":"873:4452","name":"Frame 151","type":"FRAME","layout":{"width":262,"height":6,"x":52,"y":11,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"center","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4453","name":"Rectangle 3","type":"RECTANGLE","layout":{"width":6,"height":6,"x":100,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}},{"id":"873:4455","name":"Rectangle 4","type":"RECTANGLE","layout":{"width":6,"height":6,"x":114,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}},{"id":"873:4454","name":"Rectangle 2","type":"RECTANGLE","layout":{"width":6,"height":6,"x":128,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"backgroundColor":"#2A2A2A","borderRadius":20}},{"id":"873:4456","name":"Rectangle 5","type":"RECTANGLE","layout":{"width":6,"height":6,"x":142,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}},{"id":"881:7041","name":"Rectangle 6","type":"RECTANGLE","layout":{"width":6,"height":6,"x":156,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}}]},{"id":"873:4457","name":"x","type":"FRAME","layout":{"width":28,"height":28,"x":338,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":12,"y":12},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4458","name":"Vector","type":"VECTOR","layout":{"width":14,"height":14}}]}]},{"id":"873:4459","name":"Frame 121","type":"FRAME","layout":{"width":366,"height":29,"y":40,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4460","name":"Frame 122","type":"FRAME","layout":{"width":366,"height":29,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4461","name":"Оплата и доставка","type":"TEXT","text":"Оплата и доставка","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Semi Bold","fontSize":24,"fontWeight":600,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":366,"height":29,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]}]}]},{"id":"873:4462","name":"Frame 206","type":"FRAME","layout":{"width":366,"height":438,"y":89,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:5977","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I877:5977;285:4864","name":"Обычный","type":"TEXT","text":"Город продажи","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":122,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"873:4463","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"y":64,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I873:4463;285:4864","name":"Обычный","type":"TEXT","text":"Оплата","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":57,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"873:4464","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"y":128,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I873:4464;285:4864","name":"Обычный","type":"TEXT","text":"Доставка","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":75,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"873:4465","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"y":192,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I873:4465;285:4864","name":"Обычный","type":"TEXT","text":"Комментарий","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":108,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"873:4481","name":"Frame 217","type":"FRAME","layout":{"width":366,"height":122,"y":256,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","borderRadius":21,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#F3F3F3"}],"borderColor":"#F3F3F3","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"873:4482","name":"Frame 201","type":"FRAME","layout":{"width":364,"height":120,"x":1,"y":1,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":14,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4483","name":"Frame 199","type":"FRAME","layout":{"width":90,"height":120,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":300,"y":400},"overflow":"hidden","mode":"horizontal","gap":12.08,"strokesIncludedInLayout":true,"padding":{"top":20,"right":20,"bottom":20,"left":20},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#F3F3F3"}],"backgroundColor":"#F3F3F3","borderRadius":20},"children":[{"id":"873:4484","name":"arrow-up-03","type":"FRAME","layout":{"width":40,"height":40,"x":25,"y":40,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":40,"y":40},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4485","name":"Vector","type":"VECTOR","layout":{"width":20,"height":0}},{"id":"873:4486","name":"Vector","type":"VECTOR","layout":{"width":0,"height":20}},{"id":"873:4487","name":"Vector","type":"VECTOR","layout":{"width":13.33,"height":6.67}}]}]},{"id":"873:4488","name":"Frame 200","type":"FRAME","layout":{"width":260,"height":57,"x":104,"y":31.5,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4489","name":"Добавьте фото вашей упаковки","type":"TEXT","text":"Добавьте фото вашей упаковки","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Semi Bold","fontSize":16,"fontWeight":600,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":260,"height":19,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"873:4490","name":"Формат изображения 3:4 Масимальный размер 10МБ","type":"TEXT","text":"Формат изображения 3:4 Масимальный размер 10МБ","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Regular","fontSize":12,"fontWeight":400,"textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":260,"height":30,"y":27,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]}]}]},{"id":"873:4467","name":"Frame 190","type":"FRAME","layout":{"width":366,"height":48,"y":390,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":10,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4468","name":"Кнопки","type":"INSTANCE","layout":{"width":366,"height":48,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":10,"right":16,"bottom":10,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#292929"}],"backgroundColor":"#292929","borderRadius":80,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Иконка правая":"false","Icon":"297:5597","Иконка левая":"false","Обычная":"Черная"},"componentPropertyDetails":{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5597"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}},"children":[{"id":"I873:4468;278:4690","name":"Кнопка","type":"TEXT","text":"Завершить","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":26,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":86,"height":26,"x":140,"y":11,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}]}]},{"id":"873:4469","name":"Change-This","type":"VECTOR","layout":{"width":389.56,"height":49.78}}],"prototype":{"overflowDirection":"none","fixedChildIds":["873:4469"],"overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}}
```

## Capture Bundle Inputs (Authoritative)
- Keep this bundle intact. Resolve every path relative to the bundle root.
- Review `mcp/figma-locator.json` before calling a Figma MCP tool. Prefer each node's exact `locator.sourceUrl`; otherwise pass its `locator.fileKey` and colon-form `locator.nodeId` through the MCP tool's documented inputs.
- Locator data is for discovery or refresh only. An MCP re-capture creates a new immutable capture; it never replaces the evidence in this bundle.
- This capture has no Figma file key, so MCP cannot reopen its source; rely on the bundled evidence.
- Review `fidelity/coverage.json` before implementation. Every listed node must use its exact pixel fallback or an equivalent implementation proven by the final RGBA comparison.
- Use the reference renders below as the visual source of truth and iterate with screenshot comparison.
- Authoritative target: `references/001-873_4445.png` at exactly 390×728 CSS pixels. Do not infer the viewport from Figma's fractional geometry or another asset.
- Reference determinism gate passed: two consecutive Figma renders were RGBA-identical. If a later reference becomes unstable, stop exact verification until the changing content is frozen.
- Provide the final exact-size screenshot so the user can load it into Figma to Prompt's built-in `Verify AI screenshot` checker.
- Reference render: `references/001-873_4445.png`
- Match design assets by their manifest `nodeId`; bundled paths override any generated filename elsewhere in this prompt.
- Design asset for node `873:4469`: `assets/001-873_4469.png`
- Rendered fallbacks are Figma-authored precision assets. Use the PNG variant for the exact 1× target; use the outlined, unsimplified SVG variant when the node must scale. Preserve semantics or interactions with an accessible overlay when needed.
- Rendered fallback (pixel) for node `873:4445` (context-dependent-effect): `fallbacks/001-873_4445.png`
- Rendered fallback (vector) for node `873:4445` (context-dependent-effect): `fallbacks/001-873_4445.svg`

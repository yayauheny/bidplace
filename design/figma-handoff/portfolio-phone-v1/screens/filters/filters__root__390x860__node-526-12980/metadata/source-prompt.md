# Pixel-perfect Figma rebuild: Фильтры 

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
- `#2A2A2A` → `var(--Black)` (border)
- `#2A2A2A` → `var(--Black)` (border)
- `#2A2A2A` (text)
- `#2A2A2A` (text)
- `#FFFFFF` (border)
- `#FFFFFF` (border)
- `#2A2A2A` (border)
- `#292929` (background)
- `#292929` (background)
- `#FFFFFF` (text)
- `#FFFFFF` (text)
### Typography
- Inter 500 20px/26px, letter-spacing: -1%
- Inter 500 16px/26px, letter-spacing: -2%
- Inter 600 17px, letter-spacing: -2%
### Spacing & Radii
- Spacing scale: 2px, 4px, 8px, 10px, 12px, 16px
- Border radii: 80px

## Interaction Contract
Implement these Figma prototype settings and reactions explicitly. Preserve scrolling, fixed layers, overlay behavior, trigger/action order, and transitions; do not infer a different behavior from appearance or node names.
- `Фильтры ` (`526:12980`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры  > Frame 121` (`526:12982`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры  > Frame 121 > Frame 122` (`526:12983`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры  > Frame 121 > Frame 122 > Иконки кнопок` (`526:12984`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры  > Frame 121 > Frame 122 > Иконки кнопок > x` (`I526:12984;312:9202`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры  > Frame 121 > Кнопки` (`526:12986`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры  > Frame 116` (`526:12987`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры  > Frame 116 > Frame 113` (`526:12988`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры  > Frame 116 > Frame 113 > Frame 119` (`526:12989`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры  > Frame 116 > Frame 113 > Frame 119 > arrow-right-01` (`526:12991`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры  > Frame 116 > Frame 96` (`526:12993`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры  > Frame 116 > Frame 96 > Frame 119` (`526:12994`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры  > Frame 116 > Frame 96 > Frame 119 > arrow-right-01` (`526:12996`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры  > Frame 116 > Frame 115` (`526:12998`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры  > Frame 116 > Frame 115 > Frame 119` (`526:12999`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры  > Frame 116 > Frame 115 > Frame 119 > arrow-right-01` (`526:13001`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры  > Frame 116 > Frame 116` (`526:13003`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры  > Frame 116 > Frame 116 > Frame 119` (`526:13004`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры  > Frame 116 > Frame 116 > Frame 119 > arrow-right-01` (`526:13006`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры  > Кнопки` (`526:13008`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`

## Component API Contract
Use the documented component properties as the public API. Preserve typed defaults, variants, and active values instead of coercing them from labels.
### Фильтры  > Frame 121 > Frame 122 > Иконки кнопок (`526:12984`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"x"}}`
### Фильтры  > Frame 121 > Frame 122 > Иконки кнопок > x > Vector (`I526:12984;312:9203`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Фильтры  > Frame 121 > Кнопки (`526:12986`)
- Active property values: `{"Icon":{"type":"INSTANCE_SWAP","value":"310:9146"},"Иконка правая":{"type":"BOOLEAN","value":false},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Без обводки"}}`
### Фильтры  > Кнопки (`526:13008`)
- Active property values: `{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5596"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}}`

## Fidelity Risk Summary
- Estimated risk: medium (33 visible nodes, max depth 5)
- Layout risks: 1 clipped containers, 1 boxes extend outside the root viewport, 33 nodes with constraints, 7 nodes with target aspect ratio
- Asset risks: 6 vector-like nodes
- Paint risks: 33 nodes with layer blend mode, 7 nodes with detailed stroke metadata

## Geometry Checklist
Use these absolute boxes after normalizing the selected root to left 0, top 0. They are derived from `layout.x/y` and help catch drift before styling polish.
- Root `layout.x/y` is the Figma canvas position; do not offset the rendered component by it.
### Bounding Boxes
- Фильтры [FRAME]: left 0, top 0, width 390, height 860, signals: root/clips
- Фильтры > Vector [VECTOR]: left 174, top -862, width 42, height 32, signals: top-level/vector
- Фильтры > Frame 121 [FRAME]: left 12, top 20, width 366, height 44, signals: top-level
- Фильтры > Frame 121 > Frame 122 [FRAME]: left 12, top 29, width 246, height 26
- Фильтры > Frame 121 > Frame 122 > Иконки кнопок [INSTANCE]: left 12, top 29, width 26, height 26, signals: component
- Фильтры > Frame 121 > Frame 122 > Иконки кнопок > x [FRAME]: left 12, top 29, width 26, height 26
- Фильтры > Frame 121 > Frame 122 > Иконки кнопок > x > Vector [VECTOR]: left 18.5, top 35.5, width 13, height 13, signals: vector
- Фильтры > Frame 121 > Frame 122 > Фильтры [TEXT]: left 42, top 29, width 216, height 26
- Фильтры > Frame 121 > Кнопки [INSTANCE]: left 270, top 20, width 108, height 44, signals: component
- Фильтры > Frame 121 > Кнопки > Кнопка [TEXT]: left 287, top 29, width 74, height 26
- Фильтры > Frame 116 [FRAME]: left 12, top 82, width 366, height 208, signals: top-level
- Фильтры > Frame 116 > Frame 113 [FRAME]: left 12, top 82, width 366, height 52
- Фильтры > Frame 116 > Frame 113 > Frame 119 [FRAME]: left 12, top 82, width 366, height 40
- Фильтры > Frame 116 > Frame 113 > Frame 119 > Категория [TEXT]: left 12, top 91.5, width 332, height 21
- Фильтры > Frame 116 > Frame 113 > Frame 119 > arrow-right-01 [FRAME]: left 354, top 90, width 24, height 24
- Фильтры > Frame 116 > Frame 113 > Frame 119 > arrow-right-01 > Vector [VECTOR]: left 363, top 96, width 6, height 12, signals: vector
- Фильтры > Frame 116 > Frame 96 [FRAME]: left 12, top 134, width 366, height 52
- Фильтры > Frame 116 > Frame 96 > Frame 119 [FRAME]: left 12, top 134, width 366, height 40
- Фильтры > Frame 116 > Frame 96 > Frame 119 > Материалы [TEXT]: left 12, top 143.5, width 332, height 21
- Фильтры > Frame 116 > Frame 96 > Frame 119 > arrow-right-01 [FRAME]: left 354, top 142, width 24, height 24
- Фильтры > Frame 116 > Frame 96 > Frame 119 > arrow-right-01 > Vector [VECTOR]: left 363, top 148, width 6, height 12, signals: vector
- Фильтры > Frame 116 > Frame 115 [FRAME]: left 12, top 186, width 366, height 52
- Фильтры > Frame 116 > Frame 115 > Frame 119 [FRAME]: left 12, top 186, width 366, height 40
- Фильтры > Frame 116 > Frame 115 > Frame 119 > Цена [TEXT]: left 12, top 195.5, width 332, height 21
- Фильтры > Frame 116 > Frame 115 > Frame 119 > arrow-right-01 [FRAME]: left 354, top 194, width 24, height 24
- Фильтры > Frame 116 > Frame 115 > Frame 119 > arrow-right-01 > Vector [VECTOR]: left 363, top 200, width 6, height 12, signals: vector
- Фильтры > Frame 116 > Frame 116 [FRAME]: left 12, top 238, width 366, height 52
- Фильтры > Frame 116 > Frame 116 > Frame 119 [FRAME]: left 12, top 238, width 366, height 40
- Фильтры > Frame 116 > Frame 116 > Frame 119 > Набор радио кнопок [TEXT]: left 12, top 247.5, width 332, height 21
- Фильтры > Frame 116 > Frame 116 > Frame 119 > arrow-right-01 [FRAME]: left 354, top 246, width 24, height 24
- Фильтры > Frame 116 > Frame 116 > Frame 119 > arrow-right-01 > Vector [VECTOR]: left 363, top 252, width 6, height 12, signals: vector
- Фильтры > Кнопки [INSTANCE]: left 13, top 796, width 365, height 44, signals: top-level/component
- Фильтры > Кнопки > Кнопка [TEXT]: left 125.5, top 805, width 140, height 26

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
Фильтры  (FRAME, fixed×fixed)
├── Vector (VECTOR, fixed×fixed)
├── Frame 121 (FRAME, horizontal, fixed×hug)
│   ├── Frame 122 (FRAME, horizontal, fill×hug)
│   │   ├── Иконки кнопок (INSTANCE, fixed×fixed)
│   │   │   └── x (FRAME, fixed×fixed)
│   │   │       └── Vector (VECTOR, fixed×fixed)
│   │   └── Фильтры (TEXT, fill×hug) "Фильтры"
│   └── Кнопки (INSTANCE, horizontal, hug×hug)
│       └── Кнопка (TEXT, hug×hug) "Очистить"
├── Frame 116 (FRAME, vertical, fixed×hug)
│   ├── Frame 113 (FRAME, vertical, fill×hug)
│   │   └── Frame 119 (FRAME, horizontal, fill×hug)
│   │       ├── Категория (TEXT, fill×hug) "Категория"
│   │       └── arrow-right-01 (FRAME, fixed×fixed)
│   │           └── Vector (VECTOR, fixed×fixed)
│   ├── Frame 96 (FRAME, vertical, fill×hug)
│   │   └── Frame 119 (FRAME, horizontal, fill×hug)
│   │       ├── Материалы (TEXT, fill×hug) "Материалы"
│   │       └── arrow-right-01 (FRAME, fixed×fixed)
│   │           └── Vector (VECTOR, fixed×fixed)
│   ├── Frame 115 (FRAME, vertical, fill×hug)
│   │   └── Frame 119 (FRAME, horizontal, fill×hug)
│   │       ├── Цена (TEXT, fill×hug) "Цена"
│   │       └── arrow-right-01 (FRAME, fixed×fixed)
│   │           └── Vector (VECTOR, fixed×fixed)
│   └── Frame 116 (FRAME, vertical, fill×hug)
│       └── Frame 119 (FRAME, horizontal, fill×hug)
│           ├── Набор радио кнопок (TEXT, fill×hug) "Набор радио кнопок"
│           └── arrow-right-01 (FRAME, fixed×fixed)
│               └── Vector (VECTOR, fixed×fixed)
└── Кнопки (INSTANCE, horizontal, fixed×hug)
    └── Кнопка (TEXT, hug×hug) "Показать 12 лотов"
```

## Component Structure
```
{"id":"526:12980","name":"Фильтры ","type":"FRAME","layout":{"width":390,"height":860,"x":450,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"overflow":"hidden","mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"},"children":[{"id":"526:12981","name":"Vector","type":"VECTOR","layout":{"width":42,"height":32}},{"id":"526:12982","name":"Frame 121","type":"FRAME","layout":{"width":366,"height":44,"x":12,"y":20,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:12983","name":"Frame 122","type":"FRAME","layout":{"width":246,"height":26,"y":9,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:12984","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":26,"height":26,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"x"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"x"}},"children":[{"id":"I526:12984;312:9202","name":"x","type":"FRAME","layout":{"width":26,"height":26,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I526:12984;312:9203","name":"Vector","type":"VECTOR","layout":{"width":13,"height":13}}]}]},{"id":"526:12985","name":"Фильтры","type":"TEXT","text":"Фильтры","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":20,"fontWeight":500,"lineHeight":26,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":216,"height":26,"x":30,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]},{"id":"526:12986","name":"Кнопки","type":"INSTANCE","layout":{"width":108,"height":44,"x":258,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":8,"right":16,"bottom":8,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":80,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"borderColor":"#FFFFFF","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Icon":"310:9146","Иконка правая":"false","Иконка левая":"false","Обычная":"Без обводки"},"componentPropertyDetails":{"Icon":{"type":"INSTANCE_SWAP","value":"310:9146"},"Иконка правая":{"type":"BOOLEAN","value":false},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Без обводки"}},"children":[{"id":"I526:12986;278:4581","name":"Кнопка","type":"TEXT","text":"Очистить","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":26,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":74,"height":26,"x":17,"y":9,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]},{"id":"526:12987","name":"Frame 116","type":"FRAME","layout":{"width":366,"height":208,"x":12,"y":82,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":0,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:12988","name":"Frame 113","type":"FRAME","layout":{"width":366,"height":52,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"padding":{"top":0,"right":0,"bottom":12,"left":0},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:12989","name":"Frame 119","type":"FRAME","layout":{"width":366,"height":40,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":8,"right":0,"bottom":8,"left":0},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:12990","name":"Категория","type":"TEXT","text":"Категория","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Semi Bold","fontSize":17,"fontWeight":600,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":332,"height":21,"y":9.5,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"526:12991","name":"arrow-right-01","type":"FRAME","layout":{"width":24,"height":24,"x":342,"y":8,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:12992","name":"Vector","type":"VECTOR","layout":{"width":6,"height":12}}]}]}]},{"id":"526:12993","name":"Frame 96","type":"FRAME","layout":{"width":366,"height":52,"y":52,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"padding":{"top":0,"right":0,"bottom":12,"left":0},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:12994","name":"Frame 119","type":"FRAME","layout":{"width":366,"height":40,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":8,"right":0,"bottom":8,"left":0},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:12995","name":"Материалы","type":"TEXT","text":"Материалы","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Semi Bold","fontSize":17,"fontWeight":600,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":332,"height":21,"y":9.5,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"526:12996","name":"arrow-right-01","type":"FRAME","layout":{"width":24,"height":24,"x":342,"y":8,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:12997","name":"Vector","type":"VECTOR","layout":{"width":6,"height":12}}]}]}]},{"id":"526:12998","name":"Frame 115","type":"FRAME","layout":{"width":366,"height":52,"y":104,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"padding":{"top":0,"right":0,"bottom":12,"left":0},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:12999","name":"Frame 119","type":"FRAME","layout":{"width":366,"height":40,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":8,"right":0,"bottom":8,"left":0},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:13000","name":"Цена","type":"TEXT","text":"Цена","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Semi Bold","fontSize":17,"fontWeight":600,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":332,"height":21,"y":9.5,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"526:13001","name":"arrow-right-01","type":"FRAME","layout":{"width":24,"height":24,"x":342,"y":8,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:13002","name":"Vector","type":"VECTOR","layout":{"width":6,"height":12}}]}]}]},{"id":"526:13003","name":"Frame 116","type":"FRAME","layout":{"width":366,"height":52,"y":156,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"padding":{"top":0,"right":0,"bottom":12,"left":0},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:13004","name":"Frame 119","type":"FRAME","layout":{"width":366,"height":40,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":8,"right":0,"bottom":8,"left":0},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:13005","name":"Набор радио кнопок","type":"TEXT","text":"Набор радио кнопок","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Semi Bold","fontSize":17,"fontWeight":600,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":332,"height":21,"y":9.5,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"526:13006","name":"arrow-right-01","type":"FRAME","layout":{"width":24,"height":24,"x":342,"y":8,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:13007","name":"Vector","type":"VECTOR","layout":{"width":6,"height":12}}]}]}]}]},{"id":"526:13008","name":"Кнопки","type":"INSTANCE","layout":{"width":365,"height":44,"x":13,"y":796,"layoutAlign":"inherit","constraints":{"horizontal":"center","vertical":"max"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":8,"right":16,"bottom":8,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#292929"}],"backgroundColor":"#292929","borderRadius":80,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Иконка правая":"false","Icon":"297:5596","Иконка левая":"false","Обычная":"Черная"},"componentPropertyDetails":{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5596"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}},"children":[{"id":"I526:13008;278:4690","name":"Кнопка","type":"TEXT","text":"Показать 12 лотов","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":26,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":140,"height":26,"x":112.5,"y":9,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}
```

## Capture Bundle Inputs (Authoritative)
- Keep this bundle intact. Resolve every path relative to the bundle root.
- Review `mcp/figma-locator.json` before calling a Figma MCP tool. Prefer each node's exact `locator.sourceUrl`; otherwise pass its `locator.fileKey` and colon-form `locator.nodeId` through the MCP tool's documented inputs.
- Locator data is for discovery or refresh only. An MCP re-capture creates a new immutable capture; it never replaces the evidence in this bundle.
- This capture has no Figma file key, so MCP cannot reopen its source; rely on the bundled evidence.
- Review `fidelity/coverage.json` before implementation. Every listed node must use its exact pixel fallback or an equivalent implementation proven by the final RGBA comparison.
- Use the reference renders below as the visual source of truth and iterate with screenshot comparison.
- Authoritative target: `references/001-526_12980.png` at exactly 390×860 CSS pixels. Do not infer the viewport from Figma's fractional geometry or another asset.
- Reference determinism gate passed: two consecutive Figma renders were RGBA-identical. If a later reference becomes unstable, stop exact verification until the changing content is frozen.
- Provide the final exact-size screenshot so the user can load it into Figma to Prompt's built-in `Verify AI screenshot` checker.
- Reference render: `references/001-526_12980.png`
- Match design assets by their manifest `nodeId`; bundled paths override any generated filename elsewhere in this prompt.
- Rendered fallbacks are Figma-authored precision assets. Use the PNG variant for the exact 1× target; use the outlined, unsimplified SVG variant when the node must scale. Preserve semantics or interactions with an accessible overlay when needed.
- Rendered fallback (pixel) for node `526:12980` (context-dependent-effect): `fallbacks/001-526_12980.png`
- Rendered fallback (vector) for node `526:12980` (context-dependent-effect): `fallbacks/001-526_12980.svg`

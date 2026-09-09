# Pixel-perfect Figma rebuild: Фильтры чекбоксы

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
- `#FFFFFF` (border)
- `#FFFFFF` (border)
- `#2A2A2A` (text)
- `#2A2A2A` (text)
- `#2A2A2A` (background)
- `#2A2A2A` (background)
- `#292929` (background)
- `#292929` (background)
- `#FFFFFF` (text)
- `#FFFFFF` (text)
- `#2A2A2A` → `var(--Black)` (border)
- `#E2E2E2` (border), opacity: 0.3
- `#E2E2E2` (border), opacity: 0.3
- `#8A8A8A` (border)
- `#8A8A8A` (border)
- `#8A8A8A` (text)
- `#8A8A8A` (text)
### Typography
- Inter 400 16px, letter-spacing: -1%
- Inter 500 16px/26px, letter-spacing: -2%
- Inter 600 17px, letter-spacing: -2%
### Spacing & Radii
- Spacing scale: 2px, 4px, 6px, 8px, 9px, 10px, 12px, 13px, 16px
- Border radii: 6px, 18px, 80px

## Interaction Contract
Implement these Figma prototype settings and reactions explicitly. Preserve scrolling, fixed layers, overlay behavior, trigger/action order, and transitions; do not infer a different behavior from appearance or node names.
- `Фильтры чекбоксы` (`584:17554`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89` (`584:17555`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 84` (`584:17556`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 84 > Frame 81` (`584:17557`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 84 > Frame 81 > check` (`584:17558`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 87` (`584:17561`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 87 > Frame 80` (`584:17562`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 87 > Frame 80 > check` (`584:17563`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 88` (`584:17566`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 88 > Frame 81` (`584:17567`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 88 > Frame 81 > check` (`584:17568`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 89` (`584:17571`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 89 > Frame 81` (`584:17572`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 89 > Frame 81 > check` (`584:17573`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 90` (`584:17576`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 90 > Frame 81` (`584:17577`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 90 > Frame 81 > check` (`584:17578`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 91` (`584:17581`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 91 > Frame 81` (`584:17582`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 91 > Frame 81 > check` (`584:17583`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 92` (`584:17586`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 92 > Frame 81` (`584:17587`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 92 > Frame 81 > check` (`584:17588`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 93` (`584:17591`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 93 > Frame 81` (`584:17592`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 93 > Frame 81 > check` (`584:17593`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 94` (`584:17596`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 94 > Frame 81` (`584:17597`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 89 > Frame 94 > Frame 81 > check` (`584:17598`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Кнопки` (`584:17602`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 121` (`584:17603`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 121 > Frame 122` (`584:17604`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 121 > Frame 122 > Иконки кнопок` (`584:17605`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 121 > Frame 122 > Иконки кнопок > arrow-left-01` (`I584:17605;312:9236`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 121 > Кнопки` (`584:17607`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 120` (`584:17608`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 120 > Поля ввода` (`584:17609`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 120 > Поля ввода > Иконка левая` (`I584:17609;303:8697`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 120 > Поля ввода > Иконка левая > Иконки кнопок` (`I584:17609;303:8698`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Фильтры чекбоксы > Frame 120 > Поля ввода > Иконка левая > Иконки кнопок > search-01` (`I584:17609;303:8698;303:8786`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`

## Component API Contract
Use the documented component properties as the public API. Preserve typed defaults, variants, and active values instead of coercing them from labels.
### Фильтры чекбоксы > Кнопки (`584:17602`)
- Active property values: `{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5596"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}}`
### Фильтры чекбоксы > Frame 121 > Frame 122 > Иконки кнопок (`584:17605`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"arrow-left-01"}}`
### Фильтры чекбоксы > Frame 121 > Frame 122 > Иконки кнопок > arrow-left-01 > Vector (`I584:17605;312:9237`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Фильтры чекбоксы > Frame 121 > Кнопки (`584:17607`)
- Active property values: `{"Icon":{"type":"INSTANCE_SWAP","value":"310:9146"},"Иконка правая":{"type":"BOOLEAN","value":false},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Без обводки"}}`
### Фильтры чекбоксы > Frame 120 > Поля ввода (`584:17609`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Фильтры чекбоксы > Frame 120 > Поля ввода > Иконка левая > Иконки кнопок (`I584:17609;303:8698`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"search-01"}}`

## Fidelity Risk Summary
- Estimated risk: high (66 visible nodes, max depth 6)
- Layout risks: 1 clipped containers, 1 boxes extend outside the root viewport, 66 nodes with constraints, 14 nodes with target aspect ratio
- Asset risks: 13 vector-like nodes
- Paint risks: 66 nodes with layer blend mode, 25 nodes with detailed stroke metadata

## Geometry Checklist
Use these absolute boxes after normalizing the selected root to left 0, top 0. They are derived from `layout.x/y` and help catch drift before styling polish.
- Root `layout.x/y` is the Figma canvas position; do not offset the rendered component by it.
### Bounding Boxes
- Фильтры чекбоксы [FRAME]: left 0, top 0, width 390, height 860, signals: root/clips
- Фильтры чекбоксы > Frame 89 [FRAME]: left 13, top 140, width 364, height 342, signals: top-level
- Фильтры чекбоксы > Frame 89 > Frame 84 [FRAME]: left 13, top 140, width 364, height 38
- Фильтры чекбоксы > Frame 89 > Frame 84 > Frame 81 [FRAME]: left 13, top 149, width 20, height 20
- Фильтры чекбоксы > Frame 89 > Frame 84 > Frame 81 > check [FRAME]: left 15, top 151, width 16, height 16
- Фильтры чекбоксы > Frame 89 > Frame 84 > Frame 81 > check > Vector [VECTOR]: left 18.33, top 155.67, width 9.33, height 6.67, signals: vector
- Фильтры чекбоксы > Frame 89 > Frame 84 > Холст [TEXT]: left 39, top 149.5, width 340, height 19
- Фильтры чекбоксы > Frame 89 > Frame 87 [FRAME]: left 13, top 178, width 364, height 38
- Фильтры чекбоксы > Frame 89 > Frame 87 > Frame 80 [FRAME]: left 13, top 187, width 20, height 20
- Фильтры чекбоксы > Frame 89 > Frame 87 > Frame 80 > check [FRAME]: left 15, top 189, width 16, height 16
- Фильтры чекбоксы > Frame 89 > Frame 87 > Frame 80 > check > Vector [VECTOR]: left 18.33, top 193.67, width 9.33, height 6.67, signals: vector
- Фильтры чекбоксы > Frame 89 > Frame 87 > Масло [TEXT]: left 39, top 187.5, width 340, height 19
- Фильтры чекбоксы > Frame 89 > Frame 88 [FRAME]: left 13, top 216, width 364, height 38
- Фильтры чекбоксы > Frame 89 > Frame 88 > Frame 81 [FRAME]: left 13, top 225, width 20, height 20
- Фильтры чекбоксы > Frame 89 > Frame 88 > Frame 81 > check [FRAME]: left 15, top 227, width 16, height 16
- Фильтры чекбоксы > Frame 89 > Frame 88 > Frame 81 > check > Vector [VECTOR]: left 18.33, top 231.67, width 9.33, height 6.67, signals: vector
- Фильтры чекбоксы > Frame 89 > Frame 88 > Акрил [TEXT]: left 39, top 225.5, width 340, height 19
- Фильтры чекбоксы > Frame 89 > Frame 89 [FRAME]: left 13, top 254, width 364, height 38
- Фильтры чекбоксы > Frame 89 > Frame 89 > Frame 81 [FRAME]: left 13, top 263, width 20, height 20
- Фильтры чекбоксы > Frame 89 > Frame 89 > Frame 81 > check [FRAME]: left 15, top 265, width 16, height 16
- Фильтры чекбоксы > Frame 89 > Frame 89 > Frame 81 > check > Vector [VECTOR]: left 18.33, top 269.67, width 9.33, height 6.67, signals: vector
- Фильтры чекбоксы > Frame 89 > Frame 89 > Шамот [TEXT]: left 39, top 263.5, width 340, height 19
- Фильтры чекбоксы > Frame 89 > Frame 90 [FRAME]: left 13, top 292, width 364, height 38
- Фильтры чекбоксы > Frame 89 > Frame 90 > Frame 81 [FRAME]: left 13, top 301, width 20, height 20
- Фильтры чекбоксы > Frame 89 > Frame 90 > Frame 81 > check [FRAME]: left 15, top 303, width 16, height 16
- Фильтры чекбоксы > Frame 89 > Frame 90 > Frame 81 > check > Vector [VECTOR]: left 18.33, top 307.67, width 9.33, height 6.67, signals: vector
- Фильтры чекбоксы > Frame 89 > Frame 90 > Фарфор [TEXT]: left 39, top 301.5, width 340, height 19
- Фильтры чекбоксы > Frame 89 > Frame 91 [FRAME]: left 13, top 330, width 364, height 38
- Фильтры чекбоксы > Frame 89 > Frame 91 > Frame 81 [FRAME]: left 13, top 339, width 20, height 20
- Фильтры чекбоксы > Frame 89 > Frame 91 > Frame 81 > check [FRAME]: left 15, top 341, width 16, height 16
- Фильтры чекбоксы > Frame 89 > Frame 91 > Frame 81 > check > Vector [VECTOR]: left 18.33, top 345.67, width 9.33, height 6.67, signals: vector
- Фильтры чекбоксы > Frame 89 > Frame 91 > Глина [TEXT]: left 39, top 339.5, width 340, height 19
- Фильтры чекбоксы > Frame 89 > Frame 92 [FRAME]: left 13, top 368, width 364, height 38
- Фильтры чекбоксы > Frame 89 > Frame 92 > Frame 81 [FRAME]: left 13, top 377, width 20, height 20
- Фильтры чекбоксы > Frame 89 > Frame 92 > Frame 81 > check [FRAME]: left 15, top 379, width 16, height 16
- Фильтры чекбоксы > Frame 89 > Frame 92 > Frame 81 > check > Vector [VECTOR]: left 18.33, top 383.67, width 9.33, height 6.67, signals: vector
- Фильтры чекбоксы > Frame 89 > Frame 92 > Бронза [TEXT]: left 39, top 377.5, width 340, height 19
- Фильтры чекбоксы > Frame 89 > Frame 93 [FRAME]: left 13, top 406, width 364, height 38
- Фильтры чекбоксы > Frame 89 > Frame 93 > Frame 81 [FRAME]: left 13, top 415, width 20, height 20
- Фильтры чекбоксы > Frame 89 > Frame 93 > Frame 81 > check [FRAME]: left 15, top 417, width 16, height 16
- Фильтры чекбоксы > Frame 89 > Frame 93 > Frame 81 > check > Vector [VECTOR]: left 18.33, top 421.67, width 9.33, height 6.67, signals: vector
- Фильтры чекбоксы > Frame 89 > Frame 93 > Дерево [TEXT]: left 39, top 415.5, width 340, height 19
- Фильтры чекбоксы > Frame 89 > Frame 94 [FRAME]: left 13, top 444, width 364, height 38
- Фильтры чекбоксы > Frame 89 > Frame 94 > Frame 81 [FRAME]: left 13, top 453, width 20, height 20
- Фильтры чекбоксы > Frame 89 > Frame 94 > Frame 81 > check [FRAME]: left 15, top 455, width 16, height 16
- Фильтры чекбоксы > Frame 89 > Frame 94 > Frame 81 > check > Vector [VECTOR]: left 18.33, top 459.67, width 9.33, height 6.67, signals: vector
- Фильтры чекбоксы > Frame 89 > Frame 94 > Стекло [TEXT]: left 39, top 453.5, width 340, height 19
- Фильтры чекбоксы > Vector [VECTOR]: left 174, top -862, width 42, height 32, signals: top-level/vector
- Фильтры чекбоксы > Кнопки [INSTANCE]: left 13, top 796, width 365, height 44, signals: top-level/component
- Фильтры чекбоксы > Кнопки > Кнопка [TEXT]: left 152, top 805, width 87, height 26
- Фильтры чекбоксы > Frame 121 [FRAME]: left 12, top 20, width 366, height 44, signals: top-level
- Фильтры чекбоксы > Frame 121 > Frame 122 [FRAME]: left 12, top 29, width 246, height 26
- Фильтры чекбоксы > Frame 121 > Frame 122 > Иконки кнопок [INSTANCE]: left 12, top 29, width 26, height 26, signals: component
- Фильтры чекбоксы > Frame 121 > Frame 122 > Иконки кнопок > arrow-left-01 [FRAME]: left 12, top 29, width 26, height 26
- Фильтры чекбоксы > Frame 121 > Frame 122 > Иконки кнопок > arrow-left-01 > Vector [VECTOR]: left 21.75, top 35.5, width 6.5, height 13, signals: vector
- Фильтры чекбоксы > Frame 121 > Frame 122 > Направление работ [TEXT]: left 42, top 31.5, width 216, height 21
- Фильтры чекбоксы > Frame 121 > Кнопки [INSTANCE]: left 270, top 20, width 108, height 44, signals: component
- Фильтры чекбоксы > Frame 121 > Кнопки > Кнопка [TEXT]: left 287, top 29, width 74, height 26
- Фильтры чекбоксы > Frame 120 [FRAME]: left 13, top 82, width 366, height 52, signals: top-level
- Фильтры чекбоксы > Frame 120 > Поля ввода [INSTANCE]: left 13, top 82, width 366, height 52, signals: component
- Фильтры чекбоксы > Frame 120 > Поля ввода > Иконка левая [FRAME]: left 26, top 96, width 22, height 22
- Фильтры чекбоксы > Frame 120 > Поля ввода > Иконка левая > Иконки кнопок [INSTANCE]: left 28, top 98, width 18, height 18, signals: component
- Фильтры чекбоксы > Frame 120 > Поля ввода > Иконка левая > Иконки кнопок > search-01 [FRAME]: left 28, top 98, width 18, height 18
- Фильтры чекбоксы > Frame 120 > Поля ввода > Иконка левая > Иконки кнопок > search-01 > Vector [VECTOR]: left 40.75, top 110.75, width 3, height 3, signals: vector
- Фильтры чекбоксы > Frame 120 > Поля ввода > Иконка левая > Иконки кнопок > search-01 > Vector [VECTOR]: left 30.25, top 100.25, width 12, height 12, signals: vector
- Фильтры чекбоксы > Frame 120 > Поля ввода > Обычный [TEXT]: left 52, top 96, width 49, height 24

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
Фильтры чекбоксы (FRAME, fixed×fixed)
├── Frame 89 (FRAME, vertical, fixed×hug)
│   ├── Frame 84 (FRAME, horizontal, fill×hug)
│   │   ├── Frame 81 (FRAME, horizontal, fixed×fixed)
│   │   │   └── check (FRAME, fixed×fixed)
│   │   │       └── Vector (VECTOR, fixed×fixed)
│   │   └── Холст (TEXT, fixed×hug) "Холст"
│   ├── Frame 87 (FRAME, horizontal, fill×hug)
│   │   ├── Frame 80 (FRAME, horizontal, fixed×fixed)
│   │   │   └── check (FRAME, fixed×fixed)
│   │   │       └── Vector (VECTOR, fixed×fixed)
│   │   └── Масло (TEXT, fixed×hug) "Масло"
│   ├── Frame 88 (FRAME, horizontal, fill×hug)
│   │   ├── Frame 81 (FRAME, horizontal, fixed×fixed)
│   │   │   └── check (FRAME, fixed×fixed)
│   │   │       └── Vector (VECTOR, fixed×fixed)
│   │   └── Акрил (TEXT, fixed×hug) "Акрил"
│   ├── Frame 89 (FRAME, horizontal, fill×hug)
│   │   ├── Frame 81 (FRAME, horizontal, fixed×fixed)
│   │   │   └── check (FRAME, fixed×fixed)
│   │   │       └── Vector (VECTOR, fixed×fixed)
│   │   └── Шамот (TEXT, fixed×hug) "Шамот"
│   ├── Frame 90 (FRAME, horizontal, fill×hug)
│   │   ├── Frame 81 (FRAME, horizontal, fixed×fixed)
│   │   │   └── check (FRAME, fixed×fixed)
│   │   │       └── Vector (VECTOR, fixed×fixed)
│   │   └── Фарфор (TEXT, fixed×hug) "Фарфор"
│   ├── Frame 91 (FRAME, horizontal, fill×hug)
│   │   ├── Frame 81 (FRAME, horizontal, fixed×fixed)
│   │   │   └── check (FRAME, fixed×fixed)
│   │   │       └── Vector (VECTOR, fixed×fixed)
│   │   └── Глина (TEXT, fixed×hug) "Глина"
│   ├── Frame 92 (FRAME, horizontal, fill×hug)
│   │   ├── Frame 81 (FRAME, horizontal, fixed×fixed)
│   │   │   └── check (FRAME, fixed×fixed)
│   │   │       └── Vector (VECTOR, fixed×fixed)
│   │   └── Бронза (TEXT, fixed×hug) "Бронза"
│   ├── Frame 93 (FRAME, horizontal, fill×hug)
│   │   ├── Frame 81 (FRAME, horizontal, fixed×fixed)
│   │   │   └── check (FRAME, fixed×fixed)
│   │   │       └── Vector (VECTOR, fixed×fixed)
│   │   └── Дерево (TEXT, fixed×hug) "Дерево"
│   └── Frame 94 (FRAME, horizontal, fill×hug)
│       ├── Frame 81 (FRAME, horizontal, fixed×fixed)
│       │   └── check (FRAME, fixed×fixed)
│       │       └── Vector (VECTOR, fixed×fixed)
│       └── Стекло (TEXT, fixed×hug) "Стекло"
├── Vector (VECTOR, fixed×fixed)
├── Кнопки (INSTANCE, horizontal, fixed×hug)
│   └── Кнопка (TEXT, hug×hug) "Применить"
├── Frame 121 (FRAME, horizontal, fixed×hug)
│   ├── Frame 122 (FRAME, horizontal, fill×hug)
│   │   ├── Иконки кнопок (INSTANCE, fixed×fixed)
│   │   │   └── arrow-left-01 (FRAME, fixed×fixed)
│   │   │       └── Vector (VECTOR, fixed×fixed)
│   │   └── Направление работ (TEXT, fill×hug) "Направление работ"
│   └── Кнопки (INSTANCE, horizontal, hug×hug)
│       └── Кнопка (TEXT, hug×hug) "Очистить"
└── Frame 120 (FRAME, vertical, hug×hug)
    └── Поля ввода (INSTANCE, horizontal, fixed×hug)
        ├── Иконка левая (FRAME, horizontal, hug×hug)
        │   └── Иконки кнопок (INSTANCE, fixed×fixed)
        │       └── search-01 (FRAME, fixed×fixed)
        │           ├── Vector (VECTOR, fixed×fixed)
        │           └── Vector (VECTOR, fixed×fixed)
        └── Обычный (TEXT, hug×hug) "Поиск"
```

## Component Structure
```
{"id":"584:17554","name":"Фильтры чекбоксы","type":"FRAME","layout":{"width":390,"height":860,"x":2505,"y":108,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"overflow":"hidden","mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"},"children":[{"id":"584:17555","name":"Frame 89","type":"FRAME","layout":{"width":364,"height":342,"x":13,"y":140,"layoutAlign":"stretch","constraints":{"horizontal":"center","vertical":"min"},"mode":"vertical","gap":0,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17556","name":"Frame 84","type":"FRAME","layout":{"width":364,"height":38,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"padding":{"top":9,"right":0,"bottom":9,"left":0},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17557","name":"Frame 81","type":"FRAME","layout":{"width":20,"height":20,"y":9,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","borderRadius":6,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"584:17558","name":"check","type":"FRAME","layout":{"width":16,"height":16,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17559","name":"Vector","type":"VECTOR","layout":{"width":9.33,"height":6.67}}]}]},{"id":"584:17560","name":"Холст","type":"TEXT","text":"Холст","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":340,"height":19,"x":26,"y":9.5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fixed","vertical":"hug"}}}]},{"id":"584:17561","name":"Frame 87","type":"FRAME","layout":{"width":364,"height":38,"y":38,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"padding":{"top":9,"right":0,"bottom":9,"left":0},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17562","name":"Frame 80","type":"FRAME","layout":{"width":20,"height":20,"y":9,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"backgroundColor":"#2A2A2A","borderRadius":6,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"584:17563","name":"check","type":"FRAME","layout":{"width":16,"height":16,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17564","name":"Vector","type":"VECTOR","layout":{"width":9.33,"height":6.67}}]}]},{"id":"584:17565","name":"Масло","type":"TEXT","text":"Масло","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":340,"height":19,"x":26,"y":9.5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fixed","vertical":"hug"}}}]},{"id":"584:17566","name":"Frame 88","type":"FRAME","layout":{"width":364,"height":38,"y":76,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"padding":{"top":9,"right":0,"bottom":9,"left":0},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17567","name":"Frame 81","type":"FRAME","layout":{"width":20,"height":20,"y":9,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","borderRadius":6,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"584:17568","name":"check","type":"FRAME","layout":{"width":16,"height":16,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17569","name":"Vector","type":"VECTOR","layout":{"width":9.33,"height":6.67}}]}]},{"id":"584:17570","name":"Акрил","type":"TEXT","text":"Акрил","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":340,"height":19,"x":26,"y":9.5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fixed","vertical":"hug"}}}]},{"id":"584:17571","name":"Frame 89","type":"FRAME","layout":{"width":364,"height":38,"y":114,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"padding":{"top":9,"right":0,"bottom":9,"left":0},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17572","name":"Frame 81","type":"FRAME","layout":{"width":20,"height":20,"y":9,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","borderRadius":6,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"584:17573","name":"check","type":"FRAME","layout":{"width":16,"height":16,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17574","name":"Vector","type":"VECTOR","layout":{"width":9.33,"height":6.67}}]}]},{"id":"584:17575","name":"Шамот","type":"TEXT","text":"Шамот","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":340,"height":19,"x":26,"y":9.5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fixed","vertical":"hug"}}}]},{"id":"584:17576","name":"Frame 90","type":"FRAME","layout":{"width":364,"height":38,"y":152,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"padding":{"top":9,"right":0,"bottom":9,"left":0},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17577","name":"Frame 81","type":"FRAME","layout":{"width":20,"height":20,"y":9,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","borderRadius":6,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"584:17578","name":"check","type":"FRAME","layout":{"width":16,"height":16,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17579","name":"Vector","type":"VECTOR","layout":{"width":9.33,"height":6.67}}]}]},{"id":"584:17580","name":"Фарфор","type":"TEXT","text":"Фарфор","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":340,"height":19,"x":26,"y":9.5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fixed","vertical":"hug"}}}]},{"id":"584:17581","name":"Frame 91","type":"FRAME","layout":{"width":364,"height":38,"y":190,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"padding":{"top":9,"right":0,"bottom":9,"left":0},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17582","name":"Frame 81","type":"FRAME","layout":{"width":20,"height":20,"y":9,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","borderRadius":6,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"584:17583","name":"check","type":"FRAME","layout":{"width":16,"height":16,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17584","name":"Vector","type":"VECTOR","layout":{"width":9.33,"height":6.67}}]}]},{"id":"584:17585","name":"Глина","type":"TEXT","text":"Глина","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":340,"height":19,"x":26,"y":9.5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fixed","vertical":"hug"}}}]},{"id":"584:17586","name":"Frame 92","type":"FRAME","layout":{"width":364,"height":38,"y":228,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"padding":{"top":9,"right":0,"bottom":9,"left":0},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17587","name":"Frame 81","type":"FRAME","layout":{"width":20,"height":20,"y":9,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","borderRadius":6,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"584:17588","name":"check","type":"FRAME","layout":{"width":16,"height":16,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17589","name":"Vector","type":"VECTOR","layout":{"width":9.33,"height":6.67}}]}]},{"id":"584:17590","name":"Бронза","type":"TEXT","text":"Бронза","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":340,"height":19,"x":26,"y":9.5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fixed","vertical":"hug"}}}]},{"id":"584:17591","name":"Frame 93","type":"FRAME","layout":{"width":364,"height":38,"y":266,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"padding":{"top":9,"right":0,"bottom":9,"left":0},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17592","name":"Frame 81","type":"FRAME","layout":{"width":20,"height":20,"y":9,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","borderRadius":6,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"584:17593","name":"check","type":"FRAME","layout":{"width":16,"height":16,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17594","name":"Vector","type":"VECTOR","layout":{"width":9.33,"height":6.67}}]}]},{"id":"584:17595","name":"Дерево","type":"TEXT","text":"Дерево","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":340,"height":19,"x":26,"y":9.5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fixed","vertical":"hug"}}}]},{"id":"584:17596","name":"Frame 94","type":"FRAME","layout":{"width":364,"height":38,"y":304,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"padding":{"top":9,"right":0,"bottom":9,"left":0},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17597","name":"Frame 81","type":"FRAME","layout":{"width":20,"height":20,"y":9,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","borderRadius":6,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"584:17598","name":"check","type":"FRAME","layout":{"width":16,"height":16,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17599","name":"Vector","type":"VECTOR","layout":{"width":9.33,"height":6.67}}]}]},{"id":"584:17600","name":"Стекло","type":"TEXT","text":"Стекло","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":340,"height":19,"x":26,"y":9.5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fixed","vertical":"hug"}}}]}]},{"id":"584:17601","name":"Vector","type":"VECTOR","layout":{"width":42,"height":32}},{"id":"584:17602","name":"Кнопки","type":"INSTANCE","layout":{"width":365,"height":44,"x":13,"y":796,"layoutAlign":"inherit","constraints":{"horizontal":"center","vertical":"max"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":8,"right":16,"bottom":8,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#292929"}],"backgroundColor":"#292929","borderRadius":80,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Иконка правая":"false","Icon":"297:5596","Иконка левая":"false","Обычная":"Черная"},"componentPropertyDetails":{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5596"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}},"children":[{"id":"I584:17602;278:4690","name":"Кнопка","type":"TEXT","text":"Применить","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":26,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":87,"height":26,"x":139,"y":9,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"584:17603","name":"Frame 121","type":"FRAME","layout":{"width":366,"height":44,"x":12,"y":20,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17604","name":"Frame 122","type":"FRAME","layout":{"width":246,"height":26,"y":9,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17605","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":26,"height":26,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"arrow-left-01"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"arrow-left-01"}},"children":[{"id":"I584:17605;312:9236","name":"arrow-left-01","type":"FRAME","layout":{"width":26,"height":26,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I584:17605;312:9237","name":"Vector","type":"VECTOR","layout":{"width":6.5,"height":13}}]}]},{"id":"584:17606","name":"Направление работ","type":"TEXT","text":"Направление работ","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Semi Bold","fontSize":17,"fontWeight":600,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":216,"height":21,"x":30,"y":2.5,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]},{"id":"584:17607","name":"Кнопки","type":"INSTANCE","layout":{"width":108,"height":44,"x":258,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":8,"right":16,"bottom":8,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":80,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"borderColor":"#FFFFFF","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1},"opacity":0},"componentProperties":{"Icon":"310:9146","Иконка правая":"false","Иконка левая":"false","Обычная":"Без обводки"},"componentPropertyDetails":{"Icon":{"type":"INSTANCE_SWAP","value":"310:9146"},"Иконка правая":{"type":"BOOLEAN","value":false},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Без обводки"}},"children":[{"id":"I584:17607;278:4581","name":"Кнопка","type":"TEXT","text":"Очистить","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":26,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":74,"height":26,"x":17,"y":9,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]},{"id":"584:17608","name":"Frame 120","type":"FRAME","layout":{"width":366,"height":52,"x":13,"y":82,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":0,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","opacity":0.3,"color":"#E2E2E2"}],"borderColor":"#E2E2E2","borderOpacity":0.3,"borderWidth":1,"strokeAlign":"outside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"584:17609","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I584:17609;303:8697","name":"Иконка левая","type":"FRAME","layout":{"width":22,"height":22,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I584:17609;303:8698","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"search-01"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"search-01"}},"children":[{"id":"I584:17609;303:8698;303:8786","name":"search-01","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I584:17609;303:8698;303:8787","name":"Vector","type":"VECTOR","layout":{"width":3,"height":3}},{"id":"I584:17609;303:8698;303:8788","name":"Vector","type":"VECTOR","layout":{"width":12,"height":12}}]}]}]},{"id":"I584:17609;285:4864","name":"Обычный","type":"TEXT","text":"Поиск","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":49,"height":24,"x":39,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}]}
```

## Capture Bundle Inputs (Authoritative)
- Keep this bundle intact. Resolve every path relative to the bundle root.
- Review `mcp/figma-locator.json` before calling a Figma MCP tool. Prefer each node's exact `locator.sourceUrl`; otherwise pass its `locator.fileKey` and colon-form `locator.nodeId` through the MCP tool's documented inputs.
- Locator data is for discovery or refresh only. An MCP re-capture creates a new immutable capture; it never replaces the evidence in this bundle.
- This capture has no Figma file key, so MCP cannot reopen its source; rely on the bundled evidence.
- Review `fidelity/coverage.json` before implementation. Every listed node must use its exact pixel fallback or an equivalent implementation proven by the final RGBA comparison.
- Use the reference renders below as the visual source of truth and iterate with screenshot comparison.
- Authoritative target: `references/001-584_17554.png` at exactly 390×860 CSS pixels. Do not infer the viewport from Figma's fractional geometry or another asset.
- Reference determinism gate passed: two consecutive Figma renders were RGBA-identical. If a later reference becomes unstable, stop exact verification until the changing content is frozen.
- Provide the final exact-size screenshot so the user can load it into Figma to Prompt's built-in `Verify AI screenshot` checker.
- Reference render: `references/001-584_17554.png`
- Match design assets by their manifest `nodeId`; bundled paths override any generated filename elsewhere in this prompt.
- Rendered fallbacks are Figma-authored precision assets. Use the PNG variant for the exact 1× target; use the outlined, unsimplified SVG variant when the node must scale. Preserve semantics or interactions with an accessible overlay when needed.
- Rendered fallback (pixel) for node `584:17554` (context-dependent-effect): `fallbacks/001-584_17554.png`
- Rendered fallback (vector) for node `584:17554` (context-dependent-effect): `fallbacks/001-584_17554.svg`

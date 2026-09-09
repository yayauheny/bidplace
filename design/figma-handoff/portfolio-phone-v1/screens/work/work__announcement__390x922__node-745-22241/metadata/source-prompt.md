# Pixel-perfect Figma rebuild: Каталог работ / анонс 

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
- `#000000` (background), opacity: 0.5
- `#000000` (background), opacity: 0.5
- `#731A06` (background)
- `#731A06` (background)
- `#FFFFFF` → `var(--White)` (text)
- `#FFFFFF` → `var(--White)` (text)
- `#2A2A2A` (background)
- `#2A2A2A` (background)
- `#DEDEDE` (background)
- `#DEDEDE` (background)
- `#2A2A2A` (text)
- `#2A2A2A` (text)
- `#565656` (text)
- `#565656` (text)
- `#565656` (border)
- `#565656` (border)
- `#FFFFFF` (background), opacity: 0.8
- `#FFFFFF` (background), opacity: 0.8
- `#E2E2E2` (border)
- `#E2E2E2` (border)
- `#2A2A2A` → `var(--Black)` (text)
- `#949494` (background)
- `#2A2A2A` (border), opacity: 0.5
- `#949494` (background)
- `#2A2A2A` (border), opacity: 0.5
- `#FFFFFF` (border)
- `#FFFFFF` (border)
- `#FFFFFF` (text)
- `#2A2A2A` (border)
- `#2A2A2A` (border)
### Typography
- Geist 500 13px, letter-spacing: -1%
- Inter 500 13px, letter-spacing: -1%
- Inter 600 20px, letter-spacing: -2%
- Inter 400 16px, letter-spacing: -1%
- Inter 500 14px, letter-spacing: -1%
- Inter 400 12px, letter-spacing: -2%
- Inter 500 22px, letter-spacing: -1%
- Inter 500 16px/26px, letter-spacing: -2%
### Spacing & Radii
- Spacing scale: 2px, 4px, 6px, 8px, 10px, 12px, 14px, 16px, 40px
- Border radii: 20px, 28px, 40px, 200px

## Interaction Contract
Implement these Figma prototype settings and reactions explicitly. Preserve scrolling, fixed layers, overlay behavior, trigger/action order, and transitions; do not infer a different behavior from appearance or node names.
- `Каталог работ / анонс ` (`745:22241`) prototype settings: `{"overflowDirection":"none","fixedChildIds":["745:22364","745:22365"],"overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 5` (`745:22242`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 5 > Frame 170` (`745:22243`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 5 > Frame 170 > Frame 82` (`745:22244`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 5 > Frame 170 > Frame 152` (`745:22247`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 151` (`745:22249`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147` (`745:22255`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176` (`745:22256`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 135` (`745:22257`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 135 > Frame 187` (`745:22258`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 135 > Frame 187 > Frame 180` (`745:22260`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 135 > Frame 187 > Frame 180 > Иконки кнопок` (`745:22262`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 135 > Frame 187 > Frame 180 > Иконки кнопок > arrow-right-01` (`I745:22262;312:9242`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 135 > Frame 61` (`745:22263`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 135 > Frame 61 > Frame 10` (`745:22264`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 135 > Frame 61 > Frame 11` (`745:22266`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 135 > Frame 61 > Frame 8` (`745:22268`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 135 > Frame 61 > Frame 9` (`745:22270`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 201` (`745:22591`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 201 > Frame 127` (`745:22592`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 201 > Frame 127 > Frame 154` (`745:22593`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 201 > Frame 127 > Frame 154 > Frame 200` (`745:22595`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 201 > Frame 127 > Frame 154 > Frame 200 > Frame 141` (`745:22596`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 201 > Frame 174` (`745:22598`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 201 > Frame 174 > Кнопки` (`745:22604`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 201 > Frame 174 > Кнопки > Иконка левая` (`I745:22604;298:6041`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 201 > Frame 174 > Кнопки > Иконка левая > Иконки кнопок` (`I745:22604;298:6042`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 201 > Frame 174 > Кнопки > Иконка левая > Иконки кнопок > clock-04` (`I745:22604;298:6042;456:7987`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 76` (`745:22365`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 76 > Frame 63` (`745:22366`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 76 > Frame 63 > Frame 39` (`745:22367`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 76 > Frame 63 > Frame 39 > shopping-basket-01` (`745:22368`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 76 > Frame 77` (`745:22371`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 76 > Frame 77 > Frame 63` (`745:22372`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 76 > Frame 77 > Frame 63 > Frame 39` (`745:22373`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 76 > Frame 77 > Frame 63 > Frame 39 > heart` (`745:22374`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 76 > Frame 77 > Frame 63 > Frame 40` (`745:22376`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Каталог работ / анонс  > Frame 76 > Frame 77 > Frame 63 > Frame 40 > share-04` (`745:22377`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`

## Component API Contract
Use the documented component properties as the public API. Preserve typed defaults, variants, and active values instead of coercing them from labels.
### Каталог работ / анонс  > Frame 5 > Frame 170 > Frame 82 > Анонс (`745:22246`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Каталог работ / анонс  > Frame 5 > Frame 170 > Frame 152 > В продаже через: 13д 24ч 40м (`745:22248`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 135 > Frame 187 > Frame 180 > Иконки кнопок (`745:22262`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"arrow-right-01"}}`
### Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 201 > Frame 127 > Frame 154 > Frame 200 > Frame 141 > 500 BYN (`745:22597`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 201 > Frame 174 > Кнопки (`745:22604`)
- Active property values: `{"Icon":{"type":"INSTANCE_SWAP","value":"456:7973"},"Иконка правая":{"type":"BOOLEAN","value":false},"Иконка левая":{"type":"BOOLEAN","value":true},"Обычная":{"type":"VARIANT","value":"Черная недоступно"}}`
### Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 201 > Frame 174 > Кнопки > Иконка левая (`I745:22604;298:6041`)
- Sublayer property references: `{"visible":"Иконка левая"}`
### Каталог работ / анонс  > Frame 147 > Frame 176 > Frame 201 > Frame 174 > Кнопки > Иконка левая > Иконки кнопок (`I745:22604;298:6042`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"clock-04"}}`
- Sublayer property references: `{"mainComponent":"Icon"}`

## Fidelity Risk Summary
- Estimated risk: high (65 visible nodes, max depth 9)
- Layout risks: 2 clipped containers, 65 nodes with constraints, 14 nodes with target aspect ratio
- Asset risks: 2 image fills, 2 image fills with crop/filter/opacity metadata, 10 vector-like nodes
- Paint risks: 2 blur effect nodes, 65 nodes with layer blend mode, 11 nodes with detailed stroke metadata

## Geometry Checklist
Use these absolute boxes after normalizing the selected root to left 0, top 0. They are derived from `layout.x/y` and help catch drift before styling polish.
- Root `layout.x/y` is the Figma canvas position; do not offset the rendered component by it.
### Bounding Boxes
- Каталог работ / анонс [FRAME]: left 0, top 0, width 390, height 922, signals: root/clips
- Каталог работ / анонс > Frame 5 [FRAME]: left 0, top 50, width 390, height 520, signals: top-level/clips/image
- Каталог работ / анонс > Frame 5 > Frame 170 [FRAME]: left 12, top 533, width 366, height 25
- Каталог работ / анонс > Frame 5 > Frame 170 > Frame 82 [FRAME]: left 12, top 533, width 71, height 25
- Каталог работ / анонс > Frame 5 > Frame 170 > Frame 82 > Rectangle 2 [RECTANGLE]: left 22, top 542.5, width 6, height 6
- Каталог работ / анонс > Frame 5 > Frame 170 > Frame 82 > Анонс [TEXT]: left 34, top 537, width 39, height 17
- Каталог работ / анонс > Frame 5 > Frame 170 > Frame 152 [FRAME]: left 163, top 533, width 215, height 24
- Каталог работ / анонс > Frame 5 > Frame 170 > Frame 152 > В продаже через: 13д 24ч 40м [TEXT]: left 173, top 537, width 195, height 16
- Каталог работ / анонс > Frame 151 [FRAME]: left 164, top 582, width 62, height 6, signals: top-level
- Каталог работ / анонс > Frame 151 > Rectangle 2 [RECTANGLE]: left 164, top 582, width 6, height 6
- Каталог работ / анонс > Frame 151 > Rectangle 3 [RECTANGLE]: left 178, top 582, width 6, height 6
- Каталог работ / анонс > Frame 151 > Rectangle 4 [RECTANGLE]: left 192, top 582, width 6, height 6
- Каталог работ / анонс > Frame 151 > Rectangle 5 [RECTANGLE]: left 206, top 582, width 6, height 6
- Каталог работ / анонс > Frame 151 > Rectangle 6 [RECTANGLE]: left 220, top 582, width 6, height 6
- Каталог работ / анонс > Frame 147 [FRAME]: left 12, top 608, width 366, height 281, signals: top-level
- Каталог работ / анонс > Frame 147 > Frame 176 [FRAME]: left 12, top 608, width 366, height 281
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 135 [FRAME]: left 12, top 608, width 366, height 116
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 135 > Frame 187 [FRAME]: left 12, top 608, width 366, height 75
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 135 > Frame 187 > Salvador Dalí Estate & Fundació Gala Сальвадор Дали [TEXT]: left 12, top 608, width 366, height 48
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 135 > Frame 187 > Frame 180 [FRAME]: left 12, top 664, width 137, height 19
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 135 > Frame 187 > Frame 180 > Илья Васильев [TEXT]: left 12, top 664, width 117, height 19
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 135 > Frame 187 > Frame 180 > Иконки кнопок [INSTANCE]: left 131, top 664.5, width 18, height 18, signals: component
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 135 > Frame 187 > Frame 180 > Иконки кнопок > arrow-right-01 [FRAME]: left 131, top 664.5, width 18, height 18
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 135 > Frame 187 > Frame 180 > Иконки кнопок > arrow-right-01 > Vector [VECTOR]: left 137.75, top 669, width 4.5, height 9, signals: vector
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 135 > Frame 61 [FRAME]: left 12, top 695, width 311, height 29
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 135 > Frame 61 > Frame 10 [FRAME]: left 12, top 695, width 69, height 29
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 135 > Frame 61 > Frame 10 > Минск [TEXT]: left 24, top 701, width 45, height 17
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 135 > Frame 61 > Frame 11 [FRAME]: left 87, top 695, width 74, height 29
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 135 > Frame 61 > Frame 11 > Бумага [TEXT]: left 99, top 701, width 50, height 17
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 135 > Frame 61 > Frame 8 [FRAME]: left 167, top 695, width 90, height 29
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 135 > Frame 61 > Frame 8 > Акварель [TEXT]: left 179, top 701, width 66, height 17
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 135 > Frame 61 > Frame 9 [FRAME]: left 263, top 695, width 60, height 29
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 135 > Frame 61 > Frame 9 > Тушь [TEXT]: left 275, top 701, width 36, height 17
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 201 [FRAME]: left 12, top 740, width 366, height 149
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 201 > Frame 127 [FRAME]: left 12, top 740, width 366, height 85
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 201 > Frame 127 > Frame 154 [FRAME]: left 12, top 752, width 366, height 61
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 201 > Frame 127 > Frame 154 > Начальная цена [TEXT]: left 12, top 752, width 366, height 15
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 201 > Frame 127 > Frame 154 > Frame 200 [FRAME]: left 148.5, top 767, width 93, height 46
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 201 > Frame 127 > Frame 154 > Frame 200 > Frame 141 [FRAME]: left 148.5, top 767, width 93, height 46
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 201 > Frame 127 > Frame 154 > Frame 200 > Frame 141 > 500 BYN [TEXT]: left 148.5, top 777, width 93, height 27
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 201 > Frame 174 [FRAME]: left 12, top 833, width 366, height 56
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 201 > Frame 174 > Кнопки [INSTANCE]: left 12, top 833, width 366, height 56, signals: component
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 201 > Frame 174 > Кнопки > Иконка левая [FRAME]: left 133, top 848, width 26, height 26
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 201 > Frame 174 > Кнопки > Иконка левая > Иконки кнопок [INSTANCE]: left 137, top 852, width 18, height 18, signals: component
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 201 > Frame 174 > Кнопки > Иконка левая > Иконки кнопок > clock-04 [FRAME]: left 137, top 852, width 18, height 18
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 201 > Frame 174 > Кнопки > Иконка левая > Иконки кнопок > clock-04 > Vector [VECTOR]: left 138.88, top 853.5, width 14.63, height 15, signals: vector
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 201 > Frame 174 > Кнопки > Иконка левая > Иконки кнопок > clock-04 > Vector [VECTOR]: left 146, top 858, width 1.5, height 4.5, signals: vector
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 201 > Frame 174 > Кнопки > Иконка левая > Иконки кнопок > clock-04 > Vector [VECTOR]: left 138.5, top 861, width 5.25, height 7.5, signals: vector
- Каталог работ / анонс > Frame 147 > Frame 176 > Frame 201 > Frame 174 > Кнопки > Кнопка [TEXT]: left 161, top 848, width 96, height 26
- Каталог работ / анонс > Change-This [VECTOR]: left 0.44, top 0, width 389.56, height 49.78, signals: top-level/image/vector
- Каталог работ / анонс > Frame 76 [FRAME]: left 20, top 62, width 350, height 48, signals: top-level
- Каталог работ / анонс > Frame 76 > Frame 63 [FRAME]: left 20, top 62, width 48, height 48
- Каталог работ / анонс > Frame 76 > Frame 63 > Frame 39 [FRAME]: left 26, top 68, width 36, height 36
- Каталог работ / анонс > Frame 76 > Frame 63 > Frame 39 > shopping-basket-01 [FRAME]: left 30, top 72, width 28, height 28
- Каталог работ / анонс > Frame 76 > Frame 63 > Frame 39 > shopping-basket-01 > Vector [VECTOR]: left 34.67, top 80.17, width 18.67, height 17.5, signals: vector
- Каталог работ / анонс > Frame 76 > Frame 63 > Frame 39 > shopping-basket-01 > Vector [VECTOR]: left 39.33, top 74.33, width 9.33, height 8.75, signals: vector
- Каталог работ / анонс > Frame 76 > Frame 77 [FRAME]: left 272, top 62, width 98, height 48
- Каталог работ / анонс > Frame 76 > Frame 77 > Frame 63 [FRAME]: left 272, top 62, width 98, height 48
- Каталог работ / анонс > Frame 76 > Frame 77 > Frame 63 > Frame 39 [FRAME]: left 282, top 68, width 36, height 36
- Каталог работ / анонс > Frame 76 > Frame 77 > Frame 63 > Frame 39 > heart [FRAME]: left 286, top 72, width 28, height 28
- Каталог работ / анонс > Frame 76 > Frame 77 > Frame 63 > Frame 39 > heart > Vector [VECTOR]: left 288.33, top 76.08, width 23.33, height 19.83, signals: vector
- Каталог работ / анонс > Frame 76 > Frame 77 > Frame 63 > Frame 40 [FRAME]: left 324, top 68, width 36, height 36
- Каталог работ / анонс > Frame 76 > Frame 77 > Frame 63 > Frame 40 > share-04 [FRAME]: left 328, top 72, width 28, height 28
- Каталог работ / анонс > Frame 76 > Frame 77 > Frame 63 > Frame 40 > share-04 > Vector [VECTOR]: left 331.5, top 75.5, width 21, height 21, signals: vector
- Каталог работ / анонс > Frame 76 > Frame 77 > Frame 63 > Frame 40 > share-04 > Vector [VECTOR]: left 340.83, top 75.5, width 11.67, height 11.67, signals: vector

## Assets
Image files included with this spec — use as `<img>` or CSS `background-image`:
- `Каталог_работ___анонс__Frame_5.png` → Frame 5 (390×520, fill, scaling 0.5, transform [[1,0,0],[0,1,0]])
- `Каталог_работ___анонс__Change-This.png` → Change-This (390×50, crop, scaling 0.5, transform [[1,0,0],[0,0.06,0]], filters {"saturation":0.5})

## Pixel Perfect Template
You are rebuilding this Figma frame for an exact visual match. Treat the JSON as geometry/style data and the reference image/assets as visual evidence.

### Required Inputs
- JSON component structure below.
- If a whole-frame reference image is supplied separately, use it as the visual source of truth.
- Use every listed exported image file exactly; if any required asset is missing, stop and ask for it.

### Render Target
- Build one exact 390×922 frame.
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
- Build against one exact 390×922 viewport with `html, body { margin: 0; }` and global `box-sizing: border-box`.
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
Каталог работ / анонс  (FRAME, fixed×fixed)
├── Frame 5 (FRAME, vertical, fixed×fixed)
│   └── Frame 170 (FRAME, horizontal, fill×hug)
│       ├── Frame 82 (FRAME, horizontal, hug×hug)
│       │   ├── Rectangle 2 (RECTANGLE, fixed×fixed)
│       │   └── Анонс (TEXT, hug×hug) "Анонс"
│       └── Frame 152 (FRAME, horizontal, hug×hug)
│           └── В продаже через: 13д 24ч 40м (TEXT, hug×hug) "В продаже через: 13д 24ч 40м"
├── Frame 151 (FRAME, horizontal, hug×hug)
│   ├── Rectangle 2 (RECTANGLE, fixed×fixed)
│   ├── Rectangle 3 (RECTANGLE, fixed×fixed)
│   ├── Rectangle 4 (RECTANGLE, fixed×fixed)
│   ├── Rectangle 5 (RECTANGLE, fixed×fixed)
│   └── Rectangle 6 (RECTANGLE, fixed×fixed)
├── Frame 147 (FRAME, vertical, fixed×hug)
│   └── Frame 176 (FRAME, vertical, fill×hug)
│       ├── Frame 135 (FRAME, vertical, fill×hug)
│       │   ├── Frame 187 (FRAME, vertical, fill×hug)
│       │   │   ├── Salvador Dalí Estate & Fundació Gala Сальвадор Дали (TEXT, fill×hug) "Salvador Dalí Estate & Fundació Gala Сал…"
│       │   │   └── Frame 180 (FRAME, horizontal, hug×hug)
│       │   │       ├── Илья Васильев (TEXT, hug×hug) "Илья Васильев"
│       │   │       └── Иконки кнопок (INSTANCE, fixed×fixed)
│       │   │           └── arrow-right-01 (FRAME, fixed×fixed)
│       │   │               └── Vector (VECTOR, fixed×fixed)
│       │   └── Frame 61 (FRAME, horizontal, hug×hug)
│       │       ├── Frame 10 (FRAME, horizontal, hug×hug)
│       │       │   └── Минск (TEXT, hug×hug) "Минск"
│       │       ├── Frame 11 (FRAME, horizontal, hug×hug)
│       │       │   └── Бумага (TEXT, hug×hug) "Бумага"
│       │       ├── Frame 8 (FRAME, horizontal, hug×hug)
│       │       │   └── Акварель (TEXT, hug×hug) "Акварель"
│       │       └── Frame 9 (FRAME, horizontal, hug×hug)
│       │           └── Тушь (TEXT, hug×hug) "Тушь"
│       └── Frame 201 (FRAME, vertical, fill×hug)
│           ├── Frame 127 (FRAME, vertical, fill×hug)
│           │   └── Frame 154 (FRAME, vertical, fill×hug)
│           │       ├── Начальная цена (TEXT, fill×hug) "Начальная цена"
│           │       └── Frame 200 (FRAME, horizontal, hug×hug)
│           │           └── Frame 141 (FRAME, horizontal, hug×hug)
│           │               └── 500 BYN (TEXT, hug×hug) "500 BYN"
│           └── Frame 174 (FRAME, vertical, fill×hug)
│               └── Кнопки (INSTANCE, horizontal, fill×hug)
│                   ├── Иконка левая (FRAME, horizontal, hug×hug)
│                   │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│                   │       └── clock-04 (FRAME, fixed×fixed)
│                   │           ├── Vector (VECTOR, fixed×fixed)
│                   │           ├── Vector (VECTOR, fixed×fixed)
│                   │           └── Vector (VECTOR, fixed×fixed)
│                   └── Кнопка (TEXT, hug×hug) "13д 24ч 40м"
├── Change-This (VECTOR, fixed×fixed)
└── Frame 76 (FRAME, horizontal, fixed×hug)
    ├── Frame 63 (FRAME, horizontal, hug×hug)
    │   └── Frame 39 (FRAME, horizontal, hug×hug)
    │       └── shopping-basket-01 (FRAME, fixed×fixed)
    │           ├── Vector (VECTOR, fixed×fixed)
    │           └── Vector (VECTOR, fixed×fixed)
    └── Frame 77 (FRAME, horizontal, hug×hug)
        └── Frame 63 (FRAME, horizontal, hug×hug)
            ├── Frame 39 (FRAME, horizontal, hug×hug)
            │   └── heart (FRAME, fixed×fixed)
            │       └── Vector (VECTOR, fixed×fixed)
            └── Frame 40 (FRAME, horizontal, hug×hug)
                └── share-04 (FRAME, fixed×fixed)
                    ├── Vector (VECTOR, fixed×fixed)
                    └── Vector (VECTOR, fixed×fixed)
```

## Component Structure
```
{"id":"745:22241","name":"Каталог работ / анонс ","type":"FRAME","layout":{"width":390,"height":922,"x":2688,"y":3926,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"overflow":"hidden","mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"},"children":[{"id":"745:22242","name":"Frame 5","type":"FRAME","layout":{"width":390,"height":520,"y":50,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":264,"y":352},"overflow":"hidden","mode":"vertical","gap":10,"strokesIncludedInLayout":true,"padding":{"top":0,"right":12,"bottom":12,"left":12},"primaryAxisAlign":"max","counterAxisAlign":"max","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"image","sourceType":"IMAGE","imageHash":"a81d9d74593e2d15cdef5fb4b8111b99a7d3c232","scaleMode":"fill","transform":[[1,0,0],[0,1,0]],"scalingFactor":0.5}],"cornerRadii":{"topLeft":0,"topRight":0,"bottomRight":20,"bottomLeft":20},"imageFillHash":"a81d9d74593e2d15cdef5fb4b8111b99a7d3c232","imageFillScaleMode":"fill","imageFillTransform":[[1,0,0],[0,1,0]],"imageFillScalingFactor":0.5},"children":[{"id":"745:22243","name":"Frame 170","type":"FRAME","layout":{"width":366,"height":25,"x":12,"y":483,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"primaryAxisAlign":"space-between","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22244","name":"Frame 82","type":"FRAME","layout":{"width":71,"height":25,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"padding":{"top":4,"right":10,"bottom":4,"left":10},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.5,"color":"#000000"}],"backgroundColor":"#000000","backgroundOpacity":0.5,"borderRadius":28,"strokes":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","opacity":0.16,"gradientType":"linear","css":"linear-gradient(#FFFFFF 0%, #999999 100%)","gradientStops":[{"color":"#FFFFFF","position":0},{"color":"#999999","position":1}],"transform":[[0,1,0],[-1,0,1]]}]},"children":[{"id":"745:22245","name":"Rectangle 2","type":"RECTANGLE","layout":{"width":6,"height":6,"x":10,"y":9.5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#731A06"}],"backgroundColor":"#731A06","borderRadius":20}},{"id":"745:22246","name":"Анонс","type":"TEXT","text":"Анонс","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF","variable":"White"}],"color":"#FFFFFF","variables":{"color":"White"},"fontFamily":"Geist","fontStyleName":"Medium","fontSize":13,"fontWeight":500,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":39,"height":17,"x":22,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"745:22247","name":"Frame 152","type":"FRAME","layout":{"width":215,"height":24,"x":151,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"padding":{"top":4,"right":10,"bottom":4,"left":10},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.5,"color":"#000000"}],"backgroundColor":"#000000","backgroundOpacity":0.5,"borderRadius":28,"strokes":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","opacity":0.16,"gradientType":"linear","css":"linear-gradient(#FFFFFF 0%, #999999 100%)","gradientStops":[{"color":"#FFFFFF","position":0},{"color":"#999999","position":1}],"transform":[[0,1,0],[-1,0,1]]}]},"children":[{"id":"745:22248","name":"В продаже через: 13д 24ч 40м","type":"TEXT","text":"В продаже через: 13д 24ч 40м","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF","variable":"White"}],"color":"#FFFFFF","variables":{"color":"White"},"fontFamily":"Inter","fontStyleName":"Medium","fontSize":13,"fontWeight":500,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":195,"height":16,"x":10,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}]},{"id":"745:22249","name":"Frame 151","type":"FRAME","layout":{"width":62,"height":6,"x":164,"y":582,"layoutAlign":"inherit","constraints":{"horizontal":"center","vertical":"min"},"mode":"horizontal","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22250","name":"Rectangle 2","type":"RECTANGLE","layout":{"width":6,"height":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"backgroundColor":"#2A2A2A","borderRadius":20}},{"id":"745:22251","name":"Rectangle 3","type":"RECTANGLE","layout":{"width":6,"height":6,"x":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}},{"id":"745:22252","name":"Rectangle 4","type":"RECTANGLE","layout":{"width":6,"height":6,"x":28,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}},{"id":"745:22253","name":"Rectangle 5","type":"RECTANGLE","layout":{"width":6,"height":6,"x":42,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}},{"id":"745:22254","name":"Rectangle 6","type":"RECTANGLE","layout":{"width":6,"height":6,"x":56,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}}]},{"id":"745:22255","name":"Frame 147","type":"FRAME","layout":{"width":366,"height":281,"x":12,"y":608,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":40,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22256","name":"Frame 176","type":"FRAME","layout":{"width":366,"height":281,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":16,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22257","name":"Frame 135","type":"FRAME","layout":{"width":366,"height":116,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22258","name":"Frame 187","type":"FRAME","layout":{"width":366,"height":75,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22259","name":"Salvador Dalí Estate & Fundació Gala Сальвадор Дали","type":"TEXT","text":"Salvador Dalí Estate & Fundació Gala Сальвадор Дали","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Semi Bold","fontSize":20,"fontWeight":600,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":366,"height":48,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"745:22260","name":"Frame 180","type":"FRAME","layout":{"width":137,"height":19,"y":56,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22261","name":"Илья Васильев","type":"TEXT","text":"Илья Васильев","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":117,"height":19,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}},{"id":"745:22262","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":119,"y":0.5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"arrow-right-01"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"arrow-right-01"}},"children":[{"id":"I745:22262;312:9242","name":"arrow-right-01","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I745:22262;312:9243","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":9}}]}]}]}]},{"id":"745:22263","name":"Frame 61","type":"FRAME","layout":{"width":311,"height":29,"y":87,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"wrap":"wrap","counterAxisSpacing":6,"counterAxisAlignContent":"auto","strokesIncludedInLayout":true,"primaryAxisAlign":"center","counterAxisAlign":"min","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22264","name":"Frame 10","type":"FRAME","layout":{"width":69,"height":29,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":6,"right":12,"bottom":6,"left":12},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.8,"color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","backgroundOpacity":0.8,"strokeStyleName":"White border block","borderRadius":28,"strokes":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","gradientType":"linear","css":"linear-gradient(#DEDEDE 0%, #F3F3F3 100%)","gradientStops":[{"color":"#DEDEDE","position":0},{"color":"#F3F3F3","position":1}],"transform":[[0.89,0.11,0],[-0.11,0.11,0.5]]}]},"children":[{"id":"745:22265","name":"Минск","type":"TEXT","text":"Минск","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Medium","fontSize":14,"fontWeight":500,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":45,"height":17,"x":12,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"745:22266","name":"Frame 11","type":"FRAME","layout":{"width":74,"height":29,"x":75,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":6,"right":12,"bottom":6,"left":12},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.8,"color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","backgroundOpacity":0.8,"strokeStyleName":"White border block","borderRadius":28,"strokes":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","gradientType":"linear","css":"linear-gradient(#DEDEDE 0%, #F3F3F3 100%)","gradientStops":[{"color":"#DEDEDE","position":0},{"color":"#F3F3F3","position":1}],"transform":[[0.89,0.11,0],[-0.11,0.11,0.5]]}]},"children":[{"id":"745:22267","name":"Бумага","type":"TEXT","text":"Бумага","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Medium","fontSize":14,"fontWeight":500,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":50,"height":17,"x":12,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"745:22268","name":"Frame 8","type":"FRAME","layout":{"width":90,"height":29,"x":155,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":6,"right":12,"bottom":6,"left":12},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.8,"color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","backgroundOpacity":0.8,"strokeStyleName":"White border block","borderRadius":28,"strokes":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","gradientType":"linear","css":"linear-gradient(#DEDEDE 0%, #F3F3F3 100%)","gradientStops":[{"color":"#DEDEDE","position":0},{"color":"#F3F3F3","position":1}],"transform":[[0.89,0.11,0],[-0.11,0.11,0.5]]}]},"children":[{"id":"745:22269","name":"Акварель","type":"TEXT","text":"Акварель","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Medium","fontSize":14,"fontWeight":500,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":66,"height":17,"x":12,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"745:22270","name":"Frame 9","type":"FRAME","layout":{"width":60,"height":29,"x":251,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":6,"right":12,"bottom":6,"left":12},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.8,"color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","backgroundOpacity":0.8,"strokeStyleName":"White border block","borderRadius":28,"strokes":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","gradientType":"linear","css":"linear-gradient(#DEDEDE 0%, #F3F3F3 100%)","gradientStops":[{"color":"#DEDEDE","position":0},{"color":"#F3F3F3","position":1}],"transform":[[0.89,0.11,0],[-0.11,0.11,0.5]]}]},"children":[{"id":"745:22271","name":"Тушь","type":"TEXT","text":"Тушь","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Medium","fontSize":14,"fontWeight":500,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":36,"height":17,"x":12,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}]},{"id":"745:22591","name":"Frame 201","type":"FRAME","layout":{"width":366,"height":149,"y":132,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22592","name":"Frame 127","type":"FRAME","layout":{"width":366,"height":85,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":16,"strokesIncludedInLayout":true,"padding":{"top":12,"right":0,"bottom":12,"left":0},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22593","name":"Frame 154","type":"FRAME","layout":{"width":366,"height":61,"y":12,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":0,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22594","name":"Начальная цена","type":"TEXT","text":"Начальная цена","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Regular","fontSize":12,"fontWeight":400,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":366,"height":15,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"745:22595","name":"Frame 200","type":"FRAME","layout":{"width":93,"height":46,"x":136.5,"y":15,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22596","name":"Frame 141","type":"FRAME","layout":{"width":93,"height":46,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":10,"right":0,"bottom":8,"left":0},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","strokes":[{"type":"solid","sourceType":"SOLID","color":"#E2E2E2"}],"borderColor":"#E2E2E2","strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":0,"right":0,"bottom":1,"left":0}},"children":[{"id":"745:22597","name":"500 BYN","type":"TEXT","text":"500 BYN","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Medium","fontSize":22,"fontWeight":500,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":93,"height":27,"y":10,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}]}]},{"id":"745:22598","name":"Frame 174","type":"FRAME","layout":{"width":366,"height":56,"y":93,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22604","name":"Кнопки","type":"INSTANCE","layout":{"width":366,"height":56,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":14,"right":16,"bottom":14,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#949494"}],"backgroundColor":"#949494","borderRadius":40,"strokes":[{"type":"solid","sourceType":"SOLID","opacity":0.5,"color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderOpacity":0.5,"borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1},"opacity":0.5},"componentProperties":{"Icon":"456:7973","Иконка правая":"false","Иконка левая":"true","Обычная":"Черная недоступно"},"componentPropertyDetails":{"Icon":{"type":"INSTANCE_SWAP","value":"456:7973"},"Иконка правая":{"type":"BOOLEAN","value":false},"Иконка левая":{"type":"BOOLEAN","value":true},"Обычная":{"type":"VARIANT","value":"Черная недоступно"}},"children":[{"id":"I745:22604;298:6041","name":"Иконка левая","type":"FRAME","layout":{"width":26,"height":26,"x":121,"y":15,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":4,"bottom":4,"left":4},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I745:22604;298:6042","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":4,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"clock-04"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"clock-04"}},"children":[{"id":"I745:22604;298:6042;456:7987","name":"clock-04","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I745:22604;298:6042;456:7988","name":"Vector","type":"VECTOR","layout":{"width":14.63,"height":15}},{"id":"I745:22604;298:6042;456:7989","name":"Vector","type":"VECTOR","layout":{"width":1.5,"height":4.5}},{"id":"I745:22604;298:6042;456:7990","name":"Vector","type":"VECTOR","layout":{"width":5.25,"height":7.5}}]}],"componentPropertyReferences":{"mainComponent":"Icon"}}],"componentPropertyReferences":{"visible":"Иконка левая"}},{"id":"I745:22604;278:4700","name":"Кнопка","type":"TEXT","text":"13д 24ч 40м","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":26,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":96,"height":26,"x":149,"y":15,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}]}]}]},{"id":"745:22364","name":"Change-This","type":"VECTOR","layout":{"width":389.56,"height":49.78}},{"id":"745:22365","name":"Frame 76","type":"FRAME","layout":{"width":350,"height":48,"x":20,"y":62,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"space-between","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22366","name":"Frame 63","type":"FRAME","layout":{"width":48,"height":48,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"padding":{"top":6,"right":6,"bottom":6,"left":6},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.8,"color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","backgroundOpacity":0.8,"strokeStyleName":"White border block","borderRadius":200,"strokes":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","gradientType":"linear","css":"linear-gradient(#DEDEDE 0%, #F3F3F3 100%)","gradientStops":[{"color":"#DEDEDE","position":0},{"color":"#F3F3F3","position":1}],"transform":[[0.89,0.11,0],[-0.11,0.11,0.5]]}],"blurEffects":[{"type":"background","radius":12,"blurType":"normal"}]},"children":[{"id":"745:22367","name":"Frame 39","type":"FRAME","layout":{"width":36,"height":36,"x":6,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":4,"bottom":4,"left":4},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22368","name":"shopping-basket-01","type":"FRAME","layout":{"width":28,"height":28,"x":4,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":28,"y":28},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22369","name":"Vector","type":"VECTOR","layout":{"width":18.67,"height":17.5}},{"id":"745:22370","name":"Vector","type":"VECTOR","layout":{"width":9.33,"height":8.75}}]}]}]},{"id":"745:22371","name":"Frame 77","type":"FRAME","layout":{"width":98,"height":48,"x":252,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22372","name":"Frame 63","type":"FRAME","layout":{"width":98,"height":48,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"padding":{"top":6,"right":10,"bottom":6,"left":10},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.8,"color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","backgroundOpacity":0.8,"strokeStyleName":"White border block","borderRadius":200,"strokes":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","gradientType":"linear","css":"linear-gradient(#DEDEDE 0%, #F3F3F3 100%)","gradientStops":[{"color":"#DEDEDE","position":0},{"color":"#F3F3F3","position":1}],"transform":[[0.89,0.11,0],[-0.11,0.11,0.5]]}],"blurEffects":[{"type":"background","radius":12,"blurType":"normal"}]},"children":[{"id":"745:22373","name":"Frame 39","type":"FRAME","layout":{"width":36,"height":36,"x":10,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":4,"bottom":4,"left":4},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22374","name":"heart","type":"FRAME","layout":{"width":28,"height":28,"x":4,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":28,"y":28},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22375","name":"Vector","type":"VECTOR","layout":{"width":23.33,"height":19.83}}]}]},{"id":"745:22376","name":"Frame 40","type":"FRAME","layout":{"width":36,"height":36,"x":52,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":4,"bottom":4,"left":4},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22377","name":"share-04","type":"FRAME","layout":{"width":28,"height":28,"x":4,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":28,"y":28},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"745:22378","name":"Vector","type":"VECTOR","layout":{"width":21,"height":21}},{"id":"745:22379","name":"Vector","type":"VECTOR","layout":{"width":11.67,"height":11.67}}]}]}]}]}]}],"prototype":{"overflowDirection":"none","fixedChildIds":["745:22364","745:22365"],"overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}}
```

## Capture Bundle Inputs (Authoritative)
- Keep this bundle intact. Resolve every path relative to the bundle root.
- Review `mcp/figma-locator.json` before calling a Figma MCP tool. Prefer each node's exact `locator.sourceUrl`; otherwise pass its `locator.fileKey` and colon-form `locator.nodeId` through the MCP tool's documented inputs.
- Locator data is for discovery or refresh only. An MCP re-capture creates a new immutable capture; it never replaces the evidence in this bundle.
- This capture has no Figma file key, so MCP cannot reopen its source; rely on the bundled evidence.
- Review `fidelity/coverage.json` before implementation. Every listed node must use its exact pixel fallback or an equivalent implementation proven by the final RGBA comparison.
- Use the reference renders below as the visual source of truth and iterate with screenshot comparison.
- Authoritative target: `references/001-745_22241.png` at exactly 390×922 CSS pixels. Do not infer the viewport from Figma's fractional geometry or another asset.
- Reference determinism gate passed: two consecutive Figma renders were RGBA-identical. If a later reference becomes unstable, stop exact verification until the changing content is frozen.
- Provide the final exact-size screenshot so the user can load it into Figma to Prompt's built-in `Verify AI screenshot` checker.
- Reference render: `references/001-745_22241.png`
- Match design assets by their manifest `nodeId`; bundled paths override any generated filename elsewhere in this prompt.
- Design asset for node `745:22242`: `assets/001-745_22242.png`
- Design asset for node `745:22364`: `assets/002-745_22364.png`
- Rendered fallbacks are Figma-authored precision assets. Use the PNG variant for the exact 1× target; use the outlined, unsimplified SVG variant when the node must scale. Preserve semantics or interactions with an accessible overlay when needed.
- Rendered fallback (pixel) for node `745:22241` (context-dependent-effect): `fallbacks/001-745_22241.png`
- Rendered fallback (vector) for node `745:22241` (context-dependent-effect): `fallbacks/001-745_22241.svg`

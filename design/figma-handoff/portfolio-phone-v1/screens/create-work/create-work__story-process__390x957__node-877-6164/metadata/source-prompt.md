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
- `#F3F3F3` (border)
- `#F3F3F3` (border)
- `#F3F3F3` (background)
- `#F3F3F3` (background)
- `#565656` (text)
- `#565656` (text)
- `#8A8A8A` (border)
- `#8A8A8A` (border)
- `#8A8A8A` (text)
- `#8A8A8A` (text)
- `#FFFFFF` (border)
- `#FFFFFF` (border)
- `#2A2A2A` → `var(--Black)` (border)
- `#292929` (background)
- `#292929` (background)
- `#FFFFFF` (text)
- `#FFFFFF` (text)
### Typography
- Inter 600 24px, letter-spacing: -2%
- Inter 600 16px, letter-spacing: -2%
- Inter 400 12px
- Inter 400 16px/24px
- Inter 500 16px/26px, letter-spacing: -2%
### Spacing & Radii
- Spacing scale: 2px, 4px, 8px, 10px, 12px, 12.08px, 13px, 14px, 16px, 20px, 24px
- Border radii: 18px, 20px, 21px, 80px

## Interaction Contract
Implement these Figma prototype settings and reactions explicitly. Preserve scrolling, fixed layers, overlay behavior, trigger/action order, and transitions; do not infer a different behavior from appearance or node names.
- `Создание работы ` (`877:6164`) prototype settings: `{"overflowDirection":"none","fixedChildIds":["877:6188"],"overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219` (`877:6165`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139` (`877:6166`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139 > Frame 218` (`877:6167`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139 > Frame 218 > arrow-left-02` (`877:6168`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139 > Frame 218 > Frame 151` (`877:6171`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139 > Frame 218 > x` (`877:6176`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139 > Frame 121` (`877:6178`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139 > Frame 121 > Frame 122` (`877:6179`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206` (`877:6181`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190` (`877:6186`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216` (`877:6223`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 217` (`877:6224`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 217 > Frame 201` (`877:6225`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 217 > Frame 201 > Frame 199` (`877:6226`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 217 > Frame 201 > Frame 199 > arrow-up-03` (`877:6227`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 217 > Frame 201 > Frame 200` (`877:6231`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Поля ввода` (`877:6235`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 218` (`877:6283`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 218 > Frame 201` (`877:6284`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 218 > Frame 201 > Frame 199` (`877:6285`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 218 > Frame 201 > Frame 199 > arrow-up-03` (`877:6286`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 218 > Frame 201 > Frame 200` (`877:6290`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Поля ввода` (`877:6293`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 219` (`877:6297`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 219 > Frame 201` (`877:6298`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 219 > Frame 201 > Frame 199` (`877:6299`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 219 > Frame 201 > Frame 199 > arrow-up-03` (`877:6300`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 219 > Frame 201 > Frame 200` (`877:6304`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Поля ввода` (`877:6307`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Кнопки` (`877:6236`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Кнопки > Иконка левая` (`I877:6236;584:17872`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Кнопки > Иконка левая > Иконки кнопок` (`I877:6236;584:17873`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Кнопки > Иконка левая > Иконки кнопок > plus` (`I877:6236;584:17873;424:17645`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Кнопки` (`877:6187`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`

## Component API Contract
Use the documented component properties as the public API. Preserve typed defaults, variants, and active values instead of coercing them from labels.
### Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Поля ввода (`877:6235`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Поля ввода (`877:6293`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Поля ввода (`877:6307`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Кнопки (`877:6236`)
- Active property values: `{"Icon":{"type":"INSTANCE_SWAP","value":"312:9251"},"Иконка правая":{"type":"BOOLEAN","value":false},"Иконка левая":{"type":"BOOLEAN","value":true},"Обычная":{"type":"VARIANT","value":"Серая"}}`
### Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Кнопки > Иконка левая (`I877:6236;584:17872`)
- Sublayer property references: `{"visible":"Иконка левая"}`
### Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Кнопки > Иконка левая > Иконки кнопок (`I877:6236;584:17873`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"plus"}}`
- Sublayer property references: `{"mainComponent":"Icon"}`
### Создание работы  > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Кнопки > Иконка левая > Иконки кнопок > plus > Vector (`I877:6236;584:17873;424:17646`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Создание работы  > Frame 219 > Frame 206 > Frame 190 > Кнопки (`877:6187`)
- Active property values: `{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5597"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}}`

## Fidelity Risk Summary
- Estimated risk: high (65 visible nodes, max depth 9)
- Layout risks: 4 clipped containers, 65 nodes with constraints, 14 nodes with target aspect ratio
- Asset risks: 1 image fills, 1 image fills with crop/filter/opacity metadata, 14 vector-like nodes
- Paint risks: 65 nodes with layer blend mode, 21 nodes with detailed stroke metadata

## Geometry Checklist
Use these absolute boxes after normalizing the selected root to left 0, top 0. They are derived from `layout.x/y` and help catch drift before styling polish.
- Root `layout.x/y` is the Figma canvas position; do not offset the rendered component by it.
### Bounding Boxes
- Создание работы [FRAME]: left 0, top 0, width 390, height 957, signals: root/clips
- Создание работы > Frame 219 [FRAME]: left 12, top 84, width 366, height 789, signals: top-level
- Создание работы > Frame 219 > Frame 139 [FRAME]: left 12, top 84, width 366, height 69
- Создание работы > Frame 219 > Frame 139 > Frame 218 [FRAME]: left 12, top 84, width 366, height 28
- Создание работы > Frame 219 > Frame 139 > Frame 218 > arrow-left-02 [FRAME]: left 12, top 84, width 28, height 28
- Создание работы > Frame 219 > Frame 139 > Frame 218 > arrow-left-02 > Vector [VECTOR]: left 18.42, top 98, width 15.75, height 0, signals: vector
- Создание работы > Frame 219 > Frame 139 > Frame 218 > arrow-left-02 > Vector [VECTOR]: left 17.83, top 91, width 7, height 14, signals: vector
- Создание работы > Frame 219 > Frame 139 > Frame 218 > Frame 151 [FRAME]: left 64, top 95, width 262, height 6
- Создание работы > Frame 219 > Frame 139 > Frame 218 > Frame 151 > Rectangle 3 [RECTANGLE]: left 171, top 95, width 6, height 6
- Создание работы > Frame 219 > Frame 139 > Frame 218 > Frame 151 > Rectangle 2 [RECTANGLE]: left 185, top 95, width 6, height 6
- Создание работы > Frame 219 > Frame 139 > Frame 218 > Frame 151 > Rectangle 4 [RECTANGLE]: left 199, top 95, width 6, height 6
- Создание работы > Frame 219 > Frame 139 > Frame 218 > Frame 151 > Rectangle 5 [RECTANGLE]: left 213, top 95, width 6, height 6
- Создание работы > Frame 219 > Frame 139 > Frame 218 > x [FRAME]: left 350, top 84, width 28, height 28
- Создание работы > Frame 219 > Frame 139 > Frame 218 > x > Vector [VECTOR]: left 357, top 91, width 14, height 14, signals: vector
- Создание работы > Frame 219 > Frame 139 > Frame 121 [FRAME]: left 12, top 124, width 366, height 29
- Создание работы > Frame 219 > Frame 139 > Frame 121 > Frame 122 [FRAME]: left 12, top 124, width 366, height 29
- Создание работы > Frame 219 > Frame 139 > Frame 121 > Frame 122 > История создания [TEXT]: left 12, top 124, width 366, height 29
- Создание работы > Frame 219 > Frame 206 [FRAME]: left 12, top 173, width 366, height 700
- Создание работы > Frame 219 > Frame 206 > Frame 190 [FRAME]: left 12, top 173, width 366, height 700
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 [FRAME]: left 12, top 173, width 366, height 642
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 217 [FRAME]: left 12, top 173, width 366, height 122
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 217 > Frame 201 [FRAME]: left 13, top 174, width 364, height 120
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 217 > Frame 201 > Frame 199 [FRAME]: left 13, top 174, width 90, height 120, signals: clips
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 217 > Frame 201 > Frame 199 > arrow-up-03 [FRAME]: left 38, top 214, width 40, height 40
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 217 > Frame 201 > Frame 199 > arrow-up-03 > Vector [VECTOR]: left 48, top 220.67, width 20, height 0, signals: vector
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 217 > Frame 201 > Frame 199 > arrow-up-03 > Vector [VECTOR]: left 58, top 227.33, width 0, height 20, signals: vector
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 217 > Frame 201 > Frame 199 > arrow-up-03 > Vector [VECTOR]: left 51.33, top 227.33, width 13.33, height 6.67, signals: vector
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 217 > Frame 201 > Frame 200 [FRAME]: left 117, top 196, width 260, height 76
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 217 > Frame 201 > Frame 200 > Выберите картинку для загрузки [TEXT]: left 117, top 196, width 260, height 38
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 217 > Frame 201 > Frame 200 > Формат изображения 3:4 Масимальный размер 10МБ [TEXT]: left 117, top 242, width 260, height 30
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Поля ввода [INSTANCE]: left 12, top 307, width 366, height 52, signals: component
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Поля ввода > Обычный [TEXT]: left 25, top 321, width 225, height 24
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 218 [FRAME]: left 12, top 371, width 366, height 122
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 218 > Frame 201 [FRAME]: left 13, top 372, width 364, height 120
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 218 > Frame 201 > Frame 199 [FRAME]: left 13, top 372, width 90, height 120, signals: clips
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 218 > Frame 201 > Frame 199 > arrow-up-03 [FRAME]: left 38, top 412, width 40, height 40
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 218 > Frame 201 > Frame 199 > arrow-up-03 > Vector [VECTOR]: left 48, top 418.67, width 20, height 0, signals: vector
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 218 > Frame 201 > Frame 199 > arrow-up-03 > Vector [VECTOR]: left 58, top 425.33, width 0, height 20, signals: vector
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 218 > Frame 201 > Frame 199 > arrow-up-03 > Vector [VECTOR]: left 51.33, top 425.33, width 13.33, height 6.67, signals: vector
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 218 > Frame 201 > Frame 200 [FRAME]: left 117, top 394, width 260, height 76
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 218 > Frame 201 > Frame 200 > Выберите картинку для загрузки [TEXT]: left 117, top 394, width 260, height 38
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 218 > Frame 201 > Frame 200 > Формат изображения 3:4 Масимальный размер 10МБ [TEXT]: left 117, top 440, width 260, height 30
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Поля ввода [INSTANCE]: left 12, top 505, width 366, height 52, signals: component
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Поля ввода > Обычный [TEXT]: left 25, top 519, width 225, height 24
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 219 [FRAME]: left 12, top 569, width 366, height 122
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 219 > Frame 201 [FRAME]: left 13, top 570, width 364, height 120
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 219 > Frame 201 > Frame 199 [FRAME]: left 13, top 570, width 90, height 120, signals: clips
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 219 > Frame 201 > Frame 199 > arrow-up-03 [FRAME]: left 38, top 610, width 40, height 40
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 219 > Frame 201 > Frame 199 > arrow-up-03 > Vector [VECTOR]: left 48, top 616.67, width 20, height 0, signals: vector
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 219 > Frame 201 > Frame 199 > arrow-up-03 > Vector [VECTOR]: left 58, top 623.33, width 0, height 20, signals: vector
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 219 > Frame 201 > Frame 199 > arrow-up-03 > Vector [VECTOR]: left 51.33, top 623.33, width 13.33, height 6.67, signals: vector
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 219 > Frame 201 > Frame 200 [FRAME]: left 117, top 592, width 260, height 76
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 219 > Frame 201 > Frame 200 > Выберите картинку для загрузки [TEXT]: left 117, top 592, width 260, height 38
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Frame 219 > Frame 201 > Frame 200 > Формат изображения 3:4 Масимальный размер 10МБ [TEXT]: left 117, top 638, width 260, height 30
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Поля ввода [INSTANCE]: left 12, top 703, width 366, height 52, signals: component
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Поля ввода > Обычный [TEXT]: left 25, top 717, width 225, height 24
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Кнопки [INSTANCE]: left 73.5, top 767, width 243, height 48, signals: component
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Кнопки > Иконка левая [FRAME]: left 90.5, top 778, width 26, height 26
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Кнопки > Иконка левая > Иконки кнопок [INSTANCE]: left 94.5, top 782, width 18, height 18, signals: component
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Кнопки > Иконка левая > Иконки кнопок > plus [FRAME]: left 94.5, top 782, width 18, height 18
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Кнопки > Иконка левая > Иконки кнопок > plus > Vector [VECTOR]: left 97.49, top 785, width 12, height 12, signals: vector
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Frame 216 > Кнопки > Кнопка [TEXT]: left 118.5, top 778, width 181, height 26
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Кнопки [INSTANCE]: left 12, top 825, width 366, height 48, signals: component
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Кнопки > Кнопка [TEXT]: left 145.5, top 836, width 99, height 26
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
- Build one exact 390×957 frame.
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
- Build against one exact 390×957 viewport with `html, body { margin: 0; }` and global `box-sizing: border-box`.
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
│   │   │   │   ├── Rectangle 2 (RECTANGLE, fixed×fixed)
│   │   │   │   ├── Rectangle 4 (RECTANGLE, fixed×fixed)
│   │   │   │   └── Rectangle 5 (RECTANGLE, fixed×fixed)
│   │   │   └── x (FRAME, fixed×fixed)
│   │   │       └── Vector (VECTOR, fixed×fixed)
│   │   └── Frame 121 (FRAME, vertical, fill×hug)
│   │       └── Frame 122 (FRAME, vertical, fill×hug)
│   │           └── История создания (TEXT, fill×hug) "История создания"
│   └── Frame 206 (FRAME, vertical, fill×hug)
│       └── Frame 190 (FRAME, vertical, fixed×hug)
│           ├── Frame 216 (FRAME, vertical, fill×hug)
│           │   ├── Frame 217 (FRAME, horizontal, fill×hug)
│           │   │   └── Frame 201 (FRAME, horizontal, fill×hug)
│           │   │       ├── Frame 199 (FRAME, horizontal, fixed×fixed)
│           │   │       │   └── arrow-up-03 (FRAME, fixed×fixed)
│           │   │       │       ├── Vector (VECTOR, fixed×fixed)
│           │   │       │       ├── Vector (VECTOR, fixed×fixed)
│           │   │       │       └── Vector (VECTOR, fixed×fixed)
│           │   │       └── Frame 200 (FRAME, vertical, fill×hug)
│           │   │           ├── Выберите картинку для загрузки (TEXT, fill×hug) "Выберите картинку 
для загрузки"
│           │   │           └── Формат изображения 3:4 Масимальный размер 10МБ (TEXT, fill×hug) "Формат изображения 3:4 Масимальный разме…"
│           │   ├── Поля ввода (INSTANCE, horizontal, fill×hug)
│           │   │   └── Обычный (TEXT, hug×hug) "Напишите краткое описание"
│           │   ├── Frame 218 (FRAME, horizontal, fill×hug)
│           │   │   └── Frame 201 (FRAME, horizontal, fill×hug)
│           │   │       ├── Frame 199 (FRAME, horizontal, fixed×fixed)
│           │   │       │   └── arrow-up-03 (FRAME, fixed×fixed)
│           │   │       │       ├── Vector (VECTOR, fixed×fixed)
│           │   │       │       ├── Vector (VECTOR, fixed×fixed)
│           │   │       │       └── Vector (VECTOR, fixed×fixed)
│           │   │       └── Frame 200 (FRAME, vertical, fill×hug)
│           │   │           ├── Выберите картинку для загрузки (TEXT, fill×hug) "Выберите картинку 
для загрузки"
│           │   │           └── Формат изображения 3:4 Масимальный размер 10МБ (TEXT, fill×hug) "Формат изображения 3:4 Масимальный разме…"
│           │   ├── Поля ввода (INSTANCE, horizontal, fill×hug)
│           │   │   └── Обычный (TEXT, hug×hug) "Напишите краткое описание"
│           │   ├── Frame 219 (FRAME, horizontal, fill×hug)
│           │   │   └── Frame 201 (FRAME, horizontal, fill×hug)
│           │   │       ├── Frame 199 (FRAME, horizontal, fixed×fixed)
│           │   │       │   └── arrow-up-03 (FRAME, fixed×fixed)
│           │   │       │       ├── Vector (VECTOR, fixed×fixed)
│           │   │       │       ├── Vector (VECTOR, fixed×fixed)
│           │   │       │       └── Vector (VECTOR, fixed×fixed)
│           │   │       └── Frame 200 (FRAME, vertical, fill×hug)
│           │   │           ├── Выберите картинку для загрузки (TEXT, fill×hug) "Выберите картинку 
для загрузки"
│           │   │           └── Формат изображения 3:4 Масимальный размер 10МБ (TEXT, fill×hug) "Формат изображения 3:4 Масимальный разме…"
│           │   ├── Поля ввода (INSTANCE, horizontal, fill×hug)
│           │   │   └── Обычный (TEXT, hug×hug) "Напишите краткое описание"
│           │   └── Кнопки (INSTANCE, horizontal, hug×hug)
│           │       ├── Иконка левая (FRAME, horizontal, hug×hug)
│           │       │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│           │       │       └── plus (FRAME, fixed×fixed)
│           │       │           └── Vector (VECTOR, fixed×fixed)
│           │       └── Кнопка (TEXT, hug×hug) "Добавить еще событие"
│           └── Кнопки (INSTANCE, horizontal, fill×hug)
│               └── Кнопка (TEXT, hug×hug) "Продолжить"
└── Change-This (VECTOR, fixed×fixed)
```

## Component Structure
```
{"id":"877:6164","name":"Создание работы ","type":"FRAME","layout":{"width":390,"height":957,"x":1043,"y":1212,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"overflow":"hidden","mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"},"children":[{"id":"877:6165","name":"Frame 219","type":"FRAME","layout":{"width":366,"height":789,"x":12,"y":84,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":20,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:6166","name":"Frame 139","type":"FRAME","layout":{"width":366,"height":69,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:6167","name":"Frame 218","type":"FRAME","layout":{"width":366,"height":28,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":24,"strokesIncludedInLayout":true,"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:6168","name":"arrow-left-02","type":"FRAME","layout":{"width":28,"height":28,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:6169","name":"Vector","type":"VECTOR","layout":{"width":15.75,"height":0}},{"id":"877:6170","name":"Vector","type":"VECTOR","layout":{"width":7,"height":14}}]},{"id":"877:6171","name":"Frame 151","type":"FRAME","layout":{"width":262,"height":6,"x":52,"y":11,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"center","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:6172","name":"Rectangle 3","type":"RECTANGLE","layout":{"width":6,"height":6,"x":107,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}},{"id":"877:6173","name":"Rectangle 2","type":"RECTANGLE","layout":{"width":6,"height":6,"x":121,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"backgroundColor":"#2A2A2A","borderRadius":20}},{"id":"877:6174","name":"Rectangle 4","type":"RECTANGLE","layout":{"width":6,"height":6,"x":135,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}},{"id":"877:6175","name":"Rectangle 5","type":"RECTANGLE","layout":{"width":6,"height":6,"x":149,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}}]},{"id":"877:6176","name":"x","type":"FRAME","layout":{"width":28,"height":28,"x":338,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":12,"y":12},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:6177","name":"Vector","type":"VECTOR","layout":{"width":14,"height":14}}]}]},{"id":"877:6178","name":"Frame 121","type":"FRAME","layout":{"width":366,"height":29,"y":40,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:6179","name":"Frame 122","type":"FRAME","layout":{"width":366,"height":29,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:6180","name":"История создания","type":"TEXT","text":"История создания","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Semi Bold","fontSize":24,"fontWeight":600,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":366,"height":29,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]}]}]},{"id":"877:6181","name":"Frame 206","type":"FRAME","layout":{"width":366,"height":700,"y":89,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:6186","name":"Frame 190","type":"FRAME","layout":{"width":366,"height":700,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":10,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:6223","name":"Frame 216","type":"FRAME","layout":{"width":366,"height":642,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:6224","name":"Frame 217","type":"FRAME","layout":{"width":366,"height":122,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","borderRadius":21,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#F3F3F3"}],"borderColor":"#F3F3F3","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"877:6225","name":"Frame 201","type":"FRAME","layout":{"width":364,"height":120,"x":1,"y":1,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":14,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:6226","name":"Frame 199","type":"FRAME","layout":{"width":90,"height":120,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":300,"y":400},"overflow":"hidden","mode":"horizontal","gap":12.08,"strokesIncludedInLayout":true,"padding":{"top":20,"right":20,"bottom":20,"left":20},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#F3F3F3"}],"backgroundColor":"#F3F3F3","borderRadius":20},"children":[{"id":"877:6227","name":"arrow-up-03","type":"FRAME","layout":{"width":40,"height":40,"x":25,"y":40,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":40,"y":40},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:6228","name":"Vector","type":"VECTOR","layout":{"width":20,"height":0}},{"id":"877:6229","name":"Vector","type":"VECTOR","layout":{"width":0,"height":20}},{"id":"877:6230","name":"Vector","type":"VECTOR","layout":{"width":13.33,"height":6.67}}]}]},{"id":"877:6231","name":"Frame 200","type":"FRAME","layout":{"width":260,"height":76,"x":104,"y":22,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:6232","name":"Выберите картинку для загрузки","type":"TEXT","text":"Выберите картинку \nдля загрузки","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Semi Bold","fontSize":16,"fontWeight":600,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":260,"height":38,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"877:6233","name":"Формат изображения 3:4 Масимальный размер 10МБ","type":"TEXT","text":"Формат изображения 3:4 Масимальный размер 10МБ","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Regular","fontSize":12,"fontWeight":400,"textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":260,"height":30,"y":46,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]}]}]},{"id":"877:6235","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"y":134,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I877:6235;285:4864","name":"Обычный","type":"TEXT","text":"Напишите краткое описание","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":225,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"877:6283","name":"Frame 218","type":"FRAME","layout":{"width":366,"height":122,"y":198,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","borderRadius":21,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#F3F3F3"}],"borderColor":"#F3F3F3","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"877:6284","name":"Frame 201","type":"FRAME","layout":{"width":364,"height":120,"x":1,"y":1,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":14,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:6285","name":"Frame 199","type":"FRAME","layout":{"width":90,"height":120,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":300,"y":400},"overflow":"hidden","mode":"horizontal","gap":12.08,"strokesIncludedInLayout":true,"padding":{"top":20,"right":20,"bottom":20,"left":20},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#F3F3F3"}],"backgroundColor":"#F3F3F3","borderRadius":20},"children":[{"id":"877:6286","name":"arrow-up-03","type":"FRAME","layout":{"width":40,"height":40,"x":25,"y":40,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":40,"y":40},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:6287","name":"Vector","type":"VECTOR","layout":{"width":20,"height":0}},{"id":"877:6288","name":"Vector","type":"VECTOR","layout":{"width":0,"height":20}},{"id":"877:6289","name":"Vector","type":"VECTOR","layout":{"width":13.33,"height":6.67}}]}]},{"id":"877:6290","name":"Frame 200","type":"FRAME","layout":{"width":260,"height":76,"x":104,"y":22,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:6291","name":"Выберите картинку для загрузки","type":"TEXT","text":"Выберите картинку \nдля загрузки","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Semi Bold","fontSize":16,"fontWeight":600,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":260,"height":38,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"877:6292","name":"Формат изображения 3:4 Масимальный размер 10МБ","type":"TEXT","text":"Формат изображения 3:4 Масимальный размер 10МБ","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Regular","fontSize":12,"fontWeight":400,"textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":260,"height":30,"y":46,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]}]}]},{"id":"877:6293","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"y":332,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I877:6293;285:4864","name":"Обычный","type":"TEXT","text":"Напишите краткое описание","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":225,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"877:6297","name":"Frame 219","type":"FRAME","layout":{"width":366,"height":122,"y":396,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","borderRadius":21,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#F3F3F3"}],"borderColor":"#F3F3F3","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"877:6298","name":"Frame 201","type":"FRAME","layout":{"width":364,"height":120,"x":1,"y":1,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":14,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:6299","name":"Frame 199","type":"FRAME","layout":{"width":90,"height":120,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":300,"y":400},"overflow":"hidden","mode":"horizontal","gap":12.08,"strokesIncludedInLayout":true,"padding":{"top":20,"right":20,"bottom":20,"left":20},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#F3F3F3"}],"backgroundColor":"#F3F3F3","borderRadius":20},"children":[{"id":"877:6300","name":"arrow-up-03","type":"FRAME","layout":{"width":40,"height":40,"x":25,"y":40,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":40,"y":40},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:6301","name":"Vector","type":"VECTOR","layout":{"width":20,"height":0}},{"id":"877:6302","name":"Vector","type":"VECTOR","layout":{"width":0,"height":20}},{"id":"877:6303","name":"Vector","type":"VECTOR","layout":{"width":13.33,"height":6.67}}]}]},{"id":"877:6304","name":"Frame 200","type":"FRAME","layout":{"width":260,"height":76,"x":104,"y":22,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:6305","name":"Выберите картинку для загрузки","type":"TEXT","text":"Выберите картинку \nдля загрузки","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Semi Bold","fontSize":16,"fontWeight":600,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":260,"height":38,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"877:6306","name":"Формат изображения 3:4 Масимальный размер 10МБ","type":"TEXT","text":"Формат изображения 3:4 Масимальный размер 10МБ","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Regular","fontSize":12,"fontWeight":400,"textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":260,"height":30,"y":46,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]}]}]},{"id":"877:6307","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"y":530,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I877:6307;285:4864","name":"Обычный","type":"TEXT","text":"Напишите краткое описание","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":225,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"877:6236","name":"Кнопки","type":"INSTANCE","layout":{"width":243,"height":48,"x":61.5,"y":594,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":10,"right":16,"bottom":10,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#F3F3F3"}],"backgroundColor":"#F3F3F3","borderRadius":80,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"borderColor":"#FFFFFF","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Icon":"312:9251","Иконка правая":"false","Иконка левая":"true","Обычная":"Серая"},"componentPropertyDetails":{"Icon":{"type":"INSTANCE_SWAP","value":"312:9251"},"Иконка правая":{"type":"BOOLEAN","value":false},"Иконка левая":{"type":"BOOLEAN","value":true},"Обычная":{"type":"VARIANT","value":"Серая"}},"children":[{"id":"I877:6236;584:17872","name":"Иконка левая","type":"FRAME","layout":{"width":26,"height":26,"x":17,"y":11,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":4,"bottom":4,"left":4},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I877:6236;584:17873","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":4,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"plus"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"plus"}},"children":[{"id":"I877:6236;584:17873;424:17645","name":"plus","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I877:6236;584:17873;424:17646","name":"Vector","type":"VECTOR","layout":{"width":12,"height":12}}]}],"componentPropertyReferences":{"mainComponent":"Icon"}}],"componentPropertyReferences":{"visible":"Иконка левая"}},{"id":"I877:6236;584:17874","name":"Кнопка","type":"TEXT","text":"Добавить еще событие","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":26,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":181,"height":26,"x":45,"y":11,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]},{"id":"877:6187","name":"Кнопки","type":"INSTANCE","layout":{"width":366,"height":48,"y":652,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":10,"right":16,"bottom":10,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#292929"}],"backgroundColor":"#292929","borderRadius":80,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Иконка правая":"false","Icon":"297:5597","Иконка левая":"false","Обычная":"Черная"},"componentPropertyDetails":{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5597"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}},"children":[{"id":"I877:6187;278:4690","name":"Кнопка","type":"TEXT","text":"Продолжить","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":26,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":99,"height":26,"x":133.5,"y":11,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}]}]},{"id":"877:6188","name":"Change-This","type":"VECTOR","layout":{"width":389.56,"height":49.78}}],"prototype":{"overflowDirection":"none","fixedChildIds":["877:6188"],"overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}}
```

## Capture Bundle Inputs (Authoritative)
- Keep this bundle intact. Resolve every path relative to the bundle root.
- Review `mcp/figma-locator.json` before calling a Figma MCP tool. Prefer each node's exact `locator.sourceUrl`; otherwise pass its `locator.fileKey` and colon-form `locator.nodeId` through the MCP tool's documented inputs.
- Locator data is for discovery or refresh only. An MCP re-capture creates a new immutable capture; it never replaces the evidence in this bundle.
- This capture has no Figma file key, so MCP cannot reopen its source; rely on the bundled evidence.
- Review `fidelity/coverage.json` before implementation. Every listed node must use its exact pixel fallback or an equivalent implementation proven by the final RGBA comparison.
- Use the reference renders below as the visual source of truth and iterate with screenshot comparison.
- Authoritative target: `references/001-877_6164.png` at exactly 390×957 CSS pixels. Do not infer the viewport from Figma's fractional geometry or another asset.
- Reference determinism gate passed: two consecutive Figma renders were RGBA-identical. If a later reference becomes unstable, stop exact verification until the changing content is frozen.
- Provide the final exact-size screenshot so the user can load it into Figma to Prompt's built-in `Verify AI screenshot` checker.
- Reference render: `references/001-877_6164.png`
- Match design assets by their manifest `nodeId`; bundled paths override any generated filename elsewhere in this prompt.
- Design asset for node `877:6188`: `assets/001-877_6188.png`
- Rendered fallbacks are Figma-authored precision assets. Use the PNG variant for the exact 1× target; use the outlined, unsimplified SVG variant when the node must scale. Preserve semantics or interactions with an accessible overlay when needed.
- Rendered fallback (pixel) for node `877:6164` (context-dependent-effect): `fallbacks/001-877_6164.png`
- Rendered fallback (vector) for node `877:6164` (context-dependent-effect): `fallbacks/001-877_6164.svg`

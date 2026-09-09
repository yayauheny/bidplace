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
- `#565656` (border)
- `#565656` (border)
- `#565656` (background)
- `#565656` (background)
- `#2A2A2A` → `var(--Black)` (text)
- `#2A2A2A` → `var(--Black)` (border)
- `#2A2A2A` → `var(--Black)` (background)
- `#292929` (background)
- `#292929` (background)
- `#FFFFFF` (text)
- `#FFFFFF` (text)
### Typography
- Inter 600 24px, letter-spacing: -2%
- Inter 500 16px, letter-spacing: -1%
- Inter 400 16px/24px
- Inter 400 14px
### Spacing & Radii
- Spacing scale: 2px, 4px, 8px, 10px, 12px, 13px, 16px, 20px, 24px
- Border radii: 18px, 20px, 80px

## Interaction Contract
Implement these Figma prototype settings and reactions explicitly. Preserve scrolling, fixed layers, overlay behavior, trigger/action order, and transitions; do not infer a different behavior from appearance or node names.
- `Создание работы ` (`873:4404`) prototype settings: `{"overflowDirection":"none","fixedChildIds":["873:4427"],"overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219` (`873:4405`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139` (`873:4406`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139 > Frame 218` (`873:4407`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139 > Frame 218 > arrow-left-02` (`873:4408`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139 > Frame 218 > Frame 151` (`873:4411`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139 > Frame 218 > x` (`873:4416`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139 > Frame 121` (`873:4418`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 139 > Frame 121 > Frame 122` (`873:4419`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206` (`873:4421`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 115` (`877:5981`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 115 > Frame 119` (`877:5982`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 115 > Frame 119 > arrow-right-01` (`877:5984`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Поля ввода` (`879:6393`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок` (`880:6464`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars` (`880:6468`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Поля ввода` (`880:6514`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок` (`880:6523`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars` (`880:6524`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Поля ввода > Плейсхолдер` (`880:6518`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Поля ввода` (`879:6385`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок` (`880:6473`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars` (`880:6474`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Поля ввода` (`879:6401`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок` (`880:6480`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars` (`880:6481`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Поля ввода` (`879:6377`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок` (`880:6487`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars` (`880:6488`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190` (`873:4425`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Создание работы  > Frame 219 > Frame 206 > Frame 190 > Кнопки` (`873:4426`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`

## Component API Contract
Use the documented component properties as the public API. Preserve typed defaults, variants, and active values instead of coercing them from labels.
### Создание работы  > Frame 219 > Frame 206 > Поля ввода > Три икс в кубе плюс константа ну что там?   (`880:6517`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Создание работы  > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector (`880:6525`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Создание работы  > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector (`880:6526`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Создание работы  > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector (`880:6527`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Создание работы  > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector (`880:6528`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}],"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Создание работы  > Frame 219 > Frame 206 > Поля ввода > Плейсхолдер > Плейсхолдер (`880:6519`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Создание работы  > Frame 219 > Frame 206 > Frame 190 > Кнопки (`873:4426`)
- Active property values: `{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5597"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}}`

## Fidelity Risk Summary
- Estimated risk: high (70 visible nodes, max depth 6)
- Layout risks: 1 absolute-positioned auto-layout children, 1 clipped containers, 70 nodes with constraints, 18 nodes with target aspect ratio
- Asset risks: 1 image fills, 1 image fills with crop/filter/opacity metadata, 25 vector-like nodes
- Paint risks: 70 nodes with layer blend mode, 30 nodes with detailed stroke metadata

## Geometry Checklist
Use these absolute boxes after normalizing the selected root to left 0, top 0. They are derived from `layout.x/y` and help catch drift before styling polish.
- Root `layout.x/y` is the Figma canvas position; do not offset the rendered component by it.
### Bounding Boxes
- Создание работы [FRAME]: left 0, top 0, width 390, height 728, signals: root/clips
- Создание работы > Frame 219 [FRAME]: left 12, top 84, width 366, height 585, signals: top-level
- Создание работы > Frame 219 > Frame 139 [FRAME]: left 12, top 84, width 366, height 69
- Создание работы > Frame 219 > Frame 139 > Frame 218 [FRAME]: left 12, top 84, width 366, height 28
- Создание работы > Frame 219 > Frame 139 > Frame 218 > arrow-left-02 [FRAME]: left 12, top 84, width 28, height 28
- Создание работы > Frame 219 > Frame 139 > Frame 218 > arrow-left-02 > Vector [VECTOR]: left 18.42, top 98, width 15.75, height 0, signals: vector
- Создание работы > Frame 219 > Frame 139 > Frame 218 > arrow-left-02 > Vector [VECTOR]: left 17.83, top 91, width 7, height 14, signals: vector
- Создание работы > Frame 219 > Frame 139 > Frame 218 > Frame 151 [FRAME]: left 64, top 95, width 262, height 6
- Создание работы > Frame 219 > Frame 139 > Frame 218 > Frame 151 > Rectangle 3 [RECTANGLE]: left 164, top 95, width 6, height 6
- Создание работы > Frame 219 > Frame 139 > Frame 218 > Frame 151 > Rectangle 2 [RECTANGLE]: left 178, top 95, width 6, height 6
- Создание работы > Frame 219 > Frame 139 > Frame 218 > Frame 151 > Rectangle 4 [RECTANGLE]: left 192, top 95, width 6, height 6
- Создание работы > Frame 219 > Frame 139 > Frame 218 > Frame 151 > Rectangle 5 [RECTANGLE]: left 206, top 95, width 6, height 6
- Создание работы > Frame 219 > Frame 139 > Frame 218 > Frame 151 > Rectangle 6 [RECTANGLE]: left 220, top 95, width 6, height 6
- Создание работы > Frame 219 > Frame 139 > Frame 218 > x [FRAME]: left 350, top 84, width 28, height 28
- Создание работы > Frame 219 > Frame 139 > Frame 218 > x > Vector [VECTOR]: left 357, top 91, width 14, height 14, signals: vector
- Создание работы > Frame 219 > Frame 139 > Frame 121 [FRAME]: left 12, top 124, width 366, height 29
- Создание работы > Frame 219 > Frame 139 > Frame 121 > Frame 122 [FRAME]: left 12, top 124, width 366, height 29
- Создание работы > Frame 219 > Frame 139 > Frame 121 > Frame 122 > Детали работы [TEXT]: left 12, top 124, width 366, height 29
- Создание работы > Frame 219 > Frame 206 [FRAME]: left 12, top 173, width 366, height 496
- Создание работы > Frame 219 > Frame 206 > Frame 115 [FRAME]: left 12, top 173, width 366, height 44
- Создание работы > Frame 219 > Frame 206 > Frame 115 > Frame 119 [FRAME]: left 12, top 173, width 366, height 44
- Создание работы > Frame 219 > Frame 206 > Frame 115 > Frame 119 > Выбрать категорию [TEXT]: left 12, top 185.5, width 332, height 19
- Создание работы > Frame 219 > Frame 206 > Frame 115 > Frame 119 > arrow-right-01 [FRAME]: left 354, top 183, width 24, height 24
- Создание работы > Frame 219 > Frame 206 > Frame 115 > Frame 119 > arrow-right-01 > Vector [VECTOR]: left 363, top 189, width 6, height 12, signals: vector
- Создание работы > Frame 219 > Frame 206 > Поля ввода [FRAME]: left 12, top 229, width 366, height 52
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Размеры [TEXT]: left 25, top 243, width 71, height 24
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок [FRAME]: left 341, top 243, width 24, height 24
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars [FRAME]: left 341, top 243, width 24, height 24
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector [VECTOR]: left 360, top 245, width 1, height 5, signals: vector
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector [VECTOR]: left 358, top 247, width 5, height 1, signals: vector
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector [VECTOR]: left 343.25, top 262.75, width 2, height 2, signals: vector
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector [VECTOR]: left 343, top 247, width 18, height 18, signals: vector
- Создание работы > Frame 219 > Frame 206 > Поля ввода [FRAME]: left 12, top 293, width 366, height 124
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Три икс в кубе плюс константа ну что там? [TEXT]: left 25, top 307, width 316, height 96
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок [FRAME]: left 341, top 307, width 24, height 24
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars [FRAME]: left 341, top 307, width 24, height 24
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector [VECTOR]: left 360, top 309, width 1, height 5, signals: vector
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector [VECTOR]: left 358, top 311, width 5, height 1, signals: vector
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector [VECTOR]: left 343.25, top 326.75, width 2, height 2, signals: vector
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector [VECTOR]: left 343, top 311, width 18, height 18, signals: vector
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Плейсхолдер [FRAME]: left 27, top 283, width 70, height 17, positioning absolute, signals: absolute
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Плейсхолдер > Плейсхолдер [TEXT]: left 31, top 283, width 62, height 17
- Создание работы > Frame 219 > Frame 206 > Поля ввода [FRAME]: left 12, top 429, width 366, height 52
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Обычный [TEXT]: left 25, top 443, width 176, height 24
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок [FRAME]: left 341, top 443, width 24, height 24
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars [FRAME]: left 341, top 443, width 24, height 24
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector [VECTOR]: left 360, top 445, width 1, height 5, signals: vector
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector [VECTOR]: left 358, top 447, width 5, height 1, signals: vector
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector [VECTOR]: left 343.25, top 462.75, width 2, height 2, signals: vector
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector [VECTOR]: left 343, top 447, width 18, height 18, signals: vector
- Создание работы > Frame 219 > Frame 206 > Поля ввода [FRAME]: left 12, top 493, width 366, height 52
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Обычный [TEXT]: left 25, top 507, width 93, height 24
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок [FRAME]: left 341, top 507, width 24, height 24
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars [FRAME]: left 341, top 507, width 24, height 24
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector [VECTOR]: left 360, top 509, width 1, height 5, signals: vector
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector [VECTOR]: left 358, top 511, width 5, height 1, signals: vector
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector [VECTOR]: left 343.25, top 526.75, width 2, height 2, signals: vector
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector [VECTOR]: left 343, top 511, width 18, height 18, signals: vector
- Создание работы > Frame 219 > Frame 206 > Поля ввода [FRAME]: left 12, top 557, width 366, height 52
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Обычный [TEXT]: left 25, top 571, width 108, height 24
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок [FRAME]: left 341, top 571, width 24, height 24
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars [FRAME]: left 341, top 571, width 24, height 24
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector [VECTOR]: left 360, top 573, width 1, height 5, signals: vector
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector [VECTOR]: left 358, top 575, width 5, height 1, signals: vector
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector [VECTOR]: left 343.25, top 590.75, width 2, height 2, signals: vector
- Создание работы > Frame 219 > Frame 206 > Поля ввода > Иконки кнопок > stars > Vector [VECTOR]: left 343, top 575, width 18, height 18, signals: vector
- Создание работы > Frame 219 > Frame 206 > Frame 190 [FRAME]: left 12, top 621, width 366, height 48
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Кнопки [INSTANCE]: left 12, top 621, width 366, height 48, signals: component
- Создание работы > Frame 219 > Frame 206 > Frame 190 > Кнопки > Кнопка [TEXT]: left 145.5, top 632, width 99, height 26
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
│   │   │   │   ├── Rectangle 2 (RECTANGLE, fixed×fixed)
│   │   │   │   ├── Rectangle 4 (RECTANGLE, fixed×fixed)
│   │   │   │   ├── Rectangle 5 (RECTANGLE, fixed×fixed)
│   │   │   │   └── Rectangle 6 (RECTANGLE, fixed×fixed)
│   │   │   └── x (FRAME, fixed×fixed)
│   │   │       └── Vector (VECTOR, fixed×fixed)
│   │   └── Frame 121 (FRAME, vertical, fill×hug)
│   │       └── Frame 122 (FRAME, vertical, fill×hug)
│   │           └── Детали работы (TEXT, fill×hug) "Детали работы"
│   └── Frame 206 (FRAME, vertical, fill×hug)
│       ├── Frame 115 (FRAME, vertical, fixed×hug)
│       │   └── Frame 119 (FRAME, horizontal, fill×hug)
│       │       ├── Выбрать категорию (TEXT, fill×hug) "Выбрать категорию"
│       │       └── arrow-right-01 (FRAME, fixed×fixed)
│       │           └── Vector (VECTOR, fixed×fixed)
│       ├── Поля ввода (FRAME, horizontal, fixed×hug)
│       │   ├── Иконка левая (FRAME, horizontal, hug×hug)
│       │   │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│       │   ├── Размеры (TEXT, hug×hug) "Размеры"
│       │   └── Иконки кнопок (FRAME, fixed×fixed)
│       │       └── stars (FRAME, fixed×fixed)
│       │           ├── Vector (VECTOR, fixed×fixed)
│       │           ├── Vector (VECTOR, fixed×fixed)
│       │           ├── Vector (VECTOR, fixed×fixed)
│       │           └── Vector (VECTOR, fixed×fixed)
│       ├── Поля ввода (FRAME, horizontal, fixed×hug)
│       │   ├── Иконка левая (FRAME, horizontal, hug×hug)
│       │   │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│       │   ├── Три икс в кубе плюс константа ну что там?   (TEXT, fill×hug) "Три икс в кубе плюс константа ну что там…"
│       │   ├── Иконки кнопок (FRAME, fixed×fixed)
│       │   │   └── stars (FRAME, fixed×fixed)
│       │   │       ├── Vector (VECTOR, fixed×fixed)
│       │   │       ├── Vector (VECTOR, fixed×fixed)
│       │   │       ├── Vector (VECTOR, fixed×fixed)
│       │   │       └── Vector (VECTOR, fixed×fixed)
│       │   └── Плейсхолдер (FRAME, horizontal, hug×hug)
│       │       └── Плейсхолдер (TEXT, hug×hug) "Размеры"
│       ├── Поля ввода (FRAME, horizontal, fixed×hug)
│       │   ├── Иконка левая (FRAME, horizontal, hug×hug)
│       │   │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│       │   ├── Обычный (TEXT, hug×hug) "Описание материалов"
│       │   └── Иконки кнопок (FRAME, fixed×fixed)
│       │       └── stars (FRAME, fixed×fixed)
│       │           ├── Vector (VECTOR, fixed×fixed)
│       │           ├── Vector (VECTOR, fixed×fixed)
│       │           ├── Vector (VECTOR, fixed×fixed)
│       │           └── Vector (VECTOR, fixed×fixed)
│       ├── Поля ввода (FRAME, horizontal, fixed×hug)
│       │   ├── Иконка левая (FRAME, horizontal, hug×hug)
│       │   │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│       │   ├── Обычный (TEXT, hug×hug) "Количество"
│       │   └── Иконки кнопок (FRAME, fixed×fixed)
│       │       └── stars (FRAME, fixed×fixed)
│       │           ├── Vector (VECTOR, fixed×fixed)
│       │           ├── Vector (VECTOR, fixed×fixed)
│       │           ├── Vector (VECTOR, fixed×fixed)
│       │           └── Vector (VECTOR, fixed×fixed)
│       ├── Поля ввода (FRAME, horizontal, fixed×hug)
│       │   ├── Иконка левая (FRAME, horizontal, hug×hug)
│       │   │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│       │   ├── Обычный (TEXT, hug×hug) "Дата выпуска"
│       │   └── Иконки кнопок (FRAME, fixed×fixed)
│       │       └── stars (FRAME, fixed×fixed)
│       │           ├── Vector (VECTOR, fixed×fixed)
│       │           ├── Vector (VECTOR, fixed×fixed)
│       │           ├── Vector (VECTOR, fixed×fixed)
│       │           └── Vector (VECTOR, fixed×fixed)
│       └── Frame 190 (FRAME, vertical, fixed×hug)
│           └── Кнопки (INSTANCE, horizontal, fill×hug)
│               └── Кнопка (TEXT, hug×hug) "Продолжить"
└── Change-This (VECTOR, fixed×fixed)
```

## Component Structure
```
{"id":"873:4404","name":"Создание работы ","type":"FRAME","layout":{"width":390,"height":728,"x":1493,"y":108,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"overflow":"hidden","mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"},"children":[{"id":"873:4405","name":"Frame 219","type":"FRAME","layout":{"width":366,"height":585,"x":12,"y":84,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":20,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4406","name":"Frame 139","type":"FRAME","layout":{"width":366,"height":69,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4407","name":"Frame 218","type":"FRAME","layout":{"width":366,"height":28,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":24,"strokesIncludedInLayout":true,"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4408","name":"arrow-left-02","type":"FRAME","layout":{"width":28,"height":28,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4409","name":"Vector","type":"VECTOR","layout":{"width":15.75,"height":0}},{"id":"873:4410","name":"Vector","type":"VECTOR","layout":{"width":7,"height":14}}]},{"id":"873:4411","name":"Frame 151","type":"FRAME","layout":{"width":262,"height":6,"x":52,"y":11,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"center","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4412","name":"Rectangle 3","type":"RECTANGLE","layout":{"width":6,"height":6,"x":100,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}},{"id":"873:4413","name":"Rectangle 2","type":"RECTANGLE","layout":{"width":6,"height":6,"x":114,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"backgroundColor":"#2A2A2A","borderRadius":20}},{"id":"873:4414","name":"Rectangle 4","type":"RECTANGLE","layout":{"width":6,"height":6,"x":128,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}},{"id":"873:4415","name":"Rectangle 5","type":"RECTANGLE","layout":{"width":6,"height":6,"x":142,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}},{"id":"881:7043","name":"Rectangle 6","type":"RECTANGLE","layout":{"width":6,"height":6,"x":156,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}}]},{"id":"873:4416","name":"x","type":"FRAME","layout":{"width":28,"height":28,"x":338,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":12,"y":12},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4417","name":"Vector","type":"VECTOR","layout":{"width":14,"height":14}}]}]},{"id":"873:4418","name":"Frame 121","type":"FRAME","layout":{"width":366,"height":29,"y":40,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4419","name":"Frame 122","type":"FRAME","layout":{"width":366,"height":29,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4420","name":"Детали работы","type":"TEXT","text":"Детали работы","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Semi Bold","fontSize":24,"fontWeight":600,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":366,"height":29,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]}]}]},{"id":"873:4421","name":"Frame 206","type":"FRAME","layout":{"width":366,"height":496,"y":89,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:5981","name":"Frame 115","type":"FRAME","layout":{"width":366,"height":44,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:5982","name":"Frame 119","type":"FRAME","layout":{"width":366,"height":44,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":10,"right":0,"bottom":10,"left":0},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:5983","name":"Выбрать категорию","type":"TEXT","text":"Выбрать категорию","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":332,"height":19,"y":12.5,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"877:5984","name":"arrow-right-01","type":"FRAME","layout":{"width":24,"height":24,"x":342,"y":10,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"877:5985","name":"Vector","type":"VECTOR","layout":{"width":6,"height":12}}]}]}]},{"id":"879:6393","name":"Поля ввода","type":"FRAME","layout":{"width":366,"height":52,"y":56,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"space-between","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"879:6394","name":"Иконка левая","type":"FRAME","visible":false,"layout":{"width":22,"height":22,"x":13,"y":15,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"879:6395","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"search-01"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"search-01"}}}]},{"id":"879:6396","name":"Размеры","type":"TEXT","text":"Размеры","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":71,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}},{"id":"880:6464","name":"Иконки кнопок","type":"FRAME","layout":{"width":24,"height":24,"x":329,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"880:6468","name":"stars","type":"FRAME","layout":{"width":24,"height":24,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"880:6469","name":"Vector","type":"VECTOR","layout":{"width":1,"height":5}},{"id":"880:6470","name":"Vector","type":"VECTOR","layout":{"width":5,"height":1}},{"id":"880:6471","name":"Vector","type":"VECTOR","layout":{"width":2,"height":2}},{"id":"880:6472","name":"Vector","type":"VECTOR","layout":{"width":18,"height":18}}]}]}]},{"id":"880:6514","name":"Поля ввода","type":"FRAME","layout":{"width":366,"height":124,"y":120,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"space-between","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"880:6515","name":"Иконка левая","type":"FRAME","visible":false,"layout":{"width":22,"height":22,"x":13,"y":15,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"880:6516","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"search-01"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"search-01"}}}]},{"id":"880:6517","name":"Три икс в кубе плюс константа ну что там?  ","type":"TEXT","text":"Три икс в кубе плюс константа ну что там?  ","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":316,"height":96,"x":13,"y":14,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"880:6523","name":"Иконки кнопок","type":"FRAME","layout":{"width":24,"height":24,"x":329,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"880:6524","name":"stars","type":"FRAME","layout":{"width":24,"height":24,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"880:6525","name":"Vector","type":"VECTOR","layout":{"width":1,"height":5}},{"id":"880:6526","name":"Vector","type":"VECTOR","layout":{"width":5,"height":1}},{"id":"880:6527","name":"Vector","type":"VECTOR","layout":{"width":2,"height":2}},{"id":"880:6528","name":"Vector","type":"VECTOR","layout":{"width":18,"height":18}}]}]},{"id":"880:6518","name":"Плейсхолдер","type":"FRAME","layout":{"width":70,"height":17,"x":15,"y":-10,"layoutPositioning":"absolute","layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":0,"right":4,"bottom":0,"left":4},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"},"children":[{"id":"880:6519","name":"Плейсхолдер","type":"TEXT","text":"Размеры","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Regular","fontSize":14,"fontWeight":400,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":62,"height":17,"x":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]},{"id":"879:6385","name":"Поля ввода","type":"FRAME","layout":{"width":366,"height":52,"y":256,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"space-between","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"879:6386","name":"Иконка левая","type":"FRAME","visible":false,"layout":{"width":22,"height":22,"x":13,"y":15,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"879:6387","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"search-01"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"search-01"}}}]},{"id":"879:6388","name":"Обычный","type":"TEXT","text":"Описание материалов","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":176,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}},{"id":"880:6473","name":"Иконки кнопок","type":"FRAME","layout":{"width":24,"height":24,"x":329,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"880:6474","name":"stars","type":"FRAME","layout":{"width":24,"height":24,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"880:6475","name":"Vector","type":"VECTOR","layout":{"width":1,"height":5}},{"id":"880:6476","name":"Vector","type":"VECTOR","layout":{"width":5,"height":1}},{"id":"880:6477","name":"Vector","type":"VECTOR","layout":{"width":2,"height":2}},{"id":"880:6478","name":"Vector","type":"VECTOR","layout":{"width":18,"height":18}}]}]}]},{"id":"879:6401","name":"Поля ввода","type":"FRAME","layout":{"width":366,"height":52,"y":320,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"space-between","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"879:6402","name":"Иконка левая","type":"FRAME","visible":false,"layout":{"width":22,"height":22,"x":13,"y":15,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"879:6403","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"search-01"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"search-01"}}}]},{"id":"879:6404","name":"Обычный","type":"TEXT","text":"Количество","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":93,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}},{"id":"880:6480","name":"Иконки кнопок","type":"FRAME","layout":{"width":24,"height":24,"x":329,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"880:6481","name":"stars","type":"FRAME","layout":{"width":24,"height":24,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"880:6482","name":"Vector","type":"VECTOR","layout":{"width":1,"height":5}},{"id":"880:6483","name":"Vector","type":"VECTOR","layout":{"width":5,"height":1}},{"id":"880:6484","name":"Vector","type":"VECTOR","layout":{"width":2,"height":2}},{"id":"880:6485","name":"Vector","type":"VECTOR","layout":{"width":18,"height":18}}]}]}]},{"id":"879:6377","name":"Поля ввода","type":"FRAME","layout":{"width":366,"height":52,"y":384,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"space-between","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"879:6378","name":"Иконка левая","type":"FRAME","visible":false,"layout":{"width":22,"height":22,"x":13,"y":15,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"879:6379","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"search-01"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"search-01"}}}]},{"id":"879:6380","name":"Обычный","type":"TEXT","text":"Дата выпуска","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":108,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}},{"id":"880:6487","name":"Иконки кнопок","type":"FRAME","layout":{"width":24,"height":24,"x":329,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"880:6488","name":"stars","type":"FRAME","layout":{"width":24,"height":24,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"880:6489","name":"Vector","type":"VECTOR","layout":{"width":1,"height":5}},{"id":"880:6490","name":"Vector","type":"VECTOR","layout":{"width":5,"height":1}},{"id":"880:6491","name":"Vector","type":"VECTOR","layout":{"width":2,"height":2}},{"id":"880:6492","name":"Vector","type":"VECTOR","layout":{"width":18,"height":18}}]}]}]},{"id":"873:4425","name":"Frame 190","type":"FRAME","layout":{"width":366,"height":48,"y":448,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":10,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"873:4426","name":"Кнопки","type":"INSTANCE","layout":{"width":366,"height":48,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":10,"right":16,"bottom":10,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#292929"}],"backgroundColor":"#292929","borderRadius":80,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Иконка правая":"false","Icon":"297:5597","Иконка левая":"false","Обычная":"Черная"},"componentPropertyDetails":{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5597"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}},"children":[{"id":"I873:4426;278:4690","name":"Кнопка","type":"TEXT","text":"Продолжить","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":26,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":99,"height":26,"x":133.5,"y":11,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}]}]},{"id":"873:4427","name":"Change-This","type":"VECTOR","layout":{"width":389.56,"height":49.78}}],"prototype":{"overflowDirection":"none","fixedChildIds":["873:4427"],"overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}}
```

## Capture Bundle Inputs (Authoritative)
- Keep this bundle intact. Resolve every path relative to the bundle root.
- Review `mcp/figma-locator.json` before calling a Figma MCP tool. Prefer each node's exact `locator.sourceUrl`; otherwise pass its `locator.fileKey` and colon-form `locator.nodeId` through the MCP tool's documented inputs.
- Locator data is for discovery or refresh only. An MCP re-capture creates a new immutable capture; it never replaces the evidence in this bundle.
- This capture has no Figma file key, so MCP cannot reopen its source; rely on the bundled evidence.
- Review `fidelity/coverage.json` before implementation. Every listed node must use its exact pixel fallback or an equivalent implementation proven by the final RGBA comparison.
- Use the reference renders below as the visual source of truth and iterate with screenshot comparison.
- Authoritative target: `references/001-873_4404.png` at exactly 390×728 CSS pixels. Do not infer the viewport from Figma's fractional geometry or another asset.
- Reference determinism gate passed: two consecutive Figma renders were RGBA-identical. If a later reference becomes unstable, stop exact verification until the changing content is frozen.
- Provide the final exact-size screenshot so the user can load it into Figma to Prompt's built-in `Verify AI screenshot` checker.
- Reference render: `references/001-873_4404.png`
- Match design assets by their manifest `nodeId`; bundled paths override any generated filename elsewhere in this prompt.
- Design asset for node `873:4427`: `assets/001-873_4427.png`
- Rendered fallbacks are Figma-authored precision assets. Use the PNG variant for the exact 1× target; use the outlined, unsimplified SVG variant when the node must scale. Preserve semantics or interactions with an accessible overlay when needed.
- Rendered fallback (pixel) for node `873:4404` (context-dependent-effect): `fallbacks/001-873_4404.png`
- Rendered fallback (vector) for node `873:4404` (context-dependent-effect): `fallbacks/001-873_4404.svg`

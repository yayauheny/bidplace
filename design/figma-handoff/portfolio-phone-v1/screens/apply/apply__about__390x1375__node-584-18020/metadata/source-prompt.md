# Pixel-perfect Figma rebuild: Стать автором заполнение профиля

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
- `#DEDEDE` (background)
- `#DEDEDE` (background)
- `#2A2A2A` (background)
- `#2A2A2A` (background)
- `#2A2A2A` (text)
- `#2A2A2A` (text)
- `#565656` (text)
- `#565656` (text)
- `#8A8A8A` (border)
- `#8A8A8A` (border)
- `#8A8A8A` (text)
- `#8A8A8A` (text)
- `#2A2A2A` (border)
- `#2A2A2A` (border)
- `#F3F3F3` (background)
- `#F3F3F3` (background)
- `#2A2A2A` → `var(--Black)` (border)
- `#292929` (background)
- `#292929` (background)
- `#FFFFFF` (text)
- `#FFFFFF` (text)
### Typography
- Inter 600 24px, letter-spacing: -2%
- Inter 400 14px
- Inter 400 16px/24px
- Inter 500 16px, letter-spacing: -1%
- Inter 500 20px, letter-spacing: -2%
### Spacing & Radii
- Spacing scale: 2px, 4px, 8px, 10px, 12px, 13px, 16px, 18px, 24px, 48px
- Border radii: 18px, 20px, 28px, 80px

## Interaction Contract
Implement these Figma prototype settings and reactions explicitly. Preserve scrolling, fixed layers, overlay behavior, trigger/action order, and transitions; do not infer a different behavior from appearance or node names.
- `Стать автором заполнение профиля` (`584:18020`) prototype settings: `{"overflowDirection":"none","fixedChildIds":["584:18048"],"overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 139` (`584:18021`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 139 > Frame 151` (`584:18022`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 139 > Frame 121` (`584:18025`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 139 > Frame 121 > Frame 122` (`584:18026`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 139 > Frame 121 > Frame 122 > Frame 209` (`584:18027`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207` (`584:18030`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 204` (`584:18031`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода` (`584:18032`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода` (`584:18033`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 204 > Frame 115` (`584:18034`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 204 > Frame 115 > Frame 119` (`584:18035`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 204 > Frame 115 > Frame 119 > arrow-right-01` (`584:18037`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206` (`584:18039`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 211` (`584:18040`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214` (`594:18225`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212` (`594:18067`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213` (`594:18089`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > image-add-02` (`594:18068`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > Кнопки` (`594:18073`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > Кнопки > Иконка левая` (`I594:18073;298:6023`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > Кнопки > Иконка левая > Иконки кнопок` (`I594:18073;298:6024`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > Кнопки > Иконка левая > Иконки кнопок > image-01` (`I594:18073;298:6024;584:17847`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода` (`594:18164`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая` (`I594:18164;303:8697`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая > Иконки кнопок` (`I594:18164;303:8698`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая > Иконки кнопок > calendar-01` (`I594:18164;303:8698;597:18948`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода` (`594:18165`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 190` (`584:18046`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 190 > Кнопки` (`584:18047`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`

## Component API Contract
Use the documented component properties as the public API. Preserve typed defaults, variants, and active values instead of coercing them from labels.
### Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода (`584:18032`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода (`584:18033`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > image-add-02 > Vector (`594:18069`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > image-add-02 > Vector (`594:18070`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > image-add-02 > Vector (`594:18071`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > Кнопки (`594:18073`)
- Active property values: `{"Icon":{"type":"INSTANCE_SWAP","value":"584:17842"},"Иконка правая":{"type":"BOOLEAN","value":false},"Иконка левая":{"type":"BOOLEAN","value":true},"Обычная":{"type":"VARIANT","value":"Обводка"}}`
### Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > Кнопки > Иконка левая (`I594:18073;298:6023`)
- Sublayer property references: `{"visible":"Иконка левая"}`
### Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > Кнопки > Иконка левая > Иконки кнопок (`I594:18073;298:6024`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"image-01"}}`
- Sublayer property references: `{"mainComponent":"Icon"}`
### Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > Кнопки > Иконка левая > Иконки кнопок > image-01 > Vector (`I594:18073;298:6024;584:17848`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > Кнопки > Иконка левая > Иконки кнопок > image-01 > Vector (`I594:18073;298:6024;584:17849`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > Кнопки > Иконка левая > Иконки кнопок > image-01 > Vector (`I594:18073;298:6024;584:17850`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода (`594:18164`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая > Иконки кнопок (`I594:18164;303:8698`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"calendar-01"}}`
### Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода (`594:18165`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Стать автором заполнение профиля > Frame 207 > Frame 190 > Кнопки (`584:18047`)
- Active property values: `{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5597"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}}`

## Fidelity Risk Summary
- Estimated risk: high (56 visible nodes, max depth 10)
- Layout risks: 1 clipped containers, 56 nodes with constraints, 8 nodes with target aspect ratio
- Asset risks: 1 image fills, 1 image fills with crop/filter/opacity metadata, 12 vector-like nodes
- Paint risks: 56 nodes with layer blend mode, 16 nodes with detailed stroke metadata

## Geometry Checklist
Use these absolute boxes after normalizing the selected root to left 0, top 0. They are derived from `layout.x/y` and help catch drift before styling polish.
- Root `layout.x/y` is the Figma canvas position; do not offset the rendered component by it.
### Bounding Boxes
- Стать автором заполнение профиля [FRAME]: left 0, top 0, width 390, height 1375, signals: root/clips
- Стать автором заполнение профиля > Frame 139 [FRAME]: left 12, top 84, width 366, height 97, signals: top-level
- Стать автором заполнение профиля > Frame 139 > Frame 151 [FRAME]: left 185, top 84, width 20, height 6
- Стать автором заполнение профиля > Frame 139 > Frame 151 > Rectangle 3 [RECTANGLE]: left 185, top 84, width 6, height 6
- Стать автором заполнение профиля > Frame 139 > Frame 151 > Rectangle 2 [RECTANGLE]: left 199, top 84, width 6, height 6
- Стать автором заполнение профиля > Frame 139 > Frame 121 [FRAME]: left 12, top 114, width 366, height 67
- Стать автором заполнение профиля > Frame 139 > Frame 121 > Frame 122 [FRAME]: left 12, top 114, width 366, height 67
- Стать автором заполнение профиля > Frame 139 > Frame 121 > Frame 122 > Frame 209 [FRAME]: left 12, top 114, width 366, height 67
- Стать автором заполнение профиля > Frame 139 > Frame 121 > Frame 122 > Frame 209 > Раскройте себя как автора [TEXT]: left 12, top 114, width 366, height 29
- Стать автором заполнение профиля > Frame 139 > Frame 121 > Frame 122 > Frame 209 > Заполняйте с душой, а если устанете, сохраните и сможете заполнить позже [TEXT]: left 12, top 147, width 366, height 34
- Стать автором заполнение профиля > Frame 207 [FRAME]: left 12, top 221, width 366, height 1014, signals: top-level
- Стать автором заполнение профиля > Frame 207 > Frame 204 [FRAME]: left 12, top 221, width 366, height 168
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода [INSTANCE]: left 12, top 221, width 366, height 52, signals: component
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода > Обычный [TEXT]: left 25, top 235, width 120, height 24
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода [INSTANCE]: left 12, top 285, width 366, height 52, signals: component
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода > Обычный [TEXT]: left 25, top 299, width 150, height 24
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Frame 115 [FRAME]: left 12, top 349, width 366, height 40
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Frame 115 > Frame 119 [FRAME]: left 12, top 349, width 366, height 40
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Frame 115 > Frame 119 > Выберите основные направления [TEXT]: left 12, top 359.5, width 332, height 19
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Frame 115 > Frame 119 > arrow-right-01 [FRAME]: left 354, top 357, width 24, height 24
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Frame 115 > Frame 119 > arrow-right-01 > Vector [VECTOR]: left 363, top 363, width 6, height 12, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 206 [FRAME]: left 12, top 437, width 366, height 702
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 211 [FRAME]: left 12, top 437, width 366, height 62
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 211 > Биография и достижения [TEXT]: left 12, top 437, width 366, height 24
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 211 > Напишите ваши большие достижения, выставки и расскажите о себе в годах [TEXT]: left 12, top 465, width 366, height 34
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 [FRAME]: left 12, top 523, width 366, height 616
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 [FRAME]: left 12, top 523, width 366, height 488
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Rectangle 14 [RECTANGLE]: left 12, top 523, width 366, height 488
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 [FRAME]: left 106, top 861, width 178, height 130
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > image-add-02 [FRAME]: left 163, top 861, width 64, height 64
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > image-add-02 > Vector [VECTOR]: left 171, top 890.33, width 48, height 16, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > image-add-02 > Vector [VECTOR]: left 169.67, top 867.67, width 50.67, height 50.67, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > image-add-02 > Vector [VECTOR]: left 201.67, top 867.67, width 18.67, height 18.67, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > Кнопки [INSTANCE]: left 106, top 943, width 178, height 48, signals: component
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > Кнопки > Иконка левая [FRAME]: left 123, top 954, width 26, height 26
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > Кнопки > Иконка левая > Иконки кнопок [INSTANCE]: left 127, top 958, width 18, height 18, signals: component
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > Кнопки > Иконка левая > Иконки кнопок > image-01 [FRAME]: left 127, top 958, width 18, height 18
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > Кнопки > Иконка левая > Иконки кнопок > image-01 > Vector [VECTOR]: left 131.5, top 962.5, width 2.25, height 2.25, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > Кнопки > Иконка левая > Иконки кнопок > image-01 > Vector [VECTOR]: left 128.88, top 959.88, width 14.25, height 14.25, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > Кнопки > Иконка левая > Иконки кнопок > image-01 > Vector [VECTOR]: left 130.75, top 967, width 12.37, height 6.75, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 212 > Frame 213 > Кнопки > Кнопка [TEXT]: left 151, top 954, width 116, height 26
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода [INSTANCE]: left 12, top 1023, width 366, height 52, signals: component
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая [FRAME]: left 25, top 1037, width 22, height 22
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая > Иконки кнопок [INSTANCE]: left 27, top 1039, width 18, height 18, signals: component
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая > Иконки кнопок > calendar-01 [FRAME]: left 27, top 1039, width 18, height 18
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая > Иконки кнопок > calendar-01 > Vector [VECTOR]: left 33, top 1040.5, width 6, height 3, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая > Иконки кнопок > calendar-01 > Vector [VECTOR]: left 29.25, top 1042, width 13.5, height 13.5, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая > Иконки кнопок > calendar-01 > Vector [VECTOR]: left 29.25, top 1046.5, width 13.5, height 0, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая > Иконки кнопок > calendar-01 > Vector [VECTOR]: left 33.75, top 1049.13, width 4.88, height 3.75, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Обычный [TEXT]: left 51, top 1037, width 70, height 24
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода [INSTANCE]: left 12, top 1087, width 366, height 52, signals: component
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Обычный [TEXT]: left 25, top 1101, width 225, height 24
- Стать автором заполнение профиля > Frame 207 > Frame 190 [FRAME]: left 12, top 1187, width 366, height 48
- Стать автором заполнение профиля > Frame 207 > Frame 190 > Кнопки [INSTANCE]: left 12, top 1187, width 366, height 48, signals: component
- Стать автором заполнение профиля > Frame 207 > Frame 190 > Кнопки > Кнопка [TEXT]: left 153.5, top 1198, width 83, height 26
- Стать автором заполнение профиля > Change-This [VECTOR]: left 0.44, top 0, width 389.56, height 49.78, signals: top-level/image/vector

## Assets
Image files included with this spec — use as `<img>` or CSS `background-image`:
- `Стать_автором_заполнение_профиля_Change-This.png` → Change-This (390×50, crop, scaling 0.5, transform [[1,0,0],[0,0.06,0]], filters {"saturation":0.5})

## Pixel Perfect Template
You are rebuilding this Figma frame for an exact visual match. Treat the JSON as geometry/style data and the reference image/assets as visual evidence.

### Required Inputs
- JSON component structure below.
- If a whole-frame reference image is supplied separately, use it as the visual source of truth.
- Use every listed exported image file exactly; if any required asset is missing, stop and ask for it.

### Render Target
- Build one exact 390×1375 frame.
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
- Build against one exact 390×1375 viewport with `html, body { margin: 0; }` and global `box-sizing: border-box`.
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
Стать автором заполнение профиля (FRAME, fixed×fixed)
├── Frame 139 (FRAME, vertical, fixed×hug)
│   ├── Frame 151 (FRAME, horizontal, hug×hug)
│   │   ├── Rectangle 3 (RECTANGLE, fixed×fixed)
│   │   └── Rectangle 2 (RECTANGLE, fixed×fixed)
│   └── Frame 121 (FRAME, horizontal, fill×hug)
│       └── Frame 122 (FRAME, horizontal, fill×hug)
│           └── Frame 209 (FRAME, vertical, fill×hug)
│               ├── Раскройте себя как автора (TEXT, fill×hug) "Раскройте себя как автора"
│               └── Заполняйте с душой, а если устанете, сохраните и сможете заполнить позже (TEXT, fill×hug) "Заполняйте с душой, а если устанете, сох…"
├── Frame 207 (FRAME, vertical, fixed×hug)
│   ├── Frame 204 (FRAME, vertical, fill×hug)
│   │   ├── Поля ввода (INSTANCE, horizontal, fill×hug)
│   │   │   └── Обычный (TEXT, hug×hug) "Коротко о себе"
│   │   ├── Поля ввода (INSTANCE, horizontal, fill×hug)
│   │   │   └── Обычный (TEXT, hug×hug) "Практика и подход"
│   │   └── Frame 115 (FRAME, vertical, fixed×hug)
│   │       └── Frame 119 (FRAME, horizontal, fill×hug)
│   │           ├── Выберите основные направления (TEXT, fill×hug) "Выберите основные направления"
│   │           └── arrow-right-01 (FRAME, fixed×fixed)
│   │               └── Vector (VECTOR, fixed×fixed)
│   ├── Frame 206 (FRAME, vertical, fill×hug)
│   │   ├── Frame 211 (FRAME, vertical, fill×hug)
│   │   │   ├── Биография и достижения (TEXT, fill×hug) "Биография и достижения"
│   │   │   └── Напишите ваши большие достижения, выставки и расскажите о себе в годах (TEXT, fill×hug) "Напишите ваши большие достижения, выстав…"
│   │   └── Frame 214 (FRAME, vertical, fill×hug)
│   │       ├── Frame 212 (FRAME, fixed×fixed)
│   │       │   ├── Rectangle 14 (RECTANGLE, fixed×fixed)
│   │       │   └── Frame 213 (FRAME, vertical, fixed×hug)
│   │       │       ├── image-add-02 (FRAME, fixed×fixed)
│   │       │       │   ├── Vector (VECTOR, fixed×fixed)
│   │       │       │   ├── Vector (VECTOR, fixed×fixed)
│   │       │       │   └── Vector (VECTOR, fixed×fixed)
│   │       │       └── Кнопки (INSTANCE, horizontal, fill×hug)
│   │       │           ├── Иконка левая (FRAME, horizontal, hug×hug)
│   │       │           │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│   │       │           │       └── image-01 (FRAME, fixed×fixed)
│   │       │           │           ├── Vector (VECTOR, fixed×fixed)
│   │       │           │           ├── Vector (VECTOR, fixed×fixed)
│   │       │           │           └── Vector (VECTOR, fixed×fixed)
│   │       │           └── Кнопка (TEXT, hug×hug) "Добавить фото"
│   │       ├── Поля ввода (INSTANCE, horizontal, fill×hug)
│   │       │   ├── Иконка левая (FRAME, horizontal, hug×hug)
│   │       │   │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│   │       │   │       └── calendar-01 (FRAME, fixed×fixed)
│   │       │   │           ├── Vector (VECTOR, fixed×fixed)
│   │       │   │           ├── Vector (VECTOR, fixed×fixed)
│   │       │   │           ├── Vector (VECTOR, fixed×fixed)
│   │       │   │           └── Vector (VECTOR, fixed×fixed)
│   │       │   └── Обычный (TEXT, hug×hug) "ММ.ГГГГ"
│   │       └── Поля ввода (INSTANCE, horizontal, fill×hug)
│   │           └── Обычный (TEXT, hug×hug) "Напишите краткое описание"
│   └── Frame 190 (FRAME, vertical, fixed×hug)
│       └── Кнопки (INSTANCE, horizontal, fill×hug)
│           └── Кнопка (TEXT, hug×hug) "Сохранить"
└── Change-This (VECTOR, fixed×fixed)
```

## Component Structure
```
{"id":"584:18020","name":"Стать автором заполнение профиля","type":"FRAME","layout":{"width":390,"height":1375,"x":1071,"y":5618,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"overflow":"hidden","mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"},"children":[{"id":"584:18021","name":"Frame 139","type":"FRAME","layout":{"width":366,"height":97,"x":12,"y":84,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":24,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:18022","name":"Frame 151","type":"FRAME","layout":{"width":20,"height":6,"x":173,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:18023","name":"Rectangle 3","type":"RECTANGLE","layout":{"width":6,"height":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}},{"id":"584:18024","name":"Rectangle 2","type":"RECTANGLE","layout":{"width":6,"height":6,"x":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"backgroundColor":"#2A2A2A","borderRadius":20}}]},{"id":"584:18025","name":"Frame 121","type":"FRAME","layout":{"width":366,"height":67,"y":30,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"space-between","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:18026","name":"Frame 122","type":"FRAME","layout":{"width":366,"height":67,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"primaryAxisAlign":"space-between","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:18027","name":"Frame 209","type":"FRAME","layout":{"width":366,"height":67,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":4,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:18028","name":"Раскройте себя как автора","type":"TEXT","text":"Раскройте себя как автора","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Semi Bold","fontSize":24,"fontWeight":600,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":366,"height":29,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"584:18029","name":"Заполняйте с душой, а если устанете, сохраните и сможете заполнить позже","type":"TEXT","text":"Заполняйте с душой, а если устанете, сохраните и сможете заполнить позже","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Regular","fontSize":14,"fontWeight":400,"textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":366,"height":34,"y":33,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]}]}]}]},{"id":"584:18030","name":"Frame 207","type":"FRAME","layout":{"width":366,"height":1014,"x":12,"y":221,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":48,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:18031","name":"Frame 204","type":"FRAME","layout":{"width":366,"height":168,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:18032","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I584:18032;285:4864","name":"Обычный","type":"TEXT","text":"Коротко о себе","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":120,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"584:18033","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"y":64,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I584:18033;285:4864","name":"Обычный","type":"TEXT","text":"Практика и подход","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":150,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"584:18034","name":"Frame 115","type":"FRAME","layout":{"width":366,"height":40,"y":128,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:18035","name":"Frame 119","type":"FRAME","layout":{"width":366,"height":40,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":8,"right":0,"bottom":8,"left":0},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:18036","name":"Выберите основные направления","type":"TEXT","text":"Выберите основные направления","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":332,"height":19,"y":10.5,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"584:18037","name":"arrow-right-01","type":"FRAME","layout":{"width":24,"height":24,"x":342,"y":8,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:18038","name":"Vector","type":"VECTOR","layout":{"width":6,"height":12}}]}]}]}]},{"id":"584:18039","name":"Frame 206","type":"FRAME","layout":{"width":366,"height":702,"y":216,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":24,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:18040","name":"Frame 211","type":"FRAME","layout":{"width":366,"height":62,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":4,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:18041","name":"Биография и достижения","type":"TEXT","text":"Биография и достижения","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":20,"fontWeight":500,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":366,"height":24,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"584:18042","name":"Напишите ваши большие достижения, выставки и расскажите о себе в годах","type":"TEXT","text":"Напишите ваши большие достижения, выставки и расскажите о себе в годах","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Regular","fontSize":14,"fontWeight":400,"textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":366,"height":34,"y":28,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]},{"id":"594:18225","name":"Frame 214","type":"FRAME","layout":{"width":366,"height":616,"y":86,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"594:18067","name":"Frame 212","type":"FRAME","layout":{"width":366,"height":488,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"594:18066","name":"Rectangle 14","type":"RECTANGLE","layout":{"width":366,"height":488,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#F3F3F3"}],"backgroundColor":"#F3F3F3","borderRadius":28}},{"id":"594:18089","name":"Frame 213","type":"FRAME","layout":{"width":178,"height":130,"x":94,"y":338,"layoutAlign":"inherit","constraints":{"horizontal":"center","vertical":"max"},"mode":"vertical","gap":18,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"594:18068","name":"image-add-02","type":"FRAME","layout":{"width":64,"height":64,"x":57,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"594:18069","name":"Vector","type":"VECTOR","layout":{"width":48,"height":16}},{"id":"594:18070","name":"Vector","type":"VECTOR","layout":{"width":50.67,"height":50.67}},{"id":"594:18071","name":"Vector","type":"VECTOR","layout":{"width":18.67,"height":18.67}}]},{"id":"594:18073","name":"Кнопки","type":"INSTANCE","layout":{"width":178,"height":48,"y":82,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":10,"right":16,"bottom":10,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","strokeStyleName":"button-grad","borderRadius":80,"strokes":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","gradientType":"linear","css":"linear-gradient(#2A2A2A 0%, #585858 100%)","gradientStops":[{"color":"#2A2A2A","position":0},{"color":"#585858","position":1}],"transform":[[0.81,0.19,0],[-0.19,0.19,0.5]]}]},"componentProperties":{"Icon":"584:17842","Иконка правая":"false","Иконка левая":"true","Обычная":"Обводка"},"componentPropertyDetails":{"Icon":{"type":"INSTANCE_SWAP","value":"584:17842"},"Иконка правая":{"type":"BOOLEAN","value":false},"Иконка левая":{"type":"BOOLEAN","value":true},"Обычная":{"type":"VARIANT","value":"Обводка"}},"children":[{"id":"I594:18073;298:6023","name":"Иконка левая","type":"FRAME","layout":{"width":26,"height":26,"x":17,"y":11,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":4,"bottom":4,"left":4},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I594:18073;298:6024","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":4,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"image-01"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"image-01"}},"children":[{"id":"I594:18073;298:6024;584:17847","name":"image-01","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I594:18073;298:6024;584:17848","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":2.25}},{"id":"I594:18073;298:6024;584:17849","name":"Vector","type":"VECTOR","layout":{"width":14.25,"height":14.25}},{"id":"I594:18073;298:6024;584:17850","name":"Vector","type":"VECTOR","layout":{"width":12.37,"height":6.75}}]}],"componentPropertyReferences":{"mainComponent":"Icon"}}],"componentPropertyReferences":{"visible":"Иконка левая"}},{"id":"I594:18073;278:4571","name":"Кнопка","type":"TEXT","text":"Добавить фото","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":26,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":116,"height":26,"x":45,"y":11,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}]},{"id":"594:18164","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"y":500,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I594:18164;303:8697","name":"Иконка левая","type":"FRAME","layout":{"width":22,"height":22,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I594:18164;303:8698","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"calendar-01"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"calendar-01"}},"children":[{"id":"I594:18164;303:8698;597:18948","name":"calendar-01","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I594:18164;303:8698;597:18949","name":"Vector","type":"VECTOR","layout":{"width":6,"height":3}},{"id":"I594:18164;303:8698;597:18950","name":"Vector","type":"VECTOR","layout":{"width":13.5,"height":13.5}},{"id":"I594:18164;303:8698;597:18951","name":"Vector","type":"VECTOR","layout":{"width":13.5,"height":0}},{"id":"I594:18164;303:8698;597:18952","name":"Vector","type":"VECTOR","layout":{"width":4.88,"height":3.75}}]}]}]},{"id":"I594:18164;285:4864","name":"Обычный","type":"TEXT","text":"ММ.ГГГГ","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":70,"height":24,"x":39,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"594:18165","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"y":564,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I594:18165;285:4864","name":"Обычный","type":"TEXT","text":"Напишите краткое описание","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":225,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}]},{"id":"584:18046","name":"Frame 190","type":"FRAME","layout":{"width":366,"height":48,"y":966,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":10,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:18047","name":"Кнопки","type":"INSTANCE","layout":{"width":366,"height":48,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":10,"right":16,"bottom":10,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#292929"}],"backgroundColor":"#292929","borderRadius":80,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Иконка правая":"false","Icon":"297:5597","Иконка левая":"false","Обычная":"Черная"},"componentPropertyDetails":{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5597"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}},"children":[{"id":"I584:18047;278:4690","name":"Кнопка","type":"TEXT","text":"Сохранить","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":26,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":83,"height":26,"x":141.5,"y":11,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}]},{"id":"584:18048","name":"Change-This","type":"VECTOR","layout":{"width":389.56,"height":49.78}}],"prototype":{"overflowDirection":"none","fixedChildIds":["584:18048"],"overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}}
```

## Capture Bundle Inputs (Authoritative)
- Keep this bundle intact. Resolve every path relative to the bundle root.
- Review `mcp/figma-locator.json` before calling a Figma MCP tool. Prefer each node's exact `locator.sourceUrl`; otherwise pass its `locator.fileKey` and colon-form `locator.nodeId` through the MCP tool's documented inputs.
- Locator data is for discovery or refresh only. An MCP re-capture creates a new immutable capture; it never replaces the evidence in this bundle.
- This capture has no Figma file key, so MCP cannot reopen its source; rely on the bundled evidence.
- Review `fidelity/coverage.json` before implementation. Every listed node must use its exact pixel fallback or an equivalent implementation proven by the final RGBA comparison.
- Use the reference renders below as the visual source of truth and iterate with screenshot comparison.
- Authoritative target: `references/001-584_18020.png` at exactly 390×1375 CSS pixels. Do not infer the viewport from Figma's fractional geometry or another asset.
- Reference determinism gate passed: two consecutive Figma renders were RGBA-identical. If a later reference becomes unstable, stop exact verification until the changing content is frozen.
- Provide the final exact-size screenshot so the user can load it into Figma to Prompt's built-in `Verify AI screenshot` checker.
- Reference render: `references/001-584_18020.png`
- Match design assets by their manifest `nodeId`; bundled paths override any generated filename elsewhere in this prompt.
- Design asset for node `584:18048`: `assets/001-584_18048.png`
- Rendered fallbacks are Figma-authored precision assets. Use the PNG variant for the exact 1× target; use the outlined, unsimplified SVG variant when the node must scale. Preserve semantics or interactions with an accessible overlay when needed.
- Rendered fallback (pixel) for node `584:18020` (context-dependent-effect): `fallbacks/001-584_18020.png`
- Rendered fallback (vector) for node `584:18020` (context-dependent-effect): `fallbacks/001-584_18020.svg`

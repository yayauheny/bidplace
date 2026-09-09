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
- `#F3F3F3` (border)
- `#F3F3F3` (border)
- `#F3F3F3` (background)
- `#F3F3F3` (background)
- `#FFFFFF` (border)
- `#FFFFFF` (border)
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
- Inter 600 16px, letter-spacing: -2%
- Inter 400 12px
### Spacing & Radii
- Spacing scale: 2px, 4px, 8px, 10px, 12px, 12.08px, 13px, 14px, 16px, 20px, 24px, 48px
- Border radii: 18px, 20px, 21px, 80px

## Interaction Contract
Implement these Figma prototype settings and reactions explicitly. Preserve scrolling, fixed layers, overlay behavior, trigger/action order, and transitions; do not infer a different behavior from appearance or node names.
- `Стать автором заполнение профиля` (`738:20051`) prototype settings: `{"overflowDirection":"none","fixedChildIds":["738:20087"],"overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 139` (`738:20052`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 139 > Frame 151` (`738:20053`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 139 > Frame 121` (`738:20056`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 139 > Frame 121 > Frame 122` (`738:20057`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 139 > Frame 121 > Frame 122 > Frame 209` (`738:20058`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207` (`738:20061`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 204` (`738:20062`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода` (`738:20063`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода` (`738:20064`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 204 > Frame 115` (`738:20065`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 204 > Frame 115 > Frame 119` (`738:20066`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 204 > Frame 115 > Frame 119 > arrow-right-01` (`738:20068`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206` (`738:20070`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 211` (`738:20071`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214` (`738:20074`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 217` (`738:20226`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 217 > Frame 201` (`738:20209`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 217 > Frame 201 > Frame 199` (`738:20210`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 217 > Frame 201 > Frame 199 > arrow-up-03` (`740:20246`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 217 > Frame 201 > Frame 200` (`738:20219`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода` (`738:20083`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая` (`I738:20083;303:8697`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая > Иконки кнопок` (`I738:20083;303:8698`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая > Иконки кнопок > calendar-01` (`I738:20083;303:8698;597:18948`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода` (`738:20084`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Кнопки` (`740:20250`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Кнопки > Иконка левая` (`I740:20250;584:17872`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Кнопки > Иконка левая > Иконки кнопок` (`I740:20250;584:17873`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Кнопки > Иконка левая > Иконки кнопок > plus` (`I740:20250;584:17873;424:17645`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 190` (`738:20085`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 190 > Кнопки` (`738:20086`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`

## Component API Contract
Use the documented component properties as the public API. Preserve typed defaults, variants, and active values instead of coercing them from labels.
### Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода (`738:20063`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода (`738:20064`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода (`738:20083`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая > Иконки кнопок (`I738:20083;303:8698`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"calendar-01"}}`
### Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода (`738:20084`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Кнопки (`740:20250`)
- Active property values: `{"Icon":{"type":"INSTANCE_SWAP","value":"312:9251"},"Иконка правая":{"type":"BOOLEAN","value":false},"Иконка левая":{"type":"BOOLEAN","value":true},"Обычная":{"type":"VARIANT","value":"Серая"}}`
### Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Кнопки > Иконка левая (`I740:20250;584:17872`)
- Sublayer property references: `{"visible":"Иконка левая"}`
### Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Кнопки > Иконка левая > Иконки кнопок (`I740:20250;584:17873`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"plus"}}`
- Sublayer property references: `{"mainComponent":"Icon"}`
### Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Кнопки > Иконка левая > Иконки кнопок > plus > Vector (`I740:20250;584:17873;424:17646`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Стать автором заполнение профиля > Frame 207 > Frame 190 > Кнопки (`738:20086`)
- Active property values: `{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5597"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}}`

## Fidelity Risk Summary
- Estimated risk: high (57 visible nodes, max depth 8)
- Layout risks: 2 clipped containers, 57 nodes with constraints, 9 nodes with target aspect ratio
- Asset risks: 1 image fills, 1 image fills with crop/filter/opacity metadata, 10 vector-like nodes
- Paint risks: 57 nodes with layer blend mode, 16 nodes with detailed stroke metadata

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
- Стать автором заполнение профиля > Frame 207 [FRAME]: left 12, top 221, width 366, height 708, signals: top-level
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
- Стать автором заполнение профиля > Frame 207 > Frame 206 [FRAME]: left 12, top 437, width 366, height 396
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 211 [FRAME]: left 12, top 437, width 366, height 62
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 211 > Биография и достижения [TEXT]: left 12, top 437, width 366, height 24
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 211 > Напишите ваши большие достижения, выставки и расскажите о себе в годах [TEXT]: left 12, top 465, width 366, height 34
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 [FRAME]: left 12, top 523, width 366, height 310
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 217 [FRAME]: left 12, top 523, width 366, height 122
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 217 > Frame 201 [FRAME]: left 13, top 524, width 364, height 120
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 217 > Frame 201 > Frame 199 [FRAME]: left 13, top 524, width 90, height 120, signals: clips
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 217 > Frame 201 > Frame 199 > arrow-up-03 [FRAME]: left 38, top 564, width 40, height 40
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 217 > Frame 201 > Frame 199 > arrow-up-03 > Vector [VECTOR]: left 48, top 570.67, width 20, height 0, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 217 > Frame 201 > Frame 199 > arrow-up-03 > Vector [VECTOR]: left 58, top 577.33, width 0, height 20, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 217 > Frame 201 > Frame 199 > arrow-up-03 > Vector [VECTOR]: left 51.33, top 577.33, width 13.33, height 6.67, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 217 > Frame 201 > Frame 200 [FRAME]: left 117, top 546, width 260, height 76
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 217 > Frame 201 > Frame 200 > Выберите картинку для загрузки [TEXT]: left 117, top 546, width 260, height 38
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Frame 217 > Frame 201 > Frame 200 > Формат изображения 3:4 Масимальный размер 10МБ [TEXT]: left 117, top 592, width 260, height 30
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода [INSTANCE]: left 12, top 657, width 366, height 52, signals: component
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая [FRAME]: left 25, top 671, width 22, height 22
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая > Иконки кнопок [INSTANCE]: left 27, top 673, width 18, height 18, signals: component
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая > Иконки кнопок > calendar-01 [FRAME]: left 27, top 673, width 18, height 18
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая > Иконки кнопок > calendar-01 > Vector [VECTOR]: left 33, top 674.5, width 6, height 3, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая > Иконки кнопок > calendar-01 > Vector [VECTOR]: left 29.25, top 676, width 13.5, height 13.5, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая > Иконки кнопок > calendar-01 > Vector [VECTOR]: left 29.25, top 680.5, width 13.5, height 0, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Иконка левая > Иконки кнопок > calendar-01 > Vector [VECTOR]: left 33.75, top 683.13, width 4.88, height 3.75, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Обычный [TEXT]: left 51, top 671, width 70, height 24
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода [INSTANCE]: left 12, top 721, width 366, height 52, signals: component
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Поля ввода > Обычный [TEXT]: left 25, top 735, width 225, height 24
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Кнопки [INSTANCE]: left 73.5, top 785, width 243, height 48, signals: component
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Кнопки > Иконка левая [FRAME]: left 90.5, top 796, width 26, height 26
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Кнопки > Иконка левая > Иконки кнопок [INSTANCE]: left 94.5, top 800, width 18, height 18, signals: component
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Кнопки > Иконка левая > Иконки кнопок > plus [FRAME]: left 94.5, top 800, width 18, height 18
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Кнопки > Иконка левая > Иконки кнопок > plus > Vector [VECTOR]: left 97.49, top 803, width 12, height 12, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 206 > Frame 214 > Кнопки > Кнопка [TEXT]: left 118.5, top 796, width 181, height 26
- Стать автором заполнение профиля > Frame 207 > Frame 190 [FRAME]: left 12, top 881, width 366, height 48
- Стать автором заполнение профиля > Frame 207 > Frame 190 > Кнопки [INSTANCE]: left 12, top 881, width 366, height 48, signals: component
- Стать автором заполнение профиля > Frame 207 > Frame 190 > Кнопки > Кнопка [TEXT]: left 153.5, top 892, width 83, height 26
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
│   │       ├── Frame 217 (FRAME, horizontal, fill×hug)
│   │       │   └── Frame 201 (FRAME, horizontal, fill×hug)
│   │       │       ├── Frame 199 (FRAME, horizontal, fixed×fixed)
│   │       │       │   └── arrow-up-03 (FRAME, fixed×fixed)
│   │       │       │       ├── Vector (VECTOR, fixed×fixed)
│   │       │       │       ├── Vector (VECTOR, fixed×fixed)
│   │       │       │       └── Vector (VECTOR, fixed×fixed)
│   │       │       └── Frame 200 (FRAME, vertical, fill×hug)
│   │       │           ├── Выберите картинку для загрузки (TEXT, fill×hug) "Выберите картинку 
для загрузки"
│   │       │           └── Формат изображения 3:4 Масимальный размер 10МБ (TEXT, fill×hug) "Формат изображения 3:4 Масимальный разме…"
│   │       ├── Поля ввода (INSTANCE, horizontal, fill×hug)
│   │       │   ├── Иконка левая (FRAME, horizontal, hug×hug)
│   │       │   │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│   │       │   │       └── calendar-01 (FRAME, fixed×fixed)
│   │       │   │           ├── Vector (VECTOR, fixed×fixed)
│   │       │   │           ├── Vector (VECTOR, fixed×fixed)
│   │       │   │           ├── Vector (VECTOR, fixed×fixed)
│   │       │   │           └── Vector (VECTOR, fixed×fixed)
│   │       │   └── Обычный (TEXT, hug×hug) "ММ.ГГГГ"
│   │       ├── Поля ввода (INSTANCE, horizontal, fill×hug)
│   │       │   └── Обычный (TEXT, hug×hug) "Напишите краткое описание"
│   │       └── Кнопки (INSTANCE, horizontal, hug×hug)
│   │           ├── Иконка левая (FRAME, horizontal, hug×hug)
│   │           │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│   │           │       └── plus (FRAME, fixed×fixed)
│   │           │           └── Vector (VECTOR, fixed×fixed)
│   │           └── Кнопка (TEXT, hug×hug) "Добавить еще событие"
│   └── Frame 190 (FRAME, vertical, fixed×hug)
│       └── Кнопки (INSTANCE, horizontal, fill×hug)
│           └── Кнопка (TEXT, hug×hug) "Сохранить"
└── Change-This (VECTOR, fixed×fixed)
```

## Component Structure
```
{"id":"738:20051","name":"Стать автором заполнение профиля","type":"FRAME","layout":{"width":390,"height":1375,"x":1071,"y":2886,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"overflow":"hidden","mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"},"children":[{"id":"738:20052","name":"Frame 139","type":"FRAME","layout":{"width":366,"height":97,"x":12,"y":84,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":24,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"738:20053","name":"Frame 151","type":"FRAME","layout":{"width":20,"height":6,"x":173,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"738:20054","name":"Rectangle 3","type":"RECTANGLE","layout":{"width":6,"height":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}},{"id":"738:20055","name":"Rectangle 2","type":"RECTANGLE","layout":{"width":6,"height":6,"x":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"backgroundColor":"#2A2A2A","borderRadius":20}}]},{"id":"738:20056","name":"Frame 121","type":"FRAME","layout":{"width":366,"height":67,"y":30,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"space-between","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"738:20057","name":"Frame 122","type":"FRAME","layout":{"width":366,"height":67,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"primaryAxisAlign":"space-between","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"738:20058","name":"Frame 209","type":"FRAME","layout":{"width":366,"height":67,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":4,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"738:20059","name":"Раскройте себя как автора","type":"TEXT","text":"Раскройте себя как автора","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Semi Bold","fontSize":24,"fontWeight":600,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":366,"height":29,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"738:20060","name":"Заполняйте с душой, а если устанете, сохраните и сможете заполнить позже","type":"TEXT","text":"Заполняйте с душой, а если устанете, сохраните и сможете заполнить позже","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Regular","fontSize":14,"fontWeight":400,"textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":366,"height":34,"y":33,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]}]}]}]},{"id":"738:20061","name":"Frame 207","type":"FRAME","layout":{"width":366,"height":708,"x":12,"y":221,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":48,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"738:20062","name":"Frame 204","type":"FRAME","layout":{"width":366,"height":168,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"738:20063","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I738:20063;285:4864","name":"Обычный","type":"TEXT","text":"Коротко о себе","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":120,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"738:20064","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"y":64,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I738:20064;285:4864","name":"Обычный","type":"TEXT","text":"Практика и подход","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":150,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"738:20065","name":"Frame 115","type":"FRAME","layout":{"width":366,"height":40,"y":128,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"738:20066","name":"Frame 119","type":"FRAME","layout":{"width":366,"height":40,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":8,"right":0,"bottom":8,"left":0},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"738:20067","name":"Выберите основные направления","type":"TEXT","text":"Выберите основные направления","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":332,"height":19,"y":10.5,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"738:20068","name":"arrow-right-01","type":"FRAME","layout":{"width":24,"height":24,"x":342,"y":8,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"738:20069","name":"Vector","type":"VECTOR","layout":{"width":6,"height":12}}]}]}]}]},{"id":"738:20070","name":"Frame 206","type":"FRAME","layout":{"width":366,"height":396,"y":216,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":24,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"738:20071","name":"Frame 211","type":"FRAME","layout":{"width":366,"height":62,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":4,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"738:20072","name":"Биография и достижения","type":"TEXT","text":"Биография и достижения","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":20,"fontWeight":500,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":366,"height":24,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"738:20073","name":"Напишите ваши большие достижения, выставки и расскажите о себе в годах","type":"TEXT","text":"Напишите ваши большие достижения, выставки и расскажите о себе в годах","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Regular","fontSize":14,"fontWeight":400,"textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":366,"height":34,"y":28,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]},{"id":"738:20074","name":"Frame 214","type":"FRAME","layout":{"width":366,"height":310,"y":86,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"738:20226","name":"Frame 217","type":"FRAME","layout":{"width":366,"height":122,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","borderRadius":21,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#F3F3F3"}],"borderColor":"#F3F3F3","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"738:20209","name":"Frame 201","type":"FRAME","layout":{"width":364,"height":120,"x":1,"y":1,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":14,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"738:20210","name":"Frame 199","type":"FRAME","layout":{"width":90,"height":120,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":300,"y":400},"overflow":"hidden","mode":"horizontal","gap":12.08,"strokesIncludedInLayout":true,"padding":{"top":20,"right":20,"bottom":20,"left":20},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#F3F3F3"}],"backgroundColor":"#F3F3F3","borderRadius":20},"children":[{"id":"740:20246","name":"arrow-up-03","type":"FRAME","layout":{"width":40,"height":40,"x":25,"y":40,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":40,"y":40},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"740:20247","name":"Vector","type":"VECTOR","layout":{"width":20,"height":0}},{"id":"740:20248","name":"Vector","type":"VECTOR","layout":{"width":0,"height":20}},{"id":"740:20249","name":"Vector","type":"VECTOR","layout":{"width":13.33,"height":6.67}}]}]},{"id":"738:20219","name":"Frame 200","type":"FRAME","layout":{"width":260,"height":76,"x":104,"y":22,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"738:20244","name":"Выберите картинку для загрузки","type":"TEXT","text":"Выберите картинку \nдля загрузки","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Semi Bold","fontSize":16,"fontWeight":600,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":260,"height":38,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"738:20242","name":"Формат изображения 3:4 Масимальный размер 10МБ","type":"TEXT","text":"Формат изображения 3:4 Масимальный размер 10МБ","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Regular","fontSize":12,"fontWeight":400,"textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":260,"height":30,"y":46,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]}]}]},{"id":"738:20083","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"y":134,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I738:20083;303:8697","name":"Иконка левая","type":"FRAME","layout":{"width":22,"height":22,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I738:20083;303:8698","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"calendar-01"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"calendar-01"}},"children":[{"id":"I738:20083;303:8698;597:18948","name":"calendar-01","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I738:20083;303:8698;597:18949","name":"Vector","type":"VECTOR","layout":{"width":6,"height":3}},{"id":"I738:20083;303:8698;597:18950","name":"Vector","type":"VECTOR","layout":{"width":13.5,"height":13.5}},{"id":"I738:20083;303:8698;597:18951","name":"Vector","type":"VECTOR","layout":{"width":13.5,"height":0}},{"id":"I738:20083;303:8698;597:18952","name":"Vector","type":"VECTOR","layout":{"width":4.88,"height":3.75}}]}]}]},{"id":"I738:20083;285:4864","name":"Обычный","type":"TEXT","text":"ММ.ГГГГ","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":70,"height":24,"x":39,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"738:20084","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"y":198,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I738:20084;285:4864","name":"Обычный","type":"TEXT","text":"Напишите краткое описание","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":225,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"740:20250","name":"Кнопки","type":"INSTANCE","layout":{"width":243,"height":48,"x":61.5,"y":262,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":10,"right":16,"bottom":10,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#F3F3F3"}],"backgroundColor":"#F3F3F3","borderRadius":80,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"borderColor":"#FFFFFF","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Icon":"312:9251","Иконка правая":"false","Иконка левая":"true","Обычная":"Серая"},"componentPropertyDetails":{"Icon":{"type":"INSTANCE_SWAP","value":"312:9251"},"Иконка правая":{"type":"BOOLEAN","value":false},"Иконка левая":{"type":"BOOLEAN","value":true},"Обычная":{"type":"VARIANT","value":"Серая"}},"children":[{"id":"I740:20250;584:17872","name":"Иконка левая","type":"FRAME","layout":{"width":26,"height":26,"x":17,"y":11,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":4,"bottom":4,"left":4},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I740:20250;584:17873","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":4,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"plus"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"plus"}},"children":[{"id":"I740:20250;584:17873;424:17645","name":"plus","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I740:20250;584:17873;424:17646","name":"Vector","type":"VECTOR","layout":{"width":12,"height":12}}]}],"componentPropertyReferences":{"mainComponent":"Icon"}}],"componentPropertyReferences":{"visible":"Иконка левая"}},{"id":"I740:20250;584:17874","name":"Кнопка","type":"TEXT","text":"Добавить еще событие","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":26,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":181,"height":26,"x":45,"y":11,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}]},{"id":"738:20085","name":"Frame 190","type":"FRAME","layout":{"width":366,"height":48,"y":660,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":10,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"738:20086","name":"Кнопки","type":"INSTANCE","layout":{"width":366,"height":48,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":10,"right":16,"bottom":10,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#292929"}],"backgroundColor":"#292929","borderRadius":80,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Иконка правая":"false","Icon":"297:5597","Иконка левая":"false","Обычная":"Черная"},"componentPropertyDetails":{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5597"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}},"children":[{"id":"I738:20086;278:4690","name":"Кнопка","type":"TEXT","text":"Сохранить","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":26,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":83,"height":26,"x":141.5,"y":11,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}]},{"id":"738:20087","name":"Change-This","type":"VECTOR","layout":{"width":389.56,"height":49.78}}],"prototype":{"overflowDirection":"none","fixedChildIds":["738:20087"],"overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}}
```

## Capture Bundle Inputs (Authoritative)
- Keep this bundle intact. Resolve every path relative to the bundle root.
- Review `mcp/figma-locator.json` before calling a Figma MCP tool. Prefer each node's exact `locator.sourceUrl`; otherwise pass its `locator.fileKey` and colon-form `locator.nodeId` through the MCP tool's documented inputs.
- Locator data is for discovery or refresh only. An MCP re-capture creates a new immutable capture; it never replaces the evidence in this bundle.
- This capture has no Figma file key, so MCP cannot reopen its source; rely on the bundled evidence.
- Review `fidelity/coverage.json` before implementation. Every listed node must use its exact pixel fallback or an equivalent implementation proven by the final RGBA comparison.
- Use the reference renders below as the visual source of truth and iterate with screenshot comparison.
- Authoritative target: `references/001-738_20051.png` at exactly 390×1375 CSS pixels. Do not infer the viewport from Figma's fractional geometry or another asset.
- Reference determinism gate passed: two consecutive Figma renders were RGBA-identical. If a later reference becomes unstable, stop exact verification until the changing content is frozen.
- Provide the final exact-size screenshot so the user can load it into Figma to Prompt's built-in `Verify AI screenshot` checker.
- Reference render: `references/001-738_20051.png`
- Match design assets by their manifest `nodeId`; bundled paths override any generated filename elsewhere in this prompt.
- Design asset for node `738:20087`: `assets/001-738_20087.png`
- Rendered fallbacks are Figma-authored precision assets. Use the PNG variant for the exact 1× target; use the outlined, unsimplified SVG variant when the node must scale. Preserve semantics or interactions with an accessible overlay when needed.
- Rendered fallback (pixel) for node `738:20051` (context-dependent-effect): `fallbacks/001-738_20051.png`
- Rendered fallback (vector) for node `738:20051` (context-dependent-effect): `fallbacks/001-738_20051.svg`

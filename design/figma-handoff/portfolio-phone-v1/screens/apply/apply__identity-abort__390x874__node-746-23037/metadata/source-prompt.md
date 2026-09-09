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
- `#2A2A2A` (border)
- `#2A2A2A` (border)
- `#2A2A2A` (background)
- `#2A2A2A` (background)
- `#DEDEDE` (background)
- `#DEDEDE` (background)
- `#2A2A2A` (text)
- `#2A2A2A` (text)
- `#565656` (text)
- `#565656` (text)
- `#F3F3F3` (background)
- `#F3F3F3` (background)
- `#2A2A2A` → `var(--Black)` (border)
- `#911E05` (border)
- `#911E05` (border)
- `#292929` (background)
- `#292929` (background)
- `#FFFFFF` (text)
- `#FFFFFF` (text)
- `#8A8A8A` (border)
- `#8A8A8A` (border)
- `#8A8A8A` (text)
- `#8A8A8A` (text)
- `#2A2A2A` (background), opacity: 0.5
- `#2A2A2A` (background), opacity: 0.5
- `#FFFFFF` (border)
- `#FFFFFF` (border)
### Typography
- Inter 600 24px, letter-spacing: -2%
- Inter 400 14px
- Inter 500 16px, letter-spacing: -2%
- Inter 400 12px
- Inter 400 16px/24px
- Inter 600 22px, letter-spacing: -2%
- Inter 400 15px/20px, letter-spacing: -2%
### Spacing & Radii
- Spacing scale: 2px, 4px, 8px, 10px, 12px, 12.08px, 13px, 14px, 16px, 20px, 22px, 24px, 32px, 35.03px, 335px, 338px
- Border radii: 18px, 18.12px, 20px, 28px, 80px

## Interaction Contract
Implement these Figma prototype settings and reactions explicitly. Preserve scrolling, fixed layers, overlay behavior, trigger/action order, and transitions; do not infer a different behavior from appearance or node names.
- `Стать автором заполнение профиля` (`746:23037`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 139` (`746:23038`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 139 > Frame 218` (`746:23039`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 139 > Frame 218 > arrow-left-02` (`746:23040`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 139 > Frame 218 > Frame 151` (`746:23043`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 139 > Frame 218 > x` (`746:23048`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 139 > Frame 152` (`746:23050`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 139 > Frame 152 > Frame 122` (`746:23051`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207` (`746:23054`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 202` (`746:23055`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201` (`746:23057`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 199` (`746:23058`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 199 > image-add-02` (`746:23059`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 200` (`746:23067`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 200 > Кнопки` (`746:23068`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 204` (`746:23070`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода` (`746:23071`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода` (`746:23072`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода > Иконка левая` (`I746:23072;303:8697`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода > Иконка левая > Иконки кнопок` (`I746:23072;303:8698`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода > Иконка левая > Иконки кнопок > at-sign` (`I746:23072;303:8698;578:17459`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода` (`746:23073`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 207 > Frame 204 > Кнопки` (`746:23074`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 223` (`746:23092`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 223 > Frame 138` (`746:23093`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 223 > Frame 138 > Frame 222` (`746:23094`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 223 > Frame 138 > Frame 168` (`746:23097`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 223 > Frame 138 > Frame 168 > Кнопки` (`746:23098`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 223 > Frame 138 > Frame 168 > Кнопки` (`746:23099`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`

## Component API Contract
Use the documented component properties as the public API. Preserve typed defaults, variants, and active values instead of coercing them from labels.
### Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 199 > image-add-02 > Vector (`746:23060`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 199 > image-add-02 > Vector (`746:23061`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 199 > image-add-02 > Vector (`746:23062`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 200 > Кнопки (`746:23068`)
- Active property values: `{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5597"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}}`
### Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода (`746:23071`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода (`746:23072`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода > Иконка левая > Иконки кнопок (`I746:23072;303:8698`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"at-sign"}}`
### Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода (`746:23073`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Стать автором заполнение профиля > Frame 207 > Frame 204 > Кнопки (`746:23074`)
- Active property values: `{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5597"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}}`
### Стать автором заполнение профиля > Frame 223 > Frame 138 > Frame 168 > Кнопки (`746:23098`)
- Active property values: `{"Icon":{"type":"INSTANCE_SWAP","value":"439:5332"},"Иконка правая":{"type":"BOOLEAN","value":false},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Серая"}}`
### Стать автором заполнение профиля > Frame 223 > Frame 138 > Frame 168 > Кнопки (`746:23099`)
- Active property values: `{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"439:5314"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}}`

## Fidelity Risk Summary
- Estimated risk: high (58 visible nodes, max depth 7)
- Layout risks: 4 absolute-positioned auto-layout children, 2 clipped containers, 1 boxes extend outside the root viewport, 58 nodes with constraints, 10 nodes with target aspect ratio
- Asset risks: 12 vector-like nodes
- Paint risks: 58 nodes with layer blend mode, 19 nodes with detailed stroke metadata

## Geometry Checklist
Use these absolute boxes after normalizing the selected root to left 0, top 0. They are derived from `layout.x/y` and help catch drift before styling polish.
- Root `layout.x/y` is the Figma canvas position; do not offset the rendered component by it.
### Bounding Boxes
- Стать автором заполнение профиля [FRAME]: left 0, top 0, width 390, height 874, signals: root/clips
- Стать автором заполнение профиля > Frame 139 [FRAME]: left 12, top 84, width 366, height 102, signals: top-level
- Стать автором заполнение профиля > Frame 139 > Frame 218 [FRAME]: left 12, top 84, width 366, height 28
- Стать автором заполнение профиля > Frame 139 > Frame 218 > arrow-left-02 [FRAME]: left 12, top 84, width 28, height 28
- Стать автором заполнение профиля > Frame 139 > Frame 218 > arrow-left-02 > Vector [VECTOR]: left 18.42, top 98, width 15.75, height 0, signals: vector
- Стать автором заполнение профиля > Frame 139 > Frame 218 > arrow-left-02 > Vector [VECTOR]: left 17.83, top 91, width 7, height 14, signals: vector
- Стать автором заполнение профиля > Frame 139 > Frame 218 > Frame 151 [FRAME]: left 64, top 95, width 262, height 6
- Стать автором заполнение профиля > Frame 139 > Frame 218 > Frame 151 > Rectangle 2 [RECTANGLE]: left 171, top 95, width 6, height 6
- Стать автором заполнение профиля > Frame 139 > Frame 218 > Frame 151 > Rectangle 3 [RECTANGLE]: left 185, top 95, width 6, height 6
- Стать автором заполнение профиля > Frame 139 > Frame 218 > Frame 151 > Rectangle 4 [RECTANGLE]: left 199, top 95, width 6, height 6
- Стать автором заполнение профиля > Frame 139 > Frame 218 > Frame 151 > Rectangle 5 [RECTANGLE]: left 213, top 95, width 6, height 6
- Стать автором заполнение профиля > Frame 139 > Frame 218 > x [FRAME]: left 350, top 84, width 28, height 28
- Стать автором заполнение профиля > Frame 139 > Frame 218 > x > Vector [VECTOR]: left 357, top 91, width 14, height 14, signals: vector
- Стать автором заполнение профиля > Frame 139 > Frame 152 [FRAME]: left 12, top 136, width 366, height 50
- Стать автором заполнение профиля > Frame 139 > Frame 152 > Frame 122 [FRAME]: left 12, top 136, width 366, height 50
- Стать автором заполнение профиля > Frame 139 > Frame 152 > Frame 122 > Основная информация [TEXT]: left 12, top 136, width 366, height 29
- Стать автором заполнение профиля > Frame 139 > Frame 152 > Frame 122 > Тут все поля обязательны для заполнения [TEXT]: left 12, top 169, width 366, height 17
- Стать автором заполнение профиля > Frame 207 [FRAME]: left 12, top 226, width 366, height 564.4, signals: top-level
- Стать автором заполнение профиля > Frame 207 > Frame 202 [FRAME]: left 12, top 226, width 366, height 292.4
- Стать автором заполнение профиля > Frame 207 > Frame 202 > Фото профиля [TEXT]: left 12, top 226, width 366, height 19
- Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 [FRAME]: left 12, top 257, width 366, height 261.4
- Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 199 [FRAME]: left 127.35, top 257, width 135.3, height 180.4, signals: clips
- Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 199 > image-add-02 [FRAME]: left 162.38, top 314.58, width 65.23, height 65.23
- Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 199 > image-add-02 > Vector [VECTOR]: left 170.53, top 344.48, width 48.93, height 16.31, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 199 > image-add-02 > Vector [VECTOR]: left 169.18, top 321.38, width 51.64, height 51.64, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 199 > image-add-02 > Vector [VECTOR]: left 201.79, top 321.38, width 19.03, height 19.03, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 199 > Vector 1 [VECTOR]: left 127.35, top 403.17, width 135.3, height 0, positioning absolute, signals: absolute/vector
- Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 199 > Vector 2 [VECTOR]: left 127.35, top 292.03, width 135.3, height 0, positioning absolute, signals: absolute/vector
- Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 199 > Vector 3 [VECTOR]: left 139.43, top 437, width 180, height 0, positioning absolute, signals: absolute/vector
- Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 199 > Vector 4 [VECTOR]: left 250.57, top 437, width 180, height 0, positioning absolute, signals: absolute/vector
- Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 200 [FRAME]: left 12, top 451.4, width 366, height 67
- Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 200 > Кнопки [INSTANCE]: left 118.5, top 451.4, width 153, height 44, signals: component
- Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 200 > Кнопки > Кнопка [TEXT]: left 135.5, top 460.4, width 119, height 26
- Стать автором заполнение профиля > Frame 207 > Frame 202 > Frame 201 > Frame 200 > Разместите ваше лицо в центр линий [TEXT]: left 12, top 503.4, width 366, height 15
- Стать автором заполнение профиля > Frame 207 > Frame 204 [FRAME]: left 12, top 550.4, width 366, height 240
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода [INSTANCE]: left 12, top 550.4, width 366, height 52, signals: component
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода > Обычный [TEXT]: left 25, top 564.4, width 206, height 24
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода [INSTANCE]: left 12, top 614.4, width 366, height 52, signals: component
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода > Иконка левая [FRAME]: left 25, top 628.4, width 22, height 22
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода > Иконка левая > Иконки кнопок [INSTANCE]: left 27, top 630.4, width 18, height 18, signals: component
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода > Иконка левая > Иконки кнопок > at-sign [FRAME]: left 27, top 630.4, width 18, height 18
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода > Иконка левая > Иконки кнопок > at-sign > Vector [VECTOR]: left 33, top 636.4, width 6, height 6, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода > Иконка левая > Иконки кнопок > at-sign > Vector [VECTOR]: left 28.5, top 631.9, width 15, height 15, signals: vector
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода > Обычный [TEXT]: left 51, top 628.4, width 199, height 24
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода [INSTANCE]: left 12, top 678.4, width 366, height 52, signals: component
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Поля ввода > Обычный [TEXT]: left 25, top 692.4, width 241, height 24
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Кнопки [INSTANCE]: left 12, top 742.4, width 366, height 48, signals: component
- Стать автором заполнение профиля > Frame 207 > Frame 204 > Кнопки > Кнопка [TEXT]: left 145.5, top 753.4, width 99, height 26
- Стать автором заполнение профиля > Frame 223 [FRAME]: left 0, top 0, width 390, height 874, signals: top-level
- Стать автором заполнение профиля > Frame 223 > Frame 138 [FRAME]: left 12, top 335, width 366, height 201
- Стать автором заполнение профиля > Frame 223 > Frame 138 > Frame 222 [FRAME]: left 32, top 359, width 326, height 79
- Стать автором заполнение профиля > Frame 223 > Frame 138 > Frame 222 > Прервать регистрацию [TEXT]: left 32, top 359, width 326, height 27
- Стать автором заполнение профиля > Frame 223 > Frame 138 > Frame 222 > Если вы выйдете из регистрации профиля автора, не сможете продавать с... [TEXT]: left 32, top 398, width 326, height 40
- Стать автором заполнение профиля > Frame 223 > Frame 138 > Frame 168 [FRAME]: left 32, top 460, width 326, height 56
- Стать автором заполнение профиля > Frame 223 > Frame 138 > Frame 168 > Кнопки [INSTANCE]: left 32, top 460, width 159, height 56, signals: component
- Стать автором заполнение профиля > Frame 223 > Frame 138 > Frame 168 > Кнопки > Кнопка [TEXT]: left 74.5, top 475, width 74, height 26
- Стать автором заполнение профиля > Frame 223 > Frame 138 > Frame 168 > Кнопки [INSTANCE]: left 199, top 460, width 159, height 56, signals: component
- Стать автором заполнение профиля > Frame 223 > Frame 138 > Frame 168 > Кнопки > Кнопка [TEXT]: left 229, top 475, width 99, height 26

## Pixel Perfect Template
You are rebuilding this Figma frame for an exact visual match. Treat the JSON as geometry/style data and the reference image/assets as visual evidence.

### Required Inputs
- JSON component structure below.
- If a whole-frame reference image is supplied separately, use it as the visual source of truth.
- Use every listed exported image file exactly; if any required asset is missing, stop and ask for it.

### Render Target
- Build one exact 390×874 frame.
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
- Build against one exact 390×874 viewport with `html, body { margin: 0; }` and global `box-sizing: border-box`.
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
│   ├── Frame 218 (FRAME, horizontal, fill×hug)
│   │   ├── arrow-left-02 (FRAME, fixed×fixed)
│   │   │   ├── Vector (VECTOR, fixed×fixed)
│   │   │   └── Vector (VECTOR, fixed×fixed)
│   │   ├── Frame 151 (FRAME, horizontal, fill×hug)
│   │   │   ├── Rectangle 2 (RECTANGLE, fixed×fixed)
│   │   │   ├── Rectangle 3 (RECTANGLE, fixed×fixed)
│   │   │   ├── Rectangle 4 (RECTANGLE, fixed×fixed)
│   │   │   └── Rectangle 5 (RECTANGLE, fixed×fixed)
│   │   └── x (FRAME, fixed×fixed)
│   │       └── Vector (VECTOR, fixed×fixed)
│   └── Frame 152 (FRAME, vertical, fill×hug)
│       └── Frame 122 (FRAME, vertical, fill×hug)
│           ├── Основная информация (TEXT, fill×hug) "Основная информация"
│           └── Тут все поля обязательны для заполнения (TEXT, fill×hug) "Тут все поля обязательны для заполнения"
├── Frame 207 (FRAME, vertical, fixed×hug)
│   ├── Frame 202 (FRAME, vertical, fixed×hug)
│   │   ├── Фото профиля (TEXT, fill×hug) "Фото профиля"
│   │   └── Frame 201 (FRAME, vertical, fill×hug)
│   │       ├── Frame 199 (FRAME, horizontal, fixed×fixed)
│   │       │   ├── image-add-02 (FRAME, fixed×fixed)
│   │       │   │   ├── Vector (VECTOR, fixed×fixed)
│   │       │   │   ├── Vector (VECTOR, fixed×fixed)
│   │       │   │   └── Vector (VECTOR, fixed×fixed)
│   │       │   ├── Vector 1 (VECTOR, fixed×fixed)
│   │       │   ├── Vector 2 (VECTOR, fixed×fixed)
│   │       │   ├── Vector 3 (VECTOR, fixed×fixed)
│   │       │   └── Vector 4 (VECTOR, fixed×fixed)
│   │       └── Frame 200 (FRAME, vertical, fill×hug)
│   │           ├── Кнопки (INSTANCE, horizontal, hug×hug)
│   │           │   └── Кнопка (TEXT, hug×hug) "Загрузить фото"
│   │           └── Разместите ваше лицо в центр линий (TEXT, fill×hug) "Разместите ваше лицо в центр линий"
│   └── Frame 204 (FRAME, vertical, fill×hug)
│       ├── Поля ввода (INSTANCE, horizontal, fill×hug)
│       │   └── Обычный (TEXT, hug×hug) "Ваше имя, (обязательное)"
│       ├── Поля ввода (INSTANCE, horizontal, fill×hug)
│       │   ├── Иконка левая (FRAME, horizontal, hug×hug)
│       │   │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│       │   │       └── at-sign (FRAME, fixed×fixed)
│       │   │           ├── Vector (VECTOR, fixed×fixed)
│       │   │           └── Vector (VECTOR, fixed×fixed)
│       │   └── Обычный (TEXT, hug×hug) "Никнейм, (обязательное) "
│       ├── Поля ввода (INSTANCE, horizontal, fill×hug)
│       │   └── Обычный (TEXT, hug×hug) "Страна, город, (обязательное)"
│       └── Кнопки (INSTANCE, horizontal, fill×hug)
│           └── Кнопка (TEXT, hug×hug) "Продолжить"
└── Frame 223 (FRAME, vertical, fixed×fixed)
    └── Frame 138 (FRAME, vertical, fixed×hug)
        ├── Frame 222 (FRAME, vertical, fill×hug)
        │   ├── Прервать регистрацию (TEXT, fill×hug) "Прервать регистрацию"
        │   └── Если вы выйдете из регистрации профиля автора, не сможете продавать свои работы (TEXT, fill×hug) "Если вы выйдете из регистрации профиля а…"
        └── Frame 168 (FRAME, horizontal, fill×hug)
            ├── Кнопки (INSTANCE, horizontal, fill×hug)
            │   └── Кнопка (TEXT, hug×hug) "Прервать"
            └── Кнопки (INSTANCE, horizontal, fill×hug)
                └── Кнопка (TEXT, hug×hug) "Продолжить"
```

## Component Structure
```
{"id":"746:23037","name":"Стать автором заполнение профиля","type":"FRAME","layout":{"width":390,"height":874,"x":3461,"y":108,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"overflow":"hidden","mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"},"children":[{"id":"746:23038","name":"Frame 139","type":"FRAME","layout":{"width":366,"height":102,"x":12,"y":84,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":24,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:23039","name":"Frame 218","type":"FRAME","layout":{"width":366,"height":28,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":24,"strokesIncludedInLayout":true,"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:23040","name":"arrow-left-02","type":"FRAME","layout":{"width":28,"height":28,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","opacity":0},"children":[{"id":"746:23041","name":"Vector","type":"VECTOR","layout":{"width":15.75,"height":0}},{"id":"746:23042","name":"Vector","type":"VECTOR","layout":{"width":7,"height":14}}]},{"id":"746:23043","name":"Frame 151","type":"FRAME","layout":{"width":262,"height":6,"x":52,"y":11,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"center","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:23044","name":"Rectangle 2","type":"RECTANGLE","layout":{"width":6,"height":6,"x":107,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"backgroundColor":"#2A2A2A","borderRadius":20}},{"id":"746:23045","name":"Rectangle 3","type":"RECTANGLE","layout":{"width":6,"height":6,"x":121,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}},{"id":"746:23046","name":"Rectangle 4","type":"RECTANGLE","layout":{"width":6,"height":6,"x":135,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}},{"id":"746:23047","name":"Rectangle 5","type":"RECTANGLE","layout":{"width":6,"height":6,"x":149,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}}]},{"id":"746:23048","name":"x","type":"FRAME","layout":{"width":28,"height":28,"x":338,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":12,"y":12},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:23049","name":"Vector","type":"VECTOR","layout":{"width":14,"height":14}}]}]},{"id":"746:23050","name":"Frame 152","type":"FRAME","layout":{"width":366,"height":50,"y":52,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:23051","name":"Frame 122","type":"FRAME","layout":{"width":366,"height":50,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":4,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:23052","name":"Основная информация","type":"TEXT","text":"Основная информация","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Semi Bold","fontSize":24,"fontWeight":600,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":366,"height":29,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"746:23053","name":"Тут все поля обязательны для заполнения","type":"TEXT","text":"Тут все поля обязательны для заполнения","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Regular","fontSize":14,"fontWeight":400,"textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":366,"height":17,"y":33,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]}]}]},{"id":"746:23054","name":"Frame 207","type":"FRAME","layout":{"width":366,"height":564.4,"x":12,"y":226,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":32,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:23055","name":"Frame 202","type":"FRAME","layout":{"width":366,"height":292.4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:23056","name":"Фото профиля","type":"TEXT","text":"Фото профиля","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":366,"height":19,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"746:23057","name":"Frame 201","type":"FRAME","layout":{"width":366,"height":261.4,"y":31,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":14,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:23058","name":"Frame 199","type":"FRAME","layout":{"width":135.3,"height":180.4,"x":115.35,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":300,"y":400},"overflow":"hidden","mode":"horizontal","gap":12.08,"strokesIncludedInLayout":true,"padding":{"top":35.03,"right":35.03,"bottom":35.03,"left":35.03},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#F3F3F3"}],"backgroundColor":"#F3F3F3","borderRadius":18.12},"children":[{"id":"746:23059","name":"image-add-02","type":"FRAME","layout":{"width":65.23,"height":65.23,"x":35.03,"y":57.58,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:23060","name":"Vector","type":"VECTOR","layout":{"width":48.93,"height":16.31}},{"id":"746:23061","name":"Vector","type":"VECTOR","layout":{"width":51.64,"height":51.64}},{"id":"746:23062","name":"Vector","type":"VECTOR","layout":{"width":19.03,"height":19.03}}]},{"id":"746:23063","name":"Vector 1","type":"VECTOR","layout":{"width":135.3,"height":0}},{"id":"746:23064","name":"Vector 2","type":"VECTOR","layout":{"width":135.3,"height":0}},{"id":"746:23065","name":"Vector 3","type":"VECTOR","layout":{"width":180,"height":0}},{"id":"746:23066","name":"Vector 4","type":"VECTOR","layout":{"width":180,"height":0}}]},{"id":"746:23067","name":"Frame 200","type":"FRAME","layout":{"width":366,"height":67,"y":194.4,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:23068","name":"Кнопки","type":"INSTANCE","layout":{"width":153,"height":44,"x":106.5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":8,"right":16,"bottom":8,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#292929"}],"backgroundColor":"#292929","borderRadius":80,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Иконка правая":"false","Icon":"297:5597","Иконка левая":"false","Обычная":"Черная"},"componentPropertyDetails":{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5597"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}},"children":[{"id":"I746:23068;278:4690","name":"Кнопка","type":"TEXT","text":"Загрузить фото","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":26,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":119,"height":26,"x":17,"y":9,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"746:23069","name":"Разместите ваше лицо в центр линий","type":"TEXT","text":"Разместите ваше лицо в центр линий","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Regular","fontSize":12,"fontWeight":400,"textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":366,"height":15,"y":52,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]}]}]},{"id":"746:23070","name":"Frame 204","type":"FRAME","layout":{"width":366,"height":240,"y":324.4,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:23071","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I746:23071;285:4864","name":"Обычный","type":"TEXT","text":"Ваше имя, (обязательное)","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":206,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"746:23072","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"y":64,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I746:23072;303:8697","name":"Иконка левая","type":"FRAME","layout":{"width":22,"height":22,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I746:23072;303:8698","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"at-sign"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"at-sign"}},"children":[{"id":"I746:23072;303:8698;578:17459","name":"at-sign","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I746:23072;303:8698;578:17460","name":"Vector","type":"VECTOR","layout":{"width":6,"height":6}},{"id":"I746:23072;303:8698;578:17461","name":"Vector","type":"VECTOR","layout":{"width":15,"height":15}}]}]}]},{"id":"I746:23072;285:4864","name":"Обычный","type":"TEXT","text":"Никнейм, (обязательное) ","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":199,"height":24,"x":39,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"746:23073","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"y":128,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I746:23073;285:4864","name":"Обычный","type":"TEXT","text":"Страна, город, (обязательное)","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":241,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"746:23074","name":"Кнопки","type":"INSTANCE","layout":{"width":366,"height":48,"y":192,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":10,"right":16,"bottom":10,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#292929"}],"backgroundColor":"#292929","borderRadius":80,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Иконка правая":"false","Icon":"297:5597","Иконка левая":"false","Обычная":"Черная"},"componentPropertyDetails":{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5597"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}},"children":[{"id":"I746:23074;278:4690","name":"Кнопка","type":"TEXT","text":"Продолжить","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":26,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":99,"height":26,"x":133.5,"y":11,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}]},{"id":"746:23092","name":"Frame 223","type":"FRAME","layout":{"width":390,"height":874,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"center"},"mode":"vertical","gap":10,"strokesIncludedInLayout":true,"padding":{"top":335,"right":12,"bottom":338,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.5,"color":"#2A2A2A"}],"backgroundColor":"#2A2A2A","backgroundOpacity":0.5},"children":[{"id":"746:23093","name":"Frame 138","type":"FRAME","layout":{"width":366,"height":201,"x":12,"y":335,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":22,"strokesIncludedInLayout":true,"padding":{"top":24,"right":20,"bottom":20,"left":20},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":28},"children":[{"id":"746:23094","name":"Frame 222","type":"FRAME","layout":{"width":326,"height":79,"x":20,"y":24,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:23095","name":"Прервать регистрацию","type":"TEXT","text":"Прервать регистрацию","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Semi Bold","fontSize":22,"fontWeight":600,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":326,"height":27,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"746:23096","name":"Если вы выйдете из регистрации профиля автора, не сможете продавать свои работы","type":"TEXT","text":"Если вы выйдете из регистрации профиля автора, не сможете продавать свои работы","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":15,"fontWeight":400,"lineHeight":20,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":326,"height":40,"y":39,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]},{"id":"746:23097","name":"Frame 168","type":"FRAME","layout":{"width":326,"height":56,"x":20,"y":125,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:23098","name":"Кнопки","type":"INSTANCE","layout":{"width":159,"height":56,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":14,"right":16,"bottom":14,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#F3F3F3"}],"backgroundColor":"#F3F3F3","borderRadius":80,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"borderColor":"#FFFFFF","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Icon":"439:5332","Иконка правая":"false","Иконка левая":"false","Обычная":"Серая"},"componentPropertyDetails":{"Icon":{"type":"INSTANCE_SWAP","value":"439:5332"},"Иконка правая":{"type":"BOOLEAN","value":false},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Серая"}},"children":[{"id":"I746:23098;584:17874","name":"Кнопка","type":"TEXT","text":"Прервать","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":26,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":74,"height":26,"x":42.5,"y":15,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"746:23099","name":"Кнопки","type":"INSTANCE","layout":{"width":159,"height":56,"x":167,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":14,"right":16,"bottom":14,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#292929"}],"backgroundColor":"#292929","borderRadius":80,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Иконка правая":"false","Icon":"439:5314","Иконка левая":"false","Обычная":"Черная"},"componentPropertyDetails":{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"439:5314"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}},"children":[{"id":"I746:23099;278:4690","name":"Кнопка","type":"TEXT","text":"Продолжить","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":26,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":99,"height":26,"x":30,"y":15,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}]}]}]}
```

## Capture Bundle Inputs (Authoritative)
- Keep this bundle intact. Resolve every path relative to the bundle root.
- Review `mcp/figma-locator.json` before calling a Figma MCP tool. Prefer each node's exact `locator.sourceUrl`; otherwise pass its `locator.fileKey` and colon-form `locator.nodeId` through the MCP tool's documented inputs.
- Locator data is for discovery or refresh only. An MCP re-capture creates a new immutable capture; it never replaces the evidence in this bundle.
- This capture has no Figma file key, so MCP cannot reopen its source; rely on the bundled evidence.
- Review `fidelity/coverage.json` before implementation. Every listed node must use its exact pixel fallback or an equivalent implementation proven by the final RGBA comparison.
- Use the reference renders below as the visual source of truth and iterate with screenshot comparison.
- Authoritative target: `references/001-746_23037.png` at exactly 390×874 CSS pixels. Do not infer the viewport from Figma's fractional geometry or another asset.
- Reference determinism gate passed: two consecutive Figma renders were RGBA-identical. If a later reference becomes unstable, stop exact verification until the changing content is frozen.
- Provide the final exact-size screenshot so the user can load it into Figma to Prompt's built-in `Verify AI screenshot` checker.
- Reference render: `references/001-746_23037.png`
- Match design assets by their manifest `nodeId`; bundled paths override any generated filename elsewhere in this prompt.
- Rendered fallbacks are Figma-authored precision assets. Use the PNG variant for the exact 1× target; use the outlined, unsimplified SVG variant when the node must scale. Preserve semantics or interactions with an accessible overlay when needed.
- Rendered fallback (pixel) for node `746:23037` (context-dependent-effect): `fallbacks/001-746_23037.png`
- Rendered fallback (vector) for node `746:23037` (context-dependent-effect): `fallbacks/001-746_23037.svg`

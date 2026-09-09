# Pixel-perfect Figma rebuild: Поля ввода

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
- `#8A38F5` (border)
- `#FFFFFF` (background)
- `#8A38F5` (border)
- `#8A8A8A` (border)
- `#8A8A8A` (border)
- `#8A8A8A` (text)
- `#8A8A8A` (text)
- `#F3F3F3` (background)
- `#F3F3F3` (background)
- `#2A2A2A` → `var(--Black)` (border)
- `#2A2A2A` → `var(--Black)` (border)
- `#2A2A2A` → `var(--Black)` (text)
- `#2A2A2A` → `var(--Black)` (text)
- `#FCFCFC` (background)
- `#535353` (border)
- `#FCFCFC` (background)
- `#535353` (border)
- `#000000` (border)
- `#000000` (border)
- `#2A2A2A` (border)
- `#004DFF` (border)
- `#004DFF` (border)
- `#FF0000` (border)
- `#FF0000` (border)
- `#FF0000` (text)
- `#FF0000` (text)
- `#039600` (border)
- `#039600` (border)
### Typography
- Inter 400 16px/24px
- Inter 400 14px
- Inter 400 12px
### Spacing & Radii
- Spacing scale: 2px, 4px, 10px, 12px, 13px
- Border radii: 5px, 18px

## Interaction Contract
Implement these Figma prototype settings and reactions explicitly. Preserve scrolling, fixed layers, overlay behavior, trigger/action order, and transitions; do not infer a different behavior from appearance or node names.
- `Поля ввода` (`292:5044`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=Обычный` (`292:5043`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=Обычный > Иконка левая` (`303:8697`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=Обычный > Иконка левая > Иконки кнопок` (`303:8698`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=Обычный > Иконка левая > Иконки кнопок > filter-horizontal` (`I303:8698;297:5692`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=Недоступный` (`292:5042`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=Недоступный > Иконка левая` (`303:8705`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=Недоступный > Иконка левая > Иконки кнопок` (`303:8706`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=Недоступный > Иконка левая > Иконки кнопок > filter-horizontal` (`I303:8706;297:5692`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При наведении обычный` (`292:5041`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При наведении обычный > Иконка левая` (`303:8699`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При наведении обычный > Иконка левая > Иконки кнопок` (`303:8700`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При наведении обычный > Иконка левая > Иконки кнопок > filter-horizontal` (`I303:8700;297:5692`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При наведении обычный > Плейсхолдер` (`738:20045`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При наведении заполненный` (`292:5039`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При наведении заполненный > Иконка левая` (`303:8707`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При наведении заполненный > Иконка левая > Иконки кнопок` (`303:8708`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При наведении заполненный > Иконка левая > Иконки кнопок > filter-horizontal` (`I303:8708;297:5692`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При наведении заполненный > Плейсхолдер` (`738:20048`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=Заполненный` (`292:5038`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=Заполненный > Иконка левая` (`303:8701`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=Заполненный > Иконка левая > Иконки кнопок` (`303:8702`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=Заполненный > Иконка левая > Иконки кнопок > filter-horizontal` (`I303:8702;297:5692`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=Заполненный > Плейсхолдер` (`738:20014`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При вводе` (`292:5037`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При вводе > Иконка левая` (`303:8703`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При вводе > Иконка левая > Иконки кнопок` (`303:8704`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При вводе > Иконка левая > Иконки кнопок > filter-horizontal` (`I303:8704;297:5692`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При вводе > Плейсхолдер` (`738:20027`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При ошибке` (`292:5040`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При ошибке > Иконка левая` (`303:8709`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При ошибке > Иконка левая > Иконки кнопок` (`303:8710`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При ошибке > Иконка левая > Иконки кнопок > filter-horizontal` (`I303:8710;297:5692`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При ошибке > Плейсхолдер` (`738:20036`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При упехе` (`292:5036`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При упехе > Иконка левая` (`303:8711`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При упехе > Иконка левая > Иконки кнопок` (`303:8712`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При упехе > Иконка левая > Иконки кнопок > filter-horizontal` (`I303:8712;297:5692`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Поля ввода > Property 1=При упехе > Плейсхолдер` (`738:20039`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`

## Component API Contract
Use the documented component properties as the public API. Preserve typed defaults, variants, and active values instead of coercing them from labels.
### Поля ввода (`292:5044`)
- Property definitions: `{"Property 1":{"type":"VARIANT","defaultValue":"Обычный","variantOptions":["Заполненный","Недоступный","Обычный","При вводе","При наведении заполненный","При наведении обычный","При ошибке","При упехе"]}}`
### Поля ввода > Property 1=Обычный > Иконка левая > Иконки кнопок (`303:8698`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"filter-horizontal"}}`
### Поля ввода > Property 1=Недоступный > Иконка левая > Иконки кнопок (`303:8706`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"filter-horizontal"}}`
### Поля ввода > Property 1=Недоступный > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8706;297:5693`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=Недоступный > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8706;297:5694`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=Недоступный > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8706;297:5695`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=Недоступный > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8706;297:5696`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=Недоступный > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8706;297:5697`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=Недоступный > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8706;297:5698`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=Недоступный > Недоступный (`285:5032`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При наведении обычный > Иконка левая > Иконки кнопок (`303:8700`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"filter-horizontal"}}`
### Поля ввода > Property 1=При наведении обычный > Плейсхолдер > Плейсхолдер (`738:20046`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При наведении заполненный > Иконка левая > Иконки кнопок (`303:8708`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"filter-horizontal"}}`
### Поля ввода > Property 1=При наведении заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8708;297:5693`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При наведении заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8708;297:5694`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При наведении заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8708;297:5695`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При наведении заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8708;297:5696`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При наведении заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8708;297:5697`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При наведении заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8708;297:5698`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При наведении заполненный > При наведении заполненный (`285:5026`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При наведении заполненный > Плейсхолдер > Плейсхолдер (`738:20049`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=Заполненный > Иконка левая > Иконки кнопок (`303:8702`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"filter-horizontal"}}`
### Поля ввода > Property 1=Заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8702;297:5693`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=Заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8702;297:5694`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=Заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8702;297:5695`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=Заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8702;297:5696`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=Заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8702;297:5697`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=Заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8702;297:5698`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=Заполненный > Заполненный (`285:5022`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=Заполненный > Плейсхолдер > Плейсхолдер (`738:20006`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При вводе > Иконка левая > Иконки кнопок (`303:8704`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"filter-horizontal"}}`
### Поля ввода > Property 1=При вводе > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8704;297:5693`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При вводе > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8704;297:5694`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При вводе > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8704;297:5695`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При вводе > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8704;297:5696`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При вводе > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8704;297:5697`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При вводе > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8704;297:5698`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При вводе > При вводе (`285:5018`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При вводе > Плейсхолдер > Плейсхолдер (`738:20028`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При ошибке > Иконка левая > Иконки кнопок (`303:8710`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"filter-horizontal"}}`
### Поля ввода > Property 1=При ошибке > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8710;297:5693`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При ошибке > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8710;297:5694`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При ошибке > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8710;297:5695`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При ошибке > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8710;297:5696`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При ошибке > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8710;297:5697`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При ошибке > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8710;297:5698`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При ошибке > При ошибке (`285:5028`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При ошибке > Плейсхолдер > Плейсхолдер (`738:20037`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При упехе > Иконка левая > Иконки кнопок (`303:8712`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"filter-horizontal"}}`
### Поля ввода > Property 1=При упехе > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8712;297:5693`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При упехе > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8712;297:5694`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При упехе > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8712;297:5695`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При упехе > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8712;297:5696`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При упехе > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8712;297:5697`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При упехе > Иконка левая > Иконки кнопок > filter-horizontal > Vector (`I303:8712;297:5698`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При упехе > При упехе (`285:5030`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`
### Поля ввода > Property 1=При упехе > Плейсхолдер > Плейсхолдер (`738:20040`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:6325","name":"Black"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:6325","name":"Black","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":0.16470588743686676,"g":0.16470588743686676,"b":0.16470588743686676,"a":1}}}}]`

## Fidelity Risk Summary
- Estimated risk: high (102 visible nodes, max depth 5)
- Layout risks: 7 absolute-positioned auto-layout children, 1 clipped containers, 102 nodes with constraints, 16 nodes with target aspect ratio
- Asset risks: 48 vector-like nodes
- Paint risks: 102 nodes with layer blend mode, 57 nodes with detailed stroke metadata

## Geometry Checklist
Use these absolute boxes after normalizing the selected root to left 0, top 0. They are derived from `layout.x/y` and help catch drift before styling polish.
- Root `layout.x/y` is the Figma canvas position; do not offset the rendered component by it.
### Bounding Boxes
- Поля ввода [COMPONENT_SET]: left 0, top 0, width 789, height 552, signals: root/clips/component
- Поля ввода > Property 1=Обычный [COMPONENT]: left 20, top 20, width 366, height 52, signals: top-level/component
- Поля ввода > Property 1=Обычный > Иконка левая [FRAME]: left 33, top 34, width 22, height 22
- Поля ввода > Property 1=Обычный > Иконка левая > Иконки кнопок [INSTANCE]: left 35, top 36, width 18, height 18, signals: component
- Поля ввода > Property 1=Обычный > Иконка левая > Иконки кнопок > filter-horizontal [FRAME]: left 35, top 36, width 18, height 18
- Поля ввода > Property 1=Обычный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 37.25, top 41.25, width 2.25, height 0, signals: vector
- Поля ввода > Property 1=Обычный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 37.25, top 48.75, width 4.5, height 0, signals: vector
- Поля ввода > Property 1=Обычный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 48.5, top 48.75, width 2.25, height 0, signals: vector
- Поля ввода > Property 1=Обычный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 46.25, top 41.25, width 4.5, height 0, signals: vector
- Поля ввода > Property 1=Обычный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 39.5, top 39, width 4.5, height 4.5, signals: vector
- Поля ввода > Property 1=Обычный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 44, top 46.5, width 4.5, height 4.5, signals: vector
- Поля ввода > Property 1=Обычный > Обычный [TEXT]: left 59, top 34, width 74, height 24
- Поля ввода > Property 1=Недоступный [COMPONENT]: left 20, top 480, width 366, height 52, signals: top-level/component
- Поля ввода > Property 1=Недоступный > Иконка левая [FRAME]: left 33, top 494, width 22, height 22
- Поля ввода > Property 1=Недоступный > Иконка левая > Иконки кнопок [INSTANCE]: left 35, top 496, width 18, height 18, signals: component
- Поля ввода > Property 1=Недоступный > Иконка левая > Иконки кнопок > filter-horizontal [FRAME]: left 35, top 496, width 18, height 18
- Поля ввода > Property 1=Недоступный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 37.25, top 501.25, width 2.25, height 0, signals: vector
- Поля ввода > Property 1=Недоступный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 37.25, top 508.75, width 4.5, height 0, signals: vector
- Поля ввода > Property 1=Недоступный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 48.5, top 508.75, width 2.25, height 0, signals: vector
- Поля ввода > Property 1=Недоступный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 46.25, top 501.25, width 4.5, height 0, signals: vector
- Поля ввода > Property 1=Недоступный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 39.5, top 499, width 4.5, height 4.5, signals: vector
- Поля ввода > Property 1=Недоступный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 44, top 506.5, width 4.5, height 4.5, signals: vector
- Поля ввода > Property 1=Недоступный > Недоступный [TEXT]: left 59, top 494, width 108, height 24
- Поля ввода > Property 1=При наведении обычный [COMPONENT]: left 406, top 20, width 366, height 52, signals: top-level/component
- Поля ввода > Property 1=При наведении обычный > Иконка левая [FRAME]: left 419, top 34, width 22, height 22
- Поля ввода > Property 1=При наведении обычный > Иконка левая > Иконки кнопок [INSTANCE]: left 421, top 36, width 18, height 18, signals: component
- Поля ввода > Property 1=При наведении обычный > Иконка левая > Иконки кнопок > filter-horizontal [FRAME]: left 421, top 36, width 18, height 18
- Поля ввода > Property 1=При наведении обычный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 423.25, top 41.25, width 2.25, height 0, signals: vector
- Поля ввода > Property 1=При наведении обычный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 423.25, top 48.75, width 4.5, height 0, signals: vector
- Поля ввода > Property 1=При наведении обычный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 434.5, top 48.75, width 2.25, height 0, signals: vector
- Поля ввода > Property 1=При наведении обычный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 432.25, top 41.25, width 4.5, height 0, signals: vector
- Поля ввода > Property 1=При наведении обычный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 425.5, top 39, width 4.5, height 4.5, signals: vector
- Поля ввода > Property 1=При наведении обычный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 430, top 46.5, width 4.5, height 4.5, signals: vector
- Поля ввода > Property 1=При наведении обычный > При наведении обычный [TEXT]: left 445, top 34, width 196, height 24
- Поля ввода > Property 1=При наведении обычный > Плейсхолдер [FRAME]: left 421, top 10, width 100, height 17, positioning absolute, signals: absolute
- Поля ввода > Property 1=При наведении обычный > Плейсхолдер > Плейсхолдер [TEXT]: left 425, top 10, width 92, height 17
- Поля ввода > Property 1=При наведении заполненный [COMPONENT]: left 406, top 112, width 366, height 52, signals: top-level/component
- Поля ввода > Property 1=При наведении заполненный > Иконка левая [FRAME]: left 419, top 126, width 22, height 22
- Поля ввода > Property 1=При наведении заполненный > Иконка левая > Иконки кнопок [INSTANCE]: left 421, top 128, width 18, height 18, signals: component
- Поля ввода > Property 1=При наведении заполненный > Иконка левая > Иконки кнопок > filter-horizontal [FRAME]: left 421, top 128, width 18, height 18
- Поля ввода > Property 1=При наведении заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 423.25, top 133.25, width 2.25, height 0, signals: vector
- Поля ввода > Property 1=При наведении заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 423.25, top 140.75, width 4.5, height 0, signals: vector
- Поля ввода > Property 1=При наведении заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 434.5, top 140.75, width 2.25, height 0, signals: vector
- Поля ввода > Property 1=При наведении заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 432.25, top 133.25, width 4.5, height 0, signals: vector
- Поля ввода > Property 1=При наведении заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 425.5, top 131, width 4.5, height 4.5, signals: vector
- Поля ввода > Property 1=При наведении заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 430, top 138.5, width 4.5, height 4.5, signals: vector
- Поля ввода > Property 1=При наведении заполненный > При наведении заполненный [TEXT]: left 445, top 126, width 229, height 24
- Поля ввода > Property 1=При наведении заполненный > Плейсхолдер [FRAME]: left 421, top 102, width 100, height 17, positioning absolute, signals: absolute
- Поля ввода > Property 1=При наведении заполненный > Плейсхолдер > Плейсхолдер [TEXT]: left 425, top 102, width 92, height 17
- Поля ввода > Property 1=Заполненный [COMPONENT]: left 20, top 112, width 366, height 52, signals: top-level/component
- Поля ввода > Property 1=Заполненный > Иконка левая [FRAME]: left 33, top 126, width 22, height 22
- Поля ввода > Property 1=Заполненный > Иконка левая > Иконки кнопок [INSTANCE]: left 35, top 128, width 18, height 18, signals: component
- Поля ввода > Property 1=Заполненный > Иконка левая > Иконки кнопок > filter-horizontal [FRAME]: left 35, top 128, width 18, height 18
- Поля ввода > Property 1=Заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 37.25, top 133.25, width 2.25, height 0, signals: vector
- Поля ввода > Property 1=Заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 37.25, top 140.75, width 4.5, height 0, signals: vector
- Поля ввода > Property 1=Заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 48.5, top 140.75, width 2.25, height 0, signals: vector
- Поля ввода > Property 1=Заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 46.25, top 133.25, width 4.5, height 0, signals: vector
- Поля ввода > Property 1=Заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 39.5, top 131, width 4.5, height 4.5, signals: vector
- Поля ввода > Property 1=Заполненный > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 44, top 138.5, width 4.5, height 4.5, signals: vector
- Поля ввода > Property 1=Заполненный > Заполненный [TEXT]: left 59, top 126, width 107, height 24
- Поля ввода > Property 1=Заполненный > Плейсхолдер [FRAME]: left 35, top 102, width 100, height 17, positioning absolute, signals: absolute
- Поля ввода > Property 1=Заполненный > Плейсхолдер > Плейсхолдер [TEXT]: left 39, top 102, width 92, height 17
- Поля ввода > Property 1=При вводе [COMPONENT]: left 20, top 204, width 366, height 52, signals: top-level/component
- Поля ввода > Property 1=При вводе > Иконка левая [FRAME]: left 33, top 218, width 22, height 22
- Поля ввода > Property 1=При вводе > Иконка левая > Иконки кнопок [INSTANCE]: left 35, top 220, width 18, height 18, signals: component
- Поля ввода > Property 1=При вводе > Иконка левая > Иконки кнопок > filter-horizontal [FRAME]: left 35, top 220, width 18, height 18
- Поля ввода > Property 1=При вводе > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 37.25, top 225.25, width 2.25, height 0, signals: vector
- Поля ввода > Property 1=При вводе > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 37.25, top 232.75, width 4.5, height 0, signals: vector
- Поля ввода > Property 1=При вводе > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 48.5, top 232.75, width 2.25, height 0, signals: vector
- Поля ввода > Property 1=При вводе > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 46.25, top 225.25, width 4.5, height 0, signals: vector
- Поля ввода > Property 1=При вводе > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 39.5, top 223, width 4.5, height 4.5, signals: vector
- Поля ввода > Property 1=При вводе > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 44, top 230.5, width 4.5, height 4.5, signals: vector
- Поля ввода > Property 1=При вводе > При вводе [TEXT]: left 59, top 218, width 83, height 24
- Поля ввода > Property 1=При вводе > Плейсхолдер [FRAME]: left 35, top 194, width 100, height 17, positioning absolute, signals: absolute
- Поля ввода > Property 1=При вводе > Плейсхолдер > Плейсхолдер [TEXT]: left 39, top 194, width 92, height 17
- Поля ввода > Property 1=При ошибке [COMPONENT]: left 20, top 296, width 366, height 52, signals: top-level/component
- Поля ввода > Property 1=При ошибке > Заполните поле [TEXT]: left 33, top 351, width 94, height 15, positioning absolute, signals: absolute
- Поля ввода > Property 1=При ошибке > Иконка левая [FRAME]: left 33, top 310, width 22, height 22
- Поля ввода > Property 1=При ошибке > Иконка левая > Иконки кнопок [INSTANCE]: left 35, top 312, width 18, height 18, signals: component
- Поля ввода > Property 1=При ошибке > Иконка левая > Иконки кнопок > filter-horizontal [FRAME]: left 35, top 312, width 18, height 18
- Поля ввода > Property 1=При ошибке > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 37.25, top 317.25, width 2.25, height 0, signals: vector
- Поля ввода > Property 1=При ошибке > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 37.25, top 324.75, width 4.5, height 0, signals: vector
- Поля ввода > Property 1=При ошибке > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 48.5, top 324.75, width 2.25, height 0, signals: vector
- Поля ввода > Property 1=При ошибке > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 46.25, top 317.25, width 4.5, height 0, signals: vector
- Поля ввода > Property 1=При ошибке > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 39.5, top 315, width 4.5, height 4.5, signals: vector
- Поля ввода > Property 1=При ошибке > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 44, top 322.5, width 4.5, height 4.5, signals: vector
- Поля ввода > Property 1=При ошибке > При ошибке [TEXT]: left 59, top 310, width 95, height 24
- Поля ввода > Property 1=При ошибке > Плейсхолдер [FRAME]: left 35, top 286, width 100, height 17, positioning absolute, signals: absolute
- Поля ввода > Property 1=При ошибке > Плейсхолдер > Плейсхолдер [TEXT]: left 39, top 286, width 92, height 17
- Поля ввода > Property 1=При упехе [COMPONENT]: left 20, top 388, width 366, height 52, signals: top-level/component
- Поля ввода > Property 1=При упехе > Иконка левая [FRAME]: left 33, top 402, width 22, height 22
- Поля ввода > Property 1=При упехе > Иконка левая > Иконки кнопок [INSTANCE]: left 35, top 404, width 18, height 18, signals: component
- Поля ввода > Property 1=При упехе > Иконка левая > Иконки кнопок > filter-horizontal [FRAME]: left 35, top 404, width 18, height 18
- Поля ввода > Property 1=При упехе > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 37.25, top 409.25, width 2.25, height 0, signals: vector
- Поля ввода > Property 1=При упехе > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 37.25, top 416.75, width 4.5, height 0, signals: vector
- Поля ввода > Property 1=При упехе > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 48.5, top 416.75, width 2.25, height 0, signals: vector
- Поля ввода > Property 1=При упехе > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 46.25, top 409.25, width 4.5, height 0, signals: vector
- Поля ввода > Property 1=При упехе > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 39.5, top 407, width 4.5, height 4.5, signals: vector
- Поля ввода > Property 1=При упехе > Иконка левая > Иконки кнопок > filter-horizontal > Vector [VECTOR]: left 44, top 414.5, width 4.5, height 4.5, signals: vector
- Поля ввода > Property 1=При упехе > При упехе [TEXT]: left 59, top 402, width 81, height 24
- Поля ввода > Property 1=При упехе > Плейсхолдер [FRAME]: left 35, top 378, width 100, height 17, positioning absolute, signals: absolute
- Поля ввода > Property 1=При упехе > Плейсхолдер > Плейсхолдер [TEXT]: left 39, top 378, width 92, height 17

## Pixel Perfect Template
You are rebuilding this Figma frame for an exact visual match. Treat the JSON as geometry/style data and the reference image/assets as visual evidence.

### Required Inputs
- JSON component structure below.
- If a whole-frame reference image is supplied separately, use it as the visual source of truth.
- Use every listed exported image file exactly; if any required asset is missing, stop and ask for it.

### Render Target
- Build one exact 789×552 frame.
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
- Build against one exact 789×552 viewport with `html, body { margin: 0; }` and global `box-sizing: border-box`.
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
Поля ввода (COMPONENT_SET, fixed×fixed)
├── Property 1=Обычный (COMPONENT, horizontal, fixed×hug)
│   ├── Иконка левая (FRAME, horizontal, hug×hug)
│   │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│   │       └── filter-horizontal (FRAME, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           └── Vector (VECTOR, fixed×fixed)
│   └── Обычный (TEXT, hug×hug) "Обычный"
├── Property 1=Недоступный (COMPONENT, horizontal, fixed×hug)
│   ├── Иконка левая (FRAME, horizontal, hug×hug)
│   │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│   │       └── filter-horizontal (FRAME, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           └── Vector (VECTOR, fixed×fixed)
│   └── Недоступный (TEXT, hug×hug) "Недоступный"
├── Property 1=При наведении обычный (COMPONENT, horizontal, fixed×hug)
│   ├── Иконка левая (FRAME, horizontal, hug×hug)
│   │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│   │       └── filter-horizontal (FRAME, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           └── Vector (VECTOR, fixed×fixed)
│   ├── При наведении обычный (TEXT, hug×hug) "При наведении обычный"
│   └── Плейсхолдер (FRAME, horizontal, hug×hug)
│       └── Плейсхолдер (TEXT, hug×hug) "Плейсхолдер"
├── Property 1=При наведении заполненный (COMPONENT, horizontal, fixed×hug)
│   ├── Иконка левая (FRAME, horizontal, hug×hug)
│   │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│   │       └── filter-horizontal (FRAME, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           └── Vector (VECTOR, fixed×fixed)
│   ├── При наведении заполненный (TEXT, hug×hug) "При наведении заполненный"
│   └── Плейсхолдер (FRAME, horizontal, hug×hug)
│       └── Плейсхолдер (TEXT, hug×hug) "Плейсхолдер"
├── Property 1=Заполненный (COMPONENT, horizontal, fixed×hug)
│   ├── Иконка левая (FRAME, horizontal, hug×hug)
│   │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│   │       └── filter-horizontal (FRAME, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           └── Vector (VECTOR, fixed×fixed)
│   ├── Заполненный (TEXT, hug×hug) "Заполненный"
│   └── Плейсхолдер (FRAME, horizontal, hug×hug)
│       └── Плейсхолдер (TEXT, hug×hug) "Плейсхолдер"
├── Property 1=При вводе (COMPONENT, horizontal, fixed×hug)
│   ├── Иконка левая (FRAME, horizontal, hug×hug)
│   │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│   │       └── filter-horizontal (FRAME, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           └── Vector (VECTOR, fixed×fixed)
│   ├── При вводе (TEXT, hug×hug) "При вводе"
│   └── Плейсхолдер (FRAME, horizontal, hug×hug)
│       └── Плейсхолдер (TEXT, hug×hug) "Плейсхолдер"
├── Property 1=При ошибке (COMPONENT, horizontal, fixed×hug)
│   ├── Заполните поле (TEXT, fixed×fixed) "Заполните поле"
│   ├── Иконка левая (FRAME, horizontal, hug×hug)
│   │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│   │       └── filter-horizontal (FRAME, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           ├── Vector (VECTOR, fixed×fixed)
│   │           └── Vector (VECTOR, fixed×fixed)
│   ├── При ошибке (TEXT, hug×hug) "При ошибке"
│   └── Плейсхолдер (FRAME, horizontal, hug×hug)
│       └── Плейсхолдер (TEXT, hug×hug) "Плейсхолдер"
└── Property 1=При упехе (COMPONENT, horizontal, fixed×hug)
    ├── Иконка левая (FRAME, horizontal, hug×hug)
    │   └── Иконки кнопок (INSTANCE, fixed×fixed)
    │       └── filter-horizontal (FRAME, fixed×fixed)
    │           ├── Vector (VECTOR, fixed×fixed)
    │           ├── Vector (VECTOR, fixed×fixed)
    │           ├── Vector (VECTOR, fixed×fixed)
    │           ├── Vector (VECTOR, fixed×fixed)
    │           ├── Vector (VECTOR, fixed×fixed)
    │           └── Vector (VECTOR, fixed×fixed)
    ├── При упехе (TEXT, hug×hug) "При упехе"
    └── Плейсхолдер (FRAME, horizontal, hug×hug)
        └── Плейсхолдер (TEXT, hug×hug) "Плейсхолдер"
```

## Component Structure
```
{"id":"292:5044","name":"Поля ввода","type":"COMPONENT_SET","layout":{"width":789,"height":552,"x":1276,"y":16,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"overflow":"hidden","mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":5,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A38F5"}],"borderColor":"#8A38F5","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[10,5],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"292:5043","name":"Property 1=Обычный","type":"COMPONENT","layout":{"width":366,"height":52,"x":20,"y":20,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"303:8697","name":"Иконка левая","type":"FRAME","layout":{"width":22,"height":22,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"303:8698","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"filter-horizontal"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"filter-horizontal"}},"children":[{"id":"I303:8698;297:5692","name":"filter-horizontal","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":20,"y":20},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I303:8698;297:5693","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":0}},{"id":"I303:8698;297:5694","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":0}},{"id":"I303:8698;297:5695","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":0}},{"id":"I303:8698;297:5696","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":0}},{"id":"I303:8698;297:5697","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}},{"id":"I303:8698;297:5698","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}}]}]}]},{"id":"285:4864","name":"Обычный","type":"TEXT","text":"Обычный","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":74,"height":24,"x":39,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"292:5042","name":"Property 1=Недоступный","type":"COMPONENT","layout":{"width":366,"height":52,"x":20,"y":480,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#F3F3F3"}],"backgroundColor":"#F3F3F3","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"303:8705","name":"Иконка левая","type":"FRAME","layout":{"width":22,"height":22,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"303:8706","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"filter-horizontal"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"filter-horizontal"}},"children":[{"id":"I303:8706;297:5692","name":"filter-horizontal","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":20,"y":20},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I303:8706;297:5693","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":0}},{"id":"I303:8706;297:5694","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":0}},{"id":"I303:8706;297:5695","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":0}},{"id":"I303:8706;297:5696","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":0}},{"id":"I303:8706;297:5697","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}},{"id":"I303:8706;297:5698","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}}]}]}]},{"id":"285:5032","name":"Недоступный","type":"TEXT","text":"Недоступный","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":108,"height":24,"x":39,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"292:5041","name":"Property 1=При наведении обычный","type":"COMPONENT","layout":{"width":366,"height":52,"x":406,"y":20,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FCFCFC"}],"backgroundColor":"#FCFCFC","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#535353"}],"borderColor":"#535353","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"303:8699","name":"Иконка левая","type":"FRAME","layout":{"width":22,"height":22,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"303:8700","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"filter-horizontal"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"filter-horizontal"}},"children":[{"id":"I303:8700;297:5692","name":"filter-horizontal","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":20,"y":20},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I303:8700;297:5693","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":0}},{"id":"I303:8700;297:5694","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":0}},{"id":"I303:8700;297:5695","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":0}},{"id":"I303:8700;297:5696","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":0}},{"id":"I303:8700;297:5697","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}},{"id":"I303:8700;297:5698","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}}]}]}]},{"id":"285:5023","name":"При наведении обычный","type":"TEXT","text":"При наведении обычный","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":196,"height":24,"x":39,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}},{"id":"738:20045","name":"Плейсхолдер","type":"FRAME","layout":{"width":100,"height":17,"x":15,"y":-10,"layoutPositioning":"absolute","layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":0,"right":4,"bottom":0,"left":4},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"},"children":[{"id":"738:20046","name":"Плейсхолдер","type":"TEXT","text":"Плейсхолдер","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Regular","fontSize":14,"fontWeight":400,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":92,"height":17,"x":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]},{"id":"292:5039","name":"Property 1=При наведении заполненный","type":"COMPONENT","layout":{"width":366,"height":52,"x":406,"y":112,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FCFCFC"}],"backgroundColor":"#FCFCFC","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#000000"}],"borderColor":"#000000","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"303:8707","name":"Иконка левая","type":"FRAME","layout":{"width":22,"height":22,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"303:8708","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"filter-horizontal"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"filter-horizontal"}},"children":[{"id":"I303:8708;297:5692","name":"filter-horizontal","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":20,"y":20},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I303:8708;297:5693","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":0}},{"id":"I303:8708;297:5694","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":0}},{"id":"I303:8708;297:5695","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":0}},{"id":"I303:8708;297:5696","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":0}},{"id":"I303:8708;297:5697","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}},{"id":"I303:8708;297:5698","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}}]}]}]},{"id":"285:5026","name":"При наведении заполненный","type":"TEXT","text":"При наведении заполненный","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":229,"height":24,"x":39,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}},{"id":"738:20048","name":"Плейсхолдер","type":"FRAME","layout":{"width":100,"height":17,"x":15,"y":-10,"layoutPositioning":"absolute","layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":0,"right":4,"bottom":0,"left":4},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"},"children":[{"id":"738:20049","name":"Плейсхолдер","type":"TEXT","text":"Плейсхолдер","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Regular","fontSize":14,"fontWeight":400,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":92,"height":17,"x":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]},{"id":"292:5038","name":"Property 1=Заполненный","type":"COMPONENT","layout":{"width":366,"height":52,"x":20,"y":112,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"303:8701","name":"Иконка левая","type":"FRAME","layout":{"width":22,"height":22,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"303:8702","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"filter-horizontal"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"filter-horizontal"}},"children":[{"id":"I303:8702;297:5692","name":"filter-horizontal","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":20,"y":20},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I303:8702;297:5693","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":0}},{"id":"I303:8702;297:5694","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":0}},{"id":"I303:8702;297:5695","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":0}},{"id":"I303:8702;297:5696","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":0}},{"id":"I303:8702;297:5697","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}},{"id":"I303:8702;297:5698","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}}]}]}]},{"id":"285:5022","name":"Заполненный","type":"TEXT","text":"Заполненный","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":107,"height":24,"x":39,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}},{"id":"738:20014","name":"Плейсхолдер","type":"FRAME","layout":{"width":100,"height":17,"x":15,"y":-10,"layoutPositioning":"absolute","layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":0,"right":4,"bottom":0,"left":4},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"},"children":[{"id":"738:20006","name":"Плейсхолдер","type":"TEXT","text":"Плейсхолдер","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Regular","fontSize":14,"fontWeight":400,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":92,"height":17,"x":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]},{"id":"292:5037","name":"Property 1=При вводе","type":"COMPONENT","layout":{"width":366,"height":52,"x":20,"y":204,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#004DFF"}],"borderColor":"#004DFF","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"303:8703","name":"Иконка левая","type":"FRAME","layout":{"width":22,"height":22,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"303:8704","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"filter-horizontal"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"filter-horizontal"}},"children":[{"id":"I303:8704;297:5692","name":"filter-horizontal","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":20,"y":20},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I303:8704;297:5693","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":0}},{"id":"I303:8704;297:5694","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":0}},{"id":"I303:8704;297:5695","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":0}},{"id":"I303:8704;297:5696","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":0}},{"id":"I303:8704;297:5697","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}},{"id":"I303:8704;297:5698","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}}]}]}]},{"id":"285:5018","name":"При вводе","type":"TEXT","text":"При вводе","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":83,"height":24,"x":39,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}},{"id":"738:20027","name":"Плейсхолдер","type":"FRAME","layout":{"width":100,"height":17,"x":15,"y":-10,"layoutPositioning":"absolute","layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":0,"right":4,"bottom":0,"left":4},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"},"children":[{"id":"738:20028","name":"Плейсхолдер","type":"TEXT","text":"Плейсхолдер","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Regular","fontSize":14,"fontWeight":400,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":92,"height":17,"x":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]},{"id":"292:5040","name":"Property 1=При ошибке","type":"COMPONENT","layout":{"width":366,"height":52,"x":20,"y":296,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#FF0000"}],"borderColor":"#FF0000","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"738:19987","name":"Заполните поле","type":"TEXT","text":"Заполните поле","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FF0000"}],"color":"#FF0000","fontFamily":"Inter","fontStyleName":"Regular","fontSize":12,"fontWeight":400,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":94,"height":15,"x":13,"y":55,"layoutPositioning":"absolute","layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}}},{"id":"303:8709","name":"Иконка левая","type":"FRAME","layout":{"width":22,"height":22,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"303:8710","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"filter-horizontal"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"filter-horizontal"}},"children":[{"id":"I303:8710;297:5692","name":"filter-horizontal","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":20,"y":20},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I303:8710;297:5693","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":0}},{"id":"I303:8710;297:5694","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":0}},{"id":"I303:8710;297:5695","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":0}},{"id":"I303:8710;297:5696","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":0}},{"id":"I303:8710;297:5697","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}},{"id":"I303:8710;297:5698","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}}]}]}]},{"id":"285:5028","name":"При ошибке","type":"TEXT","text":"При ошибке","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":95,"height":24,"x":39,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}},{"id":"738:20036","name":"Плейсхолдер","type":"FRAME","layout":{"width":100,"height":17,"x":15,"y":-10,"layoutPositioning":"absolute","layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":0,"right":4,"bottom":0,"left":4},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"},"children":[{"id":"738:20037","name":"Плейсхолдер","type":"TEXT","text":"Плейсхолдер","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Regular","fontSize":14,"fontWeight":400,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":92,"height":17,"x":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]},{"id":"292:5036","name":"Property 1=При упехе","type":"COMPONENT","layout":{"width":366,"height":52,"x":20,"y":388,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#039600"}],"borderColor":"#039600","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"303:8711","name":"Иконка левая","type":"FRAME","layout":{"width":22,"height":22,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"303:8712","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"filter-horizontal"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"filter-horizontal"}},"children":[{"id":"I303:8712;297:5692","name":"filter-horizontal","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":20,"y":20},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I303:8712;297:5693","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":0}},{"id":"I303:8712;297:5694","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":0}},{"id":"I303:8712;297:5695","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":0}},{"id":"I303:8712;297:5696","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":0}},{"id":"I303:8712;297:5697","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}},{"id":"I303:8712;297:5698","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}}]}]}]},{"id":"285:5030","name":"При упехе","type":"TEXT","text":"При упехе","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":81,"height":24,"x":39,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}},{"id":"738:20039","name":"Плейсхолдер","type":"FRAME","layout":{"width":100,"height":17,"x":15,"y":-10,"layoutPositioning":"absolute","layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":0,"right":4,"bottom":0,"left":4},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"},"children":[{"id":"738:20040","name":"Плейсхолдер","type":"TEXT","text":"Плейсхолдер","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A","variable":"Black"}],"color":"#2A2A2A","variables":{"color":"Black"},"fontFamily":"Inter","fontStyleName":"Regular","fontSize":14,"fontWeight":400,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":92,"height":17,"x":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}],"componentPropertyDefinitions":{"Property 1":{"type":"VARIANT","defaultValue":"Обычный","variantOptions":["Заполненный","Недоступный","Обычный","При вводе","При наведении заполненный","При наведении обычный","При ошибке","При упехе"]}}}
```

## Capture Bundle Inputs (Authoritative)
- Keep this bundle intact. Resolve every path relative to the bundle root.
- Review `mcp/figma-locator.json` before calling a Figma MCP tool. Prefer each node's exact `locator.sourceUrl`; otherwise pass its `locator.fileKey` and colon-form `locator.nodeId` through the MCP tool's documented inputs.
- Locator data is for discovery or refresh only. An MCP re-capture creates a new immutable capture; it never replaces the evidence in this bundle.
- This capture has no Figma file key, so MCP cannot reopen its source; rely on the bundled evidence.
- Review `fidelity/coverage.json` before implementation. Every listed node must use its exact pixel fallback or an equivalent implementation proven by the final RGBA comparison.
- Use the reference renders below as the visual source of truth and iterate with screenshot comparison.
- Authoritative target: `references/001-292_5044.png` at exactly 789×552 CSS pixels. Do not infer the viewport from Figma's fractional geometry or another asset.
- Reference determinism gate passed: two consecutive Figma renders were RGBA-identical. If a later reference becomes unstable, stop exact verification until the changing content is frozen.
- Provide the final exact-size screenshot so the user can load it into Figma to Prompt's built-in `Verify AI screenshot` checker.
- Reference render: `references/001-292_5044.png`
- Match design assets by their manifest `nodeId`; bundled paths override any generated filename elsewhere in this prompt.
- Rendered fallbacks are Figma-authored precision assets. Use the PNG variant for the exact 1× target; use the outlined, unsimplified SVG variant when the node must scale. Preserve semantics or interactions with an accessible overlay when needed.
- Rendered fallback (pixel) for node `292:5044` (context-dependent-effect): `fallbacks/001-292_5044.png`
- Rendered fallback (vector) for node `292:5044` (context-dependent-effect): `fallbacks/001-292_5044.svg`

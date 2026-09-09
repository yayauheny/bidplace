# Pixel-perfect Figma rebuild: Иконки кнопок

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
- `#8A38F5` (border)
- `#8A38F5` (border)
- `#FFFFFF` → `var(--White)` (border)
- `#FFFFFF` → `var(--White)` (border)
- `#FFFFFF` (border)
- `#FFFFFF` → `var(--White)` (background)
- `#FFFFFF` → `var(--White)` (background)
### Spacing & Radii
- Spacing scale: 20px
- Border radii: 5px

## Interaction Contract
Implement these Figma prototype settings and reactions explicitly. Preserve scrolling, fixed layers, overlay behavior, trigger/action order, and transitions; do not infer a different behavior from appearance or node names.
- `Иконки кнопок` (`297:5598`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=filter-horizontal` (`297:5597`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=filter-horizontal > filter-horizontal` (`297:5692`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=arrow-up-down` (`297:5596`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=arrow-up-down > arrow-up-down` (`298:5700`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=search-01` (`298:6503`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=search-01 > search-01` (`303:8786`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=delete-02` (`310:9146`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=delete-02 > delete-02` (`310:9153`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=x` (`310:9195`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=x > x` (`312:9202`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=arrow-left-01` (`312:9232`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=arrow-left-01 > arrow-left-01` (`312:9236`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=arrow-right-01` (`312:9238`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=arrow-right-01 > arrow-right-01` (`312:9242`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=arrow-up-01` (`312:9244`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=arrow-up-01 > arrow-up-01` (`312:9255`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=arrow-down-01` (`424:17641`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=arrow-down-01 > arrow-down-01` (`424:17642`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=plus` (`312:9251`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=plus > plus` (`424:17645`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=minus` (`424:17637`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=minus > minus` (`424:17647`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=copy` (`439:5314`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=copy > copy` (`439:5318`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=qr-code-01` (`439:5332`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=qr-code-01 > qr-code-01` (`439:5337`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=lock-keyhole` (`447:7948`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=lock-keyhole > lock-keyhole` (`447:7957`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=clock-04` (`456:7973`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=clock-04 > clock-04` (`456:7987`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=telegram` (`521:10335`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=telegram > telegram` (`521:10340`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=google` (`521:10365`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=google > google` (`521:10368`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=eye-off` (`523:11263`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=eye-off > eye-off` (`523:11268`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=view` (`523:11273`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=view > view` (`523:11280`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=at-sign` (`578:17451`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=at-sign > at-sign` (`578:17459`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=image-01` (`584:17842`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=image-01 > image-01` (`584:17847`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=calendar-01` (`597:18942`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=calendar-01 > calendar-01` (`597:18948`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=Icon23` (`879:6408`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Иконки кнопок > Icon=Icon23 > ai-magic` (`879:6427`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`

## Component API Contract
Use the documented component properties as the public API. Preserve typed defaults, variants, and active values instead of coercing them from labels.
### Иконки кнопок (`297:5598`)
- Property definitions: `{"Icon":{"type":"VARIANT","defaultValue":"filter-horizontal","variantOptions":["arrow-up-down","filter-horizontal","search-01","delete-02","x","arrow-left-01","arrow-right-01","arrow-up-01","plus","minus","arrow-down-01","copy","qr-code-01","lock-keyhole","clock-04","telegram","google","eye-off","view","at-sign","image-01","calendar-01","Icon23"]}}`
### Иконки кнопок > Icon=filter-horizontal > filter-horizontal > Vector (`297:5693`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=filter-horizontal > filter-horizontal > Vector (`297:5694`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=filter-horizontal > filter-horizontal > Vector (`297:5695`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=filter-horizontal > filter-horizontal > Vector (`297:5696`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=filter-horizontal > filter-horizontal > Vector (`297:5697`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=filter-horizontal > filter-horizontal > Vector (`297:5698`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=arrow-up-down > arrow-up-down > Vector (`298:5701`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=arrow-up-down > arrow-up-down > Vector (`298:5702`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=arrow-up-down > arrow-up-down > Vector (`298:5703`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=arrow-up-down > arrow-up-down > Vector (`298:5704`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=search-01 > search-01 > Vector (`303:8787`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=search-01 > search-01 > Vector (`303:8788`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=delete-02 > delete-02 > Vector (`310:9154`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=delete-02 > delete-02 > Vector (`310:9155`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=delete-02 > delete-02 > Vector (`310:9156`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=delete-02 > delete-02 > Vector (`310:9157`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=x > x > Vector (`312:9203`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=arrow-left-01 > arrow-left-01 > Vector (`312:9237`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=arrow-right-01 > arrow-right-01 > Vector (`312:9243`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=arrow-up-01 > arrow-up-01 > Vector (`312:9256`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=arrow-down-01 > arrow-down-01 > Vector (`424:17643`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=plus > plus > Vector (`424:17646`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=minus > minus > Vector (`424:17648`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=telegram > telegram > Vector (`521:10341`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=google > google > Vector (`521:10381`)
- Variable bindings: `{"fills":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=at-sign > at-sign > Vector (`578:17460`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=at-sign > at-sign > Vector (`578:17461`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=Icon23 > ai-magic > Vector (`879:6428`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`
### Иконки кнопок > Icon=Icon23 > ai-magic > Vector (`879:6429`)
- Variable bindings: `{"strokes":[{"id":"VariableID:298:5699","name":"White"}]}`
- Referenced variable catalog: `[{"id":"VariableID:298:5699","name":"White","collectionId":"VariableCollectionId:140:139","collectionName":"Collection 1","resolvedType":"COLOR","scopes":["ALL_SCOPES"],"valuesByMode":{"140:0":{"modeName":"Mode 1","value":{"r":1,"g":1,"b":1,"a":1}},"140:1":{"modeName":"Mode 2","value":{"r":1,"g":1,"b":1,"a":1}}}}]`

## Fidelity Risk Summary
- Estimated risk: high (103 visible nodes, max depth 3)
- Layout risks: 2 clipped containers, 103 nodes with constraints, 46 nodes with target aspect ratio
- Asset risks: 56 vector-like nodes
- Paint risks: 103 nodes with layer blend mode, 55 nodes with detailed stroke metadata

## Geometry Checklist
Use these absolute boxes after normalizing the selected root to left 0, top 0. They are derived from `layout.x/y` and help catch drift before styling polish.
- Root `layout.x/y` is the Figma canvas position; do not offset the rendered component by it.
### Bounding Boxes
- Иконки кнопок [COMPONENT_SET]: left 0, top 0, width 250, height 174, signals: root/clips/component
- Иконки кнопок > Icon=filter-horizontal [COMPONENT]: left 21, top 21, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=filter-horizontal > filter-horizontal [FRAME]: left 21, top 21, width 18, height 18
- Иконки кнопок > Icon=filter-horizontal > filter-horizontal > Vector [VECTOR]: left 23.25, top 26.25, width 2.25, height 0, signals: vector
- Иконки кнопок > Icon=filter-horizontal > filter-horizontal > Vector [VECTOR]: left 23.25, top 33.75, width 4.5, height 0, signals: vector
- Иконки кнопок > Icon=filter-horizontal > filter-horizontal > Vector [VECTOR]: left 34.5, top 33.75, width 2.25, height 0, signals: vector
- Иконки кнопок > Icon=filter-horizontal > filter-horizontal > Vector [VECTOR]: left 32.25, top 26.25, width 4.5, height 0, signals: vector
- Иконки кнопок > Icon=filter-horizontal > filter-horizontal > Vector [VECTOR]: left 25.5, top 24, width 4.5, height 4.5, signals: vector
- Иконки кнопок > Icon=filter-horizontal > filter-horizontal > Vector [VECTOR]: left 30, top 31.5, width 4.5, height 4.5, signals: vector
- Иконки кнопок > Icon=arrow-up-down [COMPONENT]: left 59, top 21, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=arrow-up-down > arrow-up-down [FRAME]: left 59, top 21, width 18, height 18
- Иконки кнопок > Icon=arrow-up-down > arrow-up-down > Vector [VECTOR]: left 64.25, top 24, width 0, height 12, signals: vector
- Иконки кнопок > Icon=arrow-up-down > arrow-up-down > Vector [VECTOR]: left 71.75, top 24, width 0, height 11.25, signals: vector
- Иконки кнопок > Icon=arrow-up-down > arrow-up-down > Vector [VECTOR]: left 62, top 24, width 4.5, height 2.25, signals: vector
- Иконки кнопок > Icon=arrow-up-down > arrow-up-down > Vector [VECTOR]: left 69.5, top 33.75, width 4.5, height 2.25, signals: vector
- Иконки кнопок > Icon=search-01 [COMPONENT]: left 97, top 21, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=search-01 > search-01 [FRAME]: left 97, top 21, width 18, height 18
- Иконки кнопок > Icon=search-01 > search-01 > Vector [VECTOR]: left 109.75, top 33.75, width 3, height 3, signals: vector
- Иконки кнопок > Icon=search-01 > search-01 > Vector [VECTOR]: left 99.25, top 23.25, width 12, height 12, signals: vector
- Иконки кнопок > Icon=delete-02 [COMPONENT]: left 135, top 21, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=delete-02 > delete-02 [FRAME]: left 135, top 21, width 18, height 18
- Иконки кнопок > Icon=delete-02 > delete-02 > Vector [VECTOR]: left 138.38, top 25.13, width 11.25, height 12.38, signals: vector
- Иконки кнопок > Icon=delete-02 > delete-02 > Vector [VECTOR]: left 137.25, top 22.5, width 13.5, height 2.63, signals: vector
- Иконки кнопок > Icon=delete-02 > delete-02 > Vector [VECTOR]: left 142.13, top 28.88, width 0, height 4.5, signals: vector
- Иконки кнопок > Icon=delete-02 > delete-02 > Vector [VECTOR]: left 145.88, top 28.88, width 0, height 4.5, signals: vector
- Иконки кнопок > Icon=x [COMPONENT]: left 173, top 21, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=x > x [FRAME]: left 173, top 21, width 18, height 18
- Иконки кнопок > Icon=x > x > Vector [VECTOR]: left 177.5, top 25.5, width 9, height 9, signals: vector
- Иконки кнопок > Icon=arrow-left-01 [COMPONENT]: left 211, top 21, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=arrow-left-01 > arrow-left-01 [FRAME]: left 211, top 21, width 18, height 18
- Иконки кнопок > Icon=arrow-left-01 > arrow-left-01 > Vector [VECTOR]: left 217.75, top 25.5, width 4.5, height 9, signals: vector
- Иконки кнопок > Icon=arrow-right-01 [COMPONENT]: left 21, top 59, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=arrow-right-01 > arrow-right-01 [FRAME]: left 21, top 59, width 18, height 18
- Иконки кнопок > Icon=arrow-right-01 > arrow-right-01 > Vector [VECTOR]: left 27.75, top 63.5, width 4.5, height 9, signals: vector
- Иконки кнопок > Icon=arrow-up-01 [COMPONENT]: left 59, top 59, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=arrow-up-01 > arrow-up-01 [FRAME]: left 59, top 59, width 18, height 18
- Иконки кнопок > Icon=arrow-up-01 > arrow-up-01 > Vector [VECTOR]: left 63.5, top 65.75, width 9, height 4.5, signals: vector
- Иконки кнопок > Icon=arrow-down-01 [COMPONENT]: left 97, top 59, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=arrow-down-01 > arrow-down-01 [FRAME]: left 97, top 59, width 18, height 18
- Иконки кнопок > Icon=arrow-down-01 > arrow-down-01 > Vector [VECTOR]: left 101.5, top 65.75, width 9, height 4.5, signals: vector
- Иконки кнопок > Icon=plus [COMPONENT]: left 135, top 59, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=plus > plus [FRAME]: left 135, top 59, width 18, height 18
- Иконки кнопок > Icon=plus > plus > Vector [VECTOR]: left 137.99, top 62, width 12, height 12, signals: vector
- Иконки кнопок > Icon=minus [COMPONENT]: left 173, top 59, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=minus > minus [FRAME]: left 173, top 59, width 18, height 18
- Иконки кнопок > Icon=minus > minus > Vector [VECTOR]: left 175.24, top 68, width 13.5, height 0, signals: vector
- Иконки кнопок > Icon=copy [COMPONENT]: left 211, top 59, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=copy > copy [FRAME]: left 211, top 59, width 18, height 18
- Иконки кнопок > Icon=copy > copy > Vector [VECTOR]: left 216.25, top 60.5, width 10.5, height 12, signals: vector
- Иконки кнопок > Icon=copy > copy > Vector [VECTOR]: left 213.25, top 63.5, width 10.5, height 12, signals: vector
- Иконки кнопок > Icon=qr-code-01 [COMPONENT]: left 21, top 97, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=qr-code-01 > qr-code-01 [FRAME]: left 21, top 97, width 18, height 18
- Иконки кнопок > Icon=qr-code-01 > qr-code-01 > Vector [VECTOR]: left 25.88, top 101.88, width 3, height 3, signals: vector
- Иконки кнопок > Icon=qr-code-01 > qr-code-01 > Vector [VECTOR]: left 31.13, top 101.88, width 3, height 3, signals: vector
- Иконки кнопок > Icon=qr-code-01 > qr-code-01 > Vector [VECTOR]: left 25.88, top 107.13, width 3, height 3, signals: vector
- Иконки кнопок > Icon=qr-code-01 > qr-code-01 > Vector [VECTOR]: left 25.88, top 109.75, width 0.38, height 0.38, signals: vector
- Иконки кнопок > Icon=qr-code-01 > qr-code-01 > Vector [VECTOR]: left 31.13, top 107.13, width 3, height 3, signals: vector
- Иконки кнопок > Icon=qr-code-01 > qr-code-01 > Vector [VECTOR]: left 22.88, top 98.88, width 14.25, height 14.25, signals: vector
- Иконки кнопок > Icon=lock-keyhole [COMPONENT]: left 59, top 97, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=lock-keyhole > lock-keyhole [FRAME]: left 59, top 97, width 18, height 18
- Иконки кнопок > Icon=lock-keyhole > lock-keyhole > Vector [VECTOR]: left 64.62, top 98.5, width 6.75, height 5.25, signals: vector
- Иконки кнопок > Icon=lock-keyhole > lock-keyhole > Vector [VECTOR]: left 62, top 103.75, width 12, height 9.75, signals: vector
- Иконки кнопок > Icon=lock-keyhole > lock-keyhole > Vector [VECTOR]: left 66.5, top 107.13, width 3, height 3, signals: vector
- Иконки кнопок > Icon=clock-04 [COMPONENT]: left 97, top 97, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=clock-04 > clock-04 [FRAME]: left 97, top 97, width 18, height 18
- Иконки кнопок > Icon=clock-04 > clock-04 > Vector [VECTOR]: left 98.88, top 98.5, width 14.63, height 15, signals: vector
- Иконки кнопок > Icon=clock-04 > clock-04 > Vector [VECTOR]: left 106, top 103, width 1.5, height 4.5, signals: vector
- Иконки кнопок > Icon=clock-04 > clock-04 > Vector [VECTOR]: left 98.5, top 106, width 5.25, height 7.5, signals: vector
- Иконки кнопок > Icon=telegram [COMPONENT]: left 135, top 97, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=telegram > telegram [FRAME]: left 135, top 97, width 18, height 18, signals: clips
- Иконки кнопок > Icon=telegram > telegram > Vector [VECTOR]: left 136.35, top 100.72, width 13.88, height 11.5, signals: vector
- Иконки кнопок > Icon=google [COMPONENT]: left 173, top 97, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=google > google [FRAME]: left 173, top 97, width 18, height 18
- Иконки кнопок > Icon=google > google > Vector [VECTOR]: left 174, top 98, width 16, height 16, signals: vector
- Иконки кнопок > Icon=eye-off [COMPONENT]: left 211, top 97, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=eye-off > eye-off [FRAME]: left 211, top 97, width 18, height 18
- Иконки кнопок > Icon=eye-off > eye-off > Vector [VECTOR]: left 212.5, top 101.89, width 11.63, height 9.37, signals: vector
- Иконки кнопок > Icon=eye-off > eye-off > Vector [VECTOR]: left 217.75, top 104.41, width 3.84, height 3.84, signals: vector
- Иконки кнопок > Icon=eye-off > eye-off > Vector [VECTOR]: left 212.5, top 98.5, width 15, height 15, signals: vector
- Иконки кнопок > Icon=eye-off > eye-off > Vector [VECTOR]: left 218.5, top 100.75, width 9, height 7.5, signals: vector
- Иконки кнопок > Icon=view [COMPONENT]: left 21, top 135, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=view > view [FRAME]: left 21, top 135, width 18, height 18
- Иконки кнопок > Icon=view > view > Vector [VECTOR]: left 22.5, top 138.75, width 15, height 10.5, signals: vector
- Иконки кнопок > Icon=view > view > Vector [VECTOR]: left 27.75, top 141.75, width 4.5, height 4.5, signals: vector
- Иконки кнопок > Icon=at-sign [COMPONENT]: left 59, top 135, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=at-sign > at-sign [FRAME]: left 59, top 135, width 18, height 18
- Иконки кнопок > Icon=at-sign > at-sign > Vector [VECTOR]: left 65, top 141, width 6, height 6, signals: vector
- Иконки кнопок > Icon=at-sign > at-sign > Vector [VECTOR]: left 60.5, top 136.5, width 15, height 15, signals: vector
- Иконки кнопок > Icon=image-01 [COMPONENT]: left 97, top 135, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=image-01 > image-01 [FRAME]: left 97, top 135, width 18, height 18
- Иконки кнопок > Icon=image-01 > image-01 > Vector [VECTOR]: left 101.5, top 139.5, width 2.25, height 2.25, signals: vector
- Иконки кнопок > Icon=image-01 > image-01 > Vector [VECTOR]: left 98.88, top 136.88, width 14.25, height 14.25, signals: vector
- Иконки кнопок > Icon=image-01 > image-01 > Vector [VECTOR]: left 100.75, top 144, width 12.37, height 6.75, signals: vector
- Иконки кнопок > Icon=calendar-01 [COMPONENT]: left 135, top 135, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=calendar-01 > calendar-01 [FRAME]: left 135, top 135, width 18, height 18
- Иконки кнопок > Icon=calendar-01 > calendar-01 > Vector [VECTOR]: left 141, top 136.5, width 6, height 3, signals: vector
- Иконки кнопок > Icon=calendar-01 > calendar-01 > Vector [VECTOR]: left 137.25, top 138, width 13.5, height 13.5, signals: vector
- Иконки кнопок > Icon=calendar-01 > calendar-01 > Vector [VECTOR]: left 137.25, top 142.5, width 13.5, height 0, signals: vector
- Иконки кнопок > Icon=calendar-01 > calendar-01 > Vector [VECTOR]: left 141.75, top 145.13, width 4.88, height 3.75, signals: vector
- Иконки кнопок > Icon=Icon23 [COMPONENT]: left 173, top 135, width 18, height 18, signals: top-level/component
- Иконки кнопок > Icon=Icon23 > ai-magic [FRAME]: left 173, top 135, width 18, height 18
- Иконки кнопок > Icon=Icon23 > ai-magic > Vector [VECTOR]: left 174.5, top 138, width 13.5, height 13.5, signals: vector
- Иконки кнопок > Icon=Icon23 > ai-magic > Vector [VECTOR]: left 185.75, top 136.5, width 3.75, height 3.75, signals: vector

## Pixel Perfect Template
You are rebuilding this Figma frame for an exact visual match. Treat the JSON as geometry/style data and the reference image/assets as visual evidence.

### Required Inputs
- JSON component structure below.
- If a whole-frame reference image is supplied separately, use it as the visual source of truth.
- Use every listed exported image file exactly; if any required asset is missing, stop and ask for it.

### Render Target
- Build one exact 250×174 frame.
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
- Build against one exact 250×174 viewport with `html, body { margin: 0; }` and global `box-sizing: border-box`.
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
Иконки кнопок (COMPONENT_SET, grid, hug×hug)
├── Icon=filter-horizontal (COMPONENT, fixed×fixed)
│   └── filter-horizontal (FRAME, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=arrow-up-down (COMPONENT, fixed×fixed)
│   └── arrow-up-down (FRAME, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=search-01 (COMPONENT, fixed×fixed)
│   └── search-01 (FRAME, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=delete-02 (COMPONENT, fixed×fixed)
│   └── delete-02 (FRAME, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=x (COMPONENT, fixed×fixed)
│   └── x (FRAME, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=arrow-left-01 (COMPONENT, fixed×fixed)
│   └── arrow-left-01 (FRAME, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=arrow-right-01 (COMPONENT, fixed×fixed)
│   └── arrow-right-01 (FRAME, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=arrow-up-01 (COMPONENT, fixed×fixed)
│   └── arrow-up-01 (FRAME, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=arrow-down-01 (COMPONENT, fixed×fixed)
│   └── arrow-down-01 (FRAME, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=plus (COMPONENT, fixed×fixed)
│   └── plus (FRAME, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=minus (COMPONENT, fixed×fixed)
│   └── minus (FRAME, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=copy (COMPONENT, fixed×fixed)
│   └── copy (FRAME, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=qr-code-01 (COMPONENT, fixed×fixed)
│   └── qr-code-01 (FRAME, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=lock-keyhole (COMPONENT, fixed×fixed)
│   └── lock-keyhole (FRAME, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=clock-04 (COMPONENT, fixed×fixed)
│   └── clock-04 (FRAME, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=telegram (COMPONENT, fixed×fixed)
│   └── telegram (FRAME, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=google (COMPONENT, fixed×fixed)
│   └── google (FRAME, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=eye-off (COMPONENT, fixed×fixed)
│   └── eye-off (FRAME, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=view (COMPONENT, fixed×fixed)
│   └── view (FRAME, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=at-sign (COMPONENT, fixed×fixed)
│   └── at-sign (FRAME, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=image-01 (COMPONENT, fixed×fixed)
│   └── image-01 (FRAME, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
├── Icon=calendar-01 (COMPONENT, fixed×fixed)
│   └── calendar-01 (FRAME, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       ├── Vector (VECTOR, fixed×fixed)
│       └── Vector (VECTOR, fixed×fixed)
└── Icon=Icon23 (COMPONENT, fixed×fixed)
    └── ai-magic (FRAME, fixed×fixed)
        ├── Vector (VECTOR, fixed×fixed)
        └── Vector (VECTOR, fixed×fixed)
```

## Component Structure
```
{"id":"297:5598","name":"Иконки кнопок","type":"COMPONENT_SET","layout":{"width":250,"height":174,"x":-58,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"overflow":"hidden","mode":"grid","padding":{"top":20,"right":20,"bottom":20,"left":20},"strokesIncludedInLayout":true,"gridRowCount":4,"gridColumnCount":6,"gridRowGap":20,"gridColumnGap":20,"gridRowSizes":[{"type":"hug","value":1},{"type":"hug","value":1},{"type":"hug","value":1},{"type":"hug","value":1}],"gridColumnSizes":[{"type":"fixed","value":18},{"type":"fixed","value":18},{"type":"fixed","value":18},{"type":"fixed","value":18},{"type":"fixed","value":18},{"type":"fixed","value":18}],"sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","borderRadius":5,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A38F5"}],"borderColor":"#8A38F5","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[10,5],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"children":[{"id":"297:5597","name":"Icon=filter-horizontal","type":"COMPONENT","layout":{"width":18,"height":18,"x":21,"y":21,"gridRowAnchorIndex":0,"gridColumnAnchorIndex":0,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"297:5692","name":"filter-horizontal","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":20,"y":20},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"297:5693","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":0}},{"id":"297:5694","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":0}},{"id":"297:5695","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":0}},{"id":"297:5696","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":0}},{"id":"297:5697","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}},{"id":"297:5698","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}}]}]},{"id":"297:5596","name":"Icon=arrow-up-down","type":"COMPONENT","layout":{"width":18,"height":18,"x":59,"y":21,"gridRowAnchorIndex":0,"gridColumnAnchorIndex":1,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"298:5700","name":"arrow-up-down","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":20,"y":20},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"298:5701","name":"Vector","type":"VECTOR","layout":{"width":0,"height":12}},{"id":"298:5702","name":"Vector","type":"VECTOR","layout":{"width":0,"height":11.25}},{"id":"298:5703","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":2.25}},{"id":"298:5704","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":2.25}}]}]},{"id":"298:6503","name":"Icon=search-01","type":"COMPONENT","layout":{"width":18,"height":18,"x":97,"y":21,"gridRowAnchorIndex":0,"gridColumnAnchorIndex":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"303:8786","name":"search-01","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"303:8787","name":"Vector","type":"VECTOR","layout":{"width":3,"height":3}},{"id":"303:8788","name":"Vector","type":"VECTOR","layout":{"width":12,"height":12}}]}]},{"id":"310:9146","name":"Icon=delete-02","type":"COMPONENT","layout":{"width":18,"height":18,"x":135,"y":21,"gridRowAnchorIndex":0,"gridColumnAnchorIndex":3,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"310:9153","name":"delete-02","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"310:9154","name":"Vector","type":"VECTOR","layout":{"width":11.25,"height":12.38}},{"id":"310:9155","name":"Vector","type":"VECTOR","layout":{"width":13.5,"height":2.63}},{"id":"310:9156","name":"Vector","type":"VECTOR","layout":{"width":0,"height":4.5}},{"id":"310:9157","name":"Vector","type":"VECTOR","layout":{"width":0,"height":4.5}}]}]},{"id":"310:9195","name":"Icon=x","type":"COMPONENT","layout":{"width":18,"height":18,"x":173,"y":21,"gridRowAnchorIndex":0,"gridColumnAnchorIndex":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"312:9202","name":"x","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"312:9203","name":"Vector","type":"VECTOR","layout":{"width":9,"height":9}}]}]},{"id":"312:9232","name":"Icon=arrow-left-01","type":"COMPONENT","layout":{"width":18,"height":18,"x":211,"y":21,"gridRowAnchorIndex":0,"gridColumnAnchorIndex":5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"312:9236","name":"arrow-left-01","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"312:9237","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":9}}]}]},{"id":"312:9238","name":"Icon=arrow-right-01","type":"COMPONENT","layout":{"width":18,"height":18,"x":21,"y":59,"gridRowAnchorIndex":1,"gridColumnAnchorIndex":0,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"312:9242","name":"arrow-right-01","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"312:9243","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":9}}]}]},{"id":"312:9244","name":"Icon=arrow-up-01","type":"COMPONENT","layout":{"width":18,"height":18,"x":59,"y":59,"gridRowAnchorIndex":1,"gridColumnAnchorIndex":1,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"312:9255","name":"arrow-up-01","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"312:9256","name":"Vector","type":"VECTOR","layout":{"width":9,"height":4.5}}]}]},{"id":"424:17641","name":"Icon=arrow-down-01","type":"COMPONENT","layout":{"width":18,"height":18,"x":97,"y":59,"gridRowAnchorIndex":1,"gridColumnAnchorIndex":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"424:17642","name":"arrow-down-01","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"424:17643","name":"Vector","type":"VECTOR","layout":{"width":9,"height":4.5}}]}]},{"id":"312:9251","name":"Icon=plus","type":"COMPONENT","layout":{"width":18,"height":18,"x":135,"y":59,"gridRowAnchorIndex":1,"gridColumnAnchorIndex":3,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"424:17645","name":"plus","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"424:17646","name":"Vector","type":"VECTOR","layout":{"width":12,"height":12}}]}]},{"id":"424:17637","name":"Icon=minus","type":"COMPONENT","layout":{"width":18,"height":18,"x":173,"y":59,"gridRowAnchorIndex":1,"gridColumnAnchorIndex":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"424:17647","name":"minus","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"424:17648","name":"Vector","type":"VECTOR","layout":{"width":13.5,"height":0}}]}]},{"id":"439:5314","name":"Icon=copy","type":"COMPONENT","layout":{"width":18,"height":18,"x":211,"y":59,"gridRowAnchorIndex":1,"gridColumnAnchorIndex":5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"439:5318","name":"copy","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"439:5319","name":"Vector","type":"VECTOR","layout":{"width":10.5,"height":12}},{"id":"439:5320","name":"Vector","type":"VECTOR","layout":{"width":10.5,"height":12}}]}]},{"id":"439:5332","name":"Icon=qr-code-01","type":"COMPONENT","layout":{"width":18,"height":18,"x":21,"y":97,"gridRowAnchorIndex":2,"gridColumnAnchorIndex":0,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"439:5337","name":"qr-code-01","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"439:5338","name":"Vector","type":"VECTOR","layout":{"width":3,"height":3}},{"id":"439:5339","name":"Vector","type":"VECTOR","layout":{"width":3,"height":3}},{"id":"439:5340","name":"Vector","type":"VECTOR","layout":{"width":3,"height":3}},{"id":"439:5341","name":"Vector","type":"VECTOR","layout":{"width":0.38,"height":0.38}},{"id":"439:5342","name":"Vector","type":"VECTOR","layout":{"width":3,"height":3}},{"id":"439:5343","name":"Vector","type":"VECTOR","layout":{"width":14.25,"height":14.25}}]}]},{"id":"447:7948","name":"Icon=lock-keyhole","type":"COMPONENT","layout":{"width":18,"height":18,"x":59,"y":97,"gridRowAnchorIndex":2,"gridColumnAnchorIndex":1,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"447:7957","name":"lock-keyhole","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"447:7958","name":"Vector","type":"VECTOR","layout":{"width":6.75,"height":5.25}},{"id":"447:7959","name":"Vector","type":"VECTOR","layout":{"width":12,"height":9.75}},{"id":"447:7960","name":"Vector","type":"VECTOR","layout":{"width":3,"height":3}}]}]},{"id":"456:7973","name":"Icon=clock-04","type":"COMPONENT","layout":{"width":18,"height":18,"x":97,"y":97,"gridRowAnchorIndex":2,"gridColumnAnchorIndex":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"456:7987","name":"clock-04","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"456:7988","name":"Vector","type":"VECTOR","layout":{"width":14.63,"height":15}},{"id":"456:7989","name":"Vector","type":"VECTOR","layout":{"width":1.5,"height":4.5}},{"id":"456:7990","name":"Vector","type":"VECTOR","layout":{"width":5.25,"height":7.5}}]}]},{"id":"521:10335","name":"Icon=telegram","type":"COMPONENT","layout":{"width":18,"height":18,"x":135,"y":97,"gridRowAnchorIndex":2,"gridColumnAnchorIndex":3,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"521:10340","name":"telegram","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"scale","vertical":"scale"},"overflow":"hidden","mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","visible":false,"color":"#FFFFFF"}]},"children":[{"id":"521:10341","name":"Vector","type":"VECTOR","layout":{"width":13.88,"height":11.5}}]}]},{"id":"521:10365","name":"Icon=google","type":"COMPONENT","layout":{"width":18,"height":18,"x":173,"y":97,"gridRowAnchorIndex":2,"gridColumnAnchorIndex":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"521:10368","name":"google","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"521:10381","name":"Vector","type":"VECTOR","layout":{"width":16,"height":16}}]}]},{"id":"523:11263","name":"Icon=eye-off","type":"COMPONENT","layout":{"width":18,"height":18,"x":211,"y":97,"gridRowAnchorIndex":2,"gridColumnAnchorIndex":5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"523:11268","name":"eye-off","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"523:11269","name":"Vector","type":"VECTOR","layout":{"width":11.63,"height":9.37}},{"id":"523:11270","name":"Vector","type":"VECTOR","layout":{"width":3.84,"height":3.84}},{"id":"523:11271","name":"Vector","type":"VECTOR","layout":{"width":15,"height":15}},{"id":"523:11272","name":"Vector","type":"VECTOR","layout":{"width":9,"height":7.5}}]}]},{"id":"523:11273","name":"Icon=view","type":"COMPONENT","layout":{"width":18,"height":18,"x":21,"y":135,"gridRowAnchorIndex":3,"gridColumnAnchorIndex":0,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"523:11280","name":"view","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"523:11281","name":"Vector","type":"VECTOR","layout":{"width":15,"height":10.5}},{"id":"523:11282","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}}]}]},{"id":"578:17451","name":"Icon=at-sign","type":"COMPONENT","layout":{"width":18,"height":18,"x":59,"y":135,"gridRowAnchorIndex":3,"gridColumnAnchorIndex":1,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"578:17459","name":"at-sign","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"578:17460","name":"Vector","type":"VECTOR","layout":{"width":6,"height":6}},{"id":"578:17461","name":"Vector","type":"VECTOR","layout":{"width":15,"height":15}}]}]},{"id":"584:17842","name":"Icon=image-01","type":"COMPONENT","layout":{"width":18,"height":18,"x":97,"y":135,"gridRowAnchorIndex":3,"gridColumnAnchorIndex":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17847","name":"image-01","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"584:17848","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":2.25}},{"id":"584:17849","name":"Vector","type":"VECTOR","layout":{"width":14.25,"height":14.25}},{"id":"584:17850","name":"Vector","type":"VECTOR","layout":{"width":12.37,"height":6.75}}]}]},{"id":"597:18942","name":"Icon=calendar-01","type":"COMPONENT","layout":{"width":18,"height":18,"x":135,"y":135,"gridRowAnchorIndex":3,"gridColumnAnchorIndex":3,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"597:18948","name":"calendar-01","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"597:18949","name":"Vector","type":"VECTOR","layout":{"width":6,"height":3}},{"id":"597:18950","name":"Vector","type":"VECTOR","layout":{"width":13.5,"height":13.5}},{"id":"597:18951","name":"Vector","type":"VECTOR","layout":{"width":13.5,"height":0}},{"id":"597:18952","name":"Vector","type":"VECTOR","layout":{"width":4.88,"height":3.75}}]}]},{"id":"879:6408","name":"Icon=Icon23","type":"COMPONENT","layout":{"width":18,"height":18,"x":173,"y":135,"gridRowAnchorIndex":3,"gridColumnAnchorIndex":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"879:6427","name":"ai-magic","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"879:6428","name":"Vector","type":"VECTOR","layout":{"width":13.5,"height":13.5}},{"id":"879:6429","name":"Vector","type":"VECTOR","layout":{"width":3.75,"height":3.75}}]}]}],"componentPropertyDefinitions":{"Icon":{"type":"VARIANT","defaultValue":"filter-horizontal","variantOptions":["arrow-up-down","filter-horizontal","search-01","delete-02","x","arrow-left-01","arrow-right-01","arrow-up-01","plus","minus","arrow-down-01","copy","qr-code-01","lock-keyhole","clock-04","telegram","google","eye-off","view","at-sign","image-01","calendar-01","Icon23"]}}}
```

## Capture Bundle Inputs (Authoritative)
- Keep this bundle intact. Resolve every path relative to the bundle root.
- Review `mcp/figma-locator.json` before calling a Figma MCP tool. Prefer each node's exact `locator.sourceUrl`; otherwise pass its `locator.fileKey` and colon-form `locator.nodeId` through the MCP tool's documented inputs.
- Locator data is for discovery or refresh only. An MCP re-capture creates a new immutable capture; it never replaces the evidence in this bundle.
- This capture has no Figma file key, so MCP cannot reopen its source; rely on the bundled evidence.
- Review `fidelity/coverage.json` before implementation. Every listed node must use its exact pixel fallback or an equivalent implementation proven by the final RGBA comparison.
- Use the reference renders below as the visual source of truth and iterate with screenshot comparison.
- Authoritative target: `references/001-297_5598.png` at exactly 250×174 CSS pixels. Do not infer the viewport from Figma's fractional geometry or another asset.
- Reference determinism gate passed: two consecutive Figma renders were RGBA-identical. If a later reference becomes unstable, stop exact verification until the changing content is frozen.
- Provide the final exact-size screenshot so the user can load it into Figma to Prompt's built-in `Verify AI screenshot` checker.
- Reference render: `references/001-297_5598.png`
- Match design assets by their manifest `nodeId`; bundled paths override any generated filename elsewhere in this prompt.
- Rendered fallbacks are Figma-authored precision assets. Use the PNG variant for the exact 1× target; use the outlined, unsimplified SVG variant when the node must scale. Preserve semantics or interactions with an accessible overlay when needed.
- Rendered fallback (pixel) for node `297:5598` (context-dependent-effect): `fallbacks/001-297_5598.png`
- Rendered fallback (vector) for node `297:5598` (context-dependent-effect): `fallbacks/001-297_5598.svg`

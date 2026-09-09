# Pixel-perfect Figma rebuild: Страница автора

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
- `#FFFFFF` (background), opacity: 0.4
- `#FFFFFF` (background), opacity: 0.4
- `#2A2A2A` (text)
- `#2A2A2A` (text)
- `#2A2A2A` (background)
- `#2A2A2A` (background)
- `#FFFFFF` (background), opacity: 0.8
- `#FFFFFF` (background), opacity: 0.8
- `#2A2A2A` (border)
- `#2A2A2A` (border)
- `#E2E2E2` (border)
- `#E2E2E2` (border)
- `#565656` (text)
- `#565656` (text)
- `#FFFFFF` (background), opacity: 0.6
- `#FFFFFF` (background), opacity: 0.6
### Typography
- Inter 600 24px, letter-spacing: -3%
- Inter 500 18px/24px, letter-spacing: -1%
- Inter 500 16px/23px, letter-spacing: -1%
- Inter 400 12px/14px, letter-spacing: -2%
### Spacing & Radii
- Spacing scale: 4px, 6px, 8px, 10px, 12px, 14px, 16px, 18px, 20px
- Border radii: 20px, 28px, 100px, 200px

## Interaction Contract
Implement these Figma prototype settings and reactions explicitly. Preserve scrolling, fixed layers, overlay behavior, trigger/action order, and transitions; do not infer a different behavior from appearance or node names.
- `Страница автора` (`526:14046`) prototype settings: `{"overflowDirection":"none","fixedChildIds":["526:14103"],"overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44` (`526:14049`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43` (`526:14050`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 60` (`526:14051`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 60 > Frame 47` (`526:14053`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 60 > Frame 47 > Frame 49` (`526:14055`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 65` (`526:14059`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 61` (`526:14060`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 61 > Frame 10` (`526:14061`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 61 > Frame 8` (`526:14063`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 61 > Frame 9` (`526:14065`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77` (`526:14067`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34` (`526:14068`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 35` (`526:14069`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 35 > telegram` (`526:14070`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 36` (`526:14072`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 36 > instagram` (`526:14073`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 37` (`526:14077`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 37 > vk` (`526:14078`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 38` (`526:14080`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 38 > internet` (`526:14081`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 62` (`526:14085`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 62 > Frame 39` (`526:14086`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 62 > Frame 39 > notification-02` (`526:14087`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 57` (`526:14091`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 57 > Frame 61` (`526:14092`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 57 > Frame 60` (`526:14096`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 57 > Frame 58` (`526:14100`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 34` (`526:14103`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 34 > Frame 35` (`526:14104`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 34 > Frame 35 > logo` (`526:14105`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 34 > Frame 39` (`526:14107`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 34 > Frame 39 > search-01` (`526:14108`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 34 > Frame 36` (`526:14111`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 34 > Frame 36 > plus` (`526:14112`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 34 > Frame 38` (`526:14114`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 34 > Frame 38 > shopping-basket-01` (`526:14115`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 34 > Frame 37` (`526:14118`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Страница автора > Frame 34 > Frame 37 > user` (`526:14119`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`

## Fidelity Risk Summary
- Estimated risk: high (76 visible nodes, max depth 8)
- Layout risks: 2 absolute-positioned auto-layout children, 1 clipped containers, 1 boxes extend outside the root viewport, 76 nodes with constraints, 16 nodes with target aspect ratio
- Asset risks: 2 image fills, 2 image fills with crop/filter/opacity metadata, 1 reused image hashes with distinct rendered variants, 20 vector-like nodes
- Paint risks: 4 blur effect nodes, 76 nodes with layer blend mode, 19 nodes with detailed stroke metadata

## Fidelity Warnings
These are extracted from the JSON and mark places where the convenience fields may not be enough.
- [critical] Страница автора > Rectangle 2: multiple-fills - 2 visible fills require the Figma-rendered fallback for exact paint order, clipping, and blend fidelity; style.fills remains implementation metadata.

## Geometry Checklist
Use these absolute boxes after normalizing the selected root to left 0, top 0. They are derived from `layout.x/y` and help catch drift before styling polish.
- Root `layout.x/y` is the Figma canvas position; do not offset the rendered component by it.
### Bounding Boxes
- Страница автора [FRAME]: left 0, top 0, width 390, height 860, signals: root/clips
- Страница автора > Rectangle 2 [RECTANGLE]: left -47, top -36, width 485, height 485, signals: top-level/image
- Страница автора > Vector [VECTOR]: left 174, top 60, width 42, height 32, signals: top-level/vector
- Страница автора > Frame 44 [FRAME]: left 0, top 132, width 390, height 288, signals: top-level
- Страница автора > Frame 44 > Frame 43 [FRAME]: left 0, top 132, width 390, height 288
- Страница автора > Frame 44 > Frame 43 > Frame 60 [FRAME]: left 12, top 132, width 366, height 175
- Страница автора > Frame 44 > Frame 43 > Frame 60 > Rectangle 2 [RECTANGLE]: left 139, top 132, width 112, height 112, signals: image
- Страница автора > Frame 44 > Frame 43 > Frame 60 > Frame 47 [FRAME]: left 12, top 250, width 366, height 57
- Страница автора > Frame 44 > Frame 43 > Frame 60 > Frame 47 > @vex [TEXT]: left 163.5, top 250, width 63, height 29
- Страница автора > Frame 44 > Frame 43 > Frame 60 > Frame 47 > Frame 49 [FRAME]: left 90.5, top 283, width 209, height 24
- Страница автора > Frame 44 > Frame 43 > Frame 60 > Frame 47 > Frame 49 > Илья Васильев [TEXT]: left 90.5, top 283, width 132, height 24
- Страница автора > Frame 44 > Frame 43 > Frame 60 > Frame 47 > Frame 49 > Rectangle 1 [RECTANGLE]: left 230.5, top 293, width 4, height 4
- Страница автора > Frame 44 > Frame 43 > Frame 60 > Frame 47 > Frame 49 > Минск [TEXT]: left 242.5, top 283, width 57, height 24
- Страница автора > Frame 44 > Frame 43 > Frame 65 [FRAME]: left 37, top 325, width 316, height 95
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 61 [FRAME]: left 37, top 325, width 316, height 35
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 61 > Frame 10 [FRAME]: left 37, top 325, width 111, height 35
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 61 > Frame 10 > Художник [TEXT]: left 53, top 331, width 79, height 23
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 61 > Frame 8 [FRAME]: left 158, top 325, width 101, height 35
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 61 > Frame 8 > Картины [TEXT]: left 174, top 331, width 69, height 23
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 61 > Frame 9 [FRAME]: left 269, top 325, width 84, height 35
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 61 > Frame 9 > Масло [TEXT]: left 285, top 331, width 52, height 23
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 [FRAME]: left 67, top 372, width 256, height 48
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 [FRAME]: left 67, top 372, width 196, height 48
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 35 [FRAME]: left 75, top 378, width 36, height 36
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 35 > telegram [FRAME]: left 79, top 382, width 28, height 28
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 35 > telegram > Vector [VECTOR]: left 80.26, top 385.5, width 23.33, height 21, signals: vector
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 36 [FRAME]: left 123, top 378, width 36, height 36
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 36 > instagram [FRAME]: left 127, top 382, width 28, height 28
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 36 > instagram > Vector [VECTOR]: left 130.5, top 385.5, width 21, height 21, signals: vector
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 36 > instagram > Vector [VECTOR]: left 136.33, top 391.33, width 9.33, height 9.33, signals: vector
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 36 > instagram > Vector [VECTOR]: left 146.83, top 389.58, width 0.58, height 0.58, signals: vector
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 37 [FRAME]: left 171, top 378, width 36, height 36
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 37 > vk [FRAME]: left 175, top 382, width 28, height 28
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 37 > vk > Vector [VECTOR]: left 176.5, top 388, width 24.61, height 16, signals: vector
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 38 [FRAME]: left 219, top 378, width 36, height 36
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 38 > internet [FRAME]: left 223, top 382, width 28, height 28
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 38 > internet > Vector [VECTOR]: left 225.33, top 384.33, width 23.33, height 23.33, signals: vector
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 38 > internet > Vector [VECTOR]: left 232.33, top 384.33, width 9.33, height 23.33, signals: vector
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 34 > Frame 38 > internet > Vector [VECTOR]: left 225.33, top 396, width 23.33, height 0, signals: vector
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 62 [FRAME]: left 275, top 372, width 48, height 48
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 62 > Frame 39 [FRAME]: left 281, top 378, width 36, height 36
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 62 > Frame 39 > notification-02 [FRAME]: left 285, top 382, width 28, height 28
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 62 > Frame 39 > notification-02 > Vector [VECTOR]: left 290.83, top 384.92, width 16.33, height 18.08, signals: vector
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 62 > Frame 39 > notification-02 > Vector [VECTOR]: left 289.08, top 403, width 19.83, height 0, signals: vector
- Страница автора > Frame 44 > Frame 43 > Frame 65 > Frame 77 > Frame 62 > Frame 39 > notification-02 > Vector [VECTOR]: left 297.25, top 405.33, width 3.5, height 1.75, signals: vector
- Страница автора > Frame 57 [FRAME]: left 0, top 490, width 390, height 26, signals: top-level
- Страница автора > Frame 57 > Frame 61 [FRAME]: left 75, top 490, width 78, height 25
- Страница автора > Frame 57 > Frame 61 > Работы [TEXT]: left 75, top 490, width 58, height 19
- Страница автора > Frame 57 > Frame 61 > 4 [TEXT]: left 137, top 490, width 16, height 18, positioning absolute, signals: absolute
- Страница автора > Frame 57 > Frame 61 > Rectangle 3 [RECTANGLE]: left 75, top 513, width 58, height 2
- Страница автора > Frame 57 > Frame 60 [FRAME]: left 161, top 490, width 67, height 25
- Страница автора > Frame 57 > Frame 60 > Архив [TEXT]: left 161, top 490, width 47, height 19
- Страница автора > Frame 57 > Frame 60 > 8 [TEXT]: left 212, top 490, width 16, height 18, positioning absolute, signals: absolute
- Страница автора > Frame 57 > Frame 60 > Rectangle 3 [RECTANGLE]: left 161, top 513, width 47, height 2
- Страница автора > Frame 57 > Frame 58 [FRAME]: left 236, top 490, width 79, height 25
- Страница автора > Frame 57 > Frame 58 > Об авторе [TEXT]: left 236, top 490, width 79, height 19
- Страница автора > Frame 57 > Frame 58 > Rectangle 3 [RECTANGLE]: left 236, top 513, width 79, height 2
- Страница автора > Frame 34 [FRAME]: left 51, top 760, width 288, height 64, signals: top-level
- Страница автора > Frame 34 > Frame 35 [FRAME]: left 65, top 774, width 36, height 36
- Страница автора > Frame 34 > Frame 35 > logo [FRAME]: left 71, top 780, width 24, height 24
- Страница автора > Frame 34 > Frame 35 > logo > Vector [VECTOR]: left 73, top 784, width 20, height 16, signals: vector
- Страница автора > Frame 34 > Frame 39 [FRAME]: left 121, top 774, width 36, height 36
- Страница автора > Frame 34 > Frame 39 > search-01 [FRAME]: left 127, top 780, width 24, height 24
- Страница автора > Frame 34 > Frame 39 > search-01 > Vector [VECTOR]: left 144, top 797, width 4, height 4, signals: vector
- Страница автора > Frame 34 > Frame 39 > search-01 > Vector [VECTOR]: left 130, top 783, width 16, height 16, signals: vector
- Страница автора > Frame 34 > Frame 36 [FRAME]: left 177, top 774, width 36, height 36
- Страница автора > Frame 34 > Frame 36 > plus [FRAME]: left 183, top 780, width 24, height 24
- Страница автора > Frame 34 > Frame 36 > plus > Vector [VECTOR]: left 186, top 783, width 18, height 18, signals: vector
- Страница автора > Frame 34 > Frame 38 [FRAME]: left 233, top 774, width 36, height 36
- Страница автора > Frame 34 > Frame 38 > shopping-basket-01 [FRAME]: left 239, top 780, width 24, height 24
- Страница автора > Frame 34 > Frame 38 > shopping-basket-01 > Vector [VECTOR]: left 243, top 787, width 16, height 15, signals: vector
- Страница автора > Frame 34 > Frame 38 > shopping-basket-01 > Vector [VECTOR]: left 247, top 782, width 8, height 7.5, signals: vector
- Страница автора > Frame 34 > Frame 37 [FRAME]: left 289, top 774, width 36, height 36
- Страница автора > Frame 34 > Frame 37 > user [FRAME]: left 295, top 780, width 24, height 24
- Страница автора > Frame 34 > Frame 37 > user > Vector [VECTOR]: left 299, top 794, width 16, height 7, signals: vector
- Страница автора > Frame 34 > Frame 37 > user > Vector [VECTOR]: left 303, top 783, width 8, height 8, signals: vector

## Assets
Image files included with this spec — use as `<img>` or CSS `background-image`:
- `Страница_автора_Rectangle_2.png` → Rectangle 2 (485×485, fill, scaling 0.5, transform [[1,0,0],[0,1,0]])
- `Frame_60_Rectangle_2.png` → Rectangle 2 (112×112, fill, scaling 0.5, transform [[1,0,0],[0,1,0]])

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
Страница автора (FRAME, fixed×fixed)
├── Rectangle 2 (RECTANGLE, fixed×fixed)
├── Vector (VECTOR, fixed×fixed)
├── Frame 44 (FRAME, vertical, fixed×hug)
│   └── Frame 43 (FRAME, vertical, fill×hug)
│       ├── Frame 60 (FRAME, vertical, fill×hug)
│       │   ├── Rectangle 2 (RECTANGLE, fixed×fixed)
│       │   └── Frame 47 (FRAME, vertical, fill×hug)
│       │       ├── @vex (TEXT, hug×hug) "@vex"
│       │       └── Frame 49 (FRAME, horizontal, hug×hug)
│       │           ├── Илья Васильев (TEXT, hug×hug) "Илья Васильев"
│       │           ├── Rectangle 1 (RECTANGLE, fixed×fixed)
│       │           └── Минск (TEXT, hug×hug) "Минск"
│       └── Frame 65 (FRAME, vertical, hug×hug)
│           ├── Frame 61 (FRAME, horizontal, hug×hug)
│           │   ├── Frame 10 (FRAME, horizontal, hug×hug)
│           │   │   └── Художник (TEXT, hug×hug) "Художник"
│           │   ├── Frame 8 (FRAME, horizontal, hug×hug)
│           │   │   └── Картины (TEXT, hug×hug) "Картины"
│           │   └── Frame 9 (FRAME, horizontal, hug×hug)
│           │       └── Масло (TEXT, hug×hug) "Масло"
│           └── Frame 77 (FRAME, horizontal, hug×hug)
│               ├── Frame 34 (FRAME, horizontal, hug×hug)
│               │   ├── Frame 35 (FRAME, horizontal, hug×hug)
│               │   │   └── telegram (FRAME, fixed×fixed)
│               │   │       └── Vector (VECTOR, fixed×fixed)
│               │   ├── Frame 36 (FRAME, horizontal, hug×hug)
│               │   │   └── instagram (FRAME, fixed×fixed)
│               │   │       ├── Vector (VECTOR, fixed×fixed)
│               │   │       ├── Vector (VECTOR, fixed×fixed)
│               │   │       └── Vector (VECTOR, fixed×fixed)
│               │   ├── Frame 37 (FRAME, horizontal, hug×hug)
│               │   │   └── vk (FRAME, fixed×fixed)
│               │   │       └── Vector (VECTOR, fixed×fixed)
│               │   └── Frame 38 (FRAME, horizontal, hug×hug)
│               │       └── internet (FRAME, fixed×fixed)
│               │           ├── Vector (VECTOR, fixed×fixed)
│               │           ├── Vector (VECTOR, fixed×fixed)
│               │           └── Vector (VECTOR, fixed×fixed)
│               └── Frame 62 (FRAME, horizontal, hug×hug)
│                   └── Frame 39 (FRAME, horizontal, hug×hug)
│                       └── notification-02 (FRAME, fixed×fixed)
│                           ├── Vector (VECTOR, fixed×fixed)
│                           ├── Vector (VECTOR, fixed×fixed)
│                           └── Vector (VECTOR, fixed×fixed)
├── Frame 57 (FRAME, horizontal, fixed×hug)
│   ├── Frame 61 (FRAME, vertical, hug×hug)
│   │   ├── Работы (TEXT, hug×hug) "Работы"
│   │   ├── 4 (TEXT, fixed×fixed) "4"
│   │   └── Rectangle 3 (RECTANGLE, fill×fixed)
│   ├── Frame 60 (FRAME, vertical, hug×hug)
│   │   ├── Архив (TEXT, hug×hug) "Архив"
│   │   ├── 8 (TEXT, fixed×fixed) "8"
│   │   └── Rectangle 3 (RECTANGLE, fill×fixed)
│   └── Frame 58 (FRAME, vertical, hug×hug)
│       ├── Об авторе (TEXT, hug×hug) "Об авторе"
│       └── Rectangle 3 (RECTANGLE, fill×fixed)
└── Frame 34 (FRAME, horizontal, hug×hug)
    ├── Frame 35 (FRAME, horizontal, hug×hug)
    │   └── logo (FRAME, fixed×fixed)
    │       └── Vector (VECTOR, fixed×fixed)
    ├── Frame 39 (FRAME, horizontal, hug×hug)
    │   └── search-01 (FRAME, fixed×fixed)
    │       ├── Vector (VECTOR, fixed×fixed)
    │       └── Vector (VECTOR, fixed×fixed)
    ├── Frame 36 (FRAME, horizontal, hug×hug)
    │   └── plus (FRAME, fixed×fixed)
    │       └── Vector (VECTOR, fixed×fixed)
    ├── Frame 38 (FRAME, horizontal, hug×hug)
    │   └── shopping-basket-01 (FRAME, fixed×fixed)
    │       ├── Vector (VECTOR, fixed×fixed)
    │       └── Vector (VECTOR, fixed×fixed)
    └── Frame 37 (FRAME, horizontal, hug×hug)
        └── user (FRAME, fixed×fixed)
            ├── Vector (VECTOR, fixed×fixed)
            └── Vector (VECTOR, fixed×fixed)
```

## Component Structure
```
{"id":"526:14046","name":"Страница автора","type":"FRAME","layout":{"width":390,"height":860,"x":449,"y":3816,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"overflow":"hidden","mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"},"children":[{"id":"526:14047","name":"Rectangle 2","type":"RECTANGLE","layout":{"width":485,"height":485,"x":-47,"y":-36,"layoutAlign":"inherit","constraints":{"horizontal":"center","vertical":"min"},"targetAspectRatio":{"x":84,"y":84},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"image","sourceType":"IMAGE","imageHash":"21a9484e82f96df573f74fd117336c89e85c974a","scaleMode":"fill","transform":[[1,0,0],[0,1,0]],"scalingFactor":0.5},{"type":"solid","sourceType":"SOLID","opacity":0.4,"color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","backgroundOpacity":0.4,"opacity":0.5,"cornerRadii":{"topLeft":0,"topRight":0,"bottomRight":200,"bottomLeft":200},"blurEffects":[{"type":"layer","radius":80,"blurType":"normal"}],"imageFillHash":"21a9484e82f96df573f74fd117336c89e85c974a","imageFillScaleMode":"fill","imageFillTransform":[[1,0,0],[0,1,0]],"imageFillScalingFactor":0.5},"fidelityWarnings":[{"code":"multiple-fills","severity":"critical","message":"2 visible fills require the Figma-rendered fallback for exact paint order, clipping, and blend fidelity; style.fills remains implementation metadata."}]},{"id":"526:14048","name":"Vector","type":"VECTOR","layout":{"width":42,"height":32}},{"id":"526:14049","name":"Frame 44","type":"FRAME","layout":{"width":390,"height":288,"y":132,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":20,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14050","name":"Frame 43","type":"FRAME","layout":{"width":390,"height":288,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":18,"strokesIncludedInLayout":true,"padding":{"top":0,"right":12,"bottom":0,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14051","name":"Frame 60","type":"FRAME","layout":{"width":366,"height":175,"x":12,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":6,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14052","name":"Rectangle 2","type":"RECTANGLE","layout":{"width":112,"height":112,"x":127,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":84,"y":84},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"image","sourceType":"IMAGE","imageHash":"21a9484e82f96df573f74fd117336c89e85c974a","scaleMode":"fill","transform":[[1,0,0],[0,1,0]],"scalingFactor":0.5}],"borderRadius":100,"imageFillHash":"21a9484e82f96df573f74fd117336c89e85c974a","imageFillScaleMode":"fill","imageFillTransform":[[1,0,0],[0,1,0]],"imageFillScalingFactor":0.5}},{"id":"526:14053","name":"Frame 47","type":"FRAME","layout":{"width":366,"height":57,"y":118,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":4,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14054","name":"@vex","type":"TEXT","text":"@vex","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Semi Bold","fontSize":24,"fontWeight":600,"letterSpacing":-3,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":63,"height":29,"x":151.5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}},{"id":"526:14055","name":"Frame 49","type":"FRAME","layout":{"width":209,"height":24,"x":78.5,"y":33,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14056","name":"Илья Васильев","type":"TEXT","text":"Илья Васильев","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":18,"fontWeight":500,"lineHeight":24,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":132,"height":24,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}},{"id":"526:14057","name":"Rectangle 1","type":"RECTANGLE","layout":{"width":4,"height":4,"x":140,"y":10,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"backgroundColor":"#2A2A2A","borderRadius":20}},{"id":"526:14058","name":"Минск","type":"TEXT","text":"Минск","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":18,"fontWeight":500,"lineHeight":24,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":57,"height":24,"x":152,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}]},{"id":"526:14059","name":"Frame 65","type":"FRAME","layout":{"width":316,"height":95,"x":37,"y":193,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14060","name":"Frame 61","type":"FRAME","layout":{"width":316,"height":35,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"wrap":"wrap","counterAxisSpacing":10,"counterAxisAlignContent":"auto","strokesIncludedInLayout":true,"primaryAxisAlign":"center","counterAxisAlign":"min","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14061","name":"Frame 10","type":"FRAME","layout":{"width":111,"height":35,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":6,"right":16,"bottom":6,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.8,"color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","backgroundOpacity":0.8,"strokeStyleName":"White border block","borderRadius":28,"strokes":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","gradientType":"linear","css":"linear-gradient(#DEDEDE 0%, #F3F3F3 100%)","gradientStops":[{"color":"#DEDEDE","position":0},{"color":"#F3F3F3","position":1}],"transform":[[0.89,0.11,0],[-0.11,0.11,0.5]]}]},"children":[{"id":"526:14062","name":"Художник","type":"TEXT","text":"Художник","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":23,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":79,"height":23,"x":16,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"526:14063","name":"Frame 8","type":"FRAME","layout":{"width":101,"height":35,"x":121,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":6,"right":16,"bottom":6,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.8,"color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","backgroundOpacity":0.8,"strokeStyleName":"White border block","borderRadius":28,"strokes":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","gradientType":"linear","css":"linear-gradient(#DEDEDE 0%, #F3F3F3 100%)","gradientStops":[{"color":"#DEDEDE","position":0},{"color":"#F3F3F3","position":1}],"transform":[[0.89,0.11,0],[-0.11,0.11,0.5]]}]},"children":[{"id":"526:14064","name":"Картины","type":"TEXT","text":"Картины","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":23,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":69,"height":23,"x":16,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"526:14065","name":"Frame 9","type":"FRAME","layout":{"width":84,"height":35,"x":232,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":6,"right":16,"bottom":6,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.8,"color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","backgroundOpacity":0.8,"strokeStyleName":"White border block","borderRadius":28,"strokes":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","gradientType":"linear","css":"linear-gradient(#DEDEDE 0%, #F3F3F3 100%)","gradientStops":[{"color":"#DEDEDE","position":0},{"color":"#F3F3F3","position":1}],"transform":[[0.89,0.11,0],[-0.11,0.11,0.5]]}]},"children":[{"id":"526:14066","name":"Масло","type":"TEXT","text":"Масло","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":23,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":52,"height":23,"x":16,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]},{"id":"526:14067","name":"Frame 77","type":"FRAME","layout":{"width":256,"height":48,"x":30,"y":47,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14068","name":"Frame 34","type":"FRAME","layout":{"width":196,"height":48,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":12,"strokesIncludedInLayout":true,"padding":{"top":6,"right":8,"bottom":6,"left":8},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.8,"color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","backgroundOpacity":0.8,"strokeStyleName":"White border block","borderRadius":200,"strokes":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","gradientType":"linear","css":"linear-gradient(#DEDEDE 0%, #F3F3F3 100%)","gradientStops":[{"color":"#DEDEDE","position":0},{"color":"#F3F3F3","position":1}],"transform":[[0.89,0.11,0],[-0.11,0.11,0.5]]}],"blurEffects":[{"type":"background","radius":12,"blurType":"normal"}]},"children":[{"id":"526:14069","name":"Frame 35","type":"FRAME","layout":{"width":36,"height":36,"x":8,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":4,"bottom":4,"left":4},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14070","name":"telegram","type":"FRAME","layout":{"width":28,"height":28,"x":4,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":16,"y":16},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14071","name":"Vector","type":"VECTOR","layout":{"width":23.33,"height":21}}]}]},{"id":"526:14072","name":"Frame 36","type":"FRAME","layout":{"width":36,"height":36,"x":56,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":4,"bottom":4,"left":4},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14073","name":"instagram","type":"FRAME","layout":{"width":28,"height":28,"x":4,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":16,"y":16},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14074","name":"Vector","type":"VECTOR","layout":{"width":21,"height":21}},{"id":"526:14075","name":"Vector","type":"VECTOR","layout":{"width":9.33,"height":9.33}},{"id":"526:14076","name":"Vector","type":"VECTOR","layout":{"width":0.58,"height":0.58}}]}]},{"id":"526:14077","name":"Frame 37","type":"FRAME","layout":{"width":36,"height":36,"x":104,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":4,"bottom":4,"left":4},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14078","name":"vk","type":"FRAME","layout":{"width":28,"height":28,"x":4,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":16,"y":16},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14079","name":"Vector","type":"VECTOR","layout":{"width":24.61,"height":16}}]}]},{"id":"526:14080","name":"Frame 38","type":"FRAME","layout":{"width":36,"height":36,"x":152,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":4,"bottom":4,"left":4},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14081","name":"internet","type":"FRAME","layout":{"width":28,"height":28,"x":4,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":16,"y":16},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14082","name":"Vector","type":"VECTOR","layout":{"width":23.33,"height":23.33}},{"id":"526:14083","name":"Vector","type":"VECTOR","layout":{"width":9.33,"height":23.33}},{"id":"526:14084","name":"Vector","type":"VECTOR","layout":{"width":23.33,"height":0}}]}]}]},{"id":"526:14085","name":"Frame 62","type":"FRAME","layout":{"width":48,"height":48,"x":208,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":12,"strokesIncludedInLayout":true,"padding":{"top":6,"right":6,"bottom":6,"left":6},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.8,"color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","backgroundOpacity":0.8,"strokeStyleName":"White border block","borderRadius":200,"strokes":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","gradientType":"linear","css":"linear-gradient(#DEDEDE 0%, #F3F3F3 100%)","gradientStops":[{"color":"#DEDEDE","position":0},{"color":"#F3F3F3","position":1}],"transform":[[0.89,0.11,0],[-0.11,0.11,0.5]]}],"blurEffects":[{"type":"background","radius":12,"blurType":"normal"}]},"children":[{"id":"526:14086","name":"Frame 39","type":"FRAME","layout":{"width":36,"height":36,"x":6,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":4,"bottom":4,"left":4},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14087","name":"notification-02","type":"FRAME","layout":{"width":28,"height":28,"x":4,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":28,"y":28},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14088","name":"Vector","type":"VECTOR","layout":{"width":16.33,"height":18.08}},{"id":"526:14089","name":"Vector","type":"VECTOR","layout":{"width":19.83,"height":0}},{"id":"526:14090","name":"Vector","type":"VECTOR","layout":{"width":3.5,"height":1.75}}]}]}]}]}]}]}]},{"id":"526:14091","name":"Frame 57","type":"FRAME","layout":{"width":390,"height":26,"y":490,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","strokes":[{"type":"solid","sourceType":"SOLID","color":"#E2E2E2"}],"borderColor":"#E2E2E2","strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":0,"right":0,"bottom":1,"left":0}},"children":[{"id":"526:14092","name":"Frame 61","type":"FRAME","layout":{"width":78,"height":25,"x":75,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":4,"strokesIncludedInLayout":true,"padding":{"top":0,"right":20,"bottom":0,"left":0},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14093","name":"Работы","type":"TEXT","text":"Работы","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":58,"height":19,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}},{"id":"526:14094","name":"4","type":"TEXT","text":"4","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Regular","fontSize":12,"fontWeight":400,"lineHeight":14,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"none","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":16,"height":18,"x":62,"layoutPositioning":"absolute","layoutAlign":"inherit","constraints":{"horizontal":"max","vertical":"min"},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}}},{"id":"526:14095","name":"Rectangle 3","type":"RECTANGLE","layout":{"width":58,"height":2,"y":23,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"}}]},{"id":"526:14096","name":"Frame 60","type":"FRAME","layout":{"width":67,"height":25,"x":161,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":4,"strokesIncludedInLayout":true,"padding":{"top":0,"right":20,"bottom":0,"left":0},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14097","name":"Архив","type":"TEXT","text":"Архив","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":47,"height":19,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}},{"id":"526:14098","name":"8","type":"TEXT","text":"8","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Regular","fontSize":12,"fontWeight":400,"lineHeight":14,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"none","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":16,"height":18,"x":51,"layoutPositioning":"absolute","layoutAlign":"inherit","constraints":{"horizontal":"max","vertical":"min"},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}}},{"id":"526:14099","name":"Rectangle 3","type":"RECTANGLE","layout":{"width":47,"height":2,"y":23,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"}}]},{"id":"526:14100","name":"Frame 58","type":"FRAME","layout":{"width":79,"height":25,"x":236,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":4,"strokesIncludedInLayout":true,"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14101","name":"Об авторе","type":"TEXT","text":"Об авторе","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":79,"height":19,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}},{"id":"526:14102","name":"Rectangle 3","type":"RECTANGLE","layout":{"width":79,"height":2,"y":23,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"backgroundColor":"#2A2A2A"}}]}]},{"id":"526:14103","name":"Frame 34","type":"FRAME","layout":{"width":288,"height":64,"x":51,"y":760,"layoutAlign":"inherit","constraints":{"horizontal":"center","vertical":"min"},"mode":"horizontal","gap":20,"strokesIncludedInLayout":true,"padding":{"top":14,"right":14,"bottom":14,"left":14},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.6,"color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","backgroundOpacity":0.6,"strokeStyleName":"White border block","borderRadius":200,"strokes":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","gradientType":"linear","css":"linear-gradient(#DEDEDE 0%, #F3F3F3 100%)","gradientStops":[{"color":"#DEDEDE","position":0},{"color":"#F3F3F3","position":1}],"transform":[[0.89,0.11,0],[-0.11,0.11,0.5]]}],"blurEffects":[{"type":"background","radius":12,"blurType":"normal"}]},"children":[{"id":"526:14104","name":"Frame 35","type":"FRAME","layout":{"width":36,"height":36,"x":14,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":6,"right":6,"bottom":6,"left":6},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14105","name":"logo","type":"FRAME","layout":{"width":24,"height":24,"x":6,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14106","name":"Vector","type":"VECTOR","layout":{"width":20,"height":16}}]}]},{"id":"526:14107","name":"Frame 39","type":"FRAME","layout":{"width":36,"height":36,"x":70,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":6,"right":6,"bottom":6,"left":6},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14108","name":"search-01","type":"FRAME","layout":{"width":24,"height":24,"x":6,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14109","name":"Vector","type":"VECTOR","layout":{"width":4,"height":4}},{"id":"526:14110","name":"Vector","type":"VECTOR","layout":{"width":16,"height":16}}]}]},{"id":"526:14111","name":"Frame 36","type":"FRAME","layout":{"width":36,"height":36,"x":126,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":6,"right":6,"bottom":6,"left":6},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14112","name":"plus","type":"FRAME","layout":{"width":24,"height":24,"x":6,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14113","name":"Vector","type":"VECTOR","layout":{"width":18,"height":18}}]}]},{"id":"526:14114","name":"Frame 38","type":"FRAME","layout":{"width":36,"height":36,"x":182,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":6,"right":6,"bottom":6,"left":6},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14115","name":"shopping-basket-01","type":"FRAME","layout":{"width":24,"height":24,"x":6,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14116","name":"Vector","type":"VECTOR","layout":{"width":16,"height":15}},{"id":"526:14117","name":"Vector","type":"VECTOR","layout":{"width":8,"height":7.5}}]}]},{"id":"526:14118","name":"Frame 37","type":"FRAME","layout":{"width":36,"height":36,"x":238,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":6,"right":6,"bottom":6,"left":6},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14119","name":"user","type":"FRAME","layout":{"width":24,"height":24,"x":6,"y":6,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"526:14120","name":"Vector","type":"VECTOR","layout":{"width":16,"height":7}},{"id":"526:14121","name":"Vector","type":"VECTOR","layout":{"width":8,"height":8}}]}]}]}],"prototype":{"overflowDirection":"none","fixedChildIds":["526:14103"],"overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}}
```

## Capture Bundle Inputs (Authoritative)
- Keep this bundle intact. Resolve every path relative to the bundle root.
- Review `mcp/figma-locator.json` before calling a Figma MCP tool. Prefer each node's exact `locator.sourceUrl`; otherwise pass its `locator.fileKey` and colon-form `locator.nodeId` through the MCP tool's documented inputs.
- Locator data is for discovery or refresh only. An MCP re-capture creates a new immutable capture; it never replaces the evidence in this bundle.
- This capture has no Figma file key, so MCP cannot reopen its source; rely on the bundled evidence.
- Review `fidelity/coverage.json` before implementation. Every listed node must use its exact pixel fallback or an equivalent implementation proven by the final RGBA comparison.
- Use the reference renders below as the visual source of truth and iterate with screenshot comparison.
- Authoritative target: `references/001-526_14046.png` at exactly 390×860 CSS pixels. Do not infer the viewport from Figma's fractional geometry or another asset.
- Reference determinism gate passed: two consecutive Figma renders were RGBA-identical. If a later reference becomes unstable, stop exact verification until the changing content is frozen.
- Provide the final exact-size screenshot so the user can load it into Figma to Prompt's built-in `Verify AI screenshot` checker.
- Reference render: `references/001-526_14046.png`
- Match design assets by their manifest `nodeId`; bundled paths override any generated filename elsewhere in this prompt.
- Design asset for node `526:14047`: `assets/001-526_14047.png`
- Design asset for node `526:14052`: `assets/002-526_14052.png`
- Rendered fallbacks are Figma-authored precision assets. Use the PNG variant for the exact 1× target; use the outlined, unsimplified SVG variant when the node must scale. Preserve semantics or interactions with an accessible overlay when needed.
- Rendered fallback (pixel) for node `526:14046` (context-dependent-effect): `fallbacks/001-526_14046.png`
- Rendered fallback (vector) for node `526:14046` (context-dependent-effect): `fallbacks/001-526_14046.svg`

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
- `#292929` (background)
- `#292929` (background)
- `#FFFFFF` (text)
- `#FFFFFF` (text)
### Typography
- Inter 600 24px, letter-spacing: -2%
- Inter 400 14px/20px
- Inter 400 16px/24px
- Inter 500 16px/26px, letter-spacing: -2%
### Spacing & Radii
- Spacing scale: 2px, 4px, 8px, 10px, 12px, 13px, 16px, 24px, 40px
- Border radii: 18px, 20px, 80px

## Interaction Contract
Implement these Figma prototype settings and reactions explicitly. Preserve scrolling, fixed layers, overlay behavior, trigger/action order, and transitions; do not infer a different behavior from appearance or node names.
- `Стать автором заполнение профиля` (`746:22642`) prototype settings: `{"overflowDirection":"none","fixedChildIds":["746:22681"],"overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219` (`746:22823`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219 > Frame 139` (`746:22643`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 218` (`746:22805`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 218 > arrow-left-02` (`746:22806`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 218 > Frame 151` (`746:22809`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 218 > x` (`746:22814`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 121` (`746:22647`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 121 > Frame 122` (`746:22648`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219 > Frame 206` (`746:22671`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода` (`746:22675`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Иконка левая` (`I746:22675;303:8697`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Иконка левая > Иконки кнопок` (`I746:22675;303:8698`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Иконка левая > Иконки кнопок > at-sign` (`I746:22675;303:8698;578:17459`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода` (`746:22676`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Иконка левая` (`I746:22676;303:8697`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Иконка левая > Иконки кнопок` (`I746:22676;303:8698`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Иконка левая > Иконки кнопок > at-sign` (`I746:22676;303:8698;578:17459`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода` (`746:22677`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода` (`746:22678`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219 > Frame 206 > Frame 190` (`746:22817`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Стать автором заполнение профиля > Frame 219 > Frame 206 > Frame 190 > Кнопки` (`746:22818`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`

## Component API Contract
Use the documented component properties as the public API. Preserve typed defaults, variants, and active values instead of coercing them from labels.
### Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода (`746:22675`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Иконка левая > Иконки кнопок (`I746:22675;303:8698`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"at-sign"}}`
### Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода (`746:22676`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Иконка левая > Иконки кнопок (`I746:22676;303:8698`)
- Active property values: `{"Icon":{"type":"VARIANT","value":"at-sign"}}`
### Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода (`746:22677`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода (`746:22678`)
- Active property values: `{"Property 1":{"type":"VARIANT","value":"Обычный"}}`
### Стать автором заполнение профиля > Frame 219 > Frame 206 > Frame 190 > Кнопки (`746:22818`)
- Active property values: `{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5597"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}}`

## Fidelity Risk Summary
- Estimated risk: medium (41 visible nodes, max depth 7)
- Layout risks: 1 clipped containers, 41 nodes with constraints, 10 nodes with target aspect ratio
- Asset risks: 1 image fills, 1 image fills with crop/filter/opacity metadata, 8 vector-like nodes
- Paint risks: 41 nodes with layer blend mode, 12 nodes with detailed stroke metadata

## Geometry Checklist
Use these absolute boxes after normalizing the selected root to left 0, top 0. They are derived from `layout.x/y` and help catch drift before styling polish.
- Root `layout.x/y` is the Figma canvas position; do not offset the rendered component by it.
### Bounding Boxes
- Стать автором заполнение профиля [FRAME]: left 0, top 0, width 390, height 641, signals: root/clips
- Стать автором заполнение профиля > Frame 219 [FRAME]: left 12, top 84, width 366, height 473, signals: top-level
- Стать автором заполнение профиля > Frame 219 > Frame 139 [FRAME]: left 12, top 84, width 366, height 129
- Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 218 [FRAME]: left 12, top 84, width 366, height 28
- Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 218 > arrow-left-02 [FRAME]: left 12, top 84, width 28, height 28
- Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 218 > arrow-left-02 > Vector [VECTOR]: left 18.42, top 98, width 15.75, height 0, signals: vector
- Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 218 > arrow-left-02 > Vector [VECTOR]: left 17.83, top 91, width 7, height 14, signals: vector
- Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 218 > Frame 151 [FRAME]: left 64, top 95, width 262, height 6
- Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 218 > Frame 151 > Rectangle 3 [RECTANGLE]: left 171, top 95, width 6, height 6
- Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 218 > Frame 151 > Rectangle 2 [RECTANGLE]: left 185, top 95, width 6, height 6
- Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 218 > Frame 151 > Rectangle 4 [RECTANGLE]: left 199, top 95, width 6, height 6
- Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 218 > Frame 151 > Rectangle 5 [RECTANGLE]: left 213, top 95, width 6, height 6
- Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 218 > x [FRAME]: left 350, top 84, width 28, height 28
- Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 218 > x > Vector [VECTOR]: left 357, top 91, width 14, height 14, signals: vector
- Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 121 [FRAME]: left 12, top 136, width 366, height 77
- Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 121 > Frame 122 [FRAME]: left 12, top 136, width 366, height 77
- Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 121 > Frame 122 > Контакты [TEXT]: left 12, top 136, width 366, height 29
- Стать автором заполнение профиля > Frame 219 > Frame 139 > Frame 121 > Frame 122 > Эти данные будут видны на странице профиля и для покупателя [TEXT]: left 12, top 173, width 366, height 40
- Стать автором заполнение профиля > Frame 219 > Frame 206 [FRAME]: left 12, top 253, width 366, height 304
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода [INSTANCE]: left 12, top 253, width 366, height 52, signals: component
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Иконка левая [FRAME]: left 25, top 267, width 22, height 22
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Иконка левая > Иконки кнопок [INSTANCE]: left 27, top 269, width 18, height 18, signals: component
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Иконка левая > Иконки кнопок > at-sign [FRAME]: left 27, top 269, width 18, height 18
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Иконка левая > Иконки кнопок > at-sign > Vector [VECTOR]: left 33, top 275, width 6, height 6, signals: vector
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Иконка левая > Иконки кнопок > at-sign > Vector [VECTOR]: left 28.5, top 270.5, width 15, height 15, signals: vector
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Обычный [TEXT]: left 51, top 267, width 76, height 24
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода [INSTANCE]: left 12, top 317, width 366, height 52, signals: component
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Иконка левая [FRAME]: left 25, top 331, width 22, height 22
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Иконка левая > Иконки кнопок [INSTANCE]: left 27, top 333, width 18, height 18, signals: component
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Иконка левая > Иконки кнопок > at-sign [FRAME]: left 27, top 333, width 18, height 18
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Иконка левая > Иконки кнопок > at-sign > Vector [VECTOR]: left 33, top 339, width 6, height 6, signals: vector
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Иконка левая > Иконки кнопок > at-sign > Vector [VECTOR]: left 28.5, top 334.5, width 15, height 15, signals: vector
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Обычный [TEXT]: left 51, top 331, width 71, height 24
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода [INSTANCE]: left 12, top 381, width 366, height 52, signals: component
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Обычный [TEXT]: left 25, top 395, width 72, height 24
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода [INSTANCE]: left 12, top 445, width 366, height 52, signals: component
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Поля ввода > Обычный [TEXT]: left 25, top 459, width 47, height 24
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Frame 190 [FRAME]: left 12, top 509, width 366, height 48
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Frame 190 > Кнопки [INSTANCE]: left 12, top 509, width 366, height 48, signals: component
- Стать автором заполнение профиля > Frame 219 > Frame 206 > Frame 190 > Кнопки > Кнопка [TEXT]: left 145.5, top 520, width 99, height 26
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
- Build one exact 390×641 frame.
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
- Build against one exact 390×641 viewport with `html, body { margin: 0; }` and global `box-sizing: border-box`.
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
│   │           ├── Контакты (TEXT, fill×hug) "Контакты"
│   │           └── Эти данные будут видны на странице профиля и для покупателя (TEXT, fill×hug) "Эти данные будут видны на странице профи…"
│   └── Frame 206 (FRAME, vertical, fill×hug)
│       ├── Поля ввода (INSTANCE, horizontal, fill×hug)
│       │   ├── Иконка левая (FRAME, horizontal, hug×hug)
│       │   │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│       │   │       └── at-sign (FRAME, fixed×fixed)
│       │   │           ├── Vector (VECTOR, fixed×fixed)
│       │   │           └── Vector (VECTOR, fixed×fixed)
│       │   └── Обычный (TEXT, hug×hug) "Instagram"
│       ├── Поля ввода (INSTANCE, horizontal, fill×hug)
│       │   ├── Иконка левая (FRAME, horizontal, hug×hug)
│       │   │   └── Иконки кнопок (INSTANCE, fixed×fixed)
│       │   │       └── at-sign (FRAME, fixed×fixed)
│       │   │           ├── Vector (VECTOR, fixed×fixed)
│       │   │           └── Vector (VECTOR, fixed×fixed)
│       │   └── Обычный (TEXT, hug×hug) "Telegram"
│       ├── Поля ввода (INSTANCE, horizontal, fill×hug)
│       │   └── Обычный (TEXT, hug×hug) "Веб-сайт"
│       ├── Поля ввода (INSTANCE, horizontal, fill×hug)
│       │   └── Обычный (TEXT, hug×hug) "Почта"
│       └── Frame 190 (FRAME, vertical, fixed×hug)
│           └── Кнопки (INSTANCE, horizontal, fill×hug)
│               └── Кнопка (TEXT, hug×hug) "Продолжить"
└── Change-This (VECTOR, fixed×fixed)
```

## Component Structure
```
{"id":"746:22642","name":"Стать автором заполнение профиля","type":"FRAME","layout":{"width":390,"height":641,"x":1071,"y":108,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"overflow":"hidden","mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF"},"children":[{"id":"746:22823","name":"Frame 219","type":"FRAME","layout":{"width":366,"height":473,"x":12,"y":84,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":40,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:22643","name":"Frame 139","type":"FRAME","layout":{"width":366,"height":129,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":24,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:22805","name":"Frame 218","type":"FRAME","layout":{"width":366,"height":28,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":24,"strokesIncludedInLayout":true,"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:22806","name":"arrow-left-02","type":"FRAME","layout":{"width":28,"height":28,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":24,"y":24},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:22807","name":"Vector","type":"VECTOR","layout":{"width":15.75,"height":0}},{"id":"746:22808","name":"Vector","type":"VECTOR","layout":{"width":7,"height":14}}]},{"id":"746:22809","name":"Frame 151","type":"FRAME","layout":{"width":262,"height":6,"x":52,"y":11,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"center","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:22811","name":"Rectangle 3","type":"RECTANGLE","layout":{"width":6,"height":6,"x":107,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}},{"id":"746:22810","name":"Rectangle 2","type":"RECTANGLE","layout":{"width":6,"height":6,"x":121,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"backgroundColor":"#2A2A2A","borderRadius":20}},{"id":"746:22812","name":"Rectangle 4","type":"RECTANGLE","layout":{"width":6,"height":6,"x":135,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}},{"id":"746:22813","name":"Rectangle 5","type":"RECTANGLE","layout":{"width":6,"height":6,"x":149,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#DEDEDE"}],"backgroundColor":"#DEDEDE","borderRadius":20}}]},{"id":"746:22814","name":"x","type":"FRAME","layout":{"width":28,"height":28,"x":338,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":12,"y":12},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:22815","name":"Vector","type":"VECTOR","layout":{"width":14,"height":14}}]}]},{"id":"746:22647","name":"Frame 121","type":"FRAME","layout":{"width":366,"height":77,"y":52,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:22648","name":"Frame 122","type":"FRAME","layout":{"width":366,"height":77,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":8,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:22649","name":"Контакты","type":"TEXT","text":"Контакты","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Inter","fontStyleName":"Semi Bold","fontSize":24,"fontWeight":600,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":366,"height":29,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}},{"id":"746:22714","name":"Эти данные будут видны на странице профиля и для покупателя","type":"TEXT","text":"Эти данные будут видны на странице профиля и для покупателя","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#565656"}],"color":"#565656","fontFamily":"Inter","fontStyleName":"Regular","fontSize":14,"fontWeight":400,"lineHeight":20,"textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":366,"height":40,"y":37,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]}]}]},{"id":"746:22671","name":"Frame 206","type":"FRAME","layout":{"width":366,"height":304,"y":169,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:22675","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I746:22675;303:8697","name":"Иконка левая","type":"FRAME","layout":{"width":22,"height":22,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I746:22675;303:8698","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"at-sign"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"at-sign"}},"children":[{"id":"I746:22675;303:8698;578:17459","name":"at-sign","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I746:22675;303:8698;578:17460","name":"Vector","type":"VECTOR","layout":{"width":6,"height":6}},{"id":"I746:22675;303:8698;578:17461","name":"Vector","type":"VECTOR","layout":{"width":15,"height":15}}]}]}]},{"id":"I746:22675;285:4864","name":"Обычный","type":"TEXT","text":"Instagram","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":76,"height":24,"x":39,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"746:22676","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"y":64,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I746:22676;303:8697","name":"Иконка левая","type":"FRAME","layout":{"width":22,"height":22,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":2,"right":2,"bottom":2,"left":2},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I746:22676;303:8698","name":"Иконки кнопок","type":"INSTANCE","layout":{"width":18,"height":18,"x":2,"y":2,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"componentProperties":{"Icon":"at-sign"},"componentPropertyDetails":{"Icon":{"type":"VARIANT","value":"at-sign"}},"children":[{"id":"I746:22676;303:8698;578:17459","name":"at-sign","type":"FRAME","layout":{"width":18,"height":18,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"I746:22676;303:8698;578:17460","name":"Vector","type":"VECTOR","layout":{"width":6,"height":6}},{"id":"I746:22676;303:8698;578:17461","name":"Vector","type":"VECTOR","layout":{"width":15,"height":15}}]}]}]},{"id":"I746:22676;285:4864","name":"Обычный","type":"TEXT","text":"Telegram","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":71,"height":24,"x":39,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"746:22677","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"y":128,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I746:22677;285:4864","name":"Обычный","type":"TEXT","text":"Веб-сайт","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":72,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"746:22678","name":"Поля ввода","type":"INSTANCE","layout":{"width":366,"height":52,"y":192,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"padding":{"top":13,"right":12,"bottom":13,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","borderRadius":18,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"borderColor":"#8A8A8A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Property 1":"Обычный"},"componentPropertyDetails":{"Property 1":{"type":"VARIANT","value":"Обычный"}},"children":[{"id":"I746:22678;285:4864","name":"Обычный","type":"TEXT","text":"Почта","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#8A8A8A"}],"color":"#8A8A8A","fontFamily":"Inter","fontStyleName":"Regular","fontSize":16,"fontWeight":400,"lineHeight":24,"textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":47,"height":24,"x":13,"y":14,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"746:22817","name":"Frame 190","type":"FRAME","layout":{"width":366,"height":48,"y":256,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":10,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"746:22818","name":"Кнопки","type":"INSTANCE","layout":{"width":366,"height":48,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":2,"strokesIncludedInLayout":true,"padding":{"top":10,"right":16,"bottom":10,"left":16},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#292929"}],"backgroundColor":"#292929","borderRadius":80,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"borderColor":"#2A2A2A","borderWidth":1,"strokeAlign":"inside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":1,"right":1,"bottom":1,"left":1}},"componentProperties":{"Иконка правая":"false","Icon":"297:5597","Иконка левая":"false","Обычная":"Черная"},"componentPropertyDetails":{"Иконка правая":{"type":"BOOLEAN","value":false},"Icon":{"type":"INSTANCE_SWAP","value":"297:5597"},"Иконка левая":{"type":"BOOLEAN","value":false},"Обычная":{"type":"VARIANT","value":"Черная"}},"children":[{"id":"I746:22818;278:4690","name":"Кнопка","type":"TEXT","text":"Продолжить","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Inter","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"lineHeight":26,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":99,"height":26,"x":133.5,"y":11,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}]}]},{"id":"746:22681","name":"Change-This","type":"VECTOR","layout":{"width":389.56,"height":49.78}}],"prototype":{"overflowDirection":"none","fixedChildIds":["746:22681"],"overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}}
```

## Capture Bundle Inputs (Authoritative)
- Keep this bundle intact. Resolve every path relative to the bundle root.
- Review `mcp/figma-locator.json` before calling a Figma MCP tool. Prefer each node's exact `locator.sourceUrl`; otherwise pass its `locator.fileKey` and colon-form `locator.nodeId` through the MCP tool's documented inputs.
- Locator data is for discovery or refresh only. An MCP re-capture creates a new immutable capture; it never replaces the evidence in this bundle.
- This capture has no Figma file key, so MCP cannot reopen its source; rely on the bundled evidence.
- Review `fidelity/coverage.json` before implementation. Every listed node must use its exact pixel fallback or an equivalent implementation proven by the final RGBA comparison.
- Use the reference renders below as the visual source of truth and iterate with screenshot comparison.
- Authoritative target: `references/001-746_22642.png` at exactly 390×641 CSS pixels. Do not infer the viewport from Figma's fractional geometry or another asset.
- Reference determinism gate passed: two consecutive Figma renders were RGBA-identical. If a later reference becomes unstable, stop exact verification until the changing content is frozen.
- Provide the final exact-size screenshot so the user can load it into Figma to Prompt's built-in `Verify AI screenshot` checker.
- Reference render: `references/001-746_22642.png`
- Match design assets by their manifest `nodeId`; bundled paths override any generated filename elsewhere in this prompt.
- Design asset for node `746:22681`: `assets/001-746_22681.png`
- Rendered fallbacks are Figma-authored precision assets. Use the PNG variant for the exact 1× target; use the outlined, unsimplified SVG variant when the node must scale. Preserve semantics or interactions with an accessible overlay when needed.
- Rendered fallback (pixel) for node `746:22642` (context-dependent-effect): `fallbacks/001-746_22642.png`
- Rendered fallback (vector) for node `746:22642` (context-dependent-effect): `fallbacks/001-746_22642.svg`

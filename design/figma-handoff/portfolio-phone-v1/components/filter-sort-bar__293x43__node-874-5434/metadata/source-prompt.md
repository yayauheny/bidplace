# Pixel-perfect Figma rebuild: Frame 77

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
- `#FFFFFF` (background), opacity: 0.8
- `#E2E2E2` (border)
- `#FFFFFF` (background), opacity: 0.8
- `#E2E2E2` (border)
- `#2A2A2A` (border)
- `#2A2A2A` (border)
- `#2A2A2A` (text)
- `#2A2A2A` (text)
### Typography
- Geist 500 16px, letter-spacing: -2%
### Spacing & Radii
- Spacing scale: 4px, 8px, 10px, 12px, 16px
- Border radii: 14px

## Interaction Contract
Implement these Figma prototype settings and reactions explicitly. Preserve scrolling, fixed layers, overlay behavior, trigger/action order, and transitions; do not infer a different behavior from appearance or node names.
- `Frame 77` (`874:5434`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 77 > Frame 34` (`874:5435`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 77 > Frame 34 > Frame 35` (`874:5436`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 77 > Frame 34 > Frame 35 > filter-horizontal` (`874:5437`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 77 > Frame 62` (`874:5445`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 77 > Frame 62 > Frame 39` (`874:5446`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 77 > Frame 62 > Frame 39 > arrow-up-down` (`874:5447`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`

## Fidelity Risk Summary
- Estimated risk: medium (19 visible nodes, max depth 4)
- Layout risks: 19 nodes with constraints, 2 nodes with target aspect ratio
- Asset risks: 10 vector-like nodes
- Paint risks: 2 blur effect nodes, 19 nodes with layer blend mode, 12 nodes with detailed stroke metadata

## Geometry Checklist
Use these absolute boxes after normalizing the selected root to left 0, top 0. They are derived from `layout.x/y` and help catch drift before styling polish.
- Root `layout.x/y` is the Figma canvas position; do not offset the rendered component by it.
### Bounding Boxes
- Frame 77 [FRAME]: left 0, top 0, width 292, height 42, signals: root
- Frame 77 > Frame 34 [FRAME]: left 0, top 0, width 131, height 42, signals: top-level
- Frame 77 > Frame 34 > Frame 35 [FRAME]: left 8, top 8, width 26, height 26
- Frame 77 > Frame 34 > Frame 35 > filter-horizontal [FRAME]: left 12, top 12, width 18, height 18
- Frame 77 > Frame 34 > Frame 35 > filter-horizontal > Vector [VECTOR]: left 14.25, top 17.25, width 2.25, height 0, signals: vector
- Frame 77 > Frame 34 > Frame 35 > filter-horizontal > Vector [VECTOR]: left 14.25, top 24.75, width 4.5, height 0, signals: vector
- Frame 77 > Frame 34 > Frame 35 > filter-horizontal > Vector [VECTOR]: left 25.5, top 24.75, width 2.25, height 0, signals: vector
- Frame 77 > Frame 34 > Frame 35 > filter-horizontal > Vector [VECTOR]: left 23.25, top 17.25, width 4.5, height 0, signals: vector
- Frame 77 > Frame 34 > Frame 35 > filter-horizontal > Vector [VECTOR]: left 16.5, top 15, width 4.5, height 4.5, signals: vector
- Frame 77 > Frame 34 > Frame 35 > filter-horizontal > Vector [VECTOR]: left 21, top 22.5, width 4.5, height 4.5, signals: vector
- Frame 77 > Frame 34 > Фильтры [TEXT]: left 42, top 10.5, width 73, height 21
- Frame 77 > Frame 62 [FRAME]: left 143, top 0, width 149, height 42, signals: top-level
- Frame 77 > Frame 62 > Frame 39 [FRAME]: left 151, top 8, width 26, height 26
- Frame 77 > Frame 62 > Frame 39 > arrow-up-down [FRAME]: left 155, top 12, width 18, height 18
- Frame 77 > Frame 62 > Frame 39 > arrow-up-down > Vector [VECTOR]: left 160.25, top 15, width 0, height 12, signals: vector
- Frame 77 > Frame 62 > Frame 39 > arrow-up-down > Vector [VECTOR]: left 167.75, top 15, width 0, height 11.25, signals: vector
- Frame 77 > Frame 62 > Frame 39 > arrow-up-down > Vector [VECTOR]: left 158, top 15, width 4.5, height 2.25, signals: vector
- Frame 77 > Frame 62 > Frame 39 > arrow-up-down > Vector [VECTOR]: left 165.5, top 24.75, width 4.5, height 2.25, signals: vector
- Frame 77 > Frame 62 > Сортировка [TEXT]: left 185, top 10.5, width 91, height 21

## Pixel Perfect Template
You are rebuilding this Figma frame for an exact visual match. Treat the JSON as geometry/style data and the reference image/assets as visual evidence.

### Required Inputs
- JSON component structure below.
- If a whole-frame reference image is supplied separately, use it as the visual source of truth.
- Use every listed exported image file exactly; if any required asset is missing, stop and ask for it.

### Render Target
- Build one exact 292×42 frame.
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
- Build against one exact 292×42 viewport with `html, body { margin: 0; }` and global `box-sizing: border-box`.
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
Frame 77 (FRAME, horizontal, hug×hug)
├── Frame 34 (FRAME, horizontal, hug×hug)
│   ├── Frame 35 (FRAME, horizontal, hug×hug)
│   │   └── filter-horizontal (FRAME, fixed×fixed)
│   │       ├── Vector (VECTOR, fixed×fixed)
│   │       ├── Vector (VECTOR, fixed×fixed)
│   │       ├── Vector (VECTOR, fixed×fixed)
│   │       ├── Vector (VECTOR, fixed×fixed)
│   │       ├── Vector (VECTOR, fixed×fixed)
│   │       └── Vector (VECTOR, fixed×fixed)
│   └── Фильтры (TEXT, hug×hug) "Фильтры"
└── Frame 62 (FRAME, horizontal, hug×hug)
    ├── Frame 39 (FRAME, horizontal, hug×hug)
    │   └── arrow-up-down (FRAME, fixed×fixed)
    │       ├── Vector (VECTOR, fixed×fixed)
    │       ├── Vector (VECTOR, fixed×fixed)
    │       ├── Vector (VECTOR, fixed×fixed)
    │       └── Vector (VECTOR, fixed×fixed)
    └── Сортировка (TEXT, hug×hug) "Сортировка"
```

## Component Structure
```
{"id":"874:5434","name":"Frame 77","type":"FRAME","layout":{"width":292,"height":42,"x":10757,"y":3342,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":12,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"874:5435","name":"Frame 34","type":"FRAME","layout":{"width":131,"height":42,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":8,"strokesIncludedInLayout":true,"padding":{"top":8,"right":16,"bottom":8,"left":8},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.8,"color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","backgroundOpacity":0.8,"borderRadius":14,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#E2E2E2"}],"borderColor":"#E2E2E2","borderWidth":0.5,"strokeAlign":"outside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":0.5,"right":0.5,"bottom":0.5,"left":0.5},"blurEffects":[{"type":"background","radius":12,"blurType":"normal"}]},"children":[{"id":"874:5436","name":"Frame 35","type":"FRAME","layout":{"width":26,"height":26,"x":8,"y":8,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":4,"bottom":4,"left":4},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"874:5437","name":"filter-horizontal","type":"FRAME","layout":{"width":18,"height":18,"x":4,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":18,"y":18},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"874:5438","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":0}},{"id":"874:5439","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":0}},{"id":"874:5440","name":"Vector","type":"VECTOR","layout":{"width":2.25,"height":0}},{"id":"874:5441","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":0}},{"id":"874:5442","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}},{"id":"874:5443","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":4.5}}]}]},{"id":"874:5444","name":"Фильтры","type":"TEXT","text":"Фильтры","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Geist","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":73,"height":21,"x":42,"y":10.5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"874:5445","name":"Frame 62","type":"FRAME","layout":{"width":149,"height":42,"x":143,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":8,"strokesIncludedInLayout":true,"padding":{"top":8,"right":16,"bottom":8,"left":8},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.8,"color":"#FFFFFF"}],"backgroundColor":"#FFFFFF","backgroundOpacity":0.8,"borderRadius":14,"strokes":[{"type":"solid","sourceType":"SOLID","color":"#E2E2E2"}],"borderColor":"#E2E2E2","borderWidth":0.5,"strokeAlign":"outside","strokeCap":"none","strokeJoin":"miter","strokeMiterLimit":4,"strokeDashPattern":[],"strokeWeights":{"top":0.5,"right":0.5,"bottom":0.5,"left":0.5},"blurEffects":[{"type":"background","radius":12,"blurType":"normal"}]},"children":[{"id":"874:5446","name":"Frame 39","type":"FRAME","layout":{"width":26,"height":26,"x":8,"y":8,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":4,"bottom":4,"left":4},"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"874:5447","name":"arrow-up-down","type":"FRAME","layout":{"width":18,"height":18,"x":4,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":28,"y":28},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through"},"children":[{"id":"874:5448","name":"Vector","type":"VECTOR","layout":{"width":0,"height":12}},{"id":"874:5449","name":"Vector","type":"VECTOR","layout":{"width":0,"height":11.25}},{"id":"874:5450","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":2.25}},{"id":"874:5451","name":"Vector","type":"VECTOR","layout":{"width":4.5,"height":2.25}}]}]},{"id":"874:5452","name":"Сортировка","type":"TEXT","text":"Сортировка","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#2A2A2A"}],"color":"#2A2A2A","fontFamily":"Geist","fontStyleName":"Medium","fontSize":16,"fontWeight":500,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":91,"height":21,"x":42,"y":10.5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}
```

## Capture Bundle Inputs (Authoritative)
- Keep this bundle intact. Resolve every path relative to the bundle root.
- Review `mcp/figma-locator.json` before calling a Figma MCP tool. Prefer each node's exact `locator.sourceUrl`; otherwise pass its `locator.fileKey` and colon-form `locator.nodeId` through the MCP tool's documented inputs.
- Locator data is for discovery or refresh only. An MCP re-capture creates a new immutable capture; it never replaces the evidence in this bundle.
- This capture has no Figma file key, so MCP cannot reopen its source; rely on the bundled evidence.
- Review `fidelity/coverage.json` before implementation. Every listed node must use its exact pixel fallback or an equivalent implementation proven by the final RGBA comparison.
- Use the reference renders below as the visual source of truth and iterate with screenshot comparison.
- Authoritative target: `references/001-874_5434.png` at exactly 293×43 CSS pixels. Do not infer the viewport from Figma's fractional geometry or another asset.
- Reference determinism gate passed: two consecutive Figma renders were RGBA-identical. If a later reference becomes unstable, stop exact verification until the changing content is frozen.
- Provide the final exact-size screenshot so the user can load it into Figma to Prompt's built-in `Verify AI screenshot` checker.
- Reference render: `references/001-874_5434.png`
- Match design assets by their manifest `nodeId`; bundled paths override any generated filename elsewhere in this prompt.
- Rendered fallbacks are Figma-authored precision assets. Use the PNG variant for the exact 1× target; use the outlined, unsimplified SVG variant when the node must scale. Preserve semantics or interactions with an accessible overlay when needed.
- Rendered fallback (pixel) for node `874:5434` (context-dependent-effect): `fallbacks/001-874_5434.png`
- Rendered fallback (vector) for node `874:5434` (context-dependent-effect): `fallbacks/001-874_5434.svg`

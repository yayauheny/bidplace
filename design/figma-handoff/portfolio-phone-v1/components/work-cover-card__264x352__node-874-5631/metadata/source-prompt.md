# Pixel-perfect Figma rebuild: Frame 13

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
- `#FFFFFF` (text)
- `#FFFFFF` (text)
- `#000000` (background), opacity: 0.15
- `#000000` (background), opacity: 0.15
- `#E9401A` (background)
- `#E9401A` (background)
### Typography
- Geist 500 18px/22px, letter-spacing: -2%
- Geist 600 18px/20px, letter-spacing: -1%
- Geist 500 15px/20px, letter-spacing: -1%
- Geist 500 13px, letter-spacing: -1%
### Gradients
- `linear-gradient(#000000 0%, #292929 100%)`
### Spacing & Radii
- Spacing scale: 4px, 6px, 8px, 10px, 12px
- Border radii: 20px, 24px, 28px

## Interaction Contract
Implement these Figma prototype settings and reactions explicitly. Preserve scrolling, fixed layers, overlay behavior, trigger/action order, and transitions; do not infer a different behavior from appearance or node names.
- `Frame 13` (`874:5631`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 13 > Frame 8` (`874:5632`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 13 > Frame 8 > Frame 25` (`874:5633`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 13 > Frame 8 > Frame 25 > Frame 11` (`874:5634`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 13 > Frame 8 > Frame 25 > Frame 12` (`874:5636`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 13 > Frame 8 > Frame 15` (`874:5639`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 13 > Frame 8 > Frame 15 > Frame 8` (`874:5640`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 13 > Frame 8 > Frame 15 > Frame 14` (`874:5642`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`

## Fidelity Risk Summary
- Estimated risk: medium (14 visible nodes, max depth 4)
- Layout risks: 1 clipped containers, 14 nodes with constraints, 2 nodes with target aspect ratio
- Asset risks: 1 image fills, 1 image fills with crop/filter/opacity metadata
- Paint risks: 1 gradients, 1 blur effect nodes, 14 nodes with layer blend mode

## Fidelity Warnings
These are extracted from the JSON and mark places where the convenience fields may not be enough.
- [critical] Frame 13 > Frame 8: progressive-blur - Progressive blur has no exact CSS equivalent and requires the Figma-rendered fallback.

## Geometry Checklist
Use these absolute boxes after normalizing the selected root to left 0, top 0. They are derived from `layout.x/y` and help catch drift before styling polish.
- Root `layout.x/y` is the Figma canvas position; do not offset the rendered component by it.
### Bounding Boxes
- Frame 13 [FRAME]: left 0, top 0, width 264, height 352, signals: root/clips/image
- Frame 13 > Frame 8 [FRAME]: left 0, top 249, width 264, height 103, signals: top-level
- Frame 13 > Frame 8 > Frame 25 [FRAME]: left 12, top 261, width 240, height 46
- Frame 13 > Frame 8 > Frame 25 > Frame 11 [FRAME]: left 12, top 261, width 240, height 22
- Frame 13 > Frame 8 > Frame 25 > Frame 11 > Желтый сапфир [TEXT]: left 12, top 261, width 240, height 22
- Frame 13 > Frame 8 > Frame 25 > Frame 12 [FRAME]: left 12, top 287, width 240, height 20
- Frame 13 > Frame 8 > Frame 25 > Frame 12 > 2 510 BYN [TEXT]: left 12, top 287, width 87, height 20
- Frame 13 > Frame 8 > Frame 25 > Frame 12 > 13д 24ч 40м [TEXT]: left 161, top 287, width 91, height 20
- Frame 13 > Frame 8 > Frame 15 [FRAME]: left 12, top 315, width 240, height 25
- Frame 13 > Frame 8 > Frame 15 > Frame 8 [FRAME]: left 12, top 315, width 135, height 25
- Frame 13 > Frame 8 > Frame 15 > Frame 8 > @quantumparadox [TEXT]: left 22, top 319, width 115, height 17
- Frame 13 > Frame 8 > Frame 15 > Frame 14 [FRAME]: left 151, top 315, width 101, height 25
- Frame 13 > Frame 8 > Frame 15 > Frame 14 > Rectangle 1 [RECTANGLE]: left 161, top 324.5, width 6, height 6
- Frame 13 > Frame 8 > Frame 15 > Frame 14 > В продаже [TEXT]: left 173, top 319, width 69, height 17

## Assets
Image files included with this spec — use as `<img>` or CSS `background-image`:
- `Frame_13.png` → Frame 13 (264×352, fill, scaling 0.5, transform [[1,0,0],[0,1,0]])

## Pixel Perfect Template
You are rebuilding this Figma frame for an exact visual match. Treat the JSON as geometry/style data and the reference image/assets as visual evidence.

### Required Inputs
- JSON component structure below.
- If a whole-frame reference image is supplied separately, use it as the visual source of truth.
- Use every listed exported image file exactly; if any required asset is missing, stop and ask for it.

### Render Target
- Build one exact 264×352 frame.
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
- Build against one exact 264×352 viewport with `html, body { margin: 0; }` and global `box-sizing: border-box`.
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
Frame 13 (FRAME, vertical, fixed×fixed)
└── Frame 8 (FRAME, vertical, fill×hug)
    ├── Frame 25 (FRAME, vertical, fill×hug)
    │   ├── Frame 11 (FRAME, horizontal, fill×hug)
    │   │   └── Желтый сапфир (TEXT, fill×hug) "Желтый сапфир"
    │   └── Frame 12 (FRAME, horizontal, fill×hug)
    │       ├── 2 510 BYN (TEXT, hug×hug) "2 510 BYN"
    │       └── 13д 24ч 40м (TEXT, hug×hug) "13д 24ч 40м"
    └── Frame 15 (FRAME, horizontal, fill×hug)
        ├── Frame 8 (FRAME, horizontal, hug×hug)
        │   └── @quantumparadox (TEXT, hug×hug) "@quantumparadox"
        └── Frame 14 (FRAME, horizontal, hug×hug)
            ├── Rectangle 1 (RECTANGLE, fixed×fixed)
            └── В продаже (TEXT, hug×hug) "В продаже"
```

## Component Structure
```
{"id":"874:5631","name":"Frame 13","type":"FRAME","layout":{"width":264,"height":352,"x":58,"y":64,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":264,"y":352},"overflow":"hidden","mode":"vertical","gap":10,"strokesIncludedInLayout":true,"primaryAxisAlign":"max","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"image","sourceType":"IMAGE","imageHash":"0bc324633a6cc24d90238d477ec8b4b1a160013c","scaleMode":"fill","transform":[[1,0,0],[0,1,0]],"scalingFactor":0.5}],"borderRadius":24,"imageFillHash":"0bc324633a6cc24d90238d477ec8b4b1a160013c","imageFillScaleMode":"fill","imageFillTransform":[[1,0,0],[0,1,0]],"imageFillScalingFactor":0.5},"children":[{"id":"874:5632","name":"Frame 8","type":"FRAME","layout":{"width":264,"height":103,"y":249,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":8,"strokesIncludedInLayout":true,"padding":{"top":12,"right":12,"bottom":12,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","opacity":0.7,"gradientType":"linear","css":"linear-gradient(#000000 0%, #292929 100%)","gradientStops":[{"color":"#000000","position":0,"opacity":0},{"color":"#292929","position":1}],"transform":[[0,1,0],[-16,0,8.5]]}],"cornerRadii":{"topLeft":12,"topRight":12,"bottomRight":0,"bottomLeft":0},"blurEffects":[{"type":"background","radius":60,"blurType":"progressive","startRadius":0,"startOffset":{"x":0.5,"y":0},"endOffset":{"x":0.5,"y":1}}],"backgroundGradient":"linear-gradient(#000000 0%, #292929 100%)","backgroundGradientType":"linear","backgroundGradientStops":[{"color":"#000000","position":0,"opacity":0},{"color":"#292929","position":1}],"backgroundGradientTransform":[[0,1,0],[-16,0,8.5]],"backgroundGradientOpacity":0.7},"children":[{"id":"874:5633","name":"Frame 25","type":"FRAME","layout":{"width":240,"height":46,"x":12,"y":12,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":4,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"874:5634","name":"Frame 11","type":"FRAME","layout":{"width":240,"height":22,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"primaryAxisAlign":"space-between","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"874:5635","name":"Желтый сапфир","type":"TEXT","text":"Желтый сапфир","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Geist","fontStyleName":"Medium","fontSize":18,"fontWeight":500,"lineHeight":22,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"ending","maxLines":2,"leadingTrim":"none"},"layout":{"width":240,"height":22,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]},{"id":"874:5636","name":"Frame 12","type":"FRAME","layout":{"width":240,"height":20,"y":26,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"primaryAxisAlign":"space-between","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"874:5637","name":"2 510 BYN","type":"TEXT","text":"2 510 BYN","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Geist","fontStyleName":"SemiBold","fontSize":18,"fontWeight":600,"lineHeight":20,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":87,"height":20,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}},{"id":"874:5638","name":"13д 24ч 40м","type":"TEXT","text":"13д 24ч 40м","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Geist","fontStyleName":"Medium","fontSize":15,"fontWeight":500,"lineHeight":20,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":91,"height":20,"x":149,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]},{"id":"874:5639","name":"Frame 15","type":"FRAME","layout":{"width":240,"height":25,"x":12,"y":66,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"primaryAxisAlign":"space-between","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"874:5640","name":"Frame 8","type":"FRAME","layout":{"width":135,"height":25,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":10,"bottom":4,"left":10},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.15,"color":"#000000"}],"backgroundColor":"#000000","backgroundOpacity":0.15,"borderRadius":28},"children":[{"id":"874:5641","name":"@quantumparadox","type":"TEXT","text":"@quantumparadox","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Geist","fontStyleName":"Medium","fontSize":13,"fontWeight":500,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":115,"height":17,"x":10,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"874:5642","name":"Frame 14","type":"FRAME","layout":{"width":101,"height":25,"x":139,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"padding":{"top":4,"right":10,"bottom":4,"left":10},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.15,"color":"#000000"}],"backgroundColor":"#000000","backgroundOpacity":0.15,"borderRadius":28},"children":[{"id":"874:5643","name":"Rectangle 1","type":"RECTANGLE","layout":{"width":6,"height":6,"x":10,"y":9.5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#E9401A"}],"backgroundColor":"#E9401A","borderRadius":20}},{"id":"874:5644","name":"В продаже","type":"TEXT","text":"В продаже","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Geist","fontStyleName":"Medium","fontSize":13,"fontWeight":500,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":69,"height":17,"x":22,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}],"fidelityWarnings":[{"code":"progressive-blur","severity":"critical","message":"Progressive blur has no exact CSS equivalent and requires the Figma-rendered fallback."}]}]}
```

## Capture Bundle Inputs (Authoritative)
- Keep this bundle intact. Resolve every path relative to the bundle root.
- Review `mcp/figma-locator.json` before calling a Figma MCP tool. Prefer each node's exact `locator.sourceUrl`; otherwise pass its `locator.fileKey` and colon-form `locator.nodeId` through the MCP tool's documented inputs.
- Locator data is for discovery or refresh only. An MCP re-capture creates a new immutable capture; it never replaces the evidence in this bundle.
- This capture has no Figma file key, so MCP cannot reopen its source; rely on the bundled evidence.
- Review `fidelity/coverage.json` before implementation. Every listed node must use its exact pixel fallback or an equivalent implementation proven by the final RGBA comparison.
- Use the reference renders below as the visual source of truth and iterate with screenshot comparison.
- Authoritative target: `references/001-874_5631.png` at exactly 264×352 CSS pixels. Do not infer the viewport from Figma's fractional geometry or another asset.
- Reference determinism gate passed: two consecutive Figma renders were RGBA-identical. If a later reference becomes unstable, stop exact verification until the changing content is frozen.
- Provide the final exact-size screenshot so the user can load it into Figma to Prompt's built-in `Verify AI screenshot` checker.
- Reference render: `references/001-874_5631.png`
- Match design assets by their manifest `nodeId`; bundled paths override any generated filename elsewhere in this prompt.
- Design asset for node `874:5631`: `assets/001-874_5631.png`
- Rendered fallbacks are Figma-authored precision assets. Use the PNG variant for the exact 1× target; use the outlined, unsimplified SVG variant when the node must scale. Preserve semantics or interactions with an accessible overlay when needed.
- Rendered fallback (pixel) for node `874:5631` (context-dependent-effect): `fallbacks/001-874_5631.png`
- Rendered fallback (vector) for node `874:5631` (context-dependent-effect): `fallbacks/001-874_5631.svg`

# Pixel-perfect Figma rebuild: Frame 6

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
### Typography
- Geist 600 22px/24px, letter-spacing: -3%
- Geist 600 18px/20px, letter-spacing: -1%
- Geist 500 13px, letter-spacing: -1%
### Gradients
- `linear-gradient(#000000 0%, #000000 100%)`
- `linear-gradient(#000000 0%, #292929 100%)`
### Spacing & Radii
- Spacing scale: 4px, 8px, 10px, 12px, 20px
- Border radii: 28px

## Interaction Contract
Implement these Figma prototype settings and reactions explicitly. Preserve scrolling, fixed layers, overlay behavior, trigger/action order, and transitions; do not infer a different behavior from appearance or node names.
- `Frame 6` (`874:5576`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 6 > Frame 7` (`874:5577`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 6 > Frame 8` (`874:5579`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 6 > Frame 8 > Frame 7` (`874:5581`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 6 > Frame 8 > Frame 7 > Frame 10` (`874:5582`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 6 > Frame 8 > Frame 7 > Frame 8` (`874:5584`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 6 > Frame 8 > Frame 7 > Frame 9` (`874:5586`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`

## Fidelity Risk Summary
- Estimated risk: high (12 visible nodes, max depth 4)
- Layout risks: 1 clipped containers, 5 boxes extend outside the root viewport, 12 nodes with constraints, 1 nodes with target aspect ratio
- Asset risks: 1 image fills, 1 image fills with crop/filter/opacity metadata
- Paint risks: 2 gradients, 2 blur effect nodes, 12 nodes with layer blend mode

## Fidelity Warnings
These are extracted from the JSON and mark places where the convenience fields may not be enough.
- [critical] Frame 6 > Frame 7: progressive-blur - Progressive blur has no exact CSS equivalent and requires the Figma-rendered fallback.
- [critical] Frame 6 > Frame 8: progressive-blur - Progressive blur has no exact CSS equivalent and requires the Figma-rendered fallback.

## Geometry Checklist
Use these absolute boxes after normalizing the selected root to left 0, top 0. They are derived from `layout.x/y` and help catch drift before styling polish.
- Root `layout.x/y` is the Figma canvas position; do not offset the rendered component by it.
### Bounding Boxes
- Frame 6 [FRAME]: left 0, top 0, width 264, height 352, signals: root/clips/image
- Frame 6 > Frame 7 [FRAME]: left 0, top 0, width 264, height 56, signals: top-level
- Frame 6 > Frame 7 > Анастасия Винова [TEXT]: left 12, top 20, width 240, height 24
- Frame 6 > Frame 8 [FRAME]: left 0, top 275, width 264, height 77, signals: top-level
- Frame 6 > Frame 8 > @quantumparadox [TEXT]: left 12, top 287, width 162, height 20
- Frame 6 > Frame 8 > Frame 7 [FRAME]: left 12, top 315, width 489, height 25
- Frame 6 > Frame 8 > Frame 7 > Frame 10 [FRAME]: left 12, top 315, width 157, height 25
- Frame 6 > Frame 8 > Frame 7 > Frame 10 > Художник-стеклодув [TEXT]: left 22, top 319, width 137, height 17
- Frame 6 > Frame 8 > Frame 7 > Frame 8 [FRAME]: left 173, top 315, width 178, height 25
- Frame 6 > Frame 8 > Frame 7 > Frame 8 > Керамическое искусство [TEXT]: left 183, top 319, width 158, height 17
- Frame 6 > Frame 8 > Frame 7 > Frame 9 [FRAME]: left 355, top 315, width 146, height 25
- Frame 6 > Frame 8 > Frame 7 > Frame 9 > Мастер скульптуры [TEXT]: left 365, top 319, width 126, height 17

## Assets
Image files included with this spec — use as `<img>` or CSS `background-image`:
- `Frame_6.png` → Frame 6 (264×352, fill, scaling 0.5, transform [[0.75,0,0.13],[0,1,0]])

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
Frame 6 (FRAME, vertical, fixed×fixed)
├── Frame 7 (FRAME, horizontal, fill×hug)
│   └── Анастасия Винова (TEXT, fill×hug) "Анастасия Винова"
└── Frame 8 (FRAME, vertical, fill×hug)
    ├── @quantumparadox (TEXT, hug×hug) "@quantumparadox"
    └── Frame 7 (FRAME, horizontal, hug×hug)
        ├── Frame 10 (FRAME, horizontal, hug×hug)
        │   └── Художник-стеклодув (TEXT, hug×hug) "Художник-стеклодув"
        ├── Frame 8 (FRAME, horizontal, hug×hug)
        │   └── Керамическое искусство (TEXT, hug×hug) "Керамическое искусство"
        └── Frame 9 (FRAME, horizontal, hug×hug)
            └── Мастер скульптуры (TEXT, hug×hug) "Мастер скульптуры"
```

## Component Structure
```
{"id":"874:5576","name":"Frame 6","type":"FRAME","layout":{"width":264,"height":352,"x":880,"y":1546,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":264,"y":352},"overflow":"hidden","mode":"vertical","gap":10,"strokesIncludedInLayout":true,"primaryAxisAlign":"space-between","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"image","sourceType":"IMAGE","imageHash":"5d3a571961b0408ef624e12197872ce0d8552d99","scaleMode":"fill","transform":[[0.75,0,0.13],[0,1,0]],"scalingFactor":0.5}],"borderRadius":28,"imageFillHash":"5d3a571961b0408ef624e12197872ce0d8552d99","imageFillScaleMode":"fill","imageFillTransform":[[0.75,0,0.13],[0,1,0]],"imageFillScalingFactor":0.5},"children":[{"id":"874:5577","name":"Frame 7","type":"FRAME","layout":{"width":264,"height":56,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":20,"right":12,"bottom":12,"left":12},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","opacity":0.7,"gradientType":"linear","css":"linear-gradient(#000000 0%, #000000 100%)","gradientStops":[{"color":"#000000","position":0},{"color":"#000000","position":1,"opacity":0}],"transform":[[0,1,0],[-9.88,0,5.44]]}],"blurEffects":[{"type":"background","radius":0,"blurType":"progressive","startRadius":40,"startOffset":{"x":0.5,"y":0},"endOffset":{"x":0.5,"y":1}}],"backgroundGradient":"linear-gradient(#000000 0%, #000000 100%)","backgroundGradientType":"linear","backgroundGradientStops":[{"color":"#000000","position":0},{"color":"#000000","position":1,"opacity":0}],"backgroundGradientTransform":[[0,1,0],[-9.88,0,5.44]],"backgroundGradientOpacity":0.7},"children":[{"id":"874:5578","name":"Анастасия Винова","type":"TEXT","text":"Анастасия Винова","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Geist","fontStyleName":"SemiBold","fontSize":22,"fontWeight":600,"lineHeight":24,"letterSpacing":-3,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":240,"height":24,"x":12,"y":20,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}],"fidelityWarnings":[{"code":"progressive-blur","severity":"critical","message":"Progressive blur has no exact CSS equivalent and requires the Figma-rendered fallback."}]},{"id":"874:5579","name":"Frame 8","type":"FRAME","layout":{"width":264,"height":77,"y":275,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":8,"strokesIncludedInLayout":true,"padding":{"top":12,"right":12,"bottom":12,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","opacity":0.7,"gradientType":"linear","css":"linear-gradient(#000000 0%, #292929 100%)","gradientStops":[{"color":"#000000","position":0,"opacity":0},{"color":"#292929","position":1}],"transform":[[0,1,0],[-16,0,8.5]]}],"cornerRadii":{"topLeft":12,"topRight":12,"bottomRight":0,"bottomLeft":0},"blurEffects":[{"type":"background","radius":60,"blurType":"progressive","startRadius":0,"startOffset":{"x":0.5,"y":0},"endOffset":{"x":0.5,"y":1}}],"backgroundGradient":"linear-gradient(#000000 0%, #292929 100%)","backgroundGradientType":"linear","backgroundGradientStops":[{"color":"#000000","position":0,"opacity":0},{"color":"#292929","position":1}],"backgroundGradientTransform":[[0,1,0],[-16,0,8.5]],"backgroundGradientOpacity":0.7},"children":[{"id":"874:5580","name":"@quantumparadox","type":"TEXT","text":"@quantumparadox","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Geist","fontStyleName":"SemiBold","fontSize":18,"fontWeight":600,"lineHeight":20,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":162,"height":20,"x":12,"y":12,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}},{"id":"874:5581","name":"Frame 7","type":"FRAME","layout":{"width":489,"height":25,"x":12,"y":40,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"874:5582","name":"Frame 10","type":"FRAME","layout":{"width":157,"height":25,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":10,"bottom":4,"left":10},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.15,"color":"#000000"}],"backgroundColor":"#000000","backgroundOpacity":0.15,"borderRadius":28},"children":[{"id":"874:5583","name":"Художник-стеклодув","type":"TEXT","text":"Художник-стеклодув","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Geist","fontStyleName":"Medium","fontSize":13,"fontWeight":500,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":137,"height":17,"x":10,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"874:5584","name":"Frame 8","type":"FRAME","layout":{"width":178,"height":25,"x":161,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":10,"bottom":4,"left":10},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.15,"color":"#000000"}],"backgroundColor":"#000000","backgroundOpacity":0.15,"borderRadius":28},"children":[{"id":"874:5585","name":"Керамическое искусство","type":"TEXT","text":"Керамическое искусство","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Geist","fontStyleName":"Medium","fontSize":13,"fontWeight":500,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":158,"height":17,"x":10,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"874:5586","name":"Frame 9","type":"FRAME","layout":{"width":146,"height":25,"x":343,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":10,"bottom":4,"left":10},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.15,"color":"#000000"}],"backgroundColor":"#000000","backgroundOpacity":0.15,"borderRadius":28},"children":[{"id":"874:5587","name":"Мастер скульптуры","type":"TEXT","text":"Мастер скульптуры","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Geist","fontStyleName":"Medium","fontSize":13,"fontWeight":500,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":126,"height":17,"x":10,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}],"fidelityWarnings":[{"code":"progressive-blur","severity":"critical","message":"Progressive blur has no exact CSS equivalent and requires the Figma-rendered fallback."}]}]}
```

## Capture Bundle Inputs (Authoritative)
- Keep this bundle intact. Resolve every path relative to the bundle root.
- Review `mcp/figma-locator.json` before calling a Figma MCP tool. Prefer each node's exact `locator.sourceUrl`; otherwise pass its `locator.fileKey` and colon-form `locator.nodeId` through the MCP tool's documented inputs.
- Locator data is for discovery or refresh only. An MCP re-capture creates a new immutable capture; it never replaces the evidence in this bundle.
- This capture has no Figma file key, so MCP cannot reopen its source; rely on the bundled evidence.
- Review `fidelity/coverage.json` before implementation. Every listed node must use its exact pixel fallback or an equivalent implementation proven by the final RGBA comparison.
- Use the reference renders below as the visual source of truth and iterate with screenshot comparison.
- Authoritative target: `references/001-874_5576.png` at exactly 264×352 CSS pixels. Do not infer the viewport from Figma's fractional geometry or another asset.
- Reference determinism gate passed: two consecutive Figma renders were RGBA-identical. If a later reference becomes unstable, stop exact verification until the changing content is frozen.
- Provide the final exact-size screenshot so the user can load it into Figma to Prompt's built-in `Verify AI screenshot` checker.
- Reference render: `references/001-874_5576.png`
- Match design assets by their manifest `nodeId`; bundled paths override any generated filename elsewhere in this prompt.
- Design asset for node `874:5576`: `assets/001-874_5576.png`
- Rendered fallbacks are Figma-authored precision assets. Use the PNG variant for the exact 1× target; use the outlined, unsimplified SVG variant when the node must scale. Preserve semantics or interactions with an accessible overlay when needed.
- Rendered fallback (pixel) for node `874:5576` (context-dependent-effect): `fallbacks/001-874_5576.png`
- Rendered fallback (vector) for node `874:5576` (context-dependent-effect): `fallbacks/001-874_5576.svg`

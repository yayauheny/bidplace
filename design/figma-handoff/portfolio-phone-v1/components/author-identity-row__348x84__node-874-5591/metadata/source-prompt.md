# Pixel-perfect Figma rebuild: Frame 33

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
- `#000000` (text)
- `#000000` (text)
- `#000000` (background), opacity: 0.15
- `#000000` (background), opacity: 0.15
### Typography
- Geist 600 24px/25px, letter-spacing: -1%
- Geist 500 13px, letter-spacing: -1%
### Spacing & Radii
- Spacing scale: 4px, 10px, 12px
- Border radii: 28px, 100px

## Interaction Contract
Implement these Figma prototype settings and reactions explicitly. Preserve scrolling, fixed layers, overlay behavior, trigger/action order, and transitions; do not infer a different behavior from appearance or node names.
- `Frame 33` (`874:5591`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 33 > Frame 32` (`874:5593`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 33 > Frame 32 > Frame 7` (`874:5595`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 33 > Frame 32 > Frame 7 > Frame 8` (`874:5596`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 33 > Frame 32 > Frame 7 > Frame 9` (`874:5598`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 33 > Frame 32 > Frame 7 > Frame 10` (`874:5600`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`

## Fidelity Risk Summary
- Estimated risk: high (11 visible nodes, max depth 4)
- Layout risks: 1 clipped containers, 3 boxes extend outside the root viewport, 11 nodes with constraints
- Asset risks: 1 image fills, 1 image fills with crop/filter/opacity metadata
- Paint risks: 1 blur effect nodes, 11 nodes with layer blend mode

## Fidelity Warnings
These are extracted from the JSON and mark places where the convenience fields may not be enough.
- [critical] Frame 33 > Frame 32: progressive-blur - Progressive blur has no exact CSS equivalent and requires the Figma-rendered fallback.

## Geometry Checklist
Use these absolute boxes after normalizing the selected root to left 0, top 0. They are derived from `layout.x/y` and help catch drift before styling polish.
- Root `layout.x/y` is the Figma canvas position; do not offset the rendered component by it.
### Bounding Boxes
- Frame 33 [FRAME]: left 0, top 0, width 348, height 84, signals: root/clips
- Frame 33 > Rectangle 2 [RECTANGLE]: left 0, top 0, width 84, height 84, signals: top-level/image
- Frame 33 > Frame 32 [FRAME]: left 84, top 0, width 264, height 84, signals: top-level
- Frame 33 > Frame 32 > @vex [TEXT]: left 96, top 12, width 64, height 25
- Frame 33 > Frame 32 > Frame 7 [FRAME]: left 96, top 47, width 328, height 25
- Frame 33 > Frame 32 > Frame 7 > Frame 8 [FRAME]: left 96, top 47, width 82, height 25
- Frame 33 > Frame 32 > Frame 7 > Frame 8 > Керамика [TEXT]: left 106, top 51, width 62, height 17
- Frame 33 > Frame 32 > Frame 7 > Frame 9 [FRAME]: left 182, top 47, width 88, height 25
- Frame 33 > Frame 32 > Frame 7 > Frame 9 > Скульптор [TEXT]: left 192, top 51, width 68, height 17
- Frame 33 > Frame 32 > Frame 7 > Frame 10 [FRAME]: left 274, top 47, width 150, height 25
- Frame 33 > Frame 32 > Frame 7 > Frame 10 > Художник по стеклу [TEXT]: left 284, top 51, width 130, height 17

## Assets
Image files included with this spec — use as `<img>` or CSS `background-image`:
- `Frame_33_Rectangle_2.png` → Rectangle 2 (84×84, fill, scaling 0.5, transform [[1,0,0],[0,1,0]])

## Pixel Perfect Template
You are rebuilding this Figma frame for an exact visual match. Treat the JSON as geometry/style data and the reference image/assets as visual evidence.

### Required Inputs
- JSON component structure below.
- If a whole-frame reference image is supplied separately, use it as the visual source of truth.
- Use every listed exported image file exactly; if any required asset is missing, stop and ask for it.

### Render Target
- Build one exact 348×84 frame.
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
- Build against one exact 348×84 viewport with `html, body { margin: 0; }` and global `box-sizing: border-box`.
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
Frame 33 (FRAME, horizontal, hug×hug)
├── Rectangle 2 (RECTANGLE, fixed×fixed)
└── Frame 32 (FRAME, vertical, fixed×hug)
    ├── @vex (TEXT, hug×hug) "@vex"
    └── Frame 7 (FRAME, horizontal, hug×hug)
        ├── Frame 8 (FRAME, horizontal, hug×hug)
        │   └── Керамика (TEXT, hug×hug) "Керамика"
        ├── Frame 9 (FRAME, horizontal, hug×hug)
        │   └── Скульптор (TEXT, hug×hug) "Скульптор"
        └── Frame 10 (FRAME, horizontal, hug×hug)
            └── Художник по стеклу (TEXT, hug×hug) "Художник по стеклу"
```

## Component Structure
```
{"id":"874:5591","name":"Frame 33","type":"FRAME","layout":{"width":348,"height":84,"x":58,"y":1239,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"overflow":"hidden","mode":"horizontal","gap":0,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"874:5592","name":"Rectangle 2","type":"RECTANGLE","layout":{"width":84,"height":84,"y":0,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"image","sourceType":"IMAGE","imageHash":"72dcbc8e3f809332dcb0e3566e4dd5b2ee40fbfb","scaleMode":"fill","transform":[[1,0,0],[0,1,0]],"scalingFactor":0.5}],"borderRadius":100,"imageFillHash":"72dcbc8e3f809332dcb0e3566e4dd5b2ee40fbfb","imageFillScaleMode":"fill","imageFillTransform":[[1,0,0],[0,1,0]],"imageFillScalingFactor":0.5}},{"id":"874:5593","name":"Frame 32","type":"FRAME","layout":{"width":264,"height":84,"x":84,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":10,"strokesIncludedInLayout":true,"padding":{"top":12,"right":12,"bottom":12,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fixed","vertical":"hug"}},"style":{"blendMode":"pass_through","blurEffects":[{"type":"background","radius":60,"blurType":"progressive","startRadius":0,"startOffset":{"x":0.5,"y":0},"endOffset":{"x":0.5,"y":1}}]},"children":[{"id":"874:5594","name":"@vex","type":"TEXT","text":"@vex","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#000000"}],"color":"#000000","fontFamily":"Geist","fontStyleName":"SemiBold","fontSize":24,"fontWeight":600,"lineHeight":25,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":64,"height":25,"x":12,"y":12,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}},{"id":"874:5595","name":"Frame 7","type":"FRAME","layout":{"width":328,"height":25,"x":12,"y":47,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":4,"strokesIncludedInLayout":true,"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"874:5596","name":"Frame 8","type":"FRAME","layout":{"width":82,"height":25,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":10,"bottom":4,"left":10},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.15,"color":"#000000"}],"backgroundColor":"#000000","backgroundOpacity":0.15,"borderRadius":28,"strokes":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","opacity":0.16,"gradientType":"linear","css":"linear-gradient(#FFFFFF 0%, #999999 100%)","gradientStops":[{"color":"#FFFFFF","position":0},{"color":"#999999","position":1}],"transform":[[0,1,0],[-1,0,1]]}]},"children":[{"id":"874:5597","name":"Керамика","type":"TEXT","text":"Керамика","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#000000"}],"color":"#000000","fontFamily":"Geist","fontStyleName":"Medium","fontSize":13,"fontWeight":500,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":62,"height":17,"x":10,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"874:5598","name":"Frame 9","type":"FRAME","layout":{"width":88,"height":25,"x":86,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":10,"bottom":4,"left":10},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.15,"color":"#000000"}],"backgroundColor":"#000000","backgroundOpacity":0.15,"borderRadius":28,"strokes":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","opacity":0.16,"gradientType":"linear","css":"linear-gradient(#FFFFFF 0%, #999999 100%)","gradientStops":[{"color":"#FFFFFF","position":0},{"color":"#999999","position":1}],"transform":[[0,1,0],[-1,0,1]]}]},"children":[{"id":"874:5599","name":"Скульптор","type":"TEXT","text":"Скульптор","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#000000"}],"color":"#000000","fontFamily":"Geist","fontStyleName":"Medium","fontSize":13,"fontWeight":500,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":68,"height":17,"x":10,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"874:5600","name":"Frame 10","type":"FRAME","layout":{"width":150,"height":25,"x":178,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":10,"bottom":4,"left":10},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.15,"color":"#000000"}],"backgroundColor":"#000000","backgroundOpacity":0.15,"borderRadius":28,"strokes":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","opacity":0.16,"gradientType":"linear","css":"linear-gradient(#FFFFFF 0%, #999999 100%)","gradientStops":[{"color":"#FFFFFF","position":0},{"color":"#999999","position":1}],"transform":[[0,1,0],[-1,0,1]]}]},"children":[{"id":"874:5601","name":"Художник по стеклу","type":"TEXT","text":"Художник по стеклу","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#000000"}],"color":"#000000","fontFamily":"Geist","fontStyleName":"Medium","fontSize":13,"fontWeight":500,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":130,"height":17,"x":10,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}],"fidelityWarnings":[{"code":"progressive-blur","severity":"critical","message":"Progressive blur has no exact CSS equivalent and requires the Figma-rendered fallback."}]}]}
```

## Capture Bundle Inputs (Authoritative)
- Keep this bundle intact. Resolve every path relative to the bundle root.
- Review `mcp/figma-locator.json` before calling a Figma MCP tool. Prefer each node's exact `locator.sourceUrl`; otherwise pass its `locator.fileKey` and colon-form `locator.nodeId` through the MCP tool's documented inputs.
- Locator data is for discovery or refresh only. An MCP re-capture creates a new immutable capture; it never replaces the evidence in this bundle.
- This capture has no Figma file key, so MCP cannot reopen its source; rely on the bundled evidence.
- Review `fidelity/coverage.json` before implementation. Every listed node must use its exact pixel fallback or an equivalent implementation proven by the final RGBA comparison.
- Use the reference renders below as the visual source of truth and iterate with screenshot comparison.
- Authoritative target: `references/001-874_5591.png` at exactly 348×84 CSS pixels. Do not infer the viewport from Figma's fractional geometry or another asset.
- Reference determinism gate passed: two consecutive Figma renders were RGBA-identical. If a later reference becomes unstable, stop exact verification until the changing content is frozen.
- Provide the final exact-size screenshot so the user can load it into Figma to Prompt's built-in `Verify AI screenshot` checker.
- Reference render: `references/001-874_5591.png`
- Match design assets by their manifest `nodeId`; bundled paths override any generated filename elsewhere in this prompt.
- Design asset for node `874:5592`: `assets/001-874_5592.png`
- Rendered fallbacks are Figma-authored precision assets. Use the PNG variant for the exact 1× target; use the outlined, unsimplified SVG variant when the node must scale. Preserve semantics or interactions with an accessible overlay when needed.
- Rendered fallback (pixel) for node `874:5591` (context-dependent-effect): `fallbacks/001-874_5591.png`
- Rendered fallback (vector) for node `874:5591` (context-dependent-effect): `fallbacks/001-874_5591.svg`

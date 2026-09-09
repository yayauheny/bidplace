# Pixel-perfect Figma rebuild: Frame 16

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
- `#51E91A` (background)
- `#51E91A` (background)
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
- `Frame 16` (`874:5671`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 16 > Frame 7` (`874:5672`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 16 > Frame 7 > Frame 28` (`874:5673`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 16 > Frame 7 > Frame 28 > Frame 11` (`874:5674`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 16 > Frame 7 > Frame 28 > Frame 12` (`874:5676`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 16 > Frame 7 > Frame 15` (`874:5679`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 16 > Frame 7 > Frame 15 > Frame 8` (`874:5680`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`
- `Frame 16 > Frame 7 > Frame 15 > Frame 14` (`874:5682`) prototype settings: `{"overflowDirection":"none","overlayPositionType":"center","overlayBackground":{"type":"NONE"},"overlayBackgroundInteraction":"none"}`

## Fidelity Risk Summary
- Estimated risk: medium (14 visible nodes, max depth 4)
- Layout risks: 1 clipped containers, 14 nodes with constraints, 2 nodes with target aspect ratio
- Asset risks: 1 image fills, 1 image fills with crop/filter/opacity metadata
- Paint risks: 1 gradients, 1 blur effect nodes, 14 nodes with layer blend mode

## Fidelity Warnings
These are extracted from the JSON and mark places where the convenience fields may not be enough.
- [critical] Frame 16 > Frame 7: progressive-blur - Progressive blur has no exact CSS equivalent and requires the Figma-rendered fallback.

## Geometry Checklist
Use these absolute boxes after normalizing the selected root to left 0, top 0. They are derived from `layout.x/y` and help catch drift before styling polish.
- Root `layout.x/y` is the Figma canvas position; do not offset the rendered component by it.
### Bounding Boxes
- Frame 16 [FRAME]: left 0, top 0, width 264, height 352, signals: root/clips/image
- Frame 16 > Frame 7 [FRAME]: left 0, top 227, width 264, height 125, signals: top-level
- Frame 16 > Frame 7 > Frame 28 [FRAME]: left 12, top 239, width 240, height 68
- Frame 16 > Frame 7 > Frame 28 > Frame 11 [FRAME]: left 12, top 239, width 240, height 44
- Frame 16 > Frame 7 > Frame 28 > Frame 11 > Японский плакат из Японии (Винтажный) [TEXT]: left 12, top 239, width 240, height 44
- Frame 16 > Frame 7 > Frame 28 > Frame 12 [FRAME]: left 12, top 287, width 240, height 20
- Frame 16 > Frame 7 > Frame 28 > Frame 12 > 8 491 BYN [TEXT]: left 12, top 287, width 86, height 20
- Frame 16 > Frame 7 > Frame 28 > Frame 12 > 11 сентября [TEXT]: left 168, top 287, width 84, height 20
- Frame 16 > Frame 7 > Frame 15 [FRAME]: left 12, top 315, width 240, height 25
- Frame 16 > Frame 7 > Frame 15 > Frame 8 [FRAME]: left 12, top 315, width 97, height 25
- Frame 16 > Frame 7 > Frame 15 > Frame 8 > @bala_klava [TEXT]: left 22, top 319, width 77, height 17
- Frame 16 > Frame 7 > Frame 15 > Frame 14 [FRAME]: left 181, top 315, width 71, height 25
- Frame 16 > Frame 7 > Frame 15 > Frame 14 > Rectangle 1 [RECTANGLE]: left 191, top 324.5, width 6, height 6
- Frame 16 > Frame 7 > Frame 15 > Frame 14 > Релиз [TEXT]: left 203, top 319, width 39, height 17

## Assets
Image files included with this spec — use as `<img>` or CSS `background-image`:
- `Frame_16.png` → Frame 16 (264×352, fill, scaling 0.5, transform [[0.75,0,0.13],[0,1,0]])

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
Frame 16 (FRAME, vertical, fixed×fixed)
└── Frame 7 (FRAME, vertical, fill×hug)
    ├── Frame 28 (FRAME, vertical, fill×hug)
    │   ├── Frame 11 (FRAME, horizontal, fill×hug)
    │   │   └── Японский плакат из Японии (Винтажный) (TEXT, fill×hug) "Японский плакат из Японии (Винтажный)
"
    │   └── Frame 12 (FRAME, horizontal, fill×hug)
    │       ├── 8 491 BYN (TEXT, hug×hug) "8 491 BYN"
    │       └── 11 сентября (TEXT, hug×hug) "11 сентября"
    └── Frame 15 (FRAME, horizontal, fill×hug)
        ├── Frame 8 (FRAME, horizontal, hug×hug)
        │   └── @bala_klava (TEXT, hug×hug) "@bala_klava"
        └── Frame 14 (FRAME, horizontal, hug×hug)
            ├── Rectangle 1 (RECTANGLE, fixed×fixed)
            └── Релиз (TEXT, hug×hug) "Релиз"
```

## Component Structure
```
{"id":"874:5671","name":"Frame 16","type":"FRAME","layout":{"width":264,"height":352,"x":1194,"y":64,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":264,"y":352},"overflow":"hidden","mode":"vertical","gap":10,"strokesIncludedInLayout":true,"primaryAxisAlign":"max","counterAxisAlign":"center","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"image","sourceType":"IMAGE","imageHash":"ca3144373b81cea056c6cdde3febeea9edbc8b93","scaleMode":"fill","transform":[[0.75,0,0.13],[0,1,0]],"scalingFactor":0.5}],"borderRadius":24,"imageFillHash":"ca3144373b81cea056c6cdde3febeea9edbc8b93","imageFillScaleMode":"fill","imageFillTransform":[[0.75,0,0.13],[0,1,0]],"imageFillScalingFactor":0.5},"children":[{"id":"874:5672","name":"Frame 7","type":"FRAME","layout":{"width":264,"height":125,"y":227,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":8,"strokesIncludedInLayout":true,"padding":{"top":12,"right":12,"bottom":12,"left":12},"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"gradient","sourceType":"GRADIENT_LINEAR","opacity":0.7,"gradientType":"linear","css":"linear-gradient(#000000 0%, #292929 100%)","gradientStops":[{"color":"#000000","position":0,"opacity":0},{"color":"#292929","position":1}],"transform":[[0,1,0],[-16,0,8.5]]}],"cornerRadii":{"topLeft":12,"topRight":12,"bottomRight":0,"bottomLeft":0},"blurEffects":[{"type":"background","radius":60,"blurType":"progressive","startRadius":0,"startOffset":{"x":0.5,"y":0},"endOffset":{"x":0.5,"y":1}}],"backgroundGradient":"linear-gradient(#000000 0%, #292929 100%)","backgroundGradientType":"linear","backgroundGradientStops":[{"color":"#000000","position":0,"opacity":0},{"color":"#292929","position":1}],"backgroundGradientTransform":[[0,1,0],[-16,0,8.5]],"backgroundGradientOpacity":0.7},"children":[{"id":"874:5673","name":"Frame 28","type":"FRAME","layout":{"width":240,"height":68,"x":12,"y":12,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"vertical","gap":4,"strokesIncludedInLayout":true,"primaryAxisAlign":"min","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"874:5674","name":"Frame 11","type":"FRAME","layout":{"width":240,"height":44,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"primaryAxisAlign":"space-between","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"874:5675","name":"Японский плакат из Японии (Винтажный)","type":"TEXT","text":"Японский плакат из Японии (Винтажный)\n","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Geist","fontStyleName":"Medium","fontSize":18,"fontWeight":500,"lineHeight":22,"letterSpacing":-2,"letterSpacingUnit":"percent","textAlignVertical":"top","textAutoResize":"height","textTruncation":"ending","maxLines":2,"leadingTrim":"none"},"layout":{"width":240,"height":44,"layoutAlign":"inherit","layoutGrow":1,"constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"fill","vertical":"hug"}}}]},{"id":"874:5676","name":"Frame 12","type":"FRAME","layout":{"width":240,"height":20,"y":48,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"primaryAxisAlign":"space-between","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"874:5677","name":"8 491 BYN","type":"TEXT","text":"8 491 BYN","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Geist","fontStyleName":"SemiBold","fontSize":18,"fontWeight":600,"lineHeight":20,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":86,"height":20,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}},{"id":"874:5678","name":"11 сентября","type":"TEXT","text":"11 сентября","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Geist","fontStyleName":"Medium","fontSize":15,"fontWeight":500,"lineHeight":20,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":84,"height":20,"x":156,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]},{"id":"874:5679","name":"Frame 15","type":"FRAME","layout":{"width":240,"height":25,"x":12,"y":88,"layoutAlign":"stretch","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"primaryAxisAlign":"space-between","counterAxisAlign":"min","sizing":{"horizontal":"fill","vertical":"hug"}},"style":{"blendMode":"pass_through"},"children":[{"id":"874:5680","name":"Frame 8","type":"FRAME","layout":{"width":97,"height":25,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":10,"strokesIncludedInLayout":true,"padding":{"top":4,"right":10,"bottom":4,"left":10},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.15,"color":"#000000"}],"backgroundColor":"#000000","backgroundOpacity":0.15,"borderRadius":28},"children":[{"id":"874:5681","name":"@bala_klava","type":"TEXT","text":"@bala_klava","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Geist","fontStyleName":"Medium","fontSize":13,"fontWeight":500,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":77,"height":17,"x":10,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]},{"id":"874:5682","name":"Frame 14","type":"FRAME","layout":{"width":71,"height":25,"x":169,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"horizontal","gap":6,"strokesIncludedInLayout":true,"padding":{"top":4,"right":10,"bottom":4,"left":10},"primaryAxisAlign":"center","counterAxisAlign":"center","sizing":{"horizontal":"hug","vertical":"hug"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","opacity":0.15,"color":"#000000"}],"backgroundColor":"#000000","backgroundOpacity":0.15,"borderRadius":28},"children":[{"id":"874:5683","name":"Rectangle 1","type":"RECTANGLE","layout":{"width":6,"height":6,"x":10,"y":9.5,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"targetAspectRatio":{"x":4,"y":4},"mode":"none","sizing":{"horizontal":"fixed","vertical":"fixed"}},"style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#51E91A"}],"backgroundColor":"#51E91A","borderRadius":20}},{"id":"874:5684","name":"Релиз","type":"TEXT","text":"Релиз","style":{"blendMode":"pass_through","fills":[{"type":"solid","sourceType":"SOLID","color":"#FFFFFF"}],"color":"#FFFFFF","fontFamily":"Geist","fontStyleName":"Medium","fontSize":13,"fontWeight":500,"letterSpacing":-1,"letterSpacingUnit":"percent","textAlign":"center","textAlignVertical":"top","textAutoResize":"width-and-height","textTruncation":"disabled","leadingTrim":"none"},"layout":{"width":39,"height":17,"x":22,"y":4,"layoutAlign":"inherit","constraints":{"horizontal":"min","vertical":"min"},"mode":"none","sizing":{"horizontal":"hug","vertical":"hug"}}}]}]}],"fidelityWarnings":[{"code":"progressive-blur","severity":"critical","message":"Progressive blur has no exact CSS equivalent and requires the Figma-rendered fallback."}]}]}
```

## Capture Bundle Inputs (Authoritative)
- Keep this bundle intact. Resolve every path relative to the bundle root.
- Review `mcp/figma-locator.json` before calling a Figma MCP tool. Prefer each node's exact `locator.sourceUrl`; otherwise pass its `locator.fileKey` and colon-form `locator.nodeId` through the MCP tool's documented inputs.
- Locator data is for discovery or refresh only. An MCP re-capture creates a new immutable capture; it never replaces the evidence in this bundle.
- This capture has no Figma file key, so MCP cannot reopen its source; rely on the bundled evidence.
- Review `fidelity/coverage.json` before implementation. Every listed node must use its exact pixel fallback or an equivalent implementation proven by the final RGBA comparison.
- Use the reference renders below as the visual source of truth and iterate with screenshot comparison.
- Authoritative target: `references/001-874_5671.png` at exactly 264×352 CSS pixels. Do not infer the viewport from Figma's fractional geometry or another asset.
- Reference determinism gate passed: two consecutive Figma renders were RGBA-identical. If a later reference becomes unstable, stop exact verification until the changing content is frozen.
- Provide the final exact-size screenshot so the user can load it into Figma to Prompt's built-in `Verify AI screenshot` checker.
- Reference render: `references/001-874_5671.png`
- Match design assets by their manifest `nodeId`; bundled paths override any generated filename elsewhere in this prompt.
- Design asset for node `874:5671`: `assets/001-874_5671.png`
- Rendered fallbacks are Figma-authored precision assets. Use the PNG variant for the exact 1× target; use the outlined, unsimplified SVG variant when the node must scale. Preserve semantics or interactions with an accessible overlay when needed.
- Rendered fallback (pixel) for node `874:5671` (context-dependent-effect): `fallbacks/001-874_5671.png`
- Rendered fallback (vector) for node `874:5671` (context-dependent-effect): `fallbacks/001-874_5671.svg`

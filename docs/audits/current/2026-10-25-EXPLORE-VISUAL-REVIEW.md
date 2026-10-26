# Explore — PR68 visual review correction

2026-10-25. Base `dac91d1d`; source read-only Figma
`pAPQo6cADmG5XzVmBX76EE`. **Partial: local web verification; physical native acceptance pending.**

## Scope and source

Requested correction of controls, contours, typography and responsive behavior.
Live context/screenshots inspected: `7240:2492/2544/2652/2580/2730`,
`4320:10111`, `4892:11713`, `7245:2519/2502`, `7271:2719/2722`.
Dynamic artwork differs; it is not used as a pixel-diff target.
The supplied review describes four localhost states; its four source images
were not attached to this follow-up. The before images below were captured
from unchanged `dac91d1d` before editing and are independently reproduced evidence.

## Findings and corrections

| Priority / provenance | Figma | Cause / owner | Result and evidence |
| --- | --- | --- | --- |
| P1, pre-existing |7245:2519|`filter-sort-bar-style.ts:11` used gap12|gap8; measured horizontal gap8 and equal button vertical centers at320/375/390/414/768/1024/1440|
| P1, pre-existing |7245:2521|`FilterSortBar.tsx` used nav16/20/−0.32 and ink#2A2A2A|existing authButton14/26/500/−0.28, textSubdued#565656; symmetric16px padding and2px frame/label gap|
| P1, inherited by new toggle |7245:2520/2521;7271:2719/2722|`figma-glass-surface-style.ts` reused dockblur6, white80%, radius14 and divider#E2E2E2; global.css mask0.5 lost bottom/right ring pixels|filterControl only: white surface, radius80, toolbarBorder#D1D1D1, blur50. Web uniform inset0.5px ring above content; native separate border. [Filter strip](../evidence/2026-10-25-explore-visual-review/compare-filter-strip.png)|
| P1, PR68 local exception |7271:2719/2722|WorkViewToggle locally set overflow visible on material/focus owner|removed exception; shared preset separates clipped material and external keyboard focus. Focus tested for filter/sort/toggle, native hit slop retained|
| P2, pre-existing |7245:2502/2812/2818|FigmaSearchChromeStroke used old popup gradient across current Explore controls|uniform0.5px toolbarBorder rect, preserved fractional viewport/radius; removed unused gradient/ID construction. Geometry and full-path bounds assertions retained|
| P2, investigated |7245:2503–2505,4892:11716/11717,7240:2730|possible fallback/heavy captions|actual Inter400/500/600 fonts loaded in both browsers; card author14/17/600/−0.14, title14/17/500/−0.28; search16/19/400/−0.16. Captions, tabs and empty typography unchanged; no guessed weight reduction|
| P2, investigated |7240:2492/2544|ExploreFilters wrap and marginLeft auto|normal text remains a single row at all requested widths; doubled text320 keeps toggle reachable on a new row. No fixed coordinates or new responsive system|
| P2, retained contract |7240:2730|SearchPaneStatus hides inactive controls for unfiltered empty search|matches the live empty source; active filters remain available. Works/Authors queries and behavior unchanged|

## Visual evidence

Each comparison shows source (with system status bar), before and after.
Browser screenshots were captured at390×844 CSS pixels, DPR2, then normalized
to390×844 for this document. Metrics were read before normalization. The source
status bar is approximately50px; compare application content with that offset.
No full-image similarity score is claimed for different works or excluded commerce.

- [Works Compact](../evidence/2026-10-25-explore-visual-review/compare-compact.png)
- [Works Large, category selected](../evidence/2026-10-25-explore-visual-review/compare-large-category.png)
- [Works Compact, open Search](../evidence/2026-10-25-explore-visual-review/compare-search-compact.png)
- [Authors, open Search, empty](../evidence/2026-10-25-explore-visual-review/compare-authors-empty.png)
- [WebKit compact](../evidence/2026-10-25-explore-visual-review/webkit-after-compact-390.png), [WebKit empty](../evidence/2026-10-25-explore-visual-review/webkit-after-authors-empty-390.png)

Measured390: tabs x12/y66/366×50, toolbar y132, toggle x336/42×42,
compact media x12/x201 and177×236, text start y441; media top195,
image/text gap10, caption gap4. Source content y116/183/245 corresponds
to66/133/195 after50px status bar. The1px toolbar difference follows the
established42px frame vs43px outside-stroke paint rule. Source tabs width364,
runtime366 follows existing fluid container; no route-local2px compensation.
Sort is140.72px runtime vs143px source paint, including differing stroke/font
rasterization bounds; label metrics are exact. This remaining fractional extent
is documented rather than stretching the font or hardcoding a total width.

Pixel sampling of the straight sort-control segment at DPR2 (x200–339,
top rows264–265 and bottom346–347) found140/140 colored columns on the
original top but0/140 on its bottom. After correction both are140/140 at
RGB209 (#D1D1D1). [Raw sampling](../evidence/2026-10-25-explore-visual-review/ring-sampling.json).
This checks a specific broken segment, not a full-image similarity score.

The contour comparison exposes the original broken bottom/right edges; after
uses one continuous solid ring with no thickness increase. SVG tabs/search
retain a complete rounded path and0.5 stroke. DPR1/2 antialiasing can distribute
the stroke across neighboring pixels; no global thickness compensation is used.

Source owners (repository paths):
`apps/mobile/src/components/figma/filter-sort-bar-style.ts`,
`FilterSortBar.tsx`, `figma-glass-surface-style.ts`, `FigmaGlassSurface.tsx`,
`FigmaGlassSurface.web.tsx`, `FigmaSearchChromeStroke.tsx`, `WorkViewToggle.tsx`;
`apps/mobile/global.css`; semantic geometry in `packages/design-tokens/src/tokens.ts`.

Wide robustness evidence (exact desktop parity still NEEDS-FIGMA):
[compact1024](../evidence/2026-10-25-explore-visual-review/after-compact-1024.png),
[large1024](../evidence/2026-10-25-explore-visual-review/after-large-1024.png),
[compact1440](../evidence/2026-10-25-explore-visual-review/after-compact-1440.png),
[large1440](../evidence/2026-10-25-explore-visual-review/after-large-1440.png).

## Ownership, reuse and maintenance

filterControl runtime consumers: FilterSortBar in Explore Works/Authors and
WorkViewToggle in Works. navigation (FloatingDockFrame) and controlGroup
(WorkGallery, WorkActions) retain their implementation branches; owner unit
coverage preserves the previous navigation/controlGroup specifications.
No shell/sheet/inset sizes changed, so no consumer spacing migration applies.

WorkCoverCard/Grid/PaddedGrid/Caption, media retries/derivatives and cached API
pages are unchanged. WorkViewMode is imported with `import type`: no runtime
component dependency is introduced, and a new type module is unnecessary.
The native preset branch is the minimal separation needed to paint an opaque
rounded material and border independently of focus/hit geometry. It does add
code; the web gradient renderer removes its obsolete gradient/ID scaffolding.
No backend, DTO, Prisma, dependency, commerce or navigation changes.

## Validation and remaining limits

- 1056 unit tests, dependency-graph typecheck/lint and Web/iOS/Android exports passed.
- Independent final review: Accept; reviewer independently checked Chromium/WebKit
control geometry, material/ring clipping, focus and both work modes.
- Final sequential56-case Chromium/WebKit run passed (2.2m), including all seven
requested widths;193-file docs link check, E2E fence and diff check passed.
- First runs exposed stale24px filter-size expectations, changed to live18px;
physical1.6px stroke is now asserted after scaling by rendered18px/24 viewBox.
Assertions, thresholds, retries and timeouts were not relaxed.
- An earlier run delayed a routed public list and intermittently replaced an image
node during the existing header/media case. The isolated media test passed;
the final sequential56-case run passed without retries or assertion changes. These failures are not called baseline
failures or explained away by CI.
- Physical iOS/Android, native blur/font scaling and exact1024/1440 Figma parity
remain Needs verification / NEEDS-FIGMA. Native exports establish compilation only.
- The separately localized auth-dismissal bug remains unfixed by explicit request.

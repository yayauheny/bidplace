# Author — 2026-09-13

Implementation complete for this pass; full visual acceptance remains Partial.

| Element | Source | Runtime / finding |
|---|---|---|
| Full hero | 621:19475; founder HTML | avatar112 at132; header460 verified by DOM; profile logo42×32 |
| Atmosphere | 621:19476 |485×485, -47/-36, bottom200, blur40; parent fades its last80px instead of clipping a visible edge |
| Profile chips | founder HTML Frame10 | white80%, #DEDEDE border,35px; formerly70% + white border |
| Actions |621:19503/creator exports| grouped white80%, 28px glyphs; internet source ellipse now rendered |
| Compact |526:14482|48px avatar x20/y44; actions right20; tabs y186, row retained in same DOM |
| Tabs |621:19522|one FigmaTabs master; keyboard handling shared with Work |
| About |621:19534/19578|17/21 headings,14/20 body; dated timeline line/ticks added |

Durable fix: move duplicated Hero/tab code into shared profile composition, fade
atmosphere at its section boundary, retain the same actions during compact state.
Rejected hack: swapping whole header trees and collapsing their flow height.

Evidence: [intermediate Olga](olga-intermediate.jpg), [About 390](anna-about-390.jpg),
[compact 390](anna-compact-390.jpg), [1024](anna-1024.jpg), [1440](anna-1440.jpg).
Reference: ../../../design/figma-handoff/portfolio-phone-v1/screens/creator/creator__about__390x1609__node-621-19475/reference.png

Checked real-data author navigation, full→compact→full scroll, Works→About at
scroll, only one accessible share action, white content and document overflow.
1024/1440 keep390px content with document scrollWidth matching viewport.
Technical: typecheck, targeted ESLint, 7 existing tests, Expo web export.

Limits: screenshots use real public photos, so they do not establish pixel equality
of image-derived atmosphere against the different Figma photo. Shared native code
is typechecked, not a native visual target. Full 200% zoom/screen-reader/error/media
matrix is not yet accepted. Final animation polish deferred per founder; source
position transition exists and reduced motion removes its duration. Timeline axis
and42px logo were added after the recorded screenshots and need final capture.
Country is shown from the RFC public contract (ISO code localized); Figma sample
omits it. Unsupported archive/like/VK controls intentionally remain absent.

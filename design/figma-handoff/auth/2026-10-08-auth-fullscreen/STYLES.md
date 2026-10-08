# Exact source measurements

These are source values, not a claim of installed runtime parity. Read the
original nodes for gradient transforms and mixed-style warnings.

| Role | Source measurement at 390×874 |
| --- | --- |
| White surface | 390×874; padding top/right/bottom/left 8/20/20/20; vertical auto-layout, center, gap 16 |
| Content | Width 350, horizontal inset 20 |
| Heading | Inter SemiBold 20/22, 600, tracking −2% = −0.4 px, #121212, centered |
| Plain caption | Inter Regular 14/20, 400, #565656, centered; no exported tracking |
| Main action | 350×51, radius 80, #121212; Inter Medium 14/26, 500, tracking −0.28 px, white |
| Main-action stroke | #2A2A2A → #585858, with the original exported transform; stroke thickness not supplied on these instances |
| Email and nickname field | 350×51, radius 18, border 0.5, #8A8A8A empty border, white fill; input 14/24 |
| Password fields | 350×53, radius 18, border 1, #8A8A8A empty border; input Inter Regular 14/24; gap 12 |
| Code | Six 55×61 cells, gap 4, group 350; radius 18, digit 24/34; one accessible value |
| Resend | 350×51; Inter Medium 14/26, #565656; example 32 sec does not change the 60-second contract |
| Mark frame | x172/y60, 46.29×48, top-anchored, horizontally centered |
| Visible brush mark | 30.35×30.35, roughly x179.87/y67.07, #121212 |
| Bottom wordmark | x149/y793, 93×22, #121212; bottom inset 59 |

The mark has a safety slot distinct from its visible vector. Do not stretch the
30.35×30.35 path to fill 46.29×48, count GROUP translations twice, or replace
the outlined wordmark with text. Both geometries are identical on all four steps.

## Anatomy

Email: title group `4547:23922` at y320, height48, title/caption gap6. Form
`4547:23387` starts y384, height158, gap12. Input `4547:23389`, action
`4547:23398`, consent group `4547:23399`. Selected checkbox frame
`4547:23400` and unselected frame `4547:23403` are two samples of one control:
20×20, radius6, inside gradient stroke1 (`#2A2A2A→#585858` selected,
`#D1D1D1→#EBEBEB` unselected), gap6 to copy. Check path `4547:23402`: 9.33×6.67,
stroke1.5, white. Consent text `4547:23406`: Inter Regular13, `#858585` body,
`#121212` link phrases without underline. One runtime checkbox changes horizontal
copy width; do not
render both sample controls simply to preserve the source box.

Nickname: title group `4547:24139`, y273.5, height100, gap6; positive
`4547:25188` is #267B07, negative `4547:25189` #731A06, both Inter Medium14/20.
These are mutually exclusive sample states. Input/action group `4547:24142`
and suggestions group `4547:24215` live inside `4547:24216`, y389.5, height199.
`niko631/632/633` are sample chips, not a backend suggestion contract. Y positions
include both sample states; do not preserve their combined height with fake text.

Password: title group `4547:24429`, y308.5, height48. Form `4547:24433` inside
`4547:24432` starts y372.5; two 53-high fields with gap12 then 51-high action,
total181. The eye icons have their source geometry in those field descendants.

Confirmation: title group `4547:25027`, y295.5, height68. Mixed copy
`4547:25029` is 14/20, source box350×40; styled ranges unresolved. Code/action/
resend group `4547:25031` inside `4547:25030` starts y379.5, height187. Honest
delivery copy and local pending/errors are semantic adaptations, not literal
reproduction of “пришел” or the example email/digits.

## Boundaries

For the default 390×874 state, match the reference and measured anatomy. Other
viewports, keyboard, errors, zoom and wide centered phone column are derived
states: maintain hierarchy and scrolling without clipping or route-local magic
offsets. Login-sheet values still come from the dialog bundle, including its
51-high password field. Do not replace every auth field by one fullscreen size.

The original mixed ranges, Google fills, policy page, and nickname suggestion
contract remain missing. No missing line-height, gradient thickness, range or
behavior is silently promoted to an exact measurement.

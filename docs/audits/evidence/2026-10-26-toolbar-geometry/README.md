# Exact Work toolbar geometry — 2026-10-26

Baseline:dff0893e. Live read-only Figma session1aafab62-4498-44ea-80e5-4e5bbd12af35:
Work526:11497, Heart526:11499, Author Share4590:35101 and Back4590:35098.
Layer geometry and original SVG exports inspected; no Figma changes.

## Figma versus computed at390×874, DPR2

| Value | Figma | Rendered |
| --- | --- | --- |
| Pill |98×48/radius200/white80%/blur6|same|
| Visual slots |36×36 at(10,6)/(52,6)|same|
| Visual outer padding / gap |10px horizontal,6px vertical /6px|same|
| Icon padding / SVG |4px /28×28|same|
| Icon centers |(28,24)/(70,24)|same|
| Heart path bounds, without stroke |23.3333×19.8335|23.3333×19.8335|
| Heart ink bounds, with stroke |25.0833×21.5835|25.0833×21.5835|
| Share03 path bounds, at28px |18.6667×21|18.6667×21|
| Share03 ink bounds, at28px |20.4167×22.75|20.4167×22.75|
| Physical action stroke |1.75px|1.75px|
| Hit regions |Separate visual/touch geometry permitted|49×48 each, split at x49|

Figma original Work icon is share-04. Previously approved share-03 remains;
its canonical Author source is normalized from20.093px to the Work28px slot.
Hugeicons'24-unit viewBox renders into28px, equivalent to the exported Heart's
28-unit viewBox. Path bounds exclude stroke. Ink bounds are geometric extents
including round stroke; screen antialiasing is not a different SVG dimension.

Visual slots are real36px icon-container elements. The Pressables cover adjacent
49×48 regions with7px inward content bias: Heart slot starts10px into target1,
Share slot starts3px into target2. This yields literal Figma slot coordinates
without overlapping invisible hitSlop, dead gaps or a Web-only hit workaround.
The hit-container CSS padding is0; visual inset10/6 and gap6 are measured
between the actual36px icon wrappers, independently of that touch partition.

## Back evaluation

The original Author chevron uses SVG20.093px, path5.0233×10.0465, ink6.3233×11.3467
and1.3px stroke. Current full Back arrow SVG24px has path14×12, ink15.60×13.60
and1.6px stroke on both Work and Author. Width is larger because the accepted
full arrow includes its horizontal shaft. The previous full-arrow decision stays;
no global Back glyph change or claim of identical chevron geometry.
Author Share remains20px, path13.3333×15, ink14.9333×16.60 and1.6px stroke.

## Evidence and scope

`measurements.json` records actual DOM targets/slots/SVG/path/ink bounds.
`figma-geometry.json` records live layer values and normalized Share03 values.
Local ignored PNGs: `{before,after}-{work,author}-390.png`, enlarged toolbar crops
`{before,after}-{work,author}-toolbar.png`, plus open/focus/hover/pressed Work
states. `states.json` records stable geometry and existing feedback.
Reference crops retain old basket/share-04 and duplicate chevron source; those
out-of-scope legacy actions are not restored.

Only WorkActions composition and optional existing FigmaIconButton layout slots
change at runtime. No dependencies, new control, auth/navigation/modal/QR/feedback
logic or favorite persistence added. Native uses the same explicit49×48 targets
with hitSlop0; physical Native rendering/VoiceOver/TalkBack remain unverified.
No merge or deployment.

Checks:1079 mobile units, affected dependency graph typecheck/lint/test (11 Turbo
tasks),74 existing Chromium/WebKit Back/Share scenarios, plus2 new boundary-action
checks passed. Rendered hover/pressed/focus and exact slot/SVG geometry verified;
changed code Prettier, E2E fence,198-file docs links and diff checks passed.
Web/iOS/Android Expo exports passed.
Initial fractional-pixel boundary assertion was corrected after direct diagnosis
of browser point-hit rounding; integer48/49/50px ownership and actual distinct
actions pass. One initial WebKit worker crashed before opening the new case;
the isolated final WebKit run passed. No product assertions were relaxed.
Self-review: no remaining in-scope findings; other consumers omit the optional
layout overrides and keep their prior geometry/behavior.

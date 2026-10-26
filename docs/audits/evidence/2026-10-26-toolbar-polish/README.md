# Work / Author toolbar polish — 2026-10-26

Source: live read-only Figma `4306:8453` / toolbar `4590:35097` and
`526:11366` / pill `526:11497`. No Figma edits.

Before is57c1ca10. Local before/after use390×874, DPR2, identical routes/images:
`/product/daliEstate1` and `/seller/local-author-1`. PNG binaries beside this
file are local ignored evidence. Full views: `{before,after}-{work,author}-390.png`.
Large toolbar crops: `{before,after}-{work,author}-toolbar.png`.
Reference crops: `figma-{work,author}-toolbar.png`. State crops:
`after-work-{open-toolbar,focus,hover,pressed}.png`. Measured CSS/geometry:
`measurements.json`.

## Geometry and source interpretation

| Element | Before | After |
| --- | --- | --- |
| Back target |48×48|48×48|
| Back SVG |28×28|24×24, centered|
| Back physical stroke |1.6px|1.6px|
| Work actions |98×48, two glass circles|98×48, one glass pill|
| Action targets |48×48 each|48×48 each|
| Heart / Share glyphs |20px|20px|

Author's parent frame scales its roughly18px source chevron to20.093px inside
roughly42px control; Work's old commerce frame uses basket/share-04 with28px
icons. The explicit user-approved full Back arrow/share-03 and48px hit targets
remain;24px Back is the requested proportional adjustment, not a claim of
pixel-identical legacy Figma geometry. Old commerce/second Back are not restored.
Work pill material matches existing glassStrong80%, blur6px, gradient0.5px
border and pill radius. Only the open Share action has a dark local fill for
white-glyph contrast; inactive actions are transparent. Outer overflow stays
visible to preserve focus outlines; material and border keep their own radius.

## Scope and checks

Two runtime files changed: Back-exclusive navigationGlyph token and WorkActions
composition. Existing FigmaGlassSurface/FigmaIconButton behavior stays unchanged.
No new abstraction, dependency or modal logic. Unit owner expectation and
existing browser scenarios now verify24px centering, one glass/border layer,
transparent inactive controls, focus, independent actions and open Share.

Physical iOS/Android rendering and screen readers remain unverified; source
uses the same native glass/control primitives. Wider exact Figma parity remains
outside this390px source. No merge/deploy.

Verified:1079 mobile unit tests; affected dependency graph typecheck/lint/test
(11 Turbo tasks);74 Chromium/WebKit Back and Share regressions;197-file docs
link check; E2E fence and diff check. Web/iOS/Android Expo exports passed. Rendered hover/pressed/focus assertions and
screenshots use the live390×874 page. Self-review: no unresolved in-scope findings;
existing primitive APIs and ownership preserved, no future per-route styling rule.

Prettier reports pre-existing formatting in `packages/design-tokens/src/tokens.ts`;
confirmed both57c1ca10 and this revision fail that formatting check. Only the
one numeric glyph value was changed; unrelated file-wide reformatting skipped.

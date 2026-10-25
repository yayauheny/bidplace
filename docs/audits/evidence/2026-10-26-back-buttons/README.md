# Back button standard —2026-10-26

Source: live Figma292:5058 interaction matrix;526:11366 top control48px
with28px glyph slot. Founder instruction replaces the old basket with a full
Back arrow everywhere; existing Hugeicons arrow-left-02,28px,physical1.6px.

One owner: BackButton → FigmaIconButton size=navigation → MotionPressable.
Default muted48×48; Work glass uses existing controlGroup80%/blur6. Hover
adds semantic overlayOnLight (5% black in light,8% white in provisional black),
pressed reuses button opacity feedback, disabled0.5, existing focus-visible and
reduced motion retained. Existing default/settings icon geometry unaffected.

| Screen | Before | After |
| --- | --- | --- |
| Explore390/1440 |custom transparent52×52,24px glyph |shared48×48,28px |
| Work390/1440 |muted42×42,20px glyph |glass48×48,28px |
| Author390 |muted42×42,20px glyph |shared48×48,28px |
| Author1440 |Back hidden by existing layout policy |same policy |

`before-*.png`/`after-*.png` and measurements JSON are local comparison evidence;
PNGs remain ignored under the repository's manual-evidence policy. Same routes,
viewports390/1440×874 and1×device scale. Background image loading may differ;
compare controls. Own visual review corrected glass stacking to keep arrow visible.

## Audited consumers

- Explore custom back migrated; WorkBackControl uses shared glass.
- CreatorHeader, Account, Settings, both Admin moderation detail headers and
  FilterSheet nested section automatically inherit the common standard.
- Author application step shell: plain override removed, wrapper/native parent48.
- Product creation chrome: plain override removed, contextual label moved to
  accessibilityHint while button label stays “Назад”; native parent48.
- Product story/review previous-step footer controls and Admin completion Back
  reuse BackButton and retain their callbacks.
- Author has one visible Back, no adjacent duplicate. Desktop hiding retained.
- Auth return-to-login/registration links are explicit destinations, not previous
  screen controls; modal close remains X/handle. No auth routes changed.
- Notifications have no standalone Back-screen implementation in current routes.
- Calendar previous month, gallery previous photo, row disclosure and profile
  links remain distinct controls. Gallery arrow removal belongs to next task.

Navigation helpers/history/guards untouched. Native Android hardware Back uses
the existing router/modal owners. No new history, fallback or authorization logic.

Passed:1080 mobile units,20 Chromium/WebKit Back scenarios,80 Share/auth
overlay regressions, graph typecheck/lint, web/iOS/Android exports,195 docs
links, E2E fence and diff check. Independent review accepted after native bounds
and glyph-stacking corrections.
Physical native devices, native hit-testing and black-theme visual acceptance
remain unverified; black palette is provisional by existing project contract.

# Work toolbar and gallery — 2026-10-26

Partial: local Web verified; physical iOS/Android acceptance pending.

Source: live read-only Figma `526:11366`, `4306:8453`, `4594:36589` and
share-03 child `4590:35101`. Founder explicitly keeps Back instead of basket
and overrides local favorites persistence with a future-feature placeholder.

## Matched screenshots

Local PNG pairs (ignored binary evidence) sit beside this file. Each uses
Chromium DPR1, height874 and widths320/375/390/414/1440:
`before-{width}.png` / `after-{width}.png` and
`before-{width}-share.png` / `after-{width}-share.png`.
Before is commit5103a83; after is the final Work toolbar implementation.
`after-390-favorite.png` shows the placeholder notice, not a fake selected heart.

Back remains48×48. The right group measures98×48 with two48×48 controls and
2px gap. Work/Author use the same share-03 SVG paths. Active Share has white
stroke on palette.overlayScrim; the dark surface keeps it visible beneath the
backdrop. Closing restores the ordinary surface and accessibility expanded state.
The accepted428px Share sheet, QR and inline-feedback remain unchanged.

## Verification

- 1079 mobile unit tests; affected graph typecheck/lint.
- 54 Chromium/WebKit Share and toolbar checks: five viewport widths, real open
  state, same Author/Work icon, future-favorite notice/focus, multi/single-image
  pagination, keyboard selection/viewer isolation, horizontal scrolling,
  Clipboard failure/retry, close/reopen, reduced motion and PNG export.
- Back20 and auth46 browser regressions passed during the preceding shared Back
  stage. Independent review corrected keyboard focus and verified the final
  Web scroll callback; no remaining actionable findings.
- Web/iOS/Android Expo exports passed. Native paging/momentum callback and image
  owner retained; Web alone adds scroll synchronization because RN Web does not
  emit native momentum-end events.

Physical device swipes, VoiceOver/TalkBack, native OS share/save and camera QR
scanning remain unverified. Wider exact Figma parity has no matching source frame.
No merge or deployment performed.

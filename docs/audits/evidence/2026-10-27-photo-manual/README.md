# Chrome manual photo acceptance — 2026-10-27

Status: **Partial**. Runtime `ee4b71fd`, branch `feature/photo-workflow`.
Connected Chrome for Testing 149.0.7827.55; existing Expo Web on8081 and
the existing test media server on3017, isolated `bidplace_e2e` database.
An approved author fixture and a disposable three-photo Work draft were created.
Only repository image fixtures were uploaded. No publication, moderation submit,
live CDN or real account credentials were used.

## Actual browser zoom and both Work entry paths

Native Chrome keyboard shortcuts reset zoom and increased it five times.
Chrome accessibility reported **«Масштаб: 200 %»**. The page reported
`innerWidth=600`, `innerHeight=349`, `devicePixelRatio=4`, body CSS zoom `1`.
At restored100% it reported1200×699 and DPR2. No CSS zoom or viewport override.

1. Creation wizard, step2: add three photos, open «Редактировать фото 1»,
   set200%, scroll over the visible content to the end. Done stays visible;
   all three tools become visible. Rotate and Done returned to the gallery.
   [Creation screenshot](creation-200-tools.jpg).
2. Upload all three photos; account → draft «Редактировать» (ordinary editor,
   without creation-flow query) → «Редактировать фото 1». At200%, Done is visible;
   wheel scrolling reaches all tools. Done returned to the ordinary editor;
   the pending prepared photo was uploaded and the screen reported3/3.
   [Edit screenshot](edit-200-tools.jpg), [final draft](draft-final.jpg).

The first apparent tool overlap was an incomplete scroll: the second native
scroll targeted an image already outside the viewport. Scrolling over a visible
tab reached the actual scroll limit and exposed all tools. No layout defect was
established and no runtime patch was made. Original missing Done scenario remains
**not reproduced**; its cause is unknown and is not declared fixed.

## Mouse attempt and remaining limits

A native application drag from the first image toward the second did not produce
a confirmed reorder. A separate CDP mouse down/move/up attempt stalled during
movement. Release/Escape restored the ordinary gallery; order was not confirmed
changed. This is inconclusive input/tool evidence, not a passed manual drag check
or proof of a product defect. No rounded OS ghost was captured. Existing driver
recordings remain separate evidence; no new successful drag video was obtained.

Physical iOS/Android row crossing, scroll up/down, cancellation, button exclusion
and smoothness under JS load remain unverified. This pass did not obtain a Native
runtime. Live CDN remains unverified because object transport is the existing
test adapter. No unit/E2E/build rerun without runtime changes. Zoom was restored
to100%; test tabs and local servers remain open for continued acceptance.

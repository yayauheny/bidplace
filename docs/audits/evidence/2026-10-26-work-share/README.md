# Work share evidence —2026-10-26

Source: live read-only Figma `pAPQo6cADmG5XzVmBX76EE`, sheet `597:18875`
inside `597:18787`; inspected with design context, layer metadata and screenshot.

Local screenshots (ignored by the repository's manual-evidence policy):
`before-390.png`, `after-390.png`, plus matching `1024` and `1440` pairs.
All use `/product/daliEstate1`, viewport height874, deviceScaleFactor1.
The background Work image was still loading in the first before capture;
compare the sheet, not background loading. No Figma screenshot is shipped in UI.

| Metric at390 | Before | After / Figma |
| --- | --- | --- |
| Sheet bounds | x0,y524,390×350 | x0,y446,390×428 |
| Upper radius |20 |32 |
| Horizontal inset |13 including stroke |20 |
| Header |left, cross |center, handle36×4 |
| Title |profileHeading role |Inter600,18/22,−0.36,#2A2A2A |
| QR image |164×164 |164×164 in188×188 slot |
| Actions |matrix sizing |350×55,gap8,Inter500,14/26,−0.28 |

At1024/1440, existing host policy retains a390px centered sheet; desktop keeps
an accessible cross. Exact desktop Figma parity is NEEDS-FIGMA: only390 supplied.
At320 the sheet fills the viewport and actions remain280×55. Short viewports
retain the shared scroll owner and max-height.

`work-qr.png` is the actual browser download: PNG656×656, four-module quiet zone,
black on white, correction M. Apple Vision independently decoded
`http://localhost:8081/works/daliEstate1`, matching the copied URL and API
`sharePath`. Production web uses its origin; native retains the established
`https://bid.place` origin. Physical phone-camera scanning was not available.

Checks: mobile unit suite1070;20 Chromium/WebKit share checks; graph typecheck/lint;
web/iOS/Android export. Shared AppDialog and button specs retain default/media
behavior; native dialog focus/Back and file/clipboard adapters have unit coverage.
Independent review accepted after44px handle hit-area and native export race fixes.
Native devices, actual OS save destinations/clipboard and phone camera remain
unverified. Native modules require a rebuilt custom development client.

## Inline feedback follow-up

Local frame sequence: `feedback-0-idle.png` → `feedback-1-copied.png` →
`feedback-2-reset.png`; `feedback-3-download-started.png` and
`feedback-4-copy-error.png` cover download initiation and inline retry.
The short recording is retained locally under `/tmp/bidplace-share-feedback-video/`.
Mouse is moved off controls before capture to distinguish hover from feedback.
All states retain x0,y446,390×428 at390×874. Button surfaces and typography do
not change; content crossfades/scales over160ms and confirmation resets after1800ms.

`useShareAction` serializes repeated presses and clears timer/lifetime state on
close/unmount. ShareContent stays through shared exit motion, with inactive
feedback reset on close; rapid reopen cannot receive an older completion.
Errors use the same button with a retry label, without a check or extra row.
Web confirms “Загрузка начата”; native confirms “PNG подготовлен”, without
claiming that the OS saved a file. No immediate loading spinner or success toast.

Passed:1076 mobile units,34 Chromium/WebKit share checks, graph typecheck/lint,
web/iOS/Android exports, E2E fence and link/diff checks. Independent follow-up
review accepted, including47 targeted units and4 Chromium regressions.
Native device/VoiceOver/TalkBack/save-destination acceptance remains unverified.

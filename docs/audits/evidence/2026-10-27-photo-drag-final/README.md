# Mouse drag evidence — 2026-10-27

[Play both original recordings](index.html).

- [Chromium](chromium-mouse-drop.webm)
- [WebKit](webkit-mouse-drop.webm)

Unedited Playwright page recordings, 390×874, Node 22.20.0, synthetic fixture.
`work-media-lifecycle.spec.ts` / `mouse drop commits over the vacant slot, grid
gap and add slot, and cancels outside` uses mouse.down/move/up from image pixels.
The pointer is held400ms at each insertion point so the recording shows settled
neighbor shifts; canonical IDs are asserted unchanged until
release, committed over empty insertion/gap/add areas, unchanged on outside
release, with zero server reorder requests during the interaction. The add tile
never becomes an ordered image. Moving neighbors leave hit-testing while the stationary source remains active.
Earlier dispatchEvent coverage remains auxiliary.

These videos capture page content, not the OS-composited drag ghost or actual
browser zoom. System ghost rounding, real browser zoom 200%, original user CTA
failure and physical Native runtime remain unverified/not reproduced. Native
button-surface separation, cross-row insertion with scroll delta, both scroll
edges and cancellation are covered only by owner tests plus bundle export.
No Native runtime is available: simctl is absent. Local browser connector is
disabled; CUA binding did not expose the dedicated headed test window screenshot.
Existing user windows/tabs were not closed or reconfigured.

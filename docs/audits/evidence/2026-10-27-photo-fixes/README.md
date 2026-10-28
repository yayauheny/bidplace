# Photo corrections evidence — 2026-10-27

[Open gallery](index.html). All 31 PNG files are unretouched Playwright captures.
Source: `apps/mobile/e2e/work-media-lifecycle.spec.ts`, Node 22.20.0, local test API/DB;
Chromium and WebKit, primarily 390×874. Existing-draft editor and touch scroll use
390×420. `editor-zoom-200` sets CSS body zoom to 2; this is not physical browser
chrome/OS zoom acceptance. Exact 1024/1440 Figma parity remains NEEDS-FIGMA.

- `editor-original`: crop layer opacity 0, inert, excluded from focus/pointer input.
- `existing-draft-editor-short`: ordinary editing entry; confirm remains in viewport.
- `avatar`: waits for decoded local image, not only the accessible wrapper.
- `order-save-error` / `order-saving`: files accepted, order has its own feedback.
- `retry-reconciling`: targeted card busy while operation result is still gated.
- `drag-insertion`: neighbors reserve the insertion slot; canonical order unchanged.
- `touch-drag-scroll`: Chromium CDP touch, long press, edge scroll, then cancel.
- `drag-frame-1..3` and `retry-frame-1..3`: sequential actual PNG captures with
  80 ms waits plus screenshot time. No retiming/interpolated frames. They show
  neighbor/spinner rendering, not the OS-owned mouse drag ghost.

No physical Native, real iOS browser chrome, production CDN or native drag-control/
autoscroll acceptance is established by these captures. Wider layout usability
was checked by the existing media cases, without claiming an exact wide design.

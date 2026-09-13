# S1 — ShareSheet

Source: Figma `597:19045`, 390×388 bottom sheet.

## Evidence in git

| File | What this pass can claim |
|---|---|
| `runtime/share-390.png` | Historical 390 composition from `54681ba` |
| `runtime/share-1024.png` | Historical 1024 centered sheet from `54681ba` |
| `runtime/share-1440.png` | Historical 1440 centered sheet from `54681ba` |
| `runtime/share-qr-error-390.png` | Historical mocked QR-error composition from `54681ba` |
| `runtime/share-work-chromium-390.png` | This pass: work ShareSheet after Playwright download + Escape |
| `runtime/share-work-webkit-390.png` | Same path on WebKit |

No `share-author-390`, `share-long-url-390`, or invalid-path PNG is in git.
Those names are not evidence.

## This pass (`fix/figma-stabilization`)

- Playwright Chromium and WebKit on `/product/{publicId}` at 390: dialog
  focused inside `[role="dialog"]`; `Скачать QR` fired a `download` event
  with `bidplace-*.png`; Escape closed the sheet and returned focus to
  `Поделиться работой`.
- Author ShareSheet, long-URL composition, and QR-error UI were **not**
  re-run as Playwright this pass. Invalid public paths stay rejected by
  `publicShareTarget` in `public-share.spec.ts` (`/admin`, off-origin,
  short work ids). The historical `runtime/share-qr-error-390.png` is the
  QR-error picture in git.
- Ordinary Chrome/Safari “Save as” outside Playwright was not re-tested.

Status: **Implemented** for the work ShareSheet Playwright path above.
Author sheet remains the shared component from `48c38b7`, without a new
author PNG. Ordinary-browser file save stays **Partial**. The Figma node
does not define bespoke error illustrations; runtime uses the shared
text/retry state inside the fixed QR square.

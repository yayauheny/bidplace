# S1 — ShareSheet

Source: Figma `597:19045`, 390×388 bottom sheet.

- Figma: 164×164 QR, 14 px composition gap, 56 px primary/ghost actions,
  8 px action gap, 20 px top radius.
- Runtime 390: dialog `390×376`, QR `164×164`, document width `390/390`.
- Runtime 1024/1440: dialog width `390`, centered at `x=317/525`; horizontal
  overflow `0`.
- PNG download: browser `download` event received,
  `bidplace-seedAnna001.png`, 12,835 bytes.
- Keyboard: initial focus on close; repeated Tab stayed inside dialog; Escape
  closed it and returned focus to `Поделиться работой`.
- Edge states: 60-character public slug generated QR without overflow; invalid
  `/admin` rendered `Публичная ссылка недоступна`; oversized QR payload rendered
  the visible retry/error composition.

Status: **Implemented** for the existing work/author ShareSheet contract.
The Figma node does not define bespoke error illustrations, so runtime uses the
shared text/retry state inside the fixed QR square.

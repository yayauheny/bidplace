# Acceptance sweep — 2026-09-13 (mobile web, 390)

Scope per founder decision 2026-09-13: mobile web only. 1024/1440 and native are
not acceptance targets. Stand: Expo Web `:8083`, API `:3002`
(`bidplace_preview`), Chromium via Playwright; WebKit only for typography.
HEAD at sweep time: `8d5009b` (H1 `f2d05c8`, H2 `72429bd`).

## Work `/product/seedAnna001` (map §3.1)

| Gate | Result | Evidence |
|---|---|---|
| Overflow | `scrollWidth 390 = innerWidth` | `work-390-top.png` |
| Tabs → URL | `?tab=details` written with `replace` (no history entry per tab); Forward restores `Детали` | console log in this file's history |
| Last content above dock | «Смотреть все» bottom 748 < 844 after full scroll | `work-390-bottom.png` |
| Network error | after react-query retries: «Не удалось загрузить работу … Повторить», 1 retry button | `work-390-error.png` |
| Broken gallery media | gallery announces «Изображение недоступно», layout keeps 390×520 | `work-390-broken-media.png` |
| Zoom 200 % (195 CSS px) + reduced motion | no horizontal overflow (`195 = 195`), title wraps, controls stay reachable | `work-zoom200-reduced.png` |

Rows W1–W14 remain ✓ from `03-work/REPORT.md`; W15 (facts label weight) is now
covered by H2 (`font-synthesis: none` on WebKit). W16 (gallery arrows) stays a
recorded deliberate addition pending founder word. Work: **Visual accepted for
the 390 mobile-web scope**, minus W16 decision.

## Author `/seller/anna-morozova` (map §3.2)

| Gate | Result | Evidence |
|---|---|---|
| Overflow | `390 = 390` | `author-390-top.png` |
| Compact header | scroll-linked; frames 0–150 % | `../02-author/compact/` (H1) |
| About tab | opens in place; tab state is local (URL unchanged), Back leaves the page | `author-390-about.png` |
| Controls | Работы 8 / Об авторе / Все / 3 category chips | log |
| State matrix | long handle, 0/2/3 socials, no achievements | `../02-author/matrix/` (A4) |
| Text weight | faux bold removed on WebKit | `../typography/` (H2) |

A1–A5 ✓. Remaining: compact handle width with 3 socials is data-bound (~54 px);
About tab is not deep-linkable (not in Figma or RFC, recorded as boundary).
Author: **Visual accepted for the 390 mobile-web scope**.

## Cover cards (map §3.3)

C1–C4 ✓ (`04-cards/`). C5 edge data and web gradient stroke captured by the
parallel S8 package (`../S8/REPORT.md`, code landed in `72429bd`). Native frost
parity is deferred: `docs/tasks/2026-09-12-figma-finish/18-H3-native-frost.md`.
Cards: **Visual accepted (web)**; native `Needs verification`.

## Home `/` (map §2 row 07)

| Gate | Result | Evidence |
|---|---|---|
| Overflow | `390 = 390` | `home-390-top.png` |
| Bottom / dock | last link bottom 748, dock top 768 — content ends above the dock | `home-390-bottom.png` |
| Error | «Не удалось загрузить главную … Повторить», retry present | `home-390-error.png` |
| Composition | logo 42×32 @ (174, 60), headings 24/29 −0.72, cards 366×488 gap 20 | `../07-home/REPORT.md` |

Section→section 40 px has no Figma node (vertical list not drawn); recorded as a
boundary, not a defect. Home: **Visual accepted for the 390 mobile-web scope**.

## Not verified / out of scope

- 1024/1440 desktop and native iOS/Android (founder scope).
- Physical screen-reader pass.
- ShareSheet, filters, catalogs, auth: parallel package S1/S2/S4/S7/S8.

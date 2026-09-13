# Author header motion — regression matrix

Date: 2026-09-13  
Stand: isolated worktree `fix/author-header-motion` @ `70c5fd5` + local
changes; Expo Web `http://127.0.0.1:8085` started from `apps/mobile`.
API `:3002` CORS allowlist is `http://localhost:8083`, so live seed authors
were not loaded from this port. Frames use the same public contracts via
`page.route` on a fresh browser context (not a cached 8083 tab).

Chosen fix: **A** — capture-phase scroll on the labeled `creator-scroll`
boundary. B (periodic `findScrollPort`) and C (IntersectionObserver / binary
toggle) were not used.

## Matrix

| Case | Chromium | WebKit | Result |
|---|---|---|---|
| Delayed spacer makes the inner ScrollView scrollable after mount | 390×860 | 390×860 | Pass — progress leaves 0 without rebinding |
| 0 / 2 / 3 public socials | 390×844 | 390×844 | Pass — compact handle width 2≈3, 0 is wider |
| Works ↔ About while compact | 390×860 | 390×860 | Pass — progress stays 1, one Share |
| Scroll 0→25→50→75→100 and reverse | both viewports | both viewports | Pass — continuous 0..1, reverse returns 0 |
| Reduced motion | 390×860 from `/authors` | same | Pass — mid stays 0, end snaps 1 |
| Overlap / horizontal overflow at 0 and 100 | both | both | Pass |

## Chromium 390×860 DOM (offset 274)

| % | progress | avatar x,y,w | handle x,y,w | actions y | tabs y |
|---|---|---|---|---|---|
| 0 | 0 | 139,132,112 | compact hidden; expanded 12,250,366×29 | 372 | 460 |
| 25 | 0.25 | 109,110,96 | 28,202,102×19 | 289 | 391 |
| 50 | 0.50 | 80,88,80 | 44,154,102×19 | 208 | 323 |
| 75 | 0.75 | 50,66,64 | 60,106,102×19 | 125 | 254 |
| 100 | 1 | 20,44,48 | 76,58.5,102×19 | 44 | 186 |
| reverse | 0 | 139,132,112 | same as 0 | 372 | 460 |

Compact handle computed type: `Inter_500Medium` 16px / 500 / −0.32px.
One Share. At progress 1 the third social is `visibility: hidden`.
390×844 matches the same compact geometry.

Mid-frame `overlap: true` is the expanded+compact handle crossfade, not the
compact row. End states do not overlap.

## Files

- `chromium-390x860-{0,25,50,75,100,reverse}.png`
- `chromium-390x844-{0,25,50,75,100}.png`
- `webkit-390x860-{0,25,50,75,100,reverse}.png`
- `webkit-390x844-{0,25,50,75,100}.png`
- `measurements-chromium-390x860.json`
- `measurements-webkit-390x860.json`

## Limits

- Native `CreatorHeader.tsx` is unchanged.
- Live `/seller/anna-morozova` on :8085 is blocked by API CORS (`8083` only).
- WebKit `getComputedStyle().fontFamily` on the RN text node can be empty;
  geometry and Chromium computed style carry the 16/500 proof.
- Compact handle width follows the slug; `@motion-three` ellipsizes inside a
  stable slot (~102px), not the old ~54px three-social squeeze.
- Compact actions `getBoundingClientRect` can report `right: 400` because the
  collapsed overflow node still occupies leftover layout; the visible
  2-social + Share cluster ends near x=368 and does not overflow the document.

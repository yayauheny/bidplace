# Cover cards — runtime capture 2026-09-13

Stand: full rebuild (`turbo build --force`), API restart, Expo Web `--clear` on `:8081`. Database not reset. Viewport set to 390×844. No card/frost code changed.

| File | Screen | What |
|---|---|---|
| `04-cards-home-390-first-work.png` | `/` home | First fold, first work card + next card + dock |
| `04-cards-work-1-full.png` | `/` home | Work: Текстильная композиция «След света» |
| `04-cards-work-2-full.png` | `/` home | Work: Текстильная панель «След дождя» |
| `04-cards-work-3-bowl.png` | `/` home | Work: Чаша «Медленный круг» |
| `04-cards-author-1-full.png` | `/` home | Author: Светлана Громова |
| `04-cards-author-2-full.png` | `/` home | Author: Никита Орлов |
| `figma-874-5458-work.png` | local handoff | Figma work `874:5458` |
| `figma-874-5540-author.png` | local handoff | Figma author `874:5540` |

Photos are seed data, not the Figma sample images. Compare frost shape, zones, type placement — not pixel-diff of the artwork.

## Same-photo comparison 2026-09-13 (after hug-frost change)

Captured on `:8083` at 264 px card width (viewport 288) with the Figma sample
photo (Dalí, `/tmp/bidplace-figma-raw/image-1.png`, also the seed fixture
`surreal-landscape.png`) routed into the first home card; author card with the
Figma copy («Илья Васильев», `@vex`, «Керамика»).

| File | What | DOM |
|---|---|---|
| `04-cards-runtime-work-264-dali.png` | Work card, same photo as `figma-874-5458-work.png` | frost 252→352 (100, hug), title 18/22 −0.36 at y 264, chip 24 h at y 316 |
| `04-cards-runtime-author-264.png` | Author card, Figma copy | top zone 0→56, bottom 276→352 (76), chip «Керамика» 83.2×24 (Figma 83×24) |
| `04-cards-runtime-author-page-work-366.png` | 366×488 card on `/seller/svetlana-gromova` | frost 78 (one-line title), not 173 as before |

Runtime cards have no price row, so the bottom frost is 24 px shorter than the
Figma sample with the same title; the hug rule is the same.

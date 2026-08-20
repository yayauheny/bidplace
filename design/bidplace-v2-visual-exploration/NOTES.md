# 03 — Notes

Short annotations only. No token or component documentation.

Fixtures: `content-fixtures.yaml`. All people, works, and media are `fixture_invented`.

Assigned accent for featured work `w-1024`: yellow. Visible strong accent is optional — used only in Home C and `work_card / graphic`.

---

## HOME / A — Type

- **Dominant event:** oversized statement «Работы с историей — напрямую от авторов».
- **Reading order:** 1 statement · 2 path into the work / routes · 3 three works after a ~200px pause.
- **WePresent:** leftover columns stay empty; lower group does not fill the 12-col grid.
- **Get Hyped:** type scale and off-center placement; featured work is a small supporting object.
- **Whitespace:** center of the first viewport is intentionally unused.

## HOME / B — Media

- **Dominant event:** «Тихий берег» as a near-full-height object.
- **Reading order:** 1 the work · 2 title / Полина Мирош ↗ / open · 3 tiny statement + two more works after pause.
- **WePresent:** image-first; metadata small and precise; nav quiet.
- **Get Hyped:** media starts at the top edge; type is pushed to a narrow right strip.
- **Whitespace:** no second hero image to occupy the remaining grid.

## HOME / C — Graphic

- **Dominant event:** one cluster — statement + work + one yellow field.
- **Reading order:** 1 the cluster · 2 identity under the work + open · 3 two new works after pause, different scale. Type overlaps the yellow field only, not the painting.
- **WePresent:** still a platform: routes, create, search remain; continuation is obvious.
- **Get Hyped:** controlled overlap; one vivid graphic gesture; irregular balance.
- **Whitespace:** right of the first viewport stays empty; yellow is not repeated.

---

## work_card / minimal

- **Dominant event:** artwork.
- **Reading order:** image → title → creator.
- **WePresent:** no card chrome; page canvas is the surface.
- **Get Hyped:** none required; restraint.
- **Whitespace:** caption sits close; the test itself sits in a large empty board.

## work_card / editorial

- **Dominant event:** still the artwork; type is a companion, not a footer strip.
- **Reading order:** image → title → creator → one descriptor.
- **WePresent:** Case Studyo-like sequence; descriptor is optional, not a metadata row.
- **Get Hyped:** scale contrast between title and meta.
- **Whitespace:** gap between image and type is deliberate, not a 24px token.

## work_card / graphic

- **Dominant event:** artwork; yellow is a mark, not a wrapper.
- **Reading order:** image (+ small accent) → title → creator.
- **WePresent:** accent does not become a pastel frame.
- **Get Hyped:** one sharp color gesture, assigned yellow of w-1024.
- **Whitespace:** mark is 48×8 at the edge; no colored backing card.

## work_card / dense

- **Dominant event:** still artwork, quieter and smaller.
- **Reading order:** image → title → creator.
- **WePresent:** A24/Brain Dead: many items can coexist if objects stay isolated.
- **Get Hyped:** not used; density is local.
- **Whitespace:** tight locally; the cell is not a bordered marketplace card. Small radius on image only — not a system-wide pill.

---

## Still open (do not lock)

Display family and sizes · radius language · whether strong accent is visible · which Home composition (or combination) · which card anatomy.

---

## Pass 2 — refinement

Pass 1 files are unchanged. Refined copies: `home-a-r.html`, `home-b-r.html`, `home-c-r.html`, `work-card-r.html`.

### HOME / A2 — Type

- **Dominant event:** statement, with the featured work in the same block.
- **Changed:** phrase break after the dash; type and painting share one grid; shorter pause; two lower works of different scale.
- **Removed:** «или Авторы, Работы»; third lower work; filled create button.
- **Remaining weakness:** 72px display still provisional; the editorial pairing may be too magazine-like for Home.

### HOME / B2 — Media

- **Dominant event:** the painting, still near full height.
- **Changed:** copy closer and lower, aligned to the work; secondary pair is large ceramic + smaller drawing, offset; quieter nav.
- **Removed:** «Сейчас»; floating manifesto; «Ещё сейчас»; equal 2-up cards.
- **Remaining weakness:** dark nav on the sky; title-to-horizon alignment is optical, not measured.

### HOME / C2 — Graphic

- **Dominant event:** the painting. Yellow is a narrow spine behind its left edge.
- **Changed:** larger work; smaller type; color reduced from a slab to a strip.
- **Removed:** large yellow field; manifesto subline in the first frame.
- **Remaining weakness:** even a thin yellow mark may still read as a design demo. Open whether Home needs color at all.

### work_card / default (was minimal)

- **Intended use:** discovery.
- **Hierarchy:** image → title → creator.
- **Survive:** yes, candidate for default.

### work_feature (was editorial)

- **Intended use:** Home featured / creator featured. Not search grids.
- **Hierarchy:** image → title → creator → one descriptor → open.
- **Survive:** yes.

### work_card / dense

- **Intended use:** Explore / results. Six-work scan test.
- **Hierarchy:** image → title → creator.
- **Survive:** yes, if the grid stays readable.

### work_card / graphic

- **Survive:** no. Rejected. Assigned accent on a discovery cell is decorative. Color belongs to page composition, if at all.

---

## Next pass — Work Detail (do not build yet)

Reduced chrome ≠ reduced product. Full note: `WORK-DETAIL-NEXT.md`.

Carry forward from current explorations: quiet hero identity `Полина Мирош ↗` (Home B2, work_feature).

Must add on Work Detail, using `work_rich_live` (six images, story, process):

1. **Gallery** — prev/next, secondary to the artwork, optional `1 / 6`, no hero thumbnail strip.
2. **Story chapter** — after a macro pause: `История работы` → text + supporting media → optional process. Not a hero subtitle, not an accordion.
3. **Creator chapter** — later, heavier than the hero link: portrait → name → short practice → profile. Hero answers who; the chapter answers why care.

---

## Pass 3 — HOME / REFINED — PRODUCT

One full Home. Previous A/B/C kept. File: `home-product.html`.

- **Hero:** C-family kept. Two natural lines. Work overlaps a cropped yellow anchor (~25–30% less visible field than the previous product slab). Actions only `Полина Мирош ↗` and `Открыть работу →`. No gallery on Home featured (static selection).
- **Current:** `Сейчас на аукционе` — large ceramic + offset textile + landscape linen. LIVE works only. `Все работы →`.
- **Authors:** large `Авторы` — large Polina + offset Artyom + Alexandra + Ksenia photo_missing as a quiet `К`. `Все авторы →`.
- **New works:** five default cards, mixed sizes including one landscape. `Все работы →`. Fixture overlap with current remains.
- **Creator CTA:** type on canvas. `Создаёте вещи с историей?` / `Покажите свою работу миру` / `Стать автором →`.
- **Footer:** one quiet row.

Cards: default / feature / dense survive. Feature carries quiet `‹ 1 / 6 ›` under the media (not on the painting) for later Work Detail. Graphic remains **rejected**.

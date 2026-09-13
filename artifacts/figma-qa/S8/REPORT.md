# S8 — web chip gradient and card edges

Sources: Figma `874:5458` (264×352 Work cover) and chip border definitions in
the read-only handoff.

- Runtime cards: `264×352` in the related-work rail and `366×488` in `/works`.
- Compact chip: 24 px high after mapping React Native horizontal/vertical
  padding to web CSS; the border overlay computes to the white-16% →
  grey-16% linear gradient with `mask-composite: exclude`.
- 390/1024/1440: the phone column remains centered and document overflow is
  `0`.
- Dark/light artwork is covered by the catalog matrix. An intercepted
  75-character author slug stays inside the card's clipped overlay row and
  does not create document overflow.
- Missing media keeps the card at `366×488` and exposes
  `Изображение недоступно: …` to accessibility. There is no Figma missing-media
  card frame, so visual parity for that state is **Partial**.

Status: **Implemented** for web `onDark`/`tinted` gradient strokes; native keeps
the documented flat-border compatibility path. Missing-media visuals remain
`Partial` pending a Figma state.

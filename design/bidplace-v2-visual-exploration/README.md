# bidplace v2 visual exploration

**Not production canon.** Not a Pen file. Not the V2.1 spec packet.

This folder is the visual exploration space used to validate V2.1 art direction **before** the design system is locked and before any Pen build.

Open at **1440px** width, 100% zoom:

- `index.html` — contents
- Pass 3 (product home): `home-product.html`
- Pass 2 (refined): `home-a-r.html`, `home-b-r.html`, `home-c-r.html`, `work-card-r.html`
- Pass 1 (preserved): `home-a.html`, `home-b.html`, `home-c.html`, `work-card.html`
- `NOTES.md` — short annotations
- `WORK-DETAIL-NEXT.md` — product layers to keep on the next Work Detail pass

## Source

Reads V2.1 product constraints and fixtures from `design/creator-first-v2/`. Visual tokens (display size, radius, accent usage, overlap) are **provisional starting values**.

## Scope

Pass 1: three Home compositions + four card tests.

Pass 3: one full Home candidate (`home-product.html`) on the approved hero. Previous A/B/C kept for comparison.

Not built: Creator Profile, Work Detail, auth, onboarding, filters, auction boards, component library, mobile, tablet, future features.

## Rules in force

- WePresent = structure / whitespace / image-first
- Get Hyped = attitude / scale / asymmetry / bold color
- One dominant event per viewport
- Empty space is not unfinished
- No price / deadline / bid count on discovery cards
- Do not clone references
- Do not select a final Home in this pass; treat Home B as the strongest structural baseline

## Next pass — Work Detail (not built)

Quiet Home/card UI does **not** mean a thinner product. Preserve three layers when Work Detail starts:

1. Gallery prev/next (secondary to the artwork; optional `1 / N`; no hero thumbnail strip)
2. Story as a chapter after a macro pause (`История работы` + text + supporting media + optional process)
3. Creator twice: quiet `Имя ↗` in the hero; richer portrait/practice/profile chapter later

See `WORK-DETAIL-NEXT.md`. Do not start that pass from a single-image, story-less fixture.

## Out of bounds

Do not edit `design/pen/*.pen`, `design/creator-first/`, or `design/creator-first-v2/` from this exploration.

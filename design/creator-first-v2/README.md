> Historical exploration, not an active design instruction. Current work starts from `docs/design/00-DESIGN-INDEX.md`.

# bidplace creator-first V2 — art-direction packet

Working copy of the creator-first design contract. Visual direction is rewritten. Product/UX contracts, fixtures, states, and MVP constraints are preserved from V1.

**This packet is not production canon.** Production UI still reads `design/pen/bidplace-web-v2.pen`.

V1 (unchanged original): `design/creator-first/`.

## Start here

1. `spec/DESIGN-DIRECTION.md` — V2 visual direction.
2. `FOUNDER-DECISIONS.md` — original decisions + 2026-08-14 art-direction revision.
3. `spec/design-system.yaml`, `spec/component-specs.yaml`, `spec/screen-blueprints.yaml`.
4. `spec/content-fixtures.yaml` — **unchanged** from V1.
5. `spec/pen-build-plan.md` — golden screens first; **do not build Pen yet**.

Do not open or edit `design/pen/bidplace-web-v2.pen` or `design/pen/bidplace-creator-first-v1.pen` from this packet.

## What V2 corrects

V1 is a strong product specification. Its visual direction felt old, beige, literary, and template-like because WePresent was used for atmosphere and Get Hyped was reduced to tilted cards in rounded colored containers.

V2 split:

- **WePresent** → IA, whitespace, image-first storytelling, clarity.
- **Get Hyped** → visual attitude, type scale, composition, bold color, asymmetry, overlap.

## Golden screens (approve before Pen)

1. Home — desktop 1440
2. Creator Profile — desktop 1440
3. Work Detail LIVE — desktop 1440

## Directory roles

```text
spec/            V2 source of truth (except content-fixtures.yaml = V1)
assets/          copied fonts, icons, logo, media
prompts/         V1 prompts; do not run Pen builder until golden screens are approved
pen-prompts/     V1 mechanical prompts; superseded by spec/pen-build-plan.md V2 gate
implementation/  copied; not updated for V2 tokens yet
references/      screenshot assets still gitignored; use the V1 references/ folder if needed
```

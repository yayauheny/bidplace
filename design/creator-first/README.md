> Historical exploration, not an active design instruction. Current work starts from `docs/design/00-DESIGN-INDEX.md`.

# bidplace creator-first redesign packet

This directory is the isolated input/output boundary for the new design exploration. It intentionally does not inherit the existing Pen v2 visual system.

## Start here

1. Read `../../docs/audits/00-CURRENT-MVP-READINESS.md`.
2. Read `../../docs/design/01-DESIGN-FOUNDATION.md`.
3. Read `FOUNDER-DECISIONS.md` and `REFERENCE-MANIFEST.yaml`.
4. Read the screenshot-by-screenshot interpretation in `REFERENCE-ANALYSIS.md`.
5. Use the operational constraints in `../../docs/design/03-DESIGN-SYSTEM.md`.
6. Run the prompt in `prompts/01-DESIGN-ARCHITECT-PROMPT.md`.
7. After founder approval, run `prompts/02-PEN-BUILDER-PROMPT.md`.
8. Review exports with `prompts/03-VISUAL-QA-PROMPT.md`.

## Directory roles

```text
references/  local screenshot assets; binaries ignored by Git
prompts/     ready-to-use staged prompts
spec/        strongest-model output and later QA deltas
exports/     future Pen screenshot evidence; not created yet
```

## Reference set status

Founder collection is complete. The packet contains desktop and mobile WePresent evidence, a broad Get Hyped work/story set, concrete Avant Arte work/transaction/profile anatomy, Medallion mobile search/onboarding/validation evidence, a creator-publishing flow, persistent-Create and bid-dialog patterns from Foundation, a COLORS auth reference, and Mobbin author-card/blur-caption references.

The strongest visual pass may proceed now. These optional gaps must be reported as unresolved only when a design decision genuinely depends on them; they do not authorize broad research:

1. Get Hyped mobile work/card/gallery views.
2. Avant Arte mobile process/detail/transaction views.
3. Pinterest desktop and mobile Explore/recommendation behavior.

Missing optional screenshots do not authorize the architect to browse broadly or invent interaction. The manifest defines when a targeted live check is allowed.

## Protected history

`design/pen/bidplace-web-v2.pen` remains unchanged and must never be opened by the design architect or Pen builder for this direction.

The in-progress canvas is `design/pen/bidplace-creator-first-v1.pen` (F001–F013 as of 2026-08-14). It is not the canonical visual source until founder approval. Service docs point to it from `docs/design/00-DESIGN-INDEX.md` and `docs/design/04-DESIGN-STATUS.md`.

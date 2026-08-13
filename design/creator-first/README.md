# bidplace creator-first redesign packet

This directory is the isolated input/output boundary for the new design exploration. It intentionally does not inherit the existing Pen v2 visual system.

## Start here

1. Read `../../docs/audits/creator-first-redesign/00-PRODUCT-MVP-DESIGN-AUDIT.md`.
2. Read `../../docs/audits/creator-first-redesign/01-CREATOR-FIRST-DESIGN-BRIEF.md`.
3. Read `FOUNDER-DECISIONS.md` and `REFERENCE-MANIFEST.yaml`.
4. Use the operational constraints in `../../docs/audits/creator-first-redesign/02-DESIGN-AGENT-RUNBOOK.md`.
5. Run the prompt in `prompts/01-DESIGN-ARCHITECT-PROMPT.md`.
6. After founder approval, run `prompts/02-PEN-BUILDER-PROMPT.md`.
7. Review exports with `prompts/03-VISUAL-QA-PROMPT.md`.

## Directory roles

```text
references/  local screenshot assets; binaries ignored by Git
prompts/     ready-to-use staged prompts
spec/        strongest-model output and later QA deltas
exports/     future Pen screenshot evidence; not created yet
```

## Current reference completeness

Enough material exists to finish the audits and begin structural reasoning. Before the strongest visual pass, the highest-value additions are:

1. WePresent mobile navigation/home/artist/story views.
2. Get Hyped mobile work/card/gallery views.
3. Medallion mobile creator/profile/release views.
4. Avant Arte desktop work story plus mobile process/detail views.
5. Pinterest mobile Explore/recommendation behavior.

Missing screenshots do not authorize the architect to browse broadly or invent interaction. The manifest defines when a targeted live check is allowed.

## Protected history

`design/pen/bidplace-web-v2.pen` remains unchanged and must never be opened by the design architect or Pen builder for this direction. A later approved Pen build creates `design/pen/bidplace-creator-first-v1.pen`.

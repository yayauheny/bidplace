# Visual QA — bidplace creator-first V2

Date: 2026-08-14
Status: **not started**. No V2 Pen exists yet.

V1 QA in the original packet (`design/creator-first/spec/VISUAL-QA.md`, `visual-deltas.yaml`) audited the beige/serif Pen and must not be used as V2 acceptance.

## Gate

Compare three golden frames, once built, to WePresent (structure) and Get Hyped (attitude):

1. `home/1440/default`
2. `creator-profile/1440/default`
3. `work-detail/1440/live-default`

Fail if the frames still read as cream magazine, literary serif, pill kit, or “rounded colored container + tilted stack.”

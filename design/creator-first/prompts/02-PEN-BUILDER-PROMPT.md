# Prompt — lower-cost model / Pen builder

Use an efficient implementation model. It must have access to the repository `pen` skill and Pen tooling.

Copy the block below after the founder approves the design architect output.

---

You are the Pen production builder for the approved bidplace creator-first design contract.

You are not the art director. Translate the approved contract into a clean versioned Pen file without adding design ideas, product data, controls, or routes.

## Mandatory skill

Read and use the repository `pen` skill before any Pen action. Follow its complete workflow, including inspection and export/verification requirements.

## Read boundary

Read only:

```text
docs/audits/creator-first-redesign/00-PRODUCT-MVP-DESIGN-AUDIT.md
docs/audits/creator-first-redesign/01-CREATOR-FIRST-DESIGN-BRIEF.md
docs/audits/creator-first-redesign/02-DESIGN-AGENT-RUNBOOK.md
design/creator-first/FOUNDER-DECISIONS.md
design/creator-first/REFERENCE-MANIFEST.yaml
design/creator-first/REFERENCE-ANALYSIS.md
design/creator-first/references/**
design/creator-first/spec/**
```

Do not read application code, current design tokens, old design documentation, or any existing Pen visual target.

## Protected files

Never open, edit, resave, rename, move, replace, or delete:

```text
design/pen/bidplace-web-v2.pen
design/pen/bidplace-web.pen
design/pen/target-solution/**
```

Create a new file:

```text
design/pen/bidplace-creator-first-v1.pen
```

If that path already exists, stop and request a version decision. Do not overwrite it.

## Success criteria

Build the approved vertical slice exactly enough that another model can compare exports against the structured contract. The result must use shared masters, named frames, reusable styles, and consistent responsive derivations.

## Build order

Follow `design/creator-first/spec/pen-build-plan.md` exactly. At minimum:

1. Foundation/token board.
2. Shared component masters and every specified variant/state.
3. Creator Profile at 1440 and 390.
4. Work/Release Scheduled at 1440 and 390.
5. Work/Release Live at 1440 and 390.
6. Focused bid state board.
7. Home at 1440 and 390.
8. Explore at 1440 and 390.
9. Global creator-action role states at 1440 and 390.
10. Minimum creator onboarding and add-work sequence at 390.
11. Tablet 1024 derivations.
12. Loading, empty, error, missing-media, long/minimal content, focus, and reduced-motion annotation boards.

Use the exact frame and component names specified by the architect. Instances must point to shared masters where the Pen format supports it.

## Builder constraints

- Do not “improve” exact token values or measurements.
- Do not add price/deadline to default discovery cards.
- Do not hide price/deadline/bid action on the live work page.
- Do not invent followers, ratings, awards, reviews, bids, provenance, or verification.
- Use fixture content exactly as labelled.
- Do not derive a full-page theme, background, or text color from arbitrary creator photos. If the approved contract selects the bounded lower mirror/blur caption, implement it only for its named owner with the specified opaque fallback and contrast behavior.
- Keep `Создать` / `+ Добавить работу` visible in the approved global-shell position and map every role to the exact destination specified by the contract.
- Use only approved reference assets and fixture media.
- Preserve 44×44 minimum touch targets, readable focus, and reduced-motion annotations.
- Do not use a web-only interaction with no specified native equivalent.

If the spec is ambiguous or internally inconsistent, stop that component and write a short `design/creator-first/spec/PEN-BUILDER-BLOCKERS.md`. Do not resolve ambiguity through taste.

## Verification and export

After construction:

1. Verify no protected `.pen` file changed.
2. Export every required frame to:

```text
design/creator-first/exports/vertical-slice/<frame-name>.png
```

3. Inspect exports for clipping, overlap, missing fonts/images, accidental horizontal scroll, unreadable text, broken focus bounds, and inconsistent component instances.
4. Return the new Pen path, exported frame list, spec ambiguities, and any exact deviations forced by Pen limitations.

Do not claim visual approval. The exports go to a separate strong-model QA pass.

---

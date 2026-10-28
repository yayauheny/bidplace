---
name: bidplace-ui-review
description: Review a Bidplace UI diff (apps/mobile, packages/design-tokens) against the design-system contract and Figma. Use when reviewing UI PRs, worker results, or your own UI changes before completion.
---

# bidplace-ui-review

Review the real diff, not the report. Rules live in `bidplace-ui`, `AGENTS.md`, and `docs/design/*`; this file is the order of checks and the evidence required. Combine with `code-review-best-practices` for non-visual concerns.

## 1. Scope and source

- Is every changed visual value traceable to a Figma node (id in PR/comment)? Nearest-existing-variant substitution for a visually different Figma style is a finding.
- Does the design conflict with `DEC-083`/`DEC-087` or another product contract? If yes and not reported → blocker.
- No `.pen`/`design/` asset changes; no edits to protected docs without a founder decision.

## 2. Mechanism check (one way per job)

For each of: container/width, Safe Area, sheet/dialog, tabs, back button, card grid, button, icon, text field:

- Does the diff use the existing owner (`AppShell`, `AppDialog`, `FigmaTabs`, `BackButton`, `PaddedGrid`/`gridColumnsFromWidth` or `WorkCoverCardGrid`, shared Button, `FigmaIcon`, `TextField`)?
- Did it add a second mechanism, a route-local copy, or a banned pattern (RN `Modal`, lucide, hand-assembled grid where `PaddedGrid`/`WorkCoverCardGrid` fits)? → blocker. Do not reintroduce removed legacy (`OverlayHost`, `AppIcon`, `DestructiveButton`).
- Was the superseded code/token deleted, or left "for later"? Leftover = finding.

## 3. Tokens and values

- New literal size/color/font in a component? Repeatable pattern → token/variant; unique geometry → named local constant with node id.
- Token names semantic; no breakpoint/device/screen names; no duplicate token for an existing role.
- Even integers; control height follows the −1 stroke rule; explicit `height` from token.
- Every new prop is a role (`variant`, `tone`, `fill`), not a screen name; ≤2 boolean flags per component. Props that overlap (e.g. two ways to say "full height") → collapse.

## 4. Layout and Safe Area

- No widths passed from screens; no `useWindowDimensions` for columns; no proportional scaling.
- Insets applied once; sheet bottom spacing = `max(bottomSpace, inset)`; **measure** base-vs-now spacing for every existing consumer of a changed sheet/shell (table in the PR).
- One centering mechanism and one `maxWidth` per host, not stacked.

## 5. Behavior and accessibility

- Focus: trap while open, return to trigger on close (one shared helper, no copies). Escape/backdrop/back dismissal; blocked-dismiss paths keep working.
- Roles, labels, visible focus, keyboard path, 44px targets, 200% zoom, reduced motion.
- Loading, empty, error, long text, missing image states exist where the screen needs them.

## 6. Evidence (require, do not assume)

- `typecheck`, `lint` (no auto-fix), affected vitest, affected e2e. A failing test must be compared with the base commit: pass-on-base + fail-now = regression, fix it; fail-on-both = report as baseline, do not relax.
- Screenshots at 1440 / 1024 / 390 beside the Figma reference (note `NEEDS-FIGMA` where no frame exists). Every consumer of a changed shared component: a screenshot or a named test.
- Size: code-only additions should not exceed deletions without a stated reason.
- Docs: `04-DESIGN-STATUS.md`, `11-PROJECT-STATUS.md` updated with honest status (`Partial` until all required checks pass); `03`/`02` if shared parts or flows changed.

## Output

Verdict (accept / accept with fixes / reject), then findings ordered by severity, each with file:line, the rule, and the smallest fix. List what was not verified.

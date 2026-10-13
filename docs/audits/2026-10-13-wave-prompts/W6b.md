# WAVE W6b — Skill and owner documentation

Model: luna, effort medium. Base: the accepted result of W6a (branch `ds/w6b-skill`). Documentation only; no code change.

## Why

After W1–W6a the project has one sheet, one container, one tab bar, one card grid and Figma as the single visual source. Future agents must be told this in one short, current place instead of rediscovering it. The skill points to the owner documents; it does not copy them.

## Do

1. The skills `.agents/skills/bidplace-ui/SKILL.md` and `.agents/skills/bidplace-ui-review/SKILL.md` already exist (written ahead of the waves as the target contract, and `AGENTS.md` already points to them). Instead of creating them: verify against the final code and edit them in place. Treat the draft below as historical. Keep it at **110 lines or fewer**. Before saving, correct every name in it to the real names in the repository (check with `rg`): for example the card grid is `WorkCoverCardGrid`, the tabs component is `FigmaTabs`, the overlay primitive is `AppDialog`, the dock hook is `useDockInset`, the layout tokens are `layout.contentMax`, `layout.gutter`, `layout.sheetMax`; verify that `lib/layout-transition.ts` and each path/symbol mentioned exists, and delete a rule that no longer matches the code instead of leaving it. Remove the two `.pen` mentions (the Pen design no longer exists). Do not add rules that are not in the draft or in `AGENTS.md`.
2. `AGENTS.md` already has the skill line; skip. (Old instruction:) `bidplace-ui` for any UI work in `apps/mobile` (layout, tokens, shared components, sheets/dialogs, tabs/grid, Safe Area, Figma match). Change nothing else in `AGENTS.md`.
3. `apps/mobile/src/components/README.md`: bring it in line with reality — `AppShell` is the fluid container, one sheet mechanism (`AppDialog`), no `DestructiveButton`, no `OverlayHost`, no `lucide`/`AppIcon`; every component named in the README must exist (`rg` each one).
4. `docs/design/03-DESIGN-SYSTEM.md` section 6.1 and `docs/design/02-USER-FLOWS-AND-SCREENS.md`: one correcting edit each, only where they still describe the 390 column, the old sheet or the old tabs. `docs/product/10-CODE-ARCHITECTURE.md`: one edit if the shell/overlay boundary description is out of date; otherwise leave it.
5. `docs/product/11-PROJECT-STATUS.md` and `docs/design/04-DESIGN-STATUS.md`: <= 10 lines each with the final state of waves W0–W6a (evidence: modules and tests; desktop still `NEEDS-FIGMA`).

## Boundaries

- Do not copy owner documents into the skill; link to them.
- Do not edit protected documents (`docs/product/01..04,06..09`, `docs/design/01-DESIGN-FOUNDATION.md`). No new `.md` except the skill file itself.

## Done when

- `wc -l .agents/skills/bidplace-ui/SKILL.md` <= 110; the front matter has `name` and `description`.
- Every path, component, hook and token named in the skill and in `components/README.md` exists (show the `rg` loop you used).
- `rg -n "\.pen\b|Pen v2|lucide|DestructiveButton|OverlayHost" .agents/skills/bidplace-ui apps/mobile/src/components/README.md` -> empty.
- `pnpm exec prettier --check` green on every changed file.

## Draft of `SKILL.md` (correct names as described above)

```markdown
---
name: bidplace-ui
description: Build or change Bidplace screens and shared UI in apps/mobile (Expo / React Native Web). Use for any layout, container width, token, shared component, sheet/dialog, tabs/grid, Safe Area, or Figma-match work.
---

# bidplace-ui

Goal: one way to do each UI job. Before writing UI, find the existing mechanism; extend it; delete what it replaces.

## Read first (owners — link, do not copy)

- `docs/design/00-DESIGN-INDEX.md` → `03-DESIGN-SYSTEM.md` → `04-DESIGN-STATUS.md`
- `apps/mobile/src/components/README.md` (component map)
- Product limits: `DEC-083`, `DEC-087` in `docs/product/12-DECISION-LOG.md`. If Figma shows
  something these forbid (Archive tab, sale/auction chips, favorites, bidding), STOP and report.
- Visual source and priority of Figma sources: `AGENTS.md`. Never read, edit or adapt to `.pen`.

## Layout invariants

- `AppShell` is the only owner of: page container, Safe Area, dock inset, bottom action.
  One `AppShell` per screen; loading/empty/error render inside it, not around it.
- Container = fluid; content `min(100% − 2·layout.gutter, layout.contentMax)`; mobile gutter 12,
  desktop 1280 centered. Screens never pass widths and never write 390/440/1280 literals.
- Columns come from the container width (`CardGrid`), never from device breakpoints or
  `useWindowDimensions` in a screen. No proportional scaling.
- Vertical gaps are local to the Figma composition (20, 40 …). Horizontal gutter is global.
- Full-bleed atmosphere/blur is a separate layer outside the column; never fix it with `overflow`.

## Safe Area

- Applied once, by the owner (`AppShell`, sheet host). Sheet bottom = `max(bottomSpace 20|40, insets.bottom)`.
- Never add insets inside a component that sits under an owner; never hardcode a home-indicator size.

## Tokens (`packages/design-tokens`, single `designTokens`)

- Token = role used by ≥2 components or a global constant. One-off geometry = local named
  constant with the Figma node id in a comment. Second consumer → promote to token.
- Names are semantic (`control.md`, `type.label`), never screen/device names.
- Spacing/size/radius are even integers. Size comes from the Figma frame (Layout), not render
  bounds; borders are drawn inside; outside strokes are subtracted.
- Typography is a role; components never set `fontSize`/`fontWeight`. No hex in components.
- No breakpoint tokens. `layout.contentMax` and `layout.gutter` are the only layout numbers.

## Components

1. Search first: `rg -n "export (function|const)" apps/mobile/src/components/ui apps/mobile/src/components/layout`
   and read `components/README.md`.
2. Reuse as is → else add a **role-named** variant (`variant`, `tone`; never a screen name, never
   boolean flag forests) → else new component, stating its single responsibility in the PR.
3. Prefer a library primitive already in the repo (`@rn-primitives/*`, Reanimated, expo-image,
   react-hook-form + zod, expo-router public exports) over hand-written behavior.

## Overlays and motion

- Only `AppDialog` (`dialog | sheet | mediaSheet | fullscreen`). Never RN `Modal`, manual portals,
  own focus traps or own dismiss logic. Backdrop and panel animate independently (Reanimated
  presets in `lib/layout-transition.ts`). Reduced motion through the single shared hook.
- Import expo-router only from public entries (`expo-router`, `expo-router/react-navigation`).

## Web / native

- Web (PWA) is the claimed target. Native stays compiling but unclaimed. No new `.web.tsx` fork
  unless a CSS-only capability (backdrop-filter, mask) is required; say why in a comment.

## Bans

`TouchableOpacity/Highlight`, `Modal`, `lucide-react-native`, raw hex, `expo-router/build/*`,
`@ts-ignore`/`any`, `{value && <X/>}` with possibly falsy value, scroll position in `useState`,
`setTimeout` animations, per-screen button/tab/grid reimplementations, fake data or controls.

## States and accessibility

Every screen: loading, empty, error, long text, missing image, owner vs visitor where relevant.
Roles/labels, visible focus, keyboard (Tab/Space/Enter/Arrows/Escape), focus return, 44px targets,
200% zoom, reduced motion.

## Consumers

Before changing a shared component/token: `rg` its consumers, list them in the PR, verify each
affected route. Update the owner spec; do not add one test file per bug.

## UI PR done criteria

- [ ] `typecheck`, `lint` (no auto-fix), affected vitest, affected e2e pass
- [ ] screenshots at 1440 / 1024 / 390 next to the Figma reference (note any `NEEDS-FIGMA`)
- [ ] no new literal sizes/colors; superseded code and tokens deleted
- [ ] `docs/design/04-DESIGN-STATUS.md` (+ `03` if shared parts changed) and `11-PROJECT-STATUS.md` updated
- [ ] no `.pen` file in the diff; no conflict with DEC-083/087 left unreported
```

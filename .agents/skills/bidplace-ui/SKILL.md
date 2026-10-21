---
name: bidplace-ui
description: Build or change Bidplace screens and shared UI in apps/mobile (Expo / React Native Web). Use for layout, container width, tokens, shared components, sheets/dialogs, tabs, card grids, Safe Area, or matching Figma.
---

# bidplace-ui

Goal: one way to do each UI job. Find the existing mechanism, extend it, delete what it replaces.

Status: this is the **target contract** of the design-system waves (`docs/audits/2026-10-13-FRONTEND-DESIGN-SYSTEM-AUDIT.md` §17; execution prompts archived 2026-10-21) and it is implemented in code: the legacy `OverlayHost`, `AppIcon`/lucide, `DestructiveButton` and fixed-390-column patterns are removed. The remaining intentional deviations — do not copy or extend them: the private `expo-router/build` import for `usePreventRemove` (no public export in SDK 57; expected public in SDK 58) and the custom web history guards (`features/sellers/product-draft-browser-guard.ts`, `features/auth/auth-browser-history.ts`).

## Read first (link, do not copy)

- `docs/design/00-DESIGN-INDEX.md` → `03-DESIGN-SYSTEM.md` → `04-DESIGN-STATUS.md`; component map: `apps/mobile/src/components/README.md`.
- Visual source is Figma (file `pAPQo6cADmG5XzVmBX76EE`); priority of sources is in `AGENTS.md`. Missing/ambiguous node or conflict with a product contract → stop that scope and record the decision.
- Product limits `DEC-083`, `DEC-087` (`docs/product/12-DECISION-LOG.md`): Archive tab, sale/auction chips, favorites, bidding in a design → stop and report.

## Layout

- `AppShell` owns page container, Safe Area, dock inset, bottom action. One per screen; loading/empty/error render inside it.
- Container is fluid: `maxWidth = layout.contentMax + 2·layout.gutter`, mobile gutter 12. Screens never pass widths or write 390/440/1280.
- Columns derive from container width (`WorkCoverCardGrid`), not device breakpoints or `useWindowDimensions` in a screen.
- Horizontal gutter is global; vertical gaps (20, 40 …) are local to the Figma composition.
- Full-bleed atmosphere/blur is its own layer outside the column.

## Safe Area

Applied once by the owner (`AppShell`, sheet host). Sheet bottom = `max(bottomSpace 20|40, insets.bottom)`. Never add insets under an owner or hardcode a home-indicator size.

## Tokens (`packages/design-tokens`)

- Token = role used by 2+ components or a global constant. One-off geometry = local named constant with the Figma node id. Second consumer → promote.
- Semantic names only (`control.md`, `type.label`), never screen/device names. No breakpoint tokens.
- Sizes/spacing/radius are even integers. Control size = Figma frame bounds − 1 when the stroke is outside (button 42/46/50/54, text field 50); borders drawn inside, set explicit `height` from the token.
- Typography is a role; components never set `fontSize`/`fontWeight`. No hex in components.

## Components

1. Search: `rg -n "export (function|const)" apps/mobile/src/components` and read the README.
2. Reuse as is → else add a role-named variant (`variant`, `tone`; no screen names, no boolean-flag forests) → else a new component with one stated responsibility.
3. Prefer a library already in the repo (`@rn-primitives/*`, Reanimated, expo-image, react-hook-form + zod, expo-router public exports) over hand-written behavior.
4. One tab bar (`FigmaTabs`, `fill` for equal columns), one grid mechanism (`PaddedGrid` + `gridColumnsFromWidth` / `WorkCoverCardGrid` for cover cards), one button family, one sheet (`FilterSheet` / `AppDialog`).

## Overlays and motion

- Only `AppDialog` variants. No RN `Modal`, manual portals, own focus traps or dismiss logic; focus returns to the trigger.
- Backdrop and panel animate independently (presets in `lib/layout-transition.ts`); reduced motion via the shared hook. No `setTimeout` animations.
- Import expo-router only from public entries.

## Bans

`TouchableOpacity/Highlight`, `Modal`, `lucide-react-native`, raw hex, `expo-router/build/*`, `@ts-ignore`/`any`, `{value && <X/>}` with a possibly falsy value, scroll position in `useState`, per-screen button/tab/grid copies, fake data or controls.

## States and accessibility

Each screen: loading, empty, error, long text, missing image, owner vs visitor where relevant. Roles/labels, visible focus, keyboard (Tab/Space/Enter/Arrows/Escape), 44px targets, 200% zoom, reduced motion.

## Consumers

Before changing a shared component/token: `rg` its consumers, list them, check each affected route. Extend the owner spec; no one-test-file-per-bug.

## Done

Run `bidplace-ui-review` on your own diff before finishing. Update `docs/design/04-DESIGN-STATUS.md` (+ `03` for shared parts) and `docs/product/11-PROJECT-STATUS.md`.

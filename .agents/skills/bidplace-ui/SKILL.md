---
name: bidplace-ui
description: Implement or change Bidplace Expo and React Native Web screens and shared UI using verified Figma sources, existing component owners, semantic tokens and responsive layout. Use for layout, controls, theme consumers, sheets, grids and Safe Area.
---

# Bidplace UI implementation

Read AGENTS.md, required design/product owners and the actual checkout. Component map: apps/mobile/src/components/README.md. New/revised Figma sources use bidplace-figma-intake first; [workflow](../../../docs/design/FIGMA-TO-CODE-WORKFLOW.md) contains the compact handoff. Source provenance, product behavior and design geometry are different contracts; do not import commerce/social-auth functionality merely because it appears in a frame.

## Before editing

State success criteria, bounded plan, affected consumers and selected durable solution. Trace UI/state through existing contracts and services only where behavior changes. Map design nodes to existing components, variants, semantic roles and assets. Reuse → extend a fitting owner → create a component only for a missing responsibility. Do not copy generated HTML, coordinate trees or design-system primitives into a screen.

Verify what is implemented at this SHA. Older branches may have fixed-390 shells or legacy wrappers; do not claim a target architecture is present without reading it. Preserve accepted SDK57 private-hook/history exceptions in existing flows; never mechanically replace them with an unavailable public API during visual work.

## Responsive composition

- Existing AppShell owns page container, Safe Area and dock reserve. Use its fluid width/maxWidth/gutter policy; a reference width such as 390 is not a production screen constraint. Sheet/dialog has its own host; do not nest page shells to center content.
- Shared grid owner (PaddedGrid/gridColumnsFromWidth or WorkCoverCardGrid when present) derives columns from measured available container width and confirmed card constraints. Use onLayout for container width; useWindowDimensions is valid for genuine window/fontScale behavior, not scattered route-specific breakpoints.
- Prefer Flexbox, wrapping, minWidth:0, content-based height, aspectRatio and bounded scroll regions. Breakpoints are allowed for real composition changes defined by design; keep their policy with the layout owner. No proportional scaling of an entire 390px screen.
- Text wraps and containers grow. Fixed/min control sizes are legitimate semantic metrics, but must preserve enlarged text and touch targets. Do not disable font scaling or browser zoom, shrink text, hide overflow, or truncate essential content to disguise failures.
- Safe Area/keyboard/dock spacing has one owner. Do not bake status-bar/home-indicator pixels from the mock into app content. Full-bleed decorative layers can sit outside the content column; absolute positioning is reserved for actual overlays/decorations, not ordinary document flow.

## Centralized styling and themes

- packages/design-tokens owns semantic roles and shared metrics. Repeated controls/styles use component variants. A role can justify a token with one consumer; usage count and equal hex values do not establish semantic equivalence.
- Components consume the active theme owner when available; changing only navigation ThemeProvider does not theme static imports. Keep one semantic contract across light/black, including borders, gradients, shadows, icons, focus and state colors. No route-local dark palette, global mutable token switching or module-level snapshots of theme-dependent colors.
- If runtime theme support is absent, report it and use the current canonical owner for a light-only task; do not claim dark readiness or build a competing theme system. Theme infrastructure requires its own bounded task.
- One-off geometry may be a named local constant tied to the verified node. Do not promote every coordinate to a global token. No raw hex or repeated typography/control settings in screens; branded asset colors are explicit exceptions, not theme substitutes.
- Read actual frame size, stroke alignment and renderer box model. Never round all values to even numbers or subtract one pixel by default. Confirmed design-system decisions apply to their specified controls; report conflicts with the current Figma source instead of guessing. Choose the exact variant or extend the owner, never a visually different nearest match.

## Shared behavior

Keep button/field/tab/grid/back/dialog behavior in existing owners (e.g. FigmaButton, FigmaTextField, FigmaTabs, BackButton, AppDialog/FilterSheet). ui/Button wrappers delegating to one renderer are not automatically duplicates. Preserve navigation hrefs, disabled/loading/error semantics and keyboard handling. Use installed primitives/Reanimated/expo-image rather than new focus traps, portals, gesture or animation engines. Check library versions/public exports.

No new libraries, fake controls, independent screen palettes, copied renderers, any/ts-ignore or suppressed errors to force a visual match. Retire only superseded code after checking consumers; do not remove unrelated history or assets based on names.

## Acceptance

Run bidplace-ui-review against the actual result. Verify the reference size plus narrower/wider/shorter cases, text resizing/zoom, keyboard, states and affected shared consumers. Match the exact approved reference without freezing the layout to it. No production Done from TypeScript/unit tests alone. Keep checks proportional; do not run every suite for a visual-only change. Update applicable canonical status docs with actual evidence and remaining NEEDS-FIGMA, without rewriting protected decisions.

# bidplace Modern UI

Status: **planning only — migration not started**

Modern UI is the autonomous documentation package for a future bidplace redesign. It turns approved visual decisions, component boundaries, resource choices, screen rules, and migration gates into a handoff that can be used by a project owner or AI agent. It does not implement components, change routes, or replace the current UI.

The current application still uses the existing Tamagui-based system. Treat every target statement in this folder as a plan until the migration gates in [`05-migration-plan.md`](./05-migration-plan.md) are completed and the owner explicitly declares this package the source of truth.

## Documents

| File | Responsibility |
| --- | --- |
| [`00-project-decisions.md`](./00-project-decisions.md) | Approved target visual and technical decisions |
| [`DESIGN.md`](./DESIGN.md) | Unified visual system, evidence boundaries, component rules, and reference lookup |
| [`01-current-audit.md`](./01-current-audit.md) | Repository audit and CURRENT → TARGET gaps |
| [`02-ui-architecture-and-resources.md`](./02-ui-architecture-and-resources.md) | Target layers, dependency direction, and official resources |
| [`03-screen-rules.md`](./03-screen-rules.md) | Target composition and states for product screens |
| [`04-component-catalog.md`](./04-component-catalog.md) | Target public component API and states |
| [`05-migration-plan.md`](./05-migration-plan.md) | Future migration phases, rollback, and stop conditions |
| [`06-quality-checklist.md`](./06-quality-checklist.md) | Component, screen, accessibility, and dependency checklists |
| [`references/README.md`](./references/README.md) | Reference index and priority rules |

## Target stack, in one view

Expo, Expo Router, React Native, React Native Web, one application without Next.js, NativeWind v4, React Native Reusables as a copy-paste source, RN Primitives for accessible behavior, and a public bidplace UI-kit. Motion is planned around Reanimated and Gesture Handler, with optional Expo Haptics. Specialized adapters are planned for Lucide, SVG, AppSheet, Expo Image, Image Picker, React Hook Form, Zod, and—only after evidence—FlashList.

Target dependency versions must be exact production versions without `^` or `~`. This does not authorize changing the current manifest.

## Required reading order for a UI task

1. [`00-project-decisions.md`](./00-project-decisions.md)
2. [`DESIGN.md`](./DESIGN.md)
3. [`03-screen-rules.md`](./03-screen-rules.md)
4. [`04-component-catalog.md`](./04-component-catalog.md)
5. The relevant reference README in [`references/`](./references/)
6. [`02-ui-architecture-and-resources.md`](./02-ui-architecture-and-resources.md)

Then consult [`01-current-audit.md`](./01-current-audit.md) whenever a current implementation constraint matters.

## Rules for AI agents

- Keep CURRENT STATE and TARGET MODERN UI visibly separate.
- Do not treat target components, tokens, libraries, or routes as implemented.
- Use a catalog component before proposing a new one; add a new shared component to the catalog before implementation.
- Keep domain logic independent from UI and hide third-party libraries behind bidplace components.
- Use tokens from `00-project-decisions.md`; do not put raw colors or animation values in a route.
- Do not import Reanimated, Gorhom Bottom Sheet, Haptics, or icon packs directly into screens.
- Do not add a library, preview API, alpha, beta, or unstable API without an ADR.
- Preserve auction-critical information, public/private data boundaries, loading/error/offline states, and 44 px touch targets.
- Do not migrate Tamagui or edit application code as part of a documentation task.

Modern UI becomes the source of truth only after an explicit owner decision, the pilot screens pass the three-platform acceptance matrix, the old design docs are cross-linked or archived by an owner, and migration status is recorded as complete rather than planned.

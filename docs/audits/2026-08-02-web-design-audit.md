# Web design audit — 2026-08-02

## 1. Verdict

<!-- To be completed after all audit units are done -->

## 2. Evidence reviewed

| Source | What was reviewed | Reliability | Notes |
|---|---|---|---|
| `AGENTS.md` | Repository instructions, document ownership, update rules, skill selection | High | Current HEAD |
| `docs/product/00-PROJECT-INDEX.md` | Document map, reading packages, status definitions | High | Current HEAD |
| `docs/product/01-PRODUCT-FOUNDATION.md` | Core value proposition, brand tone, visual principles, rejected directions | High | Protected; Confirmed |
| `docs/product/05-MVP-RFC.md` | Exact MVP behavior, roles, auction rules, card requirements, contact privacy | High | Confirmed v1.1 |
| `docs/product/11-PROJECT-STATUS.md` | Implementation status of all features; wave 1 and wave 2 state | High | Updated 2026-08-02 |
| `docs/design/00-DESIGN-INDEX.md` | Design doc ownership, reading order | High | Current HEAD |
| `docs/design/01-DESIGN-FOUNDATION.md` | Visual hierarchy, required feeling, trust/clarity, photo requirements, rejected directions | High | Protected; Confirmed |
| `docs/design/02-USER-FLOWS-AND-SCREENS.md` | Canonical routes, screen states, flow constraints | High | Updated 2026-08-01 |
| `docs/design/03-DESIGN-SYSTEM.md` | Current implementation inventory, target principles, missing foundations | High | Updated 2026-08-01 |
| `docs/design/04-DESIGN-STATUS.md` | Per-screen implementation status, remaining QA | High | Updated 2026-08-02 |
| `docs/design/05-DESIGN-HANDOFF.md` | Handoff workflow, naming, required states, QA checklist | High | No Figma linked |
| `packages/design-tokens/src/index.ts` | Legacy token set: colors, spacing, radius, sizes, typography, shadows, layout, brand | High | Code review |
| `packages/design-tokens/src/modern.ts` | Active token set: modernTokens color/space/radius/size/typography/motion/layer | High | Code review |
| `/private/tmp/bidplace-wave2-screenshots/` | Target-width screenshots at 1440/1024/390 | **Not available** | Directory does not exist at audit time; E2E spec writes here but screenshots are ephemeral test artifacts |
| `apps/mobile/e2e/01-wave2-layout-screenshots.spec.ts` | Screenshot E2E: what it asserts (card count, image naturalWidth, no visible heading, mobile card proximity) | Medium | Spec reviewed; output not available |
| Commit `db4f2d1` | Catalog/product layout overhaul, button width variants, description one-line | High | 15 files, reviewed stat+message |
| Commit `933312d` | Dialog centering via portal wrapper, catalog description clamp, target-width screenshots | High | 10 files, reviewed stat+message |
| Commit `d02ec40` | Isolated wave 2 screenshots, seeded product assertions | High | 3 files, reviewed stat+message |
| Commit `e672dda` | Removed mobile header spacer, desktop account row desktop-only, removed mobile nav top divider | High | 5 files, reviewed diff |

## 3. Target visual system

| Area | Current token/value | Target token/value | Exact usage | Rationale |
|---|---|---|---|---|

<!-- Populated after audit units 2–6 -->

## 4. Findings and exact fixes

<!-- Each finding uses the template below. Grouped by P0/P1/P2 priority. -->
<!-- Populated incrementally per audit unit -->

## 5. Screen-by-screen implementation specification

| Screen / route | Keep | Remove | Change | Components/files | Acceptance screenshot |
|---|---|---|---|---|---|

<!-- Populated after audit units 5–9 -->

## 6. Implementation waves

### Wave A — Structural responsive fixes

| Order | Task | Exact files/components | Dependencies | Acceptance criteria | Required checks |
|---|---|---|---|---|---|

### Wave B — Shared component and visual-system fixes

| Order | Task | Exact files/components | Dependencies | Acceptance criteria | Required checks |
|---|---|---|---|---|---|

### Wave C — Screen polish and acceptance

| Order | Task | Exact files/components | Dependencies | Acceptance criteria | Required checks |
|---|---|---|---|---|---|

<!-- Populated in audit unit 10 -->

## 7. Visual regression matrix

<!-- Populated in audit unit 10 -->

## 8. Founder decisions required

<!-- Populated incrementally; finalized in audit unit 10 -->

## 9. Explicit non-goals

The following are explicitly out of scope for this audit and the subsequent design wave:

- новые product flows;
- API и role logic;
- pagination;
- поиск;
- фильтры;
- теги;
- избранное;
- рекомендации;
- расширение seed до 10–15 предметов;
- редизайн brand logo без founder decision.

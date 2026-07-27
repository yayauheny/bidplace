# Current design research plan

Status: **research procedure; no code migration is authorized**

## Purpose and exit criterion

Use this procedure before planning or implementing a UI migration. It produces an evidence-backed current-state baseline: every route, visual primitive, token owner, state, product constraint, and verification gap is known well enough to sequence the migration without guessing.

The research is complete only when a subsequent agent can answer all of these questions from the resulting report:

1. What does each live route show, and which role can access it?
2. Which component, token, direct style, or library primitive owns each visible pattern?
3. Which product data and states must remain unchanged during a visual move?
4. Which current patterns can be adapted, which are duplicates, and which require a new target adapter?
5. What is the smallest safe pilot, what proves it, and what stops/rolls it back?

The current baseline is recorded in [`08-current-design-baseline-report.md`](./08-current-design-baseline-report.md). Re-run this plan whenever routes, the component set, tokens, or target decisions materially change.

## Research rules

- Read product and design owner documents first; visual work must not change auction truth, privacy, or seller permissions.
- Treat code, route behaviour, and verified browser/device evidence as facts. Treat screenshots and inferred font names as visual observations, not implementation facts.
- Keep **CURRENT** and **TARGET** in different tables. Do not quietly replace an existing token or component while documenting it.
- Do not edit source, dependencies, configuration, or protected product/design documents during research.
- Record a path and a concrete state for every claim. Do not infer a state from a happy-path screenshot.
- Classify an item as `retain`, `adapt behind adapter`, `replace in pilot`, or `defer`; never use “redesign later” as a plan.

## Step 0 — establish a safe snapshot

1. Record branch, commit, package-manager/lockfile, and unrelated dirty files.
2. Read `docs/product/00-PROJECT-INDEX.md`, `01-PRODUCT-FOUNDATION.md`, `11-PROJECT-STATUS.md`, plus all five design owner documents.
3. Read `00-project-decisions.md`, [`DESIGN.md`](./DESIGN.md), [`01-current-audit.md`](./01-current-audit.md), and the relevant product owner documents for any route in scope.
4. State the research boundary: no feature, policy, API contract, route, or dependency change is implied.

**Output:** date/commit, documentation set read, and a list of constraints that the visual migration cannot violate.

## Step 1 — inventory routes, roles, and mandatory states

For every Expo route, map its feature screen, shell, role guard, query/mutation, and visible state. Include public, buyer, auth, seller, and admin routes.

For each screen capture the following matrix:

| Field | Record |
| --- | --- |
| Route and role | canonical route and access gate |
| Goal | user task, not a component list |
| Required data | API projection and privacy boundary |
| Mandatory states | loading, empty, error, disabled, offline/reconnect, long content, permission denial where relevant |
| Critical interaction | bid, OTP, upload, schedule, moderation, handoff, etc. |
| Current UI owners | screen, shared component, primitive/library |
| Evidence | source paths and passing test/manual QA evidence |
| Migration classification | retain / adapt / replace / defer |

**Output:** route/state matrix. A route with unknown error or permission behaviour is not ready for a visual pilot.

## Step 2 — inventory the component system and direct styling

Start at [`apps/mobile/src/components/ui/`](../../apps/mobile/src/components/ui/) and [`apps/mobile/src/components/layout/`](../../apps/mobile/src/components/layout/). Then search feature screens for direct Tamagui imports, inline `style` objects, raw colours, radius/spacing numbers, and local press states.

For each shared component record:

- responsibility and public props;
- all callers and whether those callers rely on accidental styling;
- primitive/library below it;
- supported and missing states;
- accessibility behaviour;
- target successor from [`04-component-catalog.md`](./04-component-catalog.md);
- a transition decision: retain behind bridge, split, replace, or remove after callers move.

**Output:** component dependency map and duplicate list. Do not replace a generic primitive before knowing every caller.

## Step 3 — audit tokens, typography, geometry, and assets

Read the shared token package before screen styles:

- [`packages/design-tokens/src/index.ts`](../../packages/design-tokens/src/index.ts);
- [`apps/mobile/src/theme/tokens.ts`](../../apps/mobile/src/theme/tokens.ts);
- [`apps/mobile/tamagui.config.ts`](../../apps/mobile/tamagui.config.ts);
- font loading in [`apps/mobile/src/app/_layout.tsx`](../../apps/mobile/src/app/_layout.tsx).

Record current semantic names and actual values, then list deviations: raw values, local fonts, local sizing, duplicate semantic maps, and screen-specific shadows/colours. Audit existing media/brand assets separately from target brand wishes.

**Output:** current token table, target-token crosswalk, font/asset availability check, and a list of values that cannot be changed before their consumers migrate.

## Step 4 — inspect navigation, overlays, media, and interaction primitives

Inspect the root layout/providers, header, desktop navigation, mobile drawer, sheets, images, and form controls. Document platform-specific branches (`Platform.select`, runtime media checks, web-only behaviour) instead of assuming one implementation behaves identically everywhere.

Check:

- safe areas, sticky/floating content, keyboard and focus return;
- sheet dismiss/escape semantics;
- image ratio, missing image, loading, crop, caching, upload and reordering behaviour;
- loading/retry/reconnect wording and geometry;
- press/hover/focus/reduced-motion treatment;
- icon source and icon-only labels.

**Output:** platform/interaction risk register, including the exact adapter boundary needed for each target primitive.

## Step 5 — verify against real product behaviour

Use the current Playwright/Vitest/typecheck evidence and, before any migration, run the designated manual matrix on web, Android, and iOS. Follow business data from the product document, not only the component tree.

For the Product detail specifically verify that a visual change preserves:

- server-authoritative product/listing snapshot and reconnect refresh;
- current bid, minimum next bid, deadline/status, and bid CTA in the first usable viewport;
- OTP before a bid, idempotent retry, rejected-bid feedback, and public alias privacy;
- role-authorized order handoff only after the correct outcome.

**Output:** verification table: what was automated, manually observed, not tested, and blocked.

## Step 6 — reconcile with the target system and references

Use [`DESIGN.md`](./DESIGN.md) and the exact screenshot README from the [reference catalog](./references/design-photos/README.md). For every CURRENT → TARGET row distinguish:

- **retain:** domain logic/API/query/route can remain unchanged;
- **adapt behind adapter:** current behaviour is usable but visual primitive changes;
- **replace in pilot:** current presentation conflicts with target and has bounded callers;
- **defer:** needs owner decision, assets, or a stable dependency.

For every new component required by a target screen, add its proposed responsibility and state matrix to [`04-component-catalog.md`](./04-component-catalog.md) before implementation.

**Output:** dependency-ordered migration candidates and explicit design/product decisions still needed.

## Step 7 — produce the transition-planning packet

Deliver these sections in one current-state report:

1. snapshot and scope;
2. route/state/role matrix;
3. token/font/asset inventory;
4. component and primitive dependency map;
5. navigation, media, interaction, and accessibility findings;
6. CURRENT → TARGET crosswalk;
7. risks, missing evidence, and owner decisions;
8. pilot recommendation, acceptance matrix, stop conditions, and rollback point.

The report must link to the exact photo/reference for visual decisions and exact source module for current behaviour. It must never claim that a target component is implemented.

## Ready-to-plan gate

An agent may write the migration plan only after all checks below are true:

- [ ] Every live route and role has a current-state row.
- [ ] Every auction-critical state has a product/behaviour owner and verification evidence.
- [ ] Shared components and their callers are inventoried; duplicate names/aliases are called out.
- [ ] Current tokens/fonts/assets and direct-style exceptions are known.
- [ ] Target component successors are mapped or explicitly deferred.
- [ ] Mobile, desktop, accessibility, loading/error, and media risks are enumerated.
- [ ] Dependencies and config changes are separately gated behind an ADR/compatibility check.
- [ ] Pilot, acceptance criteria, stop conditions, and rollback baseline are written.

If any item is false, continue research rather than inventing a migration phase.

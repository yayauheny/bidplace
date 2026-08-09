# Repository Instructions

Apply these rules to every task in this repository.

## Core

- Inspect the local repository first before making assumptions.
- State success criteria before implementation.
- Keep changes minimal and limited to the request.
- Prefer the simplest correct solution.
- Do not add speculative abstractions, dependencies, or unrelated refactors.
- Preserve existing public behavior unless the task requires a change.
- Remove only code made unused by your own changes.
- Never claim success without running the relevant checks.

## Change Workflow

- Before editing code, first identify the problem, list candidate fixes, and compare trade-offs.
- Label each candidate explicitly as a durable fix, acceptable workaround, or hack.
- Prefer a durable fix by default.
- Do not start code edits until the chosen solution is clear.
- If the issue is ambiguous, stop and ask instead of guessing.
- Do not use workaround-only patches such as `suppressHydrationWarning`, `any`, `@ts-ignore`, empty catches, or silent fallbacks unless they are explicitly accepted as temporary and documented as such.

## Skill Selection

Use the most specific skill for the task:

- `review` for diffs, pull requests, and review-only requests.
- `security` for auth, permissions, payments, purchases, bids, balances, webhooks, files, external APIs, admin actions, or sensitive data.
- `ui` for React, React Native, and Expo UI work.
- `nest` for NestJS backend logic, persistence, jobs, events, and integrations.

For high-risk backend changes, use both `nest` and `security`.

## Architecture

- Keep controllers, routes, handlers, and screens thin.
- Keep business logic in services, use cases, hooks, or domain modules.
- Reuse shared types, API contracts, UI primitives, and design tokens.
- Do not bypass package public exports.
- Do not duplicate server state, business rules, or shared models.
- Use clear, descriptive names.

## Verification

- Cover every behavior change with tests.
- Prefer unit tests unless the change crosses module, database, network, permission, or transaction boundaries.
- Run the relevant typecheck, lint without auto-fix, tests, and builds for the affected graph.
- Do not mark work complete while required checks fail.

## Git

- Use short, specific branch and commit names.
- Do not mention agents or automation in branches, commits, or pull requests.

<!-- BIDPLACE_PROJECT_RULES_START -->

## Bidplace Project Documentation

Before every task in this repository:

1. Read `docs/product/00-PROJECT-INDEX.md`.
2. Read `docs/product/01-PRODUCT-FOUNDATION.md`.
3. Read `docs/product/11-PROJECT-STATUS.md`.
4. Use the index to open only the owner documents relevant to the task.
5. Identify the affected product behavior, its owner document, and any conflict with confirmed bidplace principles before changing code.

The core product principle is value. bidplace is for direct sales of significant, authored, limited, or personally connected items. General resale, resellers, mass-market goods, and artificial bids conflict with the product.

### Document Ownership

- Product boundaries and value: `01-PRODUCT-FOUNDATION.md`.
- Product history: `02-PRODUCT-EVOLUTION.md`.
- Market and competitive patterns: `04-MARKET-AND-COMPETITIVE-PLAYBOOK.md`.
- Exact MVP behavior: `05-MVP-RFC.md`.
- Development waves: `06-ROADMAP-24-MONTHS.md`.
- Growth and creator launch: `07-GROWTH-AND-ADVERTISING-PLAYBOOK.md`.
- Seller and item eligibility: `08-SELLER-AND-ITEM-POLICY.md`.
- Bids, provenance, privacy, and integrity: `09-TRUST-AND-AUCTION-INTEGRITY.md`.
- Architecture and long-lived technical decisions: `10-CODE-ARCHITECTURE.md`.
- Current implementation state: `11-PROJECT-STATUS.md`.
- Decision history: `12-DECISION-LOG.md`.

Keep one owner per claim. In other documents, add a short conclusion and a link instead of copying the full description.

### Protected Product Documents

Do not change these during ordinary development work without an explicit founder decision:

- `01-PRODUCT-FOUNDATION.md`;
- `02-PRODUCT-EVOLUTION.md`;
- `03-CUSTDEV-TAISIA.md`;
- `04-MARKET-AND-COMPETITIVE-PLAYBOOK.md`;
- `06-ROADMAP-24-MONTHS.md`;
- `07-GROWTH-AND-ADVERTISING-PLAYBOOK.md`;
- `08-SELLER-AND-ITEM-POLICY.md`;
- `09-TRUST-AND-AUCTION-INTEGRITY.md`.

If a requested change conflicts with a protected document, identify the exact conflict, stop the product-changing part, and request an explicit founder decision.

### Updating Documentation with Code

After every task that changes code or actual system behavior:

1. Update `docs/product/11-PROJECT-STATUS.md` with `Implemented`, `Partial`, `Not implemented`, or `Needs verification`.
2. Cite concrete modules, APIs, tables, screens, and tests that support the status.
3. Do not mark a feature `Implemented` when critical checks, server behavior, primary errors, or verification are missing.
4. Update `docs/product/10-CODE-ARCHITECTURE.md` only when architecture boundaries, domain models, app/package structure, contracts, persistence, or security invariants changed.
5. Check the result against `docs/product/05-MVP-RFC.md` and record implementation gaps in `11-PROJECT-STATUS.md`.

Do not rewrite `05-MVP-RFC.md` merely because current code differs. Change it only after an explicit product-contract decision.

### Decisions and Research

- `12-DECISION-LOG.md` is append-oriented. Add an entry only for an explicit new decision, a selected alternative, a revised decision, or a rejected idea.
- Do not infer a founder decision or rewrite previous entries. A revision must reference the earlier decision.
- `docs/research/raw/*` is an immutable primary-material archive. Never rewrite, delete, or promote raw claims directly to confirmed product decisions.
- Store new research in a separate dated file and move conclusions to the appropriate owner document only with the correct status and source.
- Keep product statuses (`Confirmed`, `Hypothesis`, `Planned`, `Rejected`) separate from code statuses.

### Design documentation

Before changing user-facing UI, read:

- `docs/design/00-DESIGN-INDEX.md`;
- `docs/design/01-DESIGN-FOUNDATION.md`;
- `docs/design/02-USER-FLOWS-AND-SCREENS.md`;
- `docs/design/03-DESIGN-SYSTEM.md`;
- `docs/design/04-DESIGN-STATUS.md`.

After changing UI:

1. Update `docs/design/04-DESIGN-STATUS.md`.
2. Update `docs/design/03-DESIGN-SYSTEM.md` when shared components or tokens changed.
3. Update `docs/design/02-USER-FLOWS-AND-SCREENS.md` when a user flow changed.
4. Do not change visual principles or product flows without an explicit founder or assigned-designer decision.
5. Do not mark a screen complete without loading, empty, error, responsive, and accessibility states.

`docs/design/01-DESIGN-FOUNDATION.md` is protected and changes only by direct decision of the founder or assigned designer.

### Canonical Pen Reference Protection

`design/pen/bidplace-web-v2.pen` is the canonical visual reference for the current UI direction.

- Never edit, delete, rename, move, replace, format, or resave this file during implementation, refactoring, testing, review, or documentation work.
- Adapt production code to the canonical Pen reference; never adapt the Pen file to current code.
- Pen changes are allowed only in a separately scoped design task with an explicit founder or assigned-designer instruction.
- Even an authorized design task must not delete the canonical file; preserve history and explicit version lineage.
- If a Pen node is missing, damaged, ambiguous, or conflicts with a product contract, stop the affected implementation and record the required decision. Do not repair Pen during a code task.
- Before completing any UI task, verify that no `.pen` file appears in the diff.
- Pen controls visual composition and styling. Product owner documents and server contracts continue to control routes, data, permissions, privacy, and auction behavior.

### Pen UI Implementation Quality

- Use only durable solutions for the Pen v2 migration. If a durable implementation is blocked by route, data, or contract ambiguity, stop the affected scope instead of adding a workaround.
- Maintain one semantic token layer in `packages/design-tokens`, one shared primitive per UI role, and one production master per canonical Pen component.
- Keep screens thin. Fix shared visual rules in tokens or shared components, never with duplicated route-local patches.
- Do not use repeated magic values, duplicate token systems, fake data or controls, client-only API approximations, giant boolean-flag components, silent fallbacks, type/lint suppressions, or a hybrid final shell.
- Implement exact Pen measurements only after reading the canonical nodes. Never guess missing geometry, fonts, assets, responsive behavior, or interactions.
- Static Pen frames do not exhaust interaction behavior. Implement hover, focus, open/close, blur, artwork atmosphere, sticky transitions and reduced-motion exactly from `docs/design/03-DESIGN-SYSTEM.md`; never add route-local animation guesses or edit Pen to show them.
- Verify visual parity at 1440, 1024, and 390 px with matched screenshots, plus required content, role, state, keyboard, zoom, and reduced-motion coverage.

### Task Completion

Before the final response:

1. Run the relevant checks and tests.
2. Verify code against `05-MVP-RFC.md` and architecture changes against `10-CODE-ARCHITECTURE.md`.
3. Update `11-PROJECT-STATUS.md` for behavior changes.
4. Update `12-DECISION-LOG.md` only when an explicit decision was made.
5. Confirm that code and canonical documentation do not silently contradict each other.
6. Report code changes, documentation changes, status changes, remaining gaps, and open founder decisions.

<!-- BIDPLACE_PROJECT_RULES_END -->

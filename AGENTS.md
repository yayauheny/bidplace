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

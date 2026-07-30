---
name: code-review-best-practices
description: Short, repo-specific code review checklist for bidplace diffs, pull requests, and commits. Use when reviewing changes in apps/api, apps/mobile, or packages/*, or when the user asks for PR feedback, review findings, or code review best practices.
---

# Code Review Best Practices

Review `bidplace` changes for real bugs and regressions first. Keep comments short,
specific, and tied to the changed code.

## Check First

- `apps/api`: auth, permissions, Prisma/schema changes, migrations, webhooks, external APIs, error handling.
- `apps/mobile`: list performance, navigation, images, safe areas, gestures, animation, rendering crashes.
- `packages/*`: public exports, shared types, API contracts, dependency boundaries.
- `turbo` impact: make sure touched packages cover the affected graph with tests and typecheck/lint where relevant.

## What Matters Most

- Correctness: broken assumptions, null/empty handling, state transitions, off-by-one errors.
- Safety: auth bypasses, leaking sensitive data, unsafe external calls, bad validation.
- Behavior: regressions in user flows, API contracts, mobile rendering, or shared types.
- Tests: missing coverage for changed behavior and failure paths.
- Performance: unnecessary rerenders, expensive loops, bad list rendering, unbounded work.

## Communication

- Start with findings ordered by severity.
- Include file and line references.
- Explain the risk in one sentence.
- Suggest the smallest fix that makes the change safe.
- If there are no findings, say that clearly and mention any residual risk or test gap.

## Review Flow

1. Read the PR description and understand the intended behavior.
2. Scan the diff for risk hotspots.
3. Trace the main code path end to end.
4. Check tests, failure handling, and edge cases.
5. Leave only comments that change the outcome of the PR.

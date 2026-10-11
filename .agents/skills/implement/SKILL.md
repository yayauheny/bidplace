---
name: implement
description: Implement bidplace features and fixes with less custom code, existing library APIs, shared design, and the project review checklist.
---

# Bidplace implementation

Read and apply [AGENTS.md](../../../AGENTS.md) in the active checkout and applicable nested instructions before implementation. Follow its owner-document and skill routing; it owns scope, durable fixes, architecture, shared tokens/design, security, verification, documentation, and Git rules. Do not duplicate those rules here or borrow another checkout's context.

Read the [project review checklist](../code-review-best-practices/SKILL.md) before choosing a solution. Use every applicable check as an implementation acceptance criterion, then apply it again to the real diff and affected consumers before completion.

## Less code first

- Search the repository and the installed libraries' APIs before writing custom logic. Prefer an existing project implementation, then a suitable built-in library capability, then the smallest custom code for a demonstrated gap.
- Compare options by required behavior, supported platforms, ownership, and maintenance. Prefer fewer moving parts and less custom code when they satisfy the same requirements; avoid rebuilding available capabilities behind new wrappers or parallel implementations.
- Keep exact design and contracts, required validation, session/concurrency protections, and meaningful regressions. Less code means simpler responsibility and reuse, not terse code, weakened checks, or an approximate result.

## Completion

Resolve findings using the existing owner and authorized scope. The review checklist governs affected boundaries, rendered behavior, cleanup, regression gates, and the final evidence-based report. Distinguish checks actually run from worker claims and remaining gaps; implementation is not complete while required checks fail.

---
name: code-review-best-practices
description: Review bidplace changes for correctness, reuse, affected boundaries, and future maintenance; use for diffs and returned implementations.
---

# Bidplace code review

Apply root `AGENTS.md`; inspect the diff and real consumers, not only the implementation report.

- Check existing components/tokens/services/contracts, duplicated state or rules, unnecessary helpers, and superseded code. Always give a brief future-maintenance assessment.
- Trace affected UI -> contracts/client -> service -> repository/database -> build/release. Check compatibility, ownership, and unbounded work; use `security` when trust boundaries change.
- Frontend: inspect rendered geometry, responsive/short/resize states, errors, focus, and hit behavior; DOM presence or tokens alone prove little. Backend: check validation, transactions, concurrency, canonical data, and old/new writers where affected.
- Require a durable root-cause fix; use `grilling` before prescribing unresolved architecture/scope choices. Check meaningful assertions and cleanup; preserve important regressions and visual gates.
- Report evidence-backed findings with severity, file/line, impact, and correction. Separate blockers, accepted differences, and optional improvements; distinguish own checks from reported results and verification gaps.

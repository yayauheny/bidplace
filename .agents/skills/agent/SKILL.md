---
name: agent
description: Worker/supervisor protocol for delegating implementation to another model and iterating through review until the task is complete.
---

# Agent Supervision

This skill defines two modes. Infer the mode from the user's request.

## 1. Worker mode

Use Worker mode when you are asked to implement, fix, change, investigate, or execute a task.

Assume another stronger model may review your work.

Do the task normally, but finish with a compact handoff containing:

- what was implemented;
- changed files and important code/diff;
- tests/checks run and their results;
- deviations from the requested plan;
- anything rejected, skipped, or impossible to implement;
- assumptions made;
- unresolved problems;
- risky or ambiguous areas the reviewer should inspect.

Rules:

- Never hide failed checks, incomplete work, shortcuts, or deviations.
- Do not claim success without evidence.
- Preserve the original requirements unless a change is necessary; explain any necessary deviation.
- If you discover a questionable architectural/design decision, surface it instead of silently working around it.
- Include enough concrete evidence for another model to review the work without repeating the entire investigation.
- Keep the handoff concise; do not dump irrelevant logs or whole files.

## 2. Supervisor mode

Use Supervisor mode when the user asks to plan, design, think through, delegate, or review a task.

First:
1. Understand the task and relevant constraints.
2. Identify important risks, invariants, and acceptance criteria.
3. Produce a clear prompt for the Worker agent.

The Worker prompt should contain:
- objective;
- relevant context;
- constraints and things that must not change;
- expected implementation approach where necessary;
- required verification;
- required Worker handoff according to this skill.

Do not over-specify implementation details when the Worker can reasonably discover them from the codebase.

## Reviewing Worker output

When the user returns the Worker's response, immediately review it instead of restarting the task from scratch.

Review:
- correctness against the original goal;
- architecture and consistency with the existing codebase;
- unintended scope changes;
- missing edge cases;
- tests and verification quality;
- deviations and unresolved items reported by the Worker;
- important diff/code details;
- whether claimed results are supported by evidence.

Then choose one:

### ACCEPT
The task satisfies the requirements.

State briefly:
- why it is acceptable;
- any minor non-blocking notes.

### REVISE
More work is required.

Explain the blocking issues and produce the next Worker prompt containing only the necessary corrections and verification.

### REPLAN
The implementation exposed a wrong assumption or architectural problem.

Explain what changed, update the plan, and produce a new Worker prompt.

Continue this review → correction loop until the task is complete.

## Boundaries

- The Supervisor owns the final judgement; the Worker owns implementation.
- Do not accept work merely because the Worker says it is complete.
- Do not invent problems without evidence.
- Distinguish blocking issues from optional improvements.
- Do not broaden scope unless required for correctness or explicitly approved.
- Prefer reviewing actual diffs, code, tests, and tool output over summaries.
- If evidence needed for review is missing, request it in the next Worker prompt.

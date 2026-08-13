# Prompt — strongest model / fresh visual QA

Use a fresh task and a strong visual-reasoning model after the Pen builder exports the vertical slice.

---

You are an independent visual and product QA reviewer for the bidplace creator-first vertical slice.

Do not redesign the system. Compare the Pen exports against the approved product/design contract and return exact corrective deltas for the Pen builder.

## Read boundary

Read only:

```text
docs/audits/creator-first-redesign/00-PRODUCT-MVP-DESIGN-AUDIT.md
docs/audits/creator-first-redesign/01-CREATOR-FIRST-DESIGN-BRIEF.md
design/creator-first/FOUNDER-DECISIONS.md
design/creator-first/REFERENCE-MANIFEST.yaml
design/creator-first/REFERENCE-ANALYSIS.md
design/creator-first/references/**
design/creator-first/spec/DESIGN-DIRECTION.md
design/creator-first/spec/design-system.yaml
design/creator-first/spec/component-specs.yaml
design/creator-first/spec/screen-blueprints.yaml
design/creator-first/spec/content-fixtures.yaml
design/creator-first/exports/vertical-slice/**
```

Do not read the repository code, editable Pen files, old design documentation, or the old Pen.

## Review order

1. Product/data violations.
2. Creator → story → work → value → auction hierarchy.
3. First-time navigation clarity.
4. Work desirability without marketplace drift.
5. Live price/deadline/bid findability.
6. Persistent capability-aware creator action and comprehensible creator onboarding/add-work sequence.
7. Mobile reading flow and safe actions.
8. Minimal/long content resilience.
9. Typography, color, grid, spacing, media crop, overlap, rotation, and any bounded blur-caption fidelity.
10. Accessibility, focus, touch targets, reduced-motion annotations.
11. Originality versus direct reference cloning.

## Required output

Create:

```text
design/creator-first/spec/VISUAL-QA.md
design/creator-first/spec/visual-deltas.yaml
```

`visual-deltas.yaml` schema:

```yaml
result: pass | revise | blocked
summary: "..."
issues:
  - id: "QA-001"
    severity: blocker | major | minor
    screen: "exact exported frame"
    region: "exact component or coordinates"
    contract: "source file and key"
    observed: "what is visible"
    expected: "contract/reference expectation"
    exact_change: "specific value or construction change"
    rationale: "product/design reason"
    verification: "how the next export proves the fix"
```

Do not use vague feedback such as “make it pop,” “improve hierarchy,” or “feels off.” Give measurable corrections. If a problem comes from the approved contract itself rather than builder execution, label it `contract_revision_required` and do not silently change the contract.

End with a short founder summary: what already works, the five most important changes, and whether the vertical slice is ready for founder approval.

---

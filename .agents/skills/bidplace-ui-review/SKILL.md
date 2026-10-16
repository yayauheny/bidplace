---
name: bidplace-ui-review
description: Review a Bidplace UI implementation against verified Figma, responsive behavior, shared component ownership and theme tokens. Use for a UI diff, returned implementation or visual acceptance; report measured evidence and verification gaps.
---

# Bidplace UI review

Review code and rendered output, not the implementation report. Apply bidplace-ui, repository owners and [workflow](../../../docs/design/FIGMA-TO-CODE-WORKFLOW.md); combine code-review-best-practices for state/API changes. No implementation unless requested.

## Source and completeness

Record SHA, exact node/capture and visual scope. Compare visible content/ordering/assets against the reference and relevant design subtree. Distinguish app chrome from OS chrome, behind-overlay content, clipped/hidden layers and missing design. Product rules outrank sample auction/social-auth content. Unreported source conflicts are blockers; absent desktop/black designs remain NEEDS-FIGMA.

## Ownership and theme

For container, Safe Area, dialog/sheet, field, button, tabs, back, grid, text and icon: identify the existing renderer and variants. Flag route-local copies and conflicting owners, not folder names or legitimate semantic wrappers. Check affected consumers before recommending deletion.

Trace theme colors through tokens → active provider → component/state/CSS/SVG. A central file of constants alone is not runtime theming. Inspect module-level computed colors, button/search sub-palettes and gradients/shadows. Equal colors can be different roles. Unique geometry needs provenance; repeatable styles need shared tokens/variants. No blanket even-number, minus-one stroke, line-count, boolean-count or net-negative-diff gates.

## Rendered checks

- At exact reference viewport: compare section order, relative alignment, widths/heights, padding/gaps, typography/wrapping, assets, stroke, overlay and controls. Capture app and reference at matched viewport, fonts, state and scale. Use side-by-side or overlay; investigate geometry before antialiasing.
- Representative mobile widths: 320, reference 390, 414 and 440 CSS px; short height around 568 and normal height; 1024/1440 for layout robustness where no approved desktop frame exists. These are test cases, not device-specific production constants. Narrow the matrix for isolated component-only changes with a stated reason.
- No unintended page-level horizontal overflow, clipped controls or inaccessible scroll regions; allow intended carousels. Check long text, errors, loading, missing images and the relevant owner/visitor states.
- Web 200% browser zoom and enlarged text; reflow at 320 CSS px (or equivalent 400% zoom from 1280) for relevant full-page acceptance. Do not count a changed viewport alone as proof of real zoom. Native fontScale/keyboard/Safe Area require emulator/device evidence when native is in scope; browser emulation is not such evidence.
- Keyboard focus/Tab/Shift+Tab/Escape and dialog focus return; touch targets per project contract, reduced motion. Theme changes, when in scope, update existing mounted controls including portals and gradients.

Use Chromium for iteration; add WebKit on touched typography/viewport/overlay/focus flows. Shared component changes require representative consumers, not whole-repo E2E by default. Maintain scenario/assertion meaning; never bless unexplained screenshot differences or loosen tolerances to turn green. Pixel-perfect RGBA equality across Figma and browsers is not a realistic universal gate.

## Report

Give accept / fixes required / not verified, ordered findings with source+file, user impact, maintenance risk, chosen correction and acceptance check. Attach viewport/state/browser evidence, distinguish visual parity from robustness checks and list unrun checks. Pass typecheck/lint/relevant owner tests, but do not claim visual Done without rendered evidence. Required status docs must reflect actual acceptance. Stop when the bounded requested scope is verified; unrelated debt stays a separate finding.

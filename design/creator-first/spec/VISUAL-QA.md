# Visual QA — bidplace creator-first Pen

Date: 2026-08-14
File audited: `design/pen/bidplace-creator-first-v1-copy.pen` (same tree as `bidplace-creator-first-v1.pen`)
Result: **revise** only for founder pixel approval in Pen. Numbered QA-001–QA-039 are addressed in JSON.
Canonical `bidplace-web-v2.pen` was not opened.

Sources (priority order): `design-system.yaml`, `component-specs.yaml`, `screen-blueprints.yaml`, `content-fixtures.yaml`, `pen-build-plan.md` §7.

Machine-readable deltas: `visual-deltas.yaml`.

## Founder summary

Reload `bidplace-creator-first-v1-copy.pen`. Color pass after the WePresent reference:

- Works are no longer white cards. Each work has its accent_soft frame (yellow / pink / orange / teal / brown) with the photo inset and the caption on the color.
- Home authors is a peek carousel like WePresent. The «Авторы» heading is gone — nav already has that route.
- Creator cards show the color around the portrait; name sits under the photo in ink, not on a dark glass strip.

Pixel approval still needs your visual pass after reload. Copy without fixtures stays off the product surface.

### Addressed in this finish pass

- **QA-030:** `auction_panel/default` and `bid_dialog/first_bid` have sibling annotations; they are reusable masters, not extra screens.
- **QA-031:** `#FFFFFF` → `$surface`; caption-on-photo / dialog muted white → `rgba(255,255,255,0.82)` / `0.72`. Elevation effect hex left as documented e1/e2/e3.
- Explore «124 работы» fiction replaced with **6 работ** from fixtures; w-5120 and w-6144 added on 1440/1024/390.
- Process stills: long-title media_stack + process_steps bind `asset_w3072_02_stitches`, `s1_print`, `s2_stitch`, `03_wip`. Ceramics live-no-bids binds `asset_w4096_02_glaze` and `03_kiln`.
- Route artboards: **0** visible `Missing spec:` strings. Footer positioning caption omitted from chrome.
- Server error specimens use `ui_copy.errors.load_failed` «Не удалось загрузить». Future board label «Мои авторы» from the quoted follow_creator surface.

### Still not invented (no fixture)

These remain only on component boards and/or annotations:

- become-band body line
- filters apply button label (pill chrome unlabeled)
- footer one-line positioning caption
- auth email label / code error / resend cooldown format
- onboarding step 3/4 questions; work-creation field labels and checklist strings
- eligibility helper captions; first-bid explainer; order/handoff link
- `tikhon_v` winning history row (not in `bid_history_fixture`; ended frames already show «победитель: tikhon_v» and `1 450 BYN`)

### Prior majors (still in file)

QA-001–QA-029 and QA-032 as recorded in the previous pass: six works / four creators, rails 1280, live chips, five history rows, archive rail, 24px peek, sticky «Текущая ставка», F001–F013 annotations, Gate M image fills.

## Method

Parsed Pen JSON after the finish patch. Route-frame grep for `Missing spec:` is 0. Hex fills outside foundations/tokens and elevation effects are 0. Photographs verified by image-fill URL, not pixel-diff.

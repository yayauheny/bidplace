# Login Sheet — review and correction

Status: in progress. Branch fix/tc-final-review; starting HEAD d0e89ad2.

## Integration

Remote fetched. Current branch has15 unique commits; origin/feature/portfolio-mvp-release
has140 later commits (3818f0f3). Agent diff preserved in stash `login sheet review baseline`
and /tmp/bidplace-login-before-review.patch. Untracked .cursor left untouched.

The old branch predates shared SheetDragSurface, semantic palettes, auth focus and
DEC-124/125. The latest confirmed registration contract is ONE checkbox recording
all four mandatory booleans, lazy document reading without a registration block.
References to four independent controls in the older prompt are superseded by
these explicit founder decisions; restoring that UI would regress the MVP merge.
The disabled-Next behavior from d0e89ad2 is retained for the current confirmation.

## Findings / priority / correction / acceptance

- P1: agent duplicated gestures using global pointer listeners and PanResponder.
  Durable: use current SheetDragSurface/Handle; no new global gesture owner.
  Verify header swipe only, cancel, busy guard and regular content scroll.
- P1: viewport height snapshot can become stale; Math.max(...,200) can exceed short
  keyboard viewport. Reuse/extend the actual layout owner after integration.
  Verify short height and resize without losing fields; real device remains separate.
- P1: mobile close has an invisible click target instead of an explicit keyboard-only
  affordance. Use accessible visible-on-focus close and preserve focus return.
- P1: branch integration must preserve new theme role ownership; legalLink belongs
  to theme.ts, not a resurrected static color block in tokens.ts.
- P2: desktop form keeps mobile separator and51px button spacing, contradicting the
  composition. Use existing responsive composition and existing button size API;
  master292:5058 owns typography/state, screen owns layout.
- P2: field height50 vs Figma51: inspect measured border box and owner variant, do
  not patch with login-only pixels or mutate unrelated field consumers.

Sources: live Figma4547:22472 (mobile sheet),3429:12455 (desktop dialog),292:5058
(button master) retrieved with design context and screenshots. Registration
composition/backend/consent meaning are not changed for visual similarity.

## Next user-authorized stage

After Login acceptance, finish creation/editing work screens from supplied nodes;
exclude bids/buying/auction configuration. Reuse current ordered story blocks,
heading/text/image and move up/down/delete. Image menu always available, text menu
on hover/focus and reachable on touch. Preserve persistence, moderation and owner
boundaries; inspect exact Figma before changes.

## Integration completed

Merge committed as e3ba8074. Contracts/api-client rebuilt; Expo SDK57 route types
regenerated with the installed @expo/router-server generator (cache only).
Mobile typecheck and35 owner tests passed. pnpm11 optimisticRepeatInstall gave a
false up-to-date result after interrupted linking; restored with the unchanged
lockfile and optimisticRepeatInstall=false. No dependency versions changed.

Auth correction now reuses SheetDragSurface and AppDialogSheetMotion. Original
agent patch remains saved, not reapplied wholesale. New authDialog button size
retains master typography and47px desktop composition; auth field metric is51px
without changing default fields. No fixed545px sheet height is introduced.

## Acceptance 2026-10-21

Implemented: mobile full-width below768, centered420 dialog from768; one form
preserves values/errors across resize. Handle outside scroll; padding20 inside
scroll prevents field clipping. Accessible close is visible on keyboard focus,
not an invisible clickable mobile target. Direct URL dismissal focuses dock fallback.

Checks: production export; mobile typecheck;62 owner tests;20/20 Chromium/WebKit
acceptance including320/390/414/440/767/768/1024/1440, short480 height, client errors,
resize, backdrop/Escape/keyboard close/swipe, login↔forgot, registration dirty cancel.
Focus tests now wait for initial focus: visible inert entering content is not ready
for user input. No timeout or assertion weakening, no change to registration guard.
Evidence: [current screenshots](evidence/2026-10-21-login-review/geometry.json).

Diff size: AuthViewport is mostly moved header/scroll markup, not a second gesture
implementation. Old bespoke gestures were not transplanted. Shared viewport helper
owns keyboard viewport dimensions; presentation policy is shared with LoginForm.
Known visual differences: current master button typography; informational legal
copy (not inferred consent); autofocus floating label. Physical iPhone keyboard,
real200% browser zoom and device smoothness remain Needs verification.

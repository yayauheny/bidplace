# Date selection and dock

Branch: feature/date-selection; base9a7f5ff0. Progress is recorded during work.

- Dock: completed07acb820. Home path equals live Figma7008:16942; shared registry,
  four MVP routes unchanged. Unit5/5, rendered Chromium/WebKit320/390/440, build,
  typecheck and lint passed.
- Decision: founder selected React Aria for web (including mobile Safari),
  Expo/system control for native where DOM-based React Aria cannot run.
- DateField: in progress. Existing FigmaSelectField and AppDialog own the shell;
  React Aria owns calendar keyboard navigation. Theme colors resolve at render.
- Current actual date input: author achievement month/year with optional day.
  Creation year is a numeric0..9999 value, not a complete date; publication time
  remains server-generated. No scheduling/time field is introduced.
- Persistence: keep dateInput string draft format, strict shared contract
  validation, calendar year/month/day including day:null; no UTC conversion.
  Opening/cancel must not emit a value. Disabled or externally replaced input
  closes the picker; account switch remounts it. Existing write leases stay.
- Owner checks: achievement-date and achievement owner41/41 passed after preserving
  the historical null-date label. Typecheck passed. Component/browser acceptance
  and final gates remain pending.

Sources: [Expo SDK57](https://docs.expo.dev/versions/v57.0.0/sdk/date-time-picker/),
[React Aria](https://react-aria.adobe.com/Calendar).

## Additional root cause found during rapid-reopen acceptance

Installed Reanimated web `handleExitingAnimation` moves live descendants into
its dummy clone. Rapid close/reopen exposed duplicate year controls and could
apply the displayed old month. Fix is in the shared web sheet owner:
one persistent Animated.View with withTiming and inert/aria-hidden during exit.
Native keeps its existing layout enter/exit. No delay, timeout or assertion
relaxation is used. DateField starts a fresh selection session on each opening.
Final browser checks are in progress.

## Follow-up after this task (founder browser comments)

1. Fullscreen registration: add shared close/back affordance, preserve dirty guard.
2. Search overlay tabs: align/fill available content width.
3. Search author rows: round hover/selection surface through shared tokens.
4. Public author atmosphere: remove abrupt clipping at the page gutter.
5. Focus rings: pointer vs keyboard modality and service palette; retain accessible
   keyboard focus. Do not remove outlines globally.

Founder asked to do these small changes after the calendar/dock task, not during it.

## Final primary-task verification

- Owner/state/modal unit:65/65 (5 files). Dock/registry:5/5 separately.
- Mobile typecheck, touched-file eslint and diff-check pass.
- Production web export passes. iOS JS/Hermes export passes; this is not a
  simulator/device or binary-build claim.
- Final Chromium/WebKit gate6/6: leap-day keyboard selection, explicit month-only
  choice, cancel/reopen, focus return,320/390/440 and short viewport, real POST
  and moderation/publication projection; auth dirty-confirm and live Home/share
  verify other shared-sheet consumers and preservation of loaded images.
- Evidence: /tmp/bidplace-date-picker-evidence/date-picker/{chromium,webkit}-calendar.png.
- Image inspection caught RN numeric lineHeight becoming a DOM multiplier; it is
  converted to CSS px once in DateSelection. WebKit select native appearance was
  normalized to preserve the44px token height. Browser assertions measure both.
- Web sheet has explicit entering/ready/closing phases. Only a fully entered
  surface is interactive; settled transform is removed, closing content is inert.
  This also prevents WebKit losing the first pointer release during a transition.
  No arbitrary waits, repeats, skipped cases or weakened assertions were added.
- Public granular React Aria entrypoints avoid importing its entire index.
- Local dev DB was not reset; existing fixture setup created synthetic E2E
  records and needed e2e-art category, which was added without modifying others.
- Server source/schema are unchanged. Full publication/onboarding spec was
  updated to the new control but not executed in full; its current coverage gap
  remains explicit. Real browser zoom, screen reader and native device checks
  remain unverified. Black theme remains provisional/not enabled.

Primary task complete for web. Five browser follow-ups below remain a separate
subsequent wave, as the founder requested.

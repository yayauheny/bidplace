# Mobile Web form UX stabilization — 2026-10-26

**Partial: browser/code acceptance complete; physical-device release acceptance pending.**
Baseline663be587. Scope: existing global.css, useVisibleViewport, AppShell,
AuthViewport, AppDialog and FloatingDockFrame.web. No new dependency, gesture
system, keyboard manager, navigation or server contract.

## Findings and before/after

| Finding | Confirmed cause / before | After / evidence |
| --- | --- | --- |
| Small editable text | Live390×874 touch Chromium login email/password computed14px; field/authPassword tokens14; story heading15/body14 | Coarse/no-hover CSS16px for editable controls; OTP retains larger22px. Login input height remains24px; before.json/after.json and PNG pair |
| Double-tap policy gap | RNW Pressable already manipulation, real input auto; noninteractive scrollports did not establish manipulation | Touch UI manipulation policy; custom drag/disabled scroll rules retain priority; meta never disables zoom. Actual CDP pinch passed |
| Forms/actions can extend below visible viewport | AppShell flexes into layout viewport; body scrolling disabled and forms use their existing ScrollView | Existing shared viewport hook constrains Web shell; no page remount, field clearing or scroll manager |
| Input sheets below keyboard | AppDialog maxHeight used RNW dimensions but fixed host remained inset0 over full layout viewport | Host now uses existing visible height/top, as AuthViewport already does; catalog input/focus and restoration tested |
| Dock occlusion | Dock fixed to layout bottom; no reduced-viewport condition | Coarse-input focus plus real viewport reduction hides dock without changing page reserve; closes keyboard while zoomed restores dock with focus retained |
| Fullscreen auth scroll jump | AuthViewport reset scrollTo(y0) depended on every height change | Reset only on presentation change; registration scroll preserved across resize |
| Pinch changes mistaken for keyboard | Hook previously used raw vv.height; RNW0.21.2 Dimensions already normalizes vv.height*scale | Hook follows normalized/rounded height, real layout height from documentElement.clientHeight; pinch pan does not move layout, keyboard close while zoomed still updates |
| Rapid repeat actions | Existing synchronous refs/locks in auth, profile operation guard, Work save/submit and image picker | Preserved; rendered rapid-login test sends one pending request; existing lifecycle/submit/upload unit owners pass |

Visual padding/field labels/theme typography tokens are unchanged. On touch,
editable text and its placeholder use16px; external labels may stay smaller.
The current non-OTP editable owners are14/15/16px, all covered by this floor.
Desktop mouse/fine-pointer fields stay14px. Native has no browser CSS; existing
window-dimensions fallback retained. **One Native behavior also changes:**
fullscreen auth no longer resets scroll on height changes. Device verification
for that intended scroll-preservation behavior is pending.

## Verification boundaries

`mobile-form-ux.spec.ts`:320/390/landscape874×390 login/register/recovery,
Work long text and focus switching, profile photo picker + identity edits,
catalog input sheet, auth reduced viewport, dock keyboard/pinch/close,
registration scroll, one pending login submit and desktop14px retention.
23 checks pass,1 explicit skip: WebKit has no CDP pinch injection. Real Chromium
pinch uses the browser VisualViewport; keyboard tests use an explicitly synthetic
EventTarget model, including the corresponding width/scale relationship.

`use-visible-viewport.spec.ts`: shrink/pan, pinch, keyboard close while zoomed,
fractional rounding, listener cleanup, no API and Native platform fallbacks.
Existing auth/registration/profile/Work save/upload owners retain pending-state,
concurrency, persistence and permission checks. No E2E fixture writes were made
to the manual-preview database. The mocked authenticated user/profile fixture
contains only synthetic data; Work creation/submit was not sent to the server.

Local ignored images:before-login.png /after-login.png, matching390×874 touch
viewport. JSON contains only public layout metrics. No real credentials or
user form values in evidence.

## Physical-device acceptance still required

- iPhone Safari: actual double-tap/focus zoom, long Work/profile/auth forms,
  keyboard Next/Done, dismiss/reopen, address-bar pan, rotation, zoomed typing.
- Chrome Android: actual keyboard, sticky action reachability, hide/restore dock,
  pinch, horizontal gallery swipes and scroll without lost input.
- Complete Work wizard with real photo upload, step transitions and submission;
  these persistence/upload guards were verified by source/unit owners, not a
  full real-phone production flow in this task.
- VoiceOver/TalkBack, physical Native keyboard behavior and safe areas.

The CSS policy and synthetic viewport checks are not proof that an OS keyboard
behaves identically. No maximum-scale/user-scalable prohibition, global touch
preventDefault, forced zoom reset, new timers or interactive-widget workaround.
No merge/deploy.

Standards: [MDN touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action),
[Chrome viewport behavior](https://developer.chrome.com/blog/viewport-resize-behavior).
Installed RNW Dimensions source is the owner for normalized viewport semantics.

## Final checks and review

1083 mobile units passed (including4 viewport owner cases); affected dependency
graph typecheck/lint/test passed (11 Turbo tasks).23 Mobile Web checks passed,
1 CDP-only WebKit case explicitly skipped.122 existing auth/Share/Back regression
cases passed across Chromium/WebKit:121 in the full run plus1 isolated repeat
after a WebKit segmentation fault during gallery test cleanup. No assertions,
timeouts, retries or release thresholds were relaxed. Web/iOS/Android exports,
changed-code Prettier,199-file docs links, E2E fence and diff check passed.

Independent review accepted after correcting layout-vs-RNW viewport identity,
zoomed keyboard recovery, rounding and fullscreen scroll reset. Reviewer also
independently ran owner units and Chromium/WebKit viewport smoke checks.

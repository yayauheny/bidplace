# Story interaction and opening avatar — 2026-10-28

Status: **Partial**. Branch `feature/photo-workflow`, base `6c164bbc`.
Testing uses isolated Playwright Chromium/WebKit processes against API 3017 / Web
8087 and the existing disposable `bidplace_e2e` database. No database reset,
production/CDN access, user-browser control, push, merge or deploy.

## Reproduced defects and corrections

- The selected closed story block had z-index 0, so later blocks covered the
  lower portion of its nominal 44×44 control. Restore selected-block elevation;
  textareas stay left of the gutter. All nine sampled hit points are mandatory;
  the previous skip for covered points is removed.
- Repeated zero-height measurement reset scrollTop (observed 172→0). Separate
  focus and measurement effects and only measure layout when width changes.
  At 390/1024/1440/390, the probe paragraph measures 280/80/80/280 px in both
  engines, without horizontal overflow. The maintained regression uses its own
  longer text and requires shrink/restore rather than those fixture-specific values.
- RN Web 0.21.2 dismisses input focus on every scroll for `on-drag`, including
  automatic scrolling to reveal an input. Web FormPageShell keeps focus during
  scrolling; Native retains its existing keyboard-dismiss behavior.
- The 54px opening avatar clipped the text retry button. At the user's explicit
  request it uses the existing gray plain fallback without a manual action.
  Pending/failure geometry matches; automatic retry and screen-reader description
  remain. No new component, token or retry mechanism.

The pointerEvents hypothesis was tested separately and rejected: removing it did
not solve scroll resets. The original inactive-gutter setting remains. The scroll
check now targets the actual `form-page` owner and requires movement, replacing
an incomplete ancestor scan and conditional assertion.

## Design comparison and limits

The accepted density and active-only control policy remain: text line-height
24/20, gap 6, image/toolbar gap 20, separate 44px gutter. Screenshots retain the
existing Figma sources and accepted differences documented in
[previous evidence](../2026-10-28-story-editor-controls/README.md).
Toolbar remains 272.21875×53 versus Figma 275×52. This pass changes interactions,
responsive text measurement and the explicitly requested avatar fallback;
it does not claim a new pixel-diff or full Figma conformity.

Actual browser zoom 200%, physical iOS/Android, Native animation smoothness,
system drag ghost and live CDN are unverified. Wide responsive checks are
functional; exact 1024/1440 parity remains NEEDS-FIGMA. The original missing-CTA
scenario is not claimed fixed. Server-side gallery/story file reuse is not
implemented; session SHA-256 is separate.

## Checks

- Node 22.20.0: mobile typecheck, lint without autofix, e2e-fence passed.
- Full mobile unit: 141 files / 1124 tests passed (normal parallel runner).
- `pnpm --filter @bidplace/mobile build:web` passed after final runtime edits.
- Maintained geometry/keyboard story test, photo/status/story regression, and
  opening-avatar pending/failure test passed in Chromium and WebKit: 6/6.
- Documentation links and `git diff --check` are checked before commit.

No retries/timeouts/size tolerances were relaxed. The former neighbor-strip
assertion contradicted the accepted 44×44 active target, since both overlapped
that same coordinate. The nine-point trigger contract now owns that part of the
gutter; both neighbor textarea edges remain independently tested in both orders.
Scroll assertion is mandatory and checks the actual form scroll owner.

## Screenshot inventory

PNG dimensions are read from the files, not inferred from filenames. The 390px
frames are all 390×874 viewport captures. Both engines cover empty history,
two paragraphs, heading/paragraph, open menu, five photos plus add, and the
opening avatar pending/failed states. 1024/1440 frames show long-text resizing.


- [chromium-opening-avatar-failed-390.png](chromium-opening-avatar-failed-390.png) — 390×874
- [chromium-opening-avatar-loading-390.png](chromium-opening-avatar-loading-390.png) — 390×874
- [chromium-photos-five-plus-add-390.png](chromium-photos-five-plus-add-390.png) — 390×874
- [chromium-story-empty-390.png](chromium-story-empty-390.png) — 390×874
- [chromium-story-heading-paragraph-390.png](chromium-story-heading-paragraph-390.png) — 390×874
- [chromium-story-long-1024.png](chromium-story-long-1024.png) — 1024×874
- [chromium-story-long-1440.png](chromium-story-long-1440.png) — 1440×874
- [chromium-story-menu-open-390.png](chromium-story-menu-open-390.png) — 390×874
- [chromium-story-two-paragraphs-390.png](chromium-story-two-paragraphs-390.png) — 390×874
- [webkit-opening-avatar-failed-390.png](webkit-opening-avatar-failed-390.png) — 390×874
- [webkit-opening-avatar-loading-390.png](webkit-opening-avatar-loading-390.png) — 390×874
- [webkit-photos-five-plus-add-390.png](webkit-photos-five-plus-add-390.png) — 390×874
- [webkit-story-empty-390.png](webkit-story-empty-390.png) — 390×874
- [webkit-story-heading-paragraph-390.png](webkit-story-heading-paragraph-390.png) — 390×874
- [webkit-story-long-1024.png](webkit-story-long-1024.png) — 1024×874
- [webkit-story-long-1440.png](webkit-story-long-1440.png) — 1440×874
- [webkit-story-menu-open-390.png](webkit-story-menu-open-390.png) — 390×874
- [webkit-story-two-paragraphs-390.png](webkit-story-two-paragraphs-390.png) — 390×874

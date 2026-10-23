# Portfolio design — 2026-10-23

Status: browser-verified implementation; native/live acceptance remains Partial.
Base: 7d0dc179b12aeeaaf08a07453db4820d6cfd26b5.
Source: live read-only Figma HRRtDp0bQlukw7ptTkuEZg, captured 2026-10-23.

| Nodes                                    | Owner                                                      | Layout / change                                                                                                                                            |
| ---------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4547:26392, 4551:31353                   | ProductDraftImagesStep, ProductBlockActions, FormPageShell | Fill grid, portrait 3:4, 12 gap, 177×236 at 390; empty tile hugs 177; bottomAction outside scroll; tile-local feedback.                                    |
| 5067:25914, 4419:16223/16308/16371/16334 | existing author application steps and useProfilePhoto      | Five UI stages, legacy numeric steps unchanged; photo before basics shares mounted owner, create only with required basics.                                |
| 4419:16211                               | AuthorIntroDialog, AppDialog mediaSheet                    | Existing collage; content-driven sheet constrained by host, body scroll on short viewport.                                                                 |
| 874:5473, 874:5552                       | CoverFrost                                                 | Bottom blur30 with scrim, author top scrim without blur; text-hugging overlays, clipped by card. These are card references, not whole author-page layouts. |
| 4980:16350                               | SiteFooter, PageScrollView                                 | Existing public footer owner, fluid logo/columns; no footer in auth/editor/overlays; portfolio links retained.                                             |

## Constraints and accepted differences

- No server, client API, database or media lifecycle changes. No commerce/video.
- Pencil omitted: safe replacement is a separate functional dependency; never delete then upload.
- Work steps remain information/photos/story/review. Author photo is UI-only; no new draft storage. Refresh before first save requires selecting photo again.
- Existing typography and portfolio content remain where requested nodes only change effects or contain non-MVP content. City remains optional; achievement image upload is not reintroduced.
- NEEDS-FIGMA: exact desktop and black-theme composition for newly supplied mobile frames; use existing responsive/theme rules without claiming exact parity. Error/retry states reuse existing components and behavior.

## Acceptance

Reference390, robustness320/414/440, short viewport, desktop1024/1440, resize, zoom200%, keyboard/focus, states and affected consumers. Run typecheck, lint, owner tests, browser tests and build; record actual results here. Independent review required after each stage.

## Intake clarification / independent review

Resolved children: author section4419:15999 contains photo5067:25914; intro4419:16000 contains sheet4419:16211; catalog4320:9655 contains footer instance4980:16350. Nodes4530:22070 (category picker),873:4445 (payment/delivery),881:6649 (buyer contact) were inspected: reuse existing category controls; commerce-only steps are excluded.
Routes: /products/new and /products/:id (editor), /profile (author wizard), /seller/:slug and /authors/:slug (public author), /product/:id and /works/:id (public work), / and catalogs/legal (footer).
Token mapping: reuse authorApplication chrome, semantic active palette, blur.overlay; extend icon-button destructive surface; update authorTopOverlay to zero per874:5553. Photo tile geometry22/177 is local to its specific media role; grid and button remain existing owners.
Stage1 independent review: accepted with provenance/mapping clarification above.


## Implementation and independent reviews

| Stage | Outcome | Independent review |
| --- | --- | --- |
| 1 Intake | Current scoped MCP contexts/screenshots, mapping and exclusions recorded | Accepted after route/provenance clarification |
| 2 Shared | CoverFrost, destructive semantic surface, plain BackButton, creation layout/action size | Accepted; native hit bounds corrected to44px parents |
| 3 Work photos | PaddedGrid3:4, tile-local feedback/retry, direct confirmed delete, existing reorder menu, bottomAction | Accepted after44px step targets and lifecycle selector updates |
| 4 Author | Five visual steps, unchanged numeric links, one photo/basics state owner; reconcile uncertain create before retry | Accepted after confirmed-absence routing and recovery-key fixes |
| 5 Public effects | Shared CoverFrost applied to all existing consumers; no card-to-page geometry transfer | Accepted; obsolete gradient-mask comment removed |
| 6 Footer | Existing SiteFooter/PageScrollView already satisfy scope; route/absence/responsive regression checks extended | Accepted without redundant production rewrite |
| 7 Acceptance | Unit/browser/media, dependency-graph checks, screenshots and owner docs | Production and completed audit accepted; no open actionable review findings |

Reviewer inspected diffs and connected production code read-only. Runtime checks
below were run by the implementer. Review did not substitute for rendered checks.

## Measured comparison / deliberate differences

At390 CSS px, first Work tile177×236, second tile starts201, gap12, radius22.
Source tile top164 minus iOS statusbar49.784 gives114.216; browser top114
(rounding difference−0.216px). Statusbar is system UI, not duplicated in web.
Bottom action uses shared `creationAction`: py14, line26, stroke0.5 =>55px,
matching4551:31379. Auth button size remains51px.

Author photo uses177×236/radius22; source guides are local to5067:25914.
Creation header web row28 retains44px targets, native row44 includes full hit
bounds. Close target at390 isx334/w44; glyph remains centered in that accessible
control. Desktop uses existing PageColumn max content1280 plus gutters, not a
fixed390 canvas. Existing single-line field outer height50 is retained; legacy
visual test assumption51 was corrected to the shared field contract.

CoverFrost web: bottom blur30, top blur0, no progressive mask; bottom upper corners12.
Browser pixel test confirms that disabling blur changes the lower artwork region.
Native fallback uses the existing image blur mechanism; identical native rendering
has not been established by web screenshots or successful exports.

Accepted product differences: four Work dots rather than six; no video copy or
video upload; extra existing reorder menu; no unsafe replacement pencil; optional
city and existing required fields preserved; achievement images not reintroduced.
Footer uses existing portfolio/legal links and44px targets; wrapping and height
follow real content, not the source's compact static text. No exact footer-height
or whole-page pixel-diff parity is claimed.

## Evidence and assets

Generated screenshots live under `$E2E_EVIDENCE_DIR` (delivered with the task report):

- `figma-4551-31353.png`, `figma-4547-26392.png`, `figma-5067-25914.png`,
  `figma-4419-16211.png`, `figma-4419-16223.png`, `figma-4419-16308.png`,
  `figma-4419-16371.png`, `figma-4419-16334.png`, `figma-4980-16350.png`,
  `figma-874-5473.png`, `figma-874-5552.png`: current MCP reference captures.
- `portfolio-design/photos-{chromium,webkit}-{320,390,414,440,1024,1440}.png`:
  same artwork sources, actual rendered grid, short440×480 viewport and live resize.
- `portfolio-design/author-photo-*`, `author-basics-*-390.png`, `author-contacts-*-390.png`;
  author publication spec also captures remaining steps and sheets.
- `portfolio-design/footer-*`, `stabilization/*cover-frost*`, `*author-frost*`.
- `portfolio-design/browser-zoom-200.png`: actual Chromium tabs.setZoom2,
  CSS viewport720/scrollWidth720 at1440 host width; separate CSS-zoom dialog checks.

`apps/mobile/e2e/fixtures/portfolio-photo-1..5.png` are original assets supplied by
current Figma4551:31353, captured2026-10-23, test-only. No temporary signed asset
URLs, credentials, generated JSX, or static production artwork copies were added.

## Verification

- `pnpm --filter @bidplace/mobile exec vitest run`:144 files /1027 tests PASS.
  Timeout test waits for final async feedback while preserving its exact message
  and same-upload-identity assertion; checks were not disabled.
- `EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck lint build --filter=@bidplace/mobile...`:
  dependency graph includes contracts, api-client, design-tokens, mobile;
  typecheck/lint and web/iOS/Android exports PASS (9 graph tasks), without auto-fix.
- Work media lifecycle:6 real API/DB browser cases PASS in Chromium/WebKit,
  including partial retry, published-revision preservation and mixed JPEG/PNG/WebP.
- Author real browser lifecycle:18 cases PASS across Chromium/WebKit for optional
  city, publication/moderation, editing revision and account logout. Extended
  visual/keyboard/failed-achievement-save cases:2 PASS in Chromium/WebKit after updating legacy geometry assertions to existing DEC-128/shared field contracts.
- Latest mock browser matrix:10 PASS across Chromium/WebKit (photo grid,
  author failure/retry/photo retention, footer, auth exclusion, CoverFrost).
  Earlier public author composition/navigation/empty/unavailable cases:6 PASS.
  Final grid scroll check:2 PASS, last tile accessible above bottomAction at all
  six widths including440×480; compare rasterized CSS-pixel bounds because browser
  scrollTop rounds fractional3:4 layout (observed0.21875px). Screenshot tolerance unchanged.
- `git diff --check` PASS; scoped forbidden-server-path diff empty;
  `pnpm docs:link-check` PASS (182 files). No server/API/media contracts changed.

Checks use the existing disposable `bidplace_e2e` database and synthetic test
configuration. No production/live services or migrations were changed. Test-only
preload prevented reading dotenv files; no stored credentials were inspected.

## Remaining limits and follow-up tasks

- NEEDS-FIGMA: exact desktop1024/1440 and black-theme compositions for the new
  mobile frames; explicit upload-error/retry/disabled/long-text reference states.
  Existing semantic state/response rules apply without claiming pixel parity.
- Functional dependency: safe gallery-image replacement with preserved identity
  and failure recovery before enabling the pencil. No delete→upload workaround.
- Native device keyboard, Safe Area on hardware, system text scale and native blur
  require device acceptance. Browser focus/scroll/resize/short-screen/zoom checks
  and exports do not prove those results.
- Live R2/CDN conditions remain a separate release gate; local media transport
  tests passed. No new backend dependency was needed for the photo UI substep.


## Subsequent release synchronization — 2026-10-23

Merged actual `origin/feature/portfolio-mvp-release`
`8b737c1bb73e3f97c16fcc2e7ea0bf6cfeb91142` after design commit8596aaf4.
Only textual conflict:04-DESIGN-STATUS; both portfolio and upstream auth entries
retained. Work media E2E merged the upstream CSRF headers with design selectors.
No own backend/API/schema edits were added on top of release.

Merged-tree checks: mobile1031, API464, api-client47, contracts46, config8 and
database1 unit tests PASS. Turborepo typecheck/lint/build17 tasks PASS, including
web/iOS/Android exports. Chromium/WebKit media6 and focused design4 browser
cases PASS. Docs link check186 files and diff whitespace PASS.

Local preparation: regenerate Expo route types for new upstream auth routes;
use synthetic OTP hash setting for media tests; disable dotenv loading only in
an external database test config. Initial local preparation failures were
resolved without changing production code or weakening assertions. Full live
OIDC/provider/native acceptance is not claimed by this synchronization.


## Review follow-up — unfinished upload batch

A new picker previously replaced `pendingUpload` after a partial failure.
`chooseImages` now guards the retained batch; Add is disabled while unfinished
files exist. Retry uses the same Blob/key and skips successful files. An explicit
Cancel action clears only the unsaved remainder and mutation feedback, without
removing saved images or changing the server/media contract. Cancellation stays
blocked during upload, picker activity and guarded transitions.

Terminal errors (e.g. source too large) can therefore be discarded before
selecting another file. Error feedback participates in normal flow under its
preview; two actions and long text no longer overrun the portrait tile into the
header at320px. Other uploading overlays retain their existing layout.
AuthorIntroDialog copy now invites portfolio creation without promising sales.

Verification:21 upload lifecycle owner tests, full mobile144 files/1032 tests,
9 Turborepo typecheck/lint/build tasks,6 media browser cases and2 focused
Chromium/WebKit responsive retry/cancel cases PASS. Both actions are below their
preview and within viewport bounds at320/390/414/440/1024/1440; resize assertions
wait for the measured grid layout, without increasing screenshot tolerance.
Independent code/lifecycle/responsive reviews accepted after correcting terminal
error recovery and narrow-screen error layout. Evidence delivered under
`upload-review/{chromium,webkit}-upload-partial-{width}.png`. Native acceptance
and precise Figma error-state references remain outside this check.


## PR61 CI teardown follow-up

Verify run39964251769 reached1032 passing mobile assertions but failed on an
unhandled React scheduler exception (`window is not defined`) after the author
characterization fixture disposed its jsdom environment. The fixture's inherited
cleanup removed DOM nodes without unmounting most React roots or clearing their
QueryClients. The existing owner now tracks mounted-view disposers, unmounts all
roots, clears clients and flushes queued work before teardown. Explicit per-test
unmount removes its disposer, avoiding duplicate cleanup. No production code,
assertions, error handling or runner thresholds were weakened.

Validation:10 characterization cases and full144 files/1032 tests withCI=true
and2 workers PASS without unhandled errors; mobile typecheck/lint and independent
review PASS. The next remote CI run remains the acceptance check for this fix.


## PR61 final review P3: finish pending gallery before continuing

Story/review navigation now requires retry success or explicit cancellation of
the unfinished upload remainder. The existing wizard availability helper owns
the rule for Continue, step controls and the navigation handler. Back, Close,
Retry and Cancel retain their existing availability; saved photos are untouched.
No server contract, idempotency key or media lifecycle changes.

Validation: full mobile144 files/1032 tests PASS, including the existing owner
regressions for blocked navigation and retry/cancel recovery; all9 Turborepo
typecheck/lint/build tasks PASS. All6 media browser scenarios PASS in Chromium
and WebKit, including disabled Continue/steps3–4 after a partial failure and
working Continue after retry. Existing responsive checks cover
320/390/414/440/1024/1440px. Independent review ACCEPT, no new actionable findings.
Remote CI on the resulting commit is still pending at this record.

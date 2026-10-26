# Photo workflow verification — 2026-10-26

Status: Partial. Decision: [DEC-148](../product/12-DECISION-LOG.md).
Current scope/limits: [architecture](../product/10-CODE-ARCHITECTURE.md),
[project status](../product/11-PROJECT-STATUS.md),
[design status](../design/04-DESIGN-STATUS.md).

Integration target: `origin/feature/portfolio-mvp-release`; workflow branch starts
at `9ef59acd` (`feature/photo-preparation-core`), underlying base `ef14bfe1`.
`23250a8b` belongs to the original planning context. No history rewrite,
merge, deploy or unrelated changes.

## Prototype and library choice

Isolated React 19.2.3/Vite 7.2.2 prototype used react-advanced-cropper 0.20.1.
Chromium and WebKit exercised pan/zoom, quarter-turn, flip, reset/cancel/reopen,
keyboard crop adjustment and pixel-output assertions, including transparent PNG.
Native source/API spike used react-native-zoom-toolkit 5.1.1 with installed
Reanimated 4.5.0/Gesture Handler 2.32.0. No simulator/device runtime is available.
These checks establish Web feasibility, not Native gesture acceptance.

Advanced-cropper supplies the required resizable frame and pan/zoom together;
react-image-crop would need custom pan/zoom, easy-crop would need a resizable
stencil. Native CropZoom embeds in the existing shell; a modal-only editor would
replace the approved screen. No second editor engine on either platform.

[Chromium prototype](evidence/2026-10-26-photo-workflow/prototype-chromium.png),
[WebKit prototype](evidence/2026-10-26-photo-workflow/prototype-webkit.png).

## Product browser evidence

Read-only Figma: `7329:704`, `7329:822`, `7329:823`, `7329:824` in
`pAPQo6cADmG5XzVmBX76EE`. Work editor:
[Chromium 390](evidence/2026-10-26-photo-workflow/editor-chromium-390.png),
[WebKit 390](evidence/2026-10-26-photo-workflow/editor-webkit-390.png).
The mixed-format E2E exercises real React components, owner API, crop-only save,
reset/cancel/focus return and confirms no fourth file-upload request. It captures
390/1024/1440 widths and checks horizontal overflow. Wider exact Figma parity
remains NEEDS-FIGMA; full visual/device acceptance remains open.

## Security/integrity evidence

`upload-safety.integration.spec.ts` uses real Nest/PostgreSQL/pipeline with only
object transport replaced: crop bounds, owner SOURCE, cross-revision slot guard,
immutable keyed replay, concurrent replacements, full gallery, staging rollback,
cleanup/attach interleaving, preserved published crop/FULL on new revision edit.
`product-draft-save-race.spec.ts` observes actual form API calls; lifecycle owner
covers partial success/addressed retry, stale selection/session/operation/Work,
recovery of accepted bytes with pending crop, lost-response delete and late editor.
Native runtime, HEIC/large-device behavior and live R2/CDN are unverified.

Unknown upload status is not proof of rejection: delete/discard retains that card
until retry/reconciliation confirms its server result, preventing late server
acceptance from leaving an untracked photo. API/client require coordinated rollout
after the migration because image metadata extends strict product contracts.

## Completed local checks

Node 22.20.0: 1097 mobile, 470 API, 48 contracts, 51 api-client and 1 database
unit tests passed; 7 upload-safety integration tests passed. Affected Turbo
typecheck/lint, API build and Web/iOS/Android export passed. Final media E2E:
6/6 Chromium/WebKit passed with unchanged timeouts (ports 3101/8181). E2E fence,
193-file docs link check and diff check passed. A concurrent run previously hit
webServer startup timeout; the final sequential run passed. Required device/live
and full visual acceptance gaps above keep status Partial. No merge/deploy.

Independent bounded review identified revision rebind, late editor opening and
uncertain-delete races; fixes were checked read-only and backed by owner tests.
The reviewer's own tests were not rerun; reported check results are from this
implementation workspace.

## 2026-10-27 — Focused corrections to 43324a17

Status: local Web/adapter fixes verified; full workflow remains Partial for
device acceptance. No backend/API/schema
changes, no new dependencies, no broad hook refactoring.

- New files are validated independently before deduplication. Oversized, empty
  and unreadable prior sources cannot fail a good later file, whether picked in
  one batch or separately. Comparison remains byte-for-byte; invalid/unavailable
  candidates are excluded. Existing duplicate/reselect guarantees remain.
- Work passes its current preparation error into the open PhotoEditor; avatar
  passes the existing profile-form error. Failure retains source/settings, retry
  clears the error, cancel clears the opening's error. Shared rendered owner tests
  and real browser canvas-failure/retry exercise both contexts.
- Native resize captures opening frame dimensions and updates bounded geometry
  during Pan.onUpdate via the installed Gesture Handler API. It never invokes
  pixel processing during movement. The adapter test checks changes before end
  and both bounds. `xcrun simctl` is unavailable; no device gesture claim is made.
- Read-only Figma nodes 7329:704/822/823/824 were reloaded. Web uses four 8px
  corner handles, 2px frame, 40% dim and a circle-only avatar mask; installed
  Hugeicons Undo matches the reset vector exactly. Initial crop proportions use
  the reference frame; saved crop overrides the initial frame. Plain segmented
  tabs retain the shared owner/keyboard handling with one border. Regular 13/18
  captions and 14/18 tab labels replace the previous approximations.

The 390×874 browser images use existing representative Work photo fixtures and
a test-only portrait downloaded from the Figma 7332:715 source asset. They omit
only Expo's development toast, wait for loaded crop imagery/finished animations,
and do not substitute product states. Browser captures exclude the Figma OS
status bar; its 49.8px is not painted as product UI. Grid and editor keep the
existing four-step wizard and shared bottom-action owner. Exact wide parity is
NEEDS-FIGMA; 1024/1440 checks are robustness.

Long five-photo grid and 600px viewport assert the fully scrolled last-row
control remains above CTA, with no geometry tolerance. DOM scrollTop is used:
RN Web's imperative scrollTo method is not the DOM two-coordinate method.
The upload screenshot freezes an actual sequential request while another file
has failed; accepted files stay accepted. The gate is always released in cleanup.

Growth is chiefly requested rendered/owner/browser regression coverage and
screenshot evidence. State still belongs to the existing form/photo owners;
no second queue, editor engine, route or infrastructure was added.

### Review screenshots (390×874)

| State | Chromium | WebKit |
| --- | --- | --- |
| Preparation | [image](evidence/2026-10-27-photo-review/chromium-preparation-390.png) | [image](evidence/2026-10-27-photo-review/webkit-preparation-390.png) |
| Work editor | [image](evidence/2026-10-27-photo-review/chromium-editor-390.png) | [image](evidence/2026-10-27-photo-review/webkit-editor-390.png) |
| Upload + error | [image](evidence/2026-10-27-photo-review/chromium-upload-error-390.png) | [image](evidence/2026-10-27-photo-review/webkit-upload-error-390.png) |
| Avatar | [image](evidence/2026-10-27-photo-review/chromium-avatar-390.png) | [image](evidence/2026-10-27-photo-review/webkit-avatar-390.png) |

Long-grid end: [Chromium 874](evidence/2026-10-27-photo-review/chromium-last-row-long-874.png),
[Chromium 600](evidence/2026-10-27-photo-review/chromium-last-row-long-600.png),
[WebKit 874](evidence/2026-10-27-photo-review/webkit-last-row-long-874.png),
[WebKit 600](evidence/2026-10-27-photo-review/webkit-last-row-long-600.png).

Self-review: tested local Web states address the requested frame/handle/reset/rail/
caption corrections and preserve visible keyboard focus. Existing glass tabs
keep their defaults (owner tests). No shell geometry owner changed. Web images
are visually checked, not a claim of full Native/200%-zoom/device acceptance.
The 1024/1440 evidence from the media suite establishes overflow robustness only.

Node 22.20.0: 1104 mobile owner/unit tests, affected mobile/design-tokens graph
typecheck and lint, Web/iOS/Android export passed; final Web-only export also
passed after the last Web mask/frame change. E2E fence and docs links passed.
An intermediate full media run passed 7/8; the old WebKit CDN interceptor observed
a 404 where it asserts 200. The unchanged isolated case then passed. Assertions
and timeouts were retained. Final sequential full-suite result is recorded below.
Backend unit/integration/live CDN tests were not rerun for this client-only fix.

Final sequential result: **8/8 Chromium/WebKit media E2E passed** with unchanged
timeouts/assertions; the prior CDN interceptor failure did not reproduce in its
focused rerun or the final full run. All four latest screenshots above were
refreshed from that full run. Final typecheck/lint, formatting, 193-file docs link
check and diff check passed. No merge/deploy.

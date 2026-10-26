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

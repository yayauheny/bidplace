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


## 2026-10-27 — Final grid acceptance cleanup above `2569f20b`

Removed «Отбросить локальные изменения» from `ProductDraftImages`. The existing
discard dialog had only that trigger, so Close now opens it for idle unfinished
photos. Cancel preserves cards; confirm awaits the existing cleanup and closes
only on success in the same save-session operation. `cancelUpload` reports its
existing refusal/failure paths without changing the cleanup algorithm; unresolved
upload responses stay recoverable and their explanation is visible in the dialog.
Active-upload Close keeps its existing save/recovery behavior.

Disabled upload/error CTA now says «Продолжить»; availability conditions are
unchanged. No backend, architecture, dependency or layout geometry changes.
Owner form tests cover the absent grid action, close/cancel/confirm and refused
unknown-response discard. Actual Chromium/WebKit checks cover disabled Continue,
absence of the old instruction/action and close/cancel retaining the error card.
Both upload/error images in the table above are refreshed and visually checked.

Node 22.20.0: full mobile suite 1105 tests / 141 files, targeted lifecycle suite
45 tests, affected Turbo typecheck/lint and Web export passed. Four targeted media
cases (partial gallery + retained editor settings, both browsers) passed; final
retained-settings rerun with Close assertions passed 2/2. E2E fence, docs links,
formatting and diff check passed. Backend tests and native exports were not rerun
for this client-only change. Overall Partial remains: physical Native gestures,
200% zoom and live CDN are unverified. No merge/deploy.


## 2026-10-27 — Founder photo edit icon

The supplied screenshot replaces only the photo grid edit glyph with installed
Hugeicons `Edit03Icon` (`edit-03`), a diagonal pencil without the underline.
Shared FigmaIcon/Button still own rendering and interaction; existing
`pencil-edit-01` consumers are unchanged. Preparation and upload/error screenshots
above refreshed for both browsers; Chromium preparation and WebKit error
visually checked against the supplied reference. No new dependency or SVG engine.
Node 22: 53 targeted icon/lifecycle tests, affected graph typecheck/lint, Web
export and 2/2 Chromium/WebKit retained-settings media checks passed. Formatting,
193-file docs links and diff check passed. Physical Native rendering, 200% zoom
and live CDN were not checked. Overall workflow remains Partial; no merge/deploy.


## 2026-10-27 — Extended state pack

[Folder, gallery, manifest and scope](evidence/2026-10-27-photo-states/README.md):
86 PNG / 34 categories, paired Chromium/WebKit. Runtime `804fe830`; changes only
extend existing owner E2E captures and one selection/order scenario. Screens
record actual UI, including empty/duplicate/unreadable/limit, editor transforms,
keyboard focus and processing failure, partial upload/retry, close confirmation,
order failure/pending/success, primary deletion, post-reload gallery and avatar.
Media fault routes/request gates are test-only; original snapshots are not
retouched. Screenshot names/viewport/checksums are in manifest.json.

Node 22: first expanded run 6/6 passed. Final expanded run passed 4/6; two
capture checks incorrectly expected in-memory recovery after full page navigation.
Corrected to assert 3 accepted server images and no local retry card, matching
the accepted reload contract; final focused Chromium/WebKit rerun passed 2/2.
No timeout/assertion suppression or runtime change. Affected typecheck/lint,
E2E fence, formatting, docs links and diff check passed. No additional native/API
build claimed for evidence-only changes. Full constraints in pack README;
overall Partial, no merge/deploy.


## 2026-10-27 — Continuation after visual/interaction review

**Partial acceptance.** Continued on `feature/photo-workflow` above `49831921`.
[31 original captures, including sequential drag/retry frames](evidence/2026-10-27-photo-fixes/README.md)
are available in the [gallery](evidence/2026-10-27-photo-fixes/index.html).

### Causes and selected correction

Durable fix: correct the existing operation state and shared component owners.
Acceptable workaround: keep the known limits and mark acceptance Partial; this
is not used to claim the missing checks. Hack: duplicate CTA/negative offsets,
hiding a leftover stencil with a screenshot patch, or replaying accepted files;
rejected. No upload infrastructure rewrite or new dependency.

- `PhotoCropSurface.web.tsx`: inherited visibility was defeated by cropper child
  visibility. Opacity of the complete measured layer, inert/tab exclusion and
  pointer exclusion keep Original free of crop visuals/controls without losing
  rotation/flip or the retained crop geometry.
- `product-draft-image-actions.ts`: busy now covers form persistence and server
  refresh. Targeted Retry becomes preparing before reconciliation; preflight is
  released on failure/unmount and cannot leave the cached photo session locked.
  `preparationError` distinguishes preflight failure from `orderError`; operation
  keys, prepared bytes, sequential queue, revision checks and recovery stay owned
  by the existing lifecycle.
- `product-draft-images.tsx`: the disabled add tile keeps its grid slot through
  picker/open/cancel. One alert explains selection, preparation, file or order
  failures, with specific access/revision guidance and no unsafe reload advice.
  Saving order is labelled as order work, without a file-upload animation.
- `SortablePhotoTile` / `sortable-photo-tile.ts`: presentation-only insertion
  positions, cancel/drop semantics, full-tile mouse drag image and button exclusion;
  bounded touch long press/edge scrolling on Web, keyboard alternatives and
  reduced-motion rendering. Native neighbor movement reuses Reanimated.
- `FormPageShell`: short-height regression exposed contact between the last tool
  and CTA because scroll content ended with no clearance. Shared 12px end padding
  fixes it at the owner. `AppShell` remains unchanged.
- Avatar: URI and crop geometry were present; the earlier capture raced Expo's
  lazy local-image loading. The active preview requests eager loading and the
  browser check waits for decoded image data. Its surface/padding/type, the editor
  stage and shared creation-action shadow/weight follow the live Figma nodes.

Live source discrepancies: `7329:822` contains square 8×8 handles, and `7329:704`
contains the filled add-slot label. Both remain. Live toolbar/tab weights agree
with existing semantic roles, so they were not reduced on screenshot inference.
Dynamic user photos are never replaced/cropped to imitate the design sample.

### Scope and maintenance

Runtime changes are limited to `apps/mobile` photo/editor/grid/action owners,
`FormPageShell`, optional `ResilientRemoteImage.loading`, the shared solid
creation-action style, and semantic tokens in `packages/design-tokens`.
Existing owner specs and `work-media-lifecycle.spec.ts` cover regressions.
No API client/server/database/public contract, storage lifecycle, route, Figma,
protected product document or `.cursor/` change. No merge/deploy.

The one canonical photo order changes only on commit; insertion state is local
presentation. The bounded ten-photo grid keeps its existing PaddedGrid owner.
The touch code is scoped to that gallery, not a reusable drag engine. Shared
shell/button changes also reach Work editing, author application and moderation;
account/settings/no-action shell variants retain their prior padding rule.

### Verification limits

Node 22.20.0. Full media gate: 12/12 Chromium/WebKit; final focused gate after
new touch/picker/regular-draft/frame coverage: 8/8. Mobile unit suite: 141 files,
1112 tests. Affected Turbo typecheck/lint, Expo Web export and full Web/Android/iOS export passed; e2e fence
passed. CSS body zoom 2 is tested, not physical browser-toolbar/OS zoom.

Additional consumer checks and baseline comparison are recorded in project/design
status. Physical Native drag-button exclusion/autoscroll, physical iOS browser
chrome, native runtime, exact wide Figma parity and production CDN remain
Needs verification. Mouse OS-owned drag ghost shape is not proven by browser PNG;
the code uses the whole clipped card as drag image. Do not treat these snapshots
as full native/production/visual acceptance.


Shared consumer checks: Work regular save, author onboarding geometry/state,
and admin product-review/public-revision cases passed 6/6 Chromium/WebKit.
Initial extra run: 1 passed / 2 failed. Original `49831921` comparison reproduced
the author helper timeout (it selected an avatar and looked for Continue without
confirming the editor); helper now presses the sole Install-photo confirmation.
Admin passed on the baseline rerun; inspection identified a broad acknowledgement
prefix matching the success and transient-publication messages. Its locator now
selects the exact existing acknowledgement; all subsequent public-media/revision
assertions remain. The final 6/6 rerun preserves those assertions/timeouts.


Final accessibility follow-up: the row-based grid can remount a keyboard-moved
card. An initial requestAnimationFrame restoration ran before the asynchronous
query commit in Chromium (1 failed / 1 passed). Focus now follows the stable photo
ID in the tile layout effect after the position commits; the unchanged focus
assertion and touch/keyboard/cancel cases passed 2/2 Chromium/WebKit. Native
Web/Android/iOS export completed successfully; physical runtime limits above
remain unchanged. Save-race/preflight owner rerun: 75/75 passed.


## 2026-10-27 — Drag acceptance follow-up above c96d3f3f

**Partial.** Prior fixes remain; this follow-up addresses the review's drop-boundary
and Native functional gaps. Durable fix selected: stable whole-grid mouse drop
owner and existing form-scroll owner for Native. Acceptable workaround would be
to retain the gaps explicitly; that cannot establish acceptance. Enlarged invisible
card targets over vacant slots would be a hack and were rejected. No dependency
or universal drag engine added.

- `PhotoDropArea.web.tsx` owns mouse dragover/drop over the whole grid, gaps and
  add tile. Geometry is read from unchanged PaddedGrid parent cells, not transformed
  photo boxes; the add tile never becomes an ordered photo. Leaving the grid resets
  the candidate; outside release/cancel never mutates order.
- `SortablePhotoTile.web.tsx` moves mouse drop handling out (260 → 230 lines).
  It retains the existing start/preview/touch/keyboard mechanisms. The dedicated
  drop owner is 71 lines; it does not own another grid or persist order.
- Native `PhotoDragSurface` attaches GestureDetector to the image only, with
  edit/delete/Retry outside it. `FormPageShell` supplies its ScrollView ref, measured
  viewport, content bounds and actual scroll delta through `form-drag-scroll.ts`.
  The active gesture drives edge scrolling and includes its delta in row insertion.
  End/cancel/unmount stop scrolling. `PaddedGrid.activeItemId` lifts the active row
  and makes rows/cells overflow-visible only during drag, so the card can cross rows.
- Native callbacks use Gesture Handler's existing JS execution option, with
  Reanimated shared values for transforms; no additional thread bridge or library.

Changed runtime scope: photo grid/tile/drop/surface, opt-in PaddedGrid active-item
presentation, FormPageShell and its internal drag-scroll owner. No route, API,
revision/crop contract, storage, operation key, bytes or server lifecycle changes.
Added code is for the demonstrated Native edge-scroll and gesture-boundary gaps;
canonical order still has one owner and changes only at commit.

Verification: existing owner `photo-editor.spec.ts` adds Native surface exclusion
for all three buttons, cross-row insertion with actual scroll delta, cancel vs end,
both scroll edges and cancel/unmount cleanup. These are mocked integration/unit
checks, not physical Native evidence. The prior synthetic drag test now supplies
real drop coordinates (its initial omitted-coordinate assertion failed after drop
became coordinate-based; the assertion was kept). A new browser mouse sequence
uses down/move/up from image pixels, proves neighbor movement before commit,
releases over a vacant slot, gap and add tile, cancels outside and checks no reorder
request during drag. Videos are page recordings, not OS drag-ghost captures.

CTA: no geometry patch in this follow-up. Existing two-entry short-height and CSS
zoom regressions are rerun; they do not establish the cause of the original
user-reported disappearance. That original condition remains **not reproduced**.
True browser zoom 200% remains **Needs verification**, distinct from CSS body.zoom.
Attempted a dedicated headed Chromium test window for OS inspection; the available
CUA app binding selected another pre-existing sign-in window and returned screenshot
unavailable for the test app. Browser connector is disabled in Work settings. No
user tab/window was closed and no setting was changed. System drag-ghost rounding
therefore remains unverified even though the code supplies the whole rounded card.
`xcrun simctl list devices booted` failed because simctl/Xcode runtime is unavailable;
physical Native cross-row overlap, button-origin gestures, edge scroll and cancel
remain required acceptance. Do not mark this workflow complete from unit/export.


Checked on Node 22.20.0: mobile 141 files / 1114 unit tests; final full media
14/14 Chromium/WebKit; shared-consumer Work/author/admin cases 6/6; affected Turbo
typecheck/lint 8 tasks; e2e fence and Markdown links passed. The first post-change
unit run found six suites pulling Native Gesture Handler through the shared
surface. The surface now passes only its render function through context; Native
owns the GestureDetector import, and the full suite passed. The first auxiliary
synthetic drop run lacked drop coordinates; the test was corrected to send its
existing measured pointer position, retaining all order/cancel assertions.

[Unedited short mouse recordings](evidence/2026-10-27-photo-drag-final/README.md)
([player](evidence/2026-10-27-photo-drag-final/index.html)). They use real input
sequences from the browser automation driver, without dispatching drag/drop events.
The separate headed attempt passed the same functional assertions but did not
establish OS ghost/zoom evidence. No temporary manual wait/environment branch is
kept in source. Runtime controls have no new artificial delay; recording tests
hold the pointer400ms so neighbor insertion is visible.


The recorded400ms hold exposed an additional Chromium defect (the quicker full
media run had passed): after the pointer's target image moved away, Chromium
emitted dragleave/dragend without drop at the vacant position. A temporary event
trace confirmed unchanged pointer coordinates and no drop. The moving neighbor
tiles now leave pointer hit-testing during drag; the stationary source retains it, fixed cells and the grid stay
the event targets. This separates presentation from drop geometry instead of
adding invisible card hitboxes. The400ms hold and all order assertions are kept.


The first hit-test correction also excluded the source and cancelled WebKit's
native drag immediately; it was rejected. The final rule excludes only moving
neighbors, leaving the stationary source intact. With the400ms hold retained,
the actual mouse scenarios then passed2/2 Chromium/WebKit. Temporary event logging
was removed. Native Web/iOS/Android export passed; the final mouse-only Web change
is separately exported. No timeout, retry or assertion was relaxed.


Final source without diagnostics: insertion/cancel/keyboard/reduced-motion/touch
and held mouse-drop cases passed4/4 Chromium/WebKit. Copied the final unedited
recordings to the linked evidence folder. Final Web export, affected typecheck/
lint, owner7/7, e2e fence, docs links and diff check passed. Full native export
passed earlier in this follow-up; no physical-device claim. Overall verdict remains
Partial: code fixes and local regressions are reviewable, but required physical
Native, OS ghost and true zoom acceptance remain open.


## 2026-10-27 — Manual acceptance environment check for ee4b71fd

**Partial / Needs verification.** Runtime remains fixed at `ee4b71fd` on
`feature/photo-workflow`; no further implementation change was justified.
Only environment availability was checked in this pass. No unit/E2E/build suite
was rerun, and earlier automated evidence is not relabelled manual acceptance.

| Manual criterion | Result in this pass | Concrete limitation |
| --- | --- | --- |
| Web system drag ghost / rounded card | Not executed | Browser connector reports local browser use disabled in Work settings. Available CUA Chrome for Testing window is `chrome://intro/`, not the photo application. |
| True browser zoom 200%, short window, tools and Done through both editor entries | Not executed | Checked Web ports8081/8087 are not listening; no accessible photo application window. Prior CSS zoom and E2E remain separate evidence. |
| iOS/Android row crossing, edge scroll both ways, cancel and button exclusion | Not executed | `xcrun simctl` is unavailable; `adb` and `emulator` are not found in PATH. No Native runtime was exercised. |
| Native smoothness under load with `runOnJS(true)` | Needs verification | Requires a device/runtime. JS callbacks are a risk to measure, not an established performance defect or justification for a rewrite. |
| Original missing-CTA scenario | Not reproduced | The original user environment/scenario was not available; this pass does not establish its cause or claim it fixed. |

No environment/tool installation, settings changes, additional infrastructure,
window/tab closure, merge or deployment. No runtime code changes. Manual Native,
OS ghost, actual browser zoom and live CDN acceptance remain open.

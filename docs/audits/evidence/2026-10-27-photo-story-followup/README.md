# Photo and story follow-up — 2026-10-27

Status: **Partial**. Same branch `feature/photo-workflow`, above `9a1dd9a5`.
Scope selected by the user: UI corrections and one source hash per selection
in the preparation session. Server media reuse is a separate task. Explicit
gallery upload remains: select → prepare → Upload → Continue.
[Original supplied review](user-review.txt),
original user screenshots.

## Implementation and source

- `ProductDraftImagesStep`: one status area with stable minimum line height;
  prepare/upload/order changes no longer add/remove rows above the grid. Card
  preparation/upload/image-read progress uses the existing spinner badge.
  Duplicate selection says **«Фото уже добавлено.»**, without the generic
  failure heading or a duplicate second line. This wording covers locally
  selected and accepted photos within this preparation session.
- `useProductDraftImageActions` / `WorkPhotoCard`: source SHA-256 computed once
  before app transforms, using SDK57 `expo-crypto`57.0.4. Compare stored hashes
  instead of rereading previous files; invalid sources stay independently
  invalid. Hashes stay in the in-memory session, never act as server proof,
  and cannot deduplicate unknown original bytes after session loss/reload.
- Accepted bytes and a decoded server image are separate states. Retain local
  URI/crop/dimensions until the matching server image loads. Release generated
  resources and owned picker blob URLs on switch, removal or session cleanup;
  rejected duplicate picker URLs are released. An unchanged server URI needs
  no new load event. Stale URI/session callbacks cannot clear newer previews.
- `ResilientRemoteImage`: optional load/start/exhausted callbacks preserve its
  existing retry owner. Exhaustion exposes its placeholder/Retry instead of
  a permanent loading badge; manual retry restores the retained preview while
  loading. The centered Retry placement avoids photo edit/delete overlap.
  Other consumers retain bottom placement and their prior behavior.
- `ProductBlockActions`: compact, absolute action panel beside its trigger;
  no insertion into story flow. `ProductDraftStoryStep` owns the single open
  block key. Up/down keeps that key open and focuses a usable direction at a
  boundary; Escape returns focus to the trigger. Pointer outside, another
  block or deletion closes it. Native touch outside within the story closes
  it; full physical Native interaction acceptance remains open.
- `PhotoDragSurface` gives the existing Native GestureDetector one non-collapsible
  root View for overlapping local/server image layers. Edit/delete remain outside
  that surface; a failed remote preview disables sorting while Retry is exposed.
- `FigmaIconButton`: shared compact34px visual with Native hit slop, danger
  glyph tone, explicit `aria-expanded` for the installed RN Web. Existing
  defaults unchanged. Live Figma read-only: photo `7329:704`, handoff
  `7388:723`, story `4562:32461`, `4563:32768`, panel `4563:33344` in
  `pAPQo6cADmG5XzVmBX76EE`. Existing exact icon registry mappings reused;
  no screenshot/design export becomes a runtime asset.
- Story image tool opens the picker directly. Removed gallery-selection list,
  extra upload button and duplicate lower back button; top arrow remains.
  Removed the now-unused gallery-insertion hook method. Existing referenced
  story media still restores/saves without a new upload.
- An empty story shows a virtual text field without creating a content block
  or forcing keyboard focus. Blank/whitespace text is omitted on save;
  meaningful blocks retain their keys. Explicit heading/text insertion focuses
  the new block. Text grows with content; browser spellcheck and visible
  keyboard focus stay enabled. Filled stories get no new default block/focus.
  The default field is the user-selected change to Figma's empty state.

## Addressed checks and evidence

The new owner E2E holds server image reads after accepting uploads: grid Y stays
unchanged, local previews and loading badges stay visible. It then fails reads
through the existing1s/3s/8s retry schedule, verifies usable manual Retry with
ordinary clicks, and loads both images. No artificial runtime delay or forced
click. Story checks cover empty Skip, no redundant controls, text growth,
new-block focus, unchanged toolbar Y on menu open, stable menu identity on
movement, focus at boundaries, and Escape. It captures390/1024/1440 widths;
wide exact parity remains NEEDS-FIGMA.

| State | Chromium | WebKit |
| --- | --- | --- |
| Server image pending | [loading](chromium-loading-390.png) | [loading](webkit-loading-390.png) |
| Virtual empty field / Skip | [empty](chromium-empty-story-390.png) | [empty](webkit-empty-story-390.png) |
| Compact menu | [menu](chromium-story-menu-390.png) | [menu](webkit-story-menu-390.png) |
| Story390 | [390](chromium-story-390.png) | [390](webkit-story-390.png) |
| Story1024 | [1024](chromium-story-1024.png) | [1024](webkit-story-1024.png) |
| Story1440 | [1440](chromium-story-1440.png) | [1440](webkit-story-1440.png) |

The existing driver mouse sequence passed in Chromium/WebKit: image start,
neighbor movement, held pointer, vacant slot/gap/add-slot drop and outside
cancellation; no order request during movement. DnD implementation was not
expanded. This does not resolve the user's failing manual sequence or prove
rounded OS ghost. The browser connector again reported local browser use
disabled; no new manual-ghost claim is made.

Unit checks cover a single prior-file read for duplicate comparison, invalid
inputs, retained preview through accepted/reconciled upload, exhausted/retry
state, stale URI rejection, cleanup once, unchanged URI, and blank-text filtering
without key reassignment. Session/revision/save/submit race assertions remain.

## Environment and limits

Existing local Web8081 + test media API3017 were reused. No prepare/reset was
run: existing user test accounts and uploads were not reset. Only fresh fixture
accounts/works were created by the checks. Temporary runner config lived in
`/tmp`, with server startup disabled; no new checked-in infrastructure.
Test media still lives in process memory, so this is not live CDN/persistence
acceptance. No server/schema/API contract change, merge, push or deployment.
Physical Native gestures, keyboard behavior, smoothness under load, rounded
system ghost and the user's original missing-CTA scenario remain open. Earlier
actual zoom200% observations are historical evidence, not a rerun of this slice.

Final command results are recorded in the linked
workflow audit.

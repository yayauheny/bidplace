# UI completion — execution ledger

Branch: fix/tc-final-review. Scope approved by founder on 2026-10-21.

Success: one responsive auth form; four-step portfolio wizard with ordered text/photo
blocks and private revisions; bounded empty-state desktop actions; continuous sheet
drag/dismiss with shared motion. No commerce, deployment, database reset or fixture
writes against the manual preview.

## Sequence / recovery

1. Sync MVP: complete, e3ba8074. Login correction: complete, f4ae9223;
   see [login audit](2026-10-20-LOGIN-SHEET-REVIEW.md).
2. Work creation: implemented,571b0f94;89 owner tests,24 wizard/revision E2E and2 media-lifecycle E2E passed.
3. Desktop empty-state actions: implemented,0ba87ff9, verified in Chromium/WebKit at390/1024/1440/1920.
4. Shared sheet motion: implemented,e8adce34;48/48 browser checks and recorded Chromium touch passed.
5. Final production preview and documented automated verification: complete; physical-device checks remain explicitly open below.

## Work design map

Live Figma file pAPQo6cADmG5XzVmBX76EE, read-only, 2026-10-21.

| Supplied node | Implementation scope |
| --- | --- |
| 749:2164 | Parent creation section; select child frames below, not one screen |
| 749:2388 | Main data: title and common fields; exclude sale modes, prices and auction times |
| 873:4404 | Details: reuse current category/material/technique/dimensions/year contracts; no fake AI controls |
| 4547:26392 / 4551:31353 | Empty / populated photos, rounded 3:4 tiles, upload and guarded mutations |
| 4530:22070 | Category selection; retain server catalog/proposal ownership |
| 874:4772 | Commerce status explanation: excluded from portfolio MVP |
| 873:4445 | Payment/delivery: excluded |
| 881:6649 | Buyer contacts: excluded commercial step; existing public-author contacts unchanged |
| 4563:33397 → 4562:32461 | Story editor, heading/text/photo tools; existing block contract |
| 4589:34701 → 4583:33404 | Editing reference contains commerce; retain only portfolio fields/story actions |

MVP keeps data → photos → story → review, not the old six commerce steps. Live
contexts/screenshots obtained for exact main/details/photo/story/edit child frames.
Master buttons 292:5058 override old screen-instance typography and states.
Only 390 px creation frames supplied: desktop visual parity is NEEDS-FIGMA; wider
sizes use confirmed fluid AppShell and existing grid policy, checked for robustness.

Durable approach: extend existing wizard chrome, photo grid and block menu UI;
keep hooks/contracts/API/services/database unchanged. Alternative wholesale editor
replacement is rejected: duplicates persistence and revision guards. Route-local
transforms to match screenshots are hacks and are not used.

Impact: UI → existing wizard/form/story hooks → existing API client/contracts →
existing product/revision/media services and database. No server contract migration.
Shared components/tokens are verified through their consumers. One implementation
per menu/layout role avoids future creation-vs-edit divergence.


## Work completion / acceptance

- Cause: old wizard repeated service headings and used unrelated row controls for
  photos/story. The story text focus opened an action panel automatically.
- Durable correction: existing wizard controller retained; one ProductBlockActions
  owner for gallery/story, shared Figma icons/buttons. Text menu appears on hover /
  focus-within for fine pointers and remains visible on touch/native. Photo menu is
  always available. Boundary movement and pending writes are disabled.
- Photo upload uses a3:4 rounded tile in the existing measured PaddedGrid; empty,
  uploading, retry, delete confirmation, order and processing states stay wired.
- Review renders actual private photos/text and metadata instead of counts alone.
  Existing private image transport, save epochs, recovery and revision ownership
  remain unchanged. Main title/fields precede characteristics; duplicate creation
  section title is omitted through FormSection's optional heading API.
- Checks:89 editor/wizard/icon owner cases;24/24 wizard + published revision E2E
  with isolated API3011/web8091;2/2 full media lifecycle Chromium/WebKit with real
  Nest/Postgres and mock external R2 transport. The media case additionally checks
  heading/paragraph/image, move boundaries, deletion, preview, publication and
  post-approval editing with atomic public revisions. Screenshots390/1024/1440:
  [evidence](evidence/2026-10-21-work-editor/).
- The ordinary E2E transport deliberately has no media pipeline: photo-story checks
  belong to work-media-lifecycle, not the transport-independent wizard case. Its
  route callbacks now drain with behavior=wait before disposing the guest request
  context; assertions and timeouts were not relaxed.
- Differences: old six commerce steps become four confirmed MVP steps; no sale,
  bids, payment, delivery, buyer contact or fake AI controls. Test screenshots use
  a synthetic upload fixture, not the manual preview's author photos. Wider layouts
  are robustness checks, not desktop Figma parity. Physical iPhone and actual200%
  zoom/text enlargement remain Needs verification.

## Desktop action width

Cause: width=full described both button fill and the width of its desktop host.
Durable fix: Home owns a centered fluid action column with semantic layout
metric actionColumnMax420. AppShell1280, grids, legal footer and shared button
variants remain unchanged. At390 the column is366px; at1024/1440/1920 it is420px.
Both browsers verify centering,1280 page cap and no horizontal overflow.
[Matched viewport screenshots](evidence/2026-10-21-desktop-actions/).
420 is the founder-approved default, not a claimed desktop Figma measurement.
No state/API/database changes; future solitary actions can reuse the metric.

## Public build cache correctness

Reproduced: a production export for API3001 followed by an isolated export for
API3011 reused the previous transform and bundled3001. This crossed the test
transport boundary before authentication; no fixture writes reached the preview.
Durable fix: Metro cacheVersion hashes the explicit public compile-time values
(API origin, public Turnstile site key, app environment, analytics flag). No secrets
are read or bundled. Existing cache/version/blockList behavior is preserved.
Owner check environment.spec:5 passed; mobile typecheck passed. Actual exports
without cache deletion prove3011-only in the isolated output and3001-only in the
manual output. No dependency, server, API or database changes.

## Sheet motion — root cause and result

- Cause: the drag wrapper reset its offset before requesting close while another
  wrapper ran the exit transition. Auth dismissal could navigate/unmount before
  exit completed. Web also rendered React state per pointer frame; native ran a
  separate spring. This creates a visible return/jump followed by disappearance.
- Durable fix: a single Reanimated position in AppDialogSheetMotion, consumed by
  the existing header-only gesture. Preserve the release position on accepted
  close; animate to rest on cancel/veto; defer auth leave until onExited. No global
  listeners, new dependency or parallel gesture mechanism. Superseded web motion
  file, RN Animated spring, CSS transition and early focus-restore effect removed.
- Ownership: shared UI/state only; existing auth guard/navigation/private state
  and API contracts are preserved. Shared consumers inherit the correction.
- Checks:48/48 browser cases (Chromium/WebKit) on production preview;65 focused
  owner tests and mobile typecheck. The earlier144 owner cases also passed before
  the final narrow rerun. Pointer slow/fast/cancel frame samples never reverse
  beyond1px rounding; Chromium CDP real touch cancel/close passed. Recordings and
  JSON samples: [motion evidence](evidence/2026-10-21-sheet-motion/).
- Shared consumers: login/forgot/reset via responsive acceptance; dirty registration
  and focus via auth-focus-restore; Share/QR/report, Filter, Search and full photo
  viewer via sheet-live. Recovery long/short dialog checks use isolated API3011.
- The old auth-layout test filled inert inputs before entry readiness, searched
  floating placeholders that disappear on focus, and assumed a390px fullscreen
  registration host. It now waits for primary focus, scopes the active form and
  verifies fluid fullscreen host/350px form. Stability compares the same form
  before/after resize rather than a superseded absolute y. Required consent is
  checked before testing invalid email. Error/value/history assertions remain.
- CSS zoom scaled fixed portals without changing visualViewport and was not
  browser zoom. Those probes now test an actual320px reflow viewport; real200%
  browser zoom remains explicitly unverified. Recovery fixture unmounts its editor
  before injecting a stale draft, avoiding a final flush overwriting test data.
- Limit: browser frames prove continuity, not physical-device frame rate or user
  feel. Actual iPhone keyboard/scroll/motion and browser200% zoom still need manual
  results; iOS JS/Hermes export passed; native device runtime was not part of this browser gate.

### Final auth/recovery verification

All24 auth-layout/recovery browser scenarios now pass across Chromium/WebKit:
20 passed in the complete run; the remaining4 history paths passed after the
readiness/locator corrections. No test was skipped and no error, history, value,
focus or guard assertion was removed. Preserve checks of background fields under
a confirmation by locating them inside the active auth-sheet; role queries rightly
exclude them from the accessible tree while its modal confirmation is open.
A fresh iOS JS/Hermes export also passed; this is compilation, not device runtime.

### Final review / size

One translation owner replaces the platform-specific motion implementations and
parallel drag transforms. Work creation keeps existing hooks/contracts; new code
adds actual private review content and shared gallery/story menu ownership. The
positive diff includes meaningful owner/E2E coverage and evidence; it is not an
additional editor framework or a second persistence implementation. No dependency,
permission, server contract or database migration was introduced.

## Commits and final state

| Stage | SHA |
| --- | --- |
| MVP synchronization | e3ba8074 |
| Responsive login review | f4ae9223 |
| Portfolio work creation/editor/review |571b0f94 |
| Desktop action widths |0ba87ff9 |
| Public build cache target isolation | fa03de39 |
| Shared continuous sheet motion and regression acceptance | e8adce34 |

Tracked working changes are committed. Foreign .cursor and old2026-10-20 agent
evidence remain untouched/untracked; the login baseline stash and patch remain
preserved. No push, Cloudflare deployment, manual database reset or fixture writes
to the manual preview. Frontend7899 serves the fresh production web export with
API3001; isolated browser writes used API3011 and the disposable E2E database.

Final checks: scoped mobile eslint and tsc pass; work/media browser acceptance
24 wizard/revision +2 complete media cases;48 responsive/shared-sheet cases;
24 auth/recovery scenarios (20 plus4 addressed reruns). Owner checks144 passed
before the final narrow rerun of65; public cache identity included in that rerun.
Web production and iOS JS/Hermes exports pass. Complete repository suite was not
run: verification was bounded to affected owners and browser integrations.

## User manual check order

1. Home at390/1024/1440/1920: empty actions remain centered, up to420px on desktop.
2. Login → forgot → login; resize across767/768 with filled fields and an error.
3. Close through backdrop, Escape, keyboard close and handle; slow, fast and
   cancelled drag. Reopen; verify page scroll and loaded images remain stable.
4. Register: one confirmation; document links and unreadable-document error do
   not block the registration flow.
5. Create: data → photos/upload retry/order/delete → mixed heading/text/photo
   blocks → reorder/delete → review → submit for moderation. Reload a saved draft.
6. Edit an approved work from the cabinet; public data must remain at the approved
   revision until changes receive moderation approval.
7. Physical iPhone: system keyboard, reachable bottom actions, form scrolling,
   gesture feel; separately test real browser200% zoom and enlarged text.

Remaining limits: actual iPhone/native runtime, real browser zoom/text enlargement
need manual results. Desktop creation frames were not supplied (NEEDS-FIGMA);
1024/1440 screenshots establish responsive robustness, not invented visual parity.
Login known reference differences remain documented in its own audit.

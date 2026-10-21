# UI completion — execution ledger

Branch: fix/tc-final-review. Scope approved by founder on 2026-10-21.

Success: one responsive auth form; four-step portfolio wizard with ordered text/photo
blocks and private revisions; bounded empty-state desktop actions; continuous sheet
drag/dismiss with shared motion. No commerce, deployment, database reset or fixture
writes against the manual preview.

## Sequence / recovery

1. Sync MVP: complete, e3ba8074. Login correction: complete, f4ae9223;
   see [login audit](2026-10-20-LOGIN-SHEET-REVIEW.md).
2. Work creation: implemented;89 owner tests,24 wizard/revision E2E and2 media-lifecycle E2E passed.
3. Desktop empty-state actions: implemented, browser verification in progress.
4. Shared sheet motion: implemented, browser verification in progress.
5. Final production preview, documented verification and manual checklist: pending.

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

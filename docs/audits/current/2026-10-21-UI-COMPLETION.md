# UI completion — execution ledger

Branch: fix/tc-final-review. Scope approved by founder on 2026-10-21.

Success: one responsive auth form; four-step portfolio wizard with ordered text/photo
blocks and private revisions; bounded empty-state desktop actions; continuous sheet
drag/dismiss with shared motion. No commerce, deployment, database reset or fixture
writes against the manual preview.

## Sequence / recovery

1. Sync MVP: complete, e3ba8074. Login correction: browser acceptance in progress;
   see [login audit](2026-10-20-LOGIN-SHEET-REVIEW.md).
2. Work creation: intake in progress, then UI, owner checks and isolated E2E.
3. Desktop empty-state actions: pending.
4. Shared sheet motion: pending, after functional UI.
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

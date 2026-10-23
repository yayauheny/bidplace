# Admin foundation — 2026-10-23

Base: `feature/portfolio-mvp-release` at `57b03211`. Scope: protected moderation
reads and durable submission/decision/publication history. No new UI, commerce
runtime, moderator role, notifications, backend diff engine or production deploy.

## Audit and chosen solution

- **Keep:** `AdminController` session/admin guards, existing revision targets and
  freshness checks, catalog approval rules, published projections, owner listing
  locks, private image authorization and existing media journal.
- **Fix:** seller suspension recovery skipped publication; reused restore intents
  retained an old actor/manifest; finalization could act after lease takeover;
  deletes did not renew their lease between bounded provider operations; seller
  approval replay lacked the Work equivalent.
- **Simplify:** use the existing revisions as snapshots and existing `AuditEvent`
  as history. Summary queries return scalars instead of loading galleries/stories.
- **Defer:** UI/diff rendering, historical reconstruction, production acceptance.

Durable fix: extend these owners. Acceptable workaround: retain the legacy list
and cursor contracts alongside the new reads. Rejected hack: parent `createdAt`
as submission time, reconstructed historical revisions, premature public approval
or a second moderation state machine. No unresolved product choice was needed.

## Contracts and persistence

New authenticated `GET /api/admin/{seller-profiles,products}/summary` accepts
bounded `limit`, `search`, `filter` and an opaque cursor. Ordering is revision
`submittedAt ASC NULLS LAST`, then revision ID; legacy rows without a revision use
parent ID only as the stable unknown-time tie-breaker. Responses distinguish
parent/review status and explicitly mark unknown submission time. Existing lists
retain their original ordering/cursors for installed clients.

New `GET /api/admin/{seller-profiles,products}/:id` returns `entity`,
`publishedRevision`, `reviewRevision` and an explicit `decisionTarget`. Shared
selectors/mappers normalize snapshot content, catalog links and gallery order.
A missing published pointer remains null. Historical author photos are not
reconstructed from the mutable parent. Admin preview never calls public tracking;
new JSON reads and private binaries use `private, no-store`.

New `GET /api/admin/{seller-profiles,products}/:id/history` pages ascending by
`createdAt, id`. Existing events remain unchanged, with null action/revision/
attempt metadata. New `SUBMITTED`, `DECISION`, `PUBLICATION_COMPLETED` facts use
existing transactions. Approval decision precedes delivery; completion and public
state change commit together. Retries reuse the same decision identity.

Additive migration `20261023010000_moderation_history` adds nullable audit metadata,
a nullable unique event key and `MediaOperation.generation DEFAULT 0`. No tables,
backfill or history rewrite. Existing attempt count is a delivery retry count;
operation timestamps mutate. Neither identifies independent restore cycles.
Generation increments only when reopening a completed/cancelled restore, retains
its value on retries, and keys audit events together with operation ID and action.
A new cycle rebuilds the existing manifest and records its current actor.

Finalize locks target then operation and rechecks lease token/state/generation.
DELETE renews operation/object ownership before each external effect. Existing S3
DELETE and CDN purge deadlines are 30s/15s, below the 5-minute renewed lease.
The shared delivery projection sorts by last update, so a reused restore is
visible; its existing DTO deliberately gains no fields, preserving strict older
clients. Apply the additive migration before the new API. Previous binaries can
still write old-format audit rows, which remain explicitly unknown.

## Maintenance and verification

No new service, dependency or table. The existing controller/service remain the
owners; a focused SQL query module owns summary projection/keyset logic. Two
cursor semantics remain necessary for installed-client compatibility. Snapshot
mapping and approval rules are shared; historical content is not copied into a
parallel store. The PR description records exact added/deleted line counts and
service/contract/dependency comparisons against the base.

Independent source review covered the actual diff and corrected seller restore,
manifest/actor reuse, lease takeover, deletion renewal, delivery ordering, UTC
cursor casts and strict-client compatibility. New scenarios extend existing
owner specs: outage/retry, three restore cycles, actor changes, stale finalizer,
expired DELETE lease, unknown history, cursor ties/UTC and private admin preview.
Original moderation assertions now distinguish the three intentionally separate
facts; rejected/stale requests still prove no additional writes.

Local `pnpm verify` passed: workspace typecheck/lint, 464 API unit, 1032 mobile
unit, 47 contracts, 48 API-client, 240 integration (29 existing skips), ops checks
and web/iOS/Android exports. After final inline-history changes, API typecheck,
lint and 45 affected owner units passed; moderation/publication integration (9)
and the extended summary/detail/history integration owner (17) passed separately.
The existing browser moderation spec counted the published title in the entire
DOM, including the home page behind the admin overlay. Its check now scopes the
same absence assertion to the pending moderation card, like its category checks;
guest published/pending text, gallery identities and private image HTTP checks
remain unchanged. `pnpm docs:link-check` and `git diff --check` passed. Chromium/WebKit moderation E2E passed (4 tests). Final HEAD/CI
results are recorded in the PR. Production migrations,
real object storage/CDN acceptance and deployment are outside this PR.

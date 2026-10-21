# Work lifecycle technical contract

`Product` remains the persistence name for a Work during the migration. A Work owns
an editable revision and, after its first approval, a separate published revision.
Only the published revision is eligible for public projections.

| Work state | Author action | Admin action | Public result |
| --- | --- | --- | --- |
| `DRAFT` | edit, submit | — | hidden |
| `PENDING_REVIEW` | — | publish, request changes, reject | last approved revision remains public, if any |
| `CHANGES_REQUESTED` | edit, submit | — | last approved revision remains public, if any |
| `REJECTED` | edit, resubmit | — | last approved revision remains public, if any |
| `APPROVED` | start an edit revision, hide | — | published revision visible |
| `ARCHIVED` (compatibility name) | unhide | hide | hidden |

## Invariants

1. The `publishedRevisionId` points only to an approved immutable revision.
2. Public reads require an approved Work and its `publishedRevisionId`; they never
   read the editable revision.
3. An author write locks the Work row and checks a monotonically increasing
   revision version before mutation.
4. Admin approval atomically promotes the editing revision to the published pointer.
5. Request-changes and rejection alter only the editing revision/Work review state;
   they never clear a previous published pointer.
6. Hide clears public visibility without deleting either revision. Unhide restores
   only the approved published pointer.

## Migration compatibility

The first additive migration backfills one revision per existing Product and points
both editing and published references at it only for existing approved Products.
Legacy `ARCHIVED` is retained as the database compatibility name for hidden Work;
it is not exposed as a public portfolio status.

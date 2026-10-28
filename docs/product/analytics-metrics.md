# bidplace — Analytics metric definitions

Status: Confirmed for the accepted foundation scope, 2026-10-23.
[Collection/proof/configuration owner](analytics-contract.md).
Implementation and checks.

## Canonical foundation API

Protected `GET /api/admin/analytics/foundation?from=...&to=...` accepts a positive
interval of at most 93 days. Optional `includeActivity=true` adds the current server
`ANALYTICS_WEB_ENABLED` permission as `serverCollectionEnabled` and per-day
`sessions`; the default response omits both for existing strict clients. This
permission does not enable the client build collector or prove continuous past
collection. All period metrics use UTC **[from,to)**; daily growth
uses UTC calendar dates and fills empty dates with zero. All-time operational
counts are explicitly separate. The API environment comes from server config;
there is no client environment override. Deployments require separate application
DBs for operational entities; web events/acquisition additionally filter version
and environment in SQL, including mixed synthetic fixtures.

| Field | Definition and PostgreSQL source | Coverage / limit |
| --- | --- | --- |
| `product.views` | Version 2 `AnalyticsEvent` rows in period/current environment | New collection only; bounded page allowlist |
| `product.visitors` | Distinct server browser IDs with those events | Browser identity, not people; cookie clearing creates a new identity |
| `product.sessions` | Distinct server session IDs with events in period | Sessions observed in the interval, not only sessions starting there |
| `product.firstAuthors` | `SellerProfile.firstPublishedAt` in period | Recorded at first actual publication by this API; historical nulls stay unknown |
| `product.firstWorks` | `Product.publishedAt` in period | Existing first-publication timestamp, preserved on revision approvals/restores |
| `operational.registrations` | All `User.createdAt` in period | All saved registrations, independently of attribution |
| `operational.currentAuthors` | Approved profiles whose user is active | All time/current state; excludes draft/rejected/suspended/banned profiles |
| `operational.currentWorks` | Canonical public Work visibility/content predicate with active approved author | Current state; shared `portfolioProductContentSql` |
| `operational.pendingAuthors/Works` | Current editing revision is pending; legacy parent-only pending rows included | Includes pending edits of published entities |
| `operational.stuckAuthors/Works` | Pending revision with known `submittedAt` strictly earlier than now minus seven days | Never parent updatedAt/createdAt; unknown dates excluded |
| `operational.unknownAuthorSubmissionTime/unknownWorkSubmissionTime` | Pending targets with null submittedAt or no revision | Explicit unknown bucket, not a guessed date |
| `operational.unknownAuthorFirstPublication` | Currently public active authors whose firstPublishedAt is null | Exposes incomplete historical coverage |
| `acquisition.visitors` | First-touch version 2 browser rows captured in [from,to), with actual accepted events | Includes direct; version 1 excluded |
| `acquisition.registrations` | Those browsers linked by signed proof to a User created from first visit through 30 days later, observed by report now | One account/browser association; no identify/login claim |
| `acquisition.rate` | Proven cohort registrations / cohort browsers | Null for an empty cohort; registrations may occur after the report interval |
| `acquisition.bySource` | Same cohort numerator/denominator grouped by immutable first-touch source | UTM → external hostname → direct; no arbitrary referrer URL |
| `acquisition.mature` | Interval end plus 30 days is no later than report now | False means a partially observed cohort; no mature-rate claim |
| `growth` | Per UTC date: views/visitors, optional distinct observed sessions, all account creations, first author/Work publications | Same sources/period semantics as above; not approval counts. A session spanning midnight appears in each active day; daily sums need not equal period distinct sessions. |
| `coverage.firstVisitAt` | Earliest stored version 2 first-touch time in current environment | Earliest observation, not proof of collection before it |
| `coverage.firstAuthorPublicationAt` | Earliest stored non-null author first-publication time | Earliest reliable observation; old records are not backfilled |
| `coverage.legacyExcluded` | Always true for new web/cohort metrics | Explicit semantic boundary |

Publication counts do not use profile creation, parent/revision updatedAt, repeat
approval, revoke/restore or guessed audit history. Author first-publication time
is written atomically with first publication, after media delivery where needed;
re-approval/restoration preserves it. Existing Work first-publication timestamps
already have that ownership. Unknown legacy author timestamps remain visible.

No index is added merely for a hypothetical load. Existing time/identity indexes
and bounded aggregation are reused. The two new unique indexes enforce required
event deduplication and one proven association per account. Query measurements and
remaining release limits are recorded in the audit.

## Legacy overview compatibility

`GET /api/admin/analytics/overview` preserves the existing operational dashboard
shape and definitions: total User rows, period User creations, distinct legacy
user events, total SellerProfile rows, approved Products with a published pointer,
legacy listing views and version 1 acquisition claims. Its historic profile
creation/approval and parent-updated review counters are legacy operational
statistics; they are **not** canonical first-publication growth, waiting-revision
age or proven registration conversion. New UI should use the foundation endpoint
for those metrics. No old data is silently reclassified into the new semantics.

Auction/bid/order metrics remain outside the active portfolio foundation;
leftover commerce rows use the existing read-only inventory.

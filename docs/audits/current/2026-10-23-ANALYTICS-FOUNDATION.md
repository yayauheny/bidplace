# Analytics foundation — 2026-10-23

Base: independent `feature/analytics-foundation` from release `57b03211`.
PR1 moderation metadata is not required. No merge/force push, production enablement,
consent UI, notification or commerce runtime changes.

## Audit and selected scope

- **Keep:** existing AnalyticsService ingestion/PostgreSQL pipeline, canonical
  public visibility predicates, AdminAnalyticsService aggregation, shared
  contracts/client, account creation and legal/email proof boundaries.
- **Fix:** new growth cannot use profile creation/repeat approval; waiting targets
  need revision submittedAt, not parent updatedAt; client identity/login claims
  cannot prove cohort registration. New collection needs explicit default-off
  switches, event uniqueness and cross-tab session ownership.
- **Simplify:** extend AnalyticsEvent/AcquisitionAttribution; reuse the existing
  signing key with purpose/environment separation, Web Locks and one locked DB
  row for session state. No new service, table, queue, synchronization framework,
  dependency, heartbeat, timer or persistent client delivery queue.
- **Defer:** production/legal/retention acceptance, consent UI, rollout and live
  storage/identity-provider operation. Only synthetic isolated environments enabled.

Durable fix: versioned additive ingestion/reporting and server proof at actual
registration. Acceptable compatibility cost: legacy version 1 DTOs/collection and
operational dashboard remain available; they are explicitly not new product
metrics. Rejected hacks: claiming registration in identify, trusting client time
or anonymousId, inferred historical publication dates, or relabeling old events.

## Boundaries and compatibility

[Contract/configuration owner](../../product/analytics-contract.md) defines the
bounded public page union, allowed campaign labels, HttpOnly proof, canonical
server sessions, delivery limits and both independent switches. The Cloudflare
build forces the client switch false unless the target config explicitly opts in;
the optional server switch does not make old deployment configuration fail.

`20261023020000_web_analytics` is additive: nine columns across existing
AnalyticsEvent, AcquisitionAttribution and SellerProfile; two unique indexes for
required event identity and one proven association per account, plus a nullable
User foreign key with SET NULL on deletion. No rows are backfilled/reclassified.
Apply migration before the API. Old writers default to version 1; old DTOs never
receive unknown fields. New publisher writes author first-publication time only
on known actual first publication. Older writers' publication coverage stays null.

Registration persists before best-effort association. Three creation branches use
the same proof hook; regular login/identify/existing identity verification do not.
Failures are sanitized, exclude unproven conversion and preserve the saved user.
Legacy claims can never mutate the separate proven registration relation.

New protected `/api/admin/analytics/foundation` separates product/operational/
cohort/growth/coverage data. [Metric definitions](../../product/analytics-metrics.md)
are the sole owner for source, UTC interval, observation coverage and limits.
The original overview keeps version 1 semantics and excludes new acquisition rows.

## Review and checks

Independent source review covered the full diff, new helper/collector/migration,
registration branches, default-off boundaries, visibility/privacy, DB uniqueness,
row locking, session expiry, trusted environments, cohorts, UTC/growth and unknown
coverage. A Unicode-signature parser error found during review was fixed with
ASCII validation, Buffer-length checks and a best-effort boundary around the
entire attribution hook. Parser and actual registration regressions cover both
malformed proof and attribution storage failure.

Existing owner specs are extended for direct/UTM/referrer priority, server first
visit time, immutable first source, database dedupe, concurrent session starts,
30-minute inactivity/retry, unproven legacy claims, actual registration vs login,
unique account binding, default-off HTTP collection, private fields, admin guards,
first publication/unknown history, pending edits of published entities, UTC growth
and environment isolation. Existing navigation E2E covers browser opt-in, initial
concurrent tabs, reload, SPA navigation, query/hash, auth/preview exclusion and
HttpOnly cookie privacy. Final results, line comparison and HEAD/CI are recorded
in the PR.

No speculative performance index was added. Existing aggregation/time/identity
indexes are retained; new unique indexes are integrity constraints. Query plans
are measured on isolated synthetic data before proposing optimization.

Local verification passed: full `pnpm verify` (470 API, 1034 mobile, 47 contracts,
48 API-client unit tests; 245 integration tests and 29 existing skips; workspace
typecheck/lint/build and web/iOS/Android exports), `pnpm cloudflare:check`, and
four Chromium/WebKit navigation scenarios with both switches off/on. Final owner
integration rerun passed 22 tests; post-format workspace typecheck, API/mobile
lint, 13 mobile owner regressions, docs link check and diff whitespace check passed.
The 5000-event/200-browser EXPLAIN ANALYZE sample measured counts 3.185 ms,
cohort 21.942 ms and growth 1.849 ms. These are single synthetic measurements,
not production latency commitments. Remote CI status belongs to the PR.

## Maintenance comparison

Backend service count and package dependencies are unchanged. One server proof
helper and one small browser collector own the new distinct semantics. Session
state has one owner in the acquisition row, public visibility is shared with
portfolio reads, and publication time belongs to the existing publication
transactions. Compatibility retains two DTO/semantics versions; it does not
introduce a second metrics service or historical guessing. The PR reports exact
added/deleted lines, contract changes, duplication and compatibility cost.

## 2026-10-24 — Review corrections

Canonical author views use `/seller/[slug]`; the `/authors/[slug]` redirect does
not emit another view. Collection now continues without Web Locks with sequential
per-tab delivery and existing server dedupe/session locking. Concurrent cold tabs
without a cookie can establish separate identities; this explicit best-effort
limit replaces the prior unsupported-browser exclusion. No dependencies or new
synchronization service. Owner unit and Chromium/WebKit regressions cover the
canonical route, redirect (including UTM/empty preview), retry and no-lock delivery.
All 1036 mobile unit tests, eight Chromium/WebKit opt-in/off cases, mobile
typecheck/lint, web build, docs links and diff checks passed. A second independent
review has no substantial open findings. Remote CI for the updated HEAD is in PR #63.

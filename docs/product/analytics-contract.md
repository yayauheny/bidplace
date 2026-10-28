# bidplace — Analytics contract

Status: Confirmed for the accepted foundation scope, 2026-10-23. Implementation
and deployment evidence: analytics audit.
Definitions: [metrics owner](analytics-metrics.md). Earlier legacy scope: `DEC-046`, `DEC-067`.

## New public web collection — version 2

`POST /api/analytics/web-events` extends the existing AnalyticsService/Prisma
pipeline. It accepts batches of 1–25 `{ eventId, page }` records. Pages are a strict
union: `home`, `works`, `authors`, `work(publicId)` and `author(slug)`. Work/author
identifiers must also resolve through the existing public visibility boundary.
No arbitrary paths, URLs, query/hash, search terms, form content, client identity,
environment or capture timestamp are accepted. Stored properties contain only
that union. Event name is `public_page_viewed`, platform is `web`, environment is
trusted `ServerEnv.APP_ENV`, collection version is 2. A database unique key on
`environment,eventId` deduplicates delivery; retries preserve the original event ID.

`AnalyticsProvider` observes pathname changes. Re-renders and query/hash changes
do not add views; full opens, reloads and navigation do. Admin/account/editor/auth
routes and `preview` query contexts are excluded. Author views use canonical
`/seller/[slug]`; `/authors/[slug]` redirects without creating its own event.
Native collection is unchanged.
There is no heartbeat, action stream or session timer.

The server creates an opaque browser UUID and signs it with an environment-bound,
purpose-separated HMAC using the existing session signing key. It travels only
in `bp_web_analytics`: HttpOnly, SameSite=Lax, path `/`, Secure under production
security, 30-day sliding cookie lifetime. This is analytics proof, never an auth
principal. Cookie clearing/expiry creates a new browser identity. No fingerprint,
device merging, email/phone-based identity or client-generated proof is used.

A Web Lock serializes requests across same-origin tabs, including the initial
cookie response. The existing acquisition row is the canonical shared state:
`sessionId,lastEventAt`, updated under a row lock using server time. The next new
tracked event after **at least 30 minutes** of inactivity starts a new session.
Duplicate deliveries do not extend inactivity. Tabs/reloads use the same cookie
and row. Without Web Locks, requests are serialized within each tab and collection
continues. Simultaneous first visits in tabs without an existing cookie may create
separate browser identities/sessions before the last cookie response wins; their
visitor/session/attribution counts are best-effort. Later requests share the saved
cookie and server row. A secure browser context is required. Queued events are
retained in memory after delivery failure and retried on the next public view;
closing/reloading before successful delivery can lose them. No durable delivery
queue or new synchronization service is introduced.

## First touch and registration

Every first accepted browser visit is stored, including direct, at server time.
Priority: allowed UTM labels → external browser referrer hostname → `direct`.
UTM fields are source/medium/campaign/content, each bounded to 120 categorical
characters; UTM without source uses `utm`. Referrers retain only an external
hostname, never path/query. Later visits cannot overwrite first touch.

`AcquisitionAttribution.collectionVersion=2` and `environment` isolate these rows.
`registeredUserId` is separate from the untrusted legacy `userId/linkedAt` claim.
The signed cookie is verified at actual account creation: password registration
and both provider onboarding creation branches. The stored `User.createdAt` is
the registration time. Login, identify, identity linking and ready-flow retries
never create a registration. A browser and an account can each contribute only
one proven association. A missing/invalid proof or failed attribution write leaves
the account saved, emits only a sanitized storage-failure diagnostic when needed,
and excludes the unproven association from cohort conversion. No reconstruction
from client `anonymousId`, client time or ordinary login is attempted.

## Configuration and release prerequisites

| Setting | Boundary | Missing value |
| --- | --- | --- |
| `EXPO_PUBLIC_ANALYTICS_WEB_ENABLED=true` | Explicit web build/client opt-in | Off |
| `ANALYTICS_WEB_ENABLED=true` | API opt-in, independent of legacy ingest flag | Off |
| `APP_ENV` | Trusted API environment; web payload cannot override it | Existing validated server configuration |
| `CORS_ORIGIN` | Same-site first-party application origin | Existing server origin configuration |

Cloudflare forwards the server flag as an optional container setting. Its web
build reads the separate client flag from target Wrangler vars and forces false
when missing, even if a caller environment contains true. No production/staging
flag is enabled by this PR. Apply additive migration
`20261023020000_web_analytics` before the new API. Previous writers use version 1;
new nullable columns do not change old response shapes. Publication metadata
written by previous API versions remains unknown, with no timestamp backfill.

Before any production opt-in, the operator must document the applicable processing
basis; event/attribution retention and deletion deadlines; deletion/export procedure
for browser and account associations; whether consent is needed and how it is
withdrawn; necessary policy/cookie notice changes; same-site cookie transport and
approved browser support. The 30-day conversion window and cookie lifetime are
technical settings, not a decision on retention or legal basis. Consent UI,
production enablement, retention jobs and policy publication are outside this PR.
Until these prerequisites are settled, leave both new flags absent/off. Synthetic
isolated tests are the only enabled environment used by this implementation.

## Legacy collection — version 1 compatibility

`POST /api/analytics/events` and the current dashboard/SDK stay available with
their old DTOs. Legacy anonymousId is device-generated; identify uses authenticated
session userId. Historical `claimAcquisition` is not server-proven registration
and is excluded from version 2 conversion. Legacy event names are
`listing_viewed`, `seller_viewed`, `registration_started`, `bid_cta_clicked`,
`bid_rejected`; their previous property schemas stay unchanged. The overview's
acquisition query explicitly selects version 1, so new rows cannot change old
cohort semantics. New product metrics belong only to `/admin/analytics/foundation`.

Legacy switches are unchanged: `ANALYTICS_INGEST_ENABLED` defaults off in test and
on otherwise; client collection is disabled in test or when
`EXPO_PUBLIC_ANALYTICS_ENABLED=false`. Never use legacy claims as proof of signup.
Do not duplicate DB facts as client events, send PII/credentials, or add search,
impression, bid/order or commerce runtime tracking to this foundation.

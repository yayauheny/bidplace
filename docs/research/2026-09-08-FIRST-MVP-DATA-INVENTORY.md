# First MVP factual data inventory

Status: implementation evidence, not legal advice. Reviewed 2026-09-08 from Prisma
schema, server modules and tracked ops scripts only. No environment files, database
rows, credentials or production-provider dashboards were read.

| Data category | Observed source and purpose | Audience / storage | Recipient, country, retention, deletion |
| --- | --- | --- | --- |
| Account and authentication | `User.email`, `passwordHash`, role, status, sessionVersion; verification and reset token tables. Account login, recovery and access control. | Private; PostgreSQL. | SMTP transport is configurable but provider and country are `UNKNOWN`. Retention/deletion policy is `UNKNOWN`. Session version invalidates existing sessions; account deletion behavior is `UNKNOWN`. |
| Author profile and application | `SellerProfile` public name, slug, country, bio, social links, profile media; private handoff fields. Author identity and public portfolio. | Public approved fields; private handoff fields; PostgreSQL metadata plus S3 binary in production. | Public visitors receive only approved profile projection. Storage provider country and retention are `UNKNOWN`; profile deletion/anonymization is `UNKNOWN`. |
| Work and revisions | `Product`, `ProductRevision`, categories, revision images and creation steps. Author portfolio, moderation and public Work page. | Draft/review private; approved public projection; PostgreSQL metadata plus S3 binary in production. | Public access is server-gated by approval. Object keys are deterministic identifiers without PII. Provider country, retention and deletion policy are `UNKNOWN`. |
| Moderation and audit | `AuditEvent` actor, target, prior/next status and reason. Admin accountability. | Private PostgreSQL. | Admin audience only. Retention and deletion behavior are `UNKNOWN`. |
| Email delivery | Verification/reset service supplies recipient address and message content to configured SMTP transport. | Private transient application processing; mail provider `UNKNOWN`. | Provider/country/retention are `UNKNOWN`; delivery failure is logged without credentials. |
| Analytics and errors | `AnalyticsEvent`; server logs and exception filters. Product measurement and operational diagnosis. | Analytics table and process logs. | Analytics provider/country/retention are `UNKNOWN`. Log retention/deletion behavior is `UNKNOWN`. |
| Backups and restore | `scripts/ops/backup-db.sh`, restore and media integrity scripts. Recovery of PostgreSQL plus S3 media. | Operator-controlled backup location; database dump and media bucket are separate. | Backup location, encryption recipient, country, retention and deletion are `UNKNOWN` until operations configuration. |
| Legacy commerce | Listings, bids, orders and historical handoff fields remain in persistence. | Private except old paths when capability is enabled. | First MVP disables commerce through `COMMERCE_ENABLED=false`; retention and deletion are `UNKNOWN`. |

## Controls observed

- Bearer and optional bearer guards load current user status, session version and role.
- Public portfolio data uses narrow projections and approval predicates.
- Production media requires S3 configuration; public URLs are API routes rather than
  provider URLs.
- Backfill and restore commands emit counts/checksum results, not media bytes or
  credentials.

## Required operational decisions

Operator, processors, countries, retention schedules, deletion/anonymization process,
cookie inventory and incident contacts must be confirmed before public launch. These
remain `UNKNOWN` and must not be converted into legal claims without evidence.

## Legacy public URL preflight

`pnpm ops:url-preflight` is a read-only count report for `socialLink`, Telegram,
Instagram and website fields. It never prints values, changes data or upgrades
`http:` to `https:`. Any non-HTTPS legacy value requires manual correction by the
author or an explicitly reviewed cleanup migration before it can be publicly projected.

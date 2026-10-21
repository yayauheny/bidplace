# First MVP external blockers before design

Historical technical checkpoint: 2026-09-08. Legal section updated 2026-10-12
after DEC-118; other dated technical sections below are not a new runtime review.
These launch gates do not authorize deployment.

## Legal preparation and publication

The prepared package and all current legal requirements have one owner:
[final audit](../../legal/00-FINAL-LEGAL-AUDIT.md). DEC-078 registration and the target
retention schedule are confirmed by DEC-118; do not request the closed questionnaire
again. The founder explicitly retained one lawyer question: the lawful basis for
current immediately enabled identifiable analytics. Complete operator/provider facts
and connect/verify the promised controls and cleanup before publishing the texts.

## Production providers and configuration

- Select and document hosting, SMTP and S3-compatible storage providers, country,
  contract role, retention, backup encryption and deletion process.
- Configure production `MEDIA_STORAGE_PROVIDER=s3` and validate object storage, email,
  public URL, CORS/proxy and secret handling without logging credentials.
- Run a disposable PostgreSQL plus MinIO/S3 migration, backfill, restore and checksum
  drill. Current local environment has no PostgreSQL listening on `127.0.0.1:5432`.

## Staging verification

- Apply all migrations to disposable staging PostgreSQL and run `pnpm verify` again.
- Exercise author application, moderation, profile/Work visibility, revision race,
  hide/unhide, public discovery filters, image access and restore verification.
- Capture deployed cookie/SDK inventory and reconcile it with the privacy policy.
- Perform release UI/accessibility verification only after the separate design task;
  this document does not start package 07.

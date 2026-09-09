# First MVP external blockers before design

Status: `Open` as of 2026-09-09. These are external launch gates; they do not authorize
package 07 or a deployment.

## Lawyer review

- Belarus lawyer must answer every section A item in
  [`../../legal/06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md`](../../legal/06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md).
- Operator identity, support contact, lawful basis, age control, licence wording,
  rightsholder procedure, retention/deletion and cookie wording must be approved before
  publishing legal drafts.
- Evidence: dated lawyer response plus accepted document versions recorded in the
  legal review manifest.

## Production providers and configuration

- Select and document hosting, SMTP and S3-compatible storage providers, country,
  contract role, retention, backup encryption and deletion process.
- Configure production `MEDIA_STORAGE_PROVIDER=s3` and validate object storage, email,
  public URL, CORS/proxy and secret handling without logging credentials.
- Run a disposable PostgreSQL plus MinIO/S3 migration, backfill, restore and checksum
  drill. Local Compose now starts Postgres (`127.0.0.1:5432`) and MinIO (`9000`/`9001`,
  bucket `bidplace-media`). API integration uses `bidplace_integration`. A restore
  checksum of existing local `product_images` still fails with S3 `NoSuchKey` until
  those bytes are backfilled; that remains an ops gate, not a “Postgres is down” issue.

## Staging verification

- Apply all migrations to disposable staging PostgreSQL and run `pnpm verify` again.
- Exercise author application, moderation, profile/Work visibility, revision race,
  hide/unhide, public discovery filters, image access and restore verification.
- Capture deployed cookie/SDK inventory and reconcile it with the privacy policy.
- Perform release UI/accessibility verification only after the separate design task;
  this document does not start package 07.

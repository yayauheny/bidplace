# Web auth rollout

Status: local implementation; deployment and real-provider acceptance remain separate.
Scope follows [the approved handoff](../tasks/2026-10-22-auth-media-handoff.md).

## Settings

The owner configures values through server-only secret stores, never chat or client
bundles. Independent `SESSION_SECRET` and `OTP_HASH_SECRET` must each have at least
32 characters in production. Environments must not share these keys.

Google uses `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`;
Telegram uses the matching `TELEGRAM_*` names. A provider must have all three or
none. With no settings its UI is disabled; password/email login remains available.
Configure exact HTTPS callbacks for each environment, normally
`https://bid.place/api/auth/providers/google/callback` and
`https://bid.place/api/auth/providers/telegram/callback` in production. Never derive
callbacks from request Host. Telegram uses modern OIDC and client-secret Basic
authentication; scopes exclude phone and bot messaging. The test issuer setting
is restricted to explicit local/test profile plus loopback.

## Coordinated cutover

1. Complete the existing backup/restore preflight in [release operations](00-RELEASE-AND-BACKUP.md).
2. Close writes and stop old API writers. Old JWT and the new session runtime must
   not write against this rollout concurrently.
3. Apply additive migrations through the normal separate migration step. Preserve
   User IDs, works, media and legal evidence. Do not reset/seed or edit old migrations.
   The new social-auth migration invalidates outstanding old verification codes.
   The combined tree includes `20261022010000_server_sessions`,
   `20261022020000_social_auth`, `20261022030000_email_login_request_lookup`,
   `20261022040000_auth_email_proof`, `20261022120000_normalized_media_source`
   and `20261022180000_legacy_image_upload_identity`. Apply only pending migrations;
   existing normalized SOURCE, User IDs and media remain intact.
4. Deploy the matching API image and SPA, then verify health/readiness, password
   login, private reads, logout/revocation and new auth flows before reopening.
5. Require users to log in again: old JWTs are intentionally unsupported. Do not
   roll back applied migrations with table drops.

PR preparation does not execute these production steps or authorize merging the PR.

## External acceptance

Use separate safe provider clients and real Turnstile/mail configuration. Confirm
first and returning Google/Telegram, denied consent, missing/edited email, email
collision without merge, explicit link after fresh authentication, Google-to-code
and email-to-Google identity continuity. Confirm provider settings/keys stay out of
SPA assets, URLs and logs. Test IdP covers HTTP protocol and signed tokens locally;
it cannot prove provider registration or real email delivery.

Photo changes from MVP/PR #59 are integrated; auth and media must be verified
on the combined image/schema. Native provider login and new Figma composition
approval are not claimed by this implementation.

Synchronous SMTP remains the accepted MVP limitation in DEC-136. A known-address
code request can wait for SMTP while an unknown address returns earlier; equal
HTTP bodies do not close that enumeration channel. Local measurements and
Cloudflare outbox trade-offs are in the [PR #58 verification](../audits/current/2026-10-23-PR58-MERGE-VERIFICATION.md).
Production readiness requires a separate timing/security acceptance on the target
infrastructure, as well as real provider/mail/Turnstile and migration/rollback gates.

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
4. Deploy the matching API image and SPA, then verify health/readiness, password
   login, private reads, logout/revocation and new auth flows before reopening.
5. Require users to log in again: old JWTs are intentionally unsupported. Do not
   roll back applied migrations with table drops.

This task does not execute these production steps or push/merge code.

## External acceptance

Use separate safe provider clients and real Turnstile/mail configuration. Confirm
first and returning Google/Telegram, denied consent, missing/edited email, email
collision without merge, explicit link after fresh authentication, Google-to-code
and email-to-Google identity continuity. Confirm provider settings/keys stay out of
SPA assets, URLs and logs. Test IdP covers HTTP protocol and signed tokens locally;
it cannot prove provider registration or real email delivery.

PR56 media integration is separate. Native provider login and new Figma composition
approval are not claimed by this implementation.

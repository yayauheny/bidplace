-- One-time import of retained email-verification and password-reset credentials.
-- Apply in the same release as the ledger, before the new runtime serves traffic.
-- A later restart does not run this migration again.
--
-- Historic mailbox addresses were not stored on these rows, so spend is attributed
-- to the user's current email. Rejected sends were deleted and are not invented.
-- In-memory login counters are not recoverable. Imported status is unknown:
-- SMTP acceptance is not invented. Credential expiry, used_at, and attempts stay
-- unchanged. The latest unused code's attempt count is copied onto the OTP
-- counter. When that count is already at least 5, the row has no failure
-- timestamp, so the cutover starts one five-minute pause. Conflict targets keep
-- that first pause.

INSERT INTO "auth_abuse_operations" (
    "id",
    "owner_user_id",
    "email",
    "purpose",
    "idempotency_key",
    "content_hash",
    "status",
    "secret_id",
    "created_at"
)
SELECT
    gen_random_uuid(),
    code."user_id",
    account."email",
    'email_verification_send',
    'legacy-otp-' || code."id"::text,
    encode(sha256(
        convert_to('email_verification_send', 'UTF8')
        || decode('00', 'hex')
        || convert_to(code."user_id"::text, 'UTF8')
        || decode('00', 'hex')
        || convert_to(account."email", 'UTF8')
    ), 'hex'),
    'unknown',
    code."id",
    code."created_at"
FROM "email_verification_codes" AS code
JOIN "users" AS account ON account."id" = code."user_id"
ON CONFLICT ("purpose", "idempotency_key") DO NOTHING;

INSERT INTO "auth_abuse_operations" (
    "id",
    "owner_user_id",
    "email",
    "purpose",
    "idempotency_key",
    "content_hash",
    "status",
    "secret_id",
    "created_at"
)
SELECT
    gen_random_uuid(),
    token."user_id",
    account."email",
    'password_reset_send',
    'legacy-rst-' || token."id"::text,
    encode(sha256(
        convert_to('password_reset_send', 'UTF8')
        || decode('00', 'hex')
        || convert_to(account."email", 'UTF8')
    ), 'hex'),
    'unknown',
    token."id",
    token."created_at"
FROM "password_reset_tokens" AS token
JOIN "users" AS account ON account."id" = token."user_id"
ON CONFLICT ("purpose", "idempotency_key") DO NOTHING;

INSERT INTO "auth_abuse_counters" (
    "id",
    "scope",
    "subject_hash",
    "failures",
    "window_start",
    "paused_until",
    "failure_timestamps",
    "updated_at"
)
SELECT
    gen_random_uuid(),
    'otp_verify',
    encode(sha256(convert_to('otp_verify' || chr(10) || latest."user_id"::text, 'UTF8')), 'hex'),
    latest."attempts",
    latest."created_at",
    CASE
        WHEN latest."attempts" >= 5 THEN CURRENT_TIMESTAMP + INTERVAL '5 minutes'
        ELSE NULL
    END,
    ARRAY[]::TIMESTAMP(3)[],
    CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT ON ("user_id")
        "user_id",
        "attempts",
        "created_at"
    FROM "email_verification_codes"
    WHERE "used_at" IS NULL
    ORDER BY "user_id", "created_at" DESC, "id" DESC
) AS latest
WHERE latest."attempts" > 0
ON CONFLICT ("scope", "subject_hash") DO NOTHING;

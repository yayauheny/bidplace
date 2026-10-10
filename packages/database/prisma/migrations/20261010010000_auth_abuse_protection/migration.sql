-- Auth mail reservations, login/OTP counters, and idempotent operations.
-- Additive. Quotas count reserved, accepted, and unknown rows. Rejected and
-- suppressed rows do not spend budget. owner_user_id stays nullable so a
-- password-reset attempt for an unknown address can be replayed without a user.

CREATE TABLE "auth_abuse_operations" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID,
    "email" VARCHAR(255) NOT NULL,
    "purpose" VARCHAR(40) NOT NULL,
    "idempotency_key" VARCHAR(80) NOT NULL,
    "content_hash" CHAR(64) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "secret_id" UUID,
    "result_deadline" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "auth_abuse_operations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_abuse_operations_purpose_idempotency_key_key"
    ON "auth_abuse_operations"("purpose", "idempotency_key");

CREATE INDEX "auth_abuse_operations_owner_user_id_purpose_created_at_idx"
    ON "auth_abuse_operations"("owner_user_id", "purpose", "created_at");

CREATE INDEX "auth_abuse_operations_email_purpose_created_at_idx"
    ON "auth_abuse_operations"("email", "purpose", "created_at");

CREATE INDEX "auth_abuse_operations_purpose_status_created_at_idx"
    ON "auth_abuse_operations"("purpose", "status", "created_at");

ALTER TABLE "auth_abuse_operations"
    ADD CONSTRAINT "auth_abuse_operations_owner_user_id_fkey"
    FOREIGN KEY ("owner_user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "auth_abuse_counters" (
    "id" UUID NOT NULL,
    "scope" VARCHAR(40) NOT NULL,
    "subject_hash" CHAR(64) NOT NULL,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "window_start" TIMESTAMP(3) NOT NULL,
    "paused_until" TIMESTAMP(3),
    "failure_timestamps" TIMESTAMP(3)[] NOT NULL DEFAULT ARRAY[]::TIMESTAMP(3)[],
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_abuse_counters_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_abuse_counters_scope_subject_hash_key"
    ON "auth_abuse_counters"("scope", "subject_hash");

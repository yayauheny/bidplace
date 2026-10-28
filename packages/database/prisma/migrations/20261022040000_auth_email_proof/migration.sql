ALTER TABLE "auth_flows"
  ADD COLUMN "code_hash" CHAR(64),
  ADD COLUMN "code_expires_at" TIMESTAMP(3),
  ADD COLUMN "code_sent_at" TIMESTAMP(3),
  ADD COLUMN "code_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "code_sends" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "email_proved_at" TIMESTAMP(3),
  ADD COLUMN "code_request_key" VARCHAR(80),
  ADD COLUMN "profile_slug" VARCHAR(120),
  ADD COLUMN "legal_version" VARCHAR(120),
  ADD COLUMN "legal_accepted_at" TIMESTAMP(3);

CREATE INDEX "auth_flows_email_code_sent_at_idx" ON "auth_flows"("email", "code_sent_at");

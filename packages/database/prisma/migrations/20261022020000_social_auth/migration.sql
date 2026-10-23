ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
ALTER TABLE "email_verification_codes" ADD COLUMN "purpose" VARCHAR(32) NOT NULL DEFAULT 'email_verification', ADD COLUMN "flow_id" UUID, ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
UPDATE "email_verification_codes" SET "used_at" = CURRENT_TIMESTAMP WHERE "used_at" IS NULL;
CREATE TABLE "external_identities" (
 "id" UUID PRIMARY KEY, "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
 "provider" VARCHAR(16) NOT NULL, "issuer" VARCHAR(255) NOT NULL, "subject" VARCHAR(255) NOT NULL,
 "activated_at" TIMESTAMP(3), "pending_version" INTEGER NOT NULL DEFAULT 0, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "external_identities_issuer_subject_key" ON "external_identities"("issuer", "subject");
CREATE UNIQUE INDEX "external_identities_user_id_provider_key" ON "external_identities"("user_id", "provider");
CREATE TABLE "auth_flows" (
 "id" UUID PRIMARY KEY, "browser_hash" CHAR(64) NOT NULL, "provider" VARCHAR(16),
 "intent" VARCHAR(24) NOT NULL, "stage" VARCHAR(24) NOT NULL, "return_path" VARCHAR(2048) NOT NULL,
 "state_hash" CHAR(64), "nonce" VARCHAR(255), "verifier" TEXT, "issuer" VARCHAR(255), "subject" VARCHAR(255),
 "email_proof" VARCHAR(255), "email" VARCHAR(255), "user_id" UUID, "version" INTEGER,
 "expires_at" TIMESTAMP(3) NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "auth_flows_browser_hash_stage_idx" ON "auth_flows"("browser_hash", "stage");
CREATE INDEX "auth_flows_expires_at_idx" ON "auth_flows"("expires_at");

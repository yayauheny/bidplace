-- No legacy acceptance is inferred. All fields are required only for new evidence rows.
CREATE TABLE "registration_legal_evidence" (
    "user_id" UUID NOT NULL,
    "agreement_version" VARCHAR(80) NOT NULL,
    "agreement_accepted_at" TIMESTAMP(3) NOT NULL,
    "privacy_version" VARCHAR(80) NOT NULL,
    "privacy_acknowledged_at" TIMESTAMP(3) NOT NULL,
    "data_consent_version" VARCHAR(80) NOT NULL,
    "data_consented_at" TIMESTAMP(3) NOT NULL,
    "age_18_confirmed_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "registration_legal_evidence_pkey" PRIMARY KEY ("user_id")
);
ALTER TABLE "registration_legal_evidence"
    ADD CONSTRAINT "registration_legal_evidence_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

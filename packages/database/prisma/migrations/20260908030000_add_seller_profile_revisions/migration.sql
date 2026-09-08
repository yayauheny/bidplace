-- Portfolio profile revisions keep an approved public profile stable while the
-- author prepares and submits a subsequent change for moderation.
CREATE TABLE "seller_profile_revisions" (
  "id" UUID NOT NULL,
  "seller_profile_id" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "SellerProfileStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "slug" VARCHAR(120) NOT NULL,
  "discipline" VARCHAR(160) NOT NULL,
  "full_name" VARCHAR(160) NOT NULL,
  "country" VARCHAR(80) NOT NULL,
  "city" VARCHAR(160),
  "practice" TEXT,
  "social_link" VARCHAR(255) NOT NULL,
  "telegram_url" VARCHAR(255),
  "instagram_url" VARCHAR(255),
  "website_url" VARCHAR(255),
  "short_description" TEXT NOT NULL,
  "submitted_at" TIMESTAMP(3),
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "seller_profile_revisions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "seller_profiles"
  ADD COLUMN "editing_revision_id" UUID,
  ADD COLUMN "published_revision_id" UUID;

INSERT INTO "seller_profile_revisions" (
  "id", "seller_profile_id", "version", "status", "slug", "discipline",
  "full_name", "country", "city", "practice", "social_link", "telegram_url",
  "instagram_url", "website_url", "short_description", "submitted_at",
  "reviewed_at", "created_at", "updated_at"
)
SELECT
  md5(random()::text || clock_timestamp()::text || sp."id"::text)::uuid,
  sp."id", 1, sp."status", sp."slug", sp."discipline", sp."full_name",
  sp."country", sp."city", sp."practice", sp."social_link", sp."telegram_url",
  sp."instagram_url", sp."website_url", sp."short_description",
  CASE WHEN sp."status" = 'PENDING_REVIEW' THEN sp."updated_at" ELSE NULL END,
  CASE WHEN sp."status" IN ('APPROVED', 'CHANGES_REQUESTED', 'REJECTED', 'SUSPENDED')
    THEN sp."updated_at" ELSE NULL END,
  sp."created_at", sp."updated_at"
FROM "seller_profiles" sp;

UPDATE "seller_profiles" sp
SET "editing_revision_id" = r."id",
    "published_revision_id" = CASE
      WHEN sp."status" = 'APPROVED' THEN r."id"
      ELSE NULL
    END
FROM "seller_profile_revisions" r
WHERE r."seller_profile_id" = sp."id" AND r."version" = 1;

CREATE UNIQUE INDEX "seller_profiles_editing_revision_id_key"
  ON "seller_profiles"("editing_revision_id");
CREATE UNIQUE INDEX "seller_profiles_published_revision_id_key"
  ON "seller_profiles"("published_revision_id");
CREATE UNIQUE INDEX "seller_profile_revisions_seller_profile_id_version_key"
  ON "seller_profile_revisions"("seller_profile_id", "version");
CREATE INDEX "seller_profile_revisions_seller_profile_id_status_idx"
  ON "seller_profile_revisions"("seller_profile_id", "status");

ALTER TABLE "seller_profile_revisions"
  ADD CONSTRAINT "seller_profile_revisions_seller_profile_id_fkey"
  FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seller_profiles"
  ADD CONSTRAINT "seller_profiles_editing_revision_id_fkey"
  FOREIGN KEY ("editing_revision_id") REFERENCES "seller_profile_revisions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "seller_profiles_published_revision_id_fkey"
  FOREIGN KEY ("published_revision_id") REFERENCES "seller_profile_revisions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

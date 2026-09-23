CREATE TYPE "AuthorApplicationStage" AS ENUM ('CONTACTS', 'ABOUT', 'ACHIEVEMENTS');
CREATE TYPE "AchievementDatePrecision" AS ENUM ('MONTH', 'DAY');

ALTER TABLE "seller_profiles"
  ALTER COLUMN "discipline" DROP NOT NULL,
  ALTER COLUMN "short_description" DROP NOT NULL,
  ADD COLUMN "application_stage" "AuthorApplicationStage",
  ADD COLUMN "public_email" VARCHAR(254);

ALTER TABLE "seller_profile_revisions"
  ALTER COLUMN "discipline" DROP NOT NULL,
  ALTER COLUMN "short_description" DROP NOT NULL,
  ADD COLUMN "public_email" VARCHAR(254);

ALTER TABLE "seller_profile_revision_achievements"
  ADD COLUMN "occurred_at_precision" "AchievementDatePrecision";

UPDATE "seller_profiles"
SET "application_stage" = 'ACHIEVEMENTS'
WHERE "status" = 'DRAFT';

UPDATE "seller_profile_revision_achievements"
SET "occurred_at_precision" = 'DAY'
WHERE "occurred_at" IS NOT NULL;

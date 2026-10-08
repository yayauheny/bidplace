-- Canonical account nickname. Production applies this migration before the
-- application update, so seller_profiles.slug stays readable by the previous
-- application. Drop that column only in a later migration, after this
-- application is the only writer, every seller_profiles.slug equals the
-- user's slug (copy any still-null users.slug from the profile column first,
-- and stop if the two strings differ), and no live query reads the profile
-- column. Do not rewrite seller_profile_revisions or existing display_name
-- values in this migration.

ALTER TABLE "users" ALTER COLUMN "display_name" DROP NOT NULL;

ALTER TABLE "users" ADD COLUMN "slug" VARCHAR(120);

UPDATE "users" AS account
SET "slug" = profile."slug"
FROM "seller_profiles" AS profile
WHERE profile."user_id" = account."id"
  AND account."slug" IS NULL;

CREATE UNIQUE INDEX "users_slug_key" ON "users"("slug");

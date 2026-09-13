ALTER TABLE "seller_profile_revisions"
  ADD COLUMN "profile_photo_mime_type" VARCHAR(100),
  ADD COLUMN "profile_photo_byte_length" INTEGER,
  ADD COLUMN "profile_photo_checksum" CHAR(64),
  ADD COLUMN "profile_photo_object_key" VARCHAR(255);

UPDATE "seller_profile_revisions" revision
SET
  "profile_photo_mime_type" = profile."profile_photo_mime_type",
  "profile_photo_byte_length" = profile."profile_photo_byte_length",
  "profile_photo_checksum" = profile."profile_photo_checksum",
  "profile_photo_object_key" = profile."profile_photo_object_key"
FROM "seller_profiles" profile
WHERE profile."id" = revision."seller_profile_id";

CREATE INDEX "seller_profile_revisions_profile_photo_object_key_idx"
  ON "seller_profile_revisions"("profile_photo_object_key");

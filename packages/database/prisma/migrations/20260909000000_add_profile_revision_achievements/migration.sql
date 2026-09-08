CREATE TABLE "seller_profile_revision_achievements" (
  "id" UUID NOT NULL,
  "revision_id" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  "occurred_at" TIMESTAMP(3),
  "body" TEXT NOT NULL,
  "mime_type" VARCHAR(100),
  "byte_length" INTEGER,
  "checksum" CHAR(64),
  "object_key" VARCHAR(255),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "seller_profile_revision_achievements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "seller_profile_revision_achievements_revision_id_position_key"
  ON "seller_profile_revision_achievements"("revision_id", "position");
CREATE INDEX "seller_profile_revision_achievements_object_key_idx"
  ON "seller_profile_revision_achievements"("object_key");

ALTER TABLE "seller_profile_revision_achievements"
  ADD CONSTRAINT "seller_profile_revision_achievements_revision_id_fkey"
  FOREIGN KEY ("revision_id") REFERENCES "seller_profile_revisions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

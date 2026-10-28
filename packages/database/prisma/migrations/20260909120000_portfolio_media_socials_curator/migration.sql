ALTER TABLE "seller_profiles"
  ALTER COLUMN "social_link" DROP NOT NULL;

ALTER TABLE "seller_profile_revisions"
  ALTER COLUMN "social_link" DROP NOT NULL,
  ADD COLUMN "profile_photo_data" BYTEA;

ALTER TABLE "seller_profile_revision_achievements"
  ADD COLUMN "data" BYTEA;

CREATE TABLE "curator_selections" (
  "id" UUID NOT NULL,
  "slot" VARCHAR(32) NOT NULL,
  "product_id" UUID NOT NULL,
  "curator_seller_profile_id" UUID NOT NULL,
  "note" TEXT,
  "selected_at" TIMESTAMP(3) NOT NULL,
  "selected_by_user_id" UUID,
  CONSTRAINT "curator_selections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "curator_selections_slot_key" ON "curator_selections"("slot");
CREATE UNIQUE INDEX "curator_selections_product_id_key" ON "curator_selections"("product_id");
CREATE INDEX "curator_selections_curator_seller_profile_id_idx" ON "curator_selections"("curator_seller_profile_id");

ALTER TABLE "curator_selections"
  ADD CONSTRAINT "curator_selections_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "curator_selections"
  ADD CONSTRAINT "curator_selections_curator_seller_profile_id_fkey"
  FOREIGN KEY ("curator_seller_profile_id") REFERENCES "seller_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "curator_selections"
  ADD CONSTRAINT "curator_selections_selected_by_user_id_fkey"
  FOREIGN KEY ("selected_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

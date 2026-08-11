ALTER TABLE "seller_profiles"
  ADD COLUMN "telegram_url" VARCHAR(255),
  ADD COLUMN "instagram_url" VARCHAR(255),
  ADD COLUMN "website_url" VARCHAR(255);

ALTER TABLE "products"
  ADD COLUMN "creation_intro" TEXT;

ALTER TABLE "product_images"
  ADD COLUMN "width" INTEGER,
  ADD COLUMN "height" INTEGER;

CREATE TABLE "product_creation_steps" (
  "id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "body" TEXT NOT NULL,
  "mime_type" VARCHAR(100),
  "byte_length" INTEGER,
  "data" BYTEA,
  "checksum" CHAR(64),
  "width" INTEGER,
  "height" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "product_creation_steps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_creation_steps_product_id_position_key"
  ON "product_creation_steps"("product_id", "position");
CREATE INDEX "product_creation_steps_product_id_idx"
  ON "product_creation_steps"("product_id");

ALTER TABLE "product_creation_steps"
  ADD CONSTRAINT "product_creation_steps_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

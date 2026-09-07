ALTER TABLE "seller_profiles"
  ADD COLUMN "profile_photo_object_key" VARCHAR(255);

ALTER TABLE "product_images"
  ADD COLUMN "object_key" VARCHAR(255);

ALTER TABLE "product_creation_steps"
  ADD COLUMN "object_key" VARCHAR(255);

UPDATE "seller_profiles"
SET "profile_photo_object_key" = 'seller-photo:' || "id"::text
WHERE "profile_photo_object_key" IS NULL;

UPDATE "product_images"
SET "object_key" = 'product-image:' || "id"::text
WHERE "object_key" IS NULL;

UPDATE "product_creation_steps"
SET "object_key" = 'creation-step:' || "id"::text
WHERE "object_key" IS NULL
  AND "mime_type" IS NOT NULL;

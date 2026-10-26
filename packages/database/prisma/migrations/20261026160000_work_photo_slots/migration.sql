ALTER TABLE "product_revision_images"
  ADD COLUMN "slot_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "crop" JSONB,
  ADD COLUMN "operation_key" CHAR(64),
  ADD COLUMN "operation_checksum" CHAR(64);
CREATE UNIQUE INDEX "product_revision_images_slot_id_key" ON "product_revision_images"("slot_id");
ALTER TABLE "product_revision_images" ADD CONSTRAINT "product_revision_image_crop_bounds"
CHECK ("version" >= 0 AND ("crop" IS NULL OR (
  jsonb_typeof("crop") = 'object'
  AND "crop" ?& ARRAY['x','y','width','height']
  AND jsonb_typeof("crop"->'x') = 'number'
  AND jsonb_typeof("crop"->'y') = 'number'
  AND jsonb_typeof("crop"->'width') = 'number'
  AND jsonb_typeof("crop"->'height') = 'number'
  AND ("crop"->>'x')::numeric >= 0 AND ("crop"->>'y')::numeric >= 0
  AND ("crop"->>'width')::numeric > 0 AND ("crop"->>'height')::numeric > 0
  AND ("crop"->>'x')::numeric + ("crop"->>'width')::numeric <= 1
  AND ("crop"->>'y')::numeric + ("crop"->>'height')::numeric <= 1
)));
ALTER TABLE "media_operations" ADD COLUMN "photo_result" JSONB, ADD COLUMN "photo_request_checksum" CHAR(64);

ALTER TABLE "product_images" ADD COLUMN "upload_identity" CHAR(64),
  ADD COLUMN "input_checksum" CHAR(64);
CREATE UNIQUE INDEX "product_images_upload_identity_key" ON "product_images"("upload_identity");

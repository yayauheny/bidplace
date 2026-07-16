-- CreateTable
CREATE TABLE "lot_images" (
    "id" UUID NOT NULL,
    "lot_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "byte_length" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "checksum" CHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lot_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lot_images_lot_id_idx" ON "lot_images"("lot_id");

-- CreateIndex
CREATE UNIQUE INDEX "lot_images_lot_id_position_key" ON "lot_images"("lot_id", "position");

-- AddForeignKey
ALTER TABLE "lot_images" ADD CONSTRAINT "lot_images_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropLegacyColumn
ALTER TABLE "lots" DROP COLUMN "images";

ALTER TYPE "MediaProvenance" ADD VALUE 'NORMALIZED';
ALTER TABLE "media_operations" ADD COLUMN "input_checksum" CHAR(64);

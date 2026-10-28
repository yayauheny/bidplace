-- CreateEnum
CREATE TYPE "MediaPurpose" AS ENUM ('WORK_IMAGE', 'AUTHOR_PHOTO', 'ACHIEVEMENT', 'LEGACY_CREATION_STEP');

-- CreateEnum
CREATE TYPE "MediaProvenance" AS ENUM ('ORIGINAL', 'LEGACY_NORMALIZED');

-- CreateEnum
CREATE TYPE "MediaTier" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "MediaVariant" AS ENUM ('SOURCE', 'PREVIEW', 'FULL');

-- CreateEnum
CREATE TYPE "MediaAssetState" AS ENUM ('STAGING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "MediaObjectState" AS ENUM ('PLANNED', 'READY', 'DELETE_PENDING', 'DELETED');

-- CreateEnum
CREATE TYPE "MediaOperationKind" AS ENUM ('UPLOAD', 'PUBLISH', 'REVOKE', 'CLEANUP');

-- CreateEnum
CREATE TYPE "MediaOperationState" AS ENUM ('PENDING', 'RUNNING', 'FAILED', 'DONE', 'CANCELLED');

-- AlterTable
ALTER TABLE "seller_profiles" ADD COLUMN     "profile_photo_asset_id" UUID;

-- AlterTable
ALTER TABLE "seller_profile_revisions" ADD COLUMN     "profile_photo_asset_id" UUID;

-- AlterTable
ALTER TABLE "seller_profile_revision_achievements" ADD COLUMN     "media_asset_id" UUID;

-- AlterTable
ALTER TABLE "product_images" ADD COLUMN     "media_asset_id" UUID;

-- AlterTable
ALTER TABLE "product_creation_steps" ADD COLUMN     "media_asset_id" UUID;

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "purpose" "MediaPurpose" NOT NULL,
    "source_provenance" "MediaProvenance" NOT NULL DEFAULT 'ORIGINAL',
    "state" "MediaAssetState" NOT NULL DEFAULT 'STAGING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_objects" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "variant" "MediaVariant" NOT NULL,
    "tier" "MediaTier" NOT NULL,
    "pipeline_version" VARCHAR(16) NOT NULL,
    "object_key" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "byte_length" INTEGER NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "public_url" VARCHAR(1024),
    "state" "MediaObjectState" NOT NULL DEFAULT 'PLANNED',
    "lease_token" UUID,
    "lease_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_objects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_operations" (
    "id" UUID NOT NULL,
    "kind" "MediaOperationKind" NOT NULL,
    "state" "MediaOperationState" NOT NULL DEFAULT 'PENDING',
    "identity" VARCHAR(255) NOT NULL,
    "profile_id" UUID,
    "product_id" UUID,
    "revision_id" UUID,
    "expected_revision_at" TIMESTAMP(3),
    "restore" BOOLEAN NOT NULL DEFAULT false,
    "previous_revision_id" UUID,
    "actor_user_id" UUID,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lease_until" TIMESTAMP(3),
    "lease_token" UUID,
    "error_code" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_operation_objects" (
    "operation_id" UUID NOT NULL,
    "object_id" UUID NOT NULL,
    "state" "MediaObjectState" NOT NULL DEFAULT 'PLANNED',

    CONSTRAINT "media_operation_objects_pkey" PRIMARY KEY ("operation_id","object_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "media_objects_tier_object_key_key" ON "media_objects"("tier", "object_key");

-- CreateIndex
CREATE UNIQUE INDEX "media_objects_asset_id_variant_tier_pipeline_version_key" ON "media_objects"("asset_id", "variant", "tier", "pipeline_version");

-- CreateIndex
CREATE UNIQUE INDEX "media_operations_identity_key" ON "media_operations"("identity");

-- CreateIndex
CREATE INDEX "media_operations_state_next_attempt_at_idx" ON "media_operations"("state", "next_attempt_at");

-- CreateIndex
CREATE INDEX "media_operations_profile_id_product_id_kind_state_idx" ON "media_operations"("profile_id", "product_id", "kind", "state");

-- CreateIndex
CREATE INDEX "seller_profiles_profile_photo_asset_id_idx" ON "seller_profiles"("profile_photo_asset_id");

-- CreateIndex
CREATE INDEX "seller_profile_revisions_profile_photo_asset_id_idx" ON "seller_profile_revisions"("profile_photo_asset_id");

-- CreateIndex
CREATE INDEX "seller_profile_revision_achievements_media_asset_id_idx" ON "seller_profile_revision_achievements"("media_asset_id");

-- CreateIndex
CREATE INDEX "product_images_media_asset_id_idx" ON "product_images"("media_asset_id");

-- CreateIndex
CREATE INDEX "product_creation_steps_media_asset_id_idx" ON "product_creation_steps"("media_asset_id");

-- AddForeignKey
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_profile_photo_asset_id_fkey" FOREIGN KEY ("profile_photo_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_profile_revisions" ADD CONSTRAINT "seller_profile_revisions_profile_photo_asset_id_fkey" FOREIGN KEY ("profile_photo_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_profile_revision_achievements" ADD CONSTRAINT "seller_profile_revision_achievements_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_creation_steps" ADD CONSTRAINT "product_creation_steps_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_objects" ADD CONSTRAINT "media_objects_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_operations" ADD CONSTRAINT "media_operations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "seller_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_operations" ADD CONSTRAINT "media_operations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_operation_objects" ADD CONSTRAINT "media_operation_objects_operation_id_fkey" FOREIGN KEY ("operation_id") REFERENCES "media_operations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_operation_objects" ADD CONSTRAINT "media_operation_objects_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "media_objects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE media_objects ADD CONSTRAINT media_source_private CHECK (variant <> 'SOURCE' OR (tier = 'PRIVATE' AND pipeline_version = 'source' AND public_url IS NULL));
ALTER TABLE media_objects ADD CONSTRAINT media_positive_dimensions CHECK (byte_length > 0 AND width > 0 AND height > 0);
ALTER TABLE media_objects ADD CONSTRAINT media_public_derivative CHECK (tier <> 'PUBLIC' OR (variant <> 'SOURCE' AND public_url IS NOT NULL));

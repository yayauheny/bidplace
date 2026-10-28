-- Author directions, shared terms, proposals, and revision-owned story blocks.
-- Clean-database oriented: no legacy story or country backfill.

ALTER TYPE "AuditTargetType" ADD VALUE IF NOT EXISTS 'CATALOG';
ALTER TYPE "MediaPurpose" ADD VALUE IF NOT EXISTS 'STORY_IMAGE';

ALTER TABLE "categories"
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "product_revisions"
  ADD COLUMN "story_token" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "story_idempotency_key" VARCHAR(80);

CREATE TYPE "CatalogTermRole" AS ENUM ('MATERIAL', 'TECHNIQUE');
CREATE TYPE "CatalogProposalKind" AS ENUM ('CATEGORY', 'MATERIAL', 'TECHNIQUE');
CREATE TYPE "CatalogProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "StoryBlockType" AS ENUM ('HEADING', 'PARAGRAPH', 'IMAGE');

CREATE TABLE "seller_profile_revision_directions" (
  "revision_id" UUID NOT NULL,
  "category_id" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  CONSTRAINT "seller_profile_revision_directions_pkey" PRIMARY KEY ("revision_id", "category_id")
);

CREATE TABLE "catalog_terms" (
  "id" UUID NOT NULL,
  "role" "CatalogTermRole" NOT NULL,
  "slug" VARCHAR(120) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "catalog_terms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_revision_terms" (
  "revision_id" UUID NOT NULL,
  "term_id" UUID NOT NULL,
  CONSTRAINT "product_revision_terms_pkey" PRIMARY KEY ("revision_id", "term_id")
);

CREATE TABLE "catalog_proposals" (
  "id" UUID NOT NULL,
  "author_user_id" UUID NOT NULL,
  "product_revision_id" UUID NOT NULL,
  "kind" "CatalogProposalKind" NOT NULL,
  "raw_name" VARCHAR(160) NOT NULL,
  "normalized_name" VARCHAR(160) NOT NULL,
  "status" "CatalogProposalStatus" NOT NULL DEFAULT 'PENDING',
  "selected" BOOLEAN NOT NULL DEFAULT true,
  "mapped_category_id" UUID,
  "mapped_term_id" UUID,
  "rejection_reason" TEXT,
  "reviewed_by_user_id" UUID,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "catalog_proposals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_revision_story_blocks" (
  "id" UUID NOT NULL,
  "revision_id" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  "type" "StoryBlockType" NOT NULL,
  "text" TEXT,
  "alt_text" VARCHAR(300),
  "media_asset_id" UUID,
  CONSTRAINT "product_revision_story_blocks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_revision_story_assets" (
  "revision_id" UUID NOT NULL,
  "media_asset_id" UUID NOT NULL,
  CONSTRAINT "product_revision_story_assets_pkey" PRIMARY KEY ("revision_id", "media_asset_id")
);

CREATE UNIQUE INDEX "seller_profile_revision_directions_revision_id_position_key"
  ON "seller_profile_revision_directions"("revision_id", "position");
CREATE INDEX "seller_profile_revision_directions_category_id_idx"
  ON "seller_profile_revision_directions"("category_id");

CREATE UNIQUE INDEX "catalog_terms_role_slug_key" ON "catalog_terms"("role", "slug");

CREATE INDEX "product_revision_terms_term_id_idx" ON "product_revision_terms"("term_id");

CREATE UNIQUE INDEX "catalog_proposals_product_revision_id_kind_normalized_name_key"
  ON "catalog_proposals"("product_revision_id", "kind", "normalized_name");
CREATE INDEX "catalog_proposals_product_revision_id_status_selected_idx"
  ON "catalog_proposals"("product_revision_id", "status", "selected");
CREATE INDEX "catalog_proposals_kind_normalized_name_status_idx"
  ON "catalog_proposals"("kind", "normalized_name", "status");

CREATE UNIQUE INDEX "product_revision_story_blocks_revision_id_position_key"
  ON "product_revision_story_blocks"("revision_id", "position");
CREATE INDEX "product_revision_story_blocks_media_asset_id_idx"
  ON "product_revision_story_blocks"("media_asset_id");
CREATE INDEX "product_revision_story_assets_media_asset_id_idx"
  ON "product_revision_story_assets"("media_asset_id");

ALTER TABLE "seller_profile_revision_directions"
  ADD CONSTRAINT "seller_profile_revision_directions_revision_id_fkey"
  FOREIGN KEY ("revision_id") REFERENCES "seller_profile_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seller_profile_revision_directions"
  ADD CONSTRAINT "seller_profile_revision_directions_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_revision_terms"
  ADD CONSTRAINT "product_revision_terms_revision_id_fkey"
  FOREIGN KEY ("revision_id") REFERENCES "product_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_revision_terms"
  ADD CONSTRAINT "product_revision_terms_term_id_fkey"
  FOREIGN KEY ("term_id") REFERENCES "catalog_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "catalog_proposals"
  ADD CONSTRAINT "catalog_proposals_author_user_id_fkey"
  FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_proposals"
  ADD CONSTRAINT "catalog_proposals_reviewed_by_user_id_fkey"
  FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_proposals"
  ADD CONSTRAINT "catalog_proposals_product_revision_id_fkey"
  FOREIGN KEY ("product_revision_id") REFERENCES "product_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalog_proposals"
  ADD CONSTRAINT "catalog_proposals_mapped_category_id_fkey"
  FOREIGN KEY ("mapped_category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_proposals"
  ADD CONSTRAINT "catalog_proposals_mapped_term_id_fkey"
  FOREIGN KEY ("mapped_term_id") REFERENCES "catalog_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_revision_story_blocks"
  ADD CONSTRAINT "product_revision_story_blocks_revision_id_fkey"
  FOREIGN KEY ("revision_id") REFERENCES "product_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_revision_story_blocks"
  ADD CONSTRAINT "product_revision_story_blocks_media_asset_id_fkey"
  FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_revision_story_assets"
  ADD CONSTRAINT "product_revision_story_assets_revision_id_fkey"
  FOREIGN KEY ("revision_id") REFERENCES "product_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_revision_story_assets"
  ADD CONSTRAINT "product_revision_story_assets_media_asset_id_fkey"
  FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_revision_story_blocks"
  ADD CONSTRAINT "product_revision_story_blocks_shape_check"
  CHECK (
    ("type" = 'IMAGE' AND "media_asset_id" IS NOT NULL AND "text" IS NULL)
    OR ("type" IN ('HEADING', 'PARAGRAPH') AND "media_asset_id" IS NULL AND "text" IS NOT NULL)
  );

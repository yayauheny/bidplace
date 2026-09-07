-- Additive portfolio Work revision storage. Product remains the compatibility
-- persistence name while public data moves to an approved revision pointer.
CREATE TABLE "product_revisions" (
  "id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
  "category_id" UUID,
  "title" VARCHAR(200),
  "story" TEXT,
  "technique" TEXT,
  "materials" TEXT,
  "dimensions" VARCHAR(240),
  "weight" VARCHAR(120),
  "year" INTEGER,
  "condition" VARCHAR(120),
  "uniqueness" VARCHAR(240),
  "provenance" TEXT,
  "city" VARCHAR(160),
  "packaging" TEXT,
  "delivery_info" TEXT,
  "creation_intro" TEXT,
  "submitted_at" TIMESTAMP(3),
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_revisions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "products"
  ADD COLUMN "editing_revision_id" UUID,
  ADD COLUMN "published_revision_id" UUID;

INSERT INTO "product_revisions" (
  "id", "product_id", "version", "status", "category_id", "title", "story",
  "technique", "materials", "dimensions", "weight", "year", "condition",
  "uniqueness", "provenance", "city", "packaging", "delivery_info",
  "creation_intro", "submitted_at", "reviewed_at", "created_at", "updated_at"
)
SELECT
  md5(random()::text || clock_timestamp()::text || p."id"::text)::uuid,
  p."id", 1, p."status", p."category_id", p."title", p."story", p."technique",
  p."materials", p."dimensions", p."weight", p."year", p."condition",
  p."uniqueness", p."provenance", p."city", p."packaging", p."delivery_info",
  p."creation_intro",
  CASE WHEN p."status" = 'PENDING_REVIEW' THEN p."updated_at" ELSE NULL END,
  CASE WHEN p."status" IN ('APPROVED', 'CHANGES_REQUESTED', 'REJECTED', 'ARCHIVED') THEN p."updated_at" ELSE NULL END,
  p."created_at", p."updated_at"
FROM "products" p;

UPDATE "products" p
SET "editing_revision_id" = r."id",
    "published_revision_id" = CASE
      WHEN p."status" IN ('APPROVED', 'ARCHIVED') THEN r."id"
      ELSE NULL
    END
FROM "product_revisions" r
WHERE r."product_id" = p."id" AND r."version" = 1;

CREATE TABLE "product_revision_images" (
  "revision_id" UUID NOT NULL,
  "image_id" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  CONSTRAINT "product_revision_images_pkey" PRIMARY KEY ("revision_id", "image_id")
);

INSERT INTO "product_revision_images" ("revision_id", "image_id", "position")
SELECT r."id", i."id", i."position"
FROM "product_revisions" r
INNER JOIN "product_images" i ON i."product_id" = r."product_id"
WHERE r."version" = 1;

CREATE UNIQUE INDEX "products_editing_revision_id_key" ON "products"("editing_revision_id");
CREATE UNIQUE INDEX "products_published_revision_id_key" ON "products"("published_revision_id");
CREATE UNIQUE INDEX "product_revisions_product_id_version_key" ON "product_revisions"("product_id", "version");
CREATE INDEX "product_revisions_product_id_status_idx" ON "product_revisions"("product_id", "status");
CREATE UNIQUE INDEX "product_revision_images_revision_id_position_key" ON "product_revision_images"("revision_id", "position");
CREATE INDEX "product_revision_images_image_id_idx" ON "product_revision_images"("image_id");

ALTER TABLE "product_revisions"
  ADD CONSTRAINT "product_revisions_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "products"
  ADD CONSTRAINT "products_editing_revision_id_fkey"
  FOREIGN KEY ("editing_revision_id") REFERENCES "product_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "products_published_revision_id_fkey"
  FOREIGN KEY ("published_revision_id") REFERENCES "product_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_revision_images"
  ADD CONSTRAINT "product_revision_images_revision_id_fkey"
  FOREIGN KEY ("revision_id") REFERENCES "product_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "product_revision_images_image_id_fkey"
  FOREIGN KEY ("image_id") REFERENCES "product_images"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

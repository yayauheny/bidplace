ALTER TABLE "categories" ADD COLUMN "normalized_name" VARCHAR(160);
ALTER TABLE "catalog_terms" ADD COLUMN "normalized_name" VARCHAR(160);

UPDATE "categories"
SET "normalized_name" = lower(regexp_replace(btrim("name"), '\s+', ' ', 'g'))
WHERE "normalized_name" IS NULL;

UPDATE "catalog_terms"
SET "normalized_name" = lower(regexp_replace(btrim("name"), '\s+', ' ', 'g'))
WHERE "normalized_name" IS NULL;

ALTER TABLE "categories" ALTER COLUMN "normalized_name" SET NOT NULL;
ALTER TABLE "catalog_terms" ALTER COLUMN "normalized_name" SET NOT NULL;

CREATE UNIQUE INDEX "categories_normalized_name_key" ON "categories"("normalized_name");
CREATE UNIQUE INDEX "catalog_terms_role_normalized_name_key" ON "catalog_terms"("role", "normalized_name");

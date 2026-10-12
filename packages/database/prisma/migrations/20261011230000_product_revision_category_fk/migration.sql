CREATE INDEX "product_revisions_category_id_idx" ON "product_revisions"("category_id");

ALTER TABLE "product_revisions"
  ADD CONSTRAINT "product_revisions_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

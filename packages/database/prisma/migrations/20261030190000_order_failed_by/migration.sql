ALTER TABLE "orders" ADD COLUMN "failed_by" VARCHAR(16);

ALTER TABLE "orders" ADD CONSTRAINT "orders_failed_by_check"
  CHECK ("failed_by" IS NULL OR "failed_by" IN ('buyer', 'seller', 'admin', 'system'));

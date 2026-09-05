-- Freeze Listing deal fields onto new Orders. Historical rows stay nullable
-- and keep reading live Product/Listing until they are replaced by a new Order.

ALTER TABLE "orders"
  ADD COLUMN "snapshot_title" VARCHAR(200),
  ADD COLUMN "snapshot_currency" CHAR(3),
  ADD COLUMN "snapshot_product_public_id" VARCHAR(16);

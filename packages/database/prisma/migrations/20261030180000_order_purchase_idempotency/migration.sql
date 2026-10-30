ALTER TABLE "orders" ADD COLUMN "idempotency_key" VARCHAR(80);

CREATE UNIQUE INDEX "orders_listing_id_buyer_user_id_idempotency_key_key"
ON "orders"("listing_id", "buyer_user_id", "idempotency_key");

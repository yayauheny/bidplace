CREATE INDEX IF NOT EXISTS "auctions_status_starts_at_idx" ON "auctions" ("status", "starts_at");
CREATE INDEX IF NOT EXISTS "auctions_status_ends_at_idx" ON "auctions" ("status", "ends_at");
CREATE INDEX IF NOT EXISTS "bids_auction_id_status_amount_created_at_id_idx" ON "bids" ("auction_id", "status", "amount", "created_at", "id");

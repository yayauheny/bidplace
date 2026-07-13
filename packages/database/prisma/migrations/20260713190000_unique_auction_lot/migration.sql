-- Enforce the domain invariant that one lot can have at most one auction.
CREATE UNIQUE INDEX "auctions_lot_id_key" ON "auctions"("lot_id");

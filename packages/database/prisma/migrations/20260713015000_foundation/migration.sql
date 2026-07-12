-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "SellerType" AS ENUM ('creator', 'influencer');

-- CreateEnum
CREATE TYPE "SellerStatus" AS ENUM ('draft', 'active', 'restricted', 'suspended');

-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('draft', 'published', 'sold', 'hidden', 'archived');

-- CreateEnum
CREATE TYPE "AuctionStatus" AS ENUM ('draft', 'scheduled', 'active', 'ended', 'sold', 'cancelled', 'failed', 'hidden');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('active', 'winning', 'outbid', 'won', 'lost', 'cancelled', 'invalid');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(32) NOT NULL,
    "display_name" VARCHAR(120) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "seller_type" "SellerType" NOT NULL,
    "store_name" VARCHAR(160) NOT NULL,
    "country" VARCHAR(80) NOT NULL,
    "contact_preference" VARCHAR(40) NOT NULL,
    "social_link" VARCHAR(255),
    "short_description" TEXT,
    "status" "SellerStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lots" (
    "id" UUID NOT NULL,
    "seller_profile_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "condition" VARCHAR(120) NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "LotStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auctions" (
    "id" UUID NOT NULL,
    "lot_id" UUID NOT NULL,
    "seller_profile_id" UUID NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "start_price" DECIMAL(12,2) NOT NULL,
    "reserve_price" DECIMAL(12,2) NOT NULL,
    "current_price" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "bid_step" DECIMAL(12,2) NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "status" "AuctionStatus" NOT NULL DEFAULT 'draft',
    "bid_count" INTEGER NOT NULL DEFAULT 0,
    "winner_bid_id" UUID,
    "buy_now_price" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" UUID NOT NULL,
    "auction_id" UUID NOT NULL,
    "bidder_user_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "BidStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "seller_profiles_user_id_key" ON "seller_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "seller_profiles_slug_key" ON "seller_profiles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "auctions_slug_key" ON "auctions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "auctions_winner_bid_id_key" ON "auctions"("winner_bid_id");

-- CreateIndex
CREATE INDEX "auctions_status_ends_at_idx" ON "auctions"("status", "ends_at");

-- CreateIndex
CREATE INDEX "bids_auction_id_created_at_idx" ON "bids"("auction_id", "created_at");

-- AddForeignKey
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lots" ADD CONSTRAINT "lots_seller_profile_id_fkey" FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lots" ADD CONSTRAINT "lots_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_seller_profile_id_fkey" FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_winner_bid_id_fkey" FOREIGN KEY ("winner_bid_id") REFERENCES "bids"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_bidder_user_id_fkey" FOREIGN KEY ("bidder_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "SellerProfileStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'ARCHIVED');
CREATE TYPE "ListingType" AS ENUM ('AUCTION');
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_CONTACT', 'CONTACTED', 'COMPLETED', 'HANDOFF_FAILED', 'CANCELLED');
CREATE TYPE "OrderCancellationReason" AS ENUM ('BUYER_DECLINED', 'BUYER_UNREACHABLE', 'ADMIN_CANCELLED');
CREATE TYPE "HandoffContactType" AS ENUM ('TELEGRAM', 'PHONE', 'INSTAGRAM');
CREATE TYPE "HandoffInitiator" AS ENUM ('BUYER_CONTACTS_SELLER', 'SELLER_CONTACTS_BUYER');
CREATE TYPE "AuditTargetType" AS ENUM ('SELLER_PROFILE', 'PRODUCT', 'ORDER', 'LISTING');

CREATE TABLE "users" (
  "id" UUID NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(32),
  "email_verified_at" TIMESTAMP(3),
  "phone_verified_at" TIMESTAMP(3),
  "display_name" VARCHAR(120) NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'user',
  "status" TEXT NOT NULL DEFAULT 'active',
  "session_version" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "seller_profiles" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "slug" VARCHAR(120) NOT NULL,
  "seller_type" TEXT NOT NULL,
  "full_name" VARCHAR(160) NOT NULL,
  "country" VARCHAR(80) NOT NULL,
  "profile_photo_mime_type" VARCHAR(100) NOT NULL,
  "profile_photo_byte_length" INTEGER NOT NULL,
  "profile_photo_checksum" CHAR(64) NOT NULL,
  "profile_photo_data" BYTEA NOT NULL,
  "social_link" VARCHAR(255) NOT NULL,
  "short_description" TEXT NOT NULL,
  "handoff_contact_type" "HandoffContactType",
  "handoff_contact_value" VARCHAR(255),
  "handoff_initiator" "HandoffInitiator" NOT NULL DEFAULT 'BUYER_CONTACTS_SELLER',
  "status" "SellerProfileStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "seller_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "categories" (
  "id" UUID NOT NULL,
  "slug" VARCHAR(120) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "description" TEXT,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
  "id" UUID NOT NULL,
  "public_id" VARCHAR(16) NOT NULL,
  "seller_profile_id" UUID NOT NULL,
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
  "delivery_info" TEXT,
  "published_at" TIMESTAMP(3),
  "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_images" (
  "id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  "mime_type" VARCHAR(100) NOT NULL,
  "byte_length" INTEGER NOT NULL,
  "data" BYTEA NOT NULL,
  "checksum" CHAR(64) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "listings" (
  "id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "type" "ListingType" NOT NULL DEFAULT 'AUCTION',
  "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
  "currency" CHAR(3) NOT NULL DEFAULT 'BYN',
  "starts_at" TIMESTAMP(3) NOT NULL,
  "original_ends_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3) NOT NULL,
  "current_price" DECIMAL(12,2) NOT NULL,
  "bid_count" INTEGER NOT NULL DEFAULT 0,
  "closed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auction_rules" (
  "listing_id" UUID NOT NULL,
  "start_price" DECIMAL(12,2) NOT NULL,
  "increment_policy_code" VARCHAR(40) NOT NULL DEFAULT 'MVP_BYN_V1',
  "soft_close_window_seconds" INTEGER NOT NULL DEFAULT 60,
  "soft_close_extension_seconds" INTEGER NOT NULL DEFAULT 60,
  "soft_close_max_total_seconds" INTEGER NOT NULL DEFAULT 600,
  CONSTRAINT "auction_rules_pkey" PRIMARY KEY ("listing_id")
);

CREATE TABLE "bids" (
  "id" UUID NOT NULL,
  "listing_id" UUID NOT NULL,
  "bidder_user_id" UUID NOT NULL,
  "idempotency_key" VARCHAR(80) NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
  "id" UUID NOT NULL,
  "public_id" VARCHAR(16) NOT NULL,
  "listing_id" UUID NOT NULL,
  "seller_id" UUID NOT NULL,
  "buyer_id" UUID NOT NULL,
  "source_bid_id" UUID NOT NULL,
  "final_amount" DECIMAL(12,2) NOT NULL,
  "contact_due_at" TIMESTAMP(3) NOT NULL,
  "seller_handoff_type" "HandoffContactType" NOT NULL,
  "seller_handoff_value" VARCHAR(255) NOT NULL,
  "buyer_email_at_close" VARCHAR(255) NOT NULL,
  "handoff_initiator" "HandoffInitiator" NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_CONTACT',
  "cancellation_reason" "OrderCancellationReason",
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "phone_verification_codes" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "code_hash" CHAR(64) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "phone_verification_codes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_verification_codes" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "code_hash" CHAR(64) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_verification_codes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "terms_acceptances" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "rules_version" VARCHAR(40) NOT NULL,
  "accepted_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "terms_acceptances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_events" (
  "id" UUID NOT NULL,
  "actor_user_id" UUID NOT NULL,
  "target_type" "AuditTargetType" NOT NULL,
  "target_id" UUID NOT NULL,
  "old_status" VARCHAR(64),
  "new_status" VARCHAR(64),
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
CREATE UNIQUE INDEX "seller_profiles_user_id_key" ON "seller_profiles"("user_id");
CREATE UNIQUE INDEX "seller_profiles_slug_key" ON "seller_profiles"("slug");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE UNIQUE INDEX "products_public_id_key" ON "products"("public_id");
CREATE INDEX "products_seller_profile_id_status_idx" ON "products"("seller_profile_id", "status");
CREATE INDEX "product_images_product_id_idx" ON "product_images"("product_id");
CREATE UNIQUE INDEX "product_images_product_id_position_key" ON "product_images"("product_id", "position");
CREATE INDEX "listings_status_starts_at_idx" ON "listings"("status", "starts_at");
CREATE INDEX "listings_status_ends_at_idx" ON "listings"("status", "ends_at");
CREATE UNIQUE INDEX "one_active_listing_per_product" ON "listings"("product_id") WHERE "status" IN ('SCHEDULED', 'LIVE');
CREATE UNIQUE INDEX "bids_bidder_user_id_idempotency_key_key" ON "bids"("bidder_user_id", "idempotency_key");
CREATE INDEX "bids_listing_id_amount_created_at_id_idx" ON "bids"("listing_id", "amount", "created_at", "id");
CREATE INDEX "bids_listing_id_created_at_idx" ON "bids"("listing_id", "created_at");
CREATE UNIQUE INDEX "orders_public_id_key" ON "orders"("public_id");
CREATE UNIQUE INDEX "orders_source_bid_id_key" ON "orders"("source_bid_id");
CREATE INDEX "orders_listing_id_idx" ON "orders"("listing_id");
CREATE INDEX "orders_seller_id_status_idx" ON "orders"("seller_id", "status");
CREATE INDEX "orders_buyer_id_status_idx" ON "orders"("buyer_id", "status");
CREATE UNIQUE INDEX "one_active_order_per_listing" ON "orders"("listing_id") WHERE "status" <> 'CANCELLED';
CREATE INDEX "phone_verification_codes_user_id_created_at_idx" ON "phone_verification_codes"("user_id", "created_at");
CREATE INDEX "email_verification_codes_user_id_created_at_idx" ON "email_verification_codes"("user_id", "created_at");
CREATE UNIQUE INDEX "terms_acceptances_user_id_rules_version_key" ON "terms_acceptances"("user_id", "rules_version");
CREATE INDEX "terms_acceptances_user_id_accepted_at_idx" ON "terms_acceptances"("user_id", "accepted_at");
CREATE INDEX "audit_events_target_type_target_id_created_at_idx" ON "audit_events"("target_type", "target_id", "created_at");

ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_seller_profile_id_fkey" FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listings" ADD CONSTRAINT "listings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "auction_rules" ADD CONSTRAINT "auction_rules_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bids" ADD CONSTRAINT "bids_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bids" ADD CONSTRAINT "bids_bidder_user_id_fkey" FOREIGN KEY ("bidder_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_source_bid_id_fkey" FOREIGN KEY ("source_bid_id") REFERENCES "bids"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "phone_verification_codes" ADD CONSTRAINT "phone_verification_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_verification_codes" ADD CONSTRAINT "email_verification_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "terms_acceptances" ADD CONSTRAINT "terms_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

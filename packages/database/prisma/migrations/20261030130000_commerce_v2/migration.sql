-- Commerce V2 replaces the unused sales tables. Production has no sale rows;
-- disposable test databases may drop leftover listing, bid and order rows.

DROP TABLE IF EXISTS "orders";
DROP TABLE IF EXISTS "bids";
DROP TABLE IF EXISTS "auction_rules";
DROP TABLE IF EXISTS "listings";
DROP TABLE IF EXISTS "phone_verification_codes";

ALTER TABLE "seller_profiles"
  DROP COLUMN IF EXISTS "handoff_contact_type",
  DROP COLUMN IF EXISTS "handoff_contact_value",
  DROP COLUMN IF EXISTS "handoff_initiator";

DROP TYPE IF EXISTS "OrderCancellationReason";
DROP TYPE IF EXISTS "OrderStatus";
DROP TYPE IF EXISTS "ListingStatus";
DROP TYPE IF EXISTS "ListingType";
DROP TYPE IF EXISTS "HandoffContactType";
DROP TYPE IF EXISTS "HandoffInitiator";

CREATE TYPE "ListingType" AS ENUM ('FIXED', 'AUCTION');
CREATE TYPE "ListingStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');
CREATE TYPE "ListingCancelReason" AS ENUM ('AUTHOR_WITHDREW', 'ADMIN_REMOVED');
CREATE TYPE "OrderSource" AS ENUM ('AUCTION_WIN', 'SECOND_CHANCE', 'FIXED_PURCHASE');
CREATE TYPE "OrderStatus" AS ENUM ('OFFERED', 'ACTIVE', 'COMPLETED', 'FAILED');
CREATE TYPE "OrderFailReason" AS ENUM (
  'BUYER_REFUSED',
  'BUYER_NO_CONTACT',
  'BUYER_INVALID_CONTACTS',
  'SELLER_REFUSED',
  'OFFER_DECLINED',
  'OFFER_EXPIRED',
  'ADMIN_CANCELLED'
);
CREATE TYPE "FaultSide" AS ENUM ('BUYER', 'SELLER', 'NONE');
CREATE TYPE "CompletedBy" AS ENUM ('SELLER', 'ADMIN');
CREATE TYPE "ReportTarget" AS ENUM ('ORDER', 'WORK', 'AUTHOR', 'USER');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'UPHELD', 'REJECTED');
CREATE TYPE "NotificationOutboxStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

ALTER TYPE "AuditTargetType" ADD VALUE IF NOT EXISTS 'REPORT';

ALTER TABLE "users"
  ADD COLUMN "contact_telegram" VARCHAR(255),
  ADD COLUMN "contact_instagram" VARCHAR(255),
  ADD COLUMN "contact_vk" VARCHAR(255),
  ADD COLUMN "contact_phone" VARCHAR(32);

ALTER TABLE "seller_profiles"
  ADD COLUMN "show_contacts_to_buyer" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "listings" (
  "id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "seller_user_id" UUID NOT NULL,
  "type" "ListingType" NOT NULL,
  "status" "ListingStatus" NOT NULL,
  "currency" CHAR(3) NOT NULL,
  "price_minor" INTEGER,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3),
  "original_ends_at" TIMESTAMP(3),
  "contact_window_hours" INTEGER NOT NULL DEFAULT 24,
  "current_price_minor" INTEGER,
  "bid_count" INTEGER NOT NULL DEFAULT 0,
  "cancel_reason" "ListingCancelReason",
  "ended_at" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "listings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "listings_currency_check" CHECK ("currency" IN ('BYN', 'RUB')),
  CONSTRAINT "listings_contact_window_hours_check" CHECK ("contact_window_hours" IN (1, 6, 24, 48, 72))
);

CREATE TABLE "auction_rules" (
  "listing_id" UUID NOT NULL,
  "start_price_minor" INTEGER NOT NULL,
  "step_table_code" VARCHAR(20) NOT NULL,
  "soft_close_window_seconds" INTEGER NOT NULL DEFAULT 60,
  "soft_close_extension_seconds" INTEGER NOT NULL DEFAULT 60,
  "soft_close_max_total_seconds" INTEGER NOT NULL DEFAULT 600,
  CONSTRAINT "auction_rules_pkey" PRIMARY KEY ("listing_id")
);

CREATE TABLE "bids" (
  "id" UUID NOT NULL,
  "listing_id" UUID NOT NULL,
  "bidder_user_id" UUID NOT NULL,
  "amount_minor" INTEGER NOT NULL,
  "idempotency_key" VARCHAR(100) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "voided_at" TIMESTAMP(3),
  "void_reason" VARCHAR(40),
  CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
  "id" UUID NOT NULL,
  "public_id" VARCHAR(16) NOT NULL,
  "deal_code" CHAR(6) NOT NULL,
  "product_id" UUID NOT NULL,
  "listing_id" UUID NOT NULL,
  "seller_user_id" UUID NOT NULL,
  "buyer_user_id" UUID NOT NULL,
  "source" "OrderSource" NOT NULL,
  "source_bid_id" UUID,
  "amount_minor" INTEGER NOT NULL,
  "currency" CHAR(3) NOT NULL,
  "status" "OrderStatus" NOT NULL,
  "fail_reason" "OrderFailReason",
  "fault_side" "FaultSide",
  "strike_voided_at" TIMESTAMP(3),
  "completed_by" "CompletedBy",
  "offer_expires_at" TIMESTAMP(3),
  "activated_at" TIMESTAMP(3),
  "contact_deadline_at" TIMESTAMP(3),
  "seller_reminders_sent" INTEGER NOT NULL DEFAULT 0,
  "completed_at" TIMESTAMP(3),
  "failed_at" TIMESTAMP(3),
  "buyer_comment" VARCHAR(500),
  "seller_note" VARCHAR(1000),
  "work_title_snapshot" VARCHAR(200) NOT NULL,
  "work_public_id_snapshot" VARCHAR(16) NOT NULL,
  "cover_image_id_snapshot" UUID,
  "seller_name_snapshot" VARCHAR(160) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "orders_currency_check" CHECK ("currency" IN ('BYN', 'RUB')),
  CONSTRAINT "orders_seller_reminders_sent_check" CHECK ("seller_reminders_sent" BETWEEN 0 AND 2)
);

CREATE TABLE "reports" (
  "id" UUID NOT NULL,
  "target_type" "ReportTarget" NOT NULL,
  "target_id" UUID NOT NULL,
  "reporter_user_id" UUID NOT NULL,
  "reason" VARCHAR(40) NOT NULL,
  "text" VARCHAR(1000),
  "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
  "fault_side" "FaultSide",
  "admin_note" VARCHAR(2000),
  "resolved_at" TIMESTAMP(3),
  "resolved_by_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_notification_settings" (
  "user_id" UUID NOT NULL,
  "outbid_email" BOOLEAN NOT NULL DEFAULT true,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_notification_settings_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "notification_outbox" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "kind" VARCHAR(40) NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "NotificationOutboxStatus" NOT NULL DEFAULT 'PENDING',
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "next_attempt_at" TIMESTAMP(3) NOT NULL,
  "sent_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_outbox_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "favorite_works" (
  "user_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "favorite_works_pkey" PRIMARY KEY ("user_id", "product_id")
);

CREATE INDEX "listings_status_starts_at_idx" ON "listings"("status", "starts_at");
CREATE INDEX "listings_status_ends_at_idx" ON "listings"("status", "ends_at");
CREATE INDEX "listings_product_id_idx" ON "listings"("product_id");
CREATE UNIQUE INDEX "one_active_listing_per_product" ON "listings"("product_id") WHERE "status" IN ('SCHEDULED', 'LIVE');

CREATE UNIQUE INDEX "bids_listing_id_bidder_user_id_idempotency_key_key" ON "bids"("listing_id", "bidder_user_id", "idempotency_key");
CREATE INDEX "bids_listing_id_amount_minor_idx" ON "bids"("listing_id", "amount_minor");

CREATE UNIQUE INDEX "orders_public_id_key" ON "orders"("public_id");
CREATE UNIQUE INDEX "orders_source_bid_id_key" ON "orders"("source_bid_id");
CREATE INDEX "orders_buyer_user_id_status_idx" ON "orders"("buyer_user_id", "status");
CREATE INDEX "orders_seller_user_id_status_idx" ON "orders"("seller_user_id", "status");
CREATE INDEX "orders_status_activated_at_idx" ON "orders"("status", "activated_at");
CREATE INDEX "orders_status_offer_expires_at_idx" ON "orders"("status", "offer_expires_at");
CREATE UNIQUE INDEX "one_open_order_per_product" ON "orders"("product_id") WHERE "status" IN ('OFFERED', 'ACTIVE');
CREATE UNIQUE INDEX "one_completed_order_per_product" ON "orders"("product_id") WHERE "status" = 'COMPLETED';

CREATE INDEX "reports_status_created_at_idx" ON "reports"("status", "created_at");
CREATE INDEX "reports_target_type_target_id_idx" ON "reports"("target_type", "target_id");
CREATE UNIQUE INDEX "one_open_report_per_reporter" ON "reports"("reporter_user_id", "target_type", "target_id") WHERE "status" = 'OPEN';

CREATE INDEX "notification_outbox_status_next_attempt_at_idx" ON "notification_outbox"("status", "next_attempt_at");
CREATE INDEX "favorite_works_product_id_idx" ON "favorite_works"("product_id");

ALTER TABLE "listings" ADD CONSTRAINT "listings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "listings" ADD CONSTRAINT "listings_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "auction_rules" ADD CONSTRAINT "auction_rules_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bids" ADD CONSTRAINT "bids_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bids" ADD CONSTRAINT "bids_bidder_user_id_fkey" FOREIGN KEY ("bidder_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_user_id_fkey" FOREIGN KEY ("buyer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_source_bid_id_fkey" FOREIGN KEY ("source_bid_id") REFERENCES "bids"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_notification_settings" ADD CONSTRAINT "user_notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "favorite_works" ADD CONSTRAINT "favorite_works_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "favorite_works" ADD CONSTRAINT "favorite_works_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

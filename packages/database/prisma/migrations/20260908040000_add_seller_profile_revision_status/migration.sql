CREATE TYPE "SellerProfileRevisionStatus" AS ENUM (
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'CHANGES_REQUESTED',
  'REJECTED'
);

ALTER TABLE "seller_profile_revisions"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "SellerProfileRevisionStatus"
  USING (
    CASE "status"::text
      WHEN 'SUSPENDED' THEN 'REJECTED'::"SellerProfileRevisionStatus"
      ELSE "status"::text::"SellerProfileRevisionStatus"
    END
  ),
  ALTER COLUMN "status" SET DEFAULT 'DRAFT';

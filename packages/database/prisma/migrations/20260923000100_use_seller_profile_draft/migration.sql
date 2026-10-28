ALTER TABLE "seller_profiles"
  ALTER COLUMN "status" SET DEFAULT 'DRAFT',
  ALTER COLUMN "handoff_initiator" DROP DEFAULT,
  ALTER COLUMN "handoff_initiator" DROP NOT NULL;

CREATE TYPE "UserStatus" AS ENUM ('active', 'banned');

ALTER TABLE "users"
ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'active';

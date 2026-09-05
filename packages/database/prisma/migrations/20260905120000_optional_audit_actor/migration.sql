-- Allow scheduler system actions to record Listing audit without a user actor.

ALTER TABLE "audit_events" ALTER COLUMN "actor_user_id" DROP NOT NULL;

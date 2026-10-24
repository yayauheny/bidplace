ALTER TABLE "seller_profiles" ADD COLUMN "first_published_at" TIMESTAMP(3);
ALTER TABLE "analytics_events"
  ADD COLUMN "collection_version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "event_id" UUID,
  ADD COLUMN "session_id" UUID;
CREATE UNIQUE INDEX "analytics_events_environment_event_id_key" ON "analytics_events"("environment", "event_id");
ALTER TABLE "acquisition_attributions"
  ADD COLUMN "collection_version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "environment" VARCHAR(32),
  ADD COLUMN "session_id" UUID,
  ADD COLUMN "last_event_at" TIMESTAMP(3),
  ADD COLUMN "registered_user_id" UUID;
CREATE UNIQUE INDEX "acquisition_attributions_registered_user_id_key" ON "acquisition_attributions"("registered_user_id");
ALTER TABLE "acquisition_attributions" ADD CONSTRAINT "acquisition_attributions_registered_user_id_fkey"
  FOREIGN KEY ("registered_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

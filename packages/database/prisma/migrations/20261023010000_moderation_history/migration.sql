ALTER TABLE "audit_events"
  ADD COLUMN "action" VARCHAR(40),
  ADD COLUMN "revision_id" UUID,
  ADD COLUMN "media_operation_id" UUID,
  ADD COLUMN "operation_generation" INTEGER,
  ADD COLUMN "event_key" VARCHAR(255);
CREATE UNIQUE INDEX "audit_events_event_key_key" ON "audit_events"("event_key");
ALTER TABLE "media_operations" ADD COLUMN "generation" INTEGER NOT NULL DEFAULT 0;

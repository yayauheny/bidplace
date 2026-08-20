-- AlterTable
CREATE TABLE "analytics_events" (
    "id" UUID NOT NULL,
    "event_name" VARCHAR(64) NOT NULL,
    "anonymous_id" UUID NOT NULL,
    "user_id" UUID,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "platform" VARCHAR(32),
    "app_version" VARCHAR(32),
    "environment" VARCHAR(32) NOT NULL,
    "client_captured_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- AlterTable
CREATE TABLE "acquisition_attributions" (
    "id" UUID NOT NULL,
    "anonymous_id" UUID NOT NULL,
    "user_id" UUID,
    "source" VARCHAR(120),
    "medium" VARCHAR(120),
    "campaign" VARCHAR(120),
    "content" VARCHAR(120),
    "referrer" VARCHAR(512),
    "landing_path" VARCHAR(512),
    "captured_at" TIMESTAMP(3) NOT NULL,
    "linked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acquisition_attributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_events_event_name_created_at_idx" ON "analytics_events"("event_name", "created_at");

-- CreateIndex
CREATE INDEX "analytics_events_anonymous_id_created_at_idx" ON "analytics_events"("anonymous_id", "created_at");

-- CreateIndex
CREATE INDEX "analytics_events_user_id_created_at_idx" ON "analytics_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "acquisition_attributions_anonymous_id_key" ON "acquisition_attributions"("anonymous_id");

-- CreateIndex
CREATE UNIQUE INDEX "acquisition_attributions_user_id_key" ON "acquisition_attributions"("user_id");

-- CreateIndex
CREATE INDEX "acquisition_attributions_source_captured_at_idx" ON "acquisition_attributions"("source", "captured_at");

-- CreateIndex
CREATE INDEX "acquisition_attributions_captured_at_idx" ON "acquisition_attributions"("captured_at");

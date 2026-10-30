CREATE TABLE "rate_limit_counters" ("key" VARCHAR(200) PRIMARY KEY, "window_start" TIMESTAMPTZ(3) NOT NULL, "expires_at" TIMESTAMPTZ(3) NOT NULL, "count" INTEGER NOT NULL);
CREATE INDEX "rate_limit_counters_window_start_idx" ON "rate_limit_counters"("window_start");

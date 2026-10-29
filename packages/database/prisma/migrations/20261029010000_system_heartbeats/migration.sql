CREATE TABLE "system_heartbeats" (
    "name" TEXT NOT NULL,
    "at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "system_heartbeats_pkey" PRIMARY KEY ("name")
);

CREATE TABLE "auth_sessions" (
  "sid" VARCHAR(255) PRIMARY KEY,
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL
);
CREATE INDEX "auth_sessions_expire_idx" ON "auth_sessions" ("expire");

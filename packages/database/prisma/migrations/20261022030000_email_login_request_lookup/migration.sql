CREATE INDEX "auth_abuse_operations_purpose_content_hash_created_at_idx"
ON "auth_abuse_operations"("purpose", "content_hash", "created_at");

CREATE TYPE "FraudSignalKind" AS ENUM ('TURNSTILE_FAILED', 'BID_BURST', 'SHARED_BROWSER_WITH_SELLER', 'NEW_ACCOUNT_BURST');
CREATE TABLE fraud_signals (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  kind "FraudSignalKind" NOT NULL,
  subject_id UUID,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX fraud_signals_user_id_created_at_idx ON fraud_signals(user_id, created_at);
CREATE TABLE purchase_holds (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  reason VARCHAR(64) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  released_at TIMESTAMP(3),
  released_by_id UUID REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  note TEXT
);
CREATE INDEX purchase_holds_user_id_created_at_idx ON purchase_holds(user_id, created_at);
CREATE UNIQUE INDEX purchase_holds_one_active_user ON purchase_holds(user_id) WHERE released_at IS NULL;

process.env.DATABASE_URL ??=
  'postgresql://test:test@127.0.0.1:5432/bidplace_test';
process.env.SESSION_SECRET ??= 'test-only-jwt-secret';

process.env.OTP_HASH_SECRET ??= 'synthetic-otp-hash-key-for-tests-only';

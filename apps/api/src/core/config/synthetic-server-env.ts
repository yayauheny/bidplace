import { parseServerEnv, type ServerEnv } from './env';

export function syntheticServerEnv(
  overrides: NodeJS.ProcessEnv = {},
): ServerEnv {
  return parseServerEnv({
    NODE_ENV: 'test',
    APP_ENV: 'local',
    DATABASE_URL: 'postgresql://synthetic:synthetic@127.0.0.1:5432/synthetic',
    SESSION_SECRET: 'synthetic-test-secret',
    OTP_HASH_SECRET: 'synthetic-otp-hash-key-for-tests-only',
    PASSWORD_RESET_URL_BASE: 'http://localhost:8081',
    ...overrides,
  });
}

export function syntheticProductionServerEnv(
  overrides: NodeJS.ProcessEnv = {},
): ServerEnv {
  return syntheticServerEnv({
    NODE_ENV: 'production',
    APP_ENV: 'production',
    SESSION_SECRET: 'synthetic-production-jwt-secret-32',
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: '465',
    SMTP_SECURE: 'true',
    SMTP_AUTH_MODE: 'none',
    SMTP_FROM: 'no-reply@example.com',
    PASSWORD_RESET_URL_BASE: 'http://localhost:8081',
    SERVICE_RULES_OWNER: 'Bidplace',
    SERVICE_RULES_CONTACT: 'support@example.com',
    SERVICE_RULES_TEXT: 'Rules text',
    TEST_EMAIL_BYPASS: 'false',
    MEDIA_STORAGE_PROVIDER: 's3',
    S3_ENDPOINT: 'http://127.0.0.1:9000',
    S3_REGION: 'us-east-1',
    S3_BUCKET: 'synthetic-media',
    S3_PUBLIC_BUCKET: 'synthetic-public-media',
    MEDIA_PUBLIC_BASE_URL: 'https://media.example.com',
    CLOUDFLARE_ZONE_ID: 'a'.repeat(32),
    TURNSTILE_SECRET_KEY: 'synthetic-turnstile-secret',
    TURNSTILE_HOSTNAME: 'localhost',
    CLOUDFLARE_CACHE_TOKEN: 'synthetic-cache-token',
    S3_ACCESS_KEY_ID: 'synthetic-access-key',
    S3_SECRET_ACCESS_KEY: 'synthetic-secret-key',
    ...overrides,
  });
}

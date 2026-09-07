import { afterEach, describe, expect, it, vi } from 'vitest';

import { LocalMailTransport } from './local-mail-transport';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('LocalMailTransport', () => {
  it('refuses to send on the production profile', async () => {
    vi.stubEnv('BIDPLACE_ENV_FILE', '/repo/missing.env');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_ENV', 'production');
    vi.stubEnv(
      'DATABASE_URL',
      'postgres://user:pass@localhost:5432/bidplace',
    );
    vi.stubEnv('JWT_SECRET', 'test-only-production-jwt-secret-32');
    vi.stubEnv('SMTP_HOST', 'smtp.example.com');
    vi.stubEnv('SMTP_PORT', '465');
    vi.stubEnv('SMTP_SECURE', 'true');
    vi.stubEnv('SMTP_AUTH_MODE', 'none');
    vi.stubEnv('SMTP_FROM', 'no-reply@example.com');
    vi.stubEnv('PASSWORD_RESET_URL_BASE', 'http://localhost:8081');
    vi.stubEnv('SERVICE_RULES_OWNER', 'Bidplace');
    vi.stubEnv('SERVICE_RULES_CONTACT', 'support@example.com');
    vi.stubEnv('SERVICE_RULES_TEXT', 'Rules text');
    vi.stubEnv('TEST_EMAIL_BYPASS', 'false');
    vi.stubEnv('MEDIA_STORAGE_PROVIDER', 's3');
    vi.stubEnv('S3_ENDPOINT', 'http://minio.local');
    vi.stubEnv('S3_REGION', 'us-east-1');
    vi.stubEnv('S3_BUCKET', 'bidplace-media');
    vi.stubEnv('S3_ACCESS_KEY_ID', 'test-access-key');
    vi.stubEnv('S3_SECRET_ACCESS_KEY', 'test-secret-key');

    const transport = new LocalMailTransport();

    await expect(
      transport.send({
        to: 'user@example.com',
        subject: 'test',
        text: 'test',
      }),
    ).rejects.toThrow('Local mail transport cannot run in production');
  });
});

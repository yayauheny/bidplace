import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadServerEnv, resolveServerEnvFilePath } from './env';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('resolveServerEnvFilePath', () => {
  it('prefers BIDPLACE_ENV_FILE override', () => {
    expect(
      resolveServerEnvFilePath({
        envOverride: '/tmp/bidplace.env',
      }),
    ).toBe('/tmp/bidplace.env');
  });

  it('finds the repository env file from a src directory', () => {
    const envPath = '/repo/.env';

    expect(
      resolveServerEnvFilePath({
        moduleDir: '/repo/apps/api/src/core/config',
        fileExists: (filePath) => filePath === envPath,
      }),
    ).toBe(envPath);
  });

  it('finds the repository env file from a dist directory', () => {
    const envPath = '/repo/.env';

    expect(
      resolveServerEnvFilePath({
        moduleDir: '/repo/apps/api/dist/core/config',
        fileExists: (filePath) => filePath === envPath,
      }),
    ).toBe(envPath);
  });

  it('requires production SMTP and rules configuration', () => {
    vi.stubEnv('BIDPLACE_ENV_FILE', '/repo/missing.env');

    expect(() =>
      loadServerEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/bidplace',
        JWT_SECRET: 'secret',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '465',
        SMTP_SECURE: 'true',
        SMTP_FROM: 'no-reply@example.com',
        SERVICE_RULES_OWNER: 'Bidplace',
        SERVICE_RULES_CONTACT: 'support@example.com',
        SERVICE_RULES_TEXT: 'Rules text',
        TEST_EMAIL_BYPASS: 'false',
      }),
    ).not.toThrow();
  });

  it('rejects production builds without required SMTP config', () => {
    vi.stubEnv('BIDPLACE_ENV_FILE', '/repo/missing.env');

    expect(() =>
      loadServerEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/bidplace',
        JWT_SECRET: 'secret',
        SMTP_PORT: '465',
        SMTP_SECURE: 'true',
        SMTP_FROM: 'no-reply@example.com',
        SERVICE_RULES_OWNER: 'Bidplace',
        SERVICE_RULES_CONTACT: 'support@example.com',
        SERVICE_RULES_TEXT: 'Rules text',
        TEST_EMAIL_BYPASS: 'false',
      }),
    ).toThrow(/SMTP_HOST/);
  });
});

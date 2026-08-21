import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  loadServerEnv,
  resolveCorsOrigin,
  resolveServerEnvFilePath,
} from './env';

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
        SMTP_AUTH_MODE: 'none',
        SMTP_FROM: 'no-reply@example.com',
        PASSWORD_RESET_URL_BASE: 'http://localhost:8081',
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

  it('requires an explicit SMTP auth mode in production', () => {
    vi.stubEnv('BIDPLACE_ENV_FILE', '/repo/missing.env');

    expect(() =>
      loadServerEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/bidplace',
        JWT_SECRET: 'secret',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_SECURE: 'false',
        SMTP_FROM: 'no-reply@example.com',
        SERVICE_RULES_OWNER: 'Bidplace',
        SERVICE_RULES_CONTACT: 'support@example.com',
        SERVICE_RULES_TEXT: 'Rules text',
        TEST_EMAIL_BYPASS: 'false',
      }),
    ).toThrow(/SMTP_AUTH_MODE/);
  });

  it('rejects partially configured SMTP credentials', () => {
    vi.stubEnv('BIDPLACE_ENV_FILE', '/repo/missing.env');

    expect(() =>
      loadServerEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/bidplace',
        JWT_SECRET: 'secret',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_SECURE: 'false',
        SMTP_AUTH_MODE: 'login',
        SMTP_USERNAME: 'user',
        SMTP_FROM: 'no-reply@example.com',
        SERVICE_RULES_OWNER: 'Bidplace',
        SERVICE_RULES_CONTACT: 'support@example.com',
        SERVICE_RULES_TEXT: 'Rules text',
        TEST_EMAIL_BYPASS: 'false',
      }),
    ).toThrow(/SMTP_USERNAME and SMTP_PASSWORD/);
  });

  it('accepts empty local relay credentials as unauthenticated SMTP config', () => {
    vi.stubEnv('BIDPLACE_ENV_FILE', '/repo/missing.env');

    expect(() =>
      loadServerEnv({
        NODE_ENV: 'development',
        APP_ENV: 'local',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/bidplace',
        JWT_SECRET: 'secret',
        SMTP_HOST: 'mailpit',
        SMTP_PORT: '1025',
        SMTP_SECURE: 'false',
        SMTP_USERNAME: '',
        SMTP_PASSWORD: '',
      }),
    ).not.toThrow();
  });
});

describe('resolveCorsOrigin', () => {
  it('uses localhost only for local development without explicit CORS', () => {
    expect(
      resolveCorsOrigin({
        NODE_ENV: 'development',
        APP_ENV: 'local',
        CORS_ORIGIN: undefined,
      }),
    ).toBe('http://localhost:8081');
  });

  it('does not enable the localhost fallback in production', () => {
    expect(
      resolveCorsOrigin({
        NODE_ENV: 'production',
        APP_ENV: 'local',
        CORS_ORIGIN: undefined,
      }),
    ).toBeUndefined();
  });
});

describe('ANALYTICS_INGEST_ENABLED', () => {
  it('defaults to false in test and true otherwise', () => {
    vi.stubEnv('BIDPLACE_ENV_FILE', '/repo/missing.env');

    expect(
      loadServerEnv({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/bidplace',
        JWT_SECRET: 'secret',
      }).ANALYTICS_INGEST_ENABLED,
    ).toBe(false);

    expect(
      loadServerEnv({
        NODE_ENV: 'development',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/bidplace',
        JWT_SECRET: 'secret',
      }).ANALYTICS_INGEST_ENABLED,
    ).toBe(true);
  });

  it('honors an explicit false outside test', () => {
    vi.stubEnv('BIDPLACE_ENV_FILE', '/repo/missing.env');

    expect(
      loadServerEnv({
        NODE_ENV: 'development',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/bidplace',
        JWT_SECRET: 'secret',
        ANALYTICS_INGEST_ENABLED: 'false',
      }).ANALYTICS_INGEST_ENABLED,
    ).toBe(false);
  });
});

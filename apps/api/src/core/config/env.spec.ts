import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  loadServerEnv,
  resolveCorsOrigin,
  resolveServerEnvFilePath,
} from './env';
import { ENV_PROFILE_ERROR } from './env-profile';

afterEach(() => {
  vi.unstubAllEnvs();
});

const DATABASE_URL = 'postgres://user:pass@localhost:5432/bidplace';
const LOCAL_JWT_SECRET = 'secret';
const PRODUCTION_JWT_SECRET = 'test-only-production-jwt-secret-32';

const localEnv = {
  DATABASE_URL,
  JWT_SECRET: LOCAL_JWT_SECRET,
} as const;

const productionSecurityEnv = {
  DATABASE_URL,
  JWT_SECRET: PRODUCTION_JWT_SECRET,
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
} as const;

function stubMissingEnvFile(): void {
  vi.stubEnv('BIDPLACE_ENV_FILE', '/repo/missing.env');
}

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
});

describe('NODE_ENV × APP_ENV matrix', () => {
  it.each([
    { NODE_ENV: 'development', APP_ENV: 'local' },
    { NODE_ENV: 'test', APP_ENV: 'local' },
    { NODE_ENV: 'development', APP_ENV: 'staging' },
    { NODE_ENV: 'test', APP_ENV: 'staging' },
  ] as const)(
    'accepts $NODE_ENV/$APP_ENV without production SMTP or rules',
    ({ NODE_ENV, APP_ENV }) => {
      stubMissingEnvFile();

      expect(() =>
        loadServerEnv({
          ...localEnv,
          NODE_ENV,
          APP_ENV,
        }),
      ).not.toThrow();
    },
  );

  it.each([
    { NODE_ENV: 'production', APP_ENV: 'production' },
    { NODE_ENV: 'production', APP_ENV: 'staging' },
  ] as const)(
    'accepts $NODE_ENV/$APP_ENV when production security config is present',
    ({ NODE_ENV, APP_ENV }) => {
      stubMissingEnvFile();

      expect(() =>
        loadServerEnv({
          ...productionSecurityEnv,
          NODE_ENV,
          APP_ENV,
        }),
      ).not.toThrow();
    },
  );

  it.each([
    {
      NODE_ENV: 'development',
      APP_ENV: 'production',
      message: ENV_PROFILE_ERROR.productionAppRequiresProductionNode,
    },
    {
      NODE_ENV: 'test',
      APP_ENV: 'production',
      message: ENV_PROFILE_ERROR.productionAppRequiresProductionNode,
    },
    {
      NODE_ENV: 'production',
      APP_ENV: 'local',
      message: ENV_PROFILE_ERROR.productionNodeForbidsLocalApp,
    },
  ] as const)(
    'rejects $NODE_ENV/$APP_ENV with a field-specific combination error',
    ({ NODE_ENV, APP_ENV, message }) => {
      stubMissingEnvFile();

      expect(() =>
        loadServerEnv({
          ...productionSecurityEnv,
          NODE_ENV,
          APP_ENV,
        }),
      ).toThrow(message);
    },
  );

  it('rejects NODE_ENV=production when APP_ENV defaults to local', () => {
    stubMissingEnvFile();

    expect(() =>
      loadServerEnv({
        ...productionSecurityEnv,
        NODE_ENV: 'production',
      }),
    ).toThrow(ENV_PROFILE_ERROR.productionNodeForbidsLocalApp);
  });

  it('requires production SMTP and rules configuration', () => {
    stubMissingEnvFile();

    expect(() =>
      loadServerEnv({
        ...productionSecurityEnv,
        NODE_ENV: 'production',
        APP_ENV: 'production',
      }),
    ).not.toThrow();
  });

  it('rejects production builds without required SMTP config', () => {
    stubMissingEnvFile();

    expect(() =>
      loadServerEnv({
        NODE_ENV: 'production',
        APP_ENV: 'production',
        DATABASE_URL,
        JWT_SECRET: PRODUCTION_JWT_SECRET,
        SMTP_PORT: '465',
        SMTP_SECURE: 'true',
        SMTP_FROM: 'no-reply@example.com',
        PASSWORD_RESET_URL_BASE: 'http://localhost:8081',
        SERVICE_RULES_OWNER: 'Bidplace',
        SERVICE_RULES_CONTACT: 'support@example.com',
        SERVICE_RULES_TEXT: 'Rules text',
        TEST_EMAIL_BYPASS: 'false',
      }),
    ).toThrow(/SMTP_HOST/);
  });

  it('requires an explicit SMTP auth mode in production', () => {
    stubMissingEnvFile();

    expect(() =>
      loadServerEnv({
        NODE_ENV: 'production',
        APP_ENV: 'production',
        DATABASE_URL,
        JWT_SECRET: PRODUCTION_JWT_SECRET,
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_SECURE: 'false',
        SMTP_FROM: 'no-reply@example.com',
        PASSWORD_RESET_URL_BASE: 'http://localhost:8081',
        SERVICE_RULES_OWNER: 'Bidplace',
        SERVICE_RULES_CONTACT: 'support@example.com',
        SERVICE_RULES_TEXT: 'Rules text',
        TEST_EMAIL_BYPASS: 'false',
      }),
    ).toThrow(/SMTP_AUTH_MODE/);
  });

  it('rejects a short production JWT secret without printing it', () => {
    stubMissingEnvFile();

    const shortSecret = 'short-secret';

    expect(() =>
      loadServerEnv({
        ...productionSecurityEnv,
        NODE_ENV: 'production',
        APP_ENV: 'production',
        JWT_SECRET: shortSecret,
      }),
    ).toThrow(ENV_PROFILE_ERROR.jwtSecretTooShortInProduction);

    try {
      loadServerEnv({
        ...productionSecurityEnv,
        NODE_ENV: 'production',
        APP_ENV: 'production',
        JWT_SECRET: shortSecret,
      });
    } catch (error) {
      expect(String(error)).not.toContain(shortSecret);
    }
  });

  it('rejects TEST_EMAIL_BYPASS on the production profile', () => {
    stubMissingEnvFile();

    expect(() =>
      loadServerEnv({
        ...productionSecurityEnv,
        NODE_ENV: 'production',
        APP_ENV: 'production',
        TEST_EMAIL_BYPASS: 'true',
      }),
    ).toThrow(ENV_PROFILE_ERROR.testEmailBypassForbiddenInProduction);
  });

  it.each([
    { NODE_ENV: 'development', APP_ENV: 'local' },
    { NODE_ENV: 'test', APP_ENV: 'staging' },
    { NODE_ENV: 'development', APP_ENV: 'staging' },
  ] as const)(
    'rejects TEST_EMAIL_BYPASS for $NODE_ENV/$APP_ENV',
    ({ NODE_ENV, APP_ENV }) => {
      stubMissingEnvFile();

      expect(() =>
        loadServerEnv({
          ...localEnv,
          NODE_ENV,
          APP_ENV,
          TEST_EMAIL_BYPASS: 'true',
        }),
      ).toThrow(ENV_PROFILE_ERROR.testEmailBypassRequiresLocalTest);
    },
  );

  it('allows TEST_EMAIL_BYPASS only for NODE_ENV=test and APP_ENV=local', () => {
    stubMissingEnvFile();

    expect(
      loadServerEnv({
        ...localEnv,
        NODE_ENV: 'test',
        APP_ENV: 'local',
        TEST_EMAIL_BYPASS: 'true',
      }).TEST_EMAIL_BYPASS,
    ).toBe(true);
  });

  it('rejects partially configured SMTP credentials', () => {
    stubMissingEnvFile();

    expect(() =>
      loadServerEnv({
        ...productionSecurityEnv,
        NODE_ENV: 'production',
        APP_ENV: 'production',
        SMTP_PORT: '587',
        SMTP_SECURE: 'false',
        SMTP_AUTH_MODE: 'login',
        SMTP_USERNAME: 'user',
      }),
    ).toThrow(/SMTP_USERNAME and SMTP_PASSWORD/);
  });

  it('accepts empty local relay credentials as unauthenticated SMTP config', () => {
    stubMissingEnvFile();

    expect(() =>
      loadServerEnv({
        NODE_ENV: 'development',
        APP_ENV: 'local',
        DATABASE_URL,
        JWT_SECRET: LOCAL_JWT_SECRET,
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
        APP_ENV: 'production',
        CORS_ORIGIN: undefined,
      }),
    ).toBeUndefined();
  });

  it('does not enable the localhost fallback for staging', () => {
    expect(
      resolveCorsOrigin({
        NODE_ENV: 'development',
        APP_ENV: 'staging',
        CORS_ORIGIN: undefined,
      }),
    ).toBeUndefined();
  });
});

describe('ANALYTICS_INGEST_ENABLED', () => {
  it('defaults to false in test and true otherwise', () => {
    stubMissingEnvFile();

    expect(
      loadServerEnv({
        ...localEnv,
        NODE_ENV: 'test',
        APP_ENV: 'local',
      }).ANALYTICS_INGEST_ENABLED,
    ).toBe(false);

    expect(
      loadServerEnv({
        ...localEnv,
        NODE_ENV: 'development',
        APP_ENV: 'local',
      }).ANALYTICS_INGEST_ENABLED,
    ).toBe(true);
  });

  it('honors an explicit false outside test', () => {
    stubMissingEnvFile();

    expect(
      loadServerEnv({
        ...localEnv,
        NODE_ENV: 'development',
        APP_ENV: 'local',
        ANALYTICS_INGEST_ENABLED: 'false',
      }).ANALYTICS_INGEST_ENABLED,
    ).toBe(false);
  });
});

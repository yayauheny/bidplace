import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  loadServerEnv,
  resolveCorsOrigin,
  resolveServerEnvFilePath,
} from './env';
import { ENV_PROFILE_ERROR, requiresProductionSecurity } from './env-profile';

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
  MEDIA_STORAGE_PROVIDER: 's3',
  S3_ENDPOINT: 'http://minio.local',
  S3_REGION: 'us-east-1',
  S3_BUCKET: 'bidplace-media',
  S3_ACCESS_KEY_ID: 'test-access-key',
  S3_SECRET_ACCESS_KEY: 'test-secret-key',
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
  it('defaults media storage to the legacy provider outside production', () => {
    stubMissingEnvFile();

    expect(loadServerEnv(localEnv).MEDIA_STORAGE_PROVIDER).toBe('postgres');
  });

  it('requires complete S3 configuration when the S3 provider is selected', () => {
    stubMissingEnvFile();

    expect(() =>
      loadServerEnv({ ...localEnv, MEDIA_STORAGE_PROVIDER: 's3' }),
    ).toThrow('S3_ENDPOINT is required when MEDIA_STORAGE_PROVIDER=s3');
  });

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

  it('rejects the PostgreSQL binary store in production', () => {
    stubMissingEnvFile();

    expect(() =>
      loadServerEnv({
        ...productionSecurityEnv,
        NODE_ENV: 'production',
        APP_ENV: 'production',
        MEDIA_STORAGE_PROVIDER: 'postgres',
      }),
    ).toThrow('MEDIA_STORAGE_PROVIDER=s3 is required in production');
  });

  it('fails closed when production S3 configuration is incomplete', () => {
    stubMissingEnvFile();

    expect(() =>
      loadServerEnv({
        ...productionSecurityEnv,
        NODE_ENV: 'production',
        APP_ENV: 'production',
        S3_SECRET_ACCESS_KEY: '',
      }),
    ).toThrow('S3_SECRET_ACCESS_KEY is required when MEDIA_STORAGE_PROVIDER=s3');
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

const syntheticDirectories: string[] = [];

afterEach(() => {
  for (const directory of syntheticDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function writeSyntheticServerEnv(contents: string): string {
  const directory = mkdtempSync(join(tmpdir(), 'bidplace-server-env-'));
  syntheticDirectories.push(directory);
  const filePath = join(directory, 'synthetic.env');
  writeFileSync(filePath, contents);
  return filePath;
}

function loadSyntheticServerEnv(
  contents: string,
  env: NodeJS.ProcessEnv = {},
): ReturnType<typeof loadServerEnv> {
  const before = new Set(Object.keys(process.env));
  vi.stubEnv('BIDPLACE_ENV_FILE', writeSyntheticServerEnv(contents));

  try {
    return loadServerEnv(env);
  } finally {
    for (const key of Object.keys(process.env)) {
      if (!before.has(key)) {
        delete process.env[key];
      }
    }
  }
}

const syntheticDatabaseUrl =
  'postgresql://synthetic:synthetic@127.0.0.1:5432/synthetic';
const shortJwtSecret = 'synthetic-short-jwt';

const productionProfileLines = [
  'NODE_ENV=production',
  'APP_ENV=production',
  `DATABASE_URL=${syntheticDatabaseUrl}`,
  'JWT_SECRET=synthetic-production-jwt-secret-32',
  'SMTP_HOST=smtp.example.com',
  'SMTP_PORT=465',
  'SMTP_SECURE=true',
  'SMTP_AUTH_MODE=none',
  'SMTP_FROM=no-reply@example.com',
  'PASSWORD_RESET_URL_BASE=http://localhost:8081',
  'SERVICE_RULES_OWNER=Bidplace',
  'SERVICE_RULES_CONTACT=support@example.com',
  'SERVICE_RULES_TEXT=Rules text',
  'TEST_EMAIL_BYPASS=false',
  'MEDIA_STORAGE_PROVIDER=s3',
  'S3_ENDPOINT=http://127.0.0.1:9000',
  'S3_REGION=us-east-1',
  'S3_BUCKET=synthetic-media',
  'S3_ACCESS_KEY_ID=synthetic-access-key',
  'S3_SECRET_ACCESS_KEY=synthetic-secret-key',
];

describe('leading env-file BOM', () => {
  it('rejects production NODE_ENV when APP_ENV is absent', () => {
    const contents = [
      'NODE_ENV=production',
      `DATABASE_URL=${syntheticDatabaseUrl}`,
      `JWT_SECRET=${shortJwtSecret}`,
    ].join('\n');

    expect(() => loadSyntheticServerEnv(contents)).toThrow(
      ENV_PROFILE_ERROR.productionNodeForbidsLocalApp,
    );
    expect(() => loadSyntheticServerEnv(`\uFEFF${contents}`)).toThrow(
      ENV_PROFILE_ERROR.productionNodeForbidsLocalApp,
    );
  });

  it('rejects production APP_ENV when NODE_ENV is absent', () => {
    const contents = [
      'APP_ENV=production',
      `DATABASE_URL=${syntheticDatabaseUrl}`,
      `JWT_SECRET=${shortJwtSecret}`,
    ].join('\n');

    expect(() => loadSyntheticServerEnv(contents)).toThrow(
      ENV_PROFILE_ERROR.productionAppRequiresProductionNode,
    );
    expect(() => loadSyntheticServerEnv(`\uFEFF${contents}`)).toThrow(
      ENV_PROFILE_ERROR.productionAppRequiresProductionNode,
    );
  });

  it('keeps a complete production profile when the file starts with a BOM', () => {
    const env = loadSyntheticServerEnv(
      `\uFEFF${productionProfileLines.join('\n')}`,
    );

    expect(env.NODE_ENV).toBe('production');
    expect(env.APP_ENV).toBe('production');
    expect(requiresProductionSecurity(env)).toBe(true);
    expect(Object.isFrozen(env)).toBe(true);
  });

  it('lets the explicit env override a BOM-prefixed production file', () => {
    const env = loadSyntheticServerEnv(
      [
        '\uFEFFNODE_ENV=production',
        `DATABASE_URL=${syntheticDatabaseUrl}`,
        `JWT_SECRET=${shortJwtSecret}`,
      ].join('\n'),
      {
        NODE_ENV: 'test',
        APP_ENV: 'local',
        DATABASE_URL: syntheticDatabaseUrl,
        JWT_SECRET: shortJwtSecret,
      },
    );

    expect(env.NODE_ENV).toBe('test');
    expect(env.APP_ENV).toBe('local');
    expect(requiresProductionSecurity(env)).toBe(false);
  });
});

import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import { PrismaClient } from '@bidplace/database';

const DEFAULT_INTEGRATION_DATABASE_URL =
  'postgresql://auction:auction@127.0.0.1:5432/bidplace_integration?schema=public';

const ALLOWED_TEST_DATABASE_NAME = /(?:^|_)(integration|test)(?:_|$)/;
const INTEGRATION_SCHEMA_PREFIX = 'itest_';

export type IntegrationDatabaseContext = {
  readonly prisma: PrismaClient;
  readonly databaseUrl: string;
  readonly schemaName: string;
  readonly cleanup: () => Promise<void>;
};

function getDatabaseName(url: URL): string {
  const databaseName = url.pathname.replace(/^\//, '');

  if (!databaseName) {
    throw new Error('Integration database URL must include a database name');
  }

  return databaseName;
}

function assertSafeIntegrationDatabaseUrl(databaseUrl: string): URL {
  const url = new URL(databaseUrl);
  const databaseName = getDatabaseName(url);

  if (!['postgresql:', 'postgres:'].includes(url.protocol)) {
    throw new Error('Integration database URL must use the PostgreSQL protocol');
  }

  if (!ALLOWED_TEST_DATABASE_NAME.test(databaseName)) {
    throw new Error(
      `Refusing to use non-test integration database "${databaseName}"`,
    );
  }

  return url;
}

function createSchemaName(): string {
  return `${INTEGRATION_SCHEMA_PREFIX}${randomUUID().replace(/-/g, '')}`;
}

function buildSchemaUrl(url: URL, schemaName: string): string {
  const schemaUrl = new URL(url.toString());
  schemaUrl.searchParams.set('schema', schemaName);
  return schemaUrl.toString();
}

function buildAdminDatabaseUrl(url: URL): string {
  const adminUrl = new URL(url.toString());
  adminUrl.pathname = '/postgres';
  adminUrl.searchParams.set('schema', 'public');
  return adminUrl.toString();
}

function assertSafeIdentifier(identifier: string, entity: string): void {
  if (!/^[a-zA-Z0-9_]+$/.test(identifier)) {
    throw new Error(`Unsafe ${entity} identifier "${identifier}"`);
  }
}

async function ensureDatabaseExists(databaseUrl: URL): Promise<void> {
  const databaseName = getDatabaseName(databaseUrl);
  const adminClient = new PrismaClient({
    datasources: {
      db: {
        url: buildAdminDatabaseUrl(databaseUrl),
      },
    },
  });

  try {
    const existing = await adminClient.$queryRaw<Array<{ datname: string }>>`
      SELECT datname
      FROM pg_database
      WHERE datname = ${databaseName}
    `;

    if (existing.length > 0) {
      return;
    }

    assertSafeIdentifier(databaseName, 'database');
    await adminClient.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
  } finally {
    await adminClient.$disconnect();
  }
}

function migrateSchema(databaseUrl: string): void {
  const databasePackageDir = resolve(__dirname, '../../../../packages/database');
  const resolveFromDatabasePackage = createRequire(
    resolve(databasePackageDir, 'package.json'),
  );
  const prismaCliPath = resolveFromDatabasePackage.resolve('prisma/build/index.js');

  execFileSync(
    process.execPath,
    [prismaCliPath, 'migrate', 'deploy', '--schema=prisma/schema.prisma'],
    {
      cwd: databasePackageDir,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
      stdio: 'pipe',
    },
  );
}

async function dropSchema(databaseUrl: URL, schemaName: string): Promise<void> {
  assertSafeIdentifier(schemaName, 'schema');

  const adminClient = new PrismaClient({
    datasources: {
      db: {
        url: buildAdminDatabaseUrl(databaseUrl),
      },
    },
  });

  try {
    await adminClient.$executeRawUnsafe(
      `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`,
    );
  } finally {
    await adminClient.$disconnect();
  }
}

export async function createIntegrationDatabaseContext(): Promise<IntegrationDatabaseContext> {
  const baseUrl = assertSafeIntegrationDatabaseUrl(
    process.env.INTEGRATION_DATABASE_URL ?? DEFAULT_INTEGRATION_DATABASE_URL,
  );
  const schemaName = createSchemaName();
  const databaseUrl = buildSchemaUrl(baseUrl, schemaName);

  await ensureDatabaseExists(baseUrl);
  migrateSchema(databaseUrl);

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  await prisma.$connect();

  return {
    prisma,
    databaseUrl,
    schemaName,
    cleanup: async () => {
      await prisma.$disconnect();
      await dropSchema(baseUrl, schemaName);
    },
  };
}

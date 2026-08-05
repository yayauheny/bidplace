import { execFileSync } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

import { PrismaClient } from '../../../packages/database/dist/index.js';

import {
  assertDisposableDatabase,
  createMaintenanceDatabaseUrl,
} from './disposable-database.mjs';

const root = resolve(import.meta.dirname, '../../..');
const databaseUrl = process.env.E2E_DATABASE_URL;
const e2e = resolve(root, 'apps/mobile/e2e');
const guard = assertDisposableDatabase(databaseUrl, {
  nodeEnv: process.env.NODE_ENV,
});

const adminClient = new PrismaClient({
  datasources: {
    db: {
      url: createMaintenanceDatabaseUrl(databaseUrl),
    },
  },
});

try {
  await adminClient.$executeRawUnsafe(
    `CREATE DATABASE "${guard.databaseName}"`,
  );
} catch (error) {
  if (
    !(
      typeof error === 'object' &&
      error !== null &&
      (('code' in error && error.code === '42P04') ||
        ('meta' in error &&
          error.meta &&
          typeof error.meta === 'object' &&
          'code' in error.meta &&
          error.meta.code === '42P04'))
    )
  ) {
    throw error;
  }
} finally {
  await adminClient.$disconnect();
}

execFileSync(
  process.execPath,
  [
    resolve(root, 'packages/database/node_modules/prisma/build/index.js'),
    'migrate',
    'reset',
    '--force',
    '--skip-seed',
    '--schema=prisma/schema.prisma',
  ],
  {
    cwd: resolve(root, 'packages/database'),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  },
);

execFileSync(
  process.execPath,
  [resolve(root, 'packages/database/prisma/seed.js')],
  {
    cwd: resolve(root, 'packages/database'),
    env: {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: databaseUrl,
      ALLOW_DESTRUCTIVE_DEMO_SEED: 'true',
      APP_ENV: 'local',
      SEED_ADMIN_EMAIL: 'admin@bidplace.test',
      SEED_ADMIN_PASSWORD: 'password123',
    },
    stdio: 'inherit',
  },
);

await mkdir(e2e, { recursive: true });
await rm(resolve(e2e, '.email.jsonl'), { force: true });
await rm(resolve(e2e, '.otp.jsonl'), { force: true });
await rm(resolve(e2e, '.state.json'), { force: true });

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});

await prisma.category.create({
  data: { slug: 'e2e-art', name: 'E2E art' },
});
await prisma.$disconnect();

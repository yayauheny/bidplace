import { execFileSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import argon2 from '../../api/node_modules/argon2/argon2.cjs';
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
  await adminClient.$executeRawUnsafe(`CREATE DATABASE "${guard.databaseName}"`);
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

await mkdir(e2e, { recursive: true });
await rm(resolve(e2e, '.email.jsonl'), { force: true });
await rm(resolve(e2e, '.otp.jsonl'), { force: true });

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});

const passwordHash = await argon2.hash('password123');
const [buyer, outsider, admin] = await Promise.all([
  prisma.user.create({
    data: {
      email: 'buyer@e2e.test',
      passwordHash,
      phone: '+375290000001',
      displayName: 'buyer',
      role: 'user',
    },
  }),
  prisma.user.create({
    data: {
      email: 'outsider@e2e.test',
      passwordHash,
      phone: '+375290000002',
      displayName: 'outsider',
      role: 'user',
    },
  }),
  prisma.user.create({
    data: {
      email: 'admin@e2e.test',
      passwordHash,
      phone: '+375290000003',
      displayName: 'admin',
      role: 'admin',
    },
  }),
]);
const category = await prisma.category.create({
  data: { slug: 'e2e-art', name: 'E2E art' },
});

await writeFile(
  resolve(e2e, '.state.json'),
  JSON.stringify({ buyer, outsider, admin, category }),
);
await prisma.$disconnect();

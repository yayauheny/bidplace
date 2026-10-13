import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertStagingDatabaseUrl } from './staging.mjs';

export const stagingAccounts = [
  {
    email: 'buyer@bidplace.test',
    slug: 'buyer',
    displayName: 'Тестовый пользователь',
    role: 'user',
  },
  {
    email: 'seller@bidplace.test',
    slug: 'vex',
    displayName: 'Тестовый автор',
    role: 'user',
  },
  {
    email: 'admin@bidplace.test',
    slug: 'staging-admin',
    displayName: 'Тестовый администратор',
    role: 'admin',
  },
];

export function assertStagingAccountsEnvironment(env) {
  if (env.APP_ENV !== 'staging')
    throw new Error('Test accounts can only be provisioned in staging');
  assertStagingDatabaseUrl(
    env.DATABASE_URL,
    env.STAGING_NEON_ENDPOINT_ID,
    false,
  );
  if (!env.STAGING_TEST_PASSWORD || env.STAGING_TEST_PASSWORD.length < 12) {
    throw new Error(
      'Supply STAGING_TEST_PASSWORD through the staging secret store (at least 12 characters)',
    );
  }
}

export async function provisionStagingAccounts(db, passwordHash) {
  await db.$transaction(async (transaction) => {
    for (const account of stagingAccounts) {
      await transaction.user.upsert({
        where: { email: account.email },
        update: {},
        create: { ...account, passwordHash, emailVerifiedAt: new Date() },
      });
    }
  });
}

async function main() {
  assertStagingAccountsEnvironment(process.env);
  const require = createRequire(
    new URL('../../apps/api/package.json', import.meta.url),
  );
  const { PrismaClient } = require('@bidplace/database');
  const { hash } = require('argon2');
  const db = new PrismaClient();
  try {
    await provisionStagingAccounts(
      db,
      await hash(process.env.STAGING_TEST_PASSWORD),
    );
    console.log(
      'Staging test accounts prepared; existing accounts and content preserved.',
    );
  } finally {
    await db.$disconnect();
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch(() => {
    console.error(
      'Staging account provisioning failed; values are not logged.',
    );
    process.exitCode = 1;
  });
}

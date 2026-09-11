import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  applyCancellation,
  assertApplyGuards,
  collectInventory,
  envConfirmationRequired,
  formatApplyHint,
  parseDatabaseTarget,
  parseExpectedActive,
  parseInventoryArgs,
  readConnectedDatabase,
} from './lib/commerce-inventory.mjs';

const require = createRequire(import.meta.url);
const { PrismaClient } = require(
  join(
    dirname(fileURLToPath(import.meta.url)),
    '../../packages/database/dist/index.js',
  ),
);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Set DATABASE_URL before running commerce inventory.');
  process.exit(1);
}

let flags;
try {
  flags = parseInventoryArgs(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Invalid arguments');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});

async function main() {
  const fingerprint = parseDatabaseTarget(databaseUrl);
  const connectedDatabase = await readConnectedDatabase(prisma);
  if (connectedDatabase !== fingerprint.database) {
    throw new Error(
      `Connected database "${connectedDatabase}" does not match DATABASE_URL database "${fingerprint.database}"`,
    );
  }
  const appEnv = process.env.APP_ENV ?? '';
  const inventory = await collectInventory(prisma);
  const target = {
    ...fingerprint,
    connectedDatabase,
    appEnv,
    envConfirmationRequired: envConfirmationRequired(
      appEnv,
      fingerprint.hostname,
    ),
  };

  if (!flags.apply) {
    console.log(
      JSON.stringify(
        {
          mode: 'dry-run',
          target,
          inventory,
        },
        null,
        2,
      ),
    );
    console.error(
      formatApplyHint({
        expectedActive: inventory.activeListings,
        confirmTarget: fingerprint.confirmTarget,
        confirmEnv: appEnv,
        envConfirmationRequired: target.envConfirmationRequired,
      }),
    );
    return;
  }

  const expectedActive = parseExpectedActive(flags.expectedActive);
  assertApplyGuards({
    expectedActive,
    confirmTarget: flags.confirmTarget,
    confirmEnv: flags.confirmEnv,
    fingerprint,
    connectedDatabase,
    preflightCount: inventory.activeListings,
    appEnv,
  });

  const applied = await applyCancellation(prisma, expectedActive);
  console.log(
    JSON.stringify(
      {
        applied: true,
        confirmTarget: fingerprint.confirmTarget,
        ...applied,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(
      error instanceof Error ? error.message : 'Commerce inventory failed',
    );
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

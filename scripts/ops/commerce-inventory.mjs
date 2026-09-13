import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  assertReadEnvironment,
  assertReadTarget,
  collectInventory,
  formatInventoryReport,
  parseDatabaseTarget,
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

let environment;
let fingerprint;
try {
  parseInventoryArgs(process.argv.slice(2));
  environment = assertReadEnvironment(process.env);
  fingerprint = parseDatabaseTarget(databaseUrl);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Invalid arguments');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});

async function main() {
  const connectedDatabase = await readConnectedDatabase(prisma);
  assertReadTarget({ fingerprint, connectedDatabase });
  const inventory = await collectInventory(prisma);
  process.stdout.write(
    formatInventoryReport({
      environment,
      target: fingerprint,
      inventory,
    }),
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

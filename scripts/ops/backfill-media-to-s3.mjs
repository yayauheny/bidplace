import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runMediaBackfill } from './lib/media-backfill.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const requireFromApi = createRequire(
  join(scriptDirectory, '../../apps/api/package.json'),
);
const requireFromDatabase = createRequire(
  join(scriptDirectory, '../../packages/database/package.json'),
);
const commands = requireFromApi('@aws-sdk/client-s3');
const { S3Client } = commands;
const { PrismaClient } = requireFromDatabase(
  join(scriptDirectory, '../../packages/database/dist/index.js'),
);

const dryRun = !process.argv.includes('--apply');
const databaseUrl = process.env.DATABASE_URL;
const requiredS3Keys = [
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
];

if (!databaseUrl || requiredS3Keys.some((key) => !process.env[key])) {
  console.error(
    'Set DATABASE_URL and complete S3 configuration before running media backfill.',
  );
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.S3_BUCKET;

async function main() {
  const report = await runMediaBackfill({
    prisma,
    client,
    commands,
    bucket,
    dryRun,
  });
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(
      error instanceof Error ? error.message : 'Media backfill failed',
    );
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

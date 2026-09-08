import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { PrismaClient } = require(
  join(
    dirname(fileURLToPath(import.meta.url)),
    '../../packages/database/dist/index.js',
  ),
);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Set DATABASE_URL before running URL preflight.');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});

const legacyUrlWhere = (field) => ({
  [field]: { not: null, notIn: [''] },
  NOT: { [field]: { startsWith: 'https://' } },
});

async function main() {
  const [socialLink, telegramUrl, instagramUrl, websiteUrl] = await Promise.all(
    [
      prisma.sellerProfile.count({
        where: { NOT: { socialLink: { startsWith: 'https://' } } },
      }),
      prisma.sellerProfile.count({ where: legacyUrlWhere('telegramUrl') }),
      prisma.sellerProfile.count({ where: legacyUrlWhere('instagramUrl') }),
      prisma.sellerProfile.count({ where: legacyUrlWhere('websiteUrl') }),
    ],
  );

  console.log(
    JSON.stringify(
      {
        policy: 'report-only; do not rewrite values automatically',
        fields: { socialLink, telegramUrl, instagramUrl, websiteUrl },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(
      error instanceof Error ? error.message : 'URL preflight failed',
    );
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

import { execFileSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import argon2 from '../../api/node_modules/argon2/argon2.cjs';
import { PrismaClient, Prisma } from '../../../packages/database/dist/index.js';

const root = resolve(import.meta.dirname, '../../..');
const databaseUrl = process.env.E2E_DATABASE_URL;
const e2e = resolve(root, 'apps/mobile/e2e');

if (process.env.NODE_ENV !== 'test') {
  throw new Error('NODE_ENV must be test for Playwright E2E preparation');
}

if (!databaseUrl) {
  throw new Error('E2E_DATABASE_URL is required');
}

const database = new URL(databaseUrl);
const databaseName = database.pathname.replace(/^\//, '');

if (databaseName !== 'bidplace_e2e') {
  throw new Error(`E2E_DATABASE_URL must target bidplace_e2e, got ${databaseName}`);
}

const adminClient = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://auction:auction@127.0.0.1:5432/postgres?schema=public',
    },
  },
});

try {
  await adminClient.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
} catch (error) {
  if (
    !(
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '42P04'
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
const users = await Promise.all(
  ['seller', 'buyer', 'outsider', 'admin'].map((name) =>
    prisma.user.create({
      data: {
        email: `${name}@e2e.test`,
        passwordHash,
        phone: `+37529000000${['seller', 'buyer', 'outsider', 'admin'].indexOf(name) + 1}`,
        displayName: name,
        role: name === 'admin' ? 'admin' : 'user',
      },
    }),
  ),
);
const [seller, buyer, outsider, admin] = users;
const category = await prisma.category.create({
  data: { slug: 'e2e-art', name: 'E2E art' },
});
const profile = await prisma.sellerProfile.create({
  data: {
    userId: seller.id,
    slug: 'e2e-seller',
    sellerType: 'creator',
    fullName: 'E2E seller',
    country: 'BY',
    profilePhotoMimeType: 'image/png',
    profilePhotoByteLength: 1,
    profilePhotoChecksum: '0'.repeat(64),
    profilePhotoData: Buffer.from([0]),
    socialLink: 'https://example.com/e2e-seller',
    shortDescription: 'E2E seller profile',
    status: 'APPROVED',
    handoffContactType: 'TELEGRAM',
    handoffContactValue: '@e2eseller',
    handoffInitiator: 'BUYER_CONTACTS_SELLER',
  },
});
const product = await prisma.product.create({
  data: {
    publicId: 'e2eProduct1',
    sellerProfileId: profile.id,
    categoryId: category.id,
    title: 'E2E Product',
    story: 'Real API product',
    condition: 'New',
    uniqueness: 'One',
    provenance: 'E2E',
    city: 'Minsk',
    deliveryInfo: 'Pickup',
    status: 'APPROVED',
    images: {
      create: [0, 1, 2].map((position) => ({
        position,
        mimeType: 'image/png',
        byteLength: 1,
        data: Buffer.from([0]),
        checksum: '0'.repeat(64),
      })),
    },
  },
});
const now = new Date();
const listing = await prisma.listing.create({
  data: {
    productId: product.id,
    status: 'LIVE',
    startsAt: new Date(now - 60_000),
    originalEndsAt: new Date(now.getTime() + 3_600_000),
    endsAt: new Date(now.getTime() + 3_600_000),
    currentPrice: new Prisma.Decimal(10),
    auctionRules: { create: { startPrice: new Prisma.Decimal(10) } },
  },
});
await writeFile(
  resolve(e2e, '.state.json'),
  JSON.stringify({ seller, buyer, outsider, admin, product, listing }),
);
await prisma.$disconnect();

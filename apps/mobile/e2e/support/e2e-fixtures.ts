import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { PrismaClient } from '../../../../packages/database/dist/index.js';
import { e2eDatabaseURL } from './e2e-env';

const databaseUrl = e2eDatabaseURL;
const password = 'password123';
const passwordHash =
  '$argon2id$v=19$m=65536,t=3,p=4$Hv01HhuWHyFmMIRCcxhH3w$9dvY3hECfoulYwe4VEPwWEJ4OHvYCCYbiw685vNdLZM';

export type E2EUser = { id: string; email: string; password: string };
export type AdminModerationFixture = {
  admin: E2EUser;
  sellerProfileId: string;
  sellerName: string;
  productId: string;
  productTitle: string;
};
export type AuctionFixture = {
  seller: E2EUser;
  sellerProfileId: string;
  sellerProfile: {
    id: string;
    slug: string;
    fullName: string;
    privateContact: string;
  };
  buyerA: E2EUser;
  buyerB: E2EUser;
  product: { id: string; publicId: string; title: string };
  listing: { id: string; startsAt: Date; endsAt: Date };
};

const seededDemoProductIds = [
  'seedSched01',
  'seedLive002',
  'seedEnded03',
  'seedVase004',
] as const;

export async function prioritizeSeededDemoProducts(): Promise<void> {
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

  try {
    await prisma.product.updateMany({
      where: { publicId: { in: [...seededDemoProductIds] } },
      data: { publishedAt: new Date() },
    });
  } finally {
    await prisma.$disconnect();
  }
}

function uniqueEmail(prefix: string, suffix: string): string {
  return `${prefix}.${suffix}@e2e.test`;
}

async function attachPublishedProductRevision(
  prisma: PrismaClient,
  product: {
    id: string;
    categoryId: string | null;
    title: string | null;
    story: string | null;
    technique: string | null;
    materials: string | null;
    dimensions: string | null;
    year: number | null;
    condition: string | null;
    uniqueness: string | null;
    provenance: string | null;
    city: string | null;
    packaging: string | null;
    deliveryInfo: string | null;
    images: Array<{ id: string }>;
  },
): Promise<void> {
  const revision = await prisma.productRevision.create({
    data: {
      productId: product.id,
      version: 1,
      status: 'APPROVED',
      categoryId: product.categoryId,
      title: product.title,
      story: product.story,
      technique: product.technique,
      materials: product.materials,
      dimensions: product.dimensions,
      year: product.year,
      condition: product.condition,
      uniqueness: product.uniqueness,
      provenance: product.provenance,
      city: product.city,
      packaging: product.packaging,
      deliveryInfo: product.deliveryInfo,
      images: {
        create: product.images.map((image, position) => ({
          imageId: image.id,
          position,
        })),
      },
    },
  });
  await prisma.product.update({
    where: { id: product.id },
    data: {
      editingRevisionId: revision.id,
      publishedRevisionId: revision.id,
    },
  });
}

async function createUser(
  prisma: PrismaClient,
  email: string,
  displayName: string,
  role: 'admin' | 'user' = 'user',
): Promise<E2EUser> {
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      phone: `+37529${Math.floor(1_000_000 + Math.random() * 8_999_999)}`,
      displayName,
      role,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      termsAcceptances: {
        create: { rulesVersion: 'MVP_RULES_V1', acceptedAt: new Date() },
      },
    },
  });
  return { id: user.id, email, password };
}

export async function createAuctionFixture(options?: {
  live?: boolean;
  bids?: boolean;
  title?: string;
  additionalTitles?: string[];
}): Promise<AuctionFixture> {
  const suffix = randomUUID().slice(0, 8);
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
  const now = new Date();
  const startsAt = new Date(
    now.getTime() + (options?.live === false ? 30_000 : -5_000),
  );
  const endsAt = new Date(now.getTime() + 300_000);
  const seller = await createUser(
    prisma,
    uniqueEmail('seller', suffix),
    `seller-${suffix}`,
  );
  const buyerA = await createUser(
    prisma,
    uniqueEmail('buyer-a', suffix),
    `buyer-a-${suffix}`,
  );
  const buyerB = await createUser(
    prisma,
    uniqueEmail('buyer-b', suffix),
    `buyer-b-${suffix}`,
  );
  const category = await prisma.category.findUniqueOrThrow({
    where: { slug: 'e2e-art' },
  });
  const photo = readFileSync(
    resolve(__dirname, '../fixtures/profile-photo.png'),
  );
  const sellerName = `E2E Seller ${suffix}`;
  const sellerSlug = `seller-${suffix}`;
  const privateContact = `@seller_${suffix}`;

  const sellerProfile = await prisma.sellerProfile.create({
    data: {
      userId: seller.id,
      slug: sellerSlug,
      sellerType: 'creator',
      fullName: sellerName,
      country: 'BY',
      city: 'Minsk',
      discipline: 'Автор',
      profilePhotoMimeType: 'image/png',
      profilePhotoByteLength: photo.byteLength,
      profilePhotoChecksum: '0'.repeat(64),
      profilePhotoData: photo,
      socialLink: 'https://example.com/e2e',
      shortDescription: 'E2E seller',
      handoffContactType: 'TELEGRAM',
      handoffContactValue: privateContact,
      handoffInitiator: 'BUYER_CONTACTS_SELLER',
      status: 'APPROVED',
    },
  });
  const title = options?.title ?? `E2E Auction ${suffix}`;
  const createPublishedAuction = async (productTitle: string) => {
    const product = await prisma.product.create({
      data: {
        publicId: randomUUID().replace(/-/g, '').slice(0, 11),
        sellerProfileId: sellerProfile.id,
        categoryId: category.id,
        title: productTitle,
        story: 'A real authored item for the auction proof.',
        technique: 'Mixed media',
        materials: 'Paper, ink',
        dimensions: '30x40',
        year: 2026,
        condition: 'New',
        uniqueness: 'One',
        provenance: 'E2E fixture',
        city: 'Minsk',
        packaging: 'Protective archival packaging',
        deliveryInfo: 'Pickup',
        status: 'APPROVED',
        publishedAt: now,
        images: {
          create: {
            position: 0,
            mimeType: 'image/png',
            byteLength: photo.byteLength,
            data: photo,
            checksum: '0'.repeat(64),
          },
        },
      },
      include: { images: { orderBy: { position: 'asc' } } },
    });
    await attachPublishedProductRevision(prisma, product);
    const listing = await prisma.listing.create({
      data: {
        productId: product.id,
        status: options?.live === false ? 'SCHEDULED' : 'LIVE',
        startsAt,
        originalEndsAt: endsAt,
        endsAt,
        currentPrice: 10,
        auctionRules: { create: { startPrice: 10 } },
      },
    });
    return { product, listing };
  };
  const { product, listing } = await createPublishedAuction(title);

  for (const additionalTitle of options?.additionalTitles ?? []) {
    await createPublishedAuction(additionalTitle);
  }

  if (options?.bids) {
    await prisma.bid.createMany({
      data: [
        {
          listingId: listing.id,
          bidderUserId: buyerA.id,
          idempotencyKey: `a-${suffix}`,
          amount: 11,
        },
        {
          listingId: listing.id,
          bidderUserId: buyerB.id,
          idempotencyKey: `b-${suffix}`,
          amount: 15,
        },
      ],
    });
    await prisma.listing.update({
      where: { id: listing.id },
      data: { currentPrice: 15, bidCount: 2 },
    });
  }

  await prisma.$disconnect();
  return {
    seller,
    sellerProfileId: sellerProfile.id,
    sellerProfile: {
      id: sellerProfile.id,
      slug: sellerSlug,
      fullName: sellerName,
      privateContact,
    },
    buyerA,
    buyerB,
    product: { id: product.id, publicId: product.publicId, title },
    listing: { id: listing.id, startsAt, endsAt },
  };
}

export async function createSellerFixture(
  options: {
    status?: 'APPROVED' | 'PENDING_REVIEW';
  } = {},
): Promise<{
  seller: E2EUser;
  categoryId: string;
  slug: string;
}> {
  const suffix = randomUUID().slice(0, 8);
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
  const seller = await createUser(
    prisma,
    uniqueEmail('seller', suffix),
    `seller-${suffix}`,
  );
  const category = await prisma.category.findUniqueOrThrow({
    where: { slug: 'e2e-art' },
  });
  const photo = readFileSync(
    resolve(__dirname, '../fixtures/profile-photo.png'),
  );
  const slug = `seller-${suffix}`;
  await prisma.sellerProfile.create({
    data: {
      userId: seller.id,
      slug,
      sellerType: 'creator',
      fullName: `E2E Seller ${suffix}`,
      country: 'BY',
      city: 'Minsk',
      discipline: 'Автор',
      profilePhotoMimeType: 'image/png',
      profilePhotoByteLength: photo.byteLength,
      profilePhotoChecksum: '0'.repeat(64),
      profilePhotoData: photo,
      socialLink: 'https://example.com/e2e',
      shortDescription: 'E2E seller',
      handoffContactType: 'TELEGRAM',
      handoffContactValue: `@seller_${suffix}`,
      status: options.status ?? 'APPROVED',
    },
  });
  await prisma.$disconnect();
  return { seller, categoryId: category.id, slug };
}

export async function createBuyerFixture(): Promise<{ buyer: E2EUser }> {
  const suffix = randomUUID().slice(0, 8);
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
  const buyer = await createUser(
    prisma,
    uniqueEmail('buyer', suffix),
    `buyer-${suffix}`,
  );
  await prisma.$disconnect();
  return { buyer };
}

export async function createAdminModerationFixture(): Promise<AdminModerationFixture> {
  const suffix = randomUUID().slice(0, 8);
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
  const admin = await createUser(
    prisma,
    uniqueEmail('admin', suffix),
    `admin-${suffix}`,
    'admin',
  );
  const category = await prisma.category.findUniqueOrThrow({
    where: { slug: 'e2e-art' },
  });
  const photo = readFileSync(
    resolve(__dirname, '../fixtures/profile-photo.png'),
  );
  const pendingSeller = await prisma.user.create({
    data: {
      email: uniqueEmail('pending-seller', suffix),
      passwordHash,
      displayName: `Pending Seller ${suffix}`,
      emailVerifiedAt: new Date(),
      termsAcceptances: {
        create: { rulesVersion: 'MVP_RULES_V1', acceptedAt: new Date() },
      },
    },
  });
  const sellerName = `Pending Seller ${suffix}`;
  const sellerProfile = await prisma.sellerProfile.create({
    data: {
      userId: pendingSeller.id,
      slug: `pending-seller-${suffix}`,
      sellerType: 'creator',
      fullName: sellerName,
      country: 'BY',
      city: 'Minsk',
      discipline: 'Автор',
      profilePhotoMimeType: 'image/png',
      profilePhotoByteLength: photo.byteLength,
      profilePhotoChecksum: '0'.repeat(64),
      profilePhotoData: photo,
      socialLink: 'https://example.com/pending-seller',
      shortDescription: 'Pending moderation fixture',
      handoffContactType: 'TELEGRAM',
      handoffContactValue: `@pending_${suffix}`,
      handoffInitiator: 'BUYER_CONTACTS_SELLER',
      status: 'PENDING_REVIEW',
    },
  });
  const productTitle = `Pending Product ${suffix}`;
  const product = await prisma.product.create({
    data: {
      publicId: randomUUID().replace(/-/g, '').slice(0, 11),
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      title: productTitle,
      story: 'Pending moderation fixture.',
      technique: 'Mixed media',
      materials: 'Paper, ink',
      dimensions: '30x40',
      year: 2026,
      condition: 'New',
      uniqueness: 'One',
      provenance: 'E2E fixture',
      city: 'Minsk',
      packaging: 'Protective archival packaging',
      deliveryInfo: 'Pickup',
      status: 'PENDING_REVIEW',
      images: {
        create: {
          position: 0,
          mimeType: 'image/png',
          byteLength: photo.byteLength,
          data: photo,
          checksum: '0'.repeat(64),
        },
      },
    },
  });
  await prisma.$disconnect();
  return {
    admin,
    sellerProfileId: sellerProfile.id,
    sellerName,
    productId: product.id,
    productTitle,
  };
}

export async function approveProduct(productId: string): Promise<void> {
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
  await prisma.product.update({
    where: { id: productId },
    data: { status: 'APPROVED', publishedAt: new Date() },
  });
  await prisma.$disconnect();
}

export async function removeRulesAcceptance(userId: string): Promise<void> {
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
  await prisma.termsAcceptance.deleteMany({ where: { userId } });
  await prisma.$disconnect();
}

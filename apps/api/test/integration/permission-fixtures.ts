import { randomUUID } from 'node:crypto';

import { Prisma, type PrismaClient } from '@bidplace/database';

const fixtureDate = new Date('2026-08-05T12:00:00.000Z');
export const fixturePasswordHash =
  '$argon2id$v=19$m=65536,t=3,p=4$Hv01HhuWHyFmMIRCcxhH3w$9dvY3hECfoulYwe4VEPwWEJ4OHvYCCYbiw685vNdLZM';

export const permissionImage = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

export type PermissionFixture = {
  buyer: { id: string; email: string; password: string };
  sellers: Record<
    'pending' | 'changes' | 'suspended' | 'approved' | 'otherApproved',
    {
      id: string;
      email: string;
      password: string;
      profileId: string;
      productId: string;
      imageId: string;
      listingId: string;
    }
  >;
  categoryId: string;
  approvedDraftProductId: string;
  approvedProductId: string;
  approvedListingId: string;
  approvedImageIds: string[];
};

async function createUser(
  prisma: PrismaClient,
  role: string,
  suffix: string,
): Promise<{ id: string; email: string; password: string }> {
  const email = `${role}.${suffix}@wave3.test`;
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: fixturePasswordHash,
      displayName: role,
      emailVerifiedAt: fixtureDate,
      termsAcceptances: {
        create: { rulesVersion: 'MVP_RULES_V1', acceptedAt: fixtureDate },
      },
    },
    select: { id: true, email: true },
  });

  return { ...user, password: 'password123' };
}

async function attachProductRevision(
  prisma: PrismaClient,
  product: {
    id: string;
    images: Array<{ id: string }>;
  },
  input: {
    status: 'DRAFT' | 'APPROVED';
    categoryId: string;
    title: string;
    story: string;
    uniqueness?: string;
    provenance?: string;
    city?: string;
    deliveryInfo?: string;
  },
): Promise<void> {
  const revision = await prisma.productRevision.create({
    data: {
      productId: product.id,
      version: 1,
      status: input.status,
      categoryId: input.categoryId,
      title: input.title,
      story: input.story,
      uniqueness: input.uniqueness ?? null,
      provenance: input.provenance ?? null,
      city: input.city ?? null,
      deliveryInfo: input.deliveryInfo ?? null,
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
      publishedRevisionId:
        input.status === 'APPROVED' ? revision.id : null,
      ...(input.status === 'APPROVED' ? { publishedAt: fixtureDate } : {}),
    },
  });
}

async function createSeller(
  prisma: PrismaClient,
  status: 'PENDING_REVIEW' | 'CHANGES_REQUESTED' | 'SUSPENDED' | 'APPROVED',
  suffix: string,
) {
  const user = await createUser(prisma, status.toLowerCase(), suffix);
  const slugStatus = status.toLowerCase().replaceAll('_', '-');
  const profile = await prisma.sellerProfile.create({
    data: {
      userId: user.id,
      slug: `wave3-${slugStatus}-${suffix}`,
      sellerType: 'creator',
      fullName: `Wave 3 ${status}`,
      country: 'BY',
      city: 'Minsk',
      discipline: 'Автор',
      profilePhotoMimeType: 'image/png',
      profilePhotoByteLength: permissionImage.byteLength,
      profilePhotoChecksum: '0'.repeat(64),
      profilePhotoData: permissionImage,
      socialLink: 'https://example.com/wave3',
      shortDescription: 'Wave 3 seller fixture',
      handoffContactType: 'TELEGRAM',
      handoffContactValue: '@wave3_seller',
      status,
    },
    select: { id: true },
  });
  const revisionStatus = status === 'SUSPENDED' ? 'APPROVED' : status;
  const profileRevision = await prisma.sellerProfileRevision.create({
    data: {
      sellerProfileId: profile.id,
      version: 1,
      status: revisionStatus,
      slug: `wave3-${slugStatus}-${suffix}`,
      discipline: 'Автор',
      fullName: `Wave 3 ${status}`,
      country: 'BY',
      city: 'Minsk',
      socialLink: 'https://example.com/wave3',
      shortDescription: 'Wave 3 seller fixture',
    },
  });
  await prisma.sellerProfile.update({
    where: { id: profile.id },
    data: {
      profilePhotoObjectKey: `seller-photo:${profile.id}`,
      editingRevisionId: profileRevision.id,
      publishedRevisionId:
        revisionStatus === 'APPROVED' ? profileRevision.id : null,
    },
  });
  const category = await prisma.category.findFirstOrThrow();
  const product = await prisma.product.create({
    data: {
      publicId: `w3prod${randomUUID().replace(/-/g, '').slice(0, 5)}`,
      sellerProfileId: profile.id,
      categoryId: category.id,
      title: `${status} product`,
      story: 'Wave 3 permission fixture',
      status: 'DRAFT',
      images: {
        create: {
          position: 0,
          mimeType: 'image/png',
          byteLength: permissionImage.byteLength,
          data: permissionImage,
          checksum: `${status.length}`.repeat(64).slice(0, 64),
        },
      },
    },
    select: { id: true, images: { select: { id: true } } },
  });
  await attachProductRevision(prisma, product, {
    status: 'DRAFT',
    categoryId: category.id,
    title: `${status} product`,
    story: 'Wave 3 permission fixture',
  });
  const listing = await prisma.listing.create({
    data: {
      productId: product.id,
      status: 'DRAFT',
      startsAt: new Date(fixtureDate.getTime() + 3_600_000),
      originalEndsAt: new Date(fixtureDate.getTime() + 7_200_000),
      endsAt: new Date(fixtureDate.getTime() + 7_200_000),
      currentPrice: new Prisma.Decimal(10),
      auctionRules: { create: { startPrice: new Prisma.Decimal(10) } },
    },
    select: { id: true },
  });

  return {
    ...user,
    profileId: profile.id,
    productId: product.id,
    imageId: product.images[0]!.id,
    listingId: listing.id,
  };
}

export async function resetPermissionFixture(
  prisma: PrismaClient,
): Promise<void> {
  await prisma.auditEvent.deleteMany();
  await prisma.termsAcceptance.deleteMany();
  await prisma.emailVerificationCode.deleteMany();
  await prisma.phoneVerificationCode.deleteMany();
  await prisma.order.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.auctionRules.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.product.updateMany({
    data: { editingRevisionId: null, publishedRevisionId: null },
  });
  await prisma.productRevision.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.sellerProfile.updateMany({
    data: { editingRevisionId: null, publishedRevisionId: null },
  });
  await prisma.sellerProfileRevision.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

export async function createPermissionFixture(
  prisma: PrismaClient,
): Promise<PermissionFixture> {
  const suffix = randomUUID().replace(/-/g, '').slice(0, 8);
  const buyer = await createUser(prisma, 'buyer', suffix);
  const category = await prisma.category.create({
    data: { slug: `wave3-category-${suffix}`, name: 'Wave 3 category' },
  });

  const sellers = {
    pending: await createSeller(prisma, 'PENDING_REVIEW', suffix),
    changes: await createSeller(prisma, 'CHANGES_REQUESTED', suffix),
    suspended: await createSeller(prisma, 'SUSPENDED', suffix),
    approved: await createSeller(prisma, 'APPROVED', suffix),
    otherApproved: await createSeller(prisma, 'APPROVED', `${suffix}other`),
  };

  const approvedDraftProduct = await prisma.product.create({
    data: {
      publicId: `w3draft${randomUUID().replace(/-/g, '').slice(0, 4)}`,
      sellerProfileId: sellers.approved.profileId,
      categoryId: category.id,
      title: 'Approved owner draft',
      story: 'Draft with images for permission coverage',
      uniqueness: 'One',
      provenance: 'Wave 3 fixture',
      city: 'Minsk',
      deliveryInfo: 'Pickup',
      status: 'DRAFT',
      images: {
        create: [
          {
            position: 0,
            mimeType: 'image/png',
            byteLength: permissionImage.byteLength,
            data: permissionImage,
            checksum: '0'.repeat(64),
          },
          {
            position: 1,
            mimeType: 'image/png',
            byteLength: permissionImage.byteLength,
            data: permissionImage,
            checksum: '1'.repeat(64),
          },
        ],
      },
    },
    select: {
      id: true,
      images: { select: { id: true }, orderBy: { position: 'asc' } },
    },
  });
  await attachProductRevision(prisma, approvedDraftProduct, {
    status: 'DRAFT',
    categoryId: category.id,
    title: 'Approved owner draft',
    story: 'Draft with images for permission coverage',
    uniqueness: 'One',
    provenance: 'Wave 3 fixture',
    city: 'Minsk',
    deliveryInfo: 'Pickup',
  });

  const approvedProduct = await prisma.product.create({
    data: {
      publicId: `w3livep${randomUUID().replace(/-/g, '').slice(0, 4)}`,
      sellerProfileId: sellers.approved.profileId,
      categoryId: category.id,
      title: 'Approved owner listing product',
      story: 'Approved product for Listing permission coverage',
      uniqueness: 'One',
      provenance: 'Wave 3 fixture',
      city: 'Minsk',
      deliveryInfo: 'Pickup',
      status: 'APPROVED',
      images: {
        create: {
          position: 0,
          mimeType: 'image/png',
          byteLength: permissionImage.byteLength,
          data: permissionImage,
          checksum: '2'.repeat(64),
        },
      },
    },
    select: { id: true, images: { select: { id: true } } },
  });
  await attachProductRevision(prisma, approvedProduct, {
    status: 'APPROVED',
    categoryId: category.id,
    title: 'Approved owner listing product',
    story: 'Approved product for Listing permission coverage',
    uniqueness: 'One',
    provenance: 'Wave 3 fixture',
    city: 'Minsk',
    deliveryInfo: 'Pickup',
  });

  const approvedListing = await prisma.listing.create({
    data: {
      productId: approvedProduct.id,
      status: 'DRAFT',
      startsAt: new Date(fixtureDate.getTime() + 3_600_000),
      originalEndsAt: new Date(fixtureDate.getTime() + 7_200_000),
      endsAt: new Date(fixtureDate.getTime() + 7_200_000),
      currentPrice: new Prisma.Decimal(10),
      auctionRules: { create: { startPrice: new Prisma.Decimal(10) } },
    },
    select: { id: true },
  });

  return {
    buyer,
    sellers,
    categoryId: category.id,
    approvedDraftProductId: approvedDraftProduct.id,
    approvedProductId: approvedProduct.id,
    approvedListingId: approvedListing.id,
    approvedImageIds: [
      ...approvedDraftProduct.images.map((image) => image.id),
      ...approvedProduct.images.map((image) => image.id),
    ],
  };
}

export async function permissionState(prisma: PrismaClient) {
  const [users, sellers, products, listings, images, audits] =
    await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          sessionVersion: true,
        },
        orderBy: { email: 'asc' },
      }),
      prisma.sellerProfile.findMany({
        select: {
          id: true,
          userId: true,
          status: true,
          fullName: true,
          slug: true,
          updatedAt: true,
        },
        orderBy: { slug: 'asc' },
      }),
      prisma.product.findMany({
        select: {
          id: true,
          sellerProfileId: true,
          status: true,
          title: true,
          updatedAt: true,
        },
        orderBy: { id: 'asc' },
      }),
      prisma.listing.findMany({
        select: {
          id: true,
          productId: true,
          status: true,
          bidCount: true,
          currentPrice: true,
          updatedAt: true,
        },
        orderBy: { id: 'asc' },
      }),
      prisma.productImage.findMany({
        select: { id: true, productId: true, position: true, checksum: true },
        orderBy: [{ productId: 'asc' }, { position: 'asc' }],
      }),
      prisma.auditEvent.findMany({
        select: {
          id: true,
          actorUserId: true,
          targetType: true,
          targetId: true,
          oldStatus: true,
          newStatus: true,
          reason: true,
        },
        orderBy: { id: 'asc' },
      }),
    ]);

  return JSON.parse(
    JSON.stringify({ users, sellers, products, listings, images, audits }),
  ) as unknown;
}

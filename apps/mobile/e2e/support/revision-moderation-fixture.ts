import { createHash, randomUUID } from 'node:crypto';
import { deflateSync } from 'node:zlib';

import { PrismaClient } from '../../../../packages/database/dist/index.js';
import { e2eDatabaseURL } from './e2e-env';

const password = 'password123';
const passwordHash =
  '$argon2id$v=19$m=65536,t=3,p=4$Hv01HhuWHyFmMIRCcxhH3w$9dvY3hECfoulYwe4VEPwWEJ4OHvYCCYbiw685vNdLZM';

export type RevisionImage = {
  id: string;
  bytes: Buffer;
  width: number;
  height: number;
  mimeType: 'image/png';
};

export type RevisionAchievement = {
  id: string;
  body: string;
  bytes: Buffer;
  width: number;
  height: number;
};

export type RevisionModerationFixture = {
  admin: { id: string; email: string; password: string };
  slug: string;
  publishedName: string;
  pendingName: string;
  publishedPhoto: Buffer;
  pendingPhoto: Buffer;
  publishedPhotoSize: { width: number; height: number };
  pendingPhotoSize: { width: number; height: number };
  sellerProfileId: string;
  revisionId: string;
  publicId: string;
  publishedTitle: string;
  pendingTitle: string;
  publishedCategoryId: string;
  pendingCategoryId: string;
  publishedImageId: string;
  pendingImageId: string;
  pendingOnlyImageId: string;
  publishedGallery: [RevisionImage, RevisionImage];
  pendingGallery: [RevisionImage, RevisionImage, RevisionImage];
  publishedAchievement: RevisionAchievement;
  pendingAchievement: RevisionAchievement;
};

function checksum(bytes: Buffer) {
  return createHash('sha256').update(bytes).digest('hex');
}

function crc32(data: Buffer) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function png(
  width: number,
  height: number,
  rgb: readonly [number, number, number],
) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  const rowLength = 1 + width * 3;
  const raw = Buffer.alloc(rowLength * height);
  for (let y = 0; y < height; y += 1) {
    const start = y * rowLength;
    for (let x = 0; x < width; x += 1) {
      const offset = start + 1 + x * 3;
      raw[offset] = rgb[0];
      raw[offset + 1] = rgb[1];
      raw[offset + 2] = rgb[2];
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function storedImage(
  id: string,
  image: ReturnType<typeof fixtureImage>,
): RevisionImage {
  return {
    id,
    bytes: image.bytes,
    width: image.width,
    height: image.height,
    mimeType: image.mimeType,
  };
}

function fixtureImage(
  width: number,
  height: number,
  rgb: readonly [number, number, number],
) {
  const bytes = png(width, height, rgb);
  return {
    bytes,
    width,
    height,
    mimeType: 'image/png' as const,
    byteLength: bytes.byteLength,
    checksum: checksum(bytes),
  };
}

export async function createRevisionModerationFixture(): Promise<RevisionModerationFixture> {
  const prisma = new PrismaClient({
    datasources: { db: { url: e2eDatabaseURL } },
  });
  const suffix = randomUUID().slice(0, 8);
  const publishedPhoto = fixtureImage(8, 6, [220, 40, 40]);
  const pendingPhoto = fixtureImage(10, 7, [30, 80, 210]);
  const firstImage = fixtureImage(4, 3, [40, 160, 70]);
  const secondImage = fixtureImage(5, 4, [230, 180, 20]);
  const pendingOnlyImage = fixtureImage(6, 5, [120, 40, 180]);
  const publishedAchievementImage = fixtureImage(7, 5, [240, 120, 20]);
  const pendingAchievementImage = fixtureImage(9, 8, [20, 140, 150]);
  const publishedAchievementId = randomUUID();
  const pendingAchievementId = randomUUID();
  const publishedAchievementBody = `Published exhibition ${suffix}`;
  const pendingAchievementBody = `Pending exhibition ${suffix}`;
  const publishedName = `Published author ${suffix}`;
  const pendingName = `Pending author ${suffix}`;
  const publishedTitle = `Published work ${suffix}`;
  const pendingTitle = `Pending work ${suffix}`;
  const pendingCategory = `Pending category ${suffix}`;
  const slug = `revision-${suffix}`;

  try {
    const admin = await prisma.user.create({
      data: {
        email: `admin.revision.${suffix}@e2e.test`,
        passwordHash,
        displayName: `Admin ${suffix}`,
        role: 'admin',
        emailVerifiedAt: new Date(),
        termsAcceptances: {
          create: { rulesVersion: 'MVP_RULES_V1', acceptedAt: new Date() },
        },
      },
      select: { id: true, email: true },
    });
    const owner = await prisma.user.create({
      data: {
        email: `owner.revision.${suffix}@e2e.test`,
        passwordHash,
        displayName: publishedName,
        emailVerifiedAt: new Date(),
        termsAcceptances: {
          create: { rulesVersion: 'MVP_RULES_V1', acceptedAt: new Date() },
        },
      },
    });
    const art = await prisma.category.findUniqueOrThrow({
      where: { slug: 'e2e-art' },
    });
    const other = await prisma.category.create({
      data: { slug: `pending-${suffix}`, name: pendingCategory },
    });
    const profile = await prisma.sellerProfile.create({
      data: {
        userId: owner.id,
        slug,
        sellerType: 'creator',
        fullName: publishedName,
        discipline: 'Керамика',
        country: 'BY',
        city: 'Minsk',
        shortDescription: 'Published description',
        profilePhotoMimeType: publishedPhoto.mimeType,
        profilePhotoByteLength: publishedPhoto.byteLength,
        profilePhotoChecksum: publishedPhoto.checksum,
        profilePhotoObjectKey: null,
        profilePhotoData: publishedPhoto.bytes,
        status: 'APPROVED',
      },
    });
    const publishedRevision = await prisma.sellerProfileRevision.create({
      data: {
        sellerProfileId: profile.id,
        version: 1,
        status: 'APPROVED',
        slug,
        discipline: 'Керамика',
        fullName: publishedName,
        country: 'BY',
        city: 'Minsk',
        shortDescription: 'Published description',
      },
    });
    const editingRevisionId = randomUUID();
    const editingRevision = await prisma.sellerProfileRevision.create({
      data: {
        id: editingRevisionId,
        sellerProfileId: profile.id,
        version: 2,
        status: 'PENDING_REVIEW',
        slug,
        discipline: 'Керамика',
        fullName: pendingName,
        country: 'BY',
        city: 'Minsk',
        shortDescription: 'Pending description',
        submittedAt: new Date(),
        profilePhotoMimeType: pendingPhoto.mimeType,
        profilePhotoByteLength: pendingPhoto.byteLength,
        profilePhotoChecksum: pendingPhoto.checksum,
        profilePhotoObjectKey: `seller-profile-revision:${editingRevisionId}`,
        profilePhotoData: pendingPhoto.bytes,
      },
    });
    await prisma.sellerProfile.update({
      where: { id: profile.id },
      data: {
        profilePhotoObjectKey: `seller-photo:${profile.id}`,
        publishedRevisionId: publishedRevision.id,
        editingRevisionId: editingRevision.id,
      },
    });

    const product = await prisma.product.create({
      data: {
        publicId: `r${suffix}`.slice(0, 11).padEnd(11, 'a'),
        sellerProfileId: profile.id,
        categoryId: art.id,
        title: publishedTitle,
        story: 'Published story',
        status: 'APPROVED',
        publishedAt: new Date(),
        images: {
          create: [firstImage, secondImage, pendingOnlyImage].map(
            (image, position) => ({
              position,
              mimeType: image.mimeType,
              byteLength: image.byteLength,
              data: image.bytes,
              checksum: image.checksum,
              width: image.width,
              height: image.height,
            }),
          ),
        },
      },
      select: { id: true, publicId: true, images: { orderBy: { position: 'asc' } } },
    });
    const publishedWork = await prisma.productRevision.create({
      data: {
        productId: product.id,
        version: 1,
        status: 'APPROVED',
        categoryId: art.id,
        title: publishedTitle,
        story: 'Published story',
        images: {
          create: [
            { imageId: product.images[0]!.id, position: 0 },
            { imageId: product.images[1]!.id, position: 1 },
          ],
        },
      },
    });
    const pendingWork = await prisma.productRevision.create({
      data: {
        productId: product.id,
        version: 2,
        status: 'PENDING_REVIEW',
        categoryId: other.id,
        title: pendingTitle,
        story: 'Pending story',
        submittedAt: new Date(),
        images: {
          create: [
            { imageId: product.images[2]!.id, position: 0 },
            { imageId: product.images[1]!.id, position: 1 },
            { imageId: product.images[0]!.id, position: 2 },
          ],
        },
      },
    });
    await prisma.sellerProfileRevisionAchievement.create({
      data: {
        id: publishedAchievementId,
        revisionId: publishedRevision.id,
        position: 0,
        occurredAt: new Date(Date.UTC(2024, 5, 2)),
        occurredAtPrecision: 'DAY',
        body: publishedAchievementBody,
        mimeType: publishedAchievementImage.mimeType,
        byteLength: publishedAchievementImage.byteLength,
        checksum: publishedAchievementImage.checksum,
        objectKey: `seller-achievement:${publishedAchievementId}`,
        data: publishedAchievementImage.bytes,
      },
    });
    await prisma.sellerProfileRevisionAchievement.create({
      data: {
        id: pendingAchievementId,
        revisionId: editingRevision.id,
        position: 0,
        occurredAt: new Date(Date.UTC(2026, 3, 11)),
        occurredAtPrecision: 'DAY',
        body: pendingAchievementBody,
        mimeType: pendingAchievementImage.mimeType,
        byteLength: pendingAchievementImage.byteLength,
        checksum: pendingAchievementImage.checksum,
        objectKey: `seller-achievement:${pendingAchievementId}`,
        data: pendingAchievementImage.bytes,
      },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: {
        publishedRevisionId: publishedWork.id,
        editingRevisionId: pendingWork.id,
      },
    });

    return {
      admin: { ...admin, password },
      slug,
      publishedName,
      pendingName,
      publishedPhoto: publishedPhoto.bytes,
      pendingPhoto: pendingPhoto.bytes,
      publishedPhotoSize: {
        width: publishedPhoto.width,
        height: publishedPhoto.height,
      },
      pendingPhotoSize: {
        width: pendingPhoto.width,
        height: pendingPhoto.height,
      },
      sellerProfileId: profile.id,
      revisionId: editingRevision.id,
      publicId: product.publicId,
      publishedTitle,
      pendingTitle,
      publishedCategoryId: art.id,
      pendingCategoryId: other.id,
      publishedImageId: product.images[0]!.id,
      pendingImageId: product.images[1]!.id,
      pendingOnlyImageId: product.images[2]!.id,
      publishedGallery: [
        storedImage(product.images[0]!.id, firstImage),
        storedImage(product.images[1]!.id, secondImage),
      ],
      pendingGallery: [
        storedImage(product.images[2]!.id, pendingOnlyImage),
        storedImage(product.images[1]!.id, secondImage),
        storedImage(product.images[0]!.id, firstImage),
      ],
      publishedAchievement: {
        id: publishedAchievementId,
        body: publishedAchievementBody,
        bytes: publishedAchievementImage.bytes,
        width: publishedAchievementImage.width,
        height: publishedAchievementImage.height,
      },
      pendingAchievement: {
        id: pendingAchievementId,
        body: pendingAchievementBody,
        bytes: pendingAchievementImage.bytes,
        width: pendingAchievementImage.width,
        height: pendingAchievementImage.height,
      },
    };
  } finally {
    await prisma.$disconnect();
  }
}

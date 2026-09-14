const { createHash, randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const argon2 = require('argon2');

const {
  assertConnectedFigmaComparisonTarget,
  assertFigmaComparisonTarget,
} = require('./figma-comparison-target');

const FIGMA_COMPARISON_SLUG = 'vex';
const FIGMA_COMPARISON_EMAIL = 'vex@bidplace.test';
const FIXTURE_DIRECTORY = join(__dirname, 'fixtures', 'figma-comparison');
const MANIFEST = JSON.parse(
  readFileSync(join(FIXTURE_DIRECTORY, 'manifest.json'), 'utf8'),
);
const FIXTURE_USER_PASSWORD = 'figma-comparison-local-only';
const AUTHOR_IDS = {
  user: '7c0ff16a-a11e-40f1-8c0a-c0ffee00f100',
  profile: '7c0ff16a-a11e-40f1-8c0a-c0ffee00f200',
  revision: '7c0ff16a-a11e-40f1-8c0a-c0ffee00f300',
  category: '7c0ff16a-a11e-40f1-8c0a-c0ffee00f400',
};
const WORK_IDS = {
  figVexWk001: {
    product: '7c0ff16a-a11e-40f1-8c0a-c0ffee00f501',
    image: '7c0ff16a-a11e-40f1-8c0a-c0ffee00f601',
    revision: '7c0ff16a-a11e-40f1-8c0a-c0ffee00f701',
  },
  figVexWk002: {
    product: '7c0ff16a-a11e-40f1-8c0a-c0ffee00f502',
    image: '7c0ff16a-a11e-40f1-8c0a-c0ffee00f602',
    revision: '7c0ff16a-a11e-40f1-8c0a-c0ffee00f702',
  },
  figVexWk003: {
    product: '7c0ff16a-a11e-40f1-8c0a-c0ffee00f503',
    image: '7c0ff16a-a11e-40f1-8c0a-c0ffee00f603',
    revision: '7c0ff16a-a11e-40f1-8c0a-c0ffee00f703',
  },
  figVexWk004: {
    product: '7c0ff16a-a11e-40f1-8c0a-c0ffee00f504',
    image: '7c0ff16a-a11e-40f1-8c0a-c0ffee00f604',
    revision: '7c0ff16a-a11e-40f1-8c0a-c0ffee00f704',
  },
};
const ACHIEVEMENT_IDS = [
  '7c0ff16a-a11e-40f1-8c0a-c0ffee00f801',
  '7c0ff16a-a11e-40f1-8c0a-c0ffee00f802',
  '7c0ff16a-a11e-40f1-8c0a-c0ffee00f803',
];
const PUBLISHED_AT = new Date('2026-04-13T12:00:00.000Z');
const REVIEWED_AT = new Date('2026-04-02T00:00:00.000Z');
const SUBMITTED_AT = new Date('2026-04-01T00:00:00.000Z');

function readPngAsset(relativePath, expected) {
  const data = readFileSync(join(FIXTURE_DIRECTORY, relativePath));
  const checksum = createHash('sha256').update(data).digest('hex');
  if (expected.checksum && checksum !== expected.checksum) {
    throw new Error(
      `Figma comparison asset ${relativePath} checksum drifted from the handoff copy`,
    );
  }
  if (expected.byteLength && data.byteLength !== expected.byteLength) {
    throw new Error(
      `Figma comparison asset ${relativePath} byte length drifted from the handoff copy`,
    );
  }

  return {
    data,
    checksum,
    byteLength: data.byteLength,
    mimeType: 'image/png',
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
  };
}

function authorRevisionFields() {
  const author = MANIFEST.author;
  return {
    slug: author.slug,
    discipline: author.discipline,
    fullName: author.fullName,
    country: author.country,
    city: author.city,
    practice: author.practice,
    socialLink: null,
    telegramUrl: null,
    instagramUrl: null,
    websiteUrl: null,
    shortDescription: author.shortDescription,
  };
}

function authorPublicFields() {
  return {
    sellerType: 'creator',
    ...authorRevisionFields(),
  };
}

function workPublicFields(work, categoryId) {
  return {
    categoryId,
    title: work.title,
    story: null,
    technique: 'Масло',
    materials: 'Масло',
    dimensions: null,
    weight: null,
    year: null,
    condition: null,
    uniqueness: null,
    provenance: null,
    city: MANIFEST.author.city,
    packaging: null,
    deliveryInfo: null,
    creationIntro: null,
    publishedAt: PUBLISHED_AT,
    status: 'APPROVED',
  };
}

async function ensureUser(prisma) {
  const existing = await prisma.user.findUnique({
    where: { email: FIGMA_COMPARISON_EMAIL },
    include: { sellerProfile: { select: { slug: true } } },
  });
  if (existing) {
    if (
      existing.sellerProfile &&
      existing.sellerProfile.slug !== FIGMA_COMPARISON_SLUG
    ) {
      throw new Error(
        'Refusing to reuse vex@bidplace.test because it already owns another seller slug',
      );
    }

    await prisma.user.update({
      where: { id: existing.id },
      data: {
        displayName: MANIFEST.author.fullName,
        status: 'active',
        emailVerifiedAt: existing.emailVerifiedAt ?? SUBMITTED_AT,
      },
    });
    return existing.id;
  }

  const passwordHash = await argon2.hash(FIXTURE_USER_PASSWORD);
  await prisma.user.create({
    data: {
      id: AUTHOR_IDS.user,
      email: FIGMA_COMPARISON_EMAIL,
      passwordHash,
      phone: null,
      displayName: MANIFEST.author.fullName,
      role: 'user',
      status: 'active',
      emailVerifiedAt: SUBMITTED_AT,
    },
  });
  return AUTHOR_IDS.user;
}

async function ensureCategory(prisma) {
  const existing = await prisma.category.findUnique({
    where: { slug: MANIFEST.category.slug },
  });
  if (existing) {
    if (existing.name !== MANIFEST.category.name) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { name: MANIFEST.category.name },
      });
    }
    return existing.id;
  }

  await prisma.category.create({
    data: {
      id: AUTHOR_IDS.category,
      slug: MANIFEST.category.slug,
      name: MANIFEST.category.name,
      description: 'Figma comparison paintings for local/test preview only.',
    },
  });
  return AUTHOR_IDS.category;
}

function achievementCreates(revisionId, readAsset) {
  return MANIFEST.achievements.map((item, index) => {
    const id = ACHIEVEMENT_IDS[index] ?? randomUUID();
    if (!item.fileName) {
      return {
        id,
        revisionId,
        position: item.position,
        occurredAt: new Date(item.occurredAt),
        body: item.body,
      };
    }

    const image = readAsset(item.fileName, item);
    return {
      id,
      revisionId,
      position: item.position,
      occurredAt: new Date(item.occurredAt),
      body: item.body,
      mimeType: image.mimeType,
      byteLength: image.byteLength,
      checksum: image.checksum,
      objectKey: `seller-achievement:${id}`,
      data: image.data,
    };
  });
}

async function ensureAuthor(prisma, userId, photo, readAsset) {
  const bySlug = await prisma.sellerProfile.findUnique({
    where: { slug: FIGMA_COMPARISON_SLUG },
  });
  if (bySlug && bySlug.userId !== userId) {
    throw new Error(
      'Refusing to update slug vex because it belongs to another user',
    );
  }

  const publicFields = authorPublicFields();
  const revisionFields = authorRevisionFields();
  const photoFields = {
    profilePhotoMimeType: photo.mimeType,
    profilePhotoByteLength: photo.byteLength,
    profilePhotoChecksum: photo.checksum,
    profilePhotoData: photo.data,
  };

  let profile = bySlug;
  if (!profile) {
    profile = await prisma.sellerProfile.create({
      data: {
        id: AUTHOR_IDS.profile,
        userId,
        ...publicFields,
        ...photoFields,
        profilePhotoObjectKey: `seller-photo:${AUTHOR_IDS.profile}`,
        handoffContactType: 'TELEGRAM',
        handoffContactValue: '@vex_private',
        handoffInitiator: 'BUYER_CONTACTS_SELLER',
        status: 'APPROVED',
      },
    });
  } else {
    profile = await prisma.sellerProfile.update({
      where: { id: profile.id },
      data: {
        ...publicFields,
        ...photoFields,
        profilePhotoObjectKey: `seller-photo:${profile.id}`,
        handoffContactType: 'TELEGRAM',
        handoffContactValue: '@vex_private',
        status: 'APPROVED',
      },
    });
  }

  let revisionId = profile.publishedRevisionId ?? profile.editingRevisionId;
  if (!revisionId) {
    const revision = await prisma.sellerProfileRevision.create({
      data: {
        id: AUTHOR_IDS.revision,
        sellerProfileId: profile.id,
        version: 1,
        status: 'APPROVED',
        ...revisionFields,
        ...photoFields,
        profilePhotoObjectKey: `seller-profile-revision:${AUTHOR_IDS.revision}`,
        submittedAt: SUBMITTED_AT,
        reviewedAt: REVIEWED_AT,
      },
    });
    revisionId = revision.id;
  } else {
    await prisma.sellerProfileRevision.update({
      where: { id: revisionId },
      data: {
        status: 'APPROVED',
        ...revisionFields,
        ...photoFields,
        profilePhotoObjectKey: `seller-profile-revision:${revisionId}`,
        submittedAt: SUBMITTED_AT,
        reviewedAt: REVIEWED_AT,
      },
    });
  }

  for (const achievement of achievementCreates(revisionId, readAsset)) {
    const { id, ...fields } = achievement;
    await prisma.sellerProfileRevisionAchievement.upsert({
      where: { id },
      create: achievement,
      update: fields,
    });
  }

  await prisma.sellerProfile.update({
    where: { id: profile.id },
    data: {
      editingRevisionId: revisionId,
      publishedRevisionId: revisionId,
    },
  });

  return profile.id;
}

async function ensureWork(
  prisma,
  sellerProfileId,
  categoryId,
  work,
  readAsset,
) {
  const ids = WORK_IDS[work.publicId];
  const image = readAsset(work.fileName, work);
  const fields = workPublicFields(work, categoryId);
  const existing = await prisma.product.findUnique({
    where: { publicId: work.publicId },
    include: {
      images: { orderBy: { position: 'asc' } },
    },
  });

  if (existing && existing.sellerProfileId !== sellerProfileId) {
    throw new Error(
      `Refusing to update ${work.publicId} because it belongs to another seller`,
    );
  }

  let product = existing;
  if (!product) {
    product = await prisma.product.create({
      data: {
        id: ids.product,
        publicId: work.publicId,
        sellerProfileId,
        ...fields,
        images: {
          create: {
            id: ids.image,
            position: 0,
            mimeType: image.mimeType,
            byteLength: image.byteLength,
            checksum: image.checksum,
            data: image.data,
            width: image.width,
            height: image.height,
          },
        },
      },
      include: { images: { orderBy: { position: 'asc' } } },
    });
  } else {
    await prisma.product.update({
      where: { id: product.id },
      data: fields,
    });
    const cover = product.images[0];
    if (cover) {
      await prisma.productImage.update({
        where: { id: cover.id },
        data: {
          position: 0,
          mimeType: image.mimeType,
          byteLength: image.byteLength,
          checksum: image.checksum,
          data: image.data,
          width: image.width,
          height: image.height,
        },
      });
    } else {
      await prisma.productImage.create({
        data: {
          id: ids.image,
          productId: product.id,
          position: 0,
          mimeType: image.mimeType,
          byteLength: image.byteLength,
          checksum: image.checksum,
          data: image.data,
          width: image.width,
          height: image.height,
        },
      });
    }
    product = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      include: { images: { orderBy: { position: 'asc' } } },
    });
  }

  const cover = product.images[0];
  if (!cover) {
    throw new Error(`${work.publicId} is missing a cover image`);
  }

  let revisionId = product.publishedRevisionId ?? product.editingRevisionId;
  if (!revisionId) {
    const revision = await prisma.productRevision.create({
      data: {
        id: ids.revision,
        productId: product.id,
        version: 1,
        status: 'APPROVED',
        categoryId: fields.categoryId,
        title: fields.title,
        story: fields.story,
        technique: fields.technique,
        materials: fields.materials,
        dimensions: fields.dimensions,
        weight: fields.weight,
        year: fields.year,
        condition: fields.condition,
        uniqueness: fields.uniqueness,
        provenance: fields.provenance,
        city: fields.city,
        packaging: fields.packaging,
        deliveryInfo: fields.deliveryInfo,
        creationIntro: fields.creationIntro,
        submittedAt: SUBMITTED_AT,
        reviewedAt: REVIEWED_AT,
        images: {
          create: {
            imageId: cover.id,
            position: 0,
          },
        },
      },
    });
    revisionId = revision.id;
  } else {
    await prisma.productRevision.update({
      where: { id: revisionId },
      data: {
        status: 'APPROVED',
        categoryId: fields.categoryId,
        title: fields.title,
        story: fields.story,
        technique: fields.technique,
        materials: fields.materials,
        dimensions: fields.dimensions,
        weight: fields.weight,
        year: fields.year,
        condition: fields.condition,
        uniqueness: fields.uniqueness,
        provenance: fields.provenance,
        city: fields.city,
        packaging: fields.packaging,
        deliveryInfo: fields.deliveryInfo,
        creationIntro: fields.creationIntro,
        submittedAt: SUBMITTED_AT,
        reviewedAt: REVIEWED_AT,
      },
    });
    const existingLink = await prisma.productRevisionImage.findFirst({
      where: { revisionId, position: 0 },
    });
    if (existingLink) {
      if (existingLink.imageId !== cover.id) {
        await prisma.productRevisionImage.delete({
          where: {
            revisionId_imageId: {
              revisionId,
              imageId: existingLink.imageId,
            },
          },
        });
        await prisma.productRevisionImage.create({
          data: { revisionId, imageId: cover.id, position: 0 },
        });
      }
    } else {
      await prisma.productRevisionImage.create({
        data: { revisionId, imageId: cover.id, position: 0 },
      });
    }
  }

  await prisma.product.update({
    where: { id: product.id },
    data: {
      editingRevisionId: revisionId,
      publishedRevisionId: revisionId,
    },
  });

  return product.id;
}

async function syncFigmaComparisonFixture(
  prisma,
  env = process.env,
  databaseUrl,
) {
  await assertConnectedFigmaComparisonTarget(prisma, env, databaseUrl);
  const photo = readPngAsset(
    MANIFEST.author.profilePhoto.fileName,
    MANIFEST.author.profilePhoto,
  );
  const userId = await ensureUser(prisma);
  const categoryId = await ensureCategory(prisma);
  const sellerProfileId = await ensureAuthor(
    prisma,
    userId,
    photo,
    readPngAsset,
  );

  const workIds = [];
  for (const work of MANIFEST.works) {
    workIds.push(
      await ensureWork(prisma, sellerProfileId, categoryId, work, readPngAsset),
    );
  }

  const featured = await prisma.product.findUniqueOrThrow({
    where: { publicId: MANIFEST.curatorSelectionPublicId },
    select: { id: true },
  });
  await prisma.curatorSelection.upsert({
    where: { slot: 'home' },
    create: {
      slot: 'home',
      productId: featured.id,
      selectedAt: PUBLISHED_AT,
      selectedByUserId: userId,
    },
    update: {
      productId: featured.id,
      selectedAt: PUBLISHED_AT,
      selectedByUserId: userId,
    },
  });

  return verifyFigmaComparisonRecords(prisma);
}

async function verifyFigmaComparisonRecords(prisma) {
  const profile = await prisma.sellerProfile.findUniqueOrThrow({
    where: { slug: FIGMA_COMPARISON_SLUG },
    include: {
      publishedRevision: { include: { achievements: true } },
      products: {
        where: {
          publicId: { in: MANIFEST.works.map((work) => work.publicId) },
        },
        include: {
          publishedRevision: true,
          images: { orderBy: { position: 'asc' } },
        },
      },
    },
  });
  if (!profile.publishedRevision) {
    throw new Error('vex is missing a published profile revision');
  }

  const publicFields = authorPublicFields();
  const revisionFields = authorRevisionFields();
  for (const [key, value] of Object.entries(publicFields)) {
    if (profile[key] !== value) {
      throw new Error(`Profile is out of sync for ${key}`);
    }
  }
  for (const [key, value] of Object.entries(revisionFields)) {
    if (profile.publishedRevision[key] !== value) {
      throw new Error(`Published revision is out of sync for ${key}`);
    }
  }
  if (profile.profilePhotoChecksum !== MANIFEST.author.profilePhoto.checksum) {
    throw new Error('vex profile photo checksum drifted');
  }
  if (
    profile.publishedRevision.profilePhotoChecksum !==
    MANIFEST.author.profilePhoto.checksum
  ) {
    throw new Error('vex published revision photo checksum drifted');
  }

  const works = [];
  for (const expected of MANIFEST.works) {
    const product = profile.products.find(
      (item) => item.publicId === expected.publicId,
    );
    if (!product?.publishedRevision) {
      throw new Error(`${expected.publicId} is missing a published revision`);
    }
    if (product.title !== expected.title) {
      throw new Error(`${expected.publicId} title drifted`);
    }
    if (product.publishedRevision.title !== expected.title) {
      throw new Error(`${expected.publicId} published revision title drifted`);
    }
    if (product.images[0]?.checksum !== expected.checksum) {
      throw new Error(`${expected.publicId} cover checksum drifted`);
    }
    works.push({
      publicId: expected.publicId,
      checksum: expected.checksum,
    });
  }

  const selection = await prisma.curatorSelection.findUnique({
    where: { slot: 'home' },
    include: { product: { select: { publicId: true } } },
  });
  if (selection?.product.publicId !== MANIFEST.curatorSelectionPublicId) {
    throw new Error('Home curatorSelection does not point at the demo Work');
  }

  return {
    slug: FIGMA_COMPARISON_SLUG,
    publicIds: MANIFEST.works.map((work) => work.publicId),
    profilePhotoChecksum: MANIFEST.author.profilePhoto.checksum,
    works,
    achievementChecksums: MANIFEST.achievements
      .filter((item) => item.checksum)
      .map((item) => item.checksum),
    curatorSelectionPublicId: MANIFEST.curatorSelectionPublicId,
  };
}

module.exports = {
  FIGMA_COMPARISON_EMAIL,
  FIGMA_COMPARISON_SLUG,
  MANIFEST,
  assertConnectedFigmaComparisonTarget,
  assertFigmaComparisonTarget,
  syncFigmaComparisonFixture,
  verifyFigmaComparisonRecords,
};

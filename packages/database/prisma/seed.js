const { PrismaClient } = require('../dist');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const argon2 = require('argon2');

const nodeEnv = process.env.NODE_ENV ?? 'development';
const appEnv = process.env.APP_ENV ?? 'local';
const demoSeedAllowed =
  ['development', 'test'].includes(nodeEnv) &&
  appEnv === 'local' &&
  process.env.ALLOW_DESTRUCTIVE_DEMO_SEED === 'true';

if (!demoSeedAllowed) {
  throw new Error(
    'Refusing demo-bid seed outside an explicitly allowed local/test profile (NODE_ENV=development|test, APP_ENV=local, ALLOW_DESTRUCTIVE_DEMO_SEED=true)',
  );
}

const prisma = new PrismaClient();
const sellerProfileFixturesDirectory = join(
  __dirname,
  'fixtures',
  'seller-profile',
);
const productImageFixturesDirectory = join(
  __dirname,
  'fixtures',
  'product-images',
);

const VEX_SHORT_DESCRIPTION =
  'Ищу логику в абсурде.\nСтираю грань между реальностью и сном';
const VEX_BIOGRAPHY =
  'Илья Васильев — белорусский художник, чьи работы исследуют тонкие грани между реальностью и воображением. Он родился и вырос в Минске, где начал свой творческий путь. Получив академическое образование, он продолжил развивать свой уникальный стиль, сочетающий классические традиции и современное видение.';
const VEX_PRACTICE =
  'Моя практика основана на глубоком интересе к текстуре, цвету и свету. Я работаю исключительно маслом, создавая многослойные композиции, которые приглашают зрителя к размышлению и эмоциональному отклику. Каждая работа — это исследование границ восприятия и приглашение увидеть мир иначе.';
const VEX_ACHIEVEMENT_BODY =
  'Картина "Алиса в Зазеркалье" — современное произведение, представленное на выставке Кунибала Ректора, посвящённой футуристическим темам и времени.';
const OPENING_CURATOR_NOTE =
  'Тот случай, когда безупречная техника встречается с сильной идеей. Переосмысляет эстетику прошлого, создавая миры, где стирается грань реальности. Наша главная визуальная находка этой недели.';

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is required to create the deterministic local/test admin.`,
    );
  }
  return value;
}

function readSeedProductImage(fileName) {
  const data = readFileSync(join(productImageFixturesDirectory, fileName));

  return {
    byteLength: data.byteLength,
    checksum: createHash('sha256').update(data).digest('hex'),
    data,
    mimeType: 'image/png',
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
  };
}

function readSeedSellerProfileImage(fileName) {
  const data = readFileSync(join(sellerProfileFixturesDirectory, fileName));

  return {
    byteLength: data.byteLength,
    checksum: createHash('sha256').update(data).digest('hex'),
    data,
    mimeType: 'image/png',
  };
}

async function createProductWithCover({
  publicId,
  sellerProfileId,
  categoryId,
  title,
  story,
  technique,
  materials,
  dimensions,
  year,
  uniqueness,
  city,
  publishedAt,
  imageFileName,
  status = 'APPROVED',
}) {
  const image = readSeedProductImage(imageFileName);

  const product = await prisma.product.create({
    data: {
      publicId,
      sellerProfileId,
      categoryId,
      title,
      story,
      technique,
      materials,
      dimensions,
      year,
      uniqueness,
      city,
      publishedAt,
      status,
      images: {
        create: [
          {
            position: 0,
            ...image,
          },
        ],
      },
    },
  });

  await attachProductRevision(product.id, status === 'APPROVED');
  return product;
}

async function attachProductRevision(productId, published) {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    include: { images: { orderBy: { position: 'asc' } } },
  });
  const revision = await prisma.productRevision.create({
    data: {
      productId: product.id,
      version: 1,
      status: published ? 'APPROVED' : 'PENDING_REVIEW',
      categoryId: product.categoryId,
      title: product.title,
      story: product.story,
      technique: product.technique,
      materials: product.materials,
      dimensions: product.dimensions,
      weight: product.weight,
      year: product.year,
      uniqueness: product.uniqueness,
      provenance: product.provenance,
      city: product.city,
      creationIntro: product.creationIntro,
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
      publishedRevisionId: published ? revision.id : null,
    },
  });
}

async function publishSellerProfile(profile, { achievements = [] } = {}) {
  const revision = await prisma.sellerProfileRevision.create({
    data: {
      sellerProfileId: profile.id,
      version: 1,
      status: 'APPROVED',
      slug: profile.slug,
      discipline: profile.discipline,
      fullName: profile.fullName,
      country: profile.country,
      city: profile.city,
      practice: profile.practice,
      biography: profile.biography,
      socialLink: profile.socialLink,
      telegramUrl: profile.telegramUrl,
      instagramUrl: profile.instagramUrl,
      websiteUrl: profile.websiteUrl,
      shortDescription: profile.shortDescription,
      profilePhotoMimeType: profile.profilePhotoMimeType,
      profilePhotoByteLength: profile.profilePhotoByteLength,
      profilePhotoChecksum: profile.profilePhotoChecksum,
      profilePhotoData: profile.profilePhotoData,
      submittedAt: profile.createdAt,
      reviewedAt: profile.createdAt,
      achievements:
        achievements.length > 0
          ? {
              create: achievements.map((achievement, position) => ({
                position,
                occurredAt: achievement.occurredAt,
                body: achievement.body,
              })),
            }
          : undefined,
    },
  });

  await prisma.sellerProfile.update({
    where: { id: profile.id },
    data: {
      editingRevisionId: revision.id,
      publishedRevisionId: revision.id,
    },
  });
}

async function createApprovedAuthor({
  email,
  passwordHash,
  slug,
  fullName,
  discipline,
  city,
  practice,
  biography,
  shortDescription,
  photoFileName,
  createdAt,
  handle,
}) {
  const photo = readSeedSellerProfileImage(photoFileName);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      phone: null,
      displayName: fullName,
      emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  });
  const profile = await prisma.sellerProfile.create({
    data: {
      userId: user.id,
      slug,
      sellerType: 'creator',
      discipline,
      fullName,
      country: 'BY',
      city,
      practice,
      biography,
      socialLink: `https://example.com/${slug}`,
      telegramUrl: `https://t.me/${handle.replace(/^@/, '')}`,
      shortDescription,
      profilePhotoMimeType: photo.mimeType,
      profilePhotoByteLength: photo.byteLength,
      profilePhotoChecksum: photo.checksum,
      profilePhotoData: photo.data,
      handoffContactType: 'TELEGRAM',
      handoffContactValue: handle,
      handoffInitiator: 'BUYER_CONTACTS_SELLER',
      status: 'APPROVED',
      createdAt,
    },
  });
  return { user, profile };
}

async function main() {
  const adminEmail = requiredEnvironment('SEED_ADMIN_EMAIL');
  const adminPassword = requiredEnvironment('SEED_ADMIN_PASSWORD');
  const adminPasswordHash = await argon2.hash(adminPassword);

  await prisma.auditEvent.deleteMany();
  await prisma.termsAcceptance.deleteMany();
  await prisma.emailVerificationCode.deleteMany();
  await prisma.phoneVerificationCode.deleteMany();
  await prisma.order.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.auctionRules.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.curatorSelection.deleteMany();
  await prisma.sellerProfile.updateMany({
    data: { editingRevisionId: null, publishedRevisionId: null },
  });
  await prisma.product.updateMany({
    data: { editingRevisionId: null, publishedRevisionId: null },
  });
  await prisma.productRevision.deleteMany();
  await prisma.sellerProfileRevision.deleteMany();
  await prisma.productCreationStep.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const category = await prisma.category.create({
    data: {
      slug: 'art-object',
      name: 'Авторские работы',
      description: 'Работы, созданные и предложенные авторами напрямую.',
    },
  });

  const [admin, buyer, pendingSeller] = await Promise.all([
    prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminPasswordHash,
        phone: '+375290000001',
        displayName: 'Local Admin',
        role: 'admin',
        emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    }),
    prisma.user.create({
      data: {
        email: 'buyer@bidplace.test',
        passwordHash: adminPasswordHash,
        phone: null,
        displayName: 'Тестовый покупатель',
        emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    }),
    prisma.user.create({
      data: {
        email: 'pending-seller@bidplace.test',
        passwordHash: adminPasswordHash,
        phone: null,
        displayName: 'Заявка на проверку',
        emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    }),
  ]);

  const pendingPhoto = readSeedSellerProfileImage('pixelp-placeholder.png');
  const pendingSellerProfile = await prisma.sellerProfile.create({
    data: {
      userId: pendingSeller.id,
      slug: 'pending-seller',
      sellerType: 'creator',
      discipline: 'Живопись',
      fullName: 'Заявка на проверку',
      country: 'BY',
      socialLink: 'https://example.com/pending-seller',
      shortDescription: 'Профиль продавца для проверки очереди модерации.',
      profilePhotoMimeType: pendingPhoto.mimeType,
      profilePhotoByteLength: pendingPhoto.byteLength,
      profilePhotoChecksum: pendingPhoto.checksum,
      profilePhotoData: pendingPhoto.data,
      handoffContactType: 'TELEGRAM',
      handoffContactValue: '@pending_seller',
      handoffInitiator: 'BUYER_CONTACTS_SELLER',
      status: 'PENDING_REVIEW',
    },
  });

  // createdAt DESC for Home.newAuthors: vex, quantumparadox, havoc, bala_klava, then pixelp.
  const vex = await createApprovedAuthor({
    email: 'seller@bidplace.test',
    passwordHash: adminPasswordHash,
    slug: 'vex',
    fullName: 'Илья Васильев',
    discipline: 'Художник',
    city: 'Минск',
    practice: VEX_PRACTICE,
    biography: VEX_BIOGRAPHY,
    shortDescription: VEX_SHORT_DESCRIPTION,
    photoFileName: 'vex.png',
    createdAt: new Date('2026-09-04T12:00:00.000Z'),
    handle: '@vex',
  });
  const quantumparadox = await createApprovedAuthor({
    email: 'quantumparadox@bidplace.test',
    passwordHash: adminPasswordHash,
    slug: 'quantumparadox',
    fullName: 'Анастасия Винова',
    discipline: 'Живопись',
    city: 'Гродно',
    practice:
      'Пишу цвет и свет плотными слоями. Demo copy: Figma catalog chips were reused junk, so this practice is invented.',
    biography: null,
    shortDescription:
      'Собираю цвет в плотные плоскости. Demo copy: not in Figma About.',
    photoFileName: 'quantumparadox.png',
    createdAt: new Date('2026-09-03T12:00:00.000Z'),
    handle: '@quantumparadox',
  });
  const havoc = await createApprovedAuthor({
    email: 'havoc@bidplace.test',
    passwordHash: adminPasswordHash,
    slug: 'havoc',
    fullName: 'Константин Константинович',
    discipline: 'Предметный дизайн',
    city: 'Брест',
    practice:
      'Проверяю цвет и калибровку на предметных съёмках. Demo copy: not in Figma About.',
    biography: null,
    shortDescription:
      'Сверяю цвет до последней плоскости. Demo copy: not in Figma About.',
    photoFileName: 'havoc.png',
    createdAt: new Date('2026-09-02T12:00:00.000Z'),
    handle: '@havoc',
  });
  const balaKlava = await createApprovedAuthor({
    email: 'bala_klava@bidplace.test',
    passwordHash: adminPasswordHash,
    slug: 'bala_klava',
    fullName: 'Клавдия Агаповна',
    discipline: 'Живопись',
    city: 'Витебск',
    practice:
      'Пишу серии и предметные натюрморты. Demo copy: not in Figma About.',
    biography: null,
    shortDescription:
      'Держу серию в одном жесте. Demo copy: not in Figma About.',
    photoFileName: 'bala_klava.png',
    createdAt: new Date('2026-09-01T12:00:00.000Z'),
    handle: '@bala_klava',
  });
  const pixelp = await createApprovedAuthor({
    email: 'pixelp@bidplace.test',
    passwordHash: adminPasswordHash,
    slug: 'pixelp',
    fullName: 'Павел Пиксель',
    discipline: 'Коллекционер',
    city: 'Минск',
    practice:
      'Собираю изображение так, чтобы оно зазвучало. Demo copy: pixelp is not in the Figma authors catalog.',
    biography: null,
    shortDescription:
      'Собираю изображение так, чтобы оно зазвучало. Demo copy: invented display name and bio; not in Figma authors catalog.',
    photoFileName: 'pixelp-placeholder.png',
    createdAt: new Date('2026-08-01T12:00:00.000Z'),
    handle: '@pixelp',
  });

  const achievementDate = new Date('2026-04-01T00:00:00.000Z');
  await publishSellerProfile(vex.profile, {
    achievements: [
      { occurredAt: achievementDate, body: VEX_ACHIEVEMENT_BODY },
      { occurredAt: achievementDate, body: VEX_ACHIEVEMENT_BODY },
    ],
  });
  await Promise.all([
    publishSellerProfile(quantumparadox.profile),
    publishSellerProfile(havoc.profile),
    publishSellerProfile(balaKlava.profile),
    publishSellerProfile(pixelp.profile),
  ]);

  const dali = await createProductWithCover({
    publicId: 'daliEstate1',
    sellerProfileId: pixelp.profile.id,
    categoryId: category.id,
    title: 'Salvador Dalí Estate & Fundació Gala Сальвадор Дали',
    story:
      'Открытие недели: работа из каталога Figma. Demo copy: technique/story are not labeled on the Figma card.',
    technique: 'Масло, смешанная техника. Demo copy.',
    materials: 'Холст, масло. Demo copy.',
    dimensions: 'Не указаны в Figma. Demo copy.',
    year: 2024,
    uniqueness: 'Единственный экземпляр. Demo copy.',
    city: 'Минск',
    publishedAt: new Date('2026-08-20T12:00:00.000Z'),
    imageFileName: 'dali-estate.png',
  });
  await createProductWithCover({
    publicId: 'caricature1',
    sellerProfileId: balaKlava.profile.id,
    categoryId: category.id,
    title: 'Картина по фото в стиле шарж',
    story: 'Портрет по фото в шарже. Demo copy: not on the Figma card.',
    technique: 'Графика. Demo copy.',
    materials: 'Бумага, пигмент. Demo copy.',
    city: 'Витебск',
    publishedAt: new Date('2026-09-10T12:00:00.000Z'),
    imageFileName: 'caricature.png',
  });
  await createProductWithCover({
    publicId: 'yellowSapph',
    sellerProfileId: quantumparadox.profile.id,
    categoryId: category.id,
    title: 'Желтый сапфир',
    story: 'Цвет собран в одну плоскость. Demo copy: not on the Figma card.',
    technique: 'Живопись. Demo copy.',
    materials: 'Холст, масло. Demo copy.',
    city: 'Гродно',
    publishedAt: new Date('2026-09-09T12:00:00.000Z'),
    imageFileName: 'yellow-sapphire.png',
  });
  await createProductWithCover({
    publicId: 'colorCalib1',
    sellerProfileId: havoc.profile.id,
    categoryId: category.id,
    title: 'Color calibration',
    story: 'Калибровка цвета на предметной съёмке. Demo copy.',
    technique: 'Предметная съёмка. Demo copy.',
    materials: 'Печать. Demo copy.',
    city: 'Брест',
    publishedAt: new Date('2026-09-08T12:00:00.000Z'),
    imageFileName: 'color-calibration.png',
  });
  await createProductWithCover({
    publicId: 'rainbowMask',
    sellerProfileId: balaKlava.profile.id,
    categoryId: category.id,
    title: 'Радуга (Mask Series 1997 no.8)',
    story: 'Серия масок. Demo copy: Home «Новые работы» title from Figma.',
    technique: 'Живопись. Demo copy.',
    materials: 'Холст, масло. Demo copy.',
    city: 'Витебск',
    publishedAt: new Date('2026-09-13T12:00:00.000Z'),
    imageFileName: 'rainbow-mask.png',
  });
  await createProductWithCover({
    publicId: 'blossomVase',
    sellerProfileId: balaKlava.profile.id,
    categoryId: category.id,
    title: 'Ваза "Блоссом"',
    story: 'Предметная ваза. Demo copy: Home «Новые работы» title from Figma.',
    technique: 'Предмет. Demo copy.',
    materials: 'Керамика. Demo copy.',
    city: 'Витебск',
    publishedAt: new Date('2026-09-12T12:00:00.000Z'),
    imageFileName: 'blossom-vase.png',
  });
  await createProductWithCover({
    publicId: 'memoryWork1',
    sellerProfileId: balaKlava.profile.id,
    categoryId: category.id,
    title: 'Память',
    story: 'Фигура в интерьере. Demo copy: Home «Новые работы» title from Figma.',
    technique: 'Живопись. Demo copy.',
    materials: 'Холст, масло. Demo copy.',
    city: 'Витебск',
    publishedAt: new Date('2026-09-11T12:00:00.000Z'),
    imageFileName: 'memory.png',
  });

  await createProductWithCover({
    publicId: 'seedPend004',
    sellerProfileId: pendingSellerProfile.id,
    categoryId: category.id,
    title: 'Этюд «Тихий свет»',
    story: 'Предмет ожидает проверки перед публикацией.',
    technique: 'Ручная роспись',
    city: 'Минск',
    publishedAt: null,
    imageFileName: 'pending-placeholder.png',
    status: 'PENDING_REVIEW',
  });

  await prisma.curatorSelection.create({
    data: {
      slot: 'home',
      productId: dali.id,
      curatorSellerProfileId: vex.profile.id,
      note: OPENING_CURATOR_NOTE,
      selectedAt: new Date('2026-09-14T12:00:00.000Z'),
      selectedByUserId: admin.id,
    },
  });

  console.log(
    'Seeded Figma local demo: admin, buyer login, pending-seller, catalog authors vex/quantumparadox/havoc/bala_klava, pixelp as Dali owner, seven public works, no listings/bids/orders, Opening curator=vex work=daliEstate1.',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

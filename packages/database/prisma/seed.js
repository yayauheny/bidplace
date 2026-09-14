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

// Public strings below are production-quality demo copy. Invented Figma gaps
// stay in these comments only — never in user-facing biography/story/technique.
const VEX_SHORT_DESCRIPTION =
  'Ищу логику в абсурде.\nСтираю грань между реальностью и сном';
const VEX_BIOGRAPHY =
  'Илья Васильев — художник из Минска. В своих работах он исследует границу между знакомыми образами и ощущением сна, соединяя реалистичные детали с неожиданными формами и пространствами.';
const VEX_PRACTICE =
  'Работа начинается с наблюдения и небольших эскизов. Илья собирает визуальные фрагменты, экспериментирует с цветом и светом, а затем постепенно соединяет их в цельную композицию. Его интересует момент, когда привычный образ начинает восприниматься иначе.';
const PIXELP_SHORT_DESCRIPTION =
  'Соединяю классические мотивы с современным цветом.';
const PIXELP_BIOGRAPHY =
  'Павел работает с живописью и цифровыми образами, исследуя, как классическая визуальная культура меняется в современном контексте. Его работы строятся на сочетании узнаваемых мотивов, насыщенного цвета и сюрреалистичных деталей.';
const PIXELP_PRACTICE =
  'В основе работ — коллажный подход: Павел собирает референсы, делает серию эскизов и постепенно переносит композицию на большой формат. Особое внимание он уделяет цвету, фактуре поверхности и взаимодействию объектов внутри пространства.';
const OPENING_CURATOR_NOTE =
  'Тот случай, когда безупречная техника встречается с сильной идеей. Переосмысляет эстетику прошлого, создавая миры, где стирается грань реальности. Наша главная визуальная находка этой недели.';
const DALI_STORY = `Работа построена вокруг образа, который одновременно кажется знакомым и невозможным. Плавные органические формы появляются на фоне почти классического пейзажа и постепенно превращают его в пространство сна.

В процессе автор несколько раз менял композицию, добиваясь ощущения движения и глубины. Контраст холодных форм и насыщенного жёлтого света стал центральным элементом финальной версии.`;
const MEMORY_STORY = `Серия началась с небольших пластических этюдов человеческого лица. Автор постепенно упрощал форму, оставляя только фрагменты, которые сильнее всего связаны с ощущением памяти и узнавания.

Финальная работа соединяет несколько лиц в единую форму: одни черты проявляются сразу, другие становятся заметны только при изменении угла зрения.`;
const COLOR_STORY = `Основой работы стала серия экспериментов с цветом. Автор собирал сочетания оттенков, наблюдая, как небольшое изменение насыщенности полностью меняет восприятие композиции.

Финальная версия сохраняет часть этих тестов и превращает технический процесс настройки цвета в самостоятельный визуальный образ.`;
const GRAPHIC_STORY = `Работа появилась из серии быстрых набросков. Автор сохранял случайные линии и несовершенства, постепенно объединяя их в более сложную композицию.

В финале первоначальный рисунок остался заметен под новыми слоями и стал частью фактуры изображения.`;
const ALICE_STORY = `Композиция собрана как оптический взгляд сквозь стекло: привычный свет распадается на кольца цвета и собирается снова уже в другом порядке.

Автор несколько раз менял угол пересечения плоскостей, пока пространство не начало читаться одновременно как объект и как отражение.`;
const BETWEEN_STORY = `Фигуры держат общую плоскость цвета и почти не показывают лиц. Жест руки становится главным событием кадра: касание, защита и поддержка происходят в одном движении.

Работа собиралась из нескольких цветовых эскизов. Финальная версия оставляет только те сочетания, которые держат напряжение без лишних деталей.`;
const RAINBOW_STORY = `Серия масок началась с повторяющегося профиля. Автор смещал цвет от лица к лицу, пока ритм не собрался в одну горизонталь.

В финале одинаковые черты читаются по-разному из-за сдвигов красного, голубого и жёлтого. Повтор становится способом увидеть, как меняется узнавание.`;
const BLOSSOM_STORY = `Ваза собрана из трёх объёмов, в каждом из которых спрятано лицо. Трещины глазури остаются видимыми: это не дефект, а след обжига и часть поверхности.

Автор искал баланс между предметом и скульптурой, пока сосуд не начал читаться как несколько фигур, сложенных в один объект.`;
const SAPPHIRE_STORY = `Камень написан как источник света, а не как ювелирный объект. Автор собирал жёлтые плоскости до тех пор, пока объём не начал светиться изнутри.

Финальная композиция держит камень в центре и оставляет вокруг него только те цветовые поля, которые усиливают этот внутренний свет.`;

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

function readSeedFixtureImage(relativePath) {
  const data = readFileSync(join(__dirname, 'fixtures', relativePath));

  return {
    byteLength: data.byteLength,
    checksum: createHash('sha256').update(data).digest('hex'),
    data,
    mimeType: 'image/png',
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
  detailFileName,
  status = 'APPROVED',
}) {
  const covers = [
    { position: 0, ...readSeedProductImage(imageFileName) },
    ...(detailFileName
      ? [{ position: 1, ...readSeedProductImage(detailFileName) }]
      : []),
  ];

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
        create: covers,
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
              create: achievements.map((achievement, position) => {
                const image = achievement.imageRelativePath
                  ? readSeedFixtureImage(achievement.imageRelativePath)
                  : null;
                return {
                  position,
                  occurredAt: achievement.occurredAt,
                  body: achievement.body,
                  ...(image
                    ? {
                        mimeType: image.mimeType,
                        byteLength: image.byteLength,
                        checksum: image.checksum,
                        data: image.data,
                      }
                    : {}),
                };
              }),
            }
          : undefined,
    },
  });

  const imagedAchievements =
    await prisma.sellerProfileRevisionAchievement.findMany({
      where: { revisionId: revision.id, data: { not: null } },
      select: { id: true },
    });
  await Promise.all(
    imagedAchievements.map((achievement) =>
      prisma.sellerProfileRevisionAchievement.update({
        where: { id: achievement.id },
        data: { objectKey: `seller-achievement:${achievement.id}` },
      }),
    ),
  );

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

  const pendingPhoto = readSeedSellerProfileImage('pending-seller.png');
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
      'Процесс строится вокруг серии цветовых проб и эскизов. Анастасия постепенно уточняет композицию, оставляя пространство для случайных сочетаний оттенков и фактур.',
    biography:
      'Анастасия исследует цвет, материал и оптические эффекты. В её работах строгая композиция соединяется с яркими визуальными акцентами и ощущением движения.',
    shortDescription: 'Собираю цвет в плотные светящиеся плоскости.',
    photoFileName: 'quantumparadox.png',
    createdAt: new Date('2026-09-03T12:00:00.000Z'),
    handle: '@quantumparadox',
  });
  const havoc = await createApprovedAuthor({
    email: 'havoc@bidplace.test',
    passwordHash: adminPasswordHash,
    slug: 'havoc',
    fullName: 'Константин Константинович',
    discipline: 'Цифровая графика',
    city: 'Брест',
    practice:
      'Он начинает с цифровых экспериментов, искажений и цветовых тестов, после чего отбирает наиболее выразительные фрагменты и собирает из них финальную композицию.',
    biography:
      'Константин работает с цифровой графикой и смешанными медиа. Его интересуют визуальный шум, ошибки изображения и эстетика технологических процессов.',
    shortDescription: 'Собираю изображение из сбоев цвета и света.',
    photoFileName: 'havoc.png',
    createdAt: new Date('2026-09-02T12:00:00.000Z'),
    handle: '@havoc',
  });
  const balaKlava = await createApprovedAuthor({
    email: 'bala_klava@bidplace.test',
    passwordHash: adminPasswordHash,
    slug: 'bala_klava',
    fullName: 'Клавдия Агаповна',
    discipline: 'Скульптура',
    city: 'Витебск',
    practice:
      'Работы развиваются от небольших пластических набросков к полноразмерным объектам. В процессе Клавдия экспериментирует с формой, поверхностью и светом, сохраняя следы ручной работы как часть произведения.',
    biography:
      'Клавдия работает на границе скульптуры и визуального искусства. Её интересуют память, телесность и то, как знакомые человеческие формы меняются под воздействием времени и восприятия.',
    shortDescription: 'Собираю форму из памяти и касания.',
    photoFileName: 'bala_klava.png',
    createdAt: new Date('2026-09-01T12:00:00.000Z'),
    handle: '@bala_klava',
  });
  const pixelp = await createApprovedAuthor({
    email: 'pixelp@bidplace.test',
    passwordHash: adminPasswordHash,
    slug: 'pixelp',
    fullName: 'Павел Пиксель',
    discipline: 'Художник',
    city: 'Минск',
    practice: PIXELP_PRACTICE,
    biography: PIXELP_BIOGRAPHY,
    shortDescription: PIXELP_SHORT_DESCRIPTION,
    photoFileName: 'pixelp.png',
    createdAt: new Date('2026-08-01T12:00:00.000Z'),
    handle: '@pixelp',
  });

  await publishSellerProfile(vex.profile, {
    achievements: [
      {
        occurredAt: new Date('2026-04-01T00:00:00.000Z'),
        body: '«Алиса в Зазеркалье»\nРабота представлена на групповой выставке, посвящённой современным интерпретациям сюрреализма и теме изменённого восприятия пространства.',
        // Same-work detail crop of unused Figma search-grid fill, not the cover.
        // Figma has no isolated exhibition-install photograph for this event.
        imageRelativePath: 'product-images/alice-glass-detail.png',
      },
      {
        occurredAt: new Date('2025-09-01T00:00:00.000Z'),
        body: '«Между сном и формой»\nПерсональная серия работ была показана в Минске. В экспозицию вошли живописные и графические произведения последних двух лет.',
        // Same-work 3:4 crop of the Figma search-grid fill, not the cover.
        // No separate exhibition photograph exists in the Figma file.
        imageRelativePath: 'product-images/between-form-detail.png',
      },
    ],
  });
  await Promise.all([
    publishSellerProfile(quantumparadox.profile),
    publishSellerProfile(havoc.profile),
    publishSellerProfile(balaKlava.profile),
    publishSellerProfile(pixelp.profile, {
      achievements: [
        {
          occurredAt: new Date('2025-11-01T00:00:00.000Z'),
          body: '«После классики»\nГрупповая выставка в Минске, где Павел показал живопись, собранную вокруг узнаваемых мотивов и современного цвета.',
          // Figma History raw fill 437:3989 (Spectre / crutches Dali), not
          // Opening cover dali-estate.png. Thematically “after classics”.
          imageRelativePath: 'seller-achievements/pixelp-after-classics.png',
        },
      ],
    }),
  ]);

  const unique = 'Единственный экземпляр';
  const dali = await createProductWithCover({
    publicId: 'daliEstate1',
    sellerProfileId: pixelp.profile.id,
    categoryId: category.id,
    title: 'Salvador Dalí Estate & Fundació Gala Сальвадор Дали',
    story: DALI_STORY,
    technique: 'Живопись',
    materials: 'Холст, масло',
    dimensions: '80 × 100 см',
    year: 2024,
    uniqueness: unique,
    city: 'Минск',
    publishedAt: new Date('2026-08-20T12:00:00.000Z'),
    imageFileName: 'dali-estate.png',
    detailFileName: 'dali-estate-detail.png',
  });
  await createProductWithCover({
    publicId: 'caricature1',
    sellerProfileId: balaKlava.profile.id,
    categoryId: category.id,
    title: 'Картина по фото в стиле шарж',
    story: GRAPHIC_STORY,
    technique: 'Графика',
    materials: 'Бумага, пигмент',
    dimensions: '40 × 50 см',
    year: 2025,
    uniqueness: unique,
    city: 'Витебск',
    publishedAt: new Date('2026-09-10T12:00:00.000Z'),
    imageFileName: 'caricature.png',
    detailFileName: 'caricature-detail.png',
  });
  await createProductWithCover({
    publicId: 'yellowSapph',
    sellerProfileId: quantumparadox.profile.id,
    categoryId: category.id,
    title: 'Желтый сапфир',
    story: SAPPHIRE_STORY,
    technique: 'Живопись',
    materials: 'Холст, масло',
    dimensions: '70 × 90 см',
    year: 2025,
    uniqueness: unique,
    city: 'Гродно',
    publishedAt: new Date('2026-09-09T12:00:00.000Z'),
    imageFileName: 'yellow-sapphire.png',
    detailFileName: 'yellow-sapphire-detail.png',
  });
  await createProductWithCover({
    publicId: 'colorCalib1',
    sellerProfileId: havoc.profile.id,
    categoryId: category.id,
    title: 'Color calibration',
    story: COLOR_STORY,
    technique: 'Цифровая графика',
    materials: 'Пигментная печать',
    dimensions: '50 × 50 см',
    year: 2025,
    uniqueness: unique,
    city: 'Брест',
    publishedAt: new Date('2026-09-08T12:00:00.000Z'),
    imageFileName: 'color-calibration.png',
    detailFileName: 'color-calibration-detail.png',
  });
  await createProductWithCover({
    publicId: 'rainbowMask',
    sellerProfileId: balaKlava.profile.id,
    categoryId: category.id,
    title: 'Радуга (Mask Series 1997 no.8)',
    story: RAINBOW_STORY,
    technique: 'Живопись',
    materials: 'Холст, масло',
    dimensions: '90 × 120 см',
    year: 2024,
    uniqueness: unique,
    city: 'Витебск',
    publishedAt: new Date('2026-09-13T12:00:00.000Z'),
    imageFileName: 'rainbow-mask.png',
    detailFileName: 'rainbow-mask-detail.png',
  });
  await createProductWithCover({
    publicId: 'blossomVase',
    sellerProfileId: balaKlava.profile.id,
    categoryId: category.id,
    title: 'Ваза "Блоссом"',
    story: BLOSSOM_STORY,
    technique: 'Скульптура',
    materials: 'Керамика',
    dimensions: '28 × 18 см',
    year: 2025,
    uniqueness: unique,
    city: 'Витебск',
    publishedAt: new Date('2026-09-12T12:00:00.000Z'),
    imageFileName: 'blossom-vase.png',
    detailFileName: 'blossom-vase-detail.png',
  });
  await createProductWithCover({
    publicId: 'memoryWork1',
    sellerProfileId: balaKlava.profile.id,
    categoryId: category.id,
    title: 'Память',
    story: MEMORY_STORY,
    technique: 'Скульптура',
    materials: 'Смешанная техника',
    dimensions: '42 × 36 × 28 см',
    year: 2025,
    uniqueness: unique,
    city: 'Витебск',
    publishedAt: new Date('2026-09-11T12:00:00.000Z'),
    imageFileName: 'memory.png',
    detailFileName: 'memory-detail.png',
  });
  // Demo ownership: Figma does not assign these works to vex. Used so the
  // curator profile is a complete public author, without moving Dali off pixelp.
  await createProductWithCover({
    publicId: 'aliceGlass1',
    sellerProfileId: vex.profile.id,
    categoryId: category.id,
    title: 'Алиса в Зазеркалье',
    story: ALICE_STORY,
    technique: 'Смешанная техника',
    materials: 'Стекло, пигмент',
    dimensions: '90 × 120 см',
    year: 2026,
    uniqueness: unique,
    city: 'Минск',
    publishedAt: new Date('2026-09-14T12:00:00.000Z'),
    imageFileName: 'alice-glass.png',
    detailFileName: 'alice-glass-detail.png',
  });
  await createProductWithCover({
    publicId: 'sleepForm01',
    sellerProfileId: vex.profile.id,
    categoryId: category.id,
    title: 'Между сном и формой',
    story: BETWEEN_STORY,
    technique: 'Живопись',
    materials: 'Холст, акрил',
    dimensions: '100 × 100 см',
    year: 2025,
    uniqueness: unique,
    city: 'Минск',
    publishedAt: new Date('2026-08-16T12:00:00.000Z'),
    imageFileName: 'between-form.png',
    detailFileName: 'between-form-detail.png',
  });

  await createProductWithCover({
    publicId: 'seedPend004',
    sellerProfileId: pendingSellerProfile.id,
    categoryId: category.id,
    title: 'Этюд «Тихий свет»',
    story: 'Натюрморт с утренним светом на столе у окна.',
    technique: 'Живопись',
    materials: 'Холст, масло',
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
    'Seeded Figma local demo: Opening curator=vex work=daliEstate1 owner=pixelp; vex aliceGlass1 is newest so Home.newWorks includes a vex-owned work; no listings/bids/orders.',
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

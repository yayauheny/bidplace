const { Prisma, PrismaClient } = require('../dist');
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
const money = (value) => new Prisma.Decimal(value);
const seedPhotoBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO0nM9sAAAAASUVORK5CYII=',
  'base64',
);
const annaMorozovaPhotoBuffer = readFileSync(
  join(__dirname, 'fixtures', 'seller-profile', 'anna-morozova.png'),
);
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

async function attachSellerProfileRevision(profile, extras = {}) {
  const status = profile.status === 'APPROVED' ? 'APPROVED' : 'PENDING_REVIEW';
  const revision = await prisma.sellerProfileRevision.create({
    data: {
      sellerProfileId: profile.id,
      version: 1,
      status,
      slug: profile.slug,
      discipline: profile.discipline,
      fullName: profile.fullName,
      country: profile.country,
      city: profile.city,
      practice: profile.practice,
      socialLink: profile.socialLink,
      telegramUrl: profile.telegramUrl,
      instagramUrl: profile.instagramUrl,
      websiteUrl: profile.websiteUrl,
      shortDescription: profile.shortDescription,
      profilePhotoMimeType: profile.profilePhotoMimeType,
      profilePhotoByteLength: profile.profilePhotoByteLength,
      profilePhotoChecksum: profile.profilePhotoChecksum,
      profilePhotoObjectKey: `seller-photo:${profile.id}`,
      profilePhotoData: profile.profilePhotoData,
      submittedAt: new Date('2026-01-01T00:00:00.000Z'),
      reviewedAt:
        status === 'APPROVED' ? new Date('2026-01-02T00:00:00.000Z') : null,
      achievements: extras.achievements
        ? { create: extras.achievements }
        : undefined,
    },
  });

  await prisma.sellerProfile.update({
    where: { id: profile.id },
    data: {
      profilePhotoObjectKey: `seller-photo:${profile.id}`,
      editingRevisionId: revision.id,
      publishedRevisionId: status === 'APPROVED' ? revision.id : null,
    },
  });
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
      condition: product.condition,
      uniqueness: product.uniqueness,
      provenance: product.provenance,
      city: product.city,
      packaging: product.packaging,
      deliveryInfo: product.deliveryInfo,
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

function readSeedSellerProfileImage(fileName) {
  const data = readFileSync(join(sellerProfileFixturesDirectory, fileName));

  return {
    byteLength: data.byteLength,
    checksum: createHash('sha256').update(data).digest('hex'),
    data,
    mimeType: 'image/png',
  };
}

async function createProductWithImages({
  publicId,
  sellerProfileId,
  categoryId,
  title,
  story,
  technique,
  materials,
  dimensions,
  year,
  condition,
  uniqueness,
  provenance,
  city,
  packaging,
  deliveryInfo,
  publishedAt,
  imageFileName,
  creationSteps = [
    [
      'Замысел',
      'Работа начинается с наблюдения за формой и светом.',
      'painted-planter.png',
    ],
    [
      'Материал',
      'Автор выбирает материал и собирает первые пропорции вручную.',
      'ceramic-brush-holder.png',
    ],
    [
      'Ручная работа',
      'Поверхность создаётся небольшими последовательными жестами.',
      'handmade-mug.png',
    ],
    [
      'Финальный предмет',
      'После обработки предмет готовится к передаче новому владельцу.',
      'handmade-vase.png',
    ],
  ],
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
      condition,
      uniqueness,
      provenance,
      city,
      packaging,
      deliveryInfo,
      creationIntro:
        'История предмета — от первого замысла до готовой работы в мастерской автора.',
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
      creationSteps: {
        create: creationSteps.map(([title, body, fileName], position) => {
          const stepImage = readSeedProductImage(fileName);
          return {
            position,
            title,
            body,
            mimeType: stepImage.mimeType,
            byteLength: stepImage.byteLength,
            data: stepImage.data,
            checksum: stepImage.checksum,
            width: stepImage.width,
            height: stepImage.height,
          };
        }),
      },
    },
  });

  await attachProductRevision(product.id, status === 'APPROVED');
  return product;
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
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const category = await prisma.category.create({
    data: {
      slug: 'art-object',
      name: 'Авторская керамика',
      description: 'Предметы, созданные и предложенные авторами напрямую.',
    },
  });

  const [admin, seller, buyer, pendingSeller] = await Promise.all([
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
        email: 'seller@bidplace.test',
        passwordHash: adminPasswordHash,
        phone: null,
        displayName: 'Анна Морозова',
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

  const sellerProfile = await prisma.sellerProfile.create({
    data: {
      userId: seller.id,
      slug: 'anna-morozova',
      sellerType: 'creator',
      discipline: 'Керамика, скульптура',
      fullName: 'Анна Морозова',
      country: 'BY',
      city: 'Минск',
      practice:
        'Работаю с глиной и глазурью в небольшой минской мастерской. Предметы собираю вручную небольшими сериями и единственными экземплярами.',
      socialLink: 'https://example.com/anna-morozova',
      telegramUrl: 'https://t.me/anna_morozova',
      instagramUrl: 'https://instagram.com/anna_morozova',
      websiteUrl: 'https://anna-morozova.example.com',
      shortDescription:
        'Керамистка из Минска. Создаёт небольшие предметы для дома вручную.',
      profilePhotoMimeType: 'image/png',
      profilePhotoByteLength: annaMorozovaPhotoBuffer.byteLength,
      profilePhotoChecksum: createHash('sha256')
        .update(annaMorozovaPhotoBuffer)
        .digest('hex'),
      profilePhotoData: annaMorozovaPhotoBuffer,
      handoffContactType: 'TELEGRAM',
      handoffContactValue: '@anna_morozova',
      handoffInitiator: 'BUYER_CONTACTS_SELLER',
      status: 'APPROVED',
    },
  });
  await attachSellerProfileRevision(sellerProfile, {
    achievements: [
      {
        position: 0,
        occurredAt: new Date('2024-09-01T00:00:00.000Z'),
        body: 'Персональная выставка «Тёплый ритм» в Минске.',
      },
      {
        position: 1,
        occurredAt: new Date('2025-03-15T00:00:00.000Z'),
        body: 'Групповой показ керамики в мастерской на Октябрьской.',
      },
    ],
  });

  const pendingSellerProfile = await prisma.sellerProfile.create({
    data: {
      userId: pendingSeller.id,
      slug: 'pending-seller',
      sellerType: 'creator',
      discipline: 'Живопись',
      fullName: 'Заявка на проверку',
      country: 'BY',
      city: 'Минск',
      socialLink: 'https://example.com/pending-seller',
      shortDescription: 'Профиль продавца для проверки очереди модерации.',
      profilePhotoMimeType: 'image/png',
      profilePhotoByteLength: seedPhotoBuffer.byteLength,
      profilePhotoChecksum: createHash('sha256')
        .update(seedPhotoBuffer)
        .digest('hex'),
      profilePhotoData: seedPhotoBuffer,
      handoffContactType: 'TELEGRAM',
      handoffContactValue: '@pending_seller',
      handoffInitiator: 'BUYER_CONTACTS_SELLER',
      status: 'PENDING_REVIEW',
    },
  });
  await attachSellerProfileRevision(pendingSellerProfile);

  const additionalDemoCreators = [
    {
      email: 'irina-levchenko@bidplace.test',
      slug: 'irina-levchenko',
      fullName: 'Ирина Левченко',
      discipline: 'Керамика, глазурь',
      description: 'Создаёт тихие предметы из глины для повседневных ритуалов.',
      practice: 'Леплю небольшие сосуды и оставляю следы руки на поверхности.',
      handle: '@irina_levchenko',
      photoFileName: 'irina-levchenko.png',
    },
    {
      email: 'pavel-sokolov@bidplace.test',
      slug: 'pavel-sokolov',
      fullName: 'Павел Соколов',
      discipline: 'Предметный дизайн, дерево',
      description: 'Исследует честные материалы и простые формы для дома.',
      practice: 'Собираю предметы из дерева и стекла без декоративного шума.',
      handle: '@pavel_sokolov',
      photoFileName: 'pavel-sokolov.png',
    },
    {
      email: 'olga-vlasova@bidplace.test',
      slug: 'olga-vlasova',
      fullName: 'Ольга Власова',
      discipline: 'Текстиль, вышивка',
      description:
        'Собирает фактуры и цвет в небольшие авторские текстильные серии.',
      practice: 'Соединяю лён, нить и аппликацию в небольших сериях.',
      handle: '@olga_vlasova',
      photoFileName: 'olga-vlasova.png',
    },
    {
      email: 'mark-volkov@bidplace.test',
      slug: 'mark-volkov',
      fullName: 'Марк Волков',
      discipline: 'Графика, печать',
      description: 'Работает с линией, бумагой и ручной печатью.',
      practice: 'Печатаю листы вручную и оставляю бумаге живую фактуру.',
      handle: '@mark_volkov',
      photoFileName: 'mark-volkov.png',
    },
    {
      email: 'lena-kravets@bidplace.test',
      slug: 'lena-kravets',
      fullName: 'Лена Кравец',
      discipline: 'Скульптура, объекты',
      description: 'Создаёт небольшие объекты на стыке скульптуры и быта.',
      practice: 'Собираю объекты из глины и найденных материалов.',
      handle: '@lena_kravets',
      photoFileName: 'lena-kravets.png',
    },
    {
      email: 'nikita-orlov@bidplace.test',
      slug: 'nikita-orlov',
      fullName: 'Никита Орлов',
      discipline: 'Керамика, глазурь',
      description: 'Сочетает ручную лепку с графичными глазурными акцентами.',
      practice: 'Сочетаю лепку и графичные глазурные акценты.',
      handle: '@nikita_orlov',
      photoFileName: 'nikita-orlov.png',
    },
    {
      email: 'svetlana-gromova@bidplace.test',
      slug: 'svetlana-gromova',
      fullName: 'Светлана Громова',
      discipline: 'Смешанная техника, объекты',
      description: 'Соединяет найденные материалы, цвет и ручную сборку.',
      practice: 'Соединяю найденные материалы, цвет и ручную сборку.',
      handle: '@svetlana_gromova',
      photoFileName: 'svetlana-gromova.png',
    },
  ];

  const additionalDemoUsers = await Promise.all(
    additionalDemoCreators.map((creator) =>
      prisma.user.create({
        data: {
          email: creator.email,
          passwordHash: adminPasswordHash,
          phone: null,
          displayName: creator.fullName,
          emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      }),
    ),
  );

  const additionalDemoProfiles = await Promise.all(
    additionalDemoCreators.map((creator, index) => {
      const photo = readSeedSellerProfileImage(creator.photoFileName);
      const website = `https://${creator.slug}.example.com`;

      return prisma.sellerProfile.create({
        data: {
          userId: additionalDemoUsers[index].id,
          slug: creator.slug,
          sellerType: 'creator',
          discipline: creator.discipline,
          fullName: creator.fullName,
          country: 'BY',
          city: 'Минск',
          practice: creator.practice,
          socialLink: website,
          telegramUrl: `https://t.me/${creator.handle.slice(1)}`,
          websiteUrl: website,
          shortDescription: creator.description,
          profilePhotoMimeType: photo.mimeType,
          profilePhotoByteLength: photo.byteLength,
          profilePhotoChecksum: photo.checksum,
          profilePhotoData: photo.data,
          handoffContactType: 'TELEGRAM',
          handoffContactValue: creator.handle,
          handoffInitiator: 'BUYER_CONTACTS_SELLER',
          status: 'APPROVED',
        },
      });
    }),
  );
  await Promise.all(
    additionalDemoProfiles.map((profile) => attachSellerProfileRevision(profile)),
  );

  const now = new Date();
  const [scheduledProduct, liveProduct, endedProduct, vaseProduct] =
    await Promise.all([
      createProductWithImages({
        publicId: 'seedSched01',
        sellerProfileId: sellerProfile.id,
        categoryId: category.id,
        title: 'Кашпо «Тёплый ритм»',
        story:
          'Небольшое кашпо, расписанное вручную по мотивам летнего света и движения листьев.',
        technique: 'Ручная роспись акрилом по керамике',
        materials: 'Керамика, акрил, защитный лак',
        dimensions: '17 × 17 × 17 см',
        year: 2025,
        condition: 'Новое',
        uniqueness: 'Единственный экземпляр',
        provenance:
          'Создано Анной Морозовой в её минской мастерской и впервые предлагается на bidplace.',
        city: 'Минск',
        packaging:
          'Предмет фиксируется в коробке без контакта с внешними стенками и защищается мягким наполнителем.',
        deliveryInfo:
          'Самовывоз в Минске или доставка по Беларуси по договорённости после покупки.',
        publishedAt: now,
        imageFileName: 'painted-planter.png',
      }),
      createProductWithImages({
        publicId: 'seedLive002',
        sellerProfileId: sellerProfile.id,
        categoryId: category.id,
        title: 'Стакан для кистей «Голубая комета»',
        story:
          'Фактурный стакан для кистей с отверстиями разного размера: предмет для мастерской, который меняется вместе с набором инструментов.',
        technique: 'Лепка вручную, глазурование',
        materials: 'Керамика, цветная глазурь',
        dimensions: '14 × 14 × 12 см',
        year: 2026,
        condition: 'Новое',
        uniqueness: 'Единственный экземпляр',
        provenance:
          'Слеплен и покрыт глазурью Анной Морозовой. Продаётся напрямую из мастерской автора.',
        city: 'Минск',
        packaging:
          'Предмет фиксируется в коробке без контакта с внешними стенками и защищается мягким наполнителем.',
        deliveryInfo:
          'Самовывоз в Минске или доставка по Беларуси по договорённости после покупки.',
        publishedAt: now,
        imageFileName: 'ceramic-brush-holder.png',
      }),
      createProductWithImages({
        publicId: 'seedEnded03',
        sellerProfileId: sellerProfile.id,
        categoryId: category.id,
        title: 'Чашка «Ты мне»',
        story:
          'Чашка с неровным силуэтом и цветными знаками, сделанная для медленного утреннего кофе.',
        technique: 'Лепка вручную, цветная глазурь',
        materials: 'Шамотная глина, глазурь',
        dimensions: '12 × 9 × 10 см',
        year: 2025,
        condition: 'Новое',
        uniqueness: 'Единственный экземпляр',
        provenance:
          'Создана Анной Морозовой в Минске; это первая публичная продажа предмета.',
        city: 'Минск',
        packaging:
          'Чашка упаковывается в бумагу и амортизирующий материал, затем фиксируется в жёсткой коробке.',
        deliveryInfo:
          'Самовывоз в Минске или доставка по Беларуси по договорённости после покупки.',
        publishedAt: now,
        imageFileName: 'handmade-mug.png',
      }),
      createProductWithImages({
        publicId: 'seedVase004',
        sellerProfileId: sellerProfile.id,
        categoryId: category.id,
        title: 'Ваза «Северный сад»',
        story:
          'Небольшая ваза с мягкой неровностью формы и светлой поверхностью, которая хорошо ловит утренний свет.',
        technique: 'Ручная лепка, матовая глазурь',
        materials: 'Шамотная глина, матовая глазурь',
        dimensions: '16 × 16 × 22 см',
        year: 2026,
        condition: 'Новое',
        uniqueness: 'Единственный экземпляр',
        provenance:
          'Создана Анной Морозовой в минской мастерской и впервые предлагается на bidplace.',
        city: 'Минск',
        packaging:
          'Ваза оборачивается мягким защитным материалом и фиксируется внутри усиленной коробки.',
        deliveryInfo:
          'Самовывоз в Минске или доставка по Беларуси по договорённости после покупки.',
        publishedAt: now,
        imageFileName: 'handmade-vase.png',
      }),
    ]);

  const additionalAnnaProducts = await Promise.all(
    [
      {
        publicId: 'seedAnna005',
        title: 'Скульптура «Тихая форма»',
        story:
          'Небольшой авторский объект с мягким силуэтом для полки или рабочего стола.',
        technique: 'Ручная лепка, матовая поверхность',
        materials: 'Шамотная глина, минеральный пигмент',
        dimensions: '18 × 12 × 24 см',
        year: 2026,
        uniqueness: 'Единственный экземпляр',
        price: '1900.00',
        listingStatus: 'LIVE',
        imageFileName: 'wooden-sculpture.png',
      },
      {
        publicId: 'seedAnna006',
        title: 'Чаша «Медленный круг»',
        story:
          'Невысокая чаша с живой кромкой для спокойных домашних ритуалов.',
        technique: 'Ручная лепка, прозрачная глазурь',
        materials: 'Глина, прозрачная глазурь',
        dimensions: '20 × 20 × 8 см',
        year: 2026,
        uniqueness: 'Единственный экземпляр',
        price: '780.00',
        listingStatus: 'SCHEDULED',
        imageFileName: 'ceramic-bowl.png',
      },
      {
        publicId: 'seedAnna007',
        title: 'Текстильная панель «След дождя»',
        story:
          'Фактурная работа из ткани и нитей, собранная вручную в одном экземпляре.',
        technique: 'Ручная вышивка, аппликация',
        materials: 'Лён, хлопок, нить',
        dimensions: '42 × 32 см',
        year: 2025,
        uniqueness: 'Единственный экземпляр',
        price: '1480.00',
        listingStatus: 'ENDED',
        imageFileName: 'textile-composition.png',
      },
      {
        publicId: 'seedAnna008',
        title: 'Графический лист «Линия света»',
        story:
          'Небольшой лист ручной печати с точной линией и живой фактурой бумаги.',
        technique: 'Линогравюра, ручная печать',
        materials: 'Бумага, типографская краска',
        dimensions: '30 × 30 см',
        year: 2026,
        uniqueness: 'Ограниченный тираж',
        price: '510.00',
        listingStatus: 'SCHEDULED',
        imageFileName: 'linocut-print.png',
      },
    ].map((fixture) =>
      createProductWithImages({
        publicId: fixture.publicId,
        sellerProfileId: sellerProfile.id,
        categoryId: category.id,
        title: fixture.title,
        story: fixture.story,
        technique: fixture.technique,
        materials: fixture.materials,
        dimensions: fixture.dimensions,
        year: fixture.year,
        condition: 'Новое',
        uniqueness: fixture.uniqueness,
        provenance:
          'Создано Анной Морозовой в минской мастерской и впервые предлагается на bidplace.',
        city: 'Минск',
        packaging:
          'Работа упаковывается автором с учётом материала и защищается от движения внутри коробки.',
        deliveryInfo:
          'Самовывоз в Минске или доставка по Беларуси по договорённости после покупки.',
        publishedAt: now,
        imageFileName: fixture.imageFileName,
      }).then((product) => ({ product, fixture })),
    ),
  );

  const additionalDemoProducts = await Promise.all(
    [
      {
        publicId: 'seedIrina05',
        profileIndex: 0,
        title: 'Чаша «Тёплая линия»',
        story: 'Небольшая чаша с мягким силуэтом для ежедневных ритуалов.',
        technique: 'Ручная лепка, прозрачная глазурь',
        materials: 'Глина, глазурь',
        uniqueness: 'Единственный экземпляр',
        price: '640.00',
        listingStatus: 'SCHEDULED',
        imageFileName: 'ceramic-bowl.png',
      },
      {
        publicId: 'seedPavel06',
        profileIndex: 1,
        title: 'Лампа «Тихий круг»',
        story:
          'Предметный светильник из дерева и матового стекла для спокойного интерьера.',
        technique: 'Ручная сборка, шлифовка',
        materials: 'Дерево, стекло',
        uniqueness: 'Малая серия',
        price: '920.00',
        listingStatus: 'LIVE',
        imageFileName: 'studio-lamp.png',
      },
      {
        publicId: 'seedOlga007',
        profileIndex: 2,
        title: 'Текстильная композиция «След света»',
        story:
          'Фактурная работа из ткани и нитей, собранная вручную в одном экземпляре.',
        technique: 'Аппликация, ручная вышивка',
        materials: 'Лён, хлопок, нить',
        uniqueness: 'Единственный экземпляр',
        price: '1 480.00',
        listingStatus: 'SCHEDULED',
        imageFileName: 'textile-composition.png',
      },
      {
        publicId: 'seedMark008',
        profileIndex: 3,
        title: 'Графический лист «Ночная карта»',
        story: 'Ручная печать с точной линией и живой фактурой бумаги.',
        technique: 'Линогравюра, ручная печать',
        materials: 'Бумага, типографская краска',
        uniqueness: 'Ограниченный тираж',
        price: '510.00',
        listingStatus: 'SCHEDULED',
        imageFileName: 'linocut-print.png',
      },
    ].map((fixture) =>
      createProductWithImages({
        publicId: fixture.publicId,
        sellerProfileId: additionalDemoProfiles[fixture.profileIndex].id,
        categoryId: category.id,
        title: fixture.title,
        story: fixture.story,
        technique: fixture.technique,
        materials: fixture.materials,
        dimensions: '30 × 30 см',
        year: 2026,
        condition: 'Новое',
        uniqueness: fixture.uniqueness,
        provenance: 'Создано автором для локального демо bidplace.',
        city: 'Минск',
        packaging:
          'Работа упаковывается автором с учётом материала и защищается от движения внутри коробки.',
        deliveryInfo: 'Передача после завершения торгов по договорённости.',
        publishedAt: now,
        imageFileName: fixture.imageFileName,
      }).then((product) => ({ product, fixture })),
    ),
  );

  await Promise.all([
    ...additionalAnnaProducts.map(({ product, fixture }, index) => {
      const startsAt =
        fixture.listingStatus === 'LIVE'
          ? new Date(now.getTime() - 1_800_000)
          : fixture.listingStatus === 'ENDED'
            ? new Date(now.getTime() - 10_800_000)
            : new Date(now.getTime() + (index + 5) * 3_600_000);
      const endsAt =
        fixture.listingStatus === 'ENDED'
          ? new Date(now.getTime() - 3_600_000)
          : new Date(now.getTime() + (index + 6) * 3_600_000);

      return prisma.listing.create({
        data: {
          productId: product.id,
          status: fixture.listingStatus,
          startsAt,
          originalEndsAt: endsAt,
          endsAt,
          closedAt: fixture.listingStatus === 'ENDED' ? endsAt : null,
          currentPrice: money(fixture.price),
          auctionRules: {
            create: { startPrice: money(fixture.price) },
          },
        },
      });
    }),
    ...additionalDemoProducts.map(({ product, fixture }, index) => {
      const startsAt =
        fixture.listingStatus === 'LIVE'
          ? new Date(now.getTime() - 3_600_000)
          : fixture.listingStatus === 'ENDED'
            ? new Date(now.getTime() - 7_200_000)
            : new Date(now.getTime() + (index + 2) * 3_600_000);
      const endsAt =
        fixture.listingStatus === 'ENDED'
          ? new Date(now.getTime() - 3_600_000)
          : new Date(now.getTime() + (index + 3) * 3_600_000);

      return prisma.listing.create({
        data: {
          productId: product.id,
          status: fixture.listingStatus,
          startsAt,
          originalEndsAt: endsAt,
          endsAt,
          closedAt: fixture.listingStatus === 'ENDED' ? endsAt : null,
          currentPrice: money(fixture.price.replace(' ', '')),
          auctionRules: {
            create: { startPrice: money(fixture.price.replace(' ', '')) },
          },
        },
      });
    }),
  ]);

  await createProductWithImages({
    publicId: 'seedPend004',
    sellerProfileId: pendingSellerProfile.id,
    categoryId: category.id,
    title: 'Этюд «Тихий свет»',
    story: 'Предмет ожидает проверки перед публикацией.',
    technique: 'Ручная роспись',
    materials: 'Керамика, глазурь',
    dimensions: '20 × 20 × 18 см',
    year: 2026,
    condition: 'Новое',
    uniqueness: 'Единственный экземпляр',
    provenance: 'Создано автором для локальной проверки модерации.',
    city: 'Минск',
    packaging: 'Работа будет защищена и зафиксирована в транспортной коробке.',
    deliveryInfo: 'Передача после одобрения.',
    publishedAt: null,
    imageFileName: 'painted-planter.png',
    status: 'PENDING_REVIEW',
  });

  const scheduled = await prisma.listing.create({
    data: {
      productId: scheduledProduct.id,
      status: 'SCHEDULED',
      startsAt: new Date(now.getTime() + 3_600_000),
      originalEndsAt: new Date(now.getTime() + 7_200_000),
      endsAt: new Date(now.getTime() + 7_200_000),
      currentPrice: money('50.00'),
      auctionRules: {
        create: { startPrice: money('50.00') },
      },
    },
  });

  const live = await prisma.listing.create({
    data: {
      productId: liveProduct.id,
      status: 'LIVE',
      startsAt: new Date(now.getTime() - 3_600_000),
      originalEndsAt: new Date(now.getTime() + 3_600_000),
      endsAt: new Date(now.getTime() + 3_600_000),
      currentPrice: money('75.00'),
      bidCount: 1,
      auctionRules: {
        create: { startPrice: money('50.00') },
      },
    },
  });

  const ended = await prisma.listing.create({
    data: {
      productId: endedProduct.id,
      status: 'ENDED',
      startsAt: new Date(now.getTime() - 7_200_000),
      originalEndsAt: new Date(now.getTime() - 3_600_000),
      endsAt: new Date(now.getTime() - 3_600_000),
      closedAt: new Date(now.getTime() - 3_600_000),
      currentPrice: money('120.00'),
      bidCount: 1,
      auctionRules: {
        create: { startPrice: money('100.00') },
      },
    },
  });

  const vase = await prisma.listing.create({
    data: {
      productId: vaseProduct.id,
      status: 'SCHEDULED',
      startsAt: new Date(now.getTime() + 10_800_000),
      originalEndsAt: new Date(now.getTime() + 14_400_000),
      endsAt: new Date(now.getTime() + 14_400_000),
      currentPrice: money('90.00'),
      auctionRules: {
        create: { startPrice: money('90.00') },
      },
    },
  });

  const liveBid = await prisma.bid.create({
    data: {
      listingId: live.id,
      bidderUserId: buyer.id,
      idempotencyKey: 'seed-live-bid',
      amount: money('75.00'),
    },
  });

  const endedBid = await prisma.bid.create({
    data: {
      listingId: ended.id,
      bidderUserId: buyer.id,
      idempotencyKey: 'seed-ended-bid',
      amount: money('120.00'),
    },
  });

  await prisma.order.create({
    data: {
      publicId: 'seedOrder01',
      listingId: ended.id,
      sellerId: seller.id,
      buyerId: buyer.id,
      sourceBidId: endedBid.id,
      finalAmount: money('120.00'),
      contactDueAt: new Date(now.getTime() + 82_800_000),
      sellerHandoffType: 'TELEGRAM',
      sellerHandoffValue: '@localseller',
      buyerEmailAtClose: buyer.email,
      handoffInitiator: 'BUYER_CONTACTS_SELLER',
    },
  });

  await prisma.termsAcceptance.create({
    data: {
      userId: buyer.id,
      rulesVersion: 'MVP_RULES_V1',
      acceptedAt: new Date(now.getTime() - 60_000),
    },
  });

  await prisma.curatorSelection.create({
    data: {
      slot: 'home',
      productId: scheduledProduct.id,
      selectedAt: new Date('2026-09-01T00:00:00.000Z'),
      selectedByUserId: admin.id,
    },
  });

  void scheduled;
  void liveBid;
  void vase;

  console.log(
    'Seeded deterministic local/test admin, buyer, eight approved creator profiles, twelve public products, and scheduled/live/ended Product Listings in BYN.',
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

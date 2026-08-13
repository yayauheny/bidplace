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

  return prisma.product.create({
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
      discipline: 'Керамика',
      fullName: 'Анна Морозова',
      country: 'BY',
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

  const additionalDemoCreators = [
    {
      email: 'irina-levchenko@bidplace.test',
      slug: 'irina-levchenko',
      fullName: 'Ирина Левченко',
      discipline: 'Керамика',
      description: 'Создаёт тихие предметы из глины для повседневных ритуалов.',
      handle: '@irina_levchenko',
      photoFileName: 'irina-levchenko.png',
    },
    {
      email: 'pavel-sokolov@bidplace.test',
      slug: 'pavel-sokolov',
      fullName: 'Павел Соколов',
      discipline: 'Предметный дизайн',
      description: 'Исследует честные материалы и простые формы для дома.',
      handle: '@pavel_sokolov',
      photoFileName: 'pavel-sokolov.png',
    },
    {
      email: 'olga-vlasova@bidplace.test',
      slug: 'olga-vlasova',
      fullName: 'Ольга Власова',
      discipline: 'Текстиль',
      description:
        'Собирает фактуры и цвет в небольшие авторские текстильные серии.',
      handle: '@olga_vlasova',
      photoFileName: 'olga-vlasova.png',
    },
    {
      email: 'mark-volkov@bidplace.test',
      slug: 'mark-volkov',
      fullName: 'Марк Волков',
      discipline: 'Графика',
      description: 'Работает с линией, бумагой и ручной печатью.',
      handle: '@mark_volkov',
      photoFileName: 'mark-volkov.png',
    },
    {
      email: 'lena-kravets@bidplace.test',
      slug: 'lena-kravets',
      fullName: 'Лена Кравец',
      discipline: 'Авторские объекты',
      description: 'Создаёт небольшие объекты на стыке скульптуры и быта.',
      handle: '@lena_kravets',
      photoFileName: 'lena-kravets.png',
    },
    {
      email: 'nikita-orlov@bidplace.test',
      slug: 'nikita-orlov',
      fullName: 'Никита Орлов',
      discipline: 'Керамика',
      description: 'Сочетает ручную лепку с графичными глазурными акцентами.',
      handle: '@nikita_orlov',
      photoFileName: 'nikita-orlov.png',
    },
    {
      email: 'svetlana-gromova@bidplace.test',
      slug: 'svetlana-gromova',
      fullName: 'Светлана Громова',
      discipline: 'Смешанная техника',
      description: 'Соединяет найденные материалы, цвет и ручную сборку.',
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

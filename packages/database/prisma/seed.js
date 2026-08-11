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
      'painted-planter.png',
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

  const now = new Date();
  const [scheduledProduct, liveProduct, endedProduct] = await Promise.all([
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
      deliveryInfo:
        'Самовывоз в Минске или доставка по Беларуси по договорённости после покупки.',
      publishedAt: now,
      imageFileName: 'handmade-mug.png',
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

  console.log(
    'Seeded deterministic local/test admin, approved seller, email-only buyer, and scheduled/live/ended Product Listings in BYN.',
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

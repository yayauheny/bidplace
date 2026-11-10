import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fixtures = resolve(
  import.meta.dirname,
  '../../../packages/database/prisma/fixtures',
);
export const demoId = (name) => {
  const hex = createHash('sha256')
    .update(`bidplace-demo-v1:${name}`)
    .digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};
const names = [
  'Анна Лесная',
  'Марк Волков',
  'Елена Сосна',
  'Павел Речной',
  'София Белая',
  'Илья Серов',
  'Мария Луговая',
  'Даниил Север',
  'Алиса Тихая',
  'Тимур Светлый',
  'Вера Озёрная',
  'Никита Полянов',
];
const cities = ['Минск', 'Гродно', 'Брест', 'Витебск'];
const photos = ['vex', 'quantumparadox', 'havoc', 'bala_klava', 'pixelp'];
const images = [
  'alice-glass',
  'between-form',
  'blossom-vase',
  'caricature',
  'color-calibration',
  'dali-estate',
  'memory',
  'rainbow-mask',
  'yellow-sapphire',
];
const titles = ['Тихое утро', 'Линия горизонта', 'Отражения', 'Свет и форма'];
export function demoCatalog() {
  return names.map((fullName, index) => {
    const slug = `demo-author-${String(index + 1).padStart(2, '0')}`;
    return {
      id: demoId(slug),
      userId: demoId(`${slug}:user`),
      slug,
      email: `${slug}@demo.bidplace.invalid`,
      fullName,
      city: cities[index % cities.length],
      photo: `seller-profile/${photos[index % photos.length]}.png`,
      works: titles.map((title, position) => ({
        id: demoId(`${slug}:work:${position}`),
        publicId: `demo${String(index + 1).padStart(2, '0')}${position + 1}`,
        title: `${title} — ${fullName}`,
        image: `product-images/${images[(index * 4 + position) % images.length]}.png`,
      })),
    };
  });
}
export function fixtureImage(path) {
  const data = readFileSync(resolve(fixtures, path));
  return {
    data,
    byteLength: data.length,
    mimeType: 'image/png',
    checksum: createHash('sha256').update(data).digest('hex'),
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
  };
}
export async function importDemoCatalog(
  prisma,
  upload,
  { apply = false } = {},
) {
  const catalog = demoCatalog();
  // One transaction makes partial DB imports impossible; R2 objects use repeatable keys.
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(48151011)`;
      for (const author of catalog) {
        const users = await tx.user.findMany({
          where: {
            OR: [
              { id: author.userId },
              { email: author.email },
              { slug: author.slug },
            ],
          },
        });
        if (
          users.some(
            (user) =>
              user.id !== author.userId ||
              user.email !== author.email ||
              user.slug !== author.slug,
          )
        )
          throw new Error('Demo author identity collision');
        const profiles = await tx.sellerProfile.findMany({
          where: {
            OR: [
              { id: author.id },
              { slug: author.slug },
              { userId: author.userId },
            ],
          },
        });
        if (
          profiles.some(
            (profile) =>
              profile.id !== author.id ||
              profile.userId !== author.userId ||
              profile.slug !== author.slug,
          )
        )
          throw new Error('Demo profile identity collision');
        for (const work of author.works) {
          const products = await tx.product.findMany({
            where: { OR: [{ id: work.id }, { publicId: work.publicId }] },
          });
          if (
            products.some(
              (product) =>
                product.id !== work.id ||
                product.publicId !== work.publicId ||
                product.sellerProfileId !== author.id,
            )
          )
            throw new Error('Demo work identity collision');
        }
      }
      if (!apply)
        return {
          authors: catalog.length,
          works: catalog.flatMap((a) => a.works).length,
          dryRun: true,
        };
      const category = await tx.category.upsert({
        where: { slug: 'demo-art' },
        update: {},
        create: {
          slug: 'demo-art',
          name: 'Демонстрационные работы',
          normalizedName: 'демонстрационные работы',
        },
      });
      for (const author of catalog) {
        const photo = fixtureImage(author.photo);
        const photoKey = `seller-photo:${author.id}`;
        await upload(photoKey, photo);
        await tx.user.upsert({
          where: { id: author.userId },
          update: {},
          create: {
            id: author.userId,
            email: author.email,
            slug: author.slug,
            displayName: author.fullName,
            passwordHash: null,
          },
        });
        const profileData = {
          slug: author.slug,
          fullName: author.fullName,
          country: 'BY',
          city: author.city,
          discipline: 'Художник',
          practice:
            'Работаю с цветом, фактурой и светом. Каждая работа начинается с небольшого эскиза.',
          biography: `${author.fullName} — вымышленный автор демонстрационного каталога. Исследует городской пейзаж и природные формы.`,
          shortDescription:
            'Демонстрационный автор. Живопись и смешанная техника.',
          profilePhotoMimeType: photo.mimeType,
          profilePhotoByteLength: photo.byteLength,
          profilePhotoChecksum: photo.checksum,
          profilePhotoObjectKey: photoKey,
          profilePhotoData: photo.data,
        };
        const profileExists = await tx.sellerProfile.findUnique({
          where: { id: author.id },
        });
        if (!profileExists) {
          await tx.sellerProfile.create({
            data: {
              id: author.id,
              userId: author.userId,
              sellerType: 'creator',
              status: 'APPROVED',
              firstPublishedAt: new Date(),
              ...profileData,
            },
          });
          const revision = await tx.sellerProfileRevision.create({
            data: {
              sellerProfileId: author.id,
              version: 1,
              status: 'APPROVED',
              ...profileData,
            },
          });
          await tx.sellerProfile.update({
            where: { id: author.id },
            data: {
              editingRevisionId: revision.id,
              publishedRevisionId: revision.id,
            },
          });
        }
        for (const work of author.works) {
          const image = fixtureImage(work.image);
          const imageId = demoId(`${work.id}:image`);
          const key = `product-image:${imageId}`;
          await upload(key, image);
          if (await tx.product.findUnique({ where: { id: work.id } })) continue;
          const content = {
            categoryId: category.id,
            title: work.title,
            story:
              'Демонстрационная работа для просмотра каталога. Изображение взято из локальных fixtures проекта.',
            technique: 'Смешанная техника',
            materials: 'Холст, пигмент',
            dimensions: '60 × 80 см',
            year: 2026,
            uniqueness: 'Единственный экземпляр',
            city: author.city,
          };
          await tx.product.create({
            data: {
              id: work.id,
              publicId: work.publicId,
              sellerProfileId: author.id,
              status: 'APPROVED',
              publishedAt: new Date(),
              ...content,
              images: {
                create: { id: imageId, objectKey: key, position: 0, ...image },
              },
            },
          });
          const revision = await tx.productRevision.create({
            data: {
              productId: work.id,
              version: 1,
              status: 'APPROVED',
              ...content,
              images: { create: { imageId, position: 0 } },
            },
          });
          await tx.product.update({
            where: { id: work.id },
            data: {
              publishedRevisionId: revision.id,
              editingRevisionId: revision.id,
            },
          });
        }
      }
      return {
        authors: catalog.length,
        works: catalog.flatMap((a) => a.works).length,
        dryRun: false,
      };
    },
    { timeout: 300000 },
  );
}

export function validateDemoTarget(value, confirmProduction) {
  const url = new URL(value);
  if (!['postgres:', 'postgresql:'].includes(url.protocol))
    throw new Error('Unsupported database protocol');
  if (['localhost', '127.0.0.1'].includes(url.hostname)) return;
  if (
    url.hostname.split('.')[0] !== 'ep-withered-shadow-b230htte' ||
    !url.hostname.endsWith('.neon.tech') ||
    url.pathname !== '/neondb' ||
    url.searchParams.get('sslmode') !== 'require' ||
    !confirmProduction
  )
    throw new Error('Unsupported database target');
}

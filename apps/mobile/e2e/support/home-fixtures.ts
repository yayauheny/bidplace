const checksum = 'a'.repeat(64);

export const homeWorkImageId = '10000000-0000-4000-8000-000000000011';
export const homeAuthorPhotoSlug = 'vex';
export const homeWorkAuthorSlug = 'pixelp';
export const homeSelectedPublicId = 'daliEstate1';

const artworkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="264" height="352"><rect width="264" height="352" fill="#c4b7a6"/><rect x="40" y="48" width="184" height="220" fill="#7d6a55"/></svg>`;
const portraitSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112"><rect width="112" height="112" fill="#d7d2cc"/><circle cx="56" cy="44" r="22" fill="#6b645d"/></svg>`;

export function homeWorkImage(id = homeWorkImageId) {
  return {
    id,
    position: 0,
    url: `/api/images/${id}`,
    mimeType: 'image/svg+xml',
    byteLength: artworkSvg.length,
    checksum,
    width: 264,
    height: 352,
  };
}

export function homeAuthor(overrides?: {
  slug?: string;
  fullName?: string;
  shortDescription?: string;
  id?: string;
}) {
  const slug = overrides?.slug ?? homeAuthorPhotoSlug;
  return {
    id: overrides?.id ?? '10000000-0000-4000-8000-000000000012',
    slug,
    fullName: overrides?.fullName ?? 'Илья Васильев',
    country: 'Беларусь',
    city: 'Минск',
    discipline: 'Художник',
    practice: null,
    biography: null,
    profilePhotoUrl: `/api/sellers/${slug}/photo`,
    telegramUrl: null,
    instagramUrl: null,
    websiteUrl: null,
    shortDescription:
      overrides?.shortDescription ??
      'Ищу логику в абсурде.\nСтираю грань между реальностью и сном',
    achievements: [],
    sharePath: `/authors/${slug}`,
  };
}

export function homeWorkItem(overrides?: {
  publicId?: string;
  title?: string;
  imageId?: string;
  author?: ReturnType<typeof homeAuthor>;
}) {
  const publicId = overrides?.publicId ?? homeSelectedPublicId;
  const imageId = overrides?.imageId ?? homeWorkImageId;
  const author =
    overrides?.author ??
    homeAuthor({
      id: '10000000-0000-4000-8000-000000000032',
      slug: homeWorkAuthorSlug,
      fullName: 'pixelp',
      shortDescription: 'Собери изображение так, чтобы оно зазвучало.',
    });
  return {
    work: {
      id: '10000000-0000-4000-8000-000000000013',
      publicId,
      title:
        overrides?.title ??
        'Salvador Dalí Estate & Fundació Gala Сальвадор Дали',
      story: null,
      categoryId: '10000000-0000-4000-8000-000000000014',
      technique: null,
      materials: null,
      dimensions: null,
      year: 2024,
      uniqueness: null,
      images: [homeWorkImage(imageId)],
      publishedAt: '2026-09-01T00:00:00.000Z',
      sharePath: `/works/${publicId}`,
    },
    author,
  };
}

export function homeCuratorSelection(overrides?: {
  publicId?: string;
  title?: string;
  imageId?: string;
  curator?: ReturnType<typeof homeAuthor>;
  author?: ReturnType<typeof homeAuthor>;
  note?: string | null;
}) {
  const { note, curator, ...workOverrides } = overrides ?? {};
  const item = homeWorkItem(workOverrides);
  return {
    curator: curator ?? homeAuthor(),
    work: {
      ...item.work,
      author: item.author,
    },
    note: note === undefined ? null : note,
  };
}

export function homePayload(overrides?: {
  curatorSelection?: ReturnType<typeof homeCuratorSelection> | null;
  newWorks?: Array<ReturnType<typeof homeWorkItem>>;
  newAuthors?: Array<ReturnType<typeof homeAuthor>>;
}) {
  return {
    curatorSelection:
      overrides && 'curatorSelection' in overrides
        ? overrides.curatorSelection
        : homeCuratorSelection(),
    newWorks: overrides?.newWorks ?? [
      homeWorkItem({
        publicId: 'newestWork1',
        title: 'Желтый сапфир',
        imageId: '10000000-0000-4000-8000-000000000021',
        author: homeAuthor({
          id: '10000000-0000-4000-8000-000000000022',
          slug: 'quantumparadox',
          fullName: 'Анастасия Винова',
          shortDescription: 'Работаю со стеклом и светом.',
        }),
      }),
    ],
    newAuthors: overrides?.newAuthors ?? [
      homeAuthor({
        id: '10000000-0000-4000-8000-000000000023',
        slug: 'havoc',
        fullName: 'Константин Константинович',
        shortDescription: 'Ищу форму в керамике.',
      }),
    ],
  };
}

export const homeArtworkSvg = artworkSvg;
export const homePortraitSvg = portraitSvg;

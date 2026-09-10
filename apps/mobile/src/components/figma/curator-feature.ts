export const CURATOR_FEATURE_TITLE = 'Открытие недели';
export const CURATOR_FEATURE_LABEL = 'Выбор куратора';
export const CURATOR_FEATURE_CTA = 'Смотреть профиль';
export const CURATOR_EDITORIAL_WIDTH = 280;
export const CURATOR_AVATAR_SIZE = 54;

export type CuratorSelection = {
  work: {
    publicId: string;
    title: string;
    images: Array<{ url: string }>;
  };
  author: {
    slug: string;
    fullName: string;
    profilePhotoUrl: string;
    shortDescription: string;
  };
};

export function curatorFeatureContent(selection: CuratorSelection) {
  const imageUrl = selection.work.images[0]?.url?.trim() ?? '';
  const quote = selection.author.shortDescription.trim();

  return {
    sectionTitle: CURATOR_FEATURE_TITLE,
    curatorLabel: CURATOR_FEATURE_LABEL,
    ctaLabel: CURATOR_FEATURE_CTA,
    handle: `@${selection.author.slug}`,
    quote: quote.length > 0 ? quote : null,
    workTitle: selection.work.title,
    workHref: `/product/${selection.work.publicId}` as const,
    profileHref: `/seller/${selection.author.slug}` as const,
    imageUrl,
    imageLabel: selection.work.title,
    authorSlug: selection.author.slug,
    authorPhotoUrl: selection.author.profilePhotoUrl,
    authorName: selection.author.fullName,
  };
}

export function curatorRailItemCount(selection: CuratorSelection) {
  return selection ? 1 : 0;
}

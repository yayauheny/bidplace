import type { RelatedWorkItem } from '../../components/figma/related-works';
import type { WorkContentTabId } from '../../components/figma/work-content-tabs';

export function parseWorkTabParam(
  value: string | readonly string[] | undefined,
): WorkContentTabId {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === 'story' ? 'story' : 'details';
}

export function relatedWorksExcludingCurrent(
  items: ReadonlyArray<{
    work: {
      publicId: string;
      title: string;
      images: Array<{ url: string }>;
    };
    author: { slug: string };
  }>,
  currentPublicId: string,
): RelatedWorkItem[] {
  return items
    .filter((item) => item.work.publicId !== currentPublicId)
    .map((item) => ({
      publicId: item.work.publicId,
      title: item.work.title,
      imageUrl: item.work.images[0]?.url ?? '',
      authorSlug: item.author.slug,
    }));
}

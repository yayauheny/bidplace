export const RELATED_WORKS_TITLE = 'Другие работы автора';

export type RelatedWorkItem = {
  publicId: string;
  title: string;
  imageUrl: string;
  authorSlug: string;
};

export function visibleRelatedWorks(items: readonly RelatedWorkItem[]) {
  return items.filter(
    (item) => item.publicId.trim().length > 0 && item.title.trim().length > 0,
  );
}

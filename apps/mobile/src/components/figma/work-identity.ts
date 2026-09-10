import { getAuthorCoverContent } from './author-cover-fields';

export function getWorkIdentityContent(input: {
  title: string;
  authorName: string;
  authorSlug: string;
  city?: string | null;
  technique?: string | null;
  materials?: string | null;
}) {
  const city = input.city?.trim() ?? '';
  const tags = [city, input.technique, input.materials].filter(
    (value): value is string => Boolean(value?.trim()),
  );
  const author = getAuthorCoverContent({
    fullName: input.authorName,
    slug: input.authorSlug,
    tags,
  });

  return {
    title: input.title.trim(),
    authorName: author.fullName,
    handle: author.handle,
    authorHref: `/seller/${input.authorSlug}` as const,
    city: city.length > 0 ? city : null,
    chips: author.tags,
  };
}

import { getAuthorCoverContent } from './author-cover-fields';

export function getCreatorHeroContent(input: {
  fullName: string;
  slug: string;
  city: string;
  tags: readonly string[];
}) {
  const content = getAuthorCoverContent({
    fullName: input.fullName,
    slug: input.slug,
    tags: input.tags,
  });

  return {
    ...content,
    city: input.city.trim(),
  };
}

export const CREATOR_HERO_GAP = 18;

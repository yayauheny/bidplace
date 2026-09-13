export type AuthorCoverInput = {
  fullName: string;
  slug: string;
  tags: readonly string[];
};

export function getAuthorCoverContent(input: AuthorCoverInput) {
  return {
    fullName: input.fullName,
    handle: `@${input.slug}`,
    tags: input.tags.filter((tag) => tag.trim().length > 0),
  };
}

export function authorCoverAccessibilityLabel(
  content: ReturnType<typeof getAuthorCoverContent>,
) {
  const tags = content.tags.length > 0 ? content.tags.join(', ') : '';
  return tags
    ? `Открыть профиль автора ${content.fullName}, ${content.handle}, ${tags}`
    : `Открыть профиль автора ${content.fullName}, ${content.handle}`;
}

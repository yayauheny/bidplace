export const AUTHOR_PUBLIC_TABS = ['works', 'about'] as const;

export type AuthorPublicTab = (typeof AUTHOR_PUBLIC_TABS)[number];

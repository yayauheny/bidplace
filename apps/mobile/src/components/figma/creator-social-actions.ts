export type CreatorPublicSocialId = 'telegram' | 'instagram' | 'website';

export type CreatorPublicLinks = {
  telegramUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
};

const SOCIALS: ReadonlyArray<{
  id: CreatorPublicSocialId;
  key: keyof CreatorPublicLinks;
  label: string;
}> = [
  { id: 'telegram', key: 'telegramUrl', label: 'Telegram автора' },
  { id: 'instagram', key: 'instagramUrl', label: 'Instagram автора' },
  { id: 'website', key: 'websiteUrl', label: 'Сайт автора' },
];

export function presentCreatorSocials(links: CreatorPublicLinks) {
  return SOCIALS.flatMap((social) => {
    const href = links[social.key]?.trim() ?? '';
    return href.length > 0
      ? [{ id: social.id, href, label: social.label }]
      : [];
  });
}

export function creatorSocialActionsVisible(
  links: CreatorPublicLinks,
  hasShare: boolean,
) {
  return presentCreatorSocials(links).length > 0 || hasShare;
}

export const CREATOR_SOCIAL_ICON_SIZE = 28;
export const CREATOR_SOCIAL_GAP = 12;
export const CREATOR_SOCIAL_PAD_X = 8;
export const CREATOR_SOCIAL_PAD_Y = 6;

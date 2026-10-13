import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';

export type PublicSocialLink = {
  key: 'telegram' | 'instagram' | 'website';
  href: string;
  icon: 'send' | 'instagram' | 'globe';
  label: string;
};

export function listPublicSocialLinks(
  profile: Pick<
    PortfolioWorkDetailResponse['author'],
    'telegramUrl' | 'instagramUrl' | 'websiteUrl'
  >,
): PublicSocialLink[] {
  const links: PublicSocialLink[] = [];
  if (profile.telegramUrl) {
    links.push({
      key: 'telegram',
      href: profile.telegramUrl,
      icon: 'send',
      label: 'Telegram автора',
    });
  }
  if (profile.instagramUrl) {
    links.push({
      key: 'instagram',
      href: profile.instagramUrl,
      icon: 'instagram',
      label: 'Instagram автора',
    });
  }
  if (profile.websiteUrl) {
    links.push({
      key: 'website',
      href: profile.websiteUrl,
      icon: 'globe',
      label: 'Сайт автора',
    });
  }
  return links;
}

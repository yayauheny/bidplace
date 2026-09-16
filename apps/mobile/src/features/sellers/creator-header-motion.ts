import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';
import {
  STICKY_HANDOFF_HYSTERESIS,
  findScrollBoundary as findLabeledScrollBoundary,
  stickyHandoffThresholds,
  stickyHeaderStateFromScroll,
  type StickyHeaderState,
} from '../../lib/sticky-handoff';

export const CREATOR_COMPACT_SOCIAL_LIMIT = 2;
export const CREATOR_SCROLL_TEST_ID = 'creator-scroll';
export const CREATOR_HANDOFF_HYSTERESIS = STICKY_HANDOFF_HYSTERESIS;

export type CreatorHeaderState = StickyHeaderState;

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

export function creatorHandoffThresholds(heroHeight: number) {
  return stickyHandoffThresholds(heroHeight);
}

export function creatorHeaderStateFromScroll(
  scrollTop: number,
  current: CreatorHeaderState,
  thresholds: { collapseAt: number; expandAt: number },
): CreatorHeaderState {
  return stickyHeaderStateFromScroll(scrollTop, current, thresholds);
}

export function findScrollBoundary(from: Element | null) {
  return findLabeledScrollBoundary(from, CREATOR_SCROLL_TEST_ID);
}

export {
  readCurrentScrollTop,
  scrollTopFromEvent,
} from '../../lib/sticky-handoff';

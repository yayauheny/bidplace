import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

export const CREATOR_COMPACT_SOCIAL_LIMIT = 2;
export const CREATOR_SCROLL_TEST_ID = 'creator-scroll';
export const CREATOR_HANDOFF_HYSTERESIS = 20;
export const CREATOR_WEB_COMPACT_STACK =
  designTokens.space.x3 +
  designTokens.size.creatorCompactAvatar +
  designTokens.space.x5;

export type CreatorHeaderState = 'expanded' | 'compact';

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
  const collapseAt = Math.max(0, heroHeight - CREATOR_WEB_COMPACT_STACK);
  return {
    collapseAt,
    expandAt: Math.max(0, collapseAt - CREATOR_HANDOFF_HYSTERESIS),
    compactStack: CREATOR_WEB_COMPACT_STACK,
  };
}

export function creatorHeaderStateFromScroll(
  scrollTop: number,
  current: CreatorHeaderState,
  thresholds: { collapseAt: number; expandAt: number },
): CreatorHeaderState {
  if (thresholds.collapseAt <= 0) {
    return 'expanded';
  }
  if (scrollTop >= thresholds.collapseAt) {
    return 'compact';
  }
  if (scrollTop <= thresholds.expandAt) {
    return 'expanded';
  }
  return current;
}

export function findScrollBoundary(from: Element | null) {
  if (!(from instanceof HTMLElement)) {
    return null;
  }
  const labeled = from.closest(`[data-testid="${CREATOR_SCROLL_TEST_ID}"]`);
  return labeled instanceof HTMLElement ? labeled : null;
}

function isVerticalScrollTarget(
  target: EventTarget | null,
  boundary: HTMLElement,
) {
  if (!(target instanceof HTMLElement) || !boundary.contains(target)) {
    return false;
  }
  return target === boundary || target.scrollHeight > target.clientHeight + 1;
}

export function scrollTopFromEvent(event: Event, boundary: HTMLElement) {
  return isVerticalScrollTarget(event.target, boundary)
    ? (event.target as HTMLElement).scrollTop
    : readCurrentScrollTop(boundary);
}

export function readCurrentScrollTop(boundary: HTMLElement) {
  if (boundary.scrollHeight > boundary.clientHeight + 1) {
    return boundary.scrollTop;
  }
  const nodes = boundary.querySelectorAll<HTMLElement>('*');
  for (const node of nodes) {
    if (node.scrollHeight > node.clientHeight + 1) {
      return node.scrollTop;
    }
  }
  return boundary.scrollTop;
}

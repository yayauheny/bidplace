import type { PortfolioWorkDetailResponse } from '../../lib/portfolio-types';

export const CREATOR_COMPACT_SOCIAL_LIMIT = 2;
export const CREATOR_SCROLL_TEST_ID = 'creator-scroll';
export const CREATOR_SOCIAL_OVERFLOW_TEST_ID = 'creator-social-overflow';

export type CreatorProgressBucket = '0' | 'mid' | '1';

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

export function compactSocialCount(total: number) {
  return Math.min(Math.max(0, total), CREATOR_COMPACT_SOCIAL_LIMIT);
}

export function progressBucket(progress: number): CreatorProgressBucket {
  if (progress <= 0) {
    return '0';
  }
  if (progress >= 1) {
    return '1';
  }
  return 'mid';
}

export function progressFromScroll(
  scrollTop: number,
  offset: number,
  reduced: boolean,
) {
  const raw = offset > 0 ? scrollTop / offset : 0;
  const clamped = Math.min(1, Math.max(0, raw));
  return reduced ? (clamped >= 1 ? 1 : 0) : clamped;
}

export function findScrollBoundary(from: Element | null) {
  if (!(from instanceof HTMLElement)) {
    return null;
  }
  const labeled = from.closest(`[data-testid="${CREATOR_SCROLL_TEST_ID}"]`);
  return labeled instanceof HTMLElement ? labeled : null;
}

export function isVerticalScrollTarget(
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

export function measureCompactActionsWidth(actions: HTMLElement) {
  const extras = [
    ...actions.querySelectorAll(
      `[data-testid="${CREATOR_SOCIAL_OVERFLOW_TEST_ID}"]`,
    ),
  ];
  if (extras.length === 0) {
    return actions.offsetWidth;
  }
  const parent = extras[0]?.parentElement;
  const gap = parent
    ? Number.parseFloat(getComputedStyle(parent).gap || '0') || 0
    : 0;
  const extra = extras.reduce((sum, node) => {
    return sum + (node instanceof HTMLElement ? node.offsetWidth : 0);
  }, 0);
  return Math.max(0, actions.offsetWidth - extra - gap * extras.length);
}

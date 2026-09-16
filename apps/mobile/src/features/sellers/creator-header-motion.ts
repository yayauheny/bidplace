import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';
import {
  progressForHeaderState as progressForStickyHeaderState,
  stickyHeaderStateFromScroll,
} from '../../lib/sticky-header-motion';

export const CREATOR_COMPACT_SOCIAL_LIMIT = 2;
export const CREATOR_SCROLL_TEST_ID = 'creator-scroll';
export const CREATOR_SOCIAL_OVERFLOW_TEST_ID = 'creator-social-overflow';
export const CREATOR_HANDOFF_HYSTERESIS = 20;
export const CREATOR_GEOMETRY_MS = 200;
export const CREATOR_GEOMETRY_FALLBACK_MS = CREATOR_GEOMETRY_MS + 40;
export const CREATOR_WEB_TAB_RAIL = 26;
export const CREATOR_HEADER_EASING = 'cubic-bezier(0.2, 0, 0, 1)';

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

export function compactSocialCount(total: number) {
  return Math.min(Math.max(0, total), CREATOR_COMPACT_SOCIAL_LIMIT);
}

export function creatorHandoffThresholds(heroHeight: number) {
  const compactStack = creatorWebCompactStack();
  const collapseAt = Math.max(0, heroHeight - compactStack);
  return {
    collapseAt,
    expandAt: Math.max(0, collapseAt - CREATOR_HANDOFF_HYSTERESIS),
    compactStack,
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
  return stickyHeaderStateFromScroll(scrollTop, current, thresholds);
}

export function progressForHeaderState(state: CreatorHeaderState) {
  return progressForStickyHeaderState(state);
}

export function creatorWebCompactStack() {
  return (
    designTokens.space.x3 +
    designTokens.size.creatorCompactAvatar +
    designTokens.space.x5
  );
}

export function creatorWebCompactChrome() {
  return creatorWebCompactStack() + CREATOR_WEB_TAB_RAIL;
}

export function creatorIdentityClipInsets(input: {
  scrollTop: number;
  handoffOffset: number;
  heroHeight: number;
  identityHeight: number;
}) {
  const handoffOffset = Math.max(0, input.handoffOffset);
  const clipTop = Math.min(Math.max(0, input.scrollTop), handoffOffset);
  const clipBottom = Math.max(
    0,
    input.heroHeight - clipTop - input.identityHeight,
  );
  return { clipTop, clipBottom };
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

export type CreatorHandleLayoutInput = {
  parentX: number;
  parentWidth: number;
  intrinsicWidth: number;
  intrinsicY: number;
  compactLeft: number;
  compactTop: number;
  compactAvatarSize: number;
  compactHeight: number;
  compactMaxWidth: number;
  expandedFontSize: number;
  compactFontSize: number;
};

export function creatorHandleLayout(input: CreatorHandleLayoutInput) {
  const width = Math.min(
    Math.max(0, input.intrinsicWidth),
    Math.max(0, input.parentWidth),
  );
  const marginLeft = Math.max(0, (input.parentWidth - width) / 2);
  const x = input.parentX + marginLeft;
  const scale =
    input.expandedFontSize > 0
      ? input.compactFontSize / input.expandedFontSize
      : 1;
  const compactY =
    input.compactTop + (input.compactAvatarSize - input.compactHeight) / 2;
  const compactLayoutWidth = scale > 0 ? input.compactMaxWidth / scale : 0;
  return {
    marginLeft,
    x,
    width,
    scale,
    tx: input.compactLeft - x,
    ty: compactY - input.intrinsicY,
    clipLayout: Math.max(0, width - compactLayoutWidth),
    compactLayoutWidth: Math.max(0, compactLayoutWidth),
  };
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

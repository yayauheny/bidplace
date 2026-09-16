import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import {
  CREATOR_COMPACT_SOCIAL_LIMIT,
  CREATOR_HANDOFF_HYSTERESIS,
  CREATOR_WEB_COMPACT_STACK,
  creatorHandoffThresholds,
  creatorHeaderStateFromScroll,
  listPublicSocialLinks,
} from './creator-header-motion';

const profile = {
  telegramUrl: 'https://t.me/anna',
  instagramUrl: 'https://instagram.com/anna',
  websiteUrl: 'https://anna.example',
};

describe('creator header handoff helpers', () => {
  it('lists public social links in a stable order and caps compact actions', () => {
    expect(CREATOR_COMPACT_SOCIAL_LIMIT).toBe(2);
    expect(listPublicSocialLinks(profile).map((link) => link.key)).toEqual([
      'telegram',
      'instagram',
      'website',
    ]);
    expect(
      listPublicSocialLinks({ ...profile, telegramUrl: null }).map(
        (link) => link.key,
      ),
    ).toEqual(['instagram', 'website']);
    expect(
      listPublicSocialLinks({
        telegramUrl: null,
        instagramUrl: null,
        websiteUrl: null,
      }),
    ).toEqual([]);
  });

  it('parks compact at measured hero height minus the identity stack', () => {
    expect(CREATOR_HANDOFF_HYSTERESIS).toBe(20);
    expect(CREATOR_WEB_COMPACT_STACK).toBe(
      designTokens.space.x3 +
        designTokens.size.creatorCompactAvatar +
        designTokens.space.x5,
    );
    const thresholds = creatorHandoffThresholds(460);
    expect(thresholds.compactStack).toBe(80);
    expect(thresholds.collapseAt).toBe(380);
    expect(thresholds.expandAt).toBe(360);
    expect(creatorHeaderStateFromScroll(0, 'expanded', thresholds)).toBe(
      'expanded',
    );
    expect(
      creatorHeaderStateFromScroll(379, 'expanded', thresholds),
    ).toBe('expanded');
    expect(
      creatorHeaderStateFromScroll(380, 'expanded', thresholds),
    ).toBe('compact');
    expect(
      creatorHeaderStateFromScroll(361, 'compact', thresholds),
    ).toBe('compact');
    expect(
      creatorHeaderStateFromScroll(360, 'compact', thresholds),
    ).toBe('expanded');
    expect(creatorHandoffThresholds(0).collapseAt).toBe(0);
    expect(
      creatorHeaderStateFromScroll(120, 'compact', creatorHandoffThresholds(80)),
    ).toBe('expanded');
  });
});

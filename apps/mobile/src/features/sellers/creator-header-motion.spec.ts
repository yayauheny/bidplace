import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import {
  CREATOR_COMPACT_SOCIAL_LIMIT,
  CREATOR_HANDOFF_HYSTERESIS,
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
    const compactStack = designTokens.stickyDock.actionHeight;
    expect(CREATOR_HANDOFF_HYSTERESIS).toBe(20);
    const thresholds = creatorHandoffThresholds(460);
    expect(thresholds.compactStack).toBe(compactStack);
    expect(thresholds.collapseAt).toBe(460 - compactStack);
    expect(thresholds.expandAt).toBe(
      460 - compactStack - CREATOR_HANDOFF_HYSTERESIS,
    );
    expect(creatorHeaderStateFromScroll(0, 'expanded', thresholds)).toBe(
      'expanded',
    );
    expect(
      creatorHeaderStateFromScroll(
        thresholds.collapseAt - 1,
        'expanded',
        thresholds,
      ),
    ).toBe('expanded');
    expect(
      creatorHeaderStateFromScroll(
        thresholds.collapseAt,
        'expanded',
        thresholds,
      ),
    ).toBe('compact');
    expect(
      creatorHeaderStateFromScroll(
        thresholds.expandAt + 1,
        'compact',
        thresholds,
      ),
    ).toBe('compact');
    expect(
      creatorHeaderStateFromScroll(thresholds.expandAt, 'compact', thresholds),
    ).toBe('expanded');
    expect(creatorHandoffThresholds(0).collapseAt).toBe(0);
    expect(
      creatorHeaderStateFromScroll(
        120,
        'compact',
        creatorHandoffThresholds(compactStack),
      ),
    ).toBe('expanded');
  });
});

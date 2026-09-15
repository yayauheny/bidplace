import { describe, expect, it } from 'vitest';

import {
  CREATOR_COMPACT_SOCIAL_LIMIT,
  compactSocialCount,
  creatorHandleLayout,
  listPublicSocialLinks,
  progressBucket,
  progressFromScroll,
} from './creator-header-motion';

const profile = {
  telegramUrl: 'https://t.me/anna',
  instagramUrl: 'https://instagram.com/anna',
  websiteUrl: 'https://anna.example',
};

describe('creator header motion helpers', () => {
  it('keeps a stable compact social maximum of two', () => {
    expect(CREATOR_COMPACT_SOCIAL_LIMIT).toBe(2);
    expect(compactSocialCount(0)).toBe(0);
    expect(compactSocialCount(2)).toBe(2);
    expect(compactSocialCount(3)).toBe(2);
    expect(listPublicSocialLinks({ ...profile, telegramUrl: null })).toHaveLength(
      2,
    );
    expect(listPublicSocialLinks(profile)).toEqual([
      {
        key: 'telegram',
        href: profile.telegramUrl,
        icon: 'send',
        label: 'Telegram автора',
      },
      {
        key: 'instagram',
        href: profile.instagramUrl,
        icon: 'instagram',
        label: 'Instagram автора',
      },
      {
        key: 'website',
        href: profile.websiteUrl,
        icon: 'globe',
        label: 'Сайт автора',
      },
    ]);
    expect(
      listPublicSocialLinks({
        telegramUrl: null,
        instagramUrl: null,
        websiteUrl: null,
      }),
    ).toEqual([]);
  });

  it('interpolates progress continuously and snaps only for reduced motion', () => {
    expect(progressFromScroll(0, 264, false)).toBe(0);
    expect(progressFromScroll(66, 264, false)).toBeCloseTo(0.25);
    expect(progressFromScroll(132, 264, false)).toBeCloseTo(0.5);
    expect(progressFromScroll(198, 264, false)).toBeCloseTo(0.75);
    expect(progressFromScroll(264, 264, false)).toBe(1);
    expect(progressFromScroll(400, 264, false)).toBe(1);
    expect(progressFromScroll(263, 264, true)).toBe(0);
    expect(progressFromScroll(264, 264, true)).toBe(1);
    expect(progressFromScroll(0, 0, false)).toBe(0);
    expect(progressBucket(0)).toBe('0');
    expect(progressBucket(0.5)).toBe('mid');
    expect(progressBucket(1)).toBe('1');
  });

  it('moves the hug glyph box from the expanded center to the compact slot', () => {
    const vex = creatorHandleLayout({
      parentX: 12,
      parentWidth: 366,
      intrinsicWidth: 63,
      intrinsicY: 250,
      compactLeft: 76,
      compactTop: 44,
      compactAvatarSize: 48,
      compactHeight: 19,
      compactMaxWidth: 150,
      expandedFontSize: 24,
      compactFontSize: 16,
    });
    expect(vex.x).toBeCloseTo(163.5, 5);
    expect(vex.marginLeft).toBeCloseTo(151.5, 5);
    expect(vex.tx).toBeCloseTo(76 - 163.5, 5);
    expect(vex.scale).toBeCloseTo(16 / 24, 5);
    expect(vex.ty).toBeCloseTo(58.5 - 250, 5);
    expect(vex.clipLayout).toBe(0);

    const long = creatorHandleLayout({
      parentX: 12,
      parentWidth: 366,
      intrinsicWidth: 366,
      intrinsicY: 250,
      compactLeft: 76,
      compactTop: 44,
      compactAvatarSize: 48,
      compactHeight: 19,
      compactMaxWidth: 150,
      expandedFontSize: 24,
      compactFontSize: 16,
    });
    expect(long.x).toBe(12);
    expect(long.marginLeft).toBe(0);
    expect(long.tx).toBe(64);
    expect(long.clipLayout).toBeGreaterThan(100);
  });
});

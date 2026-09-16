import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import { classifyDockVisibility, clippedVisibleHeight } from '../../../e2e/support/creator-motion-evidence';
import {
  CREATOR_COMPACT_SOCIAL_LIMIT,
  CREATOR_GEOMETRY_FALLBACK_MS,
  CREATOR_GEOMETRY_MS,
  CREATOR_HANDOFF_HYSTERESIS,
  CREATOR_HEADER_EASING,
  CREATOR_WEB_TAB_RAIL,
  compactSocialCount,
  creatorHandleLayout,
  creatorHandoffThresholds,
  creatorHeaderStateFromScroll,
  creatorIdentityClipInsets,
  creatorWebCompactChrome,
  creatorWebCompactStack,
  listPublicSocialLinks,
  progressForHeaderState,
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

  it('flips header state at the measured park with 20px reverse hysteresis', () => {
    expect(CREATOR_HANDOFF_HYSTERESIS).toBe(20);
    expect(CREATOR_GEOMETRY_MS).toBe(200);
    expect(CREATOR_GEOMETRY_FALLBACK_MS).toBe(CREATOR_GEOMETRY_MS + 40);
    expect(CREATOR_WEB_TAB_RAIL).toBe(26);
    expect(creatorWebCompactChrome()).toBe(106);
    expect(CREATOR_HEADER_EASING).toBe('cubic-bezier(0.2, 0, 0, 1)');
    expect(classifyDockVisibility({ y: -248, height: 112 })).toBe('outside');
    expect(classifyDockVisibility({ y: -8, height: 48 })).toBe('partial');
    expect(classifyDockVisibility({ y: 12, height: 48 })).toBe('inside');
    expect(classifyDockVisibility({ y: 80, height: 26 })).toBe('inside');
    const heroHeight = 460;
    const thresholds = creatorHandoffThresholds(heroHeight);
    expect(thresholds.compactStack).toBe(80);
    expect(thresholds.collapseAt).toBe(380);
    expect(thresholds.expandAt).toBe(360);
    expect(creatorHeaderStateFromScroll(0, 'expanded', thresholds)).toBe(
      'expanded',
    );
    expect(
      creatorHeaderStateFromScroll(thresholds.expandAt, 'expanded', thresholds),
    ).toBe('expanded');
    expect(
      creatorHeaderStateFromScroll(
        thresholds.collapseAt - 1,
        'expanded',
        thresholds,
      ),
    ).toBe('expanded');
    expect(
      creatorHeaderStateFromScroll(thresholds.collapseAt, 'expanded', thresholds),
    ).toBe('compact');
    expect(
      creatorHeaderStateFromScroll(
        thresholds.collapseAt + 20,
        'compact',
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
    expect(
      creatorHeaderStateFromScroll(
        thresholds.expandAt - 1,
        'compact',
        thresholds,
      ),
    ).toBe('expanded');
    expect(
      creatorHeaderStateFromScroll(
        thresholds.collapseAt - 10,
        'expanded',
        thresholds,
      ),
    ).toBe('expanded');
    expect(
      creatorHeaderStateFromScroll(
        thresholds.collapseAt - 10,
        'compact',
        thresholds,
      ),
    ).toBe('compact');
    expect(creatorHandoffThresholds(0).collapseAt).toBe(0);
    expect(creatorHandoffThresholds(80).collapseAt).toBe(0);
    expect(
      creatorHeaderStateFromScroll(120, 'expanded', creatorHandoffThresholds(0)),
    ).toBe('expanded');
    expect(
      creatorHeaderStateFromScroll(120, 'compact', creatorHandoffThresholds(80)),
    ).toBe('expanded');
    expect(progressForHeaderState('expanded')).toBe(0);
    expect(progressForHeaderState('compact')).toBe(1);
    expect(
      progressForHeaderState(
        creatorHeaderStateFromScroll(
          thresholds.expandAt + 1,
          'expanded',
          thresholds,
        ),
      ),
    ).toBe(0);
    expect(
      progressForHeaderState(
        creatorHeaderStateFromScroll(
          thresholds.expandAt + 1,
          'compact',
          thresholds,
        ),
      ),
    ).toBe(1);
    expect(
      progressForHeaderState(
        creatorHeaderStateFromScroll(
          thresholds.collapseAt,
          'expanded',
          thresholds,
        ),
      ),
    ).toBe(1);
  });

  it('anchors the identity clip to an 80px hero window', () => {
    const heroHeight = 460;
    const identityHeight = 80;
    const handoffOffset = 380;
    expect(heroHeight - handoffOffset).toBe(identityHeight);
    expect(
      creatorIdentityClipInsets({
        scrollTop: 410,
        handoffOffset,
        heroHeight,
        identityHeight,
      }),
    ).toEqual({ clipTop: 380, clipBottom: 0 });
    expect(
      creatorIdentityClipInsets({
        scrollTop: 380,
        handoffOffset,
        heroHeight,
        identityHeight,
      }),
    ).toEqual({ clipTop: 380, clipBottom: 0 });
    expect(
      creatorIdentityClipInsets({
        scrollTop: 370,
        handoffOffset,
        heroHeight,
        identityHeight,
      }),
    ).toEqual({ clipTop: 370, clipBottom: 10 });
    expect(
      creatorIdentityClipInsets({
        scrollTop: 361,
        handoffOffset,
        heroHeight,
        identityHeight,
      }),
    ).toEqual({ clipTop: 361, clipBottom: 19 });
    expect(
      creatorIdentityClipInsets({
        scrollTop: 360,
        handoffOffset,
        heroHeight,
        identityHeight,
      }),
    ).toEqual({ clipTop: 360, clipBottom: 20 });
  });

  it('keeps tab glyphs fully visible when identity clip is a sibling, not the sticky root', () => {
    expect(
      clippedVisibleHeight({
        top: 90,
        height: 26,
        clips: [],
      }),
    ).toBe(26);
    expect(
      clippedVisibleHeight({
        top: 90,
        height: 26,
        clips: [
          {
            top: -370,
            height: 486,
            clipTop: 370,
            clipBottom: 10,
          },
        ],
      }),
    ).toBe(16);
  });

  it('derives web compact stack from semantic tokens, not Figma 186/44', () => {
    expect(creatorWebCompactStack()).toBe(80);
    expect(designTokens.space.x3).toBe(12);
    expect(designTokens.space.x5).toBe(20);
    expect(designTokens.size.creatorCompactAvatar).toBe(48);
    expect(designTokens.size.creatorCompactHeader).toBe(186);
    expect(designTokens.space.creatorCompactTop).toBe(44);
  });

  it('moves the hug glyph box from the expanded center to the compact slot', () => {
    const figma = creatorHandleLayout({
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
    expect(figma.x).toBeCloseTo(163.5, 5);
    expect(figma.ty).toBeCloseTo(58.5 - 250, 5);

    const vex = creatorHandleLayout({
      parentX: 12,
      parentWidth: 366,
      intrinsicWidth: 63,
      intrinsicY: 250,
      compactLeft: 76,
      compactTop: 12,
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
    expect(vex.ty).toBeCloseTo(26.5 - 250, 5);
    expect(vex.clipLayout).toBe(0);
    expect(vex.compactLayoutWidth).toBeCloseTo(150 / (16 / 24), 5);

    const long = creatorHandleLayout({
      parentX: 12,
      parentWidth: 366,
      intrinsicWidth: 366,
      intrinsicY: 250,
      compactLeft: 76,
      compactTop: 12,
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
    expect(long.compactLayoutWidth).toBeCloseTo(150 / (16 / 24), 5);
  });
});

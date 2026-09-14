import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

function relativeLuminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);
  if (!channels || channels.length !== 3)
    throw new Error(`Invalid color: ${hex}`);

  const linear = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Figma semantic token contract', () => {
  it('keeps ink at normal-text AA on the canvas', () => {
    expect(
      contrastRatio(designTokens.color.ink, designTokens.color.canvas),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps secondary text at large-text AA on the canvas', () => {
    expect(
      contrastRatio(
        designTokens.color.textSecondary,
        designTokens.color.canvas,
      ),
    ).toBeGreaterThanOrEqual(3);
  });

  it('provides a visible focus color for white surfaces', () => {
    expect(
      contrastRatio(designTokens.color.focus, designTokens.color.canvas),
    ).toBeGreaterThanOrEqual(3);
  });

  it('uses measured Figma control geometry', () => {
    expect(designTokens.size.button).toBe(44);
    expect(designTokens.radius.button).toBe(80);
    expect(designTokens.radius.cover).toBe(24);
    expect(designTokens.size.coverWidth).toBe(264);
    expect(designTokens.blur.authorTopOverlay).toBe(20);
    expect(designTokens.size.icon).toBe(18);
    expect(designTokens.layout.phoneWidth).toBe(390);
    expect(designTokens.opacity.disabled).toBe(0.5);
    expect(designTokens.opacity.atmosphere).toBe(0.5);
    expect(designTokens.blur.overlay).toBe(30);
    expect(designTokens.blur.atmosphere).toBe(40);
    expect(designTokens.blur.dock).toBe(6);
    expect(designTokens.blur.dockNativeIntensity).toBe(30);
    expect(designTokens.blur.dockAndroidReductionFactor).toBe(5);
    expect(designTokens.size.authorAtmosphere).toBe(485);
    expect(designTokens.size.social).toBe(38);
    expect(designTokens.space.atmosphereOffset).toBe(36);
    expect(designTokens.color.glass).toBe('rgba(255, 255, 255, 0.60)');
    expect(designTokens.color.glassChip).toBe('rgba(255, 255, 255, 0.70)');
    expect(designTokens.color.atmosphereWash).toBe('rgba(255, 255, 255, 0.40)');
  });

  it('keeps one phone column instead of desktop header chrome', () => {
    expect(designTokens.size.touch).toBe(44);
    expect(designTokens.breakpoint.desktopShell).toBe(99999);
    expect(designTokens.layout.contentMaxWidth).toBe(390);
  });

  it('uses Inter for the runtime type stack', () => {
    expect(designTokens.typography.body.fontFamily).toBe('Inter_400Regular');
    expect(designTokens.typography.cardTitle.fontFamily).toBe(
      'Inter_500Medium',
    );
    expect(designTokens.typography.nav.fontFamily).toBe('Inter_500Medium');
  });

  it('keeps Home opening roles from first-fold nodes 439:4414–4420', () => {
    expect(designTokens.color.textSubtle).toBe('#6F6F6F');
    expect(designTokens.color.quietFill).toBe('#EFEFEF');
    expect(designTokens.color.quietBorderStart).toBe('#FFFFFF');
    expect(designTokens.color.quietBorderEnd).toBe('#999999');
    expect(designTokens.opacity.quietBorder).toBe(0.16);
    expect(designTokens.space.quietButtonX).toBe(14);
    expect(designTokens.space.quietButtonY).toBe(8);
    expect(designTokens.radius.chip).toBe(28);
    expect(designTokens.size.openingAvatar).toBe(54);
    expect(designTokens.layout.openingAuthorWidth).toBe(280);
    expect(designTokens.layout.phoneFoldHeight).toBe(860);
    expect(designTokens.typography.authorRowHandle).toMatchObject({
      fontFamily: 'Inter_500Medium',
      fontSize: 22,
      lineHeight: 25,
      letterSpacing: -0.22,
      letterSpacingEm: '-0.01em',
      fontWeight: '500',
    });
    expect(designTokens.typography.authorRowBio).toMatchObject({
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      lineHeight: 17,
      fontWeight: '400',
    });
    expect(designTokens.typography.editorialTitle).toMatchObject({
      fontFamily: 'Inter_500Medium',
      fontSize: 20,
      lineHeight: 24,
      letterSpacing: -0.4,
      letterSpacingEm: '-0.02em',
      fontWeight: '500',
    });
    expect(designTokens.typography.editorial).toMatchObject({
      fontFamily: 'Inter_400Regular',
      fontSize: 16,
      lineHeight: 22,
      letterSpacing: -0.16,
      letterSpacingEm: '-0.01em',
      fontWeight: '400',
    });
    expect(designTokens.typography.buttonCompact).toMatchObject({
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: -0.13,
      letterSpacingEm: '-0.01em',
      fontWeight: '500',
    });
    expect(designTokens.size.buttonCompact).toBe(40);
  });

  it('keeps author tab tracking and count from Figma 621:19524 / 621:19525', () => {
    expect(designTokens.typography.profileTab).toMatchObject({
      fontFamily: 'Inter_500Medium',
      fontSize: 16,
      lineHeight: 19,
      letterSpacing: -0.32,
      fontWeight: '500',
    });
    expect(designTokens.typography.profileTabCount).toMatchObject({
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      lineHeight: 14,
      letterSpacing: -0.24,
      fontWeight: '400',
    });
  });

  it('uses the measured media interaction timing', () => {
    expect(designTokens.motion.media).toBe(300);
    expect(designTokens.motion.easing).toBe('cubic-bezier(0, 0, 0.2, 1)');
  });
});

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
    expect(designTokens.size.icon).toBe(18);
    expect(designTokens.layout.phoneWidth).toBe(390);
    expect(designTokens.opacity.disabled).toBe(0.5);
    expect(designTokens.opacity.atmosphere).toBe(0.5);
    expect(designTokens.blur.overlay).toBe(30);
    expect(designTokens.blur.atmosphere).toBe(40);
    expect(designTokens.blur.dock).toBe(6);
    expect(designTokens.size.authorAtmosphere).toBe(485);
    expect(designTokens.size.social).toBe(38);
    expect(designTokens.space.atmosphereOffset).toBe(36);
    expect(designTokens.color.glass).toBe('rgba(255, 255, 255, 0.60)');
    expect(designTokens.color.glassChip).toBe('rgba(255, 255, 255, 0.70)');
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

  it('uses the measured media interaction timing', () => {
    expect(designTokens.motion.media).toBe(300);
    expect(designTokens.motion.easing).toBe('cubic-bezier(0, 0, 0.2, 1)');
  });
});

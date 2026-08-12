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

describe('Pen v2 semantic token contract', () => {
  it.each([
    ['ink', designTokens.color.ink],
    ['secondary', designTokens.color.textSecondary],
    ['accent text', designTokens.color.accentDark],
    ['danger text', designTokens.color.danger],
  ])('%s meets normal-text AA on the canvas', (_name, color) => {
    expect(
      contrastRatio(color, designTokens.color.canvas),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps destructive button text at normal-text AA on the danger surface', () => {
    expect(
      contrastRatio(designTokens.color.surface, designTokens.color.danger),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('provides a visible focus color for white surfaces', () => {
    expect(
      contrastRatio(designTokens.color.focus, designTokens.color.canvas),
    ).toBeGreaterThanOrEqual(3);
  });

  it('keeps Pen control geometry and shared state values tokenized', () => {
    expect(designTokens.size.button).toBe(52);
    expect(designTokens.size.buttonCompact).toBe(40);
    expect(designTokens.size.control).toBe(36);
    expect(designTokens.radius.button).toBe(22);
    expect(designTokens.radius.compact).toBe(18);
    expect(designTokens.layout.discoveryMaxWidth).toBe(1360);
    expect(designTokens.ratio.productPortrait).toBe(4 / 5);
    expect(designTokens.opacity.disabled).toBe(0.48);
  });

  it('keeps the canonical mobile header geometry tokenized', () => {
    expect(designTokens.breakpoint.mobileHeader).toBe(768);
    expect(designTokens.size.mobileHeader).toBe(72);
    expect(designTokens.size.touch).toBe(44);
    expect(designTokens.layout.mobileMenuWidth).toBe(320);
    expect(designTokens.color.headerControl).toBe('#F4F4F1');
  });

  it('uses Onest for content and Inter for navigation', () => {
    expect(designTokens.typography.body.fontFamily).toBe('Onest_400Regular');
    expect(designTokens.typography.cardTitle.fontFamily).toBe('Onest_700Bold');
    expect(designTokens.typography.nav.fontFamily).toBe('Inter_600SemiBold');
  });

  it('uses the measured media interaction timing', () => {
    expect(designTokens.motion.media).toBe(300);
    expect(designTokens.motion.easing).toBe('cubic-bezier(0, 0, 0.2, 1)');
  });
});

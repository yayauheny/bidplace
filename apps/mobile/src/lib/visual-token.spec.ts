import { describe, expect, it } from 'vitest';

import { modernTokens } from '@bidplace/design-tokens';

function relativeLuminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);
  if (!channels || channels.length !== 3) throw new Error(`Invalid color: ${hex}`);

  const linear = channels.map((channel) =>
    channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
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

describe('modern semantic token contrast', () => {
  it.each([
    ['ink', modernTokens.color.ink],
    ['secondary', modernTokens.color.textSecondary],
    ['accent text', modernTokens.color.accentDark],
    ['danger text', modernTokens.color.danger],
  ])('%s meets normal-text AA on the canvas', (_name, color) => {
      expect(contrastRatio(color, modernTokens.color.canvas)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps destructive button text at normal-text AA on the danger surface', () => {
    expect(
      contrastRatio(modernTokens.color.surface, modernTokens.color.danger),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('provides a visible focus color for white surfaces', () => {
    expect(contrastRatio(modernTokens.color.focus, modernTokens.color.canvas)).toBeGreaterThanOrEqual(3);
  });

  it('keeps Wave A geometry and shared state values tokenized', () => {
    expect(modernTokens.size.button).toBe(56);
    expect(modernTokens.size.buttonCompact).toBe(44);
    expect(modernTokens.radius.button).toBe(18);
    expect(modernTokens.radius.compact).toBe(14);
    expect(modernTokens.ratio.productPortrait).toBe(4 / 5);
    expect(modernTokens.opacity.disabled).toBe(0.5);
  });
});

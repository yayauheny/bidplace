import { describe, expect, it, vi } from 'vitest';

import { blackColorMap, designTokens } from '@bidplace/design-tokens';

import {
  figmaIconButtonHitSlop,
  figmaIconButtonStyle,
} from './figma-icon-button-style';

describe('Figma icon button styles', () => {
  it('keeps the captured 36 px visual frame with a 44 px hit target', () => {
    expect(
      figmaIconButtonStyle(false, 'plain', designTokens.color),
    ).toMatchObject({
      width: 36,
      height: 36,
      backgroundColor: 'transparent',
    });
    expect(figmaIconButtonHitSlop).toBe(4);
    expect(36 + figmaIconButtonHitSlop * 2).toBe(designTokens.size.touch);
  });

  it('provides the captured 42px muted circular control without changing plain buttons', () => {
    expect(
      figmaIconButtonStyle(false, 'muted', designTokens.color),
    ).toMatchObject({
      width: 42,
      height: 42,
      backgroundColor: designTokens.color.headerControl,
    });
  });

  it('provides an outlined header action without changing other surfaces', () => {
    expect(
      figmaIconButtonStyle(false, 'outline', designTokens.color),
    ).toMatchObject({
      width: 38,
      height: 38,
      borderWidth: designTokens.size.fieldBorder,
      borderColor: designTokens.color.border,
      backgroundColor: 'transparent',
    });
    expect(
      figmaIconButtonStyle(true, 'outline', designTokens.color).backgroundColor,
    ).toBe(designTokens.color.ghostHover);
  });

  it('uses the captured destructive surface without changing neutral actions', () => {
    expect(
      figmaIconButtonStyle(false, 'destructive', designTokens.color),
    ).toMatchObject({
      width: 38,
      height: 38,
      backgroundColor: designTokens.color.destructiveFill,
    });
    expect(
      figmaIconButtonStyle(true, 'destructive', designTokens.color)
        .backgroundColor,
    ).toBe(designTokens.color.dangerHover);
  });

  it('shows feedback without adding a permanent white plate', () => {
    expect(
      figmaIconButtonStyle(true, 'plain', designTokens.color).backgroundColor,
    ).toBe(designTokens.color.ghostHover);
  });
  it.each(['muted', 'glass'] as const)(
    'keeps navigation geometry at48px on %s',
    (surface) => {
      for (const palette of [designTokens.color, blackColorMap]) {
        for (const pressed of [false, true]) {
          expect(
            figmaIconButtonStyle(pressed, surface, palette, 'navigation'),
          ).toMatchObject({
            width: 48,
            height: 48,
            borderRadius: designTokens.radius.pill,
            backgroundColor:
              surface === 'glass' ? 'transparent' : palette.headerControl,
          });
        }
      }
    },
  );
});

vi.mock('./FigmaIconButton', () => ({ FigmaIconButton: () => null }));
import { BackButton } from './BackButton';

describe('BackButton public contract', () => {
  it.each(['muted', 'glass'] as const)(
    'uses one48px full-arrow configuration on %s',
    (surface) => {
      const onPress = vi.fn();
      const element = BackButton({
        onPress,
        surface,
        disabled: true,
        accessibilityHint: 'Previous wizard step',
      });
      expect(element.props).toMatchObject({
        label: 'Назад',
        size: 'navigation',
        icon: 'arrow-left-02',
        iconSize: 28,
        strokeWidthPx: 1.6,
        disabled: true,
        surface,
        accessibilityHint: 'Previous wizard step',
        onPress,
      });
      expect(onPress).not.toHaveBeenCalled();
    },
  );
});

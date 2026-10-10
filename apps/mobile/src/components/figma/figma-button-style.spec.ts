import {
  figmaButtonInteractions,
  figmaButtonMatrixCell,
  figmaButtonTokens,
  figmaButtonVariants,
  resolveFigmaButtonInteraction,
} from '@bidplace/design-tokens';
import { describe, expect, it } from 'vitest';

import {
  figmaButtonGradientAxis,
  figmaButtonLabelColor,
  figmaButtonOverlayColor,
  figmaButtonPressedGhostInset,
  figmaButtonStrokeMode,
  figmaButtonStyle,
} from './figma-button-style';

describe('figma button matrix', () => {
  it('covers all 16 variant × interaction cells', () => {
    for (const variant of figmaButtonVariants) {
      for (const interaction of figmaButtonInteractions) {
        expect(figmaButtonMatrixCell(variant, interaction)).toMatchObject({
          fill: expect.any(String),
          labelColor: expect.any(String),
          borderRadius: expect.any(Number),
          controlOpacity: expect.any(Number),
        });
      }
    }
  });

  it('prioritizes disabled over pressed and hover', () => {
    expect(
      resolveFigmaButtonInteraction({
        inactive: true,
        hovered: true,
        pressed: true,
      }),
    ).toBe('disabled');
    expect(
      resolveFigmaButtonInteraction({
        inactive: false,
        hovered: true,
        pressed: true,
      }),
    ).toBe('pressed');
    expect(
      resolveFigmaButtonInteraction({
        inactive: false,
        hovered: true,
        pressed: false,
      }),
    ).toBe('hover');
  });

  it('applies disabled opacity once on the control shell', () => {
    for (const variant of figmaButtonVariants) {
      const style = figmaButtonStyle(variant, 'disabled');
      expect(style.opacity).toBe(figmaButtonTokens.disabledOpacity);
    }
  });

  it('uses shared metrics and label colors', () => {
    const idle = figmaButtonStyle('solid', 'idle');
    expect(idle.paddingHorizontal).toBe(
      figmaButtonTokens.metrics.paddingX + figmaButtonTokens.metrics.strokeWidth,
    );
    expect(idle.paddingVertical).toBe(
      figmaButtonTokens.metrics.paddingY + figmaButtonTokens.metrics.strokeWidth,
    );
    expect(idle.borderRadius).toBe(figmaButtonTokens.metrics.radius);
    expect(figmaButtonLabelColor('solid')).toBe(
      figmaButtonTokens.colors.labelOnSolid,
    );
    expect(figmaButtonLabelColor('outline')).toBe(
      figmaButtonTokens.colors.labelDefault,
    );
  });

  it('maps solid disabled fill and radius from export node 292:5054', () => {
    const cell = figmaButtonMatrixCell('solid', 'disabled');
    expect(cell.fill).toBe(figmaButtonTokens.colors.solidDisabledFill);
    expect(cell.borderRadius).toBe(figmaButtonTokens.metrics.disabledSolidRadius);
  });

  it('uses overlay tints for hover and pressed without lowering control opacity', () => {
    expect(figmaButtonOverlayColor('outline', 'hover')).toBe(
      figmaButtonTokens.overlay.outlineGhostActive,
    );
    expect(figmaButtonStyle('outline', 'hover').opacity).toBe(1);
    expect(figmaButtonOverlayColor('solid', 'pressed')).toBe(
      figmaButtonTokens.overlay.solidActive,
    );
    expect(figmaButtonOverlayColor('muted', 'pressed')).toBe(
      figmaButtonTokens.overlay.mutedActive,
    );
  });

  it('drops ghost stroke on pressed and insets the pressed surface', () => {
    expect(figmaButtonStrokeMode('ghost', 'pressed')).toBe('none');
    expect(figmaButtonPressedGhostInset('ghost', 'pressed')).toBe(true);
    expect(figmaButtonStrokeMode('ghost', 'idle')).toBe('ghost');
    expect(figmaButtonStyle('ghost', 'pressed').backgroundColor).toBe(
      'transparent',
    );
  });

  it('keeps gradient stroke axes aligned with fallbacks/001-292_5058.svg', () => {
    expect(figmaButtonGradientAxis('outline')).toMatchObject({
      x1: 0,
      y1: 0,
      x2: 88.232,
      y2: 20.724,
      start: '#D1D1D1',
      end: '#EBEBEB',
    });
    expect(figmaButtonGradientAxis('solid')).toMatchObject({
      x1: 0,
      y1: 0,
      x2: 84.791,
      y2: 39.1182,
      start: '#2A2A2A',
      end: '#585858',
    });
  });
});

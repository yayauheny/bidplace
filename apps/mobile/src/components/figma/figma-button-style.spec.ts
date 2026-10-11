import {
  designTokens,
  figmaButtonContentHeight,
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
  figmaButtonScaledGradientAxis,
  figmaButtonStrokeRadius,
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

  it('keeps the interactive shell transparent and paints in SVG', () => {
    for (const variant of figmaButtonVariants) {
      for (const interaction of figmaButtonInteractions) {
        const style = figmaButtonStyle(variant, interaction);
        expect(style.backgroundColor).toBe('transparent');
        expect('overflow' in style).toBe(false);
      }
    }
  });

  it('keeps auth and nickname suggestion heights on the shared padding formula', () => {
    expect(figmaButtonContentHeight()).toBe(43);
    expect(figmaButtonContentHeight('auth')).toBe(designTokens.auth.actionHeight);
    expect(figmaButtonContentHeight('auth')).toBe(designTokens.auth.resendHeight);
    expect(figmaButtonContentHeight('suggestion')).toBe(
      designTokens.auth.suggestionHeight,
    );
    const auth = figmaButtonStyle('solid', 'idle', 'auth');
    expect(auth.paddingHorizontal).toBe(
      figmaButtonTokens.metrics.paddingX + figmaButtonTokens.metrics.strokeWidth,
    );
    expect(auth.paddingVertical).toBe(
      designTokens.space.x3 + figmaButtonTokens.metrics.strokeWidth,
    );
    expect(auth.backgroundColor).toBe('transparent');
    expect(auth.opacity).toBe(1);
    const suggestion = figmaButtonStyle('outline', 'idle', 'suggestion');
    expect(suggestion.paddingHorizontal).toBe(
      designTokens.auth.suggestionX + figmaButtonTokens.metrics.strokeWidth,
    );
    expect(suggestion.paddingVertical).toBe(
      designTokens.auth.suggestionY + figmaButtonTokens.metrics.strokeWidth,
    );
    expect(suggestion.borderRadius).toBe(figmaButtonTokens.metrics.radius);
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

  it('insets the pressed ghost surface to the 82×42 capture and hides its stroke', () => {
    for (const interaction of figmaButtonInteractions) {
      const cell = figmaButtonMatrixCell('ghost', interaction);
      expect(cell.fill).toBe(figmaButtonTokens.colors.canvas);
      expect(cell.borderRadius).toBe(figmaButtonTokens.metrics.radius);
      expect(cell.labelColor).toBe(figmaButtonTokens.colors.labelDefault);
      if (interaction === 'pressed') {
        expect(cell.strokeMode).toBe('none');
        expect(cell.strokeColor).toBeNull();
        expect(cell.overlay).toBe(figmaButtonTokens.overlay.outlineGhostActive);
      } else if (interaction === 'hover') {
        expect(cell.strokeMode).toBe('ghost');
        expect(cell.strokeColor).toBe(figmaButtonTokens.colors.ghostStroke);
        expect(cell.overlay).toBe(figmaButtonTokens.overlay.outlineGhostActive);
      } else if (interaction === 'disabled') {
        expect(cell.strokeColor).toBe(figmaButtonTokens.colors.ghostStroke);
        expect(cell.overlay).toBeNull();
        expect(cell.controlOpacity).toBe(figmaButtonTokens.disabledOpacity);
      } else {
        expect(cell.strokeColor).toBe(figmaButtonTokens.colors.ghostStroke);
        expect(cell.overlay).toBeNull();
        expect(cell.controlOpacity).toBe(1);
      }
      expect(figmaButtonStyle('ghost', interaction).backgroundColor).toBe(
        'transparent',
      );
    }
    expect(figmaButtonPressedGhostInset('ghost', 'pressed')).toBe(true);
    expect(figmaButtonPressedGhostInset('ghost', 'idle')).toBe(false);
    expect(figmaButtonTokens.metrics.pressedGhostWidth).toBe(82);
    expect(figmaButtonTokens.metrics.pressedGhostHeight).toBe(42);
  });

  it('keeps the muted stroke the same gray as the fill on every state', () => {
    for (const interaction of figmaButtonInteractions) {
      const cell = figmaButtonMatrixCell('muted', interaction);
      expect(cell.fill).toBe('#F3F3F3');
      expect(cell.strokeMode).toBe('flat');
      expect(cell.strokeColor).toBe('#F3F3F3');
      expect(cell.borderRadius).toBe(figmaButtonTokens.metrics.radius);
      expect(cell.labelColor).toBe('#565656');
      if (interaction === 'hover' || interaction === 'pressed') {
        expect(cell.overlay).toBe('rgba(0, 0, 0, 0.06)');
        expect(cell.controlOpacity).toBe(1);
      } else if (interaction === 'disabled') {
        expect(cell.overlay).toBeNull();
        expect(cell.controlOpacity).toBe(0.5);
      } else {
        expect(cell.overlay).toBeNull();
        expect(cell.controlOpacity).toBe(1);
      }
    }
  });

  it('paints solid and outline with the SVG gradient on every state', () => {
    for (const interaction of figmaButtonInteractions) {
      const solid = figmaButtonMatrixCell('solid', interaction);
      const outline = figmaButtonMatrixCell('outline', interaction);
      expect(solid.strokeMode).toBe('gradient');
      expect(solid.strokeColor).toBeNull();
      expect(outline.strokeMode).toBe('gradient');
      expect(outline.strokeColor).toBeNull();
      expect(solid.pressedGhostInset).toBe(false);
      expect(outline.pressedGhostInset).toBe(false);
    }
    expect(figmaButtonTokens.gradientStroke.solid).toMatchObject({
      x2: 84.791,
      y2: 39.1182,
      start: '#2A2A2A',
      end: '#585858',
    });
    expect(figmaButtonTokens.gradientStroke.outline).toMatchObject({
      x2: 88.232,
      y2: 20.724,
      start: '#D1D1D1',
      end: '#EBEBEB',
    });
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

  it('uses one capsule stroke radius for both axes', () => {
    const { strokeWidth, radius, sampleWidth, sampleHeight } =
      figmaButtonTokens.metrics;
    expect(
      figmaButtonStrokeRadius({
        borderRadius: radius,
        width: sampleWidth,
        height: sampleHeight,
        strokeWidth,
      }),
    ).toBe(21.25);
    expect(
      figmaButtonStrokeRadius({
        borderRadius: radius,
        width: 136,
        height: sampleHeight,
        strokeWidth,
      }),
    ).toBe((sampleHeight - strokeWidth) / 2);
  });

  it('scales the sample gradient axis with the measured button', () => {
    const { sampleWidth, sampleHeight } = figmaButtonTokens.metrics;
    expect(figmaButtonScaledGradientAxis('solid', sampleWidth, sampleHeight)).toMatchObject({
      x2: 84.791,
      y2: 39.1182,
    });
    const wide = figmaButtonScaledGradientAxis('solid', 136, sampleHeight);
    expect(wide.x2).toBeCloseTo(84.791 * (136 / sampleWidth));
    expect(wide.y2).toBeCloseTo(39.1182);
    const outline = figmaButtonScaledGradientAxis('outline', 141, sampleHeight);
    expect(outline.x2).toBeCloseTo(88.232 * (141 / sampleWidth));
    expect(outline.y2).toBeCloseTo(20.724);
  });
});

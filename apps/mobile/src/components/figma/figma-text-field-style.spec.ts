import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  figmaFieldNativeOutlineStyle,
  figmaFieldShowsFloatingLabel,
  figmaFieldStatus,
  figmaFieldStyle,
  figmaFieldValueColor,
  type FigmaFieldStatus,
} from './figma-text-field-style';

const idle = {
  disabled: false,
  error: false,
  success: false,
  focused: false,
  hovered: false,
  filled: false,
};

function state(overrides: Partial<typeof idle>): FigmaFieldStatus {
  return figmaFieldStatus({ ...idle, ...overrides });
}

describe('Figma text field states', () => {
  it('matches the eight captured field states', () => {
    const cases: Array<{
      status: FigmaFieldStatus;
      border: string;
      fill: string;
      label: boolean;
    }> = [
      { status: state({}), border: '#8A8A8A', fill: '#FFFFFF', label: false },
      { status: state({ hovered: true }), border: '#535353', fill: '#FCFCFC', label: true },
      { status: state({ filled: true }), border: '#2A2A2A', fill: '#FFFFFF', label: true },
      {
        status: state({ filled: true, hovered: true }),
        border: '#000000',
        fill: '#FCFCFC',
        label: true,
      },
      { status: state({ focused: true, filled: true }), border: '#004DFF', fill: '#FFFFFF', label: true },
      { status: state({ error: true, filled: true }), border: '#FF0000', fill: '#FFFFFF', label: true },
      { status: state({ success: true, filled: true }), border: '#039600', fill: '#FFFFFF', label: true },
      { status: state({ disabled: true, filled: true }), border: '#8A8A8A', fill: '#F3F3F3', label: false },
    ];

    expect(cases.map((item) => item.status)).toEqual([
      'empty',
      'hoverEmpty',
      'filled',
      'hoverFilled',
      'focus',
      'error',
      'success',
      'disabled',
    ]);

    for (const item of cases) {
      expect(figmaFieldStyle(item.status)).toMatchObject({
        minHeight: 51,
        borderWidth: 0.5,
        borderRadius: 18,
        borderColor: item.border,
        backgroundColor: item.fill,
        paddingHorizontal: 12,
        paddingVertical: 13,
        gap: 4,
      });
      expect(figmaFieldShowsFloatingLabel(item.status)).toBe(item.label);
    }

    expect(figmaTokens.typography.field).toMatchObject({ fontSize: 14, lineHeight: 24, fontWeight: '400' });
    expect(figmaTokens.typography.fieldLabel).toMatchObject({ fontSize: 12, fontWeight: '400' });
    expect(figmaTokens.typography.fieldLabel).not.toHaveProperty('lineHeight');
    expect(figmaTokens.typography.fieldError).toMatchObject({ fontSize: 12, fontWeight: '400' });
    expect(figmaTokens.typography.fieldError).not.toHaveProperty('lineHeight');
    expect(figmaTokens.color.fieldLabel).toBe('#999999');
    expect(figmaTokens.color.fieldValue).toBe('#121212');
    expect(figmaTokens.color.ink).toBe('#2A2A2A');
    expect(figmaTokens.space.fieldLabelY).toBe(-8);
    expect(figmaTokens.space.fieldErrorGap).toBe(4);
    expect(figmaTokens.space.fieldErrorX).toBe(13);
  });

  it('keeps a filled value from becoming the success state', () => {
    expect(state({ filled: true })).toBe('filled');
    expect(figmaFieldValueColor('filled')).toBe('#121212');
    expect(figmaFieldValueColor('error')).toBe('#121212');
    expect(figmaFieldValueColor('empty')).toBe('#8A8A8A');
  });

  it('top-aligns multiline content while preserving the captured field minimum', () => {
    expect(figmaFieldStyle('filled', true)).toMatchObject({
      minHeight: figmaTokens.size.input,
      alignItems: 'flex-start',
    });
  });

  it('keeps the shell border as the only focus ring, including an error that is focused', () => {
    expect(figmaFieldNativeOutlineStyle).toEqual({
      outlineStyle: 'none',
      outlineWidth: 0,
    });
    expect(state({ error: true, focused: true, filled: true })).toBe('error');
    expect(figmaFieldStyle('error').borderColor).toBe('#FF0000');
    expect(figmaFieldStyle('disabled').backgroundColor).toBe('#F3F3F3');
  });
});

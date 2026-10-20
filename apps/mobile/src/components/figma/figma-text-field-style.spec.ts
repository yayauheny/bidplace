import { describe, expect, it } from 'vitest';

import { designTokens, lightColorMap } from '@bidplace/design-tokens';

import {
  figmaFieldNativeOutlineStyle,
  figmaFieldPlaceholderColor,
  figmaFieldShowsFloatingLabel,
  figmaFieldStatus,
  figmaFieldStyle,
  figmaFieldValueColor,
  type FigmaFieldStatus,
} from './figma-text-field-style';

const light = lightColorMap;

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
      {
        status: state({ hovered: true }),
        border: '#535353',
        fill: '#FCFCFC',
        label: true,
      },
      {
        status: state({ filled: true }),
        border: '#2A2A2A',
        fill: '#FFFFFF',
        label: true,
      },
      {
        status: state({ filled: true, hovered: true }),
        border: '#000000',
        fill: '#FCFCFC',
        label: true,
      },
      {
        status: state({ focused: true, filled: true }),
        border: '#121212',
        fill: '#FFFFFF',
        label: true,
      },
      {
        status: state({ error: true, filled: true }),
        border: '#FF0000',
        fill: '#FFFFFF',
        label: true,
      },
      {
        status: state({ success: true, filled: true }),
        border: '#039600',
        fill: '#FFFFFF',
        label: true,
      },
      {
        status: state({ disabled: true, filled: true }),
        border: '#8A8A8A',
        fill: '#F3F3F3',
        label: false,
      },
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
      expect(
        figmaFieldStyle(item.status, false, 'default', 'default', light),
      ).toMatchObject({
        height: 50,
        minHeight: 50,
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

    expect(designTokens.typography.field).toMatchObject({
      fontSize: 14,
      lineHeight: 24,
      fontWeight: '400',
    });
    expect(designTokens.typography.fieldLabel).toMatchObject({
      fontSize: 12,
      fontWeight: '400',
    });
    expect(designTokens.typography.fieldLabel).not.toHaveProperty('lineHeight');
    expect(designTokens.typography.fieldError).toMatchObject({
      fontSize: 12,
      fontWeight: '400',
    });
    expect(designTokens.typography.fieldError).not.toHaveProperty('lineHeight');
    expect(designTokens.color.fieldLabel).toBe('#999999');
    expect(designTokens.color.fieldValue).toBe('#121212');
    expect(designTokens.color.ink).toBe('#2A2A2A');
    expect(designTokens.space.fieldLabelY).toBe(-8);
    expect(designTokens.space.fieldErrorGap).toBe(4);
    expect(designTokens.space.fieldErrorX).toBe(13);
  });

  it('uses separate password heights without letting content grow the shell', () => {
    expect(
      figmaFieldStyle('empty', false, 'authPassword', 'default', light),
    ).toMatchObject({
      height: 51,
      minHeight: 51,
      paddingVertical: 0,
      borderWidth: 0.5,
    });
    expect(
      figmaFieldStyle('empty', false, 'authScreenPassword', 'default', light),
    ).toMatchObject({
      height: 53,
      minHeight: 53,
      paddingVertical: 0,
      borderWidth: 1,
    });
  });

  it('lightens only the empty border and placeholder for the authorApplication variant', () => {
    expect(
      figmaFieldStyle('empty', false, 'default', 'authorApplication', light),
    ).toMatchObject({
      borderColor: '#999999',
      backgroundColor: '#FFFFFF',
    });
    expect(
      figmaFieldPlaceholderColor('empty', 'authorApplication', light),
    ).toBe('#999999');
    expect(figmaFieldPlaceholderColor('empty', 'default', light)).toBe(
      '#8A8A8A',
    );

    for (const status of [
      'hoverEmpty',
      'filled',
      'focus',
      'error',
      'disabled',
    ] as const) {
      expect(
        figmaFieldStyle(status, false, 'default', 'authorApplication', light)
          .borderColor,
      ).toBe(
        figmaFieldStyle(status, false, 'default', 'default', light).borderColor,
      );
    }
    expect(
      figmaFieldStyle('empty', false, 'default', 'default', light).borderColor,
    ).toBe('#8A8A8A');
  });

  it('keeps a filled value from becoming the success state', () => {
    expect(state({ filled: true })).toBe('filled');
    expect(figmaFieldValueColor('filled', light)).toBe('#121212');
    expect(figmaFieldValueColor('error', light)).toBe('#121212');
    expect(figmaFieldValueColor('empty', light)).toBe('#8A8A8A');
  });

  it('top-aligns multiline content while preserving the captured field minimum', () => {
    const multiline = figmaFieldStyle(
      'filled',
      true,
      'default',
      'default',
      light,
    );
    expect(multiline).toMatchObject({
      minHeight: designTokens.size.input,
      alignItems: 'flex-start',
    });
    expect(multiline).not.toHaveProperty('height');
  });

  it('keeps the shell border as the only focus ring, including an error that is focused', () => {
    expect(figmaFieldNativeOutlineStyle).toEqual({
      outlineStyle: 'none',
      outlineWidth: 0,
    });
    expect(state({ error: true, focused: true, filled: true })).toBe('error');
    expect(
      figmaFieldStyle('error', false, 'default', 'default', light).borderColor,
    ).toBe('#FF0000');
    expect(
      figmaFieldStyle('disabled', false, 'default', 'default', light)
        .backgroundColor,
    ).toBe('#F3F3F3');
  });
});

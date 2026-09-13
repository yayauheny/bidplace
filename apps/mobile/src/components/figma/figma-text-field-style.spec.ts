import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  figmaFieldShowsFloatingLabel,
  figmaFieldStatus,
  figmaFieldStyle,
} from './figma-text-field-style';

describe('Figma text field states', () => {
  it('keeps the empty idle field unlabeled', () => {
    const status = figmaFieldStatus({
      disabled: false,
      error: false,
      success: false,
      focused: false,
      hovered: false,
      filled: false,
    });

    expect(status).toBe('empty');
    expect(figmaFieldShowsFloatingLabel(status)).toBe(false);
    expect(figmaFieldStyle(status)).toMatchObject({
      minHeight: 52,
      borderColor: figmaTokens.color.muted,
      alignItems: 'center',
    });
  });

  it('top-aligns multiline content while preserving the captured field minimum', () => {
    expect(figmaFieldStyle('filled', true)).toMatchObject({
      minHeight: figmaTokens.size.input,
      alignItems: 'flex-start',
    });
  });

  it('uses the blue focus ring while typing', () => {
    const status = figmaFieldStatus({
      disabled: false,
      error: false,
      success: false,
      focused: true,
      hovered: false,
      filled: true,
    });

    expect(status).toBe('focus');
    expect(figmaFieldShowsFloatingLabel(status)).toBe(true);
    expect(figmaFieldStyle(status).borderColor).toBe(figmaTokens.color.focus);
  });

  it('keeps error above success and shows helper-ready status', () => {
    const status = figmaFieldStatus({
      disabled: false,
      error: true,
      success: true,
      focused: false,
      hovered: false,
      filled: true,
    });

    expect(status).toBe('error');
    expect(figmaFieldStyle(status).borderColor).toBe(figmaTokens.color.error);
  });
});

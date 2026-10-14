import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import { figmaIconStrokeWidth } from './figma-icon-style';

describe('Figma icon stroke widths', () => {
  it('keeps the two captured filter controls at 1.25 px', () => {
    expect(figmaIconStrokeWidth('filter-horizontal', 18)).toBe(
      designTokens.stroke.iconHeavy,
    );
    expect(figmaIconStrokeWidth('arrow-up-down', 18)).toBe(
      designTokens.stroke.iconHeavy,
    );
  });

  it('uses the captured 1.13 px stroke for regular 18 px icons', () => {
    expect(figmaIconStrokeWidth('search-01', 18)).toBe(
      designTokens.stroke.icon,
    );
  });

  it('scales dock-size icons to the captured 1.5 px stroke', () => {
    expect(figmaIconStrokeWidth('search-01', 24)).toBe(
      designTokens.stroke.dockIcon,
    );
  });
});

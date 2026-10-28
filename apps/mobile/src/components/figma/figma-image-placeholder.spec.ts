import { describe, expect, it } from 'vitest';

import {
  figmaImagePlaceholderPath,
  figmaImagePlaceholderSpec,
} from './figma-image-placeholder';

describe('Figma image placeholder', () => {
  it('keeps the exact captured vector geometry and orientation', () => {
    expect(figmaImagePlaceholderSpec).toMatchObject({
      sourceNodeId: '874:5454',
      width: 188,
      height: 142,
      rotation: 180,
      rotationOriginX: 94,
      rotationOriginY: 71,
    });
    expect(figmaImagePlaceholderPath).toContain('M 119.12982505338182');
    expect(figmaImagePlaceholderPath).toContain('M 116.40773515574124');
  });

  it('fits the captured work-card width without stretching', () => {
    expect(figmaImagePlaceholderSpec.workCoverWidth).toBe(264);
    expect(figmaImagePlaceholderSpec.relativeWidth).toBe(
      '71.21212121212122%',
    );
  });
});

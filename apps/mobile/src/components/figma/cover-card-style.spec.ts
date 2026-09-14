import { beforeAll, describe, expect, it, vi } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

let coverCardFrameStyle: typeof import('./cover-card-style').coverCardFrameStyle;

describe('coverCardFrameStyle', () => {
  beforeAll(async () => {
    ({ coverCardFrameStyle } = await import('./cover-card-style'));
  });

  it('keeps the default author card on the shared cover aspect ratio', () => {
    expect(coverCardFrameStyle('author')).toMatchObject({
      width: '100%',
      aspectRatio: figmaTokens.size.coverWidth / figmaTokens.size.coverHeight,
    });
  });

  it('occupies an explicit Frame 47 box without scaling', () => {
    expect(
      coverCardFrameStyle('author', { width: 322, height: 430 }),
    ).toMatchObject({
      width: 322,
      height: 430,
    });
    expect(
      coverCardFrameStyle('author', { width: 322, height: 430 }).aspectRatio,
    ).toBeUndefined();
  });
});

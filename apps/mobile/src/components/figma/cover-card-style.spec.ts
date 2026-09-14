import { beforeAll, describe, expect, it, vi } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

let coverArtworkFrameStyle: typeof import('./cover-card-style').coverArtworkFrameStyle;
let coverCardFrameStyle: typeof import('./cover-card-style').coverCardFrameStyle;

describe('coverCardFrameStyle', () => {
  beforeAll(async () => {
    ({ coverArtworkFrameStyle, coverCardFrameStyle } = await import(
      './cover-card-style'
    ));
  });

  it('keeps the default author card on the shared cover aspect ratio', () => {
    expect(coverCardFrameStyle('author')).toMatchObject({
      width: '100%',
      aspectRatio: figmaTokens.size.coverWidth / figmaTokens.size.coverHeight,
      borderRadius: figmaTokens.radius.authorCover,
    });
  });

  it('occupies an explicit Frame 47 box without scaling', () => {
    expect(
      coverCardFrameStyle('author', { width: 322, height: 430 }),
    ).toMatchObject({
      width: 322,
      height: 430,
      borderRadius: figmaTokens.radius.authorCover,
    });
    expect(
      coverCardFrameStyle('author', { width: 322, height: 430 }).aspectRatio,
    ).toBeUndefined();
  });

  it('lets the Home fan use Frame 47 radius without changing catalog cards', () => {
    expect(
      coverCardFrameStyle('author', { width: 322, height: 430 }, 24),
    ).toMatchObject({
      width: 322,
      height: 430,
      borderRadius: 24,
      overflow: 'hidden',
    });
    expect(coverCardFrameStyle('author').borderRadius).toBe(
      figmaTokens.radius.authorCover,
    );
  });

  it('clips the artwork layer to the same fan radius and can stay unscaled', () => {
    expect(coverArtworkFrameStyle(false, 24)).toMatchObject({
      borderRadius: 24,
      overflow: 'hidden',
      transform: [{ scale: 1 }],
    });
    expect(coverArtworkFrameStyle(true).borderRadius).toBeUndefined();
  });
});

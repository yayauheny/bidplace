import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  authorCoverNameVeilStyle,
  authorCoverTagRowStyle,
  coverCardBox,
  coverCardFocusStyle,
  coverCardFrameStyle,
  coverCardMediaStyle,
  coverCardPressableStyle,
  coverCardSpec,
  coverCardSurfaceStyle,
} from './cover-card-style';

describe('Cover card geometry', () => {
  it('locks the 264×352 master and 366×488 consumer without stretch', () => {
    const master = coverCardBox(figmaTokens.size.coverWidth);
    const consumer = coverCardBox(figmaTokens.layout.cardWidth);
    const spec = coverCardSpec();

    expect(master).toEqual({
      width: 264,
      height: 352,
      aspectRatio: 264 / 352,
    });
    expect(consumer).toEqual({
      width: 366,
      height: 488,
      aspectRatio: 264 / 352,
    });
    expect(consumer.height).toBe(figmaTokens.size.listCoverHeight);
    expect(consumer.height).toBe(
      (consumer.width * figmaTokens.size.coverHeight) /
        figmaTokens.size.coverWidth,
    );
    expect(spec.masterWidth).toBe(264);
    expect(spec.masterHeight).toBe(352);
    expect(spec.consumerWidth).toBe(366);
    expect(spec.consumerHeight).toBe(488);
    expect(spec.contentFit).toBe('cover');
    expect(spec.titleMaxLines).toBe(2);
  });

  it('keeps work and author radii and clipped full-width frames', () => {
    expect(coverCardFrameStyle('work')).toMatchObject({
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      alignSelf: 'stretch',
      flexShrink: 0,
      aspectRatio: 264 / 352,
      position: 'relative',
      borderRadius: 24,
      overflow: 'hidden',
    });
    expect(coverCardFrameStyle('author')).toMatchObject({
      width: '100%',
      aspectRatio: 264 / 352,
      borderRadius: 28,
    });
    expect(coverCardPressableStyle('work')).toMatchObject({
      width: '100%',
      overflow: 'hidden',
      borderRadius: 24,
    });
    expect(coverCardPressableStyle('author')).toMatchObject({
      overflow: 'hidden',
      borderRadius: 28,
    });
    expect(coverCardSurfaceStyle('author')).toMatchObject({
      width: '100%',
      justifyContent: 'space-between',
    });
    expect(coverCardMediaStyle).toMatchObject({
      width: '100%',
      aspectRatio: 264 / 352,
    });
  });

  it('uses captured overlay gaps and a token focus ring', () => {
    expect(coverCardSpec().rowGap).toBe(6);
    expect(coverCardSpec().blockGap).toBe(4);
    expect(coverCardSpec().chipGap).toBe(4);
    expect(authorCoverNameVeilStyle()).toMatchObject({
      paddingTop: 20,
      paddingBottom: 12,
      paddingHorizontal: 12,
    });
    expect(authorCoverTagRowStyle()).toMatchObject({
      flexWrap: 'nowrap',
      overflow: 'hidden',
      gap: 4,
    });
    expect(coverCardFocusStyle(false)).toBeNull();
    expect(coverCardFocusStyle(true)).toEqual({
      outlineWidth: 2,
      outlineOffset: 2,
      outlineColor: figmaTokens.color.focus,
      outlineStyle: 'solid',
      outline: `2px solid ${figmaTokens.color.focus}`,
    });
  });
});

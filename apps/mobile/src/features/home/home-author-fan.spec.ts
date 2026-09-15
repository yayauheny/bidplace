import { describe, expect, it } from 'vitest';

import { homeAuthorFanLayout, homeAuthorFanSlots } from './home-author-fan';
import { type HomeAuthor } from './home-sections';

function author(slug: string, photo = `/api/sellers/${slug}/photo`): HomeAuthor {
  return {
    slug,
    fullName: slug,
    profilePhotoUrl: photo,
  };
}

describe('homeAuthorFanSlots', () => {
  it('locks Frame 47 card radius, shadow, and top-left rotation origin', () => {
    expect(homeAuthorFanLayout.cardRadius).toBe(24);
    expect(homeAuthorFanLayout.frontShadow).toBe(
      '0 6px 20px rgba(58, 58, 58, 0.40)',
    );
    expect(homeAuthorFanLayout.rearTransformOrigin).toBe('0px 0px');
    expect(homeAuthorFanLayout.frontPos).toEqual({ x: 22, y: 0 });
    expect(homeAuthorFanLayout.rearLeft).toEqual({
      x: 2.45,
      y: 22.72,
      rotate: '1deg',
    });
    expect(homeAuthorFanLayout.rearRight).toEqual({
      x: 55.6,
      y: 17.34,
      rotate: '-1deg',
    });
  });

  it('hides when no author has a photo', () => {
    expect(homeAuthorFanSlots([author('vex', '')])).toEqual([]);
  });

  it('uses a single front card for one author', () => {
    expect(homeAuthorFanSlots([author('vex')])).toEqual([
      { slot: 'front', author: author('vex') },
    ]);
  });

  it('uses front plus one rear for two authors and never duplicates', () => {
    const slots = homeAuthorFanSlots([author('vex'), author('havoc'), author('vex')]);
    expect(slots.map((item) => [item.slot, item.author.slug])).toEqual([
      ['rearRight', 'havoc'],
      ['front', 'vex'],
    ]);
  });

  it('uses the first three unique photo authors for the full fan', () => {
    const slots = homeAuthorFanSlots([
      author('vex'),
      author('quantumparadox'),
      author('havoc'),
      author('bala_klava'),
    ]);
    expect(slots.map((item) => [item.slot, item.author.slug])).toEqual([
      ['rearRight', 'havoc'],
      ['rearLeft', 'quantumparadox'],
      ['front', 'vex'],
    ]);
  });
});

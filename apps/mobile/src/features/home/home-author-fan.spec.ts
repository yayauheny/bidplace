import { describe, expect, it } from 'vitest';

import { homeAuthorFanSlots } from './home-author-fan';
import { type HomeAuthor } from './home-sections';

function author(slug: string, photo = `/api/sellers/${slug}/photo`): HomeAuthor {
  return {
    slug,
    fullName: slug,
    profilePhotoUrl: photo,
  };
}

describe('homeAuthorFanSlots', () => {
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

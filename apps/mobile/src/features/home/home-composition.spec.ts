import { describe, expect, it } from 'vitest';

import {
  authorDisciplineTags,
  isHomeEmpty,
  shouldRenderCuratorFeature,
} from './home-composition';

const curatorSelection = {
  work: {
    publicId: 'abcdefghijk',
    title: 'Внутренние миры',
    images: [{ url: '/api/images/10000000-0000-4000-8000-000000000001' }],
  },
  author: {
    slug: 'vex',
    fullName: 'Vex',
    profilePhotoUrl: '/api/sellers/vex/photo',
    shortDescription: 'Ищу логику в абсурде.',
  },
};

describe('home composition', () => {
  it('mounts curator only when the server selection is present', () => {
    expect(shouldRenderCuratorFeature(null)).toBe(false);
    expect(shouldRenderCuratorFeature(undefined)).toBe(false);
    expect(shouldRenderCuratorFeature(curatorSelection)).toBe(true);
  });

  it('treats home as empty only when curator, works and authors are all absent', () => {
    expect(
      isHomeEmpty({
        curatorSelection: null,
        newWorksCount: 0,
        newAuthorsCount: 0,
      }),
    ).toBe(true);
    expect(
      isHomeEmpty({
        curatorSelection,
        newWorksCount: 0,
        newAuthorsCount: 0,
      }),
    ).toBe(false);
    expect(
      isHomeEmpty({
        curatorSelection: null,
        newWorksCount: 1,
        newAuthorsCount: 0,
      }),
    ).toBe(false);
  });

  it('splits present discipline tags and omits blanks', () => {
    expect(authorDisciplineTags('Живопись,  графика')).toEqual([
      'Живопись',
      'графика',
    ]);
    expect(authorDisciplineTags(null)).toEqual([]);
    expect(authorDisciplineTags('  ')).toEqual([]);
  });
});

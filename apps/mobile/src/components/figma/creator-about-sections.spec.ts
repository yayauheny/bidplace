import { describe, expect, it } from 'vitest';

import { visibleCreatorAboutSections } from './creator-about-sections';

describe('creator about sections', () => {
  it('omits empty biography and practice', () => {
    expect(
      visibleCreatorAboutSections({
        biography: '  ',
        practice: null,
      }),
    ).toEqual([]);
  });

  it('keeps only filled sections', () => {
    expect(
      visibleCreatorAboutSections({
        biography: ' Живёт в Минске. ',
        practice: 'Работает с глиной.',
      }),
    ).toEqual([
      {
        id: 'biography',
        title: 'Биография',
        body: 'Живёт в Минске.',
      },
      {
        id: 'practice',
        title: 'Практика и подход',
        body: 'Работает с глиной.',
      },
    ]);
  });
});

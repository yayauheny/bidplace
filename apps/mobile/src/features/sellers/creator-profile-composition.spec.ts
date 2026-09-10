import { describe, expect, it } from 'vitest';

import {
  authorDisciplineTags,
  toAchievementRecords,
} from './creator-profile-composition';

describe('creator profile composition', () => {
  it('maps achievements and omits blank discipline tags', () => {
    expect(
      toAchievementRecords([
        {
          id: '10000000-0000-4000-8000-000000000001',
          body: 'Персональная выставка',
          occurredAt: '2024-05-01T00:00:00.000Z',
          image: { url: '/api/author-achievements/10000000-0000-4000-8000-000000000001/image' },
        },
      ]),
    ).toEqual([
      {
        id: '10000000-0000-4000-8000-000000000001',
        body: 'Персональная выставка',
        occurredAt: '2024-05-01T00:00:00.000Z',
        imageUrl: '/api/author-achievements/10000000-0000-4000-8000-000000000001/image',
      },
    ]);
    expect(authorDisciplineTags('Живопись,  графика')).toEqual([
      'Живопись',
      'графика',
    ]);
    expect(authorDisciplineTags(null)).toEqual([]);
  });
});

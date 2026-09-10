import { describe, expect, it } from 'vitest';

import {
  ACHIEVEMENT_CARD_WIDTH,
  achievementDateLabel,
  visibleAchievementRecords,
} from './achievements-timeline';

describe('achievements timeline', () => {
  it('renders nothing when the record list is empty or blank', () => {
    expect(visibleAchievementRecords([])).toEqual([]);
    expect(
      visibleAchievementRecords([
        { id: '1', body: '   ', occurredAt: null, imageUrl: null },
      ]),
    ).toEqual([]);
  });

  it('keeps image and text-only records on a phone card width', () => {
    const records = visibleAchievementRecords([
      {
        id: 'image',
        body: 'Персональная выставка',
        occurredAt: '2026-04-01T00:00:00.000Z',
        imageUrl: '/api/author-achievements/1/image',
      },
      {
        id: 'text',
        body: 'Окончила Академию',
        occurredAt: null,
        imageUrl: null,
      },
    ]);

    expect(records).toHaveLength(2);
    expect(records[0]?.imageUrl).toBeTruthy();
    expect(records[1]?.imageUrl).toBeNull();
    expect(ACHIEVEMENT_CARD_WIDTH).toBe(266);
    expect(ACHIEVEMENT_CARD_WIDTH).toBeLessThan(1471);
  });

  it('formats a month-year label from occurredAt', () => {
    expect(achievementDateLabel(null)).toBeNull();
    expect(achievementDateLabel('not-a-date')).toBeNull();
    expect(achievementDateLabel('2026-04-01T00:00:00.000Z')).toMatch(/2026/);
  });
});

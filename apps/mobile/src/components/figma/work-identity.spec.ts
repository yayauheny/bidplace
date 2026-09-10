import { describe, expect, it } from 'vitest';

import { getWorkIdentityContent } from './work-identity';

describe('work identity', () => {
  it('builds title, author link and chips without commerce', () => {
    const content = getWorkIdentityContent({
      title: ' Внутренние миры ',
      authorName: 'Илья Васильев',
      authorSlug: 'vex',
      city: 'Минск',
      technique: 'Акварель',
      materials: 'Бумага',
    });

    expect(content.title).toBe('Внутренние миры');
    expect(content.authorHref).toBe('/seller/vex');
    expect(content.chips).toEqual(['Минск', 'Акварель', 'Бумага']);
    expect(JSON.stringify(content)).not.toMatch(/BYN|ставку|торг/i);
  });
});

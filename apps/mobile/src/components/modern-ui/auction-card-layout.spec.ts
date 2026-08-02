import { describe, expect, it } from 'vitest';

import { getAuctionCardContent } from './auction-card-layout';

function itemWith(overrides: {
  title?: string;
  story?: string;
  price?: number;
  status?: 'LIVE' | 'SCHEDULED' | 'ENDED';
}) {
  return {
    product: {
      title: overrides.title ?? 'Предмет',
      story: overrides.story,
    },
    listing: overrides.status
      ? {
          currentPrice: overrides.price ?? 75,
          status: overrides.status,
          endsAt: '2026-08-10T12:00:00.000Z',
        }
      : null,
  };
}

describe('auction card content contract', () => {
  it('keeps a long title and one-line description content available to the card', () => {
    const content = getAuctionCardContent(
      itemWith({
        title:
          'Очень длинное название авторского предмета для проверки карточки',
        story: 'История предмета с переносами\nи лишними пробелами.',
      }),
    );

    expect(content.title).toContain('Очень длинное название');
    expect(content.description).toBe(
      'История предмета с переносами и лишними пробелами.',
    );
  });

  it('keeps the full four-digit BYN amount as one value', () => {
    expect(
      getAuctionCardContent(itemWith({ price: 1200, status: 'LIVE' })).price,
    ).toBe('1200 BYN');
  });

  it.each([
    ['LIVE', 'Торги идут'],
    ['SCHEDULED', 'Скоро'],
    ['ENDED', 'Завершено'],
  ] as const)('uses truthful %s status text', (status, label) => {
    expect(getAuctionCardContent(itemWith({ status })).status).toBe(label);
  });
});

import { describe, expect, it } from 'vitest';

import { visibleWorkStory } from './work-story';
import { visibleWorkFacts } from './work-facts';
import {
  PAYMENT_DELIVERY_STUB,
  PAYMENT_DELIVERY_TITLE,
} from './payment-delivery-stub';
import { visibleRelatedWorks } from './related-works';

describe('work story, facts, stub and related', () => {
  it('omits empty story and optional facts', () => {
    expect(visibleWorkStory('  ')).toBeNull();
    expect(visibleWorkStory('История работы')).toBe('История работы');
    expect(
      visibleWorkFacts({
        technique: 'Акварель',
        materials: '  ',
        dimensions: null,
        year: 2026,
        city: undefined,
      }),
    ).toEqual([
      { label: 'Техника', value: 'Акварель' },
      { label: 'Год создания', value: '2026' },
    ]);
  });

  it('keeps the payment stub free of price and CTA', () => {
    expect(PAYMENT_DELIVERY_TITLE).toBe('Оплата и доставка');
    expect(PAYMENT_DELIVERY_STUB.toLowerCase()).not.toContain('корзин');
    expect(PAYMENT_DELIVERY_STUB.toLowerCase()).not.toContain('купить');
  });

  it('renders no related section for an empty list', () => {
    expect(visibleRelatedWorks([])).toEqual([]);
    expect(
      visibleRelatedWorks([
        {
          publicId: 'abcdefghijk',
          title: 'Желтый сапфир',
          imageUrl: '/img',
          authorSlug: 'vex',
        },
      ]),
    ).toHaveLength(1);
  });
});

import { describe, expect, it } from 'vitest';

import { PAYMENT_DELIVERY_STUB } from './payment-delivery-stub';

describe('Work page commerce stub', () => {
  it('keeps payment and delivery unavailable in v1 without a bid CTA', () => {
    expect(PAYMENT_DELIVERY_STUB).toBe(
      'Оплата и доставка на bidplace пока недоступны.',
    );
    expect(PAYMENT_DELIVERY_STUB.toLowerCase()).not.toContain('корзин');
    expect(PAYMENT_DELIVERY_STUB.toLowerCase()).not.toContain('купить');
  });
});

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { PAYMENT_DELIVERY_STUB } from './payment-delivery-stub';

const productScreen = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'product-screen.tsx'),
  'utf8',
);

describe('Work page commerce stub', () => {
  it('keeps payment and delivery unavailable in v1 without a bid CTA', () => {
    expect(PAYMENT_DELIVERY_STUB).toBe(
      'Оплата и доставка на bidplace пока недоступны.',
    );
    expect(PAYMENT_DELIVERY_STUB.toLowerCase()).not.toContain('корзин');
    expect(PAYMENT_DELIVERY_STUB.toLowerCase()).not.toContain('купить');
  });
});

describe('Work top chrome', () => {
  it('adds the 48×48 back control, keeps Share, and hides Like', () => {
    const nativeHeader = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'WorkHeader.tsx'),
      'utf8',
    );
    const webHeader = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'WorkHeader.web.tsx'),
      'utf8',
    );
    const webActions = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'WorkActions.tsx'),
      'utf8',
    );
    expect(productScreen).toContain('navigateWorkPageBack(router)');
    expect(productScreen).toContain('<WorkHeader');
    expect(nativeHeader).toContain('leadingAction=');
    expect(webHeader).toContain('leadingAction=');
    expect(webHeader).toContain('WorkCompactNav');
    expect(webHeader).toContain('contentInset={designTokens.space.pageGutter}');
    expect(nativeHeader).toContain('WorkBackControl');
    expect(nativeHeader).toContain('WorkShareControl');
    expect(webActions).toContain('icon="arrow-left-01"');
    expect(webActions).toContain('icon="share-04"');
    expect(webActions).not.toContain('icon="heart"');
    expect(nativeHeader).not.toContain('icon="heart"');
    expect(productScreen).not.toContain('icon="heart"');
  });
});

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
    expect(productScreen).toContain('navigateWorkPageBack(router)');
    expect(productScreen).toContain('<WorkHeader');
    for (const header of [nativeHeader, webHeader]) {
      expect(header).toContain('leadingAction=');
      expect(header).toContain('icon="arrow-left-01"');
      expect(header).toContain('icon="share-04"');
      expect(header).not.toContain('icon="heart"');
    }
    expect(productScreen).not.toContain('icon="heart"');
    expect(webHeader).not.toContain('onActiveIndexChange');
    expect(webHeader).not.toContain('work-compact-thumb');
    expect(webHeader).not.toContain("left: '50%'");
    expect(webHeader).toContain('data-testid="work-identity-shell"');
    expect(webHeader).toContain("setAttribute('inert', '')");
    expect(webHeader).toContain('onLayout=');
    expect(webHeader).not.toContain('ResizeObserver');
  });
});

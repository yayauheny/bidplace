import { describe, expect, it } from 'vitest';

import { canOpenSellerProfileStep, resolveSellerProfileStep } from './seller-profile-wizard';

describe('seller profile draft wizard', () => {
  it('keeps Step 1 for malformed and unpersisted Step 2 URLs', () => {
    expect(resolveSellerProfileStep('unexpected', false)).toBe(1);
    expect(resolveSellerProfileStep('2', false)).toBe(1);
  });

  it('keeps persisted drafts on Step 2 and does not relock it after returning to Step 1', () => {
    expect(resolveSellerProfileStep('2', true)).toBe(2);
    expect(canOpenSellerProfileStep(2, true)).toBe(true);
  });
});

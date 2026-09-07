import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { CommerceCapability } from './commerce-capability';

describe('CommerceCapability', () => {
  it('fails closed when commerce is disabled', () => {
    const capability = new CommerceCapability(false);

    expect(capability.isEnabled()).toBe(false);
    expect(() => capability.assertEnabled()).toThrow(NotFoundException);
  });

  it('allows explicitly enabled commerce', () => {
    const capability = new CommerceCapability(true);

    expect(capability.isEnabled()).toBe(true);
    expect(() => capability.assertEnabled()).not.toThrow();
  });
});

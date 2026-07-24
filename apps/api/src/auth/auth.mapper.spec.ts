import { describe, expect, it } from 'vitest';

import { InvalidPersistenceValueError } from '../core/contracts';
import { toContractUser } from './auth.mapper';

describe('auth mapper', () => {
  it('maps a raw user record to the contract shape', () => {
    expect(
      toContractUser({
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        email: 'seller@example.com',
        phone: '+15555550123',
        displayName: 'Demo Seller',
        role: 'user',
        status: 'active',
        createdAt: new Date('2026-07-13T12:00:00.000Z'),
        updatedAt: new Date('2026-07-13T12:00:00.000Z'),
      }),
    ).toEqual({
      id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      email: 'seller@example.com',
      phone: '+15555550123',
      emailVerifiedAt: null,
      phoneVerifiedAt: null,
      acceptedRulesVersion: null,
      displayName: 'Demo Seller',
      role: 'user',
      status: 'active',
      createdAt: '2026-07-13T12:00:00.000Z',
      updatedAt: '2026-07-13T12:00:00.000Z',
    });
  });

  it.each([
    ['role', { role: 'invalid' }],
    ['status', { status: 'invalid' }],
  ] as const)('rejects invalid user %s values', (_, patch) => {
    expect(() =>
      toContractUser({
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        email: 'seller@example.com',
        phone: '+15555550123',
        displayName: 'Demo Seller',
        role: 'user',
        status: 'active',
        createdAt: new Date('2026-07-13T12:00:00.000Z'),
        updatedAt: new Date('2026-07-13T12:00:00.000Z'),
        ...patch,
      }),
    ).toThrow(InvalidPersistenceValueError);
  });
});

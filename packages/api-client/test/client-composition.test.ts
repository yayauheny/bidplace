import { describe, expect, it } from 'vitest';

import { createApiClient } from '../src';

describe('createApiClient composition', () => {
  it('exposes portfolio, auth and seller write without commerce clients', () => {
    const client = createApiClient({ baseUrl: 'http://localhost' });

    expect(Object.keys(client).sort()).toEqual([
      'admin',
      'analytics',
      'auth',
      'baseUrl',
      'categories',
      'images',
      'portfolio',
      'products',
      'request',
      'sellers',
    ]);
    expect(client).not.toHaveProperty('listings');
    expect(client).not.toHaveProperty('orders');
    expect(client).not.toHaveProperty('activity');
    expect(client).not.toHaveProperty('discovery');
    expect(Object.keys(client.products).sort()).toEqual([
      'create',
      'reorderCreation',
      'replaceCreation',
      'submit',
      'update',
    ]);
    expect(Object.keys(client.sellers).sort()).toEqual([
      'createProfile',
      'getMyProfile',
      'getProduct',
      'listProducts',
      'updateProfile',
    ]);
    expect(Object.keys(client.admin).sort()).toEqual([
      'clearCuratorSelection',
      'getAnalyticsOverview',
      'listProducts',
      'listSellerProfiles',
      'lookupUsers',
      'revokeUserSessions',
      'setCuratorSelection',
      'updateProductStatus',
      'updateSellerStatus',
      'updateUserStatus',
    ]);
  });
});

import { describe, expect, it } from 'vitest';

import { ActivityController } from './activity.controller';

describe('ActivityController', () => {
  it('rejects buyer activity for admin accounts', async () => {
    const controller = new ActivityController({} as never);

    expect(() => controller.get({ sub: 'admin-id', role: 'admin' })).toThrow(
      'Administrators do not have buyer activity',
    );
  });
});

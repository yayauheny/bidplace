import { describe, expect, it } from 'vitest';

import { syntheticProductionServerEnv } from '../config/synthetic-server-env';
import { LocalMailTransport } from './local-mail-transport';

describe('LocalMailTransport', () => {
  it('refuses to send on the injected production profile', async () => {
    const transport = new LocalMailTransport(syntheticProductionServerEnv());

    await expect(
      transport.send({
        to: 'user@example.com',
        subject: 'test',
        text: 'test',
      }),
    ).rejects.toThrow('Local mail transport cannot run in production');
  });
});

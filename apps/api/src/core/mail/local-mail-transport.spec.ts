import { describe, expect, it } from 'vitest';
import { readFile, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { syntheticProductionServerEnv, syntheticServerEnv } from '../config/synthetic-server-env';
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

  it('captures the pre-registration email code in the local test mailbox', async () => {
    const path = join(tmpdir(), `bidplace-mail-${randomUUID()}.jsonl`);
    const transport = new LocalMailTransport({
      ...syntheticServerEnv(),
      TEST_EMAIL_FILE: path,
    });
    try {
      await transport.send({
        to: 'synthetic@example.test',
        subject: 'Код подтверждения почты bidplace',
        text: 'Код подтверждения почты bidplace: 123456.',
      });
      const payload = JSON.parse(await readFile(path, 'utf8')) as { email?: string; code?: string };
      expect(payload).toMatchObject({ email: 'synthetic@example.test', code: '123456' });
    } finally {
      await rm(path, { force: true });
    }
  });
});

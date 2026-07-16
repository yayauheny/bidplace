import { describe, expect, it } from 'vitest';

import { resolveServerEnvFilePath } from './env';

describe('resolveServerEnvFilePath', () => {
  it('prefers BIDPLACE_ENV_FILE override', () => {
    expect(
      resolveServerEnvFilePath({
        envOverride: '/tmp/bidplace.env',
      }),
    ).toBe('/tmp/bidplace.env');
  });

  it('finds the repository env file from a src directory', () => {
    const envPath = '/repo/.env';

    expect(
      resolveServerEnvFilePath({
        moduleDir: '/repo/apps/api/src/core/config',
        fileExists: (filePath) => filePath === envPath,
      }),
    ).toBe(envPath);
  });

  it('finds the repository env file from a dist directory', () => {
    const envPath = '/repo/.env';

    expect(
      resolveServerEnvFilePath({
        moduleDir: '/repo/apps/api/dist/core/config',
        fileExists: (filePath) => filePath === envPath,
      }),
    ).toBe(envPath);
  });
});

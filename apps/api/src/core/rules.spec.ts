import { describe, expect, it } from 'vitest';

import { resolveServiceRules } from './rules';
import type { ServerEnv } from './config';

const localEnv = {
  NODE_ENV: 'development',
  APP_ENV: 'local',
} as ServerEnv;

describe('resolveServiceRules', () => {
  it('uses local defaults outside the production profile', () => {
    expect(resolveServiceRules(localEnv)).toMatchObject({
      owner: 'bidplace',
      contact: 'support@bidplace.test',
      text: 'bidplace MVP rules ...',
    });
  });

  it('fails closed when production profile is missing SERVICE_RULES_TEXT', () => {
    expect(() =>
      resolveServiceRules({
        NODE_ENV: 'production',
        APP_ENV: 'production',
      } as ServerEnv),
    ).toThrow('SERVICE_RULES_TEXT is required in production');
  });

  it('fails closed when APP_ENV=production even if NODE_ENV is not production', () => {
    expect(() =>
      resolveServiceRules({
        NODE_ENV: 'development',
        APP_ENV: 'production',
      } as ServerEnv),
    ).toThrow('SERVICE_RULES_TEXT is required in production');
  });
});

import { expect, it } from 'vitest';
import {
  containerEnvironment,
  containerVariables,
  requiredSecrets,
  type RuntimeEnvironment,
} from './environment';

it('passes only declared settings and never unrelated build or deploy credentials', () => {
  const env = Object.fromEntries(
    [...containerVariables, ...requiredSecrets].map((name) => [
      name,
      `local-${name}`,
    ]),
  );
  Object.assign(env, {
    CLOUDFLARE_API_TOKEN: 'local-deploy-only',
    EXPO_PUBLIC_API_URL: 'https://bid.place',
    RELEASE_CONTROL: 'local-release-control',
  });
  const result = containerEnvironment(env as RuntimeEnvironment);
  expect(result.INTERNAL_TICK_SECRET).toBe('local-INTERNAL_TICK_SECRET');
  expect(result.SESSION_SECRET).toBe('local-SESSION_SECRET');
  expect(result).not.toHaveProperty('CLOUDFLARE_API_TOKEN');
  expect(result).not.toHaveProperty('EXPO_PUBLIC_API_URL');
  expect(result).not.toHaveProperty('RELEASE_CONTROL');
});

it.each(requiredSecrets)(
  'rejects a missing runtime secret without revealing other values: %s',
  (name) => {
    const env = Object.fromEntries(
      [...containerVariables, ...requiredSecrets].map((key) => [
        key,
        'local-secret-canary',
      ]),
    );
    env[name] = '';
    expect(() => containerEnvironment(env as RuntimeEnvironment)).toThrow(
      `Missing Container setting: ${name}`,
    );
  },
);

it('passes the new analytics server flag only when explicitly configured', () => {
  const env = Object.fromEntries(
    [...containerVariables, ...requiredSecrets].map((key) => [key, 'fixture']),
  );
  expect(containerEnvironment(env as RuntimeEnvironment)).not.toHaveProperty(
    'ANALYTICS_WEB_ENABLED',
  );
  expect(
    containerEnvironment({
      ...env,
      ANALYTICS_WEB_ENABLED: 'true',
    } as RuntimeEnvironment).ANALYTICS_WEB_ENABLED,
  ).toBe('true');
  expect(
    containerEnvironment({
      ...env,
      EXPO_PUBLIC_ANALYTICS_WEB_ENABLED: 'true',
    } as RuntimeEnvironment),
  ).not.toHaveProperty('EXPO_PUBLIC_ANALYTICS_WEB_ENABLED');
});

it('requires the internal tick secret and forwards the optional schedule', () => {
  expect(requiredSecrets).toContain('INTERNAL_TICK_SECRET');
  const env = Object.fromEntries(
    [...containerVariables, ...requiredSecrets].map((key) => [key, 'fixture']),
  );
  expect(containerEnvironment(env as RuntimeEnvironment)).not.toHaveProperty('TICK_CRON');
  expect(containerEnvironment({ ...env, TICK_CRON: '*/5 * * * *' } as RuntimeEnvironment).TICK_CRON)
    .toBe('*/5 * * * *');
});

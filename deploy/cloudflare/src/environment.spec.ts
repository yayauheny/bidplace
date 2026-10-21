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

import { describe, expect, it } from 'vitest';

import {
  ENV_PROFILE_ERROR,
  isExplicitLocalDevelopmentProfile,
  isExplicitLocalTestProfile,
  isTestEmailBypassEnabled,
  requiresProductionSecurity,
} from './env-profile';

const NODE_ENVS = ['development', 'test', 'production'] as const;
const APP_ENVS = ['local', 'staging', 'production'] as const;

describe('environment profile predicates', () => {
  it.each(
    NODE_ENVS.flatMap((NODE_ENV) =>
      APP_ENVS.map((APP_ENV) => ({ NODE_ENV, APP_ENV })),
    ),
  )(
    'classifies $NODE_ENV/$APP_ENV without silent production-like fallbacks',
    ({ NODE_ENV, APP_ENV }) => {
      const env = { NODE_ENV, APP_ENV };
      const productionLike =
        NODE_ENV === 'production' || APP_ENV === 'production';

      expect(requiresProductionSecurity(env)).toBe(productionLike);
      expect(isExplicitLocalDevelopmentProfile(env)).toBe(
        NODE_ENV === 'development' && APP_ENV === 'local',
      );
      expect(isExplicitLocalTestProfile(env)).toBe(
        NODE_ENV === 'test' && APP_ENV === 'local',
      );
      expect(isTestEmailBypassEnabled({ ...env, TEST_EMAIL_BYPASS: true })).toBe(
        NODE_ENV === 'test' && APP_ENV === 'local',
      );
      expect(
        isTestEmailBypassEnabled({ ...env, TEST_EMAIL_BYPASS: false }),
      ).toBe(false);
    },
  );

  it('keeps field-specific production combination messages stable', () => {
    expect(ENV_PROFILE_ERROR.productionAppRequiresProductionNode).toBe(
      'APP_ENV=production requires NODE_ENV=production',
    );
    expect(ENV_PROFILE_ERROR.productionNodeForbidsLocalApp).toBe(
      'NODE_ENV=production requires APP_ENV=production or APP_ENV=staging',
    );
  });
});

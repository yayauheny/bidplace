import {
  CURRENT_RULES_VERSION,
  type ServiceRules,
} from '@bidplace/contracts';

import type { ServerEnv } from './config';

const DEFAULT_RULES_TEXT = 'bidplace MVP rules ...';

export function resolveServiceRules(env: ServerEnv): ServiceRules {
  const text =
    env.SERVICE_RULES_TEXT ??
    (env.NODE_ENV === 'production'
      ? (() => {
          throw new Error('SERVICE_RULES_TEXT is required in production');
        })()
      : DEFAULT_RULES_TEXT);

  return {
    version: CURRENT_RULES_VERSION,
    owner: env.SERVICE_RULES_OWNER ?? 'bidplace',
    contact: env.SERVICE_RULES_CONTACT ?? 'support@bidplace.test',
    text,
  };
}

export const PRODUCTION_JWT_SECRET_MIN_LENGTH = 32;

export type EnvProfileInput = {
  NODE_ENV?: string;
  APP_ENV?: string;
};

export const ENV_PROFILE_ERROR = {
  productionAppRequiresProductionNode:
    'APP_ENV=production requires NODE_ENV=production',
  productionNodeForbidsLocalApp:
    'NODE_ENV=production requires APP_ENV=production or APP_ENV=staging',
  testEmailBypassForbiddenInProduction:
    'TEST_EMAIL_BYPASS cannot be enabled in production',
  testEmailBypassRequiresLocalTest:
    'TEST_EMAIL_BYPASS can only be enabled when NODE_ENV=test and APP_ENV=local',
  jwtSecretTooShortInProduction: `JWT_SECRET must be at least ${PRODUCTION_JWT_SECRET_MIN_LENGTH} characters in production`,
} as const;

export function requiresProductionSecurity(env: EnvProfileInput): boolean {
  return env.NODE_ENV === 'production' || env.APP_ENV === 'production';
}

export function isExplicitLocalDevelopmentProfile(
  env: EnvProfileInput,
): boolean {
  return env.NODE_ENV === 'development' && env.APP_ENV === 'local';
}

export function isExplicitLocalTestProfile(env: EnvProfileInput): boolean {
  return env.NODE_ENV === 'test' && env.APP_ENV === 'local';
}

export function isTestEmailBypassEnabled(
  env: EnvProfileInput & { TEST_EMAIL_BYPASS?: boolean },
): boolean {
  return isExplicitLocalTestProfile(env) && env.TEST_EMAIL_BYPASS === true;
}

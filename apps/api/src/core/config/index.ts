export {
  SERVER_ENV,
  loadServerEnv,
  parseServerEnv,
  resolveCorsOrigin,
} from './env';
export type { ServerEnv } from './env';
export { ServerEnvModule } from './server-env.module';
export {
  ENV_PROFILE_ERROR,
  PRODUCTION_JWT_SECRET_MIN_LENGTH,
  isExplicitLocalDevelopmentProfile,
  isExplicitLocalTestProfile,
  isTestEmailBypassEnabled,
  requiresProductionSecurity,
} from './env-profile';
export type { EnvProfileInput } from './env-profile';

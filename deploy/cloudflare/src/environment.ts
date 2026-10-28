export const requiredSecrets = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'OTP_HASH_SECRET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'SMTP_USERNAME',
  'SMTP_PASSWORD',
  'CLOUDFLARE_CACHE_TOKEN',
  'TURNSTILE_SECRET_KEY',
] as const;

// Worker-only. Never copied into the API container.
export const workerOnlySecrets = ['RELEASE_CONTROL'] as const;

export const workerSecrets = [
  ...requiredSecrets,
  ...workerOnlySecrets,
] as const;

export const containerVariables = [
  'NODE_ENV',
  'APP_ENV',
  'API_PORT',
  'API_URL',
  'CORS_ORIGIN',
  'TRUST_PROXY',
  'RATE_LIMIT_MAX_BUCKETS',
  'RATE_LIMIT_CLEANUP_INTERVAL_MS',
  'LOT_IMAGE_MAX_FILES',
  'LOT_IMAGE_MAX_FILE_BYTES',
  'LOT_IMAGE_MAX_TOTAL_BYTES',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_AUTH_MODE',
  'SMTP_FROM',
  'SERVICE_RULES_OWNER',
  'SERVICE_RULES_CONTACT',
  'SERVICE_RULES_TEXT',
  'PASSWORD_RESET_URL_BASE',
  'TURNSTILE_HOSTNAME',
  'TEST_EMAIL_BYPASS',
  'AUTH_MAIL_DAILY_BUDGET',
  'AUTH_MAIL_MONTHLY_BUDGET',
  'ANALYTICS_INGEST_ENABLED',
  'MEDIA_STORAGE_PROVIDER',
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_BUCKET',
  'S3_PUBLIC_BUCKET',
  'MEDIA_PUBLIC_BASE_URL',
  'CLOUDFLARE_ZONE_ID',
] as const;

export const optionalContainerSettings = [
  'ANALYTICS_WEB_ENABLED',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'TELEGRAM_CLIENT_ID',
  'TELEGRAM_CLIENT_SECRET',
  'TELEGRAM_REDIRECT_URI',
] as const;

export type RuntimeEnvironment = Partial<
  Record<(typeof optionalContainerSettings)[number], string>
> &
  Record<
    (typeof requiredSecrets)[number] | (typeof containerVariables)[number],
    string
  >;

export function containerEnvironment(
  env: RuntimeEnvironment,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const name of [...requiredSecrets, ...containerVariables]) {
    if (typeof env[name] !== 'string' || !env[name].trim()) {
      throw new Error(`Missing Container setting: ${name}`);
    }
    result[name] = env[name];
  }
  for (const name of optionalContainerSettings) {
    if (env[name]) result[name] = env[name];
  }
  return result;
}

export const requiredSecrets = [
  'DATABASE_URL',
  'JWT_SECRET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'SMTP_USERNAME',
  'SMTP_PASSWORD',
  'CLOUDFLARE_CACHE_TOKEN',
] as const;

export const containerVariables = [
  'NODE_ENV', 'APP_ENV', 'API_PORT', 'API_URL', 'CORS_ORIGIN', 'TRUST_PROXY',
  'RATE_LIMIT_MAX_BUCKETS', 'RATE_LIMIT_CLEANUP_INTERVAL_MS',
  'LOT_IMAGE_MAX_FILES', 'LOT_IMAGE_MAX_FILE_BYTES', 'LOT_IMAGE_MAX_TOTAL_BYTES',
  'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_AUTH_MODE', 'SMTP_FROM',
  'SERVICE_RULES_OWNER', 'SERVICE_RULES_CONTACT', 'SERVICE_RULES_TEXT',
  'PASSWORD_RESET_URL_BASE', 'TEST_EMAIL_BYPASS', 'ANALYTICS_INGEST_ENABLED',
  'MEDIA_STORAGE_PROVIDER', 'S3_ENDPOINT', 'S3_REGION', 'S3_BUCKET',
  'S3_PUBLIC_BUCKET', 'MEDIA_PUBLIC_BASE_URL', 'CLOUDFLARE_ZONE_ID',
] as const;

export type RuntimeEnvironment = Record<
  (typeof requiredSecrets)[number] | (typeof containerVariables)[number],
  string
>;

export function containerEnvironment(env: RuntimeEnvironment): Record<string, string> {
  const result: Record<string, string> = {};
  for (const name of [...requiredSecrets, ...containerVariables]) {
    if (typeof env[name] !== 'string' || !env[name].trim()) {
      throw new Error(`Missing Container setting: ${name}`);
    }
    result[name] = env[name];
  }
  return result;
}

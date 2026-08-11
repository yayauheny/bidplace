import { createEnvInput, parseEnv } from '@bidplace/config';
import { existsSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { z } from 'zod';

const booleanEnvSchema = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => value === 'true');

const optionalNonEmptyStringEnvSchema = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);

const serverEnvSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    APP_ENV: z.enum(['local', 'staging', 'production']).default('local'),
    DATABASE_URL: z.string().min(1),
    API_PORT: z.coerce.number().int().positive().default(3001),
    API_URL: z.string().url().optional(),
    CORS_ORIGIN: z.string().url().optional(),
    TRUST_PROXY: booleanEnvSchema,
    RATE_LIMIT_MAX_BUCKETS: z.coerce.number().int().positive().default(10_000),
    RATE_LIMIT_CLEANUP_INTERVAL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(60_000),
    LOT_IMAGE_MAX_FILES: z.coerce.number().int().positive().default(8),
    LOT_IMAGE_MAX_FILE_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(5 * 1024 * 1024),
    LOT_IMAGE_MAX_TOTAL_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(40 * 1024 * 1024),
    JWT_SECRET: z.string().min(1),
    SMTP_HOST: optionalNonEmptyStringEnvSchema,
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_SECURE: booleanEnvSchema.optional(),
    SMTP_AUTH_MODE: z.enum(['none', 'login']).optional(),
    SMTP_USERNAME: optionalNonEmptyStringEnvSchema,
    SMTP_PASSWORD: optionalNonEmptyStringEnvSchema,
    SMTP_FROM: optionalNonEmptyStringEnvSchema,
    SERVICE_RULES_OWNER: z.string().min(1).optional(),
    SERVICE_RULES_CONTACT: z.string().min(1).optional(),
    SERVICE_RULES_TEXT: z.string().min(1).optional(),
    TEST_EMAIL_FILE: z.string().min(1).optional(),
    TEST_EMAIL_BYPASS: booleanEnvSchema,
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    TELEGRAM_WEBAPP_URL: z.string().url().optional(),
  })
  .passthrough()
  .refine(
    (env) => env.LOT_IMAGE_MAX_TOTAL_BYTES >= env.LOT_IMAGE_MAX_FILE_BYTES,
    {
      message: 'LOT_IMAGE_MAX_TOTAL_BYTES must be at least LOT_IMAGE_MAX_FILE_BYTES',
      path: ['LOT_IMAGE_MAX_TOTAL_BYTES'],
    },
  )
  .superRefine((env, context) => {
    const hasUsername = env.SMTP_USERNAME !== undefined;
    const hasPassword = env.SMTP_PASSWORD !== undefined;

    if (env.SMTP_AUTH_MODE === 'login' && (!hasUsername || !hasPassword)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SMTP_AUTH_MODE'],
        message: 'SMTP_USERNAME and SMTP_PASSWORD must be configured together',
      });
    }

    if (env.SMTP_AUTH_MODE === 'none' && (hasUsername || hasPassword)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SMTP_AUTH_MODE'],
        message: 'SMTP_USERNAME and SMTP_PASSWORD require SMTP_AUTH_MODE=login',
      });
    }

    if (env.SMTP_AUTH_MODE === undefined && (hasUsername || hasPassword)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SMTP_AUTH_MODE'],
        message: 'SMTP_AUTH_MODE must be explicit when SMTP credentials are configured',
      });
    }

    if (env.NODE_ENV === 'production') {
      const requiredKeys: Array<keyof ServerEnv> = [
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_SECURE',
        'SMTP_AUTH_MODE',
        'SMTP_FROM',
        'SERVICE_RULES_OWNER',
        'SERVICE_RULES_CONTACT',
        'SERVICE_RULES_TEXT',
      ];

      for (const key of requiredKeys) {
        if (env[key] === undefined || env[key] === null) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is required in production`,
          });
        }
      }

      if (env.TEST_EMAIL_BYPASS) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['TEST_EMAIL_BYPASS'],
          message: 'TEST_EMAIL_BYPASS cannot be enabled in production',
        });
      }
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function resolveCorsOrigin(
  env: Pick<ServerEnv, 'NODE_ENV' | 'APP_ENV' | 'CORS_ORIGIN'>,
): string | undefined {
  if (env.CORS_ORIGIN) return env.CORS_ORIGIN;

  return env.NODE_ENV === 'development' && env.APP_ENV === 'local'
    ? 'http://localhost:8081'
    : undefined;
}

type ResolveServerEnvFilePathOptions = {
  moduleDir?: string;
  envOverride?: string | undefined;
  fileExists?: (filePath: string) => boolean;
};

export function resolveServerEnvFilePath(
  options: ResolveServerEnvFilePathOptions = {},
): string {
  const envOverride = options.envOverride ?? process.env.BIDPLACE_ENV_FILE;

  if (envOverride) {
    return isAbsolute(envOverride) ? envOverride : resolve(envOverride);
  }

  const fileExists = options.fileExists ?? existsSync;
  let currentDirectory = options.moduleDir ?? __dirname;
  let candidate = resolve(currentDirectory, '.env');

  while (!fileExists(candidate)) {
    const parentDirectory = dirname(currentDirectory);

    if (parentDirectory === currentDirectory) {
      return candidate;
    }

    currentDirectory = parentDirectory;
    candidate = resolve(currentDirectory, '.env');
  }

  return candidate;
}

export function loadServerEnv(env: NodeJS.ProcessEnv = process.env): ServerEnv {
  const envFilePath = resolveServerEnvFilePath();
  const envInput = createEnvInput(envFilePath, env);

  for (const key of Object.keys(envInput)) {
    if (process.env[key] === undefined) {
      process.env[key] = envInput[key];
    }
  }

  return parseEnv(serverEnvSchema, envInput);
}

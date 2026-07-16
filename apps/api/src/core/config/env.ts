import { createEnvInput, parseEnv } from '@bidplace/config';
import { existsSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { z } from 'zod';

const booleanEnvSchema = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => value === 'true');

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
  );

export type ServerEnv = z.infer<typeof serverEnvSchema>;

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

  return parseEnv(serverEnvSchema, createEnvInput(envFilePath, env));
}

import { createEnvInput, parseEnv } from '@bidplace/config';
import { resolve } from 'node:path';
import { z } from 'zod';

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
    JWT_SECRET: z.string().min(1),
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    TELEGRAM_WEBAPP_URL: z.string().url().optional(),
  })
  .passthrough();

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function loadServerEnv(env: NodeJS.ProcessEnv = process.env): ServerEnv {
  const rootEnvPath = resolve(process.cwd(), '../../.env');

  return parseEnv(serverEnvSchema, createEnvInput(rootEnvPath, env));
}

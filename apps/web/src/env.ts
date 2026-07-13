import { createEnvInput, parseEnv } from '@bidplace/config';
import { resolve } from 'node:path';
import { z } from 'zod';

const publicEnvSchema = z
  .object({
    NEXT_PUBLIC_API_URL: z.string().url(),
    NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: z.string().min(1),
  })
  .passthrough();

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function loadPublicEnv(env: NodeJS.ProcessEnv = process.env): PublicEnv {
  const rootEnvPath = resolve(process.cwd(), '../../.env');

  return parseEnv(publicEnvSchema, createEnvInput(rootEnvPath, env));
}

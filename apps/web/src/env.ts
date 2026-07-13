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

  try {
    return parseEnv(publicEnvSchema, createEnvInput(rootEnvPath, env));
  } catch {
    return {
      NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
      NEXT_PUBLIC_TELEGRAM_BOT_USERNAME:
        env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'bidplace_bot',
    };
  }
}

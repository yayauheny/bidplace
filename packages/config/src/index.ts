import { existsSync, readFileSync } from 'node:fs';
import { parseEnv as parseEnvFile } from 'node:util';

import { z } from 'zod';

export function loadEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }

  const contents = readFileSync(filePath, 'utf8');
  const parsed = parseEnvFile(
    contents.charCodeAt(0) === 0xfeff ? contents.slice(1) : contents,
  );
  const entries: Record<string, string> = {};

  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === 'string') {
      entries[key] = value;
    }
  }

  return entries;
}

export function createEnvInput(
  filePath: string,
  env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  return {
    ...loadEnvFile(filePath),
    ...env,
  };
}

export function parseEnv<T extends z.ZodTypeAny>(
  schema: T,
  env: NodeJS.ProcessEnv = process.env,
): z.output<T> {
  return schema.parse(env);
}

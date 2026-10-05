import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { containerVariables, requiredSecrets } from '../../deploy/cloudflare/src/environment.ts';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const configPath = resolve(root, 'deploy/cloudflare/wrangler.jsonc');

export function deploymentConfig(target) {
  if (!['production', 'staging'].includes(target)) throw new Error('Choose production or staging');
  return JSON.parse(readFileSync(configPath, 'utf8')).env[target];
}

export function validateConfig(config) {
  if (requiredSecrets.some((name) => Object.hasOwn(config.vars, name))) {
    throw new Error('Runtime secrets must not be stored in Wrangler vars');
  }
  const missing = containerVariables.filter((name) => !config.vars[name]?.trim());
  if (missing.length) throw new Error(`Configure Wrangler vars: ${missing.join(', ')}`);
  const secretNames = config.secrets.required;
  if (JSON.stringify(secretNames) !== JSON.stringify(requiredSecrets)) {
    throw new Error('Wrangler required secrets differ from the Container contract');
  }
  if (config.vars.S3_BUCKET === config.vars.S3_PUBLIC_BUCKET) throw new Error('Buckets must differ');
  if (config.vars.NODE_ENV !== 'production' || config.vars.TEST_EMAIL_BYPASS !== 'false') {
    throw new Error('Cloud deployment requires production security and no email bypass');
  }
  const app = new URL(config.vars.API_URL);
  if (app.protocol !== 'https:' || app.origin !== config.vars.CORS_ORIGIN ||
      app.origin !== config.vars.PASSWORD_RESET_URL_BASE ||
      app.hostname !== config.routes[0].pattern) throw new Error('Application origins must match');
  const media = new URL(config.vars.MEDIA_PUBLIC_BASE_URL);
  if (media.protocol !== 'https:' || media.hostname.endsWith('.r2.dev') ||
      media.origin === app.origin) throw new Error('Use a separate HTTPS R2 custom domain');
  if (!/^[a-f0-9]{32}$/.test(config.vars.CLOUDFLARE_ZONE_ID)) throw new Error('Invalid zone ID');
  const endpoint = new URL(config.vars.S3_ENDPOINT);
  if (endpoint.protocol !== 'https:' || !endpoint.hostname.endsWith('.r2.cloudflarestorage.com')) {
    throw new Error('Use the account R2 endpoint, including jurisdiction when applicable');
  }
  if (config.workers_dev !== false || config.preview_urls !== false ||
      config.containers.length !== 1 || config.containers[0].max_instances !== 1) {
    throw new Error('Use one private Container and disable public bypass/preview routes');
  }
}

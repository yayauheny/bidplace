import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { containerVariables, requiredSecrets, workerSecrets } from '../../deploy/cloudflare/src/environment.ts';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const configPath = resolve(root, 'deploy/cloudflare/wrangler.jsonc');

export function deploymentConfig(target) {
  if (target !== 'production') throw new Error('Choose production');
  return configureTickSchedule(JSON.parse(readFileSync(configPath, 'utf8')).env[target], process.env.TICK_CRON);
}

function validCron(cron) {
  const fields = cron.split(/\s+/);
  if (fields.length !== 5) return false;
  const bounds = [[0, 59], [0, 23], [1, 31], [1, 12], [1, 7]];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return fields.every((raw, index) => {
    const [min, max] = bounds[index];
    const names = index === 3 ? months : index === 4 ? weekdays : [];
    const field = raw.toUpperCase();
    const endpoint = (value) => {
      if (/^\d+$/.test(value)) return Number(value);
      const position = names.indexOf(value);
      return position < 0 ? NaN : position + 1;
    };
    if (index === 2 && /^(L|LW|(?:[1-9]|[12]\d|3[01])W)$/.test(field)) return true;
    const weekday = index === 4 && /^(\d+|[A-Z]{3})(?:L|#[1-5])$/.exec(field);
    if (weekday) return endpoint(weekday[1]) >= min && endpoint(weekday[1]) <= max;
    return field.split(',').every((part) => {
      const match = /^(\*|(?:\d+|[A-Z]{3})(?:-(?:\d+|[A-Z]{3}))?)(?:\/(\d+))?$/.exec(part);
      if (!match) return false;
      if (match[2] !== undefined && (+match[2] < 1 || +match[2] > max - min + 1)) return false;
      if (match[1] === '*') return true;
      const [start, end = start] = match[1].split('-').map(endpoint);
      return start >= min && end <= max && start <= end;
    });
  });
}

export function configureTickSchedule(config, value) {
  const cron = value?.trim() ?? '';
  if (cron && !validCron(cron)) throw new Error('Invalid TICK_CRON');
  config.vars.TICK_CRON = cron;
  delete config.triggers;
  if (cron) config.triggers = { crons: [cron] };
  return config;
}

export function turnstileSiteKeyForBuild(callerValue, configuredValue) {
  const caller = typeof callerValue === 'string' ? callerValue.trim() : '';
  const configured = typeof configuredValue === 'string' ? configuredValue.trim() : '';
  const value = caller || configured;
  if (!value) throw new Error('TURNSTILE_SITE_KEY is required for the Cloudflare web build');
  return value;
}

export function validateConfig(config) {
  if (workerSecrets.some((name) => Object.hasOwn(config.vars, name))) {
    throw new Error('Runtime secrets must not be stored in Wrangler vars');
  }
  const missing = containerVariables.filter((name) => !config.vars[name]?.trim());
  if (missing.length) throw new Error(`Configure Wrangler vars: ${missing.join(', ')}`);
  const secretNames = config.secrets.required;
  if (JSON.stringify(secretNames) !== JSON.stringify(workerSecrets)) {
    throw new Error('Wrangler required secrets differ from the Worker contract');
  }
  if (requiredSecrets.some((name) => !secretNames.includes(name))) {
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

import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { deploymentConfig, root } from './config.mjs';

const target = process.argv[2];
const config = deploymentConfig(target);
const secretCanary = 'bidplace-build-isolation-canary';
const result = spawnSync('pnpm', ['--filter', '@bidplace/mobile', 'build:web', '--clear'], {
  cwd: root, stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production', EXPO_NO_DOTENV: '1',
    EXPO_PUBLIC_API_URL: config.vars.API_URL, EXPO_PUBLIC_APP_ENV: target,
    EXPO_PUBLIC_ANALYTICS_ENABLED: config.vars.ANALYTICS_INGEST_ENABLED,
    JWT_SECRET: secretCanary, DATABASE_URL: secretCanary,
    S3_SECRET_ACCESS_KEY: secretCanary, SMTP_PASSWORD: secretCanary,
    CLOUDFLARE_CACHE_TOKEN: secretCanary },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
const dist = join(root, 'apps/mobile/dist');
if (!readFileSync(join(dist, 'index.html'), 'utf8').includes('<html')) throw new Error('Missing SPA entry');
if (readdirSync(dist).includes('server')) throw new Error('Server export cannot use Static Assets');
let matchingOrigin = false;
function verifyAssets(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { verifyAssets(path); continue; }
    if (!/\.(js|html|json|map)$/.test(entry.name)) continue;
    const contents = readFileSync(path, 'utf8');
    if (contents.includes(secretCanary)) throw new Error('Non-public build setting leaked into assets');
    if (contents.includes(config.vars.API_URL)) matchingOrigin = true;
    const otherOrigin = deploymentConfig(target === 'staging' ? 'production' : 'staging').vars.API_URL;
    if (contents.includes(otherOrigin)) throw new Error('Static assets contain the other environment API origin');
  }
}
verifyAssets(dist);
if (!matchingOrigin) throw new Error('Static assets do not contain the configured application origin');
console.log(`Verified Expo SPA export for ${config.vars.API_URL}`);

import { execFileSync } from 'node:child_process';
import { configPath, deploymentConfig, root, validateConfig } from './config.mjs';

const target = process.argv[2];
const config = deploymentConfig(target);
validateConfig(config);
if (target === 'production') {
  const branch = process.env.WORKERS_CI_BRANCH ??
    execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim();
  if (branch !== 'feature/portfolio-mvp-release') throw new Error('Production deploy requires the release branch');
  const status = execFileSync('git', ['-c', 'core.fsmonitor=false', 'status', '--porcelain'], { cwd: root, encoding: 'utf8' });
  if (status.trim()) throw new Error('Production deploy requires a clean release checkout');
}
// Secrets are validated by Wrangler before activation; no values enter this script.
execFileSync('pnpm', ['cloudflare:check'], { cwd: root, stdio: 'inherit' });
execFileSync('node', ['scripts/cloudflare/build-web.mjs', target], { cwd: root, stdio: 'inherit' });
execFileSync('pnpm', ['cloudflare:image:verify'], { cwd: root, stdio: 'inherit' });
execFileSync('pnpm', ['exec', 'wrangler', 'deploy', '--config', configPath, '--env', target], {
  cwd: root, stdio: 'inherit',
  env: { ...process.env, CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: 'false' },
});

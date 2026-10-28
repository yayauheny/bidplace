import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let failed = false;

function result(label, ok) {
  console.log(`${ok ? '✓' : '✗'} ${label}`);
  failed ||= !ok;
}

function version(command, args, label, matches = () => true) {
  try {
    const value = execFileSync(command, args, {
      cwd: root,
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5_000,
      encoding: 'utf8',
    }).trim();
    result(`${label}: ${value}`, matches(value));
  } catch (error) {
    if (error instanceof Error) {
      result(`${label}: unavailable`, false);
    } else {
      throw error;
    }
  }
}

result(
  `Node 22: ${process.versions.node}`,
  process.versions.node.startsWith('22.'),
);
version('pnpm', ['--version'], 'pnpm 11.7.0', (value) => value === '11.7.0');
version('docker', ['--version'], 'Docker CLI');
version('docker', ['compose', 'version', '--short'], 'Docker Compose');

const hasFile = existsSync(resolve(root, '.env'));
const hasRuntimeKeys = ['DATABASE_URL', 'JWT_SECRET'].every((key) =>
  Object.hasOwn(process.env, key),
);
result(
  'Local env file exists or DATABASE_URL/JWT_SECRET keys are supplied',
  hasFile || hasRuntimeKeys,
);
console.log(
  'Env contents are not read. API validates required values at startup.',
);
process.exitCode = failed ? 1 : 0;

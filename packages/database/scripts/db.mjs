import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const command = process.argv[2];

if (!command) {
  console.error('Usage: pnpm --filter @bidplace/database db <generate|migrate|seed|build|typecheck|clean>');
  process.exit(1);
}

function runNode(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: packageRoot,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runTsc(args) {
  const result = spawnSync('pnpm', ['exec', 'tsc', ...args], {
    cwd: packageRoot,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runPrisma(args) {
  const prismaBin = require.resolve('prisma/build/index.js');
  const envFile = resolve(packageRoot, '../../.env');

  const result = spawnSync(process.execPath, ['--env-file', envFile, prismaBin, ...args], {
    cwd: packageRoot,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

switch (command) {
  case 'generate':
    runPrisma(['generate', '--schema=prisma/schema.prisma']);
    break;
  case 'migrate':
    runPrisma(['migrate', 'deploy', '--schema=prisma/schema.prisma']);
    break;
  case 'seed':
    runNode(['--env-file', resolve(packageRoot, '../../.env'), resolve(packageRoot, 'prisma/seed.js')]);
    break;
  case 'build':
    runPrisma(['generate', '--schema=prisma/schema.prisma']);
    runTsc(['-p', 'tsconfig.json']);
    break;
  case 'typecheck':
    runTsc(['-p', 'tsconfig.json', '--noEmit']);
    break;
  case 'clean':
    if (existsSync(resolve(packageRoot, 'dist'))) {
      rmSync(resolve(packageRoot, 'dist'), { recursive: true, force: true });
    }
    break;
  default:
    console.error(`Unknown db command: ${command}`);
    process.exit(1);
}

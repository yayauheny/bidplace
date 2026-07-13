import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const tsconfigPath = resolve(scriptDir, '..', 'tsconfig.json');
const rootEnvPath = resolve(scriptDir, '..', '..', '.env');

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const contents = readFileSync(filePath, 'utf8');
  const entries = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const unquotedValue = rawValue
      .replace(/^"(.*)"$/, '$1')
      .replace(/^'(.*)'$/, '$1');

    if (key) {
      entries[key] = unquotedValue;
    }
  }

  return entries;
}

async function run(command, args) {
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: {
        ...loadEnvFile(rootEnvPath),
        ...process.env,
      },
    });

    child.on('error', rejectPromise);
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 'null'}`));
    });
  });
}

const originalTsconfig = await readFile(tsconfigPath, 'utf8');

try {
  const tsconfig = JSON.parse(originalTsconfig);

  if (tsconfig.compilerOptions?.jsx !== 'preserve') {
    tsconfig.compilerOptions = {
      ...tsconfig.compilerOptions,
      jsx: 'preserve',
    };

    await writeFile(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`);
  }

  await run('pnpm', ['exec', 'tamagui', 'build', '--target', 'web', './app', './src', '--', 'next', 'build']);
} finally {
  await writeFile(tsconfigPath, originalTsconfig);
}

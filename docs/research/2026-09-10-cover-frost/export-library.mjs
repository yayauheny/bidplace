import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const mobile = resolve(root, 'apps/mobile');
const manifest = resolve(mobile, 'package.json');
const original = await readFile(manifest, 'utf8');
const temporary = resolve(mobile, '.frost-library-probe');
await mkdir(temporary);
try {
  await cp(
    process.env.FROST_VENDOR ||
      '/private/tmp/cover-frost-vendor/package/dist/main.js',
    resolve(temporary, 'vendor.js'),
  );
  await writeFile(
    resolve(temporary, 'entry.tsx'),
    `import React from 'react';
import { registerRootComponent } from 'expo';
import { LinearBlur } from './vendor';
function Probe() { return <div style={{ position: 'relative', width: 264, height: 352 }}>{[4,6,8].map(steps => <LinearBlur key={steps} steps={steps} strength={60} side="bottom" aria-hidden="true" style={{ position:'absolute', inset:0, pointerEvents:'none' }} />)}</div>; }
registerRootComponent(Probe);
`,
  );
  await writeFile(
    manifest,
    JSON.stringify(
      { ...JSON.parse(original), main: './.frost-library-probe/entry.tsx' },
      null,
      2,
    ),
  );
  const result = spawnSync(
    resolve(mobile, 'node_modules/.bin/expo'),
    [
      'export',
      '--platform',
      'web',
      '--output-dir',
      '/private/tmp/cover-frost-library-export',
    ],
    {
      cwd: mobile,
      env: { ...process.env, EXPO_NO_DOTENV: '1', CI: '1' },
      stdio: 'inherit',
    },
  );
  if (result.status !== 0)
    throw new Error(`Expo library export failed: ${result.status}`);
} finally {
  await writeFile(manifest, original);
  await rm(temporary, { recursive: true, force: true });
}

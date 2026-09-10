import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, '../../..');
const require = createRequire(
  resolve(root, 'node_modules/.pnpm/node_modules/research.cjs'),
);
const { build } = require('esbuild');
const sharp = require('sharp');
const output = process.env.FROST_OUTPUT || '/private/tmp/cover-frost-results';
const results = JSON.parse(await readFile(resolve(output, 'results.json')));
const sizes = {};
for (const [name, entry] of Object.entries({
  local: resolve(directory, 'ProgressiveBackdropBlur.web.tsx'),
  library:
    process.env.FROST_VENDOR ||
    '/private/tmp/cover-frost-vendor/package/dist/main.js',
})) {
  const code =
    name === 'local'
      ? `export { ProgressiveBackdropBlurWeb } from ${JSON.stringify(entry)};`
      : `export { LinearBlur } from ${JSON.stringify(entry)};`;
  const result = await build({
    stdin: { contents: code, resolveDir: root, loader: 'tsx' },
    bundle: true,
    minify: true,
    write: false,
    format: 'esm',
    external: [
      'react',
      'react/*',
      '../../../apps/mobile/src/components/figma/cover-frost-style',
    ],
    alias: {
      '@bidplace/design-tokens': resolve(
        root,
        'packages/design-tokens/dist/index.js',
      ),
    },
  });
  sizes[name] = {
    minified: result.outputFiles[0].contents.length,
    gzip: gzipSync(result.outputFiles[0].contents).length,
  };
}
const clipping = {};
for (const [browser, record] of Object.entries(results.browsers)) {
  const baseline = await sharp(resolve(output, `${browser}-A-contrast-390.png`))
    .removeAlpha()
    .raw()
    .toBuffer();
  for (const variant of Object.keys(record.variants)) {
    const pixels = await sharp(
      resolve(output, `${browser}-${variant}-contrast-390.png`),
    )
      .removeAlpha()
      .raw()
      .toBuffer();
    let outerChanged = 0,
      frostCornerChanged = 0;
    for (let y = 0; y < 844; y++)
      for (let x = 0; x < 390; x++) {
        const px = x - 63,
          py = y - 24;
        const outsideBox = px < 0 || px >= 264 || py < 0 || py >= 352;
        const cornerX = px < 24 ? 24 : px >= 240 ? 240 : px;
        const cornerY = py < 24 ? 24 : py >= 328 ? 328 : py;
        const outsideRoundedCard =
          outsideBox || (px - cornerX) ** 2 + (py - cornerY) ** 2 > 26 ** 2;
        // Ignore antialias boundary pixels; only check well outside the frost arc.
        const fy = py - (352 - 78);
        const fx = px < 12 ? 12 : px > 252 ? 252 : px;
        const outsideFrostCorner =
          px >= 0 &&
          px < 264 &&
          fy >= 0 &&
          fy < 12 &&
          (px - fx) ** 2 + (fy - 12) ** 2 > 14 ** 2;
        const p = (y * 390 + x) * 3;
        const changed = [0, 1, 2].some(
          (c) => pixels[p + c] !== baseline[p + c],
        );
        if (changed && outsideRoundedCard) outerChanged++;
        if (changed && outsideFrostCorner) frostCornerChanged++;
      }
    clipping[`${browser}-${variant}`] = { outerChanged, frostCornerChanged };
  }
}
await writeFile(
  resolve(output, 'analysis.json'),
  JSON.stringify({ sizes, clipping }, null, 2),
);
console.log(JSON.stringify({ sizes, clipping }, null, 2));

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { defineConfig, type Plugin } from 'vitest/config';

const rnPrimitivesDomStub = fileURLToPath(new URL('./vitest/rn-primitives-dom.ts', import.meta.url));
const rnPrimitivesPortalStub = fileURLToPath(
  new URL('./vitest/rn-primitives-portal.ts', import.meta.url),
);

function loadEsbuild() {
  const require = createRequire(process.argv[1] ?? import.meta.url);
  const vitePkg = require.resolve('vite/package.json');
  return createRequire(vitePkg)('esbuild') as typeof import('esbuild');
}

function rnPrimitivesForVitest(): Plugin {
  return {
    name: 'rn-primitives-for-vitest',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source === '@rn-primitives/portal') return rnPrimitivesPortalStub;
      if (source !== 'react-native' || !importer?.includes('@rn-primitives')) return null;
      return rnPrimitivesDomStub;
    },
    transform(code, id) {
      const file = id.split('?')[0] ?? id;
      if (!/@rn-primitives\/(dialog|hooks|slot|portal)\//.test(file) || !file.endsWith('.mjs')) {
        return null;
      }
      const source = code.includes('<') ? code : readFileSync(file, 'utf8');
      if (!source.includes('<')) return null;
      const transformed = loadEsbuild().transformSync(source, {
        loader: 'jsx',
        jsx: 'automatic',
        format: 'esm',
        sourcefile: file,
      });
      return { code: transformed.code, map: transformed.map };
    },
  };
}

export default defineConfig({
  plugins: [rnPrimitivesForVitest()],
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    server: {
      deps: {
        inline: [/@rn-primitives\//],
      },
    },
  },
});

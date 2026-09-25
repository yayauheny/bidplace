import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '../../..');

test('Verify retains general pull request coverage and release branch pushes', async () => {
  const workflow = await readFile(
    resolve(root, '.github/workflows/verify.yml'),
    'utf8',
  );
  assert.match(workflow, /pull_request:\s*\n\s*\nconcurrency:/);
  assert.match(workflow, /- feature\/portfolio-mvp-release/);
});

test('browser workflow limits Chromium E2E to release-targeted pull requests', async () => {
  const workflow = await readFile(
    resolve(root, '.github/workflows/browser-e2e.yml'),
    'utf8',
  );
  assert.match(
    workflow,
    /pull_request:\s*\n\s*branches: \[feature\/portfolio-mvp-release\]/,
  );
  assert.match(workflow, /--project=chromium/);
});

test('manual release gate verifies before preparing a separate E2E database', async () => {
  const workflow = await readFile(
    resolve(root, '.github/workflows/portfolio-release-gate.yml'),
    'utf8',
  );
  assert.match(workflow, /POSTGRES_DB: bidplace_integration/);
  assert.match(
    workflow,
    /DATABASE_URL: postgresql:\/\/auction:auction@localhost:5432\/bidplace_integration\?schema=public/,
  );
  assert.match(
    workflow,
    /E2E_DATABASE_URL: postgresql:\/\/auction:auction@localhost:5432\/bidplace_e2e\?schema=public/,
  );
  assert.ok(
    workflow.indexOf('run: pnpm verify') < workflow.indexOf('test:e2e-fence'),
  );
  assert.match(workflow, /browser: \[chromium, webkit\]/);
});

test('all database-backed Playwright configs build before prepare', async () => {
  const configPaths = [
    'apps/mobile/playwright.config.ts',
    'apps/mobile/playwright.stabilization.config.ts',
    'apps/mobile/playwright.config.reuse.ts',
  ];
  for (const configPath of configPaths) {
    const config = await readFile(resolve(root, configPath), 'utf8');
    const buildIndex = config.indexOf(
      'corepack pnpm --filter @bidplace/api... build',
    );
    const prepareIndex = config.indexOf('node apps/mobile/e2e/prepare.mjs');
    assert.ok(
      buildIndex >= 0,
      `${configPath} must build API workspace dependencies`,
    );
    assert.ok(
      prepareIndex > buildIndex,
      `${configPath} must prepare after build`,
    );
  }
});

test('all database-backed Playwright configs build design tokens before Expo', async () => {
  const configPaths = [
    'apps/mobile/playwright.config.ts',
    'apps/mobile/playwright.stabilization.config.ts',
    'apps/mobile/playwright.config.reuse.ts',
  ];
  for (const configPath of configPaths) {
    const config = await readFile(resolve(root, configPath), 'utf8');
    const tokenBuildIndex = config.indexOf(
      'corepack pnpm --filter @bidplace/design-tokens build',
    );
    const expoIndex = config.indexOf(
      'corepack pnpm --filter @bidplace/mobile exec expo start --web',
    );
    assert.ok(tokenBuildIndex >= 0, `${configPath} must build design tokens`);
    assert.ok(
      expoIndex > tokenBuildIndex,
      `${configPath} must build tokens before Expo`,
    );
  }
});

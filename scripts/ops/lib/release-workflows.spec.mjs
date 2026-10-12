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
  // Feature pushes are checked via PR only: one change must not trigger two runs.
  assert.match(workflow, /pull_request:\s*\n\s*types: \[opened, synchronize, reopened, ready_for_review, converted_to_draft\]/);
  assert.match(workflow, /push:\s*\n\s*branches:\s*\n\s*- main\s*\n\s*- master\s*\n\s*- feature\/portfolio-mvp-release/);
  assert.doesNotMatch(workflow, /- 'fix\/\*\*'/);
  assert.doesNotMatch(workflow, /- 'feat\/\*\*'/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /Fast checks for draft PR/);
  assert.match(workflow, /Work editor regression tests for draft PR/);
  assert.match(workflow, /github\.event\.pull_request\.draft == true/);
  assert.match(workflow, /github\.event\.pull_request\.draft == false/);
  assert.match(workflow, /run: pnpm verify/);
  assert.match(workflow, /cancel-in-progress: true/);
});

test('browser workflow supports manual and ready-for-review Chromium coverage', async () => {
  const workflow = await readFile(
    resolve(root, '.github/workflows/browser-e2e.yml'),
    'utf8',
  );
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /pull_request:\\s*\\n\\s*types: \\[ready_for_review\\]/);
  assert.doesNotMatch(workflow, /push:/);
  assert.match(workflow, /--project=chromium/);
  assert.match(workflow, /shard: \[1, 2, 3, 4\]/);
  assert.match(workflow, /--shard=\$\{\{ matrix\.shard \}\}\/4/);
  assert.match(workflow, /name: chromium-e2e-shard-\$\{\{ matrix\.shard \}\}/);
  assert.match(workflow, /timeout-minutes: 30/);
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
  assert.match(workflow, /shard: \[1, 2, 3, 4\]/);
  assert.match(workflow, /needs: verify/);
  assert.match(workflow, /--shard=\$\{\{ matrix\.shard \}\}\/4/);
  assert.match(
    workflow,
    /name: \$\{\{ matrix\.browser \}\}-release-gate-shard-\$\{\{ matrix\.shard \}\}/,
  );
  assert.equal((workflow.match(/timeout-minutes: 30/g) ?? []).length, 2);
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

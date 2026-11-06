import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = resolve(import.meta.dirname, '../../..');

test('staging validates the approved branch and exact SHA before the isolated secret-bearing job', async () => {
  const workflow = await readFile(
    resolve(root, '.github/workflows/staging-deploy.yml'),
    'utf8',
  );
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(
    workflow,
    /pull_request:|pull_request_target:|push:|schedule:/,
  );
  const validation = workflow.slice(
    workflow.indexOf('  validate:'),
    workflow.indexOf('  deploy:'),
  );
  assert.doesNotMatch(validation, /secrets\./);
  assert.match(validation, /STAGING_DEPLOY_BRANCH/);
  assert.match(validation, /git merge-base --is-ancestor/);
  assert.match(workflow, /needs: validate/);
  assert.match(workflow, /name: staging/);
  assert.match(workflow, /ref: \$\{\{ needs\.validate\.outputs\.sha \}\}/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /--initial-staging/);
  assert.match(workflow, /inputs.operation == 'initialize'/);
  assert.doesNotMatch(
    workflow,
    /secrets\.SMTP_|environment: prod|run: pnpm verify/,
  );
});

test('Verify retains general pull request coverage and release branch pushes', async () => {
  const workflow = await readFile(
    resolve(root, '.github/workflows/verify.yml'),
    'utf8',
  );
  // Feature pushes are checked via PR only: one change must not trigger two runs.
  assert.match(workflow, /pull_request:\s*\n\s*types: \[opened, synchronize, reopened, ready_for_review, converted_to_draft\]/);
  const pushBranches = workflow.match(/ {2}push:\s*\n {4}branches:\s*\n((?: {6}- [^\n]+\n)+)/)?.[1]
    .trim().split('\n').map((line) => line.trim().slice(2));
  assert.deepEqual(pushBranches, ['main']);
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

test('manual production deploy accepts main and configures the same Workers CI branch', async () => {
  const workflow = await readFile(resolve(root, '.github/workflows/production-deploy.yml'), 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /if \[ "\$GITHUB_REF" != "refs\/heads\/main" \]/);
  assert.match(workflow, /Production deploy requires main/);
  assert.match(workflow, /WORKERS_CI_BRANCH: main/);
  assert.doesNotMatch(workflow, /portfolio-mvp-release/);
  assert.match(workflow, /for name in \("SESSION_SECRET", "OTP_HASH_SECRET", "INTERNAL_TICK_SECRET"\):\s*\n\s*if len\(os\.environ\[name\]\) < 32:/);
});

test('browser workflow remains manual-only and retains sharded Chromium coverage', async () => {
  const workflow = await readFile(
    resolve(root, '.github/workflows/browser-e2e.yml'),
    'utf8',
  );
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /pull_request:/);
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


test('staging rejects unapproved SHAs, missing approval, non-main sources and failed CI before secrets', async () => {
  const workflow = await readFile(resolve(root, '.github/workflows/staging-deploy.yml'), 'utf8');
  const block = workflow.slice(workflow.indexOf('        run: |'), workflow.indexOf('  deploy:'));
  const script = block.slice(block.indexOf('\n') + 1).split('\n').map(line => line.startsWith('          ') ? line.slice(10) : line).join('\n');
  const dir = mkdtempSync(join(tmpdir(), 'staging-validation-'));
  const bin = join(dir, 'bin'); mkdirSync(bin);
  for (const [name, content] of Object.entries({ git: '#!/bin/sh\nexit 0\n', gh: '#!/bin/sh\ncase "$*" in *jobs*) printf "%s" "$FIXTURE_CI" ;; *) printf "%s" "${FIXTURE_RUN_ID:-123}" ;; esac\n' })) {
    writeFileSync(join(bin, name), content); chmodSync(join(bin, name), 0o755);
  }
  try {
    const valid = { PATH: bin + ':' + process.env.PATH, GITHUB_REF: 'refs/heads/main', GITHUB_REPOSITORY: 'fixture/repo', GITHUB_OUTPUT: join(dir, 'output'), STAGING_OPERATION: 'deploy', CANDIDATE_REF: 'feature/staging-refresh', APPROVED_REF: 'feature/staging-refresh', CANDIDATE_SHA: 'a'.repeat(40), APPROVED_SHA: 'a'.repeat(40), FIXTURE_CI: 'success' };
    for (const overrides of [{}, { APPROVED_SHA: '' }, { CANDIDATE_SHA: 'b'.repeat(40) }, { GITHUB_REF: 'refs/heads/feature/portfolio-mvp-release' }, { APPROVED_REF: '' }, { FIXTURE_CI: 'failure' }, { FIXTURE_RUN_ID: 'null' }, { CANDIDATE_SHA: 'main; exit 0' }]) {
      const result = spawnSync('/bin/bash', ['-c', script], { env: { ...valid, ...overrides }, encoding: 'utf8' });
      assert.equal(result.status === 0, Object.keys(overrides).length === 0, JSON.stringify(overrides) + result.stderr);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

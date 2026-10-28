import assert from 'node:assert/strict';
import test from 'node:test';

import { stagingApiPaths, stagingWebPaths } from './staging-smoke-routes.mjs';

test('staging smoke covers portfolio public reads and SPA deep links', () => {
  assert.deepEqual(stagingApiPaths, [
    '/api/health',
    '/api/health/ready',
    '/api/portfolio/home',
    '/api/works',
    '/api/authors',
  ]);
  assert.deepEqual(stagingWebPaths, [
    '/',
    '/login',
    '/works',
    '/authors',
    '/profile',
    '/cabinet',
  ]);
});

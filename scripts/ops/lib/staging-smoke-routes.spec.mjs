import assert from 'node:assert/strict';
import test from 'node:test';

import { stagingApiPaths, stagingWebPaths } from './staging-smoke-routes.mjs';
import { runStagingSmoke, stagingSmokeSettings, StagingApiPendingError } from '../staging-smoke.mjs';

function smokeSettings(overrides = {}) {
  return stagingSmokeSettings({
    STAGING_API_URL: 'https://staging.bid.place',
    STAGING_WEB_URL: 'https://staging.bid.place',
    STAGING_EXPECTED_SHA: 'a'.repeat(40),
    CF_ACCESS_CLIENT_ID: 'fixture-access-id',
    CF_ACCESS_CLIENT_SECRET: 'fixture-access-value',
    ...overrides,
  });
}

function responses(overrides = {}) {
  const calls = [];
  return {
    calls,
    fetcher: async (url, options) => {
      assert.equal(new URL(url).origin, 'https://staging.bid.place');
      assert.equal(options.redirect, 'manual');
      const path = new URL(url).pathname;
      calls.push(path);
      if (!options.headers)
        return new Response('', {
          status: 302,
          headers: { location: 'https://fixture.cloudflareaccess.com/login' },
        });
      assert.equal(
        options.headers['CF-Access-Client-Secret'],
        'fixture-access-value',
      );
      if (overrides[path]) return overrides[path]();
      if (path === '/_release/version')
        return Response.json({ releaseId: 'a'.repeat(40) });
      if (path.startsWith('/api/health'))
        return Response.json({
          status: 'ok',
          database: 'ok',
          releaseId: 'a'.repeat(40),
        });
      if (path === '/api/portfolio/home')
        return Response.json({
          newWorks: [],
          newAuthors: [],
          curatorSelection: null,
        });
      if (path === '/api/works')
        return Response.json({ works: [], pagination: { page: 1 } });
      if (path === '/api/authors')
        return Response.json({ authors: [], pagination: { page: 1 } });
      return new Response(
        '<html><script src="/_expo/static/web.js"></script></html>',
        { headers: { 'content-type': 'text/html' } },
      );
    },
  };
}

test('authenticated smoke verifies Worker and API identity, portfolio JSON and every SPA deep link', async () => {
  const fixture = responses();
  assert.equal(
    (await runStagingSmoke(smokeSettings(), fixture.fetcher)).releaseId,
    'a'.repeat(40),
  );
  for (const path of [...stagingApiPaths, ...stagingWebPaths])
    assert.ok(fixture.calls.includes(path));
});

test('Access redirects and HTML login responses cannot masquerade as a healthy app', async () => {
  for (const rejected of [
    {
      '/api/health': () =>
        new Response('<html>login</html>', {
          headers: { 'content-type': 'text/html' },
        }),
    },
    {
      '/login': () =>
        new Response('', {
          status: 302,
          headers: { location: 'https://fixture.cloudflareaccess.com/login' },
        }),
    },
    {
      '/login': () =>
        new Response('<html>Access login</html>', {
          headers: { 'content-type': 'text/html' },
        }),
    },
  ]) {
    await assert.rejects(
      runStagingSmoke(smokeSettings(), responses(rejected).fetcher),
      /expected authenticated JSON|expected SPA|Expo SPA/,
    );
  }
});

test('an updated Worker with a stale API image fails release acceptance', async () => {
  const fixture = responses({
    '/api/health': () =>
      Response.json({ status: 'ok', releaseId: 'b'.repeat(40) }),
  });
  await assert.rejects(
    runStagingSmoke(smokeSettings(), fixture.fetcher),
    /API is not ready on the selected SHA/,
  );
});

test('only transient API health failures are eligible for the provisioning wait', async () => {
  for (const status of [503, 403]) {
    const fixture = responses({ '/api/health': () => new Response(null, { status }) });
    await assert.rejects(runStagingSmoke(smokeSettings(), fixture.fetcher), (error) => {
      assert.equal(error instanceof StagingApiPendingError, status === 503);
      return true;
    });
  }
});

test('smoke refuses production URLs and incomplete service credentials before network access', () => {
  assert.throws(
    () => smokeSettings({ STAGING_WEB_URL: 'https://bid.place' }),
    /must use https:\/\/staging/,
  );
  assert.throws(
    () => smokeSettings({ CF_ACCESS_CLIENT_SECRET: '' }),
    /credentials are required/,
  );
  assert.throws(
    () => smokeSettings({ STAGING_EXPECTED_SHA: 'main' }),
    /40-character/,
  );
});

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

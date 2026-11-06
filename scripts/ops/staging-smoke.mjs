import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  stagingApiPaths,
  stagingWebPaths,
} from './lib/staging-smoke-routes.mjs';
import { assertStagingAccess } from '../cloudflare/staging.mjs';

export class StagingApiPendingError extends Error {}

export function stagingSmokeSettings(env) {
  const urls = ['STAGING_API_URL', 'STAGING_WEB_URL'].map((name) => {
    let url;
    try {
      url = new URL(env[name]);
    } catch {
      throw new Error(`${name} must be an absolute staging URL`);
    }
    if (
      url.origin !== 'https://staging.bid.place' ||
      url.username ||
      url.password
    ) {
      throw new Error(`${name} must use https://staging.bid.place`);
    }
    return url;
  });
  if (
    !env.CF_ACCESS_CLIENT_ID?.trim() ||
    !env.CF_ACCESS_CLIENT_SECRET?.trim()
  ) {
    throw new Error('Cloudflare Access service credentials are required');
  }
  if (!/^[0-9a-f]{40}$/.test(env.STAGING_EXPECTED_SHA ?? '')) {
    throw new Error(
      'STAGING_EXPECTED_SHA must be the accepted 40-character commit SHA',
    );
  }
  return {
    apiBaseUrl: urls[0],
    webBaseUrl: urls[1],
    expectedSha: env.STAGING_EXPECTED_SHA,
    headers: {
      'CF-Access-Client-Id': env.CF_ACCESS_CLIENT_ID,
      'CF-Access-Client-Secret': env.CF_ACCESS_CLIENT_SECRET,
    },
  };
}

export async function runStagingSmoke(settings, fetcher = fetch) {
  async function request(base, path) {
    return fetcher(new URL(path, base), {
      redirect: 'manual',
      headers: settings.headers,
      signal: AbortSignal.timeout(30_000),
    });
  }
  await assertStagingAccess(fetcher);
  async function json(path, base = settings.apiBaseUrl) {
    const response = await request(base, path);
    if (
      path.startsWith('/api/health') &&
      [500, 502, 503, 504].includes(response.status)
    ) {
      throw new StagingApiPendingError(
        'Staging API is not ready on the selected SHA',
      );
    }
    if (
      response.status !== 200 ||
      !response.headers.get('content-type')?.includes('application/json')
    ) {
      throw new Error(
        `${path} did not return the expected authenticated JSON (HTTP ${response.status})`,
      );
    }
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(`${path} did not return valid JSON`);
    }
    if (!data || typeof data !== 'object' || Array.isArray(data))
      throw new Error(`${path} returned an invalid response`);
    return data;
  }
  const version = await json('/_release/version', settings.webBaseUrl);
  if (version.releaseId !== settings.expectedSha)
    throw new Error('Staging Worker does not match the selected SHA');
  for (const path of stagingApiPaths) {
    const data = await json(path);
    if (path.startsWith('/api/health')) {
      if (
        data.status !== 'ok' ||
        data.releaseId !== settings.expectedSha ||
        (path.endsWith('/ready') && data.database !== 'ok')
      ) {
        throw new StagingApiPendingError(
          'Staging API is not ready on the selected SHA',
        );
      }
    } else if (path === '/api/portfolio/home') {
      if (!Array.isArray(data.newWorks) || !Array.isArray(data.newAuthors))
        throw new Error('Portfolio home response is invalid');
    } else if (
      !Array.isArray(data[path === '/api/works' ? 'works' : 'authors']) ||
      !data.pagination
    ) {
      throw new Error(`${path} returned an invalid public list`);
    }
  }
  for (const path of stagingWebPaths) {
    const response = await request(settings.webBaseUrl, path);
    if (
      response.status !== 200 ||
      !response.headers.get('content-type')?.includes('text/html')
    ) {
      throw new Error(
        `${path} did not return the expected SPA (HTTP ${response.status})`,
      );
    }
    const html = await response.text();
    if (!html.includes('<html') || !html.includes('/_expo/'))
      throw new Error(`${path} did not return the Expo SPA`);
  }
  return {
    status: 'ok',
    releaseId: settings.expectedSha,
    apiPaths: stagingApiPaths,
    webPaths: stagingWebPaths,
  };
}

async function main() {
  const settings = stagingSmokeSettings(process.env);
  // Cloudflare can provision the first Container for several minutes after deploy.
  const deadline = Date.now() + 300_000;
  for (;;) {
    try {
      console.log(JSON.stringify(await runStagingSmoke(settings), null, 2));
      return;
    } catch (error) {
      if (!(error instanceof StagingApiPendingError) || Date.now() >= deadline)
        throw error;
      await new Promise((resolveWait) => setTimeout(resolveWait, 5_000));
    }
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(
      error instanceof Error
        ? `Staging smoke failed: ${error.message}`
        : 'Staging smoke failed',
    );
    process.exitCode = 1;
  });
}

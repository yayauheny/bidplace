const apiBaseUrl = requiredUrl('STAGING_API_URL');
const webBaseUrl = requiredUrl('STAGING_WEB_URL');
const apiPaths = [
  '/api/health',
  '/api/health/ready',
  '/api/works',
  '/api/authors',
];
const webPaths = ['/', '/login', '/works', '/authors', '/profile', '/cabinet'];

function requiredUrl(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} is required.`);
    process.exit(1);
  }
  try {
    return new URL(value);
  } catch {
    console.error(`${name} must be an absolute URL.`);
    process.exit(1);
  }
}

async function requireSuccess(baseUrl, path) {
  const url = new URL(path, baseUrl);
  const response = await fetch(url, { redirect: 'manual' });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
}

async function main() {
  for (const path of apiPaths) await requireSuccess(apiBaseUrl, path);
  for (const path of webPaths) {
    const url = new URL(path, webBaseUrl);
    const response = await fetch(url, { redirect: 'manual' });
    if (response.status === 404) throw new Error(`${url} returned 404`);
    if (response.status >= 500)
      throw new Error(`${url} returned ${response.status}`);
  }
  console.log(JSON.stringify({ status: 'ok', apiPaths, webPaths }, null, 2));
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? `Staging smoke failed: ${error.message}`
      : 'Staging smoke failed',
  );
  process.exitCode = 1;
});

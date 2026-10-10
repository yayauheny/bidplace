import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { startAuthCookieProxy } from './auth-cookie-proxy.mjs';

const proxyFile = fileURLToPath(new URL('./auth-cookie-proxy.mjs', import.meta.url));
const secretBody = JSON.stringify({
  password: 'secret-password',
  code: '123456',
  turnstileToken: 'pass:login:localhost:00000000-0000-4000-8000-000000000000',
});
const STATUS_KEYS = ['abandoned', 'hasSetCookie', 'held', 'method', 'path', 'pending', 'succeeded'];

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected a TCP port');
  return address.port;
}

function textOf(response) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    response.on('data', (chunk) => chunks.push(chunk));
    response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    response.on('error', reject);
  });
}

test('held auth write keeps real headers off the control channel and the wire until release', async () => {
  const upstream = http.createServer((request, response) => {
    response.writeHead(201, {
      'content-type': 'application/json',
      'set-cookie': 'bidplace_session=secret-session; HttpOnly; Path=/',
    });
    response.end('{"ok":true}');
  });
  const upstreamPort = await listen(upstream);
  const proxy = await startAuthCookieProxy({
    upstream: `http://127.0.0.1:${upstreamPort}`,
    listenPort: 0,
    controlPort: 0,
  });
  const dataPort = proxyAddress(proxy, 'data');
  const controlPort = proxyAddress(proxy, 'control');
  try {
    const armed = await fetch(`http://127.0.0.1:${controlPort}/arm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'POST', path: '/api/auth/login' }),
    });
    assert.equal(armed.status, 204);

    const pending = requestLogin(dataPort);
    await waitHeld(controlPort);
    const status = await fetch(`http://127.0.0.1:${controlPort}/status`);
    const statusText = await status.text();
    assert.equal(statusText.includes('secret-password'), false);
    assert.equal(statusText.includes('secret-session'), false);
    assert.equal(statusText.includes('123456'), false);
    assert.equal(statusText.includes('pass:login'), false);
    const heldStatus = JSON.parse(statusText);
    assert.deepEqual(Object.keys(heldStatus).sort(), STATUS_KEYS);
    assert.equal(heldStatus.abandoned, false);
    assert.equal(heldStatus.succeeded, true);
    assert.equal(heldStatus.hasSetCookie, true);

    let settled = false;
    pending.then(() => {
      settled = true;
    });
    await delay(50);
    assert.equal(settled, false);

    const released = await fetch(`http://127.0.0.1:${controlPort}/release`, { method: 'POST' });
    assert.equal(released.status, 204);
    const result = await pending;
    assert.equal(result.status, 201);
    assert.match(result.cookie, /bidplace_session=secret-session/);
    assert.equal(result.body, '{"ok":true}');
  } finally {
    await proxy.close();
    upstream.closeAllConnections();
    upstream.close();
  }
});

test('releasing an aborted auth write does not attach its cookie to the next request', async () => {
  const upstream = http.createServer((request, response) => {
    if (request.url === '/api/auth/logout') {
      response.writeHead(204, { 'set-cookie': 'bidplace_session=; Max-Age=0; Path=/' });
      response.end();
      return;
    }
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end('{"user":"b"}');
  });
  const upstreamPort = await listen(upstream);
  const proxy = await startAuthCookieProxy({
    upstream: `http://127.0.0.1:${upstreamPort}`,
    listenPort: 0,
    controlPort: 0,
  });
  const dataPort = proxyAddress(proxy, 'data');
  const controlPort = proxyAddress(proxy, 'control');
  try {
    const armed = await fetch(`http://127.0.0.1:${controlPort}/arm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'POST', path: '/api/auth/logout' }),
    });
    assert.equal(armed.status, 204);
    const logout = http.request({
      hostname: '127.0.0.1',
      port: dataPort,
      path: '/api/auth/logout',
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(secretBody) },
    });
    logout.on('error', () => undefined);
    logout.end(secretBody);
    await waitHeld(controlPort);
    const heldStatus = await (await fetch(`http://127.0.0.1:${controlPort}/status`)).json();
    assert.equal(heldStatus.succeeded, true);
    assert.equal(heldStatus.hasSetCookie, true);
    logout.destroy();
    await waitAbandoned(controlPort);
    const released = await fetch(`http://127.0.0.1:${controlPort}/release`, { method: 'POST' });
    assert.equal(released.status, 204);
    const next = await fetch(`http://127.0.0.1:${dataPort}/api/auth/me`);
    assert.equal(next.status, 200);
    assert.equal(next.headers.get('set-cookie'), null);
    assert.equal(await next.text(), '{"user":"b"}');
  } finally {
    await proxy.close();
    upstream.closeAllConnections();
    upstream.close();
  }
});

test('reset drops a held auth write and does not release it later', async () => {
  const upstream = http.createServer((request, response) => {
    response.writeHead(201, {
      'content-type': 'application/json',
      'set-cookie': 'bidplace_session=secret-session; HttpOnly; Path=/',
    });
    response.end('{"ok":true}');
  });
  const upstreamPort = await listen(upstream);
  const proxy = await startAuthCookieProxy({
    upstream: `http://127.0.0.1:${upstreamPort}`,
    listenPort: 0,
    controlPort: 0,
  });
  const dataPort = proxyAddress(proxy, 'data');
  const controlPort = proxyAddress(proxy, 'control');
  try {
    const armed = await fetch(`http://127.0.0.1:${controlPort}/arm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'POST', path: '/api/auth/login' }),
    });
    assert.equal(armed.status, 204);
    const pending = requestLogin(dataPort).then(
      () => 'settled',
      () => 'aborted',
    );
    await waitHeld(controlPort);
    const heldStatus = await (await fetch(`http://127.0.0.1:${controlPort}/status`)).json();
    assert.equal(heldStatus.succeeded, true);
    assert.equal(heldStatus.hasSetCookie, true);
    const reset = await fetch(`http://127.0.0.1:${controlPort}/reset`, { method: 'POST' });
    assert.equal(reset.status, 204);
    assert.equal(await pending, 'aborted');
    const status = await fetch(`http://127.0.0.1:${controlPort}/status`);
    const body = await status.json();
    assert.equal(body.held, false);
    assert.equal(body.pending, false);
    assert.equal(body.succeeded, false);
    assert.equal(body.hasSetCookie, false);
    assert.deepEqual(Object.keys(body).sort(), STATUS_KEYS);
    const released = await fetch(`http://127.0.0.1:${controlPort}/release`, { method: 'POST' });
    assert.equal(released.status, 409);
    const next = await fetch(`http://127.0.0.1:${dataPort}/api/auth/login`, { method: 'POST' });
    assert.equal(next.status, 201);
    assert.equal(next.headers.has('set-cookie'), true);
    await next.text();
  } finally {
    await proxy.close();
    upstream.closeAllConnections();
    upstream.close();
  }
});

test('held status reports success and cookie presence without the response', async () => {
  const marker = 'upstream-body-marker';
  const upstream = http.createServer((request, response) => {
    if (request.url === '/api/auth/register') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(marker);
      return;
    }
    response.writeHead(401, { 'content-type': 'application/json' });
    response.end(marker);
  });
  const upstreamPort = await listen(upstream);
  const proxy = await startAuthCookieProxy({
    upstream: `http://127.0.0.1:${upstreamPort}`,
    listenPort: 0,
    controlPort: 0,
  });
  const dataPort = proxyAddress(proxy, 'data');
  const controlPort = proxyAddress(proxy, 'control');
  try {
    const failed = await holdPath(controlPort, dataPort, '/api/auth/login');
    assert.equal(failed.succeeded, false);
    assert.equal(failed.hasSetCookie, false);
    assert.equal(failed.text.includes(marker), false);
    const reset = await fetch(`http://127.0.0.1:${controlPort}/reset`, { method: 'POST' });
    assert.equal(reset.status, 204);
    const registered = await holdPath(controlPort, dataPort, '/api/auth/register');
    assert.equal(registered.succeeded, true);
    assert.equal(registered.hasSetCookie, false);
    assert.equal(registered.text.includes(marker), false);
  } finally {
    await proxy.close();
    upstream.closeAllConnections();
    upstream.close();
  }
});

async function holdPath(controlPort, dataPort, path) {
  const armed = await fetch(`http://127.0.0.1:${controlPort}/arm`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ method: 'POST', path }),
  });
  assert.equal(armed.status, 204);
  const pending = new Promise((resolve, reject) => {
    const request = http.request({
      hostname: '127.0.0.1',
      port: dataPort,
      path,
      method: 'POST',
    }, () => resolve());
    request.on('error', reject);
    request.end();
  });
  await waitHeld(controlPort);
  const status = await fetch(`http://127.0.0.1:${controlPort}/status`);
  const text = await status.text();
  const released = await fetch(`http://127.0.0.1:${controlPort}/release`, { method: 'POST' });
  assert.equal(released.status, 204);
  await pending;
  return { ...JSON.parse(text), text };
}

test('start rejects a non-loopback upstream before listening', async () => {
  await assert.rejects(
    async () => startAuthCookieProxy({
      upstream: 'http://example.com:80',
      listenPort: 0,
      controlPort: 0,
    }),
    /loopback/,
  );
  await assert.rejects(
    async () => startAuthCookieProxy({
      upstream: 'http://127.0.0.1',
      listenPort: 0,
      controlPort: 0,
    }),
    /port/i,
  );
});

test('cli rejects a non-loopback upstream without echoing it', async () => {
  const result = await runCli({
    AUTH_COOKIE_PROXY_UPSTREAM: 'http://example.com:80',
    AUTH_COOKIE_PROXY_PORT: '9',
    AUTH_COOKIE_PROXY_CONTROL_PORT: '8',
  });
  assert.equal(result.code, 1);
  assert.equal(result.stderr.includes('example.com'), false);
  assert.match(result.stderr, /loopback/);
});

function proxyAddress(proxy, kind) {
  const server = kind === 'data' ? proxy.data : proxy.control;
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected a TCP port');
  return address.port;
}

function requestLogin(port) {
  return new Promise((resolve, reject) => {
    const request = http.request({
      hostname: '127.0.0.1',
      port,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(secretBody) },
    }, (response) => {
      textOf(response).then((body) => {
        resolve({
          status: response.statusCode,
          cookie: response.headers['set-cookie']?.join('; ') ?? '',
          body,
        });
      }, reject);
    });
    request.on('error', reject);
    request.end(secretBody);
  });
}

async function waitHeld(port) {
  const started = Date.now();
  while (Date.now() - started < 1000) {
    const response = await fetch(`http://127.0.0.1:${port}/status`);
    const body = await response.json();
    if (body.held === true) return;
    await delay(10);
  }
  throw new Error('Auth write was not held');
}

async function waitAbandoned(port) {
  const started = Date.now();
  while (Date.now() - started < 1000) {
    const response = await fetch(`http://127.0.0.1:${port}/status`);
    const body = await response.json();
    if (body.held === true && body.abandoned === true) return;
    await delay(10);
  }
  throw new Error('Held auth write was not abandoned');
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runCli(env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [proxyFile], {
      env: { PATH: process.env.PATH ?? '', ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stderr = [];
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('error', reject);
    child.on('exit', (code) => {
      resolve({ code, stderr: Buffer.concat(stderr).toString('utf8') });
    });
  });
}

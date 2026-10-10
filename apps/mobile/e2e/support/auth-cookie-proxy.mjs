import http from 'node:http';
import https from 'node:https';
import { pathToFileURL } from 'node:url';

const HOLD_PATHS = new Set(['/api/auth/login', '/api/auth/register', '/api/auth/logout']);
const MAX_BUFFER = 65_536;
const CLIENT_ABORT_CODES = new Set(['ECONNRESET', 'EPIPE', 'ERR_STREAM_DESTROYED', 'ECANCELED']);
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

function responseSucceeded(status) {
  return status >= 200 && status < 300;
}

function responseHasSetCookie(headers) {
  const value = headers?.['set-cookie'];
  if (Array.isArray(value)) return value.some((item) => item.length > 0);
  return typeof value === 'string' && value.length > 0;
}

function publicStatus(state) {
  if (state.held) {
    return {
      pending: false,
      held: true,
      abandoned: state.held.clientGone === true,
      method: state.held.method,
      path: state.held.path,
      succeeded: responseSucceeded(state.held.status),
      hasSetCookie: responseHasSetCookie(state.held.headers),
    };
  }
  if (state.armed) {
    return {
      pending: true,
      held: false,
      abandoned: false,
      method: state.armed.method,
      path: state.armed.path,
      succeeded: false,
      hasSetCookie: false,
    };
  }
  return {
    pending: false,
    held: false,
    abandoned: false,
    method: '',
    path: '',
    succeeded: false,
    hasSetCookie: false,
  };
}

function isClientAbort(error) {
  return (
    error instanceof Error
    && 'code' in error
    && typeof error.code === 'string'
    && CLIENT_ABORT_CODES.has(error.code)
  );
}

function noteAbandoned(held) {
  if (!held.response.writableEnded) held.clientGone = true;
}

function watchDownstream(clientResponse, slot) {
  const abandon = () => {
    if (clientResponse.writableEnded) return;
    slot.gone = true;
    if (slot.held?.response === clientResponse) noteAbandoned(slot.held);
  };
  clientResponse.on('close', abandon);
  clientResponse.socket?.on('close', abandon);
}

function discardOwned(state) {
  state.armed = null;
  const held = state.held;
  state.held = null;
  if (!held) return;
  held.body = Buffer.alloc(0);
  const clientResponse = held.response;
  if (!clientResponse || clientResponse.destroyed || clientResponse.writableEnded) return;
  clientResponse.destroy();
}

function releaseHeld(state) {
  const held = state.held;
  state.held = null;
  if (!held) return false;
  const body = held.body;
  held.body = Buffer.alloc(0);
  if (held.clientGone || held.response.destroyed || held.response.writableEnded) return true;
  const headers = { ...held.headers };
  delete headers['transfer-encoding'];
  delete headers.connection;
  headers['content-length'] = String(body.length);
  try {
    held.response.writeHead(held.status, headers);
    held.response.end(body);
  } catch (error) {
    if (isClientAbort(error)) return true;
    throw error;
  }
  return true;
}

function assertListenPort(port) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('Auth cookie proxy port is invalid');
  }
}

function assertLoopbackUpstream(upstream) {
  let url;
  try {
    url = new URL(upstream);
  } catch {
    throw new Error('Auth cookie proxy upstream is invalid');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Auth cookie proxy upstream must be http(s)');
  }
  if (url.username || url.password) {
    throw new Error('Auth cookie proxy upstream must not include credentials');
  }
  if (!LOOPBACK_HOSTS.has(url.hostname)) {
    throw new Error('Auth cookie proxy upstream must be loopback');
  }
  const port = Number(url.port);
  if (!url.port || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Auth cookie proxy upstream port is invalid');
  }
  return url;
}

function openUpstream(target, clientRequest) {
  const url = new URL(clientRequest.url ?? '/', 'http://127.0.0.1');
  const headers = { ...clientRequest.headers, host: target.host };
  delete headers.connection;
  delete headers['keep-alive'];
  delete headers['proxy-connection'];
  delete headers['transfer-encoding'];
  const lib = target.protocol === 'https:' ? https : http;
  const upstream = lib.request({
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port,
    method: clientRequest.method,
    path: `${url.pathname}${url.search}`,
    headers,
  });
  clientRequest.pipe(upstream);
  return { upstream, url };
}

export function startAuthCookieProxy({ upstream, listenPort, controlPort }) {
  const target = assertLoopbackUpstream(upstream);
  assertListenPort(listenPort);
  assertListenPort(controlPort);

  const state = { armed: null, held: null };

  const data = http.createServer((clientRequest, clientResponse) => {
    const slot = { held: null, gone: false };
    watchDownstream(clientResponse, slot);
    const { upstream: upstreamRequest, url } = openUpstream(target, clientRequest);
    const hold = Boolean(
      state.armed
      && clientRequest.method === state.armed.method
      && url.pathname === state.armed.path,
    );
    if (hold) state.armed = null;
    upstreamRequest.on('error', () => {
      if (!clientResponse.writableEnded) clientResponse.writeHead(502).end();
    });
    upstreamRequest.on('response', (upstreamResponse) => {
      if (!hold) {
        clientResponse.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
        upstreamResponse.pipe(clientResponse);
        return;
      }
      const chunks = [];
      let size = 0;
      let dropped = false;
      upstreamResponse.on('data', (chunk) => {
        if (dropped) return;
        size += chunk.length;
        if (size > MAX_BUFFER) {
          dropped = true;
          chunks.length = 0;
          if (!clientResponse.writableEnded) clientResponse.writeHead(502).end();
          return;
        }
        chunks.push(chunk);
      });
      upstreamResponse.on('end', () => {
        if (dropped) return;
        state.held = {
          method: clientRequest.method ?? 'POST',
          path: url.pathname,
          status: upstreamResponse.statusCode ?? 502,
          headers: upstreamResponse.headers,
          body: Buffer.concat(chunks),
          response: clientResponse,
          clientGone: slot.gone || clientResponse.destroyed,
        };
        slot.held = state.held;
      });
      upstreamResponse.on('error', () => {
        if (!clientResponse.writableEnded) clientResponse.writeHead(502).end();
      });
    });
  });

  const control = http.createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    if (request.method === 'GET' && url.pathname === '/status') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(publicStatus(state)));
      return;
    }
    if (request.method === 'POST' && url.pathname === '/release') {
      try {
        response.writeHead(releaseHeld(state) ? 204 : 409).end();
      } catch {
        if (!response.headersSent) response.writeHead(500).end();
      }
      return;
    }
    if (request.method === 'POST' && url.pathname === '/reset') {
      try {
        discardOwned(state);
        response.writeHead(204).end();
      } catch {
        if (!response.headersSent) response.writeHead(500).end();
      }
      return;
    }
    if (request.method !== 'POST' || url.pathname !== '/arm') {
      response.writeHead(404).end();
      return;
    }
    const pieces = [];
    request.on('data', (chunk) => pieces.push(chunk));
    request.on('end', () => {
      let parsed;
      try {
        parsed = JSON.parse(Buffer.concat(pieces).toString('utf8'));
      } catch {
        response.writeHead(400).end();
        return;
      }
      if (
        parsed?.method !== 'POST'
        || !HOLD_PATHS.has(parsed.path)
        || state.armed
        || state.held
      ) {
        response.writeHead(409).end();
        return;
      }
      state.armed = { method: 'POST', path: parsed.path };
      response.writeHead(204).end();
    });
  });

  return new Promise((resolve, reject) => {
    const fail = (error) => reject(error);
    control.once('error', fail);
    data.once('error', fail);
    control.listen(controlPort, '127.0.0.1', () => {
      data.listen(listenPort, '127.0.0.1', () => {
        resolve({
          data,
          control,
          close() {
            data.closeAllConnections();
            control.closeAllConnections();
            return Promise.all([
              new Promise((done) => data.close(() => done())),
              new Promise((done) => control.close(() => done())),
            ]);
          },
        });
      });
    });
  });
}

function cliPort(name) {
  const raw = process.env[name]?.trim() ?? '';
  if (!/^\d+$/.test(raw)) return null;
  const port = Number(raw);
  if (port < 1 || port > 65535) return null;
  return port;
}

const direct = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (direct) {
  const listenPort = cliPort('AUTH_COOKIE_PROXY_PORT');
  const controlPort = cliPort('AUTH_COOKIE_PROXY_CONTROL_PORT');
  const upstream = process.env.AUTH_COOKIE_PROXY_UPSTREAM?.trim();
  if (!upstream || listenPort === null || controlPort === null) {
    process.stderr.write('Auth cookie proxy requires a loopback upstream and two distinct listen ports\n');
    process.exit(1);
  }
  if (listenPort === controlPort) {
    process.stderr.write('Auth cookie proxy listen and control ports must be distinct\n');
    process.exit(1);
  }
  try {
    assertLoopbackUpstream(upstream);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : 'Auth cookie proxy upstream is invalid'}\n`);
    process.exit(1);
  }
  await startAuthCookieProxy({ upstream, listenPort, controlPort });
}

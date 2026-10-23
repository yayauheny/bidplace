import { createHash, generateKeyPairSync, randomUUID, sign } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

function validClientAuthentication(
  header: string | undefined,
  clientId: string,
): boolean {
  if (!header?.startsWith('Basic ')) return false;
  const credentials = Buffer.from(header.slice(6), 'base64')
    .toString()
    .split(':');
  return (
    credentials.length === 2 &&
    decodeURIComponent(credentials[0]!.replace(/\+/g, ' ')) === clientId &&
    decodeURIComponent(credentials[1]!.replace(/\+/g, ' ')) ===
      'synthetic-provider-secret'
  );
}

// Local protocol fixture: real discovery, token exchange, PKCE and signed ID tokens.
export async function createTestIdentityProvider() {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  const jwk = {
    ...publicKey.export({ format: 'jwk' }),
    kid: 'integration-key',
    alg: 'RS256',
    use: 'sig',
  };
  const codes = new Map<
    string,
    {
      challenge: string;
      clientId: string;
      redirectUri: string;
      claims: Record<string, unknown>;
      invalidSignature: boolean;
    }
  >();
  let issuer = '';
  const server = createServer(async (request, response) => {
    response.setHeader('Content-Type', 'application/json');
    if (request.url?.startsWith('/authorize?')) {
      const browser =
        /fixture_browser=([a-z0-9-]+)/.exec(
          request.headers.cookie ?? '',
        )?.[1] ?? randomUUID();
      const authorization = new URL(request.url, issuer);
      const google = authorization.searchParams
        .get('client_id')
        ?.startsWith('google');
      const denied = authorization.searchParams.get('test_denied') === '1';
      const callback = denied
        ? new URL(authorization.searchParams.get('redirect_uri')!)
        : authorize(authorization.href, {
            sub: `${google ? 'google' : 'telegram'}-${browser}`,
            ...(google
              ? { email: `browser-${browser}@gmail.com`, email_verified: true }
              : {}),
          });
      if (denied) {
        callback.searchParams.set(
          'state',
          authorization.searchParams.get('state')!,
        );
        callback.searchParams.set('error', 'access_denied');
      }
      response.statusCode = 302;
      response.setHeader(
        'Set-Cookie',
        `fixture_browser=${browser}; HttpOnly; SameSite=Lax; Path=/`,
      );
      response.setHeader('Location', callback.href);
      response.end();
    } else if (request.url === '/.well-known/openid-configuration') {
      response.end(
        JSON.stringify({
          issuer,
          authorization_endpoint: issuer + '/authorize',
          token_endpoint: issuer + '/token',
          jwks_uri: issuer + '/keys',
          response_types_supported: ['code'],
          subject_types_supported: ['public'],
          id_token_signing_alg_values_supported: ['RS256'],
          token_endpoint_auth_methods_supported: ['client_secret_basic'],
          code_challenge_methods_supported: ['S256'],
        }),
      );
    } else if (request.url === '/keys')
      response.end(JSON.stringify({ keys: [jwk] }));
    else if (request.url === '/token' && request.method === 'POST') {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      const body = new URLSearchParams(Buffer.concat(chunks).toString());
      const key = body.get('code') ?? '';
      const code = codes.get(key);
      codes.delete(key);
      if (
        !code ||
        body.get('redirect_uri') !== code.redirectUri ||
        !validClientAuthentication(
          request.headers.authorization,
          code.clientId,
        ) ||
        createHash('sha256')
          .update(body.get('code_verifier') ?? '')
          .digest('base64url') !== code.challenge
      ) {
        response.statusCode = 400;
        response.end(JSON.stringify({ error: 'invalid_grant' }));
        return;
      }
      const header = Buffer.from(
        JSON.stringify({ alg: 'RS256', kid: jwk.kid }),
      ).toString('base64url');
      const payload = Buffer.from(JSON.stringify(code.claims)).toString(
        'base64url',
      );
      const unsigned = header + '.' + payload;
      const signature = code.invalidSignature
        ? Buffer.alloc(256, 1)
        : sign('RSA-SHA256', Buffer.from(unsigned), privateKey);
      response.end(
        JSON.stringify({
          access_token: 'synthetic-only-access',
          token_type: 'Bearer',
          expires_in: 300,
          id_token: unsigned + '.' + signature.toString('base64url'),
        }),
      );
    } else {
      response.statusCode = 404;
      response.end('{}');
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  issuer = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  function authorize(
    url: string,
    overrides: Record<string, unknown> = {},
    invalidSignature = false,
  ): URL {
    const params = new URL(url).searchParams;
    const code = randomUUID();
    const clientId = params.get('client_id')!;
    const redirectUri = params.get('redirect_uri')!;
    const now = Math.floor(Date.now() / 1000);
    codes.set(code, {
      challenge: params.get('code_challenge')!,
      clientId,
      redirectUri,
      invalidSignature,
      claims: {
        iss: issuer,
        sub: clientId + '-subject-' + randomUUID(),
        aud: clientId,
        nonce: params.get('nonce'),
        iat: now,
        exp: now + 300,
        ...overrides,
      },
    });
    const callback = new URL(redirectUri);
    callback.searchParams.set('code', code);
    callback.searchParams.set('state', params.get('state')!);
    return callback;
  }
  return {
    issuer,
    authorize,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.closeAllConnections();
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

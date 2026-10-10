# Auth browser suite

`auth-abuse.spec.ts` is owned by `playwright.auth-abuse.config.ts`, not by `test:e2e` or `test:e2e:stabilization`. Those commands keep the disposable `bidplace_e2e` database on port 5432 and `e2e/prepare.mjs`. They do not start the cookie proxy and they do not run the auth-abuse browser file.

The dedicated config does not generate Prisma, read an env file, reset a database, or start servers. The caller creates a fresh database and starts the processes below.

## Caller-owned database

Use a loopback Postgres on a port other than 5432. The database name must be a task database (`bidplace_e2e`, `bidplace`, and the Postgres maintenance databases are rejected). The URL schema must match `auth_browser_<nonce>`.

Create that empty schema yourself. Then, as a separate step, apply the repository's additive Prisma migrations to that newly created schema only, using its own `DATABASE_URL`. This suite does not migrate. Do not apply those migrations to an existing shared database, and do not start the API against a schema that has not received them.

## Processes

1. Build the API and the mobile web bundle before starting them.
2. Start the API from a working directory that is not the repo root, with `BIDPLACE_ENV_FILE` set to a path that does not exist. The caller owns bootstrap and must keep every listen address on loopback (this README does not start servers; production `main` may bind all interfaces by default, so use a caller harness that binds `127.0.0.1` and verify health on loopback only).

   Required process environment (names only; values are caller-chosen local test data, not committed secrets):

   - `NODE_ENV=test`, `APP_ENV=local`
   - `DATABASE_URL` — task URL from [Caller-owned database](#caller-owned-database)
   - `API_PORT` — loopback port the API listens on
   - `JWT_SECRET` — synthetic local test secret (caller-supplied string; do not reuse production material)
   - `CORS_ORIGIN` — must match the Expo web origin (for example `http://127.0.0.1:<expo-port>`)
   - `TEST_EMAIL_FILE` — same absolute path you pass as `E2E_TEST_EMAIL_FILE` below (not `e2e/.email.jsonl`)
   - `TEST_EMAIL_BYPASS=false` — verification bypass must stay off for this suite (real OTP/verification flow; `true` would skip the verified gate)
   - `PASSWORD_RESET_URL_BASE` — same origin as the web app (for example the Expo loopback origin)
   - `TURNSTILE_VERIFIER=test`, `TURNSTILE_HOSTNAME=localhost`

   Starting the API does not migrate; apply additive migrations only to the fresh owned schema in the separate step above. Do not migrate existing shared local databases.
3. Start the cookie proxy with Node, binding only through the script:

```sh
AUTH_COOKIE_PROXY_UPSTREAM=http://127.0.0.1:<api-port> \
AUTH_COOKIE_PROXY_PORT=<proxy-port> \
AUTH_COOKIE_PROXY_CONTROL_PORT=<control-port> \
node apps/mobile/e2e/support/auth-cookie-proxy.mjs
```

The upstream must be loopback and must include a port. The two listen ports must be distinct. The proxy listens on `127.0.0.1`.

4. Start Expo web with `EXPO_NO_DOTENV=1`, `EXPO_PUBLIC_API_URL` pointed at the proxy origin, and `EXPO_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA` (Cloudflare's public always-pass widget test key).

## Repeat

From `apps/mobile`, with the servers already listening:

```sh
E2E_WEB_BASE_URL=http://127.0.0.1:<expo-port> \
E2E_API_BASE_URL=http://127.0.0.1:<proxy-port> \
E2E_DATABASE_URL='postgresql://<role>@127.0.0.1:<db-port>/<task-db>?schema=auth_browser_<nonce>' \
E2E_TEST_EMAIL_FILE=<absolute-mail-file> \
E2E_EVIDENCE_DIR=<absolute-evidence-dir> \
E2E_AUTH_COOKIE_PROXY_PORT=<proxy-port> \
E2E_AUTH_COOKIE_PROXY_CONTROL_PORT=<control-port> \
EXPO_NO_DOTENV=1 \
./node_modules/.bin/playwright test --config=playwright.auth-abuse.config.ts
```

`E2E_API_BASE_URL` must use the proxy listen port. The mail file must not be `e2e/.email.jsonl`. The same command is `pnpm test:e2e:auth-abuse` inside `apps/mobile`.

The proxy wire tests do not need those servers:

```sh
node --test e2e/support/auth-cookie-proxy.unit.mjs
```
